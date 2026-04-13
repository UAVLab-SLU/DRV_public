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
      { SettingsVersion: 2.0, label: 'bundle-settings' },
      { Drones: [{ Name: 'Drone1' }], environment: { UseGeo: false } },
    );

    const bundledSnapshot = await readSnapshot(snapshot.name);
    expect(bundledSnapshot.hasTask).toBe(true);
    expect(bundledSnapshot.canSimulate).toBe(true);
    expect(bundledSnapshot.taskJson).toEqual({
      Drones: [{ Name: 'Drone1' }],
      environment: { UseGeo: false },
    });
  });

  test('downloads task payload with the snapshot stem when present', async () => {
    const snapshot = await saveSnapshot(
      { SettingsVersion: 2.0, label: 'bundle-settings' },
      { Drones: [{ Name: 'Drone1' }], environment: { UseGeo: false } },
    );

    const originalCreateElement = document.createElement.bind(document);
    const anchor = { click: jest.fn() };
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    await downloadTaskSnapshot(snapshot.name);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(anchor.download).toBe(snapshot.name.replace(/\.json$/, '-task.json'));
    expect(anchor.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-settings');
  });
});
