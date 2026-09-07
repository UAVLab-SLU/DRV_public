import copy
import json
import os
from datetime import datetime, timezone
from pathlib import Path


DRONELUME_STATE = "dronelume_map"
DRONELUME_FILE_NAME = "InitDSL.json"
DRONELUME_RUNTIME_FILE_NAME = os.getenv(
    "DRONELUME_RUNTIME_FILE_NAME", "initDSL_ActiveShooter.json"
)
DEFAULT_WINDOWS_CONFIG_DIR = Path(
    r"G:\UE_project\DroneWorld 5.5\Packaged\Windows\DRV\Config"
)
DEFAULT_DOCKER_CONFIG_DIR = Path("/app/dronelume-config")
DEFAULT_CATALOG_PATH = Path(__file__).with_name("dronelume_catalog.json")


def get_dronelume_catalog():
    """Load the authoring catalog so asset updates need only one JSON edit."""
    catalog_path = Path(
        os.getenv("DRONELUME_CATALOG_PATH", str(DEFAULT_CATALOG_PATH))
    ).expanduser()
    with catalog_path.open("r", encoding="utf-8") as catalog_file:
        return json.load(catalog_file)


DRONELUME_TEMPLATE = {
    "Scenario": {
        "Metadata": {
            "name": "NewDroneLumeScenario",
            "version": "1.0",
            "Author": "",
            "Date": "",
            "Description": "",
            "UseCase": [],
        },
        "Goal": {
            "type": "test",
            "Objective": "",
            "Target": {
                "AssetName": "GenericHumanAICharacter",
                "Type": "human",
                "Signature": "visible",
            },
        },
        "Level": {
            "size": "small",
            "type": "urban",
            "TimeOfDay": "13:00",
            "Weather": {"type": "clear", "intensity": 1.0},
        },
        "Actors": {"Static": {}, "Dynamic": {}, "Procedural": {"Seed": 0}},
    }
}


def get_dronelume_contract():
    catalog = get_dronelume_catalog()
    return {
        "contract_version": "1.1",
        "llm_instructions": [
            "Return only one valid JSON object with a top-level Scenario object.",
            "Use the template field names and only catalog values and actions.",
            "Do not generate Scenario.SuT; it is derived from the first Mission drone.",
            "Give every dynamic pawn a unique PawnIdentifier.",
            "Use an actor key or PawnIdentifier for behavior targets.",
            "Build composite actions from atomic behaviors. A trigger invokes every behavior whose stage_name matches it.",
            "Every nonempty trigger must match at least one stage_name. Shared stage names and trigger cycles are valid.",
            "Use relative Cartesian x,y,z coordinates for DroneLume locations.",
            "Submit the generated object as dronelume.init_dsl without Markdown fences.",
        ],
        "file_name": DRONELUME_FILE_NAME,
        "state": DRONELUME_STATE,
        "actor_sections": ["Static", "Dynamic", "Procedural"],
        "behavior_fields": [
            "action",
            "target",
            "duration",
            "order",
            "location",
            "parameters",
            "stage_name",
            "trigger",
            "behavior_tree_asset",
        ],
        "mission_owned_fields": ["Scenario.SuT"],
        "catalog": catalog,
        "actions": catalog["actions"],
        "submission_envelope": {
            "mode": "dronelume",
            "Drones": "<Mission drones with relative X, Y, Z home coordinates>",
            "dronelume": {"source": "llm", "init_dsl": "<generated InitDSL object>"},
        },
        "template": copy.deepcopy(DRONELUME_TEMPLATE),
    }


DRONELUME_CONTRACT = get_dronelume_contract()
SUPPORTED_ACTIONS = DRONELUME_CONTRACT["actions"]
ACTION_ALIASES = {"shoot": "Attack", "escape": "Flee"}


class DroneLumeValidationError(ValueError):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("Invalid DroneLume InitDSL configuration")


