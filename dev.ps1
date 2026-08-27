param(
    [Parameter(Position = 0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ScriptDir

function Show-Usage {
    Write-Host "Usage: .\dev.ps1 COMMAND"
    Write-Host "Commands: dev, frontend, backend, logs, logs-all, stop, stop-dev, clean"
    Write-Host "The full and simulator commands require ./dev.sh on a native Linux NVIDIA host."
}

switch ($Command) {
    "full" {
        throw "The Dockerized Unreal simulator is supported only on a native Linux NVIDIA host. Run './dev.sh full' on Linux."
    }
    "dev" { docker compose -f docker-compose.dev.yaml up }
    "frontend" { docker compose up frontend }
    "backend" { docker compose up backend }
    "simulator" {
        throw "The Dockerized Unreal simulator is supported only on a native Linux NVIDIA host. Run './dev.sh simulator' on Linux."
    }
    "logs" { docker compose -f docker-compose.dev.yaml logs -f frontend backend }
    "logs-all" { docker compose logs -f }
    "stop" { docker compose down }
    "stop-dev" { docker compose -f docker-compose.dev.yaml down }
    "clean" {
        docker compose down -v
        docker compose -f docker-compose.dev.yaml down -v
    }
    default { Show-Usage }
}
