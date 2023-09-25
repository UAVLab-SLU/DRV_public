import * as React from 'react'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import dayjs from 'dayjs';
import Tooltip from '@mui/material/Tooltip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormHelperText from '@mui/material/FormHelperText';
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export default function EnvironmentConfiguration (env) {
    const [currentPosition, setCurrentPosition] = React.useState({
        lat: 41.980381,
        lng: -87.934524
      });
      const YOUR_API_KEY="AIzaSyAh_7ie16ikloOrjqURycdAan3INZ1qgiQ"
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
    const [envConf, setEnvConf] = React.useState(env.mainJsonValue.environment != null ? env.mainJsonValue.environment : {
        enableFuzzy: false,
        Wind: {
            Distance: "NE",
            Force: 1,
            //Type: "None",
            //WindOrigin: "None",
        },
        Origin: {
            Latitude: 41.980381,
            Longitude: -87.934524,
        },
        TimeOfDay: "10:00:00",
        UseGeo: true,
        time:dayjs('2020-01-01 10:00')
    });

    const handleChangeSwitch = (val) => {
        setEnvConf(prevState => ({
                ...prevState,
                enableFuzzy: val.target.checked
        }))
    }

    const environmentJson = (event) => {
        env.environmentJson(event, env.id);
    }

    React.useEffect(() => {
        environmentJson(envConf)
    }, [envConf])

    const Distance = [
        {value:'N', id:5},
        {value:'S', id:6},
        {value:'E', id:7},
        {value:'W', id:8},
        {value:'NE', id:1},
        {value:'SE', id:2},
        {value:'SW', id:3},
        {value:'NW', id:4}
    ]

    {/*}
    //Wind Origin
    const WindOrigin = [
        { value: "VALUE SUBJECT TO CHANGE1", id: 1 },
        { value: "VALUE SUBJECT TO CHANGE2", id: 2 },
        { value: "VALUE SUBJECT TO CHANGE3", id: 3 },
        { value: "VALUE SUBJECT TO CHANGE4", id: 4 },
        { value: "VALUE SUBJECT TO CHANGE5", id: 5 },
        { value: "None", id: 6 }
    ]
    */}

    {/*}
    //Saves selected wind origin with a chosen one, or if none is chosen, it uses a default
    //THIS WILL CHANGE WHEN WE HAVE FURTHER INFORMATION ON WHAT THE VALUES ARE, AS WELL AS ENVCONFIG
    const [selectedWindOrigin, setSelectedWindOrigin] = React.useState(
        envConf.Wind.WindOrigin || "None"
    );
    */}

    //Wind type
    const WindType = [
        { value: "Constant Wind", id: 1 },
        { value: "Turbulant Wind", id: 2 },
        { value: "Wind Shear", id: 3 },
    ]

    const [selectedWindType, setSelectedWindType] = React.useState(
        //envConf.Wind.Type || "None" // Set a default value if needed
        //"Temp Value"
        "Constant Wind"
    );


    const Origin = [
        {value:"Chicago O’Hare Airport", id:20},
        // {value:"Michigan Lake Beach", id:10},
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
            TimeOfDay: val.$H + ':' + val.$m + ':' + val.$s
        }))
    }
    const handleWindChange = (val) => {
        setEnvConf(prevState => ({
            ...prevState,
            Wind: {
                ...prevState.Wind,
                [val.target.id]: val.target.type === "number" ? parseFloat(val.target.value) : 0
            }
        }))
    }

    const handleOriginChange = (val) => {
        setEnvConf(prevState => ({
            ...prevState,
            Origin: {
                ...prevState.Origin,
                [val.target.id]: parseFloat(val.target.value)
            }
        }))
    }


  // HANDLE WIND ORIGIN
  {/*
  const handleWindOriginChange = (event) => {
        const newWindOrigin = event.target.value;
        setSelectedWindOrigin(newWindOrigin);
        setEnvConf(prevState=> ({
          ...prevState,
              Wind: {
              ...prevState.Wind,
              WindOrigin: newWindOrigin,
              },
          }));

  };
  */}

  
  const handleWindTypeChange = (event) => {
      const newWindType = event.target.value;
      setSelectedWindType(newWindType); 
      // ENV CONFIG
      {/*setEnvConf((prevState) => ({
          ...prevState,
              Wind: {
              ...prevState.Wind,
              Type: newWindType,
              },
          }));
      */}
  };
  

    
    const handleDistance = (val) => {
        setEnvConf(prevState => ({
            ...prevState,
            Wind: {
                ...prevState.Wind,
                Distance: val.target.value
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

    return (
        <div>
            <Box sx={{ width: '100%',border: '1px solid grey', paddingBottom: 5, paddingTop: 4, paddingLeft:5 }}>
                {/* <Container fixed > */}
                    <Typography>
                        <Grid container spacing={3} direction="row">
                            {/* <Grid item xs={3}>
                                <Typography id="standard-basic" label="Wind" mt={4}>Wind</Typography>
                            </Grid> */}

                            <Grid item xs={3}>
                                <FormControl variant="standard" sx={{ minWidth: 150 }}>
                                    <InputLabel id="Distance">Wind Direction</InputLabel>
                                    <Select label="Direction" value={envConf.Wind.Distance} onChange={handleDistance} disabled={envConf.enableFuzzy}>
                                        {Distance.map(function(val) {
                                            return(<MenuItem value={val.value} key={val.id} id="Distance">
                                            <em>{val.value}</em>
                                        </MenuItem>)
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {/* WIND ORIGIN DROP DOWN */}
                            {/* <Grid item xs={3}> */} 
                                {/*<FormControl variant="standard" sx={{ minWidth: 150 }}>*/}
                                    {/*<InputLabel id="WindOrigin">Wind Origin</InputLabel>*/}
                                        {/*<Select*/}
                                           {/* label="Wind Origin"*/}
                                            {/*value={selectedWindOrigin}*/}
                                           {/* onChange={handleWindOriginChange}>*/}
                                        {/*{WindOrigin.map(function (val) {*/}
                                            {/*return (*/}
                                               {/* <MenuItem value={val.value} key={val.id}>*/}
                                               {/*     <em>{val.value}</em>*/}
                                               {/* </MenuItem>)*/}
                                               {/* })}*/}
                                   {/* </Select>*/}
                                {/*</FormControl>*/}
                            {/*</Grid>*/}


                            {/* WIND TYPE DROP DOWN */}

                            <Tooltip title="Enter Wind Velocity in Meters per second" placement='bottom'>
                                <Grid item xs={3}>
                                    <TextField id="Force" label="Wind Velocity (m/s)" variant="standard" type="number" onChange={handleWindChange} value={envConf.Wind.Force} disabled={envConf.enableFuzzy}/>
                                </Grid>
                            </Tooltip>
                            <Grid item xs={3}> 
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
                            <Grid item xs={3} />
                            <Grid item xs={3} >
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
                            <Grid item xs={3}>
                                <TextField id="Latitude" label="Latitude" variant="standard" type="number" 
                                inputProps={{ step: ".0001" }} onChange={handleOriginChange} value={envConf.Origin.Latitude}
                                 disabled={envConf.Origin.Name=="Specify Region" ? false : true} 
                                 />
                            </Grid>

                            <Grid item xs={3}>
                                <TextField id="Longitude" label="Longitude" variant="standard" type="number" inputProps={{ step: ".0001" }} onChange={handleOriginChange} value={envConf.Origin.Longitude} disabled={envConf.Origin.Name=="Specify Region" ? false : true} />
                            </Grid>
                            
                            {/*<Grid item xs={3}>*/}
                            {/*    <TextField id="Height" label="Altitude" variant="standard" type="number" inputProps={{ step: "1" }} onChange={handleOriginChange} value={envConf.Origin.Height} disabled={envConf.Origin.Name=="Specify Region" ? false : true}*/}
                            {/*    helperText={envConf.Origin.Name == "Specify Region" ? "Please enter the Altitude above mean sea level. If you're unsure of the exact altitude, please enter 200 as a default value.":  null}/>*/}
                            {/*</Grid>*/}
                            {/* <Grid item xs={3}>
                                <Typography id="standard-basic" label="Wind">Time of Day</Typography>
                            </Grid> */}
                            </Grid>

                            <Grid container spacing={3} direction="row" sx={{ marginTop: '20px' }}>
                                <Tooltip title="Enter time of day (24 Hours Format)" placement='bottom'>
                                    <Grid item xs={3}>
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
                                <Grid item xs={3}>
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={envConf.enableFuzzy} onChange={handleChangeSwitch} inputProps={{ 'aria-label': 'controlled' }} />}  label="Enable Fuzzy Test" />
                                        <FormHelperText>Please enable this feature if you would like the system to automatically run tests at various wind velocities</FormHelperText>
                                    </FormGroup>
                                </Grid>
                            </Grid>
                            
                            {envConf.Origin.Name == "Specify Region" ? <div style={{width: '100%', height: '450px'}}>
                                <LoadScript googlMapsApiKey={YOUR_API_KEY}>
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
                                </LoadScript>
                        </div> :null}
                        
                    </Typography>
                {/* </Container> */}
            </Box>
        </div>
    )
}