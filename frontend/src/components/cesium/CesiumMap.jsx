import React, { useRef, useEffect, useState } from 'react';
import { Viewer, CameraFlyTo } from 'resium';
import {
  Cartesian3,
  Math as CesiumMath,
  createWorldTerrainAsync,
  sampleTerrainMostDetailed,
  Ion,
  Cartographic,
} from 'cesium';
import PropTypes from 'prop-types';
import DrawSadeZone from './DrawSadeZone';
import DroneDragAndDrop from './DroneDragAndDrop';
import TimeLineSetterCesiumComponent from './TimeLineSetterCesiumComponent';
import { useMainJson } from '../../contexts/MainJsonContext';
import { originTypes } from '../../constants/env';
import { EnvironmentModel } from '../../model/EnvironmentModel';

function normalizeConfigValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^['"]|['"]$/g, '');
}

const CesiumMap = ({ activeConfigStep }) => {
  const DEFAULT_CAMERA_HEIGHT = 5000;
  const { envJson, setEnvJson, registerSetCameraByPosition } = useMainJson();
  const viewerRef = useRef(null);
  const flyPending = useRef(false);

  const [viewerReady, setViewerReady] = useState(false);
  const [terrainProvider, setTerrainProvider] = useState(undefined);
  const [cameraPosition, setCameraPosition] = useState({
    destination: Cartesian3.fromDegrees(
      envJson.Origin.longitude,
      envJson.Origin.latitude,
      DEFAULT_CAMERA_HEIGHT,
    ),
    orientation: {
      heading: CesiumMath.toRadians(10),
      pitch: -Math.PI / 2,
    },
  });

  Ion.defaultAccessToken = normalizeConfigValue(process.env.REACT_APP_CESIUM_ION_ACCESS_TOKEN);

  const setCameraByPosition = (position = null, pitch = null) => {
    if (!viewerReady) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const { camera } = viewer;
    setCameraPosition({
      destination: position ?? camera.position,
      orientation: {
        heading: camera.heading,
        pitch: pitch ?? camera.pitch,
      },
    });
  };

  const setCameraByLongLat = (long, lat, altitude, pitch) => {
    if (!viewerReady) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const { camera } = viewer;
    const minAltitude =
      altitude ?? Math.min(DEFAULT_CAMERA_HEIGHT, camera.positionCartographic.height);
    const position = Cartesian3.fromDegrees(long, lat, minAltitude);

    setCameraPosition({
      destination: position,
      orientation: {
        heading: camera.heading,
        pitch: pitch ?? camera.pitch,
      },
    });
  };

  useEffect(() => {
    registerSetCameraByPosition(setCameraByLongLat);
    return () => registerSetCameraByPosition(null);
  }, [registerSetCameraByPosition]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (viewerRef.current?.cesiumElement) {
        setViewerReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTerrainProvider() {
      try {
        const nextTerrainProvider = await createWorldTerrainAsync();
        if (!cancelled) {
          setTerrainProvider(nextTerrainProvider);
        }
      } catch (error) {
        if (!cancelled) {
          setTerrainProvider(undefined);
        }
        console.warn(
          'Failed to load Cesium terrain provider. Falling back to the base globe.',
          error,
        );
      }
    }

    loadTerrainProvider();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const { longitude, latitude, name } = envJson.Origin;
    flyPending.current = true;

    if (!name || longitude === 0 || latitude === 0) {
      flyPending.current = false;
    }

    if (activeConfigStep === 1) {
      setCameraByLongLat(
        envJson.Origin.longitude,
        envJson.Origin.latitude,
        DEFAULT_CAMERA_HEIGHT,
        -Math.PI / 2,
      );

      viewer.scene.screenSpaceCameraController.enableTilt = false;
    } else {
      viewer.scene.screenSpaceCameraController.enableTilt = true;
    }
  }, [activeConfigStep, envJson.Origin.latitude, envJson.Origin.longitude, viewerReady]);

  useEffect(() => {
    const { longitude, latitude, name } = envJson.Origin;
    flyPending.current = true;
    if (!name || longitude === 0 || latitude === 0) {
      return;
    }

    setCameraByLongLat(
      envJson.Origin.longitude,
      envJson.Origin.latitude,
      DEFAULT_CAMERA_HEIGHT,
      -Math.PI / 2,
    );
  }, [envJson.Origin.latitude, envJson.Origin.longitude, envJson.Origin.height, viewerReady]);

  useEffect(() => {
    if (envJson.Origin.name === originTypes.SpecifyRegion) {
      findHeight()
        .then((height) => {
          if (height == null) {
            return;
          }
          envJson.setOriginHeight(height);
          setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
        })
        .catch((error) => {
          console.error('Error fetching height:', error);
        });
    }
  }, [envJson.Origin.name, viewerReady]);

  const findHeight = async () => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer || !viewer.terrainProvider) {
      return null;
    }

    const position = Cartographic.fromDegrees(envJson.Origin.longitude, envJson.Origin.latitude);

    try {
      const positions = [position];
      await sampleTerrainMostDetailed(viewer.terrainProvider, positions);
      return positions[0].height;
    } catch (error) {
      console.error('Failed to get terrain height:', error);
      return null;
    }
  };

  return (
    <Viewer
      ref={viewerRef}
      terrainProvider={terrainProvider}
      style={{ cursor: envJson.activeSadeZoneIndex == null ? 'default' : 'crosshair' }}
    >
      {flyPending.current && (
        <CameraFlyTo
          destination={cameraPosition.destination}
          orientation={cameraPosition.orientation}
          duration={2}
          onComplete={() => {
            flyPending.current = false;
          }}
        />
      )}

      <DroneDragAndDrop
        viewerReady={viewerReady}
        viewerRef={viewerRef}
        setCameraByPosition={setCameraByPosition}
      />

      <DrawSadeZone
        viewerReady={viewerReady}
        viewerRef={viewerRef}
        setCameraByPosition={setCameraByPosition}
      />

      <TimeLineSetterCesiumComponent viewerReady={viewerReady} viewerRef={viewerRef} />
    </Viewer>
  );
};

CesiumMap.propTypes = {
  activeConfigStep: PropTypes.number.isRequired,
};

export default CesiumMap;
