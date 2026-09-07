param(
    [Parameter(Position = 0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ScriptDir
$ControlPort = if ($env:SIMULATOR_CONTROL_PORT) { $env:SIMULATOR_CONTROL_PORT } else { "8890" }
$ControlPidFile = Join-Path $ScriptDir "sim\windows-control.pid"
if (-not $env:AIRSIM_HOST) { $env:AIRSIM_HOST = "host.docker.internal" }
if (-not $env:AIRSIM_SETTINGS_DIR) {
    $env:AIRSIM_SETTINGS_DIR = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "AirSim"
}
New-Item -ItemType Directory -Force -Path $env:AIRSIM_SETTINGS_DIR | Out-Null

function Start-SimulatorControl {
    param(
        [switch]$SkipDownload
    )

    try {
        Invoke-RestMethod -Uri "http://127.0.0.1:$ControlPort/status" -TimeoutSec 5 | Out-Null
        return
    }
    catch {
    }

    $powerShellPath = (Get-Process -Id $PID).Path
    $controlScript = Join-Path $ScriptDir "windows_simulator_control.ps1"
    $skipArgument = if ($SkipDownload -or $env:DRV_WINDOWS_SKIP_DOWNLOAD -eq "1") { " -SkipDownload" } else { "" }
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$controlScript`" -Port $ControlPort$skipArgument"
    $process = Start-Process -FilePath $powerShellPath -ArgumentList $arguments -WindowStyle Hidden -PassThru
    Set-Content -LiteralPath $ControlPidFile -Value $process.Id -NoNewline

    $deadline = (Get-Date).AddSeconds(45)
    do {
        try {
            Invoke-RestMethod -Uri "http://127.0.0.1:$ControlPort/status" -TimeoutSec 5 | Out-Null
            return
        }
        catch {
            if ($process.HasExited) {
                throw "The Windows simulator control service exited during startup with code $($process.ExitCode)."
            }
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)
    throw "The Windows simulator control service did not start on port $ControlPort."
}

function Stop-SimulatorControl {
    try {
        Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$ControlPort/shutdown" -TimeoutSec 3 | Out-Null
    }
    catch {
        if (Test-Path -LiteralPath $ControlPidFile) {
            $storedPid = (Get-Content -LiteralPath $ControlPidFile -Raw).Trim()
            if ($storedPid -match '^\d+$') {
                Stop-Process -Id ([int]$storedPid) -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Remove-Item -LiteralPath $ControlPidFile -Force -ErrorAction SilentlyContinue
}

function Show-Usage {
    Write-Host "Usage: .\dev.ps1 COMMAND"
    Write-Host "Commands: full, dev, restart, frontend, backend, simulator, simulator-stop, simulator-status, logs, logs-all, stop, stop-dev, clean"
}

switch ($Command) {
    "full" {
        if ($env:DRV_WINDOWS_SKIP_DOWNLOAD -eq "1") {
            $env:DRONELUME_CONFIG_DIR = (& "$ScriptDir\windows_simulator.ps1" config-dir -SkipDownload)
        }
        else {
            $env:DRONELUME_CONFIG_DIR = (& "$ScriptDir\windows_simulator.ps1" prepare | Select-Object -Last 1)
        }
        Start-SimulatorControl -SkipDownload
        docker compose up -d --build frontend backend fake-gcs init-storage
        if ($LASTEXITCODE -ne 0) { throw "Unable to start the application services." }
        & "$ScriptDir\windows_simulator.ps1" start -SkipDownload
    }
    "dev" {
        Start-SimulatorControl
        docker compose -f docker-compose.dev.yaml up
    }
    "restart" {
        docker compose -f docker-compose.dev.yaml restart backend frontend
        if ($LASTEXITCODE -ne 0) { throw "Unable to restart the development services." }
    }
    "frontend" {
        Start-SimulatorControl
        docker compose up frontend
    }
    "backend" { docker compose up backend }
    "simulator" {
        Start-SimulatorControl
        if ($env:DRV_WINDOWS_SKIP_DOWNLOAD -eq "1") {
            & "$ScriptDir\windows_simulator.ps1" start -SkipDownload
        }
        else {
            & "$ScriptDir\windows_simulator.ps1" start
        }
    }
    "simulator-stop" { & "$ScriptDir\windows_simulator.ps1" stop }
    "simulator-status" { & "$ScriptDir\windows_simulator.ps1" status }
    "logs" { docker compose -f docker-compose.dev.yaml logs -f frontend backend }
    "logs-all" { docker compose --profile windows-simulator logs -f }
    "stop" {
        & "$ScriptDir\windows_simulator.ps1" stop
        Stop-SimulatorControl
        docker compose --profile windows-simulator down
    }
    "stop-dev" { docker compose -f docker-compose.dev.yaml down }
    "clean" {
        & "$ScriptDir\windows_simulator.ps1" stop
        Stop-SimulatorControl
        docker compose --profile windows-simulator down -v
        docker compose -f docker-compose.dev.yaml down -v
    }
    default { Show-Usage }
}
