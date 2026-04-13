# Config Presets

This directory stores bundled wizard presets used by the import panel.

## Structure

- `registry.js`
  - owns the preset list shown in the UI
  - stores metadata only:
    - `id`
    - `displayName`
    - `description`
    - `sourceJson`
- `uav301Preset.js`, `uav302Preset.js`, `uav303Preset.js`
  - store the preset payloads themselves
- `presetBuilders.js`
  - holds small helpers for building repeatable drone/environment shapes

## Adding a new preset

1. Create a new preset content file in this directory.

   - Export the preset payload as the default export.
   - Keep the file focused on the source JSON only.

2. Register the preset in `registry.js`.

   - Add:
     - a stable `id`
     - a user-facing `displayName`
     - a short `description`
     - the imported `sourceJson`

3. Do not add schema-specific import logic.

   - Presets must continue to flow through the same shared import pipeline used by:
     - uploaded JSON files
     - browser-saved snapshots

4. Add or update tests if the preset changes user-visible behavior.

## Notes

- Presets are loaded through the same import pipeline used by uploaded JSON files and browser-saved snapshots.
- Prefer raw task-payload-shaped presets when you want the wizard to restore missions, monitors, and other editable metadata without reconstruction warnings.
