import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base

class Prototype(Base):
    __tablename__ = "prototypes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum("software", "physical", name="prototype_type"), nullable=False)
    preview_url = Column(String, nullable=True)
    code_export_url = Column(String, nullable=True)
    concept_image_url = Column(String, nullable=True)
    spec_sheet = Column(JSONB, nullable=True)
    concept_stage_disclaimer = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
