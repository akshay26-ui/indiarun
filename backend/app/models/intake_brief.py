"""Intake Brief model."""

import uuid
from typing import List, Optional

from sqlalchemy import ForeignKey, String, text, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class IntakeBrief(Base):
    __tablename__ = "intake_briefs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    
    # Fields
    problem_statement: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_user: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    known_competitors: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    budget_constraint: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    timeline_constraint: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    project = relationship("Project", backref="intake_brief")
