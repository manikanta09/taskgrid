# TaskGrid — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│              React 18 + TypeScript + shadcn/ui                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS REST + JSON
┌───────────────────────────▼─────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   Auth   │  │Workflows │  │  Tasks   │  │     Admin      │  │
│  │  Module  │  │  Module  │  │  Module  │  │    Module      │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               Core Services Layer                        │    │
│  │  JWT Auth │ Permissions │ Event Bus │ Notification Stub  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            SQLAlchemy ORM  +  SQLite                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architectural Layers

### 1. Presentation Layer (Frontend)
- React SPA with file-based routing via React Router v6
- Global state via Zustand (auth store, task store, notification store)
- Server state via React Query (caching, background refetch, optimistic updates)
- Design system: shadcn/ui components on top of Tailwind CSS
- Role-aware rendering: `useRole()` hook controls UI visibility per user role

### 2. API Layer (FastAPI)
- Versioned routes under `/api/v1/`
- Pydantic v2 schemas for request validation and response serialization
- Dependency injection for auth (`get_current_user`) and DB sessions
- Middleware: CORS, request logging, error normalization
- OpenAPI auto-docs at `/docs`

### 3. Business Logic Layer
- Service classes (not inline in route handlers) own all logic
- `WorkflowService` — CRUD and state transitions for workflow definitions
- `TaskService` — task creation, assignment, lifecycle transitions
- `UserService` — user management and role assignment
- `ApprovalService` — approval/rejection with audit trail

### 4. Data Layer
- SQLAlchemy models with explicit relationships
- Alembic migrations (even for SQLite, to support future Postgres swap)
- Repository pattern: `UserRepository`, `TaskRepository`, etc.
- Single DB session per request via FastAPI dependency

---

## Request Lifecycle

```
Browser
  │
  ▼ GET /api/v1/tasks?status=pending
FastAPI Router
  │
  ▼ JWT middleware → decode token → inject current_user
Route Handler (tasks.py)
  │
  ▼ Call TaskService.list_tasks(user, filters)
TaskService
  │
  ▼ TaskRepository.find_by_filters(...)
SQLAlchemy ORM
  │
  ▼ SQLite query
  │
  ◀ Results → Pydantic schema → JSON response
```

---

## Auth Flow

```
Login Request
  │
  ▼ POST /api/v1/auth/login  { email, password }
  │
  ▼ Verify bcrypt hash
  │
  ▼ Issue: access_token (15 min) + refresh_token (7 days)
  │
  ◀ Return tokens to client
  │
Client stores tokens in memory (access) + httpOnly cookie (refresh)
  │
Subsequent requests: Authorization: Bearer <access_token>
  │
Token expiry → POST /api/v1/auth/refresh → new access_token
```

---

## Role Model

| Role | Capabilities |
|------|-------------|
| `admin` | Full access: users, workflows, tasks, audit logs |
| `manager` | Create/edit workflows, assign tasks, view all queues |
| `operator` | View assigned tasks, claim tasks, submit outcomes |
| `viewer` | Read-only access to dashboards |

---

## Workflow State Machine

```
DRAFT ──publish──► ACTIVE ──archive──► ARCHIVED
                     │
              (creates tasks)
                     │
                     ▼
              TASK LIFECYCLE
```

## Task State Machine

```
CREATED
   │
   ▼
ASSIGNED ──────────────────────────────────────────────────────┐
   │                                                            │
   ▼                                                            │
IN_PROGRESS                                                     │
   │                                                            │
   ├──► PENDING_APPROVAL ──approve──► COMPLETED                 │
   │          │                                                 │
   │        reject                                              │
   │          │                                                 │
   │          ▼                                                 │
   └──────► REJECTED ────────────────────────────────────────► │
                                                                │
   ▼                                                            │
ESCALATED ◄─────────────────────────────────────────────────── ┘
   │
   ▼
CANCELLED
```

---

## Scalability Path

| Current (MVP) | Future |
|---------------|--------|
| SQLite | PostgreSQL |
| In-process event bus | Redis Pub/Sub or Kafka |
| Synchronous tasks | Celery + Redis workers |
| Single FastAPI process | Kubernetes + HPA |
| JWT in memory | Redis session store |
| File-based logging | OpenTelemetry + Datadog |
