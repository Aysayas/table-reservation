# Creates .env from .env.example if it is missing, then fills every EMPTY
# secret with a random value. Values that are already set are never touched,
# so this is safe to run on every start. Used by start.ps1, start-dev.bat
# and setup-new-project.ps1.

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example" -ForegroundColor Green
}

function New-HexSecret([int]$bytes) {
    $buf = New-Object byte[] $bytes
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
    return -join ($buf | ForEach-Object { $_.ToString('x2') })
}

# Same formats as 'php lava key:generate' / 'php lava jwt:generate'
$secrets = [ordered]@{
    APP_KEY           = 32
    JWT_SECRET        = 32
    REFRESH_TOKEN_KEY = 32
    DB_PASSWORD       = 16
    DB_ROOT_PASSWORD  = 16
}

$content = Get-Content ".env" -Raw
foreach ($key in $secrets.Keys) {
    if ($content -match "(?m)^$key=[ \t]*\r?$") {
        $content = $content -replace "(?m)^$key=[ \t]*(\r?)$", "$key=$(New-HexSecret $secrets[$key])`$1"
        Write-Host "  - $key generated in .env"
    } elseif ($content -notmatch "(?m)^$key=") {
        $content = $content.TrimEnd() + "`n$key=$(New-HexSecret $secrets[$key])`n"
        Write-Host "  - $key added to .env"
    }
}
Set-Content -Path ".env" -Value $content -NoNewline
