# DroneWorld

## Overview

**Drone World**, a key component of DRV, is an advanced simulation platform for testing small unmanned aerial systems (sUAS). It enables users to configure detailed test scenarios by specifying:

- **Environmental Conditions:** Weather, terrain, and other environmental factors.
- **sUAS Capabilities:** Sensors, hardware configurations, and other drone specifications.
- **Mission Objectives:** Specific goals and tasks for each simulation.

The platform generates a realistic 3D simulation environment, monitors data to ensure safety, detects issues, and produces comprehensive test reports with detailed analysis. By automating and streamlining the testing process, Drone World enhances safety, reliability, and efficiency for drone developers. It allows for comprehensive pre-flight testing in ultra-realistic environments, helping developers refine their systems and iterate more rapidly on complex missions. Our team at OSS is dedicated to continuously enhancing Drone World's capabilities, including refining environmental settings, drone configurations, and integrating new features.

### Wiki

Check out our [Wiki](https://github.com/oss-slu/DroneWorld/wiki) for detailed and important information. It's constantly being updated to provide you with the latest resources and insights.

## DroneReqValidator

**DroneReqValidator (DRV)** is a comprehensive drone simulation ecosystem that automatically creates realistic environments, monitors drone activity against predefined safety parameters, and produces detailed acceptance test reports for efficient debugging and analysis of drone software applications. Check out a [demo video](https://www.youtube.com/watch?v=Fd9ft55gbO8) showcasing DRV in action.

## System Requirements

### Docker Deployment (Recommended)

- **Docker** and **Docker Compose**
- **Linux**, **macOS**, or **Windows with WSL2** for frontend/backend services
- **Native Linux with an NVIDIA GPU and NVIDIA Container Toolkit** for the Dockerized Unreal Pixel Stream
- **Windows 10/11, 7-Zip, and a supported GPU** for the native Windows Unreal Pixel Stream
- 16GB+ RAM recommended for the Unreal workflow
- 25GB+ available disk space

### Traditional Deployment

- Windows 10/11
- Python 3.10
- Node.js

## Architecture

DroneReqValidator has 3 main components:

1. **DRV-Unreal** - Unreal-based simulation engine with offscreen GPU rendering
2. **Flask Backend** - Python-based simulation controller and monitoring service
3. **React Frontend** - JavaScript-based user interface for configuration and visualization

## Quick Start (Docker)

### Prerequisites

Ensure Docker Engine and Docker Compose v2 are installed. Frontend/backend
containers work on Linux, macOS, Windows, and WSL2. Unreal runs in Docker on a
native Linux NVIDIA host or as the packaged Windows executable on Windows.

### GitHub Token (Required for Simulator)

The simulator helpers use a GitHub Personal Access Token to download the latest
private `UAVLab-SLU/DRV-Unreal` release. The token is not passed into a Docker
build. If you are only working on frontend/backend, you can skip this step. See
setup instructions in [Troubleshooting](#set-up-github-token).

### Using Helper Scripts (Recommended)

**Linux:**

```bash
# First time: Set GitHub token (only needed for simulator)
./dev.sh token

# Development mode (frontend + backend only)
./dev.sh dev

# Full stack (downloads the latest simulator release)
./dev.sh full

# View logs
./dev.sh logs

# Stop services
./dev.sh stop
```

**Windows (PowerShell):**

```powershell
# Development mode (frontend + backend only)
.\dev.ps1 dev

# Native Windows simulator and Pixel Streaming player
.\dev.ps1 simulator

# Complete stack, including the native Windows simulator
.\dev.ps1 full

# Check or stop only the native simulator
.\dev.ps1 simulator-status
.\dev.ps1 simulator-stop

# View logs
.\dev.ps1 logs

# Stop services
.\dev.ps1 stop
```

Run `./dev.sh help` or `.\dev.ps1 help` to see all available commands.
On its first simulator run, PowerShell downloads and extracts the latest Windows
release. 7-Zip is required because the release can contain a split
`Windows.z01` and `Windows.zip` archive.

See [the Windows native simulator guide](docs/unreal-windows-native.md) for
configuration, ports, logs, and troubleshooting.

The frontend Simulator tab provides Start Unreal and Shut down controls when
the application was launched through `dev.ps1`. The control endpoint is bound
to Windows loopback only.

### Option 1: Full Stack (Recommended for Testing)

Run all services including the simulation engine on a native Linux NVIDIA
host:

```bash
./dev.sh full           # Native Linux NVIDIA host

# Manual equivalent (does not perform the helper's host checks):
./download_sim_release.sh latest
export DRV_RELEASE_TAG="$(<sim/release/.release-tag)"
docker compose --profile linux-simulator up --build
```

`./dev.sh full` and `./dev.sh simulator` refuse non-Linux hosts, Docker Desktop
contexts, unavailable host NVIDIA drivers, and Docker engines without the
NVIDIA runtime. After building, they run `vulkaninfo` inside the image and start
Compose only when it identifies a native NVIDIA Vulkan device.

**Services started:**

- Frontend UI (http://localhost:3000)
- Backend API (http://localhost:5000)
- Simulation Engine (http://localhost:3001)
- Simulation Pixel Stream (http://localhost:8888)
- Storage services

### Option 2: Frontend/Backend Only (Recommended for Development)

Run without the simulation engine for faster development:

```bash
./dev.sh dev            # Linux/macOS
.\dev.ps1 dev           # Windows

# Or directly:
docker compose -f docker-compose.dev.yaml up
```

For the local Windows Docker setup used while debugging frontend, backend, AirSim RPC, Cesium token, and fake GCS, run this from the repo root:

```powershell
cd G:\DRV_public
$env:AIRSIM_SETTINGS_DIR = Join-Path $HOME 'Documents\AirSim'
docker compose -p drvwtest -f docker-compose.dev.yaml up backend frontend fake-gcs
```

This starts:

- Frontend at `http://localhost:3000`
- Backend at `http://localhost:5000`
- Fake GCS at `http://localhost:4443`

The dev compose file mounts `$env:AIRSIM_SETTINGS_DIR` into the backend container as `/root/Documents/AirSim`, so Unreal and the backend can share `settings.json` when `$env:AIRSIM_SETTINGS_DIR` points to `C:\Users\<you>\Documents\AirSim`.

For a clean restart after code changes:

```powershell
$env:AIRSIM_SETTINGS_DIR = Join-Path $HOME 'Documents\AirSim'
docker compose -p drvwtest -f docker-compose.dev.yaml restart backend frontend
```

To stop this local dev stack:

```powershell
docker compose -p drvwtest -f docker-compose.dev.yaml down
```

**Services started:**

- Frontend UI (http://localhost:3000)
- Backend API (http://localhost:5000)
- Storage services

**Use this when:**

- Working on frontend UI/UX
- Developing backend API endpoints
- Testing frontend ↔ backend integration
- You don't have access to build the simulator
- You want faster startup times

### Start Individual Services

```bash
./dev.sh frontend       # Frontend only
./dev.sh backend        # Backend only
./dev.sh simulator      # Simulator only

# Or directly:
docker compose up frontend
docker compose up backend
docker compose --profile linux-simulator up signalling drv-unreal
```

### Viewing Logs

**Using helper scripts:**

```bash
./dev.sh logs           # Linux/macOS
.\dev.ps1 logs          # Windows
```

**Using Docker Compose directly:**

```bash
docker compose -f docker-compose.dev.yaml logs -f frontend backend
```

### Stopping Development Services

**Using helper scripts:**

```bash
./dev.sh stop-dev       # Linux/macOS
.\dev.ps1 stop-dev      # Windows
```

**Using Docker Compose directly:**

```bash
docker compose -f docker-compose.dev.yaml down
```

### Configuration

1. Configure AirSim settings in `config/airsim/`:
   - `settings.json` - Drone and simulation configuration
   - `cesium.json` - Geographic coordinates for terrain generation

Example `settings.json`:

```json
{
    "SettingsVersion": 1.2,
    "SimMode": "Multirotor",
    "Vehicles": {
        "Drone1": {
            "FlightController": "SimpleFlight",
            "X": 0,
            "Y": 0,
            "Z": 0
        }
    }
}
```

Example `cesium.json`:

```json
{
    "latitude": 38.63657,
    "longitude": -90.236895,
    "height": 163.622131
}
```

## Deployment

### Start All Services

```bash
docker compose --profile linux-simulator up
```

### Start Individual Services

```bash
# Simulation engine only
docker compose --profile linux-simulator up signalling drv-unreal

# Backend only
docker compose up backend

# Frontend only
docker compose up frontend
```

### Access the Application

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health Check**: http://localhost:5000/api/health
- **Simulation Engine API**: http://localhost:3001
- **Simulation Engine PixelStream**: http://localhost:8888 

## Architecture Notes

### Headless Simulation

The DRV-Unreal simulation engine uses `-RenderOffscreen` on a native Linux NVIDIA GPU. This keeps Vulkan rendering active without a desktop window so Pixel Streaming can capture frames.

Do not use `-nullrhi` for Pixel Streaming. Null RHI disables the frame-producing render path. Docker Desktop on Windows is not a supported Vulkan host for this Linux Unreal image. See [the Linux handoff](docs/unreal-linux-handoff.md) for prerequisites, investigation results, and acceptance criteria.

### Network Communication

- The simulation engine publishes its application API on port 3001 and AirSim
  RPC on TCP 41451
- Backend communicates with the simulation engine via this TCP connection
- Frontend communicates with backend via REST API

## Development

### Building Custom Images

```bash
# Build the staged DRV-Unreal release on native Linux
export DRV_RELEASE_TAG="$(<sim/release/.release-tag)"
docker compose --profile linux-simulator build drv-unreal

# Build backend image
docker compose build backend

# Build frontend image
docker compose build frontend
```

### Viewing Logs

```bash
# All services
docker compose --profile linux-simulator logs -f

# Specific service
docker compose --profile linux-simulator logs -f drv-unreal
docker compose logs -f backend
docker compose logs -f frontend
```

### Stopping Services

```bash
# Stop all services
docker compose --profile linux-simulator down

# Stop and remove volumes
docker compose --profile linux-simulator down -v
```
### Hot Reload

Both frontend and backend support automatic hot reload during development:

- **Frontend**: Changes to files in `frontend/src/` trigger automatic recompilation
- **Backend**: Changes to Python files automatically restart the Flask server

Verify hot reload is working:
```bash
# Watch logs for recompilation/restart messages
docker compose logs -f frontend backend
```

For detailed development workflows and contribution guidelines, see our [Contributing Guide](https://github.com/oss-slu/DroneWorld/wiki/Contributing-Guide).

## Traditional Usage (Non-Docker)

To begin using DroneReqValidator with traditional installation, refer to our [Getting Started](https://github.com/oss-slu/DroneWorld/wiki/Getting-Started) guide.

## Troubleshooting

### Sample `.env` Files

The contents of `.env` might include the following variables:

```sh
GITHUB_TOKEN=ghp_xxxxxxx
```

The contents of `./backend/.env` should include the following variables:

```sh
# Storage Configuration
STORAGE_TYPE=gcs
GCS_BUCKET_NAME=droneworld
GDRIVE_FOLDER_ID=your_folder_id_here

# Credentials
GCS_CREDENTIALS_PATH=/app/credentials/gcs-key.json
GDRIVE_CREDENTIALS_PATH=/app/credentials/gdrive-key.json

# External APIs
GOOGLE_MAPS_API_KEY=your_api_key_here

# Wind Service Configuration
WIND_SERVICE_HOST=hostname.or.ip.address
WIND_SERVICE_PORT=5001

# Storage Emulator Host
STORAGE_EMULATOR_HOST=localhost:4443

```

The contents of `./frontend/.env` should include the following variables:

```sh
REACT_APP_DEMO_USER_EMAIL='name@domain.tld'
REACT_APP_CESIUM_ION_ACCESS_TOKEN='yaddayaddayadda'
```

### Set Up GitHub Token

**Native Linux simulator host:**
```bash
./dev.sh token
# Enter your token when prompted
# Token is automatically saved and loaded for future sessions
```

**Creating a GitHub Personal Access Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "DroneWorld Simulator")
4. Select scopes: `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token and use it with the `token` command above

**Note:** Once saved, the token is automatically loaded from `.env` when you run `./dev.sh full` or `./dev.sh simulator`.

### Port Already in Use
If you see errors about ports 3000, 3001, or 5000 already being in use:
```bash
# Stop conflicting services or change ports in docker-compose.yaml
docker compose --profile linux-simulator down
```

### Simulation Engine Not Responding

Check logs for initialization:

```bash
docker logs drv-unreal-1 | grep -E "LogNet|LogWorld|Server"
```

Look for messages like:

- `LogWorld: Bringing World ... up for play`
- Server initialization complete

### Current Packaged-Release Limitation

Release `v2.1.0` passes native Vulkan, Pixel Streaming, five-minute idle, main
menu rendering, and browser input validation. Loading `Simple map` after the
AirSim vehicle prompt currently exits the packaged game with signal 11, so a
real AirSim RPC request cannot yet be validated. Publish a newer Linux release
containing the SM5/no-hardware-ray-tracing compatibility settings described in
[`docs/unreal-linux-handoff.md`](docs/unreal-linux-handoff.md), then repeat the
map-load and TCP 41451 checks.

### Memory Issues

If the simulation engine container crashes with memory errors, increase Docker's memory limit:

- Native Linux has no Docker Desktop memory limit by default; ensure the host
  has at least 16 GB RAM available.

## Contributing

Contributions to this project are welcome! For details on how to contribute, please follow our [Contributing Guide](https://github.com/oss-slu/DroneWorld/wiki/Contributing-Guide).

## License
This project is licensed under the MIT license. See the LICENSE file for more information.
