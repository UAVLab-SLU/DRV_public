import React, { useRef, useEffect, useState } from 'react';
import { Viewer, CameraFlyTo, Cesium3DTileset, Entity } from 'resium';
import { Cartesian3, CesiumTerrainProvider, IonResource, Math as CesiumMath, ScreenSpaceEventType, 
Cartographic, createWorldTerrainAsync, createOsmBuildingsAsync, Ion,
Color, PolygonHierarchy, LabelStyle, VerticalOrigin, Cartesian2, HeightReference, sampleTerrain } from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../contexts/MainJsonContext'; // Add this import

const CesiumMap = ({onLocationSelect, id, setDroneLocation, setLastDroppedLocation}) => {
  const { mainJson } = useMainJson(); // Add this line to get mainJson from context
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [drawing, setDrawing] = useState(true);
  const [points, setPoints] = useState([]);
  const [billboards, setBillboards] = useState([]);
  const [cameraPosition, setCameraPosition] = useState({

    // destination: Cartesian3.fromDegrees(-122.3472, 47.598, 370),
    destination: Cartesian3.fromDegrees(-122.3472, 47.598, 1000),
    // destination: Cartesian3.fromDegrees(-122.3472, 47.598, 130000),
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
    if (viewerReady && drawing) {
      const viewer = viewerRef.current.cesiumElement;

      viewer.screenSpaceEventHandler.setInputAction((click) => {
        const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
          // setPoints(currentPoints => {
          //     const newPoints = [...currentPoints, cartesian];
          //     return newPoints;
          // });
          setPoints(currentPoints => {
            if (currentPoints.length === 0) {
              // If no points have been added, add the first point and replicate it to start the polygon closure
              return [cartesian, cartesian];
            } else {
              // Insert the new point before the last point to keep the polygon closed
              let newPoints = [...currentPoints];
              newPoints.splice(newPoints.length - 1, 0, cartesian);
              return newPoints;
            }
          });

          setCameraPosition({
            destination: viewer.camera.position,
            orientation: {
              heading: viewer.camera.heading,
              pitch: viewer.camera.pitch
            }
          });
        }}, ScreenSpaceEventType.LEFT_CLICK);

      return () => {
        viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      };
    }
  }, [viewerReady]);

  // drag and drop event listeners
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
      
              setLastDroppedLocation({ latitude, longitude });
              
              try {
                  const data = JSON.parse(event.dataTransfer.getData("application/json"));
                  
                  if (data.type === 'drone') {
                      // Handle drone icon drop
                      setDroneLocation(data.index, { latitude, longitude });
                  } else if (data.type === 'pin') {
                      // Handle region pin drop
                      setSafeZones(currentZones => [...currentZones, { 
                          position: cartesian, 
                          image: data.iconUrl, 
                          radius: data.radius === '' || data.radius === 0 ? 0 : data.radius 
                      }]);
                  }
              } catch (error) {
                  console.error("Error parsing dropped data:", error);
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
  }, [viewerReady]);
  

  const terrainProvider= createWorldTerrainAsync();
  const osmBuildingsTileset = createOsmBuildingsAsync();

  const [safeZones, setSafeZones] = useState([]);

  return (

    <Viewer ref={viewerRef} terrainProvider={terrainProvider}>
      {points.map((point, index) => (
        <Entity
          key={index}
          position= {point}
          point= {{
            pixelSize: 5,
            color: Color.WHITE,
            outlineColor: Color.BLUE,
            outlineWidth: 1,
          }}
          label= {{
            text: `${index+1}`,
            font: "14pt monospace",
            style: LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -9),
          }}
        />
       ))}
      {viewerReady && (
        <Entity
          name="polygon-entity"
          polygon={{
            hierarchy: new PolygonHierarchy(points),
            material: Color.RED.withAlpha(0.5),
            outline: true,
            outlineColor: Color.BLACK
          }}
        />
      )}
      {billboards.map((billboard, index) => (
        <Entity
          key={index}
          position={billboard.position}
          billboard={{
            image: billboard.image,
            scale: 0.5,
            verticalOrigin: VerticalOrigin.BOTTOM,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          }}
        />
      ))}
      <Cesium3DTileset url={IonResource.fromAssetId(96188)} />

      {mainJson.Drones?.map((drone, index) => (
        <Entity
          key={`drone-${index}`}
          position={Cartesian3.fromDegrees(drone.Y, drone.X, drone.Z)}
          billboard={{
            image: drone.image,
            scale: 0.1,
            verticalOrigin: VerticalOrigin.BOTTOM
          }}
        />
      ))}

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
          {zone.radius > 0 && (
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
          )}
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

CesiumMap.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  setDroneLocation: PropTypes.func.isRequired,
  setLastDroppedLocation: PropTypes.func.isRequired,
};

export default CesiumMap;