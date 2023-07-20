# This script is to run the S-shaped path with drift monitor and wind controller.
# also, it will save the plan path, actual path and path wind vector to csv files.

import time
from PythonClient import airsim
from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.monitor.drift_monitor import DriftMonitor
from PythonClient.multirotor.wind_control.airsim_wind_controller import AirSimWindController
import threading
import os

wind_vector_list = []
actual_position = []

# for block env
# plan_positions = [
#     [0, 0, -10],
#     [0, -80, -10],
#     [55, -80, -10],
#     [55, -45, -10],
#     [100, -45, -10],
#     [100, -26, -10],
#     [55, -26, -10],
#     [55, 35, -10],
#     [0, 35, -10],
#     [0, 0, -10]
# ]
# for 3 buildings env
# plan_positions = [
#     [0, 0, -10],
#     [13, 0, -10],
#     [13, 85, -10]]

# 3 buildings env long path
# plan_positions = [
#     [0, 0, -10],
#     [-13, 0, -10],
#     [-13, 85, -10],
#     [13, 85, -10],
#     [13, 0, -10]]

# 3 buildings env long against wind, alternative start [15, 0, 0]
# plan_positions = [
#     [0, 0, -10],
#     [0, 85, -10],
#     [-13, 85, -10]
# ]


# for 3 buildings env through the middle
# plan_positions = [
#     [0, 0, -10],
#     [-13, 0, -10],
#     [-13, 30, -10],
#     [13, 30, -10],
#     [13, 85, -10]]


# chicago around tall building
# plan_positions = [
#     [0, 84, -40],
#     [97, 84, -40],
#     [97, -88, -40],
#     [0, -88, -40]]

# chicago alternative start [-60, 85, 0], long route
# plan_positions = [
#     [0, 0, -60],
#     [60, 0, -60],
#     [60, -85, -60],
#     [60, -160, -60],
#     [122, -160, -60],
#     [122, -85, -60]
# ]

# # two buildings takeoff
# plan_positions = [
#     [-1, 0, -16]]


# house roof inspection
plan_positions = [
    [0, 0, -11],
    [3, -11, -11],
    [13, -11, -18],
    [20, -11, -11],
    [20, 12, -11],
    [13, 12, -18],
    [3, 12, -11]
]

# alternative plan for chicago around tall building
# plan_positions = [
#     [0, 0, -40],
#     [0, 85, -40],
#     [100, 85, -40],
#     [60, -88, -40]]

# for chicago env
# plan_positions = [
#     [0, 0, -10],
#     [60, 0, -50],
#     [60, -88, -60],
#     [0, -88, -70]]

# for chicago straight takeoff
# plan_positions = [
#     [0, 0, -10],
#     [0, 0, -80]
# ]


prev_wind = [0, 0, 0]
uav_speed = 4
wind_speed = 10
airsim_wind_vector = [10, -10, 0]
z_offset = 0.3  # due to the height of the drone must be slightly higher than the ground to spawn in UE environment
init_sec = 0
dt = .5  # 1 second
# start_offset = [-60, 85, 0]
start_offset = [0, 0, 0]
# start_offset = [15, 0, 0]  ## tall building turbulent experiment
mission_name = "house_"
report_dir = time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime()) + "_" + mission_name
do_report = True


def set_up_dir(dir_name):
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)


def write_points_to_csv(dir_name, filename, points):
    with open(dir_name + os.sep + filename, "w") as f:
        for p in points:
            f.write(str(p[0]) + "," + str(p[1]) + "," + str(p[2]) + "\n")


