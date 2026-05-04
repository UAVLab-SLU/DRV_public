# Environment Variable Catalog

This catalog is a contributor reference for DroneWorld's current environment variables. It is based on the checked-in compose files, helper scripts, Dockerfiles, frontend code, and backend code.

No local `.env` secret values are included here. When an example needs a secret-like value, it uses a redacted or clearly fake value.

## Reading The Tables

- **Required?** uses `yes`, `no`, or `conditional`.
- **Default** is the value found in code or compose. If no checked-in default was found, the table says `not set by default in repo`.
- **Used by** names the runtime area that consumes the variable.
- **Where defined/read** points to the source files that were inspected.

## Root / Compose Variables

These variables usually live in root `.env` or are passed through the shell when running helper scripts or `docker-compose`.

| Name | Required? | Default | Used by | Where defined/read | Notes / example value |
| --- | --- | --- | --- | --- | --- |
| `GITHUB_TOKEN` | conditional | not set by default in repo | Simulator image build and helper scripts | `dev.sh`, `dev.ps1`, `sim/Dockerfile` | Needed when the DRV-Unreal release asset requires authenticated GitHub access. Example: `GITHUB_TOKEN=<redacted-github-token>`. |
| `FRONTEND_HOST` | no | `frontend` inside compose service env; README access examples use `localhost` | Frontend compose service, access URLs, Cypress config | `docker-compose.yaml`, `docker-compose.dev.yaml`, `readme.md`, `frontend/cypress.config.js` | Service-name defaults are for Docker networking. Browser URLs normally use `localhost` unless you override the host. |
| `FRONTEND_PORT` | no | `3000` | Frontend build arg, container port, host port, Cypress config | `docker-compose.yaml`, `docker-compose.dev.yaml`, `frontend/Dockerfile`, `frontend/cypress.config.js` | Change this when port `3000` is already in use. |
| `BACKEND_HOST` | no | `backend` inside backend compose env; `localhost` for browser-facing URLs | Backend compose service, frontend API URL composition, Cypress config | `docker-compose.yaml`, `docker-compose.dev.yaml`, `frontend/src/utils/const.js`, `frontend/cypress.config.js`, `readme.md` | The frontend container still exposes a browser-facing `REACT_APP_BACKEND_URL` that defaults to `http://localhost:5000`. |
| `BACKEND_PORT` | no | `5000` | Backend build arg, Flask port, host port, frontend API URL composition | `docker-compose.yaml`, `docker-compose.dev.yaml`, `backend/Dockerfile`, `backend/PythonClient/server/simulation_server.py`, `frontend/src/utils/const.js` | Also copied to `FLASK_RUN_PORT` by Docker and compose. |
| `SIM_HOST` | no | `drv-unreal` in compose Pixel Streaming URL; README access examples use `localhost` | Frontend Pixel Streaming URL | `docker-compose.yaml`, `docker-compose.dev.yaml`, `readme.md` | Docker service-name default is for container networking. Browser access to simulator ports usually uses `localhost`. |
| `SIM_HOST_PORT` | no | `3001` | Host-facing simulator API port | `docker-compose.yaml`, `readme.md` | Maps to `SIM_INTERNAL_PORT` on the `drv-unreal` container. |
| `SIM_INTERNAL_PORT` | no | `3000` | Simulator container command, simulator Dockerfile expose arg, backend `DRV_UNREAL_API_PORT` compose value | `docker-compose.yaml`, `docker-compose.dev.yaml`, `sim/Dockerfile` | In full compose, this becomes the `-Port=` value passed to `./DRV.sh`. |
| `PIXELSTREAM_PORT` | no | `8888` | Pixel Streaming host/container port and frontend WebSocket URL | `docker-compose.yaml`, `docker-compose.dev.yaml`, `sim/Dockerfile` | Compose exposes this port directly for the frontend/browser stream path. |
| `FAKE_GCS_PORT` | no | `4443` | Fake GCS emulator and storage initialization profile | `docker-compose.yaml`, `docker-compose.dev.yaml`, `docker-compose-init.sh`, `readme.md` | Only active when the `gcs` compose profile is used. |

