# DroneWorld: A Simulation and Reporting Platform for Drone Requirement Validation

## Title

DroneWorld: A Simulation and Reporting Platform for Drone Requirement Validation

## Summary

DroneWorld is an open source web application for configuring, running, and
reviewing simulated small unmanned aircraft system (sUAS) scenarios. The project
connects a React frontend, a Flask backend, and an AirSim/Cosys-AirSim simulator
workflow so that users can describe a drone mission, generate simulator settings,
run mission and monitor logic, and inspect report artifacts afterward.

The software is designed around a practical workflow: a user configures the
environment, drones, missions, sensors, and monitors in a browser; the frontend
turns that configuration into a task payload; the backend turns the payload into
AirSim-compatible `settings.json` and Cesium origin data; missions and monitors
run against the simulator; and the resulting logs, images, and interactive report
files are made available through the report dashboard.

The repository also includes development paths that reduce the cost of working
on the system. A mock simulator mode can exercise the API, queue, storage, saved
settings, and report display without building or running the full simulator.
Saved configuration bundles preserve both generated simulator settings and the
raw task payload, which helps contributors replay or inspect a scenario later.

## Statement of Need

Testing drone behavior only with physical flights can be expensive, slow, and
risky. Simulation is useful because it lets developers try scenarios before a
real flight, especially when a mission includes weather, terrain, multiple
drones, safety constraints, or acceptance-style monitor checks.

DroneWorld addresses a practical gap between "having a simulator" and "having a
repeatable validation workflow." A simulator can show a flight, but developers
also need a way to create realistic inputs, preserve the exact configuration,
run checks consistently, and review evidence after the run. DroneWorld packages
those steps into one product: scenario configuration, simulator settings
generation, task dispatch, monitor execution, report storage, and dashboard
review.

The project is also useful for contributors because simulator-heavy software can
be hard to develop locally. The real DRV-Unreal simulator path requires more
setup and compute than a normal web app. DroneWorld's mock simulator mode gives
frontend and backend developers a lighter path for testing queue behavior,
saved-settings replay, and report pages. This does not replace real simulator
validation, but it lowers onboarding friction and lets contributors work on
most web/API behavior without waiting on the full simulator.

## Software Description

DroneWorld is organized as a full-stack application with three main runtime
pieces:

- A React frontend in `frontend/`.
- A Flask backend in `backend/`.
- A DRV-Unreal simulator image built from `sim/`, used when running the full
  simulator stack.

The frontend provides the user workflow. Routes in `frontend/src/App.js` include
the home page, simulation wizard, reports page, detailed dashboard, saved
settings page, stream placeholder, and informational pages. The wizard flow is
implemented around `frontend/src/components/HorizontalLinearStepper.jsx`, with
separate steps for environment configuration, mission/drone configuration, and
test/monitor configuration.

The backend provides task and report APIs. The main Flask app lives in
`backend/PythonClient/server/simulation_server.py`. It exposes endpoints for
health checks, simulation state, settings preview, task queueing, report listing,
report folder preview, HTML report serving, report download, and simulator state.
It also configures Swagger/OpenAPI documentation through Flasgger at `/api/docs`
and `/apispec.json` when the backend is running.

The simulator path is coordinated by
`backend/PythonClient/multirotor/control/simulation_task_manager.py`. It builds
runtime AirSim settings, writes `settings.json` and `cesium.json` under
`~/Documents/AirSim`, waits for AirSim RPC readiness, imports mission and monitor
classes dynamically, runs them in threads, and writes reports through the
configured storage service.

For development, `backend/mock_simulator/mock_task_manager.py` implements a
lighter dispatcher. It accepts the same queued tasks, optionally writes
`_prebuilt_settings` into `settings.json`, sleeps briefly, and writes a minimal
mock report. This is useful for testing frontend/backend integration and report
flows, but it does not execute real missions, monitors, screenshots, plots, or
AirSim RPC behavior.

## Architecture

DroneWorld's core data path is:

```text
frontend wizard state
  -> task payload
  -> backend settings preview or task queue
  -> settings.json and cesium.json
  -> simulator dispatch
  -> mission and monitor execution
  -> report artifacts
  -> report dashboard
```

