import {useState, useEffect, Fragment} from 'react'
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import SensorConfiguration from './SensorConfiguration'
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import styled from '@emotion/styled';
import { OutlinedInput } from '@mui/material';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useMainJson } from '../../contexts/MainJsonContext';

const flightPaths = [
    {value:'fly_in_circle', label:'Circle', id:1},
    {value:'fly_to_points', label:'Square', id:1},
    // {value:'fly_straight',label:'Straight', id:1}
]

const droneTypes = [
    {value:'FixedWing', label:'Fixed Wing'},
    {value:'MultiRotor', label:'Multi Rotor'}
]

{/* Old stuff from draft PR

const droneModels = [
    {value: 'ParrotANAFI', label: 'Parrot ANAFI'},
    {value: 'DJI', label: 'DJI'},
    {value: 'StreamLineDesignX189', label: 'StreamLineDesign X189'}
]

*/}

//{/*            
const droneModels = {
    FixedWing: [
        {value: 'SenseflyeBeeX', label: 'Sensefly eBee X', src: '/images/SenseflyeBeeX.png'},
        {value: 'TrinityF90', label: 'Trinity F90', src: '/images/TrinityF90.png'} 
    ],
    MultiRotor: [
        {value: 'ParrotANAFI', label: 'Parrot ANAFI', src: '/images/Parrot-ANAFI.png'},
        {value: 'DJI', label: 'DJI', src: '/images/DJI.png'},
        {value: 'VOXLm500', label: 'VOXL m500', src: '/images/VOXLm500.png'},
        {value: 'AureliaX6Pro', label: 'Aurelia X6 Pro', src: '/images/Aurelia-X6-Pro.png'},
        {value: 'IF1200', label: 'IF 1200', src: '/images/IF1200.png'},
        {value: 'Craziefly2.1', label: 'Craziefly 2.1', src: '/images/Craziefly2.1.png'},
        {/*value: 'StreamLineDesignX189', label: 'StreamLineDesign X189', src: null*/}
    ]
}

//*/}    
const locations = [
    {value:'GeoLocation', id:1},
    {value:'Cartesian Coordinate', id:2}
]   

