import React, { useRef, useEffect, useState } from 'react';
import { Entity } from 'resium';
import {
  Cartesian3,
  Math as CesiumMath,
  Cartographic,
  Cartesian2,
  JulianDate,
  Ellipsoid,
  Color,
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';
import dayjs from 'dayjs';
import { EnvironmentModel } from '../../model/EnvironmentModel';

const DroneDragAndDrop = ({ viewerReady, viewerRef, setNewCameraPosition }) => {
  const { syncDroneLocation, mainJson, setMainJson, envJson, setEnvJson } = useMainJson();

  // drone drag and drop event listeners
  useEffect(() => {
    if (viewerReady) {
      const viewer = viewerRef.current.cesiumElement;
      const canvas = viewer.canvas;

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
        const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
        const droneInx = dragData.index;
        const cesiumCanvasPosition = new Cartesian2(x, y);
        const cartesian = viewer.scene.pickPosition(cesiumCanvasPosition);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const latitude = CesiumMath.toDegrees(cartographic.latitude);
          const longitude = CesiumMath.toDegrees(cartographic.longitude);

          // Use getPickRay to get the building height
          const ray = viewer.camera.getPickRay(cesiumCanvasPosition);
          const intersection = viewer.scene.pickFromRay(ray, []);
          let buildingHeight = 0;

          if (intersection && intersection.position) {
            buildingHeight = Cartographic.fromCartesian(intersection.position).height;
          }

          setNewCameraPosition();

          if (dragData.type === 'drone'){
            syncDroneLocation(latitude, longitude, buildingHeight, droneInx);
          }
        }
      };

      canvas.addEventListener('dragover', dragOverHandler);
      canvas.addEventListener('drop', dropHandler);

      return () => {
        canvas.removeEventListener('dragover', dragOverHandler);
        canvas.removeEventListener('drop', dropHandler);
      };
    }
  }, [viewerReady, mainJson, envJson]);

  return (
    <>
      {mainJson.getAllDrones().map((drone, index) => {
        if (!drone.X || !drone.Y || !drone.Z) return null;
        const position = Cartesian3.fromDegrees(drone.Y, drone.X, drone.Z);
        return (
          <React.Fragment key={index}>
            <Entity
              position={position}
              billboard={{
                image: drone.image,
                scale: 1,
                eyeOffset: new Cartesian3(0.0, 0.0, -500.0),
              }}
            />
            <Entity
              position={position}
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
  setNewCameraPosition: PropTypes.func.isRequired,
};

export default DroneDragAndDrop;
