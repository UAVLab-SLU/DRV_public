import os
import pickle
from copy import copy

from matplotlib import pyplot as plt

from PythonClient import airsim
from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.monitor.point_deviation_monitor import PointDeviationMonitor
import threading


def fuzzy_test_wind():
    mission = FlyToPoints(target_drone="Drone 1", speed=3, points=planed_position_list)
    mission.set_wind_speed(0, wind_speed, 0)

    monitor = PointDeviationMonitor(mission)
    mission_thread = threading.Thread(target=mission.start)
    monitor_thread = threading.Thread(target=monitor.start)
    mission_thread.start()
    monitor_thread.start()
    mission_thread.join()
    monitor_thread.join()
    # deep copy the array
    actual_position_list = copy(monitor.est_position_array)

    all_position_array.append(actual_position_list)


def graph(wind_speed_array, all_position_array):
    fig_x = plt.figure()
    fig_y = plt.figure()
    fig_z = plt.figure()

    # enumerate all the position array
    for cur_wind_speed, actual_position_list in zip(wind_speed_array, all_position_array):
        x2 = [point[0] for point in actual_position_list]
        y2 = [point[1] for point in actual_position_list]
        z2 = [-point[2] for point in actual_position_list]

        # plot x values
        plt.figure(fig_x.number)
        plt.plot(x2, label=f"(Actual) wind speed: {cur_wind_speed} m/s")
        plt.xlabel('Index')
        plt.ylabel('X axis')
        plt.legend()

        # plot y values
        plt.figure(fig_y.number)
        plt.plot(y2, label=f"(Actual) wind speed: {cur_wind_speed} m/s")
        plt.xlabel('Index')
        plt.ylabel('Y axis')
        plt.legend()

        # plot z values
        plt.figure(fig_z.number)
        plt.plot(z2, label=f"(Actual) wind speed: {cur_wind_speed} m/s")
        plt.xlabel('Index')
        plt.ylabel('Z axis')
        plt.legend()

    plt.show()


wind_speed_array = [0, 7, 14, 21]
if os.path.isfile('drone6.pkl'):
    all_position_array = pickle.load(open('drone6.pkl', 'rb'))
else:
    all_position_array = []


    planed_position_list = [(0, 0, -8), (8, 0, -8), (8, 8, -8), (-8, 8, -8), (-8, -8, -8), (8, -8, -8), (8, 0, -8),
                            (0, 0, -8)]

    x1 = [point[0] for point in planed_position_list]
    y1 = [point[1] for point in planed_position_list]
    z1 = [-point[2] for point in planed_position_list]

    for wind_speed in wind_speed_array:
        print(f"Testing wind speed: {wind_speed} m/s")
        fuzzy_test_wind()
        # reset the simulation
        airsim.MultirotorClient().reset()
graph(wind_speed_array, all_position_array)


pickle.dump(all_position_array, open('drone6.pkl', 'wb'))
