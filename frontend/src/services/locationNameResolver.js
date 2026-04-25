/**
 * Best-effort location naming for saved configuration metadata.
 *
 * The wizard should not block on reverse geocoding, so this adapter uses the
 * already-loaded Google Maps JavaScript API when available and falls back to the
 * selected location label or coordinates when the API is absent or slow.
 */
const LOOKUP_TIMEOUT_MS = 2500;
const GENERIC_LOCATION_NAMES = new Set(['', 'specify region', 'custom location']);

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

function getGoogleMapsGeocoder() {
  if (typeof window === 'undefined') {
    return null;
  }

  const Geocoder = window.google?.maps?.Geocoder;
  return typeof Geocoder === 'function' ? new Geocoder() : null;
}

function lookupWithGoogleMaps(geocoder, coordinates) {
  return new Promise((resolve) => {
    geocoder.geocode(
      {
        location: {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
        },
      },
      (results, status) => {
        if (status === 'OK' && Array.isArray(results) && results[0]?.formatted_address) {
          resolve(normalizeText(results[0].formatted_address));
          return;
        }

        resolve('');
      },
    );
  });
}

function timeoutLookup() {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(''), LOOKUP_TIMEOUT_MS);
  });
}

export async function resolveLocationName(taskJson, fallbackName = '') {
  const fallback = isUsefulLocationName(fallbackName) ? normalizeText(fallbackName) : '';
  const coordinates = getTaskCoordinates(taskJson);
  const geocoder = coordinates ? getGoogleMapsGeocoder() : null;

  if (!geocoder) {
    return fallback;
  }

  try {
    const apiName = await Promise.race([
      lookupWithGoogleMaps(geocoder, coordinates),
      timeoutLookup(),
    ]);
    return isUsefulLocationName(apiName) ? apiName : fallback;
  } catch (error) {
    return fallback;
  }
}
