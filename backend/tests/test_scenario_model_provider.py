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

    def test_sparse_request_cannot_be_completed_with_model_invented_defaults(self):
        provider, _ = self.provider_for(encoded_response(
            "complete",
            "The scenario is ready.",
            init_dsl=copy.deepcopy(DRONELUME_TEMPLATE),
        ))
        result = provider.generate(
            [{"role": "user", "content": "Create an active shooter scenario in an urban area."}],
            self.contract,
        )

        self.assertEqual(result.status, "clarify")
        self.assertIsNone(result.init_dsl)
        self.assertTrue(result.questions)
        self.assertFalse(any("coordinate" in question.lower() for question in result.questions))
        self.assertIn("example DSL", result.message)

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
