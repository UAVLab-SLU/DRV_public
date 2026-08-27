import argparse
import json
import os
from pathlib import Path
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PythonClient.multirotor.control.dronelume_config import get_dronelume_contract
from PythonClient.multirotor.control.scenario_model_provider import (
    ScenarioProviderError,
    get_scenario_model_provider,
)


def run(evaluation_path, provider_name):
    evaluation = json.loads(evaluation_path.read_text(encoding="utf-8"))
    provider = get_scenario_model_provider(provider_name)
    contract = get_dronelume_contract()
    results = []
    for case in evaluation["cases"]:
        started = time.perf_counter()
        try:
            response = provider.generate(case["messages"], contract)
            actual_status = response.status
            error = None
            metadata = response.provider_metadata
            guidance = {
                "message": response.message,
                "questions": list(response.questions),
                "unsupported": [dict(item) for item in response.unsupported],
            }
            passed = actual_status == case["expected_status"]
            if actual_status == "clarify":
                passed = passed and bool(response.questions)
            elif actual_status == "unsupported":
                passed = passed and bool(response.unsupported)
        except ScenarioProviderError as exc:
            actual_status = "error"
            error = {"code": exc.code, "message": str(exc), "details": getattr(exc, "details", None)}
            metadata = {}
            guidance = None
            passed = False
        elapsed_ms = round((time.perf_counter() - started) * 1000)
        results.append({
            "id": case["id"],
            "category": case["category"],
            "expected_status": case["expected_status"],
            "actual_status": actual_status,
            "passed": passed,
            "elapsed_ms": elapsed_ms,
            "provider": metadata,
            "guidance": guidance,
            "error": error,
        })
    return {
        "evaluation_version": evaluation["evaluation_version"],
        "provider": provider_name,
        "model": os.getenv("OLLAMA_MODEL", "llama3.1"),
        "passed": sum(result["passed"] for result in results),
        "total": len(results),
        "results": results,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--evaluation",
        type=Path,
        default=Path(__file__).with_name("dronelume_v1.json"),
    )
    parser.add_argument("--provider", default="ollama")
    args = parser.parse_args()
    report = run(args.evaluation, args.provider)
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report["passed"] == report["total"] else 1)
