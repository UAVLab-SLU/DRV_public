import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box'; // Import Box component
import Button from '@mui/material/Button';

const useStyles = makeStyles((theme) => ({
  landingPage: {
    fontFamily: 'Roboto, sans-serif',
    color: '#fff',
    textAlign: 'center',
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
 // buttonContainer: {
   // marginTop: '2rem',
  //},
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
   // backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent white
    transition: 'background-color 0.3s ease', // Smooth transition
   // backgroundColor: '#87CEEB', // Lighter background on hover
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
        <h1>Welcome to Drone World!</h1>
        <div className={classes.buttonContainer}>
          <Link to="/home">
            <Button
             variant="contained"
              sx={{
                //backgroundColor: '#ADD8E6',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '10px',
                //backgroundColor: '#87CEEB',
                
              }}
            >
              Create Simulation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
