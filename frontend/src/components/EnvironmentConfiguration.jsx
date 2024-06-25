// EnvironmentConfiguration.jsx
import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Snackbar, Alert, TextField } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Wind from './Wind';
import Region from './Region';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Tab, Tabs, Select } from '@mui/material';

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 20,
    marginBottom: 8,
    padding: '5px',
    minHeight: '15px',
    minWidth: '10px',
    color: '#8B4513', // Shade of brown
    backgroundColor: '#F5F5DC', // Beige background
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
        backgroundColor: '#DEB887', // Light brown when hovered
        color: '#FFFFFF',
    },
    '&.Mui-selected': {
        backgroundColor: '#A0522D', // Darker brown when selected
        color: '#FFFFFF',
        borderRight: '5px solid #FFB500',
    },
  }));
  
const StyledTabs = styled(Tabs)({
    minHeight: '30px',
    '.MuiTabs-indicator': {
        display: 'none', // Hides the default underline indicator
    },
});

function EnvironmentConfiguration({ mainJsonValue, environmentJson, id }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const [lastDroppedLocation, setLastDroppedLocation] = useState(null);

  const [envConf, setEnvConf] = useState(mainJsonValue.environment || {
    enableFuzzy: false,
    Wind: [],
    Origin: {
      Latitude: 41.980381,
      Longitude: -87.934524,
    },
    TimeOfDay: "10:00:00",
    UseGeo: true,
    time: dayjs('2020-01-01 10:00')
  });

  useEffect(() => {
    environmentJson(envConf, id);
  }, [envConf]);

  const handleTabChange = (event, newValue) => setSelectedTab(newValue);

  const handleTimeChange = (newTime) => {
    setEnvConf(prev => ({
      ...prev,
      time: newTime,
      TimeOfDay: newTime.format('HH:mm:ss')
    }));
  };

  const showSnackBar = (message) => {
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  };



  return (
    <div>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackBarOpen(false)} severity="info">
          {snackBarMessage}
        </Alert>
      </Snackbar>

      <Grid container spacing={2} sx={{ width: '100%', padding: '2vw' }}>
        <Grid item xs={3}>
          <StyledTabs
            orientation="vertical"
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="Vertical Configuration Tabs"
          >
            <StyledTab label="Region" />
            <StyledTab label="Wind" />
            <StyledTab label="SADE" />
          </StyledTabs>
        </Grid>

        <Grid item xs={9} sx={{ maxHeight: '65vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
          {selectedTab === 0 && (
            <>
              <Region 
                envConf={envConf} 
                setEnvConf={setEnvConf} 
                lastDroppedLocation={lastDroppedLocation}
              />
              <Box mt={2}>
                <Grid container alignItems="center">
                  <Grid item xs={4}>
                    <Typography sx={{ color: '#F5F5DC' }}>Time of day</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        ampm={false}
                        openTo="hours"
                        views={['hours', 'minutes', 'seconds']}
                        inputFormat="HH:mm:ss"
                        mask="__:__:__"
                        value={envConf.time}
                        onChange={handleTimeChange}
                        renderInput={(params) => <Box sx={{ backgroundColor: '#F5F5DC' }}><TextField {...params} /></Box>}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {selectedTab === 1 && (
            <Wind
                envConf={envConf}
                setEnvConf={setEnvConf}
                showSnackBar={showSnackBar}
                windBlocks={envConf.Wind || []}  // Ensure this prop is passed
                updateWindBlocks={(newWindBlocks) => setEnvConf(prev => ({ ...prev, Wind: newWindBlocks }))}
            />
          )}

          {selectedTab === 2 && <></>}
        </Grid>
      </Grid>
    </div>
  );
}

EnvironmentConfiguration.propTypes = {
    mainJsonValue: PropTypes.object,
    environmentJson: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
};

export default EnvironmentConfiguration;