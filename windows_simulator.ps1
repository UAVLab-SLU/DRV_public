[CmdletBinding()]
param(
    [ValidateSet("start", "stop", "status", "download")]
    [string]$Command = "start",
    [string]$Tag = "latest",
    [string]$ReleaseRoot = $env:DRV_WINDOWS_RELEASE_DIR,
    [switch]$ForceDownload,
    [switch]$SkipDownload
)

$ErrorActionPreference = "Stop"
$Owner = "UAVLab-SLU"
$Repo = "DRV-Unreal"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-LocalSetting {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Default
    )

    $environmentValue = [Environment]::GetEnvironmentVariable($Name)
    if (-not [string]::IsNullOrWhiteSpace($environmentValue)) {
        return $environmentValue
    }

    $envPath = Join-Path $ScriptDir ".env"
    if (Test-Path -LiteralPath $envPath) {
        $escapedName = [Regex]::Escape($Name)
        $line = Get-Content -LiteralPath $envPath |
            Where-Object { $_ -match "^$escapedName=(.+)$" } |
            Select-Object -First 1
        if ($line) {
            return ($line -replace "^$escapedName=", '').Trim()
        }
    }

    return $Default
}

$PixelStreamHttpPort = Get-LocalSetting -Name "PIXELSTREAM_HTTP_PORT" -Default "8888"
$PixelStreamStreamerPort = Get-LocalSetting -Name "PIXELSTREAM_STREAMER_PORT" -Default "8889"

if ([string]::IsNullOrWhiteSpace($ReleaseRoot)) {
    $ReleaseRoot = Join-Path $ScriptDir "sim\windows-release"
}
$ReleaseRoot = [System.IO.Path]::GetFullPath($ReleaseRoot)
$ArchiveDir = Join-Path $ReleaseRoot "archive"
$PackageDir = Join-Path $ReleaseRoot "package"
$TagFile = Join-Path $ReleaseRoot ".release-tag"
$PidFile = Join-Path $ReleaseRoot "drv-windows.pid"
$LogDir = Join-Path $ReleaseRoot "logs"

function Get-GitHubToken {
    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
        return $env:GITHUB_TOKEN
    }

    $envPath = Join-Path $ScriptDir ".env"
    if (Test-Path -LiteralPath $envPath) {
        $line = Get-Content -LiteralPath $envPath |
            Where-Object { $_ -match '^GITHUB_TOKEN=(.+)$' } |
            Select-Object -First 1
        if ($line) {
            return ($line -replace '^GITHUB_TOKEN=', '').Trim()
        }
    }

    if (Get-Command gh -ErrorAction SilentlyContinue) {
        $token = (& gh auth token 2>$null)
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($token)) {
            return $token.Trim()
        }
    }

    return $null
}

function Get-7ZipPath {
    $command = Get-Command 7z -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    foreach ($candidate in @(
        (Join-Path $env:ProgramFiles "7-Zip\7z.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "7-Zip\7z.exe")
    )) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
    }

    throw "7-Zip is required to extract the split Windows.z01 and Windows.zip release. Install 7-Zip and retry."
}

function Find-DRVExecutable {
    param([Parameter(Mandatory = $true)][string]$Root)

    if (-not (Test-Path -LiteralPath $Root)) {
        return $null
    }

    return Get-ChildItem -LiteralPath $Root -Recurse -File -Filter "*.exe" |
        Where-Object {
            $_.Name -match '^(DRV|Blocks|SADE_drone_rep)\.exe$' -and
            $_.FullName -notmatch '\\Engine\\Extras\\'
        } |
        Sort-Object @{ Expression = { $_.FullName.Length } } |
        Select-Object -First 1
}

function Assert-PathInsideReleaseRoot {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolved = [System.IO.Path]::GetFullPath($Path)
    if (-not $resolved.StartsWith($ReleaseRoot + [System.IO.Path]::DirectorySeparatorChar)) {
        throw "Refusing to modify a path outside the Windows release root: $resolved"
    }
}

