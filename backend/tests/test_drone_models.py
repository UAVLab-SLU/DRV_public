import ast
import copy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from PythonClient.multirotor.control.drone_models import apply_drone_model


class DroneModelTests(unittest.TestCase):
    def test_default_clears_stale_pawn(self):
        settings = {}
        vehicle = {"PawnPath": "obsolete"}
        apply_drone_model(settings, vehicle)
        self.assertEqual(vehicle["PawnPath"], "")
        self.assertEqual(vehicle["VehicleType"], "SimpleFlight")
        self.assertNotIn("PawnPaths", settings)

    def test_unsupported_models_rejected(self):
        for model in ("AirSimGPS", "AureliaGPS", "DJI", "ParrotANAFI"):
            with self.subTest(model=model), self.assertRaises(ValueError):
                apply_drone_model({}, {"droneModel": model})

    def test_generated_mixed_fleet(self):
        # Exercise actual settings generation without importing simulator services.
        source = Path(__file__).resolve().parents[1] / "PythonClient/multirotor/control/simulation_task_manager.py"
        tree = ast.parse(source.read_text())
        cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "SimulationTaskManager")
        names = {"__populate_drone_and_mission_settings", "__handle_mission_settings",
                 "__normalize_drone_name", "__remove_non_default_params", "__find_diff",
                 "__create_default_drone_full_length_reqeust"}
        cls.body = [n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name in names]
        ns = {"copy": copy, "apply_drone_model": apply_drone_model, "str_to_number": float}
        exec(compile(ast.Module(body=[cls], type_ignores=[]), str(source), "exec"), ns)
        manager = ns["SimulationTaskManager"]()
        manager._SimulationTaskManager__drone_positions_seen = set()
        manager._SimulationTaskManager__drone_mission_pair_list = []
        manager._SimulationTaskManager__DEFAULT_DRONE_FULL_LENGTH = manager._SimulationTaskManager__create_default_drone_full_length_reqeust()
        drones = [{"Name": f"Drone {i}", "droneModel": model, "X": i * 5, "Y": 0, "Z": -5,
                   "Sensors": None, "Mission": {"name": "fly_to_points", "param": []}}
                  for i, model in enumerate(("AirSim", "Aurelia", "Aurelia", "Aurelia"))]
        settings = {"Vehicles": {}}
        manager._SimulationTaskManager__populate_drone_and_mission_settings(settings, {"Drones": drones, "environment": {}})
        self.assertEqual(list(settings["PawnPaths"]), ["Aurelia"])
        self.assertNotIn("PawnPath", settings["Vehicles"]["Drone0"])
        for name in ("Drone1", "Drone2", "Drone3"):
            self.assertEqual(settings["Vehicles"][name]["PawnPath"], "Aurelia")
            self.assertNotIn("droneModel", settings["Vehicles"][name])
        self.assertEqual(drones[1]["Mission"]["name"], "fly_to_points")

    def test_example_has_four_aurelia_vehicles(self):
        path = Path(__file__).resolve().parents[2] / "docs/examples/airsim-aurelia/settings.json"
        settings = json.loads(path.read_text())
        self.assertEqual(list(settings["PawnPaths"]), ["Aurelia"])
        self.assertEqual(len(settings["Vehicles"]), 4)
        self.assertTrue(all(v["PawnPath"] == "Aurelia" for v in settings["Vehicles"].values()))

    def test_dronelume_model_selection(self):
        from PythonClient.multirotor.control.dronelume_config import derive_sut_from_mission, DroneLumeValidationError
        drone = {"X": 0, "Y": 0, "Z": 0}
        result = derive_sut_from_mission({}, [drone])
        self.assertEqual(result["Scenario"]["SuT"]["AssetName"], "/AirSim/Blueprints/BP_FlyingPawn.BP_FlyingPawn_C")
        drone["droneModel"] = "Aurelia"
        result = derive_sut_from_mission({}, [drone])
        self.assertEqual(result["Scenario"]["SuT"]["AssetName"], "BP_FlyingPawn_Aurelia")
        drone["droneModel"] = "AureliaGPS"
        with self.assertRaises(DroneLumeValidationError):
            derive_sut_from_mission({}, [drone])
