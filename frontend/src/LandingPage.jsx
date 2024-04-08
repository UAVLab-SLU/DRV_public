import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ReportDashboard from './components/ReportDashboard';

const useStyles = makeStyles((theme) => ({
  landingPage: {
    fontFamily: 'Roboto, sans-serif',
    color: '#fff',
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
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1rem',
    marginRight: '1.6rem',
    top: '1rem'
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
  },
}));

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
      <div className={classes.mainContent}>
        <div className={classes.buttonContainer}>
          <Link to="/">
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
        </div>
        <h1 style={{ marginTop: '3rem' }}></h1>
        {filesPresent ? (
          <Link to="/report-dashboard">
            <div>
              <ReportDashboard />
            </div>
          </Link>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2>No batch files present in the report dashboard</h2>
          </div>
        )}
      </div>
    </div>
  );
}
