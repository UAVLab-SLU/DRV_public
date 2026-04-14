/*
 * Import parser helpers for configuration loading.
 * These functions stay framework-agnostic and only deal with raw JSON parsing
 * and source-wrapper extraction before normalization begins.
 */

export function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function parseImportJsonText(rawText) {
  if (typeof rawText !== 'string') {
    return {
      ok: false,
      value: null,
      errors: ['Import input must be a JSON string.'],
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(rawText),
      errors: [],
    };
  } catch (error) {
    return {
      ok: false,
      value: null,
      errors: [`Invalid JSON: ${error.message}`],
    };
  }
}

export function unwrapPresetSource(rawValue) {
  if (!isPlainObject(rawValue)) {
    return {
      candidate: rawValue,
      presetMetadata: null,
    };
  }

  const wrappedConfig =
    rawValue.config ?? rawValue.preset ?? rawValue.presetConfig ?? rawValue.configuration ?? null;

  if (!isPlainObject(wrappedConfig)) {
    return {
      candidate: rawValue,
      presetMetadata: null,
    };
  }

  return {
    candidate: wrappedConfig,
    presetMetadata: {
      id: rawValue.id ?? rawValue.presetId ?? null,
      name: rawValue.displayName ?? rawValue.name ?? null,
      description: rawValue.description ?? null,
    },
  };
}
