import logging
import os.path
import threading
import time

from flask import Flask, request, abort, send_file, render_template, Response, jsonify
from flask_cors import CORS

from PythonClient.multirotor.control.simulation_task_manager import SimulationTaskManager

app = Flask(__name__, template_folder="./templates")

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
CORS(app)

task_dispatcher = SimulationTaskManager()
threading.Thread(target=task_dispatcher.start).start()
task_number = 1


# For Frontend to fetch all missions available to use
#@app.route('/mission', methods=['GET'])
#def mission():
#     directory = '../multirotor/mission'
#     return [file for file in os.listdir(directory) if os.path.isfile(os.path.join(directory, file))]

@app.route('/list-reports', methods=['GET'])
def list_reports():

    #Reports file

    reports_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")

    if not os.path.exists(reports_path) or not os.path.isdir(reports_path):
        return 'Reports directory not found', 404

    report_files = []

    for file in os.listdir(reports_path):
        file_path = os.path.join(reports_path, file)

        if os.path.isfile(file_path):
            contains_fuzzy = 'Fuzzy' in file
            report_files.append({'filename': file, 'contains_fuzzy': contains_fuzzy})

    return {'reports': report_files} #report_files is a list of tuples containing the filename and if it has fuzzy testing


@app.route('/get-file-path/<filename>', methods=['GET'])
def get_file_path(filename):
    #construct the full path to the file
    file_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", filename)

    #return the file path
    return file_path

"""
#make a report data function that takes the fileName.
@app.route('/report-data/<filename>', methods=['GET'])

def report_data(filename):

    #construct the full path to the file
    file_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", filename)

    #check if the file exists
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        #open and read the file content
        with open(file_path, 'r') as file:
            content = file.read()
            return jsonify({'content': content})
        
        #if error give us an error message to tell the user
    except Exception as e:
        return jsonify({'error': 'Error reading file', 'details': str(e)}), 500
"""


@app.route('/addTask', methods=['POST'])
def add_task():
    global task_number
    uuid_string = time.strftime("%Y-%m-%d-%H-%M-%S", time.localtime()) + "_Batch_" + str(task_number)
    task_dispatcher.add_task(request.get_json(), uuid_string)
    task_number += 1
    print(f"New task added to queue, currently {task_dispatcher.mission_queue.qsize()} in queue")
    return uuid_string


@app.route('/currentRunning', methods=['GET'])
def get_current_running():
    return task_dispatcher.get_current_task_batch()


@app.route('/report')
@app.route('/report/<path:dir_name>')
def get_report(dir_name=''):
    report_root_dir = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")
    dir_path = os.path.join(report_root_dir, dir_name)
    if not os.path.exists(dir_path):
        return abort(404)
    if os.path.isfile(dir_path):
        return send_file(dir_path)
    files = os.listdir(dir_path)
    return render_template('files.html', files=files)


@app.route('/stream/<drone_name>/<camera_name>')
def stream(drone_name, camera_name):
    if task_dispatcher.unreal_state['state'] == 'idle':
        return "No task running"
    else:
        try:
            return Response(
                task_dispatcher.get_stream(drone_name, camera_name),
                mimetype='multipart/x-mixed-replace; boundary=frame'
            )
        except Exception as e:
            print(e)
            return "Error"


# @app.route('/uploadMission', methods=['POST'])
# def upload_file():
#     file = request.files['file']
#     filename = file.filename
#     custom_mission_dir = '../multirotor/mission/custom'
#     path = os.path.join(custom_mission_dir, filename)
#     file.save(path)
#     return 'File uploaded'


# def update_settings_json(drone_number, separation_distance):
#     SettingGenerator(drone_number, separation_distance)


@app.route('/state', methods=['GET'])
def get_state():
    """
    For unreal engine to check the current run state
    :return:  json obj consists of the current state with this specific format
    {
        "state": "idle"
    }
    or
    {
        "state": "start"
    }
    any other state will be not accepted by the unreal engine side and the change will be ignored
    """
    return task_dispatcher.unreal_state


@app.route('/cesiumCoordinate', methods=['GET'])
def get_map():
    return task_dispatcher.load_cesium_setting()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    # makes it discoverable by other devices in the network
