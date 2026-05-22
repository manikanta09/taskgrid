# TaskGrid — Enterprise Workflow Automation Platform

TaskGrid is a demo-ready MVP for enterprise workflow automation and human task orchestration. It enables teams to define multi-step workflows, route tasks to human operators, and track task lifecycle end-to-end.

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| [architecture.md](./architecture.md) | System design, layers, and component relationships |
| [folder-structure.md](./folder-structure.md) | Full monorepo directory layout |
| [backend-modules.md](./backend-modules.md) | FastAPI module breakdown with responsibilities |
| [frontend-pages.md](./frontend-pages.md) | React pages, components, and routing |
| [database-schema.md](./database-schema.md) | SQLite entities, fields, and relationships |
| [api-reference.md](./api-reference.md) | Full REST API endpoint list |
| [implementation-plan.md](./implementation-plan.md) | 2-day sprint plan with ordered tasks |
| [mvp-scope.md](./mvp-scope.md) | Simplified scope with cut decisions |
| [future-extensibility.md](./future-extensibility.md) | AI workflow integration roadmap |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 + FastAPI |
| Frontend | React 18 + TypeScript + Vite |
| UI Library | shadcn/ui + Tailwind CSS |
| Database | SQLite (via SQLAlchemy) |
| Auth | JWT (access + refresh tokens) |
| Container | Docker + Docker Compose |
| State Mgmt | Zustand |
| HTTP Client | Axios + React Query |

---

## Quick Start (Docker)

```bash
git clone <repo>
cd taskgrid
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

Default admin credentials: `admin@taskgrid.io` / `admin123`