The frontend has two important state paths. `MainJsonContext` in
`frontend/src/contexts/MainJsonContext.js` stores class-backed state used by
mission editing and Cesium interactions. The wizard also keeps a plain
JavaScript object with `Drones`, `environment`, `monitors`, and optional
`FuzzyTest`. That plain object is serialized by
`frontend/src/utils/taskPayload.js`.

The payload builder normalizes the data sent to the backend. For example, it
maps environment origin height to backend altitude, ensures missions have a
`name` and `param`, removes frontend-only sensor keys, and maps frontend wind
`Force` into backend-compatible `Velocity` where needed. Tests in
`frontend/src/tests/taskPayload.test.js` cover the wind conversion behavior.

The backend chooses its dispatcher at startup based on `SIMULATOR_TYPE`.
`SIMULATOR_TYPE=mock` uses `MockTaskManager`; other values use
`SimulationTaskManager`. Both expose a queue-like interface so `/addTask` can
queue work without knowing whether the backend is using the real simulator or
the mock path.

Storage is selected by `STORAGE_TYPE` in
`backend/PythonClient/multirotor/storage/storage_config.py`. The default local
storage implementation writes under `$LOCAL_STORAGE_ROOT/reports` or `~/reports`.
The code also includes Google Cloud Storage and Google Drive storage service
implementations. Local report listing scans text files for `PASS` and `FAIL`,
buckets artifacts by monitor type, includes PNG data for previews, serves
interactive HTML reports, and can build a zip archive for download.

The project is containerized through Docker Compose. `docker-compose.dev.yaml`
runs frontend and backend without the simulator for faster development.
`docker-compose.yaml` includes frontend, backend, DRV-Unreal, and optional
fake-GCS services. Helper scripts `dev.sh` and `dev.ps1` wrap common workflows.

## Key Features

- Browser-based scenario wizard for environment, drone, mission, sensor, and
  monitor configuration.
- Cesium/Resium map integration for geospatial context and map-driven
  interactions.
- Backend task payload generation from frontend wizard state.
- AirSim/Cosys-AirSim `settings.json` generation, including geo origin handling,
  drone vehicle settings, wind conversion, time-of-day settings, and monitor
  setup.
- Settings preview endpoint that returns the generated settings payload without
  writing simulator files.
- Real task queue that waits for AirSim RPC, resets the scene, starts mission
  threads, starts monitor threads, and records report artifacts.
- Mock task manager for frontend/backend development without the full simulator.
- Saved settings stored in browser-private OPFS, including generated
  `settings.json`, matching `task.json`, metadata, and display-friendly names.
- Saved replay path that can post the stored task plus `_prebuilt_settings` back
  to `/addTask` when the saved entry is compatible.
- Report dashboard that lists batches, separates mock and real reports, previews
  monitor artifacts, and downloads report archives where supported.
- Storage abstraction for local filesystem, Google Cloud Storage, and Google
  Drive backends.
- Swagger/OpenAPI documentation exposed by the running backend.

## Current Use and Intended Audience

The intended audience is students, researchers, and developers working on drone
simulation, requirement validation, and pre-flight testing workflows. The
frontend is meant for users who need to configure scenarios and inspect results.
The backend and mock simulator mode are meant for contributors building API,
storage, report, and integration features.

## Contribution and Sustainability

DroneWorld has several design choices that support continued contribution:

- The frontend and backend can run without the full simulator through the dev
  Docker Compose file and mock simulator mode.
- The backend exposes Swagger/OpenAPI documentation for contributors learning the
  API.
- The saved-settings bundle keeps both generated settings and raw task payloads,
  which makes scenarios easier to replay and debug.
- Report artifacts are stored through a backend abstraction, so local
  development and cloud-backed deployments can share similar report flows.
- The repository includes automated tests for important frontend payload and
  saved-settings behavior, plus backend tests for settings preview behavior.

## Future Work

Near-term engineering work should focus on making the end-to-end data contract
more robust:

- Preserve validation errors from `/addTask` instead of wrapping them as generic
  simulation failures.
- Harden backend wind validation so raw API clients receive clear errors for
  malformed wind inputs.
- Add more backend route tests for task submission, saved replay, report listing,
  and storage error behavior.
- Continue reducing frontend state drift between plain wizard state and
  class-backed context state.
- Align helper script behavior across Unix and Windows workflows.
- Improve contributor onboarding around mock mode, environment variables,
  simulator requirements, and report debugging.
- Add clearer contribution and governance documentation if the project is being
  prepared for broader external adoption.
