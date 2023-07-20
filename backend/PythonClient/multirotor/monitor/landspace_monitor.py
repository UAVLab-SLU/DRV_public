# sUAS shall only land at their home coordinates or another predefined landing space.
from time import sleep

from PythonClient import airsim
from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor
from PythonClient.multirotor.util.geo.geo_util import GeoUtil


class LandspaceMonitor(SingleDroneMissionMonitor):

    def __init__(self, mission, other_landing_space_geo=None):
        super().__init__(mission)
        if other_landing_space_geo is None:
            other_landing_space_geo = []  # [[lat, long], [lat, long], ...]
        self.landing_threshold = 5  # meters
        self.landing_space_cartesian = []  # [[x, y], [x, y], ...]
        position = self.client.simGetObjectPose(self.target_drone).position
        init_position = [position.x_val, position.y_val]
        self.landing_space_cartesian.append(init_position)  # add initial position as landing space
        if len(other_landing_space_geo) > 0:
            other_landing_space_cartesian = []
            for space in other_landing_space_geo:
                other_landing_space_cartesian.append(GeoUtil.geo_to_cartesian_coordinates(space[0], space[1], 0,
                                                                                          self.cesium_origin))
            # print("Debug: LandspaceMonitor: other_landing_space_geo = ", other_landing_space_cartesian)
            self.append_info_to_log(f"{self.target_drone};"
                                    f"Landing space geolocation: {other_landing_space_geo}")
            self.append_info_to_log(f"{self.target_drone};"
                                    f"Landing space cartesian location: {other_landing_space_cartesian}")
            self.landing_space_cartesian.extend(other_landing_space_cartesian)

    def start(self):
        self.append_info_to_log(self.target_drone + ";Landspace monitor started")
        self.monitor_land_space()
        self.save_report()

    def monitor_land_space(self):
        violation = False
        while self.mission.state == self.mission.State.IDLE:
            # ignore landing space violation during idle
            pass
        while self.mission.state != self.mission.State.END:
            drone_object = self.client.simGetObjectPose(self.target_drone)
            landed_state = self.client.getMultirotorState(self.target_drone).landed_state
            if landed_state == airsim.LandedState.Landed:
                x = drone_object.position.x_val
                y = drone_object.position.y_val
                z = drone_object.position.z_val
                land_within_space = False
                for space in self.landing_space_cartesian:
                    if (abs(x - space[0]) <= self.landing_threshold and
                            abs(y - space[1]) <= self.landing_threshold):
                        self.append_pass_to_log(f"{self.target_drone};landed within designated landing space. "
                                                f"Drone abs position: [x={round(x, 2)}, y={round(y, 2)}, z={round(z, 2)}] meters")
                        land_within_space = True
                        break
                if not land_within_space:
                    self.append_fail_to_log(f"{self.target_drone};landed outside designated landing space. "
                                            f"Drone abs position: [x={round(x, 2)}, y={round(y, 2)}, z={round(z, 2)}] meters")
                    violation = True
            sleep(1)
        if not violation:
            self.append_pass_to_log(f"{self.target_drone};No landing violations detected")
