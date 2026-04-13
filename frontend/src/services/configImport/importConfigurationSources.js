/*
 * Shared source loaders for wizard imports.
 * Presets and uploaded files both normalize through the same import pipeline
 * so the UI does not carry schema-specific branching.
 */

import { normalizeImportedConfig, normalizeImportedConfigText } from './savedConfigImport';

export function loadImportedConfigFromPreset(presetDefinition) {
  const presetSourceJson = presetDefinition?.sourceJson ?? presetDefinition?.config ?? null;

  if (!presetSourceJson) {
    return {
      ok: false,
      sourceType: 'preset',
      effectiveType: null,
      config: null,
      errors: ['Selected preset is missing configuration data.'],
      warnings: [],
    };
  }

  return normalizeImportedConfig(
    {
      ...presetDefinition,
      config: presetSourceJson,
    },
    {
      sourceHint: 'preset',
      sourceName:
        presetDefinition.displayName ?? presetDefinition.name ?? presetDefinition.id ?? null,
    },
  );
}

export function loadImportedConfigFromJsonText(rawText, options = {}) {
  return normalizeImportedConfigText(rawText, {
    sourceName: options.sourceName ?? null,
  });
}

export function loadImportedConfigFromSnapshot(snapshotRecord) {
  if (snapshotRecord?.taskJson != null || snapshotRecord?.settingsJson != null) {
    const payload =
      snapshotRecord.taskJson != null
        ? {
            settings: snapshotRecord.settingsJson,
            task: snapshotRecord.taskJson,
            savedAt: snapshotRecord.savedAt ?? null,
          }
        : snapshotRecord.settingsJson;

    return normalizeImportedConfig(payload, {
      sourceName: snapshotRecord.name ?? null,
    });
  }

  return {
    ok: false,
    sourceType: 'snapshot-bundle',
    effectiveType: null,
    config: null,
    errors: ['Saved entry is missing importable configuration data.'],
    warnings: [],
  };
}
