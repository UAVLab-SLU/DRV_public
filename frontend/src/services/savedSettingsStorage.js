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

function getSnapshotStem(name) {
  return name.endsWith('.json') ? name.slice(0, -5) : name;
}

function triggerJsonDownload(filename, jsonText) {
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
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

function normalizeSnapshotRecord(name, rawText, lastModified, size) {
  const parsed = JSON.parse(rawText);
  const isBundleRecord =
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Object.prototype.hasOwnProperty.call(parsed, 'settings');
  const settingsJson = isBundleRecord ? parsed.settings : parsed;
  const taskJson = isBundleRecord ? parsed.task ?? null : null;
  const savedAt = isBundleRecord ? parsed.savedAt ?? null : null;

  return {
    name,
    text: rawText,
    json: settingsJson,
    settingsJson,
    settingsText: JSON.stringify(settingsJson, null, 2),
    taskJson,
    hasTask: taskJson != null,
    canSimulate: taskJson != null && !taskJson?.FuzzyTest,
    savedAt,
    lastModified,
    size,
  };
}

export async function saveSnapshot(settingsJson, taskJson = null) {
  const savedSettingsDirectory = await getSavedSettingsDirectory(true);
  const name = buildSnapshotName();
  const snapshotHandle = await savedSettingsDirectory.getFileHandle(name, { create: true });
  const writable = await snapshotHandle.createWritable();
  const snapshotRecord = {
    version: 2,
    savedAt: new Date().toISOString(),
    settings: settingsJson,
    task: taskJson,
  };

  await writable.write(JSON.stringify(snapshotRecord, null, 2));
  await writable.close();

  const savedFile = await snapshotHandle.getFile();
  return {
    name,
    lastModified: savedFile.lastModified,
    size: savedFile.size,
    hasTask: taskJson != null,
    canSimulate: taskJson != null && !taskJson?.FuzzyTest,
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
    const rawText = await savedFile.text();
    snapshots.push(normalizeSnapshotRecord(name, rawText, savedFile.lastModified, savedFile.size));
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
  return normalizeSnapshotRecord(name, text, savedFile.lastModified, savedFile.size);
}

export async function deleteSnapshot(name) {
  const savedSettingsDirectory = await getSavedSettingsDirectory(false);
  await savedSettingsDirectory.removeEntry(name);
}

export async function downloadSettingsSnapshot(name) {
  const snapshot = await readSnapshot(name);
  triggerJsonDownload(snapshot.name, snapshot.settingsText);
  return snapshot;
}

export async function downloadTaskSnapshot(name) {
  const snapshot = await readSnapshot(name);
  if (snapshot.taskJson == null) {
    throw new Error('This saved entry does not include task.json.');
  }

  const snapshotStem = getSnapshotStem(snapshot.name);
  triggerJsonDownload(`${snapshotStem}-task.json`, JSON.stringify(snapshot.taskJson, null, 2));
  return snapshot;
}
