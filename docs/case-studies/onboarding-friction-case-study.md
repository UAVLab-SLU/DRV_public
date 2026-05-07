# Case Study: Reducing Onboarding Friction in DroneWorld

## Abstract

DroneWorld is useful because it connects a browser-based scenario wizard, a
Flask backend, and a DRV-Unreal/AirSim simulation workflow into one requirement
validation loop. That same simulator-heavy architecture can make onboarding hard
for new contributors. A contributor may need Docker, environment files, ports,
simulator credentials, optional cloud credentials, frontend API keys, and
platform-specific scripts before they can see a successful run.

This case study documents a mock-first onboarding path for DroneWorld. The goal
is not to avoid real simulator validation. The goal is to let contributors prove
the frontend/backend/report loop first, then move to the full simulator only
when their work actually depends on DRV-Unreal. The expected impact is a shorter
path to backend health checks, mock reports, saved settings, and useful
debugging evidence.

## Problem

DroneWorld has a real simulator path and a lighter development path. The full
stack in `docker-compose.yaml` starts the React frontend, Flask backend,
DRV-Unreal simulator, optional fake GCS services, and shared AirSim config
volume. That path is important, but it has several onboarding blockers:

- DRV-Unreal simulator setup: the README says the simulator requires a GitHub
  Personal Access Token before full-stack or simulator builds.
- AirSim runtime files: the backend and simulator expect files under
  `~/Documents/AirSim`, including `settings.json`, `cesium.json`, and
  `materials.csv`.
- External services and credentials: README troubleshooting documents optional
  GCS and Google Drive credentials, Google Maps API configuration, Cesium Ion
  frontend configuration, and a wind service host/port.
- Ports: the stack uses frontend, backend, simulator API, Pixel Streaming, and
  fake-GCS ports. Defaults include frontend `3000`, backend `5000`, simulator
  host `3001`, Pixel Streaming `8888`, and fake GCS `4443`.
- Simulator-dependent failures are slower to diagnose than web/API failures.
  A contributor can lose time debugging simulator build, token, memory, or port
  issues before knowing whether the frontend/backend change works.

These issues do not mean the project is poorly structured. They are normal
friction points for software that combines a web app, simulation engine, local
filesystem state, and optional cloud storage. The onboarding problem is that a
new contributor should not have to solve every full-stack concern before making
their first useful contribution.

## Intervention

The proposed intervention is a mock-first contributor path backed by existing
repo features and a small package of onboarding artifacts.

1. Use mock simulator mode first.
   - `backend/.env` currently includes `SIMULATOR_TYPE=mock`.
   - README troubleshooting documents running the backend with
     `SIMULATOR_TYPE=mock`, `STORAGE_TYPE=local`, and `LOCAL_STORAGE_ROOT`.
   - `backend/mock_simulator/mock_task_manager.py` queues tasks and writes a
     minimal `MockMonitor/mock_report.txt` report without running AirSim RPC.

2. Start with Docker development compose.
   - `docker-compose.dev.yaml` intentionally excludes the simulator.
   - It runs frontend and backend, mounts source code, and can optionally start
     fake GCS through the `gcs` profile.
   - This path is appropriate for frontend UI, backend API, saved settings, and
     report dashboard work.

3. Keep the README setup and troubleshooting path visible.
   - README already documents full stack, frontend/backend-only development,
     helper scripts, mock simulator mode, local storage, battery monitor toggle,
     JSON debug mode, GitHub token setup, port conflicts, and simulator logs.

4. Use verification commands as checkpoints.
   - New contributors should be able to stop after each checkpoint and know
     whether they are blocked by Docker configuration, backend startup, frontend
     tests, backend settings generation, or mock report storage.

## Before and After Contributor Path

| Step                          | Full simulator first                                              | Mock-first contributor path                                                       |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Initial setup target          | Build and run frontend, backend, and DRV-Unreal                   | Run frontend and backend first                                                    |
| Required simulator token      | Needed before full simulator build                                | Deferred unless the work needs DRV-Unreal                                         |
| AirSim dependency             | Must be ready before a real run                                   | Mock mode can create a report without AirSim RPC                                  |
| Main compose file             | `docker-compose.yaml`                                             | `docker-compose.dev.yaml`                                                         |
| Fastest useful backend check  | After backend starts inside full stack                            | `/api/health` after backend starts                                                |
| Fastest useful report check   | After real simulator task completes                               | Mock task creates `MockMonitor/mock_report.txt`                                   |
| Best first contribution types | Harder to separate from simulator issues                          | Frontend, backend API, saved settings, report UI, docs                            |
| Main risk                     | New contributor confuses simulator setup failure with app failure | Contributor may forget mock mode does not validate real simulator behavior        |
| When to move to full stack    | Immediately                                                       | After web/API/report behavior is proven, or when the change depends on DRV-Unreal |

