import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import dayjs from 'dayjs';
import Tooltip from '@mui/material/Tooltip';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { DeleteOutline } from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import { EnvironmentModel } from '../model/EnvironmentModel';

const normalizeConfigValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^['"]|['"]$/g, '');
};

const getGoogleMapsApiKey = () => normalizeConfigValue(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

const DEFAULT_ORIGIN = {
  Name: 'Chicago O\u2019Hare Airport',
  Latitude: 41.980381,
  Longitude: -87.934524,
  Height: 200,
};

const DEFAULT_ENVIRONMENT_CONFIG = {
  enableFuzzy: false,
  timeOfDayFuzzy: false,
  positionFuzzy: false,
  windFuzzy: false,
  Wind: {
    Direction: 'NE',
    Force: 5,
    Type: 'Constant Wind',
    Fluctuation: 10,
  },
  Origin: DEFAULT_ORIGIN,
  TimeOfDay: '10:00:00',
  UseGeo: true,
  time: dayjs('2020-01-01 10:00:00'),
};

const getNormalizedEnvironmentConfig = (environment) => {
  const nextOrigin = environment?.Origin ?? {};
  const nextWind = environment?.Wind ?? {};
  const timeOfDay =
    environment?.TimeOfDay ||
    (environment?.time ? dayjs(environment.time).format('HH:mm:ss') : DEFAULT_ENVIRONMENT_CONFIG.TimeOfDay);

  return {
    ...DEFAULT_ENVIRONMENT_CONFIG,
    ...environment,
    Wind: {
      ...DEFAULT_ENVIRONMENT_CONFIG.Wind,
      ...nextWind,
      Direction: nextWind.Direction ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Direction,
      Force: nextWind.Force ?? nextWind.Velocity ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Force,
      Type: nextWind.Type ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Type,
      Fluctuation: nextWind.Fluctuation ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Fluctuation,
    },
    Origin: {
      ...DEFAULT_ENVIRONMENT_CONFIG.Origin,
      ...nextOrigin,
      Name: nextOrigin.Name ?? DEFAULT_ENVIRONMENT_CONFIG.Origin.Name,
      Latitude: nextOrigin.Latitude ?? DEFAULT_ENVIRONMENT_CONFIG.Origin.Latitude,
      Longitude: nextOrigin.Longitude ?? DEFAULT_ENVIRONMENT_CONFIG.Origin.Longitude,
      Height: nextOrigin.Height ?? DEFAULT_ENVIRONMENT_CONFIG.Origin.Height,
    },
    TimeOfDay: timeOfDay,
    time: environment?.time ?? dayjs(`2020-01-01 ${timeOfDay}`),
  };
};

function RegionMapPreview({ currentPosition, onMapClick }) {
  const googleMapsApiKey = getGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'droneworld-google-maps',
    googleMapsApiKey,
  });

  if (loadError) {
    return (
      <Alert severity='warning' sx={{ mt: 3 }}>
        Google Maps preview is temporarily unavailable. You can still edit latitude, longitude, and
        altitude manually.
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Alert severity='info' sx={{ mt: 3 }}>
        Loading Google Maps preview...
      </Alert>
    );
  }

  return (
    <div style={{ width: '100%', height: '450px' }}>
      <GoogleMap
        id='map'
        mapContainerStyle={{ height: '100%', width: '100%' }}
        zoom={15}
        center={{ lat: currentPosition.lat, lng: currentPosition.lng }}
        onClick={onMapClick}
      >
        {currentPosition.lat && currentPosition.lng && (
          <Marker position={{ lat: currentPosition.lat, lng: currentPosition.lng }} />
        )}
      </GoogleMap>
    </div>
  );
}

RegionMapPreview.propTypes = {
  currentPosition: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }).isRequired,
  onMapClick: PropTypes.func.isRequired,
};

