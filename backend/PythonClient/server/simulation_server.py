import logging
import os
import threading
import time
import sys
from flask import Flask, request, render_template, Response, jsonify, send_file
from flask_cors import CORS
from flasgger import Swagger

# Add parent directories to the Python path for module imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from PythonClient.server.error_handling import (
    ResourceNotFoundError,
    SimulationFailedError,
    StorageError,
    ValidationError,
    register_error_handlers,
)
# Import the SimulationTaskManager
# Import the SimulationTaskManager and MockTaskManager
from PythonClient.multirotor.control.simulation_task_manager import SimulationTaskManager
from mock_simulator.mock_task_manager import MockTaskManager

# Import the storage service from the configuration module
from PythonClient.multirotor.storage.storage_config import get_storage_service

app = Flask(__name__, template_folder="./templates")

# Configure logging to suppress Werkzeug logs except for errors
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
CORS(app)
register_error_handlers(app)

# --- OpenAPI / Swagger configuration ---
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs",
    "openapi": "3.0.3",
}

swagger_template = {
    "openapi": "3.0.3",
    "info": {
        "title": "DroneWorld API",
        "description": (
            "Backend API for the DroneWorld drone simulation platform. "
            "Provides endpoints for configuring simulations, managing drones, "
            "running tasks, and retrieving reports."
        ),
        "version": "1.0.0",
        "contact": {"name": "OSS @ SLU", "url": "https://github.com/oss-slu/DroneWorld"},
        "license": {"name": "MIT"},
    },
    "components": {
        "schemas": {
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "object",
                        "properties": {
                            "code": {"type": "string", "example": "VALIDATION_ERROR"},
                            "message": {"type": "string", "example": "Invalid input data"},
                            "details": {"type": "object"},
                            "timestamp": {"type": "string", "format": "date-time"},
                            "request_id": {"type": "string", "format": "uuid"},
                        },
                    }
                },
            }
        }
    },
}

Swagger(app, config=swagger_config, template=swagger_template)

# Initialize the SimulationTaskManager or the fake, depending on .env variables
simulator_type = os.getenv('SIMULATOR_TYPE', 'real')
if simulator_type == 'mock':
    print("Using mock task manager")
    task_dispatcher = MockTaskManager()
else:
    task_dispatcher = SimulationTaskManager()

threading.Thread(target=task_dispatcher.start, daemon=True).start()

task_number = 1  # Global task counter

# Initialize the storage service
storage_service = get_storage_service()
print(f"Using {storage_service.__class__.__name__} as the storage service.")

# === Simulation Configuration State ===
simulation_state = {
    "environment": {},
    "monitors": {},
    "drones": []
}


def _validate_task_payload(task_data):
    if not task_data:
        raise ValidationError("No task data provided", details={"missing_fields": ["task payload"]})

    missing_fields = [field for field in ["Drones", "environment"] if field not in task_data]
    if missing_fields:
        raise ValidationError(
            "Task payload missing required sections",
            details={"missing_fields": missing_fields},
        )

    prebuilt_settings = task_data.get("_prebuilt_settings")
    if prebuilt_settings is not None and not isinstance(prebuilt_settings, dict):
        raise ValidationError(
            "Prebuilt settings must be an object",
            details={"invalid_fields": ["_prebuilt_settings"]},
        )

    if prebuilt_settings is not None and "FuzzyTest" in task_data:
        raise ValidationError(
            "Saved settings replay is not supported for fuzzy tests",
            details={"invalid_fields": ["FuzzyTest", "_prebuilt_settings"]},
        )

# === New API Routes ===

@app.route('/api/simulation', methods=['GET'])
def get_simulation_state():
    """Retrieve the current simulation state.
    ---
    tags:
      - Simulation
    responses:
      200:
        description: Current simulation configuration state
        content:
          application/json:
            schema:
              type: object
              properties:
                environment:
                  type: object
                monitors:
                  type: object
                drones:
                  type: array
                  items:
                    type: object
    """
    return jsonify(simulation_state), 200

