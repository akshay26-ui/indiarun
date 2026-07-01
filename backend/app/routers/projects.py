from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List

from app.db.session import get_db
from app.models.project import Project
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/project", tags=["projects"])

class ProjectCreate(BaseModel):
    idea_name: str
    product_type: str

class ProjectResponse(BaseModel):
    id: str
    idea_name: str
    product_type: str
    current_stage: str
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[dict])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch all projects for the logged-in user."""
    stmt = select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    return [
        {
            "id": str(p.id),
            "idea_name": p.idea_name,
            "product_type": p.product_type,
            "current_stage": p.current_stage,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        }
        for p in projects
    ]

@router.post("")
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project from an intake brief."""
    new_project = Project(
        idea_name=project.idea_name,
        product_type=project.product_type,
        user_id=current_user.id
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return {"id": str(new_project.id)}

@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch full project state across all stages."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
        
    return {
        "id": str(project.id),
        "idea_name": project.idea_name,
        "product_type": project.product_type,
        "current_stage": project.current_stage,
        "status": project.status,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }
