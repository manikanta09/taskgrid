from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import Any, Literal
from app.schemas.user import UserOut
from app.schemas.workflow import WorkflowOut


TaskStatus = Literal[
    "CREATED", "ASSIGNED", "IN_PROGRESS",
    "PENDING_APPROVAL", "COMPLETED", "REJECTED",
    "ESCALATED", "CANCELLED",
]
TaskPriority = Literal["low", "medium", "high", "critical"]


class AssignTaskRequest(BaseModel):
    user_id: int


class SubmitTaskRequest(BaseModel):
    outcome: str
    notes: str | None = None
    outcome_data: dict[str, Any] | None = None


class EscalateTaskRequest(BaseModel):
    reason: str


class TaskOut(BaseModel):
    id: int
    title: str
    workflow_id: int
    current_step: int
    status: str
    priority: str
    payload: dict[str, Any] | None
    outcome_data: dict[str, Any] | None
    due_at: datetime | None
    created_by: UserOut
    current_assignee: UserOut | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskWithWorkflowOut(TaskOut):
    workflow: WorkflowOut


class TaskListOut(BaseModel):
    items: list[TaskOut]
    total: int
    page: int
    limit: int
    pages: int


class TaskFilter(BaseModel):
    status: TaskStatus | None = None
    workflow_id: int | None = None
    assignee_id: int | None = None
    priority: TaskPriority | None = None
    page: int = 1
    limit: int = 20
    sort_by: Literal["created_at", "updated_at", "due_at"] = "created_at"
    sort_dir: Literal["asc", "desc"] = "desc"
