import copy
import json
import os
import re
import socket
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import dataclass

from PythonClient.multirotor.control.dronelume_config import (
    DroneLumeValidationError,
    validate_init_dsl,
)

_JSON = json


PROVIDER_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "status": {"type": "string", "enum": ["clarify", "unsupported", "complete"]},
        "message": {"type": "string"},
        "questions": {"type": "array", "items": {"type": "string"}},
        "unsupported": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "request": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["request", "reason"],
            },
        },
        "init_dsl": {"type": ["object", "null"]},
    },
    "required": ["status", "message", "questions", "unsupported", "init_dsl"],
}


class ScenarioProviderError(RuntimeError):
    def __init__(self, message, code="provider_error", status_code=502):
        self.code = code
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class ScenarioModelResponse:
    status: str
    message: str
    questions: tuple
    unsupported: tuple
    init_dsl: dict | None
    provider_metadata: dict

    def to_dict(self):
        return {
            "status": self.status,
            "message": self.message,
            "questions": list(self.questions),
            "unsupported": [dict(item) for item in self.unsupported],
            "init_dsl": copy.deepcopy(self.init_dsl),
            "provider": dict(self.provider_metadata),
        }


class ScenarioModelProvider(ABC):
    @abstractmethod
    def generate(self, messages, contract, current_init_dsl=None):
        """Return a structured conversational update without compiling runtime artifacts."""


