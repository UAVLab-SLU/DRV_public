param(
    [Parameter(Position = 0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ScriptDir

function Import-GitHubToken {
    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
        return
    }
    if (Test-Path -LiteralPath ".env") {
        $line = Get-Content -LiteralPath ".env" |
            Where-Object { $_ -match '^GITHUB_TOKEN=(.+)$' } |
            Select-Object -First 1
        if ($line) {
            $env:GITHUB_TOKEN = ($line -replace '^GITHUB_TOKEN=', '').Trim()
            return
        }
    }
    throw "GITHUB_TOKEN is required when UAVLab-SLU/DRV-Unreal is private. Run '.\dev.ps1 token'."
}

function Set-GitHubToken {
    $secureToken = Read-Host "GitHub personal access token" -AsSecureString
    $pointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    try {
        $token = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "No token provided."
    }

    $content = if (Test-Path -LiteralPath ".env") { Get-Content -LiteralPath ".env" } else { @() }
    $filtered = @($content | Where-Object { $_ -notmatch '^GITHUB_TOKEN=' })
    @($filtered; "GITHUB_TOKEN=$token") | Set-Content -LiteralPath ".env"
    $env:GITHUB_TOKEN = $token
    Write-Host "Saved GITHUB_TOKEN in .env."
}

function Set-PixelStreamPublicIP {
    if (-not [string]::IsNullOrWhiteSpace($env:PIXELSTREAM_PUBLIC_IP)) {
        return
    }
    if (Test-Path -LiteralPath ".env") {
        $line = Get-Content -LiteralPath ".env" |
            Where-Object { $_ -match '^PIXELSTREAM_PUBLIC_IP=(.+)$' } |
            Select-Object -First 1
        if ($line) {
            $env:PIXELSTREAM_PUBLIC_IP = ($line -replace '^PIXELSTREAM_PUBLIC_IP=', '').Trim()
            return
        }
    }
    $network = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
        Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' -and $_.IPv4Address } |
        Select-Object -First 1
    $env:PIXELSTREAM_PUBLIC_IP = if ($network) { $network.IPv4Address.IPAddress } else { "127.0.0.1" }
}

function Sync-UnrealRelease {
    Import-GitHubToken
    & "$ScriptDir\download_sim_release.ps1" -Tag latest
    $env:DRV_RELEASE_TAG = (Get-Content -LiteralPath "$ScriptDir\sim\release\.release-tag" -Raw).Trim()
}

function Get-PixelStreamHttpPort {
    if ([string]::IsNullOrWhiteSpace($env:PIXELSTREAM_HTTP_PORT)) {
        return "8888"
    }
    return $env:PIXELSTREAM_HTTP_PORT
}

function Show-Usage {
    Write-Host "Usage: .\dev.ps1 COMMAND"
    Write-Host "Commands: token, full, dev, frontend, backend, simulator, logs, logs-all, stop, stop-dev, clean"
}

switch ($Command) {
    "token" { Set-GitHubToken }
    "full" {
        Set-PixelStreamPublicIP
        Sync-UnrealRelease
        Write-Host "Pixel Stream URL: http://localhost:$(Get-PixelStreamHttpPort)"
        docker compose up --build
    }
    "dev" { docker compose -f docker-compose.dev.yaml up }
    "frontend" { docker compose up frontend }
    "backend" { docker compose up backend }
    "simulator" {
        Set-PixelStreamPublicIP
        Sync-UnrealRelease
        Write-Host "Pixel Stream URL: http://localhost:$(Get-PixelStreamHttpPort)"
        docker compose up --build signalling drv-unreal
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
