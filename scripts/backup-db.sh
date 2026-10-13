#!/usr/bin/env bash
# ==============================================================================
# CPC Marketplace — PostgreSQL Automated Backup Script (Linux/Production)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL is not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/cpc_marketplace_backup_${TIMESTAMP}.sql.gz"

echo "==> Starting database backup: $BACKUP_FILE"
pg_dump --dbname="$DB_URL" --format=plain --no-owner --no-privileges | gzip > "$BACKUP_FILE"

FILE_SIZE=$(wc -c < "$BACKUP_FILE")
echo "==> Backup completed successfully (${FILE_SIZE} bytes)"

# Keep last 14 backups, remove older
find "$BACKUP_DIR" -name "cpc_marketplace_backup_*.sql.gz" -type f -mtime +14 -delete
echo "==> Rotated backups older than 14 days"
