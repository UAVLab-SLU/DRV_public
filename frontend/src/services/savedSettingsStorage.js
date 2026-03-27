const SAVED_SETTINGS_DIR = 'saved-settings';

export function isSupported() {
  return (
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    typeof navigator.storage.getDirectory === 'function'
  );
}

function buildSnapshotName(date = new Date()) {
  const pad = (value, size = 2) => String(value).padStart(size, '0');
  return `settings-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}${pad(date.getMilliseconds(), 3)}.json`;
}

async function getSavedSettingsDirectory(create = true) {
  if (!isSupported()) {
    throw new Error('Browser private file storage is not supported in this browser.');
  }

  const rootDirectory = await navigator.storage.getDirectory();
  return rootDirectory.getDirectoryHandle(SAVED_SETTINGS_DIR, { create });
}

async function getSnapshotHandle(name) {
  const savedSettingsDirectory = await getSavedSettingsDirectory(false);
  return savedSettingsDirectory.getFileHandle(name);
}

export async function saveSnapshot(settingsJson) {
  const savedSettingsDirectory = await getSavedSettingsDirectory(true);
  const name = buildSnapshotName();
  const snapshotHandle = await savedSettingsDirectory.getFileHandle(name, { create: true });
  const writable = await snapshotHandle.createWritable();

  await writable.write(JSON.stringify(settingsJson, null, 2));
  await writable.close();

  const savedFile = await snapshotHandle.getFile();
  return {
    name,
    lastModified: savedFile.lastModified,
    size: savedFile.size,
  };
}

export async function listSnapshots() {
  if (!isSupported()) {
    return [];
  }

  let savedSettingsDirectory;
  try {
    savedSettingsDirectory = await getSavedSettingsDirectory(false);
  } catch (error) {
    return [];
  }

  const snapshots = [];
  for await (const [name, handle] of savedSettingsDirectory.entries()) {
    if (handle.kind !== 'file') {
      continue;
    }

    const savedFile = await handle.getFile();
    snapshots.push({
      name,
      lastModified: savedFile.lastModified,
      size: savedFile.size,
    });
  }

  return snapshots.sort((left, right) => {
    if (right.lastModified !== left.lastModified) {
      return right.lastModified - left.lastModified;
    }
    return right.name.localeCompare(left.name);
  });
}

export async function readSnapshot(name) {
  const snapshotHandle = await getSnapshotHandle(name);
  const savedFile = await snapshotHandle.getFile();
  const text = await savedFile.text();

  return {
    name,
    text,
    json: JSON.parse(text),
    lastModified: savedFile.lastModified,
    size: savedFile.size,
  };
}

export async function deleteSnapshot(name) {
  const savedSettingsDirectory = await getSavedSettingsDirectory(false);
  await savedSettingsDirectory.removeEntry(name);
}

export async function downloadSnapshot(name) {
  const snapshot = await readSnapshot(name);
  const blob = new Blob([snapshot.text], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = snapshot.name;
  anchor.click();
  window.URL.revokeObjectURL(url);
  return snapshot;
}
