# Architecture Decision Records

DroneWorld uses Architecture Decision Records (ADRs) to document durable technical decisions that affect architecture, contracts, runtime behavior, contributor workflow, or long-lived data formats.

Write an ADR when a decision changes or clarifies how contributors should build, operate, extend, or integrate DroneWorld. ADRs should document the decision, tradeoffs, and consequences. Do not use ADRs for transient issue notes, short-term task status, or implementation details that are expected to disappear soon.

## Format

Start new ADRs from [0000-template.md](0000-template.md). Keep entries concise but specific, and include file path references under `Related Files` when a current implementation exists.

## Numbering

ADRs are numbered sequentially with four digits:

- `0001-title.md`
- `0002-title.md`
- `0003-title.md`

Use the next available number when adding a new ADR. Do not renumber existing ADRs, even if one is superseded or removed from active guidance.

## Status Values

- `Proposed`: The decision is being discussed and is not yet accepted as project guidance.
- `Accepted`: The decision reflects current project guidance or current implementation.
- `Superseded`: The decision has been replaced by a newer ADR. Link the replacing ADR in `Follow-up Work` or `Consequences`.

## Updating ADRs

Prefer adding a new ADR when a decision changes in a meaningful way. Mark the older ADR as `Superseded` and link the newer ADR from the old record. Small corrections, typo fixes, and added related-file references can be made in place when they do not change the decision.

When proposing an ADR update in a pull request, explain why the decision is still accurate, why it should change, or which newer ADR supersedes it.