export default function DroneConfiguration ({name, id, index})  {
    const { mainJson, setJson } = useMainJson();
    console.log('DroneConfiguration-----', mainJson.Drones[index]);
    const [selectedLoc, setSelectedLoc] = useState('GeoLocation')
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedDroneType, setselectedDroneType] = useState(droneTypes[1].value);

    const handleLocChange = (event ) => {
        setSelectedLoc(event.target.value);
    };

    const handleMissionChange = (event ) => {
        setJson(prevState => {
            const updatedDrones = prevState.Drones.map((drone, idx) => {
                if (idx === index) {
                    return {
                        ...drone,
                        Mission: { ...drone.Mission, name: event.target.value }
                    };
                }
                return drone;
            });
    
            return { ...prevState, Drones: updatedDrones };
        });
    };

    const handleDroneTypeChange = (event) => {
        handleSnackBarVisibility(true)
        setselectedDroneType(event.target.value);
        setJson(prevState => {
            const updatedDrones = prevState.Drones.map((drone, idx) => {
                if (idx === index) {
                    return { ...drone, droneType: event.target.value };
                }
                return drone;
            });
    
            return { ...prevState, Drones: updatedDrones };
        });
    };

    const handleDroneModelChange = (event) => {
        handleSnackBarVisibility(true)
        setSelectedModel(event.target.value);
        setJson(prevState => {
            const updatedDrones = prevState.Drones.map((drone, idx) => {
                if (idx === index) {
                    return { ...drone, droneModel: event.target.value };
                }
                return drone;
            });
    
            return { ...prevState, Drones: updatedDrones };
        });
    };
    
    const handleChange = (event) => {
        if(event.target.id == "Name"){
            // droneData.resetName(event.target.value, droneData.id)
            setJson(prevState => {
                const updatedDrones = prevState.Drones.map((drone, idx) => {
                    if (idx === index) {
                        return { ...drone, droneName: event.target.value };
                    }
                    return drone;
                });
        
                return { ...prevState, Drones: updatedDrones };
            });
        }
        else {
            setJson(prevState => {
                const updatedDrones = prevState.Drones.map((drone, idx) => {
                    if (idx === index) {
                        return {
                            ...drone,
                            [event.target.id]: event.target.type === "number" ? parseFloat(event.target.value) : event.target.value
                        };
                    }
                    return drone;
                });
        
                return { ...prevState, Drones: updatedDrones };
            });
        }
    }

    const setSensorConfig = (sensor) => {
        setJson(prevState => {
            const updatedDrones = prevState.Drones.map((drone, idx) => {
                if (idx === index) {
                    return { ...drone, Sensors: sensor };
                }
                return drone;
            });
    
            return { ...prevState, Drones: updatedDrones };
        });
    }

    const setCameraSettings = (camera) => {
        console.log('camera---in drone', camera)
        // setDrone(prevState => ({
        //     ...prevState,
        //     Cameras: {
        //         ...prevState.Cameras,
        //         CaptureSettings: [camera]
        //     }
        // }))
    }

    const [snackBarState, setSnackBarState] = useState({
        open: false,
        });
    
    const handleSnackBarVisibility = (val) => {
        setSnackBarState(prevState => ({
            ...prevState,
            open: val
        }))
    }

    const StyledSelect = styled(Select)(({ theme }) => ({
        backgroundColor: '#F5F5DC',
        '& .MuiInputBase-input': {
            padding: '6px 8px',
            height: '1em',
            fontSize: '1.2rem', fontFamily: 'Roboto',
        },
        margin: 0,
    }));

    const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
        marginRight: 2,
        marginLeft: 20,
        flexShrink: 0,
        color: '#F5F5DC',
        width: '200px',
        fontSize: '1.2rem', fontFamily: 'Roboto, sans-serif',
    }));

    return (
        <div>
            <Snackbar open={snackBarState.open} 
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }} 
                autoHideDuration={6000} onClose={e => handleSnackBarVisibility(false)}>
                <Alert onClose={e => handleSnackBarVisibility(false)} severity="info" sx={{ width: '100%' }}>
                     Drone Type and Drone Model Changes is under Developement !
                </Alert>
            </Snackbar>
            
            <Container maxWidth="md">
                <Grid container spacing={0.8}>
                    <Grid item xs={12} sx={{mt: 1}}>
                        <Typography variant="h5" sx={{ color: '#F5F5DC', pb: 1, }}> Drone Settings </Typography>  
                    </Grid>
        
                    {/* Drone Name Field */}
                        <Grid item xs={4}>
                            <StyledInputLabel id="name">Name</StyledInputLabel>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                sx = {{
                                    backgroundColor: '#F5F5DC',
                                    '& .MuiOutlinedInput-root': {
                                        '& .MuiInputBase-input': {
                                            padding: '6px 8px', fontSize: '1.2rem',
                                        },
                                    },
                                }}
                                id="name"
                                variant="outlined"
                                onChange={handleChange}
                                value={mainJson.Drones[index].droneName}
                                fullWidth disabled
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
                            <StyledInputLabel id="drone-type">Drone Type</StyledInputLabel>
                        </Grid>
                        <Grid item xs={6}>
                            <StyledSelect
                                // value={selectedDroneType}
                                value={mainJson.Drones[index].droneType}
                                input={<OutlinedInput/>}
                                MenuProps= {{
                                    sx: {
                                        '& .MuiPaper-root': {
                                            backgroundColor: '#F5F5DC',
                                        },
                                        '& .MuiMenuItem-root': {
                                            fontSize: '1.2rem', fontFamily: 'Roboto',
                                        },
                                    }
                                }}
                                onChange={handleDroneTypeChange}
                                fullWidth
                                >
                                {droneTypes.map(val => (
                                    <MenuItem value={val.value} key={val.value}>
                                        <em>{val.label}</em>
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </Grid>

                    {/* Drone Model Field */}
                        <Grid item xs={4}>
                            <StyledInputLabel id="drone-model">Drone Model</StyledInputLabel>
                        </Grid>
                        <Grid item xs={6}>
                            <StyledSelect
                            value={selectedModel}
                            input={<OutlinedInput/>}
                            MenuProps= {{
                                sx: {
                                    '& .MuiPaper-root': {
                                        backgroundColor: '#F5F5DC',
                                    },
                                    '& .MuiMenuItem-root': {
                                        fontSize: '1.2rem', fontFamily: 'Roboto',
                                    },
                                }
                            }}
                            onChange={handleDroneModelChange}
                            fullWidth
                            >
                                {droneModels[selectedDroneType].map(val => (
                                    <MenuItem value={val.value} key={val.value}>
                                        <em>{val.label}</em>
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </Grid>

                        {/* Drone Image Field */}
                        <Grid item xs={12}>
                            {selectedDroneType && (
                                <Box mt={2} display="flex" justifyContent="center" alignItems="center">
                                    <img src={droneModels[selectedDroneType].find((m) => m.value === selectedModel)?.src}
                                    alt=""
                                    style={{maxWidth:'70%', maxHeight:'150px', objectFit:'fill', marginTop: '8px'}}/>
                                </Box>
                            )}
                        </Grid>                        

                    <Grid item xs={12} sx={{mt: 3}}>
                        <Typography variant="h5" sx={{ pb: 1, color: '#F5F5DC' }}> Home Location </Typography>
                    </Grid>

                    {selectedLoc == 'GeoLocation' ?
                    <Fragment>
                            <Grid item xs={4}>
                                <StyledInputLabel id="X-label">Latitude</StyledInputLabel>
                            </Grid>
                            <Grid item xs={6}>
                                <Tooltip title="Stepping distance of 0.0001, equivalent to 1m" placement='bottom'>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px', fontSize: '1.1rem',
                                                },
                                            },
                                        }}
                                        id="X"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: ".0001" }}
                                        onChange={handleChange}
                                        value={mainJson.Drones[index].X}
                                        fullWidth
                                    />
                                </Tooltip>
                            </Grid>
                        
                            <Grid item xs={4}>
                                <StyledInputLabel id="Y-label">Longitude</StyledInputLabel>
                            </Grid>
                            <Grid item xs={6}>
                                <Tooltip title="Stepping distance of 0.0001, equivalent to 1m" placement='bottom'>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px', fontSize: '1.1rem',
                                                },
                                            },
                                        }}
                                        id="Y"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: ".0001" }}
                                        onChange={handleChange}
                                        value={mainJson.Drones[index].Y}
                                        fullWidth
                                    />
                                </Tooltip>
                            </Grid>

                            <Grid item xs={4}>
                                <StyledInputLabel id="Z-label">Height</StyledInputLabel>
                            </Grid>
                            <Grid item xs={6}>
                                <Tooltip title="Stepping distance of 0.0001, equivalent to 1m" placement='bottom'>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px', fontSize: '1.1rem',
                                                },
                                            },
                                        }}
                                        id="Z"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: "1" }}
                                        onChange={handleChange}
                                        value={mainJson.Drones[index].Z}
                                        fullWidth
                                    />
                                </Tooltip>
                            </Grid>
                    </Fragment>: 
                    <Fragment>
                        <Grid item xs={3}>
                            <TextField id="X" label="X" variant="standard" type="number" inputProps={{ step: ".0001" }} value={mainJson.Drones[index].X} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="Y" label="Y" variant="standard" type="number" inputProps={{ step: ".0001" }} value={mainJson.Drones[index].Y} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={3}> 
                            <TextField id="Z" label="Z" variant="standard" type="number" inputProps={{ step: ".0001" }} value={mainJson.Drones[index].Z} disabled/>
                        </Grid>
                    </Fragment>
                    } 
                </Grid>
                {/* <SensorConfiguration setSensor={setSensorConfig} setCamera={setCameraSettings} sensorJson={drone.Sensors}/> */}
                <Grid container direction="row" justifyContent="flex-end" alignItems="center" style={{paddingTop:'15px', marginTop:'15px'}}>
                    {/* <Button variant="outlined" onClick={sendJson}>Ok</Button> &nbsp;&nbsp;&nbsp; */}
                    {/* <Button variant="contained">OK</Button> */}
                    </Grid>
            </Container>
        </div>
    )
}

DroneConfiguration.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};