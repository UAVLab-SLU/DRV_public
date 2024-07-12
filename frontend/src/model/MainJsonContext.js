import React, { createContext, useState, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { SimulationConfigurationModel } from './SimulationConfigurationModel';
import { EnvironmentModel } from './EnvironmentModel';
import { Cartesian3 } from 'cesium';

const MainJsonContext = createContext();

export const useMainJson = () => useContext(MainJsonContext);

export const MainJsonProvider = ({ children }) => {
  const [mainJson, setMainJsonSetter] = useState(new SimulationConfigurationModel());
  const [envJson, setEnvJsonSetter] = useState(mainJson.environment);
  const viewerMaintainer = useRef(true);
  const timeOfDayRef = useRef(mainJson.TimeOfDay);
  const timeRef = useRef(mainJson.time);

  const setMainJson = (input) => {
    envJson.time = timeRef.current;
    envJson.TimeOfDay = timeOfDayRef.current;
    input.environment = envJson;
    setMainJsonSetter(SimulationConfigurationModel.getReactStateBasedUpdate(input));
  }

  const setEnvJson = (input) => {
    input.time = timeRef.current;
    input.TimeOfDay = timeOfDayRef.current;
    mainJson.environment = input;
    setEnvJsonSetter(EnvironmentModel.getReactStateBasedUpdate(input))
    setMainJsonSetter(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  }

  function syncDroneLocation(latitude, longitude, height, droneIndex) {
    let drone = mainJson.getDroneBasedOnIndex(droneIndex);
    drone.X = latitude;
    drone.Y = longitude;
    drone.Z = height;
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
    <MainJsonContext.Provider value={{ mainJson, setMainJson, envJson, setEnvJson, syncDroneLocation, syncRadiusLocation, viewerMaintainer, timeOfDayRef, timeRef }}>
      {children}
    </MainJsonContext.Provider>
  );
};

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
