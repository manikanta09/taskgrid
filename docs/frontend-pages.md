# TaskGrid — Frontend Pages & Components

## Routing Structure

```
/login                         → LoginPage
/                              → DashboardPage          [protected]
/workflows                     → WorkflowListPage        [manager+]
/workflows/new                 → WorkflowBuilderPage     [manager+]
/workflows/:id                 → WorkflowDetailPage      [manager+]
/tasks                         → TaskQueuePage           [all roles]
/tasks/mine                    → MyTasksPage             [operator+]
/tasks/:id                     → TaskDetailPage          [all roles]
/approvals                     → ApprovalInboxPage       [manager+]
/admin/users                   → UserManagementPage      [admin]
/admin/audit-logs              → AuditLogPage            [admin]
```

---

## Pages

### `LoginPage`
**Route:** `/login`
**Layout:** Centered card, no sidebar
**Elements:**
- TaskGrid logo + tagline
- Email + password fields
- "Sign In" button with loading state
- Error toast on failed auth

---

### `DashboardPage`
**Route:** `/`
**Role:** All authenticated users
**Sections:**

**Stats Bar (top)**
| Metric | Description |
|--------|-------------|
| Open Tasks | Tasks in CREATED / ASSIGNED state |
| In Progress | Tasks in IN_PROGRESS state |
| Pending Approval | Tasks awaiting review |
| Completed Today | Tasks completed in last 24h |

**Main Content:**
- `MyTasksFeed` — 5 most recent tasks assigned to current user
- `RecentActivity` — last 10 audit log events (system-wide for admin/manager)
- `WorkflowOverview` — table of active workflows with task counts

---

### `WorkflowListPage`
**Route:** `/workflows`
**Role:** manager, admin
**Elements:**
- Search bar + status filter (DRAFT / ACTIVE / ARCHIVED)
- DataTable: Name | Steps | Active Tasks | Status | Created By | Actions
- "New Workflow" button → `/workflows/new`
- Row actions: View, Edit (DRAFT only), Publish, Archive

---

### `WorkflowBuilderPage`
**Route:** `/workflows/new`  and  `/workflows/:id/edit`
**Role:** manager, admin
**Elements:**
- Workflow name + description fields
- Step builder:
  - Add step button
  - Each step: name, assigned role, SLA hours (optional), instructions
  - Drag-to-reorder (react-beautiful-dnd)
- Save as Draft / Publish toggle
- Preview panel showing step flow diagram

---

### `WorkflowDetailPage`
**Route:** `/workflows/:id`
**Role:** manager, admin
**Elements:**
- Workflow metadata header (name, status, created by, step count)
- Step list with role badges
- Task instances table: Task ID | Assignee | Current Step | Status | Updated
- "Trigger New Task" button (opens modal with payload form)
- Stats: completion rate, avg. resolution time

---

### `TaskQueuePage`
**Route:** `/tasks`
**Role:** All roles (scoped by role server-side)
**Elements:**
- Filter bar: Status | Workflow | Assignee | Date range
- Tab switcher: All / Unassigned / Assigned / Escalated
- DataTable: Task ID | Title | Workflow | Assignee | Status | Priority | Due | Actions
- Bulk actions toolbar: Reassign, Cancel (admin only)
- "Claim" quick action on unassigned tasks (operator role)

---

### `MyTasksPage`
**Route:** `/tasks/mine`
**Role:** operator, manager, admin
**Elements:**
- Same as TaskQueuePage but pre-filtered to `assignee = me`
- Priority swim-lanes: High / Medium / Low
- Quick action cards per task: Start, Submit, Escalate

---

### `TaskDetailPage`
**Route:** `/tasks/:id`
**Role:** All roles
**Sections:**

**Header:** Task title, workflow name, current status badge, priority badge, due date

**Timeline Panel (left/main):**
- Chronological list of all state transitions with actor + timestamp
- Collapsible step-by-step progress indicator

**Action Panel (right sidebar):**
- Current state determines visible actions:
  - `CREATED` → Assign / Claim
  - `ASSIGNED` → Start
  - `IN_PROGRESS` → Submit for Approval / Complete / Escalate
  - `PENDING_APPROVAL` → Approve / Reject (role-gated)
- Outcome submission form (notes, attachments placeholder)

**Metadata Panel:**
- Workflow info, created by, all assignees, payload data

---

### `ApprovalInboxPage`
**Route:** `/approvals`
**Role:** manager, admin
**Elements:**
- Task cards awaiting approval from current user
- Each card: Task title | Workflow step | Submitted by | Wait time
- Inline Approve / Reject buttons (opens comment modal)
- Filters: workflow, date
- Empty state: "No pending approvals" illustration

---

### `UserManagementPage`
**Route:** `/admin/users`
**Role:** admin
**Elements:**
- DataTable: Name | Email | Role | Status | Last Login | Actions
- Invite User button (modal: email + role)
- Role change dropdown inline
- Deactivate/Reactivate action
- Search + role filter

---

### `AuditLogPage`
**Route:** `/admin/audit-logs`
**Role:** admin
**Elements:**
- Searchable table: Timestamp | Actor | Action | Entity Type | Entity ID | Details
- Filter by entity type (Task, Workflow, User)
- Date range picker
- Export to CSV button (stub)

---

## Shared Components

### `AppShell`
Persistent wrapper for all authenticated pages.
- Left sidebar (collapsible on mobile)
- Top navbar: breadcrumb, notification bell (badge), user avatar menu

### `Sidebar`
Navigation links gated by role:
```
Dashboard          (all)
Task Queue         (all)
My Tasks           (operator+)
Approvals          (manager+)
Workflows          (manager+)
──────────────────────
Admin > Users      (admin)
Admin > Audit Logs (admin)
```

### `StatusBadge`
Color-coded pill component.
```
CREATED           → gray
ASSIGNED          → blue
IN_PROGRESS       → yellow
PENDING_APPROVAL  → purple
COMPLETED         → green
REJECTED          → red
ESCALATED         → orange
CANCELLED         → slate
```

### `DataTable`
Generic table with:
- Column config (header, accessor, cell renderer)
- Server-side pagination
- Sort by column
- Loading skeleton state
- Empty state slot

### `ConfirmDialog`
Reusable modal for destructive/irreversible actions.

### `TaskTimeline`
Visual vertical timeline showing task state history with icons per transition type.

---

## State Management

### `authStore` (Zustand)
```ts
{ user, accessToken, isAuthenticated, login(), logout(), refreshToken() }
```

### `notificationStore` (Zustand)
```ts
{ notifications[], unreadCount, addNotification(), markRead() }
```

### `taskStore` (Zustand)
```ts
{ activeFilters, setFilter(), clearFilters() }
```

React Query handles all server data fetching, caching, and invalidation. Zustand is only for UI state that doesn't belong in the server cache.
