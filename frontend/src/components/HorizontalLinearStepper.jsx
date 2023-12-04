import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import MissionConfiguration from './Configuration/MissionConfiguration';
import EnvironmentConfiguration from './EnvironmentConfiguration';
import MonitorControl from './MonitorControl'
import Home from '../pages/Home';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';



const StyledButton = styled(Button)`
  border-radius: 25px;font-size: 18px; font-weight: bolder
`;

const steps = [
  'Environment Configuration',
  'Mission Configuration',
  'Test Configuration'
];

export default function HorizontalLinearStepper(data) { 
  const navigate = useNavigate(); 
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [mainJson, setJson] = React.useState({
    Drones:null,
    environment: null,
    monitors: null
  })

  const windowSize = React.useRef([window.innerWidth, window.innerHeight]);

  const redirectToHome = () => {
    navigate('/')
  }

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const setMainJson = (envJson, id) => {
    if(id == "environment" && mainJson.Drones != null && mainJson.Drones[0].X != envJson.Origin.Latitude) {
      setJson(prevState => ({
        ...prevState,
        Drones:null,
      }))
    }
    setJson(prevState => ({
      ...prevState,
      [id]: envJson
    }))
  }

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    // if(activeStep == 0) {
    //   setMainJson();
    // }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    invokePostAPI();
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const invokePostAPI = () => {
    console.log('mainJson-----', mainJson)
    if(mainJson.environment != null && mainJson.environment.enableFuzzy == true) {
      setJson(prevState => ({
        ...prevState,
        FuzzyTest: {
          target: "Wind",
          precision: 5
        }
      }))
    }
    if(activeStep === steps.length -1) {
      mainJson.Drones.map(drone => {
        delete drone["id"]
        delete drone["droneName"]
        delete drone.Sensors.Barometer["Key"]
        delete drone.Sensors.Magnetometer["Key"]
        delete drone.Sensors.GPS["Key"]
        // delete drone.Cameras.CaptureSettings.map(capt => {
        //   delete capt["key"]
        // })
      })
      delete mainJson.environment["time"]
      mainJson.monitors.circular_deviation_monitor["enable"] == true ? delete mainJson.monitors.circular_deviation_monitor["enable"] : delete mainJson.monitors.circular_deviation_monitor
      mainJson.monitors.collision_monitor["enable"] == true ? delete mainJson.monitors.collision_monitor["enable"] : delete mainJson.monitors.collision_monitor
      mainJson.monitors.unordered_waypoint_monitor["enable"] == true ? delete mainJson.monitors.unordered_waypoint_monitor["enable"] : delete mainJson.monitors.unordered_waypoint_monitor
      mainJson.monitors.ordered_waypoint_monitor["enable"] == true ? delete mainJson.monitors.ordered_waypoint_monitor["enable"] : delete mainJson.monitors.ordered_waypoint_monitor
      mainJson.monitors.point_deviation_monitor["enable"] == true ? delete mainJson.monitors.point_deviation_monitor["enable"] : delete mainJson.monitors.point_deviation_monitor
      mainJson.monitors.min_sep_dist_monitor["enable"] == true ? delete mainJson.monitors.min_sep_dist_monitor["enable"] : delete mainJson.monitors.min_sep_dist_monitor
      mainJson.monitors.landspace_monitor["enable"] == true ? delete mainJson.monitors.landspace_monitor["enable"] : delete mainJson.monitors.landspace_monitor
      mainJson.monitors.no_fly_zone_monitor["enable"] == true ? delete mainJson.monitors.no_fly_zone_monitor["enable"] : delete mainJson.monitors.no_fly_zone_monitor
      mainJson.monitors.drift_monitor["enable"] == true ? delete mainJson.monitors.drift_monitor["enable"] : delete mainJson.monitors.drift_monitor
      mainJson.monitors.battery_monitor["enable"] == true ? delete mainJson.monitors.battery_monitor["enable"] : delete mainJson.monitors.battery_monitor
      delete mainJson.environment["enableFuzzy"]
      console.log('mainJson-----', JSON.stringify(mainJson))
      navigate('/report-dashboard', {
        state: {mainJson: mainJson}
      })
      fetch('http://127.0.0.1:5000/addTask', { 
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(mainJson),
      })
      .then(res => res.json())
      .then(res => console.log(res));
    }
  } 
  
  const stepsComponent = [
    {
      name:'Environment Configuration',
      id:1,
      comp: <EnvironmentConfiguration environmentJson={setMainJson} id="environment" mainJsonValue={mainJson}/>
    },
    {
      name:'Mission Configuration',
      id:2, 
      comp: <MissionConfiguration droneArrayJson={setMainJson} id="Drones" mainJsonValue={mainJson} windowHeight={windowSize.current[1]}/>
    },
    {
      name:'Test Configuration',
      id:3,
      comp: <MonitorControl monitorJson={setMainJson} id="monitors" mainJsonValue={mainJson} windowHeight={windowSize.current[1]}/>
    }
  ];

  return (
    <Box sx={{ width: '95%' }}>
      <Typography sx={{mb: 1 }}  variant="h4" component="h4">Requirement
      <Tooltip title="Home" placement='bottom'><HomeIcon style={{float:'right', cursor:'pointer', fontSize:'35px'}} onClick={redirectToHome}/></Tooltip>
      </Typography>
      <Typography sx={{ mt: 2, mb: 1 }}  variant="h6" component="h4">{data.desc}</Typography>
      <Stepper activeStep={activeStep} style={{padding:20}}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === steps.length ? (
        <React.Fragment>
          Redirect to dashboard //TODO
          {/* <Typography sx={{ mt: 2, mb: 1 }}>finish</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box> */}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {/* <Typography sx={{ mt: 2, mb: 1 }}  variant="h4" component="h4">Requirement</Typography>
          <Typography sx={{ mt: 2, mb: 1 }}  variant="h6" component="h4">{data.desc}</Typography> */}
          {stepsComponent.map((compo, index) => {
            return (
                (compo.id) === (activeStep + 1) ?  (compo.comp): ''
             )
          })}
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <StyledButton
              color='inherit'
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
              variant='outlined'
            >
              Back
            </StyledButton>
            <Box sx={{ flex: '1 1 auto' }} />
            <StyledButton variant='outlined' onClick={handleNext}>
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </StyledButton>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}