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

- **Docker Engine** and **Docker Compose v2**
- **Linux**, **macOS**, or **Windows with WSL2** for the frontend/backend services
- **Native Linux with an NVIDIA GPU, a current NVIDIA driver, Vulkan/NVENC support, and NVIDIA Container Toolkit** for the Dockerized Unreal Pixel Stream
- **Windows 10/11, 7-Zip, and a supported GPU** for the native Windows Unreal Pixel Stream
- A **Cesium Ion access token** in `credentials/frontend-cesium-token.json` for the Cesium map
- A **GitHub Personal Access Token** only when downloading the private `DRV-Unreal` simulator release
- **Ollama** is optional and required only for the local, LLM-assisted DroneLume Scenario Assistant
- 16GB+ RAM recommended for the Unreal workflow
- 25GB+ available disk space

The Docker workflow supplies Python, Node.js, backend packages, and frontend packages inside containers. Python and Node.js are not required on the host for Docker-based frontend/backend development. Docker Desktop on Windows is also not a supported host for the Linux Unreal container; use the native Windows simulator workflow instead.

### Source Installation (Optional)

- Windows, macOS, or Linux
- Python 3.10 for the backend
- Node.js 22 for the Vite frontend
- The packages listed in `backend/requirements.txt` and `frontend/package.json`
- Ollama only if using the Scenario Assistant locally

The source-install path does not replace the simulator runtime requirements. Use the
native Windows package or a native Linux NVIDIA host for Unreal Pixel Streaming.

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
On each full startup, PowerShell checks the latest release tag once. It reuses
the installed package when that tag is already present, so no archive is
downloaded or extracted again. The Windows workflow downloads only `Windows.zip`
and any `Windows.zNN` archive parts. It never downloads the Linux release. 7-Zip
is required because the Windows release can be a split archive.

