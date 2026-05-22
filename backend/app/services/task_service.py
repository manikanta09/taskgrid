from __future__ import annotations
import math
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ForbiddenError, InvalidTransitionError
from app.models.task import Task
from app.models.task_assignment import TaskAssignment
from app.models.user import User
from app.repositories.task_repository import TaskRepository
from app.repositories.workflow_repository import WorkflowRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import AssignTaskRequest, SubmitTaskRequest, EscalateTaskRequest, TaskFilter
from app.schemas.workflow import TriggerWorkflowRequest
from app.services.audit_service import AuditService

# Maps current status → set of statuses it can move to
VALID_TRANSITIONS: dict[str, set[str]] = {
    "CREATED":          {"ASSIGNED", "CANCELLED"},
    "ASSIGNED":         {"IN_PROGRESS", "CANCELLED"},
    "IN_PROGRESS":      {"PENDING_APPROVAL", "COMPLETED", "ESCALATED", "CANCELLED"},
    "PENDING_APPROVAL": {"COMPLETED", "REJECTED", "ESCALATED"},
    "REJECTED":         {"IN_PROGRESS", "CANCELLED"},
    "ESCALATED":        {"ASSIGNED", "CANCELLED"},
    "COMPLETED":        set(),
    "CANCELLED":        set(),
}


class TaskService:
    def __init__(self, db: Session):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.user_repo = UserRepository(db)
        self.audit = AuditService(db)

    def trigger(self, workflow_id: int, data: TriggerWorkflowRequest, actor: User) -> Task:
        wf = self.workflow_repo.get(workflow_id)
        if not wf:
            raise NotFoundError("Workflow", workflow_id)
        if wf.status != "ACTIVE":
            raise ConflictError("Only ACTIVE workflows can be triggered.")

        first_step = wf.steps[0] if wf.steps else {}
        sla_hours = first_step.get("sla_hours")
        due_at = datetime.now(timezone.utc) + timedelta(hours=sla_hours) if sla_hours else None

        task = Task(
            title=data.title or f"{wf.name} — Task",
            workflow_id=workflow_id,
            current_step=1,
            status="CREATED",
            priority=data.priority,
            payload=data.payload,
            due_at=due_at,
            created_by_id=actor.id,
        )
        task = self.task_repo.create(task)
        self.audit.log("task.created", "task", task.id, actor_id=actor.id,
                       after_state={"status": "CREATED", "workflow_id": workflow_id})
        return task

    def assign(self, task_id: int, data: AssignTaskRequest, actor: User) -> Task:
        task = self._get_or_404(task_id)
        assignee = self.user_repo.get(data.user_id)
        if not assignee:
            raise NotFoundError("User", data.user_id)

        before = task.status
        self._transition(task, "ASSIGNED")
        self.task_repo.release_current_assignments(task_id)
        task.current_assignee_id = assignee.id

        assignment = TaskAssignment(
            task_id=task.id,
            user_id=assignee.id,
            assigned_by_id=actor.id,
            step=task.current_step,
            is_current=True,
        )
        self.db.add(assignment)
        task = self.task_repo.save(task)
        self.audit.log("task.assigned", "task", task.id, actor_id=actor.id,
                       before_state={"status": before},
                       after_state={"status": "ASSIGNED", "assignee_id": assignee.id})
        return task

    def claim(self, task_id: int, actor: User) -> Task:
        task = self._get_or_404(task_id)
        if task.status != "CREATED":
            raise ConflictError("Only CREATED tasks can be claimed.")
        if task.current_assignee_id:
            raise ConflictError("Task is already assigned.")

        task.current_assignee_id = actor.id
        task.status = "ASSIGNED"
        assignment = TaskAssignment(
            task_id=task.id, user_id=actor.id,
            assigned_by_id=actor.id, step=task.current_step, is_current=True,
        )
        self.db.add(assignment)
        task = self.task_repo.save(task)
        self.audit.log("task.claimed", "task", task.id, actor_id=actor.id,
                       after_state={"status": "ASSIGNED", "assignee_id": actor.id})
        return task

    def start(self, task_id: int, actor: User) -> Task:
        task = self._get_or_404(task_id)
        self._assert_assignee(task, actor)
        self._transition(task, "IN_PROGRESS")
        task = self.task_repo.save(task)
        self.audit.log("task.started", "task", task.id, actor_id=actor.id,
                       after_state={"status": "IN_PROGRESS"})
        return task

    def submit(self, task_id: int, data: SubmitTaskRequest, actor: User) -> Task:
        task = self._get_or_404(task_id)
        self._assert_assignee(task, actor)
        task.outcome_data = data.outcome_data
        self._transition(task, "PENDING_APPROVAL")
        task = self.task_repo.save(task)
        self.audit.log("task.submitted", "task", task.id, actor_id=actor.id,
                       after_state={"status": "PENDING_APPROVAL", "notes": data.notes})
        return task

    def complete(self, task_id: int, actor: User) -> Task:
        task = self._get_or_404(task_id)
        self._transition(task, "COMPLETED")
        task = self.task_repo.save(task)
        self.audit.log("task.completed", "task", task.id, actor_id=actor.id,
                       after_state={"status": "COMPLETED"})
        return task

    def escalate(self, task_id: int, data: EscalateTaskRequest, actor: User) -> Task:
        task = self._get_or_404(task_id)
        self._transition(task, "ESCALATED")
        task = self.task_repo.save(task)
        self.audit.log("task.escalated", "task", task.id, actor_id=actor.id,
                       after_state={"status": "ESCALATED", "reason": data.reason})
        return task

    def cancel(self, task_id: int, actor: User) -> Task:
        task = self._get_or_404(task_id)
        self._transition(task, "CANCELLED")
        task = self.task_repo.save(task)
        self.audit.log("task.cancelled", "task", task.id, actor_id=actor.id,
                       after_state={"status": "CANCELLED"})
        return task

    def get(self, task_id: int) -> Task:
        return self._get_or_404(task_id)

    def list(self, filters: TaskFilter) -> dict:
        items, total = self.task_repo.list(filters)
        return {"items": items, "total": total, "page": filters.page, "limit": filters.limit,
                "pages": max(1, math.ceil(total / filters.limit))}

    def get_timeline(self, task_id: int) -> list:
        self._get_or_404(task_id)
        return self.audit.get_entity_logs("task", task_id)

    def _get_or_404(self, task_id: int) -> Task:
        task = self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task", task_id)
        return task

    def _transition(self, task: Task, new_status: str):
        allowed = VALID_TRANSITIONS.get(task.status, set())
        if new_status not in allowed:
            raise InvalidTransitionError(task.status, new_status)
        task.status = new_status

    def _assert_assignee(self, task: Task, actor: User):
        if task.current_assignee_id != actor.id and actor.role not in ("manager", "admin"):
            raise ForbiddenError("You are not the current assignee of this task.")
