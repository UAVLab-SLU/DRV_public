"""Build or verify the 18 DRV request/InitDSL pairs without running simulations."""
import argparse
import ast
import copy
import hashlib
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "backend"))
from PythonClient.multirotor.control.dronelume_config import (
    extract_dronelume_request, validate_init_dsl,
)

SEEDS = (2001, 2002, 2003)
FAMILIES = {
    "F": ("forest", "missing_person_search_and_rescue", "Scenario.Level.Weather.intensity", 0.0, 0.7),
    "W": ("water", "river_search_and_rescue", "Scenario.Level.Weather.intensity", 0.0, 0.7),
    "T": ("triggered", "active_shooter_surveillance", "Scenario.Actors.Procedural.Crowd.density", 0.1, 0.5),
}


def encode(value):
    return (json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n").encode("utf-8")


def sha(value):
    return hashlib.sha256(value).hexdigest()


def set_value(document, path, value):
    parts = path.split(".")
    for part in parts[:-1]:
        document = document[part]
    document[parts[-1]] = value


def differences(a, b, path=""):
    if isinstance(a, dict) and isinstance(b, dict):
        result = []
        for key in sorted(a.keys() | b.keys()):
            subpath = f"{path}.{key}".strip(".")
            if key not in a or key not in b:
                result.append({"path": subpath, "before": a.get(key), "after": b.get(key)})
            else:
                result.extend(differences(a[key], b[key], subpath))
        return result
    if isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        return [d for i, (x, y) in enumerate(zip(a, b)) for d in differences(x, y, f"{path}[{i}]")]
    return [] if a == b else [{"path": path, "before": a, "after": b}]


def make_base(code, source):
    document = copy.deepcopy(source)
    scenario = document["Scenario"]
    scenario.pop("SuT", None)
    scenario["Metadata"] = {
        "name": f"RegressionStudy18_{code}", "version": "2.0", "Author": "DRV regression study",
        "Date": "2026-09-08", "Description": "Mission-aligned capture configuration; see suite manifest for protocol adaptations.",
        "UseCase": [FAMILIES[code][0]],
    }
    scenario["Goal"] = {
        "type": "test", "Objective": "Record visible people for offline person-detection regression evaluation.",
        "Target": {"AssetName": "GenericHumanAICharacter", "Type": "human", "Signature": "visible"},
    }
    dynamic = scenario["Actors"]["Dynamic"]
    for key, actor in dynamic.items():
        # Runtime uses the actor object key as identity. Keep the UI identifier identical.
        actor["PawnIdentifier"] = key
        actor["location"].pop("z", None)  # Runtime ignores dynamic Z and finds terrain height.
        actor.setdefault("behavior", [])
    if code == "F":
        dynamic["MissingPerson"]["location"].update(x=1050, y=6000)
    elif code == "W":
        dynamic["Drowner"]["location"].update(x=13800, y=-36200)
    else:
        # Existing supported behavior graph, timed to the 60 s nominal camera transit.
        dynamic["ActiveShooter"]["behavior"][1]["duration"] = 75.0
        dynamic["Civilian1"]["behavior"][1]["duration"] = 90.0
        for action in dynamic["Civilian1"]["behavior"][2:]:
            action["order"] = "A"
        for key in ("TriggerReceiver1", "TriggerReceiver2"):
            dynamic[key]["behavior"][1]["duration"] = 90.0
    return document


def make_drone(code, mission):
    return {
        "Name": "Drone1", "FlightController": "SimpleFlight", "VehicleType": "SimpleFlight",
        "droneType": "MultiRotor", "droneModel": "Aurelia",
        "DefaultVehicleState": "Armed", "EnableCollisions": True,
        "AllowAPIAlways": True, "EnableTrace": False,
        "X": 0, "Y": 0, "Z": 0, "Pitch": 0, "Roll": 0, "Yaw": 0,
        "CoordinateFrame": "dronelume_cartesian",
        "Mission": {"name": mission, "param": [4, "0"]},
        "Cameras": {"0": {
            "X": 0, "Y": 0, "Z": 0, "Pitch": -90 if code == "F" else 0, "Roll": 0, "Yaw": 0,
            "CaptureSettings": [{"ImageType": 0, "Width": 1280, "Height": 720,
                                 "FOV_Degrees": 90, "MotionBlurAmount": 0}],
        }},
    }


def validate_pair(payload, runtime):
    assert set(payload) == {"mode", "Drones", "dronelume"}
    assert "SuT" not in payload["dronelume"]["init_dsl"]["Scenario"]
    assert len(payload["Drones"]) == 1
    assert extract_dronelume_request(payload)["init_dsl"] == runtime
    validate_init_dsl(runtime, require_sut=True)
    drone = payload["Drones"][0]
    assert drone["Mission"]["param"] == [4, "0"]
    assert drone["Name"] == "Drone1"
    assert [drone[k] for k in ("X", "Y", "Z", "Pitch", "Roll", "Yaw")] == [0] * 6
    assert runtime["Scenario"]["SuT"]["StartLocation"] == {"Cartesian": True, "x": 0, "y": 0, "z": 0}
    # Reject anything outside the deliberately supported subset, including inert camera/recording DSL fields.
    scenario = runtime["Scenario"]
    assert set(scenario) == {"Metadata", "Goal", "Level", "Actors", "SuT"}
    for section in ("Static", "Dynamic"):
        for key, actor in scenario["Actors"][section].items():
            assert set(actor) <= {"AssetName", "PawnIdentifier", "location", "orientation", "behavior"}
            assert set(actor["location"]) == {"Cartesian", "x", "y"}
            if section == "Dynamic":
                assert actor["PawnIdentifier"] == key
                for action in actor["behavior"]:
                    assert set(action) <= {"action", "target", "duration", "order", "location", "parameters", "stage_name", "trigger"}
    # Verify the module/class names accepted by the dynamic backend loader without an RPC connection.
    name = drone["Mission"]["name"]
    module = ROOT / "backend/PythonClient/multirotor/mission" / (name + ".py")
    tree = ast.parse(module.read_text(encoding="utf-8"))
    assert any(isinstance(node, ast.ClassDef) and node.name == name.title().replace("_", "") for node in tree.body)
    frontend = (ROOT / "frontend/src/constants/drone.js").read_text(encoding="utf-8")
    assert f"value: '{name}'" in frontend


def build():
    outputs, cases, sources = {}, [], []
    for code, (family, mission, factor, nominal, stress) in FAMILIES.items():
        path = HERE / "sources" / (family + ".json")
        original = json.loads(path.read_bytes())
        base = make_base(code, original)
        sources.append({"family": family, "file": path.relative_to(HERE).as_posix(), "sha256": sha(path.read_bytes()),
                        "common_adaptations": differences(original, base)})
        for seed in SEEDS:
            pair = {}
            for variant, value in (("N", nominal), ("A", stress)):
                case_id = f"{code}_{variant}_s{seed}"
                document = copy.deepcopy(base)
                document["Scenario"]["Metadata"]["name"] = case_id
                set_value(document, factor, value)
                document["Scenario"]["Actors"]["Procedural"]["Seed"] = seed
                payload = {"mode": "dronelume", "Drones": [make_drone(code, mission)],
                           "dronelume": {"source": "imported", "init_dsl": document}}
                runtime = extract_dronelume_request(payload)["init_dsl"]
                validate_pair(payload, runtime)
                paths = {"frontend_payload": f"cases/{case_id}/frontend_payload.json",
                         "init_dsl": f"cases/{case_id}/InitDSL.json"}
                outputs[paths["frontend_payload"]] = encode(payload)
                outputs[paths["init_dsl"]] = encode(runtime)
                pair[variant] = copy.deepcopy(runtime)
                pair[variant]["Scenario"]["Metadata"]["name"] = "paired-case"
                cls = mission.title().replace("_", "")
                cases.append({"case_id": case_id, "family": family, "variant": variant, "seed": seed,
                              "mission": mission, "factor_path": factor, "factor_value": value,
                              **paths, "sha256": {key: sha(outputs[path]) for key, path in paths.items()},
                              "report_recording_relative_path": f"{cls}/{cls}_Drone1_recording.mp4",
                              "evaluation_window": "observed trigger -5s through +15s" if code == "T" else
                                  ("last 20s, includes end of approach and the single orbit" if code == "F" else
                                   "20s around target visibility during the slow river leg"),
                              "runtime_verified": False})
            assert [d["path"] for d in differences(pair["N"], pair["A"])] == [factor]
    assert len(cases) == 18 and len(outputs) == 36
    outputs["manifest.json"] = encode({
        "suite": "SANER2027 DRV mission-aligned regression study", "version": "2.0",
        "design": "3 families x nominal/stress x 3 seeds", "seeds": list(SEEDS),
        "protocol_snapshot": "sources/protocol.md", "protocol_sha256": sha((HERE / "sources/protocol.md").read_bytes()),
        "water_stress_adaptation": {"protocol_fog": 0.5, "supported_fog_used": 0.7},
        "capture": {"camera": "0", "width": 1280, "height": 720, "fov_degrees": 90,
                    "recorder_nominal_fps": 5, "motion_blur_amount": 0, "runtime_verified": False,
                    "raw_frame_timestamps_available": False, "automatic_scoring_window": False},
        "sources": sources, "cases": cases,
    })
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build()
    if args.check:
        actual = {p.relative_to(HERE).as_posix() for p in (HERE / "cases").rglob("*.json")}
        assert actual == {p for p in outputs if p.startswith("cases/")}, "Missing or extra case JSON"
    for relative, data in outputs.items():
        target = HERE / relative
        if args.check:
            assert target.read_bytes() == data, f"Changed artifact: {relative}"
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    print("PASS: 18 payload/DSL pairs, backend validation, frontend mission names, 9 one-factor contrasts, hashes.")
    print("No simulations submitted. Runtime capture and visual checks are separate.")


if __name__ == "__main__":
    main()
