"""Sequential presets in local meters, with positive heights above home."""
import math
import threading
import time

from PythonClient import airsim
from PythonClient.multirotor.mission.abstract.abstract_mission import GenericMission
from PythonClient.multirotor.mission.abstract.mission_recorder import MissionRecorder


class ScriptedMission(GenericMission):
    def __init__(self, target_drone="Default", speed=4, camera_name="0"):
        super().__init__(target_drone)
        self.speed = speed
        self.camera_name = camera_name
        self._cancelled = threading.Event()
        self.yaw = 0

    def move(self, x, y, height, speed=None):
        self.client.moveToPositionAsync(
            x, y, -height, self.speed if speed is None else speed,
            drivetrain=airsim.DrivetrainType.MaxDegreeOfFreedom,
            yaw_mode=airsim.YawMode(False, self.yaw),
            vehicle_name=self.target_drone,
        ).join()

    def turn_counterclockwise(self, degrees):
        self.yaw = (self.yaw - degrees + 180) % 360 - 180
        self.client.rotateToYawAsync(
            self.yaw, margin=1, vehicle_name=self.target_drone
        ).join()

    def camera_down(self, degrees):
        self.client.simSetCameraPose(
            self.camera_name,
            airsim.Pose(airsim.Vector3r(), airsim.euler_to_quaternion(0, -math.radians(degrees), 0)),
            vehicle_name=self.target_drone,
        )

    def hover(self):
        self.client.hoverAsync(vehicle_name=self.target_drone).join()

    def steps(self):
        raise NotImplementedError

    def start(self):
        if self._cancelled.is_set():
            return
        self.state = self.State.RUNNING
        started = time.monotonic()
        recorder = MissionRecorder(self.target_drone, self.camera_name)
        try:
            recorder.start()
            self.client.armDisarm(True, self.target_drone)
            orientation = self.client.getMultirotorState(
                vehicle_name=self.target_drone
            ).kinematics_estimated.orientation
            self.yaw = math.degrees(airsim.quaternion_to_euler_angles(orientation)[2])
            for description, action in self.steps():
                if self._cancelled.is_set():
                    break
                self.append_info_to_log(self.target_drone + ";" + description)
                action()
            if not self._cancelled.is_set():
                self.hover()
                self.append_info_to_log(self.target_drone + ";task over")
        except Exception as error:
            self.append_fail_to_log(self.target_drone + ";mission failed: " + str(error))
            raise
        finally:
            self.flight_time_in_seconds = time.monotonic() - started
            self.state = self.State.END
            try:
                recorder.stop()
                if recorder.error:
                    self.append_fail_to_log(self.target_drone + ";recording failed: " + str(recorder.error))
                if recorder.path.exists():
                    name = self.__class__.__name__
                    destination = f"{self.log_subdir}/{name}/{name}_{self.target_drone}_recording.mp4"
                    self.save_report_to_storage(destination, recorder.path.read_bytes(), "video/mp4")
                    self.append_info_to_log(self.target_drone + ";recording saved: " + destination)
                recorder.cleanup()
            except Exception as error:
                self.append_fail_to_log(
                    self.target_drone + ";recording save failed: " + str(error)
                    + ";local recording: " + str(recorder.path)
                )
            finally:
                self.save_report()

    def kill_mission(self):
        self._cancelled.set()
        super().kill_mission()
