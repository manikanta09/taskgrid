from __future__ import annotations
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.config import get_settings
from app.core.exceptions import TaskGridException
from app.routers import auth, users, workflows, tasks, approvals, admin

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
        logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
        return response

    @app.exception_handler(TaskGridException)
    async def taskgrid_exception_handler(request: Request, exc: TaskGridException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message, "status": exc.status_code}},
        )

    prefix = "/api/v1"
    app.include_router(auth.router,      prefix=f"{prefix}/auth",      tags=["Auth"])
    app.include_router(users.router,     prefix=f"{prefix}/users",     tags=["Users"])
    app.include_router(workflows.router, prefix=f"{prefix}/workflows", tags=["Workflows"])
    app.include_router(tasks.router,     prefix=f"{prefix}/tasks",     tags=["Tasks"])
    app.include_router(approvals.router, prefix=f"{prefix}/approvals", tags=["Approvals"])
    app.include_router(admin.router,     prefix=f"{prefix}/admin",     tags=["Admin"])

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok", "service": "taskgrid-api"}

    return app


app = create_app()


@app.on_event("startup")
async def on_startup():
    from app.database import engine, Base
    import app.models  # noqa: F401 — ensures all models are registered
    Base.metadata.create_all(bind=engine)

    from app.database import SessionLocal
    from app.services.user_service import UserService
    from app.repositories.user_repository import UserRepository
    from app.schemas.user import UserCreate
    db = SessionLocal()
    try:
        repo = UserRepository(db)
        svc = UserService(repo)
        if not repo.get_by_email(settings.ADMIN_EMAIL):
            svc.create_user(UserCreate(
                email=settings.ADMIN_EMAIL,
                password=settings.ADMIN_PASSWORD,
                full_name=settings.ADMIN_FULL_NAME,
                role="admin",
            ))
            logger.info(f"Seeded admin user: {settings.ADMIN_EMAIL}")
    finally:
        db.close()
