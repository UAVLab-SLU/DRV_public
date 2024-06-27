//import * as React from 'react' 
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack';
import { Tab, Tabs } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
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
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DialogTitle from '@mui/material/DialogTitle';
import Checkbox from '@mui/material/Checkbox';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import styled from '@emotion/styled';
import WindSettings from './WindSettings';
import PlaceIcon from '@mui/icons-material/Place';

export default function EnvironmentConfiguration (env) {  
    const [selectedTab, setSelectedTab] = useState(0);
    const [backendInfo, setBackendInfo] = useState({ 
        numQueuedTasks: 0,
        backendStatus: 'idle'
    });  

    const [windBlocks, setWindBlocks] = useState([]);

    const updateWindBlocks = (updatedWindBlocks) => {
        setWindBlocks(updatedWindBlocks);
        setEnvConf((prevEnvConf) => ({
          ...prevEnvConf,
          Wind: updatedWindBlocks,
        }));
      };
      
    const [currentPosition, setCurrentPosition] = React.useState({
        lat: 41.980381,
        lng: -87.934524
      }); 

      const getStatusStyle = () => {
        switch (backendInfo.backendStatus) {
          case 'idle':
            return { color: 'green' }; // Green color and a checkmark icon
          case 'running':
            return { color: 'blue'}; // Blue color and a rotating arrow icon
          case 'error':
            return { color: 'red' }; // Red color and a cross icon
          default:
            return { color: 'gray' }; // Gray color and an information 
        }
      };

      const statusStyle = getStatusStyle();

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
        timeOfDayFuzzy: false,
        positionFuzzy: false,
        windFuzzy: false,
        Wind: [],
        Origin: {
            Latitude: 41.980381,
            Longitude: -87.934524,
            Radius: 0,
        },
        TimeOfDay: "10:00:00",
        UseGeo: true,
        time:dayjs('2020-01-01 10:00')
    }); 

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleChangeSwitch = (val) => {
        setEnvConf(prevState => ({
                ...prevState,
                enableFuzzy: val.target.checked
        }))
    }  
    const environmentJson = (event) => {
        env.environmentJson(event, env.id);
    }    
    //new added
    React.useEffect(() => {
        environmentJson(envConf)
    }, [envConf])


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


    const [selectedWindType, setSelectedWindType] = React.useState(
        "Constant Wind"
    );

    // Fluctuation Percentage
    const [fluctuationPercentage, setSelectedFluctuationValue] = React.useState(0.0);

    // Check Box Status for Fuzzy Testing
    const [windBoxStatus , setWindBox] = React.useState(true);
    const [timeBoxStatus, setTimeBox] = React.useState(true);
    const [positionBoxStatus, setPositionBox] = React.useState(true);
    const [fuzzyAlert, setFuzzyAlert] = React.useState(false);

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
    const handleOriginChange = (event) => {
        const { id, value } = event.target;
        let parsedValue = value === '' ? '' : parseFloat(value);
        
        if (id === 'Radius') {
            if (value === '') {
                parsedValue = '';
            } else if (parsedValue < 0) {
                parsedValue = 0;
            }
        }
    
        setEnvConf(prev => ({
            ...prev,
            Origin: { ...prev.Origin, [id]: parsedValue }
        }));
    };
    
    
    
    const handleCheckboxChange = (checkboxName) => {
        setFuzzyAlert(true);
        handleSnackBarVisibility(true);
        // Used to determine the status of the checkbox
        let newStatus;

        // Calculate the number of checkboxes that are currently checked
        const currentWindStatus = checkboxName === 'wind' ? !windBoxStatus : windBoxStatus;
        const currentTimeStatus = checkboxName === 'time' ? !timeBoxStatus : timeBoxStatus;
        const currentPositionStatus = checkboxName === 'position' ? !positionBoxStatus : positionBoxStatus;

        // Count the number of checkboxes that are currently checked
        const checkedCount = [currentWindStatus, currentTimeStatus, currentPositionStatus].filter(Boolean).length;

        if (checkedCount >= 1 ) {
            // allows toggling if there is more then one true value
            newStatus = !eval(checkboxName + 'BoxStatus');
        } else {
            // Do not allow toggling when only one checkbox is checked
            newStatus = eval(checkboxName + 'BoxStatus');
        }

        // Toggle the checkbox based on its name
        if (checkboxName === 'wind') {
        setWindBox(newStatus);
        } else if (checkboxName === 'time') {
            setTimeBox(newStatus);
        } else if (checkboxName === 'position') {
            setPositionBox(newStatus);
    }};


  const handleFLuctuationChange = (event) => {
      const newFlucValue = event.target.value;
      setSelectedFluctuationValue(newFlucValue);
  }

  const handleWindTypeChange = (event) => {
        setFuzzyAlert(false)
        handleSnackBarVisibility(true)
      const newWindType = event.target.value;
      setSelectedWindType(newWindType); 
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
    //new added
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //       fetch('http://localhost:5000/currentRunning')
    //         .then((res) => {
    //           if (!res.ok) {
    //             throw new Error('No response from server/something went wrong');
    //           }
    //           return res.text();
    //         })
    //         .then((data) => {
    //           const [status, queueSize] = data.split(', ');
    //           console.log('Simulation Status,', status, 'Queue Size:', queueSize);
    //           if (status === "None") {
    //             setBackendInfo({ numQueuedTasks: 0, backendStatus: 'idle' });
    //           } else if (status === "Running") {
    //             setBackendInfo({ numQueuedTasks: parseInt(queueSize), backendStatus: 'running' });
    //           }
    //         })
    //         .catch((error) => {
    //           console.error('Error fetching data:', error);
    //           setBackendInfo({ numQueuedTasks: -1, backendStatus: 'error' });
    //         });
    //     }, 2000);
    
    //     return () => clearInterval(interval);
    //   }, []);
      

//     return (
//         <div> 
//             <Box sx={{ width: '100%',border: '1px solid grey', paddingBottom: 5, paddingTop: 4, paddingLeft:5, mt: 2}}>
//                 {/* <Container fixed > */} 
//                     <Typography mb={4}>  
//                         <Grid container spacing={3} direction="row" gutterBottom>
//                             {/* <Grid item xs={3}>
//                                 <Typography id="standard-basic" label="Wind" mt={4}>Wind</Typography>
//                             </Grid> */}
//                             <Grid item xs={2.89} mt={5}>

//   }

  //WIND SHEAR WINDOW FUNCTIONS

    const [snackBarState, setSnackBarState] = React.useState({
        open: false,
    });

    const handleSnackBarVisibility = (val) => {
        setSnackBarState(prevState => ({
            ...prevState,
            open: val
        }))
    }

    const StyledTab = styled(Tab)(({ theme }) => ({
        textTransform: 'none',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 20,
        marginBottom: 8,
        padding: '5px',
        minHeight: '15px',
        minWidth: '10px',
        color: '#8B4513', // Shade of brown
        backgroundColor: '#F5F5DC', // Beige background
        transition: 'background-color 0.3s, color 0.3s',
        '&:hover': {
            backgroundColor: '#DEB887', // Light brown when hovered
            color: '#FFFFFF',
        },
        '&.Mui-selected': {
            backgroundColor: '#A0522D', // Darker brown when selected
            color: '#FFFFFF',
            borderRight: '5px solid #FFB500',
        },
      }));
      
      const StyledTabs = styled(Tabs)({
            minHeight: '30px',
            '.MuiTabs-indicator': {
                display: 'none', // Hides the default underline indicator
            },
      });

        const StyledSelect = styled(Select)(({ theme }) => ({
            backgroundColor: '#F5F5DC',
                '& .MuiInputBase-input': {
                    padding: '6px 8px',
                    height: '1em',
                }
        }));
    
        const DraggableIcon = styled('div')({
            cursor: 'move',
            display: 'inline-block',
            marginLeft: '10px',
          });

        const handleDragStart = (event) => {
            const iconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
            event.dataTransfer.setData("text/plain", JSON.stringify({
                iconUrl,
                radius: envConf.Origin.Radius || 1
            }));
        };

  return (
    <div>
    <Snackbar open={snackBarState.open} 
        anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
        }} 
        autoHideDuration={6000} onClose={e => handleSnackBarVisibility(false)}>
        <Alert onClose={e => handleSnackBarVisibility(false)} severity="info" sx={{ width: '100%' }}>
             {fuzzyAlert ? "Fuzzy Testing Changes is under development !" : "Wind Type Changes is under Developement !"}
        </Alert>
    </Snackbar>

    <Grid container spacing={2} 
        sx={{ width: '100%', paddingBottom: 5, paddingTop: 4, paddingLeft:2 }}>
            <Grid item xs={3}>
                <StyledTabs
                    orientation="vertical"
                    value={selectedTab}
                    onChange={handleTabChange}
                    aria-label="Vertical Configuration Tabs"
                    sx={{ borderRight: 1, borderColor: 'divider' }}
                    >
                    <StyledTab label="Region" />
                    <StyledTab label="Wind" />
                    <StyledTab label="SADE" />
                </StyledTabs>
            </Grid>

            <Grid item xs={9}
            sx={{
                maxHeight: '65vh', 
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none'  // This hides the scrollbar in Webkit browsers
                },
                scrollbarWidth: 'none',  // This hides the scrollbar in Firefox
                msOverflowStyle: 'none'  // This hides the scrollbar in Internet Explorer
              }}
            >
            {selectedTab === 1 && (
                <WindSettings
                    envConf={envConf}
                    handleWindTypeChange={handleWindTypeChange}
                    handleDirection={handleDirection}
                    handleWindChange={handleWindChange}
                    handleFLuctuationChange={handleFLuctuationChange}
                    selectedWindType={selectedWindType}
                    fluctuationPercentage={fluctuationPercentage}
                    windBlocks={envConf.Wind}
                    updateWindBlocks={updateWindBlocks}
                />

                )}

                {selectedTab === 0 && (
                    <Grid container spacing={5} direction="column" >
                        <Grid item xs={12}>
                            <Grid container alignItems="center" direction="row">
                                <Grid item xs={4}>
                                    <InputLabel id="origin-label" sx={{ marginRight: 2, width: '200px', flexShrink: 0, color: '#F5F5DC' }}>Region</InputLabel>
                                </Grid>
                                <Grid item xs={6}>
                                    <StyledSelect
                                        label="Region"
                                        value={envConf.Origin.Name}
                                        input={<OutlinedInput/>}
                                        MenuProps= {{
                                            sx: {
                                                '& .MuiPaper-root': {
                                                    backgroundColor: '#F5F5DC',
                                                }
                                            }
                                        }}
                                        onChange={handleOrigin}
                                        fullWidth
                                        >
                                        {Origin.map(function(val) {
                                            return(<MenuItem value={val.value} key={val.id} >
                                                <em>{val.value}</em>
                                            </MenuItem>)
                                        })}
                                    </StyledSelect>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Grid container alignItems="center" direction="row">
                                <Grid item xs={4}>
                                    <InputLabel id="latitude-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                        Latitude
                                    </InputLabel>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px',
                                                },
                                            },
                                        }}
                                        id="Latitude"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: ".0001" }}
                                        onChange={handleOriginChange}
                                        value={envConf.Origin.Latitude}
                                        disabled={envConf.Origin.Name=="Specify Region" ? false : true}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Grid container alignItems="center" direction="row">
                                <Grid item xs={4}>
                                    <InputLabel id="longitude-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                        Longitude
                                    </InputLabel>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px',
                                                },
                                            },
                                        }}
                                        id="Longitude"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: ".0001" }}
                                        onChange={handleOriginChange}
                                        value={envConf.Origin.Longitude}
                                        disabled={envConf.Origin.Name=="Specify Region" ? false : true}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Grid container alignItems="center" direction="row">
                                <Grid item xs={4}>
                                    <InputLabel id="time-of-day-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                        Time of day
                                    </InputLabel>
                                </Grid>
                                <Grid item xs={6}>
                                    <Tooltip title="Enter time of day (24 Hours Format)" placement='bottom'>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <Stack spacing={3} 
                                                sx = {{
                                                    backgroundColor: '#F5F5DC',
                                                    '& .MuiOutlinedInput-root': {
                                                        '& .MuiInputBase-input': {
                                                            padding: '6px 8px',
                                                        },
                                                    },
                                                }}>
                                                <TimePicker
                                                    ampm={false}
                                                    openTo="hours"
                                                    views={['hours', 'minutes', 'seconds']}
                                                    inputFormat="HH:mm:ss"
                                                    mask="__:__:__"
                                                    value={envConf.time}
                                                    onChange={handleTimeChange}
                                                    renderInput={(params) => <TextField {...params} 
                                                    // helperText="Enter Time of Day (24 Hour Format)"
                                                    />}
                                                    />
                                            </Stack>
                                        </LocalizationProvider>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Grid container alignItems="center" direction="row">
                                <Grid item xs={4}>
                                    <InputLabel id="radius-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                        Enter radius (miles)
                                    </InputLabel>
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        sx={{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px',
                                                },
                                            },
                                        }}
                                        id="Radius"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ 
                                            step: "0.1",
                                            min: "0"
                                        }}
                                        onChange={handleOriginChange}
                                        value={envConf.Origin.Radius === 0 || envConf.Origin.Radius === '' ? '' : envConf.Origin.Radius}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={1}>
                                    <DraggableIcon draggable onDragStart={handleDragStart}>
                                        <PlaceIcon style={{ color: 'white' }} />
                                    </DraggableIcon>
                                </Grid>
                            </Grid>
                        </Grid>

                    </Grid>
                
                        
                    //         {/*<Grid item xs={3}>*/}
                    //         {/*    <TextField id="Height" label="Altitude" variant="standard" type="number" inputProps={{ step: "1" }} onChange={handleOriginChange} value={envConf.Origin.Height} disabled={envConf.Origin.Name=="Specify Region" ? false : true}*/}
                    //         {/*    helperText={envConf.Origin.Name == "Specify Region" ? "Please enter the Altitude above mean sea level. If you're unsure of the exact altitude, please enter 200 as a default value.":  null}/>*/}
                    //         {/*</Grid>*/}
                    //         {/* <Grid item xs={3}>
                    //             <Typography id="standard-basic" label="Wind">Time of Day</Typography>
                    //         </Grid> */}
                    //     </Grid>

                    //     <Grid container spacing={5} direction="row" sx={{ marginTop: '20px' }}>
                    //         {/* <Grid item xs={3}>
                    //             <FormGroup>
                    //                 <FormControlLabel control={
                    //                     <Switch 
                    //                         checked={envConf.enableFuzzy} 
                    //                         onChange={handleChangeSwitch} 
                    //                         inputProps={{ 'aria-label': 'controlled' }} />}  
                    //                         label="Enable Fuzzy Test" 
                    //                     />
                    //                 <FormHelperText>Please enable this feature if you would like the system to automatically run tests at various wind velocities</FormHelperText>
                    //             </FormGroup>
                    //         </Grid> */}
                            
                    //         {/* {envConf.enableFuzzy && (
                    //         <>
                    //                 <Grid item xs = {1.5}>
                    //                     <FormControlLabel
                    //                         control={<Checkbox checked = {windBoxStatus} onChange= {() => handleCheckboxChange('wind')} />}
                    //                         label="Wind"
                    //                     />
                    //                 </Grid>
                    //                 <Grid item xs = {1.5}>
                    //                     <FormControlLabel
                    //                     control={<Checkbox checked = {timeBoxStatus} onChange= {() => handleCheckboxChange('time')}/>}
                    //                     label="Time of Day"
                    //                     />
                    //                 </Grid>
                    //                 <Grid item xs = {1.7}>
                    //                     <FormControlLabel
                    //                         control={<Checkbox checked = {positionBoxStatus} onChange= {() => handleCheckboxChange('position')}/>}
                    //                         label="Initial Position"
                    //                     />
                    //                 </Grid>
                    //         </>
                    //         )} */}
                    //     </Grid>
                        
                    //     {envConf.Origin.Name == "Specify Region" ? <div style={{width: '100%', height: '450px'}}>
                    //         <LoadScript googlMapsApiKey={YOUR_API_KEY}>
                    //             <GoogleMap
                    //             id="map"
                    //             mapContainerStyle={{ height: "100%", width: "100%" }}
                    //             zoom={15}
                    //             center={{ lat: currentPosition.lat, lng: currentPosition.lng }}
                    //             onClick={onMapClick}
                    //             >
                    //             {currentPosition.lat && currentPosition.lng && (
                    //                 <Marker position={{ lat: currentPosition.lat, lng: currentPosition.lng }} />
                    //             )}
                    //             </GoogleMap>
                    //         </LoadScript>
                    //     </div> :null}

                    //     {/* <Typography variant="h6"> Status:</Typography>  
                    //     <Box border={1} borderColor={statusStyle.color} p={2} borderRadius={2} width={300} mb={5} >     
                    //         Show spinner if status is running
                    //         <Typography>   
                    //             Backend Status: <span style={statusStyle}>{backendInfo.backendStatus}</span>
                    //         </Typography>  
                    //     </Box>
                    //     <div style={{position: 'relative'}}> 
                    //         <div style={{position: 'absolute', left: 380, top: -80}}>
                    //             <Typography>  
                    //                 Queued Tasks: {backendInfo.numQueuedTasks}
                    //             </Typography>    
                    //         </div> 
                    //     </div> */}
                    // </Grid>
                )}

                {selectedTab === 2 &&
                <></>
                }
            </Grid>
        </Grid>

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