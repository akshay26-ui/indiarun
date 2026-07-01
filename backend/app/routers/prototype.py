import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.prd import PRD
from app.models.feature import Feature
from app.models.brand_brief import BrandBrief
from app.models.prototype import Prototype
from app.agents.prototype_agents import generate_software_code, deploy_software_prototype, generate_physical_image, generate_physical_spec

import zipfile
import io
import time

router = APIRouter(prefix="/project/{project_id}/prototype", tags=["prototype"])

@router.post("/generate")
async def generate_prototype(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch PRD
    prd_res = await db.execute(select(PRD).where(PRD.project_id == project.id))
    prd = prd_res.scalars().first()
    
    # Fetch Features
    features_res = await db.execute(select(Feature).where(Feature.project_id == project.id).order_by(Feature.rice_score.desc()).limit(8))
    features = features_res.scalars().all()
    
    # Fetch Brand Brief for physical
    brand_res = await db.execute(select(BrandBrief).where(BrandBrief.project_id == project.id))
    brand_brief = brand_res.scalars().first()

    async def sse_generator():
        try:
            # Check if prototype already exists, delete it
            existing_res = await db.execute(select(Prototype).where(Prototype.project_id == project.id))
            existing = existing_res.scalars().first()
            if existing:
                await db.delete(existing)
                await db.commit()

            proto = Prototype(
                project_id=project.id,
                type=project.product_type
            )
            
            if project.product_type == "software":
                if not prd:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'PRD not found'})}\n\n"
                    return
                
                yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Reading PRD feature list...'})}\n\n"
                await asyncio.sleep(1)
                
                yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Scaffolding Next.js React components using shadcn/ui...'})}\n\n"
                feature_dicts = [{"title": f.title, "description": f.description} for f in features]
                code = await generate_software_code(prd.content_markdown, feature_dicts)
                
                yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Deploying preview to Vercel...'})}\n\n"
                preview_url = await deploy_software_prototype(code)
                
                # We save the generated code inside a temporary directory on the server, or we can just store the URL and generate the ZIP on the fly.
                # Let's save the code in a temp file or DB? Actually we don't have a code column in DB. We can store it as code_export_url or just re-generate it? No, re-generating is slow and non-deterministic.
                # Let's add a `code` field to the prototype or store it in file system. Wait, since it's a hackathon, we can just save it to local disk and set code_export_url to point to it.
                filename = f"/tmp/{project.id}_code.tsx"
                with open(filename, "w") as f:
                    f.write(code)
                
                proto.preview_url = preview_url
                proto.code_export_url = f"/api/project/{project.id}/prototype/download"
                
            else:
                if not brand_brief:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Brand brief not found'})}\n\n"
                    return
                
                yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Generating concept render...'})}\n\n"
                attributes = brand_brief.recommended_attributes or []
                image_url = await generate_physical_image(attributes)
                proto.concept_image_url = image_url
                
                yield f"data: {json.dumps({'type': 'reasoning_step', 'message': 'Drafting structured spec sheet...'})}\n\n"
                spec_sheet = await generate_physical_spec(attributes)
                proto.spec_sheet = spec_sheet
                proto.concept_stage_disclaimer = True

            db.add(proto)
            await db.commit()

            yield f"data: {json.dumps({'type': 'final_output', 'message': 'Prototype Engine complete.'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.get("")
async def get_prototype(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Prototype).where(Prototype.project_id == project_id))
    proto = result.scalars().first()
    if not proto:
        return {}
    return {
        "id": str(proto.id),
        "type": proto.type,
        "preview_url": proto.preview_url,
        "code_export_url": proto.code_export_url,
        "concept_image_url": proto.concept_image_url,
        "spec_sheet": proto.spec_sheet,
        "concept_stage_disclaimer": proto.concept_stage_disclaimer
    }

@router.get("/download")
async def download_prototype_code(project_id: str, current_user: User = Depends(get_current_user)):
    # Read from local disk
    filename = f"/tmp/{project_id}_code.tsx"
    try:
        with open(filename, "r") as f:
            code = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Code not found")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("App.tsx", code)
        zf.writestr("package.json", '{"name":"uapa-prototype","version":"1.0.0","dependencies":{"react":"^18.2.0","lucide-react":"latest"}}')
    
    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=prototype_{project_id}.zip"}
    )
