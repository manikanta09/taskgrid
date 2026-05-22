# TaskGrid — REST API Reference

Base URL: `/api/v1`
Auth: `Authorization: Bearer <access_token>` on all protected routes.

---

## Auth

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/login` | No | — | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Cookie | — | Rotate refresh token, get new access token |
| POST | `/auth/logout` | Yes | — | Invalidate refresh token |
| GET | `/auth/me` | Yes | — | Get current user profile |

### POST `/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 1, "email": "...", "full_name": "...", "role": "manager" }
}
```

---

## Users

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/users` | Yes | admin, manager | List all users (paginated) |
| POST | `/users` | Yes | admin | Create new user |
| GET | `/users/{id}` | Yes | admin, manager | Get user by ID |
| PATCH | `/users/{id}` | Yes | admin | Update user (name, role) |
| POST | `/users/{id}/deactivate` | Yes | admin | Deactivate user |
| POST | `/users/{id}/reactivate` | Yes | admin | Reactivate user |

### POST `/users`
```json
// Request
{ "email": "ops@co.com", "full_name": "Jane Ops", "role": "operator", "password": "temp123" }

// Response 201
{ "id": 5, "email": "ops@co.com", "full_name": "Jane Ops", "role": "operator", "is_active": true }
```

---

## Workflows

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/workflows` | Yes | all | List workflows (filter by status) |
| POST | `/workflows` | Yes | manager, admin | Create workflow definition |
| GET | `/workflows/{id}` | Yes | all | Get workflow with steps |
| PUT | `/workflows/{id}` | Yes | manager, admin | Update workflow (DRAFT only) |
| POST | `/workflows/{id}/publish` | Yes | manager, admin | Publish workflow (DRAFT → ACTIVE) |
| POST | `/workflows/{id}/archive` | Yes | admin | Archive workflow (ACTIVE → ARCHIVED) |
| POST | `/workflows/{id}/trigger` | Yes | manager, admin | Trigger new task instance |
| GET | `/workflows/{id}/tasks` | Yes | manager, admin | List tasks for this workflow |

### POST `/workflows`
```json
// Request
{
  "name": "Invoice Approval",
  "description": "Multi-step invoice review process",
  "steps": [
    { "step": 1, "name": "Data Verification", "assignee_role": "operator", "sla_hours": 24 },
    { "step": 2, "name": "Manager Approval",  "assignee_role": "manager",  "sla_hours": 8  },
    { "step": 3, "name": "Finance Sign-off",  "assignee_role": "admin",    "sla_hours": 4  }
  ]
}

// Response 201
{ "id": 3, "name": "Invoice Approval", "status": "DRAFT", "steps": [...], "created_by": {...} }
```

### POST `/workflows/{id}/trigger`
```json
// Request
{
  "title": "Invoice #INV-2024-001",
  "priority": "high",
  "payload": { "invoice_id": "INV-2024-001", "amount": 45000, "vendor": "Acme Corp" }
}

// Response 201
{ "task_id": 42, "status": "CREATED", "workflow": {...} }
```

---

## Tasks

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/tasks` | Yes | all | List tasks (filterable) |
| GET | `/tasks/mine` | Yes | all | Tasks assigned to current user |
| GET | `/tasks/{id}` | Yes | all | Get task detail |
| POST | `/tasks/{id}/assign` | Yes | manager, admin | Assign task to user |
| POST | `/tasks/{id}/claim` | Yes | operator+ | Claim unassigned task |
| POST | `/tasks/{id}/start` | Yes | operator+ | Start working on task |
| POST | `/tasks/{id}/submit` | Yes | operator+ | Submit task for approval |
| POST | `/tasks/{id}/complete` | Yes | operator+ | Complete task (no approval needed) |
| POST | `/tasks/{id}/escalate` | Yes | operator+ | Escalate task |
| POST | `/tasks/{id}/cancel` | Yes | admin, manager | Cancel task |
| GET | `/tasks/{id}/timeline` | Yes | all | Get full state change history |

### GET `/tasks` Query Parameters
```
status      = CREATED|ASSIGNED|IN_PROGRESS|PENDING_APPROVAL|COMPLETED|REJECTED|ESCALATED|CANCELLED
workflow_id = integer
assignee_id = integer
priority    = low|medium|high|critical
page        = integer (default: 1)
limit       = integer (default: 20, max: 100)
sort_by     = created_at|updated_at|due_at
sort_dir    = asc|desc
```

### POST `/tasks/{id}/submit`
```json
// Request
{
  "outcome": "completed",
  "notes": "Verified all line items. Amounts match PO.",
  "outcome_data": { "verified": true, "discrepancies": [] }
}
```

### POST `/tasks/{id}/assign`
```json
// Request
{ "user_id": 7 }
```

---

## Approvals

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/approvals/pending` | Yes | manager, admin | Tasks pending my approval |
| POST | `/approvals/{task_id}/approve` | Yes | manager, admin | Approve a task |
| POST | `/approvals/{task_id}/reject` | Yes | manager, admin | Reject a task |
| GET | `/approvals/{task_id}/history` | Yes | all | Approval history for task |

### POST `/approvals/{task_id}/approve`
```json
// Request
{ "comment": "All checks passed. Approved for processing." }

// Response 200
{ "id": 12, "decision": "APPROVED", "task_id": 42, "approver": {...}, "decided_at": "..." }
```

### POST `/approvals/{task_id}/reject`
```json
// Request
{ "reason": "Line item 3 does not match the purchase order. Please correct and resubmit." }
```

---

## Admin

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/admin/stats` | Yes | admin | System-wide counts and metrics |
| GET | `/admin/audit-logs` | Yes | admin | Paginated audit log |
| POST | `/admin/tasks/bulk-reassign` | Yes | admin | Reassign multiple tasks |

### GET `/admin/stats` Response
```json
{
  "tasks": {
    "total": 142,
    "created": 12,
    "in_progress": 34,
    "pending_approval": 8,
    "completed_today": 19,
    "escalated": 3
  },
  "workflows": { "active": 7, "draft": 2, "archived": 4 },
  "users": { "total": 23, "active": 21 }
}
```

---

## Pagination Envelope

All list endpoints return:
```json
{
  "items": [...],
  "total": 142,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

## Error Envelope

All errors return:
```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with id 99 not found.",
    "status": 404
  }
}
```
