import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { SimulationConfigurationModel } from './SimulationConfigurationModel';
import { EnvironmentModel } from './EnvironmentModel';
import { Cartesian3 } from 'cesium';

const MainJsonContext = createContext();

export const useMainJson = () => useContext(MainJsonContext);

export const MainJsonProvider = ({ children }) => {
  const [mainJson, setMainJson] = useState(new SimulationConfigurationModel());
  const [envJson, setEnvJson] = useState(mainJson.environment);

  function syncDroneLocation(droneIndex, latitude, longitude, cesiumImage) {
    let drone = mainJson.getDroneBasedOnIndex(droneIndex);
    drone.X = latitude;
    drone.Y = longitude;
    drone.cesiumImage = cesiumImage;
    drone.cesiumPosition = Cartesian3.fromDegrees(longitude, latitude)
    mainJson.updateDroneBasedOnIndex(droneIndex, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  }

  function syncRadiusLocation(latitude, longitude, height, image) {
    envJson.setOriginLatitude(latitude);
    envJson.setOriginLongitude(longitude);
    envJson.setOriginHeight(height);
    envJson.setOriginImage(image);
    envJson.setOriginPosition(Cartesian3.fromDegrees(envJson.getOriginLongitude(), envJson.getOriginLatitude(), envJson.getOriginHeight()));
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  }

  return (
    <MainJsonContext.Provider value={{ mainJson, setMainJson, envJson, setEnvJson, syncDroneLocation, syncRadiusLocation }}>
      {children}
    </MainJsonContext.Provider>
  );
};

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired
};
