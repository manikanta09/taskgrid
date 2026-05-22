from __future__ import annotations
from typing import Optional
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[DateTime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    created_workflows: Mapped[list[Workflow]] = relationship("Workflow", back_populates="created_by", foreign_keys="Workflow.created_by_id")
    created_tasks: Mapped[list[Task]] = relationship("Task", back_populates="created_by", foreign_keys="Task.created_by_id")
    assigned_tasks: Mapped[list[Task]] = relationship("Task", back_populates="current_assignee", foreign_keys="Task.current_assignee_id")
    task_assignments: Mapped[list[TaskAssignment]] = relationship("TaskAssignment", back_populates="user", foreign_keys="TaskAssignment.user_id")
    approvals: Mapped[list[Approval]] = relationship("Approval", back_populates="approver")
    audit_logs: Mapped[list[AuditLog]] = relationship("AuditLog", back_populates="actor")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
