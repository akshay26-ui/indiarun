"""Project CRUD router — placeholder."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/project", tags=["projects"])


@router.post("")
async def create_project():
    """Create a new project from an intake brief. (placeholder)"""
    return {"message": "create_project — not yet implemented"}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Fetch full project state across all stages. (placeholder)"""
    return {"message": f"get_project {project_id} — not yet implemented"}
