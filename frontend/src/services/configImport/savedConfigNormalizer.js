/*
 * Pure normalization helpers for saved and imported configurations.
 * Each supported source shape is converted into the same plain wizard config
 * so React components do not need to know how to parse saved files.
 */

import { isPlainObject } from './savedConfigParsers';

const DEFAULT_MISSION_NAME = 'fly_to_points';

function toFiniteNumber(value, fallback = null) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function cloneIfObject(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneIfObject(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneIfObject(entry)])
    );
  }
  return value;
}

function buildDefaultWind() {
  return {
    Type: 'Constant Wind',
    Direction: 'N',
    Force: 0,
    Velocity: 0,
  };
}

function buildDefaultEnvironment() {
  return {
    UseGeo: true,
    Origin: {
      Latitude: null,
      Longitude: null,
      Height: null,
      Name: 'Specify Region',
      Radius: null,
      image: null,
    },
    Wind: buildDefaultWind(),
    TimeOfDay: null,
    time: null,
    enableFuzzy: false,
    timeOfDayFuzzy: false,
    positionFuzzy: false,
    windFuzzy: false,
    Sades: null,
  };
}

function buildDefaultDrone(index, overrides = {}) {
  const droneName = overrides.droneName ?? overrides.Name ?? `Drone ${index + 1}`;
  const missionName = overrides.MissionValue ?? overrides.Mission?.name ?? DEFAULT_MISSION_NAME;
  const missionParam = Array.isArray(overrides.Mission?.param) ? overrides.Mission.param : [];
  return {
    id: index,
    Name: overrides.Name ?? droneName,
    droneName,
    FlightController: overrides.FlightController ?? 'SimpleFlight',
    VehicleType: overrides.VehicleType ?? 'SimpleFlight',
    DefaultVehicleState: overrides.DefaultVehicleState ?? 'Armed',
    EnableCollisionPassthrogh: overrides.EnableCollisionPassthrogh ?? false,
    EnableCollisions: overrides.EnableCollisions ?? true,
    AllowAPIAlways: overrides.AllowAPIAlways ?? true,
    EnableTrace: overrides.EnableTrace ?? false,
    droneType: overrides.droneType ?? 'MultiRotor',
    droneModel: overrides.droneModel ?? 'DJI',
    X: toFiniteNumber(overrides.X, null),
    Y: toFiniteNumber(overrides.Y, null),
    Z: toFiniteNumber(overrides.Z, null),
    Pitch: toFiniteNumber(overrides.Pitch, 0),
    Roll: toFiniteNumber(overrides.Roll, 0),
    Yaw: toFiniteNumber(overrides.Yaw, 0),
    Sensors: isPlainObject(overrides.Sensors) ? cloneIfObject(overrides.Sensors) : null,
    MissionValue: missionName,
    Mission: {
      name: missionName,
      param: cloneIfObject(missionParam),
    },
  };
}

