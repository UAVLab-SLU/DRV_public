# DRV regression study: 18 mission and scenario pairs

This directory contains **18 complete frontend request payloads and 18 matching runtime InitDSL documents**. They use the three new recorded missions and the active protocol scope: forest, water and triggered crowd, nominal/stress conditions, seeds 2001, 2002 and 2003. No simulation has been submitted by preparing these files.

Each `cases/<case_id>/` directory contains:

- `frontend_payload.json`: the complete JSON body for DRV's `POST /addTask`, in the same envelope used by `HorizontalLinearStepper.jsx`. It includes the drone, mission, camera settings and embedded scene.
- `InitDSL.json`: the complete matching document after the backend derives `Scenario.SuT` from the payload's drone. This is the file the backend deploys to Unreal. It is not a second task to submit.

The payload's embedded DSL omits `SuT` intentionally. The backend owns that field. The standalone file includes exactly the derived value; it is verified against `extract_dronelume_request`.

## Run matrix

| Family / condition | Case directories | Factor value | Mission |
| --- | --- | --- | --- |
| Forest nominal | [F_N_s2001](cases/F_N_s2001/frontend_payload.json), [F_N_s2002](cases/F_N_s2002/frontend_payload.json), [F_N_s2003](cases/F_N_s2003/frontend_payload.json) | Rain 0.0 | Missing Person Search and Rescue |
| Forest stress | [F_A_s2001](cases/F_A_s2001/frontend_payload.json), [F_A_s2002](cases/F_A_s2002/frontend_payload.json), [F_A_s2003](cases/F_A_s2003/frontend_payload.json) | Rain 0.7 | Missing Person Search and Rescue |
| Water nominal | [W_N_s2001](cases/W_N_s2001/frontend_payload.json), [W_N_s2002](cases/W_N_s2002/frontend_payload.json), [W_N_s2003](cases/W_N_s2003/frontend_payload.json) | Fog 0.0 | River Search and Rescue |
| Water stress | [W_A_s2001](cases/W_A_s2001/frontend_payload.json), [W_A_s2002](cases/W_A_s2002/frontend_payload.json), [W_A_s2003](cases/W_A_s2003/frontend_payload.json) | Fog 0.7 | River Search and Rescue |
| Triggered crowd nominal | [T_N_s2001](cases/T_N_s2001/frontend_payload.json), [T_N_s2002](cases/T_N_s2002/frontend_payload.json), [T_N_s2003](cases/T_N_s2003/frontend_payload.json) | Crowd density 0.1 | Active Shooter Surveillance |
| Triggered crowd stress | [T_A_s2001](cases/T_A_s2001/frontend_payload.json), [T_A_s2002](cases/T_A_s2002/frontend_payload.json), [T_A_s2003](cases/T_A_s2003/frontend_payload.json) | Crowd density 0.5 | Active Shooter Surveillance |

Forest: medium woods, 15:00, trees 0.2, grass 0.2. Water: medium woods, 13:00, trees 0.2, grass 0.2. Triggered crowd: medium urban, 10:00, clear intensity 0.0, buildings 0.9. Within each seed block, the N/A DSL pair differs only in its case name and the listed factor. All other family adaptations are held constant.

## Execute

Start the existing DRV backend, report storage and matching DroneWorld simulator using your normal platform startup. The backend must include the mission and recorder changes from this task. The simulator must contain the existing medium woods/urban levels and the catalog assets. Use the backend URL that your frontend uses if it differs from `http://localhost:5000`.

From `G:\Dev\DRV_public`:

```powershell
# Read-only verification; no simulator or cloud Python SDK is required.
python regression_study_18/build_suite.py --check
python regression_study_18/verify_support.py
node regression_study_18/verify_frontend.mjs

# Submit one complete case.
python regression_study_18/submit.py --case F_N_s2001

# Or submit the entire suite to the existing serial task queue.
python regression_study_18/submit.py --all
```

`--base-url http://localhost:5000` can be supplied to either submission command. Choose one submission command; running both queues the first case twice. The submission script validates all selected pairs and hashes before sending any requests. It records each returned task ID and report recording path in `runs/<timestamp>.jsonl`. A submission receipt means queued, not a successful flight. It does not retry uncertain submissions automatically.

The task manager loads the scene, derives and deploys the SuT, runs the selected mission, stops recording on exit and stores the MP4 beside that mission's report. The original DSL is archived at `reports/<task_id>/InitDSL.json`. The MP4 is at:

```text
reports/<task_id>/<MissionClass>/<MissionClass>_Drone1_recording.mp4
```

MissionClass is `MissingPersonSearchAndRescue`, `RiverSearchAndRescue`, or `ActiveShooterSurveillance`. The matching log is `<MissionClass>_Drone1_log.txt` in that directory. The GCS report browser currently filters for monitor text, PNGs and HTML, so the MP4 may need to be retrieved directly from report storage using the receipt path.

These are frontend **request** payloads, not a new frontend import format. The current UI does not have a full-payload file import that restores all drone camera fields. Use `/addTask` or the supplied submit script for exact execution. Pasting only `InitDSL.json` into a scene editor does not select the mission or restore its camera settings.

## Supported adaptations from the study sources

This is a mission-aligned revision of the study inputs, not an unchanged copy of the older source suite. [manifest.json](manifest.json) records hashes, each pair, the changed factor, and every common source adaptation. The three reference nominal scenes and an exact protocol snapshot are in `sources/`; these are provenance files, not run inputs.

