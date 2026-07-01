"""create users and projects tables

Revision ID: 0001
Revises: None
Create Date: 2026-07-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Enum types matching the Backend Schema doc
# ---------------------------------------------------------------------------
product_type_enum = sa.Enum("physical", "software", name="product_type")
project_stage_enum = sa.Enum(
    "intake", "whitespace", "definition", "prototype", "gtm", "tracking",
    name="project_stage",
)
project_status_enum = sa.Enum(
    "in_progress", "awaiting_approval", "completed",
    name="project_status",
)


def upgrade() -> None:
    # -- users ---------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # -- enums (created explicitly so downgrade can drop them) ---------------
    # product_type_enum.create(op.get_bind(), checkfirst=True)
    # project_stage_enum.create(op.get_bind(), checkfirst=True)
    # project_status_enum.create(op.get_bind(), checkfirst=True)

    # -- projects ------------------------------------------------------------
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("idea_name", sa.String(), nullable=False),
        sa.Column("product_type", product_type_enum, nullable=False),
        sa.Column("current_stage", project_stage_enum, nullable=False, server_default="intake"),
        sa.Column("status", project_status_enum, nullable=False, server_default="in_progress"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # -- indexes (per Backend Schema doc §3 Indexing Notes) ------------------
    op.create_index("ix_projects_user_id", "projects", ["user_id"])
    op.create_index("ix_projects_current_stage", "projects", ["current_stage"])


def downgrade() -> None:
    op.drop_index("ix_projects_current_stage", table_name="projects")
    op.drop_index("ix_projects_user_id", table_name="projects")
    op.drop_table("projects")
    op.drop_table("users")

    # Drop enum types
    project_status_enum.drop(op.get_bind(), checkfirst=True)
    project_stage_enum.drop(op.get_bind(), checkfirst=True)
    product_type_enum.drop(op.get_bind(), checkfirst=True)
