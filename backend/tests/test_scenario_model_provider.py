import copy
import json
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PythonClient.multirotor.control.dronelume_config import (
    DRONELUME_TEMPLATE,
    get_dronelume_contract,
)
from PythonClient.multirotor.control.scenario_model_provider import (
    OllamaScenarioModelProvider,
    ScenarioProviderError,
)


class FakeResponse:
    def __init__(self, content, status_code=200):
        self.content = content
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise OSError(f"status {self.status_code}")

    def json(self):
        return {
            "model": "llama3.1",
            "message": {"content": self.content},
            "total_duration": 1_500_000_000,
            "prompt_eval_count": 100,
            "eval_count": 20,
        }


class FakeSession:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.last_request = None

    def post(self, url, **kwargs):
        self.last_request = {"url": url, **kwargs}
        if self.error:
            raise self.error
        if isinstance(self.response, list):
            return self.response.pop(0)
        return self.response


def encoded_response(status, message, questions=None, unsupported=None, init_dsl=None):
    return json.dumps({
        "status": status,
        "message": message,
        "questions": questions or [],
        "unsupported": unsupported or [],
        "init_dsl": init_dsl,
    })


class OllamaScenarioModelProviderTests(unittest.TestCase):
    contract = get_dronelume_contract()

    def provider_for(self, content):
        session = FakeSession(FakeResponse(content))
        return OllamaScenarioModelProvider(
            base_url="http://ollama.test:11434",
            model="llama3.1",
            timeout=3,
            session=session,
        ), session

    def test_incomplete_request_returns_focused_questions_without_dsl(self):
        provider, session = self.provider_for(encoded_response(
            "clarify",
            "I need the environment and actor details.",
            questions=["Which supported level type should be used?"],
        ))
        result = provider.generate([{"role": "user", "content": "Make a search scenario"}], self.contract)

        self.assertEqual(result.status, "clarify")
        self.assertIsNone(result.init_dsl)
        self.assertIn("catalog", session.last_request["json"]["messages"][0]["content"])
        self.assertEqual(session.last_request["json"]["format"]["type"], "object")

    def test_unsupported_request_is_retained_without_dsl(self):
        provider, _ = self.provider_for(encoded_response(
            "unsupported",
            "Teleporting is not supported.",
            unsupported=[{"request": "teleport", "reason": "Teleport is not in the action catalog"}],
        ))
        result = provider.generate([{"role": "user", "content": "Teleport the actor"}], self.contract)

        self.assertEqual(result.status, "unsupported")
        self.assertEqual(result.unsupported[0]["request"], "teleport")
        self.assertIsNone(result.init_dsl)

    def test_complete_dsl_is_validated_and_mission_owned_sut_is_removed(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["SuT"] = {
            "AssetName": "model-invented",
            "StartLocation": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
        }
        provider, _ = self.provider_for(encoded_response(
            "complete",
            "The scenario is ready.",
            init_dsl=document,
        ))
        result = provider.generate([{
            "role": "user",
            "content": (
                "Name it CompleteCase. Use a small urban level at 13:00 with clear "
                "weather intensity 1.0. Put the actor at 0,0,0 and use duration 1 second."
            ),
        }], self.contract)

        self.assertEqual(result.status, "complete")
        self.assertNotIn("SuT", result.init_dsl["Scenario"])
        self.assertEqual(result.provider_metadata["model"], "llama3.1")

    def test_invalid_complete_dsl_fails_deterministic_validation(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Level"]["type"] = "ocean"
        provider, _ = self.provider_for(encoded_response(
            "complete",
            "The scenario is ready.",
            init_dsl=document,
        ))
        with self.assertRaises(ScenarioProviderError) as raised:
            provider.generate([{
                "role": "user",
                "content": (
                    "Name it InvalidCase. Use a small urban level at 13:00 with clear "
                    "weather intensity 1.0. Put the actor at 0,0,0 and use duration 1 second."
                ),
            }], self.contract)

        self.assertEqual(raised.exception.code, "validation_failed")
        self.assertEqual(raised.exception.status_code, 422)
        self.assertTrue(raised.exception.details)

    def test_sparse_complete_request_keeps_supported_model_defaults(self):
        provider, _ = self.provider_for(encoded_response(
            "complete",
            "The scenario is ready.",
            init_dsl=copy.deepcopy(DRONELUME_TEMPLATE),
        ))
        result = provider.generate(
            [{"role": "user", "content": "Create an active shooter scenario in an urban area."}],
            self.contract,
        )

        self.assertEqual(result.status, "complete")
        self.assertIsNotNone(result.init_dsl)
        self.assertFalse(result.questions)

    def test_four_known_sparse_intents_fall_back_to_ready_baselines(self):
        cases = (
            ("Create an active shooter scene in a densely populated area.", "ActiveShooterBaseline", "ActiveShooter"),
            ("Create a maritime search and rescue mission for a drowning person.", "DrowningPersonBaseline", "Drowner"),
            ("Create a person wandering in the woods to simulate someone gone missing.", "MissingPersonBaseline", "MissingPerson"),
            ("Create a scene with a lot of people, four explicit and the rest procedural.", "ProceduralCrowdBaseline", "Civilian4"),
        )
        for prompt, expected_name, expected_actor in cases:
            with self.subTest(prompt=prompt):
                provider, session = self.provider_for(encoded_response(
                    "clarify",
                    "Please specify every setting.",
                    questions=["Which supported level size should be used?"],
                ))
                result = provider.generate([{"role": "user", "content": prompt}], self.contract)

                self.assertEqual(result.status, "complete")
                self.assertFalse(result.questions)
                self.assertEqual(result.init_dsl["Scenario"]["Metadata"]["name"], expected_name)
                self.assertIn(expected_actor, result.init_dsl["Scenario"]["Actors"]["Dynamic"])
                self.assertIn("Would you like any adjustments?", result.message)
                system_prompt = session.last_request["json"]["messages"][0]["content"]
                self.assertIn("Four fixture patterns are preferred baselines", system_prompt)

    def test_known_intent_replaces_invalid_complete_dsl_with_validated_baseline(self):
        document = copy.deepcopy(DRONELUME_TEMPLATE)
        document["Scenario"]["Actors"]["Dynamic"] = {
            "Shooter": {
                "AssetName": "GenericHumanAICharacter",
                "PawnIdentifier": "shooter",
                "location": {"Cartesian": True, "x": 0, "y": 0, "z": 0},
                "orientation": {"pitch": 0, "yaw": 0, "roll": 0},
                "behavior": [{
                    "action": "Attack",
                    "target": "nonexistent_civilian",
                    "duration": 10,
                    "stage_name": "shooting",
                    "trigger": "nonexistent_reaction",
                }],
            }
        }
        provider, _ = self.provider_for(encoded_response(
            "complete",
            "The active shooter scenario is ready.",
            init_dsl=document,
        ))

        result = provider.generate([{
            "role": "user",
            "content": "Create an active shooter scene in a densely populated area.",
        }], self.contract)

        self.assertEqual(result.status, "complete")
        self.assertEqual(result.init_dsl["Scenario"]["Metadata"]["name"], "ActiveShooterBaseline")
        self.assertIn("replaced it with the validated fixture baseline", result.message)

    def test_withdrawing_unsupported_drone_pursuit_allows_active_shooter_baseline(self):
        provider, _ = self.provider_for(encoded_response(
            "clarify",
            "Please specify every setting.",
            questions=["What should the scenario be named?"],
        ))
        result = provider.generate([
            {
                "role": "user",
                "content": "Create an active shooter scene and have the drone pursue the shooter.",
            },
            {
                "role": "assistant",
                "content": "Drone pursuit is unsupported, but the active shooter scene is supported.",
            },
            {"role": "user", "content": "Forget the drone pursuit. Construct the rest."},
        ], self.contract)

        self.assertEqual(result.status, "complete")
        self.assertEqual(result.init_dsl["Scenario"]["Metadata"]["name"], "ActiveShooterBaseline")

    def test_shooter_loiter_edits_apply_to_current_preview_dsl(self):
        baseline_provider, _ = self.provider_for(encoded_response(
            "clarify",
            "Please specify every setting.",
            questions=["Which supported level size should be used?"],
        ))
        baseline = baseline_provider.generate([{
            "role": "user",
            "content": "Create an active shooter scene in a densely populated area.",
        }], self.contract).init_dsl

        cases = (
            ("make the shooter's initial delay a bit longer", 20),
            ("make the shooter's intial loiter 30 sec", 30),
        )
        for request, expected_duration in cases:
            with self.subTest(request=request):
                provider, session = self.provider_for(encoded_response(
                    "unsupported",
                    "This response should not be used.",
                    unsupported=[{"request": "unused", "reason": "unused"}],
                ))
                result = provider.generate(
                    [{"role": "user", "content": request}],
                    self.contract,
                    baseline,
                )
                loiter = next(
                    behavior
                    for behavior in result.init_dsl["Scenario"]["Actors"]["Dynamic"]["ActiveShooter"]["behavior"]
                    if behavior["action"] == "Loiter"
                )

                self.assertEqual(result.status, "complete")
                self.assertEqual(loiter["duration"], expected_duration)
                self.assertIn("DSL preview now contains this change", result.message)
                self.assertIsNone(session.last_request)

    def test_current_preview_is_included_as_source_of_truth_for_model_edits(self):
        current = copy.deepcopy(DRONELUME_TEMPLATE)
        provider, session = self.provider_for(encoded_response(
            "complete",
            "Updated the current scenario.",
            init_dsl=copy.deepcopy(current),
        ))
        provider.generate(
            [{"role": "user", "content": "Rename the scenario."}],
            self.contract,
            current,
        )

        contexts = session.last_request["json"]["messages"]
        self.assertTrue(any("current validated DSL preview" in item["content"] for item in contexts))

    def test_clarification_during_edit_does_not_reset_authored_preview_to_baseline(self):
        baseline_provider, _ = self.provider_for(encoded_response(
            "clarify",
            "Please specify every setting.",
            questions=["Which supported level size should be used?"],
        ))
        baseline = baseline_provider.generate([{
            "role": "user",
            "content": "Create an active shooter scene in a densely populated area.",
        }], self.contract).init_dsl
        provider, _ = self.provider_for(encoded_response(
            "clarify",
            "I need one meaningful choice.",
            questions=["Which actor should change?"],
        ))

        result = provider.generate(
            [
                {"role": "user", "content": "Create an active shooter scene."},
                {"role": "assistant", "content": "The baseline is ready."},
                {"role": "user", "content": "Change that behavior."},
            ],
            self.contract,
            baseline,
        )

        self.assertEqual(result.status, "clarify")
        self.assertIsNone(result.init_dsl)
        self.assertEqual(result.questions, ("Which actor should change?",))

    def test_timeout_has_a_distinct_gateway_status(self):
        session = FakeSession(error=TimeoutError())
        provider = OllamaScenarioModelProvider(session=session, timeout=1)
        with self.assertRaises(ScenarioProviderError) as raised:
            provider.generate([{"role": "user", "content": "Build a scenario"}], self.contract)

        self.assertEqual(raised.exception.code, "timeout")
        self.assertEqual(raised.exception.status_code, 504)

    def test_malformed_model_json_is_rejected(self):
        session = FakeSession([FakeResponse("not-json"), FakeResponse("still-not-json")])
        provider = OllamaScenarioModelProvider(session=session, timeout=1)
        with self.assertRaises(ScenarioProviderError) as raised:
            provider.generate([{"role": "user", "content": "Build a scenario"}], self.contract)

        self.assertEqual(raised.exception.code, "malformed_output")

    def test_malformed_model_json_is_retried_once(self):
        session = FakeSession([
            FakeResponse("not-json"),
            FakeResponse(encoded_response(
                "clarify",
                "Please choose supported values.",
                questions=["Which supported level size should be used?"],
            )),
        ])
        provider = OllamaScenarioModelProvider(session=session, timeout=1)
        result = provider.generate(
            [{"role": "user", "content": "Use vague settings"}], self.contract
        )

        self.assertEqual(result.status, "clarify")

    def test_clarification_removes_starting_location_question(self):
        provider, _ = self.provider_for(encoded_response(
            "clarify",
            "I need more details.",
            questions=[
                "What should be the starting location of the shooter and civilians?",
                "Which supported level size should be used?",
            ],
        ))
        result = provider.generate(
            [{"role": "user", "content": "Name it Example and create an urban scenario."}],
            self.contract,
        )

        self.assertFalse(any("starting location" in question.lower() for question in result.questions))
        self.assertIn("closest example DSL", result.message)


if __name__ == "__main__":
    unittest.main()
