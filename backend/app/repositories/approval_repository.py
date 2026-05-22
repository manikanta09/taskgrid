from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.approval import Approval
from app.models.task import Task


class ApprovalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, approval: Approval) -> Approval:
        self.db.add(approval)
        self.db.commit()
        self.db.refresh(approval)
        return approval

    def get_by_task(self, task_id: int) -> list[Approval]:
        return (
            self.db.query(Approval)
            .filter(Approval.task_id == task_id)
            .order_by(Approval.decided_at.asc())
            .all()
        )

    def get_pending_for_user(self, user_id: int) -> list[Task]:
        return (
            self.db.query(Task)
            .filter(Task.status == "PENDING_APPROVAL")
            .all()
        )
