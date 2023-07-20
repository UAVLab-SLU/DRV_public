import threading
import time
from time import sleep

from PythonClient.multirotor.mission.abstract.abstract_mission import GenericMission


# Fly to a point
class FlyStraight(GenericMission):
    def __init__(self, target_drone="Default", destination=None, speed=5, wait_time=2):
        super().__init__(target_drone)
        self.flight_time = None
        if destination is None:
            destination = [50, 0, -10]
        self.report_dir += 'FlyToPoints'
        self.point = destination
        self.target_drone = target_drone
        self.wait_time = wait_time
        self.speed = speed

    def start(self):
        # get current local time
        start_time = time.localtime()

        self.state = "running"
        self.client.armDisarm(True, self.target_drone)
        self.append_info_to_log(self.target_drone + ";taking off")
        # self.takeoff(self.target_drone)
        self.append_info_to_log(self.target_drone + ";heading: " + str(self.point))
        self.async_fly_to_position(self.target_drone, self.point, self.speed)
        end_time = time.localtime()
        # get total flight time in seconds
        self.flight_time_in_seconds = round(time.mktime(end_time) - time.mktime(start_time), 2)
        self.append_info_to_log(self.target_drone + ";task over")
        sleep(self.wait_time)
        self.state = self.State.END
        self.save_report()


if __name__ == "__main__":
    mission = FlyStraight()
    thread = threading.Thread(target=mission.start)
    thread.start()
