import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import dayjs from 'dayjs';
import Tooltip from '@mui/material/Tooltip';
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
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

const GOOGLE_MAPS_API_KEY = normalizeConfigValue(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

function RegionMapPreview({ currentPosition, onMapClick }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'droneworld-google-maps',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    if (loadError) {
        return (
            <Alert severity="warning" sx={{ mt: 3 }}>
                Google Maps preview is temporarily unavailable. You can still edit latitude, longitude, and altitude manually.
            </Alert>
        );
    }

    if (!isLoaded) {
        return (
            <Alert severity="info" sx={{ mt: 3 }}>
                Loading Google Maps preview...
            </Alert>
        );
    }

    return (
        <div style={{width: '100%', height: '450px'}}>
            <GoogleMap
                id="map"
                mapContainerStyle={{ height: "100%", width: "100%" }}
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

const getDefaultEnvironmentConfig = () => ({
    enableFuzzy: false,
    timeOfDayFuzzy: false,
    positionFuzzy: false,
    windFuzzy: false,
    Wind: {
        Direction: "NE",
        Velocity: 1,
    },
    Origin: {
        Latitude: 41.980381,
        Longitude: -87.934524,
        Height: 2,
    },
    TimeOfDay: "10:00:00",
    UseGeo: true,
    time:dayjs('2020-01-01 10:00')
});

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


export default function EnvironmentConfiguration (env) {  
    console.log('EnvironmentConfiguration props', env);
    const isHydratingFromWizardRef = React.useRef(false);
    const [backendInfo] = useState({ 
        numQueuedTasks: 0,
        backendStatus: 'idle'
    });  
    const [currentPosition, setCurrentPosition] = React.useState({
        lat: 41.980381,
        lng: -87.934524
      });  
      const onMapClick = (e) => {
        setCurrentPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        setEnvConf(prevState => ({
            ...prevState,
            Origin: {
                ...prevState.Origin,
                Latitude: e.latLng.lat(),
                Longitude: e.latLng.lng()
            }
        }))

    }
    const [envConf, setEnvConf] = React.useState(env.mainJsonValue.environment != null ? env.mainJsonValue.environment : getDefaultEnvironmentConfig()); 
    
    React.useEffect(() => {
        if (isHydratingFromWizardRef.current) {
            isHydratingFromWizardRef.current = false;
            return;
        }

        const model = EnvironmentModel.fromConfiguration(envConf, env.environmentJSON);

        if (env.environmentJSONSetState){
            env.environmentJSONSetState(model, env.id);
        }

        if (env.environmentJson){
            env.environmentJson(envConf, env.id);
        }
        
    }, [envConf, env.environmentJSON, env.environmentJSONSetState, env.environmentJson, env.id]);

    React.useEffect(() => {
        const nextEnvironment = env.mainJsonValue.environment;
        if (nextEnvironment == null) {
            return;
        }

        isHydratingFromWizardRef.current = true;
        setEnvConf(nextEnvironment);
        setCurrentPosition({
            lat: nextEnvironment?.Origin?.Latitude ?? 41.980381,
            lng: nextEnvironment?.Origin?.Longitude ?? -87.934524,
        });
        setSelectedWindType(nextEnvironment?.Wind?.Type ?? "Constant Wind");
        setSelectedFluctuationValue(nextEnvironment?.Wind?.Fluctuation ?? 0.0);
        setwindShears(getWindShearsFromConfig(nextEnvironment?.Wind));
    }, [env.mainJsonValue.environment]);


    const Direction = [
        {value:'N', id:5},
        {value:'S', id:6},
        {value:'E', id:7},
        {value:'W', id:8},
        {value:'NE', id:1},
        {value:'SE', id:2},
        {value:'SW', id:3},
        {value:'NW', id:4}
    ]

    //Wind type
    const WindType = [
        { value: "Constant Wind", id: 1 },
        { value: "Turbulent Wind", id: 2 },
        { value: "Wind Shear", id: 3 },
    ]

    const [selectedWindType, setSelectedWindType] = React.useState(
        env.mainJsonValue.environment?.Wind?.Type ?? "Constant Wind"
    );

    // Fluctuation Percentage
    const [fluctuationPercentage, setSelectedFluctuationValue] = React.useState(
        env.mainJsonValue.environment?.Wind?.Fluctuation ?? 0.0
    );

    const [fuzzyAlert, setFuzzyAlert] = React.useState(false);

    const Origin = [
        {value:"Chicago O’Hare Airport", id:20},
        {value:"Specify Region", id:30}
    ]  

    const OriginValues = [
        {value: "Michigan Lake Beach", Latitude:42.211223, Longitude:-86.390394, Height:170},
        {value: "Chicago O’Hare Airport", Latitude:41.980381, Longitude:-87.934524, Height:200}
    ]

    const handleTimeChange = (val) => {
        setEnvConf(prevState => ({
            ...prevState,
            time: val,
            TimeOfDay: dayjs(val).format('HH:mm:ss')
        }))
    }
    const handleWindChange = (e) => {
        const v = e.target.value;

        
        if (v === '') {
            setEnvConf(prev => ({
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
        setEnvConf(prev => ({
            ...prev,
            Wind: { ...prev.Wind, Force: clamped },
        }));
    };



    const handleOriginChange = (val) => {
        setEnvConf(prevState => ({
            ...prevState,
            Origin: {
                ...prevState.Origin,
                [val.target.id]: parseFloat(val.target.value)
            }
        }))
    }
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
        Fluctuation: newWindType === "Turbulent Wind" ? fluctuationPercentage : 0,
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
        setEnvConf(prevState => ({
            ...prevState,
            Wind: {
                ...prevState.Wind,
                Direction: val.target.value
            }
        }))
  }
  
  const handleOrigin = (val) => {
        if(val.target.value != "Specify Region") {
            let originValue 
            OriginValues.map(obj => {
                if(obj.value == val.target.value) {
                    originValue =  obj;
                }
            })
            setEnvConf(prevState => ({
                ...prevState,
                Origin: {
                    ...prevState.Origin,
                    Name: val.target.value,
                    Latitude: originValue.Latitude,
                    Longitude: originValue.Longitude,
                    Height: originValue.Height
                }
            }))
        } else {
            setEnvConf(prevState => ({
                ...prevState,
                Origin: {
                    ...prevState.Origin,
                    Name: val.target.value,
                    Latitude: 0,
                    Longitude: 0,
                    Height:0
                }
            }))
        }
    }    
  //WIND SHEAR WINDOW FUNCTIONS
  const [windShears, setwindShears] = React.useState(
    getWindShearsFromConfig(env.mainJsonValue.environment?.Wind)
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
          windDirection: "",
          windVelocity: 0,
          fluctuationPercentage: 0,
        };
        setwindShears([...windShears, newWindShearEntry]);
      
        setEnvConf((prevState) => ({
          ...prevState,
          Wind: {
            ...prevState.Wind,
            [`Wind${windShears.length + 1}`]: {
              Type: "Wind Shear",
              Direction: "",
              Force: 0,
              Fluctuation: 0,
            },
          },
        }));
      };


const handleSnackBarVisibility = (val) => {
    setSnackBarState(prevState => ({
        ...prevState,
        open: val
    }))
}
  const shouldShowRegionMap = envConf.Origin.Name == "Specify Region";
  const canAttemptRegionMap = shouldShowRegionMap && GOOGLE_MAPS_API_KEY !== '';

  return (
    <div>
    <Snackbar open={snackBarState.open} 
        anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
        }} 
        autoHideDuration={6000} onClose={() => handleSnackBarVisibility(false)}>
        <Alert onClose={() => handleSnackBarVisibility(false)} severity="info" sx={{ width: '100%' }}>
             {fuzzyAlert ? "Fuzzy Testing Changes is under development !" : "Wind Type Changes is under Developement !"}
        </Alert>
    </Snackbar>
    <Box sx={{ width: '100%', border: '1px solid grey', paddingBottom: 5, paddingTop: 4, paddingLeft:5 }}>
            <Typography>
                <Grid container spacing={5} direction="column" alignItems="center" >
                    <Grid item xs={12}> 
                        <FormControl variant="standard" sx={{ minWidth: 150 }}>
                            <InputLabel id="WindType">Wind Type</InputLabel>
                                <Select
                                   label= "Wind Type"
                                   value={selectedWindType}
                                   onChange={handleWindTypeChange}>
                                    {WindType.map(function (val) {
                                        return (
                                            <MenuItem value={val.value} key={val.id}>
                                                <em>{val.value}</em>
                                            </MenuItem>)
                                            })}
                                </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl variant="standard" sx = {{ minWidth: 150 }}>
                            <InputLabel id="Direction">Wind Direction</InputLabel>
                            <Select label="Direction" value={envConf.Wind.Direction} onChange={handleDirection}>
                                {Direction.map(function(val) {
                                    return(<MenuItem value={val.value} key={val.id} id="Direction">
                                    <em>{val.value}</em>
                                </MenuItem>)
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Tooltip title="Enter Wind Velocity in Meters per second" placement='bottom'>
                        <Grid item xs={12}>
                            <TextField id="Force" 
                                label="Wind Velocity (m/s)" 
                                variant="standard" type="number" 
                                onChange={handleWindChange} 
                                value={envConf.Wind.Force} 
                                inputProps={{ min: 0, max: 50, 'data-testid': 'wind-force-input' }}
                                helperText={`Allowed range: 0-50 m/s`}/>
                        </Grid>
                    </Tooltip>

                    {(selectedWindType === "Turbulent Wind" || selectedWindType === "Wind Shear")  && (
                            <Grid item xs={12}>
                                 <Tooltip title="Enter Fluctuation %" placement='bottom'>
                                <TextField id="Fluctuation %" 
                                    label="Fluctuation %" 
                                    variant="standard" 
                                    type="number" 
                                    onChange={handleFLuctuationChange} 
                                    value={fluctuationPercentage} 
                                    inputProps={{ min: 0, max: 100, step: 0.1 }} 
                                    sx={{ width: '150px' }} />
                                     </Tooltip>
                                     {(windShears.length<2 && selectedWindType === "Wind Shear") ? (<IconButton onClick={addNewWindShear} color="primary">
                                        <AddIcon />
                                    </IconButton>) : null}
                            </Grid>
                    )}
                </Grid>
                {selectedWindType === "Wind Shear" &&  windShears.map((shear, index) => ((<Typography key={index}><Grid container spacing={5} direction="row" sx={{ marginTop: '20px' }}>
                    <Grid item xs={12}></Grid>
                            <Grid item xs={12}>
                                <FormControl variant="standard" sx = {{ minWidth: 150 }}>
                                    <InputLabel id="Direction">Wind Direction</InputLabel>
                                    <Select label="Direction" value={shear.windDirection} onChange={(e) => handleShearWindDirection(e.target.value, index)}>
                                        {Direction.map(function(val) {
                                            return(<MenuItem value={val.value} key={val.id} id="Direction">
                                            <em>{val.value}</em>
                                        </MenuItem>)
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                    
                            <Tooltip title="Enter Wind Velocity in Meters per second" placement='bottom'>
                                <Grid item xs={12}>
                                    <TextField id="Velocity" 
                                        label="Wind Velocity (m/s)" 
                                        variant="standard" type="number" 
                                        onChange={(e) => handleShearWindChange(e.target.value, index)} 
                                        value={shear.windVelocity}  
                                        inputProps={{ min: 0 }}/>
                                </Grid>
                            </Tooltip>
                            <Grid item xs={12}>
                            <Tooltip title="Enter Fluctuation %" placement='bottom'>
                            <TextField id="Fluctuation%" 
                                    label="Fluctuation %" 
                                    variant="standard" 
                                    type="number" 
                                    onChange={(e) => handleShearfluctuationPercentageChange(e.target.value, index)} 
                                    value={shear.fluctuationPercentage} 
                                    inputProps={{ min: 5, max: 100, step: 0.1 }} 
                                    sx={{ width: '150px' }} />
                                
                              </Tooltip>       
                                <IconButton onClick={() => deleteWindShear(index)}>
                                    <DeleteOutline color="primary"/>
                                </IconButton>
                            </Grid>
                        </Grid>
                            </Typography>
                )))}


                <Grid container spacing={5} direction="column" alignItems="center" sx={{ marginTop: '10px' }}>  
                    <Grid item xs={12} >
                        <FormControl variant="standard" sx={{ minWidth: 150 }}>
                            <InputLabel id="Origin">Region</InputLabel>
                            <Select label="Region" value={envConf.Origin.Name} onChange={handleOrigin} >
                                {Origin.map(function(val) {
                                    return(<MenuItem value={val.value} key={val.id} >
                                    <em>{val.value}</em>
                                </MenuItem>)
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField id="Latitude" label="Latitude" variant="standard" type="number" 
                        inputProps={{ step: ".0001", 'data-testid': 'environment-latitude-input' }} onChange={handleOriginChange} value={envConf.Origin.Latitude}
                         disabled={envConf.Origin.Name=="Specify Region" ? false : true} 
                         />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField id="Longitude" label="Longitude" variant="standard" type="number" inputProps={{ step: ".0001", 'data-testid': 'environment-longitude-input' }} onChange={handleOriginChange} value={envConf.Origin.Longitude} disabled={envConf.Origin.Name=="Specify Region" ? false : true} />
                    </Grid>

                    <Grid item xs={12}>
        <TextField id="Height" label="Altitude" variant="standard" type="number" inputProps={{ step: "1", 'data-testid': 'environment-altitude-input' }} onChange={handleOriginChange} value={envConf.Origin.Height} disabled={envConf.Origin.Name=="Specify Region" ? false : true}
        helperText={envConf.Origin.Name == "Specify Region" ? "Please enter the Altitude above mean sea level. If you're unsure of the exact altitude, please enter 200 as a default value.":  null}/>
    </Grid>
                </Grid>

                    <Grid container spacing={5} direction="column" alignItems="center" sx={{ marginTop: '20px' }}>
                        <Tooltip title="Enter time of day (24 Hours Format)" placement='bottom'>
                            <Grid item xs={12}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Stack spacing={3}>
                                    <TimePicker
                                    ampm={false}
                                    openTo="hours"
                                    views={['hours', 'minutes', 'seconds']}
                                    inputFormat="HH:mm:ss"
                                    mask="__:__:__"
                                    label="Time of Day"
                                    value={envConf.time}
                                    onChange={handleTimeChange}
                                    renderInput={(params) => <TextField {...params} 
                                    helperText="Enter Time of Day (24 Hour Format)"/>}
                                    />
                                    </Stack>
                                </LocalizationProvider>
                            </Grid>
                        </Tooltip>
                    </Grid>
                    
                    {shouldShowRegionMap && !canAttemptRegionMap ? (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            Google Maps preview is unavailable because `REACT_APP_GOOGLE_MAPS_API_KEY` is not configured.
                            You can still edit latitude, longitude, and altitude manually.
                        </Alert>
                    ) : null}

                    {canAttemptRegionMap ? (
                        <RegionMapPreview currentPosition={currentPosition} onMapClick={onMapClick} />
                    ) : null}

                    </Typography>
                    </Box>
                    <Typography 
                        animate 
                        variants={{ 
                            hidden: { opacity: 0 }, 
                            visible: { opacity: 1 } 
                            }} 
                            > 
                    </Typography> 
                    <Box mb={2}> </Box>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            opacity: 0, 
                            transition: 'opacity 0.5s ease-in-out'  
                            }} 
                            > 
                        {backendInfo.backendStatus}  
                    </Typography>
            </div>
)
}
