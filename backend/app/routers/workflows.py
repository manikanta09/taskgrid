from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowOut, WorkflowListOut, TriggerWorkflowRequest
from app.schemas.task import TaskListOut, TaskFilter
from app.services.workflow_service import WorkflowService
from app.services.task_service import TaskService

router = APIRouter()


def _wf_svc(db: Session = Depends(get_db)) -> WorkflowService:
    return WorkflowService(db)


def _task_svc(db: Session = Depends(get_db)) -> TaskService:
    return TaskService(db)


@router.get("", response_model=WorkflowListOut)
def list_workflows(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = None,
    _: User = Depends(get_current_user),
    svc: WorkflowService = Depends(_wf_svc),
):
    return svc.list(page=page, limit=limit, status=status)


@router.post("", response_model=WorkflowOut, status_code=201)
def create_workflow(
    body: WorkflowCreate,
    current_user: User = Depends(require_role("manager", "admin")),
    svc: WorkflowService = Depends(_wf_svc),
):
    return svc.create(body, actor_id=current_user.id)


@router.get("/{workflow_id}", response_model=WorkflowOut)
def get_workflow(
    workflow_id: int,
    _: User = Depends(get_current_user),
    svc: WorkflowService = Depends(_wf_svc),
):
    return svc.get(workflow_id)


@router.put("/{workflow_id}", response_model=WorkflowOut)
def update_workflow(
    workflow_id: int,
    body: WorkflowUpdate,
    current_user: User = Depends(require_role("manager", "admin")),
    svc: WorkflowService = Depends(_wf_svc),
):
    return svc.update(workflow_id, body, actor_id=current_user.id)


@router.post("/{workflow_id}/publish", response_model=WorkflowOut)
def publish_workflow(
    workflow_id: int,
    current_user: User = Depends(require_role("manager", "admin")),
    svc: WorkflowService = Depends(_wf_svc),
):
    return svc.publish(workflow_id, actor_id=current_user.id)


@router.post("/{workflow_id}/archive", response_model=WorkflowOut)
def archive_workflow(
    workflow_id: int,
    current_user: User = Depends(require_role("admin")),
    svc: WorkflowService = Depends(_wf_svc),
):
    return svc.archive(workflow_id, actor_id=current_user.id)


@router.post("/{workflow_id}/trigger", status_code=201)
def trigger_workflow(
    workflow_id: int,
    body: TriggerWorkflowRequest,
    current_user: User = Depends(require_role("manager", "admin")),
    task_svc: TaskService = Depends(_task_svc),
):
    task = task_svc.trigger(workflow_id, body, actor=current_user)
    return {"task_id": task.id, "status": task.status, "workflow_id": workflow_id}


@router.get("/{workflow_id}/tasks", response_model=TaskListOut)
def list_workflow_tasks(
    workflow_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: User = Depends(require_role("manager", "admin")),
    task_svc: TaskService = Depends(_task_svc),
):
    filters = TaskFilter(workflow_id=workflow_id, page=page, limit=limit)
    return task_svc.list(filters)
