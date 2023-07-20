import os
import pickle
from copy import copy

from matplotlib import pyplot as plt

from PythonClient import airsim
from PythonClient.multirotor.mission.fly_in_circle import FlyInCircle
from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.monitor.circular_deviation_monitor import CircularDeviationMonitor
from PythonClient.multirotor.monitor.point_deviation_monitor import PointDeviationMonitor
import threading


def run_threads(mission, monitor):
    mission_thread = threading.Thread(target=mission.start)
    monitor_thread = threading.Thread(target=monitor.start)
    mission_thread.start()
    monitor_thread.start()
    mission_thread.join()
    monitor_thread.join()


def fuzzy_test_gps_frequency():
    airsim.MultirotorClient().reset()
    mission = FlyInCircle(target_drone="Drone 1", speed=drone_speed, radius=10, altitude=20, iterations=1, center=(1, 0))
    mission.set_wind_speed(0, 5, 0)
    monitor = CircularDeviationMonitor(mission, 0)
    monitor.dt = 1 / hz
    run_threads(mission, monitor)
    print(f"GPS frequency: {hz} hz, Total flight time: {mission.flight_time_in_seconds} s")
    print(f"GPS frequency: {hz} hz, Optimal distance: {monitor.optimal_distance} m")
    print(f"GPS frequency: {hz} hz, Actual distance: {monitor.actual_distance} m")
    actual_position_list = copy(monitor.est_position_array)
    all_position_array.append(actual_position_list)


def graph(gps_hz, all_position_array):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    for cur_gps_hz, actual_position_list in zip(gps_hz, all_position_array):
        x2 = [point[0] for point in actual_position_list]
        y2 = [point[1] for point in actual_position_list]
        z2 = [-point[2] for point in actual_position_list]
        ax.plot(x2, y2, z2, label=f"(Actual) gps frequency: {cur_gps_hz} hz")

    ax.set_title('GPS Frequency Fuzzy Test\nDrone Speed: 4 m/s\nWind Speed: 5 m/s East(+Y)')
    ax.set_xlabel('X axis')
    ax.set_ylabel('Y axis')
    ax.set_zlabel('Z axis')
    ax.legend()
    plt.show()


drone_speed = 4
gps_hz = [5, 15, 45]
if os.path.isfile('gps.pkl'):
    all_position_array = pickle.load(open('gps.pkl', 'rb'))
else:
    all_position_array = []
    for hz in gps_hz:
        print(f"Testing gps frequency: {hz} hz")
        fuzzy_test_gps_frequency()
        # reset the simulation


graph(gps_hz, all_position_array)

pickle.dump(all_position_array, open('gps.pkl', 'wb'))
