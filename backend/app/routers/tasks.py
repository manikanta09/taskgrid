from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.task import (
    AssignTaskRequest, SubmitTaskRequest, EscalateTaskRequest,
    TaskOut, TaskListOut, TaskFilter,
)
from app.services.task_service import TaskService

router = APIRouter()


def _svc(db: Session = Depends(get_db)) -> TaskService:
    return TaskService(db)


@router.get("", response_model=TaskListOut)
def list_tasks(
    status: str | None = None,
    workflow_id: int | None = None,
    assignee_id: int | None = None,
    priority: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    _: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    filters = TaskFilter(
        status=status, workflow_id=workflow_id, assignee_id=assignee_id,
        priority=priority, page=page, limit=limit, sort_by=sort_by, sort_dir=sort_dir,
    )
    return svc.list(filters)


@router.get("/mine", response_model=TaskListOut)
def my_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = None,
    current_user: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    filters = TaskFilter(assignee_id=current_user.id, page=page, limit=limit, status=status)
    return svc.list(filters)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    _: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    return svc.get(task_id)


@router.post("/{task_id}/assign", response_model=TaskOut)
def assign_task(
    task_id: int,
    body: AssignTaskRequest,
    current_user: User = Depends(require_role("manager", "admin")),
    svc: TaskService = Depends(_svc),
):
    return svc.assign(task_id, body, actor=current_user)


@router.post("/{task_id}/claim", response_model=TaskOut)
def claim_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    return svc.claim(task_id, actor=current_user)


@router.post("/{task_id}/start", response_model=TaskOut)
def start_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    return svc.start(task_id, actor=current_user)


@router.post("/{task_id}/submit", response_model=TaskOut)
def submit_task(
    task_id: int,
    body: SubmitTaskRequest,
    current_user: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    return svc.submit(task_id, body, actor=current_user)


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    return svc.complete(task_id, actor=current_user)


@router.post("/{task_id}/escalate", response_model=TaskOut)
def escalate_task(
    task_id: int,
    body: EscalateTaskRequest,
    current_user: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    return svc.escalate(task_id, body, actor=current_user)


@router.post("/{task_id}/cancel", response_model=TaskOut)
def cancel_task(
    task_id: int,
    current_user: User = Depends(require_role("admin", "manager")),
    svc: TaskService = Depends(_svc),
):
    return svc.cancel(task_id, actor=current_user)


@router.get("/{task_id}/timeline")
def task_timeline(
    task_id: int,
    _: User = Depends(get_current_user),
    svc: TaskService = Depends(_svc),
):
    logs = svc.get_timeline(task_id)
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_id": log.actor_id,
            "before_state": log.before_state,
            "after_state": log.after_state,
            "created_at": log.created_at,
        }
        for log in logs
    ]
