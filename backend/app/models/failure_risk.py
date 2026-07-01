"""Failure Risk model."""

import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import ForeignKey, String, text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class FailureRisk(Base):
    __tablename__ = "failure_risks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    brand_brief_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_briefs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    precedent_name: Mapped[str] = mapped_column(String, nullable=False)
    similarity_reason: Mapped[str] = mapped_column(String, nullable=False)
    mitigation_suggestion: Mapped[str] = mapped_column(String, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    brand_brief = relationship("BrandBrief", back_populates="failure_risks")
