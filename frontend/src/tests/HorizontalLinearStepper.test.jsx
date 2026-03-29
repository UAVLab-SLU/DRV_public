/* eslint-env jest */
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HorizontalLinearStepper from '../components/HorizontalLinearStepper';
import { saveSnapshot, isSupported } from '../services/savedSettingsStorage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/EnvironmentConfiguration', () => {
  const React = require('react');

  return function MockEnvironmentConfiguration(props) {
    React.useEffect(() => {
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
    }, [props]);

    return <div>Environment Configuration</div>;
  };
});

jest.mock('../components/Configuration/MissionConfiguration', () => {
  const React = require('react');

  return function MockMissionConfiguration(props) {
    React.useEffect(() => {
      props.droneArrayJson(
        [
          {
            Name: 'Drone1',
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
    }, [props]);

    return <div>Mission Configuration</div>;
  };
});

jest.mock('../components/MonitorControl', () => {
  const React = require('react');

  return function MockMonitorControl(props) {
    React.useEffect(() => {
      props.monitorJson(
        {
          battery_monitor: {
            enable: true,
            param: [],
          },
        },
        props.id
      );
    }, [props]);

    return <div>Monitor Control</div>;
  };
});

jest.mock('../components/cesium/CesiumMap', () => () => <div data-testid='cesium-map' />);
jest.mock('../components/Configuration/ControlsDisplay', () => () => <div />);
jest.mock('../services/savedSettingsStorage', () => ({
  isSupported: jest.fn(),
  saveSnapshot: jest.fn(),
}));

function mockFetchResponse(body) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

async function renderAtFinalStep() {
  render(<HorizontalLinearStepper desc='Scenario description' />);
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  await screen.findByRole('button', { name: /finish/i });
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
      screen.getByRole('heading', { name: /save settings\.json before submission\?/i })
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
    fireEvent.click(screen.getByRole('button', { name: /yes, save and submit/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /yes, save and submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/save failed: disk full/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/api/simulation/settings/preview');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