@app.route('/api/simulation/drones', methods=['POST'])
def add_drone():
    """Add a new drone to the simulation.
    ---
    tags:
      - Simulation
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - id
            properties:
              id:
                type: string
                example: "Drone1"
          example:
            id: "Drone1"
            X: 0.0
            Y: 0.0
            Z: -5.0
    responses:
      201:
        description: Drone added successfully
        content:
          application/json:
            schema:
              type: object
      422:
        description: Validation error — missing id field
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    new_drone = request.get_json(silent=True) or {}
    if "id" not in new_drone:
        raise ValidationError("Invalid drone data", details={"missing_fields": ["id"]})

    simulation_state["drones"].append(new_drone)
    return jsonify(new_drone), 201

@app.route('/api/simulation/drones/<drone_id>', methods=['PUT'])
def update_drone(drone_id):
    """Update an existing drone's configuration.
    ---
    tags:
      - Simulation
    parameters:
      - name: drone_id
        in: path
        required: true
        schema:
          type: string
        description: ID of the drone to update
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
    responses:
      200:
        description: Drone updated successfully
      404:
        description: Drone not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      422:
        description: Invalid drone data
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    updated_drone = request.get_json(silent=True)
    if not updated_drone:
        raise ValidationError("Invalid drone data", details={"missing_fields": ["drone payload"]})
    for i, drone in enumerate(simulation_state["drones"]):
        if str(drone["id"]) == drone_id:
            simulation_state["drones"][i] = updated_drone
            return jsonify(updated_drone), 200
    raise ResourceNotFoundError("Drone not found", details={"drone_id": drone_id})

@app.route('/api/simulation/drones/<drone_id>', methods=['DELETE'])
def delete_drone(drone_id):
    """Remove a drone from the simulation.
    ---
    tags:
      - Simulation
    parameters:
      - name: drone_id
        in: path
        required: true
        schema:
          type: string
        description: ID of the drone to remove
    responses:
      200:
        description: Drone deleted successfully
      404:
        description: Drone not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    for i, drone in enumerate(simulation_state["drones"]):
        if str(drone["id"]) == drone_id:
            del simulation_state["drones"][i]
            return jsonify({"message": "Drone deleted"}), 200
    raise ResourceNotFoundError("Drone not found", details={"drone_id": drone_id})

@app.route('/api/simulation/environment', methods=['PUT'])
def update_environment():
    """Update the simulation environment settings.
    ---
    tags:
      - Simulation
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              UseGeo:
                type: boolean
              Origin:
                type: object
                properties:
                  Latitude:
                    type: number
                  Longitude:
                    type: number
                  Altitude:
                    type: number
              Wind:
                type: object
              TimeOfDay:
                type: string
    responses:
      200:
        description: Environment updated successfully
      422:
        description: Missing environment configuration
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    new_environment = request.get_json(silent=True)
    if new_environment is None:
        raise ValidationError("Environment configuration is required", details={"missing_fields": ["environment"]})
    simulation_state["environment"] = new_environment
    return jsonify({"message": "Environment updated"}), 200

@app.route('/api/simulation/monitors', methods=['PUT'])
def update_monitors():
    """Update the simulation monitor settings.
    ---
    tags:
      - Simulation
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
    responses:
      200:
        description: Monitors updated successfully
      422:
        description: Missing monitor configuration
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    new_monitors = request.get_json(silent=True)
    if new_monitors is None:
        raise ValidationError("Monitor configuration is required", details={"missing_fields": ["monitors"]})
    simulation_state["monitors"] = new_monitors
    return jsonify({"message": "Monitors updated"}), 200

# === Flask Routes ===

@app.route('/list-reports', methods=['GET'])
def list_reports():
    """Lists all report batches from the storage service.
    ---
    tags:
      - Reports
    responses:
      200:
        description: List of report batches
        content:
          application/json:
            schema:
              type: object
              properties:
                reports:
                  type: array
                  items:
                    type: object
                    properties:
                      filename:
                        type: string
                      pass:
                        type: integer
                      fail:
                        type: integer
                      drone_count:
                        type: integer
                      report_type:
                        type: string
                      contains_fuzzy:
                        type: boolean
      500:
        description: Storage error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    try:
        reports = storage_service.list_reports()
        if isinstance(reports, dict) and 'error' in reports:
            raise StorageError("Failed to list reports", details={"storage_error": reports.get('error')})
        return jsonify(reports)
    except Exception as e:
        print(f"Error fetching reports: {e}")
        raise StorageError("Failed to list reports", details={"exception": str(e)})

