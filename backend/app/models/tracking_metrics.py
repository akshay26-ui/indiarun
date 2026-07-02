from sqlalchemy import Column, String, Numeric, ForeignKey, Date, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.models.base import Base

class TrackingMetric(Base):
    __tablename__ = "tracking_metrics"
    __table_args__ = (
        # Composite index for fast chart queries: filter by project, order by date
        Index("ix_tracking_metrics_project_date", "project_id", "date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    date = Column(Date, nullable=False)
    dau = Column(Integer, nullable=False)
    mau = Column(Integer, nullable=False)
    retention_rate = Column(Numeric, nullable=False)
    nps_score = Column(Numeric, nullable=False)
    csat_score = Column(Numeric, nullable=False)
    churn_rate = Column(Numeric, nullable=False)
    revenue = Column(Numeric, nullable=False)
    funnel_conversion_rate = Column(Numeric, nullable=False)
    
    source = Column(String, nullable=False, default='csv_upload')
