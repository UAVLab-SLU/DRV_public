# Unreal Linux container handoff

## Objective

Run the latest packaged Linux release of `UAVLab-SLU/DRV-Unreal` in Docker,
publish its Pixel Streaming player to the host, and display the DRV main menu
when the simulation is idle.

This checkpoint changes the repository runtime to target a native Linux NVIDIA
desktop. Native Linux validation is still required.

## Implemented workflow

- Host-side release downloaders query the GitHub `latest` release endpoint.
- The first Linux zip asset is selected, with `Linux.zip` preferred when more
  than one asset matches.
- Private release downloads support a GitHub token without putting the token in
  Docker layers.
- The extracted release is staged under ignored `sim/release`.
- The Docker image discovers `DRV.sh`, `Blocks.sh`, or `SADE_drone_rep.sh`.
- Unreal runs as a non-root user with native NVIDIA Vulkan and NVENC libraries
  injected by NVIDIA Container Toolkit.
- The entrypoint fails early when it detects Dozen, llvmpipe, CPU Vulkan, or no
  native NVIDIA device.
- Compose starts a UE 5.5 signalling server and local TURN relay.
- Unreal uses offscreen rendering and connects to `ws://signalling:8888`.
- AirSim settings can be mounted from `AIRSIM_SETTINGS_DIR`.

Primary files:

- `download_sim_release.sh`
- `download_sim_release.ps1`
- `sim/Dockerfile`
- `sim/docker-entrypoint.sh`
- `docker-compose.yaml`
- `dev.sh`
- `dev.ps1`
- `sim/README.md`

## Windows investigation result

The image was built successfully on Docker Desktop with a local DRV 2.1.1
Linux package. The signalling player loaded at `http://localhost:8888`, but the
Unreal streamer exited with code 139 before connecting.

Docker Desktop exposed `/dev/dxg`, not native `/dev/nvidia*` graphics devices.
Mesa Dozen 26.1.7 could enumerate the RTX 4080 and reported approximately 15 GB
of device-local memory. Full `vulkaninfo` completed successfully.

An Unreal debugger trace found the actual failure during Vulkan RHI startup:

```text
D3D12: Removing Device.
LowLevelFatalError [VulkanMemory.cpp:926]
Out of Local Memory, Requested1024.00KB MemTypeIndex=0
```

The stack reached `FScreenRectangleVertexBuffer::InitRHI` and failed on its
first 1 MB Vulkan allocation. The reported memory error was secondary to the
Direct3D 12 device removal.

These launch variations produced the same failure:

- SM5 with ray tracing disabled
- reduced resolution and frame rate
- `-FeatureLevelES31`
- approximately 12.7 GB of free GPU memory

Mesa llvmpipe was also tested as a software Vulkan fallback. It enumerated as a
conformant CPU Vulkan device, but the packaged application exited before
initializing Unreal rendering.

Conclusion: packaging settings do not provide native Vulkan passthrough to a
Linux container on Docker Desktop. Continue on native Linux.

## Unreal packaging settings

The current Linux package selection is appropriate for the native Linux test:

- Vulkan Desktop SM5: enabled
- Vulkan Desktop SM6: disabled
- Vulkan Mobile ES3.1: disabled

The Unreal project configuration was found to enable hardware ray tracing while
the Linux package targets SM5. Epic requires SM6 for Lumen hardware ray tracing.
Before publishing the next Linux release, commit an explicit Linux RHI section
and disable hardware ray tracing for the compatibility build:

```ini
[/Script/LinuxTargetPlatform.LinuxTargetSettings]
-TargetedRHIs=SF_VULKAN_SM5
+TargetedRHIs=SF_VULKAN_SM5

[/Script/Engine.RendererSettings]
r.RayTracing=False
r.Lumen.HardwareRayTracing=False
r.RayTracing.Shadows=False
r.RayTracing.Skylight=False
r.RayTracing.UseTextureLod=False
r.Vulkan.RayTracing=False
```

Do not enable SM6 for the first container validation. Do not use ES3.1 as the
primary build. ES3.1 selects the mobile rendering path and would require a
separate compatibility review for Cesium, AirSim camera materials, and the DRV
menu.

## Linux pickup procedure

### 1. Install and validate the host runtime

Install the current NVIDIA Linux driver, Docker Engine, Docker Compose v2, and
NVIDIA Container Toolkit. Configure Docker according to NVIDIA's installation
guide, then restart Docker.

```bash
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.8.0-base-ubuntu24.04 nvidia-smi
```

Both commands must identify the same physical NVIDIA GPU.

### 2. Configure release access

```bash
./dev.sh token
```

The token is stored in ignored `.env`. For the private repository, authorize
organization SSO and grant release read access.

### 3. Download and inspect the latest release

```bash
./download_sim_release.sh latest
cat sim/release/.release-tag
cat sim/release/.release-asset
find sim/release -maxdepth 3 -type f \
  \( -name DRV.sh -o -name Blocks.sh -o -name SADE_drone_rep.sh \)
```

### 4. Build

```bash
export DRV_RELEASE_TAG="$(<sim/release/.release-tag)"
docker compose build drv-unreal
```

### 5. Validate native Vulkan in the image

```bash
docker run --rm --gpus all \
  --entrypoint vulkaninfo \
  droneworld/drv-unreal:linux --summary
```

Required result:

- The device is the physical NVIDIA GPU.
- The driver is NVIDIA, not Dozen or llvmpipe.
- Vulkan initialization exits with status zero.

### 6. Start Pixel Streaming

```bash
./dev.sh simulator
```

In a second terminal:

```bash
docker compose ps
docker compose logs -f signalling drv-unreal
```

Open `http://localhost:8888` on the Linux host.

## Acceptance criteria

The workflow is complete only when:

1. The latest Linux release is selected without editing a version in the
   Dockerfile or Compose file.
2. The Unreal image builds without embedding the GitHub token.
3. The image uses the native NVIDIA Vulkan driver.
4. Unreal stays running for at least five minutes while idle.
5. The signalling server reports an Unreal streamer connection.
6. The host browser displays the DRV main menu.
7. Mouse input from the browser changes the menu selection.
8. AirSim RPC is reachable on host TCP port 41451.

## If native Linux still fails

Capture these diagnostics before changing the image:

```bash
nvidia-smi
docker info
docker compose version
docker compose config
docker compose ps -a
docker compose logs --no-color signalling drv-unreal
docker run --rm --gpus all \
  --entrypoint vulkaninfo \
  droneworld/drv-unreal:linux --summary
```

Check the packaged Unreal log under its `Saved/Logs` directory. If the shipping
build does not emit a log, retain `-StdOut -FullStdOutLogOutput` and run the
binary under `gdb` with `SYS_PTRACE` and an unconfined seccomp profile.

Do not respond to Vulkan initialization errors by adding `-nullrhi`. That can
allow simulation logic to run without rendering, but it cannot satisfy Pixel
Streaming because there are no frames to encode.

## References

- [Epic Linux development requirements](https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine)
- [Epic Linux RHI settings](https://dev.epicgames.com/documentation/en-us/unreal-engine/linux-settings-in-the-unreal-engine-project-settings)
- [Epic Pixel Streaming reference](https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-pixel-streaming-reference)
- [NVIDIA Container Toolkit installation](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
