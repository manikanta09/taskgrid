# TaskGrid — Database Schema

## Entity Relationship Diagram

```
users
  │
  ├──< tasks (created_by)
  ├──< task_assignments (user_id)
  ├──< approvals (approver_id)
  └──< audit_logs (actor_id)

workflows
  │
  ├──< tasks (workflow_id)
  └── steps: JSON column (inline, no separate table for MVP)

tasks
  │
  ├──< task_assignments (task_id)
  ├──< approvals (task_id)
  └──< audit_logs (entity_id where entity_type='task')
```

---

## Tables

### `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | |
| role | VARCHAR(50) | NOT NULL | admin / manager / operator / viewer |
| is_active | BOOLEAN | DEFAULT TRUE | soft delete |
| last_login_at | DATETIME | NULLABLE | |
| created_at | DATETIME | DEFAULT NOW | |
| updated_at | DATETIME | DEFAULT NOW, onupdate | |

**Indexes:** `email` (unique), `role`

---

### `workflows`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| name | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULLABLE | |
| status | VARCHAR(50) | NOT NULL | DRAFT / ACTIVE / ARCHIVED |
| steps | JSON | NOT NULL | Ordered array of step configs |
| created_by_id | INTEGER | FK → users.id | |
| created_at | DATETIME | DEFAULT NOW | |
| updated_at | DATETIME | DEFAULT NOW, onupdate | |

**steps JSON structure:**
```json
[
  {
    "step": 1,
    "name": "Data Entry",
    "assignee_role": "operator",
    "sla_hours": 24,
    "instructions": "Fill in the required form fields."
  }
]
```

**Indexes:** `status`, `created_by_id`

---

### `tasks`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| title | VARCHAR(255) | NOT NULL | Auto-generated or custom |
| workflow_id | INTEGER | FK → workflows.id | |
| current_step | INTEGER | NOT NULL, DEFAULT 1 | Step index |
| status | VARCHAR(50) | NOT NULL | See state machine |
| priority | VARCHAR(20) | DEFAULT 'medium' | low / medium / high / critical |
| payload | JSON | NULLABLE | Business data for this task instance |
| outcome_data | JSON | NULLABLE | Submitted result data |
| due_at | DATETIME | NULLABLE | SLA deadline |
| created_by_id | INTEGER | FK → users.id | Workflow trigger actor |
| current_assignee_id | INTEGER | FK → users.id, NULLABLE | Denormalized for fast queue queries |
| created_at | DATETIME | DEFAULT NOW | |
| updated_at | DATETIME | DEFAULT NOW, onupdate | |

**Status values:** `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_APPROVAL`, `COMPLETED`, `REJECTED`, `ESCALATED`, `CANCELLED`

**Indexes:** `status`, `workflow_id`, `current_assignee_id`, `created_at`

---

### `task_assignments`

Tracks full assignment history (not just current assignee).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| task_id | INTEGER | FK → tasks.id | |
| user_id | INTEGER | FK → users.id | |
| assigned_by_id | INTEGER | FK → users.id | |
| step | INTEGER | NOT NULL | Which workflow step |
| is_current | BOOLEAN | DEFAULT TRUE | Only one TRUE per task at a time |
| assigned_at | DATETIME | DEFAULT NOW | |
| released_at | DATETIME | NULLABLE | When reassigned or completed |

**Indexes:** `task_id`, `user_id`, `is_current`

---

### `approvals`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| task_id | INTEGER | FK → tasks.id | |
| approver_id | INTEGER | FK → users.id | |
| decision | VARCHAR(20) | NOT NULL | APPROVED / REJECTED |
| comment | TEXT | NULLABLE | |
| step | INTEGER | NOT NULL | Which workflow step this approval is for |
| decided_at | DATETIME | DEFAULT NOW | |

**Indexes:** `task_id`, `approver_id`

---

### `audit_logs`

Immutable append-only log of all system events.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| actor_id | INTEGER | FK → users.id, NULLABLE | NULL for system events |
| action | VARCHAR(100) | NOT NULL | e.g. `task.status_changed` |
| entity_type | VARCHAR(50) | NOT NULL | task / workflow / user |
| entity_id | INTEGER | NOT NULL | FK (logical) to entity |
| before_state | JSON | NULLABLE | Snapshot before change |
| after_state | JSON | NULLABLE | Snapshot after change |
| metadata | JSON | NULLABLE | Extra context |
| created_at | DATETIME | DEFAULT NOW | |

**Action vocabulary:**
```
auth.login
auth.logout
user.created
user.role_changed
user.deactivated
workflow.created
workflow.published
workflow.archived
task.created
task.assigned
task.claimed
task.started
task.submitted
task.approved
task.rejected
task.escalated
task.cancelled
task.completed
```

**Indexes:** `entity_type + entity_id`, `actor_id`, `created_at`

---

## Alembic Migration Strategy

Even though the MVP uses SQLite, all schema changes go through Alembic migrations:

```
alembic/versions/
  001_create_users.py
  002_create_workflows.py
  003_create_tasks.py
  004_create_task_assignments.py
  005_create_approvals.py
  006_create_audit_logs.py
  007_seed_admin_user.py
```

This makes the Postgres migration a config change, not a re-migration.
