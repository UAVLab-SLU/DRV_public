import { Box, Button, Modal, Typography, Grid, InputLabel, MenuItem, FormControl, Select } from '@mui/material';
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  modalStyle,
  StyledButton,
  StyledLink,
  homePageBoxStyle,
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
  // END of Model ===============================


  // START of Controller =============================
  const statusStyle = getStatusStyle(backendInfo);

  const setPropsHandleReqIdChange = (event) => {
    const result = handleReqIdChange(event);
    setSelectedValue(result.selectedValue);
    setText(result.text);
    setTitle(result.title);
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
      <Typography style={{ width: 1000 }}>
        <Grid spacing={5} direction="row" style={{ marginTop: '15px', paddingTop: '15px', paddingLeft: '290px' }}>
          <Box border={1} borderColor={statusStyle.color} p={2} borderRadius={2} width={200} mb={5}>
            <Typography>
              Backend Status: <span style={statusStyle}>{backendInfo.backendStatus}</span>
            </Typography>
          </Box>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 280, top: -80 }}>
              <Typography>
                Queued Tasks: {backendInfo.numQueuedTasks}
              </Typography>
            </div>
          </div>
        </Grid>
      </Typography>
      <Box
        sx={homePageBoxStyle}
      >
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Requirement ID</InputLabel>
          <Select
            labelId="req-id"
            id="req-id-select"
            value={selectedValue}
            label="Requirement ID"
            onChange={setPropsHandleReqIdChange}
          >
            <MenuItem value="UAV-301">UAV-301: Circular Flight Mission in Windy Weather</MenuItem>
            <MenuItem value="UAV-302">UAV-302: sUAS Mission Coordination in Windy Weather</MenuItem>
            <MenuItem value="UAV-303">UAV-303: sUAS Mission in Windy Weather with Path Accuracy</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="h6" component="h4" style={{ marginTop: '3em' }}>
          {selectedValue === '' ? text : `Title: ${title}`}
        </Typography>

        <Typography variant="h6" component="h4" style={{ marginTop: '1em' }}>
          {selectedValue !== '' && `Description: ${text}`}
        </Typography>

        <StyledLink to='/simulation' state={{ req: selectedValue.toString(), descs: text.toString(), title: title.toString() }}>
          <StyledButton variant='contained' disabled={text === "Please select a requirement identifier" ? true : false}>
            Start Scenario Configuration
          </StyledButton>
        </StyledLink>


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

      </Box>
    </React.Fragment>
  );
};

// END of View =============================

export default Home;

