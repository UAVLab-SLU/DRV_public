import * as React from 'react';
import Box from '@mui/material/Box'
import Container from '@mui/material/Container';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import {ExpandMore} from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import DroneConfiguration from './DroneConfiguration'
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';


const useStyles = makeStyles((theme) => ({
    root: {
      width: '100%',
      padding: '5px'
    },
    transparentBackground: {
        backgroundColor: 'transparent !important'
    },
    backdropFilter: {
        backgroundColor: '#14151471',
        '-webkitBackdropFilter': 'sepia(100%)',
        backdropFilter: 'sepia(100%)',
    }
}));

export default function MissionConfiguration (mission) {
    const classes = useStyles();
    const droneImages = [
        { src: '/images/drone-blue.png', color: '#FFCCCC' },
        { src: '/images/drone-blue.png', color: '#CCFFCC' },
        { src: '/images/drone-blue.png', color: '#CCCCFF' },
        { src: '/images/drone-blue.png', color: '#FFFFCC' },
        { src: '/images/drone-blue.png', color: '#FFCCFF' },
        { src: '/images/drone-blue.png', color: '#CCFFFF' },
        { src: '/images/drone-blue.png', color: '#F0E68C' },
        { src: '/images/drone-blue.png', color: '#E6E6FA' },
        { src: '/images/drone-blue.png', color: '#FFDAB9' },
        { src: '/images/drone-blue.png', color: '#FFFACD' }
    ];
    
    const [droneCount, setDroneCount] = React.useState(mission.mainJsonValue.Drones != null ? mission.mainJsonValue.Drones.length : 1);
    const [droneArray, setDroneArray] = React.useState(mission.mainJsonValue.Drones != null ? mission.mainJsonValue.Drones : [{
        id: droneCount-1, 
        droneName:"Drone " + droneCount,
        FlightController: "SimpleFlight",
        droneType:"Multi Rotor", 
        droneModel:"DJI",
        VehicleType: "SimpleFlight",
        DefaultVehicleState: "Armed",
        EnableCollisionPassthrogh: false,
        EnableCollisions: true,
        AllowAPIAlways: true,
        EnableTrace: false,
        Name:"Drone " + (droneCount),
        image: droneImages[droneCount-1].src,
        color: droneImages[droneCount-1].color,
        X:mission.mainJsonValue.environment != null ? mission.mainJsonValue.environment.Origin.Latitude : 0,
        Y:mission.mainJsonValue.environment != null ? mission.mainJsonValue.environment.Origin.Longitude : 0,
        Z:mission.mainJsonValue.environment != null ? mission.mainJsonValue.environment.Origin.Height : 0,
        Pitch: 0,
        Roll: 0, 
        Yaw: 0,
        Sensors: null,
        MissionValue: null,
        Mission : {
            name:"fly_to_points",
            param : []
        },
        // Cameras: {
        //     CaptureSettings: [
        //         {
        //           ImageType: 0,
        //           Width: 256,
        //           Height: 144,
        //           FOV_Degrees: 90,
        //           AutoExposureSpeed: 100,
        //           AutoExposureBias: 0,
        //           AutoExposureMaxBrightness: 0.64,
        //           AutoExposureMinBrightness: 0.03,
        //           MotionBlurAmount: 0,
        //           TargetGamma: 1,
        //           ProjectionMode: '',
        //           OrthoWidth: 5.12
        //         }
        //     ],
        //     NoiseSettings: [
        //         {
        //           Enabled: false,
        //           ImageType: 0,
        //           RandContrib: 0.2,
        //           RandSpeed: 100000,
        //           RandSize: 500,
        //           RandDensity: 2,
        //           HorzWaveContrib: 0.03,
        //           HorzWaveStrength: 0.08,
        //           HorzWaveVertSize: 1,
        //           HorzWaveScreenSize: 1,
        //           HorzNoiseLinesContrib: 1,
        //           HorzNoiseLinesDensityY: 0.01,
        //           HorzNoiseLinesDensityXY: 0.5,
        //           HorzDistortionContrib: 1,
        //           HorzDistortionStrength: 0.002
        //         }
        //     ],
        //     Gimbal: {
        //         Stabilization: 0,
        //         Pitch: 0,
        //         Roll: 0,
        //         Yaw: 0
        //     },
        //     X:0,
        //     Y:0,
        //     Z:0,
        //     Pitch: 0,
        //     Roll: 0, 
        //     Yaw: 0
        // }
    }]);

    const [snackBarState, setSnackBarState] = React.useState({
        open: true,
    });

    const setDrone = () => {
        droneArray.push({
            id: (droneCount), 
            droneName:"Drone " + (droneCount+1),
            FlightController: "SimpleFlight",
            droneType:"Multi Rotor", 
            droneModel:"DJI", 
            VehicleType: "SimpleFlight",
            DefaultVehicleState: "Armed",
            EnableCollisionPassthrogh: false,
            EnableCollisions: true,
            AllowAPIAlways: true,
            EnableTrace: false,
            Name:"Drone " + (droneCount+1),
            image: droneImages[droneCount].src,
            color: droneImages[droneCount].color,
            X:mission.mainJsonValue.environment != null ? droneCount > 0 ? (mission.mainJsonValue.environment.Origin.Latitude) + (0.0001 * droneCount): mission.mainJsonValue.environment.Origin.Latitude : 0,
            Y:mission.mainJsonValue.environment != null ? mission.mainJsonValue.environment.Origin.Longitude : 0,
            Z:mission.mainJsonValue.environment != null ? mission.mainJsonValue.environment.Origin.Height : 0,
            Pitch: 0,
            Roll: 0, 
            Yaw: 0,
            Sensors: null,
            MissionValue: null,
            Mission : {
                name:"fly_to_points",
                param : []
            },
            // Cameras: {
            //     CaptureSettings: [
            //         {
            //           ImageType: 0,
            //           Width: 256,
            //           Height: 144,
            //           FOV_Degrees: 90,
            //           AutoExposureSpeed: 100,
            //           AutoExposureBias: 0,
            //           AutoExposureMaxBrightness: 0.64,
            //           AutoExposureMinBrightness: 0.03,
            //           MotionBlurAmount: 0,
            //           TargetGamma: 1,
            //           ProjectionMode: '',
            //           OrthoWidth: 5.12
            //         }
            //     ],
            //     NoiseSettings: [
            //         {
            //           Enabled: false,
            //           ImageType: 0,
            //           RandContrib: 0.2,
            //           RandSpeed: 100000,
            //           RandSize: 500,
            //           RandDensity: 2,
            //           HorzWaveContrib: 0.03,
            //           HorzWaveStrength: 0.08,
            //           HorzWaveVertSize: 1,
            //           HorzWaveScreenSize: 1,
            //           HorzNoiseLinesContrib: 1,
            //           HorzNoiseLinesDensityY: 0.01,
            //           HorzNoiseLinesDensityXY: 0.5,
            //           HorzDistortionContrib: 1,
            //           HorzDistortionStrength: 0.002
            //         }
            //     ],
            //     Gimbal: {
            //         Stabilization: 0,
            //         Pitch: 0,
            //         Roll: 0,
            //         Yaw: 0
            //     },
            //     X:0,
            //     Y:0,
            //     Z:0,
            //     Pitch: 0,
            //     Roll: 0, 
            //     Yaw: 0
            // }
        })
    }

    const popDrone = () =>{
        droneArray.pop()
    }

    const handleIncrement = () => {
        setDroneCount(droneCount +1)
        setDrone()
    }

    const handleDecrement = () => {
        setDroneCount(droneCount -1)
        popDrone()
    }

    const setDroneName = (e, index) => {
        setDroneArray(objs => {
            return objs.map((obj, i) => {
                if(index === obj.id) {
                    obj = {
                        ...obj,
                        droneName: e
                    }
                }
                return obj
            })
        })
    }

    React.useEffect(() => {
        mission.droneArrayJson(droneArray, mission.id)
    }, [droneArray])

    const setDroneJson = (json, index) => {
        console.log('set drone json---', json, index)
        // json = {...json, id: index, droneName:json.Name}
        // droneArray.splice(index, 1);
        // droneArray.push(json)
        // let newArry = droneArray.filter(((obj) => {return obj.id != index}))
        // console.log('newArry-----', newArry)
        // // setDroneArray(droneArray=>droneArray.splice(index, 1));
        // setDroneArray((oldArry) => {
        //     return oldArry.filter((obj) => obj.id !== index);
        // })
        // let indx = droneArray.findIndex(prod => prod.id === index)
        // console.log('indx-----', indx)
        // // if (indx > -1) { //make sure you found it
        // //     setDroneArray(prevState => prevState.splice(index, 1));
        // //    } 
        // droneArray.push(json)
        const target = droneArray.find(obj => obj.id == index);
        Object.assign(target, json)
        console.log('droneArray----Missin Config', droneArray)
    }

    const handleSnackBarVisibility = (val) => {
        setSnackBarState(prevState => ({
            ...prevState,
            open: val
        }))
    }

    const handleDragStart = (event) => {
        const imgSrc = event.target.src;
        event.dataTransfer.setData('text/plain', imgSrc);
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
                    <AlertTitle>Info</AlertTitle>
                    Please make sure that no two sUAS (small unmanned aircraft system) have the same Home Geolocation
                </Alert>
            </Snackbar>

            <Box 
            sx={{
                maxHeight: '66vh', overflowY: 'auto',
                width: '90%', m: 4,
                '&::-webkit-scrollbar': {
                display: 'none'  // This hides the scrollbar in Webkit browsers
                },
                scrollbarWidth: 'none',  // This hides the scrollbar in Firefox
                msOverflowStyle: 'none'  // This hides the scrollbar in Internet Explorer
            }}
            >
                <Grid container  direction="row" style={{padding: '12px', color: '#F5F5DC' }} >
                    <strong>Configure sUAS (small unmanned aircraft system) or drone characteristics in your scenario</strong>
                </Grid>
                <Grid container  direction="row" alignItems="center" justifyContent="right" style={{padding: '10px 0', fontSize:'18px', color: '#F5F5DC' }}>
                    Number of sUAS &nbsp;&nbsp;
                    <ButtonGroup size="small" aria-label="small outlined button group" color="warning">
                        {droneCount >1 && <Button style={{fontSize:'15px'}} onClick={handleDecrement}>-</Button>}
                        {droneCount && <Button style={{fontSize:'15px'}} variant="contained" color="warning">{droneCount}</Button>}
                        <Button style={{fontSize:'15px'}} onClick={handleIncrement} disabled={droneCount===10}>+</Button>
                    </ButtonGroup>
                </Grid>

                {droneArray.map((drone, index) => 
                (
                    <Accordion key={index} classes={{ root: classes.transparentBackground }}>
                        <AccordionSummary
                        expandIcon={<ExpandMore />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                        sx={{ backgroundColor: `${drone.color}cf` }}
                        >
                            <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            }}>
                                <Typography variant="h5" >
                                    {drone.droneName}
                                </Typography>
                                <img
                                    src={drone.image}
                                    alt="Draggable Icon"
                                    draggable="true"
                                    onDragStart={handleDragStart}
                                    style={{ width: 40, cursor: 'grab', marginRight: 20 }}
                                />
                            </Box>
                        </AccordionSummary>
                        
                        <AccordionDetails
                        sx={{ backgroundColor: `${drone.color}31` }}
                        >
                            <Typography>
                                <DroneConfiguration name={drone.droneName} id={drone.id} resetName={setDroneName} droneJson={setDroneJson} droneObject={droneArray[(drone.id)]}/>
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </div>
    )
}