import { buildPresetDrone, buildPresetEnvironment } from './presetBuilders';

const sourceJson = {
  environment: buildPresetEnvironment(41.7619, -88.1535, 195, '11:15:00', 'E', 6),
  Drones: [
    buildPresetDrone(0, {
      Name: 'Lead Drone',
      X: 41.7619,
      Y: -88.1535,
      Z: 26,
      MissionValue: 'fly_to_points',
    }),
    buildPresetDrone(1, {
      Name: 'Wing Drone',
      X: 41.7621,
      Y: -88.1532,
      Z: 26,
      MissionValue: 'fly_in_circle',
      droneModel: 'ParrotANAFI',
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