class _JsonHttpResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class _UrlLibSession:
    def post(self, url, json=None, timeout=None):
        request = urllib.request.Request(
            url,
            data=_JSON.dumps(json).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return _JsonHttpResponse(_JSON.loads(response.read().decode("utf-8")))


def _system_prompt(contract):
    knowledge = {
        "instructions": contract["llm_instructions"],
        "catalog": contract["catalog"],
        "template": contract["template"],
    }
    return f"""You are the guided DroneLume scenario author.

Your only supported world and action knowledge is the JSON contract below. Treat every catalog list as a strict allowlist. Do not invent assets, actions, parameters, fields, or capabilities.

Work conversationally because the user will often provide a high-level request:
1. Preserve facts from all conversation messages.
2. If the request needs unsupported actions or assets, return status \"unsupported\" and name each unsupported part. Do not silently substitute it.
3. When the user's intent is clear, choose sensible supported defaults for unspecified authoring details and return a nearly ready scenario immediately. Defaults may include the scenario name, objective, level settings, time, weather, actor placements, behavior durations, destinations, parameters, and procedural density. Summarize the choices in message and invite adjustments. Do not make the user configure every field through questions.
4. Return status \"clarify\" only when a missing choice would materially change the scenario intent, such as two plausible scenario types, an unknown target, or mutually incompatible requests. Ask the smallest possible number of focused questions.
5. Return status \"complete\" as soon as a valid baseline can represent the clear intent, even if the user did not specify every field. Return exactly one InitDSL object in init_dsl and use message to explain the baseline and ask whether they want adjustments.
6. Never author Scenario.SuT. The Mission step owns it.
7. Use relative Cartesian coordinates. Behavior targets refer to an existing dynamic actor by actor object key or PawnIdentifier. Attack and MoveToTarget require a valid target. MoveToLocation requires an x,y,z string.
8. Use empty arrays and objects when a supported section has no entries. Keep metadata factual and concise. Use ISO date only if the user supplied a date.
9. Treat each behavior entry as an atomic action and construct complex requests as a composite behavior graph. stage_name labels a behavior node. A nonempty trigger is a directed edge that invokes every behavior with a matching stage_name, including behaviors on other actors. Shared stage names intentionally support fan-out. Trigger cycles intentionally support repeating chains. Every nonempty trigger in generated DSL must resolve to at least one stage_name.

Decision rules:
- First map the user's natural-language scenario intent through catalog.fixture_patterns and catalog.action_intents. Scenario labels and real-world descriptions are not required to be literal action names. For example, active shooter and mass shooting are supported compositions using Attack, crowd actors, triggers, movement, and Flee.
- Decompose novel scenario intent into catalog atomic actions before deciding support. A composite is supported when its requested effects can be represented by those actions and valid stage-trigger transitions, even when the overall scenario name has never appeared in the catalog.
- Construct the stage-trigger graph deliberately: assign stage_name labels to destination behaviors, set the preceding behavior's trigger to that exact label, and use one shared label when several actors should react together. An empty trigger is terminal and emits no transition.
- Preserve actor keys, PawnIdentifier values, stage_name values, and trigger values exactly as supplied. Never rename one side of a target or trigger reference without renaming its matching declaration.
- Every action listed in catalog.fixture_patterns is supported. Reuse the named fixture's composition as guidance while constructing a new scenario from the user's details.
- Four fixture patterns are preferred baselines when their intent is recognized: InitDSL_ActiveShooter.json for an active shooter or mass shooting, InitDSL_Drown.json for maritime search and rescue involving a drowning person, InitDSL_Missing.json for a missing person wandering in woods, and InitDSL_PercCrowd.json for a large crowd. Start from these compositions and fill their demonstrated defaults instead of asking for routine settings.
- Only return unsupported after checking whether all requested behavior can be composed from supported fixture patterns, action intents, assets, and actions. Name only the remaining unrepresentable capability. Teleport, speak, drive, and swim remain unsupported because no fixture composition implements them.
- Never ask the user to confirm an unambiguous value already present in the conversation. Phrases such as \"medium urban level at 13:00\" explicitly supply size=medium, type=urban, and TimeOfDay=13:00.
- Do not ask the user for routine values that have safe supported defaults. When values are absent, prefer the closest fixture's name, objective, level, time, weather, placements, durations, destinations, parameters, and procedural settings. User-supplied values always take precedence.
- Do not require optional author, date, description, use-case, static actor, or procedural actor details. Empty values from the template are valid for those fields.
- A phrase such as \"no procedural actors other than Seed 1\" supplies Actors.Procedural={{\"Seed\":1}}. A phrase such as \"no static actors\" supplies Actors.Static={{}}.

For clarify or unsupported responses, init_dsl must be null. For complete responses, questions and unsupported must be empty.

DroneLume knowledge contract:
{json.dumps(knowledge, separators=(",", ":"), ensure_ascii=False)}
"""


def _behavior(action, duration=0, *, target="", order="", location="", parameters="", stage_name="", trigger=""):
    return {
        "action": action,
        "target": target,
        "duration": duration,
        "order": order,
        "location": location,
        "parameters": parameters,
        "stage_name": stage_name,
        "trigger": trigger,
    }


def _actor(asset_name, pawn_identifier, x, y, z=0, *, yaw=0, pitch=0, behavior=None):
    actor = {
        "AssetName": asset_name,
        "PawnIdentifier": pawn_identifier,
        "location": {"Cartesian": True, "x": x, "y": y, "z": z},
        "orientation": {"pitch": pitch, "yaw": yaw, "roll": 0},
    }
    if behavior:
        actor["behavior"] = behavior
    return actor


def _baseline_document(contract, name, objective, level, dynamic, procedural, static=None):
    document = copy.deepcopy(contract["template"])
    scenario = document["Scenario"]
    scenario["Metadata"].update({
        "name": name,
        "Description": f"Baseline generated from the {name} fixture pattern.",
        "UseCase": ["baseline"],
    })
    scenario["Goal"]["Objective"] = objective
    scenario["Level"] = level
    scenario["Actors"] = {
        "Static": static or {},
        "Dynamic": dynamic,
        "Procedural": procedural,
    }
    return document


def _scenario_baselines(contract):
    terrain = {
        "Terrain": {
            "AssetName": "terrain_flat",
            "location": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
            "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
        }
    }
    active_dynamic = {
        "ActiveShooter": _actor(
            "GenericHumanAICharacter", "shooter", 0, 0,
            behavior=[
                _behavior("SetMySpeed", 0.5, parameters="300.0", stage_name="set_shooter_speed"),
                _behavior("Loiter", 15, parameters="300.0", stage_name="prepare_for_attack"),
                _behavior("Attack", 15, target="Civilian1", stage_name="first_shooting", trigger="shots_fired_stage"),
                _behavior("MoveToLocation", 1, location="1600,800,0", parameters="100.0", stage_name="leave_scene"),
                _behavior("Flee", 10, parameters="800.0", stage_name="shooter_flee"),
            ],
        ),
        "Civilian1": _actor(
            "GenericHumanAICharacter", "civilian_1", 400, 300, yaw=180,
            behavior=[
                _behavior("SetMySpeed", 0.5, parameters="200.0", stage_name="set_civilian_speed"),
                _behavior("Loiter", 20, parameters="300.0", stage_name="normal_activity"),
                _behavior("SetMySpeed", 0.5, parameters="600.0", stage_name="shots_fired_stage", trigger="victim_flee"),
                _behavior("MoveToLocation", 1, location="2000,1500,0", parameters="100.0", stage_name="victim_flee"),
            ],
        ),
        "TriggerReceiver1": _actor(
            "GenericHumanAICharacter", "receiver_1", 1000, 1000,
            behavior=[
                _behavior("Idle", 30, stage_name="waiting_for_alarm"),
                _behavior("Flee", 10, order="A", parameters="800.0", stage_name="shots_fired_stage"),
            ],
        ),
        "TriggerReceiver2": _actor(
            "GenericHumanAICharacter", "receiver_2", 1000, -1000,
            behavior=[
                _behavior("Idle", 30, stage_name="waiting_for_alarm"),
                _behavior("Flee", 10, order="A", parameters="800.0", stage_name="shots_fired_stage"),
            ],
        ),
    }
    active = _baseline_document(
        contract,
        "ActiveShooterBaseline",
        "Simulate an active shooter attacking a civilian and fleeing while nearby civilians react",
        {"size": "medium", "type": "urban", "TimeOfDay": "10:00", "Weather": {"type": "clear", "intensity": 0}},
        active_dynamic,
        {
            "Seed": 651985,
            "Buildings": {"AssetName": "PCG_building_default", "density": 0.9},
            "Crowd": {"AssetName": "PCG_ped_crowd_1", "density": 0.9},
        },
        terrain,
    )
    drowning = _baseline_document(
        contract,
        "DrowningPersonBaseline",
        "Locate a drowning person during a maritime search and rescue mission",
        {"size": "medium", "type": "woods", "TimeOfDay": "13:00", "Weather": {"type": "fog", "intensity": 0.1}},
        {"Drowner": _actor("BP_BuoyancyDrowner", "drowning_person", -128, -3407, pitch=90)},
        {
            "Seed": 1,
            "Tree": {"AssetName": "PCG_tree_default", "density": 0.2},
            "Grass": {"AssetName": "PCG_grass_default", "density": 0.2},
        },
    )
    missing = _baseline_document(
        contract,
        "MissingPersonBaseline",
        "Locate a missing person wandering in the woods",
        {"size": "medium", "type": "woods", "TimeOfDay": "15:00", "Weather": {"type": "rain", "intensity": 0.7}},
        {"MissingPerson": _actor("BP_MissingAICharacter", "missing_person", 1064, 6092)},
        {
            "Seed": 123456789,
            "Tree": {"AssetName": "PCG_tree_default", "density": 0.5},
            "Grass": {"AssetName": "PCG_grass_default", "density": 0.2},
        },
    )
    crowd_dynamic = {}
    for index, (x, y, yaw) in enumerate(
        ((1000, 1000, 0), (1100, 1100, 180), (1200, 1200, 0), (1300, 1000, 0)),
        start=1,
    ):
        crowd_dynamic[f"Civilian{index}"] = _actor(
            "GenericHumanAICharacter", f"civilian_{index}", x, y, yaw=yaw,
            behavior=[
                _behavior("SetMySpeed", 0.5, parameters="600.0", stage_name="set_speed"),
                _behavior("Loiter", 20, parameters="300.0", stage_name="normal_activity"),
            ],
        )
    crowd = _baseline_document(
        contract,
        "ProceduralCrowdBaseline",
        "Populate an urban area with four explicit pedestrians and a larger procedural crowd",
        {"size": "medium", "type": "urban", "TimeOfDay": "16:00", "Weather": {"type": "fog", "intensity": 0.1}},
        crowd_dynamic,
        {
            "Seed": 651985,
            "Buildings": {"AssetName": "PCG_building_default", "density": 0.5},
            "Crowd": {"AssetName": "PCG_ped_crowd_1", "density": 0.3},
            "Grass": {"AssetName": "PCG_grass_default", "density": 0.2},
        },
        terrain,
    )
    return {
        "active_shooter": active,
        "drowning_person": drowning,
        "missing_person": missing,
        "procedural_crowd": crowd,
    }


_BASELINE_SUMMARIES = {
    "active_shooter": "I prepared the active-shooter baseline: a medium urban scene with a shooter, three explicit civilians, a dense procedural crowd, a shots-fired reaction, civilian flight, and the shooter leaving the scene.",
    "drowning_person": "I prepared the drowning-person baseline: a foggy medium search area with a BP_BuoyancyDrowner target and light procedural vegetation.",
    "missing_person": "I prepared the missing-person baseline: a rainy medium wooded scene with a BP_MissingAICharacter target among procedural trees and grass.",
    "procedural_crowd": "I prepared the procedural-crowd baseline: a medium urban scene with four explicit loitering civilians plus procedurally populated buildings, pedestrians, and grass.",
}


def _recognized_baseline_intent(messages):
    text = " ".join(message["content"] for message in messages if message["role"] == "user").lower()
    specific = []
    if re.search(r"\b(active shooter|mass shooting|gunman|shooting)\b", text):
        specific.append("active_shooter")
    if re.search(r"\b(drowning|drowner|water rescue|maritime|marine[- ]time)\b", text):
        specific.append("drowning_person")
    if re.search(r"\b(missing person|gone missing|lost person)\b", text) or (
        re.search(r"\b(wander|wandering|lost)\b", text) and re.search(r"\b(woods|forest)\b", text)
    ):
        specific.append("missing_person")
    if len(set(specific)) == 1:
        return specific[0]
    if specific:
        return None
    if re.search(r"\b(crowd|many people|many pedestrians|a lot of people|densely populated)\b", text):
        return "procedural_crowd"
    return None


def _baseline_response(intent, contract):
    return {
        "status": "complete",
        "message": _BASELINE_SUMMARIES[intent] + " The DSL is ready to use. Would you like any adjustments?",
        "questions": [],
        "unsupported": [],
        "init_dsl": _scenario_baselines(contract)[intent],
    }


def _validate_current_dsl(value):
    if value is None:
        return None
    document = copy.deepcopy(value)
    scenario = document.get("Scenario") if isinstance(document, dict) else None
    if isinstance(scenario, dict):
        scenario.pop("SuT", None)
    try:
        return validate_init_dsl(document)
    except DroneLumeValidationError as exc:
        error = ScenarioProviderError(
            "The current DSL preview must be valid before the assistant can edit it",
            "invalid_current_dsl",
            400,
        )
        error.details = exc.errors
        raise error from exc


def _has_authored_content(document):
    if not document:
        return False
    scenario = document.get("Scenario", {})
    actors = scenario.get("Actors", {})
    procedural = actors.get("Procedural", {})
    return bool(
        actors.get("Static")
        or actors.get("Dynamic")
        or any(key != "Seed" for key in procedural)
        or scenario.get("Goal", {}).get("Objective")
    )


def _deterministic_current_dsl_edit(messages, current_document):
    if not current_document:
        return None
    latest = next(
        (message["content"] for message in reversed(messages) if message["role"] == "user"),
        "",
    )
    lowered = latest.lower()
    if not (
        "shooter" in lowered
        and any(term in lowered for term in ("delay", "loiter", "wait"))
        and (
            "longer" in lowered
            or re.search(r"\d+(?:\.\d+)?\s*(?:sec|secs|second|seconds)\b", lowered)
        )
    ):
        return None

    document = copy.deepcopy(current_document)
    dynamic = document["Scenario"]["Actors"].get("Dynamic", {})
    shooter = next(
        (
            actor
            for actor_id, actor in dynamic.items()
            if "shooter" in actor_id.lower()
            or "shooter" in str(actor.get("PawnIdentifier", "")).lower()
        ),
        None,
    )
    if not shooter:
        return None
    loiter = next(
        (
            behavior
            for behavior in shooter.get("behavior", [])
            if isinstance(behavior, dict) and behavior.get("action") == "Loiter"
        ),
        None,
    )
    if not loiter:
        return None

    old_duration = loiter.get("duration", 0)
    explicit = re.search(r"(\d+(?:\.\d+)?)\s*(?:sec|secs|second|seconds)\b", lowered)
    if explicit:
        new_duration = float(explicit.group(1))
        if new_duration.is_integer():
            new_duration = int(new_duration)
    else:
        new_duration = old_duration + 5
    loiter["duration"] = new_duration
    return {
        "status": "complete",
        "message": (
            f"Updated the shooter's initial loiter from {old_duration} seconds to "
            f"{new_duration} seconds. The DSL preview now contains this change."
        ),
        "questions": [],
        "unsupported": [],
        "init_dsl": document,
    }


def _knowledge_examples(contract):
    document = copy.deepcopy(contract["template"])
    scenario = document["Scenario"]
    scenario["Metadata"]["name"] = "ExampleMove"
    scenario["Goal"]["Objective"] = "Observe a person walking to a point"
    scenario["Level"] = {
        "size": "medium",
        "type": "urban",
        "TimeOfDay": "13:00",
        "Weather": {"type": "clear", "intensity": 1.0},
    }
    scenario["Actors"] = {
        "Static": {},
        "Dynamic": {
            "Walker": {
                "AssetName": "GenericHumanAICharacter",
                "PawnIdentifier": "walker",
                "location": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
                "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
                "behavior": [
                    {
                        "action": "MoveToLocation",
                        "target": "",
                        "duration": 0,
                        "order": "Sequential",
                        "location": "100,200,0",
                        "parameters": "100.0",
                        "stage_name": "walk_to_point",
                        "trigger": "",
                    }
                ],
            }
        },
        "Procedural": {"Seed": 1},
    }
    request = (
        "Knowledge example: Create ExampleMove to observe a person walking to a point. "
        "Use a medium urban level at 13:00, clear weather intensity 1.0. Put one "
        "GenericHumanAICharacter named Walker with pawn walker at Cartesian 0,0,0 and "
        "zero orientation. Move it sequentially to 100,200,0 with parameter 100.0, "
        "duration 0, and stage walk_to_point. Use no static actors and procedural Seed 1."
    )
    response = {
        "status": "complete",
        "message": "The supported scenario is complete.",
        "questions": [],
        "unsupported": [],
        "init_dsl": document,
    }
    unsupported_response = {
        "status": "unsupported",
        "message": "Teleport is outside the current action catalog.",
        "questions": [],
        "unsupported": [
            {"request": "teleport", "reason": "Teleport is not in catalog.actions"}
        ],
        "init_dsl": None,
    }
    composite_document = copy.deepcopy(contract["template"])
    composite_scenario = composite_document["Scenario"]
    composite_scenario["Metadata"]["name"] = "TriggerFanout"
    composite_scenario["Goal"]["Objective"] = "Observe a coordinated reaction"
    composite_scenario["Level"] = {
        "size": "medium",
        "type": "urban",
        "TimeOfDay": "15:00",
        "Weather": {"type": "clear", "intensity": 1.0},
    }

    def example_actor(pawn_identifier, x, y, behavior):
        return {
            "AssetName": "GenericHumanAICharacter",
            "PawnIdentifier": pawn_identifier,
            "location": {"Cartesian": True, "x": x, "y": y, "z": 0},
            "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
            "behavior": behavior,
        }

    composite_scenario["Actors"] = {
        "Static": {},
        "Dynamic": {
            "Sender": example_actor(
                "sender",
                0,
                0,
                [{
                    "action": "Attack",
                    "target": "Receiver1",
                    "duration": 2,
                    "order": "",
                    "location": "",
                    "parameters": "",
                    "stage_name": "attack",
                    "trigger": "react_now",
                }],
            ),
            "Receiver1": example_actor(
                "receiver_1",
                300,
                0,
                [{
                    "action": "Flee",
                    "target": "",
                    "duration": 5,
                    "order": "",
                    "location": "",
                    "parameters": "800.0",
                    "stage_name": "react_now",
                    "trigger": "",
                }],
            ),
            "Receiver2": example_actor(
                "receiver_2",
                300,
                200,
                [{
                    "action": "Flee",
                    "target": "",
                    "duration": 5,
                    "order": "",
                    "location": "",
                    "parameters": "800.0",
                    "stage_name": "react_now",
                    "trigger": "",
                }],
            ),
        },
        "Procedural": {"Seed": 1},
    }
    composite_response = {
        "status": "complete",
        "message": "The composite trigger fan-out is complete.",
        "questions": [],
        "unsupported": [],
        "init_dsl": composite_document,
    }
    return [
        {
            "role": "user",
            "content": "Knowledge example: Create a person who teleports behind another person.",
        },
        {
            "role": "assistant",
            "content": json.dumps(unsupported_response, separators=(",", ":")),
        },
        {"role": "user", "content": request},
        {"role": "assistant", "content": json.dumps(response, separators=(",", ":"))},
        {
            "role": "user",
            "content": (
                "Knowledge example: Name it TriggerFanout. In a medium urban level at "
                "15:00 with clear weather intensity 1.0, Sender attacks Receiver1 for 2 "
                "seconds and triggers react_now. Receiver1 and Receiver2 both have Flee "
                "behaviors labeled react_now for 5 seconds with parameter 800.0, so the "
                "trigger fans out to both actors. Their positions are 0,0,0, 300,0,0, and "
                "300,200,0 with zero orientations. Use procedural Seed 1."
            ),
        },
        {
            "role": "assistant",
            "content": json.dumps(composite_response, separators=(",", ":")),
        },
    ]


def _normalize_messages(messages):
    if not isinstance(messages, list) or not messages:
        raise ScenarioProviderError("At least one conversation message is required", "invalid_request", 400)
    if len(messages) > 20:
        raise ScenarioProviderError("Conversation is limited to 20 messages", "invalid_request", 400)

    normalized = []
    total_length = 0
    for message in messages:
        if not isinstance(message, dict) or message.get("role") not in ("user", "assistant"):
            raise ScenarioProviderError("Each message must have a user or assistant role", "invalid_request", 400)
        content = message.get("content")
        if not isinstance(content, str) or not content.strip():
            raise ScenarioProviderError("Each message must contain text", "invalid_request", 400)
        total_length += len(content)
        normalized.append({"role": message["role"], "content": content.strip()})
    if total_length > 24000:
        raise ScenarioProviderError("Conversation is limited to 24,000 characters", "invalid_request", 400)
    return normalized


def _apply_clarification_policy(value, messages):
    if value.get("status") != "clarify":
        return value

    adjusted = copy.deepcopy(value)
    excluded_question_phrases = (
        "starting location",
        "where should the shooter and civilians start",
        "where should each explicit actor start",
        "x,y,z coordinate",
        "any static actors",
        "procedural actors other than seed",
    )
    questions = [
        question
        for question in adjusted.get("questions", [])
        if not any(phrase in question.lower() for phrase in excluded_question_phrases)
    ]
    adjusted["questions"] = questions

    user_text = " ".join(
        message["content"] for message in messages if message["role"] == "user"
    )
    has_user_coordinates = bool(re.search(
        r"-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?",
        user_text,
    ))
    if not has_user_coordinates and "closest example dsl" not in adjusted["message"].lower():
        adjusted["message"] = (
            adjusted["message"].rstrip()
            + " I will use actor placements demonstrated in the closest example DSL."
        )
    return adjusted


def _normalize_provider_response(value, metadata):
    if not isinstance(value, dict):
        raise ScenarioProviderError("The model returned a non-object response", "malformed_output")

    status = value.get("status")
    if status not in ("clarify", "unsupported", "complete"):
        raise ScenarioProviderError("The model returned an unknown status", "malformed_output")
    message = value.get("message")
    questions = value.get("questions", [])
    unsupported = value.get("unsupported", [])
    document = value.get("init_dsl")
    if not isinstance(message, str) or not message.strip() or not isinstance(questions, list) or not isinstance(unsupported, list):
        raise ScenarioProviderError("The model returned malformed guidance fields", "malformed_output")
    if not all(isinstance(question, str) and question.strip() for question in questions):
        raise ScenarioProviderError("The model returned a malformed clarification question", "malformed_output")
    if status == "clarify" and not questions:
        raise ScenarioProviderError("A clarification response did not include questions", "malformed_output")
    if status == "unsupported" and not unsupported:
        raise ScenarioProviderError("An unsupported response did not identify the unsupported request", "malformed_output")

    if status == "complete":
        if not isinstance(document, dict):
            raise ScenarioProviderError("A complete response did not include InitDSL", "malformed_output")
        document = copy.deepcopy(document)
        scenario = document.get("Scenario")
        if isinstance(scenario, dict):
            scenario.pop("SuT", None)
        try:
            document = validate_init_dsl(document)
        except DroneLumeValidationError as exc:
            error = ScenarioProviderError(
                "The model produced InitDSL that failed deterministic validation",
                "validation_failed",
                422,
            )
            error.details = exc.errors
            raise error from exc
        if questions or unsupported:
            raise ScenarioProviderError("A complete response included unresolved guidance", "malformed_output")
    else:
        document = None

    normalized_unsupported = []
    for item in unsupported:
        if not isinstance(item, dict) or not isinstance(item.get("request"), str) or not isinstance(item.get("reason"), str):
            raise ScenarioProviderError("The model returned a malformed unsupported item", "malformed_output")
        normalized_unsupported.append({"request": item["request"], "reason": item["reason"]})

    return ScenarioModelResponse(
        status=status,
        message=message,
        questions=tuple(str(question) for question in questions),
        unsupported=tuple(normalized_unsupported),
        init_dsl=document,
        provider_metadata=metadata,
    )


class OllamaScenarioModelProvider(ScenarioModelProvider):
    def __init__(self, base_url=None, model=None, timeout=None, session=None):
        self.base_url = (base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.1")
        self.timeout = float(timeout or os.getenv("OLLAMA_TIMEOUT_SECONDS", "90"))
        self.num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
        self.num_predict = int(os.getenv("OLLAMA_NUM_PREDICT", "4096"))
        self.session = session or _UrlLibSession()

    def generate(self, messages, contract, current_init_dsl=None):
        normalized_messages = _normalize_messages(messages)
        current_document = _validate_current_dsl(current_init_dsl)
        deterministic_edit = _deterministic_current_dsl_edit(
            normalized_messages, current_document
        )
        if deterministic_edit:
            metadata = {
                "name": "deterministic",
                "model": self.model,
                "contract_version": contract.get("contract_version"),
                "catalog_version": contract.get("catalog", {}).get("catalog_version"),
                "duration_ms": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
            }
            return _normalize_provider_response(deterministic_edit, metadata)
        current_context = []
        if current_document:
            current_context.append({
                "role": "system",
                "content": (
                    "The JSON below is the current validated DSL preview and is the source of "
                    "truth for this turn. Apply the user's latest requested changes to this "
                    "document, preserve everything they did not ask to change, and return the "
                    "entire updated InitDSL object.\nCurrent InitDSL:\n"
                    + json.dumps(current_document, separators=(",", ":"), ensure_ascii=False)
                ),
            })
        payload = {
            "model": self.model,
            "stream": False,
            "format": PROVIDER_RESPONSE_SCHEMA,
            "messages": [
                {"role": "system", "content": _system_prompt(contract)},
                *_knowledge_examples(contract),
                *current_context,
                *normalized_messages,
            ],
            "options": {
                "temperature": 0,
                "num_ctx": self.num_ctx,
                "num_predict": self.num_predict,
            },
            "keep_alive": os.getenv("OLLAMA_KEEP_ALIVE", "5m"),
        }
        try:
            response = self.session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
        except (TimeoutError, socket.timeout) as exc:
            raise ScenarioProviderError("Ollama timed out", "timeout", 504) from exc
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
            raise ScenarioProviderError("Ollama is unavailable", "provider_unavailable", 503) from exc

        try:
            response_payload = response.json()
            value = json.loads(response_payload["message"]["content"])
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            retry_payload = copy.deepcopy(payload)
            retry_payload["messages"].append({
                "role": "user",
                "content": (
                    "Your previous response was not valid JSON. Retry once. Return only one "
                    "JSON object that exactly matches the required response schema. If any "
                    "user value is vague or outside an allowlist, return clarify with focused "
                    "questions only when the missing choice would materially change the intent. "
                    "Otherwise choose supported fixture-based defaults and return a complete baseline."
                ),
            })
            try:
                response = self.session.post(
                    f"{self.base_url}/api/chat",
                    json=retry_payload,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                response_payload = response.json()
                value = json.loads(response_payload["message"]["content"])
            except (TimeoutError, socket.timeout) as exc:
                raise ScenarioProviderError("Ollama timed out", "timeout", 504) from exc
            except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                raise ScenarioProviderError("Ollama is unavailable", "provider_unavailable", 503) from exc
            except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
                raise ScenarioProviderError(
                    "Ollama returned malformed JSON after one automatic retry",
                    "malformed_output",
                ) from exc

        metadata = {
            "name": "ollama",
            "model": response_payload.get("model", self.model),
            "contract_version": contract.get("contract_version"),
            "catalog_version": contract.get("catalog", {}).get("catalog_version"),
            "duration_ms": round(response_payload.get("total_duration", 0) / 1_000_000),
            "prompt_tokens": response_payload.get("prompt_eval_count"),
            "completion_tokens": response_payload.get("eval_count"),
        }
        baseline_intent = _recognized_baseline_intent(normalized_messages)
        if (
            value.get("status") == "clarify"
            and baseline_intent
            and not _has_authored_content(current_document)
        ):
            value = _baseline_response(baseline_intent, contract)
        else:
            value = _apply_clarification_policy(value, normalized_messages)
        try:
            return _normalize_provider_response(value, metadata)
        except ScenarioProviderError as exc:
            if exc.code != "validation_failed" or not baseline_intent:
                raise
            if _has_authored_content(current_document):
                preserved = {
                    "status": "clarify",
                    "message": (
                        "I could not safely apply that edit because the generated revision was "
                        "invalid. I kept the current DSL preview unchanged."
                    ),
                    "questions": ["Could you restate the requested DSL change more specifically?"],
                    "unsupported": [],
                    "init_dsl": None,
                }
                return _normalize_provider_response(preserved, metadata)
            baseline = _baseline_response(baseline_intent, contract)
            baseline["message"] = (
                "The generated draft contained invalid actor references, so I replaced it "
                "with the validated fixture baseline. " + baseline["message"]
            )
            return _normalize_provider_response(baseline, metadata)


def get_scenario_model_provider(name=None):
    provider_name = (name or os.getenv("SCENARIO_MODEL_PROVIDER", "ollama")).lower()
    if provider_name == "ollama":
        return OllamaScenarioModelProvider()
    raise ScenarioProviderError(
        f"Unknown scenario model provider: {provider_name}",
        "unknown_provider",
        400,
    )
