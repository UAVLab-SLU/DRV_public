# DRV-Unreal Linux container

This directory contains the native Linux NVIDIA runtime for the packaged
DRV-Unreal application. The workflow has three stages:

1. `download_sim_release.sh` queries the latest GitHub release and stages its
   Linux zip under the ignored `sim/release` directory.
2. `sim/Dockerfile` copies the staged package into a CUDA runtime image and
   configures native NVIDIA Vulkan and NVENC access.
3. Docker Compose starts the UE 5.5 signalling server and TURN relay before
   launching Unreal with offscreen rendering.

GitHub credentials are used by the host-side downloader and are never copied
into the Docker build context or image layers.

## Supported host

Use a native Linux installation with:

- Ubuntu 22.04 or a compatible Linux distribution
- A current NVIDIA driver, version 570 or newer recommended
- NVIDIA Container Toolkit configured for Docker
- Docker Engine with Compose v2
- An NVIDIA GPU with Vulkan and NVENC support
- At least 16 GB RAM and 25 GB free disk space

Docker Desktop on Windows is not supported for this Unreal image. Its WSL2 GPU
path exposes Mesa Dozen over Direct3D 12 instead of a native NVIDIA Vulkan
device. Investigation details are recorded in
[`docs/unreal-linux-handoff.md`](../docs/unreal-linux-handoff.md).

## Quick start

From the repository root:

```bash
./dev.sh token
./dev.sh simulator
```

The helper verifies the native Linux Docker/NVIDIA runtime, performs a
latest-release check, downloads a newer Linux package when necessary, builds
the image, validates NVIDIA Vulkan inside it, and starts `signalling` and
`drv-unreal` through the `linux-simulator` Compose profile.
Open <http://localhost:8888>. A successful idle run displays the DRV main menu.

To start the complete application stack:

```bash
./dev.sh full
```

## Manual workflow

```bash
./download_sim_release.sh latest
export DRV_RELEASE_TAG="$(<sim/release/.release-tag)"
docker compose build drv-unreal
docker compose --profile linux-simulator up signalling drv-unreal
```

The private release repository requires `GITHUB_TOKEN` in the environment or
in the ignored root `.env` file. The token needs release read access and any
required organization SSO authorization.

Optional `.env` settings:

```dotenv
PIXELSTREAM_HTTP_PORT=8888
PIXELSTREAM_PUBLIC_IP=192.168.1.10
PIXELSTREAM_TURN_USER=drv
PIXELSTREAM_TURN_PASSWORD=replace-for-shared-networks
AIRSIM_SETTINGS_DIR=./config/airsim
```

The Linux helper detects the host IPv4 address used by the default route. Set
`PIXELSTREAM_PUBLIC_IP` explicitly when the host has multiple physical, VPN, or
virtual network interfaces.

## GPU preflight

Run these checks before building the Unreal image:

```bash
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu24.04 nvidia-smi
```

After the image is built, verify native Vulkan injection:

```bash
docker run --rm --gpus all \
  --entrypoint vulkaninfo \
  droneworld/drv-unreal:linux --summary
```

The output should identify the physical NVIDIA GPU and an NVIDIA driver. Do not
continue if it reports `Dozen`, `llvmpipe`, or a CPU Vulkan device.

## Runtime behavior

The launcher is discovered as `DRV.sh`, `Blocks.sh`, or
`SADE_drone_rep.sh`. This avoids coupling the image to one packaged-project
name. Before launch, the entrypoint rejects Dozen, llvmpipe, CPU Vulkan, and
missing NVIDIA devices with an actionable error. Set `DRV_SKIP_GPU_PREFLIGHT=1`
only for diagnostics. Unreal starts with:

- `-RenderOffscreen` so Pixel Streaming receives rendered frames
- `-PixelStreamingURL=ws://signalling:8888`
- 1920 by 1080 forced resolution
- standard output logging
- no interactive splash screen

Do not add `-nullrhi`. Null RHI disables the renderer that Pixel Streaming
needs to capture frames.

## Ports

- Browser player: `http://HOST:${PIXELSTREAM_HTTP_PORT:-8888}`
- AirSim RPC: TCP 41451
- TURN listener: TCP and UDP 3478
- TURN relay range: UDP 49160 through 49200

## Verification

In another terminal:

```bash
docker compose ps
docker compose logs -f signalling drv-unreal
```

Completion requires all of the following:

1. `signalling` becomes healthy.
2. `drv-unreal` remains running and becomes healthy.
3. The signalling log records the Unreal streamer connection.
4. `http://localhost:8888` loads from the host browser.
5. The idle stream shows the DRV main menu and accepts pointer input.

## Troubleshooting

- GitHub returns 404: verify token repository access and organization SSO.
- The Docker build cannot find a launcher: rerun the downloader and inspect
  `sim/release/.release-asset`.
- `useradd: UID 1000 is not unique`: rebuild from the current Dockerfile, which
  does not force a host UID.
- `libGLX_nvidia.so.0` cannot initialize Vulkan: confirm the image contains
  `libegl1` and `/usr/share/glvnd/egl_vendor.d/10_nvidia.json`, then verify
  NVIDIA Container Toolkit graphics capabilities and Docker configuration.
- Unreal reports `Out of Local Memory` while allocating 1 MB: check the Vulkan
  driver name. This was the secondary error produced after Dozen removed the
  Direct3D 12 device on Docker Desktop.
- The player page is available but no streamer appears: inspect Unreal startup
  for Vulkan or plugin failures, then confirm the WebSocket URL is
  `ws://signalling:8888`.
- A player connects but video remains black: confirm `-nullrhi` is absent and
  verify that `libnvidia-encode.so.1` is visible inside the container.
- Release `v2.1.0` crashes with signal 11 when `Simple map` loads after the
  AirSim vehicle prompt. A new Linux package with the prepared SM5 and disabled
  hardware-ray-tracing settings is required before AirSim RPC can pass.

See [`docs/unreal-linux-handoff.md`](../docs/unreal-linux-handoff.md) for the
investigation record and remaining work.
