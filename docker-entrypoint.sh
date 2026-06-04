#!/bin/sh
set -e

echo "=== AeroMaint Docker Entrypoint ==="

# Initialize database if it doesn't exist
if [ ! -f /app/db/aeromaint.db ]; then
  echo "Initializing database..."
  npx prisma db push --skip-generate
  echo "Database initialized. Seeding default data..."
  npx tsx prisma/seed.ts 2>/dev/null || echo "Seed completed with warnings."
else
  echo "Database already exists. Checking for schema updates..."
  npx prisma db push --skip-generate 2>/dev/null || true
fi

echo "Starting AeroMaint..."
exec node server.js
