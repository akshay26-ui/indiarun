from typing import List, Dict, Any, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.intake_brief import IntakeBrief
from app.services.auth import get_current_user
from app.agents.intake_agent import run_intake_turn, IntakeBriefSchema

router = APIRouter(prefix="/api/project/{project_id}/intake", tags=["intake"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]

class ChatResponse(BaseModel):
    agent_reply: str
    brief: Dict[str, Any]

@router.post("/chat", response_model=ChatResponse)
async def intake_chat(
    project_id: uuid.UUID,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists and belongs to user
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get or create IntakeBrief
    stmt = select(IntakeBrief).where(IntakeBrief.project_id == project_id)
    result = await db.execute(stmt)
    brief = result.scalar_one_or_none()
    
    if not brief:
        brief = IntakeBrief(project_id=project_id)
        db.add(brief)
        await db.commit()
        await db.refresh(brief)

    # Convert history to list of dicts
    chat_history = [{"role": msg.role, "content": msg.content} for msg in request.history]
    
    # Construct current state
    current_state = {
        "idea_summary": project.idea_name if project.idea_name != "Draft" else None,
        "product_type": project.product_type.value if project.product_type else None,
        "problem_statement": brief.problem_statement,
        "target_user": brief.target_user,
        "known_competitors": brief.known_competitors or [],
        "category": brief.category,
        "budget_constraint": brief.budget_constraint,
        "timeline_constraint": brief.timeline_constraint,
    }

    # Run agent
    agent_result = run_intake_turn(chat_history, current_state)
    
    # Update brief and project from agent output
    if agent_result.problem_statement: brief.problem_statement = agent_result.problem_statement
    if agent_result.target_user: brief.target_user = agent_result.target_user
    if agent_result.known_competitors: brief.known_competitors = agent_result.known_competitors
    if agent_result.category: brief.category = agent_result.category
    if agent_result.budget_constraint: brief.budget_constraint = agent_result.budget_constraint
    if agent_result.timeline_constraint: brief.timeline_constraint = agent_result.timeline_constraint
    
    if agent_result.idea_summary:
        project.idea_name = agent_result.idea_summary
    if agent_result.product_type and agent_result.product_type in ["software", "physical"]:
        project.product_type = agent_result.product_type

    await db.commit()
    await db.refresh(brief)
    await db.refresh(project)

    # Return updated state
    updated_state = {
        "idea_summary": project.idea_name,
        "product_type": project.product_type.value,
        "problem_statement": brief.problem_statement,
        "target_user": brief.target_user,
        "known_competitors": brief.known_competitors,
        "category": brief.category,
        "budget_constraint": brief.budget_constraint,
        "timeline_constraint": brief.timeline_constraint,
    }
    
    return ChatResponse(
        agent_reply=agent_result.agent_reply,
        brief=updated_state
    )
