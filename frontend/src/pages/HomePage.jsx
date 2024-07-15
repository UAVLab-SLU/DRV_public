import { Box, Button, Modal, Typography, Grid, InputLabel, MenuItem, FormControl, Select, Divider } from '@mui/material';
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  modalStyle,
  StyledButton,
  StyledLink,
  homePageBoxStyle,
  StyledBackground,
  StyledBox,
  StyledHiddenBox,
  StyledDivider,
} from '../css/commonStyles';

import {
  handleReqIdChange,
  getStatusStyle
} from '../utils/HomePageUtils'

import {
  callAPI
} from '../utils/ApiUtils'

const Home = () => {

  // START of Model =============================
  const [selectedValue, setSelectedValue] = useState('');
  const [text, setText] = useState('Please select a requirement identifier');
  const [title, setTitle] = useState('');
  const [backendInfo, setBackendInfo] = useState({
    numQueuedTasks: 0,
    backendStatus: 'idle'
  });
  const [open, setOpen] = useState(false); // State for modal
  const [hoveredButton, setHoveredButton] = useState(null);
  // END of Model ===============================


  // START of Controller =============================
  const handleMouseEnter = (event) => {
    setHoveredButton(event);
    handleReqIdChange(event);
  };
  const handleMouseLeave = () => {
    setHoveredButton(null);
  };

  const statusStyle = getStatusStyle(backendInfo);

  const handleReqIdChange = (event) => {
    if (event === "SADE") {
      setText('Two sUAS (Small Unmanned Aircraft System) shall be able to complete a circular and square flight mission in windy weather conditions without colliding with stationary objects, the terrain, or other aircraft and drifting from its planned path by more than 10 meters.');
      setTitle("Circular and Square Flight Mission in Windy Weather");
    } else if (event === "PX4") {
      setText('Two sUAS (Small Unmanned Aircraft Systems) shall be able to complete their missions in windy weather conditions while maintaining a minimum separation distance of at least 5 meters between each other and without drifting by more than 5 meters.');
      setTitle("sUAS Mission Coordination in Windy Weather")
    } else if (event === "AIRSIM") {
      setText('Two sUAS (Small Unmanned Aircraft Systems) shall be able to complete their respective missions in windy weather conditions without drifting from their planned path by more than 15 meters.');
      setTitle("sUAS Mission in Windy Weather with Path Accuracy")
    }
  };

  useEffect(() => {
    callAPI("currentRunning", "GET", {}, "TEXT")
      .then((data) => {
        const [status, queueSize] = data.split(', ');
        if (status === "None") {
          setBackendInfo({ numQueuedTasks: 0, backendStatus: 'idle' });
        } else if (status === "Running") {
          setBackendInfo({ numQueuedTasks: parseInt(queueSize), backendStatus: 'running' });
        }
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setBackendInfo({ numQueuedTasks: -1, backendStatus: 'error' });
      })
  }, []);
  // END of Controller =============================


  // START of View =============================
  return (
    <React.Fragment>
      <Box sx={StyledBackground}>
        <Box sx={StyledBox}>
          {/* Title and subtitle */}
          <Typography style={{fontSize: '60px', color:'white', fontWeight:'bold'}}>
            DRONE WORLD
          </Typography>
          <Typography style={{marginTop:'130px', fontSize: '27px', color:'white'}}>
            TYPE OF SIMULATION
          </Typography>
          <Divider sx={StyledDivider}/>
          {/* Buttons */}
          <Grid container spacing={8} direction="column" style={{ marginTop: '8px', paddingTop: '8px', alignItems: 'center' }}>
            <Grid item>
              <StyledLink to='/simulation' state={{ req: selectedValue.toString(), descs: text.toString(), title: title.toString() }}>
                <StyledButton
                  variant="contained"
                  onMouseEnter={() => handleMouseEnter('SADE')}
                  onMouseLeave={handleMouseLeave}>
                  SADE
                </StyledButton>
              </StyledLink>
            </Grid>
            <Grid item>
              <StyledLink to='/simulation' state={{ req: selectedValue.toString(), descs: text.toString(), title: title.toString() }}>
                <StyledButton
                  variant="contained"
                  onMouseEnter={() => handleMouseEnter('PX4')}
                  onMouseLeave={handleMouseLeave}>
                  PX4
                </StyledButton>
              </StyledLink>
            </Grid>
            <Grid item>
              <StyledLink to='/simulation' state={{ req: selectedValue.toString(), descs: text.toString(), title: title.toString() }}>
                <StyledButton
                  variant="contained"
                  onMouseEnter={() => handleMouseEnter('PX4')}
                  onMouseLeave={handleMouseLeave}>
                  AIRSIM
                  </StyledButton>
              </StyledLink>
            </Grid>
          </Grid>
        </Box>
        {/* Box behind hidden text */}
        <Box sx={{...StyledHiddenBox, visibility: hoveredButton ? 'visible' : 'hidden'}}>
          <Typography variant="h6">{title}</Typography>
          <Typography>{text}</Typography>
        </Box>
        {/* Backend Status */}
        <Typography style={{ position: 'absolute', top: '25px', left: 0 }}>
          <Grid container spacing={2} direction="row" style={{ marginTop: '15px',paddingTop: '15px', paddingLeft: '1500px' }}>
            <Box border={1} borderColor={statusStyle.color} p={2} borderRadius={2} width={200} mb={5}>
              <Typography>
                Backend Status: <span style={statusStyle}>{backendInfo.backendStatus}</span>
              </Typography>
            </Box>
            <Typography style={{ marginTop: '17px', marginLeft: '50px' }}>
              Queued Tasks: {backendInfo.numQueuedTasks}
            </Typography>
          </Grid>
        </Typography>
      </Box>

        {/*Remove this code when implementing the header About us. Widen the component. Add a close button.*/}
        {/* Button to test Modal*/}
        {/* <Button onClick={() => setOpen(true)} style={{ marginTop: 20, marginBottom: 20 }}>About Us (Move this to Nav Bar later)</Button> */}

        {/* Modal Component */}
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={modalStyle}>
            {/* Close Button */}
            <Button
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16 }}>
              Close
            </Button>

            <Typography id="modal-modal-title" variant="h6" component="h2">
              {/* Title Content */}
            </Typography>

            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              <p>
                <strong>About Drone World</strong>
              </p>
              <p>
                Drone World is revolutionizing sUAS (small Uncrewed Aerial Systems) testing. In the dynamic world
                of sUAS, safety and reliability are paramount. Traditional field testing across diverse environments is costly
                and challenging.
              </p>
              <p>
                Drone World offers an innovative sUAV simulation ecosystem that generates high-fidelity, realistic environments
                mimicking real-world complexities like adverse weather and wireless interference. Our automated solution allows
                developers to specify constraints and generate tailored test environments.
              </p>
              <p>
                The program monitors sUAV activities against predefined safety parameters and generates detailed acceptance test
                reports. This approach provides actionable insights for effective debugging and analysis, enhancing the safety,
                reliability, and efficiency of sUAS applications.
              </p>
            </Typography>
          </Box>
        </Modal>

      {/* </Box> */}
    </React.Fragment>
  );
};

// END of View =============================

export default Home;

