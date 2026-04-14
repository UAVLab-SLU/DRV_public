import { buildPresetDrone, buildPresetEnvironment } from './presetBuilders';

const sourceJson = {
  environment: buildPresetEnvironment(40.8341, -96.6847, 220, '15:45:00', 'S', 9),
  Drones: [
    buildPresetDrone(0, {
      Name: 'Accuracy Drone 1',
      X: 40.8341,
      Y: -96.6847,
      Z: 28,
      MissionValue: 'fly_to_points',
    }),
    buildPresetDrone(1, {
      Name: 'Accuracy Drone 2',
      X: 40.8343,
      Y: -96.6844,
      Z: 28,
      MissionValue: 'fly_to_points',
      droneModel: 'StreamLineDesignX189',
    }),
  ],
  monitors: {
    battery_monitor: {
      enable: true,
      param: [],
    },
  },
  FuzzyTest: {
    target: 'Wind',
    precision: 5,
  },
};

export default sourceJson;
