import math

from PythonClient import airsim
from PythonClient.multirotor.mission.abstract.scripted_mission import ScriptedMission


class MissingPersonSearchAndRescue(ScriptedMission):
    def circle(self):
        # Start on the perimeter at (10, 60), centered at (10.5, 60).
        path = [
            airsim.Vector3r(10.5 - 0.5 * math.cos(2 * math.pi * i / 72),
                            60 + 0.5 * math.sin(2 * math.pi * i / 72), -10)
            for i in range(73)
        ]
        self.client.moveOnPathAsync(
            path, 2, drivetrain=airsim.DrivetrainType.MaxDegreeOfFreedom,
            yaw_mode=airsim.YawMode(False, self.yaw), lookahead=1,
            adaptive_lookahead=0, vehicle_name=self.target_drone,
        ).join()

    def steps(self):
        yield "climb to 10 m", lambda: self.move(0, 0, 10)
        yield "move to search area", lambda: self.move(10, 60, 10)
        yield "camera down 90 degrees", lambda: self.camera_down(90)
        yield "one revolution with 0.5 m radius", self.circle
