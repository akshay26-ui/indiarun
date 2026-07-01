"""Project model — matches the `projects` table in Backend Schema doc."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ProductType(str, enum.Enum):
    physical = "physical"
    software = "software"


class ProjectStage(str, enum.Enum):
    intake = "intake"
    whitespace = "whitespace"
    definition = "definition"
    prototype = "prototype"
    gtm = "gtm"
    tracking = "tracking"


class ProjectStatus(str, enum.Enum):
    in_progress = "in_progress"
    awaiting_approval = "awaiting_approval"
    completed = "completed"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    idea_name: Mapped[str] = mapped_column(String, nullable=False)
    product_type: Mapped[ProductType] = mapped_column(
        Enum(ProductType, name="product_type", create_constraint=True),
        nullable=False,
    )
    current_stage: Mapped[ProjectStage] = mapped_column(
        Enum(ProjectStage, name="project_stage", create_constraint=True),
        nullable=False,
        default=ProjectStage.intake,
        server_default="intake",
        index=True,
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status", create_constraint=True),
        nullable=False,
        default=ProjectStatus.in_progress,
        server_default="in_progress",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )
