export const HOME_LABEL = {
  "partfirst": `Simulation of a realistic scenario is an effective way to test the system's requirements.`,
  "partsecond": `Describe one or more requirements you would like to test by simulating a scenario`,
};

export const BASE_URL = "http://localhost:5000";

export const UAV_DESCRIPTION = {
  "UAV-301": {
    "text": "Two sUAS (Small Unmanned Aircraft System) shall be able to complete a circular and square flight mission in windy weather conditions without colliding with stationary objects, the terrain, or other aircraft and drifting from its planned path by more than 10 meters.",
    "title": "Circular and Square Flight Mission in Windy Weather"
  },
  "UAV-302": {
    "text": "Two sUAS (Small Unmanned Aircraft Systems) shall be able to complete their missions in windy weather conditions while maintaining a minimum separation distance of at least 5 meters between each other and without drifting by more than 5 meters.",
    "title": "sUAS Mission Coordination in Windy Weather"
  },
  "UAV-303": {
    "text": "Two sUAS (Small Unmanned Aircraft Systems) shall be able to complete their respective missions in windy weather conditions without drifting from their planned path by more than 15 meters.",
    "title": "sUAS Mission in Windy Weather with Path Accuracy"
  },
}

export const WindDirection = [
  { value: 'N', id: 5 },
  { value: 'S', id: 6 },
  { value: 'E', id: 7 },
  { value: 'W', id: 8 },
  { value: 'NE', id: 1 },
  { value: 'SE', id: 2 },
  { value: 'SW', id: 3 },
  { value: 'NW', id: 4 }
];

export const WindType = [
  { value: "Constant Wind", id: 1 },
  { value: "Turbulent Wind", id: 2 },
];

export const ENVIRONMENT_ORIGINS = [
  { value: "Chicago O’Hare Airport", id: 20 },
  { value: "Michigan Lake Beach", id: 10 },
  { value: "Specify Region", id: 30 }
];

export const ENVIRONMENT_ORIGIN_VALUES = [
  { value: "Michigan Lake Beach", Latitude: 42.211223, Longitude: -86.390394, Height: 170 },
  { value: "Chicago O’Hare Airport", Latitude: 41.980381, Longitude: -87.934524, Height: 200 }
];