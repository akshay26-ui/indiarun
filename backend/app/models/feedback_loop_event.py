from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime

from app.models.base import Base

class FeedbackLoopEvent(Base):
    __tablename__ = "feedback_loop_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    insight_summary = Column(String, nullable=False)
    metric_date = Column(String, nullable=False)  # Storing the date string it was triggered on
    metric_name = Column(String, nullable=False)  # e.g., 'retention_rate'
    
    sent_to_discovery = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
