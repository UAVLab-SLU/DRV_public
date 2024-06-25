import React, { useRef, useEffect, useState } from 'react';
import { Viewer, CameraFlyTo, Entity } from 'resium';
import { Cartesian3, Math as CesiumMath, ScreenSpaceEventType, 
Cartographic, createWorldTerrainAsync, Ion,
Color, VerticalOrigin, Cartesian2 } from 'cesium';
import PropTypes from 'prop-types';

const Map = ({ onLocationSelect }) => {
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [safeZones, setSafeZones] = useState([]);
  const [cameraPosition, setCameraPosition] = useState({
    destination: Cartesian3.fromDegrees(-122.3472, 47.598, 1000),
    orientation: {
      heading: CesiumMath.toRadians(10),
      pitch: CesiumMath.toRadians(-10)
    }
  });
  
  Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZTFmNzlmMy1mNjU4LTQwNGYtOTQ2YS0yOTZiZTMwNmM4NTkiLCJpZCI6MjE2MTY1LCJpYXQiOjE3MTYwODk0NzV9.52fSstXZ3CeFEcorDgCv__iCvdUecg3Q0bhaXum3ZnI";

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
    if (viewerReady) {
        const viewer = viewerRef.current.cesiumElement;
        const canvas = viewer.canvas;

        canvas.setAttribute('tabindex', '0');

        const dragOverHandler = (event) => {
            event.preventDefault();
            canvas.style.border = '2px dashed red';
        };

        const dropHandler = (event) => {
          event.preventDefault();
          canvas.style.border = '';

          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;  
          const y = event.clientY - rect.top;

          const ellipsoid = viewer.scene.globe.ellipsoid;
          const cesiumCanvasPosition = new Cartesian2(x, y);
          const cartesian = viewer.camera.pickEllipsoid(cesiumCanvasPosition, ellipsoid);
          if (cartesian) {
            const cartographic = Cartographic.fromCartesian(cartesian);
            const latitude = CesiumMath.toDegrees(cartographic.latitude);
            const longitude = CesiumMath.toDegrees(cartographic.longitude);
            
            setCameraPosition({
              destination: viewer.camera.position,
              orientation: {
                heading: viewer.camera.heading,
                pitch: viewer.camera.pitch
              }
            });

            onLocationSelect(latitude, longitude);
            const data = JSON.parse(event.dataTransfer.getData("text/plain"));
            setSafeZones(currentZones => [...currentZones, { position: cartesian, image: data.iconUrl, radius: data.radius }]);
          }
        };

        canvas.addEventListener('dragover', dragOverHandler);
        canvas.addEventListener('drop', dropHandler);

        return () => {
            canvas.removeEventListener('dragover', dragOverHandler);
            canvas.removeEventListener('drop', dropHandler);
        };
    }
  }, [viewerReady, onLocationSelect]);
  

  const terrainProvider = createWorldTerrainAsync();

  return (
    <Viewer ref={viewerRef} terrainProvider={terrainProvider}>
      {safeZones.map((zone, index) => (
        <React.Fragment key={index}>
          <Entity
            position={zone.position}
            billboard={{
              image: zone.image,
              scale: 0.15,
              verticalOrigin: VerticalOrigin.BOTTOM,
              color: Color.WHITE
            }}
          />
          <Entity
            position={zone.position}
            ellipse={{
              semiMinorAxis: zone.radius * 1609.34,  // Convert miles to meters
              semiMajorAxis: zone.radius * 1609.34,  // Convert miles to meters
              material: Color.GREEN.withAlpha(0.3),
              outline: true,
              outlineColor: Color.GREEN
            }}
          />
        </React.Fragment>
      ))}
      <CameraFlyTo
        destination={cameraPosition.destination}
        orientation={cameraPosition.orientation}
        duration={2}
      />
    </Viewer>
  );
};

Map.propTypes = {
  onLocationSelect: PropTypes.func.isRequired
};

export default Map;