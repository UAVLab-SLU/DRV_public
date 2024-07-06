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
  Cartesian2,
  CornerType,
  HeightReference,
  VerticalOrigin,
  LabelStyle,
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import {
  findRectangleLength,
  findRectangleWidth,
  computeCircle,
  computeMidpoints,
} from '../../utils/mapUtils';

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
      envJson.activeSadeZoneIndex = null;
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
      console.log('env json', envJson);
    }, ScreenSpaceEventType.LEFT_UP);

    return () => {
      handler.destroy();
    };
  }, [viewerReady, firstPoint]);

  const updateSadeZone = (rect) => {
    const currentInx = envJson.activeSadeZoneIndex;
    if (currentInx == null) return;
    let sade = envJson.getSadeBasedOnIndex(currentInx);
    sade.rectangle = rect;
    const len = findRectangleLength(rect);
    sade.length = len;
    const width = findRectangleWidth(rect);
    sade.width = width;
    // Calculate the center of the rectangle
    const centerLongitude = (rect.east + rect.west) / 2;
    const centerLatitude = (rect.north + rect.south) / 2;
    sade.latitude1 = centerLatitude;
    sade.longitude1 = centerLongitude;
    envJson.updateSadeBasedOnIndex(currentInx, sade);
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  };

  useEffect(() => {
    setNewCameraPosition();
  }, [envJson]);

  return (
    <>
      {envJson.getAllSades().map((sade, index) => (
        <React.Fragment key={index}>
          {sade.rectangle && (
            <Entity
              rectangle={{
                coordinates: sade.rectangle,
                material: Color.GREEN.withAlpha(0.5),
                outline: true,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                extrudedHeight: sade.height,
              }}
            />
          )}
          {sade.longitude1 && sade.latitude1 && (
            // point entity representing the center of the sade zone
            <Entity
              position={Cartesian3.fromRadians(sade.longitude1, sade.latitude1, sade.height)}
              point={{
                pixelSize: 10,
                color: Color.RED,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                extrudedHeight: sade.height,
              }}
              label={{
                text: sade.name,
                font: '18px sans-serif',
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 1,
                style: LabelStyle.FILL_AND_OUTLINE,
                heightReference: HeightReference.RELATIVE_TO_GROUND,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -40), // Offset to position the label above the point
                position: Cartesian3.fromDegrees(sade.longitude1, sade.latitude1, sade.height),
              }}
            />
          )}

          {/* TO-DO: specify length and width labels of sade zone */}
          {sade.rectangle && (
            <Entity
              polyline={{
                positions: Cartesian3.fromDegreesArray([
                  CesiumMath.toDegrees(sade.rectangle.west),
                  CesiumMath.toDegrees(sade.rectangle.south),
                  CesiumMath.toDegrees(sade.rectangle.west),
                  CesiumMath.toDegrees(sade.rectangle.north),
                ]),
                width: 2,
                material: Color.RED,
              }}
              label={{
                text: `Width: ${sade.width.toFixed(2)}m`,
                fillColor: Color.WHITE,
                showBackground: true,
                backgroundPadding: new Cartesian2(6, 4),
                pixelOffset: new Cartesian2(0, -40),
              }}
            />
          )}

          {sade.rectangle && (
            <Entity
              polyline={{
                positions: Cartesian3.fromDegreesArray([
                  CesiumMath.toDegrees(sade.rectangle.west),
                  CesiumMath.toDegrees(sade.rectangle.south),
                  CesiumMath.toDegrees(sade.rectangle.east),
                  CesiumMath.toDegrees(sade.rectangle.south),
                ]),
                width: 2,
                material: Color.BLUE,
              }}
              label={{
                text: `Length: ${sade.length.toFixed(2)}m`,
                fillColor: Color.WHITE,
                showBackground: true,
                backgroundPadding: new Cartesian2(6, 4),
                pixelOffset: new Cartesian2(0, -20),
              }}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

DrawSadeZone.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
  setNewCameraPosition: PropTypes.func.isRequired,
};

export default DrawSadeZone;
