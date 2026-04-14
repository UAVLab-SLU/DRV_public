/* eslint-env jest */

import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ImportConfigurationPanel from '../components/Configuration/ImportConfigurationPanel';

function buildTaskPayloadConfig(overrides = {}) {
  return {
    environment: {
      UseGeo: true,
      Origin: {
        Latitude: 12.34,
        Longitude: 56.78,
        Height: 210,
        Name: 'Specify Region',
      },
      Wind: {
        Direction: 'N',
        Force: 4,
        Velocity: 4,
      },
      TimeOfDay: '10:00:00',
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
        droneType: 'MultiRotor',
        droneModel: 'DJI',
        X: 12.3401,
        Y: 56.7801,
        Z: 15,
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
    ...overrides,
  };
}

function ImportHarness({ presets }) {
  const [importedConfig, setImportedConfig] = React.useState(null);

  return (
    <div>
      <ImportConfigurationPanel presets={presets} onImportConfig={setImportedConfig} />
      <div data-testid='loaded-origin-lat'>
        {importedConfig?.environment?.Origin?.Latitude ?? ''}
      </div>
      <div data-testid='loaded-mission'>{importedConfig?.Drones?.[0]?.MissionValue ?? ''}</div>
    </div>
  );
}

async function choosePreset(name) {
  fireEvent.mouseDown(screen.getByLabelText(/preset configuration/i));
  const listbox = await screen.findByRole('listbox');
  fireEvent.click(within(listbox).getByText(name));
}

describe('ImportConfigurationPanel', () => {
  test('describes the supported import sources to the user', () => {
    render(<ImportHarness presets={[]} />);

    expect(screen.getByText(/supported sources:/i)).toHaveTextContent(
      'Supported sources: dev-team presets, saved snapshot bundles, raw task payloads, and AirSim `settings.json` files.',
    );
  });

  test('loads a dev-team preset through the shared import pipeline', async () => {
    const presets = [
      {
        id: 'preset-alpha',
        displayName: 'Preset Alpha',
        description: 'Preset Alpha description',
        sourceJson: buildTaskPayloadConfig(),
      },
    ];

    render(<ImportHarness presets={presets} />);

    await choosePreset('Preset Alpha');
    fireEvent.click(screen.getByRole('button', { name: /load preset/i }));

    await waitFor(() => {
      expect(screen.getByTestId('import-status')).toHaveTextContent(
        'Loaded preset "Preset Alpha" into the wizard.',
      );
      expect(screen.getByTestId('loaded-origin-lat')).toHaveTextContent('12.34');
      expect(screen.getByTestId('loaded-mission')).toHaveTextContent('fly_to_points');
    });
  });

  test('loads an uploaded JSON file through the shared import pipeline', async () => {
    render(<ImportHarness presets={[]} />);

    const file = new File(['placeholder'], 'saved-config.json', { type: 'application/json' });
    file.text = jest.fn().mockResolvedValue(JSON.stringify(buildTaskPayloadConfig()));

    fireEvent.change(screen.getByTestId('import-config-file-input'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: /load file/i }));

    await waitFor(() => {
      expect(screen.getByTestId('import-status')).toHaveTextContent(
        'Loaded "saved-config.json" into the wizard.',
      );
      expect(screen.getByTestId('loaded-origin-lat')).toHaveTextContent('12.34');
    });
  });

  test('shows an error for invalid JSON uploads', async () => {
    render(<ImportHarness presets={[]} />);

    const file = new File(['placeholder'], 'broken.json', { type: 'application/json' });
    file.text = jest.fn().mockResolvedValue('{bad json');

    fireEvent.change(screen.getByTestId('import-config-file-input'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: /load file/i }));

    await waitFor(() => {
      expect(screen.getByTestId('import-status')).toHaveTextContent('Invalid JSON');
    });

    expect(screen.getByTestId('loaded-origin-lat')).toHaveTextContent('');
  });

  test('shows an error for unsupported schemas', async () => {
    render(<ImportHarness presets={[]} />);

    const file = new File(['placeholder'], 'unsupported.json', { type: 'application/json' });
    file.text = jest.fn().mockResolvedValue(JSON.stringify({ hello: 'world' }));

    fireEvent.change(screen.getByTestId('import-config-file-input'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: /load file/i }));

    await waitFor(() => {
      expect(screen.getByTestId('import-status')).toHaveTextContent(
        'Unsupported configuration format.',
      );
    });
  });

  test('successful import updates visible values in the import host', async () => {
    const presets = [
      {
        id: 'preset-bravo',
        displayName: 'Preset Bravo',
        description: 'Preset Bravo description',
        sourceJson: buildTaskPayloadConfig({
          environment: {
            UseGeo: true,
            Origin: {
              Latitude: 44.55,
              Longitude: -93.22,
              Height: 180,
              Name: 'Specify Region',
            },
            Wind: {
              Direction: 'SW',
              Force: 6,
              Velocity: 6,
            },
            TimeOfDay: '16:45:00',
          },
          Drones: [
            {
              ...buildTaskPayloadConfig().Drones[0],
              MissionValue: 'fly_in_circle',
              Mission: {
                name: 'fly_in_circle',
                param: [],
              },
            },
          ],
        }),
      },
    ];

    render(<ImportHarness presets={presets} />);

    await choosePreset('Preset Bravo');
    fireEvent.click(screen.getByRole('button', { name: /load preset/i }));

    await waitFor(() => {
      expect(screen.getByTestId('loaded-origin-lat')).toHaveTextContent('44.55');
      expect(screen.getByTestId('loaded-mission')).toHaveTextContent('fly_in_circle');
    });
  });
});
