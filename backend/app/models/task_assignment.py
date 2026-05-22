from __future__ import annotations
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    step: Mapped[int] = mapped_column(Integer, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    assigned_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    released_at: Mapped[Optional[DateTime]] = mapped_column(DateTime, nullable=True)

    task: Mapped[Task] = relationship("Task", back_populates="assignments")
    user: Mapped[User] = relationship("User", back_populates="task_assignments", foreign_keys=[user_id])
    assigned_by: Mapped[User] = relationship("User", foreign_keys=[assigned_by_id])
