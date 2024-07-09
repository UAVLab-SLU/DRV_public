import React, { useRef, useEffect, useState } from 'react';
import { Entity } from 'resium';
import {
  Cartesian3,
  Math as CesiumMath,
  Cartographic,
  VerticalOrigin,
  Cartesian2,
  HeightReference,
  JulianDate, Ellipsoid, Color
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';

const DroneDragAndDrop = ({ viewerReady, viewerRef, setNewCameraPosition }) => {
  const { syncDroneLocation, mainJson } = useMainJson();

  // drone drag and drop event listeners
  useEffect(() => {
    if (viewerReady) {
      const viewer = viewerRef.current.cesiumElement;
      const canvas = viewer.canvas;
      
      viewer.animation.viewModel.timeFormatter = function (date, viewModel) {
        date = JulianDate.toDate(date);
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      };
      // Ensure the canvas is focusable
      canvas.setAttribute('tabindex', '0');

      const dragOverHandler = (event) => {
        event.preventDefault(); // Necessary to allow the drop
        canvas.style.border = '2px dashed red'; // Visual feedback
      };

      const dropHandler = (event) => {
        event.preventDefault();
        canvas.style.border = ''; // Remove visual feedback

        const rect = canvas.getBoundingClientRect();
        // Adjust X and Y coordinate relative to the canvas
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
        const droneInx = dragData.index;
        const ellipsoid = viewer.scene.globe.ellipsoid;
        const cesiumCanvasPosition = new Cartesian2(x, y);
        const cartesian = viewer.camera.pickEllipsoid(cesiumCanvasPosition, ellipsoid);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const latitude = CesiumMath.toDegrees(cartographic.latitude);
          const longitude = CesiumMath.toDegrees(cartographic.longitude);

          // Use viewer.scene.pickFromRay to get the building height
          const ray = viewer.camera.getPickRay(cesiumCanvasPosition);
          const intersection = viewer.scene.pickFromRay(ray, []);
          let buildingHeight = 0;

          if (intersection && intersection.position) {
            buildingHeight = Cartographic.fromCartesian(intersection.position).height;
          }
          console.log('Building Height:', buildingHeight);

          const position = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, buildingHeight);
          setNewCameraPosition();

          syncDroneLocation(droneInx, latitude, longitude, buildingHeight, position, dragData.src);
        }
      };

      canvas.addEventListener('dragover', dragOverHandler);
      canvas.addEventListener('drop', dropHandler);

      return () => {
        canvas.removeEventListener('dragover', dragOverHandler);
        canvas.removeEventListener('drop', dropHandler);
      };
    }
  }, [viewerReady, mainJson]);

  return (
    <>
      {mainJson.getAllDrones().map((drone, index) => {
        if (!drone.cesiumPosition || !drone.cesiumImage) return null;

        return (
          <React.Fragment key={index}>
            <Entity
              position={drone.cesiumPosition}
              billboard={{
                image: drone.cesiumImage,
                scale: 1,
              }}
            />
            <Entity
              position={drone.cesiumPosition}
              point={{
                pixelSize: 7,
                color: drone.color,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

DroneDragAndDrop.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
  setNewCameraPosition: PropTypes.func.isRequired
};

export default DroneDragAndDrop;