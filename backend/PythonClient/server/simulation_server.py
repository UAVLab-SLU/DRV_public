import logging
import os #I changed it from os.path to just os. Revert is needed
import threading
import time
import base64

import json
import mimetypes

import sys
from flask import Flask, request, abort, send_file, render_template, Response, jsonify
from flask_cors import CORS

##UNCOMMENT LINE IF TESTING ON LOCAL MACHINE
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
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
    # Reports file
    reports_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")

    if not os.path.exists(reports_path) or not os.path.isdir(reports_path):
        return 'Reports directory not found', 404

    def count_pass_fail_from_log(directory):
        pass_count = fail_count = 0
        # Navigate to the specific directory structure for GlobalMonitors -> MinSepDistMonitor -> log.txt
        for root, dirs, files in os.walk(directory):
            if 'GlobalMonitors' in dirs:
                global_monitors_path = os.path.join(root, 'GlobalMonitors')
                min_sep_dist_monitor_path = os.path.join(global_monitors_path, 'MinSepDistMonitor')
                log_file_path = os.path.join(min_sep_dist_monitor_path, 'log.txt')
                if os.path.exists(log_file_path):
                    with open(log_file_path, 'r') as log_file:
                        for line in log_file:
                            if 'PASS' in line:
                                try:
                                    items_list = eval(line.split(';')[2])
                                    pass_count += len(items_list)
                                except SyntaxError:
                                    pass  # Handle potential eval errors safely
                            elif 'FAIL' in line:
                                try:
                                    items_list = eval(line.split(';')[2])
                                    fail_count += len(items_list)
                                except SyntaxError:
                                    pass
                    break  # Stop searching once log.txt is found and processed
        return pass_count, fail_count

    report_files = []
    for file in os.listdir(reports_path):
        file_path = os.path.join(reports_path, file)
        if os.path.isdir(file_path):
            # Find 'Fuzzy' files
            fuzzy_files = [f for f in os.listdir(file_path) if 'fuzzy' in f.lower()]
            contains_fuzzy = len(fuzzy_files) > 0

            # Determine the path to count Drone files
            if contains_fuzzy:
                first_fuzzy_path = os.path.join(file_path, fuzzy_files[0])
                if os.path.isdir(first_fuzzy_path):
                    flytopoints_path = os.path.join(first_fuzzy_path, 'FlyToPoints')
                else:
                    flytopoints_path = os.path.join(file_path, 'FlyToPoints')
            else:
                flytopoints_path = os.path.join(file_path, 'FlyToPoints')

            # Count Drones
            drone_count = 0
            if os.path.exists(flytopoints_path) and os.path.isdir(flytopoints_path):
                drone_count = sum(1 for f in os.listdir(flytopoints_path) if f.startswith('FlyToPoints_Drone'))

            # Count PASS and FAIL from log.txt
            pass_count, fail_count = count_pass_fail_from_log(file_path)

            report_files.append({
                'filename': file,
                'contains_fuzzy': contains_fuzzy,
                'drone_count': drone_count,
                'pass': pass_count,
                'fail': fail_count
            })
        else:
            # For non-directory files, you could adjust handling if needed
            report_files.append({
                'filename': file,
                'contains_fuzzy': False,
                'drone_count': 0,
                'pass': 0,
                'fail': 0
            })

    return {'reports': report_files}
"""
#old version without the pass fails
def list_reports():
    # Reports file
    reports_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")
    if not os.path.exists(reports_path) or not os.path.isdir(reports_path):
        return 'Reports directory not found', 404
    #print("Listing items in:", reports_path) #Debugging line
    #print(os.listdir(reports_path))  #Debugging line
    report_files = []
    for file in os.listdir(reports_path):
        if 'store' in file.lower():
            continue #skip ds store files entirely, we dont want them

        file_path = os.path.join(reports_path, file)
        
        if os.path.isdir(file_path):
            #Find 'Fuzzy' files
            fuzzy_files = [f for f in os.listdir(file_path) if 'fuzzy' in f.lower()]
            contains_fuzzy = len(fuzzy_files) > 0
            #Determine the path to count Drone files
            if contains_fuzzy:
                first_fuzzy_path = os.path.join(file_path, fuzzy_files[0])
                #Check if the first 'Fuzzy' file is a directory
                if os.path.isdir(first_fuzzy_path):
                    flytopoints_path = os.path.join(first_fuzzy_path, 'FlyToPoints')
                else:
                    flytopoints_path = os.path.join(file_path, 'FlyToPoints')
            else:
                flytopoints_path = os.path.join(file_path, 'FlyToPoints')
            #Count Drones
            drone_count = 0
            if os.path.exists(flytopoints_path) and os.path.isdir(flytopoints_path):
                drone_count = sum(1 for f in os.listdir(flytopoints_path) if f.startswith('FlyToPoints_Drone'))
            report_files.append({'filename': file, 'contains_fuzzy': contains_fuzzy, 'drone_count': drone_count})
        else:
            report_files.append({'filename': file, 'contains_fuzzy': False, 'drone_count': 0})
    return {'reports': report_files}
"""

