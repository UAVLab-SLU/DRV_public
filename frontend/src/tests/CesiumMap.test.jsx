/* eslint-env jest */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import CesiumMap from '../components/cesium/CesiumMap';

const mockCreateWorldTerrainAsync = jest.fn();
const mockIonResourceFromAssetId = jest.fn();

jest.mock('../contexts/MainJsonContext', () => ({
  useMainJson: () => ({
    envJson: {
      Origin: {
        longitude: -87.934524,
        latitude: 41.980381,
        height: 200,
        name: "Chicago O'Hare Airport",
      },
      activeSadeZoneIndex: null,
      setOriginHeight: jest.fn(),
    },
    setEnvJson: jest.fn(),
    registerSetCameraByPosition: jest.fn(),
  }),
}));

jest.mock('../components/cesium/DrawSadeZone', () => () => <div data-testid='draw-sade-zone' />);
jest.mock('../components/cesium/DroneDragAndDrop', () => () => <div data-testid='drone-drag' />);
jest.mock('../components/cesium/TimeLineSetterCesiumComponent', () => () => (
  <div data-testid='timeline-setter' />
));

jest.mock('resium', () => {
  const React = require('react');

  const MockViewer = React.forwardRef(({ children }, ref) => {
    React.useImperativeHandle(ref, () => ({
      cesiumElement: {
        camera: {
          position: { mock: true },
          heading: 0,
          pitch: -Math.PI / 2,
          positionCartographic: { height: 5000 },
        },
        scene: {
          screenSpaceCameraController: {
            enableTilt: true,
          },
        },
        terrainProvider: {},
      },
    }));

    return <div data-testid='cesium-viewer'>{children}</div>;
  });

  return {
    Viewer: MockViewer,
    CameraFlyTo: () => <div data-testid='camera-fly-to' />,
    Cesium3DTileset: () => <div data-testid='cesium-tileset' />,
  };
});

jest.mock('cesium', () => ({
  Cartesian3: {
    fromDegrees: jest.fn((longitude, latitude, height) => ({ longitude, latitude, height })),
  },
  IonResource: {
    fromAssetId: (...args) => mockIonResourceFromAssetId(...args),
  },
  Math: {
    toRadians: jest.fn((value) => value),
    toDegrees: jest.fn((value) => value),
  },
  createWorldTerrainAsync: (...args) => mockCreateWorldTerrainAsync(...args),
  sampleTerrainMostDetailed: jest.fn(),
  Ion: {},
  Cartographic: {
    fromCartesian: jest.fn(() => ({ longitude: 0, latitude: 0, height: 5000 })),
    fromDegrees: jest.fn(() => ({ longitude: 0, latitude: 0, height: 0 })),
  },
}));

describe('CesiumMap', () => {
  beforeEach(() => {
    mockCreateWorldTerrainAsync.mockReset();
    mockIonResourceFromAssetId.mockReset();
  });

  it('renders the viewer without requesting the optional 3D tiles asset', async () => {
    mockCreateWorldTerrainAsync.mockResolvedValue({});

    render(<CesiumMap activeConfigStep={0} />);

    await waitFor(() => {
      expect(screen.getByTestId('cesium-viewer')).toBeInTheDocument();
    });

    expect(mockIonResourceFromAssetId).not.toHaveBeenCalled();
    expect(screen.queryByTestId('cesium-tileset')).not.toBeInTheDocument();
  });

  it('keeps the viewer mounted when terrain loading fails', async () => {
    mockCreateWorldTerrainAsync.mockRejectedValue(new Error('terrain unavailable'));

    render(<CesiumMap activeConfigStep={0} />);

    await waitFor(() => {
      expect(screen.getByTestId('cesium-viewer')).toBeInTheDocument();
    });

    expect(mockIonResourceFromAssetId).not.toHaveBeenCalled();
  });
});
