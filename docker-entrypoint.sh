#!/bin/sh
set -e

echo "=== AeroMaint Docker Entrypoint ==="

# Initialize database if it doesn't exist
if [ ! -f /app/db/aeromaint.db ]; then
  echo "Initializing database..."
  npx prisma db push --skip-generate
  echo "Database initialized."
else
  echo "Database already exists. Checking for migrations..."
  npx prisma db push --skip-generate 2>/dev/null || true
fi

echo "Starting AeroMaint..."
exec node server.js
