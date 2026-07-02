import json
import asyncio
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.db.session import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.unit_economics import UnitEconomics
from app.models.gtm_plan import GtmPlan
from app.models.brand_brief import BrandBrief
from app.models.prd import PRD
from app.agents.gtm_agents import generate_unit_economics_verdict, generate_gtm_plan_data


from jinja2 import Template

router = APIRouter(prefix="/api/project/{project_id}/gtm", tags=["gtm"])

class UnitEconomicsPayload(BaseModel):
    cac: float
    arpu: float
    service_delivery_cost: float
    customer_lifetime_months: float

class GtmPlanPayload(BaseModel):
    objective: Optional[str] = None
    target_market: Optional[str] = None
    positioning: Optional[str] = None
    gtm_motion: Optional[str] = None
    packaging_strategy: Optional[str] = None
    key_differentiators: Optional[List[str]] = None
    success_metrics: Optional[List[str]] = None

@router.get("/unit-economics")
async def get_unit_economics(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(UnitEconomics).where(UnitEconomics.project_id == project_id))
    ue = result.scalars().first()
    if not ue:
        return {}
        
    return {
        "id": str(ue.id),
        "cac": float(ue.cac),
        "arpu": float(ue.arpu),
        "service_delivery_cost": float(ue.service_delivery_cost),
        "customer_lifetime_months": float(ue.customer_lifetime_months),
        "gross_margin": float(ue.gross_margin),
        "ltv": float(ue.ltv),
        "cac_payback_months": float(ue.cac_payback_months),
        "ltv_cac_ratio": float(ue.ltv_cac_ratio),
        "verdict": ue.verdict
    }

