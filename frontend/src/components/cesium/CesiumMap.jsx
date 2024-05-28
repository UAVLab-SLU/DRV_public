import React from 'react';
import { Viewer, Cesium3DTileset, CameraFlyTo } from 'resium';
import { Cartesian3, Math, IonResource, CesiumTerrainProvider } from 'cesium';

const App = () => {
  const position = Cartesian3.fromDegrees(-122.3472, 47.598, 370);
  const orientation = {
    heading: Math.toRadians(10),
    pitch: Math.toRadians(-10),
  };

  const terrainProvider = new CesiumTerrainProvider({
    // to-do: // Example URL, change to your terrain server if needed
    url: 'https://assets.cesium.com/1',
    requestVertexNormals: true
  });

  return (
    <Viewer terrainProvider={terrainProvider}>
      <CameraFlyTo destination={position} orientation={orientation} duration={0} />
      <Cesium3DTileset url={IonResource.fromAssetId(96188)} /> {/* Asset ID for OSM Buildings */}
    </Viewer>
  );
};

export default App;