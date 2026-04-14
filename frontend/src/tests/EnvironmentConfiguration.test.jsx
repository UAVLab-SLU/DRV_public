/* eslint-env jest */
/* eslint-disable react/prop-types */

import React from 'react';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EnvironmentConfiguration from '../components/EnvironmentConfiguration';

const mockUseJsApiLoader = jest.fn();

jest.mock('@react-google-maps/api', () => {
  const mapClickMock = { handler: null };
  const GoogleMapMock = ({ onClick, children }) => {
    mapClickMock.handler = onClick;
    return <div data-testid='google-map'>{children}</div>;
  };

  const MarkerMock = () => <div data-testid='marker' />;

  return {
    __esModule: true,
    GoogleMap: GoogleMapMock,
    Marker: MarkerMock,
    useJsApiLoader: (...args) => mockUseJsApiLoader(...args),
    __triggerMapClick: (event) => {
      if (mapClickMock.handler) {
        mapClickMock.handler(event);
      }
    },
  };
});

import { __triggerMapClick } from '@react-google-maps/api';

const buildProps = () => ({
  id: 'environment',
  environmentJson: jest.fn(),
  mainJsonValue: {
    environment: {
      enableFuzzy: false,
      timeOfDayFuzzy: false,
      positionFuzzy: false,
      windFuzzy: false,
      Wind: {
        Direction: 'NE',
        Force: 5,
        Type: 'Constant Wind',
        Fluctuation: 0,
      },
      Origin: {
        Name: 'Specify Region',
        Latitude: 41.98,
        Longitude: -87.93,
        Height: 2,
      },
      TimeOfDay: '10:00:00',
      UseGeo: true,
      time: dayjs('2020-01-01T10:00:00'),
    },
  },
});

describe('EnvironmentConfiguration interactions', () => {
  const originalGoogleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-google-maps-key';
    mockUseJsApiLoader.mockReset();
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: true,
      loadError: undefined,
    });
  });

  afterEach(() => {
    if (originalGoogleMapsApiKey == null) {
      delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    } else {
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY = originalGoogleMapsApiKey;
    }
    jest.clearAllMocks();
  });

  it('propagates updated origin coordinates after a map click', async () => {
    const props = buildProps();
    render(<EnvironmentConfiguration {...props} />);

    act(() => {
      __triggerMapClick({
        latLng: {
          lat: () => 12.34,
          lng: () => 56.78,
        },
      });
    });

    await waitFor(() => {
      const lastCall = props.environmentJson.mock.calls.at(-1);
      expect(lastCall?.[0].Origin.Latitude).toBe(12.34);
      expect(lastCall?.[0].Origin.Longitude).toBe(56.78);
    });
  });

  it('clamps wind force input between 0 and 50', async () => {
    const props = buildProps();
    render(<EnvironmentConfiguration {...props} />);

    const forceInput = screen.getByTestId('wind-force-input');

    fireEvent.change(forceInput, { target: { value: '60' } });
    await waitFor(() => {
      const lastCall = props.environmentJson.mock.calls.at(-1);
      expect(lastCall?.[0].Wind.Force).toBe(50);
    });

    fireEvent.change(forceInput, { target: { value: '-5' } });
    await waitFor(() => {
      const lastCall = props.environmentJson.mock.calls.at(-1);
      expect(lastCall?.[0].Wind.Force).toBe(0);
    });
  });

  it('shows a warning instead of crashing when Google Maps fails to load', () => {
    const props = buildProps();
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: false,
      loadError: new Error('quota exceeded'),
    });

    render(<EnvironmentConfiguration {...props} />);

    expect(screen.getByText(/Google Maps preview is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
  });
});
