/*
 * Public import entry points for configuration loading.
 * This module detects source type, delegates to the appropriate normalizer,
 * and returns structured errors and warnings for the wizard import pipeline.
 */

import { parseImportJsonText, unwrapPresetSource, isPlainObject } from './savedConfigParsers';
import {
  normalizeAirSimSettingsConfig,
  normalizePresetConfig,
  normalizeSnapshotBundleConfig,
  normalizeTaskPayloadConfig,
} from './savedConfigNormalizer';
import { validateImportedConfig } from './savedConfigValidation';

function buildResult({ ok, sourceType, effectiveType, config, errors = [], warnings = [] }) {
  return {
    ok,
    sourceType,
    effectiveType,
    config,
    errors,
    warnings,
  };
}

export function detectImportSource(rawValue, options = {}) {
  const sourceHint = options.sourceHint ?? null;
  const sourceName = options.sourceName ?? null;

  if (!isPlainObject(rawValue)) {
    return {
      sourceType: null,
      effectiveType: null,
      payload: null,
      sourceName,
      errors: ['Imported JSON must be an object.'],
    };
  }

  if (sourceHint === 'preset') {
    const { candidate, presetMetadata } = unwrapPresetSource(rawValue);
    const detectedPresetPayload = detectImportSource(candidate, { sourceName });
    return {
      sourceType: 'preset',
      effectiveType: detectedPresetPayload.effectiveType,
      payload: candidate,
      sourceName: presetMetadata?.name ?? sourceName,
      errors: detectedPresetPayload.effectiveType == null ? detectedPresetPayload.errors : [],
    };
  }

  if (Object.prototype.hasOwnProperty.call(rawValue, 'settings')) {
    return {
      sourceType: 'snapshot-bundle',
      effectiveType: isPlainObject(rawValue.task) ? 'task-payload' : 'airsim-settings',
      payload: rawValue,
      sourceName,
      errors: [],
    };
  }

  if (Array.isArray(rawValue.Drones) && isPlainObject(rawValue.environment)) {
    return {
      sourceType: 'task-payload',
      effectiveType: 'task-payload',
      payload: rawValue,
      sourceName,
      errors: [],
    };
  }

  if (rawValue.SettingsVersion != null && isPlainObject(rawValue.Vehicles)) {
    return {
      sourceType: 'airsim-settings',
      effectiveType: 'airsim-settings',
      payload: rawValue,
      sourceName,
      errors: [],
    };
  }

  const { candidate, presetMetadata } = unwrapPresetSource(rawValue);
  if (candidate !== rawValue) {
    const detectedPresetPayload = detectImportSource(candidate, { sourceName });
    return {
      sourceType: 'preset',
      effectiveType: detectedPresetPayload.effectiveType,
      payload: candidate,
      sourceName: presetMetadata?.name ?? sourceName,
      errors: detectedPresetPayload.effectiveType == null ? detectedPresetPayload.errors : [],
    };
  }

  return {
    sourceType: null,
    effectiveType: null,
    payload: null,
    sourceName,
    errors: [
      'Unsupported configuration format. Import a saved snapshot bundle, a raw task payload, or an AirSim settings.json file.',
    ],
  };
}

function runNormalizationForDetectedSource(detectedSource) {
  switch (detectedSource.sourceType) {
    case 'snapshot-bundle':
      return normalizeSnapshotBundleConfig(detectedSource.payload);
    case 'task-payload':
      return normalizeTaskPayloadConfig(detectedSource.payload);
    case 'airsim-settings':
      return normalizeAirSimSettingsConfig(detectedSource.payload);
    case 'preset':
      return normalizePresetConfig(detectedSource.payload);
    default:
      return { config: null, warnings: [] };
  }
}

export function normalizeImportedConfig(rawValue, options = {}) {
  const detectedSource = detectImportSource(rawValue, options);
  if (detectedSource.errors.length > 0 || detectedSource.sourceType == null) {
    return buildResult({
      ok: false,
      sourceType: detectedSource.sourceType,
      effectiveType: detectedSource.effectiveType,
      config: null,
      errors: detectedSource.errors,
      warnings: [],
    });
  }

  const normalizedResult = runNormalizationForDetectedSource(detectedSource);
  if (!normalizedResult.config) {
    return buildResult({
      ok: false,
      sourceType: detectedSource.sourceType,
      effectiveType: detectedSource.effectiveType,
      config: null,
      errors: ['Imported configuration could not be normalized.'],
      warnings: normalizedResult.warnings ?? [],
    });
  }

  const configWithSource = {
    ...normalizedResult.config,
    source: {
      ...(normalizedResult.config.source ?? {}),
      type: detectedSource.sourceType,
      effectiveType: detectedSource.effectiveType,
      name: detectedSource.sourceName ?? normalizedResult.config.source?.name ?? null,
    },
  };

  const validation = validateImportedConfig(configWithSource);
  const warnings = [...(normalizedResult.warnings ?? []), ...(validation.warnings ?? [])];

  return buildResult({
    ok: validation.ok,
    sourceType: detectedSource.sourceType,
    effectiveType: detectedSource.effectiveType,
    config: validation.ok ? configWithSource : null,
    errors: validation.errors ?? [],
    warnings,
  });
}

export function normalizeImportedConfigText(rawText, options = {}) {
  const parsed = parseImportJsonText(rawText);
  if (!parsed.ok) {
    return buildResult({
      ok: false,
      sourceType: null,
      effectiveType: null,
      config: null,
      errors: parsed.errors,
      warnings: [],
    });
  }

  return normalizeImportedConfig(parsed.value, options);
}
