import React, { createContext, useState, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { SimulationConfigurationModel } from './SimulationConfigurationModel';
import { Cartesian3 } from 'cesium';

const MainJsonContext = createContext();

export const useMainJson = () => useContext(MainJsonContext);

export const MainJsonProvider = ({ children }) => {
  const [mainJson, setMainJson] = useState(new SimulationConfigurationModel());
  const [envJson, setEnvJson] = useState(mainJson.environment);
  const viewerMaintainer = useRef(false);

  function syncDroneLocation(droneIndex, latitude, longitude, cesiumImage) {
    let drone = mainJson.getDroneBasedOnIndex(droneIndex);
    drone.X = latitude;
    drone.Y = longitude;
    drone.cesiumImage = cesiumImage;
    drone.cesiumPosition = Cartesian3.fromDegrees(longitude, latitude)
    mainJson.updateDroneBasedOnIndex(droneIndex, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  }

  return (
    <MainJsonContext.Provider value={{ mainJson, setMainJson, envJson, setEnvJson, syncDroneLocation, viewerMaintainer }}>
      {children}
    </MainJsonContext.Provider>
  );
};

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired
};
