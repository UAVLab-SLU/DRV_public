import * as React from 'react'
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
        {value: 'SenseflyeBeeX', label: 'Sensefly eBee X'},
        {value: 'TrinityF90', label: 'Trinity F90'}
    ],
    MultiRotor: [
        {value: 'ParrotANAFI', label: 'Parrot ANAFI'},
        {value: 'DJI', label: 'DJI'},
        {value: 'StreamLineDesignX189', label: 'StreamLineDesign X189'}
    ]
}

//*/}    
const locations = [
    {value:'GeoLocation', id:1},
    {value:'Cartesian Coordinate', id:2}
]   

export default function DroneConfiguration (droneData)  {
    console.log('DroneConfiguration-----', droneData)
    const [selectedLoc, setSelectedLoc] = React.useState('GeoLocation')
    const [selectedModel, setSelectedModel] = React.useState('');
    const [selectedDroneType, setselectedDroneType] = React.useState(droneTypes[1].value);
    const [drone, setDrone] = React.useState({
        ...droneData.droneObject, 
        // droneType: droneTypes[1].value
    }
        // != null ? droneData.droneObject : {
        // VehicleType: "SimpleFlight",
		// DefaultVehicleState: "Armed",
		// EnableCollisionPassthrogh: false,
		// EnableCollisions: true,
		// AllowAPIAlways: true,
		// EnableTrace: false,
        // Name:droneData.name,
        // droneName: droneData.name,
        // X:0,
        // Y:0,
        // Z:0,
        // Pitch: 0,
		// Roll: 0, 
		// Yaw: 0,
        // Sensors: null,
        // MissionValue:null
        // Mission : {
        //     name:"fly_to_points",
        //     param : []
        // },
        // // Cameras: {
        // //     CaptureSettings: [
        // //         {
        // //           ImageType: 0,
        // //           Width: 256,
        // //           Height: 144,
        // //           FOV_Degrees: 90,
        // //           AutoExposureSpeed: 100,
        // //           AutoExposureBias: 0,
        // //           AutoExposureMaxBrightness: 0.64,
        // //           AutoExposureMinBrightness: 0.03,
        // //           MotionBlurAmount: 0,
        // //           TargetGamma: 1,
        // //           ProjectionMode: '',
        // //           OrthoWidth: 5.12
        // //         }
        // //     ],
        // //     NoiseSettings: [
        // //         {
        // //           Enabled: false,
        // //           ImageType: 0,
        // //           RandContrib: 0.2,
        // //           RandSpeed: 100000,
        // //           RandSize: 500,
        // //           RandDensity: 2,
        // //           HorzWaveContrib: 0.03,
        // //           HorzWaveStrength: 0.08,
        // //           HorzWaveVertSize: 1,
        // //           HorzWaveScreenSize: 1,
        // //           HorzNoiseLinesContrib: 1,
        // //           HorzNoiseLinesDensityY: 0.01,
        // //           HorzNoiseLinesDensityXY: 0.5,
        // //           HorzDistortionContrib: 1,
        // //           HorzDistortionStrength: 0.002
        // //         }
        // //     ],
        // //     Gimbal: {
        // //         Stabilization: 0,
        // //         Pitch: 0,
        // //         Roll: 0,
        // //         Yaw: 0
        // //     },
        // //     X:0,
        // //     Y:0,
        // //     Z:0,
        // //     Pitch: 0,
        // //     Roll: 0, 
        // //     Yaw: 0
        // // }}
    )

    const handleLocChange = (event ) => {
        setSelectedLoc(event.target.value);
    };

    const handleMissionChange = (event ) => {
        setDrone(prevState => ({
            ...prevState,
            Mission: {
                ...prevState.Mission,
                name: event.target.value
            }
        }));
    };

    const handleDroneTypeChange = (event) => {
        handleSnackBarVisibility(true)
        setselectedDroneType(event.target.value)
         setDrone(prevState => ({
             ...prevState,
             droneType: event.target.value
         }));
    };

    const handleDroneModelChange = (event) => {
        handleSnackBarVisibility(true)
        setSelectedModel(event.target.value);
        setDrone(prevState => ({
            ...prevState,
            droneModel: event.target.value
        }));
    };
    




    const handleChange = (val) => {
        console.log('handlechange---', val)
        if(val.target.id == "Name"){
            droneData.resetName(val.target.value, droneData.id)
            setDrone(prevState => ({
                ...prevState,
                droneName: val.target.value
            }))
        }
        setDrone(prevState => ({
            ...prevState,
            [val.target.id]: val.target.type === "number" ? parseFloat(val.target.value) : val.target.value
        }))
    }

    React.useEffect(() => {
        sendJson()
    }, [drone])

    const sendJson = () => {
        droneData.droneJson(drone, droneData.id);
    }

    const setSensorConfig = (sensor) => {
        setDrone(prevState => ({
            ...prevState,
            Sensors: sensor
        }))
        console.log('sensor---in droneConfig', drone)
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

    const [snackBarState, setSnackBarState] = React.useState({
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
            }, 
        margin: 0
    }));

    // dummy image 
    const handleDragStart = (event) => {
        const imageUrl = "https://catsatthestudios.com/wp-content/uploads/2017/12/12920541_1345368955489850_5587934409579916708_n-2-960x410.jpg"; // URL of the image to drag
        event.dataTransfer.setData("text/plain", imageUrl);
        console.log('event', event);
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
                     Drone Type and Drone Model Changes is under Developement !
                </Alert>
            </Snackbar>
            
            <Container maxWidth="md">
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#F5F5DC'}}>
                            Drone Settings
                        </Typography>
                        <img
                            src="https://catsatthestudios.com/wp-content/uploads/2017/12/12920541_1345368955489850_5587934409579916708_n-2-960x410.jpg"
                            alt="Draggable Icon"
                            draggable="true"
                            onDragStart={handleDragStart}
                            style={{ width: 50, cursor: 'grab' }}
                            />
                    </Grid>
        
                    {/* Drone Name Field */}
                    {/* <CustomGrid container item xs={12} direction="row"> */}
                        <Grid item xs={4}>
                            <InputLabel id="name" sx={{ marginRight: 2, marginLeft: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                Name
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
                                id="name"
                                variant="outlined"
                                onChange={handleChange}
                                value={drone.droneName}
                                fullWidth disabled
                            />
                        </Grid>
                    {/* </CustomGrid> */}

                    {/* Drone Type Field */}
                    {/* <CustomGrid container item xs={12} direction="row"> */}
                        <Grid item xs={4}>
                            <InputLabel id="drone-type" sx={{ marginRight: 2, marginLeft: 2, width: '200px', flexShrink: 0, color: '#F5F5DC' }}>Drone Type</InputLabel>
                        </Grid>
                        <Grid item xs={6}>
                            <StyledSelect
                                value={selectedDroneType}
                                input={<OutlinedInput/>}
                                MenuProps= {{
                                    sx: {
                                        '& .MuiPaper-root': {
                                            backgroundColor: '#F5F5DC',
                                        }
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
                    {/* </CustomGrid> */}

                    {/* Drone Model Field */}
                    {/* <CustomGrid container item xs={12} direction="row"> */}
                        <Grid item xs={4}>
                            <InputLabel id="drone-model" sx={{ marginRight: 2, marginLeft: 2, width: '200px', flexShrink: 0, color: '#F5F5DC' }}>
                                Drone Model
                            </InputLabel>
                        </Grid>
                        <Grid item xs={6}>
                            <StyledSelect
                            value={selectedModel}
                            input={<OutlinedInput/>}
                            MenuProps= {{
                                sx: {
                                    '& .MuiPaper-root': {
                                        backgroundColor: '#F5F5DC',
                                    }
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
                    {/* </CustomGrid> */}

                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#F5F5DC'}}>
                            Home Location
                        </Typography>
                    </Grid>

                    {selectedLoc == 'GeoLocation' ?
                    <React.Fragment>
                        {/* <CustomGrid container item xs={12} direction="row"> */}
                            <Grid item xs={4}>
                                    <InputLabel id="X-label" sx={{ marginRight: 2, marginLeft: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                        Latitude
                                    </InputLabel>
                            </Grid>
                            <Grid item xs={6}>
                                <Tooltip title="Stepping distance of 0.0001, equivalent to 1m" placement='bottom'>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px',
                                                },
                                            },
                                        }}
                                        id="X"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: ".0001" }}
                                        onChange={handleChange}
                                        value={drone.X}
                                        fullWidth
                                    />
                                </Tooltip>
                            </Grid>
                        {/* </CustomGrid> */}
                        
                        {/* <CustomGrid container item xs={12} direction="row"> */}
                            <Grid item xs={4}>
                                <InputLabel id="Y-label" sx={{ marginRight: 2, marginLeft: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                    Longitude
                                </InputLabel>
                            </Grid>
                            <Grid item xs={6}>
                                <Tooltip title="Stepping distance of 0.0001, equivalent to 1m" placement='bottom'>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px',
                                                },
                                            },
                                        }}
                                        id="Y"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: ".0001" }}
                                        onChange={handleChange}
                                        value={drone.Y}
                                        fullWidth
                                    />
                                </Tooltip>
                            </Grid>
                        {/* </CustomGrid> */}

                        {/* <CustomGrid container item xs={12} direction="row"> */}
                            <Grid item xs={4}>
                                <InputLabel id="Z-label" sx={{ marginRight: 2, marginLeft: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                    Height
                                </InputLabel>
                            </Grid>
                            <Grid item xs={6}>
                                <Tooltip title="Stepping distance of 0.0001, equivalent to 1m" placement='bottom'>
                                    <TextField
                                        sx = {{
                                            backgroundColor: '#F5F5DC',
                                            '& .MuiOutlinedInput-root': {
                                                '& .MuiInputBase-input': {
                                                    padding: '6px 8px',
                                                },
                                            },
                                        }}
                                        id="Z"
                                        variant="outlined"
                                        type="number"
                                        inputProps={{ step: "1" }}
                                        onChange={handleChange}
                                        value={drone.Z}
                                        fullWidth
                                    />
                                </Tooltip>
                            </Grid>
                        {/* </CustomGrid> */}
                    </React.Fragment>: 
                    <React.Fragment>
                        <Grid item xs={3}>
                            <TextField id="X" label="X" variant="standard" type="number" inputProps={{ step: ".0001" }} value={drone.X} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="Y" label="Y" variant="standard" type="number" inputProps={{ step: ".0001" }} value={drone.Y} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={3}> 
                            <TextField id="Z" label="Z" variant="standard" type="number" inputProps={{ step: ".0001" }} value={drone.Z} disabled/>
                        </Grid>
                    </React.Fragment>
                    } 
                </Grid>
                <SensorConfiguration setSensor={setSensorConfig} setCamera={setCameraSettings} sensorJson={drone.Sensors}/>
                <Grid container direction="row" justifyContent="flex-end" alignItems="center" style={{paddingTop:'15px', marginTop:'15px'}}>
                    {/* <Button variant="outlined" onClick={sendJson}>Ok</Button> &nbsp;&nbsp;&nbsp; */}
                    {/* <Button variant="contained">OK</Button> */}
                    </Grid>
            </Container>
        </div>
    )
}