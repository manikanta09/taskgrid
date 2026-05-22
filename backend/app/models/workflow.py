from __future__ import annotations
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="DRAFT", index=True)
    steps: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    created_by: Mapped[User] = relationship("User", back_populates="created_workflows", foreign_keys=[created_by_id])
    tasks: Mapped[list[Task]] = relationship("Task", back_populates="workflow")

    def __repr__(self) -> str:
        return f"<Workflow id={self.id} name={self.name} status={self.status}>"
