#!/bin/sh
set -e

echo "⏳  Waiting for PostgreSQL to be ready..."
# pg_isready is included in psycopg2-binary's dependencies; fall back to a simple check
until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
  sleep 1
done
echo "✅  PostgreSQL is ready"

echo "🔄  Running Alembic migrations..."
alembic upgrade head
echo "✅  Migrations complete"

echo "🚀  Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
