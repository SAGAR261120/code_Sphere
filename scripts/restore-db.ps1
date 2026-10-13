# ==============================================================================
# CPC Marketplace — PostgreSQL Database Restore Script (Windows PowerShell)
# ==============================================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbUrl = $env:DATABASE_URL,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

if (-not $DbUrl) {
    Write-Error "DATABASE_URL environment variable is not defined."
    exit 1
}

Write-Warning "CAUTION: Restoring a database will overwrite existing tables in the target database!"
Write-Host "Target Database: $DbUrl"
Write-Host "Backup Archive:  $BackupFile"

if (-not $Force) {
    $Confirmation = Read-Host "Are you absolutely sure you want to proceed with restore? Type 'RESTORE' to confirm"
    if ($Confirmation -ne "RESTORE") {
        Write-Host "Restore operation aborted by user." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "==> Executing restore from $BackupFile..." -ForegroundColor Cyan

try {
    psql --dbname=$DbUrl --file=$BackupFile
    Write-Host "==> Database restore completed successfully!" -ForegroundColor Green
} catch {
    Write-Error "Database restore failed: $_"
    exit 1
}
