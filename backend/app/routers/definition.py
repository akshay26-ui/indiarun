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

@router.post("/whitespace/generate")
async def generate_whitespace(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from app.agents.whitespace_agents import discover_competitors, analyze_price_tiers, analyze_psychographics
    
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    result = await db.execute(select(IntakeBrief).filter(IntakeBrief.project_id == project_id))
    intake = result.scalars().first()
    if not intake:
        raise HTTPException(status_code=400, detail="Missing intake brief")
        
    category = intake.category or project.idea_name
    known_competitors = intake.known_competitors or []
    
    # 1. Discover
    competitors = discover_competitors(category, known_competitors)
    
    # 2. Price Tiers
    price_tiers = analyze_price_tiers(competitors)
    
    # 3. Psychographics
    snippets = [c.get("review_snippet", "") for c in competitors]
    psychographics = analyze_psychographics(category, snippets)
    
    # Update or Create BrandBrief
    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brief = result.scalars().first()
    
    summary = f"Found {len(competitors)} competitors in category {category}. Price analysis identified opportunities in {price_tiers.get('tiers', [])}. Primary psychographic driver: {psychographics.get('driver')}."
    
    if brief:
        brief.whitespace_summary = summary
        brief.psychographic_target = psychographics
        brief.price_tier_map = price_tiers
        brief.approved = True
    else:
        brief = BrandBrief(
            project_id=project_id,
            whitespace_summary=summary,
            psychographic_target=psychographics,
            price_tier_map=price_tiers,
            approved=True
        )
        db.add(brief)
        
    project.current_stage = "definition"
    await db.commit()
    
    return {"status": "ok"}


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
    
    return {
        "personas": personas,
        "features": features,
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
