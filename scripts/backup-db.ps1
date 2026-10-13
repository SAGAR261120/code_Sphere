# ==============================================================================
# CPC Marketplace — PostgreSQL Automated Backup Script (Windows PowerShell)
# ==============================================================================

param (
    [string]$BackupDir = "backups",
    [string]$DbUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

if (-not $DbUrl) {
    Write-Error "DATABASE_URL environment variable is not defined."
    exit 1
}

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$BackupFile = Join-Path -Path $BackupDir -ChildPath "cpc_marketplace_backup_$Timestamp.sql"

Write-Host "==> Starting database backup at $(Get-Date)..." -ForegroundColor Cyan
Write-Host "==> Target file: $BackupFile"

try {
    # Using pg_dump
    pg_dump --dbname=$DbUrl --format=plain --no-owner --no-privileges --file=$BackupFile
    
    if (Test-Path -Path $BackupFile) {
        $FileSize = (Get-Item $BackupFile).Length
        Write-Host "==> Backup completed successfully! ($FileSize bytes)" -ForegroundColor Green
        
        # Keep last 14 backups, remove older
        Get-ChildItem -Path $BackupDir -Filter "cpc_marketplace_backup_*.sql" |
            Sort-Object CreationTime -Descending |
            Select-Object -Skip 14 |
            Remove-Item -Force
            
        Write-Host "==> Rotated older backup archives." -ForegroundColor Gray
    } else {
        throw "Backup file was not created."
    }
} catch {
    Write-Error "Backup failed: $_"
    exit 1
}