function extractTimeOfDay(timeOfDayValue) {
  if (typeof timeOfDayValue === 'string') {
    const match = timeOfDayValue.match(/(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : timeOfDayValue;
  }

  if (isPlainObject(timeOfDayValue)) {
    if (timeOfDayValue.Enabled === false) {
      return null;
    }
    const startDateTime = timeOfDayValue.StartDateTime ?? timeOfDayValue.startDateTime ?? null;
    if (typeof startDateTime === 'string') {
      const match = startDateTime.match(/(\d{2}:\d{2}:\d{2})/);
      return match ? match[1] : startDateTime;
    }
  }

  return null;
}

function inferDroneType(vehicleLike) {
  const vehicleType = String(vehicleLike?.VehicleType ?? vehicleLike?.vehicleType ?? '').toLowerCase();
  if (vehicleType.includes('fixed')) {
    return 'FixedWing';
  }
  return vehicleLike?.droneType ?? 'MultiRotor';
}

function inferDroneModel(vehicleLike) {
  return vehicleLike?.droneModel ?? vehicleLike?.DroneModel ?? 'DJI';
}

function vectorToDirection(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) {
    return 'N';
  }

  const diagonalThreshold = Math.SQRT1_2 / 2;
  const magnitude = Math.sqrt(x ** 2 + y ** 2);
  const normalizedX = x / magnitude;
  const normalizedY = y / magnitude;

  if (normalizedX >= diagonalThreshold && normalizedY >= diagonalThreshold) return 'NE';
  if (normalizedX >= diagonalThreshold && normalizedY <= -diagonalThreshold) return 'NW';
  if (normalizedX <= -diagonalThreshold && normalizedY >= diagonalThreshold) return 'SE';
  if (normalizedX <= -diagonalThreshold && normalizedY <= -diagonalThreshold) return 'SW';
  if (Math.abs(normalizedX) >= Math.abs(normalizedY)) return normalizedX >= 0 ? 'N' : 'S';
  return normalizedY >= 0 ? 'E' : 'W';
}

function normalizeWindValue(rawWind, warnings) {
  const normalizedWind = buildDefaultWind();
  if (!isPlainObject(rawWind)) {
    return normalizedWind;
  }

  const force = toFiniteNumber(rawWind.Force ?? rawWind.Velocity, null);
  const vectorX = toFiniteNumber(rawWind.X, null);
  const vectorY = toFiniteNumber(rawWind.Y, null);
  const vectorZ = toFiniteNumber(rawWind.Z, 0);

  if (force != null) {
    normalizedWind.Direction = rawWind.Direction ?? normalizedWind.Direction;
    normalizedWind.Force = force;
    normalizedWind.Velocity = force;
    normalizedWind.Type = rawWind.Type ?? normalizedWind.Type;
    return {
      ...normalizedWind,
      ...cloneIfObject(rawWind),
      Force: force,
      Velocity: force,
      Direction: rawWind.Direction ?? normalizedWind.Direction,
      Type: rawWind.Type ?? normalizedWind.Type,
    };
  }

  if (vectorX != null && vectorY != null) {
    const magnitude = Math.sqrt(vectorX ** 2 + vectorY ** 2 + vectorZ ** 2);
    const direction = vectorToDirection(vectorX, vectorY);
    return {
      ...cloneIfObject(rawWind),
      Type: rawWind.Type ?? normalizedWind.Type,
      Direction: direction,
      Force: Number(magnitude.toFixed(4)),
      Velocity: Number(magnitude.toFixed(4)),
      X: vectorX,
      Y: vectorY,
      Z: vectorZ,
    };
  }

  warnings.push('Wind settings were partially missing and were normalized to default wizard values.');
  return {
    ...normalizedWind,
    ...cloneIfObject(rawWind),
  };
}

function normalizeEnvironmentFromTaskPayload(environment, fuzzyTest, warnings) {
  const normalizedEnvironment = buildDefaultEnvironment();
  const origin = isPlainObject(environment?.Origin) ? environment.Origin : {};

  normalizedEnvironment.UseGeo =
    environment?.UseGeo ??
    (origin.Latitude != null && origin.Longitude != null);

  normalizedEnvironment.Origin = {
    Latitude: toFiniteNumber(origin.Latitude ?? origin.latitude, null),
    Longitude: toFiniteNumber(origin.Longitude ?? origin.longitude, null),
    Height: toFiniteNumber(origin.Height ?? origin.height ?? origin.Altitude ?? origin.altitude, null),
    Name: origin.Name ?? origin.name ?? normalizedEnvironment.Origin.Name,
    Radius: toFiniteNumber(origin.Radius ?? origin.radius, null),
    image: origin.image ?? normalizedEnvironment.Origin.image,
  };

  normalizedEnvironment.Wind = normalizeWindValue(environment?.Wind, warnings);
  normalizedEnvironment.TimeOfDay = extractTimeOfDay(environment?.TimeOfDay);
  normalizedEnvironment.Sades = Array.isArray(environment?.Sades)
    ? cloneIfObject(environment.Sades)
    : null;
  normalizedEnvironment.enableFuzzy = fuzzyTest != null;
  normalizedEnvironment.windFuzzy = fuzzyTest?.target === 'Wind';
  normalizedEnvironment.timeOfDayFuzzy = fuzzyTest?.target === 'TimeOfDay';
  normalizedEnvironment.positionFuzzy = fuzzyTest?.target === 'Position';

  return normalizedEnvironment;
}

function normalizeTaskDrone(drone, index) {
  const missionName = drone?.Mission?.name ?? drone?.MissionValue ?? DEFAULT_MISSION_NAME;
  return buildDefaultDrone(index, {
    ...cloneIfObject(drone),
    MissionValue: missionName,
    Mission: {
      name: missionName,
      param: Array.isArray(drone?.Mission?.param) ? cloneIfObject(drone.Mission.param) : [],
    },
  });
}

export function normalizeTaskPayloadConfig(taskPayload) {
  const warnings = [];
  const drones = Array.isArray(taskPayload?.Drones)
    ? taskPayload.Drones.map((drone, index) => normalizeTaskDrone(drone, index))
    : [];

  const config = {
    source: {
      type: 'task-payload',
      effectiveType: 'task-payload',
      name: null,
      warnings: [],
    },
    environment: normalizeEnvironmentFromTaskPayload(
      taskPayload?.environment,
      taskPayload?.FuzzyTest,
      warnings
    ),
    Drones: drones,
    monitors: isPlainObject(taskPayload?.monitors) ? cloneIfObject(taskPayload.monitors) : null,
    FuzzyTest: isPlainObject(taskPayload?.FuzzyTest) ? cloneIfObject(taskPayload.FuzzyTest) : null,
  };

  return { config, warnings };
}

function normalizeAirSimVehicle(vehicleName, vehicleSettings, index, warnings) {
  if (!isPlainObject(vehicleSettings)) {
    warnings.push(`Vehicle "${vehicleName}" was malformed and was skipped.`);
    return null;
  }

  warnings.push(
    `Vehicle "${vehicleName}" came from AirSim settings only; mission metadata was defaulted to "${DEFAULT_MISSION_NAME}".`
  );

  return buildDefaultDrone(index, {
    ...cloneIfObject(vehicleSettings),
    Name: vehicleName,
    droneName: vehicleName,
    VehicleType: vehicleSettings.VehicleType ?? vehicleSettings.FlightController ?? 'SimpleFlight',
    FlightController: vehicleSettings.FlightController ?? 'SimpleFlight',
    droneType: inferDroneType(vehicleSettings),
    droneModel: inferDroneModel(vehicleSettings),
    MissionValue: DEFAULT_MISSION_NAME,
    Mission: {
      name: DEFAULT_MISSION_NAME,
      param: [],
    },
  });
}

export function normalizeAirSimSettingsConfig(settingsJson) {
  const warnings = [];
  const normalizedEnvironment = buildDefaultEnvironment();
  const originGeopoint = isPlainObject(settingsJson?.OriginGeopoint) ? settingsJson.OriginGeopoint : {};

  normalizedEnvironment.UseGeo =
    originGeopoint.Latitude != null && originGeopoint.Longitude != null;
  normalizedEnvironment.Origin = {
    Latitude: toFiniteNumber(originGeopoint.Latitude, null),
    Longitude: toFiniteNumber(originGeopoint.Longitude, null),
    Height: toFiniteNumber(originGeopoint.Altitude, null),
    Name: normalizedEnvironment.Origin.Name,
    Radius: normalizedEnvironment.Origin.Radius,
    image: normalizedEnvironment.Origin.image,
  };
  normalizedEnvironment.Wind = normalizeWindValue(settingsJson?.Wind, warnings);
  normalizedEnvironment.TimeOfDay = extractTimeOfDay(settingsJson?.TimeOfDay);

  const vehicles = isPlainObject(settingsJson?.Vehicles) ? settingsJson.Vehicles : {};
  const drones = Object.entries(vehicles)
    .map(([vehicleName, vehicleSettings], index) =>
      normalizeAirSimVehicle(vehicleName, vehicleSettings, index, warnings)
    )
    .filter(Boolean);

  return {
    config: {
      source: {
        type: 'airsim-settings',
        effectiveType: 'airsim-settings',
        name: null,
        warnings: [],
      },
      environment: normalizedEnvironment,
      Drones: drones,
      monitors: null,
      FuzzyTest: null,
    },
    warnings,
  };
}

export function normalizeSnapshotBundleConfig(snapshotBundle) {
  const warnings = [];
  const taskPayload = isPlainObject(snapshotBundle?.task) ? snapshotBundle.task : null;
  const settingsJson = isPlainObject(snapshotBundle?.settings) ? snapshotBundle.settings : null;

  if (taskPayload != null) {
    const taskResult = normalizeTaskPayloadConfig(taskPayload);
    warnings.push(...taskResult.warnings);

    if (settingsJson != null) {
      warnings.push(
        'Snapshot bundle includes both settings.json and task.json; task.json was treated as the primary editable source.'
      );
    }

    return {
      config: {
        ...taskResult.config,
        source: {
          type: 'snapshot-bundle',
          effectiveType: 'task-payload',
          name: null,
          warnings: [],
        },
      },
      warnings,
    };
  }

  if (settingsJson != null) {
    const settingsResult = normalizeAirSimSettingsConfig(settingsJson);
    return {
      config: {
        ...settingsResult.config,
        source: {
          type: 'snapshot-bundle',
          effectiveType: 'airsim-settings',
          name: null,
          warnings: [],
        },
      },
      warnings: [
        ...settingsResult.warnings,
        'Snapshot bundle did not include task.json, so wizard-only metadata was reconstructed from settings.json where possible.',
      ],
    };
  }

  return {
    config: null,
    warnings,
  };
}

export function normalizePresetConfig(presetConfig) {
  if (isPlainObject(presetConfig?.settings)) {
    const snapshotLikeResult = normalizeSnapshotBundleConfig(presetConfig);
    return {
      config: snapshotLikeResult.config
        ? {
            ...snapshotLikeResult.config,
            source: {
              ...snapshotLikeResult.config.source,
              type: 'preset',
            },
          }
        : null,
      warnings: snapshotLikeResult.warnings,
    };
  }

  if (Array.isArray(presetConfig?.Drones) && isPlainObject(presetConfig?.environment)) {
    const taskLikeResult = normalizeTaskPayloadConfig(presetConfig);
    return {
      config: {
        ...taskLikeResult.config,
        source: {
          ...taskLikeResult.config.source,
          type: 'preset',
          effectiveType: 'task-payload',
        },
      },
      warnings: taskLikeResult.warnings,
    };
  }

  if (presetConfig?.SettingsVersion != null && isPlainObject(presetConfig?.Vehicles)) {
    const settingsLikeResult = normalizeAirSimSettingsConfig(presetConfig);
    return {
      config: {
        ...settingsLikeResult.config,
        source: {
          ...settingsLikeResult.config.source,
          type: 'preset',
          effectiveType: 'airsim-settings',
        },
      },
      warnings: settingsLikeResult.warnings,
    };
  }

  return {
    config: null,
    warnings: [],
  };
}
