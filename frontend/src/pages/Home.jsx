import styled from '@emotion/styled';
import { Box, Button, TextField, Modal, Typography, Grid, InputLabel, MenuItem, FormControl, Select, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { useState, useEffect } from 'react';

const StyledBackground = {
  backgroundImage: 'url("/images/dji-air-4.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100vw',
  height: '100vh',
};

const StyledBox = {
  background: 'linear-gradient(to bottom, #211401 14%, #3D250199 66%, #3C260350 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  width: '30vw',
  height: '100vh',
  transform: 'translateX(-93%)',
};

const StyledHiddenBox = {
  background: 'linear-gradient(to bottom, #211401 24%, #3C260358 100%)',
  display:'flex',
  flexDirection:'column',
  alignItems: 'left',
  width: '62.9vw',
  height: '20vh',
  position: 'absolute',
  top: '80vh',
  right: '0vw',
  visibility: 'hidden',
  padding: '10px',
  color: 'white',
};

const StyledDivider = {
  width: '80%',
  height: '4px',
  backgroundColor: '#DEE2E6',
  marginTop: '15px',
  alignItems: 'center',
};

const StyledButton = styled(Button)`
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  height: 70px;
  width: 370px;
  color: 'white';
  border: 2px solid #CC7E09;
  background-color: transparent;
  font-size: 38px;

  &:hover {
    background-color: #CC7E09;
  }
  
  &:active{
    background-color: #CC7E09;
    border: 2px solid #CC7E09;
  }
`;

const StyledText = styled.p`
  font-weight: bold;
  font-size: 20px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px !important;
  width: 300px !important;
`;

const StyledTextField = styled(TextField)`
  width: 800px;
  height: 200px;
`;

const Home = () => {
  const [selectedvalue, setSelectedValue] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleMouseEnter = (event) => {
    setHoveredButton(event);
    handleReqIdChange(event);
  };

  const handleMouseLeave = () => {
    setHoveredButton(null);
  };

  const [backendInfo, setBackendInfo] = useState({
    numQueuedTasks: 0,
    backendStatus: 'idle'
  });
  const [open, setOpen] = useState(false); // State for modal

  const getStatusStyle = () => {
    switch (backendInfo.backendStatus) {
      case 'idle':
        return { color: 'green' };
      case 'running':
        return { color: 'blue' };
      case 'error':
        return { color: 'red' };
      default:
        return { color: 'gray' };
    }
  };
  const statusStyle = getStatusStyle();

  const handleReqIdChange = (event) => {
    //setSelectedValue(event.target.value);
    if (event === "SADE") {
      setText('Two sUAS (Small Unmanned Aircraft System) shall be able to complete a circular and square flight mission in windy weather conditions without colliding with stationary objects, the terrain, or other aircraft and drifting from its planned path by more than 10 meters.');
      setTitle("Circular and Square Flight Mission in Windy Weather")
    } else if (event === "PX4") {
      setText('Two sUAS (Small Unmanned Aircraft Systems) shall be able to complete their missions in windy weather conditions while maintaining a minimum separation distance of at least 5 meters between each other and without drifting by more than 5 meters.');
      setTitle("sUAS Mission Coordination in Windy Weather")
    } else if (event === "AIRSIM") {
      setText('Two sUAS (Small Unmanned Aircraft Systems) shall be able to complete their respective missions in windy weather conditions without drifting from their planned path by more than 15 meters.');
      setTitle("sUAS Mission in Windy Weather with Path Accuracy")
    }
  };

  useEffect(() => {
    const callOnOpen = () => {
      fetch('http://localhost:5000/currentRunning')
        .then((res) => {
          if (!res.ok) {
            throw new Error('No response from server/something went wrong');
          }
          return res.text();
        })
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
        });
    };
    callOnOpen();
  }, []);

  // Modal styles
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800, // Increase the width
    height: 400, // Increase the height
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <React.Fragment>
      <Box sx={StyledBackground}>
        <Box sx={StyledBox}>
          {/*Title and subtitle*/}
          <Typography style={{fontSize: '60px', color:'white', fontWeight:'bold'}}>
            DRONE WORLD
          </Typography>
          <Typography style={{marginTop:'130px', fontSize: '27px', color:'white'}}>
            TYPE OF SIMULATION
          </Typography>
          <Divider sx={StyledDivider}/>
          {/*Buttons*/}
          <Grid container spacing={8} direction="column" style={{ marginTop: '8px', paddingTop: '8px', alignItems: 'center' }}>
            <Grid item>
              <StyledLink to='/simulation' state={{ req: selectedvalue.toString(), descs: text.toString(), title: title.toString()}}>
                <StyledButton 
                  variant="contained"
                  onMouseEnter={() => handleMouseEnter('SADE')} 
                  onMouseLeave={handleMouseLeave}>
                  SADE
                </StyledButton>
              </StyledLink>
            </Grid>
            <Grid item>
              <StyledLink to='/simulation' state={{ req: selectedvalue.toString(), descs: text.toString(), title: title.toString()}}>
                <StyledButton 
                  variant="contained"
                  onMouseEnter={() => handleMouseEnter('PX4')}
                  onMouseLeave={handleMouseLeave}>
                  PX4
                </StyledButton>
              </StyledLink>
            </Grid>
            <Grid item>
            <StyledLink to='/simulation' state={{ req: selectedvalue.toString(), descs: text.toString(), title: title.toString()}}>
                <StyledButton 
                  variant="contained"
                  onMouseEnter={() => handleMouseEnter('AIRSIM')}
                  onMouseLeave={handleMouseLeave}>
                  AIRSIM
                </StyledButton>
              </StyledLink>
            </Grid>
          </Grid>
        </Box>
        {/*Box behind hidden text*/}
        <Box sx={{...StyledHiddenBox, visibility: hoveredButton ? 'visible' : 'hidden'}}>
          <Typography variant="h6">{title}</Typography>
          <Typography>{text}</Typography>
        </Box>
        {/*Backend Status */}
        <Typography style={{ position: 'absolute', top: '25px', left: 0 }}>
          <Grid container spacing={2} direction="row" style={{paddingTop: '15px', paddingLeft: '1500px'}}>
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

