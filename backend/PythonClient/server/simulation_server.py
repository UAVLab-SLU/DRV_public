import logging
import os
import threading
import time
import sys
from flask import Flask, request, abort, render_template, Response, jsonify
from flask_cors import CORS

# Add parent directories to the Python path for module imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Import the SimulationTaskManager
from PythonClient.multirotor.control.simulation_task_manager import SimulationTaskManager
from PythonClient.multirotor.control.dronelume_config import (
    DRONELUME_STATE,
    DroneLumeValidationError,
    extract_dronelume_request,
    get_dronelume_contract,
    validate_init_dsl,
)
from PythonClient.multirotor.control.scenario_model_provider import (
    ScenarioProviderError,
    get_scenario_model_provider,
)

# Import the storage service from the configuration module
from PythonClient.multirotor.storage.storage_config import get_storage_service
from PythonClient.multirotor.util.geo.geo_util import GeoUtil

app = Flask(__name__, template_folder="./templates")

# Configure logging to suppress Werkzeug logs except for errors
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
CORS(app)

# Initialize the SimulationTaskManager
task_dispatcher = SimulationTaskManager()
threading.Thread(target=task_dispatcher.start, daemon=True).start()

task_number = 1  # Global task counter
unreal_state_not_found = threading.Event()

# Initialize the storage service
storage_service = get_storage_service()
print(f"Using {storage_service.__class__.__name__} as the storage service.")

# === Simulation Configuration State ===
simulation_state = {
    "environment": {},
    "monitors": {},
    "drones": []
}

# === New API Routes ===

@app.route('/api/simulation', methods=['GET'])
def get_simulation_state():
    """Retrieve the current simulation state."""
    return jsonify(simulation_state), 200

@app.route('/api/simulation/drones', methods=['POST'])
def add_drone():
    """Add a new drone to the simulation."""
    new_drone = request.get_json()
    if not new_drone or "id" not in new_drone:
        return jsonify({"error": "Invalid drone data"}), 400

    simulation_state["drones"].append(new_drone)
    return jsonify(new_drone), 201

@app.route('/api/simulation/drones/<drone_id>', methods=['PUT'])
def update_drone(drone_id):
    """Update an existing drone's configuration."""
    updated_drone = request.get_json()
    for i, drone in enumerate(simulation_state["drones"]):
        if str(drone["id"]) == drone_id:
            simulation_state["drones"][i] = updated_drone
            return jsonify(updated_drone), 200
    return jsonify({"error": "Drone not found"}), 404

@app.route('/api/simulation/drones/<drone_id>', methods=['DELETE'])
def delete_drone(drone_id):
    """Remove a drone from the simulation."""
    for i, drone in enumerate(simulation_state["drones"]):
        if str(drone["id"]) == drone_id:
            del simulation_state["drones"][i]
            return jsonify({"message": "Drone deleted"}), 200
    return jsonify({"error": "Drone not found"}), 404

@app.route('/api/simulation/environment', methods=['PUT'])
def update_environment():
    """Update the simulation environment settings."""
    new_environment = request.get_json()
    simulation_state["environment"] = new_environment
    return jsonify({"message": "Environment updated"}), 200

@app.route('/api/simulation/monitors', methods=['PUT'])
def update_monitors():
    """Update the simulation monitor settings."""
    new_monitors = request.get_json()
    simulation_state["monitors"] = new_monitors
    return jsonify({"message": "Monitors updated"}), 200

# === Flask Routes ===

@app.route('/list-reports', methods=['GET'])
def list_reports():
    """
    Lists all report batches from the storage service.
    """
    try:
        reports = storage_service.list_reports()
        if 'error' in reports:
            return jsonify({'error': 'Failed to list reports'}), 500
        return jsonify(reports)
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return jsonify({'error': 'Failed to list reports'}), 500