@router.post("/unit-economics")
async def save_unit_economics(project_id: str, payload: UnitEconomicsPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    async def sse_generator():
        try:
            yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Calculating deterministic unit economics metrics...'})}\n\n"
            
            # 1. Deterministic Backend Math
            gross_margin = payload.arpu - payload.service_delivery_cost
            ltv = gross_margin * payload.customer_lifetime_months
            cac_payback_months = (payload.cac / gross_margin) if gross_margin > 0 else 9999
            ltv_cac_ratio = (ltv / payload.cac) if payload.cac > 0 else 9999
            
            metrics = {
                "cac": payload.cac,
                "arpu": payload.arpu,
                "service_delivery_cost": payload.service_delivery_cost,
                "customer_lifetime_months": payload.customer_lifetime_months,
                "gross_margin": gross_margin,
                "ltv": ltv,
                "cac_payback_months": round(cac_payback_months, 2),
                "ltv_cac_ratio": round(ltv_cac_ratio, 2)
            }
            
            yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Invoking Gemini to analyze financial viability...'})}\n\n"
            
            # 2. LLM Verdict
            verdict = await generate_unit_economics_verdict(metrics)
            
            yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Saving metrics to database...'})}\n\n"
            
            # 3. Save to DB
            result = await db.execute(select(UnitEconomics).where(UnitEconomics.project_id == project_id))
            ue = result.scalars().first()
            
            if not ue:
                ue = UnitEconomics(project_id=project_id)
                db.add(ue)
                
            ue.cac = payload.cac
            ue.arpu = payload.arpu
            ue.service_delivery_cost = payload.service_delivery_cost
            ue.customer_lifetime_months = payload.customer_lifetime_months
            ue.gross_margin = gross_margin
            ue.ltv = ltv
            ue.cac_payback_months = metrics["cac_payback_months"]
            ue.ltv_cac_ratio = metrics["ltv_cac_ratio"]
            ue.verdict = verdict
            
            await db.commit()
            
            output = {
                "id": str(ue.id),
                **metrics,
                "verdict": verdict
            }
            
            yield f"data: {json.dumps({'type': 'final_output', 'data': output})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.get("/plan")
async def get_gtm_plan(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(GtmPlan).where(GtmPlan.project_id == project_id))
    plan = result.scalars().first()
    if not plan:
        return {}
        
    return {
        "id": str(plan.id),
        "objective": plan.objective,
        "target_market": plan.target_market,
        "positioning": plan.positioning,
        "gtm_motion": plan.gtm_motion,
        "packaging_strategy": plan.packaging_strategy,
        "key_differentiators": plan.key_differentiators or [],
        "success_metrics": plan.success_metrics or []
    }

@router.post("/plan/generate")
async def generate_gtm_plan(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    async def sse_generator():
        try:
            yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Fetching approved Brand Brief and PRD...'})}\n\n"
            
            bb_res = await db.execute(select(BrandBrief).where(BrandBrief.project_id == project_id))
            bb = bb_res.scalars().first()
            
            prd_res = await db.execute(select(PRD).where(PRD.project_id == project_id))
            prd = prd_res.scalars().first()
            
            if not bb:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Brand brief not found. Cannot generate GTM.'})}\n\n"
                return
                
            bb_data = {
                "whitespace_summary": bb.whitespace_summary,
                "psychographic_target": bb.psychographic_target,
                "recommended_attributes": bb.recommended_attributes
            }
            prd_data = prd.content_markdown if prd else "No software PRD available (Physical product)."
            
            yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Drafting Go-To-Market strategy...'})}\n\n"
            plan_data = await generate_gtm_plan_data(bb_data, prd_data)
            
            yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Saving GTM Plan...'})}\n\n"
            result = await db.execute(select(GtmPlan).where(GtmPlan.project_id == project_id))
            plan = result.scalars().first()
            
            if not plan:
                plan = GtmPlan(project_id=project_id)
                db.add(plan)
                
            plan.objective = plan_data.get("objective")
            plan.target_market = plan_data.get("target_market")
            plan.positioning = plan_data.get("positioning")
            plan.gtm_motion = plan_data.get("gtm_motion")
            plan.packaging_strategy = plan_data.get("packaging_strategy")
            plan.key_differentiators = plan_data.get("key_differentiators", [])
            plan.success_metrics = plan_data.get("success_metrics", [])
            
            await db.commit()
            
            yield f"data: {json.dumps({'type': 'final_output', 'data': plan_data})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.put("/plan")
async def update_gtm_plan(project_id: str, payload: GtmPlanPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(GtmPlan).where(GtmPlan.project_id == project_id))
    plan = result.scalars().first()
    
    if not plan:
        plan = GtmPlan(project_id=project_id)
        db.add(plan)
        
    plan.objective = payload.objective
    plan.target_market = payload.target_market
    plan.positioning = payload.positioning
    plan.gtm_motion = payload.gtm_motion
    plan.packaging_strategy = payload.packaging_strategy
    plan.key_differentiators = payload.key_differentiators or []
    plan.success_metrics = payload.success_metrics or []
    
    await db.commit()
    return {"status": "ok"}

@router.post("/continue-tracking")
async def continue_to_tracking(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if project:
        project.current_stage = "tracking"
        await db.commit()
    return {"status": "ok"}

@router.get("/launch-pack-pdf")
async def get_launch_pack_pdf(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch Project
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch UE and Plan
    ue_res = await db.execute(select(UnitEconomics).where(UnitEconomics.project_id == project_id))
    ue = ue_res.scalars().first()
    
    plan_res = await db.execute(select(GtmPlan).where(GtmPlan.project_id == project_id))
    plan = plan_res.scalars().first()
    
    html_template = """
    <html>
    <head>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
            h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
            h2 { color: #2563eb; margin-top: 30px; }
            .section { margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; width: 30%; }
            .metric-grid { display: flex; flex-wrap: wrap; gap: 20px; }
            .metric-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 45%; background-color: #f8fafc; }
            .metric-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            .verdict { background-color: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h1>Launch Pack: {{ project_name }}</h1>
        
        <div class="section">
            <h2>Go-To-Market Plan</h2>
            {% if plan %}
            <table>
                <tr><th>Objective</th><td>{{ plan.objective or 'N/A' }}</td></tr>
                <tr><th>Target Market</th><td>{{ plan.target_market or 'N/A' }}</td></tr>
                <tr><th>Positioning</th><td>{{ plan.positioning or 'N/A' }}</td></tr>
                <tr><th>GTM Motion</th><td>{{ plan.gtm_motion or 'N/A' }}</td></tr>
                <tr><th>Packaging Strategy</th><td>{{ plan.packaging_strategy or 'N/A' }}</td></tr>
                <tr><th>Key Differentiators</th>
                    <td>
                        <ul>
                        {% for diff in plan.key_differentiators %}
                            <li>{{ diff }}</li>
                        {% endfor %}
                        </ul>
                    </td>
                </tr>
                <tr><th>Success Metrics</th>
                    <td>
                        <ul>
                        {% for metric in plan.success_metrics %}
                            <li>{{ metric }}</li>
                        {% endfor %}
                        </ul>
                    </td>
                </tr>
            </table>
            {% else %}
            <p>No GTM Plan data available.</p>
            {% endif %}
        </div>
        
        <div class="section" style="page-break-before: always;">
            <h2>Unit Economics Viability</h2>
            {% if ue %}
            <div style="margin-bottom: 20px;">
                <h3>Raw Inputs</h3>
                <p><strong>CAC:</strong> ${{ ue.cac }} | <strong>ARPU:</strong> ${{ ue.arpu }} | <strong>COGS:</strong> ${{ ue.service_delivery_cost }} | <strong>Lifetime:</strong> {{ ue.customer_lifetime_months }} months</p>
            </div>
            
            <h3>Computed Metrics</h3>
            <table style="margin-bottom: 20px;">
                <tr>
                    <td style="text-align: center; padding: 15px; background: #f8fafc;">
                        <div class="metric-title">Gross Margin</div>
                        <div class="metric-value">${{ ue.gross_margin }}</div>
                    </td>
                    <td style="text-align: center; padding: 15px; background: #f8fafc;">
                        <div class="metric-title">Lifetime Value (LTV)</div>
                        <div class="metric-value">${{ ue.ltv }}</div>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding: 15px; background: #f8fafc;">
                        <div class="metric-title">CAC Payback</div>
                        <div class="metric-value">{{ ue.cac_payback_months }} mos</div>
                    </td>
                    <td style="text-align: center; padding: 15px; background: #f8fafc;">
                        <div class="metric-title">LTV:CAC Ratio</div>
                        <div class="metric-value">{{ ue.ltv_cac_ratio }}x</div>
                    </td>
                </tr>
            </table>
            
            <h3>AI Verdict</h3>
            <div class="verdict">
                {{ ue.verdict }}
            </div>
            {% else %}
            <p>No Unit Economics data available.</p>
            {% endif %}
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(project_name=project.idea_name, plan=plan, ue=ue)
    
    try:
        from weasyprint import HTML
        pdf_file = HTML(string=html_content).write_pdf()
    except ImportError:
        from fastapi import HTTPException
        raise HTTPException(status_code=501, detail="PDF generation not available on this server (weasyprint not installed).")
    
    return Response(
        content=pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={project.idea_name.replace(' ', '_')}_Launch_Pack.pdf"}
    )