See the [Windows Native Unreal Pixel Streaming wiki](https://github.com/UAVLab-SLU/DRV_public/wiki/Windows-Native-Unreal-Pixel-Streaming)
for architecture, ports, security, and troubleshooting.

The frontend Simulator tab provides Start Unreal and Shut down controls when
the application was launched through `dev.ps1`. The control endpoint is bound
to Windows loopback only.

### Option 1: Full Stack (Recommended for Testing)

**Windows:**

```powershell
.\dev.ps1 full
```

This downloads the latest Windows package, starts the supporting Docker
services, launches Unreal natively, and enables the in-app Start Unreal and Shut
down controls. Open <http://localhost:3000/simulator> for the embedded stream.

**Native Linux NVIDIA host:**

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

**Application URLs:**

- Frontend UI (http://localhost:3000)
- Configuration (http://localhost:3000/simulation)
- Embedded Simulator (http://localhost:3000/simulator)
- Backend API (http://localhost:5000)
- Simulation Pixel Stream (http://localhost:8888)
- Storage services

The Linux container also publishes the simulation engine API at
<http://localhost:3001>. The Windows game runs directly on the host.

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
.\dev.ps1 restart
```

This restarts the bind-mounted backend and frontend containers without rebuilding images or stopping fake GCS.

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

#### DroneLume scenarios

DroneLume and geospatial AirSim scenarios share the existing `/addTask` queue. A
DroneLume request uses the following envelope:

```json
{
  "mode": "dronelume",
  "Drones": [
    { "Name": "Drone 1", "droneModel": "AureliaX6Pro", "X": 0, "Y": 0, "Z": 200 }
  ],
  "dronelume": {
    "source": "llm",
    "init_dsl": { "Scenario": {} }
  }
}
```

Use `GET /api/dronelume/schema` as the LLM authoring contract and
`POST /api/dronelume/validate` before submission. On the Scenario Assistant
page, **Apply to Configuration** calls `POST /api/dronelume/apply`. The backend
validates and atomically writes the document into the active simulator mount,
then publishes `{"state":"dronelume_map","preview":true}` so Unreal can load
the scenario immediately. If a DroneLume scene is already active, Apply first
returns Unreal to its menu and then loads the replacement. Only after deployment succeeds does the browser store
the same document in the active configuration and open the configuration
workflow. The manual builder then loads that document and can refine it. Manual
and LLM-generated documents pass through the same validator. When the completed
configuration is run, the backend rewrites `InitDSL.json` with the Mission-owned
SuT and attempts to archive the final document under the task report. A report
storage outage is logged but does not cancel a successful simulator deployment.
The state remains active until `POST /api/dronelume/stop` publishes
`{"state":"idle"}`.

The backend writes both canonical `InitDSL.json` and the runtime selector file
named by `DRONELUME_RUNTIME_FILE_NAME`. The current packaged standby map selects
`initDSL_ActiveShooter.json`, so that is the default runtime name even when the
applied scenario is not an active-shooter scenario. This alias can be changed
when a future package exposes a different selector.

`Scenario.SuT` is owned by the Mission tab and must not be authored in the
manual builder or by the LLM. At final submission, the backend derives the SuT
asset and relative Cartesian start location from the first Mission drone.

All categorical manual-builder values come from
`backend/PythonClient/multirotor/control/dronelume_catalog.json`. Add new Unreal
assets, level choices, or operation parameters there. The frontend retrieves
the catalog through `/api/dronelume/schema`, and the backend validates against
the same file. Set `DRONELUME_CATALOG_PATH` to use an external catalog without
changing the application source.

For a local packaged Windows build started outside the helper workflow, set:

```text
DRONELUME_CONFIG_DIR=G:\UE_project\DroneWorld 5.5\Packaged\Windows\DRV\Config
```

`dev.ps1 full` discovers the `Config` directory belonging to the packaged
executable it starts and mounts that exact directory into the backend. This
keeps submissions connected to the currently running Windows simulator even
when the release is installed in a non-default location.

Docker Compose mounts `DRONELUME_CONFIG_DIR` into both the backend at
`/app/dronelume-config` and the Linux Unreal container at
`/opt/drv/dronelume-config`. The Linux entrypoint links `InitDSL.json` from that
mount into the packaged project's `Config` directory, whether the release is
named `DRV`, `Blocks`, or `SADE_drone_rep`. If the host setting is not present,
Compose uses `./config/dronelume`. `dev.sh` creates the host directory before
Compose starts, including on a clean Linux checkout.

The experimental Scenario Assistant page sends bounded conversation history to
`POST /api/dronelume/assist`. Only the backend connects to Ollama, so provider
configuration is not exposed to the browser. Native backend development uses
`OLLAMA_URL=http://localhost:11434`; Docker Compose uses the host Ollama service
through `http://host.docker.internal:11434`. Configure the model and limits with
`OLLAMA_MODEL`, `OLLAMA_TIMEOUT_SECONDS`, `OLLAMA_NUM_CTX`, and
`OLLAMA_NUM_PREDICT`. See [the prototype Ollama evaluation](docs/ollama-scenario-evaluation.md)
for measured results, the preliminary enablement gate, and known gaps. Ollama is
not required for ordinary manual DroneLume authoring or for running simulations.
Install Ollama separately, start its service, and pull the configured model before
opening the Scenario Assistant, for example:

```bash
ollama pull llama3.1
```

1. Configure AirSim settings in `config/airsim/`:
   - `settings.json` - Drone and simulation configuration
   - `cesium.json` - Geographic coordinates for terrain generation

On Linux, Compose mounts this directory into both the backend and Unreal
containers. On Windows, `dev.ps1` sets `AIRSIM_SETTINGS_DIR` to the current
user's `Documents\AirSim` directory so the Docker backend writes the same
`settings.json` and `cesium.json` files read by the native Unreal process.

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

Windows:

```powershell
.\dev.ps1 full
```

Native Linux NVIDIA host:

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
- **Configuration**: http://localhost:3000/simulation
- **Embedded Simulator**: http://localhost:3000/simulator
- **Backend API**: http://localhost:5000
- **Backend Health Check**: http://localhost:5000/api/health
- **Simulation Engine API (Linux container only)**: http://localhost:3001
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
