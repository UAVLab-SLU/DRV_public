// // import React from 'react';
// import { Viewer, Cesium3DTileset, CameraFlyTo } from 'resium';
// import { Cartesian3, Math, IonResource, CesiumTerrainProvider } from 'cesium';

// const App = () => {
//   const position = Cartesian3.fromDegrees(-122.3472, 47.598, 370);
//   const orientation = {
//     heading: Math.toRadians(10),
//     pitch: Math.toRadians(-10),
//   };

//   const terrainProvider = new CesiumTerrainProvider({
//     // to-do: // Example URL, change to your terrain server if needed
//     url: 'https://assets.cesium.com/1',
//     requestVertexNormals: true
//   });

//   return (
//     <Viewer terrainProvider={terrainProvider}>
//       <CameraFlyTo destination={position} orientation={orientation} duration={0} />
//       <Cesium3DTileset url={IonResource.fromAssetId(96188)} /> {/* Asset ID for OSM Buildings */}
//     </Viewer>
//   );
// };

// export default App;


// worked showing building names
import React, { useRef, useEffect } from 'react';
import { Viewer, CameraFlyTo, Cesium3DTileset } from 'resium';
import { Cartesian3, CesiumTerrainProvider, IonResource, Math as CesiumMath, ScreenSpaceEventType, Cartographic } from 'cesium';
import PropTypes from 'prop-types';

const CesiumMap = ({onLocationSelect}) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    console.log("Ref on render:", viewerRef);
    console.log("current", viewerRef.current);
    // console.log('@VIEWER ', viewer);
    if (viewer) {
      const handleLeftClick = (movement) => {
        console.log('handle left click........');
        const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const latitude = CesiumMath.toDegrees(cartographic.latitude);
          const longitude = CesiumMath.toDegrees(cartographic.longitude);
          onLocationSelect(latitude, longitude);
        }
      };

      // Add the left click event handler
      viewer.screenSpaceEventHandler.setInputAction(handleLeftClick, ScreenSpaceEventType.LEFT_CLICK);
    }

    // Cleanup function to remove event handler
    return () => {
      if (viewer) {
        viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      }
    };
  }, []);

  const terrainProvider = new CesiumTerrainProvider({
    url: 'https://assets.cesium.com/1',
    requestVertexNormals: true
  });

  const position = Cartesian3.fromDegrees(-122.3472, 47.598, 370);
  const orientation = {
    heading: CesiumMath.toRadians(10),
    pitch: CesiumMath.toRadians(-10),
  };

  return (
    <Viewer ref={viewerRef} terrainProvider={terrainProvider}>
      <CameraFlyTo destination={position} orientation={orientation} duration={0} />
      <Cesium3DTileset url={IonResource.fromAssetId(96188)} />
    </Viewer>
  );
};

CesiumMap.propTypes = {
  onLocationSelect: PropTypes.func.isRequired
};

export default CesiumMap;
