/**
 * Best-effort reverse geocoding for saved configuration metadata.
 *
 * Saved configs should gain a recognizable place name when the browser can reach
 * Nominatim, but saving must still succeed with plain coordinates when the API is
 * unavailable, slow, or returns a generic result.
 */
const LOOKUP_TIMEOUT_MS = 2500;
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_ZOOM = '10';
const CACHE_STORAGE_KEY = 'droneworld.nominatim.reverseGeocode.v1';
const CACHE_MAX_ENTRIES = 100;
export const NOMINATIM_ATTRIBUTION = 'Nominatim, location data by OpenStreetMap contributors';

const GENERIC_LOCATION_NAMES = new Set(['', 'specify region', 'custom location']);
const memoryCache = new Map();

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function isUsefulLocationName(value) {
  const normalized = normalizeText(value);
  return normalized && !GENERIC_LOCATION_NAMES.has(normalized.toLowerCase());
}

function toFiniteNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getTaskCoordinates(taskJson) {
  const origin = taskJson?.environment?.Origin ?? {};
  const latitude = toFiniteNumber(origin.Latitude ?? origin.latitude);
  const longitude = toFiniteNumber(origin.Longitude ?? origin.longitude);

  return latitude == null || longitude == null ? null : { latitude, longitude };
}

function getCacheCoordinate(value) {
  return Number(value).toFixed(4);
}

function getCacheKey(coordinates) {
  return `${getCacheCoordinate(coordinates.latitude)},${getCacheCoordinate(
    coordinates.longitude,
  )},z${NOMINATIM_ZOOM}`;
}

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function readStoredCache() {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return {};
  }

  try {
    const storedValue = localStorage.getItem(CACHE_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : {};
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
      ? parsedValue
      : {};
  } catch (error) {
    return {};
  }
}

function writeStoredCache(cache) {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  try {
    const limitedEntries = Object.entries(cache)
      .sort(([, left], [, right]) => (right.savedAt ?? 0) - (left.savedAt ?? 0))
      .slice(0, CACHE_MAX_ENTRIES);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(limitedEntries)));
  } catch (error) {
    // Cache failures should never block saving a simulation config.
  }
}

function getCachedLocation(coordinates) {
  const cacheKey = getCacheKey(coordinates);
  const memoryMatch = memoryCache.get(cacheKey);
  if (memoryMatch?.label) {
    return memoryMatch;
  }

  const storedMatch = readStoredCache()[cacheKey];
  if (storedMatch?.label) {
    memoryCache.set(cacheKey, storedMatch);
    return storedMatch;
  }

  return null;
}

function cacheLocation(coordinates, details) {
  if (!isUsefulLocationName(details?.label)) {
    return;
  }

  const cacheKey = getCacheKey(coordinates);
  const cacheRecord = {
    label: normalizeText(details.label),
    attribution: details.attribution,
    source: details.source,
    savedAt: Date.now(),
  };
  memoryCache.set(cacheKey, cacheRecord);
  writeStoredCache({
    ...readStoredCache(),
    [cacheKey]: cacheRecord,
  });
}

function buildFallbackDetails(fallbackName) {
  return {
    label: isUsefulLocationName(fallbackName) ? normalizeText(fallbackName) : '',
    attribution: '',
    source: 'fallback',
  };
}

function buildNominatimUrl(coordinates) {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(coordinates.latitude));
  url.searchParams.set('lon', String(coordinates.longitude));
  url.searchParams.set('zoom', NOMINATIM_ZOOM);
  url.searchParams.set('addressdetails', '1');
  return url.toString();
}

function firstAddressValue(address, keys) {
  return keys.map((key) => normalizeText(address?.[key])).find(Boolean) ?? '';
}

function uniqueParts(parts) {
  const seen = new Set();
  return parts.filter((part) => {
    const normalized = part.toLowerCase();
    if (!part || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function buildNominatimLabel(result) {
  const address = result?.address ?? {};
  const locality = firstAddressValue(address, [
    'city',
    'town',
    'village',
    'municipality',
    'hamlet',
    'suburb',
    'neighbourhood',
  ]);
  const region = firstAddressValue(address, ['state', 'county', 'region']);
  const country = normalizeText(address.country);
  const addressLabel = uniqueParts([locality, region, country]).join(', ');

  return isUsefulLocationName(addressLabel)
    ? addressLabel
    : normalizeText(result?.display_name ?? '');
}

function fetchWithTimeout(url) {
  if (typeof fetch !== 'function') {
    return Promise.resolve(null);
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId =
    typeof window !== 'undefined'
      ? window.setTimeout(() => controller?.abort(), LOOKUP_TIMEOUT_MS)
      : null;

  return fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal: controller?.signal,
  }).finally(() => {
    if (timeoutId != null) {
      window.clearTimeout(timeoutId);
    }
  });
}

async function lookupWithNominatim(coordinates) {
  const response = await fetchWithTimeout(buildNominatimUrl(coordinates));
  if (!response?.ok || typeof response.json !== 'function') {
    return null;
  }

  const result = await response.json();
  const label = buildNominatimLabel(result);
  if (!isUsefulLocationName(label)) {
    return null;
  }

  return {
    label,
    attribution: NOMINATIM_ATTRIBUTION,
    source: 'nominatim',
  };
}

export async function resolveLocationDetails(taskJson, fallbackName = '') {
  const fallback = buildFallbackDetails(fallbackName);
  const coordinates = getTaskCoordinates(taskJson);

  if (!coordinates) {
    return fallback;
  }

  const cachedDetails = getCachedLocation(coordinates);
  if (cachedDetails) {
    return {
      label: cachedDetails.label,
      attribution: cachedDetails.attribution || NOMINATIM_ATTRIBUTION,
      source: cachedDetails.source || 'nominatim',
    };
  }

  try {
    const apiDetails = await lookupWithNominatim(coordinates);
    if (apiDetails) {
      cacheLocation(coordinates, apiDetails);
      return apiDetails;
    }
  } catch (error) {
    // Fallback below keeps the save path resilient when reverse geocoding fails.
  }

  return fallback;
}

export async function resolveLocationName(taskJson, fallbackName = '') {
  const details = await resolveLocationDetails(taskJson, fallbackName);
  return details.label;
}
