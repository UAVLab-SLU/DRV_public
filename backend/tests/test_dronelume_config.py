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
    DRONELUME_RUNTIME_FILE_NAME,
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


class FailingStorage:
    def upload_to_service(self, file_name, content, content_type="text/plain"):
        raise RuntimeError("storage unavailable")


class DroneLumeConfigTests(unittest.TestCase):
    mission_drones = [
        {
            "Name": "Drone 1",
            "droneModel": "AureliaX6Pro",
            "X": 10,
            "Y": -5,
            "Z": 125,
            "Mission": {"name": "fly_to_points", "param": []},
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

    def test_deploy_creates_a_missing_mounted_config_directory(self):
        storage = RecordingStorage()
        with tempfile.TemporaryDirectory() as directory:
            config_dir = Path(directory) / "new" / "dronelume-config"
            manager = DroneLumeConfigManager(storage, config_dir)
            request = {
                "mode": "dronelume",
                "Drones": self.mission_drones,
                "dronelume": {"source": "llm", "init_dsl": DRONELUME_TEMPLATE},
            }

            destination = manager.deploy_and_archive(request, "task-new-config")

            self.assertEqual(destination, config_dir / DRONELUME_FILE_NAME)
            self.assertTrue(destination.is_file())
            runtime_file = config_dir / DRONELUME_RUNTIME_FILE_NAME
            self.assertTrue(runtime_file.is_file())
            self.assertEqual(runtime_file.read_text(), destination.read_text())

    def test_immediate_deploy_writes_valid_authoring_dsl_without_sut(self):
        with tempfile.TemporaryDirectory() as directory:
            manager = DroneLumeConfigManager(RecordingStorage(), directory)

            destination, _ = manager.deploy(DRONELUME_TEMPLATE, deployment_id="preview")

            deployed = json.loads(destination.read_text())
            self.assertEqual(deployed, DRONELUME_TEMPLATE)
            self.assertNotIn("SuT", deployed["Scenario"])

    def test_archive_failure_does_not_cancel_runtime_deployment(self):
        with tempfile.TemporaryDirectory() as directory:
            manager = DroneLumeConfigManager(FailingStorage(), directory)
            request = {
                "mode": "dronelume",
                "Drones": self.mission_drones,
                "dronelume": {"source": "llm", "init_dsl": DRONELUME_TEMPLATE},
            }

            destination = manager.deploy_and_archive(request, "task-storage-down")

            self.assertTrue(destination.is_file())
            deployed = json.loads(destination.read_text())
            self.assertIn("SuT", deployed["Scenario"])

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

    def test_curated_fixture_actions_are_all_in_the_supported_catalog(self):
        catalog = get_dronelume_catalog()
        expected_fixtures = {
            "InitDSL_PercCrowd.json",
            "DemoDSL_chainTrigger.json",
            "DemoDSL_comprehensive.json",
            "DemoDSL_forestLoiter.json",
            "DemoDSL_teamPatrol.json",
            "InitDSL.json",
            "InitDSL_ActiveShooter.json",
            "InitDSL_Drown.json",
            "InitDSL_Missing.json",
            "Test_PlayAnimation.json",
            "Test_Targeting.json",
            "Test_Triggers.json",
            "Test_Weapon.json",
            "Test_AttachDetach.json",
            "Test_Destroy.json",
            "Test_Idle.json",
            "Test_Loiter.json",
            "Test_Movement.json",
            "Test_Order.json",
            "Test_PCG.json",
        }
        patterns = catalog["fixture_patterns"]
        self.assertEqual({pattern["fixture"] for pattern in patterns}, expected_fixtures)
        fixture_actions = {
            action
            for pattern in patterns
            for action in pattern["actions"]
        }
        self.assertTrue(fixture_actions.issubset(catalog["actions"]))
        self.assertTrue(fixture_actions.issubset(catalog["action_intents"]))

    def _dynamic_actor(self, pawn_identifier, behaviors):
        return {
            "AssetName": "GenericHumanAICharacter",
            "PawnIdentifier": pawn_identifier,
            "location": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
            "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
            "behavior": behaviors,
        }

    def test_composite_trigger_can_fan_out_across_actors(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        dynamic = document["Scenario"]["Actors"]["Dynamic"]
        dynamic["Shooter"] = self._dynamic_actor(
            "shooter",
            [{
                "action": "Attack",
                "target": "Civilian",
                "duration": 1,
                "stage_name": "attack",
                "trigger": "shots_fired",
            }],
        )
        for name in ("Civilian", "Witness"):
            dynamic[name] = self._dynamic_actor(
                name.lower(),
                [{
                    "action": "Flee",
                    "duration": 1,
                    "parameters": "800.0",
                    "stage_name": "shots_fired",
                    "trigger": "",
                }],
            )
        self.assertEqual(validate_init_dsl(document), document)

    def test_trigger_cycle_is_valid(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Actors"]["Dynamic"]["Patroller"] = self._dynamic_actor(
            "patroller",
            [
                {"action": "Idle", "duration": 1, "stage_name": "wait", "trigger": "move"},
                {
                    "action": "MoveToLocation",
                    "duration": 0,
                    "location": "100,0,0",
                    "parameters": "100.0",
                    "stage_name": "move",
                    "trigger": "wait",
                },
            ],
        )
        self.assertEqual(validate_init_dsl(document), document)

    def test_unknown_trigger_reports_exact_path(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Actors"]["Dynamic"]["Person"] = self._dynamic_actor(
            "person",
            [{"action": "Idle", "duration": 1, "stage_name": "wait", "trigger": "missing"}],
        )
        with self.assertRaises(DroneLumeValidationError) as raised:
            validate_init_dsl(document)
        self.assertIn(
            {
                "path": "$.Scenario.Actors.Dynamic.Person.behavior[0].trigger",
                "message": "must match at least one behavior stage_name",
            },
            raised.exception.errors,
        )

    def test_unknown_behavior_target_reports_exact_path(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Actors"]["Dynamic"]["Attacker"] = self._dynamic_actor(
            "attacker",
            [{"action": "Attack", "target": "missing", "duration": 1}],
        )
        with self.assertRaises(DroneLumeValidationError) as raised:
            validate_init_dsl(document)
        self.assertIn(
            {
                "path": "$.Scenario.Actors.Dynamic.Attacker.behavior[0].target",
                "message": "must reference an existing dynamic actor key or PawnIdentifier",
            },
            raised.exception.errors,
        )

    @unittest.skipIf(SimulationTaskManager is None, "backend runtime dependencies are not installed")
    def test_task_returns_to_idle_after_missions_finish(self):
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
            mission_started = threading.Event()

            def execute_missions(*args, **kwargs):
                self.assertEqual(manager.unreal_state["state"], "dronelume_map")
                self.assertEqual(manager.unreal_state["task_id"], "task-state")
                self.assertFalse(kwargs["reset_scene"])
                mission_started.set()

            with patch.object(
                manager,
                "_SimulationTaskManager__wait_for_airsim",
                return_value=True,
            ), patch.object(
                manager,
                "_SimulationTaskManager__batch_exe_all",
                side_effect=execute_missions,
            ) as mission_executor:
                worker = threading.Thread(target=manager.start, daemon=True)
                worker.start()

                self.assertTrue(mission_started.wait(3))
                deadline = time.time() + 3
                while manager.unreal_state.get("state") != "idle" and time.time() < deadline:
                    time.sleep(0.02)
                self.assertEqual(manager.unreal_state, {"state": "idle"})
                mission_executor.assert_called_once()
                manager.stop()


if __name__ == "__main__":
    unittest.main()
