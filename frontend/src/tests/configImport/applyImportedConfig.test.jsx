/* eslint-env jest */

import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { buildTaskPayload } from '../../utils/taskPayload';
import {
  applyImportedConfig,
  buildImportedStateBundle,
} from '../../services/configImport/applyImportedConfig';
import { MainJsonProvider, useMainJson } from '../../contexts/MainJsonContext';

function buildImportedConfig(overrides = {}) {
  return {
    environment: {
      UseGeo: true,
      Origin: {
        Latitude: 41.9,
        Longitude: -87.9,
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
        Name: 'Drone 1',
        droneName: 'Drone 1',
        FlightController: 'SimpleFlight',
        VehicleType: 'SimpleFlight',
        DefaultVehicleState: 'Armed',
        EnableCollisionPassthrogh: false,
        EnableCollisions: true,
        AllowAPIAlways: true,
        EnableTrace: false,
        droneType: 'MultiRotor',
        droneModel: 'DJI',
        X: 41.9001,
        Y: -87.9001,
        Z: 20,
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
    ...overrides,
  };
}

function ContextProbe({ importedConfig }) {
  const { mainJson, envJson, replaceSimulationConfiguration, syncDroneLocation } = useMainJson();
  const [wizardState, setWizardState] = React.useState(null);

  React.useEffect(() => {
    applyImportedConfig(importedConfig, {
      setWizardState,
      replaceSimulationConfiguration,
    });
  }, [importedConfig, replaceSimulationConfiguration]);

  return (
    <div>
      <div data-testid='wizard-drone-count'>{wizardState?.Drones?.length ?? 0}</div>
      <div data-testid='wizard-mission'>{wizardState?.Drones?.[0]?.MissionValue ?? ''}</div>
      <div data-testid='wizard-origin-lat'>{wizardState?.environment?.Origin?.Latitude ?? ''}</div>
      <div data-testid='context-origin-lat'>{envJson.Origin.latitude}</div>
      <div data-testid='context-drone-x'>{mainJson.getAllDrones()[0]?.X ?? ''}</div>
      <button type='button' onClick={() => syncDroneLocation(55.5, -100.25, 88, 0)}>
        Move Drone
      </button>
    </div>
  );
}

describe('applyImportedConfig helpers', () => {
  test('builds wizard submission state for a one-drone import', () => {
    const importedConfig = buildImportedConfig();
    const { wizardState, simulationModel, environmentModel } =
      buildImportedStateBundle(importedConfig);
    const payload = buildTaskPayload(wizardState);

    expect(payload.Drones).toHaveLength(1);
    expect(payload.Drones[0].MissionValue).toBe('fly_to_points');
    expect(payload.environment.Origin.Latitude).toBe(41.9);
    expect(payload.environment.Origin.Altitude).toBe(200);
    expect(payload.monitors).toEqual(importedConfig.monitors);
    expect(payload.FuzzyTest).toEqual(importedConfig.FuzzyTest);
    expect(simulationModel.getAllDrones()[0].X).toBe(41.9001);
    expect(environmentModel.Origin.latitude).toBe(41.9);
  });

  test('preserves multiple drones, missions, and coordinates', () => {
    const importedConfig = buildImportedConfig({
      Drones: [
        buildImportedConfig().Drones[0],
        {
          ...buildImportedConfig().Drones[0],
          Name: 'Drone 2',
          droneName: 'Drone 2',
          X: 41.9002,
          Y: -87.9002,
          Z: 25,
          MissionValue: 'fly_in_circle',
          Mission: {
            name: 'fly_in_circle',
            param: [],
          },
        },
      ],
    });

    const { wizardState, simulationModel } = buildImportedStateBundle(importedConfig);

    expect(wizardState.Drones).toHaveLength(2);
    expect(wizardState.Drones[1].MissionValue).toBe('fly_in_circle');
    expect(wizardState.Drones[1].Mission.name).toBe('fly_in_circle');
    expect(wizardState.Drones[1].X).toBe(41.9002);
    expect(wizardState.Drones[1].Y).toBe(-87.9002);
    expect(wizardState.Drones[1].Z).toBe(25);
    expect(simulationModel.getAllDrones()).toHaveLength(2);
  });

  test('updates provider-backed state and remains editable after import', async () => {
    render(
      <MainJsonProvider>
        <ContextProbe importedConfig={buildImportedConfig()} />
      </MainJsonProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('wizard-drone-count')).toHaveTextContent('1');
      expect(screen.getByTestId('wizard-mission')).toHaveTextContent('fly_to_points');
      expect(screen.getByTestId('wizard-origin-lat')).toHaveTextContent('41.9');
      expect(screen.getByTestId('context-origin-lat')).toHaveTextContent('41.9');
      expect(screen.getByTestId('context-drone-x')).toHaveTextContent('41.9001');
    });

    fireEvent.click(screen.getByRole('button', { name: /move drone/i }));

    await waitFor(() => {
      expect(screen.getByTestId('context-drone-x')).toHaveTextContent('55.5');
    });
  });
});
