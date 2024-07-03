import React, { useRef, useEffect, useState } from 'react';
import { Entity } from 'resium';
import {
  ScreenSpaceEventType,
  Cartographic,
  Color,
  Rectangle,
  KeyboardEventModifier,
  ScreenSpaceEventHandler,
  Ellipsoid,
  Math as CesiumMath,
  defined,
  Cartesian3,
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import { findRectangleLength, findRectangleWidth } from '../../utils/mapUtils';

const DrawSadeZone = ({ viewerReady, viewerRef, setNewCameraPosition }) => {
  const { mainJson, setMainJson, envJson, setEnvJson } = useMainJson();
  const [mouseDown, setMouseDown] = useState(false);
  const [firstPoint, setFirstPoint] = useState(null);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(
      (movement) => {
        if (!mouseDown) return;
        const cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid,
        );
        if (cartesian && firstPoint) {
          const tempCartographic = Cartographic.fromCartesian(cartesian, Ellipsoid.WGS84);
          const rect = new Rectangle(
            Math.min(tempCartographic.longitude, firstPoint.longitude),
            Math.min(tempCartographic.latitude, firstPoint.latitude),
            Math.max(tempCartographic.longitude, firstPoint.longitude),
            Math.max(tempCartographic.latitude, firstPoint.latitude),
          );
          updateSadeZone(rect);
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.SHIFT,
    );

    handler.setInputAction(
      (movement) => {
        setNewCameraPosition();
        setMouseDown(true);
        const cartesian = viewer.camera.pickEllipsoid(
          movement.position,
          viewer.scene.globe.ellipsoid,
        );
        if (cartesian) {
          const rectPoint = Cartographic.fromCartesian(cartesian, Ellipsoid.WGS84);
          // Set the starting point of the rectangle
          setFirstPoint(rectPoint);
        }
      },
      ScreenSpaceEventType.LEFT_DOWN,
      KeyboardEventModifier.SHIFT,
    );

    handler.setInputAction(() => {
      setMouseDown(false);
      // Clear the first point
      setFirstPoint(null);
      setNewCameraPosition();
    }, ScreenSpaceEventType.LEFT_UP);

    return () => {
      handler.destroy();
    };
  }, [viewerReady, firstPoint]);

  const updateSadeZone = (rect) => {
    const lastIndex = envJson.getSadesCount() - 1;
    if (lastIndex >= 0) {
      let sade = envJson.getSadeBasedOnIndex(lastIndex);
      sade.rectangle = rect;
      const len = findRectangleLength(rect);
      sade.length = len;
      const width = findRectangleWidth(rect);
      sade.width = width;
      envJson.updateSadeBasedOnIndex(lastIndex, sade);
      console.log('env json', envJson);
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
    }
  };

  return (
    <>
      {/* {firstPoint && (
      <Entity
        position={Cartesian3.fromRadians(firstPoint.longitude, firstPoint.latitude)}
        point={{ 
          pixelSize: 10,
          color: Color.RED,
          outlineColor: Color.WHITE,
          outlineWidth: 2
        }}
      />
    )} */}
      {envJson.getAllSades().map((sade, index) =>
        sade.rectangle ? (
          <Entity
            key={index}
            rectangle={{
              coordinates: sade.rectangle,
              material: Color.GREEN.withAlpha(0.5),
              outline: true,
              outlineColor: Color.WHITE,
              outlineWidth: 2,
              extrudedHeight: 300.0,
            }}
          />
        ) : (
          <div key={index}>No valid zone defined.</div>
        ),
      )}
    </>
  );
};

DrawSadeZone.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
  setNewCameraPosition: PropTypes.func.isRequired,
};

export default DrawSadeZone;
