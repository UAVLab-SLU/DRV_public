# Unreal Windows native Pixel Streaming

This workflow runs the packaged Windows Unreal application directly on the
Windows host. Docker Compose provides the Pixel Streaming signalling server,
TURN relay, frontend, backend, and storage services. The browser player remains
available at <http://localhost:8888>, and the frontend embeds it at
<http://localhost:3000/simulator>.

The Simulator page includes Start Unreal, Shut down, and Refresh controls. A
small PowerShell control service listens only on `127.0.0.1:8890` and translates
those browser requests into the same guarded simulator helper commands.

## Prerequisites

- Windows 10 or 11
- Docker Desktop running Linux containers
- Docker Compose v2
- 7-Zip installed in its default location or available as `7z`
- A GPU and driver supported by the packaged Unreal application
- Access to the private `UAVLab-SLU/DRV-Unreal` releases
- A GitHub token in `GITHUB_TOKEN`, the root `.env`, or an authenticated GitHub
  CLI session
- At least 6 GB free disk space for the split archive and extracted package

## Start the complete application

From the repository root in PowerShell:

```powershell
.\dev.ps1 full
```

This starts the regular application services, downloads the latest Windows
release when necessary, extracts it, starts the signalling service, and runs
the packaged executable with offscreen rendering. Open
<http://localhost:3000/simulator> to use the embedded stream.

Before starting the backend, the full workflow discovers the packaged
`DRV\Config` directory and mounts it at `/app/dronelume-config`. DroneLume
submissions therefore update the `InitDSL.json` read by the same native Unreal
package that is running.

To start only signalling and Unreal:

```powershell
.\dev.ps1 simulator
```

The release cache defaults to the ignored `sim/windows-release` directory. Set
`DRV_WINDOWS_RELEASE_DIR` before launch to use another drive:

```powershell
$env:DRV_WINDOWS_RELEASE_DIR = "G:\DRV-Unreal-Windows"
.\dev.ps1 simulator
```

## Release updates

The helper queries the GitHub latest-release endpoint each time it starts. It
selects all numbered Windows archive parts and the final `Windows.zip`, checks
their recorded sizes and SHA-256 digests, then extracts them with 7-Zip. The
cached package is reused when its release tag matches the current latest tag.

`dev.ps1 full` performs this latest-tag check once. When the installed tag and
launcher match, it skips archive downloads, checksum work, and extraction. The
same prepared package is then reused for configuration discovery, initial
launch, and the browser Start Unreal control.

The Windows workflow selects only `Windows.zip` and its `Windows.zNN` split
archive parts. It does not invoke the Linux downloader or download Linux
release artifacts. The Linux workflow remains separate under `dev.sh`.

Useful direct commands are:

```powershell
# Download or update without launching Unreal
.\windows_simulator.ps1 download

# Select a specific release instead of latest
.\windows_simulator.ps1 start -Tag v2.1.0

# Replace the cached archive and extracted package
.\windows_simulator.ps1 start -ForceDownload

# Use an already extracted package without checking GitHub
.\windows_simulator.ps1 start -SkipDownload -ReleaseRoot "G:\DRV-Unreal-Windows"
```

## Ports and launch options

- `http://localhost:8888`: browser-facing Pixel Streaming player
- `127.0.0.1:8889`: host-only streamer WebSocket forwarded into signalling
- TCP and UDP 3478: TURN listener
- UDP 49160 through 49200: TURN relay range
- `http://localhost:3000/simulator`: DRV frontend with the player embedded
- `http://127.0.0.1:8890`: loopback-only Windows simulator control API

Port 8889 is separate because the signalling container already publishes its
browser UI on host port 8888. Unreal is launched with:

```text
-AudioMixer
-RenderOffscreen
-PixelStreamingURL=ws://127.0.0.1:8889
-ResX=1920 -ResY=1080 -ForceRes
-Unattended -NoSplash -StdOut -FullStdOutLogOutput
```

Set `PIXELSTREAM_HTTP_PORT`, `PIXELSTREAM_STREAMER_PORT`, or
`VITE_PIXELSTREAM_URL` in `.env` when the defaults conflict with another local
service. Set `SIMULATOR_CONTROL_PORT` and `VITE_SIMULATOR_CONTROL_URL` together
to change the control port. The URLs must be reachable by the user's browser,
so do not use Docker-only service names.

The control API accepts only `GET /status`, `POST /start`, `POST /stop`, and
`POST /shutdown`. It is not published through Docker and does not bind to a LAN
interface.

Local Cesium and backend credentials remain outside the repository history.
`CESIUM_CREDENTIALS_DIR` can point Compose to an existing credentials folder,
and `BACKEND_ENV_FILE` can point it to an existing ignored backend `.env` file
when running from a separate worktree.

## Operations and verification

```powershell
.\dev.ps1 simulator-status
.\dev.ps1 logs
.\dev.ps1 simulator-stop
.\dev.ps1 stop
```

A successful start has all of these results:

1. The signalling container is healthy.
2. The Windows Unreal launcher and its Win64 child process remain running.
3. The signalling log identifies `DefaultStreamer`.
4. <http://localhost:8888> loads the Pixel Streaming player.
5. The Simulator tab at <http://localhost:3000/simulator> displays the same
   stream and accepts input.

Unreal output is stored under `<release-root>\logs`. `simulator-stop` only
terminates processes whose executable paths are inside the configured release
root.

## Troubleshooting

- If download returns 404, confirm access to the private release and authorize
  organization SSO for the token.
- If extraction fails, install 7-Zip and confirm every `Windows.zNN` part and
  the final `Windows.zip` are present.
- If the player says no streamer is connected, check the signalling log and
  confirm host port 8889 is free.
- If Unreal starts but sends no frames, confirm `-RenderOffscreen` is present
  and `-nullrhi` is absent.
- If the embedded player is blank while port 8888 works separately, verify
  `VITE_PIXELSTREAM_URL=http://localhost:8888` and recreate the frontend
  container so Vite receives the updated environment value.
- If the start and shutdown controls are unavailable, launch through
  `.\dev.ps1 full` or `.\dev.ps1 simulator`. Those commands start the loopback
  control service automatically.
- If Windows asks for firewall permission, allow the packaged Unreal executable
  on the network profile used by Docker Desktop.
