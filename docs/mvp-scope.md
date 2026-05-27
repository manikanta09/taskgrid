
# TaskGrid — MVP Scope

## Objective

Build a demo-ready prototype in 2 days that proves the core value proposition:
**structured human task orchestration with workflow-driven routing and approval flows.**

---

## In Scope (Build It)

### Authentication
- [x] Email + password login
- [x] JWT access/refresh token flow
- [x] Role-based access control (admin / manager / operator / viewer)
- [x] Protected routes in frontend

### Workflow Definitions
- [x] Create workflow with ordered steps (name, assigned role, SLA hours)
- [x] DRAFT → ACTIVE → ARCHIVED lifecycle
- [x] Trigger task instances from a workflow
- [x] View active workflows and their task counts

### Task Queue Management
- [x] System-wide task queue with filter (status, workflow, assignee)
- [x] My Tasks view (operator's personal queue)
- [x] Claim unassigned tasks
- [x] Assign tasks to users (manager/admin)
- [x] Priority levels (low / medium / high / critical)
- [x] Due date / SLA timestamp

### Task Lifecycle
- [x] CREATED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
- [x] REJECTED path with reason capture
- [x] ESCALATED path
- [x] CANCELLED by admin/manager
- [x] Audit log on every state transition
- [x] Task timeline view (chronological history)

### Human Approval Flow
- [x] Submit task for approval
- [x] Approval inbox (pending tasks for current user)
- [x] Approve with optional comment
- [x] Reject with mandatory reason
- [x] Approval decision recorded in history

### Dashboard
- [x] Key metrics: open, in-progress, pending approval, completed today
- [x] My recent tasks feed
- [x] Recent activity log
- [x] Active workflows summary

### Admin Management UI
- [x] List, create, and deactivate users
- [x] Change user roles
- [x] System-wide audit log viewer
- [x] Stats overview

---

## Out of Scope (Defer)

These are explicitly cut from the MVP to hit the 2-day deadline.

### Notifications
- ~~Email notifications on assignment or approval~~
- ~~In-app real-time push (WebSocket)~~
- **MVP replacement:** Notification bell reads from audit logs on page load

### Advanced Workflow Builder
- ~~Visual drag-and-drop flow diagram editor~~
- ~~Conditional branching (if/else step routing)~~
- ~~Parallel steps~~
- **MVP replacement:** Linear ordered-step form

### File Attachments
- ~~Upload and attach files to tasks~~
- **MVP replacement:** Notes/text field on task submission

### SLA Enforcement
- ~~Automatic escalation on SLA breach~~
- ~~SLA countdown timers~~
- **MVP replacement:** Due date displayed, manual escalation only

### Reporting
- ~~Analytics charts (completion rate, avg resolution time by workflow)~~
- ~~CSV export~~
- **MVP replacement:** Raw stats numbers on dashboard

### Multi-tenancy
- ~~Organization / workspace concept~~
- ~~Team-based task scoping~~
- **MVP replacement:** Single organization, role-based scoping

### AI Integration
- ~~AI-assisted task routing~~
- ~~LLM-generated task summaries~~
- ~~Automated approval suggestions~~
- See [future-extensibility.md](./future-extensibility.md)

### SSO / OAuth
- ~~Google OAuth, SAML~~
- **MVP replacement:** Email/password only

---

## Simplification Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite over Postgres | Zero setup for demo; swap is one config line |
| Inline JSON steps on workflow | Avoids workflow_steps join table; sufficient for MVP |
| Synchronous task transitions | Avoids Celery/queue complexity; fast enough for demo |
| `current_assignee_id` denorm on task | Avoids join for queue queries; maintained on assign/claim |
| No email sending | Saves SMTP/queue setup; use in-app activity instead |
| shadcn/ui component library | Production-quality look with zero design time |
| httpOnly cookie for refresh token | Security default without custom session infrastructure |

---

## Definition of Done (Demo-Ready)

A user can:
1. Log in and see a live dashboard
2. Create and publish a workflow with multiple steps
3. Trigger a task with payload data
4. Claim and work through a task as an operator
5. Submit a task for manager approval
6. Approve or reject the task as a manager
7. View the full audit trail as an admin
8. Manage user accounts (create, assign roles, deactivate)
