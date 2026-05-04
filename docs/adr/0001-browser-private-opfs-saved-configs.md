# ADR 0001: Browser Private OPFS Saved Configs

Date: 2026-05-04

Status: Accepted

## Context

DroneWorld's saved configurations are created from frontend wizard state and generated backend settings before task submission. They are user-local working artifacts rather than shared project configuration.

This decision reflects the current implementation.

## Decision

Use the browser Origin Private File System (OPFS) for browser-private saved configurations.

Saved entries are stored under the `saved-settings` OPFS directory. The Saved Settings page lists, loads, downloads, replays when possible, and deletes entries through the frontend storage service.

## Consequences

Saved configurations remain private to the browser origin and do not require backend persistence, user accounts, or cloud storage setup.

The backend stays stateless for saved configuration management, except when receiving a task submission or settings preview request.

OPFS support is browser-dependent. Unsupported browsers cannot save or manage snapshots through this feature.

Saved entries are not automatically shared across browsers, devices, origins, or cleared browser storage.

## Alternatives Considered

- Backend database or file storage: enables cross-device access, but requires persistence design, account or ownership rules, and cleanup behavior.
- Browser `localStorage`: broadly familiar, but less appropriate for structured JSON artifacts that may grow and need file-like listing semantics.
- User-managed downloads only: portable and explicit, but removes in-app listing, replay, and load workflows.

## Related Files

- `frontend/src/services/savedSettingsStorage.js`
- `frontend/src/pages/SavedSettings.jsx`
- `frontend/src/components/HorizontalLinearStepper.jsx`
- `frontend/src/tests/savedSettingsStorage.test.js`
- `frontend/cypress/e2e/app.cy.js`

## Follow-up Work

Define an export or migration path if saved configurations need to become shareable across browsers or users.
