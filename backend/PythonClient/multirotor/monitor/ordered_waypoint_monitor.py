from time import sleep

from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor


class OrderedWaypointMonitor(SingleDroneMissionMonitor):
    def __init__(self, mission, deviation_threshold=1):
        super().__init__(mission)
        self.queue = None
        self.deviation_threshold = deviation_threshold
        self.target_drone = mission.target_drone

    def start(self):
        if type(self.mission).__name__ not in self.polygon_mission_names:
            # print("Mission:", type(self.mission).__name__, "is not compatible with OrderedWaypointMonitor")
            return
        self.queue = self.mission.points.copy()
        self.append_info_to_log(self.target_drone + ";OrderedWaypointMonitor started")
        self.update_queue()
        self.stop()

    def update_queue(self):
        dt = 0.1
        while self.mission.state != self.mission.State.END:
            position = self.client.getMultirotorState(vehicle_name=self.target_drone).kinematics_estimated.position
            cur = (position.x_val, position.y_val, position.z_val)
            if (self.get_distance_btw_points(cur, self.queue[0])) <= self.deviation_threshold:
                self.append_info_to_log(self.target_drone + ";reached " + str(self.queue[0]) + " within " + str(
                    self.deviation_threshold) + " meters")
                self.queue.pop(0)
            if not self.queue:
                break
            sleep(dt)

    def stop(self):
        if not self.queue:
            self.append_pass_to_log(self.target_drone + ";All points reached in order by ")
        else:
            self.append_fail_to_log(
                self.target_drone + ";has some points not reached in given order:" + str(self.queue))
        self.save_report()
