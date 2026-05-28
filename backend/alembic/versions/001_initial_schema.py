"""initial schema — PostgreSQL native (JSONB, TIMESTAMPTZ)

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def _json():
    """Returns JSONB on PostgreSQL, JSON elsewhere (e.g. SQLite CI runs)."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return postgresql.JSONB()
    return sa.JSON()


def _datetime():
    """Returns TIMESTAMP WITH TIME ZONE on PostgreSQL, DATETIME elsewhere."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return sa.DateTime(timezone=True)
    return sa.DateTime()


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("last_login_at", _datetime(), nullable=True),
        sa.Column("created_at", _datetime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", _datetime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "workflows",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column("steps", _json(), nullable=False),
        sa.Column("created_by_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", _datetime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", _datetime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_workflows_status", "workflows", ["status"])
    op.create_index("ix_workflows_created_by_id", "workflows", ["created_by_id"])

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("workflow_id", sa.Integer, sa.ForeignKey("workflows.id"), nullable=False),
        sa.Column("current_step", sa.Integer, nullable=False, server_default="1"),
        sa.Column("status", sa.String(50), nullable=False, server_default="CREATED"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("payload", _json(), nullable=True),
        sa.Column("outcome_data", _json(), nullable=True),
        sa.Column("due_at", _datetime(), nullable=True),
        sa.Column("created_by_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("current_assignee_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", _datetime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", _datetime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_workflow_id", "tasks", ["workflow_id"])
    op.create_index("ix_tasks_current_assignee_id", "tasks", ["current_assignee_id"])
    op.create_index("ix_tasks_created_at", "tasks", ["created_at"])

    op.create_table(
        "task_assignments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_by_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("step", sa.Integer, nullable=False),
        sa.Column("is_current", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("assigned_at", _datetime(), server_default=sa.func.now(), nullable=False),
        sa.Column("released_at", _datetime(), nullable=True),
    )
    op.create_index("ix_task_assignments_task_id", "task_assignments", ["task_id"])
    op.create_index("ix_task_assignments_user_id", "task_assignments", ["user_id"])
    op.create_index("ix_task_assignments_is_current", "task_assignments", ["is_current"])

    op.create_table(
        "approvals",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("approver_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("decision", sa.String(20), nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("step", sa.Integer, nullable=False),
        sa.Column("decided_at", _datetime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_approvals_task_id", "approvals", ["task_id"])
    op.create_index("ix_approvals_approver_id", "approvals", ["approver_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("actor_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer, nullable=False),
        sa.Column("before_state", _json(), nullable=True),
        sa.Column("after_state", _json(), nullable=True),
        sa.Column("metadata", _json(), nullable=True),
        sa.Column("created_at", _datetime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"])
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("approvals")
    op.drop_table("task_assignments")
    op.drop_table("tasks")
    op.drop_table("workflows")
    op.drop_table("users")