function Get-ReleaseMetadata {
    $token = Get-GitHubToken
    $headers = @{
        Accept = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
        "User-Agent" = "DRV-public-windows-launcher"
    }
    if ($token) {
        $headers.Authorization = "Bearer $token"
    }

    $url = if ($Tag -eq "latest") {
        "https://api.github.com/repos/$Owner/$Repo/releases/latest"
    }
    else {
        "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag"
    }

    try {
        return [pscustomobject]@{
            Release = Invoke-RestMethod -Uri $url -Headers $headers
            Headers = $headers
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "unknown" }
        throw "GitHub release lookup failed with HTTP $statusCode. Authenticate with 'gh auth login' or set GITHUB_TOKEN."
    }
}

function Install-WindowsRelease {
    $metadata = Get-ReleaseMetadata
    $release = $metadata.Release
    $releaseTag = $release.tag_name
    $assets = @($release.assets | Where-Object { $_.name -match '(?i)^Windows\.(z\d+|zip)$' })

    if (-not ($assets.name -contains "Windows.zip")) {
        throw "Release $releaseTag does not contain Windows.zip."
    }

    $splitAssets = @($assets | Where-Object name -match '(?i)^Windows\.z\d+$')
    if ($splitAssets.Count -eq 0) {
        Write-Host "The release contains a single Windows.zip archive."
    }
    else {
        Write-Host "The release contains Windows.zip and $($splitAssets.Count) split archive segment(s)."
    }

    $existing = Find-DRVExecutable -Root $PackageDir
    if (-not $ForceDownload -and $existing -and (Test-Path -LiteralPath $TagFile)) {
        $installedTag = (Get-Content -LiteralPath $TagFile -Raw).Trim()
        if ($installedTag -eq $releaseTag) {
            Write-Host "DRV-Unreal Windows $releaseTag is already installed."
            return $existing
        }
    }

    New-Item -ItemType Directory -Force -Path $ArchiveDir | Out-Null
    foreach ($asset in $assets | Sort-Object name) {
        $destination = Join-Path $ArchiveDir $asset.name
        $needsDownload = $ForceDownload -or
            -not (Test-Path -LiteralPath $destination) -or
            (Get-Item -LiteralPath $destination).Length -ne [int64]$asset.size

        if ($needsDownload) {
            Write-Host "Downloading $($asset.name) from $releaseTag"
            $downloadHeaders = @{
                Accept = "application/octet-stream"
                "User-Agent" = "DRV-public-windows-launcher"
            }
            if ($metadata.Headers.Authorization) {
                $downloadHeaders.Authorization = $metadata.Headers.Authorization
            }
            Invoke-WebRequest -Uri $asset.url -Headers $downloadHeaders -OutFile $destination
        }

        if ($asset.digest -match '^sha256:(.+)$') {
            Write-Host "Verifying $($asset.name)"
            $expectedDigest = $Matches[1].ToLowerInvariant()
            $actualDigest = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($actualDigest -ne $expectedDigest) {
                throw "SHA256 mismatch for $($asset.name)."
            }
        }
    }

    $sevenZip = Get-7ZipPath
    $stagingDir = Join-Path $ReleaseRoot ("package-staging-" + [System.Guid]::NewGuid())
    Assert-PathInsideReleaseRoot -Path $stagingDir
    New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

    try {
        Write-Host "Extracting the Windows release"
        & $sevenZip x (Join-Path $ArchiveDir "Windows.zip") "-o$stagingDir" -y
        if ($LASTEXITCODE -ne 0) {
            throw "7-Zip extraction failed with exit code $LASTEXITCODE."
        }

        $launcher = Find-DRVExecutable -Root $stagingDir
        if (-not $launcher) {
            throw "The Windows release does not contain DRV.exe, Blocks.exe, or SADE_drone_rep.exe."
        }

        if (Test-Path -LiteralPath $PackageDir) {
            Assert-PathInsideReleaseRoot -Path $PackageDir
            Remove-Item -LiteralPath $PackageDir -Recurse -Force
        }
        Move-Item -LiteralPath $stagingDir -Destination $PackageDir
        Set-Content -LiteralPath $TagFile -Value $releaseTag -NoNewline
    }
    finally {
        if (Test-Path -LiteralPath $stagingDir) {
            Assert-PathInsideReleaseRoot -Path $stagingDir
            Remove-Item -LiteralPath $stagingDir -Recurse -Force
        }
    }

    $installed = Find-DRVExecutable -Root $PackageDir
    Write-Host "Installed DRV-Unreal Windows $releaseTag at $($installed.FullName)"
    return $installed
}

