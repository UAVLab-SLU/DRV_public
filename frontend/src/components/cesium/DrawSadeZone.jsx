import React, { useRef, useEffect, useState } from 'react';
import { Entity } from 'resium';
import {
  ScreenSpaceEventType, Cartographic, Color, Rectangle, KeyboardEventModifier,
  ScreenSpaceEventHandler, Ellipsoid, Math as CesiumMath, defined
} from 'cesium';
import PropTypes from 'prop-types';

const DrawSadeZone = ({ viewerReady, viewerRef, setNewCameraPosition }) => {
  const [mouseDown, setMouseDown] = useState(false);
  const [firstPoint, setFirstPoint] = useState(null);
  const [sadeZones, setSadeZones] = useState([]);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [corners, setCorners] = useState({});
  const [selectedCorner, setSelectedCorner] = useState(null);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Dragging logic
    handler.setInputAction((movement) => {
      if (!mouseDown) return;
      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const tempCartographic = Cartographic.fromCartesian(cartesian, Ellipsoid.WGS84);
        if (!firstPoint) {
          setFirstPoint(tempCartographic);
          setSadeZones(prevSadeZones => [
            ...prevSadeZones,
            new Rectangle(
              tempCartographic.longitude, tempCartographic.latitude,
              tempCartographic.longitude, tempCartographic.latitude
            )
          ]);
        } else {
          setSadeZones(prevSadeZones => {
            const updatedZones = [...prevSadeZones];
            const lastRectangleIndex = updatedZones.length - 1;

            updatedZones[lastRectangleIndex] = new Rectangle(
              Math.min(tempCartographic.longitude, firstPoint.longitude),
              Math.min(tempCartographic.latitude, firstPoint.latitude),
              Math.max(tempCartographic.longitude, firstPoint.longitude),
              Math.max(tempCartographic.latitude, firstPoint.latitude)
            );

            return updatedZones;
          });

          setNewCameraPosition();
        }
      }
    }, ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.SHIFT);

    handler.setInputAction(() => {
      setMouseDown(true);
    }, ScreenSpaceEventType.LEFT_DOWN, KeyboardEventModifier.SHIFT);

    handler.setInputAction(() => {
      setMouseDown(false);
      setFirstPoint(null);
      setNewCameraPosition();
    }, ScreenSpaceEventType.LEFT_UP);

    return () => {
      handler.destroy();
    };
  }, [viewerReady, mouseDown, firstPoint, sadeZones]);

  return (
    <>
      {sadeZones.map((sadeZone, index) => (
        <Entity
          key={index}
          rectangle={{
            coordinates: sadeZone,
            material: Color.GREEN.withAlpha(0.5),
            outline: true,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            extrudedHeight: 30.0,
          }}
        />
      ))}
    </>
  );
};

DrawSadeZone.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
  setNewCameraPosition: PropTypes.func.isRequired
};

export default DrawSadeZone;