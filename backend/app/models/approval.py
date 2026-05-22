from __future__ import annotations
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    approver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    decision: Mapped[str] = mapped_column(String(20), nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    step: Mapped[int] = mapped_column(Integer, nullable=False)
    decided_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    task: Mapped[Task] = relationship("Task", back_populates="approvals")
    approver: Mapped[User] = relationship("User", back_populates="approvals")
