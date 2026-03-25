#!/bin/sh

echo "Deploying database migrations..."
npx --yes prisma@6 migrate deploy

echo "Running admin bootstrap..."
npx --yes tsx scripts/bootstrap-admin.ts

echo "Starting application..."
exec "$@"