"""
@app.route('/list-reports', methods=['GET'])
def list_reports():
    # Reports file
    reports_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")
    if not os.path.exists(reports_path) or not os.path.isdir(reports_path):
        return 'Reports directory not found', 404
    #print("Listing items in:", reports_path) #Debugging line
    #print(os.listdir(reports_path))  #Debugging line
    report_files = []
    for file in os.listdir(reports_path):
        file_path = os.path.join(reports_path, file)
        #print("Checking file:", file_path)
        if os.path.isfile(file_path):
            #contains_fuzzy = 'Fuzzy' in file
            report_files.append({'filename': file})
        else:
            report_files.append({'filename': file})
    return {'reports': report_files}

@app.route('/get-file-path/<filename>', methods=['GET'])
def get_file_path(filename):
    #construct the full path to the file
    file_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", filename)

    #return the file path
    return file_path
"""
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

@app.route('/list-folder-contents-<foldername>', methods=['GET'])
def list_folder_contents(foldername):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")
    folder_name = request.args.get(foldername)
    folder_path = os.path.join(base_directory, folder_name)

    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return jsonify({'error': 'Folder not found'}), 404

    folder_contents = []
    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)
        file_content = None
        file_type = None

        if os.path.isfile(item_path):
            file_type = 'file'
            if item.endswith('.txt') or item.endswith('.html'):
                # For text and HTML files, read as text
                with open(item_path, 'r', encoding='utf-8') as file:
                    file_content = file.read()
            elif item.endswith('.png'):
                # For PNG images, encode the content in base64
                with open(item_path, 'rb') as file:
                    file_content = base64.b64encode(file.read()).decode('utf-8')
            else:
                # For other file types, you may add more conditions
                continue

            folder_contents.append({
                'name': item,
                'type': file_type,
                'content': file_content,
                'file_extension': item.split('.')[-1]
            })
        elif os.path.isdir(item_path):
            file_type = 'directory'
            folder_contents.append({
                'name': item,
                'type': file_type
            })

    return jsonify(folder_contents)


@app.route('/list-reports', methods=['GET'])
def list_reports():
    # Reports file
    reports_path = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report")
    if not os.path.exists(reports_path) or not os.path.isdir(reports_path):
        return 'Reports directory not found', 404
    def check_monitor_pass_fail(directory, monitor):
        monitor_pass = True
        monitor_path = os.path.join(directory, monitor)
        if os.path.exists(monitor_path) and os.path.isdir(monitor_path):
            for file_name in os.listdir(monitor_path):
                if file_name.endswith('.txt'):
                    log_path = os.path.join(monitor_path, file_name)
                    with open(log_path, 'r') as file:
                        for line in file:
                            if 'FAIL' in line:
                                monitor_pass = False
                                break
                    if not monitor_pass:
                        break
        return monitor_pass
    def count_drone_files(directory):
        flytopoints_path = os.path.join(directory, 'FlyToPoints')
        if os.path.exists(flytopoints_path) and os.path.isdir(flytopoints_path):
            collision_monitor_path = os.path.join(flytopoints_path, 'CollisionMonitor')
            if os.path.exists(collision_monitor_path) and os.path.isdir(collision_monitor_path):
                return len([f for f in os.listdir(collision_monitor_path) if f.endswith('.txt')])
        return 0
    monitors = ['CollisionMonitor', 'LandspaceMonitor', 'NoFlyZoneMonitor', 'PointDeviationMonitor']
    global_monitors = ['MinSepDistMonitor']
    report_files = []
    for file in os.listdir(reports_path):
        file_path = os.path.join(reports_path, file)
        if os.path.isdir(file_path):
            pass_count = fail_count = 0
            contains_fuzzy = any('fuzzy' in sub.lower() for sub in os.listdir(file_path))
            paths_to_check = []
            if contains_fuzzy:
                # Check each fuzzy subdirectory
                for subdir in os.listdir(file_path):
                    if 'fuzzy' in subdir.lower():
                        subdir_path = os.path.join(file_path, subdir)
                        paths_to_check.append(subdir_path)
            else:
                # If no fuzzy subdirectory, check the main directory
                paths_to_check.append(file_path)
            drone_count = 0
            for path in paths_to_check:
                drone_count = max(drone_count, count_drone_files(path))
            all_monitors_pass = True
            for path in paths_to_check:
                flytopoints_path = os.path.join(path, 'FlyToPoints')
                if os.path.exists(flytopoints_path) and os.path.isdir(flytopoints_path):
                    for monitor in monitors:
                        if not check_monitor_pass_fail(flytopoints_path, monitor):
                            all_monitors_pass = False
                            break
                    if not all_monitors_pass:
                        break
                global_monitors_path = os.path.join(path, 'GlobalMonitors')
                if os.path.exists(global_monitors_path) and os.path.isdir(global_monitors_path):
                    for monitor in global_monitors:
                        if not check_monitor_pass_fail(global_monitors_path, monitor):
                            all_monitors_pass = False
                            break
                    if not all_monitors_pass:
                        break
            if all_monitors_pass:
                pass_count = drone_count
            else:
                fail_count = drone_count
            report_files.append({
                'filename': file,
                'contains_fuzzy': contains_fuzzy,
                'drone_count': drone_count,
                'pass': pass_count,
                'fail': fail_count
            })
        else:
            report_files.append({
                'filename': file,
                'contains_fuzzy': False,
                'drone_count': 0,
                'pass': 0,
                'fail': 0
            })
    return {'reports': report_files}
