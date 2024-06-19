import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import MissionConfiguration from './Configuration/MissionConfiguration';
import EnvironmentConfiguration from './EnvironmentConfiguration';
import CesiumMap from './cesium/CesiumMap';
import MonitorControl from './MonitorControl'
import Home from '../pages/Home';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';



const StyledButton = styled(Button)`
  font-size: 18px;
  font-weight: bolder;
  color: white;
  background-color: #8B4513;
  width: 200px;
  &:hover {
    background-color: #A0522D;
  }
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
  const [activeTab, setActiveTab] = React.useState(0);
  const [mainJson, setJson] = React.useState({
    Drones:null,
    environment: null,
    monitors: null
  })
  const [lat, setLat] = React.useState(null);
  const [long, setLong] = React.useState(null);

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

  const handleTabChange = (event, newValue) => {
    setActiveStep(newValue);
  };

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

  React.useEffect(() => {
    if( mainJson.environment != null && mainJson.environment.enableFuzzy == true && mainJson.environment.enableFuzzy != null) {
      setJson(prevState => ({
        ...prevState,
        FuzzyTest: {
          target: "Wind",
          precision: 5
        }
      }))
      delete mainJson.environment["enableFuzzy"]
    }
    if (mainJson.environment != null && mainJson.environment.enableFuzzy == false && mainJson.FuzzyTest != null) {
      delete mainJson.FuzzyTest
    }
  }, [mainJson])



  const invokePostAPI = () => {
    console.log("mainJson-----", mainJson)
    if(activeStep === steps.length -1) {
      mainJson.Drones.map(drone => {

        delete drone["id"]
        delete drone["droneName"]
        delete drone.Sensors.Barometer["Key"]
        delete drone.Sensors.Magnetometer["Key"]
        delete drone.Sensors.GPS["Key"]
        // delete drone.Sensors.GPS["EphTimeConstant"]
        // drone.Sensors.GPS["EpvTimeConstant"] ? delete drone.Sensors.GPS["EpvTimeConstant"]: null
        // drone.Sensors.GPS["EphInitial"] ? delete drone.Sensors.GPS["EphInitial"]: null
        // drone.Sensors.GPS["EpvInitial"] ? delete drone.Sensors.GPS["EpvInitial"]: null
        // drone.Sensors.GPS["EphFinal"] ? delete drone.Sensors.GPS["EphFinal"]: null
        // drone.Sensors.GPS["EpvFinal"] ? delete drone.Sensors.GPS["EpvFinal"]: null
        // drone.Sensors.GPS["EphMin3d"] ? delete drone.Sensors.GPS["EphMin3d"]: null
        // drone.Sensors.GPS["EphMin2d"] ? delete drone.Sensors.GPS["EphMin2d"]: null
        // drone.Sensors.GPS["UpdateLatency"] ? delete drone.Sensors.GPS["UpdateLatency"]: null
        // drone.Sensors.GPS["StartupDelay"] ? delete drone.Sensors.GPS["StartupDelay"]: null
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
      delete mainJson.environment["timeOfDayFuzzy"]
      delete mainJson.environment["windFuzzy"]
      delete mainJson.environment["positionFuzzy"]
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

  const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    // to-do: use global variables for tab colors
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
      borderBottom: '5px solid #FFB500',
    },
  }));
  
  const StyledTabs = styled(Tabs)({
    minHeight: '48px',
    '.MuiTabs-indicator': {
      display: 'none',
    },
  });

  const onLocationSelect = (latitude, longitude) => {
    console.log("Selected Coordinates:", latitude, longitude);
    setLat(latitude);
    setLong(longitude);
  };

  return (
    <Box sx={{ width: '100vw' , height:'100vh', maxHeight: '98vh', overflowY: 'hidden', padding: '1vw', boxSizing: 'border-box', }}>
        <Typography sx={{mb: 1, color: 'white' }}  variant="h4" component="h4">Requirement
          <Tooltip title="Home" placement='bottom'>
            <HomeIcon style={{float:'right', cursor:'pointer', fontSize:'35px', color: 'white'}} onClick={redirectToHome}/>
          </Tooltip>
        </Typography>
        <Typography sx={{ mt: 2, mb: 1, color: 'white' }}  variant="h6" component="h4">{data.desc}</Typography>
        {/* <Stepper activeStep={activeStep} style={{padding:20}}> 
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
      </Stepper>     */}

        <Box sx={{ display: 'flex', width: '98vw', alignItems: 'start', padding: '1vw', boxSizing: 'border-box',}} >
          <Box sx={{ width: '45%'}}>
            <StyledTabs value={activeStep} onChange={handleTabChange} aria-label="Configuration Tabs">
              <StyledTab label="Environment" />
              <StyledTab label="Mission" />
             {/* <StyledTab label="Test" /> //hides the Test button from the horizontal tab*/} 
            </StyledTabs>
            <div>
              {activeStep === 0 && <EnvironmentConfiguration environmentJson={setMainJson} id="environment" mainJsonValue={mainJson} />}
              {activeStep === 1 && <MissionConfiguration droneArrayJson={setMainJson} id="Drones" mainJsonValue={mainJson} />}
              {activeStep === 2 && <MonitorControl monitorJson={setMainJson} id="monitors" mainJsonValue={mainJson} />}
            </div>
          </Box>
          <Box sx={{ width: '55%', overflow: 'hidden', border: 1, borderColor: 'yellow', ml: 5}}>
            <Typography 
            sx={{border: 1, borderColor: 'yellow', backgroundColor: 'white', p:2}}
            variant="h6" component="h5">Latitude: {lat}; Longitude: {long}</Typography>
            {/* <Typography 
            sx={{border: 1, borderColor: 'yellow', backgroundColor: 'white', p:2}}
            variant="h6" component="h5"></Typography> */}
            <CesiumMap onLocationSelect={onLocationSelect}/> 

          </Box>
        </Box>
        
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
            {/* {stepsComponent.map((compo, index) => {
              return (
                  (compo.id) === (activeStep + 1) ?  (compo.comp): ''
              )
            })} */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, position: 'fixed',
              bottom: 8, left: 12, right: 12, }}>
              <StyledButton
                color='inherit'
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
                variant='outlined'
              >
                Back
              </StyledButton>

              <StyledButton variant='outlined' onClick={handleNext}>
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </StyledButton>
            </Box>
          </React.Fragment>
        )}
      </Box>
  );
}