@app.route('/list-folder-contents/<folder_name>', methods=['POST'])
def list_folder_contents(folder_name):
    """Lists the contents of a specific report folder from the storage service.
    ---
    tags:
      - Reports
    parameters:
      - name: folder_name
        in: path
        required: true
        schema:
          type: string
        description: Name of the report folder
    responses:
      200:
        description: Folder contents listing
      500:
        description: Storage error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    try:
        folder_contents = storage_service.list_folder_contents(folder_name)
        if isinstance(folder_contents, dict) and 'error' in folder_contents:
            raise StorageError("Failed to list folder contents", details={"storage_error": folder_contents.get('error'), "folder": folder_name})
        return jsonify(folder_contents)
    except Exception as e:
        print(f"Error fetching folder contents: {e}")
        raise StorageError("Failed to list folder contents", details={"exception": str(e), "folder": folder_name})

@app.route('/serve-html/<folder_name>/<path:relative_path>', methods=['GET'])
def serve_html(folder_name, relative_path):
    """Serves HTML files using the storage service.
    ---
    tags:
      - Reports
    parameters:
      - name: folder_name
        in: path
        required: true
        schema:
          type: string
      - name: relative_path
        in: path
        required: true
        schema:
          type: string
        description: Path to the HTML file within the folder
    responses:
      200:
        description: HTML file content
        content:
          text/html:
            schema:
              type: string
      404:
        description: HTML file not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      500:
        description: Storage error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    try:
        file_contents, status_code = storage_service.serve_html(folder_name, relative_path)
        if status_code == 200:
            return Response(file_contents, mimetype='text/html')
        elif status_code == 404:
            raise ResourceNotFoundError("HTML file not found", details={"folder": folder_name, "path": relative_path})
        else:
            raise StorageError("Failed to serve HTML file", details={"folder": folder_name, "path": relative_path})
    except Exception as e:
        print(f"Error serving HTML file: {e}")
        raise StorageError("Failed to serve HTML file", details={"exception": str(e), "folder": folder_name, "path": relative_path})

@app.route('/download-report/<folder_name>', methods=['GET'])
def download_report(folder_name):
    """Download a report folder as a zip archive.
    ---
    tags:
      - Reports
    parameters:
      - name: folder_name
        in: path
        required: true
        schema:
          type: string
        description: Name of the report folder to download
    responses:
      200:
        description: Zip archive of the report
        content:
          application/zip:
            schema:
              type: string
              format: binary
      404:
        description: Report archive not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      501:
        description: Download not supported by storage backend
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    try:
        if not hasattr(storage_service, "get_report_archive"):
            raise StorageError("Download not supported for this storage backend", details={"folder": folder_name}, status_code=501)

        archive_path, archive_name = storage_service.get_report_archive(folder_name)
        if not archive_path:
            raise ResourceNotFoundError("Report archive not found", details={"folder": folder_name})

        return send_file(archive_path, as_attachment=True, download_name=archive_name)
    except Exception as e:
        print(f"Error downloading report archive: {e}")
        raise StorageError("Failed to download report", details={"exception": str(e), "folder": folder_name})

@app.route('/addTask', methods=['POST'])
def add_task():
    """Add a new simulation task to the queue.
    ---
    tags:
      - Tasks
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - Drones
              - environment
            properties:
              Drones:
                type: array
                items:
                  type: object
                description: List of drone configurations
              environment:
                type: object
                description: Environment settings for the simulation
              monitors:
                type: object
                description: Optional monitor settings
              FuzzyTest:
                type: object
                description: Optional fuzzy test configuration
          example:
            Drones:
              - id: "Drone1"
                X: 0.0
                Y: 0.0
                Z: -5.0
                MissionValue: "fly_to_points"
                Mission:
                  name: "fly_to_points"
                  param: []
            environment:
              UseGeo: true
              Origin:
                Latitude: 38.627
                Longitude: -90.199
                Altitude: 203
    responses:
      200:
        description: Task queued successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                task_id:
                  type: string
                  example: "2025-11-18-10-30-00_Batch_1"
      422:
        description: Validation error — missing required fields
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      500:
        description: Simulation error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    print("Backend recieved addTask")
    global task_number
    try:
        task_data = request.get_json(silent=True)
        _validate_task_payload(task_data)

        # Generate a unique UUID string for the task
        uuid_string = time.strftime("%Y-%m-%d-%H-%M-%S", time.localtime()) + "_Batch_" + str(task_number)
        task_dispatcher.add_task(task_data, uuid_string)
        task_number += 1
        print(f"New task added to queue, currently {task_dispatcher.mission_queue.qsize()} in queue")
        return jsonify({'task_id': uuid_string}), 200
    except Exception as e:
        print(f"Error adding task: {e}")
        raise SimulationFailedError("Failed to add task", details={"exception": str(e)})


@app.route('/api/simulation/settings/preview', methods=['POST'])
def preview_settings():
    """
    Generates the exact AirSim settings.json payload for the provided task without writing files.
    """
    try:
        task_data = request.get_json(silent=True)
        _validate_task_payload(task_data)
        settings = SimulationTaskManager.generate_settings_preview(task_data)
        return jsonify({"settings": settings}), 200
    except ValidationError:
        raise
    except Exception as e:
        print(f"Error previewing settings: {e}")
        raise SimulationFailedError(
            "Failed to preview settings",
            details={"exception": str(e)},
        )

