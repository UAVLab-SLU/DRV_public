import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { ExpandMore } from '@mui/icons-material';
import { styled } from '@mui/system';
import DroneConfiguration from './DroneConfiguration';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import { useMainJson } from '../../model/MainJsonContext';
import { DroneModel } from '../../model/DroneModel';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';
import { AccordionStyled } from '../../css/SimulationPageStyles';
import { droneModels, droneTypes, droneImages } from '../../constants/drone';

export default function MissionConfiguration(mission) {
  const { mainJson, setMainJson } = useMainJson();
  const [duplicateNameIndex, setDuplicateNameIndex] = React.useState(null);

  const [droneCount, setDroneCount] = React.useState(mainJson.getAllDrones().length);
  const [snackBarState, setSnackBarState] = React.useState({
    open: true,
  });

  const setDrone = () => {
    let newDrone = new DroneModel();
    newDrone.FlightController = 'SimpleFlight';
    newDrone.droneType = droneTypes[0].value;
    newDrone.droneModel = droneModels[droneTypes[0].value][0].value;
    newDrone.VehicleType = 'SimpleFlight';
    newDrone.DefaultVehicleState = 'Armed';
    newDrone.EnableCollisionPassthrogh = false;
    newDrone.EnableCollisions = true;
    newDrone.AllowAPIAlways = true;
    newDrone.EnableTrace = false;
    newDrone.image = droneImages[droneCount].src;
    newDrone.color = droneImages[droneCount].color;
    newDrone.X = mainJson.environment.getOriginLatitude() + 0.0001 * droneCount;
    newDrone.Y = mainJson.environment.getOriginLongitude();
    newDrone.Z = mainJson.environment.getOriginHeight();
    newDrone.Pitch = 0;
    newDrone.Roll = 0;
    newDrone.Yaw = 0;
    newDrone.Sensors = null;
    newDrone.MissionValue = null;
    newDrone.setMissionObjectName('fly_to_points');
    newDrone.setMissionObjectParams([]);

    mainJson.addNewDrone(newDrone);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
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
  };

  const popDrone = () => {
    mainJson.popLastDrone();
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const handleIncrement = () => {
    setDroneCount(droneCount + 1);
    setDrone();
  };

  const handleDecrement = () => {
    setDroneCount(droneCount - 1);
    popDrone();
  };

  const handleSnackBarVisibility = (val) => {
    setSnackBarState((prevState) => ({
      ...prevState,
      open: val,
    }));
  };

  const handleDragStart = (event, index) => {
    const imgSrc = event.target.src;
    const dragData = {
      type: 'drone',
      src: imgSrc,
      index: index,
    };

    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  const handleDeleteDrone = (index) => {
    setDroneCount(droneCount - 1);
    mainJson.deleteDroneBasedOnIndex(index);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
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
        onClose={(e) => handleSnackBarVisibility(false)}
      >
        <Alert
          onClose={(e) => handleSnackBarVisibility(false)}
          severity='info'
          sx={{ width: '100%' }}
        >
          <AlertTitle>Info</AlertTitle>
          Please make sure that no two sUAS (small unmanned aircraft system) have the same Home
          Geolocation
        </Alert>
      </Snackbar>

      <Box
        sx={{
          maxHeight: '66vh',
          overflowY: 'auto',
          width: '90%',
          m: 4,
          '&::-webkit-scrollbar': {
            display: 'none', // This hides the scrollbar in Webkit browsers
          },
          scrollbarWidth: 'none', // This hides the scrollbar in Firefox
          msOverflowStyle: 'none', // This hides the scrollbar in Internet Explorer
        }}
      >
        <Grid container direction='row' style={{ padding: '12px', color: '#F5F5DC' }}>
          <strong>
            Add uncrewed aerial vehicle to simulation
          </strong>
        </Grid>
        <Grid
          container
          direction='row'
          alignItems='center'
          justifyContent='right'
          style={{ padding: '10px 0', fontSize: '18px', color: '#F5F5DC' }}
        >
          Number of sUAS &nbsp;&nbsp;
          <ButtonGroup size='small' aria-label='small outlined button group' color='warning'>
            <Button
              style={{ fontSize: '15px' }}
              onClick={handleDecrement}
              disabled={droneCount === 0}
            >
              -
            </Button>
            <Button style={{ fontSize: '15px' }} variant='contained' color='warning'>
              {droneCount}
            </Button>
            <Button
              style={{ fontSize: '15px' }}
              onClick={handleIncrement}
              disabled={droneCount === 10}
            >
              +
            </Button>
          </ButtonGroup>
        </Grid>

        {mainJson.getAllDrones()?.map((drone, index) => (
          <Grid container spacing={0} key={index}>
            <Grid item xs={11.5}>
              <AccordionStyled key={index}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls='panel1a-content'
                  id='panel1a-header'
                  sx={{ backgroundColor: `${drone.color}cf` }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Typography variant='h5'>
                      {drone.name.length > 10 ? `${drone.name.substring(0, 10)}...` : drone.name}
                    </Typography>
                    <Tooltip
                      title='Drag and drop this drone to set or update its home location on the map.'
                      enterDelay={300}
                      leaveDelay={200}
                    >
                      <img
                        src={drone.image}
                        alt='Draggable Icon'
                        draggable='true'
                        onDragStart={(e) => handleDragStart(e, index)}
                        style={{ width: 40, cursor: 'grab', marginRight: 20 }}
                      />
                    </Tooltip>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ backgroundColor: `${drone.color}31` }}>
                  <DroneConfiguration
                    index={index}
                    duplicateNameIndex={duplicateNameIndex}
                    setDuplicateNameIndex={setDuplicateNameIndex}
                  />
                </AccordionDetails>
              </AccordionStyled>
            </Grid>
            <Grid item xs={0.5}>
              <IconButton
                onClick={() => handleDeleteDrone(index)}
                style={{ color: drone.color, marginTop: '17px' }}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Box>
    </div>
  );
}
