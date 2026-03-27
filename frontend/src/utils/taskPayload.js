const stripSensorKey = (sensor) => {
  if (!sensor) return undefined;
  const sanitizedSensor = { ...sensor };
  delete sanitizedSensor.Key;
  return sanitizedSensor;
};

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

  if (environment.Wind) environmentToSend.Wind = environment.Wind;
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