@app.route('/currentRunning', methods=['GET'])
def get_current_running():
    """Retrieve the current running task and queue size.
    ---
    tags:
      - Tasks
    responses:
      200:
        description: Current task status and queue size
        content:
          application/json:
            schema:
              type: object
              properties:
                current_task:
                  type: string
                  enum: ["None", "Running"]
                queue_size:
                  type: integer
    """
    current_task_batch = task_dispatcher.get_current_task_batch()
    if current_task_batch == "None":
        return jsonify({'current_task': 'None', 'queue_size': task_dispatcher.mission_queue.qsize()}), 200
    else:
        return jsonify({'current_task': 'Running', 'queue_size': task_dispatcher.mission_queue.qsize()}), 200

@app.route('/report')
@app.route('/report/<path:dir_name>')
def get_report(dir_name=''):
    """Browse report files from the storage service.
    ---
    tags:
      - Reports
    parameters:
      - name: dir_name
        in: path
        required: false
        schema:
          type: string
        description: Report directory name (optional — lists root if omitted)
    responses:
      200:
        description: Rendered HTML page listing report files
        content:
          text/html:
            schema:
              type: string
      404:
        description: No reports found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
      501:
        description: Listing not supported by storage backend
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    try:
        if dir_name:
            prefix = f'reports/{dir_name}/'
        else:
            prefix = 'reports/'

        # Assuming the storage service has a method to list files in a prefix
        if hasattr(storage_service, 'list_files'):
            files = storage_service.list_files(prefix)
        else:
            # If not implemented, return a 501 Not Implemented
            raise StorageError("Listing files is not supported for this storage backend", details={"prefix": prefix}, status_code=501)
        
        if not files:
            raise ResourceNotFoundError("No reports found", details={"prefix": prefix})

        return render_template('files.html', files=files)

    except Exception as e:
        print(f"Error fetching report for directory {dir_name}: {e}")
        raise StorageError("Failed to fetch report directory", details={"directory": dir_name, "exception": str(e)})

@app.route('/stream/<drone_name>/<camera_name>')
def stream(drone_name, camera_name):
    """Stream live camera feed from a drone.
    ---
    tags:
      - Streaming
    parameters:
      - name: drone_name
        in: path
        required: true
        schema:
          type: string
        description: Name of the drone
      - name: camera_name
        in: path
        required: true
        schema:
          type: string
        description: Name of the camera on the drone
    responses:
      200:
        description: MJPEG video stream (multipart response)
        content:
          multipart/x-mixed-replace:
            schema:
              type: string
              format: binary
      500:
        description: Stream failed
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorResponse'
    """
    if task_dispatcher.unreal_state.get('state') == 'idle':
        return "No task running", 200
    else:
        try:
            return Response(
                task_dispatcher.get_stream(drone_name, camera_name),
                mimetype='multipart/x-mixed-replace; boundary=frame'
            )
        except Exception as e:
            print(e)
            raise SimulationFailedError("Failed to start stream", details={"drone": drone_name, "camera": camera_name, "exception": str(e)})

@app.route('/state', methods=['GET'])
def get_state():
    """Get the current simulation engine state.
    ---
    tags:
      - Simulation
    responses:
      200:
        description: Simulation engine state
        content:
          application/json:
            schema:
              type: object
              properties:
                state:
                  type: string
                  enum: ["idle", "running"]
    """
    return jsonify(task_dispatcher.unreal_state), 200

@app.route('/cesiumCoordinate', methods=['GET'])
def get_map():
    """Load Cesium map coordinate settings.
    ---
    tags:
      - Simulation
    responses:
      200:
        description: Cesium map settings
        content:
          application/json:
            schema:
              type: object
    """
    return task_dispatcher.load_cesium_setting(), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint.
    ---
    tags:
      - System
    responses:
      200:
        description: Backend is reachable
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: "ok"
                message:
                  type: string
                  example: "Backend is reachable!"
    """
    return jsonify({"status": "ok", "message": "Backend is reachable!"})

# === Run the Flask App ===
if __name__ == '__main__':
    print("Starting DroneWorld API Server...")
    backend_port = os.getenv("BACKEND_PORT") or os.getenv("FLASK_RUN_PORT") or "5000"
    app.run(host='0.0.0.0', port=int(backend_port))  # Makes it discoverable by other devices in the networkecho 
