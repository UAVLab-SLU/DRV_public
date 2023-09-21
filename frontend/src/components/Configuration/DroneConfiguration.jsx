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


const flightPaths = [
    {value:'fly_in_circle', label:'Circle', id:1},
    {value:'fly_to_points', label:'Square', id:1},
    // {value:'fly_straight',label:'Straight', id:1}
]

const locations = [
    {value:'GeoLocation', id:1},
    {value:'Cartesian Coordinate', id:2}
]   

export default function DroneConfiguration (droneData)  {
    console.log('DroneConfiguration-----', droneData)
    const [selectedLoc, setSelectedLoc] = React.useState('GeoLocation')
    const [drone, setDrone] = React.useState(droneData.droneObject 
        // != null ? droneData.droneObject : {
        // VehicleType: "SimpleFlight",
		// DefaultVehicleState: "Armed",
		// PawnPath: "",
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
    
    return (
        <div>
            <Box sx={{ width: '100%', border: '1px solid grey', paddingBottom: 5, paddingTop: 2 }}>
                <Container fixed >
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField label="Name" id="Name" value={drone.droneName} variant="standard" onChange={handleChange}/>
                        </Grid>
                        <Grid item xs={6} alignItems="flex-end">
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
                        </Grid>


                        <Grid container direction="row">
                            <FormControl variant="standard" sx={{ minWidth: 150 }}>
                                <InputLabel id="drone-type">Select Drone Type</InputLabel>
                                <Select label="drone-type" value={selectedLoc} onChange={handleLocChange}>
                                    <MenuItem value="FixedWing">
                                        <em>Fixed Wing</em>
                                    </MenuItem>
                                    <MenuItem value="MultiColor">
                                        <em>Multi Color</em>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            {selectedLoc === 'Fixed Wing' ? 
                                <React.Fragment>
                                    {/* Add the code for Fixed Wing */}
                                </React.Fragment> : 
                                <React.Fragment>
                                    {/* Add the code for Multi Color dropdown options here */}
                                </React.Fragment>
                            }
                        </Grid>

                    </Grid>
                    <SensorConfiguration setSensor={setSensorConfig} setCamera={setCameraSettings} sensorJson={drone.Sensors}/>
                    <Grid container direction="row" justifyContent="flex-end" alignItems="center" style={{paddingTop:'15px', marginTop:'15px'}}>
                        {/* Add your buttons or other UI elements here */}
                    </Grid>
                </Container>
            </Box>
        </div>
    )
    
}