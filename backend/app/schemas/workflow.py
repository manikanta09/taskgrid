from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import Any, Literal
from app.schemas.user import UserOut


WorkflowStatus = Literal["DRAFT", "ACTIVE", "ARCHIVED"]


class WorkflowStep(BaseModel):
    step: int
    name: str
    assignee_role: str
    sla_hours: int | None = None
    instructions: str | None = None


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    steps: list[WorkflowStep]


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    steps: list[WorkflowStep] | None = None


class WorkflowOut(BaseModel):
    id: int
    name: str
    description: str | None
    status: str
    steps: list[dict[str, Any]]
    created_by: UserOut
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowListOut(BaseModel):
    items: list[WorkflowOut]
    total: int
    page: int
    limit: int
    pages: int


class TriggerWorkflowRequest(BaseModel):
    title: str | None = None
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    payload: dict[str, Any] | None = None
