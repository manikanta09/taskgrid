# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Dev Server Commands

**Backend** (FastAPI, port 8000) — run from `backend/`:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (Vite/React, port 5173) — run from `frontend/`:
```bash
cd frontend
npm run dev
```

**Seed demo data** (after backend is running):
```bash
cd backend && source venv/bin/activate && python seed_demo.py
```

**Alembic migrations** (run from `backend/` with venv active):
```bash
alembic upgrade head                                   # apply all migrations
alembic revision --autogenerate -m "description"       # generate new migration
alembic downgrade -1                                   # roll back one migration
alembic history --verbose                              # list migration history
```

**Docker Compose (PostgreSQL + all services):**
```bash
docker compose up -d db           # start only PostgreSQL (port 5432 exposed)
docker compose up -d              # start all services
docker compose logs -f backend    # tail backend logs
docker compose down               # stop (data persists in taskgrid_pg_data volume)
docker compose down -v            # stop AND wipe all data
```

**Switch to PostgreSQL locally (no Docker):**
```bash
# 1. Edit backend/.env → set DATABASE_URL=postgresql://user:pass@localhost:5432/taskgrid
# 2. Apply schema:
cd backend && source venv/bin/activate && alembic upgrade head
# 3. Migrate existing SQLite data:
python scripts/migrate_sqlite_to_postgres.py --dry-run   # preview
python scripts/migrate_sqlite_to_postgres.py             # execute
```

---

## Architecture Overview

TaskGrid is a **modular monolith** with a strict layered backend and a React SPA frontend.

### Backend layers (`backend/app/`)

```
routers/ → services/ → repositories/ → models/
```

- **Routers** handle HTTP, extract FastAPI `Depends`, delegate to a service. No business logic here.
- **Services** own all domain/business logic and orchestrate across repositories. Services receive a `db: Session` directly (not injected by FastAPI). They call `AuditService.log()` after every meaningful state change.
- **Repositories** are thin wrappers around SQLAlchemy queries for one model. They own `.commit()` and `.refresh()` calls.
- **Models** use SQLAlchemy 2.0 `Mapped`/`mapped_column` style. All models are registered via `import app.models` (the `__init__.py` wildcard import) before `Base.metadata.create_all`.
- **Schemas** (`schemas/`) are Pydantic v2 models. `*Out` schemas use `model_config = {"from_attributes": True}`.

### Request auth flow

1. `core/dependencies.py` → `get_current_user` extracts Bearer token from `Authorization` header, decodes JWT, loads `User` via `UserRepository`.
2. Access tokens live in `localStorage` (`tg_access_token`). Refresh token is an `HttpOnly` cookie (`refresh_token`).
3. `core/dependencies.py` → `require_role(*roles)` is a dependency factory — it calls `get_current_user` internally, then checks `has_any_role`.
4. On 401, the Axios client (`frontend/src/api/client.ts`) silently calls `/api/v1/auth/refresh` (with `withCredentials: true` for the cookie) and retries once.

### Task state machine

Defined in `services/task_service.py` as `VALID_TRANSITIONS: dict[str, set[str]]`. All status changes go through `_transition()`, which raises `InvalidTransitionError` (HTTP 422) on illegal moves. The valid flow is:

```
CREATED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
                                  ↘ ESCALATED → ASSIGNED
PENDING_APPROVAL → REJECTED → IN_PROGRESS
Any non-terminal → CANCELLED
```

### Role hierarchy

`viewer < operator < manager < admin`

Defined in `core/permissions.py`. `require_role()` uses **exact membership** (`has_any_role`), not hierarchy comparison. `role_gte()` exists but is not used in routers — if you need hierarchical role checks, use it explicitly.

### Error handling

All domain errors extend `TaskGridException` in `core/exceptions.py`. The global handler in `main.py` serialises them as:
```json
{"error": {"code": "SOME_CODE", "message": "...", "status": 422}}
```
Frontend `apiError()` helper (`api/client.ts`) reads `error.response.data.error.message`.

### Configuration

`app/config.py` uses `pydantic-settings` loading from `backend/.env`. `get_settings()` is `@lru_cache` — reset it in tests with `get_settings.cache_clear()`. The `DATABASE_URL` defaults to SQLite; swap it for PostgreSQL via env without code changes.

### Database

- **SQLite** in dev (`backend/data/taskgrid.db`); **PostgreSQL** in production/staging.
- `database.py` is dialect-aware: SQLite gets `StaticPool` + WAL pragma; PostgreSQL gets `QueuePool` with configurable `pool_size`, `max_overflow`, `pool_pre_ping`, and `pool_recycle`.
- `JSONB_TYPE` is exported from `database.py` — use this in all models for JSON columns. It resolves to `JSONB` on PostgreSQL and `JSON` on SQLite via `.with_variant()`.
- All `DateTime` columns use `DateTime(timezone=True)` → `TIMESTAMPTZ` on PostgreSQL. All `Mapped[]` annotations use Python's `datetime` type.
- Alembic URL is injected from `settings.DATABASE_URL` in `alembic/env.py` — `alembic.ini` has a blank URL by design. Running `alembic upgrade head` always picks up the active env var.
- On startup, `main.py` validates DB connectivity before proceeding. For SQLite it runs `create_all`; for PostgreSQL it skips `create_all` and expects Alembic to own the schema.
- `check_db_connection()` in `database.py` can be called anywhere for a live DB ping. The `/health` endpoint uses it and returns `dialect`, `connected`, and `latency_ms`.

### Frontend (`frontend/src/`)

- **Routing** — `App.tsx` is the route tree. All authenticated routes are wrapped in `ProtectedRoute` + `AppLayout`.
- **API layer** — one Axios instance in `api/client.ts`, prefixed `/api/v1`. All domain calls are in `api/*.ts` files. Vite proxies `/api` → `localhost:8000` in dev (configured in `vite.config.ts`).
- **Auth state** — Zustand store (`store/authStore.ts`) persisted to `localStorage` as `tg_auth`. Always use `useAuthStore` to read user/token; never read localStorage directly.
- **UI** — MUI v5 throughout. Custom theme in `theme.ts`. Reusable primitives in `components/common/` (`StatusChip`, `PriorityChip`, `MetricCard`, `PageHeader`, `EmptyState`).
- **Data fetching** — React Query. Prefer `useQuery`/`useMutation` patterns consistent with existing pages.

### Alembic + models contract

When adding a new model field:
1. Update the SQLAlchemy model in `models/`.
2. Update the Pydantic `*Out` schema in `schemas/`.
3. Run `alembic revision --autogenerate -m "..."` from `backend/`.
4. Inspect the generated migration before applying — autogenerate misses some things (e.g., `onupdate`, check constraints).

### Demo credentials (after `seed_demo.py`)

| Email | Password | Role |
|---|---|---|
| admin@taskgrid.io | admin123 | admin |
| manager@taskgrid.io | manager123 | manager |
| ops1@taskgrid.io | ops123 | operator |
| ops2@taskgrid.io | ops123 | operator |
| viewer@taskgrid.io | viewer123 | viewer |
