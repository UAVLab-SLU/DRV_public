# Regression study protocol for the four supported DroneLume scenarios

Status: proposed experiment, not executed. Prepared September 8, 2026.

**Selected scope, September 8, 2026:** The user removed urban person detection from the smaller design. The active suite now contains **18 videos: forest, water, and triggered crowd x nominal N/stress A x seeds 2001, 2002 and 2003**, yielding 1,800 scored frames at 100 frames per video. The complete DSL files, manifest and checklist remain in `G:/UE_project/DroneWorld 5.5/Config/RegressionStudy24`; the historical folder name is retained for link compatibility. The 60-video and 24-video designs below are superseded proposals, not the active collection target. Apply the methods below only to the three retained families; report condition-level counts out of three. The five-block recurrence rule does not apply. Replay recordings reuse these specifications and are additional to the 18 main videos. Files have passed static verification; recording and runtime verification remain pending.

## 1. Recommended experiment and scope

Run a controlled evolution study of one offline person-detection pipeline. Generate videos from the four existing scenario families, freeze those videos and their annotations, and evaluate the same inputs against a baseline and four documented changes to that pipeline. Then regenerate a small, predefined subset of scenarios to evaluate whether the observed version differences survive simulator replay.

This fits the available capabilities: existing Unreal scenarios, parameter variation, video recording, and computer-vision inference. No new scenario family, training dataset, closed-loop flight controller, or action-recognition model is required.

The essential distinction is that scenario variation creates test inputs, while a change to the perception pipeline creates a candidate software regression. Comparing a detector on clear and rainy videos alone is a robustness experiment. Comparing its old and changed versions on the identical clear and rainy videos is a regression experiment.

Proposed RQ: **Can a fixed, versioned suite of four parameterized scenario families reveal and reproduce behavioral regressions caused by documented changes to a person-detection pipeline?**

Subquestions:

1. Which changes cause measurable deterioration, and in which conditions?
2. Do the stress variants expose deterioration absent from the nominal variants?
3. Are the flags repeatable on frozen inputs and reproducible after scenario regeneration?

Describe the main experiment as controlled configuration evolution. Unless actual historical commits are used, do not present it as a longitudinal study of naturally occurring defects. Candidate changes are not known regressions merely because they were introduced.

## 2. What the local files establish

The manuscript's four settings and corresponding project files are:

| Family | Existing configuration in the Unreal project | Confirmed editable fields in the JSON |
|---|---|---|
| F: forest search for a missing person | `Config/InitDSL_Missing.json` | Rain intensity, time of day, tree density, procedural seed, person placement |
| U: urban person detection | `Config/InitDSL_PercCrowd.json` | Fog intensity, crowd/building density, seed, actor speed and loiter settings |
| W: person in water | `Config/InitDSL_Drown.json` | Fog intensity, time of day, buoyancy actor placement/orientation, seed |
| T: triggered urban crowd response | `Config/InitDSL_ActiveShooter.json` | Crowd/building density, seed, actor actions, durations, speeds and trigger names |

These are configuration-level observations, not proof that every field operates correctly at runtime. In particular, the drowning JSON specifies a `woods` level and a `BP_BuoyancyDrowner` actor. Verify that loading it produces the intended water scene and identify the required water/level assets. The trigger sequence also needs runtime verification. The four existing image inputs and three video inputs can help the pilot, but do not constitute the new repeated suite.

The JSON `SuT` block identifies a simulated flying pawn. For this experiment, separately version the offline detector as the evaluated SuT; the camera and flying pawn belong to the fixed input-generation setup.

## 3. Step 1: freeze the evaluated perception pipeline

Start with the paper's existing YOLOv8-human implementation if its code and exact weights are recoverable. Otherwise choose one available person detector before collecting the confirmatory data, explain the substitution, and keep it fixed throughout. Do not infer an exact weight file or package version from the label “YOLOv8-human.”

Define the pipeline boundary as: decoded RGB image, preprocessing, person detector, confidence filter, nonmaximum suppression, and output boxes mapped to original image coordinates. A tracker is unnecessary. Ground-truth identities support temporal evaluation even when the detector has no tracking component.

