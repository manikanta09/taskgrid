from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.workflow import Workflow


class WorkflowRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, workflow_id: int) -> Workflow | None:
        return self.db.query(Workflow).filter(Workflow.id == workflow_id).first()

    def list(self, skip: int = 0, limit: int = 20, status: str | None = None) -> tuple[list[Workflow], int]:
        q = self.db.query(Workflow)
        if status:
            q = q.filter(Workflow.status == status)
        total = q.count()
        return q.order_by(Workflow.created_at.desc()).offset(skip).limit(limit).all(), total

    def create(self, workflow: Workflow) -> Workflow:
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def save(self, workflow: Workflow) -> Workflow:
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def count_by_status(self) -> dict[str, int]:
        rows = self.db.query(Workflow.status, Workflow.id).all()
        result: dict[str, int] = {}
        for status, _ in rows:
            result[status] = result.get(status, 0) + 1
        return result
