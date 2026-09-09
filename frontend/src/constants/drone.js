export const flightPaths = [
  { value: 'fly_in_circle', label: 'Fly in Circle', id: 1 },
  { value: 'fly_to_points', label: 'Fly to Waypoints', id: 2 },
  { value: 'river_search_and_rescue', label: 'River Search and Rescue', id: 3,
    description: 'From local home (0, 0, 0): climb to 60 m, turn 90° counterclockwise, move to (0, -362), point the camera straight down, turn another 10° counterclockwise, then move to (276, -362) at 2 m/s and hover. Transit speed: 4 m/s.' },
  { value: 'active_shooter_surveillance', label: 'Active Shooter Surveillance', id: 4,
    description: 'Climb to 100 m, move to (-140, 0) with the initial heading fixed, tilt camera 0 from the horizon to 45° down, and hover for 30 seconds.' },
  { value: 'missing_person_search_and_rescue', label: 'Missing Person Search and Rescue', id: 5,
    description: 'Climb to 100 m, move to (100, 600), tilt camera 0 straight down, then fly one 5 m radius circle at 2 m/s around (105, 600), returning to (100, 600) and hovering.' },
  // {value:'fly_straight',label:'Straight', id:1}
];

export const droneTypes = [
  { value: 'MultiRotor', label: 'Multi Rotor' },
  // { value: 'FixedWing', label: 'Fixed Wing' },
];

export const DEFAULT_DRONE_MODEL = 'AirSim';

export const droneModels = {
  MultiRotor: [
    { value: 'AirSim', label: 'AirSim (default)' },
    { value: 'Aurelia', label: 'Aurelia X6 Pro v2 (hexacopter)' },
    { value: 'AirSimGPS', label: 'AirSim GPS (not yet supported)', disabled: true },
    { value: 'AureliaGPS', label: 'Aurelia X6 Pro v2 GPS (not yet supported)', disabled: true },
  ],
};

export const locations = [
  { value: 'GeoLocation', id: 1 },
  { value: 'Cartesian Coordinate', id: 2 },
];

export const droneImages = [
  { src: '/images/drone-red.png', color: '#FFCCCC' },
  { src: '/images/drone-green.png', color: '#CCFFCC' },
  { src: '/images/drone-blue.png', color: '#CCCCFF' },
  { src: '/images/drone-yellow.png', color: '#FFFFCC' },
  { src: '/images/drone-pink.png', color: '#FFCCFF' },
  { src: '/images/drone-indigo.png', color: '#CCFFFF' },
  { src: '/images/drone-gold.png', color: '#F0E68C' },
  { src: '/images/drone-darkblue.png', color: '#E6E6FA' },
  { src: '/images/drone-orange.png', color: '#FFDAB9' },
  { src: '/images/drone-purple.png', color: '#DABDF9' },
];
