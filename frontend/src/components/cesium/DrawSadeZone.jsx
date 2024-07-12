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
  Cartesian3,
  Cartesian2,
  HeightReference,
  VerticalOrigin,
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import { findRectangleLength, findRectangleWidth } from '../../utils/mapUtils';

const DrawSadeZone = ({ viewerReady, viewerRef, setNewCameraPosition }) => {
  const { envJson, setEnvJson } = useMainJson();
  const [mouseDown, setMouseDown] = useState(false);
  const [firstPoint, setFirstPoint] = useState(null);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(
      (movement) => {
        setNewCameraPosition();
        setMouseDown(true);
        viewer.canvas.style.border = '2px dashed red';
        // Disable camera rotation while the user is drawing a Sade-zone
        viewer.scene.screenSpaceCameraController.enableRotate = false;

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
      () => {
        // make sure this event listener executes only when activeSadeZoneIndex is not null
        if (envJson.activeSadeZoneIndex == null) return;

        viewer.canvas.style.border = 'none';
        viewer.scene.screenSpaceCameraController.enableRotate = true;

        setMouseDown(false);
        // Clear the first-point, indicating that the current Sade-zone drawing is finished
        setFirstPoint(null);
        setNewCameraPosition();

        envJson.activeSadeZoneIndex = null;
        setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
      },
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.SHIFT,
    );
  }, [viewerReady, firstPoint, envJson.activeSadeZoneIndex]);

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
    sade.centerLat = CesiumMath.toDegrees(centerLatitude);
    sade.centerLong = CesiumMath.toDegrees(centerLongitude);
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
          {/** rectangle entity representing the sade zone */}
          {sade.rectangle && (
            <React.Fragment>
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

              {/** polyline entity representing the length of a sade zone */}
              <Entity>
                <Entity
                  polyline={{
                    positions: [
                      Cartesian3.fromRadians(
                        sade.rectangle.west,
                        sade.rectangle.south,
                        sade.height,
                      ),
                      Cartesian3.fromRadians(
                        sade.rectangle.west,
                        sade.rectangle.north,
                        sade.height,
                      ),
                    ],
                    width: 2,
                    material: Color.RED,
                  }}
                />
                <Entity
                  position={Cartesian3.fromRadians(
                    sade.rectangle.west,
                    (sade.rectangle.south + sade.rectangle.north) / 2,
                    sade.height,
                  )}
                  label={{
                    text: `Length: ${sade.length.toFixed(2)}m`,
                    font: '14pt sans-serif',
                    fillColor: Color.WHITE,
                    backgroundColor: Color.RED,
                    showBackground: true,
                    backgroundPadding: new Cartesian2(6, 4),
                    pixelOffset: new Cartesian2(0, -10),
                  }}
                />
              </Entity>

              {/** polyline entity representing the width of a sade zone */}
              <Entity
                polyline={{
                  positions: [
                    Cartesian3.fromRadians(sade.rectangle.west, sade.rectangle.south, sade.height),
                    Cartesian3.fromRadians(sade.rectangle.east, sade.rectangle.south, sade.height),
                  ],
                  width: 2,
                  material: Color.BLUE,
                }}
              >
                <Entity
                  position={Cartesian3.fromRadians(
                    (sade.rectangle.west + sade.rectangle.east) / 2,
                    sade.rectangle.south,
                    sade.height,
                  )}
                  label={{
                    text: `Width: ${sade.width.toFixed(2)}m`,
                    font: '14pt sans-serif',
                    fillColor: Color.WHITE,
                    backgroundColor: Color.BLUE,
                    showBackground: true,
                    backgroundPadding: new Cartesian2(6, 4),
                    pixelOffset: new Cartesian2(0, -10),
                  }}
                />
              </Entity>
            </React.Fragment>
          )}

          {sade.centerLong && sade.centerLat && (
            // point entity representing the center of the sade zone
            <Entity
              position={Cartesian3.fromDegrees(sade.centerLong, sade.centerLat, sade.height)}
              point={{
                pixelSize: 10,
                color: Color.RED,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                extrudedHeight: sade.height,
              }}
              label={{
                text: sade.name,
                font: '16pt sans-serif',
                backgroundColor: Color.BLACK,
                fillColor: Color.WHITE,
                showBackground: true,
                backgroundPadding: new Cartesian2(6, 4),
                heightReference: HeightReference.RELATIVE_TO_GROUND,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -50), // Offset to position the label above the point
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