def _error(errors, path, message):
    errors.append({"path": path, "message": message})


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _validate_catalog_value(value, options, path, errors, allow_empty=False):
    if allow_empty and (value is None or value == ""):
        return
    if value not in options:
        _error(errors, path, f"must be one of {', '.join(str(item) for item in options)}")


def _validate_location(value, path, errors, require_cartesian=False):
    if not isinstance(value, dict):
        _error(errors, path, "must be an object")
        return
    if not isinstance(value.get("Cartesian"), bool):
        _error(errors, f"{path}.Cartesian", "must be true or false")
    elif require_cartesian and not value["Cartesian"]:
        _error(errors, f"{path}.Cartesian", "must be true for DroneLume relative coordinates")
    for coordinate in ("x", "y"):
        if not _is_number(value.get(coordinate)):
            _error(errors, f"{path}.{coordinate}", "must be a number")
    for coordinate in ("z", "h"):
        if coordinate in value and not _is_number(value[coordinate]):
            _error(errors, f"{path}.{coordinate}", "must be a number")


def _validate_orientation(value, path, errors):
    if not isinstance(value, dict):
        _error(errors, path, "must be an object")
        return
    for angle in ("pitch", "yaw", "roll"):
        if not _is_number(value.get(angle)):
            _error(errors, f"{path}.{angle}", "must be a number")


def _validate_behavior(value, path, errors, catalog):
    if isinstance(value, str):
        return
    if not isinstance(value, dict):
        _error(errors, path, "must be a behavior name or object")
        return

    action = value.get("action")
    if not isinstance(action, str) or not action.strip():
        _error(errors, f"{path}.action", "is required")
        return
    if action not in catalog["actions"]:
        _error(
            errors,
            f"{path}.action",
            f"unsupported action; expected one of {', '.join(catalog['actions'])}",
        )
        return
    canonical_action = ACTION_ALIASES.get(action.lower(), action)

    if "duration" in value and not _is_number(value["duration"]):
        _error(errors, f"{path}.duration", "must be a number")
    for field in ("target", "order", "location", "stage_name", "trigger", "behavior_tree_asset"):
        if field in value and not isinstance(value[field], str):
            _error(errors, f"{path}.{field}", "must be a string")
    if value.get("order"):
        _validate_catalog_value(value["order"], catalog["behavior_orders"], f"{path}.order", errors)
    if value.get("behavior_tree_asset"):
        _validate_catalog_value(
            value["behavior_tree_asset"],
            catalog["behavior_tree_assets"],
            f"{path}.behavior_tree_asset",
            errors,
        )

    parameters = value.get("parameters", "")
    if not isinstance(parameters, (str, list)):
        _error(errors, f"{path}.parameters", "must be a string or array")
    elif parameters not in ("", []):
        available_parameters = catalog["actions"][action].get("parameters", [])
        if parameters not in available_parameters:
            _error(errors, f"{path}.parameters", "must be selected from the action catalog")

    if canonical_action in ("MoveToTarget", "Attack") and not str(value.get("target", "")).strip():
        _error(errors, f"{path}.target", f"is required for {canonical_action}")
    if canonical_action == "MoveToLocation":
        parts = [part.strip() for part in str(value.get("location", "")).split(",")]
        if len(parts) != 3:
            _error(errors, f"{path}.location", "must use the x,y,z format")
        else:
            try:
                [float(part) for part in parts]
            except ValueError:
                _error(errors, f"{path}.location", "must contain three numbers")


def _validate_actor(actor, path, errors, catalog, dynamic=False):
    if not isinstance(actor, dict):
        _error(errors, path, "must be an object")
        return
    assets = catalog["dynamic_assets" if dynamic else "static_assets"]
    _validate_catalog_value(actor.get("AssetName"), assets, f"{path}.AssetName", errors)
    _validate_location(actor.get("location"), f"{path}.location", errors, require_cartesian=True)
    _validate_orientation(actor.get("orientation"), f"{path}.orientation", errors)
    if dynamic:
        if "PawnIdentifier" in actor and not isinstance(actor["PawnIdentifier"], str):
            _error(errors, f"{path}.PawnIdentifier", "must be a string")
        behaviors = actor.get("behavior", [])
        if not isinstance(behaviors, (list, dict)):
            _error(errors, f"{path}.behavior", "must be an array or staged behavior object")
        elif isinstance(behaviors, list):
            for index, behavior in enumerate(behaviors):
                _validate_behavior(behavior, f"{path}.behavior[{index}]", errors, catalog)