## Frontend Variables

React variables must be present at frontend build/start time and must use the `REACT_APP_` prefix to be exposed to browser code.

| Name | Required? | Default | Used by | Where defined/read | Notes / example value |
| --- | --- | --- | --- | --- | --- |
| `REACT_APP_BACKEND_URL` | no | Computed as `http://localhost:5000` when unset | Frontend API base URL | `frontend/src/utils/const.js`, `docker-compose.yaml`, `docker-compose.dev.yaml` | Highest-priority backend URL. Compose sets it from `${BACKEND_HOST:-localhost}:${BACKEND_PORT:-5000}`. |
| `REACT_APP_BACKEND_HOST` | no | `localhost` | Frontend API base URL fallback, Cypress config | `frontend/src/utils/const.js`, `frontend/cypress.config.js` | Used only when `REACT_APP_BACKEND_URL` is not set. |
| `REACT_APP_BACKEND_PORT` | no | `5000` | Frontend API base URL fallback, Cypress config | `frontend/src/utils/const.js`, `frontend/cypress.config.js` | Used only when `REACT_APP_BACKEND_URL` is not set. |
| `REACT_APP_CESIUM_ION_ACCESS_TOKEN` | conditional | Empty string | Cesium terrain/token setup | `frontend/src/components/cesium/CesiumMap.jsx`, `readme.md` | Needed for Cesium Ion-backed terrain access. Example: `REACT_APP_CESIUM_ION_ACCESS_TOKEN=<redacted-token>`. |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | conditional | Empty string | Region picker map preview | `frontend/src/components/EnvironmentConfiguration.jsx`, `readme.md` | If unset, the UI still allows manual latitude, longitude, and altitude entry. Example: `REACT_APP_GOOGLE_MAPS_API_KEY=<redacted-browser-key>`. |
| `AUTO_SYNC_FRONTEND_LOCKFILE` | no | Enabled when unset | Helper-script lockfile sync during rebuild commands | `dev.sh`, `dev.ps1`, `readme.md` | Set to `false`, `0`, `no`, or `off` to stop helper scripts from regenerating `frontend/package-lock.json`. |

## Backend Variables

These variables are read by the Flask server, task manager, AirSim client factory, or backend helper code. Many are typically set in `backend/.env`, but values can also come from compose service environment or the shell.

