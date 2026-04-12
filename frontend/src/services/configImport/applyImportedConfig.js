/*
 * Shared helpers for taking a normalized imported configuration and pushing it
 * into both the wizard's plain submission state and the class-backed context state.
 */

import { EnvironmentModel } from '../../model/EnvironmentModel';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValue(entry));
  }

  if (value != null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }

  return value;
}

function normalizeDroneTypeValue(droneType) {
  if (droneType === 'Multi Rotor') {
    return 'MultiRotor';
  }

  return droneType ?? 'MultiRotor';
}

function buildWizardDrone(drone, index) {
  const missionName = drone?.Mission?.name ?? drone?.MissionValue ?? 'fly_to_points';
  return {
    ...cloneValue(drone),
    id: index,
    Name: drone?.Name ?? drone?.droneName ?? `Drone ${index + 1}`,
    droneName: drone?.droneName ?? drone?.Name ?? `Drone ${index + 1}`,
    droneType: normalizeDroneTypeValue(drone?.droneType),
    MissionValue: missionName,
    Mission: {
      name: missionName,
      param: Array.isArray(drone?.Mission?.param) ? cloneValue(drone.Mission.param) : [],
    },
  };
}

function buildWizardEnvironment(environment) {
  return cloneValue(environment);
}

export function buildWizardStateFromImportedConfig(importedConfig) {
  const wizardState = {
    Drones: Array.isArray(importedConfig?.Drones)
      ? importedConfig.Drones.map((drone, index) => buildWizardDrone(drone, index))
      : [],
    environment: buildWizardEnvironment(importedConfig?.environment ?? null),
    monitors: importedConfig?.monitors ? cloneValue(importedConfig.monitors) : null,
  };

  if (importedConfig?.FuzzyTest) {
    wizardState.FuzzyTest = cloneValue(importedConfig.FuzzyTest);
  }

  return wizardState;
}

export function buildImportedStateBundle(importedConfig) {
  const wizardState = buildWizardStateFromImportedConfig(importedConfig);
  const environmentModel = EnvironmentModel.fromConfiguration(wizardState.environment);
  const simulationModel = SimulationConfigurationModel.fromConfiguration({
    environment: environmentModel,
    Drones: wizardState.Drones,
  });

  return {
    wizardState,
    environmentModel,
    simulationModel,
  };
}

export function applyImportedConfig(importedConfig, handlers = {}) {
  const { wizardState, simulationModel } = buildImportedStateBundle(importedConfig);

  if (typeof handlers.setWizardState === 'function') {
    handlers.setWizardState(wizardState);
  }

  if (typeof handlers.replaceSimulationConfiguration === 'function') {
    handlers.replaceSimulationConfiguration(simulationModel, { adoptEnvironmentTime: true });
  }

  return { wizardState, simulationModel };
}
