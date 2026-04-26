/**
 * Browser-private saved configuration storage.
 *
 * OPFS filenames stay machine-oriented for uniqueness while bundle metadata carries the
 * user-facing saved-config name, geographic description, and drone summaries rendered by
 * the Saved Settings page. Legacy raw settings.json snapshots are normalized into the same
 * shape at read time so older entries remain loadable.
 */
const SAVED_SETTINGS_DIR = 'saved-settings';
const GENERIC_LOCATION_NAMES = new Set(['', 'specify region', 'custom location']);
const US_STATE_ABBREVIATIONS = {
  alabama: 'al',
  alaska: 'ak',
  arizona: 'az',
  arkansas: 'ar',
  california: 'ca',
  colorado: 'co',
  connecticut: 'ct',
  delaware: 'de',
  florida: 'fl',
  georgia: 'ga',
  hawaii: 'hi',
  idaho: 'id',
  illinois: 'il',
  indiana: 'in',
  iowa: 'ia',
  kansas: 'ks',
  kentucky: 'ky',
  louisiana: 'la',
  maine: 'me',
  maryland: 'md',
  massachusetts: 'ma',
  michigan: 'mi',
  minnesota: 'mn',
  mississippi: 'ms',
  missouri: 'mo',
  montana: 'mt',
  nebraska: 'ne',
  nevada: 'nv',
  'new hampshire': 'nh',
  'new jersey': 'nj',
  'new mexico': 'nm',
  'new york': 'ny',
  'north carolina': 'nc',
  'north dakota': 'nd',
  ohio: 'oh',
  oklahoma: 'ok',
  oregon: 'or',
  pennsylvania: 'pa',
  'rhode island': 'ri',
  'south carolina': 'sc',
  'south dakota': 'sd',
  tennessee: 'tn',
  texas: 'tx',
  utah: 'ut',
  vermont: 'vt',
  virginia: 'va',
  washington: 'wa',
  'west virginia': 'wv',
  wisconsin: 'wi',
  wyoming: 'wy',
};

export function isSupported() {
  return Boolean(
    typeof navigator !== 'undefined' &&
      navigator.storage &&
      typeof navigator.storage.getDirectory === 'function',
  );
}

