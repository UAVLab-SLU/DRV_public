"""Flight command regression tests; no simulator or RPC connection required."""
import importlib
import math
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Keep the real AirSim types and quaternion utilities, even without RPC installed.
try:
    import msgpackrpc
except ModuleNotFoundError:
    sys.modules["msgpackrpc"] = types.ModuleType("msgpackrpc")
    try:
        from PythonClient import airsim
    finally:
        del sys.modules["msgpackrpc"]
else:
    from PythonClient import airsim

# Mission construction and report upload are mocked, so cloud SDKs are unnecessary.
storage_key = "PythonClient.multirotor.storage.storage_config"
storage_stub = types.ModuleType(storage_key)
storage_stub.get_storage_service = Mock(side_effect=AssertionError("Unexpected storage access"))
original_storage = sys.modules.get(storage_key)
sys.modules[storage_key] = storage_stub
try:
    from PythonClient.multirotor.mission.abstract.abstract_mission import GenericMission
finally:
    if original_storage is None:
        del sys.modules[storage_key]
    else:
        sys.modules[storage_key] = original_storage


class MissionPresetTests(unittest.TestCase):
    def setUp(self):
        recorder_patch = patch("PythonClient.multirotor.mission.abstract.scripted_mission.MissionRecorder")
        self.recorder = recorder_patch.start().return_value
        self.addCleanup(recorder_patch.stop)
        self.recorder.error = None
        self.recorder.path.read_bytes.return_value = b"video bytes"

    def make_mission(self, name, yaw=0):
        module = importlib.import_module("PythonClient.multirotor.mission." + name)
        mission_class = getattr(module, name.title().replace("_", ""))
        with patch.object(GenericMission, "__init__", return_value=None):
            mission = mission_class("Drone1")
        mission.target_drone = "Drone1"
        mission.client = Mock()
        mission.client.getMultirotorState.return_value.kinematics_estimated.orientation = (
            airsim.euler_to_quaternion(0, 0, math.radians(yaw))
        )
        mission.append_info_to_log = Mock()
        mission.append_fail_to_log = Mock()
        mission.save_report = Mock()
        mission.log_subdir = "batch-123"
        mission.save_report_to_storage = Mock()
        return mission

    def test_river_route_yaw_and_speed(self):
        mission = self.make_mission("river_search_and_rescue")
        mission.start()
        moves = mission.client.moveToPositionAsync.call_args_list
        self.assertEqual([c.args for c in moves], [
            (0, 0, -60, 4), (0, -362, -60, 4), (276, -362, -60, 2),
        ])
        self.assertEqual([c.kwargs["yaw_mode"].yaw_or_rate for c in moves], [0, -90, -100])
        self.assertEqual([c.args[0] for c in mission.client.rotateToYawAsync.call_args_list], [-90, -100])
        self.assertEqual([c[0] for c in mission.client.method_calls], [
            "armDisarm", "getMultirotorState", "moveToPositionAsync", "rotateToYawAsync",
            "moveToPositionAsync", "simSetCameraPose", "rotateToYawAsync", "moveToPositionAsync", "hoverAsync",
        ])
        camera = mission.client.simSetCameraPose.call_args.args[1]
        self.assertAlmostEqual(airsim.quaternion_to_euler_angles(camera.orientation)[1], -math.pi / 2)
        self.assertEqual(mission.state, mission.State.END)
        self.recorder.stop.assert_called_once()
        mission.save_report_to_storage.assert_called_once()
        mission.save_report.assert_called_once()

    def test_surveillance_heading_camera_and_dwell(self):
        mission = self.make_mission("active_shooter_surveillance", yaw=23)
        with patch.object(mission._cancelled, "wait", return_value=False) as wait:
            mission.start()
        wait.assert_called_once_with(30)
        moves = mission.client.moveToPositionAsync.call_args_list
        self.assertEqual([c.args for c in moves], [(0, 0, -100, 4), (-140, 0, -100, 4)])
        for command in moves:
            self.assertAlmostEqual(command.kwargs["yaw_mode"].yaw_or_rate, 23)
            self.assertEqual(command.kwargs["drivetrain"], airsim.DrivetrainType.MaxDegreeOfFreedom)
        cameras = mission.client.simSetCameraPose.call_args_list
        self.assertEqual([c.args[0] for c in cameras], ["0", "0"])
        for command, pitch in zip(cameras, [0, -45]):
            self.assertAlmostEqual(math.degrees(airsim.quaternion_to_euler_angles(command.args[1].orientation)[1]), pitch)
        mission.client.rotateToYawAsync.assert_not_called()

    def test_all_presets_record_before_flight_and_save_after_stop(self):
        for name in ("river_search_and_rescue", "active_shooter_surveillance", "missing_person_search_and_rescue"):
            with self.subTest(name=name):
                mission = self.make_mission(name)
                events = []
                self.recorder.start.side_effect = lambda: events.append("record")
                mission.client.armDisarm.side_effect = lambda *args: events.append("arm")
                self.recorder.stop.side_effect = lambda: events.append("stop")
                mission.save_report_to_storage.side_effect = lambda *args: events.append("upload")
                mission.save_report.side_effect = lambda: events.append("report")
                with patch.object(mission._cancelled, "wait", return_value=False):
                    mission.start()
                self.assertEqual(events, ["record", "arm", "stop", "upload", "report"])
                cls = mission.__class__.__name__
                mission.save_report_to_storage.assert_called_once_with(
                    f"batch-123/{cls}/{cls}_Drone1_recording.mp4", b"video bytes", "video/mp4")

    def test_upload_failure_keeps_recording_and_saves_report(self):
        mission = self.make_mission("river_search_and_rescue")
        mission.save_report_to_storage.side_effect = RuntimeError("storage offline")
        mission.start()
        self.recorder.cleanup.assert_not_called()
        mission.save_report.assert_called_once()
        self.assertIn("storage offline", mission.append_fail_to_log.call_args.args[0])

    def test_recording_start_failure_prevents_flight(self):
        mission = self.make_mission("river_search_and_rescue")
        self.recorder.start.side_effect = RuntimeError("camera offline")
        with self.assertRaisesRegex(RuntimeError, "camera offline"):
            mission.start()
        mission.client.armDisarm.assert_not_called()
        self.recorder.stop.assert_called_once()
        mission.save_report.assert_called_once()


    def test_real_mp4_encoding_with_mock_camera(self):
        import cv2
        import numpy as np
        from PythonClient.multirotor.mission.abstract.mission_recorder import MissionRecorder

        encoded, png = cv2.imencode(".png", np.zeros((48, 64, 3), dtype=np.uint8))
        self.assertTrue(encoded)
        with tempfile.TemporaryDirectory() as directory:
            with patch("PythonClient.multirotor.mission.abstract.mission_recorder.tempfile.mkdtemp",
                       return_value=directory), patch.object(airsim, "MultirotorClient") as client:
                client.return_value.simGetImage.return_value = png.tobytes()
                recorder = MissionRecorder("Drone1", "0")
                recorder.start()
                recorder.stop()
                self.assertIsNone(recorder.error)
                video = cv2.VideoCapture(str(recorder.path))
                try:
                    ok, frame = video.read()
                    self.assertTrue(ok)
                    self.assertEqual(frame.shape[:2], (48, 64))
                finally:
                    video.release()
                client.return_value.simGetImage.assert_called_with("0", airsim.ImageType.Scene, vehicle_name="Drone1")

    def test_missing_person_circle_is_one_closed_revolution(self):
        mission = self.make_mission("missing_person_search_and_rescue")
        mission.start()
        self.assertEqual([c.args for c in mission.client.moveToPositionAsync.call_args_list],
                         [(0, 0, -100, 4), (100, 600, -100, 4)])
        camera = mission.client.simSetCameraPose.call_args.args[1]
        self.assertAlmostEqual(airsim.quaternion_to_euler_angles(camera.orientation)[1], -math.pi / 2)
        path, speed = mission.client.moveOnPathAsync.call_args.args
        self.assertEqual(speed, 2)
        self.assertEqual(len(path), 73)
        for point in path:
            self.assertAlmostEqual(math.hypot(point.x_val - 105, point.y_val - 600), 5)
            self.assertEqual(point.z_val, -100)
        self.assertEqual((path[0].x_val, path[0].y_val), (100, 600))
        self.assertAlmostEqual(path[-1].x_val, 100)
        self.assertAlmostEqual(path[-1].y_val, 600)
        angles = [math.atan2(p.y_val - 600, 105 - p.x_val) for p in path]
        sweep = sum((b - a) % (2 * math.pi) for a, b in zip(angles, angles[1:]))
        self.assertAlmostEqual(sweep, 2 * math.pi)

    def test_cancel_prevents_later_commands(self):
        mission = self.make_mission("river_search_and_rescue")
        mission.client.moveToPositionAsync.return_value.join.side_effect = mission.kill_mission
        mission.start()
        mission.client.moveToPositionAsync.assert_called_once()
        mission.client.rotateToYawAsync.assert_not_called()
        mission.client.hoverAsync.assert_not_called()
        self.assertTrue(mission._cancelled.is_set())
        self.assertEqual(mission.state, mission.State.END)
        self.recorder.stop.assert_called_once()
        mission.save_report_to_storage.assert_called_once()

    def test_failure_ends_and_reports_without_continuing(self):
        mission = self.make_mission("river_search_and_rescue")
        mission.client.moveToPositionAsync.side_effect = RuntimeError("RPC failure")
        with self.assertRaisesRegex(RuntimeError, "RPC failure"):
            mission.start()
        self.assertEqual(mission.state, mission.State.END)
        mission.append_fail_to_log.assert_called_once()
        mission.save_report.assert_called_once()
        mission.client.rotateToYawAsync.assert_not_called()
        self.recorder.stop.assert_called_once()
        mission.save_report_to_storage.assert_called_once()


if __name__ == "__main__":
    unittest.main()
