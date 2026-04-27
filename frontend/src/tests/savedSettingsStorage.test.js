/* eslint-env jest */
import '@testing-library/jest-dom';
import {
  deleteSnapshot,
  downloadSettingsSnapshot,
  downloadTaskSnapshot,
  isSupported,
  listSnapshots,
  readSnapshot,
  saveSnapshot,
} from '../services/savedSettingsStorage';

function createMockOpfsRoot() {
  const files = new Map();
  let directoryCreated = false;

  const createFileHandle = (name) => ({
    kind: 'file',
    async createWritable() {
      return {
        write: async (content) => {
          const current = files.get(name) || { content: '', lastModified: Date.now() };
          current.content = String(content);
          current.lastModified = Date.now();
          files.set(name, current);
        },
        close: async () => {},
      };
    },
    async getFile() {
      const current = files.get(name);
      return {
        name,
        size: current.content.length,
        lastModified: current.lastModified,
        text: async () => current.content,
      };
    },
  });

  const savedSettingsDirectory = {
    async getFileHandle(name, options = {}) {
      if (!files.has(name)) {
        if (!options.create) {
          const notFoundError = new Error('NotFoundError');
          notFoundError.name = 'NotFoundError';
          throw notFoundError;
        }
        files.set(name, { content: '', lastModified: Date.now() });
      }

      return createFileHandle(name);
    },
    async removeEntry(name) {
      files.delete(name);
    },
    async *entries() {
      for (const [name] of files.entries()) {
        yield [name, createFileHandle(name)];
      }
    },
  };

  return {
    root: {
      async getDirectoryHandle(name, options = {}) {
        if (name !== 'saved-settings') {
          throw new Error(`Unexpected directory ${name}`);
        }

        if (!directoryCreated && !options.create) {
          const notFoundError = new Error('NotFoundError');
          notFoundError.name = 'NotFoundError';
          throw notFoundError;
        }

        directoryCreated = true;
        return savedSettingsDirectory;
      },
    },
  };
}

