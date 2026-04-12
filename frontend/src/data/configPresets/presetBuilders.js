function buildMission(missionName) {
  return {
    name: missionName,
    param: [],
  };
}

export function buildPresetEnvironment(latitude, longitude, height, timeOfDay, windDirection, windForce) {
  return {
    UseGeo: true,
    Origin: {
      Latitude: latitude,
      Longitude: longitude,
      Height: height,
      Name: 'Specify Region',
    },
    Wind: {
      Type: 'Constant Wind',
      Direction: windDirection,
      Force: windForce,
      Velocity: windForce,
    },
    TimeOfDay: timeOfDay,
  };
}

export function buildPresetDrone(index, overrides = {}) {
  const name = overrides.Name ?? `Preset Drone ${index + 1}`;
  const missionName = overrides.MissionValue ?? overrides.Mission?.name ?? 'fly_to_points';

  return {
    Name: name,
    droneName: name,
    FlightController: 'SimpleFlight',
    VehicleType: 'SimpleFlight',
    DefaultVehicleState: 'Armed',
    EnableCollisionPassthrogh: false,
    EnableCollisions: true,
    AllowAPIAlways: true,
    EnableTrace: false,
    droneType: overrides.droneType ?? 'MultiRotor',
    droneModel: overrides.droneModel ?? 'DJI',
    X: overrides.X ?? 0,
    Y: overrides.Y ?? 0,
    Z: overrides.Z ?? 25,
    Pitch: 0,
    Roll: 0,
    Yaw: 0,
    Sensors: null,
    MissionValue: missionName,
    Mission: buildMission(missionName),
  };
}