const getWindShearsFromConfig = (windConfig) => {
  return Object.entries(windConfig ?? {})
    .filter(([key, value]) => key.startsWith('Wind') && value && typeof value === 'object')
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, value]) => ({
      windDirection: value.Direction ?? '',
      windVelocity: value.Force ?? 0,
      fluctuationPercentage: value.Fluctuation ?? 0,
    }));
};

export default function EnvironmentConfiguration(env) {
  const lastHydratedEnvironmentRef = React.useRef(null);
  const initialEnvConf = getNormalizedEnvironmentConfig(env.mainJsonValue.environment);
  const [backendInfo] = useState({
    numQueuedTasks: 0,
    backendStatus: 'idle',
  });
  const [currentPosition, setCurrentPosition] = React.useState({
    lat: initialEnvConf.Origin.Latitude,
    lng: initialEnvConf.Origin.Longitude,
  });
  const onMapClick = (e) => {
    setCurrentPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setEnvConf((prevState) => ({
      ...prevState,
      Origin: {
        ...prevState.Origin,
        Latitude: e.latLng.lat(),
        Longitude: e.latLng.lng(),
      },
    }));
  };
  const [envConf, setEnvConf] = React.useState(initialEnvConf);

  React.useEffect(() => {
    if (
      lastHydratedEnvironmentRef.current != null &&
      envConf === lastHydratedEnvironmentRef.current
    ) {
      return;
    }

    const model = EnvironmentModel.fromConfiguration(envConf, env.environmentJSON);

    if (env.environmentJSONSetState) {
      env.environmentJSONSetState(model, env.id);
    }

    if (env.environmentJson) {
      env.environmentJson(envConf, env.id);
    }
  }, [envConf, env.environmentJSON, env.environmentJSONSetState, env.environmentJson, env.id]);

  React.useEffect(() => {
    const nextEnvironment = env.mainJsonValue.environment;
    if (nextEnvironment == null) {
      lastHydratedEnvironmentRef.current = null;
      return;
    }

    const normalizedEnvironment = getNormalizedEnvironmentConfig(nextEnvironment);
    lastHydratedEnvironmentRef.current = nextEnvironment;
    setEnvConf(normalizedEnvironment);
    setCurrentPosition({
      lat: normalizedEnvironment.Origin.Latitude,
      lng: normalizedEnvironment.Origin.Longitude,
    });
    setSelectedWindType(normalizedEnvironment.Wind.Type);
    setSelectedFluctuationValue(normalizedEnvironment.Wind.Fluctuation);
    setwindShears(getWindShearsFromConfig(normalizedEnvironment.Wind));
  }, [env.mainJsonValue.environment]);

  const Direction = [
    { value: 'N', id: 5 },
    { value: 'S', id: 6 },
    { value: 'E', id: 7 },
    { value: 'W', id: 8 },
    { value: 'NE', id: 1 },
    { value: 'SE', id: 2 },
    { value: 'SW', id: 3 },
    { value: 'NW', id: 4 },
  ];

  //Wind type
  const WindType = [
    { value: 'Constant Wind', id: 1 },
    { value: 'Turbulent Wind', id: 2 },
    { value: 'Wind Shear', id: 3 },
  ];

  const [selectedWindType, setSelectedWindType] = React.useState(initialEnvConf.Wind.Type);

  // Fluctuation Percentage
  const [fluctuationPercentage, setSelectedFluctuationValue] = React.useState(
    initialEnvConf.Wind.Fluctuation,
  );

  const [fuzzyAlert, setFuzzyAlert] = React.useState(false);

  const Origin = [
    { value: 'Chicago O\u2019Hare Airport', id: 20 },
    { value: 'Chicago Midway International Airport', id: 21 },
    { value: 'Dallas/Fort Worth International Airport', id: 22 },
    { value: 'Denver International Airport', id: 23 },
    { value: 'Los Angeles International Airport', id: 24 },
    { value: 'Phoenix Sky Harbor International Airport', id: 25 },
    { value: 'Specify Region', id: 30 },
  ];

  const OriginValues = [
    { value: 'Michigan Lake Beach', Latitude: 42.211223, Longitude: -86.390394, Height: 170 },
    { value: 'Chicago O\u2019Hare Airport', Latitude: 41.980381, Longitude: -87.934524, Height: 200 },
    {
      value: 'Chicago Midway International Airport',
      Latitude: 41.78611,
      Longitude: -87.7525,
      Height: 189,
    },
    {
      value: 'Dallas/Fort Worth International Airport',
      Latitude: 32.89694,
      Longitude: -97.03806,
      Height: 185,
    },
    {
      value: 'Denver International Airport',
      Latitude: 39.86167,
      Longitude: -104.67306,
      Height: 1656,
    },
    {
      value: 'Los Angeles International Airport',
      Latitude: 33.9425,
      Longitude: -118.40806,
      Height: 39,
    },
    {
      value: 'Phoenix Sky Harbor International Airport',
      Latitude: 33.43417,
      Longitude: -112.01167,
      Height: 348,
    },
  ];

  const handleTimeChange = (event) => {
    const nextTime = event.target.value;

    if (!nextTime) {
      setEnvConf((prevState) => ({
        ...prevState,
        time: null,
        TimeOfDay: '',
      }));
      return;
    }

    setEnvConf((prevState) => ({
      ...prevState,
      time: dayjs(`2020-01-01 ${nextTime}`),
      TimeOfDay: nextTime,
    }));
  };
  const handleWindChange = (e) => {
    const v = e.target.value;

    if (v === '') {
      setEnvConf((prev) => ({
        ...prev,
        Wind: { ...prev.Wind, Force: '' },
      }));
      return;
    }

    const n = Number(v);
    if (Number.isNaN(n)) {
      return;
    }

    const clamped = Math.min(50, Math.max(0, n));
    setEnvConf((prev) => ({
      ...prev,
      Wind: { ...prev.Wind, Force: clamped },
    }));
  };

  const handleOriginChange = (val) => {
    setEnvConf((prevState) => ({
      ...prevState,
      Origin: {
        ...prevState.Origin,
        [val.target.id]: parseFloat(val.target.value),
      },
    }));
  };
  const handleWindTypeChange = (event) => {
    setFuzzyAlert(false);
    handleSnackBarVisibility(true);
    const newWindType = event.target.value;
    setSelectedWindType(newWindType);

    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        Type: newWindType,
        Fluctuation: newWindType === 'Turbulent Wind' ? fluctuationPercentage : 0,
      },
    }));
  };

  const handleFLuctuationChange = (event) => {
    const newFlucValue = event.target.value;
    setSelectedFluctuationValue(newFlucValue);

    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        Fluctuation: newFlucValue,
      },
    }));
  };

  const handleDirection = (val) => {
    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        Direction: val.target.value,
      },
    }));
  };

  const handleOrigin = (val) => {
    if (val.target.value != 'Specify Region') {
      let originValue;
      OriginValues.map((obj) => {
        if (obj.value == val.target.value) {
          originValue = obj;
        }
      });
      setEnvConf((prevState) => ({
        ...prevState,
        Origin: {
          ...prevState.Origin,
          Name: val.target.value,
          Latitude: originValue.Latitude,
          Longitude: originValue.Longitude,
          Height: originValue.Height,
        },
      }));
      setCurrentPosition({
        lat: originValue.Latitude,
        lng: originValue.Longitude,
      });
    } else {
      setEnvConf((prevState) => ({
        ...prevState,
        Origin: {
          ...prevState.Origin,
          Name: val.target.value,
          Latitude: DEFAULT_ORIGIN.Latitude,
          Longitude: DEFAULT_ORIGIN.Longitude,
          Height: DEFAULT_ORIGIN.Height,
        },
      }));
      setCurrentPosition({
        lat: DEFAULT_ORIGIN.Latitude,
        lng: DEFAULT_ORIGIN.Longitude,
      });
    }
  };
  //WIND SHEAR WINDOW FUNCTIONS
  const [windShears, setwindShears] = React.useState(
    getWindShearsFromConfig(env.mainJsonValue.environment?.Wind),
  );
  const deleteWindShear = (index) => {
    const updatedWindShears = [...windShears];
    updatedWindShears.splice(index, 1);
    setwindShears(updatedWindShears);
  };
  const handleShearWindDirection = (e, index) => {
    const newArry = windShears.map((shear, i) => {
      if (i === index) {
        return {
          ...shear,
          windDirection: e,
        };
      }
      return shear;
    });
    setwindShears(newArry);

    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        [`Wind${index + 1}`]: {
          ...prevState.Wind[`Wind${index + 1}`],
          Direction: e,
        },
      },
    }));
  };

  const handleShearWindChange = (e, index) => {
    const newArry = windShears.map((shear, i) => {
      if (i === index) {
        return {
          ...shear,
          windVelocity: e,
        };
      }
      return shear;
    });
    setwindShears(newArry);

    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        [`Wind${index + 1}`]: {
          ...prevState.Wind[`Wind${index + 1}`],
          Force: e,
        },
      },
    }));
  };

  const handleShearfluctuationPercentageChange = (e, index) => {
    const newArry = windShears.map((shear, i) => {
      if (i === index) {
        return {
          ...shear,
          fluctuationPercentage: e,
        };
      }
      return shear;
    });
    setwindShears(newArry);

    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        [`Wind${index + 1}`]: {
          ...prevState.Wind[`Wind${index + 1}`],
          Fluctuation: e,
        },
      },
    }));
  };
  // Function to add a new wind shear entry for window
  const [snackBarState, setSnackBarState] = React.useState({
    open: false,
  });

  const addNewWindShear = () => {
    const newWindShearEntry = {
      windDirection: envConf.Wind.Direction || DEFAULT_ENVIRONMENT_CONFIG.Wind.Direction,
      windVelocity: envConf.Wind.Force ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Force,
      fluctuationPercentage:
        fluctuationPercentage ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Fluctuation,
    };
    setwindShears([...windShears, newWindShearEntry]);

    setEnvConf((prevState) => ({
      ...prevState,
      Wind: {
        ...prevState.Wind,
        [`Wind${windShears.length + 1}`]: {
          Type: 'Wind Shear',
          Direction: envConf.Wind.Direction || DEFAULT_ENVIRONMENT_CONFIG.Wind.Direction,
          Force: envConf.Wind.Force ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Force,
          Fluctuation: fluctuationPercentage ?? DEFAULT_ENVIRONMENT_CONFIG.Wind.Fluctuation,
        },
      },
    }));
  };

  const handleSnackBarVisibility = (val) => {
    setSnackBarState((prevState) => ({
      ...prevState,
      open: val,
    }));
  };

  const shouldShowRegionMap = envConf.Origin.Name == 'Specify Region';
  const canAttemptRegionMap = shouldShowRegionMap && getGoogleMapsApiKey() !== '';

  const fieldGrid = {
    xs: 12,
    sm: 6,
    md: 4,
  };

  const compactFieldSx = {
    width: '100%',
    maxWidth: { xs: '100%', md: 220 },
  };

  return (
    <div>
      <Snackbar
        open={snackBarState.open}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={6000}
        onClose={() => handleSnackBarVisibility(false)}
      >
        <Alert
          onClose={() => handleSnackBarVisibility(false)}
          severity='info'
          sx={{ width: '100%' }}
        >
          {fuzzyAlert
            ? 'Fuzzy Testing Changes is under development !'
            : 'Wind Type Changes is under Developement !'}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          width: '100%',
          border: '1px solid var(--dw-color-border-muted)',
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 3 },
        }}
      >
        <Box>
          <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems='end'>
            <Grid item {...fieldGrid}>
              <FormControl variant='standard' sx={compactFieldSx}>
                <InputLabel id='WindType'>Wind Type</InputLabel>
                <Select label='Wind Type' value={selectedWindType} onChange={handleWindTypeChange}>
                  {WindType.map(function (val) {
                    return (
                      <MenuItem value={val.value} key={val.id}>
                        <em>{val.value}</em>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item {...fieldGrid}>
              <FormControl variant='standard' sx={compactFieldSx}>
                <InputLabel id='Direction'>Wind Direction</InputLabel>
                <Select label='Direction' value={envConf.Wind.Direction} onChange={handleDirection}>
                  {Direction.map(function (val) {
                    return (
                      <MenuItem value={val.value} key={val.id} id='Direction'>
                        <em>{val.value}</em>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Tooltip title='Enter Wind Velocity in Meters per second' placement='bottom'>
              <Grid item {...fieldGrid}>
                <TextField
                  id='Force'
                  label='Wind Velocity (m/s)'
                  variant='standard'
                  size='small'
                  fullWidth
                  type='number'
                  onChange={handleWindChange}
                  value={envConf.Wind.Force}
                  inputProps={{ min: 0, max: 50, 'data-testid': 'wind-force-input' }}
                  helperText={`Allowed range: 0-50 m/s`}
                  sx={compactFieldSx}
                />
              </Grid>
            </Tooltip>

            {(selectedWindType === 'Turbulent Wind' || selectedWindType === 'Wind Shear') && (
              <Grid item xs={12} sm={6} md={selectedWindType === 'Wind Shear' ? 8 : 4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title='Enter Fluctuation %' placement='bottom'>
                    <TextField
                      id='Fluctuation %'
                      label='Fluctuation %'
                      variant='standard'
                      size='small'
                      type='number'
                      onChange={handleFLuctuationChange}
                      value={fluctuationPercentage}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      sx={compactFieldSx}
                    />
                  </Tooltip>
                  {windShears.length < 2 && selectedWindType === 'Wind Shear' ? (
                    <IconButton onClick={addNewWindShear} color='primary' sx={{ mt: 1 }}>
                      <AddIcon />
                    </IconButton>
                  ) : null}
                </Box>
              </Grid>
            )}
          </Grid>
          {selectedWindType === 'Wind Shear' &&
            windShears.map((shear, index) => (
              <Box
                key={index}
                sx={{
                  mt: 2.5,
                  pt: 2,
                  borderTop: '1px solid var(--dw-color-border-muted)',
                }}
              >
                <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems='end'>
                  <Grid item {...fieldGrid}>
                    <FormControl variant='standard' sx={compactFieldSx}>
                      <InputLabel id='Direction'>Wind Direction</InputLabel>
                      <Select
                        label='Direction'
                        value={shear.windDirection}
                        onChange={(e) => handleShearWindDirection(e.target.value, index)}
                      >
                        {Direction.map(function (val) {
                          return (
                            <MenuItem value={val.value} key={val.id} id='Direction'>
                              <em>{val.value}</em>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Tooltip title='Enter Wind Velocity in Meters per second' placement='bottom'>
                    <Grid item {...fieldGrid}>
                      <TextField
                        id='Velocity'
                        label='Wind Velocity (m/s)'
                        variant='standard'
                        size='small'
                        fullWidth
                        type='number'
                        onChange={(e) => handleShearWindChange(e.target.value, index)}
                        value={shear.windVelocity}
                        inputProps={{ min: 0 }}
                        sx={compactFieldSx}
                      />
                    </Grid>
                  </Tooltip>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Tooltip title='Enter Fluctuation %' placement='bottom'>
                        <TextField
                          id='Fluctuation%'
                          label='Fluctuation %'
                          variant='standard'
                          size='small'
                          type='number'
                          onChange={(e) =>
                            handleShearfluctuationPercentageChange(e.target.value, index)
                          }
                          value={shear.fluctuationPercentage}
                          inputProps={{ min: 5, max: 100, step: 0.1 }}
                          sx={compactFieldSx}
                        />
                      </Tooltip>
                      <IconButton onClick={() => deleteWindShear(index)} sx={{ mt: 1 }}>
                        <DeleteOutline color='primary' />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}

          <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems='end' sx={{ mt: 2 }}>
            <Grid item {...fieldGrid}>
              <FormControl variant='standard' sx={compactFieldSx}>
                <InputLabel id='Origin'>Region</InputLabel>
                <Select label='Region' value={envConf.Origin.Name} onChange={handleOrigin}>
                  {Origin.map(function (val) {
                    return (
                      <MenuItem value={val.value} key={val.id}>
                        <em>{val.value}</em>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item {...fieldGrid}>
              <TextField
                id='Latitude'
                label='Latitude'
                variant='standard'
                size='small'
                fullWidth
                type='number'
                inputProps={{ step: '.0001', 'data-testid': 'environment-latitude-input' }}
                onChange={handleOriginChange}
                value={envConf.Origin.Latitude}
                disabled={envConf.Origin.Name == 'Specify Region' ? false : true}
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item {...fieldGrid}>
              <TextField
                id='Longitude'
                label='Longitude'
                variant='standard'
                size='small'
                fullWidth
                type='number'
                inputProps={{ step: '.0001', 'data-testid': 'environment-longitude-input' }}
                onChange={handleOriginChange}
                value={envConf.Origin.Longitude}
                disabled={envConf.Origin.Name == 'Specify Region' ? false : true}
                sx={compactFieldSx}
              />
            </Grid>

            <Grid item {...fieldGrid}>
              <TextField
                id='Height'
                label='Altitude'
                variant='standard'
                size='small'
                fullWidth
                type='number'
                inputProps={{ step: '1', 'data-testid': 'environment-altitude-input' }}
                onChange={handleOriginChange}
                value={envConf.Origin.Height}
                disabled={envConf.Origin.Name == 'Specify Region' ? false : true}
                sx={compactFieldSx}
              />
            </Grid>
            {envConf.Origin.Name == 'Specify Region' ? (
              <Grid item xs={12}>
                <Typography
                  variant='caption'
                  sx={{
                    display: 'block',
                    color: 'text.secondary',
                    maxWidth: 520,
                  }}
                >
                  Enter altitude above mean sea level. If you do not know it, use `200` as a
                  reasonable default.
                </Typography>
              </Grid>
            ) : null}
          </Grid>

          <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems='end' sx={{ mt: 2 }}>
            <Tooltip title='Enter time of day (24 Hours Format)' placement='bottom'>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  id='time-of-day'
                  label='Time of Day'
                  variant='standard'
                  size='small'
                  fullWidth
                  type='time'
                  value={
                    envConf.TimeOfDay ||
                    (envConf.time ? dayjs(envConf.time).format('HH:mm:ss') : '')
                  }
                  onChange={handleTimeChange}
                  helperText='24-hour format, type directly as HH:MM:SS'
                  inputProps={{
                    step: 1,
                    'data-testid': 'time-of-day-input',
                  }}
                  sx={compactFieldSx}
                />
              </Grid>
            </Tooltip>
          </Grid>

          {shouldShowRegionMap && !canAttemptRegionMap ? (
            <Alert severity='info' sx={{ mt: 3 }}>
              Google Maps preview is unavailable because `REACT_APP_GOOGLE_MAPS_API_KEY` is not
              configured. You can still edit latitude, longitude, and altitude manually.
            </Alert>
          ) : null}

          {canAttemptRegionMap ? (
            <RegionMapPreview currentPosition={currentPosition} onMapClick={onMapClick} />
          ) : null}
        </Box>
      </Box>
      <Box mb={2}> </Box>
      <Typography
        variant='h6'
        sx={{
          opacity: 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {backendInfo.backendStatus}
      </Typography>
    </div>
  );
}
