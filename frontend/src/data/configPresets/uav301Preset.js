import { buildPresetDrone, buildPresetEnvironment } from './presetBuilders';

const sourceJson = {
  environment: buildPresetEnvironment(42.1142, -87.9011, 208, '09:30:00', 'NW', 7),
  Drones: [
    buildPresetDrone(0, {
      Name: 'Circle Drone',
      X: 42.1142,
      Y: -87.9011,
      Z: 30,
      MissionValue: 'fly_in_circle',
    }),
    buildPresetDrone(1, {
      Name: 'Square Drone',
      X: 42.1144,
      Y: -87.9009,
      Z: 32,
      MissionValue: 'fly_to_points',
    }),
  ],
  monitors: {
    battery_monitor: {
      enable: true,
      param: [],
    },
  },
};

export default sourceJson;