def run_sim(wind_type):
    global prev_wind
    mission = FlyToPoints(target_drone="Drone 1", speed=uav_speed, points=plan_positions)
    monitor = DriftMonitor(mission, threshold=1, dt=dt)
    location_client = airsim.MultirotorClient()
    mission_thread = threading.Thread(target=mission.start)
    monitor_thread = threading.Thread(target=monitor.start)
    mission_thread.start()
    monitor_thread.start()
    total_query = 0
    miss_count = 0
    if wind_type == "AIRSIM":
        wind_controller.set_wind(airsim_wind_vector)
    if wind_type == "NO_WIND":
        wind_controller.set_wind([0, 0, 0])

    time_step = 1
    while mission.state != mission.State.END:
        start = time.time()
        if time_step > 50:
            time_step = 50
        location_raw = location_client.getMultirotorState(
            vehicle_name=mission.target_drone).kinematics_estimated.position
        abs_location = [location_raw.x_val + start_offset[0], location_raw.y_val + start_offset[1],
                        location_raw.z_val + start_offset[2]]
        actual_position.append([abs_location[0], abs_location[1], abs_location[2]])
        if abs_location[2] > 0:
            abs_location[2] = 0
            # due to the height of the drone must be slightly higher than the ground to spawn in UE environment
            # just set the z value to 0(ground level) if it is below 0

        if wind_type == "CFD" or wind_type == "CONTINUOUS_CFD":
            if wind_type == "CFD":
                wind_vector = wind_controller.update_wind_using_openfoam_data(
                    [
                        abs_location[0],
                        abs_location[1],
                        abs_location[2]
                    ]
                )
            else:
                # CONTINUOUS_CFD
                wind_vector = wind_controller.continuous_update_wind_using_openfoam_data([
                    abs_location[0],
                    abs_location[1],
                    abs_location[2]
                ])
            if wind_vector is not None:
                wind_vector_list.append(wind_vector)
                prev_wind = wind_vector
            else:
                print("point missing in CFD data, using previous wind vector")
                miss_count += 1
                wind_vector_list.append(prev_wind)
            total_query += 1
            time_step += 1
            end = time.time()
            sleep_time = dt - (end - start)
            if sleep_time > 0:
                time.sleep(sleep_time)
            else:
                print("Wind controller is running too slow, should be faster than ", dt, "s", "but it is ",
                      end - start, "s")

    if wind_type == "CFD" or wind_type == "CONTINUOUS_CFD":
        print("Wind controller missed rate: ", miss_count / total_query)
    print("Resetting the drone...")
    location_client.reset()
    print("Reset completed")
    time.sleep(1)


def make_report(wid_type):
    if not do_report:
        return
    dir_name = "report" + os.sep + report_dir + str(
        wind_speed) \
               + "_ds" + str(uav_speed) \
               + "_" + wid_type
    set_up_dir(dir_name)

    for i in range(len(plan_positions)):
        plan_positions[i][0] += start_offset[0]
        plan_positions[i][1] += start_offset[1]
        plan_positions[i][2] += start_offset[2]
    plan_positions.insert(0, start_offset)
    write_points_to_csv(dir_name, "plan_path.csv", plan_positions)

    print("Actual path list length: ", len(actual_position))
    write_points_to_csv(dir_name, "actual_path.csv", actual_position)

    print("Wind vector list length: ", len(wind_vector_list))
    write_points_to_csv(dir_name, "path_wind_vector.csv", wind_vector_list)
    actual_position.clear()
    wind_vector_list.clear()


def run_experiment(wind_type):
    try:
        run_sim(wind_type)
    except KeyboardInterrupt:
        print("Keyboard interrupt detected!")
        print(wind_type, "Mission stopped")

    finally:
        print(wind_type, "report is generating...")
        make_report(wind_type)
    print(wind_type, "Mission completed")


if __name__ == "__main__":
    csv_root_path = "foam_data/block/house"
    csv_file_name = str(wind_speed) + "ms_" + str(init_sec) + ".csv"
    wind_controller = AirSimWindController(openfoam_data_root=csv_root_path, reader="csv", filename=csv_file_name)

    # run_experiment("NO_WIND")
    #run_experiment("AIRSIM")
    # run_experiment("CFD")
    run_experiment("CONTINUOUS_CFD")
