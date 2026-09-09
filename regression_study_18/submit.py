"""Explicitly submit one case or all 18 to DRV; record returned task IDs."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.request import Request, urlopen

from build_suite import HERE, sha, validate_pair


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--case", help="For example F_N_s2001")
    selection.add_argument("--all", action="store_true")
    parser.add_argument("--base-url", default="http://localhost:5000")
    args = parser.parse_args()
    manifest = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
    cases = [c for c in manifest["cases"] if args.all or c["case_id"] == args.case]
    if not cases:
        parser.error("Unknown case ID")
    prepared = []
    for case in cases:
        raw = (HERE / case["frontend_payload"]).read_bytes()
        dsl_raw = (HERE / case["init_dsl"]).read_bytes()
        if sha(raw) != case["sha256"]["frontend_payload"] or sha(dsl_raw) != case["sha256"]["init_dsl"]:
            raise ValueError(f"Hash mismatch: {case['case_id']}")
        validate_pair(json.loads(raw), json.loads(dsl_raw))
        prepared.append((case, raw))
    logs = HERE / "runs"
    logs.mkdir(exist_ok=True)
    receipt = logs / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S_%fZ") + ".jsonl")
    with receipt.open("x", encoding="utf-8") as handle:
        for case, raw in prepared:
            row = {"case_id": case["case_id"], "requested_at": datetime.now(timezone.utc).isoformat(),
                   "payload_sha256": sha(raw)}
            try:
                request = Request(args.base_url.rstrip("/") + "/addTask", data=raw,
                                  headers={"Content-Type": "application/json"}, method="POST")
                with urlopen(request, timeout=30) as response:
                    result = json.load(response)
                row["task_id"] = result["task_id"]
                row["recording_storage_path"] = f"reports/{row['task_id']}/{case['report_recording_relative_path']}"
                row["status"] = "queued"
            except Exception as error:
                row.update(status="submission_unconfirmed", error=str(error))
                handle.write(json.dumps(row) + "\n")
                handle.flush()
                raise RuntimeError(f"Submission unconfirmed for {case['case_id']}; inspect DRV before retrying. Receipt: {receipt}") from error
            handle.write(json.dumps(row) + "\n")
            handle.flush()
            print(f"{case['case_id']}: queued as {row['task_id']}")
    print(f"Submission receipts: {receipt}")
    print("Queued does not mean recorded successfully. Check each mission log and MP4 in report storage.")


if __name__ == "__main__":
    main()
