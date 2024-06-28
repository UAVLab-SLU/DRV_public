import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { SimulationConfigurationModel } from './SimulationConfigurationModel';

const MainJsonContext = createContext();

export const useMainJson = () => useContext(MainJsonContext);

export const MainJsonProvider = ({ children }) => {
  const [mainJson, setJson] = useState(new SimulationConfigurationModel());

  const setMainJson = (envJson, id) => {
    if(id == "environment" && mainJson.Drones && mainJson.Drones[0].X != envJson.Origin.Latitude) {
      setJson(prevState => ({
        ...prevState,
        Drones:null,
      }))
    }
    setJson(prevState => ({
      ...prevState,
      [id]: envJson
    }))
  }

  const setDroneJson = (json, index) => {
    setJson(prevState => {
        const updatedDrones = prevState.Drones?.map((drone, idx) => {
            if (idx === index) {
                return {...drone, ...json};
            }
            return drone;
        });

        return {...prevState, Drones: updatedDrones};
    });
  }

  const setDroneLocation = (droneInx, longitude, latitude) => {
    setJson(prevState => {
      const newDrones = prevState.Drones?.map((drone, index) => {
        if (index === droneInx) {
          return {
            ...drone,
            X: latitude,
            Y: longitude
          };
        }
        return drone;
      });

      return {...prevState, Drones: newDrones};
    });
  };

  return (
    <MainJsonContext.Provider value={{ mainJson, setJson, setMainJson, setDroneLocation, setDroneJson }}>
      {children}
    </MainJsonContext.Provider>
  );
};

MainJsonProvider.propTypes = {
  children: PropTypes.node.isRequired
};
