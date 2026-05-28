from __future__ import annotations

from sqlalchemy import JSON, create_engine, event, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Dialect-aware JSON column type:
#   - JSONB on PostgreSQL  → binary storage, GIN-indexable, fast operators
#   - JSON  on SQLite      → text storage (dev / test only)
# ---------------------------------------------------------------------------
JSONB_TYPE = JSONB().with_variant(JSON(), "sqlite")


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
def _build_engine():
    url = settings.DATABASE_URL

    if url.startswith("sqlite"):
        # SQLite — single-file dev database
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )

        @event.listens_for(engine, "connect")
        def _set_sqlite_pragmas(dbapi_conn, _):
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA journal_mode=WAL")
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()

        return engine

    # PostgreSQL (and any other DSN) — production-grade pooling
    return create_engine(
        url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=settings.DB_POOL_PRE_PING,
        pool_recycle=settings.DB_POOL_RECYCLE,
        echo=False,
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Startup health check — verifies the DB is actually reachable
# ---------------------------------------------------------------------------
def check_db_connection() -> bool:
    """Return True if a DB round-trip succeeds, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