Save the code revision, weight SHA-256, person-class mapping, dependencies, GPU/driver, precision, device, batch size, preprocessing and postprocessing settings. Explicitly record color order and coordinate conventions. Pin the implementation rather than following changing defaults.

For an Ultralytics-compatible implementation, proposed baseline settings are input size 640, confidence 0.50, NMS IoU 0.70, batch size 1, full precision, and no inference augmentation. Confirm support in the pinned implementation. `conf`, `imgsz`, `iou`, and padding settings are documented inference controls in the [official prediction documentation](https://docs.ultralytics.com/modes/predict/); these proposed values are study choices, not assertions about the old experiment's defaults.

Before real data, check the evaluator using tiny hand-constructed examples: a perfect match, a missed person, a duplicate box, an empty frame with a detection, and a box transformed back from a padded image. Confirm that all versions use the same independently implemented evaluation routine.

Deliverable: `pipeline_manifest.json` and a working baseline inference entry point.

## 4. Step 2: define changes before examining final outcomes

Use four single-change candidate branches from V0. This makes effects attributable to individual changes and prevents an early failure from masking later ones. Record each branch's parent, diff, rationale, intended benefit and anticipated risk. Call this controlled evolution from a common baseline, not a five-release chronological history.

| Candidate | Exact proposed change relative to V0 | Maintenance rationale | Hypothesis, not expected result |
|---|---|---|---|
| C1 | Confidence cutoff 0.50 to 0.70 | Reduce nuisance detections | Lower-confidence people may disappear, particularly in difficult visibility conditions; false positives may improve |
| C2 | Detector input size 640 to 320; preserve correct aspect handling and coordinate mapping | Reduce compute cost | Small or distant people may suffer; measure inference speed as the intended benefit |
| C3 | NMS IoU 0.70 to 0.40 | Reduce duplicate boxes | Correct overlapping person boxes may be suppressed in crowded scenes |
| C4 | Replace aspect-preserving letterbox preprocessing with direct square resizing to the same 640 input; map boxes back correctly using separate x/y scales | Simplify deployment preprocessing | Aspect distortion may affect atypical poses and shapes; improvement or no change are valid outcomes |

C4 must replace preprocessing once, without a hidden second resize. The recorded image format must be nonsquare for this contrast to exist. If the selected detector does not expose these controls, translate the change at the wrapper level and document actual semantics before freeze.

Add two controls:

1. **N0, no-op change:** change logging or output serialization while preserving detections. It should produce identical canonical predictions and zero regression flags.
2. **Recovery:** after a candidate is flagged, revert its isolated change and rerun the affected clips. Recovery is causal evidence that the flag was due to that change. If no candidate is flagged, report that result and perform a predefined C2 revert as an execution check without claiming recovery from a regression.

An optional deliberately seeded coordinate-mapping fault can test whether the evaluator catches an obvious bug. Report it separately from maintenance-like changes. Do not add it after the fact to rescue an otherwise negative result or count it as a natural maintenance defect.

If historical commits are readily available, a documented bug/fix pair is a stronger extension. Preserve its history and evaluate the same frozen suite. It is not a prerequisite for the controlled study.

## 5. Step 3: construct the fixed scenario matrix

Recommended core: four families, three variants per family, five seed blocks per variant. This yields **60 videos**. Each seed block uses the same seed across the three variants of its family. Use pilot seeds 1001 and 1002; reserve seeds 2001 through 2005 for the main experiment. The specific integers have no special significance.

Each family has one nominal variant and two variants that each alter one field from nominal. The following values are proposed starting settings and must pass a feasibility-only pilot:

| Family | Nominal N | Variant A | Variant B |
|---|---|---|---|
| F | Rain type retained, intensity 0.0; tree density 0.2; 15:00 | Rain intensity 0.7 only | Tree density 0.5 only |
| U | Fog intensity 0.0; crowd density 0.1; building density 0.5; 16:00 | Fog intensity 0.5 only | Crowd density 0.5 only |
| W | Existing water scene and drowning animation; fog intensity 0.0; 13:00 | Fog intensity 0.5 only | Time of day 17:00 only |
| T | Existing triggered behavior; clear weather; crowd density 0.1; building density 0.9; 10:00 | Crowd density 0.5 only | Crowd density 0.9 only |

For each family, fix actor assets, placements, camera, all other densities, action durations and trigger logic. For W, “nominal” means the less impaired version of the supported drowning scene, not an easy upright-person control. The T family is a density sweep, not two different causal factors. Do not claim that W's time change isolates glare: lighting changes multiple visible properties.

Density is a generator setting, not a guaranteed count or occlusion fraction. Record actual visible-person counts, target pixel size, and occlusion annotations. Changing density can alter geometry and trajectories even with a shared seed. Interpret density contrasts as the total effect of that setting.

Seeds may have little effect in W or may control only background placement. Check that distinct seeds generate materially distinct scenes. If they produce duplicates, do not count them as independent samples. Before freeze, replace the ineffective seed dimension for that family with five explicitly recorded, supported placement configurations selected without candidate-model results, or report a smaller effective sample size.

Suggested clip IDs: `F_A_s2001`, `U_B_s2003`, and so on. Store an expanded JSON per clip, its parent template, changed field and value, seed, camera configuration, and hashes.

## 6. Step 4: feasibility pilot and protocol freeze

1. Load each base scenario and verify the intended actors, environment and behavior are visible.
2. Pick one fixed camera per family that keeps the relevant action in frame. Prefer a stationary camera to avoid adding camera-path variability. Do not assume pawn start location fully specifies the recording camera.
3. Use the two pilot seeds to check the proposed parameter extremes. Invalid means rendering/behavior failure, an unintended scene, or no evaluable target throughout the clip. Difficulty or poor candidate performance is not a reason for exclusion.
4. Inspect baseline outputs only on pilot clips to check that the evaluation is not entirely at floor or ceiling. If a whole family is always missed, make one documented adjustment to nominal camera/visibility or select the baseline pipeline once. Keep hard cases and record the adjustment. Do not search for changes that produce attractive regressions.
5. Verify crowd counts are practical to annotate. Cap generator settings before freeze if required, stating the restriction.
6. Freeze numerical settings, seed list, camera poses, annotation rules, change diffs, metrics, regression thresholds, exclusions, and replay selection in a dated protocol commit or immutable archive.
7. Reserve the final seeds. Any later redesign becomes exploratory and requires new held-out cases for a confirmatory rerun.

Deliverable: a signed-off manifest with no unspecified runtime settings. If repeatable camera setup cannot be achieved, the frozen-video comparison can proceed, while simulator replay must be described as approximate.

## 7. Step 5: record and freeze the videos

Use 1280 by 720 at 30 fps if the existing recorder supports stable capture at that rate. Otherwise choose the supported resolution/rate during the pilot and freeze it. Record timestamps and actual frame counts rather than trusting nominal fps.

For F, U and W, capture a 20-second evaluation window after a fixed warm-up. For T, capture a window from 5 seconds before to 15 seconds after the observed trigger event. Record enough lead-in to include the event; the current JSON has a preparation phase, so recording just the first 20 seconds may miss the response. Save event time and how it was measured. If runtime trigger logging is unavailable, manually mark the visible event and disclose the alignment method.

For every clip:

1. Start from the same reset procedure; load the expanded scenario and seed.
2. Set and record the camera pose/FOV and rendering settings, including exposure, motion blur, quality and resolution.
3. Record the window and save scenario/trigger logs where available.
4. Check for corrupt video, dropped capture, absent actors or failed triggers using predefined criteria. Preserve invalid-run records and reasons; retry the same case after correcting execution failure.
5. Decode once and extract 100 evenly spaced frames, at 5 Hz for exactly 20 seconds. Use saved timestamps for imperfect frame rates and forbid duplicate extracted frames masquerading as distinct times.
6. Hash both the source video and extracted images. Every SuT version receives exactly these images.

The primary dataset is **6,000 annotated frames**. At 30 fps the original recordings contain about 36,000 frames; inference on all frames can be retained as exploratory output, but primary scored metrics use the annotated sampling schedule. At 5 Hz, temporal measurements resolve 0.2 seconds and cannot characterize shorter misses.

## 8. Step 6: annotate ground truth once, independently of versions

Manual video-assisted annotation is sufficient. Use an existing annotation tool with interpolation, then verify every scored frame. Engine-derived boxes are optional only after validating their alignment and semantics; do not make a new ground-truth exporter a prerequisite.

Annotate all visible people, including procedural crowd members, at every scored frame, not only the named target. Save frame ID/timestamp, person identity, box, visibility/ignore status, and optional pose/occlusion category. Stable IDs are needed only within each video.

Freeze the following rules:

- Use tight full-person boxes inferred from visible body extent when boundaries can be established, with a consistent policy for partial occlusion and image truncation. Record the exact annotation handbook and examples.
- Fully invisible people do not count as missed detections. Severely ambiguous or too-small instances receive explicit ignore regions; propose a 10-pixel longer-side cutoff, checked in the pilot. Use longer side because horizontal people can have small box height.
- Score visible body evidence in water; do not fabricate boxes around completely submerged, unobservable bodies. Mark uncertain extent as ignored.
- A second person independently annotates at least 10% of scored frames, stratified across all families and variants, blind to model/version outputs. Report count disagreements, matched-box agreement and adjudication. If only one annotator is available, disclose this limitation and perform a delayed self-audit.
- Check model overlays only after first-pass labels are complete. Correct objectively wrong labels consistently for all versions with an audit trail.

Crowd annotations, not video duration, will dominate labor. Time annotation of 100 pilot frames; estimate remaining work from that measured rate before committing to 60 videos.

## 9. Step 7: run every version on the same frame manifest

Run V0, C1, C2, C3, C4 and N0 against all 6,000 images: **36,000 primary frame-inference evaluations**, excluding replay and recovery checks. Annotate once, not per version.

Save original-image boxes, class, confidence, image hash, version ID, input tensor dimensions, runtime and errors. Where feasible retain prefilter candidates for diagnosis, but score the actual configured pipeline output. C1 intentionally changes the confidence policy; do not overwrite it with a common cutoff after inference.

Warm up the detector on separate images before timing; exclude model loading, annotation and rendering from inference latency. Use the same hardware and batch size; synchronize GPU timing. Shuffle version execution order with a recorded seed to reduce drift in timing measurements. State whether decoding/preprocessing/postprocessing are included. Report accuracy and runtime together for C2, because a faster but less accurate configuration represents a tradeoff against the predefined tolerance.

An inference crash is an execution failure, not zero detections or a missing result to silently discard. Preserve it and report it separately from detection-quality regressions.

## 10. Step 8: score detections and define the regression oracle

At each frame, match person detections to eligible ground-truth persons one-to-one in descending confidence order, selecting the highest-IoU available ground-truth box when IoU is at least 0.50. Unmatched detections are FP, unmatched eligible people are FN, and matches are TP. After eligible matching, exclude unmatched predictions substantially overlapping an ignore region under a fixed intersection-over-prediction-area threshold of 0.50. Record this policy; do not claim exact COCO evaluation equivalence.

Compute per-video recall = TP/(TP+FN), precision = TP/(TP+FP), F1 = 2TP/(2TP+FP+FN), and FP/frame = FP/number of scored frames, using sums within a video. Keep undefined denominators as NA. A video with eligible people but no predictions has zero recall/F1 and undefined precision. FP/frame remains defined on empty frames.

Do not report FP/(FP+TN) without a meaningful negative-unit definition: bounding-box detection has no natural count of all true-negative boxes. Use FP/frame and, optionally, the fraction of frames with any FP.

Primary endpoint: **paired per-video recall deterioration**, accompanied by FP/frame to expose threshold tradeoffs. Secondary outcomes are precision, F1 and eligible-person detection persistence. Define persistence as matched scored frames divided by eligible scored frames for each ground-truth identity. Report longest consecutive eligible miss run in samples and approximate seconds; invisible/ignored intervals break runs. First-detection delay is optional, with never-detected appearances right-censored, not assigned a zero delay.

Proposed engineering flags, to freeze before final evaluation:

- Recall flag for a clip: `R(V0) - R(Cj) >= 0.10`, an absolute ten-percentage-point loss.
- FP flag for a clip: `FP/frame(Cj) - FP/frame(V0) >= 0.10`.
- A changed version is suite-flagged if any eligible clip crosses either threshold. These are regression-test alerts requiring diagnosis, not familywise statistical significance or safety thresholds.
- A recurrent condition-level finding requires the same direction of threshold crossing in at least three of the five blocks for that family/variant. Report the exact count even if fewer than three cross.

Use confidence intervals to describe uncertainty, not to disguise alerts as hypothesis tests. For every family/variant and change, report all five paired clip differences, their mean/median, and a paired bootstrap interval resampling whole seed blocks. For suite summaries resample within each family and keep each block's three variants and all versions together. Average conditions/families equally; pooled object counts are supplementary because dense crowds would otherwise dominate. Five blocks give unstable intervals, so emphasize raw differences and limited generalizability. Frames are correlated observations, not 6,000 independent experimental samples.

As sensitivity analyses, report the counts at recall cutoffs 0.05 and 0.15 and matching IoU 0.30/0.70. Keep the primary rule unchanged. Inspect flags near thresholds for annotation ambiguity. A high absolute error already present in V0 is a baseline weakness, not a newly introduced regression.

## 11. Step 9: test the value of stress variants fairly

Compare the 20 nominal clips with the 40 stress clips using the same candidate changes and same flag definition. Report which version is flagged by nominal cases, stress cases, or both, and identify the exact videos.

Since 40 clips provide more opportunities than 20, include an equal-size comparison: for each family, retain either stress variant A or B for all five seeds, yielding 20 stress clips. Enumerate all 2^4 = 16 such selections, rather than choosing the most favorable one. Report the number of candidate changes flagged across these selections and by the 20 nominal clips.

With only four candidate changes, report counts such as “2 of 4 candidates,” not a precise estimate of general regression-detection effectiveness. A stress-only flag supports the value of these conditions for this pipeline. It does not establish superiority to manually authored equivalent videos or another simulator. A manual-authoring maintenance comparison from the action plan remains a separate study.

Do not promise that at least one stress-only failure will occur. No regressions or nominal-only findings remain valid outcomes.

## 12. Step 10: distinguish two forms of replay

### A. Frozen-input repeatability

Preselect eight clips: every family's nominal variant and variant A at seed 2001. Run all six versions three times total on their identical image sets, starting a fresh inference process per run. The first pass can be reused from the main experiment. Additional cost: 8 x 100 x 6 x 2 = 9,600 frame evaluations.

Compare canonical sorted predictions excluding timings, numerical score/box differences, metrics and alert status. Exact equality is evidence only for this tested execution setup. If results vary, quantify it and investigate any alert that changes status; do not call that alert repeatable.

### B. Scenario regeneration

For the same eight predefined scenario specifications, perform three independent simulation executions total, including the original capture: **16 additional videos**. Regenerate from saved specifications and reset conditions, not from manually reconstructed scenes. Run V0 and all four candidates on the newly captured, newly annotated scored frames. Cost: 16 x 100 x 5 = 8,000 frame evaluations and 1,600 additional annotated frames.

Compare four layers separately:

1. Specification and dependency hashes.
2. Generated geometry/actor placement and event timestamps, where logs are available.
3. Decoded image equality or measured visual variation. Container video hashes alone cannot establish pixel inequality because metadata can differ.
4. Per-version metric variation and paired old-versus-new regression flags within each regenerated recording.

Reannotate regenerated frames unless exact decoded-frame equality is established. Never reuse boxes on shifted imagery. If actor traces cannot be captured, report that layer as unmeasured rather than inferring equality from the seed.

For any main-study flag outside this subset, optionally perform two additional regenerations of that failing case. Label these diagnostic follow-ups as outcome-selected and keep them separate from the predefined reproducibility summary. Count a flag as replay-reproduced when it appears in all three executions under the same rule; also report the actual 0/3 through 3/3 count and score range.

Recovery check: rerun the reverted candidate on frozen failing inputs and show restoration toward V0. Exact restoration is expected when the entire deterministic pipeline state matches V0. This tests attribution; simulator regeneration tests preservation of the scenario.

## 13. Step 11: package one complete regression episode

Select one actual observed flag for the paper, explicitly identifying that the example was chosen after the full analysis. Show:

1. Maintenance intent and exact pipeline diff.
2. Fixed scenario JSON and the field distinguishing nominal/stress conditions.
3. Identical frames with V0/candidate detections and ground truth.
4. Per-frame matched-person timeline and per-video metric delta.
5. Nominal comparison, including whether it also flags the change.
6. Repeated inference, regenerated-scene results, and the reverted-version result.

This connects versioned scenario data to a concrete maintenance workflow. If no threshold is crossed, present the study honestly as a controlled evaluation without observed regressions under its tested changes and tolerances.

## 14. Deliverables and paper outputs

Store a self-contained experiment directory with:

```text
protocol.md
manifests/{scenes,pipeline,versions,capture_environment}.json
scenarios/<clip_id>.json
videos/<clip_id>.mp4
frames/<clip_id>/<frame_id>.png
annotations/ground_truth.json
predictions/<version>/<clip_id>.jsonl
logs/{capture,inference,replay}/
scripts/{extract,run_versions,evaluate,report}.*
results/{clip_metrics,paired_deltas,regression_matrix,replay}.csv
README.md
```

These are planned artifact paths, not scripts already implemented. Provide a documented sequence that extracts the frozen frames, runs every version, evaluates once against shared ground truth, and regenerates tables. A reduced frozen-video artifact can support inference reproduction if all Unreal assets cannot be redistributed; state that it does not reproduce scene generation.

Main paper outputs:

- Table: four families, variants, seeds, videos, evaluated frames, eligible person instances and ignore counts.
- Table: four change rationales and exact differences, distinguishing configuration changes from faults.
- Matrix: each candidate by family/variant, with V0 score, changed score, paired difference, flag count out of five, and replay count where tested.
- Figure: one regression episode with overlays and temporal trace.
- Compact replay table: exact input equality, score variation and flag agreement, separated by frozen inference versus regenerated scenes.

Update RQ2, abstract and contribution wording only after results exist. Keep the old four-detector comparison as supplementary context or a compact secondary study. The defensible new claim is controlled regression detection/replay for offline synthetic person detection. Closed-loop behavior, real deployment performance, natural-defect prevalence, and authoring productivity remain outside this experiment.

## 15. Workload, schedule and fallback

Core plus predefined replay: 60 main videos + 16 regeneration videos; 6,000 + 1,600 scored frames; 36,000 main + 9,600 frozen-repeat + 8,000 regenerated-video frame evaluations = **53,600**, plus small recovery/diagnostic runs and pilot work. Total scored video duration is about 25 minutes 20 seconds, excluding warm-up and trigger lead-in. The number of annotated boxes will be much larger than the number of frames in crowds.

Suggested execution order, with actual timing determined by the pilot:

| Work period | Required output |
|---|---|
| Day 1 | Working baseline, verified four scenes, annotation timing sample |
| Day 2 | Two-seed pilot, checked changes, frozen protocol and manifests |
| Days 3-4 | 60 valid recordings and extracted frame manifest |
| Days 4-7 | Annotation and independent audit, longer if crowd labeling requires it |
| Days 7-8 | All versions, metric checks, paired differences and flag matrix |
| Days 8-10 | Frozen repeats, 16 regenerated clips, replay annotation and recovery checks |
| Days 10-12 | Final analysis, figures, artifact reproduction and manuscript integration |

If the annotation pilot predicts an infeasible workload, reduce before confirmatory runs to four families x two variants (nominal and A) x three blocks = **24 videos**. Keep 20 seconds and 5 Hz, yielding 2,400 primary annotated frames. Preserve all four changes and the no-op control. For replay, select one stress case per family and record two additional executions each. This smaller design supports an exploratory case study with three-block raw differences; it provides weaker condition-level evidence and does not justify strong statistical generalization. Do not reduce sampling only after seeing unfavorable results.

Completion checklist:

- [ ] All four scenario families verified at runtime.
- [ ] V0, four candidate diffs and no-op fixed before main evaluation.
- [ ] Scenario/camera settings, exclusions and oracle frozen.
- [ ] Identical inputs and independent ground truth used across versions.
- [ ] Every candidate reported, including improvements and null results.
- [ ] Nominal/stress comparison includes equal-size analysis.
- [ ] Frozen-input repeatability separated from simulator regeneration.
- [ ] Recovery or predefined revert execution check completed.
- [ ] Raw outputs regenerate the reported tables.
- [ ] Manuscript claims match the measured scope.