describe('savedSettingsStorage', () => {
  const realNavigator = global.navigator;
  const realCreateObjectURL = window.URL.createObjectURL;
  const realRevokeObjectURL = window.URL.revokeObjectURL;

  const setNavigator = (value) => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      writable: true,
      value,
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-27T12:00:00.000Z'));
    const mockOpfs = createMockOpfsRoot();
    setNavigator({
      ...realNavigator,
      storage: {
        getDirectory: jest.fn().mockResolvedValue(mockOpfs.root),
      },
    });
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-settings');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    setNavigator(realNavigator);
    window.URL.createObjectURL = realCreateObjectURL;
    window.URL.revokeObjectURL = realRevokeObjectURL;
    jest.restoreAllMocks();
  });

  test('saves, lists, reads, downloads settings, and deletes snapshots', async () => {
    expect(isSupported()).toBe(true);

    const firstSnapshot = await saveSnapshot({ SettingsVersion: 2.0, label: 'first' });

    jest.setSystemTime(new Date('2026-03-27T12:00:01.000Z'));
    const secondSnapshot = await saveSnapshot({ SettingsVersion: 2.0, label: 'second' });

    const snapshots = await listSnapshots();
    expect(snapshots.map((snapshot) => snapshot.name)).toEqual([
      secondSnapshot.name,
      firstSnapshot.name,
    ]);

    const secondSnapshotContents = await readSnapshot(secondSnapshot.name);
    expect(secondSnapshotContents.json).toEqual({
      SettingsVersion: 2.0,
      label: 'second',
    });
    expect(secondSnapshotContents.taskJson).toBeNull();

    const originalCreateElement = document.createElement.bind(document);
    const clickSpy = jest.fn();
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          click: clickSpy,
        };
      }
      return originalCreateElement(tagName);
    });

    await downloadSettingsSnapshot(secondSnapshot.name);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-settings');

    await deleteSnapshot(firstSnapshot.name);
    const remainingSnapshots = await listSnapshots();
    expect(remainingSnapshots.map((snapshot) => snapshot.name)).toEqual([secondSnapshot.name]);
  });

  test('returns false when OPFS is unavailable', () => {
    setNavigator({});
    expect(isSupported()).toBe(false);
  });

  test('stores task payload together with settings payload when provided', async () => {
    const snapshot = await saveSnapshot(
      {
        SettingsVersion: 2.0,
        label: 'bundle-settings',
        OriginGeopoint: {
          Latitude: 41.980381,
          Longitude: -87.934524,
          Altitude: 200,
        },
      },
      {
        Drones: [
          {
            Name: 'Survey Drone',
            MissionValue: 'fly_to_points',
          },
        ],
        environment: {
          UseGeo: true,
          Origin: {
            Latitude: 41.980381,
            Longitude: -87.934524,
            Height: 200,
          },
        },
      },
      {
        displayName: "O'Hare wind rehearsal",
        locationLabel: 'Chicago, Illinois, United States',
        locationAttribution: 'Nominatim, location data by OpenStreetMap contributors',
        locationSource: 'nominatim',
      },
    );

    const bundledSnapshot = await readSnapshot(snapshot.name);
    const snapshotId = snapshot.name.replace(/\.json$/, '');
    expect(bundledSnapshot.hasTask).toBe(true);
    expect(bundledSnapshot.canSimulate).toBe(true);
    expect(bundledSnapshot.displayName).toBe(
      `O'Hare wind rehearsal_${snapshotId}_chicago-il_200m_1dr`,
    );
    expect(bundledSnapshot.description).toContain(
      `Config name: O'Hare wind rehearsal_${snapshotId}_chicago-il_200m_1dr`,
    );
    expect(bundledSnapshot.location).toEqual({
      label: 'Chicago, Illinois, United States',
      latitude: 41.980381,
      longitude: -87.934524,
      altitude: 200,
      attribution: 'Nominatim, location data by OpenStreetMap contributors',
      source: 'nominatim',
      coordinates: '41.980381, -87.934524, 200 m',
    });
    expect(bundledSnapshot.description).not.toContain('Location source:');
    expect(bundledSnapshot.droneQuips).toEqual([
      {
        name: 'Survey Drone',
        missionType: 'Fly to points',
        quip: 'Survey Drone: Fly to points',
      },
    ]);
    expect(bundledSnapshot.taskJson).toEqual({
      Drones: [
        {
          Name: 'Survey Drone',
          MissionValue: 'fly_to_points',
        },
      ],
      environment: {
        UseGeo: true,
        Origin: {
          Latitude: 41.980381,
          Longitude: -87.934524,
          Height: 200,
        },
      },
    });
  });

  test('uses the snapshot id as the display name when the user does not provide one', async () => {
    const snapshot = await saveSnapshot(
      {
        SettingsVersion: 2.0,
        OriginGeopoint: {
          Latitude: 35.1234,
          Longitude: -80.9876,
          Altitude: 125,
        },
      },
      {
        Drones: [{ Name: 'Inspection Drone', MissionValue: 'fly_in_circle' }],
        environment: {
          UseGeo: true,
          Origin: {
            Latitude: 35.1234,
            Longitude: -80.9876,
            Height: 125,
          },
        },
      },
    );

    const savedSnapshot = await readSnapshot(snapshot.name);
    expect(savedSnapshot.displayName).toBe(
      `${snapshot.name.replace(/\.json$/, '')}_35.1234,-80.9876_125m_1dr`,
    );
    expect(savedSnapshot.description).toContain(
      `Config name: ${snapshot.name.replace(/\.json$/, '')}_35.1234,-80.9876_125m_1dr`,
    );
    expect(savedSnapshot.description).toContain('Location: 35.123400, -80.987600, 125 m.');
    expect(savedSnapshot.description).toContain('Inspection Drone: Fly in circle');
  });

  test('normalizes legacy generated display names that users edited before the generated suffix', async () => {
    const legacyName = 'settings-20260425T010201729.json';
    const legacyDisplayName = 'lincotest35.123400, -80.987600, 125 m - 1 drone';
    const rootDirectory = await navigator.storage.getDirectory();
    const savedSettingsDirectory = await rootDirectory.getDirectoryHandle('saved-settings', {
      create: true,
    });
    const snapshotHandle = await savedSettingsDirectory.getFileHandle(legacyName, {
      create: true,
    });
    const writable = await snapshotHandle.createWritable();

    await writable.write(
      JSON.stringify({
        version: 3,
        savedAt: new Date().toISOString(),
        displayName: legacyDisplayName,
        metadata: {
          displayName: legacyDisplayName,
          location: {
            label: '',
            latitude: 35.1234,
            longitude: -80.9876,
            altitude: 125,
            coordinates: '35.123400, -80.987600, 125 m',
          },
          drones: [
            {
              name: 'Inspection Drone',
              missionType: 'Fly in circle',
              quip: 'Inspection Drone: Fly in circle',
            },
          ],
          description: `Config name: ${legacyDisplayName}.`,
        },
        settings: {
          SettingsVersion: 2.0,
          OriginGeopoint: {
            Latitude: 35.1234,
            Longitude: -80.9876,
            Altitude: 125,
          },
        },
        task: {
          Drones: [{ Name: 'Inspection Drone', MissionValue: 'fly_in_circle' }],
          environment: {
            UseGeo: true,
            Origin: {
              Latitude: 35.1234,
              Longitude: -80.9876,
              Height: 125,
            },
          },
        },
      }),
    );
    await writable.close();

    const savedSnapshot = await readSnapshot(legacyName);
    expect(savedSnapshot.displayName).toBe(
      'lincotest_settings-20260425T010201729_35.1234,-80.9876_125m_1dr',
    );
    expect(savedSnapshot.description).toContain(
      'Config name: lincotest_settings-20260425T010201729_35.1234,-80.9876_125m_1dr',
    );
    expect(savedSnapshot.description).toContain('Location: 35.123400, -80.987600, 125 m.');
  });

  test('normalizes saved coordinate suffixes to resolved place suffixes when metadata has a useful label', async () => {
    const legacyName = 'settings-20260425T210655555.json';
    const legacyDisplayName = 'dsfcv_settings-20260425T210655555_41.7619,-88.1535_195m_2dr';
    const rootDirectory = await navigator.storage.getDirectory();
    const savedSettingsDirectory = await rootDirectory.getDirectoryHandle('saved-settings', {
      create: true,
    });
    const snapshotHandle = await savedSettingsDirectory.getFileHandle(legacyName, {
      create: true,
    });
    const writable = await snapshotHandle.createWritable();

    await writable.write(
      JSON.stringify({
        version: 3,
        savedAt: new Date().toISOString(),
        displayName: legacyDisplayName,
        metadata: {
          displayName: legacyDisplayName,
          location: {
            label: 'Naperville, Illinois, United States',
            latitude: 41.7619,
            longitude: -88.1535,
            altitude: 195,
            attribution: 'Nominatim, location data by OpenStreetMap contributors',
            source: 'nominatim',
            coordinates: '41.761900, -88.153500, 195 m',
          },
          drones: [
            {
              name: 'Lead Drone',
              missionType: 'Fly to points',
              quip: 'Lead Drone: Fly to points',
            },
            {
              name: 'Wing Drone',
              missionType: 'Fly in circle',
              quip: 'Wing Drone: Fly in circle',
            },
          ],
          description: `Config name: ${legacyDisplayName}.`,
        },
        settings: {
          SettingsVersion: 2.0,
          OriginGeopoint: {
            Latitude: 41.7619,
            Longitude: -88.1535,
            Altitude: 195,
          },
        },
        task: {
          Drones: [
            { Name: 'Lead Drone', MissionValue: 'fly_to_points' },
            { Name: 'Wing Drone', MissionValue: 'fly_in_circle' },
          ],
          environment: {
            UseGeo: true,
            Origin: {
              Latitude: 41.7619,
              Longitude: -88.1535,
              Height: 195,
            },
          },
        },
      }),
    );
    await writable.close();

    const savedSnapshot = await readSnapshot(legacyName);
    expect(savedSnapshot.displayName).toBe(
      'dsfcv_settings-20260425T210655555_naperville-il_195m_2dr',
    );
    expect(savedSnapshot.description).toContain(
      'Config name: dsfcv_settings-20260425T210655555_naperville-il_195m_2dr',
    );
    expect(savedSnapshot.description).toContain(
      'Location: Naperville, Illinois, United States (41.761900, -88.153500, 195 m).',
    );
    expect(savedSnapshot.description).not.toContain('Location source:');
  });

  test('downloads settings and task payloads with the saved display name', async () => {
    const snapshot = await saveSnapshot(
      {
        SettingsVersion: 2.0,
        label: 'bundle-settings',
        OriginGeopoint: {
          Latitude: 41.7619,
          Longitude: -88.1535,
          Altitude: 208,
        },
      },
      {
        Drones: [
          { Name: 'Lead Drone', MissionValue: 'fly_to_points' },
          { Name: 'Wing Drone', MissionValue: 'fly_in_circle' },
        ],
        environment: {
          UseGeo: true,
          Origin: {
            Latitude: 41.7619,
            Longitude: -88.1535,
            Height: 208,
          },
        },
      },
      {
        displayName: 'bgfb',
        locationLabel: 'Prospect Heights, Illinois, United States',
      },
    );

    const originalCreateElement = document.createElement.bind(document);
    const downloads = [];
    const anchor = { click: jest.fn() };
    Object.defineProperty(anchor, 'download', {
      get: () => downloads[downloads.length - 1],
      set: (value) => {
        downloads.push(value);
      },
    });
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    await downloadSettingsSnapshot(snapshot.name);
    await downloadTaskSnapshot(snapshot.name);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(anchor.click).toHaveBeenCalledTimes(2);
    expect(snapshot.displayName).toContain('prospect-heights-il_208m_2dr');
    expect(downloads).toEqual([
      `${snapshot.displayName}.json`,
      `${snapshot.displayName}-task.json`,
    ]);
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