def validate_init_dsl(value, require_sut=False):
    """Return a safe InitDSL copy or raise DroneLumeValidationError."""
    errors = []
    catalog = get_dronelume_catalog()
    if not isinstance(value, dict):
        raise DroneLumeValidationError([{"path": "$", "message": "must be a JSON object"}])

    scenario = value.get("Scenario")
    if not isinstance(scenario, dict):
        raise DroneLumeValidationError(
            [{"path": "$.Scenario", "message": "top-level Scenario object is required"}]
        )

    metadata = scenario.get("Metadata")
    if not isinstance(metadata, dict):
        _error(errors, "$.Scenario.Metadata", "is required")
    elif not isinstance(metadata.get("name"), str) or not metadata["name"].strip():
        _error(errors, "$.Scenario.Metadata.name", "is required")

    goal = scenario.get("Goal")
    if isinstance(goal, dict):
        _validate_catalog_value(goal.get("type"), catalog["goal_types"], "$.Scenario.Goal.type", errors)
        target = goal.get("Target")
        if isinstance(target, dict):
            _validate_catalog_value(target.get("AssetName"), catalog["target_assets"], "$.Scenario.Goal.Target.AssetName", errors)
            _validate_catalog_value(target.get("Type"), catalog["target_types"], "$.Scenario.Goal.Target.Type", errors)
            _validate_catalog_value(target.get("Signature"), catalog["target_signatures"], "$.Scenario.Goal.Target.Signature", errors)

    level = scenario.get("Level")
    if not isinstance(level, dict):
        _error(errors, "$.Scenario.Level", "is required")
    else:
        _validate_catalog_value(level.get("size", level.get("Size")), catalog["level_sizes"], "$.Scenario.Level.size", errors)
        _validate_catalog_value(level.get("type"), catalog["level_types"], "$.Scenario.Level.type", errors)
        _validate_catalog_value(level.get("TimeOfDay"), catalog["times_of_day"], "$.Scenario.Level.TimeOfDay", errors, allow_empty=True)
        weather = level.get("Weather")
        if not isinstance(weather, dict):
            _error(errors, "$.Scenario.Level.Weather", "must be an object")
        else:
            _validate_catalog_value(weather.get("type"), catalog["weather_types"], "$.Scenario.Level.Weather.type", errors)
            if "intensity" in weather:
                _validate_catalog_value(weather["intensity"], catalog["weather_intensities"], "$.Scenario.Level.Weather.intensity", errors)

    actors = scenario.get("Actors")
    if not isinstance(actors, dict):
        _error(errors, "$.Scenario.Actors", "is required")
    else:
        static_actors = actors.get("Static", {})
        dynamic_actors = actors.get("Dynamic", {})
        procedural = actors.get("Procedural", {})
        if not isinstance(static_actors, dict):
            _error(errors, "$.Scenario.Actors.Static", "must be an object")
        else:
            for actor_id, actor in static_actors.items():
                _validate_actor(actor, f"$.Scenario.Actors.Static.{actor_id}", errors, catalog)
        if not isinstance(dynamic_actors, dict):
            _error(errors, "$.Scenario.Actors.Dynamic", "must be an object")
        else:
            pawn_ids = set()
            actor_references = set(dynamic_actors)
            stage_names = set()
            behavior_entries = []
            for actor_id, actor in dynamic_actors.items():
                _validate_actor(actor, f"$.Scenario.Actors.Dynamic.{actor_id}", errors, catalog, dynamic=True)
                if isinstance(actor, dict) and actor.get("PawnIdentifier"):
                    pawn_id = actor["PawnIdentifier"]
                    if pawn_id in pawn_ids:
                        _error(errors, f"$.Scenario.Actors.Dynamic.{actor_id}.PawnIdentifier", "must be unique")
                    pawn_ids.add(pawn_id)
                    actor_references.add(pawn_id)
                if isinstance(actor, dict) and isinstance(actor.get("behavior", []), list):
                    for index, behavior in enumerate(actor.get("behavior", [])):
                        if not isinstance(behavior, dict):
                            continue
                        behavior_path = f"$.Scenario.Actors.Dynamic.{actor_id}.behavior[{index}]"
                        behavior_entries.append((behavior, behavior_path))
                        stage_name = behavior.get("stage_name")
                        if isinstance(stage_name, str) and stage_name.strip():
                            stage_names.add(stage_name.strip())

            for behavior, behavior_path in behavior_entries:
                canonical_action = ACTION_ALIASES.get(
                    str(behavior.get("action", "")).lower(), behavior.get("action")
                )
                target = behavior.get("target")
                if (
                    canonical_action in ("MoveToTarget", "Attack")
                    and isinstance(target, str)
                    and target.strip()
                    and target.strip() not in actor_references
                ):
                    _error(
                        errors,
                        f"{behavior_path}.target",
                        "must reference an existing dynamic actor key or PawnIdentifier",
                    )
                trigger = behavior.get("trigger")
                if (
                    isinstance(trigger, str)
                    and trigger.strip()
                    and trigger.strip() not in stage_names
                ):
                    _error(
                        errors,
                        f"{behavior_path}.trigger",
                        "must match at least one behavior stage_name",
                    )
        if not isinstance(procedural, dict):
            _error(errors, "$.Scenario.Actors.Procedural", "must be an object")
        else:
            if "Seed" in procedural and not _is_number(procedural["Seed"]):
                _error(errors, "$.Scenario.Actors.Procedural.Seed", "must be a number")
            for entry_id, entry in procedural.items():
                if entry_id == "Seed":
                    continue
                path = f"$.Scenario.Actors.Procedural.{entry_id}"
                if not isinstance(entry, dict):
                    _error(errors, path, "must be an object")
                    continue
                _validate_catalog_value(entry.get("AssetName"), catalog["procedural_assets"], f"{path}.AssetName", errors)
                for field in ("density", "coverage"):
                    if field in entry and not _is_number(entry[field]):
                        _error(errors, f"{path}.{field}", "must be a number")

    sut = scenario.get("SuT")
    if require_sut and not isinstance(sut, dict):
        _error(errors, "$.Scenario.SuT", "is derived from the Mission tab and requires a Mission drone")
    elif isinstance(sut, dict):
        if not isinstance(sut.get("AssetName"), str) or not sut["AssetName"].strip():
            _error(errors, "$.Scenario.SuT.AssetName", "is required")
        _validate_location(sut.get("StartLocation"), "$.Scenario.SuT.StartLocation", errors, require_cartesian=True)

    if errors:
        raise DroneLumeValidationError(errors)

    try:
        return json.loads(json.dumps(copy.deepcopy(value)))
    except (TypeError, ValueError) as exc:
        raise DroneLumeValidationError(
            [{"path": "$", "message": f"must contain only JSON-compatible values: {exc}"}]
        ) from exc


