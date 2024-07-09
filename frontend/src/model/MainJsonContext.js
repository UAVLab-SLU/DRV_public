import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { SimulationConfigurationModel } from './SimulationConfigurationModel';
import { Cartesian3 } from 'cesium';

const MainJsonContext = createContext();

export const useMainJson = () => useContext(MainJsonContext);

export const MainJsonProvider = ({ children }) => {
  const [mainJson, setMainJson] = useState(new SimulationConfigurationModel());
  const [envJson, setEnvJson] = useState(mainJson.environment);

  function syncDroneLocation(droneIndex, latitude, longitude, height, position, cesiumImage) {
    let drone = mainJson.getDroneBasedOnIndex(droneIndex);
    drone.X = latitude;
    drone.Y = longitude;
    drone.Z = height;
    drone.cesiumImage = cesiumImage;
    drone.cesiumPosition = position;
    mainJson.updateDroneBasedOnIndex(droneIndex, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  }

  return (
    <MainJsonContext.Provider value={{ mainJson, setMainJson, envJson, setEnvJson, syncDroneLocation }}>
      {children}
    </MainJsonContext.Provider>
  );
};

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired
};
