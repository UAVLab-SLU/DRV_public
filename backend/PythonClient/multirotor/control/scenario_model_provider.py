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
    def generate(self, messages, contract):
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

Work conversationally because the user will often provide an incomplete request:
1. Preserve facts from all conversation messages.
2. If the request needs unsupported actions or assets, return status \"unsupported\" and name each unsupported part. Do not silently substitute it.
3. If required scenario choices are missing or ambiguous, return status \"clarify\" and ask a short, focused set of questions. Do not choose values for the user, except for actor starting locations as described below. Required choices include the objective, level size/type, time, weather, actor types, and every requested actor behavior's supported action, duration, target or destination, and parameter when applicable.
4. Return status \"complete\" only when the conversation contains enough information to construct the requested scenario. Then return exactly one InitDSL object in init_dsl.
5. Never author Scenario.SuT. The Mission step owns it.
6. Use relative Cartesian coordinates. Behavior targets refer to an existing dynamic actor by actor object key or PawnIdentifier. Attack and MoveToTarget require a valid target. MoveToLocation requires an x,y,z string.
7. Use empty arrays and objects when a supported section has no entries. Keep metadata factual and concise. Use ISO date only if the user supplied a date.
8. Treat each behavior entry as an atomic action and construct complex requests as a composite behavior graph. stage_name labels a behavior node. A nonempty trigger is a directed edge that invokes every behavior with a matching stage_name, including behaviors on other actors. Shared stage names intentionally support fan-out. Trigger cycles intentionally support repeating chains. Every nonempty trigger in generated DSL must resolve to at least one stage_name.

Decision rules:
- First map the user's natural-language scenario intent through catalog.fixture_patterns and catalog.action_intents. Scenario labels and real-world descriptions are not required to be literal action names. For example, active shooter and mass shooting are supported compositions using Attack, crowd actors, triggers, movement, and Flee.
- Decompose novel scenario intent into catalog atomic actions before deciding support. A composite is supported when its requested effects can be represented by those actions and valid stage-trigger transitions, even when the overall scenario name has never appeared in the catalog.
- Construct the stage-trigger graph deliberately: assign stage_name labels to destination behaviors, set the preceding behavior's trigger to that exact label, and use one shared label when several actors should react together. An empty trigger is terminal and emits no transition.
- Preserve actor keys, PawnIdentifier values, stage_name values, and trigger values exactly as supplied. Never rename one side of a target or trigger reference without renaming its matching declaration.
- Every action listed in catalog.fixture_patterns is supported. Reuse the named fixture's composition as guidance while constructing a new scenario from the user's details.
- Only return unsupported after checking whether all requested behavior can be composed from supported fixture patterns, action intents, assets, and actions. Name only the remaining unrepresentable capability. Teleport, speak, drive, and swim remain unsupported because no fixture composition implements them.
- Never ask the user to confirm an unambiguous value already present in the conversation. Phrases such as \"medium urban level at 13:00\" explicitly supply size=medium, type=urban, and TimeOfDay=13:00.
- Do not ask the user for actor starting x,y,z coordinates. When starting locations are absent, select relative Cartesian actor placements demonstrated in the closest example DSL and clearly state that choice in the response message. User-supplied coordinates always take precedence. This exception applies only to starting placement, not requested movement destinations.
- Do not require optional author, date, description, use-case, static actor, or procedural actor details. Empty values from the template are valid for those fields.
- A phrase such as \"no procedural actors other than Seed 1\" supplies Actors.Procedural={{\"Seed\":1}}. A phrase such as \"no static actors\" supplies Actors.Static={{}}.

For clarify or unsupported responses, init_dsl must be null. For complete responses, questions and unsupported must be empty.