#Folder content with base64
@app.route('/list-folder-contents/<folder_name>', methods=['POST'])
def list_folder_contents(folder_name):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", folder_name)

    if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
        return jsonify({'error': 'Folder not found'}), 404

    result = {
        "name": folder_name,
        "UnorderedWaypointMonitor": [],
        "CircularDeviationMonitor": [],
        "CollisionMonitor": [],
        "LandspaceMonitor": [],
        "OrderedWaypointMonitor": [],
        "PointDeviationMonitor": [],
        "MinSepDistMonitor": [],
        "NoFlyZoneMonitor": []
    }

    fuzzy_folders = [dir_name for dir_name in os.listdir(base_directory) if dir_name.startswith("Fuzzy_Wind_")]

    if fuzzy_folders:
        for fuzzy_folder in fuzzy_folders:
            fuzzy_directory = os.path.join(base_directory, fuzzy_folder)
            process_directory(fuzzy_directory, result, fuzzy_folder)
    else:
        process_directory(base_directory, result, "")

    return jsonify(result)

def process_directory(directory, result, fuzzy_path_value):
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)

            fuzzy_value = fuzzy_path_value.split("_")[-1] if fuzzy_path_value else ""

            if file.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_contents = f.read()
                    info_content = get_info_contents(file_contents, "INFO", {})
                    pass_content = get_info_contents(file_contents, "PASS", {})
                    fail_content = get_info_contents(file_contents, "FAIL", {})

                    file_data = {
                        "name": file,
                        "type": "text/plain",
                        "fuzzyPath": fuzzy_path_value,
                        "fuzzyValue": fuzzy_value,
                        "content": file_contents,
                        "infoContent": info_content,
                        "passContent": pass_content,
                        "failContent": fail_content
                    }

                    if "UnorderedWaypointMonitor" in file_path:
                        result["UnorderedWaypointMonitor"].append(file_data)
                    elif "CircularDeviationMonitor" in file_path:
                        result["CircularDeviationMonitor"].append(file_data)
                    elif "CollisionMonitor" in file_path:
                        result["CollisionMonitor"].append(file_data)
                    elif "LandspaceMonitor" in file_path:
                        result["LandspaceMonitor"].append(file_data)
                    elif "OrderedWaypointMonitor" in file_path:
                        result["OrderedWaypointMonitor"].append(file_data)
                    elif "PointDeviationMonitor" in file_path:
                        result["PointDeviationMonitor"].append(file_data)
                    elif "MinSepDistMonitor" in file_path:
                        result["MinSepDistMonitor"].append(file_data)
                    elif "NoFlyZoneMonitor" in file_path:
                        result["NoFlyZoneMonitor"].append(file_data)

            elif file.endswith('.png'):
                file_data = {
                    "name": file,
                    "type": "image/png",
                    "fuzzyPath": fuzzy_path_value,
                    "fuzzyValue": fuzzy_value
                }

                with open(file_path, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    file_data["imgContent"] = encoded_string
                file_data["path"] = file_path.replace("_plot.png", "_interactive.html")

                if "UnorderedWaypointMonitor" in file_path:
                    result["UnorderedWaypointMonitor"].append(file_data)
                elif "CircularDeviationMonitor" in file_path:
                    result["CircularDeviationMonitor"].append(file_data)
                elif "CollisionMonitor" in file_path:
                    result["CollisionMonitor"].append(file_data)
                elif "LandspaceMonitor" in file_path:
                    result["LandspaceMonitor"].append(file_data)
                elif "OrderedWaypointMonitor" in file_path:
                    result["OrderedWaypointMonitor"].append(file_data)
                elif "PointDeviationMonitor" in file_path:
                    result["PointDeviationMonitor"].append(file_data)
                elif "MinSepDistMonitor" in file_path:
                    result["MinSepDistMonitor"].append(file_data)
                elif "NoFlyZoneMonitor" in file_path:
                    result["NoFlyZoneMonitor"].append(file_data)

def get_info_contents(file_contents, keyword, drone_map):
    content_array = file_contents.split("\n")
    for content in content_array:
        content_split = content.split(";")
        if keyword in content and len(content_split) == 4:
            key = content_split[2].strip()
            value = content_split[3].strip()
            if key not in drone_map:
                drone_map[key] = [value]
            else:
                drone_map[key].append(value)
    return drone_map

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
    current_task_batch = task_dispatcher.get_current_task_batch()
    if current_task_batch == "None":
        return f"{'None'}, {task_dispatcher.mission_queue.qsize()}"
    else:
        return f"{'Running'}, {task_dispatcher.mission_queue.qsize()}"

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
