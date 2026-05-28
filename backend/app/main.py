from __future__ import annotations

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.exceptions import TaskGridException

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("taskgrid")


def create_app() -> FastAPI:
    app = FastAPI(
        title="TaskGrid API",
        description="Enterprise Workflow Automation & Human Task Orchestration",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = round((time.time() - start) * 1000, 1)
        logger.info(
            f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)"
        )
        return response

    @app.exception_handler(TaskGridException)
    async def taskgrid_exception_handler(request: Request, exc: TaskGridException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "status": exc.status_code,
                }
            },
        )

    prefix = "/api/v1"
    from app.routers import admin, approvals, auth, tasks, users, workflows

    app.include_router(auth.router,      prefix=f"{prefix}/auth",      tags=["Auth"])
    app.include_router(users.router,     prefix=f"{prefix}/users",     tags=["Users"])
    app.include_router(workflows.router, prefix=f"{prefix}/workflows", tags=["Workflows"])
    app.include_router(tasks.router,     prefix=f"{prefix}/tasks",     tags=["Tasks"])
    app.include_router(approvals.router, prefix=f"{prefix}/approvals", tags=["Approvals"])
    app.include_router(admin.router,     prefix=f"{prefix}/admin",     tags=["Admin"])

    # ------------------------------------------------------------------
    # Health check — includes live DB connectivity probe
    # ------------------------------------------------------------------
    @app.get("/health", tags=["Health"])
    def health():
        from app.database import check_db_connection, engine

        t0 = time.time()
        db_ok = check_db_connection()
        db_latency_ms = round((time.time() - t0) * 1000, 1)

        status = "ok" if db_ok else "degraded"
        return {
            "status": status,
            "service": "taskgrid-api",
            "db": {
                "connected": db_ok,
                "dialect": engine.dialect.name,
                "latency_ms": db_latency_ms,
            },
        }

    return app


app = create_app()


@app.on_event("startup")
async def on_startup():
    from app.database import Base, SessionLocal, check_db_connection, engine
    import app.models  # noqa: F401 — registers all ORM models

    # ------------------------------------------------------------------
    # Validate DB connectivity before doing anything else
    # ------------------------------------------------------------------
    if not check_db_connection():
        logger.error(
            "❌  Cannot reach the database. "
            f"Check DATABASE_URL: {settings.DATABASE_URL[:40]}..."
        )
        raise RuntimeError("Database is unreachable at startup.")

    logger.info(f"✅  Database connected ({engine.dialect.name})")

    # ------------------------------------------------------------------
    # Schema sync strategy:
    #   SQLite  (dev) → create_all is fine; Alembic is optional
    #   PostgreSQL    → Alembic owns the schema; skip create_all to
    #                   avoid accidentally hiding missing migrations
    # ------------------------------------------------------------------
    if not settings.is_postgres:
        Base.metadata.create_all(bind=engine)
        logger.info("📦  SQLite schema synced via create_all (dev mode)")
    else:
        logger.info(
            "🐘  PostgreSQL detected — schema managed by Alembic. "
            "Run: alembic upgrade head"
        )

    # ------------------------------------------------------------------
    # Seed default admin user if absent
    # ------------------------------------------------------------------
    from app.repositories.user_repository import UserRepository
    from app.schemas.user import UserCreate
    from app.services.user_service import UserService

    db = SessionLocal()
    try:
        repo = UserRepository(db)
        if not repo.get_by_email(settings.ADMIN_EMAIL):
            UserService(repo).create_user(
                UserCreate(
                    email=settings.ADMIN_EMAIL,
                    password=settings.ADMIN_PASSWORD,
                    full_name=settings.ADMIN_FULL_NAME,
                    role="admin",
                )
            )
            logger.info(f"🌱  Seeded admin user: {settings.ADMIN_EMAIL}")
    finally:
        db.close()
