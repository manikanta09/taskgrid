from __future__ import annotations
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ConflictError
from app.models.approval import Approval
from app.models.task import Task
from app.models.user import User
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.approval import ApproveRequest, RejectRequest
from app.services.audit_service import AuditService


class ApprovalService:
    def __init__(self, db: Session):
        self.db = db
        self.approval_repo = ApprovalRepository(db)
        self.task_repo = TaskRepository(db)
        self.audit = AuditService(db)

    def approve(self, task_id: int, data: ApproveRequest, actor: User) -> Approval:
        task = self._get_pending_task(task_id)
        approval = Approval(
            task_id=task.id,
            approver_id=actor.id,
            decision="APPROVED",
            comment=data.comment,
            step=task.current_step,
        )
        approval = self.approval_repo.create(approval)

        task.status = "COMPLETED"
        self.task_repo.save(task)
        self.audit.log("task.approved", "task", task.id, actor_id=actor.id,
                       before_state={"status": "PENDING_APPROVAL"},
                       after_state={"status": "COMPLETED", "approval_id": approval.id})
        return approval

    def reject(self, task_id: int, data: RejectRequest, actor: User) -> Approval:
        task = self._get_pending_task(task_id)
        approval = Approval(
            task_id=task.id,
            approver_id=actor.id,
            decision="REJECTED",
            comment=data.reason,
            step=task.current_step,
        )
        approval = self.approval_repo.create(approval)

        task.status = "REJECTED"
        self.task_repo.save(task)
        self.audit.log("task.rejected", "task", task.id, actor_id=actor.id,
                       before_state={"status": "PENDING_APPROVAL"},
                       after_state={"status": "REJECTED", "reason": data.reason})
        return approval

    def get_pending_for_user(self, actor: User) -> list[Task]:
        return self.approval_repo.get_pending_for_user(actor.id)

    def get_history(self, task_id: int) -> list[Approval]:
        task = self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task", task_id)
        return self.approval_repo.get_by_task(task_id)

    def _get_pending_task(self, task_id: int) -> Task:
        task = self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task", task_id)
        if task.status != "PENDING_APPROVAL":
            raise ConflictError(f"Task is not pending approval (current status: {task.status}).")
        return task
