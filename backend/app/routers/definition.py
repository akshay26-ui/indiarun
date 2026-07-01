from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
import markdown
from weasyprint import HTML
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.project import Project
from app.models.intake_brief import IntakeBrief
from app.models.brand_brief import BrandBrief
from app.models.persona import Persona
from app.models.feature import Feature
from app.models.prd import PRD
from app.agents.definition_agents import generate_personas, generate_features, generate_prd
from pydantic import BaseModel

router = APIRouter(prefix="/api/project/{project_id}", tags=["definition"])

class PersonaUpdate(BaseModel):
    name: str | None = None
    quote: str | None = None
    demographics: dict | None = None
    scenario: str | None = None
    goals: List[str] | None = None
    pain_points: List[str] | None = None

class FeatureUpdate(BaseModel):
    effort: float

@router.post("/brand_brief")
async def create_brand_brief(project_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brief = result.scalars().first()
    
    if brief:
        brief.whitespace_summary = data.get("whitespace_summary", "Manual testing summary")
        brief.psychographic_target = data.get("psychographic_target", {})
        brief.approved = True
    else:
        brief = BrandBrief(
            project_id=project_id,
            whitespace_summary=data.get("whitespace_summary", "Manual testing summary"),
            psychographic_target=data.get("psychographic_target", {}),
            approved=True
        )
        db.add(brief)
    
    project.current_stage = "definition"
    await db.commit()
    await db.refresh(brief)
    
    return {"status": "ok", "id": brief.id}

@router.get("/whitespace")
async def get_whitespace(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from app.models.source_citation import SourceCitation
    from app.models.failure_risk import FailureRisk
    
    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brief = result.scalars().first()
    if not brief:
        return {"brief": None}
        
    cits_result = await db.execute(select(SourceCitation).filter(SourceCitation.project_id == project_id))
    citations = cits_result.scalars().all()
    
    risks_result = await db.execute(select(FailureRisk).filter(FailureRisk.brand_brief_id == brief.id))
    risks = risks_result.scalars().all()
    
    return {
        "brief": {
            "id": brief.id,
            "whitespace_summary": brief.whitespace_summary,
            "price_tier_map": brief.price_tier_map,
            "psychographic_target": brief.psychographic_target,
            "brand_credibility_score": brief.brand_credibility_score,
            "recommended_attributes": brief.recommended_attributes,
            "approved": brief.approved
        },
        "citations": [
            {
                "field_referenced": c.field_referenced,
                "source_url": c.source_url,
                "source_type": c.source_type
            } for c in citations
        ],
        "failure_risks": [
            {
                "precedent_name": r.precedent_name,
                "similarity_reason": r.similarity_reason,
                "mitigation_suggestion": r.mitigation_suggestion
            } for r in risks
        ]
    }

@router.post("/whitespace/generate")
async def generate_whitespace(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import StreamingResponse
    from app.agents.whitespace_agents import run_whitespace_engine
    
    return StreamingResponse(run_whitespace_engine(project_id, db), media_type="text/event-stream")


@router.post("/definition/generate")
async def generate_definition(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    
    result = await db.execute(select(IntakeBrief).filter(IntakeBrief.project_id == project_id))
    intake = result.scalars().first()
    
    if not intake:
        intake = IntakeBrief(
            project_id=project_id,
            problem_statement="Manual fallback problem statement",
            target_user="Manual fallback target user",
            known_competitors=[]
        )
        db.add(intake)
        await db.commit()
        await db.refresh(intake)
    
    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brand = result.scalars().first()
    
    if not brand:
        raise HTTPException(status_code=400, detail="Missing brand brief")
        
    intake_dict = {
        "problem_statement": intake.problem_statement,
        "target_user": intake.target_user,
        "product_type": project.product_type,
        "known_competitors": intake.known_competitors,
    }
    
    brand_dict = {
        "whitespace_summary": brand.whitespace_summary,
        "psychographic_target": brand.psychographic_target
    }
    
    # 1. Personas
    personas_data = generate_personas(intake_dict, brand_dict)
    
    result = await db.execute(select(Persona).filter(Persona.project_id == project_id))
    for p in result.scalars().all():
        await db.delete(p)
        
    for p in personas_data:
        db.add(Persona(
            project_id=project_id,
            name=p["name"],
            quote=p["quote"],
            demographics=p["demographics"],
            goals=p["goals"],
            pain_points=p["pain_points"],
            scenario=p["scenario"]
        ))
    await db.commit()
    
    # 2. Features
    features_data = generate_features(intake_dict, personas_data)
    
    result = await db.execute(select(Feature).filter(Feature.project_id == project_id))
    for f in result.scalars().all():
        await db.delete(f)
        
    for f in features_data:
        reach = f.get("reach", 5)
        impact = f.get("impact", 5)
        confidence = f.get("confidence", 0.5)
        effort = 1.0 # Default effort to compute RICE
        
        rice_score = (reach * impact * confidence) / effort
        
        if rice_score >= 80: priority = "very_high"
        elif rice_score >= 50: priority = "high"
        elif rice_score >= 20: priority = "medium"
        else: priority = "low"
        
        db.add(Feature(
            project_id=project_id,
            title=f["title"],
            description=f["description"],
            reach=reach,
            impact=impact,
            confidence=confidence,
            effort=effort,
            rice_score=rice_score,
            priority_label=priority
        ))
    await db.commit()
    
    # 3. PRD
    prd_markdown = generate_prd(intake_dict, brand_dict, personas_data, features_data)
    
    result = await db.execute(select(PRD).filter(PRD.project_id == project_id))
    prd = result.scalars().first()
    
    if prd:
        prd.content_markdown = prd_markdown
    else:
        db.add(PRD(
            project_id=project_id,
            content_markdown=prd_markdown
        ))
    await db.commit()
    
    return {"status": "ok"}

@router.get("/definition")
async def get_definition(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Persona).filter(Persona.project_id == project_id))
    personas = result.scalars().all()
    
    result = await db.execute(select(Feature).filter(Feature.project_id == project_id))
    features = result.scalars().all()
    
    result = await db.execute(select(PRD).filter(PRD.project_id == project_id))
    prd = result.scalars().first()
    
    personas_list = []
    for p in personas:
        personas_list.append({
            "id": str(p.id),
            "name": p.name,
            "quote": p.quote,
            "demographics": p.demographics,
            "scenario": p.scenario,
            "goals": p.goals,
            "pain_points": p.pain_points
        })
        
    features_list = []
    for f in features:
        features_list.append({
            "id": str(f.id),
            "title": f.title,
            "description": f.description,
            "reach": f.reach,
            "impact": f.impact,
            "confidence": f.confidence,
            "effort": f.effort,
            "rice_score": f.rice_score,
            "priority_label": f.priority_label
        })
        
    return {
        "personas": personas_list,
        "features": features_list,
        "prd": prd.content_markdown if prd else ""
    }

@router.patch("/definition/personas/{persona_id}")
async def update_persona(project_id: uuid.UUID, persona_id: uuid.UUID, data: PersonaUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Persona).filter(Persona.id == persona_id, Persona.project_id == project_id))
    persona = result.scalars().first()
    
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
        
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(persona, key, value)
        
    await db.commit()
    return {"status": "ok"}

@router.patch("/definition/features/{feature_id}")
async def update_feature(project_id: uuid.UUID, feature_id: uuid.UUID, data: FeatureUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Feature).filter(Feature.id == feature_id, Feature.project_id == project_id))
    feature = result.scalars().first()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    effort = data.effort
    if effort <= 0:
        raise HTTPException(status_code=400, detail="Effort must be greater than 0")
        
    feature.effort = effort
    feature.rice_score = (float(feature.reach) * float(feature.impact) * float(feature.confidence)) / effort
    
    if feature.rice_score >= 80: priority = "very_high"
    elif feature.rice_score >= 50: priority = "high"
    elif feature.rice_score >= 20: priority = "medium"
    else: priority = "low"
    
    feature.priority_label = priority
    
    await db.commit()
    return {"status": "ok", "rice_score": feature.rice_score, "priority_label": priority}

@router.post("/definition/approve")
async def approve_definition(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PRD).filter(PRD.project_id == project_id))
    prd = result.scalars().first()
    
    if not prd:
        raise HTTPException(status_code=404, detail="PRD not found")
        
    prd.approved = True
    
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if project:
        project.current_stage = "prototype"
        
    await db.commit()
    return {"status": "ok"}

@router.get("/definition/prd/pdf")
async def get_prd_pdf(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PRD).filter(PRD.project_id == project_id))
    prd = result.scalars().first()
    
    if not prd:
        raise HTTPException(status_code=404, detail="PRD not found")
        
    html_body = markdown.markdown(prd.content_markdown, extensions=['tables'])
    html_content = f"""
    <html>
      <head>
        <style>
          body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
          h1, h2, h3 {{ color: #1a202c; }}
          table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
          th, td {{ border: 1px solid #e2e8f0; padding: 8px; text-align: left; }}
          th {{ background-color: #f7fafc; }}
        </style>
      </head>
      <body>
        {html_body}
      </body>
    </html>
    """
    
    pdf_bytes = HTML(string=html_content).write_pdf()
    
    return Response(
        content=pdf_bytes, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=PRD_{project_id}.pdf"}
    )
