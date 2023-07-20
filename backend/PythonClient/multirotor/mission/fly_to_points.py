import threading

from PythonClient.multirotor.mission.abstract.abstract_mission import GenericMission


class FlyToPoints(GenericMission):
    def __init__(self, target_drone="Default", speed=4, points=None):
        super().__init__(target_drone)
        self.report_dir += 'FlyToPoints'
        if points is None:
            self.points = [
                [0, 0, -20],
                [20, 0, -20],
                [20, 20, -20],
                [0, 20, -20],
                [0, 0, -20]
            ]
            # Default path, form a square shape and return to origin
        else:
            self.points = points

        self.target_drone = target_drone
        self.speed = speed

    def start(self):
        self.state = self.State.RUNNING
        self.fly(self.points)
        self.append_info_to_log(self.target_drone + ";task over")
        self.stop()

    def fly(self, cartesian_points):
        self.client.armDisarm(True, self.target_drone)
        self.append_info_to_log(self.target_drone + ";taking off")
        # self.takeoff(self.target_drone)
        for p in cartesian_points:
            self.append_info_to_log(self.target_drone + ";heading: " + str(p))
            self.async_fly_to_position(self.target_drone, p, self.speed)

    def stop(self):
        self.state = self.State.END
        self.save_report()



if __name__ == "__main__":
    mission = FlyToPoints()
    thread = threading.Thread(target=mission.start)
    thread.start()
