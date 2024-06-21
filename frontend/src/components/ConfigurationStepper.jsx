import React, { useState, useRef, useEffect } from 'react';
import { Box, Tabs, Tab, Button, Typography, Tooltip } from '@mui/material';
import styled from '@emotion/styled';  // Corrected import
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MissionConfiguration from './Configuration/MissionConfiguration';
import EnvironmentConfiguration from './EnvironmentConfiguration';
import CesiumMap from './cesium/CesiumMap';
import MonitorControl from './MonitorControl';
import PropTypes from 'prop-types';  // Import PropTypes

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

const StyledTab = styled(Tab)`
  text-transform: none;
  font-size: 16px;
  font-weight: bold;
  margin-right: 8px;
  color: #8B4513;
  background-color: #F5F5DC;
  transition: background-color 0.3s, color 0.3s;
  &:hover {
    background-color: #DEB887;
    color: #FFFFFF;
  }
  &.Mui-selected {
    background-color: #A0522D;
    color: #FFFFFF;
    border-bottom: 5px solid #FFB500;
  }
`;

const StyledTabs = styled(Tabs)`
  min-height: 48px;
  .MuiTabs-indicator {
    display: none;
  }
`;

const steps = ['Environment Configuration', 'Mission Configuration', 'Test Configuration'];

function ConfigurationStepper({ desc }) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [mainJson, setMainJson] = useState({
    Drones: null,
    environment: null,
    monitors: null
  });
  const [coordinates, setCoordinates] = useState({ lat: null, long: null });
  const windowSize = useRef([window.innerWidth, window.innerHeight]);

  useEffect(() => {
    handleFuzzyLogic();
  }, [mainJson]);

  const handleFuzzyLogic = () => {
    if (mainJson.environment?.enableFuzzy) {
      setMainJson(prev => ({
        ...prev,
        FuzzyTest: { target: "Wind", precision: 5 },
        environment: { ...prev.environment, enableFuzzy: undefined }
      }));
    } else if (mainJson.environment?.enableFuzzy === false && mainJson.FuzzyTest) {
      setMainJson(prev => ({ ...prev, FuzzyTest: undefined }));
    }
  };

  const setJsonSection = (sectionData, id) => {
    setMainJson(prev => ({ ...prev, [id]: sectionData }));
  };

  const handleStepChange = (_, newValue) => setActiveStep(newValue);

  const handleNavigation = (direction) => {
    setActiveStep(prev => direction === 'next' ? prev + 1 : prev - 1);
    if (direction === 'next' && activeStep === steps.length - 1) {
      submitConfiguration();
    }
  };

  const submitConfiguration = () => {
    const cleanedJson = cleanJsonForSubmission(mainJson);
    console.log('Cleaned JSON for submission:', JSON.stringify(cleanedJson));
    navigate('/report-dashboard', { state: { mainJson: cleanedJson } });
    
    fetch('http://127.0.0.1:5000/addTask', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(cleanedJson),
    })
    .then(res => res.json())
    .then(res => console.log(res));
  };

  const cleanJsonForSubmission = (json) => {
    // Implement the cleaning logic here
    // This function should remove unnecessary fields and format the JSON as required
    return json;
  };

  const stepComponents = [
    <EnvironmentConfiguration key="environment" environmentJson={setJsonSection} id="environment" mainJsonValue={mainJson} />,
    <MissionConfiguration key="mission" droneArrayJson={setJsonSection} id="Drones" mainJsonValue={mainJson} windowHeight={windowSize.current[1]} />,
    <MonitorControl key="monitor" monitorJson={setJsonSection} id="monitors" mainJsonValue={mainJson} windowHeight={windowSize.current[1]} />
  ];

  return (
    <Box sx={{ width: '100vw', height: '100vh', maxHeight: '98vh', overflowY: 'hidden', padding: '1vw', boxSizing: 'border-box' }}>
      <Typography sx={{ mb: 1, color: 'white' }} variant="h4">
        Requirement
        <Tooltip title="Home" placement='bottom'>
          <HomeIcon style={{ float: 'right', cursor: 'pointer', fontSize: '35px', color: 'white' }} onClick={() => navigate('/')} />
        </Tooltip>
      </Typography>
      <Typography sx={{ mt: 2, mb: 1, color: 'white' }} variant="h6">{desc}</Typography>

      <Box sx={{ display: 'flex', width: '98vw', alignItems: 'start', padding: '1vw', boxSizing: 'border-box' }}>
        <Box sx={{ width: '45%' }}>
          <StyledTabs value={activeStep} onChange={handleStepChange} aria-label="Configuration Tabs">
            <StyledTab label="Environment" />
            <StyledTab label="Mission" />
            <StyledTab label="Test" />
          </StyledTabs>
          <div>{stepComponents[activeStep]}</div>
        </Box>
        <Box sx={{ width: '55%', overflow: 'hidden', border: 1, borderColor: 'yellow', ml: 5 }}>
          <Typography sx={{ border: 1, borderColor: 'yellow', backgroundColor: 'white', p: 2 }} variant="h6">
            Latitude: {coordinates.lat}; Longitude: {coordinates.long}
          </Typography>
          <CesiumMap onLocationSelect={(lat, long) => setCoordinates({ lat, long })} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, position: 'fixed', bottom: 8, left: 12, right: 12 }}>
        <StyledButton color='inherit' disabled={activeStep === 0} onClick={() => handleNavigation('back')} variant='outlined'>
          Back
        </StyledButton>
        <StyledButton variant='outlined' onClick={() => handleNavigation('next')}>
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </StyledButton>
      </Box>
    </Box>
  );
}

ConfigurationStepper.propTypes = {
  desc: PropTypes.string.isRequired,
};

export default ConfigurationStepper;