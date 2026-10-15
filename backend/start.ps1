# LavaLust Docker Quick Start Script for Windows PowerShell

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host "Starting LavaLust Docker Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# .env with generated keys and passwords (only empty values are filled)
& "$PSScriptRoot\init-env.ps1"

# Start the stack and wait until MySQL is healthy
Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Cyan
docker compose up -d --build --wait
if ($LASTEXITCODE -ne 0) {
    Write-Host "docker compose up failed. See: docker compose logs" -ForegroundColor Red
    exit 1
}

# Apply pending migrations
docker compose exec -T app php lava migration run
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migrations failed. See the error above." -ForegroundColor Red
    exit 1
}

$appPort = (Select-String -Path ".env" -Pattern '^APP_PORT=(\d+)').Matches.Groups[1].Value
$pmaPort = (Select-String -Path ".env" -Pattern '^PMA_PORT=(\d+)').Matches.Groups[1].Value
if (-not $appPort) { $appPort = '80' }
if (-not $pmaPort) { $pmaPort = '8080' }

Write-Host ""
docker compose ps
Write-Host ""
Write-Host "Ready:" -ForegroundColor Green
Write-Host "   App:        http://localhost:$appPort" -ForegroundColor Yellow
Write-Host "   Health:     http://localhost:$appPort/health" -ForegroundColor Yellow
Write-Host "   phpMyAdmin: http://localhost:$pmaPort" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: docker compose down" -ForegroundColor Cyan
Write-Host ""