| Name | Required? | Default | Used by | Where defined/read | Notes / example value |
| --- | --- | --- | --- | --- | --- |
| `BACKEND_PORT` | no | `5000` | Flask server port | `backend/Dockerfile`, `backend/PythonClient/server/simulation_server.py`, `docker-compose.yaml`, `docker-compose.dev.yaml` | `simulation_server.py` falls back from `BACKEND_PORT` to `FLASK_RUN_PORT` to `5000`. |
| `FLASK_RUN_PORT` | no | Mirrors `BACKEND_PORT` in Docker/compose | Flask CLI port fallback | `backend/Dockerfile`, `docker-compose.yaml`, `docker-compose.dev.yaml`, `backend/PythonClient/server/simulation_server.py` | Usually managed by Docker config. |
| `FLASK_DEBUG` | no | `1` in dev compose; not set by default in full compose | Flask dev behavior | `docker-compose.dev.yaml`, `docker-compose.yaml` | Dev compose enables debug mode for backend iteration. Full compose leaves it off unless overridden. |
| `SIMULATOR_TYPE` | no | `real` | Task dispatcher selection and local report tagging | `backend/PythonClient/server/simulation_server.py`, `backend/PythonClient/multirotor/storage/local_storage_service.py`, `readme.md` | Set `SIMULATOR_TYPE=mock` to use `backend/mock_simulator/mock_task_manager.py` instead of the real simulator path. |
| `JSON_DEBUG_MODE` | no | `false` | Settings generation override | `backend/PythonClient/multirotor/control/simulation_task_manager.py`, `backend/tests/test_settings_preview.py`, `readme.md` | When `true`, backend looks for a local debug `settings.json` before using generated settings. |
| `ENABLE_BATTERY_MONITOR` | no | `true` | Monitor filtering | `backend/PythonClient/multirotor/control/simulation_task_manager.py`, `readme.md` | Set to `false` when a simulator build does not support `getTripStats` reliably. |
| `DRV_UNREAL_HOST` | conditional | `127.0.0.1` in code; `drv-unreal` in full compose; `host.docker.internal` in dev compose | AirSim RPC client target | `backend/PythonClient/multirotor/client_factory.py`, `docker-compose.yaml`, `docker-compose.dev.yaml` | Required for real simulator runs if the default target is not correct. |
| `DRV_UNREAL_RPC_PORT` | conditional | `41451` | AirSim RPC client target | `backend/PythonClient/multirotor/client_factory.py`, `docker-compose.dev.yaml` | Preferred AirSim RPC port variable. If unset, code falls back to `DRV_UNREAL_API_PORT`, then `41451`. |
| `DRV_UNREAL_API_PORT` | conditional | `3000` in compose via `SIM_INTERNAL_PORT`; code fallback only if RPC port is unset | AirSim client fallback and simulator API wiring | `backend/PythonClient/multirotor/client_factory.py`, `docker-compose.yaml`, `docker-compose.dev.yaml` | Current code treats this as a fallback for the RPC port when `DRV_UNREAL_RPC_PORT` is not set. |
| `DRV_RPC_READY_TIMEOUT_SEC` | no | `45` | Real simulator RPC readiness polling | `backend/PythonClient/multirotor/control/simulation_task_manager.py` | Increase when the simulator takes longer to expose AirSim RPC. |
| `DRV_RPC_READY_POLL_SEC` | no | `1` | Real simulator RPC readiness polling | `backend/PythonClient/multirotor/control/simulation_task_manager.py` | Minimum effective poll interval is `0.1` seconds. |
| `WIND_SERVICE_HOST` | conditional | `172.18.126.222` in `cdf_server_delay_test.py`; otherwise not set by default in repo | Wind-service delay test tooling | `backend/PythonClient/server/cdf_server_delay_test.py`, `readme.md` | Not wired into the normal Flask wizard flow in inspected code. |
| `WIND_SERVICE_PORT` | conditional | `5001` in `cdf_server_delay_test.py` | Wind-service delay test tooling | `backend/PythonClient/server/cdf_server_delay_test.py`, `readme.md` | Pair with `WIND_SERVICE_HOST` only for the wind-service test script. |

## Simulator Variables

These variables affect the DRV-Unreal container or simulator-adjacent compose wiring.

| Name | Required? | Default | Used by | Where defined/read | Notes / example value |
| --- | --- | --- | --- | --- | --- |
| `GITHUB_TOKEN` | conditional | not set by default in repo | DRV-Unreal release download during image build | `sim/Dockerfile`, `dev.sh`, `dev.ps1` | Same variable as the root helper-script token. Do not commit the real value. |
| `SIM_INTERNAL_PORT` | no | `3000` | Simulator expose arg and full compose command | `sim/Dockerfile`, `docker-compose.yaml` | Full compose passes it to `./DRV.sh` as `-Port=${SIM_INTERNAL_PORT:-3000}`. |
| `SIM_HOST_PORT` | no | `3001` | Host-facing simulator API port | `docker-compose.yaml`, `readme.md` | Used only by full compose because dev compose excludes the simulator. |
| `PIXELSTREAM_PORT` | no | `8888` | Simulator Pixel Streaming port and frontend WebSocket URL | `sim/Dockerfile`, `docker-compose.yaml`, `docker-compose.dev.yaml` | Dev compose can still build a Pixel Streaming URL, but it does not start the simulator service. |
| `DISPLAY` | no | `:0` | Simulator X11 display support | `docker-compose.yaml` | Used by the simulator container environment and `/tmp/.X11-unix` mount. |

## Storage Variables

Storage is selected by `backend/PythonClient/multirotor/storage/storage_config.py`. The backend report routes use the configured storage service.

