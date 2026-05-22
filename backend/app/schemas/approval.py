from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserOut


class ApproveRequest(BaseModel):
    comment: str | None = None


class RejectRequest(BaseModel):
    reason: str


class ApprovalOut(BaseModel):
    id: int
    task_id: int
    decision: str
    comment: str | None
    step: int
    approver: UserOut
    decided_at: datetime

    model_config = {"from_attributes": True}
