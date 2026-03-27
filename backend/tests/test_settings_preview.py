import json
import os
import sys
import tempfile
import unittest
from unittest import mock


BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from PythonClient.multirotor.control import simulation_task_manager as stm


def build_geo_payload(altitude=203):
    return {
        "Drones": [
            {
                "Name": "Drone1",
                "FlightController": "SimpleFlight",
                "DefaultVehicleState": "Armed",
                "EnableCollisionPassthrogh": False,
                "EnableCollisions": True,
                "AllowAPIAlways": True,
                "EnableTrace": False,
                "X": 41.980381,
                "Y": -87.934524,
                "Z": 5,
                "Pitch": 0,
                "Roll": 0,
                "Yaw": 0,
                "MissionValue": "fly_to_points",
                "Mission": {
                    "name": "fly_to_points",
                    "param": [],
                },
            }
        ],
        "environment": {
            "UseGeo": True,
            "Origin": {
                "Latitude": 41.980381,
                "Longitude": -87.934524,
                "Altitude": altitude,
            },
            "Wind": {
                "Direction": "N",
                "Velocity": 5,
            },
            "TimeOfDay": "10:00:00",
        },
    }


class SimulationSettingsPreviewTests(unittest.TestCase):
    def test_generate_settings_preview_skips_file_writes(self):
        payload = build_geo_payload()

        with tempfile.TemporaryDirectory() as temp_home:
            with mock.patch.dict(os.environ, {"JSON_DEBUG_MODE": "false"}, clear=False):
                with mock.patch.object(stm.os.path, "expanduser", return_value=temp_home):
                    with mock.patch.object(stm.GeoUtil, "get_elevation", return_value=211.0):
                        with mock.patch.object(
                            stm.GeoUtil,
                            "geo_to_cartesian_coordinates_spawn",
                            return_value=(1.0, 2.0, 3.0),
                        ):
                            settings = stm.SimulationTaskManager.generate_settings_preview(payload)

        self.assertEqual(settings["OriginGeopoint"]["Altitude"], 211.0)
        self.assertEqual(settings["Vehicles"]["Drone1"]["X"], 1.0)
        self.assertNotIn("MissionValue", settings["Vehicles"]["Drone1"])
        self.assertFalse(
            os.path.exists(os.path.join(temp_home, "Documents", "AirSim", "settings.json"))
        )
        self.assertFalse(
            os.path.exists(os.path.join(temp_home, "Documents", "AirSim", "cesium.json"))
        )

    def test_debug_mode_preview_matches_written_settings(self):
        payload = build_geo_payload()

        with tempfile.TemporaryDirectory() as temp_project_root:
            with tempfile.TemporaryDirectory() as temp_backend_root:
                with tempfile.TemporaryDirectory() as temp_home:
                    debug_settings_path = os.path.join(temp_backend_root, "settings.json")
                    debug_settings = {
                        "SimMode": "Multirotor",
                        "DebugOverride": True,
                        "Vehicles": {
                            "DebugDrone": {
                                "FlightController": "SimpleFlight",
                                "X": 9,
                                "Y": 8,
                                "Z": 7,
                            }
                        },
                    }
                    with open(debug_settings_path, "w") as debug_file:
                        json.dump(debug_settings, debug_file)

                    with mock.patch.dict(os.environ, {"JSON_DEBUG_MODE": "true"}, clear=False):
                        with mock.patch.object(stm, "PROJECT_ROOT", temp_project_root):
                            with mock.patch.object(stm, "BACKEND_ROOT", temp_backend_root):
                                with mock.patch.object(stm.GeoUtil, "get_elevation", return_value=211.0):
                                    with mock.patch.object(
                                        stm.GeoUtil,
                                        "geo_to_cartesian_coordinates_spawn",
                                        return_value=(1.0, 2.0, 3.0),
                                    ):
                                        preview = stm.SimulationTaskManager.generate_settings_preview(
                                            payload
                                        )
                                with mock.patch.object(
                                    stm.os.path,
                                    "expanduser",
                                    return_value=temp_home,
                                ):
                                    stm.SimulationTaskManager._SimulationTaskManager__save_settings_dot_json(
                                        preview
                                    )

                    written_path = os.path.join(temp_home, "Documents", "AirSim", "settings.json")
                    with open(written_path, "r") as written_file:
                        written_settings = json.load(written_file)

        self.assertTrue(preview["DebugOverride"])
        self.assertEqual(preview["SettingsVersion"], 2.0)
        self.assertEqual(written_settings, preview)

    def test_generate_settings_preview_handles_missing_monitors_and_altitude_fallback(self):
        payload = build_geo_payload(altitude=203)

        with mock.patch.dict(os.environ, {"JSON_DEBUG_MODE": "false"}, clear=False):
            with mock.patch.object(stm.GeoUtil, "get_elevation", return_value=None):
                with mock.patch.object(
                    stm.GeoUtil,
                    "geo_to_cartesian_coordinates_spawn",
                    return_value=(10.0, 20.0, 30.0),
                ):
                    settings = stm.SimulationTaskManager.generate_settings_preview(payload)

        self.assertEqual(settings["OriginGeopoint"]["Altitude"], 203)
        self.assertEqual(settings["Wind"], {"X": 5, "Y": 0, "Z": 0})
        self.assertEqual(settings["Vehicles"]["Drone1"]["Z"], 30.0)


if __name__ == "__main__":
    unittest.main()
