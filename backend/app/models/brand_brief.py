"""Brand Brief model."""

import uuid
from typing import Optional, List
from datetime import datetime

from sqlalchemy import ForeignKey, String, text, Boolean, Numeric, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class BrandBrief(Base):
    __tablename__ = "brand_briefs"

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
    
    whitespace_summary: Mapped[str] = mapped_column(String, nullable=False)
    price_tier_map: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    psychographic_target: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    brand_credibility_score: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)
    recommended_attributes: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    project = relationship("Project", backref="brand_brief")
    failure_risks = relationship("FailureRisk", back_populates="brand_brief", cascade="all, delete-orphan")