1. **Water fog 0.5 becomes 0.7.** The frontend/backend catalog permits weather intensities 0, 0.1, 0.7 and 1.0. `POST /addTask` rejects 0.5. The supported 0.7 value preserves the intended stronger-fog condition. Crowd density 0.5 remains supported because densities have a different validator.
2. **Required metadata and goal fields are added.** The older Unreal-only fixtures lack metadata required by the current backend and fields read by the frontend editor. `Goal.Target` uses the catalog's generic human descriptor; the actual dynamic targets retain their specialized `BP_MissingAICharacter` and `BP_BuoyancyDrowner` assets.
3. **One drone starts at home (0, 0, 0), yaw 0.** The previous fixture's SuT height 200 is replaced by the home derived from the new mission. The selected model is `Aurelia`, mapped by the current catalog to `BP_FlyingPawn_Aurelia`. Mission parameters are the supported positional list `[4, "0"]`: 4 m/s transit, camera `0`.
4. **Targets are aligned to the specified mission paths.** AirSim mission coordinates are meters, with negative NED Z for height. The inspected C++ dynamic actor loader forwards X/Y directly to Unreal world coordinates in centimeters, despite the frontend's general relative-coordinate wording. The forest target uses DSL `(10500, 60000)`, corresponding to `(105, 600)` m at the orbit center. The water target uses `(13800, -36200)`, corresponding to `(138, -362)` m halfway along the slow river leg. The drowning orientation remains pitch 90. Dynamic Z is omitted because the current loader ignores it and chooses height by terrain/navmesh tracing. Actor placement is identical across all six cases in each family.
5. **Triggered actions are aligned to surveillance lead-in.** The original 15-second shooter preparation could finish before the drone completes its approximately 60-second climb/back-up transit. Preparation now lasts 75 seconds; civilian loiter and receiver waits last 90 seconds. Civilian response steps use the supported `A` track so they wait for `shots_fired_stage` rather than running on the default sequence before the alarm. Action types, targets, movement destinations and trigger labels are retained. All triggered cases share these changes. The inspected engine broadcasts an action's trigger at action start, despite the catalog's generic after-action description. Actual event timing must be observed, not inferred from 75 alone.
6. **Pawn identifiers match actor keys.** The C++ director assigns runtime identity from the object key rather than the separate JSON PawnIdentifier. Matching both avoids frontend selection and runtime target lookup disagreements.
7. **Camera settings are carried in `Drones[0].Cameras["0"]`.** They are supported AirSim settings preserved by the actual frontend serializer and backend settings transformation: 1280 x 720, FOV 90, motion blur 0. Forest starts with camera pitch -90 so the end of the approach can be included in the evaluation window. Water starts at the horizon and tilts down at the river; surveillance starts at the horizon and tilts down 45 degrees after backing up. No camera, recording, detector, automatic scoring or event-alignment fields are invented in the InitDSL.

## Capture and study limits

The recorder added to these missions writes an MP4 at nominal **5 fps**, not 30 fps, and records the full mission. Five fps is the supported fallback used here; no payload field pretends to change the recorder's fixed rate. Capture resolution must still be confirmed from the produced file. Exposure and overall graphics quality inherit the simulator settings and must be recorded when freezing the experiment.

The study's 20-second scored windows are selected after recording; the payload does not automatically trim or annotate videos. For forest, the 5 m radius orbit at 2 m/s lasts approximately 15.7 seconds. The proposed last-20-seconds window includes the end of the approach with the camera already downward. It is not a 20-second stationary observation or 20 seconds entirely within the orbit. Water has a long slow river leg; select the 20-second interval around actual target visibility. For the triggered scenario, use the observed event minus 5 through plus 15 seconds. Scene startup and flight timing are not synchronized by an event API, so verify that the full event window is captured during surveillance.

The current recorder can duplicate frames after slow camera RPC responses and does not export raw frame timestamps. It cannot certify the protocol's 100 distinct time samples by configuration alone. Inspect capture gaps before frame selection, and do not treat duplicated frames as independent observations. No detector inference, annotations, trigger-time extraction or regression scoring is provided by these simulator payloads.

All pairs are schema-valid and their execution plumbing is statically checked. Unreal flights, actual camera framing, water-surface placement, procedural crowd counts and successful trigger responses have **not** been runtime-verified. The water configuration uses the existing medium woods setup and buoyancy actor; there is no supported `water` level type or catalog river-spawn field to add. Verify the existing level's river at the mission path during the feasibility pilot. Distinct seeds do not guarantee distinct actor trajectories or images.

The exact protocol's final freeze still depends on these runtime observations. Do not label this generated suite as already captured, visually validated, or a completed detector regression experiment.

## Verification evidence

- `build_suite.py --check`: parses all files, invokes the current backend validator/extractor, compares runtime SuT derivation, verifies 18 pairs, 9 single-factor contrasts, allowed mission names and byte hashes.
- `verify_support.py`: executes the unmodified backend settings-transformation methods in isolation, without constructing an RPC/cloud service. Checks mission dispatch parameters and that all camera settings survive into AirSim `Vehicles.Drone1`.
- `verify_frontend.mjs`: executes the current frontend's actual `buildDronePayload` serializer and verifies every drone survives unchanged.
- The nine existing `backend/tests/test_mission_presets.py` tests cover mission command order, heading/camera behavior, cancellation, recording lifecycle, upload failure and MP4 encoding with a mocked camera.

Relevant implementation: `frontend/src/components/HorizontalLinearStepper.jsx`, `frontend/src/constants/drone.js`, `backend/PythonClient/multirotor/control/dronelume_config.py`, `dronelume_catalog.json`, `simulation_task_manager.py`, and the new mission modules. Runtime semantics were also inspected in the Unreal project's `Source/DRV/Private/DslHelper.cpp`, `DynamicPawnDirector.cpp`, `ProceduralPawnDirector.cpp`, `AI/GenericHumanAICharacter.cpp`, `WeatherController.cpp`, and `Cosys-AirSim/AirLib/include/common/AirSimSettings.hpp`.