@app.route('/list-folder-contents/<folder_name>', methods=['POST'])
def list_folder_contents(folder_name):
    """
    Lists the contents of a specific report folder from the storage service.
    """
    try:
        folder_contents = storage_service.list_folder_contents(folder_name)
        if 'error' in folder_contents:
            return jsonify({'error': 'Failed to list folder contents'}), 500
        return jsonify(folder_contents)
    except Exception as e:
        print(f"Error fetching folder contents: {e}")
        return jsonify({'error': 'Failed to list folder contents'}), 500

@app.route('/serve-html/<folder_name>/<path:relative_path>', methods=['GET'])
def serve_html(folder_name, relative_path):
    """
    Serves HTML files using the storage service.
    """
    try:
        file_contents, status_code = storage_service.serve_html(folder_name, relative_path)
        if status_code == 200:
            return Response(file_contents, mimetype='text/html')
        elif status_code == 404:
            return jsonify({"error": "HTML file not found"}), 404
        else:
            return jsonify({"error": "Failed to serve HTML file"}), 500
    except Exception as e:
        print(f"Error serving HTML file: {e}")
        return jsonify({"error": "Failed to serve HTML file"}), 500

@app.route('/addTask', methods=['POST'])
def add_task():
    """
    Adds a new simulation task to the queue.
    """
    global task_number
    try:
        task_data = request.get_json()
        if not task_data:
            return jsonify({'error': 'No task data provided'}), 400

        try:
            extract_dronelume_request(task_data)
        except DroneLumeValidationError as e:
            return jsonify({
                'error': 'Invalid DroneLume InitDSL configuration',
                'details': e.errors,
            }), 400

        # Generate a unique UUID string for the task
        uuid_string = time.strftime("%Y-%m-%d-%H-%M-%S", time.localtime()) + "_Batch_" + str(task_number)
        task_dispatcher.add_task(task_data, uuid_string)
        task_number += 1
        print(f"New task added to queue, currently {task_dispatcher.mission_queue.qsize()} in queue")
        return jsonify({'task_id': uuid_string}), 200
    except Exception as e:
        print(f"Error adding task: {e}")
        return jsonify({'error': 'Failed to add task'}), 500

@app.route('/currentRunning', methods=['GET'])
def get_current_running():
    """
    Retrieves the current running task and the queue size.
    """
    current_task_batch = task_dispatcher.get_current_task_batch()
    if current_task_batch == "None":
        return jsonify({'current_task': 'None', 'queue_size': task_dispatcher.mission_queue.qsize()}), 200
    else:
        return jsonify({'current_task': 'Running', 'queue_size': task_dispatcher.mission_queue.qsize()}), 200

@app.route('/report')
@app.route('/report/<path:dir_name>')
def get_report(dir_name=''):
    """
    Serves reports from the storage service.
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
            return abort(501)
        
        if not files:
            return abort(404)

        return render_template('files.html', files=files)

    except Exception as e:
        print(f"Error fetching report for directory {dir_name}: {e}")
        return abort(404)

@app.route('/stream/<drone_name>/<camera_name>')
def stream(drone_name, camera_name):
    """
    Streams camera data for a specific drone and camera.
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
            return "Error", 500

@app.route('/state', methods=['GET'])
def get_state():
    """
    Returns the current state of the simulation.
    """
    if unreal_state_not_found.is_set():
        return jsonify({'error': 'Not found'}), 404
    return jsonify(task_dispatcher.unreal_state), 200


