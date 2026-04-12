/* eslint-env jest */
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import HorizontalLinearStepper from '../components/HorizontalLinearStepper';
import { saveSnapshot, isSupported } from '../services/savedSettingsStorage';
import { MainJsonProvider } from '../contexts/MainJsonContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/EnvironmentConfiguration', () => {
  const React = require('react');

  return function MockEnvironmentConfiguration(props) {
    const lastForwardedEnvironmentRef = React.useRef(null);

    React.useEffect(() => {
      if (props.mainJsonValue.environment == null) {
        props.environmentJson(
          {
            UseGeo: true,
            Origin: {
              Latitude: 41.980381,
              Longitude: -87.934524,
              Height: 200,
            },
            Wind: {
              Direction: 'N',
              Velocity: 5,
            },
            TimeOfDay: '10:00:00',
          },
          props.id
        );
        return;
      }

      if (lastForwardedEnvironmentRef.current !== props.mainJsonValue.environment) {
        lastForwardedEnvironmentRef.current = props.mainJsonValue.environment;
        props.environmentJson(props.mainJsonValue.environment, props.id);
      }
    }, [props]);

    return (
      <div>
        <div>Environment Configuration</div>
        <div data-testid='env-origin-lat'>
          {props.mainJsonValue.environment?.Origin?.Latitude ?? ''}
        </div>
        <div data-testid='env-origin-height'>
          {props.mainJsonValue.environment?.Origin?.Height ?? ''}
        </div>
      </div>
    );
  };
});

jest.mock('../components/Configuration/MissionConfiguration', () => {
  const React = require('react');
  const { useMainJson } = require('../contexts/MainJsonContext');
  const { SimulationConfigurationModel } = require('../model/SimulationConfigurationModel');

  return function MockMissionConfiguration(props) {
    const { mainJson, setMainJson } = useMainJson();

    React.useEffect(() => {
      if (props.mainJsonValue.Drones == null) {
        props.droneArrayJson(
          [
            {
              Name: 'Drone1',
              droneName: 'Drone1',
              X: 41.980381,
              Y: -87.934524,
              Z: 5,
              Pitch: 0,
              Roll: 0,
              Yaw: 0,
              FlightController: 'SimpleFlight',
              DefaultVehicleState: 'Armed',
              EnableCollisionPassthrogh: false,
              EnableCollisions: true,
              AllowAPIAlways: true,
              EnableTrace: false,
              MissionValue: 'fly_to_points',
              Mission: {
                name: 'fly_to_points',
                param: [],
              },
            },
          ],
          props.id
        );
      }
    }, [props]);

    const editImportedDrone = () => {
      const drones = props.mainJsonValue.Drones ?? [];
      if (drones.length === 0) {
        return;
      }

      const updatedDrone = {
        ...drones[0],
        X: 44.44,
      };
      const nextDrones = [updatedDrone, ...drones.slice(1)];
      props.droneArrayJson(nextDrones, props.id);

      if (mainJson.getAllDrones().length > 0) {
        const nextMainJson = SimulationConfigurationModel.getReactStateBasedUpdate(mainJson);
        nextMainJson.updateDroneBasedOnIndex(0, updatedDrone);
        setMainJson(nextMainJson);
      }
    };

    return (
      <div>
        <div>Mission Configuration</div>
        <div data-testid='mission-summary'>
          {(props.mainJsonValue.Drones ?? [])
            .map((drone) => `${drone.Name}:${drone.MissionValue}:${drone.X},${drone.Y},${drone.Z}`)
            .join('|')}
        </div>
        <button type='button' onClick={editImportedDrone}>
          Update Imported Drone Latitude
        </button>
      </div>
    );
  };
});

jest.mock('../components/MonitorControl', () => {
  const React = require('react');

  return function MockMonitorControl(props) {
    React.useEffect(() => {
      if (props.mainJsonValue.monitors == null) {
        props.monitorJson(
          {
            battery_monitor: {
              enable: true,
              param: [],
            },
          },
          props.id
        );
      }
    }, [props]);

    return <div>Monitor Control</div>;
  };
});