function Get-InstalledExecutable {
    if ($SkipDownload) {
        $existing = Find-DRVExecutable -Root $ReleaseRoot
        if (-not $existing) {
            throw "No packaged DRV Windows executable was found under $ReleaseRoot."
        }
        return $existing
    }

    return Install-WindowsRelease
}

function Get-DRVProcesses {
    return Get-CimInstance Win32_Process -Filter "Name='DRV.exe' OR Name='Blocks.exe' OR Name='SADE_drone_rep.exe'" |
        Where-Object {
            $_.ExecutablePath -and
            [System.IO.Path]::GetFullPath($_.ExecutablePath).StartsWith($ReleaseRoot + [System.IO.Path]::DirectorySeparatorChar)
        }
}

function Stop-DRVSimulator {
    $processes = @(Get-DRVProcesses)
    foreach ($process in $processes) {
        Write-Host "Stopping $($process.Name) PID $($process.ProcessId)"
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $PidFile) {
        Remove-Item -LiteralPath $PidFile -Force
    }
}

function Wait-ForSignalling {
    $deadline = (Get-Date).AddMinutes(2)
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$PixelStreamHttpPort" -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) {
                return
            }
        }
        catch {
        }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    throw "The Pixel Streaming player did not become available at http://localhost:$PixelStreamHttpPort."
}

function Start-DRVSimulator {
    Push-Location -LiteralPath $ScriptDir
    try {
        docker compose --profile windows-simulator up -d --force-recreate signalling
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to start the Pixel Streaming signalling service."
        }
    }
    finally {
        Pop-Location
    }
    Wait-ForSignalling

    $existingProcesses = @(Get-DRVProcesses)
    if ($existingProcesses.Count -gt 0) {
        Write-Host "DRV-Unreal is already running with PID $($existingProcesses[0].ProcessId)."
        Write-Host "Pixel Stream: http://localhost:$PixelStreamHttpPort"
        return
    }

    $executable = Get-InstalledExecutable

    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
    $arguments = @(
        "-AudioMixer",
        "-RenderOffscreen",
        "-PixelStreamingURL=ws://127.0.0.1:$PixelStreamStreamerPort",
        "-ResX=1920",
        "-ResY=1080",
        "-ForceRes",
        "-Unattended",
        "-NoSplash",
        "-StdOut",
        "-FullStdOutLogOutput"
    )

    $processOptions = @{
        FilePath = $executable.FullName
        ArgumentList = $arguments
        WorkingDirectory = $executable.Directory.FullName
        WindowStyle = "Hidden"
        RedirectStandardOutput = Join-Path $LogDir "drv-stdout.log"
        RedirectStandardError = Join-Path $LogDir "drv-stderr.log"
        PassThru = $true
    }
    $process = Start-Process @processOptions

    Set-Content -LiteralPath $PidFile -Value $process.Id -NoNewline
    Start-Sleep -Seconds 8
    if ($process.HasExited) {
        throw "DRV-Unreal exited during startup with code $($process.ExitCode). See $LogDir."
    }

    Write-Host "DRV-Unreal Windows is running with PID $($process.Id)."
    Write-Host "Pixel Stream: http://localhost:$PixelStreamHttpPort"
    Write-Host "Embedded player: http://localhost:3000/simulator"
}

switch ($Command) {
    "download" { Install-WindowsRelease | Out-Null }
    "start" { Start-DRVSimulator }
    "stop" { Stop-DRVSimulator }
    "status" {
        $processes = @(Get-DRVProcesses)
        if ($processes.Count -eq 0) {
            Write-Host "DRV-Unreal Windows is stopped."
        }
        else {
            $processes | Select-Object ProcessId, Name, ExecutablePath | Format-Table -AutoSize
        }
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$PixelStreamHttpPort" -UseBasicParsing -TimeoutSec 3
            Write-Host "Pixel Streaming player HTTP status: $($response.StatusCode)"
        }
        catch {
            Write-Host "Pixel Streaming player is unavailable."
        }
    }
}
