import { buildTaskPayload } from '../utils/taskPayload';

describe('buildTaskPayload', () => {
  test('maps manual wind force to backend-compatible velocity', () => {
    const payload = buildTaskPayload({
      Drones: [
        {
          Name: 'Drone1',
          X: 41.980381,
          Y: -87.934524,
          Z: 5,
          MissionValue: 'fly_to_points',
          Mission: {
            name: 'fly_to_points',
            param: [],
          },
        },
      ],
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 41.980381,
          Longitude: -87.934524,
          Height: 200,
        },
        Wind: {
          Direction: 'NE',
          Force: 5,
          Type: 'Constant Wind',
          Fluctuation: 10,
        },
        TimeOfDay: '10:00:00',
      },
    });

    expect(payload.environment.Wind).toEqual({
      Direction: 'NE',
      Force: 5,
      Velocity: 5,
      Type: 'Constant Wind',
      Fluctuation: 10,
    });
  });

  test('preserves explicit nested wind-shear velocities and fills missing ones from force', () => {
    const payload = buildTaskPayload({
      Drones: [],
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 41.980381,
          Longitude: -87.934524,
          Height: 200,
        },
        Wind: {
          Direction: 'NE',
          Force: 5,
          Wind1: {
            Direction: 'E',
            Force: 8,
          },
          Wind2: {
            Direction: 'W',
            Force: 6,
            Velocity: 7,
          },
        },
      },
    });

    expect(payload.environment.Wind.Velocity).toBe(5);
    expect(payload.environment.Wind.Wind1).toEqual({
      Direction: 'E',
      Force: 8,
      Velocity: 8,
    });
    expect(payload.environment.Wind.Wind2).toEqual({
      Direction: 'W',
      Force: 6,
      Velocity: 7,
    });
  });

  test('coerces manual string wind inputs to numbers when possible', () => {
    const payload = buildTaskPayload({
      Drones: [],
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 41.980381,
          Longitude: -87.934524,
          Height: 200,
        },
        Wind: {
          Direction: 'NE',
          Force: '5',
          Wind1: {
            Direction: 'E',
            Force: '8',
          },
          Wind2: {
            Direction: 'W',
            Force: '6',
            Velocity: '7',
          },
        },
      },
    });

    expect(payload.environment.Wind.Force).toBe(5);
    expect(payload.environment.Wind.Velocity).toBe(5);
    expect(payload.environment.Wind.Wind1).toEqual({
      Direction: 'E',
      Force: 8,
      Velocity: 8,
    });
    expect(payload.environment.Wind.Wind2).toEqual({
      Direction: 'W',
      Force: 6,
      Velocity: 7,
    });
  });
});
