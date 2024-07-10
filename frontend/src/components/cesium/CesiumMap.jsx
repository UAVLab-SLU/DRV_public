import React, { useRef, useEffect, useState } from 'react';
import { Viewer, CameraFlyTo, Cesium3DTileset, Entity } from 'resium';
import {
  Cartesian3,
  IonResource,
  Math as CesiumMath,
  createWorldTerrainAsync,
  Ion,
  Cartographic,
} from 'cesium';
import PropTypes from 'prop-types';
import DrawSadeZone from './DrawSadeZone';
import DroneDragAndDrop from './DroneDragAndDrop';
import TimeLineSetterCesiumComponent from './TimeLineSetterCesiumComponent';
import { useMainJson } from '../../model/MainJsonContext';

const CesiumMap = ({ activeConfigStep }) => {
  const { mainJson, envJson } = useMainJson();
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({
    destination: Cartesian3.fromDegrees(-122.3472, 47.598, 3000),
    orientation: {
      heading: CesiumMath.toRadians(10),
      pitch: CesiumMath.toRadians(-10),
    },
  });
  const OSMBuildingsAssetId = 96188;
  const google3DTilesAssetId = 2275207;

  Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZTFmNzlmMy1mNjU4LTQwNGYtOTQ2YS0yOTZiZTMwNmM4NTkiLCJpZCI6MjE2MTY1LCJpYXQiOjE3MTYwODk0NzV9.52fSstXZ3CeFEcorDgCv__iCvdUecg3Q0bhaXum3ZnI';

  const setNewCameraPosition = (position = null, pitch = null) => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;

    const { camera } = viewer;
    setCameraPosition({
      destination: position === null ? camera.position : position,
      orientation: {
        heading: camera.heading,
        pitch: pitch === null ? camera.pitch : pitch,
      },
    });
  };

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
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    if (activeConfigStep === 1) {
      const pitch = -Math.PI / 2;
      setNewCameraPosition(null, pitch);
      // Disable camera pitch
      viewer.scene.screenSpaceCameraController.enableTilt = false;
    } else {
      // Enable camera pitch
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      setNewCameraPosition();
    }
  }, [mainJson, activeConfigStep]);

  const terrainProvider = createWorldTerrainAsync();

  return (
    <Viewer
      ref={viewerRef}
      terrainProvider={terrainProvider}
      style={{ cursor: envJson.activeSadeZoneIndex == null ? 'default' : 'crosshair' }}
    >
      <Cesium3DTileset url={IonResource.fromAssetId(google3DTilesAssetId)} />
      <CameraFlyTo
        destination={cameraPosition.destination}
        orientation={cameraPosition.orientation}
        duration={2}
      />

      <DroneDragAndDrop
        viewerReady={viewerReady}
        viewerRef={viewerRef}
        setNewCameraPosition={setNewCameraPosition}
      />

      <DrawSadeZone
        viewerReady={viewerReady}
        viewerRef={viewerRef}
        setNewCameraPosition={setNewCameraPosition}
      />

      <TimeLineSetterCesiumComponent
        viewerReady={viewerReady}
        viewerRef={viewerRef}
      />
    </Viewer>
  );
};

CesiumMap.propTypes = {
  activeConfigStep: PropTypes.number.isRequired,
};

export default CesiumMap;
