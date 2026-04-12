/*
 * Validation helpers for imported wizard configurations.
 * The normalizer is allowed to recover partial state, but validation decides
 * whether the recovered configuration is safe enough to apply to the wizard.
 */

export function validateImportedConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== 'object') {
    return {
      ok: false,
      errors: ['Imported configuration is missing or malformed.'],
      warnings,
    };
  }

  const drones = Array.isArray(config.Drones) ? config.Drones : [];
  if (drones.length === 0) {
    errors.push('Imported configuration must include at least one drone.');
  }

  drones.forEach((drone, index) => {
    const label = drone?.Name ?? drone?.droneName ?? `Drone ${index + 1}`;
    if (!drone?.Name && !drone?.droneName) {
      errors.push(`Drone ${index + 1} is missing a name.`);
    }

    ['X', 'Y', 'Z'].forEach((axis) => {
      if (!Number.isFinite(drone?.[axis])) {
        errors.push(`${label} has an invalid ${axis} position.`);
      }
    });

    if (!drone?.MissionValue && !drone?.Mission?.name) {
      warnings.push(`${label} is missing mission metadata and will fall back to the default mission.`);
    }
  });

  const environment = config.environment;
  if (!environment || typeof environment !== 'object') {
    errors.push('Imported configuration must include environment settings.');
  } else {
    const origin = environment.Origin ?? {};
    if (environment.UseGeo) {
      if (!Number.isFinite(origin.Latitude)) {
        errors.push('Environment origin latitude is required for geo-based configurations.');
      }
      if (!Number.isFinite(origin.Longitude)) {
        errors.push('Environment origin longitude is required for geo-based configurations.');
      }
      if (!Number.isFinite(origin.Height)) {
        errors.push('Environment origin height is required for geo-based configurations.');
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