{/*
      <Typography style={{ width: 1000 }}>
        <Grid spacing={5} direction="row" style={{ marginTop: '15px', paddingTop: '15px', paddingLeft: '290px' }}>
          <Box border={1} borderColor={statusStyle.color} p={2} borderRadius={2} width={200} mb={5}>
            <Typography>
            Backend Status: <span style={statusStyle}>{backendInfo.backendStatus}</span>
            </Typography>
            </Box>
            <div style={{position: 'relative'}}>
            <div style={{position: 'absolute', left: 280, top: -80}}>
            <Typography>
            Queued Tasks: {backendInfo.numQueuedTasks}
            </Typography>
            </div>
            </div>
            </Grid>
            </Typography>
            <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexDirection: 'column',
      '& > :not(style)': {
        m: 1,
        width: 1000,
      },
    }}
  >
    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">Requirement ID</InputLabel>
      <Select
        labelId="req-id"
        id="req-id-select"
        value={selectedvalue}
        label="Requirement ID"
        onChange={handleReqIdChange}
      >
        <MenuItem value="UAV-301">UAV-301: Circular Flight Mission in Windy Weather</MenuItem>
        <MenuItem value="UAV-302">UAV-302: sUAS Mission Coordination in Windy Weather</MenuItem>
        <MenuItem value="UAV-303">UAV-303: sUAS Mission in Windy Weather with Path Accuracy</MenuItem>
      </Select>
    </FormControl>

    <Typography variant="h6" component="h4" style={{ marginTop: '3em' }}>
      {selectedvalue === '' ? text : `Title: ${title}`}
    </Typography>
    
    <Typography variant="h6" component="h4" style={{ marginTop: '1em' }}>
      {selectedvalue !== '' && `Description: ${text}`}
    </Typography>

    <StyledLink to='/simulation' state={{ req: selectedvalue.toString(), descs: text.toString(), title: title.toString() }}>
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
{/*
  </Box> 
  */}
</React.Fragment>
);
};

export default Home;
             
