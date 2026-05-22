# TaskGrid — Backend Modules

## Module Map

```
app/
├── routers/      ← HTTP interface (thin, no logic)
├── services/     ← Business logic
├── repositories/ ← DB queries
├── models/       ← ORM entities
├── schemas/      ← Pydantic I/O
└── core/         ← Auth, RBAC, deps
```

---

## 1. Auth Module

**Files:** `routers/auth.py`, `services/auth_service.py`, `core/security.py`

**Responsibilities:**
- User login with email/password
- JWT access token issuance (15-min expiry)
- JWT refresh token rotation (7-day expiry)
- Password hashing with bcrypt
- Token revocation on logout

**Key Functions:**
```python
# auth_service.py
authenticate_user(email, password) -> User | None
create_access_token(user_id, role) -> str
create_refresh_token(user_id) -> str
verify_token(token) -> TokenPayload
```

---

## 2. User Module

**Files:** `routers/users.py`, `services/user_service.py`, `repositories/user_repository.py`

**Responsibilities:**
- CRUD for user accounts
- Role assignment (`admin`, `manager`, `operator`, `viewer`)
- User profile management
- List users with pagination

**Key Functions:**
```python
# user_service.py
create_user(data: UserCreate) -> User
update_user_role(user_id, role) -> User
list_users(skip, limit) -> list[User]
deactivate_user(user_id) -> User
```

---

## 3. Workflow Module

**Files:** `routers/workflows.py`, `services/workflow_service.py`, `repositories/workflow_repository.py`

**Responsibilities:**
- Create and manage workflow definitions
- Define steps as ordered JSON config
- Publish (activate) or archive workflows
- Trigger workflow instances (creates tasks)

**Workflow Definition Schema (steps field):**
```json
[
  { "step": 1, "name": "Data Entry",     "assignee_role": "operator" },
  { "step": 2, "name": "Manager Review", "assignee_role": "manager"  },
  { "step": 3, "name": "Final Approval", "assignee_role": "admin"    }
]
```

**Key Functions:**
```python
# workflow_service.py
create_workflow(data: WorkflowCreate) -> Workflow
publish_workflow(workflow_id) -> Workflow
trigger_workflow(workflow_id, payload) -> Task
archive_workflow(workflow_id) -> Workflow
```

---

## 4. Task Module

**Files:** `routers/tasks.py`, `services/task_service.py`, `repositories/task_repository.py`

**Responsibilities:**
- Task creation from workflow trigger
- Task queue listing with filters (status, assignee, workflow)
- Claim unassigned tasks
- Submit task outcome (approve/reject/complete)
- Task reassignment
- Step progression through workflow

**Status Transitions (enforced in service):**
```
CREATED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
                                 → REJECTED
                                 → ESCALATED
                    → CANCELLED
```

**Key Functions:**
```python
# task_service.py
create_task(workflow_id, payload) -> Task
assign_task(task_id, user_id) -> Task
claim_task(task_id, current_user) -> Task
start_task(task_id, current_user) -> Task
submit_task(task_id, outcome, data) -> Task
escalate_task(task_id, reason) -> Task
list_tasks(filters: TaskFilter) -> PaginatedResult[Task]
get_task_timeline(task_id) -> list[AuditLog]
```

---

## 5. Approval Module

**Files:** `routers/approvals.py`, `services/approval_service.py`, `repositories/approval_repository.py`

**Responsibilities:**
- Record approval/rejection decisions
- Multi-level approval chains
- Approval inbox per user (tasks awaiting their decision)
- Rejection reason capture
- Escalation on timeout (stub for MVP)

**Key Functions:**
```python
# approval_service.py
approve_task(task_id, approver_id, comment) -> Approval
reject_task(task_id, approver_id, reason) -> Approval
get_pending_approvals(user_id) -> list[Task]
get_approval_history(task_id) -> list[Approval]
```

---

## 6. Admin Module

**Files:** `routers/admin.py`

**Responsibilities:**
- System stats (total tasks, active workflows, user count)
- Audit log viewer (all system events)
- User management shortcuts
- Bulk task operations

**Key Endpoints (admin-only):**
```
GET  /api/v1/admin/stats
GET  /api/v1/admin/audit-logs
POST /api/v1/admin/users/{id}/deactivate
POST /api/v1/admin/tasks/bulk-reassign
```

---

## 7. Core Services

### `core/security.py`
- `hash_password(plain)` → bcrypt hash
- `verify_password(plain, hashed)` → bool
- `create_jwt(payload, expiry)` → signed JWT string
- `decode_jwt(token)` → payload dict

### `core/dependencies.py`
- `get_db()` → SQLAlchemy session (per-request)
- `get_current_user(token)` → User model
- `require_role(*roles)` → dependency factory for RBAC

### `core/permissions.py`
```python
ROLE_PERMISSIONS = {
    "admin":    ["*"],
    "manager":  ["workflow:*", "task:*", "user:read"],
    "operator": ["task:read", "task:claim", "task:submit"],
    "viewer":   ["task:read", "workflow:read"],
}
```

### `core/exceptions.py`
- `NotFoundError(404)`
- `ForbiddenError(403)`
- `ConflictError(409)`
- `ValidationError(422)` — extends FastAPI default

---

## Dependency Injection Pattern

```python
# routers/tasks.py
@router.post("/{task_id}/approve")
async def approve_task(
    task_id: int,
    body: ApprovalRequest,
    current_user: User = Depends(require_role("manager", "admin")),
    db: Session = Depends(get_db),
    task_service: TaskService = Depends(get_task_service),
):
    return task_service.approve(task_id, current_user, body)
```

The router stays thin. All business logic lives in the service.
