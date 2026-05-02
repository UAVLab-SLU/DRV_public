const stripSensorKey = (sensor) => {
  if (!sensor) return undefined;
  const sanitizedSensor = { ...sensor };
  delete sanitizedSensor.Key;
  return sanitizedSensor;
};

function toFiniteNumberOrOriginal(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
}

function normalizeWindForPayload(wind) {
  if (!wind || typeof wind !== 'object') {
    return wind;
  }

  const normalizedWind = { ...wind };
  if (normalizedWind.Force != null) {
    normalizedWind.Force = toFiniteNumberOrOriginal(normalizedWind.Force);
  }
  if (normalizedWind.Velocity != null) {
    normalizedWind.Velocity = toFiniteNumberOrOriginal(normalizedWind.Velocity);
  }

  if (normalizedWind.Velocity == null && normalizedWind.Force != null) {
    normalizedWind.Velocity = normalizedWind.Force;
  }

  Object.entries(normalizedWind).forEach(([key, value]) => {
    if (
      key.startsWith('Wind') &&
      value &&
      typeof value === 'object' &&
      value.Velocity == null &&
      value.Force != null
    ) {
      normalizedWind[key] = {
        ...value,
        Force: toFiniteNumberOrOriginal(value.Force),
        Velocity: toFiniteNumberOrOriginal(value.Force),
      };
    } else if (key.startsWith('Wind') && value && typeof value === 'object') {
      normalizedWind[key] = {
        ...value,
        Force:
          value.Force != null ? toFiniteNumberOrOriginal(value.Force) : value.Force,
        Velocity:
          value.Velocity != null ? toFiniteNumberOrOriginal(value.Velocity) : value.Velocity,
      };
    }
  });

  return normalizedWind;
}

export function getDronesForPayload(mainJson) {
  return Array.isArray(mainJson?.Drones)
    ? mainJson.Drones.map((droneConfig) => {
        const { Sensors, Mission, MissionValue, ...rest } = droneConfig || {};
        const sanitizedSensors = Sensors
          ? {
              ...Sensors,
              Barometer: stripSensorKey(Sensors.Barometer),
              Magnetometer: stripSensorKey(Sensors.Magnetometer),
              IMU: stripSensorKey(Sensors.IMU),
              GPS: stripSensorKey(Sensors.GPS),
            }
          : undefined;
        const missionName = Mission?.name ?? MissionValue ?? 'fly_to_points';
        const missionParam = Array.isArray(Mission?.param) ? Mission.param : [];
        const sanitizedMissionValue = MissionValue ?? missionName;

        return {
          ...rest,
          MissionValue: sanitizedMissionValue,
          Mission: {
            name: missionName,
            param: missionParam,
          },
          Sensors: sanitizedSensors,
        };
      })
    : [];
}

export function getEnvironmentForPayload(environment) {
  if (!environment) return null;

  const useGeo = !!environment.UseGeo;
  const origin = environment.Origin || {};
  const latitude = origin.Latitude ?? origin.latitude;
  const longitude = origin.Longitude ?? origin.longitude;
  const height = origin.Height ?? origin.height ?? 203;

  const environmentToSend = {
    UseGeo: useGeo,
    Origin: {
      Latitude: latitude,
      Longitude: longitude,
      Altitude: height,
    },
  };

  if (environment.Wind) environmentToSend.Wind = normalizeWindForPayload(environment.Wind);
  if (environment.TimeOfDay) environmentToSend.TimeOfDay = environment.TimeOfDay;
  if (environment.Sades) environmentToSend.Sades = environment.Sades;

  return environmentToSend;
}

export function buildTaskPayload(mainJson) {
  const payload = {
    Drones: getDronesForPayload(mainJson),
    environment: getEnvironmentForPayload(mainJson?.environment),
  };

  if (mainJson?.monitors) {
    payload.monitors = mainJson.monitors;
  }

  if (mainJson?.FuzzyTest) {
    payload.FuzzyTest = mainJson.FuzzyTest;
  }

  return payload;
}
