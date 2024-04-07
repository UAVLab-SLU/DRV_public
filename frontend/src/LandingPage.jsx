//import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box'; 
import Button from '@mui/material/Button'; 
import ReportDashboard from './components/ReportDashboard';

const useStyles = makeStyles((theme) => ({
  landingPage: {
    fontFamily: 'Roboto, sans-serif',
    color: '#fff',
    //textAlign: 'center',
  }, 
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: '#0000CD', 
    fontFamily: 'Arial, sans-serif',
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
  },
  buttonContainer: {  
    position: 'absolute',
    marginTop: '5rem', 
    top: '1rem', 
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
   // backgroundColor: 'rgba(255,255,255,0.2)', 
    transition: 'background-color 0.3s ease', 
   // backgroundColor: '#87CEEB', 
  },
}));

export default function LandingPage() {
  const classes = useStyles();

  return (
    <div className={classes.landingPage}>
      <nav className={classes.nav}>
        <a href="/" className={classes.siteTitle}>
          Drone World
        </a>
        <ul className={classes.navList}>
          <li className={classes.navListItem}>
            <Box component="span">
              <Link to="/about" className={classes.aboutLink}>
                About Us
              </Link>
            </Box>
          </li>
        </ul>
      </nav>
      {/* Main content area */}
      <div className={classes.mainContent} style={{paddingTop: '9rem', color: '#333'}}>
       
        <div className={classes.buttonContainer} style={{ color: '#333', position: 'right'}}> 
        <Link to="/">
            <Button
             variant="contained"
              sx={{
                //backgroundColor: '#ADD8E6',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '10px', 
                textAlign: 'right' 
                //right: '15rem'
                //backgroundColor: '#87CEEB',
              }}
            > 
              Create Simulation
            </Button>
          </Link> 
          <h1>Report History:</h1> 

          <Link to= "/report-dashboard">
            <div
             
            >  
             {/* Contents of the LandingPage */}
            {/* Embed the ReportDashboard component */}
            <ReportDashboard />
           
            </div> 
          </Link>
        </div>
      </div>
    </div>
  );
}
