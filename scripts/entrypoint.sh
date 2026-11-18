#!/bin/sh

# Migra uploads antigos (versões que gravavam em public/uploads/documents) para a pasta privada
LEGACY_DIR="./public/uploads/documents"
STORAGE_DIR="${UPLOAD_DIR:-./storage/documents}"
if [ -d "$LEGACY_DIR" ]; then
  mkdir -p "$STORAGE_DIR"
  for f in "$LEGACY_DIR"/*; do
    [ -f "$f" ] || continue
    mv -n "$f" "$STORAGE_DIR"/ && echo "Moved legacy upload: $(basename "$f")"
  done
fi

echo "Deploying database migrations..."
npx --yes prisma@6 migrate deploy

echo "Running admin bootstrap..."
npx --yes tsx scripts/bootstrap-admin.ts

echo "Starting application..."
exec "$@"