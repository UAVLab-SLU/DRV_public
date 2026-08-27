[CmdletBinding()]
param(
    [string]$Tag = "latest",
    [string]$ArchivePath,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$Owner = "UAVLab-SLU"
$Repo = "DRV-Unreal"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SimDir = Join-Path $ScriptDir "sim"
$ReleaseDir = Join-Path $SimDir "release"
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("drv-unreal-" + [System.Guid]::NewGuid())
$ZipPath = Join-Path $TempDir "drv-unreal-linux.zip"

function Get-GitHubToken {
    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
        return $env:GITHUB_TOKEN
    }

    $envPath = Join-Path $ScriptDir ".env"
    if (Test-Path -LiteralPath $envPath) {
        $tokenLine = Get-Content -LiteralPath $envPath |
            Where-Object { $_ -match '^GITHUB_TOKEN=(.+)$' } |
            Select-Object -First 1
        if ($tokenLine) {
            return ($tokenLine -replace '^GITHUB_TOKEN=', '').Trim()
        }
    }

    return $null
}

function Get-Launcher {
    param([Parameter(Mandatory = $true)][string]$Root)

    $launchers = Get-ChildItem -LiteralPath $Root -File -Recurse | Where-Object {
        $_.Name -in @('DRV.sh', 'Blocks.sh', 'SADE_drone_rep.sh')
    }

    foreach ($preferredName in @('DRV.sh', 'Blocks.sh', 'SADE_drone_rep.sh')) {
        $match = $launchers | Where-Object Name -eq $preferredName | Select-Object -First 1
        if ($match) {
            return $match
        }
    }

    return $null
}

function Install-ExtractedRelease {
    param(
        [Parameter(Mandatory = $true)][string]$ExtractedRoot,
        [Parameter(Mandatory = $true)][string]$ReleaseTag,
        [Parameter(Mandatory = $true)][string]$AssetName
    )

    $launcher = Get-Launcher -Root $ExtractedRoot
    if (-not $launcher) {
        throw "The Linux archive does not contain DRV.sh, Blocks.sh, or SADE_drone_rep.sh."
    }

    $sourceRoot = $launcher.Directory.FullName
    $stagingDir = Join-Path $SimDir ("release-staging-" + [System.Guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

    try {
        Get-ChildItem -LiteralPath $sourceRoot -Force |
            Copy-Item -Destination $stagingDir -Recurse -Force
        Set-Content -LiteralPath (Join-Path $stagingDir ".release-tag") -Value $ReleaseTag -NoNewline
        Set-Content -LiteralPath (Join-Path $stagingDir ".release-asset") -Value $AssetName -NoNewline

        if (Test-Path -LiteralPath $ReleaseDir) {
            $resolvedSimDir = [System.IO.Path]::GetFullPath($SimDir)
            $resolvedReleaseDir = [System.IO.Path]::GetFullPath($ReleaseDir)
            if (-not $resolvedReleaseDir.StartsWith($resolvedSimDir + [System.IO.Path]::DirectorySeparatorChar)) {
                throw "Refusing to replace release directory outside the sim directory: $resolvedReleaseDir"
            }
            Remove-Item -LiteralPath $ReleaseDir -Recurse -Force
        }

        Move-Item -LiteralPath $stagingDir -Destination $ReleaseDir
    }
    finally {
        if (Test-Path -LiteralPath $stagingDir) {
            Remove-Item -LiteralPath $stagingDir -Recurse -Force
        }
    }
}

$token = Get-GitHubToken
$apiHeaders = @{
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent" = "DRV-public-release-downloader"
}
$downloadHeaders = @{
    Accept = "application/octet-stream"
    "User-Agent" = "DRV-public-release-downloader"
}
if ($token) {
    $apiHeaders.Authorization = "Bearer $token"
    $downloadHeaders.Authorization = "Bearer $token"
}

New-Item -ItemType Directory -Force -Path $TempDir, $SimDir | Out-Null

try {
    if ($ArchivePath) {
        $resolvedArchive = (Resolve-Path -LiteralPath $ArchivePath).Path
        $releaseTag = if ($Tag -eq "latest") { "local" } else { $Tag }
        $assetName = Split-Path -Leaf $resolvedArchive
        Copy-Item -LiteralPath $resolvedArchive -Destination $ZipPath
    }
    else {
        $apiUrl = if ($Tag -eq "latest") {
            "https://api.github.com/repos/$Owner/$Repo/releases/latest"
        }
        else {
            "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag"
        }

        Write-Host "Checking $Owner/$Repo release $Tag"
        try {
            $release = Invoke-RestMethod -Uri $apiUrl -Headers $apiHeaders
        }
        catch {
            $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "unknown" }
            throw "GitHub release lookup failed with HTTP $statusCode. If the repository is private, set GITHUB_TOKEN in .env and authorize organization SSO."
        }

        $releaseTag = $release.tag_name
        $asset = $release.assets |
            Where-Object { $_.name -match '(?i)linux.*\.zip$' } |
            Sort-Object @{ Expression = { if ($_.name -ieq 'Linux.zip') { 0 } else { 1 } } } |
            Select-Object -First 1

        if (-not $asset) {
            $available = ($release.assets | ForEach-Object name) -join ", "
            throw "Release $releaseTag has no Linux zip asset. Available assets: $available"
        }

        $tagFile = Join-Path $ReleaseDir ".release-tag"
        if (-not $Force -and (Test-Path -LiteralPath $tagFile)) {
            $installedTag = (Get-Content -LiteralPath $tagFile -Raw).Trim()
            if ($installedTag -eq $releaseTag -and (Get-Launcher -Root $ReleaseDir)) {
                Write-Host "DRV-Unreal $releaseTag is already current."
                return
            }
        }

        $assetName = $asset.name
        Write-Host "Downloading $assetName from release $releaseTag"
        Invoke-WebRequest -Uri $asset.url -Headers $downloadHeaders -OutFile $ZipPath
    }

    $extractDir = Join-Path $TempDir "extract"
    New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
    Write-Host "Extracting $assetName"
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $extractDir -Force
    Install-ExtractedRelease -ExtractedRoot $extractDir -ReleaseTag $releaseTag -AssetName $assetName
    Write-Host "Installed DRV-Unreal $releaseTag into $ReleaseDir"
}
finally {
    if (Test-Path -LiteralPath $TempDir) {
        Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
