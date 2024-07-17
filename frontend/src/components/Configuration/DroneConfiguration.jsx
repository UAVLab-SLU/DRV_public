import { useState, useEffect, Fragment } from 'react';
import Container from '@mui/material/Container';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import SensorConfiguration from './SensorConfiguration';
import styled from '@emotion/styled';
import { OutlinedInput } from '@mui/material';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';
import { StyledInputLabel } from '../../css/SimulationPageStyles';
import { droneModels, droneTypes } from '../../constants/drone';

export default function DroneConfiguration({ index, duplicateNameIndex, setDuplicateNameIndex }) {
  const { mainJson, setMainJson } = useMainJson();
  const [drone, setDrone] = useState(() => mainJson.getDroneBasedOnIndex(index));
  console.log('DroneConfiguration-----', mainJson.getAllDrones()[index]);
  const [selectedLoc, setSelectedLoc] = useState('GeoLocation');

  const handleLocChange = (event) => {
    setSelectedLoc(event.target.value);
  };

  const handleMissionChange = (event) => {
    let drone = mainJson.getDroneBasedOnIndex(index);
    drone.setMissionObjectName(event.target.value);
    mainJson.updateDroneBasedOnIndex(index, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const handleDroneTypeChange = (event) => {
    let drone = mainJson.getDroneBasedOnIndex(index);
    drone.droneType = event.target.value;
    mainJson.updateDroneBasedOnIndex(index, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const handleDroneModelChange = (event) => {
    let drone = mainJson.getDroneBasedOnIndex(index);
    drone.droneModel = event.target.value;
    mainJson.updateDroneBasedOnIndex(index, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const handleChange = (event) => {
    let drone = mainJson.getDroneBasedOnIndex(index);
    if (event.target.id === 'name') {
      drone.name = event.target.value;
      const isDuplicate = mainJson
        .getAllDrones()
        .some((s, idx) => s.name === event.target.value && idx !== index);
      isDuplicate ? setDuplicateNameIndex(index) : setDuplicateNameIndex(null);
    } else if (event.target.id === 'X') {
      drone.X = event.target.value !== '' ? parseFloat(event.target.value) : 0;
    } else if (event.target.id === 'Y') {
      drone.Y = event.target.value !== '' ? parseFloat(event.target.value) : 0;
    } else if (event.target.id === 'Z') {
      drone.Z = event.target.value !== '' ? parseFloat(event.target.value) : 0;
    }
    mainJson.updateDroneBasedOnIndex(index, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const setSensorConfig = (sensor) => {
    let drone = mainJson.getDroneBasedOnIndex(index);
    drone.Sensors = sensor;
    mainJson.updateDroneBasedOnIndex(index, drone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const setCameraSettings = (camera) => {
    console.log('camera---in drone', camera);
    // setDrone(prevState => ({
    //     ...prevState,
    //     Cameras: {
    //         ...prevState.Cameras,
    //         CaptureSettings: [camera]
    //     }
    // }))
  };

  const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: '#F5F5DC',
    '& .MuiInputBase-input': {
      padding: '6px 8px',
      height: '1em',
      fontSize: '1.2rem',
    },
    margin: 0,
  }));

  return (
    <div>
      <Container maxWidth='md'>
        <Grid container spacing={0.8} sx={{ mt: 2 }}>
          {/* Drone Name Field */}
          <Grid item xs={4}>
            <StyledInputLabel id='name'>Name</StyledInputLabel>
          </Grid>
          <Grid item xs={6}>
            <TextField
              sx={{
                backgroundColor: '#F5F5DC',
                '& .MuiOutlinedInput-root': {
                  '& .MuiInputBase-input': {
                    padding: '6px 8px',
                    fontSize: '1.2rem',
                  },
                },
              }}
              id='name'
              variant='outlined'
              onChange={handleChange}
              value={drone.name}
              error={duplicateNameIndex === index}
              helperText={duplicateNameIndex === index ? 'Duplicate name detected!' : ''}
              InputProps={{
                endAdornment: duplicateNameIndex === index && (
                  <IconButton>
                    <WarningAmberIcon color='error' />
                  </IconButton>
                ),
              }}
              fullWidth
            />
          </Grid>

          {/* <Grid item xs={3} alignItems="flex-end">
                            <FormControl variant="standard" sx={{ m: 1, minWidth: 150 }}>
                                <InputLabel id="flight-path">Mission</InputLabel>
                                <Select label="Flight Path" value={drone.Mission.name} onChange={handleMissionChange}>
                                    {flightPaths.map(function(val) {
                                        return(<MenuItem value={val.value} key={val.id}>
                                            <em>{val.label}</em>
                                        </MenuItem>)
                                    })}
                                </Select>
                            </FormControl>
                        </Grid> */}

          {/* Drone Type Field */}
          <Grid item xs={4}>
            <StyledInputLabel id='drone-type'>Vehicle Type</StyledInputLabel>
          </Grid>
          <Grid item xs={6}>
            <StyledSelect
              // value={selectedDroneType}
              value={drone.droneType}
              input={<OutlinedInput />}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    backgroundColor: '#F5F5DC',
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.2rem',
                  },
                },
              }}
              onChange={handleDroneTypeChange}
              fullWidth
            >
              {droneTypes.map((val) => (
                <MenuItem value={val.value} key={val.value}>
                  <em>{val.label}</em>
                </MenuItem>
              ))}
            </StyledSelect>
          </Grid>

          {/* Drone Model Field */}
          <Grid item xs={4}>
            <StyledInputLabel id='drone-model'>Vehicle Model</StyledInputLabel>
          </Grid>
          <Grid item xs={6}>
            <StyledSelect
              value={drone.droneModel}
              input={<OutlinedInput />}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    backgroundColor: '#F5F5DC',
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.2rem',
                  },
                },
              }}
              onChange={handleDroneModelChange}
              fullWidth
            >
              {droneModels[drone.droneType].map((val, i) => (
                <MenuItem value={val.value} key={`drone-model-${i}`}>
                  <em>{val.label}</em>
                </MenuItem>
              ))}
            </StyledSelect>
          </Grid>

          {/* Drone Image Field */}
          <Grid item xs={12}>
            {drone.droneType && (
              <Box mt={2} display='flex' justifyContent='center' alignItems='center'>
                <img
                  src={droneModels[drone.droneType].find((m) => m.value === drone.droneModel)?.src}
                  alt=''
                  style={{
                    maxWidth: '70%',
                    maxHeight: '150px',
                    objectFit: 'fill',
                    marginTop: '8px',
                  }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sx={{ mt: 3 }}>
            <Typography variant='h5' sx={{ pb: 1, color: '#F5F5DC' }}>
              Home Location
            </Typography>
          </Grid>

          {selectedLoc == 'GeoLocation' ? (
            <Fragment>
              <Grid item xs={4}>
                <StyledInputLabel id='X-label'>Latitude</StyledInputLabel>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title='Stepping distance of 0.0001, equivalent to 1m' placement='bottom'>
                  <TextField
                    sx={{
                      backgroundColor: '#F5F5DC',
                      '& .MuiOutlinedInput-root': {
                        '& .MuiInputBase-input': {
                          padding: '6px 8px',
                          fontSize: '1.1rem',
                        },
                      },
                    }}
                    id='X'
                    variant='outlined'
                    type='number'
                    inputProps={{ step: '.0001' }}
                    onChange={handleChange}
                    value={drone.X}
                    fullWidth
                  />
                </Tooltip>
              </Grid>

              <Grid item xs={4}>
                <StyledInputLabel id='Y-label'>Longitude</StyledInputLabel>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title='Stepping distance of 0.0001, equivalent to 1m' placement='bottom'>
                  <TextField
                    sx={{
                      backgroundColor: '#F5F5DC',
                      '& .MuiOutlinedInput-root': {
                        '& .MuiInputBase-input': {
                          padding: '6px 8px',
                          fontSize: '1.1rem',
                        },
                      },
                    }}
                    id='Y'
                    variant='outlined'
                    type='number'
                    inputProps={{ step: '.0001' }}
                    onChange={handleChange}
                    value={drone.Y}
                    fullWidth
                  />
                </Tooltip>
              </Grid>

              <Grid item xs={4}>
                <StyledInputLabel id='Z-label'>Height</StyledInputLabel>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title='Stepping distance of 0.0001, equivalent to 1m' placement='bottom'>
                  <TextField
                    sx={{
                      backgroundColor: '#F5F5DC',
                      '& .MuiOutlinedInput-root': {
                        '& .MuiInputBase-input': {
                          padding: '6px 8px',
                          fontSize: '1.1rem',
                        },
                      },
                    }}
                    id='Z'
                    variant='outlined'
                    type='number'
                    inputProps={{ step: '1' }}
                    onChange={handleChange}
                    value={drone.Z}
                    fullWidth
                  />
                </Tooltip>
              </Grid>
            </Fragment>
          ) : (
            <Fragment>
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
            </Fragment>
          )}
        </Grid>
        {/* <SensorConfiguration setSensor={setSensorConfig} setCamera={setCameraSettings} sensorJson={drone.Sensors}/> */}
        <Grid
          container
          direction='row'
          justifyContent='flex-end'
          alignItems='center'
          style={{ paddingTop: '15px', marginTop: '15px' }}
        >
          {/* <Button variant="outlined" onClick={sendJson}>Ok</Button> &nbsp;&nbsp;&nbsp; */}
          {/* <Button variant="contained">OK</Button> */}
        </Grid>
      </Container>
    </div>
  );
}

DroneConfiguration.propTypes = {
  index: PropTypes.number.isRequired,
  duplicateNameIndex: PropTypes.number.isRequired,
  setDuplicateNameIndex: PropTypes.func.isRequired,
};
