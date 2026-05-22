# TaskGrid — Folder Structure

```
taskgrid/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   │
│   └── app/
│       ├── main.py                  # FastAPI app factory, middleware, routers
│       ├── config.py                # Settings via pydantic-settings
│       ├── database.py              # SQLAlchemy engine + session factory
│       │
│       ├── models/                  # SQLAlchemy ORM models
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── workflow.py
│       │   ├── task.py
│       │   ├── task_assignment.py
│       │   ├── approval.py
│       │   └── audit_log.py
│       │
│       ├── schemas/                 # Pydantic request/response schemas
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── user.py
│       │   ├── workflow.py
│       │   ├── task.py
│       │   └── approval.py
│       │
│       ├── routers/                 # FastAPI route handlers (thin layer)
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── workflows.py
│       │   ├── tasks.py
│       │   ├── approvals.py
│       │   └── admin.py
│       │
│       ├── services/                # Business logic
│       │   ├── __init__.py
│       │   ├── auth_service.py
│       │   ├── user_service.py
│       │   ├── workflow_service.py
│       │   ├── task_service.py
│       │   └── approval_service.py
│       │
│       ├── repositories/            # Data access layer
│       │   ├── __init__.py
│       │   ├── user_repository.py
│       │   ├── workflow_repository.py
│       │   ├── task_repository.py
│       │   └── approval_repository.py
│       │
│       ├── core/                    # Cross-cutting concerns
│       │   ├── __init__.py
│       │   ├── security.py          # JWT encode/decode, password hashing
│       │   ├── dependencies.py      # FastAPI deps (get_db, get_current_user)
│       │   ├── permissions.py       # Role-based access control
│       │   └── exceptions.py        # Custom HTTP exceptions
│       │
│       └── utils/
│           ├── __init__.py
│           └── pagination.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    │
    └── src/
        ├── main.tsx
        ├── App.tsx                  # Router setup, protected routes
        │
        ├── api/                     # Axios instances + API call functions
        │   ├── client.ts            # Axios base + interceptors
        │   ├── auth.ts
        │   ├── workflows.ts
        │   ├── tasks.ts
        │   ├── users.ts
        │   └── approvals.ts
        │
        ├── store/                   # Zustand global state
        │   ├── authStore.ts
        │   ├── notificationStore.ts
        │   └── taskStore.ts
        │
        ├── hooks/                   # Custom React Query hooks
        │   ├── useAuth.ts
        │   ├── useWorkflows.ts
        │   ├── useTasks.ts
        │   └── useUsers.ts
        │
        ├── pages/                   # Route-level page components
        │   ├── auth/
        │   │   └── LoginPage.tsx
        │   ├── dashboard/
        │   │   └── DashboardPage.tsx
        │   ├── workflows/
        │   │   ├── WorkflowListPage.tsx
        │   │   ├── WorkflowDetailPage.tsx
        │   │   └── WorkflowBuilderPage.tsx
        │   ├── tasks/
        │   │   ├── TaskQueuePage.tsx
        │   │   ├── TaskDetailPage.tsx
        │   │   └── MyTasksPage.tsx
        │   ├── approvals/
        │   │   └── ApprovalInboxPage.tsx
        │   └── admin/
        │       ├── UserManagementPage.tsx
        │       └── AuditLogPage.tsx
        │
        ├── components/              # Reusable UI components
        │   ├── layout/
        │   │   ├── AppShell.tsx     # Sidebar + topbar wrapper
        │   │   ├── Sidebar.tsx
        │   │   └── Topbar.tsx
        │   ├── common/
        │   │   ├── StatusBadge.tsx
        │   │   ├── DataTable.tsx
        │   │   ├── ConfirmDialog.tsx
        │   │   └── EmptyState.tsx
        │   ├── tasks/
        │   │   ├── TaskCard.tsx
        │   │   └── TaskTimeline.tsx
        │   └── workflows/
        │       └── WorkflowStepEditor.tsx
        │
        ├── types/                   # TypeScript interfaces
        │   ├── auth.ts
        │   ├── workflow.ts
        │   ├── task.ts
        │   └── user.ts
        │
        └── lib/
            ├── utils.ts             # cn(), date formatting, etc.
            └── constants.ts         # Status colors, role labels, etc.
```
