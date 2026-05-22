from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.task_assignment import TaskAssignment
from app.schemas.task import TaskFilter


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, task_id: int) -> Task | None:
        return self.db.query(Task).filter(Task.id == task_id).first()

    def list(self, filters: TaskFilter) -> tuple[list[Task], int]:
        q = self.db.query(Task)
        if filters.status:
            q = q.filter(Task.status == filters.status)
        if filters.workflow_id:
            q = q.filter(Task.workflow_id == filters.workflow_id)
        if filters.assignee_id:
            q = q.filter(Task.current_assignee_id == filters.assignee_id)
        if filters.priority:
            q = q.filter(Task.priority == filters.priority)

        sort_col = getattr(Task, filters.sort_by)
        q = q.order_by(sort_col.desc() if filters.sort_dir == "desc" else sort_col.asc())

        total = q.count()
        skip = (filters.page - 1) * filters.limit
        return q.offset(skip).limit(filters.limit).all(), total

    def create(self, task: Task) -> Task:
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def save(self, task: Task) -> Task:
        self.db.commit()
        self.db.refresh(task)
        return task

    def release_current_assignments(self, task_id: int):
        now = datetime.now(timezone.utc)
        self.db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task_id,
            TaskAssignment.is_current == True,  # noqa: E712
        ).update({"is_current": False, "released_at": now})
        self.db.commit()

    def count_by_status(self) -> dict[str, int]:
        rows = self.db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
        return {status: count for status, count in rows}

    def count_completed_today(self) -> int:
        today = datetime.now(timezone.utc).date()
        return (
            self.db.query(Task)
            .filter(Task.status == "COMPLETED")
            .filter(func.date(Task.updated_at) == today)
            .count()
        )
