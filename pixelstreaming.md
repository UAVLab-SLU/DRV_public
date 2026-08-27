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

Docker Desktop on Windows is not a supported Vulkan host for this image. See
[`sim/README.md`](sim/README.md) for prerequisites and
[`docs/unreal-linux-handoff.md`](docs/unreal-linux-handoff.md) for the current
engineering checkpoint.