| Name | Required? | Default | Used by | Where defined/read | Notes / example value |
| --- | --- | --- | --- | --- | --- |
| `STORAGE_TYPE` | no | `local` | Storage service selection | `backend/PythonClient/multirotor/storage/storage_config.py`, `readme.md` | Supported values in current code are `local`, `gcs`, and `gdrive`. |
| `LOCAL_STORAGE_ROOT` | no | User home directory; falls back to current working directory if not writable | Local report storage root | `backend/PythonClient/multirotor/storage/storage_config.py`, `backend/PythonClient/multirotor/storage/local_storage_service.py`, `readme.md` | Local reports are written under `<root>/reports`. Example: `LOCAL_STORAGE_ROOT=$(pwd)/..` for a local backend run from `backend/`. |
| `GCS_BUCKET_NAME` | conditional | `droneworld` | Google Cloud Storage bucket selection | `backend/PythonClient/multirotor/storage/storage_config.py`, `readme.md` | Required for real GCS use when the default bucket is not the intended target. |
| `GCS_CREDENTIALS_PATH` | conditional | `key.json` | GCS service account credentials | `backend/PythonClient/multirotor/storage/gcs_storage_service.py`, `readme.md` | Not used when `STORAGE_EMULATOR_HOST` is set because fake GCS uses anonymous credentials. Example: `GCS_CREDENTIALS_PATH=/app/credentials/gcs-key.json`. |
| `GDRIVE_FOLDER_ID` | conditional | `google drive folder ID` | Google Drive report root folder | `backend/PythonClient/multirotor/storage/storage_config.py`, `readme.md` | The code default is a literal placeholder string, so real Google Drive use should set this explicitly. |
| `GDRIVE_CREDENTIALS_PATH` | conditional | `key.json` | Google Drive service account credentials | `backend/PythonClient/multirotor/storage/gd_storage_service.py`, `readme.md` | Example: `GDRIVE_CREDENTIALS_PATH=/app/credentials/gdrive-key.json`. |
| `STORAGE_EMULATOR_HOST` | conditional | not set by default in repo | GCS emulator endpoint | `backend/PythonClient/multirotor/storage/gcs_storage_service.py`, `readme.md`, `docker-compose.yaml`, `docker-compose.dev.yaml` | Set when using fake GCS. The README sample derives it from `${BACKEND_HOST:-localhost}:${FAKE_GCS_PORT:-4443}`. |

## External Service Variables

These variables connect DroneWorld to external services or external service emulators.

| Name | Required? | Default | Used by | Where defined/read | Notes / example value |
| --- | --- | --- | --- | --- | --- |
| `REACT_APP_CESIUM_ION_ACCESS_TOKEN` | conditional | Empty string | Cesium Ion terrain access | `frontend/src/components/cesium/CesiumMap.jsx` | Keep browser tokens scoped appropriately. |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | conditional | Empty string | Google Maps region picker | `frontend/src/components/EnvironmentConfiguration.jsx` | The manual coordinate path still works without this key. |
| `GITHUB_TOKEN` | conditional | not set by default in repo | GitHub release asset download for simulator builds | `dev.sh`, `dev.ps1`, `sim/Dockerfile` | Use a token only when required for simulator download. |
| `STORAGE_EMULATOR_HOST` | conditional | not set by default in repo | Fake GCS / GCS client endpoint | `backend/PythonClient/multirotor/storage/gcs_storage_service.py` | Intended for local emulator use, not production GCS. |
| `WIND_SERVICE_HOST` | conditional | `172.18.126.222` in delay-test script only | Wind-service delay test tooling | `backend/PythonClient/server/cdf_server_delay_test.py` | Not part of the normal backend task submission path in inspected code. |
| `WIND_SERVICE_PORT` | conditional | `5001` in delay-test script | Wind-service delay test tooling | `backend/PythonClient/server/cdf_server_delay_test.py` | Pair with `WIND_SERVICE_HOST`. |

## Local Secret Hygiene

- Keep real tokens and API keys in ignored `.env` files or shell environment variables.
- Do not paste real `GITHUB_TOKEN`, Cesium Ion, Google Maps, GCS, or Google Drive credential values into docs, commits, issues, or PR descriptions.
- If a real value is ever exposed, rotate it with the provider that issued it.
