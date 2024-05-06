import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography'; 
import {useEffect} from 'react'; 
import ReportDashboard from './components/ReportDashboard'; 

const useStyles = makeStyles((theme) => ({
  landingPage: {
    fontFamily: 'Roboto, sans-serif',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column', 
    alignItems: 'center', 
    minHeight: '100vh', 
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: '#0000CD',
    fontFamily: 'Arial, sans-serif',
    width: '100%',
  },
  siteTitle: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
  },
  mainContent: {
    padding: '2rem', 
    marginTop: '7rem'
    //textAlign: 'center', 
  },
  buttonContainer: {
    position: 'absolute', 
    top: '8rem', 
    right: '4rem', 
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1rem',
  },
  navList: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    fontFamily: 'Arial, sans-serif',
  },
  navListItem: {
    display: 'inline-block',
    marginLeft: '1rem',
  },
  aboutLink: {
    textDecoration: 'none',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    cursor: 'pointer', 
  },
  acceptanceReportLink: {
    textDecoration: 'underline',
    color: '#800080', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    display: 'block', 
    marginBottom: '1rem', 
  },
  reportDashboardTitle: {
    textDecoration: 'underline', 
    color: '#800080', 
    fontWeight: 'bold',
    fontSize: '1.5rem', 
    marginBottom: '1rem', 
    cursor: 'pointer', 
    textAlign: 'center',  
  }, 

  createSimulationLink: {
    textDecoration: 'none', 
    display: 'block', 
    width: 'fit-content',
},

}));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  height: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function LandingPage() {
  const classes = useStyles();
  const [filesPresent, setFilesPresent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/list-reports', { method: 'GET' });
      
        const data = await response.json();
        const batchFiles = data.reports.filter(file => file.filename.includes('Batch'));
        setFilesPresent(batchFiles.length > 0);
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
    };

    fetchData();
  }, []);

  const handleAccordionToggle = () => {
    console.log('Accordion toggled');
  };
  const [open, setOpen] = useState(false);

  return (
    <div className={classes.landingPage}>
      <nav className={classes.nav}>
        <a href="/" className={classes.siteTitle}>
          Drone World
        </a>
        <ul className={classes.navList}>
          <li className={classes.navListItem}>

            <Box component="span" onClick={handleAccordionToggle}>
              </Box>

            <Box component="span">
              <Button
                className={classes.aboutLink}
                onClick={() => setOpen(true)}
                style={{ color: '#fff' }}
              >
                About Us
              </Button>
            </Box>
          </li>
        </ul>
      </nav>
      <div className={classes.mainContent}>
  <Link to="/" div className={classes.buttonContainer} style = {{textDecoration: 'none', 
    }}>
    <Button
      variant="contained"
      sx={{
        color: 'white',
        padding: '15px 30px',
        borderRadius: '10px',
      }}
    > 
   
      Create Simulation 
    </Button>
  </Link>
  {filesPresent ? (
    <div onClick={handleAccordionToggle}>
      <h2 className={classes.reportDashboardTitle}>
        <Link to="/report-dashboard" className={classes.reportDashboardTitle}>
          <div style={{ textAlign: 'center' }}>
            {/* Content here */}
          </div>
        </Link>
      </h2>
      <ReportDashboard />
    </div>
  ) : (
    <div style={{ textAlign: 'center', color: '#4d4d4d' }}>
  <h2 style={{ fontSize: '2em' }}>Welcome to Drone World!</h2>
</div>
  )}
</div>


      {/* Main content area */}
      <div className={classes.mainContent} style={{ paddingTop: '9rem', color: '#333' }}>
       
        <div className={classes.buttonContainer}>
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
      </div>

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
    </div>
  );
}
