# TaskGrid — Features Reference Document
**Version 1.0** · Generated May 2026 · Use this as baseline for V2 roadmap planning

---

## Table of Contents
1. [Authentication & Sessions](#1-authentication--sessions)
2. [Role-Based Access Control](#2-role-based-access-control)
3. [Task Management](#3-task-management)
4. [Task State Machine](#4-task-state-machine)
5. [Workflow Engine](#5-workflow-engine)
6. [Approval System](#6-approval-system)
7. [User Management](#7-user-management)
8. [Audit Logging](#8-audit-logging)
9. [Analytics & Dashboard](#9-analytics--dashboard)
10. [AI Operational Intelligence](#10-ai-operational-intelligence)
11. [Admin Panel](#11-admin-panel)
12. [API Surface](#12-api-surface)
13. [Frontend & UX](#13-frontend--ux)
14. [Infrastructure & Config](#14-infrastructure--config)
15. [Data Models](#15-data-models)

---

## 1. Authentication & Sessions

| Feature | Detail |
|---|---|
| Email + password login | POST `/api/v1/auth/login` |
| JWT access tokens | Short-lived Bearer token, stored in `localStorage` |
| Refresh token | Long-lived `HttpOnly` cookie (`refresh_token`) |
| Silent token refresh | Axios interceptor retries 401 responses once with `/auth/refresh` |
| Logout | POST `/api/v1/auth/logout` — invalidates session |
| Current user | GET `/api/v1/auth/me` |
| Last login tracking | `last_login_at` timestamp updated on every successful login |
| Auth state persistence | Zustand store (`tg_auth`) persisted to `localStorage` |
| Redirect on expiry | Redirects to `/login` when refresh also fails |

---

## 2. Role-Based Access Control

Four roles in strict hierarchy: `viewer < operator < manager < admin`

| Role | Capabilities |
|---|---|
| **viewer** | Read-only access to tasks and workflows |
| **operator** | Claim tasks, start tasks, submit for approval, escalate |
| **manager** | All operator actions + assign, complete, approve, reject, cancel, create workflows, trigger tasks |
| **admin** | All manager actions + user management, archive workflows, bulk reassign, audit logs, system stats |

Enforced at:
- Backend via `require_role()` FastAPI dependency on every router
- Frontend via conditional rendering of action buttons per role + status

---

## 3. Task Management

### Task Creation
- Tasks are **only created by triggering a workflow** (not created standalone)
- Trigger accepts: optional custom title, priority (`low / medium / high / critical`), arbitrary payload JSONB

### Task Listing & Filtering
- List all tasks with filters: `status`, `workflow_id`, `assignee_id`, `priority`
- Separate "My Tasks" endpoint for the logged-in user's assignments
- Pagination (configurable `limit` / `page`)
- Sortable by `created_at`, `updated_at`, `priority`
- Full-text search by title (frontend, client-side on loaded page)

### Task Actions (role + status gated)

| Action | Who | Allowed When |
|---|---|---|
| **Claim** | operator/manager/admin | Status = CREATED (unassigned) |
| **Assign** | manager/admin | Any time (forced assignment) |
| **Start** | current assignee | Status = ASSIGNED |
| **Submit for Approval** | current assignee | Status = IN_PROGRESS |
| **Complete** | manager/admin | Status = PENDING_APPROVAL |
| **Approve** | manager/admin | Status = PENDING_APPROVAL |
| **Reject** | manager/admin | Status = PENDING_APPROVAL → back to IN_PROGRESS |
| **Escalate** | any authenticated | Status = IN_PROGRESS or PENDING_APPROVAL |
| **Cancel** | manager/admin | Any non-terminal status |

### Task Detail
- Full metadata: workflow name, current step, assignee, creator, created date, updated date, priority, status
- Outcome data (JSONB) stored on completion
- Submission notes stored
- Assignment history via `TaskAssignment` records

### Activity Timeline
- Full chronological audit trail per task
- Each entry: action, actor, before/after state diff, timestamp
- Displayed with icons and relative time on task detail page

---

## 4. Task State Machine

```
CREATED ──────────────────────────────────── CANCELLED
   │
   ▼
ASSIGNED ─────────────────────────────────── CANCELLED
   │
   ▼
IN_PROGRESS ──────────────────────────────── CANCELLED
   │                    │
   ▼                    ▼
PENDING_APPROVAL    ESCALATED ──── ASSIGNED (re-enters queue)
   │          │
   ▼          ▼
COMPLETED   REJECTED ──── IN_PROGRESS (rework loop)
```

- All transitions validated server-side via `VALID_TRANSITIONS` map
- Invalid transitions return HTTP 422 with `InvalidTransitionError`
- Every transition is audit-logged with full before/after state snapshot

---

## 5. Workflow Engine

### Workflow Definition
- Name, description, status (`DRAFT / ACTIVE / ARCHIVED`)
- Steps stored as JSONB array — each step has:
  - Step number (ordering)
  - Step name
  - Assignee role (which role handles this step)
  - SLA hours (optional deadline per step)
  - Instructions (optional text guidance for assignee)
  - Requires approval flag (boolean)

### Workflow Lifecycle

| Status | Description |
|---|---|
| **DRAFT** | Being built, not yet usable. Can be edited. |
| **ACTIVE** | Published, can be triggered to create tasks |
| **ARCHIVED** | Retired, no new tasks can be triggered |

- DRAFT → ACTIVE: via Publish (requires at least one step)
- ACTIVE → ARCHIVED: via Archive (admin only)
- DRAFT-only editing: updates blocked once published

### Workflow Builder (Frontend)
- No-code step builder UI at `/workflows/new`
- Add / remove steps dynamically
- Per-step form: name, assignee role (dropdown), SLA hours, instructions, approval toggle
- Validates all step names before submit

### Workflow Triggering
- Manager/admin triggers a workflow → creates a Task instance
- Optional override: custom title, priority, payload
- Returns `task_id` immediately; frontend navigates to task queue

### Workflow Task Listing
- Each workflow has a "Task Instances" view — all tasks spawned from it
- Shows: task title, assignee, status, priority, last updated

---

## 6. Approval System

- Tasks reach `PENDING_APPROVAL` when submitted by the operator
- Manager/admin sees all pending approvals in the **Approval Inbox** (`/approvals`)
- Approval inbox auto-refreshes every 15 seconds
- Per-task actions:
  - **Approve** → task moves to `COMPLETED` (with optional comment)
  - **Reject** → task moves back to `IN_PROGRESS` for rework (reason required)
- Full approval history stored per task (step number, approver, decision, comment, timestamp)
- History accessible via task detail page

---

## 7. User Management

### User Accounts
- Fields: email (unique), full name, role, active status, last login, created date
- Passwords stored as bcrypt hashes

### Admin Capabilities
| Action | Endpoint |
|---|---|
| List all users | GET `/users` (with role filter, pagination) |
| Create user | POST `/users` (admin only) |
| Update user | PATCH `/users/{id}` — name, role |
| Deactivate | POST `/users/{id}/deactivate` — blocks login |
| Reactivate | POST `/users/{id}/reactivate` — restores access |
| Get single user | GET `/users/{id}` |

### Demo Seed Users (after `seed_demo.py`)
| Email | Role |
|---|---|
| admin@taskgrid.io | admin |
| manager@taskgrid.io | manager |
| ops1@taskgrid.io | operator |
| ops2@taskgrid.io | operator |
| viewer@taskgrid.io | viewer |

---

## 8. Audit Logging

- **Every meaningful state change** is logged automatically via `AuditService.log()`
- Log entry fields: actor (user), action name, entity type, entity ID, before state (JSONB), after state (JSONB), metadata, timestamp
- Indexed on: `(entity_type, entity_id)` and `created_at`
- Admin can query audit logs filtered by entity type: `task / workflow / user / approval`
- Paginated (50 per page default)
- Displayed in Admin Panel with status-change diff visualization (before → after badges)

---

## 9. Analytics & Dashboard

### Live Metric Cards (auto-refresh 30s)
| Metric | Source |
|---|---|
| Open Tasks | `tasks.created + tasks.assigned` |
| In Progress | `tasks.in_progress` |
| Pending Approval | `tasks.pending_approval` |
| Completed Today | `tasks.completed_today` (last 24h) |

### Charts
| Chart | Type | Data |
|---|---|---|
| Weekly Throughput | Area chart (recharts) | Completed vs Escalated — 7 days (mock static) |
| Status Distribution | Donut / Pie chart | Live task counts per status |

### Admin Stats Object
Full breakdown via `GET /admin/stats`:
- Tasks: total, created, assigned, in_progress, pending_approval, completed, completed_today, escalated, rejected, cancelled
- Workflows: total, active, draft, archived
- Users: total, active

---

## 10. AI Operational Intelligence

Computed client-side from live stats — 5 insight modules displayed on Dashboard:

| Module | What it detects | Severity levels |
|---|---|---|
| **SLA Predictor** | Tasks likely to breach SLA based on age, complexity | Critical / Warning / Healthy |
| **Workload Balance** | Skew in task distribution across operators | Warning / Info / Healthy |
| **Smart Routing** | Unassigned tasks that could be auto-routed | Warning / Info / Healthy |
| **QA Risk Score** | Quality degradation from rejections + escalations | Critical / Warning / Healthy |
| **Bottleneck Detection** | Approval gate backlog vs in-progress ratio | Critical / Warning / Healthy |

Each insight card shows:
- Category label + severity chip
- Title and explanation body
- Metric value with trend arrow (up/down/neutral)
- Confidence percentage bar
- Optional action button

**Overall Health Gauge** — SVG arc gauge (0–100) aggregating all insight severities, shown in panel header with animated scan progress bar and last-analyzed timestamp.

---

## 11. Admin Panel

Located at `/admin` — visible to `admin` role only.

### Overview Stats
- 4 metric cards: Total Tasks, Active Workflows, Pending Approvals, Total Users

### AI System Health (mock display)
| System | Status |
|---|---|
| Task Routing Model | 98% Operational |
| SLA Prediction Engine | 94% Operational |
| Escalation Classifier | 87% Degraded |
| Workload Balancer | 100% Operational |

### User Management Tab
- Full user table: avatar, name, email, role badge, active status, last login, joined date
- Deactivate / Reactivate with confirmation dialog

### Audit Log Tab
- Filter by entity type (all / task / workflow / user / approval)
- Table: timestamp, actor, action chip, entity reference, status change diff (before→after)

---

## 12. API Surface

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <access_token>` header on all authenticated routes

### Full Endpoint List

| Method | Path | Role Required | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Login |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | any | Logout |
| GET | `/auth/me` | any | Current user |
| GET | `/tasks` | any | List tasks (filtered) |
| GET | `/tasks/mine` | any | My assigned tasks |
| GET | `/tasks/{id}` | any | Task detail |
| POST | `/tasks/{id}/assign` | manager/admin | Assign to user |
| POST | `/tasks/{id}/claim` | operator+ | Claim task |
| POST | `/tasks/{id}/start` | operator+ | Start work |
| POST | `/tasks/{id}/submit` | operator+ | Submit for approval |
| POST | `/tasks/{id}/complete` | manager/admin | Mark complete |
| POST | `/tasks/{id}/escalate` | any | Escalate |
| POST | `/tasks/{id}/cancel` | manager/admin | Cancel |
| GET | `/tasks/{id}/timeline` | any | Activity timeline |
| GET | `/workflows` | any | List workflows |
| POST | `/workflows` | manager/admin | Create workflow |
| GET | `/workflows/{id}` | any | Workflow detail |
| PUT | `/workflows/{id}` | manager/admin | Update (DRAFT only) |
| POST | `/workflows/{id}/publish` | manager/admin | Publish |
| POST | `/workflows/{id}/archive` | admin | Archive |
| POST | `/workflows/{id}/trigger` | manager/admin | Create task from workflow |
| GET | `/workflows/{id}/tasks` | any | Tasks from this workflow |
| GET | `/approvals/pending` | manager/admin | My pending approvals |
| POST | `/approvals/{id}/approve` | manager/admin | Approve |
| POST | `/approvals/{id}/reject` | manager/admin | Reject |
| GET | `/approvals/{id}/history` | any | Approval history |
| GET | `/users` | manager/admin | List users |
| POST | `/users` | admin | Create user |
| GET | `/users/{id}` | manager/admin | User detail |
| PATCH | `/users/{id}` | admin | Update user |
| POST | `/users/{id}/deactivate` | admin | Deactivate |
| POST | `/users/{id}/reactivate` | admin | Reactivate |
| GET | `/admin/stats` | admin | System statistics |
| GET | `/admin/audit-logs` | admin | Audit log (filtered) |
| POST | `/admin/tasks/bulk-reassign` | admin | Bulk reassign tasks |
| GET | `/health` | — | DB health check |

**Total: 36 endpoints across 6 routers**

---

## 13. Frontend & UX

### Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/` | Dashboard | All roles |
| `/tasks` | Task Queue | All roles |
| `/tasks/mine` | My Tasks | All roles |
| `/tasks/{id}` | Task Detail | All roles |
| `/approvals` | Approval Inbox | manager/admin |
| `/workflows` | Workflow List | All roles |
| `/workflows/new` | Workflow Builder | manager/admin |
| `/workflows/{id}` | Workflow Detail | All roles |
| `/admin` | Admin Overview | admin |

### UI Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS v3 with CSS variable theming (HSL)
- **Components:** shadcn/ui pattern (Radix UI primitives)
- **Animations:** Framer Motion (page transitions, card hover, list stagger)
- **Charts:** Recharts (AreaChart, PieChart)
- **State:** Zustand (auth)
- **Data fetching:** React Query (30s stale time, 1 retry)
- **Toasts:** Sonner
- **Icons:** Lucide React
- **Forms:** Controlled React state

### UX Features
- Dark / Light theme toggle (persisted to `localStorage` as `tg_theme`)
- Animated sidebar with `layoutId` active indicator (Framer Motion)
- Page-level `AnimatePresence` transitions
- Loading skeletons on all data tables
- Empty states with iconography and CTA
- Inline status / priority color-coded badges throughout
- Responsive layout (sidebar collapses, grid adapts)
- Topbar with user avatar, role badge, notification bell (UI only), help button
- "All systems operational" status indicator in sidebar footer

---

## 14. Infrastructure & Config

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy 2.0 (`Mapped` / `mapped_column` style)
- **Migrations:** Alembic (URL injected from env, `alembic.ini` has blank URL)
- **Validation:** Pydantic v2
- **Auth:** `python-jose` JWT, `passlib` bcrypt
- **Config:** `pydantic-settings` loading from `.env`, `@lru_cache`

### Databases
| Mode | Database | Notes |
|---|---|---|
| Development | SQLite (`backend/data/taskgrid.db`) | `StaticPool` + WAL mode |
| Production | PostgreSQL 16 | `QueuePool`, `pool_pre_ping`, `pool_recycle` |

- Dialect-aware: `JSONB_TYPE` resolves to `JSONB` (PG) or `JSON` (SQLite)
- All `DateTime` columns use `timezone=True` → `TIMESTAMPTZ` on PG
- Startup validates DB connectivity before accepting requests

### Docker
- `docker compose up -d` starts PostgreSQL + backend
- `entrypoint.sh`: waits for PG readiness → runs `alembic upgrade head` → starts uvicorn
- Data persisted in `taskgrid_pg_data` Docker volume
- Frontend runs separately with `npm run dev` (Vite proxy `/api` → `localhost:8000`)

### Error Handling
All domain errors extend `TaskGridException`. Global handler serializes as:
```json
{ "error": { "code": "SOME_CODE", "message": "...", "status": 422 } }
```
Frontend `apiError()` reads `error.response.data.error.message`.

---

## 15. Data Models

### Entity Relationship Summary

```
User ──< Workflow (created_by)
User ──< Task (created_by, current_assignee)
User ──< TaskAssignment
User ──< Approval (approver)
User ──< AuditLog (actor)

Workflow ──< Task
Task ──< TaskAssignment
Task ──< Approval
Task ──< AuditLog (via entity_type='task')
```

### Model Field Summary

**User:** id, email, hashed_password, full_name, role, is_active, last_login_at, created_at, updated_at

**Workflow:** id, name, description, status, steps (JSONB array), created_by_id, created_at, updated_at

**Task:** id, title, workflow_id, current_step, status, priority, payload (JSONB), outcome_data (JSONB), due_at, created_by_id, current_assignee_id, created_at, updated_at

**TaskAssignment:** id, task_id, user_id, assigned_by_id, step, is_current, assigned_at, released_at

**Approval:** id, task_id, approver_id, decision, comment, step, decided_at

**AuditLog:** id, actor_id, action, entity_type, entity_id, before_state (JSONB), after_state (JSONB), metadata_ (JSONB), created_at

---

## Feature Count Summary

| Area | Count |
|---|---|
| API endpoints | 36 |
| Database models | 6 |
| Backend services | 5 (Task, Workflow, Approval, User, Auth) + AuditService |
| Frontend pages | 10 |
| Task statuses | 8 |
| Workflow statuses | 3 |
| User roles | 4 |
| AI insight modules | 5 |
| Dashboard charts | 2 |

---

*End of V1 Feature Document — next version planning starts here.*
