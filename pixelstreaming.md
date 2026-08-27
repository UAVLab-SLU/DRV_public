# Pixel Streaming

The Dockerized Linux simulator includes a UE 5.5 signalling server and TURN
relay. On a native Linux NVIDIA host, run:

```bash
./dev.sh simulator
```

The helper checks the latest `UAVLab-SLU/DRV-Unreal` release, downloads its
Linux zip when needed, builds the runtime image, and starts signalling before
Unreal. Open <http://localhost:8888> and confirm that the idle stream shows the
DRV main menu.

On Windows, the Unreal game runs natively while signalling remains in Docker:

```powershell
.\dev.ps1 simulator
```

Open <http://localhost:8888> for the standalone player or
<http://localhost:3000/simulator> for the player embedded in the DRV frontend.
The Windows helper downloads the latest split Windows release, extracts it with
7-Zip, and connects Unreal to the host-only streamer port 8889. See
[`docs/unreal-windows-native.md`](docs/unreal-windows-native.md) for the full
workflow.

Docker Desktop on Windows is not a supported Vulkan host for the Linux Unreal
image, so the Windows workflow uses the native executable. See
[`sim/README.md`](sim/README.md) for prerequisites and
[`docs/unreal-linux-handoff.md`](docs/unreal-linux-handoff.md) for the current
engineering checkpoint.