DroneLume knowledge contract:
{json.dumps(knowledge, separators=(",", ":"), ensure_ascii=False)}
"""


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
    active_shooter_response = {
        "status": "clarify",
        "message": (
            "An urban active-shooter scenario with many pedestrians is supported by "
            "InitDSL_ActiveShooter.json and InitDSL_PercCrowd.json using Attack, Loiter, "
            "triggers, movement, and Flee. I will use actor placements demonstrated "
            "in the closest example DSL."
        ),
        "questions": [
            "How many explicit civilian actors or what procedural crowd density should be used?",
            "How long should the shooter loiter before attacking, and how long should the attack last?",
            "Should civilians flee when the shots-fired trigger occurs, and where should they move?",
            "Which supported level size, time, weather, and intensity should be used?",
        ],
        "unsupported": [],
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
        {
            "role": "user",
            "content": (
                "Knowledge example: Build a scenario where an active shooter commits a mass "
                "shooting in an urban environment with many pedestrians."
            ),
        },
        {
            "role": "assistant",
            "content": json.dumps(active_shooter_response, separators=(",", ":")),
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


def _missing_completion_evidence(messages, contract):
    """Require user-supplied evidence for fields the model must not silently default."""
    text = " ".join(
        message["content"] for message in messages if message["role"] == "user"
    ).lower()
    catalog = contract["catalog"]
    checks = [
        (
            not re.search(
                r"\b(?:name it|named|scenario named|scenario be named)\b[?:\s]+[a-z0-9_-]+",
                text,
            ),
            "What should the scenario be named?",
        ),
        (
            not any(re.search(rf"\b{re.escape(str(value).lower())}\b", text) for value in catalog["level_sizes"]),
            "Which supported level size should be used?",
        ),
        (
            not any(re.search(rf"\b{re.escape(str(value).lower())}\b", text) for value in catalog["level_types"]),
            "Which supported level type should be used?",
        ),
        (
            not re.search(r"\b\d{1,2}:\d{2}\b", text),
            "Which supported time of day should be used?",
        ),
        (
            not (
                any(re.search(rf"\b{re.escape(str(value).lower())}\b", text) for value in catalog["weather_types"])
                and re.search(r"\bintensity\b[^.]{0,20}\d+(?:\.\d+)?", text)
            ),
            "Which supported weather type and intensity should be used?",
        ),
        (
            not re.search(r"\b(?:duration|second|seconds|last(?:s|ing)?(?:\s+for)?)\b[^.]{0,30}\d", text),
            "What duration should each requested behavior use?",
        ),
    ]
    return [question for missing, question in checks if missing]


def _apply_clarification_policy(value, messages, contract):
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
    existing = {question.lower() for question in questions}
    for question in _missing_completion_evidence(messages, contract):
        if question.lower() not in existing:
            questions.append(question)
            existing.add(question.lower())
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

    def generate(self, messages, contract):
        normalized_messages = _normalize_messages(messages)
        payload = {
            "model": self.model,
            "stream": False,
            "format": PROVIDER_RESPONSE_SCHEMA,
            "messages": [
                {"role": "system", "content": _system_prompt(contract)},
                *_knowledge_examples(contract),
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
                    "questions instead of guessing."
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
        if value.get("status") == "complete":
            missing_questions = _missing_completion_evidence(normalized_messages, contract)
            if missing_questions:
                user_text = " ".join(
                    message["content"]
                    for message in normalized_messages
                    if message["role"] == "user"
                )
                has_user_coordinates = bool(re.search(
                    r"-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?",
                    user_text,
                ))
                placement_note = (
                    " I will use actor placements demonstrated in the closest example DSL."
                    if not has_user_coordinates
                    else ""
                )
                value = {
                    "status": "clarify",
                    "message": (
                        "This scenario can be composed from supported DroneLume actions, "
                        "but I need the remaining authoring details before constructing it."
                        + placement_note
                    ),
                    "questions": missing_questions,
                    "unsupported": [],
                    "init_dsl": None,
                }
        value = _apply_clarification_policy(value, normalized_messages, contract)
        return _normalize_provider_response(value, metadata)


def get_scenario_model_provider(name=None):
    provider_name = (name or os.getenv("SCENARIO_MODEL_PROVIDER", "ollama")).lower()
    if provider_name == "ollama":
        return OllamaScenarioModelProvider()
    raise ScenarioProviderError(
        f"Unknown scenario model provider: {provider_name}",
        "unknown_provider",
        400,
    )
