"""Exercise DRV's actual settings transformation without RPC/cloud initialization."""
import ast
import contextlib
import copy
import io
import json
from pathlib import Path

from build_suite import HERE, ROOT, build, validate_pair
from PythonClient.multirotor.control.drone_models import apply_drone_model


def main():
    build()
    source_path = ROOT / "backend/PythonClient/multirotor/control/simulation_task_manager.py"
    tree = ast.parse(source_path.read_text(encoding="utf-8"))
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "SimulationTaskManager")
    names = {
        "__populate_drone_and_mission_settings", "__handle_mission_settings", "__normalize_drone_name",
        "__remove_non_default_params", "__find_diff", "__create_default_drone_full_length_reqeust",
        "__create_default_empty_settings_dot_json",
    }
    # Compile the unchanged transformation methods; exclude startup, disk writes and networking.
    cls.body = [n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name in names]
    assert len(cls.body) == len(names)
    number = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "str_to_number")
    module = ast.fix_missing_locations(ast.Module(body=[number, cls], type_ignores=[]))
    # The extracted method calls this production helper. Include it in the
    # isolated namespace while still avoiding manager startup and RPC setup.
    namespace = {"copy": copy, "apply_drone_model": apply_drone_model}
    exec(compile(module, str(source_path), "exec"), namespace)
    manager_class = namespace["SimulationTaskManager"]
    manifest = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
    for case in manifest["cases"]:
        payload = json.loads((HERE / case["frontend_payload"]).read_text(encoding="utf-8"))
        runtime = json.loads((HERE / case["init_dsl"]).read_text(encoding="utf-8"))
        validate_pair(payload, runtime)
        manager = manager_class()
        manager._SimulationTaskManager__drone_positions_seen = set()
        manager._SimulationTaskManager__drone_mission_pair_list = []
        manager._SimulationTaskManager__DEFAULT_DRONE_FULL_LENGTH = (
            manager._SimulationTaskManager__create_default_drone_full_length_reqeust())
        settings = manager._SimulationTaskManager__create_default_empty_settings_dot_json()
        # __run_dronelume_batch adds these exact execution fields to the frontend payload.
        request = copy.deepcopy(payload)
        request["environment"] = {"UseGeo": False}
        request["monitors"] = {}
        with contextlib.redirect_stdout(io.StringIO()):
            manager._SimulationTaskManager__populate_drone_and_mission_settings(settings, request)
        drone = payload["Drones"][0]
        assert manager._SimulationTaskManager__drone_mission_pair_list == [(case["mission"], "Drone1", [4, "0"])]
        vehicle = settings["Vehicles"]["Drone1"]
        assert vehicle["Cameras"] == drone["Cameras"], case["case_id"]
        assert vehicle["VehicleType"] == "SimpleFlight"
        assert [vehicle[key] for key in ("X", "Y", "Z")] == [0, 0, 0]
        assert "Mission" not in vehicle
    print("PASS: all 18 missions dispatch correctly and camera settings survive the actual backend transformation.")


if __name__ == "__main__":
    main()
