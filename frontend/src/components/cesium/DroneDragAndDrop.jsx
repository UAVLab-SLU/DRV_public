import React, { useRef, useEffect, useState } from 'react';
import { Entity } from 'resium';
import {
  Cartesian3,
  Math as CesiumMath,
  Cartographic,
  VerticalOrigin,
  Cartesian2,
  HeightReference,
  JulianDate
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';

const DroneDragAndDrop = ({ viewerReady, viewerRef, setNewCameraPosition }) => {
const { setDroneLocation } = useMainJson();
  const [fieldDrones, setFieldDrones] = useState([]);

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

        const ellipsoid = viewer.scene.globe.ellipsoid;
        const cesiumCanvasPosition = new Cartesian2(x, y);
        const cartesian = viewer.camera.pickEllipsoid(cesiumCanvasPosition, ellipsoid);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const latitude = CesiumMath.toDegrees(cartographic.latitude);
          const longitude = CesiumMath.toDegrees(cartographic.longitude);
          setNewCameraPosition();

          const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
          const droneInx = dragData.index;

          viewer.animation.viewModel.timeFormatter = function (date, viewModel) {
            date = JulianDate.toDate(date);
            return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
          };

          let drone = mainJson.getDroneBasedOnIndex(droneInx);
          drone.X = latitude;
          drone.Y = longitude;
          mainJson.updateDroneBasedOnIndex(droneInx, drone);
          setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
          // find the terrain height at dropped location
          // const terrainProvider = viewer.terrainProvider;
          // const positions = [Cartographic.fromDegrees(longitude, latitude)];
          // sampleTerrain(terrainProvider, 11, positions).then((updatedPositions) => {
          //   const height = updatedPositions[0].height;


          // Fixing the same drone dragging into multiple locations
          let removedOldDrones = fieldDrones.filter((data) => data.image !== dragData.src)
          removedOldDrones.push({
            image: dragData.src,
            position: Cartesian3.fromDegrees(longitude, latitude)
          })

          setFieldDrones(removedOldDrones);
          // });
        }
      };

      canvas.addEventListener('dragover', dragOverHandler);
      canvas.addEventListener('drop', dropHandler);

      return () => {
        canvas.removeEventListener('dragover', dragOverHandler);
        canvas.removeEventListener('drop', dropHandler);
      };
    }
  }, [viewerReady]);

  return (
    <>
      {fieldDrones.map((fieldDrone, index) => (
        <Entity
          key={index}
          position={fieldDrone.position}
          billboard={{
            image: fieldDrone.image,
            scale: 0.5,
            verticalOrigin: VerticalOrigin.BOTTOM,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          }}
        />
      ))}
    </>
  );
};

DroneDragAndDrop.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
    setNewCameraPosition: PropTypes.func.isRequired
};

export default DroneDragAndDrop;