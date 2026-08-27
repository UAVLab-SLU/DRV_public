[CmdletBinding()]
param(
    [int]$Port = $(if ($env:SIMULATOR_CONTROL_PORT) { [int]$env:SIMULATOR_CONTROL_PORT } else { 8890 }),
    [string]$ReleaseRoot = $env:DRV_WINDOWS_RELEASE_DIR,
    [switch]$SkipDownload
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SimulatorScript = Join-Path $ScriptDir "windows_simulator.ps1"

if ([string]::IsNullOrWhiteSpace($ReleaseRoot)) {
    $ReleaseRoot = Join-Path $ScriptDir "sim\windows-release"
}
$ReleaseRoot = [System.IO.Path]::GetFullPath($ReleaseRoot)
$SimulatorPidFile = Join-Path $ReleaseRoot "drv-windows.pid"

function Get-SimulatorState {
    $running = $false
    $processId = $null
    if (Test-Path -LiteralPath $SimulatorPidFile) {
        $storedPid = (Get-Content -LiteralPath $SimulatorPidFile -Raw).Trim()
        if ($storedPid -match '^\d+$') {
            $process = Get-Process -Id ([int]$storedPid) -ErrorAction SilentlyContinue
            if ($process) {
                $running = $true
                $processId = $process.Id
            }
        }
    }

    $httpPort = if ($env:PIXELSTREAM_HTTP_PORT) { $env:PIXELSTREAM_HTTP_PORT } else { "8888" }
    $playerAvailable = $false
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$httpPort" -UseBasicParsing -TimeoutSec 2
        $playerAvailable = $response.StatusCode -eq 200
    }
    catch {
    }

    return [ordered]@{
        running = $running
        processId = $processId
        playerAvailable = $playerAvailable
        releaseRoot = $ReleaseRoot
    }
}

function Write-HttpResponse {
    param(
        [Parameter(Mandatory = $true)]$Stream,
        [Parameter(Mandatory = $true)][int]$StatusCode,
        [Parameter(Mandatory = $true)]$Body,
        [string]$Origin = ""
    )

    $statusText = switch ($StatusCode) {
        200 { "OK" }
        202 { "Accepted" }
        204 { "No Content" }
        403 { "Forbidden" }
        404 { "Not Found" }
        default { "Internal Server Error" }
    }
    $json = if ($StatusCode -eq 204) { "" } else { $Body | ConvertTo-Json -Depth 6 -Compress }
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $allowedOrigin = if ($Origin -in @("http://localhost:3000", "http://127.0.0.1:3000")) { $Origin } else { "http://localhost:3000" }
    $headers = @(
        "HTTP/1.1 $StatusCode $statusText",
        "Content-Type: application/json; charset=utf-8",
        "Content-Length: $($bodyBytes.Length)",
        "Access-Control-Allow-Origin: $allowedOrigin",
        "Access-Control-Allow-Methods: GET, POST, OPTIONS",
        "Access-Control-Allow-Headers: Content-Type",
        "Connection: close",
        "",
        ""
    ) -join "`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($bodyBytes.Length -gt 0) {
        $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
    }
    $Stream.Flush()
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Windows simulator control API listening on http://127.0.0.1:$Port"

$keepRunning = $true
try {
    while ($keepRunning) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()
            $headers = @{}
            while ($true) {
                $line = $reader.ReadLine()
                if ([string]::IsNullOrEmpty($line)) { break }
                $separator = $line.IndexOf(':')
                if ($separator -gt 0) {
                    $headers[$line.Substring(0, $separator).Trim()] = $line.Substring($separator + 1).Trim()
                }
            }

            $parts = $requestLine -split ' '
            $method = $parts[0]
            $path = ($parts[1] -split '\?')[0]
            $origin = $headers["Origin"]
            $allowedOrigins = @("http://localhost:3000", "http://127.0.0.1:3000")

            if ($method -eq "OPTIONS") {
                Write-HttpResponse -Stream $stream -StatusCode 204 -Body @{} -Origin $origin
                continue
            }
            if ($method -eq "POST" -and $origin -and $origin -notin $allowedOrigins) {
                Write-HttpResponse -Stream $stream -StatusCode 403 -Body @{ error = "Origin is not allowed" } -Origin $origin
                continue
            }

            switch ("$method $path") {
                "GET /status" {
                    Write-HttpResponse -Stream $stream -StatusCode 200 -Body (Get-SimulatorState) -Origin $origin
                }
                "POST /start" {
                    $state = Get-SimulatorState
                    if (-not $state.running) {
                        $powerShellPath = (Get-Process -Id $PID).Path
                        $skipArgument = if ($SkipDownload) { " -SkipDownload" } else { "" }
                        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$SimulatorScript`" start -ReleaseRoot `"$ReleaseRoot`"$skipArgument"
                        Start-Process -FilePath $powerShellPath -ArgumentList $arguments -WindowStyle Hidden | Out-Null
                    }
                    Write-HttpResponse -Stream $stream -StatusCode 202 -Body ([ordered]@{ status = "starting"; state = (Get-SimulatorState) }) -Origin $origin
                }
                "POST /stop" {
                    & $SimulatorScript stop -ReleaseRoot $ReleaseRoot | Out-Null
                    Write-HttpResponse -Stream $stream -StatusCode 200 -Body ([ordered]@{ status = "stopped"; state = (Get-SimulatorState) }) -Origin $origin
                }
                "POST /shutdown" {
                    Write-HttpResponse -Stream $stream -StatusCode 200 -Body @{ status = "control service stopping" } -Origin $origin
                    $keepRunning = $false
                }
                default {
                    Write-HttpResponse -Stream $stream -StatusCode 404 -Body @{ error = "Not found" } -Origin $origin
                }
            }
        }
        catch {
            try {
                Write-HttpResponse -Stream $stream -StatusCode 500 -Body @{ error = $_.Exception.Message }
            }
            catch {
            }
        }
        finally {
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
