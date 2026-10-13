#!/usr/bin/env bash
# ==============================================================================
# CPC Marketplace — PostgreSQL Database Restore Script (Linux/Production)
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_URL="${DATABASE_URL:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh <path-to-backup.sql.gz>" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file $BACKUP_FILE not found" >&2
  exit 1
fi

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL is not set" >&2
  exit 1
fi

echo "WARNING: Restoring will overwrite existing tables in the database!"
echo "Target DB: $DB_URL"
echo "Backup:    $BACKUP_FILE"
read -r -p "Type 'RESTORE' to proceed: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Restore cancelled by user."
  exit 0
fi

echo "==> Restoring database from $BACKUP_FILE..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql --dbname="$DB_URL"
else
  psql --dbname="$DB_URL" < "$BACKUP_FILE"
fi

echo "==> Restore complete!"