function buildSnapshotName(date = new Date()) {
  const pad = (value, size = 2) => String(value).padStart(size, '0');
  return `settings-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours(),
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

function sanitizeDownloadFilenameStem(value) {
  const invalidFilenameCharacters = '<>:"/\\|?*';
  return (
    normalizeText(value)
      .split('')
      .map((character) =>
        character.charCodeAt(0) < 32 || invalidFilenameCharacters.includes(character)
          ? '_'
          : character,
      )
      .join('')
      .replace(/[. ]+$/g, '')
      .slice(0, 180) || 'saved-settings'
  );
}

function buildDownloadFilename(snapshot, suffix = '') {
  const displayStem = snapshot?.displayName || getSnapshotStem(snapshot?.name || '');
  return `${sanitizeDownloadFilenameStem(displayStem)}${suffix}.json`;
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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function truncateText(value, maxLength = 120) {
  const normalized = normalizeText(value);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function toFiniteNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getObjectValue(source, keys) {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  return keys.map((key) => source[key]).find((value) => value !== undefined && value !== null);
}

function isUsefulLocationName(value) {
  const normalized = normalizeText(value);
  return normalized && !GENERIC_LOCATION_NAMES.has(normalized.toLowerCase());
}

function formatCoordinate(value) {
  const numberValue = toFiniteNumber(value);
  return numberValue == null ? null : numberValue.toFixed(6);
}

function formatCompactCoordinate(value) {
  const numberValue = toFiniteNumber(value);
  return numberValue == null ? null : numberValue.toFixed(4);
}

function slugifyLocationText(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCompactLocationLabel(location) {
  const label = normalizeText(location?.label);
  if (!isUsefulLocationName(label)) {
    return '';
  }

  const parts = label.split(',').map(normalizeText).filter(Boolean);
  const country = parts[parts.length - 1]?.toLowerCase();
  if (parts.length >= 3 && ['united states', 'usa', 'us'].includes(country)) {
    const city = slugifyLocationText(parts[0]);
    const state = US_STATE_ABBREVIATIONS[parts[parts.length - 2].toLowerCase()];
    if (city && state) {
      return `${city}-${state}`;
    }
  }

  const compactParts = parts.length > 1 ? parts.slice(0, 2) : parts.slice(0, 1);
  const compactLabel = slugifyLocationText(compactParts.join(' '));
  return compactLabel.length > 36 ? compactLabel.slice(0, 36).replace(/-+$/g, '') : compactLabel;
}

export function formatLocationCoordinates(location) {
  const latitude = formatCoordinate(location?.latitude);
  const longitude = formatCoordinate(location?.longitude);

  if (!latitude || !longitude) {
    return '';
  }

  const altitude = toFiniteNumber(location?.altitude);
  return altitude == null
    ? `${latitude}, ${longitude}`
    : `${latitude}, ${longitude}, ${altitude} m`;
}

function getTaskLocation(taskJson) {
  const origin = taskJson?.environment?.Origin ?? taskJson?.environment?._Origin ?? {};

  return {
    label: getObjectValue(origin, ['Name', 'name', 'Label', 'label']),
    latitude: toFiniteNumber(getObjectValue(origin, ['Latitude', 'latitude'])),
    longitude: toFiniteNumber(getObjectValue(origin, ['Longitude', 'longitude'])),
    altitude: toFiniteNumber(getObjectValue(origin, ['Altitude', 'altitude', 'Height', 'height'])),
  };
}

function getSettingsLocation(settingsJson) {
  const origin = settingsJson?.OriginGeopoint ?? settingsJson?.Origin ?? {};

  return {
    label: getObjectValue(origin, ['Name', 'name', 'Label', 'label']),
    latitude: toFiniteNumber(getObjectValue(origin, ['Latitude', 'latitude'])),
    longitude: toFiniteNumber(getObjectValue(origin, ['Longitude', 'longitude'])),
    altitude: toFiniteNumber(getObjectValue(origin, ['Altitude', 'altitude', 'Height', 'height'])),
  };
}

export function buildSnapshotLocation(settingsJson, taskJson, options = {}) {
  const taskLocation = getTaskLocation(taskJson);
  const settingsLocation = getSettingsLocation(settingsJson);
  const labelCandidate =
    options.locationLabel ?? taskLocation.label ?? settingsLocation.label ?? options.fallbackLabel;
  const latitude = taskLocation.latitude ?? settingsLocation.latitude;
  const longitude = taskLocation.longitude ?? settingsLocation.longitude;
  const altitude = taskLocation.altitude ?? settingsLocation.altitude;
  const label = isUsefulLocationName(labelCandidate) ? truncateText(labelCandidate, 100) : '';
  const location = {
    label,
    latitude,
    longitude,
    altitude,
    attribution: truncateText(options.locationAttribution, 140),
    source: truncateText(options.locationSource, 40),
  };

  return {
    ...location,
    coordinates: formatLocationCoordinates(location),
  };
}

function prettifyMissionType(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return 'unspecified mission';
  }

  const readable = normalized.replace(/[_-]+/g, ' ').toLowerCase();
  return `${readable.charAt(0).toUpperCase()}${readable.slice(1)}`;
}

function buildDroneQuip(drone, index) {
  const name =
    normalizeText(drone?.Name) ||
    normalizeText(drone?.droneName) ||
    normalizeText(drone?.name) ||
    `Drone ${index + 1}`;
  const missionType = prettifyMissionType(
    drone?.Mission?.name ?? drone?.MissionValue ?? drone?.missionType ?? drone?.mission,
  );

  return {
    name,
    missionType,
    quip: `${name}: ${missionType}`,
  };
}

function buildDroneQuipsFromSettings(settingsJson) {
  const vehicles = settingsJson?.Vehicles;
  if (!vehicles || typeof vehicles !== 'object' || Array.isArray(vehicles)) {
    return [];
  }

  return Object.entries(vehicles).map(([vehicleName, vehicle], index) =>
    buildDroneQuip({ ...vehicle, Name: vehicle?.Name ?? vehicleName }, index),
  );
}

export function buildSnapshotDroneQuips(settingsJson, taskJson) {
  if (Array.isArray(taskJson?.Drones)) {
    return taskJson.Drones.map((drone, index) => buildDroneQuip(drone, index));
  }

  return buildDroneQuipsFromSettings(settingsJson);
}

function getLocationDisplayName(location) {
  if (isUsefulLocationName(location?.label)) {
    return location.label;
  }

  return location?.coordinates || 'Unknown location';
}

function buildCondensedContextSuffix(location, drones) {
  const latitude = formatCompactCoordinate(location?.latitude);
  const longitude = formatCompactCoordinate(location?.longitude);
  const altitude = toFiniteNumber(location?.altitude);
  const droneCount = Array.isArray(drones) ? drones.length : 0;
  const suffixParts = [];
  const locationLabel = getCompactLocationLabel(location);

  if (locationLabel) {
    suffixParts.push(locationLabel);
  } else if (latitude && longitude) {
    suffixParts.push(`${latitude},${longitude}`);
  }

  if (altitude != null) {
    suffixParts.push(`${Math.round(altitude)}m`);
  }

  if (droneCount > 0) {
    suffixParts.push(`${droneCount}dr`);
  }

  return suffixParts.join('_');
}

function buildCoordinateContextSuffix(location, drones) {
  const latitude = formatCompactCoordinate(location?.latitude);
  const longitude = formatCompactCoordinate(location?.longitude);
  const altitude = toFiniteNumber(location?.altitude);
  const droneCount = Array.isArray(drones) ? drones.length : 0;
  const suffixParts = [];

  if (latitude && longitude) {
    suffixParts.push(`${latitude},${longitude}`);
  }

  if (altitude != null) {
    suffixParts.push(`${Math.round(altitude)}m`);
  }

  if (droneCount > 0) {
    suffixParts.push(`${droneCount}dr`);
  }

  return suffixParts.join('_');
}

function buildSnapshotDisplayName(userInput, snapshotName, metadata = {}) {
  const snapshotId = getSnapshotStem(snapshotName || '');
  const displayStem = snapshotId || 'unsaved-snapshot';
  const contextSuffix = buildCondensedContextSuffix(metadata.location, metadata.drones);
  const displayStemWithContext = contextSuffix ? `${displayStem}_${contextSuffix}` : displayStem;
  const userPrefix = truncateText(userInput, 80);

  return userPrefix ? `${userPrefix}_${displayStemWithContext}` : displayStemWithContext;
}

function buildLegacyGeneratedDisplayNameSuffix(location, drones) {
  if (!location?.coordinates) {
    return '';
  }

  const droneCount = Array.isArray(drones) ? drones.length : 0;
  const droneText =
    droneCount === 1 ? '1 drone' : droneCount > 1 ? `${droneCount} drones` : 'configuration';
  return `${location.coordinates} - ${droneText}`;
}

function buildSnapshotDescription(metadata) {
  const locationName = getLocationDisplayName(metadata?.location);
  const coordinates = metadata?.location?.coordinates;
  const locationDescription =
    coordinates && isUsefulLocationName(metadata?.location?.label)
      ? `${locationName} (${coordinates})`
      : coordinates || locationName;
  const droneDescription =
    metadata?.drones?.length > 0
      ? metadata.drones.map((drone) => drone.quip).join('; ')
      : 'No drone details available';

  return `Config name: ${metadata.displayName}. Location: ${locationDescription}. Drones: ${droneDescription}.`;
}

function normalizeSavedDisplayName(value, snapshotName, metadata) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return buildSnapshotDisplayName('', snapshotName, metadata);
  }

  const legacyGeneratedSuffix = buildLegacyGeneratedDisplayNameSuffix(
    metadata?.location,
    metadata?.drones,
  );

  if (legacyGeneratedSuffix && normalizedValue.endsWith(legacyGeneratedSuffix)) {
    const userPrefix = normalizeText(
      normalizedValue.slice(0, normalizedValue.length - legacyGeneratedSuffix.length),
    );
    return buildSnapshotDisplayName(userPrefix, snapshotName, metadata);
  }

  const snapshotId = getSnapshotStem(snapshotName || '');
  const legacyCoordinateSuffix = buildCoordinateContextSuffix(metadata?.location, metadata?.drones);
  const legacyCoordinateStem =
    snapshotId && legacyCoordinateSuffix ? `${snapshotId}_${legacyCoordinateSuffix}` : '';

  if (legacyCoordinateStem && normalizedValue === legacyCoordinateStem) {
    return buildSnapshotDisplayName('', snapshotName, metadata);
  }

  if (legacyCoordinateStem && normalizedValue.endsWith(`_${legacyCoordinateStem}`)) {
    const userPrefix = normalizeText(
      normalizedValue.slice(0, normalizedValue.length - legacyCoordinateStem.length - 1),
    );
    return buildSnapshotDisplayName(userPrefix, snapshotName, metadata);
  }

  return truncateText(normalizedValue, 140);
}

function buildSnapshotMetadata(settingsJson, taskJson, options = {}) {
  const location = buildSnapshotLocation(settingsJson, taskJson, options);
  const drones = buildSnapshotDroneQuips(settingsJson, taskJson);
  const displayName = buildSnapshotDisplayName(options.displayName, options.snapshotName, {
    location,
    drones,
  });
  const metadata = {
    displayName,
    location,
    drones,
  };

  return {
    ...metadata,
    description: buildSnapshotDescription(metadata),
  };
}

function normalizeMetadata(settingsJson, taskJson, parsedMetadata, options = {}) {
  const derivedMetadata = buildSnapshotMetadata(settingsJson, taskJson, options);
  const location = {
    ...derivedMetadata.location,
    ...(parsedMetadata?.location ?? {}),
  };
  const normalizedLocation = {
    ...location,
    latitude: toFiniteNumber(location.latitude),
    longitude: toFiniteNumber(location.longitude),
    altitude: toFiniteNumber(location.altitude),
    attribution: truncateText(location.attribution, 140),
    source: truncateText(location.source, 40),
  };
  normalizedLocation.coordinates =
    normalizeText(location.coordinates) || formatLocationCoordinates(normalizedLocation);
  const drones = Array.isArray(parsedMetadata?.drones)
    ? parsedMetadata.drones.map((drone, index) => buildDroneQuip(drone, index))
    : derivedMetadata.drones;
  const displayName = normalizeSavedDisplayName(
    parsedMetadata?.displayName ?? options.displayName,
    options.snapshotName,
    {
      location: normalizedLocation,
      drones,
    },
  );
  const metadata = {
    displayName,
    location: normalizedLocation,
    drones,
  };

  return {
    ...metadata,
    description: buildSnapshotDescription(metadata),
  };
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
  const metadata = normalizeMetadata(
    settingsJson,
    taskJson,
    isBundleRecord ? parsed.metadata : null,
    {
      displayName: isBundleRecord ? parsed.displayName : null,
      snapshotName: name,
      savedAt,
    },
  );

  return {
    name,
    displayName: metadata.displayName,
    description: metadata.description,
    metadata,
    location: metadata.location,
    droneQuips: metadata.drones,
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

export async function saveSnapshot(settingsJson, taskJson = null, options = {}) {
  const savedSettingsDirectory = await getSavedSettingsDirectory(true);
  const savedDate = new Date();
  const savedAt = savedDate.toISOString();
  const name = buildSnapshotName(savedDate);
  const snapshotHandle = await savedSettingsDirectory.getFileHandle(name, { create: true });
  const writable = await snapshotHandle.createWritable();
  const metadata = buildSnapshotMetadata(settingsJson, taskJson, {
    ...options,
    snapshotName: name,
    savedAt,
  });
  const snapshotRecord = {
    version: 3,
    savedAt,
    displayName: metadata.displayName,
    metadata,
    settings: settingsJson,
    task: taskJson,
  };

  await writable.write(JSON.stringify(snapshotRecord, null, 2));
  await writable.close();

  const savedFile = await snapshotHandle.getFile();
  return {
    name,
    displayName: metadata.displayName,
    description: metadata.description,
    metadata,
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
  triggerJsonDownload(buildDownloadFilename(snapshot), snapshot.settingsText);
  return snapshot;
}

export async function downloadTaskSnapshot(name) {
  const snapshot = await readSnapshot(name);
  if (snapshot.taskJson == null) {
    throw new Error('This saved entry does not include task.json.');
  }

  triggerJsonDownload(
    buildDownloadFilename(snapshot, '-task'),
    JSON.stringify(snapshot.taskJson, null, 2),
  );
  return snapshot;
}
