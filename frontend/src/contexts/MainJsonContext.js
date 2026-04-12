import React, { createContext, useState, useContext, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SimulationConfigurationModel } from '../model/SimulationConfigurationModel';
import { EnvironmentModel } from '../model/EnvironmentModel';

const MainJsonContext = createContext();

export const useMainJson = () => useContext(MainJsonContext);

export const MainJsonProvider = ({ children }) => {
  const [mainJson, setMainJsonSetter] = useState(new SimulationConfigurationModel());
  const [envJson, setEnvJsonSetter] = useState(mainJson.environment);
  const viewerMaintainer = useRef(true);
  const timeOfDayRef = useRef(mainJson.TimeOfDay);
  const timeRef = useRef(mainJson.time);
  // Provide ref to access the camera control function
  const setCameraPositionRef = useRef(null);
  const [activeScreen, setActiveScreen] = useState('');

  const replaceSimulationConfiguration = useCallback((input, options = {}) => {
    const { adoptEnvironmentTime = false } = options;
    const nextMainJson = SimulationConfigurationModel.getReactStateBasedUpdate(input);
    const nextEnvJson = EnvironmentModel.getReactStateBasedUpdate(nextMainJson.environment);

    if (adoptEnvironmentTime) {
      if (nextEnvJson.time != null) {
        timeRef.current = nextEnvJson.time;
      }
      if (nextEnvJson.TimeOfDay != null) {
        timeOfDayRef.current = nextEnvJson.TimeOfDay;
      }
    }

    nextEnvJson.time = timeRef.current;
    nextEnvJson.TimeOfDay = timeOfDayRef.current;
    nextMainJson.environment = nextEnvJson;

    setEnvJsonSetter(nextEnvJson);
    setMainJsonSetter(nextMainJson);
  }, []);

  const setMainJson = (input) => {
    replaceSimulationConfiguration(input);
  };

  const setEnvJson = (input) => {
    const nextMainJson = SimulationConfigurationModel.getReactStateBasedUpdate(mainJson);
    nextMainJson.environment = EnvironmentModel.getReactStateBasedUpdate(input);
    replaceSimulationConfiguration(nextMainJson);
  };

  function syncDroneLocation(latitude, longitude, height, droneIndex) {
    let drone = mainJson.getDroneBasedOnIndex(droneIndex);
    drone.X = latitude;
    drone.Y = longitude;
    drone.Z = height;
    mainJson.updateDroneBasedOnIndex(droneIndex, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  }

  function syncRegionLocation(latitude, longitude, height, image) {
    envJson.setOriginLatitude(latitude);
    envJson.setOriginLongitude(longitude);
    envJson.setOriginHeight(height);
    envJson.setOriginImage(image);
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  }

  // function to register the camera control function
  const registerSetCameraByPosition = (func) => {
    setCameraPositionRef.current = func;
  };

  return (
    <MainJsonContext.Provider
      value={{
        mainJson,
        setMainJson,
        envJson,
        setEnvJson,
        syncDroneLocation,
        syncRegionLocation,
        viewerMaintainer,
        timeOfDayRef,
        timeRef,
        registerSetCameraByPosition,
        setCameraPositionRef,
        replaceSimulationConfiguration,
        activeScreen,
        setActiveScreen,
      }}
    >
      {children}
    </MainJsonContext.Provider>
  );
};

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
