from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.approval import ApproveRequest, RejectRequest, ApprovalOut
from app.schemas.task import TaskOut
from app.services.approval_service import ApprovalService

router = APIRouter()


def _svc(db: Session = Depends(get_db)) -> ApprovalService:
    return ApprovalService(db)


@router.get("/pending", response_model=list[TaskOut])
def pending_approvals(
    current_user: User = Depends(require_role("manager", "admin")),
    svc: ApprovalService = Depends(_svc),
):
    return svc.get_pending_for_user(current_user)


@router.post("/{task_id}/approve", response_model=ApprovalOut)
def approve_task(
    task_id: int,
    body: ApproveRequest,
    current_user: User = Depends(require_role("manager", "admin")),
    svc: ApprovalService = Depends(_svc),
):
    return svc.approve(task_id, body, actor=current_user)


@router.post("/{task_id}/reject", response_model=ApprovalOut)
def reject_task(
    task_id: int,
    body: RejectRequest,
    current_user: User = Depends(require_role("manager", "admin")),
    svc: ApprovalService = Depends(_svc),
):
    return svc.reject(task_id, body, actor=current_user)


@router.get("/{task_id}/history", response_model=list[ApprovalOut])
def approval_history(
    task_id: int,
    _: User = Depends(get_current_user),
    svc: ApprovalService = Depends(_svc),
):
    return svc.get_history(task_id)
