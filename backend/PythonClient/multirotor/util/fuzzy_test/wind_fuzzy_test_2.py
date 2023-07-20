import os
import pickle
from copy import copy
from time import sleep

import numpy as np
from matplotlib import pyplot as plt

from PythonClient import airsim
from PythonClient.multirotor.mission.fly_in_circle import FlyInCircle
from PythonClient.multirotor.mission.fly_straight import FlyStraight
from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.monitor.circular_deviation_monitor import CircularDeviationMonitor
from PythonClient.multirotor.monitor.drift_monitor import DriftMonitor
from PythonClient.multirotor.monitor.point_deviation_monitor import PointDeviationMonitor
import threading

line_styles = ['solid', 'dashed', 'dotted']

def fuzzy_test_wind():
    mission = FlyInCircle(target_drone="Drone1", speed=drone_speed, radius=8, altitude=8, iterations=1, center=(1, 0))
    #mission = FlyStraight(target_drone="Drone 1", destination=(8, 0, -8), speed=drone_speed, wait_time=0)
    mission.set_wind_speed(0, wind_speed, 0)

    #monitor = DriftMonitor(mission,0)
    monitor = CircularDeviationMonitor(mission, 0)
    run_threads(mission, monitor)
    # deep copy the array
    print(f"Wind: {wind_speed} m/s, Total flight time: {mission.flight_time_in_seconds} s")
    print(f"Wind: {wind_speed} m/s, Optimal distance: {monitor.optimal_distance} m")
    print(f"Wind: {wind_speed} m/s, Actual distance: {monitor.actual_distance} m")
    actual_position_list = copy(monitor.est_position_array)

    all_position_array.append(actual_position_list)


def run_threads(mission, monitor):
    mission_thread = threading.Thread(target=mission.start)
    monitor_thread = threading.Thread(target=monitor.start)
    mission_thread.start()
    monitor_thread.start()
    mission_thread.join()
    monitor_thread.join()


def graph(wind_speed_array, all_position_array, planed_position_list):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    # enumerate all the position array
    for cur_wind_speed, actual_position_list in zip(wind_speed_array, all_position_array):
        cur_line = line_styles.pop(0)
        x2 = [point[0] for point in actual_position_list]
        y2 = [point[1] for point in actual_position_list]
        z2 = [-point[2] for point in actual_position_list]
        # make the line in dotted style
        ax.plot(x2, y2, z2, linestyle=cur_line, label=f"(Actual) wind speed: {cur_wind_speed} m/s")

    # set title
    ax.set_title(f"Drone speed = {drone_speed} m/s\nWind speed = {wind_speed_array} m/s, East(+Y) direction")
    # set axis labels
    ax.set_xlabel('North (+X) axis')
    ax.set_ylabel('East (+Y) axis')
    ax.set_zlabel('Height (+Z) axis')
    ax.set_box_aspect([1, 1, 1])
    ax.legend()
    plt.show()


drone_speed = 6
wind_speed_array = [0, 10, 18]
planed_position_list = [(0, 0, 0), (8, 8, -8)]
if os.path.isfile('position.pkl'):
    all_position_array = pickle.load(open('position.pkl', 'rb'))
else:
    all_position_array = []

    for wind_speed in wind_speed_array:
        print(f"Testing wind speed: {wind_speed} m/s")
        fuzzy_test_wind()
        # reset the simulation
        sleep(2)
        airsim.MultirotorClient().reset()
graph(wind_speed_array, all_position_array, planed_position_list)

pickle.dump(all_position_array, open('position.pkl', 'wb'))
