import * as React from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import SensorConfiguration from './SensorConfiguration';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useMainJson } from '../../contexts/MainJsonContext';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';

const flightPaths = [
  { value: 'fly_in_circle', label: 'Circle', id: 1 },
  { value: 'fly_to_points', label: 'Square', id: 1 },
];

const droneTypes = [
  { value: 'FixedWing', label: 'Fixed Wing' },
  { value: 'MultiRotor', label: 'Multi Rotor' },
];

const droneModels = {
  FixedWing: [
    { value: 'SenseflyeBeeX', label: 'Sensefly eBee X' },
    { value: 'TrinityF90', label: 'Trinity F90' },
  ],
  MultiRotor: [
    { value: 'ParrotANAFI', label: 'Parrot ANAFI' },
    { value: 'DJI', label: 'DJI' },
    { value: 'StreamLineDesignX189', label: 'StreamLineDesign X189' },
  ],
};

export default function DroneConfiguration(droneData) {
  const { mainJson, setMainJson } = useMainJson();
  const {
    name = '',
    id = '',
    droneObject = {},
    resetName = () => {},
    droneJson = () => {},
  } = droneData || {};

  const [selectedLoc] = React.useState('GeoLocation');
  const [selectedModel, setSelectedModel] = React.useState(droneObject?.droneModel ?? '');
  const [selectedDroneType, setselectedDroneType] = React.useState(
    droneObject?.droneType ?? droneTypes[1].value,
  );
  const [snackBarState, setSnackBarState] = React.useState({ open: false });

  const [drone, setDrone] = React.useState(() => {
    const defaults = {
      VehicleType: 'SimpleFlight',
      DefaultVehicleState: 'Armed',
      EnableCollisionPassthrogh: false,
      EnableCollisions: true,
      AllowAPIAlways: true,
      EnableTrace: false,
      Name: name,
      droneName: name,
      X: 0,
      Y: 0,
      Z: 0,
      Pitch: 0,
      Roll: 0,
      Yaw: 0,
      Sensors: null,
      MissionValue: 'fly_to_points',
      Mission: {
        name: 'fly_to_points',
        param: [],
      },
    };
    const mergedDrone = {
      ...defaults,
      ...(droneData?.getDroneBasedOnIndex?.(id) || {}),
      ...droneObject,
    };
    if (mergedDrone.MissionValue == null) {
      mergedDrone.MissionValue = mergedDrone.Mission?.name ?? defaults.Mission.name;
    }
    return mergedDrone;
  });

  const pushDroneUpdate = React.useCallback(
    (updatedDrone) => {
      setDrone(updatedDrone);
      droneJson(updatedDrone, id);

      const currentDrone = mainJson.getDroneBasedOnIndex(id);
      if (!currentDrone) {
        return;
      }

      mainJson.updateDroneBasedOnIndex(id, updatedDrone);
      setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
    },
    [droneJson, id, mainJson, setMainJson],
  );

  const syncDroneLocation = React.useCallback(
    (x, y, z) => {
      const updatedDrone = {
        ...(droneData?.getDroneBasedOnIndex?.(id) || drone),
        X: x,
        Y: y,
        Z: z,
      };

      if (droneData?.updateDroneBasedOnIndex) {
        droneData.updateDroneBasedOnIndex(id, updatedDrone);
      }

      pushDroneUpdate(updatedDrone);
    },
    [droneData, id, drone, pushDroneUpdate],
  );

  const dropHandler = React.useCallback(
    (e) => {
      e.preventDefault();

      // Safely calculate position
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      syncDroneLocation(x, y, 0);
    },
    [syncDroneLocation],
  );

  // Set up event listeners
  React.useEffect(() => {
    const canvas = document.getElementById('drone-config-canvas');
    if (canvas) {
      canvas.addEventListener('drop', dropHandler);
      canvas.addEventListener('dragover', (e) => e.preventDefault());

      return () => {
        canvas.removeEventListener('drop', dropHandler);
        canvas.removeEventListener('dragover', (e) => e.preventDefault());
      };
    }
  }, [dropHandler]);

  // Keep local form state aligned with external wizard updates.
  React.useEffect(() => {
    if (!droneData?.droneObject) return;

    setDrone((prev) => ({
      ...prev,
      ...droneData.droneObject,
      MissionValue:
        droneData.droneObject.MissionValue ??
        droneData.droneObject.Mission?.name ??
        prev.MissionValue,
      Mission: {
        name:
          droneData.droneObject.Mission?.name ??
          droneData.droneObject.MissionValue ??
          prev.Mission?.name ??
          'fly_to_points',
        param: Array.isArray(droneData.droneObject.Mission?.param)
          ? droneData.droneObject.Mission.param
          : prev.Mission?.param ?? [],
      },
    }));
    setselectedDroneType(droneData.droneObject.droneType ?? droneTypes[1].value);
    setSelectedModel(droneData.droneObject.droneModel ?? '');
  }, [droneData?.droneObject]);

  const handleMissionChange = (event) => {
    const missionName = event.target.value;
    const updatedDrone = {
      ...drone,
      MissionValue: missionName,
      Mission: {
        ...(drone.Mission || {}),
        name: missionName,
        param: Array.isArray(drone?.Mission?.param) ? drone.Mission.param : [],
      },
    };

    pushDroneUpdate(updatedDrone);
  };

  const handleDroneTypeChange = (event) => {
    handleSnackBarVisibility(true);
    setselectedDroneType(event.target.value);
    pushDroneUpdate({
      ...drone,
      droneType: event.target.value,
    });
  };

  const handleDroneModelChange = (event) => {
    handleSnackBarVisibility(true);
    setSelectedModel(event.target.value);
    pushDroneUpdate({
      ...drone,
      droneModel: event.target.value,
    });
  };

  const handleChange = (val) => {
    let updatedDrone = {
      ...(mainJson.getDroneBasedOnIndex(id) || drone),
    };
    if (val.target.id === 'Name') {
      updatedDrone.droneName = val.target.value;
      resetName(val.target.value, id);
    }
    updatedDrone = {
      ...updatedDrone,
      [val.target.id]:
        val.target.type === 'number' ? parseFloat(val.target.value) : val.target.value,
    };

    pushDroneUpdate(updatedDrone);
  };

  const setSensorConfig = (sensor) => {
    pushDroneUpdate({
      ...drone,
      Sensors: sensor,
    });
  };

  const handleSnackBarVisibility = (val) => {
    setSnackBarState((prevState) => ({
      ...prevState,
      open: val,
    }));
  };

  return (
    <div>
      <Snackbar
        open={snackBarState.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={6000}
        onClose={() => handleSnackBarVisibility(false)}
      >
        <Alert
          onClose={() => handleSnackBarVisibility(false)}
          severity='info'
          sx={{ width: '100%' }}
        >
          Drone Type and Drone Model Changes are under Development!
        </Alert>
      </Snackbar>

      <Box
        id='drone-config-canvas'
        sx={{
          width: '100%',
          border: '1px solid grey',
          paddingBottom: 5,
          paddingTop: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Container fixed sx={{ display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} direction='column' alignItems='center'>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label='Name'
                id='Name'
                value={drone.droneName}
                variant='standard'
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl variant='standard' sx={{ m: 1, minWidth: 150 }}>
                <InputLabel id='flight-path'>Mission</InputLabel>
                <Select
                  label='Flight Path'
                  value={drone.Mission?.name ?? drone.MissionValue}
                  SelectDisplayProps={{ 'data-testid': `drone-mission-select-${id}` }}
                  onChange={handleMissionChange}
                >
                  {flightPaths.map((val) => (
                    <MenuItem value={val.value} key={val.id}>
                      <em>{val.label}</em>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl variant='standard' sx={{ m: 1, minWidth: 150 }}>
                <InputLabel id='drone-type'>Drone Type</InputLabel>
                <Select
                  label='Select Drone Type'
                  value={selectedDroneType}
                  onChange={handleDroneTypeChange}
                >
                  {droneTypes.map((val) => (
                    <MenuItem value={val.value} key={val.value}>
                      <em>{val.label}</em>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl variant='standard' sx={{ m: 1, minWidth: 150 }}>
                <InputLabel id='drone-model'>Drone Model</InputLabel>
                <Select
                  label='Select Drone Model'
                  value={selectedModel}
                  onChange={handleDroneModelChange}
                >
                  {droneModels[selectedDroneType]?.map((val) => (
                    <MenuItem value={val.value} key={val.value}>
                      <em>{val.label}</em>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid container direction='column' alignItems='center'>
              {!drone.X && (
                <FormControl variant='standard' sx={{ minWidth: 150 }}>
                  Home Location
                </FormControl>
              )}

              {selectedLoc === 'GeoLocation' ? (
                <>
                  <Tooltip title='Stepping distance of 0.0001, equivalent to 1m' placement='bottom'>
                    <Grid item xs={3}>
                      <TextField
                        id='X'
                        label='Latitude'
                        variant='standard'
                        type='number'
                        inputProps={{ step: '.0001', 'data-testid': `drone-latitude-input-${id}` }}
                        value={drone.X}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Tooltip>
                  <Tooltip title='Stepping distance of 0.0001, equivalent to 1m' placement='bottom'>
                    <Grid item xs={3}>
                      <TextField
                        id='Y'
                        label='Longitude'
                        variant='standard'
                        type='number'
                        inputProps={{ step: '.0001', 'data-testid': `drone-longitude-input-${id}` }}
                        value={drone.Y}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Tooltip>
                  <Tooltip title='Drone Spawning Height above ground (meters)' placement='bottom'>
                    <Grid item xs={3}>
                      <TextField
                        id='Z'
                        label='Height'
                        variant='standard'
                        type='number'
                        inputProps={{ step: '1', 'data-testid': `drone-height-input-${id}` }}
                        value={drone.Z}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Grid item xs={3}>
                    <TextField
                      id='X'
                      label='X'
                      variant='standard'
                      type='number'
                      inputProps={{ step: '.0001' }}
                      value={drone.X}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      id='Y'
                      label='Y'
                      variant='standard'
                      type='number'
                      inputProps={{ step: '.0001' }}
                      value={drone.Y}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      id='Z'
                      label='Z'
                      variant='standard'
                      type='number'
                      inputProps={{ step: '.0001' }}
                      value={drone.Z}
                      disabled
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
          <SensorConfiguration setSensor={setSensorConfig} sensorJson={drone.Sensors} />
        </Container>
      </Box>
    </div>
  );
}
