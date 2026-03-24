#!/bin/sh

echo "Deploying database migrations..."
npx --yes prisma@6 migrate deploy

echo "Starting application..."
exec "$@"