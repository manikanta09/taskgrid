# TaskGrid — User Manual & Feature Guide

**Version:** MVP 1.0  
**Last Updated:** May 2026  
**Application URL:** http://localhost:5173  
**API Docs:** http://localhost:8000/docs

---

## Table of Contents

1. [What is TaskGrid?](#1-what-is-taskgrid)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Getting Started — Login](#3-getting-started--login)
4. [Feature 1 — Dashboard](#4-feature-1--dashboard)
5. [Feature 2 — Workflow Builder](#5-feature-2--workflow-builder)
6. [Feature 3 — Task Queue](#6-feature-3--task-queue)
7. [Feature 4 — Task Lifecycle](#7-feature-4--task-lifecycle)
8. [Feature 5 — Approval Inbox](#8-feature-5--approval-inbox)
9. [Feature 6 — Admin Panel](#9-feature-6--admin-panel)
10. [What's Already Built (Summary)](#10-whats-already-built-summary)
11. [What's Next — Roadmap](#11-whats-next--roadmap)

---

## 1. What is TaskGrid?

TaskGrid is an **enterprise workflow automation platform** that helps teams define, assign, track, and approve structured work. Instead of managing tasks in spreadsheets or chat messages, TaskGrid gives every piece of work a defined process, an owner, a deadline, and a full audit trail.

**Core idea in one sentence:**  
> Define a process once as a Workflow → create Tasks against it → route them to the right people → track every action → nothing falls through the cracks.

---

## 2. User Roles & Permissions

TaskGrid has four roles. Each person logs in and sees only the actions their role permits.

| Role | Who Uses It | What They Can Do |
|---|---|---|
| **Admin** | IT / Platform Owner | Everything — manage users, view all tasks, approve/reject, access audit logs |
| **Manager** | Team Lead / Supervisor | Create workflows, approve/reject tasks, view all tasks, assign to operators |
| **Operator** | Front-line Worker | Claim tasks from the queue, work them, submit for approval |
| **Viewer** | Auditor / Stakeholder | Read-only access — view tasks, workflows, and the dashboard |

**Demo credentials (pre-seeded):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskgrid.io | admin123 |
| Manager | manager@taskgrid.io | manager123 |
| Operator | ops1@taskgrid.io | ops123 |
| Viewer | viewer@taskgrid.io | viewer123 |

---

## 3. Getting Started — Login

1. Open **http://localhost:5173** in your browser.
2. Enter your email and password.
3. Click **Sign In**.
4. You land on the **Dashboard** automatically.

Your session stays active for 60 minutes. If it expires, you are redirected to login — your work is never lost.

---

## 4. Feature 1 — Dashboard

**Who uses it:** Everyone (all roles)  
**Where:** Home screen after login

The Dashboard is the command center. It gives leadership and operators a real-time view of operational health without digging through lists.

### What you see

**Metric Cards (top row)**
- Total Tasks in the system
- Tasks currently In Progress
- Tasks waiting for Approval
- Tasks Completed

**Weekly Trend Chart**  
An area chart showing completed vs escalated tasks day-by-day over the past 7 days. Useful for spotting if a day had unusual escalations.

**Status Distribution (Pie Chart)**  
A visual breakdown of all tasks by status — helps identify if too many tasks are piling up at a particular stage.

**AI Operational Intelligence Panel**  
Five AI-generated insights based on live task data:

| Insight | What It Tells You |
|---|---|
| SLA Predictor | How many tasks are likely to breach their deadline in the next 24 hours |
| Workload Balance | Whether task load is spread evenly across operators, or one person is overloaded |
| Smart Routing | How many unassigned tasks could be auto-routed to save time |
| QA Risk Score | Overall quality score based on rejection and escalation rates |
| Bottleneck Detection | Whether the approval gate has a backlog building up |

Each insight shows a severity badge (Critical / Warning / Healthy), a confidence percentage, and a recommended action.

**Recent Tasks (bottom)**  
A quick list of the latest 6 tasks with status and priority chips. Clicking any task opens its detail page.

---

## 5. Feature 2 — Workflow Builder

**Who uses it:** Admin, Manager  
**Where:** Sidebar → Workflows → New Workflow

A Workflow is a reusable template that defines how a type of work gets done — what steps it goes through, who handles each step, and how long each step should take.

### Creating a Workflow

1. Go to **Workflows** in the sidebar.
2. Click **New Workflow**.
3. Fill in:
   - **Workflow Name** — e.g., "Invoice Approval", "Employee Onboarding"
   - **Description** — optional, shown on the detail page
4. Add steps using the **Add Step** button. For each step:

| Field | Description |
|---|---|
| Step Name | What happens at this step — e.g., "KYC Verification" |
| Assignee Role | Which role handles this step (operator / manager / admin) |
| SLA Hours | How many hours this step should take before escalation |
| Instructions | Guidance for the person doing the work |
| Requires Approval | Toggle ON if a manager must approve before the task advances |

5. Steps are automatically numbered. Drag to reorder.
6. Click **Save Workflow**.

### Workflow Statuses

| Status | Meaning |
|---|---|
| Active | Available — tasks can be created against this workflow |
| Draft | Being set up — not yet available for task creation |
| Archived | Retired — no new tasks, historical data preserved |

### Workflow Detail Page

After saving, you land on the Workflow Detail page showing:
- All steps as a visual pipeline
- Which role owns each step
- SLA and approval requirements per step
- All tasks created from this workflow

---

## 6. Feature 3 — Task Queue

**Who uses it:** All roles  
**Where:** Sidebar → Task Queue / My Tasks

The Task Queue is the central list of all work items in the system. Operators use it to find and claim work; managers use it to monitor progress.

### Tabs

| Tab | Shows |
|---|---|
| All Tasks | Every task regardless of status |
| Unassigned | Tasks created but not yet picked up by anyone |
| Assigned | Tasks claimed by someone but not started |
| In Progress | Tasks actively being worked on |
| Pending Approval | Tasks submitted and waiting for a manager decision |
| Escalated | Tasks that exceeded SLA or were manually escalated |
| Completed | Finished tasks |

### Filtering & Search

- **Search bar** — filter by task title in real time
- **My Tasks** (sidebar link) — shows only tasks assigned to you
- **Pagination** — 15 tasks per page, navigate with the page bar

### Task Cards

Each row shows:
- Task title and ID
- Workflow name
- Current status (color-coded chip)
- Priority (Critical / High / Medium / Low)
- Assigned to (avatar + name)
- Time since last update
- Quick-action buttons (View, Assign, Flag)

Click any row to open the full **Task Detail** page.

---

## 7. Feature 4 — Task Lifecycle

**Who uses it:** Operators (work tasks), Managers/Admins (approve/escalate)  
**Where:** Task Queue → click any task

This is where individual work happens. The Task Detail page shows everything about a task and lets you take actions that move it through its lifecycle.

### Task Status Flow

```
CREATED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
                                        ↓
                                    REJECTED (goes back to operator)
                         ↓
                     ESCALATED (flagged for manager attention)
                         ↓
                     CANCELLED
```

### Actions Available

| Action | Who Can Do It | When It Appears | What It Does |
|---|---|---|---|
| **Claim** | Operator | Task is CREATED (unassigned) | Assigns the task to you → status: ASSIGNED |
| **Start** | Operator (assignee) | Task is ASSIGNED | Marks work begun → status: IN_PROGRESS |
| **Submit for Approval** | Operator (assignee) | Task is IN_PROGRESS | Opens a dialog to add completion notes → status: PENDING_APPROVAL |
| **Approve** | Manager / Admin | Task is PENDING_APPROVAL | Advances task to COMPLETED (or next step) |
| **Reject** | Manager / Admin | Task is PENDING_APPROVAL | Sends task back with a rejection reason |
| **Escalate** | Operator / Manager | Task is IN_PROGRESS | Flags task for urgent attention → status: ESCALATED |
| **Complete** | Admin | Task is in a completable state | Marks as fully done → status: COMPLETED |
| **Cancel** | Admin / Manager | Any active task | Terminates task → status: CANCELLED |

### Task Detail Sections

**Header** — Title, status chip, priority chip, task ID, back button.

**Task Info Card** — Workflow name, current step, assigned to, created by, due date, payload data (e.g., invoice amount, vendor name).

**Workflow Stepper** — Visual timeline showing all steps in the workflow and which step the task is currently on.

**Activity Timeline** (right side) — Every action ever taken on this task, with:
- What happened (task created / claimed / started / submitted / approved…)
- Who did it
- When it happened (relative time + exact timestamp on hover)

This timeline is the **audit trail** — tamper-proof, always up to date.

---

## 8. Feature 5 — Approval Inbox

**Who uses it:** Manager, Admin  
**Where:** Sidebar → Approvals

A dedicated inbox showing only the tasks that need a manager decision right now. No hunting through the task queue.

### How It Works

- Auto-refreshes every 15 seconds
- Shows task count in the page header ("3 tasks awaiting your decision")
- Empty state message when all caught up

### Approval Cards

Each card shows:
- Task title and ID
- Which workflow step triggered the approval
- Submitted by (operator name + avatar)
- Priority badge
- How long the task has been waiting
- Task payload preview (e.g., invoice amount, vendor)

### Taking Action

Click **Approve** or **Reject** on any card. A dialog opens:

- **Approve** — add an optional comment, click Confirm Approval
- **Reject** — rejection reason is required, click Confirm Rejection

After the decision:
- Approved: task moves to COMPLETED (or advances to the next workflow step)
- Rejected: task returns to the operator with the rejection reason visible in the timeline

---

## 9. Feature 6 — Admin Panel

**Who uses it:** Admin only  
**Where:** Sidebar → Admin

Full system oversight — operational stats, user management, and a complete audit log.

### Stats Bar

Four metric cards showing live system-wide counts:
- Total Tasks
- Active Workflows
- Pending Approvals
- Total Users

### AI System Health (Mock)

Four AI engine health indicators with status and percentage:
- Task Routing Model
- SLA Prediction Engine
- Escalation Classifier
- Workload Balancer

### Tab 1 — User Management

A table of all users showing:
- Name, email, avatar
- Role (color-coded badge)
- Active / Inactive status
- Last login time
- Date joined
- **Deactivate / Reactivate** action button

Deactivating a user prevents login but preserves all their task history and assignments.

### Tab 2 — Audit Log

A complete log of every system event — filterable by entity type:

| Filter | Shows |
|---|---|
| All Types | Every event |
| Task | Task creates, status changes, assignments |
| Workflow | Workflow creates, updates |
| User | Logins, deactivations |
| Approval | Approve and reject decisions |

Each row shows: timestamp, actor (user or System), action, entity type + ID, and before/after status chips where applicable.

---

## 10. What's Already Built (Summary)

| Feature | Status |
|---|---|
| User authentication (login / logout / session) | ✅ Done |
| JWT access + refresh token auth | ✅ Done |
| Role-based access control (Admin / Manager / Operator / Viewer) | ✅ Done |
| Dashboard with metrics, charts, recent tasks | ✅ Done |
| AI Operational Intelligence panel (5 insight types) | ✅ Done |
| Workflow builder (multi-step, roles, SLA, approval flags) | ✅ Done |
| Workflow list and detail pages | ✅ Done |
| Task creation against a workflow | ✅ Done |
| Task queue with status tabs, search, pagination | ✅ Done |
| My Tasks (personal queue) | ✅ Done |
| Full task lifecycle — Claim → Start → Submit → Approve/Reject → Complete | ✅ Done |
| Task escalation and cancellation | ✅ Done |
| Task detail with payload data and workflow stepper | ✅ Done |
| Activity timeline / audit trail per task | ✅ Done |
| Approval Inbox (dedicated manager view, auto-refresh) | ✅ Done |
| Admin panel — system stats, user management, audit log | ✅ Done |
| User deactivate / reactivate | ✅ Done |
| Seed data (5 users, 3 workflows, 10 tasks across all statuses) | ✅ Done |
| REST API with FastAPI + auto-generated Swagger docs | ✅ Done |
| Docker Compose setup for one-command deployment | ✅ Done |

---

## 11. What's Next — Roadmap

The MVP is production-demonstrable. Below are the prioritized next phases.

---

### Phase 2 — Production Hardening (1–2 weeks)

These are the changes needed before going live with real users.

| Item | Why It Matters |
|---|---|
| **Switch SQLite → PostgreSQL** | SQLite is for demos only; Postgres handles concurrent users and large data |
| **Real-time notifications (WebSocket)** | Operators get notified instantly when a task is assigned; managers see approval requests without refreshing |
| **Email notifications** | Notify users on assignment, approval requests, and rejections via email |
| **Automated SLA escalation** | Background job that automatically escalates tasks that exceed their SLA hours — today this must be done manually |
| **File attachments** | Allow operators to attach documents, screenshots, or evidence to a task |
| **CSV / PDF export** | Export audit logs and task history for compliance reporting |
| **Redis caching** | Speed up dashboard queries and session management |

---

### Phase 3 — Security & Auth (1 week)

| Item | Why It Matters |
|---|---|
| **Google OAuth / SAML SSO** | Let enterprise users log in with their company credentials — no separate password to manage |
| **Multi-Factor Authentication (TOTP)** | Extra security layer for admin and manager accounts |
| **API key management** | Allow external systems to create tasks via the API (e.g., trigger a task from a CRM or ERP) |
| **Password change / reset flow** | Currently users cannot change their own password from the UI |

---

### Phase 4 — Multi-Tenancy (2–3 weeks)

For selling TaskGrid to multiple companies, each with their own isolated workspace.

| Item | Why It Matters |
|---|---|
| **Organisation model** | Each company gets their own workspace with isolated workflows and tasks |
| **Subdomain routing** | `acme.taskgrid.io`, `beta-corp.taskgrid.io` etc. |
| **Org-level admin role** | Each company manages their own users independently |
| **Billing integration** | Subscription management per organisation |

---

### Phase 5 — AI Workflow Engine (3–4 weeks)

The highest-value differentiator. The platform's architecture is already designed to support this.

| Capability | What It Does |
|---|---|
| **AI Task Routing** | When a task is created, an AI agent analyses the payload and automatically suggests (or assigns) the best available operator based on skill, availability, and SLA urgency |
| **Auto-Approval for Low-Risk Tasks** | AI reviews simple, low-risk submissions and approves them automatically — freeing managers to focus on complex decisions only |
| **AI Task Summarization** | One-click summary of any task — what happened, who touched it, what the outcome was — in plain language |
| **Natural Language Workflow Creation** | Describe a process in plain English ("our vendor approval takes 3 steps: screening by ops, review by manager, sign-off by finance") and AI generates the workflow |
| **Predictive SLA Alerts** | Go beyond the current mock AI — train a real model on historical task data to predict breach risk with real confidence scores |
| **Anomaly Detection** | Detect unusual patterns — a task that has been reassigned 5 times, or a workflow step that consistently causes rejections |

**Technical note:** The AI layer is a natural extension of the existing codebase. The service layer, payload JSON columns, audit log, and workflow step config are all already designed with AI agents in mind. Adding AI routing requires approximately one new service file and a configuration key on each workflow step.

---

### Quick Priority Matrix

| Phase | Effort | Business Impact | Recommended Order |
|---|---|---|---|
| Phase 2 — Production Hardening | Medium | High (required for go-live) | **Do first** |
| Phase 3 — Security & Auth | Low | High (enterprise requirement) | **Do second** |
| Phase 5 — AI Engine | High | Very High (differentiator) | **Do third** |
| Phase 4 — Multi-Tenancy | High | High (SaaS scale) | **Do fourth** |

---

*For technical architecture details, see [architecture.md](./architecture.md).*  
*For the full API reference, see [api-reference.md](./api-reference.md).*  
*For database schema details, see [database-schema.md](./database-schema.md).*
