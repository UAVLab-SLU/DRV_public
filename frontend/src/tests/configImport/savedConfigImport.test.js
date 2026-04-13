/* eslint-env jest */

import {
  normalizeImportedConfig,
  normalizeImportedConfigText,
} from '../../services/configImport/savedConfigImport';

describe('savedConfigImport normalization layer', () => {
  const buildTaskPayload = () => ({
    Drones: [
      {
        Name: 'DroneAlpha',
        droneName: 'Drone Alpha',
        FlightController: 'SimpleFlight',
        X: 41.98,
        Y: -87.93,
        Z: 30,
        Pitch: 0,
        Roll: 0,
        Yaw: 90,
        Sensors: {
          GPS: { Enabled: true },
        },
        MissionValue: 'fly_in_circle',
        Mission: {
          name: 'fly_in_circle',
          param: [25],
        },
      },
      {
        Name: 'DroneBeta',
        X: 41.99,
        Y: -87.94,
        Z: 40,
        MissionValue: 'fly_to_points',
        Mission: {
          name: 'fly_to_points',
          param: [[1, 2, 3]],
        },
      },
    ],
    environment: {
      UseGeo: true,
      Origin: {
        Latitude: 41.980381,
        Longitude: -87.934524,
        Altitude: 203,
      },
      Wind: {
        Direction: 'NE',
        Velocity: 5,
      },
      TimeOfDay: '10:00:00',
    },
    monitors: {
      collision_monitor: {
        enable: true,
        param: [],
      },
    },
    FuzzyTest: {
      target: 'Wind',
      precision: 5,
    },
  });

  test('normalizes a raw task payload into the canonical wizard shape', () => {
    const result = normalizeImportedConfig(buildTaskPayload());

    expect(result.ok).toBe(true);
    expect(result.sourceType).toBe('task-payload');
    expect(result.config.environment.Origin.Height).toBe(203);
    expect(result.config.environment.Wind.Direction).toBe('NE');
    expect(result.config.environment.Wind.Force).toBe(5);
    expect(result.config.environment.enableFuzzy).toBe(true);
    expect(result.config.environment.windFuzzy).toBe(true);
    expect(result.config.monitors).toEqual({
      collision_monitor: {
        enable: true,
        param: [],
      },
    });
    expect(result.config.Drones).toHaveLength(2);
    expect(result.config.Drones[0].MissionValue).toBe('fly_in_circle');
    expect(result.config.Drones[0].Mission.param).toEqual([25]);
  });

  test('normalizes a snapshot bundle and treats task.json as the primary editable source', () => {
    const taskPayload = buildTaskPayload();
    const settingsJson = {
      SettingsVersion: 2.0,
      OriginGeopoint: {
        Latitude: 11,
        Longitude: 22,
        Altitude: 33,
      },
      Vehicles: {
        DroneAlpha: {
          FlightController: 'SimpleFlight',
          X: 1,
          Y: 2,
          Z: 3,
        },
      },
    };

    const result = normalizeImportedConfig({
      version: 2,
      settings: settingsJson,
      task: taskPayload,
    });

    expect(result.ok).toBe(true);
    expect(result.sourceType).toBe('snapshot-bundle');
    expect(result.effectiveType).toBe('task-payload');
    expect(result.config.Drones[0].X).toBe(41.98);
    expect(result.config.environment.Origin.Height).toBe(203);
    expect(result.warnings).toContain(
      'Snapshot bundle includes both settings.json and task.json; task.json was treated as the primary editable source.',
    );
  });

  test('normalizes a settings-only snapshot bundle with explicit recovery warnings', () => {
    const result = normalizeImportedConfig({
      version: 2,
      settings: {
        SettingsVersion: 2.0,
        OriginGeopoint: {
          Latitude: 44.1,
          Longitude: -93.2,
          Altitude: 245,
        },
        Vehicles: {
          LegacyDrone: {
            FlightController: 'SimpleFlight',
            X: 44.1001,
            Y: -93.1999,
            Z: 33,
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.sourceType).toBe('snapshot-bundle');
    expect(result.effectiveType).toBe('airsim-settings');
    expect(result.config.environment.Origin.Height).toBe(245);
    expect(result.config.Drones[0].Name).toBe('LegacyDrone');
    expect(result.warnings.join(' ')).toContain(
      'wizard-only metadata was reconstructed from settings.json where possible',
    );
  });

  test('normalizes finalized AirSim settings and reconstructs wizard defaults where necessary', () => {
    const result = normalizeImportedConfig({
      SettingsVersion: 2.0,
      OriginGeopoint: {
        Latitude: 41.9,
        Longitude: -87.9,
        Altitude: 211,
      },
      Wind: {
        X: 0,
        Y: 5,
        Z: 0,
      },
      TimeOfDay: {
        Enabled: true,
        StartDateTime: '2026-03-29 10:00:00',
      },
      Vehicles: {
        DroneAlpha: {
          FlightController: 'SimpleFlight',
          X: 10,
          Y: 20,
          Z: 30,
          Sensors: {
            GPS: { Enabled: true },
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.sourceType).toBe('airsim-settings');
    expect(result.config.environment.UseGeo).toBe(true);
    expect(result.config.environment.Origin.Height).toBe(211);
    expect(result.config.environment.TimeOfDay).toBe('10:00:00');
    expect(result.config.environment.Wind.Direction).toBe('E');
    expect(result.config.environment.Wind.Force).toBe(5);
    expect(result.config.Drones[0].MissionValue).toBe('fly_to_points');
    expect(result.warnings.join(' ')).toContain('mission metadata was defaulted');
  });

  test('supports dev-team preset config JSON via source hint', () => {
    const result = normalizeImportedConfig(
      {
        id: 'preset-1',
        displayName: 'Circle Mission Preset',
        config: buildTaskPayload(),
      },
      { sourceHint: 'preset' },
    );

    expect(result.ok).toBe(true);
    expect(result.sourceType).toBe('preset');
    expect(result.effectiveType).toBe('task-payload');
    expect(result.config.source.name).toBe('Circle Mission Preset');
    expect(result.config.Drones[0].MissionValue).toBe('fly_in_circle');
  });

  test('returns a structured error for invalid JSON text', () => {
    const result = normalizeImportedConfigText('{bad json');

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('Invalid JSON:');
  });

  test('fails validation when required drone fields are missing', () => {
    const result = normalizeImportedConfig({
      Drones: [
        {
          Name: 'DroneAlpha',
          Y: -87.93,
          Z: 30,
          Mission: {
            name: 'fly_to_points',
            param: [],
          },
        },
      ],
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 41.98,
          Longitude: -87.93,
          Altitude: 200,
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('DroneAlpha has an invalid X position.');
  });

  test('fails validation when required geo environment fields are missing', () => {
    const result = normalizeImportedConfig({
      Drones: [
        {
          Name: 'DroneAlpha',
          X: 41.98,
          Y: -87.93,
          Z: 30,
          Mission: {
            name: 'fly_to_points',
            param: [],
          },
        },
      ],
      environment: {
        UseGeo: true,
        Origin: {
          Altitude: 200,
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'Environment origin latitude is required for geo-based configurations.',
    );
    expect(result.errors).toContain(
      'Environment origin longitude is required for geo-based configurations.',
    );
  });

  test('returns an actionable error for unsupported JSON shapes', () => {
    const result = normalizeImportedConfig({
      hello: 'world',
      version: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Unsupported configuration format. Import a saved snapshot bundle, a raw task payload, or an AirSim settings.json file.',
    ]);
  });

  test('preserves multi-drone ordering and mission mapping', () => {
    const result = normalizeImportedConfig(buildTaskPayload());

    expect(result.ok).toBe(true);
    expect(result.config.Drones.map((drone) => drone.Name)).toEqual(['DroneAlpha', 'DroneBeta']);
    expect(result.config.Drones[1].MissionValue).toBe('fly_to_points');
    expect(result.config.Drones[1].Mission.param).toEqual([[1, 2, 3]]);
  });
});
