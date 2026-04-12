/* eslint-env jest */

import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MainJsonProvider } from '../contexts/MainJsonContext';
import SavedSettings from '../pages/SavedSettings';
import Wizard from '../pages/Wizard';

jest.mock('../services/savedSettingsStorage', () => ({
  isSupported: jest.fn(),
  listSnapshots: jest.fn(),
  readSnapshot: jest.fn(),
  deleteSnapshot: jest.fn(),
  downloadSettingsSnapshot: jest.fn(),
  downloadTaskSnapshot: jest.fn(),
}));

jest.mock('../components/EnvironmentConfiguration', () => {
  const React = require('react');

  return function MockEnvironmentConfiguration(props) {
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
      props.droneArrayJson([updatedDrone, ...drones.slice(1)], props.id);

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
      />
    );
  };
});

jest.mock('../components/Configuration/ControlsDisplay', () => () => <div />);

const {
  isSupported,
  listSnapshots,
  readSnapshot,
} = require('../services/savedSettingsStorage');

function buildSnapshotRecord(overrides = {}) {
  return {
    name: 'settings-20260401T120000000.json',
    lastModified: Date.now(),
    size: 2048,
    savedAt: new Date().toISOString(),
    settingsJson: {
      SettingsVersion: 2,
      OriginGeopoint: {
        Latitude: 35.1234,
        Longitude: -80.9876,
        Altitude: 125,
      },
      Vehicles: {
        'Imported Drone': {
          VehicleType: 'SimpleFlight',
          X: 35.1235,
          Y: -80.9875,
          Z: 42,
        },
      },
      Wind: {
        X: -5,
        Y: 2,
        Z: 0,
      },
      TimeOfDay: {
        Enabled: true,
        StartDateTime: '2024-04-01 14:15:16',
      },
    },
    taskJson: {
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
      monitors: {
        battery_monitor: {
          enable: true,
          param: [],
        },
      },
    },
    hasTask: true,
    canSimulate: true,
    ...overrides,
  };
}

function renderSavedSettingsFlow() {
  return render(
    <MainJsonProvider>
      <MemoryRouter initialEntries={['/saved-settings']}>
        <Routes>
          <Route path='/saved-settings' element={<SavedSettings />} />
          <Route path='/simulation' element={<Wizard />} />
        </Routes>
      </MemoryRouter>
    </MainJsonProvider>
  );
}

describe('Saved settings wizard loading', () => {
  beforeEach(() => {
    isSupported.mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('saved task bundle can load into the wizard and remain editable', async () => {
    const snapshot = buildSnapshotRecord();
    listSnapshots.mockResolvedValue([snapshot]);
    readSnapshot.mockResolvedValue(snapshot);

    renderSavedSettingsFlow();

    await screen.findByText(snapshot.name);
    fireEvent.click(screen.getByRole('button', { name: /load into wizard/i }));

    await waitFor(() => {
      expect(screen.getByText(/loaded "settings-20260401T120000000\.json" into the wizard/i)).toBeInTheDocument();
      expect(screen.getByTestId('env-origin-lat')).toHaveTextContent('35.1234');
      expect(screen.getByTestId('env-origin-height')).toHaveTextContent('125');
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-origin-lat', '35.1234');
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mission-summary')).toHaveTextContent(
        'Imported Drone:fly_in_circle:35.1235,-80.9875,42'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /update imported drone latitude/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mission-summary')).toHaveTextContent(
        'Imported Drone:fly_in_circle:44.44,-80.9875,42'
      );
      expect(screen.getByTestId('cesium-map')).toHaveAttribute('data-first-drone-x', '44.44');
    });
  });

  test('legacy settings-only entries stay loadable even when they are not replayable', async () => {
    const snapshot = buildSnapshotRecord({
      name: 'settings-legacy.json',
      taskJson: null,
      hasTask: false,
      canSimulate: false,
    });
    listSnapshots.mockResolvedValue([snapshot]);
    readSnapshot.mockResolvedValue(snapshot);

    renderSavedSettingsFlow();

    await screen.findByText('settings-legacy.json');
    expect(screen.getByRole('button', { name: /load into wizard/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /simulate/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/legacy settings-only snapshot\. wizard load is available/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /load into wizard/i }));

    await waitFor(() => {
      expect(screen.getByText(/loaded "settings-legacy\.json" into the wizard with recovered fields/i)).toBeInTheDocument();
    });
  });
});