## Evidence

The evidence below is command-oriented and grounded in current repo files. These
commands do not represent measured onboarding results yet; they are checkpoints
for a proposed onboarding path.

### Docker Compose Configuration Checks

```bash
docker-compose -f docker-compose.dev.yaml config --quiet
docker-compose config --quiet
```

Expected use: catches invalid Compose configuration before a contributor spends
time debugging runtime behavior.

### Backend Health Check

Start the backend through Docker dev compose or the local Flask path, then run:

```bash
curl http://localhost:5000/api/health
```

Expected use: proves the Flask app is reachable before testing task submission
or reports.

### Frontend Test Command

Use:

```bash
npm test -- --watchAll=false --runInBand
```

Expected use: gives frontend contributors a reliable test command in this local
environment.

### Backend Unit Test Command

```bash
python -m unittest backend.tests.test_settings_preview
```

Expected use: verifies backend settings preview behavior, including geo altitude
fallback and avoiding file writes in preview mode.

### Mock Simulation and Report Check

Terminal 1:

```bash
cd backend
SIMULATOR_TYPE=mock STORAGE_TYPE=local LOCAL_STORAGE_ROOT="$(pwd)/.." FLASK_APP=PythonClient/server/simulation_server.py flask run
```

Terminal 2:

```bash
curl -X POST http://localhost:5000/addTask -H 'Content-Type: application/json' -d '{"Drones": [], "environment": {}}'
curl http://localhost:5000/list-reports
```

Expected use: the README documents this local-storage mock path as a quick
check. In mock mode, the backend should create a report under `reports/` through
`MockTaskManager`. This proves the task API, mock dispatcher, local storage, and
report listing path, but it does not validate real DRV-Unreal behavior.

## Impact

The expected impact is a lower-friction path from clone to useful contribution.
Mock-first onboarding helps contributors separate web/API/report problems from
simulator problems. It also gives the team a reusable way to show new
contributors where data starts, where it is transformed, where it is stored, and
how reports are inspected.

The practical target is time-to-first-report. A contributor who can create a
mock report can verify that the backend is reachable, the task route accepts a
payload, the dispatcher is running, storage is configured, and report listing is
connected. That is a meaningful milestone even before full DRV-Unreal validation.

This should improve contributor adoption because it creates smaller first wins:
backend health, frontend tests, backend unit tests, mock task submission, and
mock report review. Each checkpoint gives a contributor evidence they can share
when asking for help.

## Future Measurements

No measured onboarding results have been collected in this case study. The
following metrics are proposed measurements:

- `time-to-first-successful-build`: minutes from clone to a successful Docker
  dev compose build or startup.
- `time-to-first-backend-health-check`: minutes from clone to a successful
  `/api/health` response.
- `time-to-first-mock-report`: minutes from clone to a mock report visible
  through `/list-reports`.
- `number-of-setup-questions/issues`: count of onboarding setup questions in
  issues, PR comments, Slack/Teams, or course support channels.
- `onboarding-video-views/completion`: views, average watch time, and completion
  rate for the onboarding video if hosted on a platform that reports analytics.
- `time-to-first-merged-doc-or-test-PR`: optional metric for whether the mock
  path helps brand-new contributors make a small verified contribution.

These should be collected before making quantified claims such as percentage
reduction in setup time.

## Limitations

This case study does not claim that mock mode validates the real simulator. Mock
mode does not test AirSim physics, DRV-Unreal startup, simulator memory usage,
AirSim RPC readiness, real mission execution, real monitor execution, screenshots,
interactive report generation, or Pixel Streaming.

The full simulator setup still needs real validation. The README documents
GitHub token setup, headless simulation, simulator ports, memory concerns, and
simulator logs. Those remain necessary for simulator-dependent work.

The case study also depends on current repo behavior. If `dev.sh`, `dev.ps1`,
Compose files, backend environment defaults, or report routes change, this case
study should be updated before reuse.

## Reflection: Magis

This work goes beyond baseline capstone implementation because it is aimed at
future contributors, not just the current team. A normal project deliverable
might stop once the feature works for the person who built it. This case study
asks a broader question: how can the next contributor reach a useful result
without first solving every simulator-heavy setup problem?

The mock-first path reflects magis by improving the conditions for other people
to contribute. It turns hard-won setup knowledge into a reusable onboarding
strategy, gives contributors concrete verification commands, and proposes
measurements that can show whether onboarding is actually improving. That helps
the DroneWorld ecosystem become easier to sustain after the current capstone
iteration ends.