@app.route('/api/debug/unreal-state-not-found', methods=['POST'])
def set_unreal_state_not_found():
    """Development-only override that makes Unreal's state request return 404."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('enabled'), bool):
        return jsonify({'error': 'A boolean enabled field is required'}), 400

    if payload['enabled']:
        unreal_state_not_found.set()
    else:
        unreal_state_not_found.clear()
    return jsonify({'enabled': unreal_state_not_found.is_set()}), 200


@app.route('/api/dronelume/schema', methods=['GET'])
def get_dronelume_schema():
    """Returns the canonical LLM/manual authoring contract supported by Unreal."""
    return jsonify(get_dronelume_contract()), 200


@app.route('/api/dronelume/validate', methods=['POST'])
def validate_dronelume_config():
    """Validates a direct InitDSL document or an object containing init_dsl."""
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({'error': 'A JSON body is required'}), 400
    document = payload.get('init_dsl') if isinstance(payload, dict) and 'init_dsl' in payload else payload
    try:
        validated = validate_init_dsl(document)
    except DroneLumeValidationError as e:
        return jsonify({
            'valid': False,
            'error': 'Invalid DroneLume InitDSL configuration',
            'details': e.errors,
        }), 400
    return jsonify({'valid': True, 'init_dsl': validated}), 200


@app.route('/api/dronelume/apply', methods=['POST'])
def apply_dronelume_config():
    """Validate and immediately deploy InitDSL to the active simulator mount."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({'error': 'A JSON object is required'}), 400
    document = payload.get('init_dsl')
    if document is None:
        return jsonify({'error': 'init_dsl is required'}), 400
    source = payload.get('source', 'llm')
    try:
        validated = validate_init_dsl(document)
        destination = task_dispatcher.apply_dronelume(validated, source)
    except DroneLumeValidationError as e:
        return jsonify({
            'applied': False,
            'error': 'Invalid DroneLume InitDSL configuration',
            'details': e.errors,
        }), 400
    except ValueError as e:
        return jsonify({'applied': False, 'error': str(e)}), 400
    except OSError as e:
        return jsonify({
            'applied': False,
            'error': f'Unable to write InitDSL.json to the simulator configuration: {e}',
        }), 500
    return jsonify({
        'applied': True,
        'init_dsl': validated,
        'file_name': destination.name,
        'state': DRONELUME_STATE,
    }), 200


@app.route('/api/dronelume/assist', methods=['POST'])
def assist_dronelume_config():
    """Turn a bounded conversation into guidance or deterministic InitDSL."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({'error': 'A JSON object is required', 'code': 'invalid_request'}), 400
    try:
        provider = get_scenario_model_provider(payload.get('provider'))
        result = provider.generate(
            payload.get('messages'),
            get_dronelume_contract(),
            payload.get('current_init_dsl'),
        )
    except ScenarioProviderError as e:
        response = {'error': str(e), 'code': e.code}
        if hasattr(e, 'details'):
            response['details'] = e.details
        return jsonify(response), e.status_code
    return jsonify(result.to_dict()), 200


@app.route('/api/dronelume/stop', methods=['POST'])
def stop_dronelume():
    """Stops the active DroneLume scenario and asks Unreal to return to its menu."""
    if not task_dispatcher.stop_dronelume():
        return jsonify({'error': 'No DroneLume scenario is running'}), 409
    return jsonify({'status': 'ok', 'state': 'idle'}), 200

@app.route('/cesiumCoordinate', methods=['GET'])
def get_map():
    """
    Loads Cesium map settings.
    """
    return task_dispatcher.load_cesium_setting(), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is reachable!"})

@app.route('/gnss_az_el', methods=['POST'])
def get_gnss_az_el():
    """
    Returns GPS satellite azimuth and elevation for a location and UTC time.
    """
    payload = request.get_json() or {}
    required_fields = {'latitude', 'longitude', 'altitude', 'dateTime'}
    missing_fields = sorted(required_fields - payload.keys())
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    try:
        results = GeoUtil.get_gnss_az_el(
            payload['latitude'],
            payload['longitude'],
            payload['altitude'],
            payload['dateTime'],
        )
    except Exception as e:
        print(f"Error calculating GNSS azimuth/elevation: {e}")
        return jsonify({"error": "Failed to calculate GNSS azimuth/elevation"}), 500

    return jsonify(results), 200

# === Run the Flask App ===
if __name__ == '__main__':
    print("Starting DroneWorld API Server...")
    app.run(host='0.0.0.0', port=5000)  # Makes it discoverable by other devices in the networkecho 
