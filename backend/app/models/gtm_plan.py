from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

from app.models.base import Base

class GtmPlan(Base):
    __tablename__ = "gtm_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    objective = Column(String, nullable=True)
    target_market = Column(String, nullable=True)
    positioning = Column(String, nullable=True)
    gtm_motion = Column(String, nullable=True)
    packaging_strategy = Column(String, nullable=True)
    key_differentiators = Column(ARRAY(String), nullable=True)
    success_metrics = Column(ARRAY(String), nullable=True)
