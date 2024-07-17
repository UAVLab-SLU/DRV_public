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
import MissionConfiguration from './MissionConfiguration';
import EnvironmentConfiguration from './EnvironmentConfiguration';
import CesiumMap from '../cesium/CesiumMap';
import MonitorControl from '../MonitorControl';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import { useMainJson } from '../../model/MainJsonContext';
import { StyledTab, StyledTabs } from '../../css/SimulationPageStyles'
import { callAPI } from '../../utils/ApiUtils';

const StyledButton = styled(Button)`
  font-size: 18px;
  font-weight: bolder;
  color: white;
  background-color: #8b4513;
  width: 200px;
  &:hover {
    background-color: #a0522d;
  }
`;

const steps = [
  'Environment Configuration',
  'sUAS Configuration', // Was "Mission Configuration"
  //'Test Configuration'
];

export default function SimulationController(data) {
  // START of DOM model ===================
  const navigate = useNavigate();
  const { mainJson, setMainJson, envJson, setEnvJson, getJSONStringForAPI } = useMainJson();
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const windowSize = React.useRef([window.innerWidth, window.innerHeight]);
  // END of DOM Model================

  // START of DOM controller
  const redirectToHome = () => {
    navigate('/');
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleTabChange = (event, newValue) => {
    setActiveStep(newValue);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    invokePostAPI();
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const invokePostAPI = () => {
    console.log("mainJson-----", mainJson.toJSONString())

    if (activeStep === steps.length - 1) {
      let mainJSONStringed = mainJson.toJSONString();
      // navigate('/report-dashboard', {
      //   state: { mainJson: mainJSONStringed }
      // })

      callAPI("addTask", "POST", mainJSONStringed, "JSON")
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      })
    }
  };

  const stepsComponent = [
    {
      name: 'Environment Configuration',
      id: 1,
      comp: (
        <EnvironmentConfiguration
          environemntJSONSetState={setEnvJson}
          id='environment'
          mainJSON={mainJson}
          environmentJSON={envJson}
          mainJSONSetState={setMainJson}
        />
      ),
    },
    {
      name: 'sUAS Configuration',
      id: 2,
      comp: (
        <MissionConfiguration
          id='Drones'
          windowHeight={windowSize.current[1]}
          mainJSON={mainJson}
          mainJSONSetState={setMainJson}
        />
      ),
    },
    {
      name: 'Test Configuration',
      id: 3,
      comp: (
        <MonitorControl
          monitorJson={setMainJson}
          id='monitors'
          mainJsonValue={mainJson}
          windowHeight={windowSize.current[1]}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        maxHeight: '98vh',
        overflowY: 'hidden',
        padding: '1vw',
        boxSizing: 'border-box',
      }}
    >
      <Typography sx={{ mb: 1, color: 'white' }} variant='h4' component='h4'>
        Requirement
        <Tooltip title='Home' placement='bottom'>
          <HomeIcon
            style={{ float: 'right', cursor: 'pointer', fontSize: '35px', color: 'white' }}
            onClick={redirectToHome}
          />
        </Tooltip>
      </Typography>
      <Typography sx={{ mt: 2, mb: 1, color: 'white' }} variant='h6' component='h4'>
        {data.desc}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          width: '98vw',
          alignItems: 'start',
          padding: '1vw',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ width: '45%' }}>
          <StyledTabs value={activeStep} onChange={handleTabChange} aria-label='Configuration Tabs'>
            <StyledTab label='Environment' />
            <StyledTab label='sUAS' />
            {/* <StyledTab label="Test" /> */}
          </StyledTabs>
          <div>{activeStep != steps.length && stepsComponent[activeStep].comp}</div>
        </Box>
        <Box sx={{ width: '55%', overflow: 'hidden', border: 1, borderColor: 'yellow', ml: 5 }}>
          <Typography
            sx={{ border: 1, borderColor: 'yellow', backgroundColor: 'white', p: 2 }}
            variant='h6'
            component='h5'
          >
            Latitude: {envJson.getOriginLatitude()}; Longitude: {envJson.getOriginLongitude()}
          </Typography>
          <CesiumMap activeConfigStep={activeStep} />
        </Box>
      </Box>

      {activeStep === steps.length ? (
        <React.Fragment>Redirect to dashboard //TODO</React.Fragment>
      ) : (
        <React.Fragment>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 2,
              position: 'fixed',
              bottom: 8,
              left: 12,
              right: 12,
            }}
          >
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
