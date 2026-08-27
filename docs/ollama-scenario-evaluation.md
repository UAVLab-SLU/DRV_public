# Ollama scenario assistant prototype evaluation

Date: 2026-08-27

## Prototype boundary

This initial evaluation covers the current DroneLume catalog only. It does not claim completion of issue 98's full provider comparison or the larger scenario-session service in issue 97. The browser sends a bounded conversation to the backend, the backend supplies the current authoring contract to Ollama, and completed output must pass the deterministic DroneLume validator before it is returned.

The model never writes runtime files. Provider and model metadata are returned separately from InitDSL.

## Configuration tested

- Provider: native Ollama at `http://localhost:11434`
- Model: `llama3.1:latest`, 4.9 GB model download
- Runtime allocation reported by `ollama ps`: 5.9 GB, 100% GPU, 8192-token context
- Temperature: 0
- Maximum generation: 4096 tokens
- Knowledge: backend catalog, template, authoring instructions, one valid DSL example based on the Unreal inventory, and one unsupported-action example

## Results

Run with:

```powershell
cd backend
python evaluation/run_scenario_evaluation.py
```

The `dronelume_v1.json` prototype set passed 4 of 4 cases after grounding refinements:

| Case | Expected | Result | Warm latency |
| --- | --- | --- | ---: |
| Incomplete basic request | Clarify | Clarify with focused questions | 1.304 s |
| Teleport request | Unsupported | Unsupported with the rejected capability retained | 0.479 s |
| Fully specified supported request | Complete | Complete and validator-approved | 2.692 s |
| Multi-turn completion | Complete | Complete and validator-approved | 2.378 s |

A minimal cold-start probe took about 53.7 seconds, including about 32.0 seconds to load the model. After the model was resident, responses in the current evaluation took 0.4 to 2.7 seconds.

The first ungrounded attempt passed only 1 of 3 cases. It asked for clarification about teleporting and repeated questions for values already present in a fully specified request. Adding explicit allowlist decision rules and compact knowledge examples improved the same three cases to 3 of 3. This shows that llama3.1 is usable for the limited experimental catalog, but its behavior depends materially on the curated knowledge prompt.

## Preliminary assessment

`llama3.1` is sufficient for an opt-in experimental build with the current small action and asset inventory. It can ask for missing details across turns, flag an unsupported request, construct validator-approved InitDSL, and avoid authoring the Mission-owned SuT after grounding.

It is not ready for general enablement. The current four-case set is too small, cold-start latency is high, and Unreal resource contention has not been measured. The full versioned suite still needs ambiguous, contradictory, multi-actor, trigger-chain, behavior-track, reference-invalid, malformed-output, rate-limit, outage, timeout, cancellation, and Unreal-contention cases.

## Proposed enablement gate

Keep the provider marked experimental until a versioned suite of at least 40 cases meets all of the following in three consecutive runs:

- 100% parseable structured responses
- 100% of completed outputs pass deterministic validation
- At least 95% correct outcome classification across clarify, unsupported, and complete
- At least 95% field accuracy for supported cases
- 100% valid actor references and trigger graphs
- At least 95% recall for required clarification fields
- At least 95% precision for unsupported features
- Warm p95 latency at or below 15 seconds on the reference machine
- No backend failure during timeout, cancellation, malformed output, or provider outage tests
- No unacceptable Unreal frame-time or GPU-memory regression under the separately defined contention budget

## Known gaps

- Browser cancellation aborts the HTTP request, but the backend does not yet propagate a cancellation token into an in-progress non-streaming Ollama generation.
- Sessions are currently held in browser conversation state and are not persisted.
- No hosted free-tier adapter has been added.
- Resource use is recorded manually from `ollama ps`; automated CPU, GPU, and memory sampling is not yet part of the harness.
- The deterministic validator needs broader unknown-field, reference, trigger-graph, and behavior-track coverage as issue 97 matures.
