from __future__ import annotations
import math
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ForbiddenError
from app.models.workflow import Workflow
from app.repositories.workflow_repository import WorkflowRepository
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate
from app.services.audit_service import AuditService


class WorkflowService:
    def __init__(self, db: Session):
        self.repo = WorkflowRepository(db)
        self.audit = AuditService(db)

    def create(self, data: WorkflowCreate, actor_id: int) -> Workflow:
        wf = Workflow(
            name=data.name,
            description=data.description,
            steps=[s.model_dump() for s in data.steps],
            status="DRAFT",
            created_by_id=actor_id,
        )
        wf = self.repo.create(wf)
        self.audit.log("workflow.created", "workflow", wf.id, actor_id=actor_id,
                       after_state={"name": wf.name, "status": wf.status})
        return wf

    def update(self, workflow_id: int, data: WorkflowUpdate, actor_id: int) -> Workflow:
        wf = self._get_or_404(workflow_id)
        if wf.status != "DRAFT":
            raise ConflictError("Only DRAFT workflows can be edited.")
        if data.name is not None:
            wf.name = data.name
        if data.description is not None:
            wf.description = data.description
        if data.steps is not None:
            wf.steps = [s.model_dump() for s in data.steps]
        return self.repo.save(wf)

    def publish(self, workflow_id: int, actor_id: int) -> Workflow:
        wf = self._get_or_404(workflow_id)
        if wf.status != "DRAFT":
            raise ConflictError(f"Workflow is already {wf.status}.")
        if not wf.steps:
            raise ConflictError("Cannot publish a workflow with no steps.")
        wf.status = "ACTIVE"
        wf = self.repo.save(wf)
        self.audit.log("workflow.published", "workflow", wf.id, actor_id=actor_id,
                       after_state={"status": "ACTIVE"})
        return wf

    def archive(self, workflow_id: int, actor_id: int) -> Workflow:
        wf = self._get_or_404(workflow_id)
        if wf.status == "ARCHIVED":
            raise ConflictError("Workflow is already archived.")
        wf.status = "ARCHIVED"
        wf = self.repo.save(wf)
        self.audit.log("workflow.archived", "workflow", wf.id, actor_id=actor_id)
        return wf

    def get(self, workflow_id: int) -> Workflow:
        return self._get_or_404(workflow_id)

    def list(self, page: int, limit: int, status: str | None = None) -> dict:
        skip = (page - 1) * limit
        items, total = self.repo.list(skip=skip, limit=limit, status=status)
        return {"items": items, "total": total, "page": page, "limit": limit,
                "pages": max(1, math.ceil(total / limit))}

    def _get_or_404(self, workflow_id: int) -> Workflow:
        wf = self.repo.get(workflow_id)
        if not wf:
            raise NotFoundError("Workflow", workflow_id)
        return wf