jest.mock('../components/cesium/CesiumMap', () => {
  const React = require('react');
  const { useMainJson } = require('../contexts/MainJsonContext');

  return function MockCesiumMap() {
    const { mainJson, envJson } = useMainJson();
    const firstDrone = mainJson.getAllDrones()[0];

    return (
      <div
        data-testid='cesium-map'
        data-drone-count={String(mainJson.getAllDrones().length)}
        data-first-drone-x={firstDrone?.X ?? ''}
        data-origin-lat={envJson?.Origin?.latitude ?? ''}
        data-origin-height={envJson?.Origin?.height ?? ''}
      />
    );
  };
});
jest.mock('../components/Configuration/ControlsDisplay', () => () => <div />);
jest.mock('../services/savedSettingsStorage', () => ({
  isSupported: jest.fn(),
  saveSnapshot: jest.fn(),
}));

function mockFetchResponse(body) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

async function renderAtFinalStep() {
  render(
    <MainJsonProvider>
      <HorizontalLinearStepper desc='Scenario description' />
    </MainJsonProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  await screen.findByRole('button', { name: /finish/i });
}

function renderStepper(props = {}) {
  return render(
    <MainJsonProvider>
      <HorizontalLinearStepper desc='Scenario description' {...props} />
    </MainJsonProvider>
  );
}

async function choosePreset(name) {
  fireEvent.mouseDown(screen.getByLabelText(/preset configuration/i));
  const listbox = await screen.findByRole('listbox');
  fireEvent.click(within(listbox).getByText(name));
}

describe('HorizontalLinearStepper finish flow', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    isSupported.mockReturnValue(true);
    saveSnapshot.mockResolvedValue({ name: 'settings-1.json' });
    mockNavigate.mockReset();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('opens the save decision dialog before submitting', async () => {
    await renderAtFinalStep();

    fireEvent.click(screen.getByRole('button', { name: /finish/i }));

    expect(
      screen.getByRole('heading', { name: /save settings\.json and task\.json before submission\?/i })
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('submits without preview when user chooses no', async () => {
    global.fetch.mockResolvedValueOnce(mockFetchResponse({ task_id: 'task-1' }));

    await renderAtFinalStep();
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /no, just submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);

    expect(url).toContain('/addTask');
    expect(payload.Drones[0].MissionValue).toBe('fly_to_points');
    expect(payload.environment.Origin.Altitude).toBe(200);
    expect(saveSnapshot).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/reports');
  });

  test('previews, saves, and then submits when user chooses yes', async () => {
    global.fetch
      .mockResolvedValueOnce(
        mockFetchResponse({
          settings: {
            SettingsVersion: 2.0,
            Vehicles: {
              Drone1: {
                X: 1,
                Y: 2,
                Z: 3,
              },
            },
          },
        })
      )
      .mockResolvedValueOnce(mockFetchResponse({ task_id: 'task-2' }));

    await renderAtFinalStep();
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, save both and submit/i }));

    await waitFor(() => {
      expect(saveSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          SettingsVersion: 2.0,
        }),
        expect.objectContaining({
          Drones: expect.any(Array),
          environment: expect.any(Object),
        })
      );
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    expect(global.fetch.mock.calls[0][0]).toContain('/api/simulation/settings/preview');
    expect(global.fetch.mock.calls[1][0]).toContain('/addTask');
    expect(mockNavigate).toHaveBeenCalledWith('/reports');
  });

  test('blocks submit when saving fails', async () => {
    global.fetch.mockResolvedValueOnce(
      mockFetchResponse({
        settings: {
          SettingsVersion: 2.0,
        },
      })
    );
    saveSnapshot.mockRejectedValueOnce(new Error('disk full'));

    await renderAtFinalStep();
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, save both and submit/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/save failed: disk full/i)).toHaveLength(2);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/api/simulation/settings/preview');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('loads a preset into visible wizard state through the import panel', async () => {
    renderStepper();

    await choosePreset('Circular and Square Flight Mission in Windy Weather');
    fireEvent.click(screen.getByRole('button', { name: /load preset/i }));

    await waitFor(() => {
      expect(screen.getByTestId('import-status')).toHaveTextContent(
        'Loaded preset "Circular and Square Flight Mission in Windy Weather" into the wizard.'
      );
      expect(screen.getByTestId('env-origin-lat')).toHaveTextContent('42.1142');
      expect(screen.getByTestId('env-origin-height')).toHaveTextContent('208');
    });

    await waitFor(() => {
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-origin-lat', '42.1142');
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mission-summary')).toHaveTextContent(
        'Circle Drone:fly_in_circle:42.1142,-87.9011,30'
      );
      expect(screen.getByTestId('mission-summary')).toHaveTextContent(
        'Square Drone:fly_to_points:42.1144,-87.9009,32'
      );
    });
  });

  test('applies imported config to submission state and context state, then stays editable', async () => {
    global.fetch.mockResolvedValueOnce(mockFetchResponse({ task_id: 'task-imported' }));

    const importedConfig = {
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 35.1234,
          Longitude: -80.9876,
          Height: 125,
          Name: 'Specify Region',
        },
        Wind: {
          Direction: 'SE',
          Force: 8,
          Velocity: 8,
        },
        TimeOfDay: '14:15:16',
      },
      Drones: [
        {
          Name: 'Imported Drone',
          droneName: 'Imported Drone',
          FlightController: 'SimpleFlight',
          VehicleType: 'SimpleFlight',
          DefaultVehicleState: 'Armed',
          EnableCollisionPassthrogh: false,
          EnableCollisions: true,
          AllowAPIAlways: true,
          EnableTrace: false,
          droneType: 'FixedWing',
          droneModel: 'TrinityF90',
          X: 35.1235,
          Y: -80.9875,
          Z: 42,
          Pitch: 0,
          Roll: 0,
          Yaw: 0,
          MissionValue: 'fly_in_circle',
          Mission: {
            name: 'fly_in_circle',
            param: [],
          },
        },
      ],
      monitors: {
        battery_monitor: {
          enable: true,
          param: [],
        },
      },
      FuzzyTest: {
        target: 'Wind',
        precision: 3,
      },
    };

    renderStepper({ importedConfig });

    await waitFor(() => {
      expect(screen.getByTestId('env-origin-lat')).toHaveTextContent('35.1234');
      expect(screen.getByTestId('env-origin-height')).toHaveTextContent('125');
    });

    await waitFor(() => {
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-drone-count', '1');
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-first-drone-x', '35.1235');
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-origin-lat', '35.1234');
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-origin-height', '125');
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByTestId('mission-summary')).toHaveTextContent(
        'Imported Drone:fly_in_circle:35.1235,-80.9875,42'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /update imported drone latitude/i }));
    expect(screen.getByTestId('mission-summary')).toHaveTextContent(
      'Imported Drone:fly_in_circle:44.44,-80.9875,42'
    );

    await waitFor(() => {
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-first-drone-x', '44.44');
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    fireEvent.click(screen.getByRole('button', { name: /no, just submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload.Drones[0].MissionValue).toBe('fly_in_circle');
    expect(payload.Drones[0].X).toBe(44.44);
    expect(payload.environment.Origin.Latitude).toBe(35.1234);
    expect(payload.environment.Origin.Altitude).toBe(125);
    expect(payload.monitors).toEqual(importedConfig.monitors);
    expect(payload.FuzzyTest).toEqual(importedConfig.FuzzyTest);
  });

  test('keeps AirSim settings-derived drones stable when environment updates echo back through the wizard', async () => {
    const importedConfig = {
      source: {
        type: 'airsim-settings',
        effectiveType: 'airsim-settings',
      },
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 41.980381,
          Longitude: -87.934524,
          Height: 200,
          Name: 'Specify Region',
        },
        Wind: {
          Direction: 'N',
          Force: 5,
          Velocity: 5,
        },
        TimeOfDay: '10:00:00',
      },
      Drones: [
        {
          Name: 'AirSim Drone',
          droneName: 'AirSim Drone',
          FlightController: 'SimpleFlight',
          VehicleType: 'SimpleFlight',
          DefaultVehicleState: 'Armed',
          EnableCollisionPassthrogh: false,
          EnableCollisions: true,
          AllowAPIAlways: true,
          EnableTrace: false,
          droneType: 'MultiRotor',
          droneModel: 'DJI',
          X: 5,
          Y: 10,
          Z: -3,
          Pitch: 0,
          Roll: 0,
          Yaw: 0,
          MissionValue: 'fly_to_points',
          Mission: {
            name: 'fly_to_points',
            param: [],
          },
        },
      ],
      monitors: null,
      FuzzyTest: null,
    };

    renderStepper({ importedConfig });

    await waitFor(() => {
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-drone-count', '1');
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-first-drone-x', '5');
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mission-summary')).toHaveTextContent(
        'AirSim Drone:fly_to_points:5,10,-3'
      );
    });
  });
});