def derive_sut_from_mission(document, drones):
    """Make Mission the single source of truth for the current singular DSL SuT."""
    if not isinstance(drones, list) or not drones:
        raise DroneLumeValidationError(
            [{"path": "$.Drones", "message": "at least one Mission drone is required for DroneLume"}]
        )
    drone = drones[0]
    if not isinstance(drone, dict):
        raise DroneLumeValidationError([{"path": "$.Drones[0]", "message": "must be an object"}])
    errors = []
    for field in ("X", "Y", "Z"):
        if not _is_number(drone.get(field)):
            _error(errors, f"$.Drones[0].{field}", "must be a relative Cartesian number")
    if errors:
        raise DroneLumeValidationError(errors)

    catalog = get_dronelume_catalog()
    drone_model = drone.get("droneModel")
    asset_name = catalog["sut_asset_by_drone_model"].get(
        drone_model, catalog["default_sut_asset"]
    )
    merged = copy.deepcopy(document)
    merged.setdefault("Scenario", {})["SuT"] = {
        "AssetName": asset_name,
        "StartLocation": {
            "Cartesian": True,
            "x": drone["X"],
            "y": drone["Y"],
            "z": drone["Z"],
        },
    }
    return merged


def extract_dronelume_request(payload):
    if not isinstance(payload, dict):
        raise DroneLumeValidationError([{"path": "$", "message": "request must be an object"}])
    mode = payload.get("mode", payload.get("simulation_mode"))
    if mode != "dronelume":
        return None
    dronelume = payload.get("dronelume", {})
    if not isinstance(dronelume, dict):
        raise DroneLumeValidationError([{"path": "$.dronelume", "message": "must be an object"}])
    document = dronelume.get("init_dsl", payload.get("init_dsl"))
    if document is None:
        raise DroneLumeValidationError([{"path": "$.dronelume.init_dsl", "message": "is required"}])
    source = dronelume.get("source", "llm")
    if source not in ("llm", "manual", "imported"):
        raise DroneLumeValidationError([{"path": "$.dronelume.source", "message": "must be llm, manual, or imported"}])
    document_with_sut = derive_sut_from_mission(document, payload.get("Drones"))
    return {"init_dsl": validate_init_dsl(document_with_sut, require_sut=True), "source": source}


