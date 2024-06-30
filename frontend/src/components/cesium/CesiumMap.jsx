import React, { useRef, useEffect, useState } from 'react';
import { Viewer, CameraFlyTo, Cesium3DTileset, Entity } from 'resium';
import {
  Cartesian3, CesiumTerrainProvider, IonResource, Math as CesiumMath, ScreenSpaceEventType,
  Cartographic, createWorldTerrainAsync, createOsmBuildingsAsync, Ion,
  Color, PolygonHierarchy, LabelStyle, VerticalOrigin, Cartesian2, HeightReference, sampleTerrain,
  Rectangle, KeyboardEventModifier, ScreenSpaceEventHandler, CallbackProperty, Ellipsoid,
  defined
} from 'cesium';
import PropTypes from 'prop-types';
import DrawSadeZone from './DrawSadeZone';
import DroneDragAndDrop from './DroneDragAndDrop';

const CesiumMap = ({ mainJson, setMainJson, id, setDroneLocation }) => {
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [billboards, setBillboards] = useState([]);
  const [cameraPosition, setCameraPosition] = useState({
    destination: Cartesian3.fromDegrees(-122.3472, 47.598, 1000),
    orientation: {
      heading: CesiumMath.toRadians(10),
      pitch: CesiumMath.toRadians(-10)
    }
  });

  Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZTFmNzlmMy1mNjU4LTQwNGYtOTQ2YS0yOTZiZTMwNmM4NTkiLCJpZCI6MjE2MTY1LCJpYXQiOjE3MTYwODk0NzV9.52fSstXZ3CeFEcorDgCv__iCvdUecg3Q0bhaXum3ZnI";

  const setNewCameraPosition = () => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;

    const { camera } = viewer;
    setCameraPosition({
      destination: camera.position,
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
      }
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

  const terrainProvider = createWorldTerrainAsync();
  const osmBuildingsTileset = createOsmBuildingsAsync();

  return (

    <Viewer ref={viewerRef} terrainProvider={terrainProvider}>
      <Cesium3DTileset url={IonResource.fromAssetId(96188)} />
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
        viewerReady={viewerReady} viewerRef={viewerRef} setNewCameraPosition={setNewCameraPosition}
      />
    </Viewer>
  );
};

CesiumMap.propTypes = {
  setMainJson: PropTypes.func.isRequired,
  mainJson: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  setDroneLocation: PropTypes.func.isRequired,
};

export default CesiumMap;