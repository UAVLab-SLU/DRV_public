/* eslint-env jest */
import {
  NOMINATIM_ATTRIBUTION,
  resolveLocationDetails,
  resolveLocationName,
} from '../services/locationNameResolver';

function buildTask(latitude = 40.8341, longitude = -96.6847) {
  return {
    environment: {
      Origin: {
        Latitude: latitude,
        Longitude: longitude,
      },
    },
  };
}

describe('locationNameResolver', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  test('reverse geocodes coordinates with Nominatim and caches rounded lookups', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        display_name: 'Lincoln, Lancaster County, Nebraska, United States',
        address: {
          city: 'Lincoln',
          state: 'Nebraska',
          country: 'United States',
        },
      }),
    });

    const firstDetails = await resolveLocationDetails(buildTask(), 'Specify Region');
    const secondDetails = await resolveLocationDetails(buildTask(40.83412, -96.68472), '');

    expect(firstDetails).toEqual({
      label: 'Lincoln, Nebraska, United States',
      attribution: NOMINATIM_ATTRIBUTION,
      source: 'nominatim',
    });
    expect(secondDetails).toEqual(firstDetails);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const lookupUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(lookupUrl.origin).toBe('https://nominatim.openstreetmap.org');
    expect(lookupUrl.pathname).toBe('/reverse');
    expect(lookupUrl.searchParams.get('format')).toBe('jsonv2');
    expect(lookupUrl.searchParams.get('lat')).toBe('40.8341');
    expect(lookupUrl.searchParams.get('lon')).toBe('-96.6847');
    expect(lookupUrl.searchParams.get('zoom')).toBe('10');
  });

  test('falls back to the existing location label when Nominatim fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('network unavailable'));

    await expect(
      resolveLocationDetails(buildTask(35.1234, -80.9876), 'Charlotte test range'),
    ).resolves.toEqual({
      label: 'Charlotte test range',
      attribution: '',
      source: 'fallback',
    });
  });

  test('returns an empty label when only generic location text is available', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(resolveLocationName(buildTask(41.1, -87.1), 'Specify Region')).resolves.toBe('');
  });
});
