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

# Here is the code that is seperate. It is the file content below.
# In the frontend, you need to call process_report_file(fileName)
"""
#No base64 of image or html
@app.route('/list-folder-contents/<folder_name>', methods=['GET'])
def list_folder_contents(folder_name):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", folder_name)

    if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
        return jsonify({'error': 'Folder not found'}), 404

    result = {
        "name": 0,
        "UnorderedWaypointMonitor": [],
        "CircularDeviationMonitor": [],
        "CollisionMonitor": [],
        "LandspaceMonitor": [],
        "OrderedWaypointMonitor": [],
        "PointDeviationMonitor": [],
        "MinSepDistMonitor": [],
        "NoFlyZoneMonitor": []
    }

    for root, dirs, files in os.walk(base_directory):
        for file in files:
            file_path = os.path.join(root, file)

            fuzzy_path_value = None
            paths = file_path.split(os.sep)
            if len(paths) > 1:
                fuzzy_path_value = paths[-2]

            fuzzy_value_array = fuzzy_path_value.split("_") if fuzzy_path_value else []

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
                        "fuzzyValue": fuzzy_path_value,
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

            elif file.endswith('.png') or file.endswith('.html'):
                file_data = {
                    "name": file,
                    "type": "image/png" if file.endswith('.png') else "text/html",
                    "fuzzyPath": fuzzy_path_value,
                    "fuzzyValue": fuzzy_path_value
                }

                if file.endswith('.png'):
                    file_data["imgContent"] = None
                    file_data["path"] = file_path.replace("_plot.png", "_interactive.html")
                else:
                    file_data["path"] = file_path

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

    return jsonify(result)

def get_info_contents(file_contents, keyword, default_value):
    info_contents = {}
    lines = file_contents.split('\n')
    for line in lines:
        if line.startswith(keyword):
            parts = line.split(';')
            if len(parts) >= 3:
                key = parts[2]
                value = parts[3] if len(parts) >= 4 else ''
                info_contents[key] = value.strip()
    return info_contents if info_contents else default_value
"""
#base64 of all
@app.route('/list-folder-contents/<folder_name>', methods=['POST'])
def list_folder_contents(folder_name):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", folder_name)

    if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
        return jsonify({'error': 'Folder not found'}), 404

    result = {
        "name": 0,
        "UnorderedWaypointMonitor": [],
        "CircularDeviationMonitor": [],
        "CollisionMonitor": [],
        "LandspaceMonitor": [],
        "OrderedWaypointMonitor": [],
        "PointDeviationMonitor": [],
        "MinSepDistMonitor": [],
        "NoFlyZoneMonitor": []
    }

    for root, dirs, files in os.walk(base_directory):
        for file in files:
            file_path = os.path.join(root, file)

            fuzzy_path_value = None
            paths = file_path.split(os.sep)
            if len(paths) > 1:
                fuzzy_path_value = paths[-2]

            fuzzy_value_array = fuzzy_path_value.split("_") if fuzzy_path_value else []

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
                        "fuzzyValue": fuzzy_path_value,
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

            elif file.endswith('.png') or file.endswith('.html'):
                file_data = {
                    "name": file,
                    "type": "image/png" if file.endswith('.png') else "text/html",
                    "fuzzyPath": fuzzy_path_value,
                    "fuzzyValue": fuzzy_path_value
                }

                if file.endswith('.png'):
                    with open(file_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                        file_data["imgContent"] = encoded_string
                    file_data["path"] = file_path.replace("_plot.png", "_interactive.html")
                else:
                    with open(file_path, "r", encoding='utf-8') as html_file:
                        encoded_string = base64.b64encode(html_file.read().encode('utf-8')).decode('utf-8')
                        file_data["htmlContent"] = encoded_string
                    file_data["path"] = file_path

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

    return jsonify(result)

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



#base64 of png
"""
@app.route('/list-folder-contents/<folder_name>', methods=['POST'])
def list_folder_contents(folder_name):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", folder_name)

    if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
        return jsonify({'error': 'Folder not found'}), 404

    result = {
        "name": 0,
        "UnorderedWaypointMonitor": [],
        "CircularDeviationMonitor": [],
        "CollisionMonitor": [],
        "LandspaceMonitor": [],
        "OrderedWaypointMonitor": [],
        "PointDeviationMonitor": [],
        "MinSepDistMonitor": [],
        "NoFlyZoneMonitor": []
    }

    for root, dirs, files in os.walk(base_directory):
        for file in files:
            file_path = os.path.join(root, file)

            fuzzy_path_value = None
            paths = file_path.split(os.sep)
            if len(paths) > 1:
                fuzzy_path_value = paths[-2]

            fuzzy_value_array = fuzzy_path_value.split("_") if fuzzy_path_value else []

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
                        "fuzzyValue": fuzzy_path_value,
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

            elif file.endswith('.png') or file.endswith('.html'):
                file_data = {
                    "name": file,
                    "type": "image/png" if file.endswith('.png') else "text/html",
                    "fuzzyPath": fuzzy_path_value,
                    "fuzzyValue": fuzzy_path_value
                }

                if file.endswith('.png'):
                    with open(file_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                        file_data["imgContent"] = encoded_string
                    file_data["path"] = file_path.replace("_plot.png", "_interactive.html")
                else:
                    file_data["path"] = file_path

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

    return jsonify(result)

def get_info_contents(file_contents, keyword, default_value):
    info_contents = {}
    lines = file_contents.split('\n')
    for line in lines:
        if line.startswith(keyword):
            parts = line.split(';')
            if len(parts) >= 3:
                key = parts[2]
                value = parts[3] if len(parts) >= 4 else ''
                info_contents[key] = value.strip()
    return info_contents if info_contents else default_value
"""

#base64 of the FIRST image. 
"""
@app.route('/list-folder-contents/<folder_name>', methods=['POST'])
def list_folder_contents(folder_name):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", folder_name)

    if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
        return jsonify({'error': 'Folder not found'}), 404

    result = {
        "name": 0,
        "UnorderedWaypointMonitor": [],
        "CircularDeviationMonitor": [],
        "CollisionMonitor": [],
        "LandspaceMonitor": [],
        "OrderedWaypointMonitor": [],
        "PointDeviationMonitor": [],
        "MinSepDistMonitor": [],
        "NoFlyZoneMonitor": []
    }

    first_png_found = False

    for root, dirs, files in os.walk(base_directory):
        for file in files:
            file_path = os.path.join(root, file)

            fuzzy_path_value = None
            paths = file_path.split(os.sep)
            if len(paths) > 1:
                fuzzy_path_value = paths[-2]

            fuzzy_value_array = fuzzy_path_value.split("_") if fuzzy_path_value else []

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
                        "fuzzyValue": fuzzy_path_value,
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

            elif file.endswith('.png') or file.endswith('.html'):
                file_data = {
                    "name": file,
                    "type": "image/png" if file.endswith('.png') else "text/html",
                    "fuzzyPath": fuzzy_path_value,
                    "fuzzyValue": fuzzy_path_value
                }

                if file.endswith('.png'):
                    if not first_png_found:
                        with open(file_path, "rb") as image_file:
                            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                            file_data["imgContent"] = encoded_string
                            first_png_found = True
                    else:
                        file_data["imgContent"] = None
                    file_data["path"] = file_path.replace("_plot.png", "_interactive.html")
                else:
                    file_data["path"] = file_path

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

    return jsonify(result)

def get_info_contents(file_contents, keyword, default_value):
    info_contents = {}
    lines = file_contents.split('\n')
    for line in lines:
        if line.startswith(keyword):
            parts = line.split(';')
            if len(parts) >= 3:
                key = parts[2]
                value = parts[3] if len(parts) >= 4 else ''
                info_contents[key] = value.strip()
    return info_contents if info_contents else default_value
"""


""" @app.route('/list-folder-contents/<folder_name>', methods=['GET'])
def list_folder_contents(folder_name):
    base_directory = os.path.join(os.path.expanduser("~"), "Documents", "AirSim", "report", folder_name)

    if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
        return jsonify({'error': 'Folder not found'}), 404

    result = {
        "name": 0,
        "UnorderedWaypointMonitor": [],
        "CircularDeviationMonitor": [],
        "CollisionMonitor": [],
        "LandspaceMonitor": [],
        "OrderedWaypointMonitor": [],
        "PointDeviationMonitor": [],
        "MinSepDistMonitor": [],
        "NoFlyZoneMonitor": []
    }

    for root, dirs, files in os.walk(base_directory):
        for file in files:
            file_path = os.path.join(root, file)

            fuzzy_path_value = None
            paths = file_path.split(os.sep)
            if len(paths) > 1:
                fuzzy_path_value = paths[-2]

            fuzzy_value_array = fuzzy_path_value.split("_") if fuzzy_path_value else []

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
                        "fuzzyValue": fuzzy_path_value,
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

            elif file.endswith('.png') or file.endswith('.html'):
                file_data = {
                    "name": file,
                    "type": "image/png" if file.endswith('.png') else "text/html",
                    "fuzzyPath": fuzzy_path_value,
                    "fuzzyValue": fuzzy_path_value
                }

                if file.endswith('.png'):
                    file_data["imgContent"] = None
                    file_data["path"] = file_path.replace("_plot.png", "_interactive.html")
                else:
                    file_data["path"] = file_path

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

    return jsonify(result)

def get_info_contents(file_contents, keyword, default_value):
    info_contents = {}
    lines = file_contents.split('\n')
    for line in lines:
        if line.startswith(keyword):
            parts = line.split(';')
            if len(parts) >= 3:
                key = parts[2]
                value = parts[3] if len(parts) >= 4 else ''
                info_contents[key] = value.strip()
    return info_contents if info_contents else default_value """

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
    app.run(host='0.0.0.0', port=5500) 
    # makes it discoverable by other devices in the network
