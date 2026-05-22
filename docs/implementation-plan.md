# TaskGrid — 2-Day Implementation Plan

## Sprint Goal
Deliver a fully functional, demo-ready MVP with auth, task lifecycle, approval flow, and admin UI.

---

## Day 1 — Backend Foundation + Auth + Core APIs

### Block 1 (Morning, ~3h): Project Scaffolding

- [ ] Initialize repo, `.env.example`, `docker-compose.yml`
- [ ] Backend: FastAPI app factory in `main.py`, CORS, logging middleware
- [ ] Frontend: Vite + React + TypeScript scaffold, Tailwind + shadcn/ui init
- [ ] SQLAlchemy setup + Alembic init
- [ ] Write all SQLAlchemy models (`user`, `workflow`, `task`, `task_assignment`, `approval`, `audit_log`)
- [ ] Run first migration, seed admin user

**Deliverable:** `docker compose up` boots both services, DB initializes with admin user.

---

### Block 2 (Late Morning, ~2h): Auth Module

- [ ] `core/security.py` — bcrypt helpers, JWT create/decode
- [ ] `routers/auth.py` — login, refresh, logout, me
- [ ] `services/auth_service.py` — authenticate_user, token issuance
- [ ] `core/dependencies.py` — `get_db`, `get_current_user`, `require_role`
- [ ] Frontend: `LoginPage`, `authStore`, axios interceptor (attach token, handle 401 refresh)

**Deliverable:** Can log in, get JWT, make authenticated requests, get 401 on protected routes.

---

### Block 3 (Afternoon, ~3h): Workflow + Task APIs

- [ ] `routers/workflows.py` + `services/workflow_service.py` — CRUD, publish, archive, trigger
- [ ] `routers/tasks.py` + `services/task_service.py` — list, assign, claim, start, submit, cancel
- [ ] Task state machine enforcement in `task_service.py`
- [ ] `audit_logs` writes on every state transition
- [ ] Pydantic schemas for all request/response types

**Deliverable:** Can create a workflow, trigger a task, transition it through states via API (test with curl or Swagger).

---

### Block 4 (Evening, ~2h): User + Admin APIs

- [ ] `routers/users.py` + `services/user_service.py` — CRUD, role change, deactivate
- [ ] `routers/approvals.py` + `services/approval_service.py` — approve, reject, pending list, history
- [ ] `routers/admin.py` — stats endpoint, audit log endpoint
- [ ] RBAC enforcement verified on all routes

**Deliverable:** Full backend API surface working and documented at `/docs`.

---

## Day 2 — Frontend UI + Integration + Polish

### Block 5 (Morning, ~3h): Layout + Dashboard + Task Queue

- [ ] `AppShell` with `Sidebar` (role-aware links) and `Topbar`
- [ ] `DashboardPage` — stats bar from `/admin/stats`, my tasks feed, recent activity
- [ ] `DataTable` shared component with pagination, sort, loading skeleton
- [ ] `TaskQueuePage` — table with filters, status tabs, Claim button
- [ ] `StatusBadge` and other shared components

**Deliverable:** Authenticated user sees dashboard with real data; task queue renders.

---

### Block 6 (Late Morning, ~2h): Task Detail + Lifecycle Actions

- [ ] `TaskDetailPage` — header, timeline, action panel
- [ ] `TaskTimeline` component — vertical chronological log
- [ ] Action buttons (Start, Submit, Escalate, Cancel) wired to API calls
- [ ] `MyTasksPage` — filtered view, priority swim lanes

**Deliverable:** Full task lifecycle can be driven from the UI.

---

### Block 7 (Afternoon, ~3h): Workflow Builder + Approval Inbox

- [ ] `WorkflowListPage` — table with status filter, publish/archive actions
- [ ] `WorkflowBuilderPage` — step editor form (add/remove steps, role picker)
- [ ] `WorkflowDetailPage` — metadata, step list, trigger button + modal
- [ ] `ApprovalInboxPage` — pending tasks list, inline approve/reject with comment modal

**Deliverable:** End-to-end demo flow: create workflow → trigger task → assign → work → submit → approve.

---

### Block 8 (Late Afternoon, ~2h): Admin + Polish

- [ ] `UserManagementPage` — user table, invite modal, role change
- [ ] `AuditLogPage` — searchable log table with filters
- [ ] `ConfirmDialog` for destructive actions
- [ ] Toast notification system (success/error feedback on actions)
- [ ] Empty states and loading skeletons on all pages
- [ ] Mobile responsive check on main pages

**Deliverable:** Admin can manage users and view system events.

---

### Block 9 (Evening, ~1h): Demo Prep

- [ ] Seed realistic demo data: 3 workflows, 10 tasks in various states, 5 users across all roles
- [ ] Smoke test end-to-end demo flow
- [ ] Fix any blocking visual or functional issues
- [ ] Update README with Docker start instructions

**Deliverable:** Demo-ready. `docker compose up` → walk through all 7 core modules.

---

## Demo Script (10-min walkthrough)

1. **Login** as Admin → show Dashboard with metrics
2. **Admin** → create an Operator user (User Management)
3. **Workflows** → create "Invoice Approval" with 3 steps → Publish
4. **Trigger** a new task with payload data
5. **Login** as Operator → see task in My Tasks → Claim → Start → Submit for Approval
6. **Login** as Manager → see task in Approval Inbox → Approve with comment
7. **Dashboard** → show updated stats, completed task in activity feed
8. **Admin** → Audit Log → show full event trail

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Workflow builder too complex | Use simple ordered form, skip drag-to-reorder for Day 1 |
| Auth integration delays | Build auth first; use Swagger for API testing before frontend |
| UI polish time | Use shadcn/ui defaults, minimal custom CSS |
| Scope creep | Stick strictly to MVP scope doc; defer nice-to-haves |
