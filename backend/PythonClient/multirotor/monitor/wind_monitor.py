import os
from time import sleep

import requests

from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor


class WindMonitor(SingleDroneMissionMonitor):
    """
    Monitors a drone position and applies wind vectors returned by the WISP service.
    """

    def __init__(self, mission, dt=0.5):
        super().__init__(mission)
        self.dt = dt
        self.est_position_array = []
        self.wind_vector_array = []

    def start(self):
        speed = getattr(self.mission, "speed", "unknown")
        self.append_info_to_log(f"{self.target_drone};speed {speed} m/s, {self.wind_speed_text}")
        self.update()
        self.stop()

    def update(self):
        while self.mission.state != self.mission.State.END:
            try:
                state = self.client.getMultirotorState(vehicle_name=self.target_drone)
                estimated_position = state.kinematics_estimated.position
            except Exception as e:
                print(f"Error reading drone state for wind monitor: {e}")
                sleep(1)
                continue

            x = estimated_position.x_val
            y = estimated_position.y_val
            z = estimated_position.z_val
            self.update_wind(x, y, z)
            sleep(self.dt)

    def stop(self):
        self.append_info_to_log(f"{self.target_drone};task over")
        self.save_report()

    def update_wind(self, x, y, z):
        try:
            json_request = {"x": float(x), "y": float(y), "z": -float(z)}
            host = "wisp_server" if os.environ.get("IN_DOCKER", False) else "localhost"
            response_json = requests.get(f"http://{host}:5001/wind", json=json_request, timeout=1).json()
            wind_vector = [response_json["x"], response_json["y"], -response_json["z"]]

            if all(isinstance(value, (int, float)) for value in wind_vector):
                self.set_wind_speed(wind_vector[0], wind_vector[1], wind_vector[2])
                self.append_info_to_log(f"Drone location: {x}, {y}, {z}")
                self.append_info_to_log(f"Wind set to: {wind_vector[0]}, {wind_vector[1]}, {wind_vector[2]}")
                self.est_position_array.append([x, y, z])
                self.wind_vector_array.append(wind_vector)
                return wind_vector

            print("Wind vector is not numeric")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error getting wind data: {e}")
            return None
