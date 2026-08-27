import copy
import json
import tempfile
import unittest
from pathlib import Path
import sys
import threading
import time
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PythonClient.multirotor.control.dronelume_config import (
    DRONELUME_FILE_NAME,
    DRONELUME_TEMPLATE,
    DroneLumeConfigManager,
    DroneLumeValidationError,
    derive_sut_from_mission,
    extract_dronelume_request,
    get_dronelume_catalog,
    validate_init_dsl,
)
try:
    from PythonClient.multirotor.control.simulation_task_manager import SimulationTaskManager
except ModuleNotFoundError:
    SimulationTaskManager = None


class RecordingStorage:
    def __init__(self):
        self.uploads = {}

    def upload_to_service(self, file_name, content, content_type="text/plain"):
        self.uploads[file_name] = {"content": content, "content_type": content_type}


class DroneLumeConfigTests(unittest.TestCase):
    mission_drones = [
        {
            "Name": "Drone 1",
            "droneModel": "AureliaX6Pro",
            "X": 10,
            "Y": -5,
            "Z": 125,
        }
    ]

    def test_template_is_valid(self):
        self.assertEqual(validate_init_dsl(DRONELUME_TEMPLATE), DRONELUME_TEMPLATE)

    def test_unsupported_action_reports_exact_path(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Actors"]["Dynamic"]["Person"] = {
            "AssetName": "GenericHumanAICharacter",
            "PawnIdentifier": "person",
            "location": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
            "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
            "behavior": [{"action": "Teleport"}],
        }
        with self.assertRaises(DroneLumeValidationError) as raised:
            validate_init_dsl(document)
        self.assertEqual(
            raised.exception.errors[0]["path"],
            "$.Scenario.Actors.Dynamic.Person.behavior[0].action",
        )

    def test_deploys_canonical_file_and_archives_it(self):
        storage = RecordingStorage()
        with tempfile.TemporaryDirectory() as directory:
            manager = DroneLumeConfigManager(storage, directory)
            request = {
                "mode": "dronelume",
                "Drones": self.mission_drones,
                "dronelume": {"source": "llm", "init_dsl": DRONELUME_TEMPLATE},
            }
            destination = manager.deploy_and_archive(request, "task-1")
            self.assertEqual(destination, Path(directory) / DRONELUME_FILE_NAME)
            deployed = json.loads(destination.read_text())
            self.assertEqual(deployed["Scenario"]["SuT"]["StartLocation"]["x"], 10)
            self.assertEqual(deployed["Scenario"]["SuT"]["StartLocation"]["y"], -5)
            self.assertEqual(deployed["Scenario"]["SuT"]["StartLocation"]["z"], 125)
            self.assertIn("task-1/InitDSL.json", storage.uploads)
            self.assertIn("task-1/dronelume_metadata.json", storage.uploads)

    def test_manual_and_llm_requests_share_the_same_contract(self):
        for source in ("manual", "llm", "imported"):
            parsed = extract_dronelume_request(
                {
                    "mode": "dronelume",
                    "Drones": self.mission_drones,
                    "dronelume": {"source": source, "init_dsl": DRONELUME_TEMPLATE},
                }
            )
            self.assertEqual(parsed["source"], source)
            self.assertEqual(parsed["init_dsl"]["Scenario"]["SuT"]["AssetName"], "BP_FlyingPawn_Aurelia")

    def test_sut_is_overwritten_from_mission(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["SuT"] = {
            "AssetName": "stale",
            "StartLocation": {"Cartesian": False, "x": 1, "y": 2, "z": 3},
        }
        merged = derive_sut_from_mission(document, self.mission_drones)
        self.assertEqual(
            merged["Scenario"]["SuT"],
            {
                "AssetName": "BP_FlyingPawn_Aurelia",
                "StartLocation": {"Cartesian": True, "x": 10, "y": -5, "z": 125},
            },
        )

    def test_catalog_is_the_asset_source_of_truth(self):
        catalog = get_dronelume_catalog()
        self.assertIn("GenericHumanAICharacter", catalog["dynamic_assets"])
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Actors"]["Static"]["Object1"] = {
            "AssetName": "typed_free_form_asset",
            "location": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
            "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
        }
        with self.assertRaises(DroneLumeValidationError):
            validate_init_dsl(document)

    @unittest.skipIf(SimulationTaskManager is None, "backend runtime dependencies are not installed")
    def test_task_state_stays_active_until_explicit_stop(self):
        storage = RecordingStorage()
        with tempfile.TemporaryDirectory() as directory:
            with patch(
                "PythonClient.multirotor.control.simulation_task_manager.get_storage_service",
                return_value=storage,
            ), patch.object(
                SimulationTaskManager,
                "_SimulationTaskManager__environment_check",
                return_value=None,
            ):
                manager = SimulationTaskManager()
            manager._SimulationTaskManager__dronelume_config_manager = DroneLumeConfigManager(
                storage, directory
            )
            manager.add_task(
                {
                    "mode": "dronelume",
                    "Drones": self.mission_drones,
                    "dronelume": {"source": "manual", "init_dsl": DRONELUME_TEMPLATE},
                },
                "task-state",
            )
            worker = threading.Thread(target=manager.start, daemon=True)
            worker.start()

            deadline = time.time() + 3
            while manager.unreal_state.get("state") != "dronelume_map" and time.time() < deadline:
                time.sleep(0.02)
            self.assertEqual(manager.unreal_state["state"], "dronelume_map")
            self.assertEqual(manager.unreal_state["task_id"], "task-state")

            self.assertTrue(manager.stop_dronelume())
            deadline = time.time() + 3
            while manager.unreal_state.get("state") != "idle" and time.time() < deadline:
                time.sleep(0.02)
            self.assertEqual(manager.unreal_state, {"state": "idle"})
            manager.stop()


if __name__ == "__main__":
    unittest.main()
