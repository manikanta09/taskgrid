from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.repositories.task_repository import TaskRepository
from app.repositories.workflow_repository import WorkflowRepository
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.services.task_service import TaskService
from app.schemas.task import AssignTaskRequest, TaskOut

router = APIRouter()


@router.get("/stats")
def system_stats(
    _: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    task_counts = TaskRepository(db).count_by_status()
    wf_counts = WorkflowRepository(db).count_by_status()
    users_all, _ = UserRepository(db).list(limit=10000)
    completed_today = TaskRepository(db).count_completed_today()

    return {
        "tasks": {
            "total": sum(task_counts.values()),
            "created": task_counts.get("CREATED", 0),
            "assigned": task_counts.get("ASSIGNED", 0),
            "in_progress": task_counts.get("IN_PROGRESS", 0),
            "pending_approval": task_counts.get("PENDING_APPROVAL", 0),
            "completed": task_counts.get("COMPLETED", 0),
            "completed_today": completed_today,
            "escalated": task_counts.get("ESCALATED", 0),
            "rejected": task_counts.get("REJECTED", 0),
            "cancelled": task_counts.get("CANCELLED", 0),
        },
        "workflows": {
            "total": sum(wf_counts.values()),
            "active": wf_counts.get("ACTIVE", 0),
            "draft": wf_counts.get("DRAFT", 0),
            "archived": wf_counts.get("ARCHIVED", 0),
        },
        "users": {
            "total": len(users_all),
            "active": sum(1 for u in users_all if u.is_active),
        },
    }


@router.get("/audit-logs")
def audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    entity_type: str | None = None,
    _: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    import math
    svc = AuditService(db)
    skip = (page - 1) * limit
    items, total = svc.get_all(skip=skip, limit=limit, entity_type=entity_type)
    return {
        "items": [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "before_state": log.before_state,
                "after_state": log.after_state,
                "created_at": log.created_at,
            }
            for log in items
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit)),
    }


class BulkReassignRequest(BaseModel):
    task_ids: list[int]
    user_id: int


@router.post("/tasks/bulk-reassign")
def bulk_reassign(
    body: BulkReassignRequest,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    svc = TaskService(db)
    results = []
    for task_id in body.task_ids:
        try:
            task = svc.assign(task_id, AssignTaskRequest(user_id=body.user_id), actor=current_user)
            results.append({"task_id": task_id, "status": "reassigned"})
        except Exception as e:
            results.append({"task_id": task_id, "status": "error", "message": str(e)})
    return {"results": results}
