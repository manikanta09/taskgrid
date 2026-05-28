from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, JSONB_TYPE


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    workflow_id: Mapped[int] = mapped_column(
        ForeignKey("workflows.id"), nullable=False, index=True
    )
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="CREATED", index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    # JSONB on PostgreSQL — task input payload and completion data
    payload: Mapped[Optional[dict]] = mapped_column(JSONB_TYPE, nullable=True)
    outcome_data: Mapped[Optional[dict]] = mapped_column(JSONB_TYPE, nullable=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    current_assignee_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    workflow: Mapped[Workflow] = relationship("Workflow", back_populates="tasks")
    created_by: Mapped[User] = relationship(
        "User", back_populates="created_tasks", foreign_keys=[created_by_id]
    )
    current_assignee: Mapped[Optional[User]] = relationship(
        "User", back_populates="assigned_tasks", foreign_keys=[current_assignee_id]
    )
    assignments: Mapped[list[TaskAssignment]] = relationship(
        "TaskAssignment", back_populates="task", cascade="all, delete-orphan"
    )
    approvals: Mapped[list[Approval]] = relationship(
        "Approval", back_populates="task", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title} status={self.status}>"
