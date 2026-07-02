from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from datetime import datetime

from app.db.session import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.tracking_metrics import TrackingMetric
from app.models.feedback_loop_event import FeedbackLoopEvent
from app.models.intake_brief import IntakeBrief
from app.models.brand_brief import BrandBrief
from app.models.project import Project
from app.services.csv_validator import parse_and_validate_tracking_csv

router = APIRouter(prefix="/api/project/{project_id}/tracking", tags=["tracking"])

@router.post("/upload")
async def upload_tracking_csv(
    project_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    contents = await file.read()
    valid_rows, error_rows = parse_and_validate_tracking_csv(contents)
    
    if not valid_rows and error_rows:
        return {"status": "error", "inserted_count": 0, "errors": error_rows}
        
    # De-duplicate by date: delete existing records for those specific dates
    dates_in_csv = [row["date"] for row in valid_rows]
    await db.execute(
        delete(TrackingMetric)
        .where(TrackingMetric.project_id == project_id)
        .where(TrackingMetric.date.in_(dates_in_csv))
    )
    
    # Bulk insert
    db_metrics = []
    for row in valid_rows:
        metric = TrackingMetric(
            project_id=project_id,
            date=row["date"],
            dau=row["dau"],
            mau=row["mau"],
            retention_rate=row["retention_rate"],
            nps_score=row["nps_score"],
            csat_score=row["csat_score"],
            churn_rate=row["churn_rate"],
            revenue=row["revenue"],
            funnel_conversion_rate=row["funnel_conversion_rate"]
        )
        db_metrics.append(metric)
        db.add(metric)
        
    await db.commit()
    
    return {
        "status": "partial_success" if error_rows else "success",
        "inserted_count": len(valid_rows),
        "errors": error_rows
    }

@router.get("/dashboard")
async def get_tracking_dashboard(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch metrics ordered by date
    result = await db.execute(
        select(TrackingMetric)
        .where(TrackingMetric.project_id == project_id)
        .order_by(TrackingMetric.date.asc())
    )
    metrics = result.scalars().all()
    
    if not metrics:
        return {"metrics": [], "anomalies": []}
        
    # Convert to dicts for JSON serialization
    serialized_metrics = []
    for m in metrics:
        serialized_metrics.append({
            "id": str(m.id),
            "date": m.date.isoformat(),
            "dau": m.dau,
            "mau": m.mau,
            "retention_rate": float(m.retention_rate),
            "nps_score": float(m.nps_score),
            "csat_score": float(m.csat_score),
            "churn_rate": float(m.churn_rate),
            "revenue": float(m.revenue),
            "funnel_conversion_rate": float(m.funnel_conversion_rate)
        })
        
    # Simple Threshold-based Anomaly Detection
    anomalies = []
    if len(serialized_metrics) > 1:
        for i in range(1, len(serialized_metrics)):
            prev = serialized_metrics[i-1]
            curr = serialized_metrics[i]
            
            # Retention Drop > 5%
            if prev["retention_rate"] - curr["retention_rate"] > 5.0:
                anomalies.append({
                    "date": curr["date"],
                    "metric": "retention_rate",
                    "summary": f"Retention dropped from {prev['retention_rate']}% to {curr['retention_rate']}% on {curr['date']} — possible onboarding friction."
                })
                
            # Churn Spike > 2%
            if curr["churn_rate"] - prev["churn_rate"] > 2.0:
                anomalies.append({
                    "date": curr["date"],
                    "metric": "churn_rate",
                    "summary": f"Churn spiked from {prev['churn_rate']}% to {curr['churn_rate']}% on {curr['date']} — investigate recent product changes."
                })
                
            # DAU Drop > 10%
            if prev["dau"] > 0:
                dau_drop_pct = ((prev["dau"] - curr["dau"]) / prev["dau"]) * 100
                if dau_drop_pct > 10.0:
                    anomalies.append({
                        "date": curr["date"],
                        "metric": "dau",
                        "summary": f"Daily Active Users dropped by {dau_drop_pct:.1f}% on {curr['date']} — check for outages or seasonality."
                    })
                    
            # Funnel Conversion Drop > 5%
            if prev["funnel_conversion_rate"] - curr["funnel_conversion_rate"] > 5.0:
                anomalies.append({
                    "date": curr["date"],
                    "metric": "funnel_conversion_rate",
                    "summary": f"Funnel conversion dropped by {prev['funnel_conversion_rate'] - curr['funnel_conversion_rate']:.1f}% on {curr['date']} — analyze checkout/signup flow."
                })
                
    # Persist anomalies to feedback_loop_events
    persisted_anomalies = []
    for anomaly in anomalies:
        result_event = await db.execute(
            select(FeedbackLoopEvent)
            .where(FeedbackLoopEvent.project_id == project_id)
            .where(FeedbackLoopEvent.metric_date == anomaly["date"])
            .where(FeedbackLoopEvent.metric_name == anomaly["metric"])
        )
        existing_event = result_event.scalars().first()
        
        if not existing_event:
            new_event = FeedbackLoopEvent(
                project_id=project_id,
                insight_summary=anomaly["summary"],
                metric_date=anomaly["date"],
                metric_name=anomaly["metric"]
            )
            db.add(new_event)
            await db.commit()
            await db.refresh(new_event)
            existing_event = new_event
            
        persisted_anomalies.append({
            "id": str(existing_event.id),
            "date": existing_event.metric_date,
            "metric": existing_event.metric_name,
            "summary": existing_event.insight_summary,
            "sent_to_discovery": existing_event.sent_to_discovery
        })
                
    return {
        "metrics": serialized_metrics,
        "anomalies": persisted_anomalies
    }

@router.post("/feedback-loop/{event_id}/send-to-discovery")
async def send_to_discovery(
    project_id: str,
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_res = await db.execute(select(FeedbackLoopEvent).where(FeedbackLoopEvent.id == event_id))
    event = event_res.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Feedback loop event not found.")
        
    event.sent_to_discovery = True
    
    # Append to intake brief
    intake_res = await db.execute(select(IntakeBrief).where(IntakeBrief.project_id == project_id))
    intake = intake_res.scalars().first()
    
    if intake:
        injection = f"\\n\\n[Feedback Loop Insight from Post-Launch]: {event.insight_summary}"
        if intake.problem_statement:
            intake.problem_statement += injection
        else:
            intake.problem_statement = injection
            
    await db.commit()
    return {"status": "ok"}

@router.post("/feedback-loop/rerun-whitespace")
async def rerun_whitespace(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Just update the project stage back to whitespace so the user can generate it again
    proj_res = await db.execute(select(Project).where(Project.id == project_id))
    proj = proj_res.scalars().first()
    if proj:
        proj.current_stage = "whitespace"
        
    # Bump version of Brand Brief so we don't destroy original
    bb_res = await db.execute(select(BrandBrief).where(BrandBrief.project_id == project_id))
    bb = bb_res.scalars().first()
    if bb:
        bb.version = (bb.version or 1) + 1
        
    await db.commit()
    return {"status": "ok"}

