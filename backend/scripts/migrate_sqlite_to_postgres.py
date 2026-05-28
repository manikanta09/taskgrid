"""
SQLite → PostgreSQL data migration script
==========================================

Usage:
    python scripts/migrate_sqlite_to_postgres.py \
        --sqlite  sqlite:///./data/taskgrid.db \
        --postgres postgresql://taskgrid:taskgrid_secret@localhost:5432/taskgrid

What it does:
  1. Connects to both databases
  2. Copies rows table-by-table in FK-safe dependency order
  3. Converts naive datetimes to UTC-aware (SQLite stores them as naive)
  4. Resets PostgreSQL sequences to match the highest imported IDs
  5. Prints a row-count verification summary

Prerequisites:
  - PostgreSQL schema already applied: alembic upgrade head
  - psycopg2-binary installed (included in requirements.txt)
  - Run from backend/ with venv active
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import create_engine, inspect, text


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _to_utc(value: Any) -> Any:
    """Attach UTC timezone to naive datetime objects from SQLite."""
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _fix_row(row: dict) -> dict:
    """Normalise a raw SQLite row for PostgreSQL insertion."""
    return {k: _to_utc(v) for k, v in row.items()}


# ─────────────────────────────────────────────────────────────────────────────
# Migration
# ─────────────────────────────────────────────────────────────────────────────

# Tables listed in FK dependency order — parents before children
MIGRATION_ORDER = [
    "users",
    "workflows",
    "tasks",
    "task_assignments",
    "approvals",
    "audit_logs",
]


def migrate(sqlite_url: str, postgres_url: str, dry_run: bool = False) -> None:
    print(f"\n{'='*60}")
    print("  TaskGrid SQLite → PostgreSQL Migration")
    print(f"{'='*60}")
    print(f"  Source : {sqlite_url}")
    print(f"  Target : {postgres_url[:postgres_url.index('@') + 1]}***")
    print(f"  Mode   : {'DRY RUN (no writes)' if dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    src = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    dst = create_engine(postgres_url)

    # ── Verify source tables exist ───────────────────────────────────────────
    src_tables = inspect(src).get_table_names()
    for table in MIGRATION_ORDER:
        if table not in src_tables:
            print(f"⚠️   Table '{table}' not found in SQLite — skipping.")

    # ── Verify PostgreSQL schema is ready ────────────────────────────────────
    dst_tables = inspect(dst).get_table_names()
    missing = [t for t in MIGRATION_ORDER if t not in dst_tables]
    if missing:
        print(
            f"❌  PostgreSQL is missing tables: {missing}\n"
            "    Run 'alembic upgrade head' first, then re-run this script."
        )
        sys.exit(1)

    total_migrated = 0

    with src.connect() as src_conn, dst.connect() as dst_conn:
        for table in MIGRATION_ORDER:
            if table not in src_tables:
                continue

            rows = src_conn.execute(text(f"SELECT * FROM {table}")).mappings().all()
            count = len(rows)

            if count == 0:
                print(f"  {table:<25} 0 rows — skipped")
                continue

            fixed_rows = [_fix_row(dict(row)) for row in rows]

            if not dry_run:
                # Disable FK checks during bulk insert to avoid ordering issues
                # within a table (e.g. audit_logs referencing tasks not yet flushed)
                dst_conn.execute(text("SET session_replication_role = 'replica'"))
                try:
                    dst_conn.execute(
                        text(f"TRUNCATE TABLE {table} CASCADE")
                    )
                    dst_conn.execute(
                        dst.dialect.statement_compiler(
                            dst.dialect,
                            None,
                        ).visit_insert  # Let SQLAlchemy core handle parameterised insert
                        if False  # pragma: unreachable — use raw execute below
                        else text(
                            f"INSERT INTO {table} ({', '.join(fixed_rows[0].keys())}) "
                            f"VALUES ({', '.join(':' + k for k in fixed_rows[0].keys())})"
                        ),
                        fixed_rows,
                    )
                finally:
                    dst_conn.execute(text("SET session_replication_role = 'origin'"))

                # Reset PG sequence so next INSERT gets the right auto-increment ID
                if "id" in fixed_rows[0]:
                    max_id = max(r["id"] for r in fixed_rows)
                    dst_conn.execute(
                        text(
                            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), {max_id})"
                        )
                    )

                dst_conn.commit()

            total_migrated += count
            print(f"  ✅  {table:<25} {count:>6} rows {'(dry run)' if dry_run else 'migrated'}")

    print(f"\n{'='*60}")
    print(f"  Total rows {'to migrate' if dry_run else 'migrated'}: {total_migrated}")
    print(f"{'='*60}\n")

    # ── Verification ─────────────────────────────────────────────────────────
    if not dry_run:
        print("  Verification (row counts):")
        print(f"  {'Table':<25} {'SQLite':>8}  {'PostgreSQL':>10}  {'Match':>6}")
        print(f"  {'-'*25} {'-'*8}  {'-'*10}  {'-'*6}")
        with src.connect() as sc, dst.connect() as dc:
            all_match = True
            for table in MIGRATION_ORDER:
                if table not in src_tables:
                    continue
                src_n = sc.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                dst_n = dc.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                match = "✅" if src_n == dst_n else "❌"
                if src_n != dst_n:
                    all_match = False
                print(f"  {table:<25} {src_n:>8}  {dst_n:>10}  {match:>6}")

        if all_match:
            print("\n  ✅  All counts match. Migration successful!")
        else:
            print("\n  ❌  Count mismatch detected — investigate before switching over.")
            sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Migrate TaskGrid data from SQLite to PostgreSQL"
    )
    parser.add_argument(
        "--sqlite",
        default="sqlite:///./data/taskgrid.db",
        help="SQLAlchemy URL for the source SQLite database",
    )
    parser.add_argument(
        "--postgres",
        default="postgresql://taskgrid:taskgrid_secret@localhost:5432/taskgrid",
        help="SQLAlchemy URL for the target PostgreSQL database",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be migrated without writing anything",
    )
    args = parser.parse_args()

    migrate(sqlite_url=args.sqlite, postgres_url=args.postgres, dry_run=args.dry_run)