def get_dronelume_config_dir():
    configured_path = os.getenv("DRONELUME_CONFIG_DIR")
    if configured_path:
        return Path(configured_path).expanduser()
    if os.name == "nt":
        return DEFAULT_WINDOWS_CONFIG_DIR
    return DEFAULT_DOCKER_CONFIG_DIR


class DroneLumeConfigManager:
    def __init__(self, storage_service, config_dir=None):
        self.storage_service = storage_service
        self.config_dir = Path(config_dir) if config_dir else get_dronelume_config_dir()

    def deploy(self, document, require_sut=False, deployment_id="apply"):
        document = validate_init_dsl(document, require_sut=require_sut)
        serialized = json.dumps(document, indent=2, ensure_ascii=False) + "\n"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        file_names = {DRONELUME_FILE_NAME, DRONELUME_RUNTIME_FILE_NAME}
        if any(Path(file_name).name != file_name for file_name in file_names):
            raise OSError("DroneLume file names must not contain directory components")
        for file_name in file_names:
            destination = self.config_dir / file_name
            temporary = self.config_dir / f".{file_name}.{deployment_id}.tmp"
            try:
                temporary.write_text(serialized, encoding="utf-8")
                os.replace(temporary, destination)
            finally:
                if temporary.exists():
                    temporary.unlink()
        destination = self.config_dir / DRONELUME_FILE_NAME
        return destination, serialized

    def deploy_and_archive(self, request_data, task_id):
        parsed = extract_dronelume_request(request_data)
        if parsed is None:
            raise DroneLumeValidationError([{"path": "$.mode", "message": "must be dronelume"}])

        document = parsed["init_dsl"]
        destination, serialized = self.deploy(document, require_sut=True, deployment_id=task_id)
        try:
            self.storage_service.upload_to_service(
                f"{task_id}/{DRONELUME_FILE_NAME}", serialized, content_type="application/json"
            )
            metadata = {
                "mode": "dronelume",
                "source": parsed["source"],
                "file_name": DRONELUME_FILE_NAME,
                "deployed_at": datetime.now(timezone.utc).isoformat(),
            }
            self.storage_service.upload_to_service(
                f"{task_id}/dronelume_metadata.json",
                json.dumps(metadata, indent=2) + "\n",
                content_type="application/json",
            )
        except Exception as exc:
            print(
                f"Warning: DroneLume runtime configuration was deployed to {destination}, "
                f"but report archival failed: {exc}"
            )
        return destination
