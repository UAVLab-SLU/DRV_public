import PropTypes from "prop-types";
import { createContext, useContext, useRef, useState } from "react";
import { EnvironmentModel } from "../model/EnvironmentModel";
import { SimulationConfigurationModel } from "../model/SimulationConfigurationModel";

const MainJsonContext = createContext(null);

export const useMainJson = () => useContext(MainJsonContext);

export function MainJsonProvider({ children }) {
  const [mainJson, setMainJsonState] = useState(new SimulationConfigurationModel());
  const [envJson, setEnvJsonState] = useState(mainJson.environment);
  const setCameraPositionRef = useRef(null);
  const viewerMaintainer = useRef(true);
  const timeOfDayRef = useRef(mainJson.environment?.TimeOfDay);
  const timeRef = useRef(mainJson.environment?.time);
  const [activeScreen, setActiveScreen] = useState("");

  const setMainJson = (input) => {
    setMainJsonState(SimulationConfigurationModel.getReactStateBasedUpdate(input));
  };

  const setEnvJson = (input) => {
    input.time = timeRef.current;
    input.TimeOfDay = timeOfDayRef.current;
    mainJson.environment = input;
    setEnvJsonState(EnvironmentModel.getReactStateBasedUpdate(input));
    setMainJsonState(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const syncDroneLocation = (latitude, longitude, height, droneIndex) => {
    const drone = mainJson.getDroneBasedOnIndex(droneIndex);
    if (!drone) return;
    drone.X = latitude;
    drone.Y = longitude;
    drone.Z = height;
    mainJson.updateDroneBasedOnIndex(droneIndex, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const syncRegionLocation = (latitude, longitude, height, image) => {
    envJson.setOriginLatitude(latitude);
    envJson.setOriginLongitude(longitude);
    envJson.setOriginHeight(height);
    if (image) envJson.setOriginImage(image);
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  };

  const registerSetCameraByPosition = (fn) => {
    setCameraPositionRef.current = fn;
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
        activeScreen,
        setActiveScreen,
      }}
    >
      {children}
    </MainJsonContext.Provider>
  );
}

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
