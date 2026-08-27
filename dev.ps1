param(
    [Parameter(Position = 0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ScriptDir

function Show-Usage {
    Write-Host "Usage: .\dev.ps1 COMMAND"
    Write-Host "Commands: full, dev, frontend, backend, simulator, simulator-stop, simulator-status, logs, logs-all, stop, stop-dev, clean"
}

switch ($Command) {
    "full" {
        docker compose up -d --build frontend backend fake-gcs
        if ($LASTEXITCODE -ne 0) { throw "Unable to start the application services." }
        & "$ScriptDir\windows_simulator.ps1" start
    }
    "dev" { docker compose -f docker-compose.dev.yaml up }
    "frontend" { docker compose up frontend }
    "backend" { docker compose up backend }
    "simulator" { & "$ScriptDir\windows_simulator.ps1" start }
    "simulator-stop" { & "$ScriptDir\windows_simulator.ps1" stop }
    "simulator-status" { & "$ScriptDir\windows_simulator.ps1" status }
    "logs" { docker compose -f docker-compose.dev.yaml logs -f frontend backend }
    "logs-all" { docker compose --profile windows-simulator logs -f }
    "stop" {
        & "$ScriptDir\windows_simulator.ps1" stop
        docker compose --profile windows-simulator down
    }
    "stop-dev" { docker compose -f docker-compose.dev.yaml down }
    "clean" {
        & "$ScriptDir\windows_simulator.ps1" stop
        docker compose --profile windows-simulator down -v
        docker compose -f docker-compose.dev.yaml down -v
    }
    default { Show-Usage }
}
