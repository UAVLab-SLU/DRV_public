# OpenAPI / Swagger Usage Guide

DroneWorld's backend exposes current API documentation through Flasgger. Treat it as a contributor debugging and integration aid for the current Flask API surface, not as a guarantee that every endpoint is production-ready.

## Where To Find The API Docs

With the backend running on the default port:

- Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/apispec.json`
- Health check: `http://localhost:5000/api/health`

The routes and docs are configured in `backend/PythonClient/server/simulation_server.py`. Error response formatting and request IDs are handled in `backend/PythonClient/server/error_handling.py`.

## Start A Backend For API Checks

```bash
cd /path/to/DroneWorld
docker-compose -f docker-compose.dev.yaml up backend
```

For quick API work without the real simulator, set `SIMULATOR_TYPE=mock` in `backend/.env` before starting compose, or run Flask locally with mock storage:

```bash
cd /path/to/DroneWorld/backend
SIMULATOR_TYPE=mock STORAGE_TYPE=local LOCAL_STORAGE_ROOT="$(pwd)/.." \
  flask --app PythonClient.server.simulation_server run --host=0.0.0.0 --port=5000
```

Mock mode uses `backend/mock_simulator/mock_task_manager.py`. It queues tasks, writes a small mock report through the configured storage service, and avoids the DRV-Unreal/AirSim runtime.

## Useful Curl Calls

These examples assume the backend is reachable at `http://localhost:5000`.

### Health Check

```bash
curl -i http://localhost:5000/api/health
```

Expected success response body:

```json
{
  "message": "Backend is reachable!",
  "status": "ok"
}
```

### Preview Generated AirSim Settings

`POST /api/simulation/settings/preview` validates a task payload and returns the generated `settings.json` payload without writing simulator files.

```bash
curl -s -X POST http://localhost:5000/api/simulation/settings/preview \
  -H 'Content-Type: application/json' \
  -d '{"Drones":[{"Name":"Drone1","X":41.980381,"Y":-87.934524,"Z":-5,"MissionValue":"fly_to_points","Mission":{"name":"fly_to_points","param":[]}}],"environment":{"UseGeo":true,"Origin":{"Latitude":41.980381,"Longitude":-87.934524,"Altitude":200},"Wind":{"Direction":"NE","Velocity":5},"TimeOfDay":"10:00:00"},"monitors":{"collision_monitor":{"enable":true,"param":[]}}}'
```

The response is wrapped as:

```json
{
  "settings": {
    "SettingsVersion": 2.0,
    "SimMode": "Multirotor",
    "Vehicles": {}
  }
}
```

The exact `Vehicles`, `OriginGeopoint`, `Wind`, and time fields depend on the posted task payload.

### Submit A Task

`POST /addTask` validates the payload and queues it on the active task dispatcher. In mock mode, the dispatcher creates a mock report artifact. In real mode, the task manager writes AirSim settings and waits for AirSim RPC.

```bash
curl -i -X POST http://localhost:5000/addTask \
  -H 'Content-Type: application/json' \
  -d '{"Drones":[{"Name":"Drone1","X":41.980381,"Y":-87.934524,"Z":-5,"MissionValue":"fly_to_points","Mission":{"name":"fly_to_points","param":[]}}],"environment":{"UseGeo":true,"Origin":{"Latitude":41.980381,"Longitude":-87.934524,"Altitude":200},"Wind":{"Direction":"NE","Velocity":5},"TimeOfDay":"10:00:00"},"monitors":{"collision_monitor":{"enable":true,"param":[]}}}'
```

Expected success response shape:

```json
{
  "task_id": "generated-batch-id"
}
```

Important current behavior: `/addTask` catches broad exceptions and can wrap validation problems as `SIMULATION_FAILED`. The preview route preserves validation errors more directly.

### List Reports

```bash
curl -s http://localhost:5000/list-reports
```

Expected response shape:

```json
{
  "reports": [
    {
      "filename": "generated-batch-id",
      "contains_fuzzy": false,
      "drone_count": 1,
      "pass": 1,
      "fail": 0,
      "report_type": "mock"
    }
  ]
}
```

The response depends on the active storage service and existing report artifacts.

## Error Envelope And Request IDs

Backend errors are standardized by `backend/PythonClient/server/error_handling.py`.

Error responses use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {},
    "timestamp": "generated-utc-timestamp",
    "request_id": "generated-uuid"
  }
}
```

Every response also receives an `X-Request-ID` header. Use `curl -i` when you need to see it:

```bash
curl -i http://localhost:5000/api/health
```

When debugging a failing call, copy the request URL, response status, error body, and `X-Request-ID` into the issue or PR discussion.

## Export The OpenAPI JSON

Use this command to save the current generated OpenAPI spec:

```bash
cd /path/to/DroneWorld
curl -s http://localhost:5000/apispec.json -o apispec.json
```

The generated file is a local debugging artifact unless a team member intentionally adds it to a PR.
