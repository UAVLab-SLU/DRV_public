import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import {
  LandingPageContainer, Nav, SiteTitle,
  MainContent, NavList, NavListItem, AboutLink, modalStyle
} from '../css/LandingPageStyles';




export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <LandingPageContainer>
      <Nav>
        <SiteTitle href="/">
          Drone World
        </SiteTitle>
        <NavList>
          <NavListItem>
            <Box component="span">
              <AboutLink
                onClick={() => setOpen(true)}
                style={{ color: '#fff' }}
              >
                About Us
              </AboutLink>
            </Box>
          </NavListItem>
        </NavList>
      </Nav>

      {/* Main content area */}
      <MainContent style={{ paddingTop: '9rem', color: '#333' }}>
        <h1>Welcome to Drone World!</h1>
        <div>
          <Link to="/home">
            <Button
              variant="contained"
              sx={{
                padding: '15px 30px',
                borderRadius: '10px',
              }}
            >
              Create Simulation
            </Button>
          </Link>
        </div>
      </MainContent>

      {/* About Us Modal */}
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
            style={{ position: 'absolute', top: 16, right: 16 }}
          >
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
              Drone World is revolutionizing sUAS (small Uncrewed Aerial Systems) testing. In the dynamic world of sUAS, safety and reliability are paramount. Traditional field testing across diverse environments is costly and challenging.
            </p>
            <p>
              Drone World offers an innovative sUAV simulation ecosystem that generates high-fidelity, realistic environments mimicking real-world complexities like adverse weather and wireless interference. Our automated solution allows developers to specify constraints and generate tailored test environments.
            </p>
            <p>
              The program monitors sUAV activities against predefined safety parameters and generates detailed acceptance test reports. This approach provides actionable insights for effective debugging and analysis, enhancing the safety, reliability, and efficiency of sUAS applications.
            </p>
          </Typography>
        </Box>
      </Modal>
    </LandingPageContainer>
  );
}
