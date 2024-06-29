//import * as React from 'react' 
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { Tab, Tabs } from '@mui/material';
import dayjs from 'dayjs';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import styled from '@emotion/styled';
import WindSettings from './WindSettings';

import { EnvironmentModel } from '../../model/EnvironmentModel';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';
import EnvironmentRegionSetting from './EnvironmentRegionSetting';

export default function EnvironmentConfiguration(env) {

    // Start of Model
    const [selectedTab, setSelectedTab] = useState(1);
    const [backendInfo, setBackendInfo] = useState({
        numQueuedTasks: 0,
        backendStatus: 'idle'
    });

    const getStatusStyle = () => {
        switch (backendInfo.backendStatus) {
            case 'idle':
                return { color: 'green' }; // Green color and a checkmark icon
            case 'running':
                return { color: 'blue' }; // Blue color and a rotating arrow icon
            case 'error':
                return { color: 'red' }; // Red color and a cross icon
            default:
                return { color: 'gray' }; // Gray color and an information 
        }
    };

    const statusStyle = getStatusStyle();

    const YOUR_API_KEY = "AIzaSyAh_7ie16ikloOrjqURycdAan3INZ1qgiQ"

    // const onMapClick = (e) => {
    //     setCurrentPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    //     setEnvConf(prevState => ({
    //         ...prevState,
    //         Origin: {
    //             ...prevState.Origin,
    //             Latitude: e.latLng.lat(),
    //             Longitude: e.latLng.lng()
    //         }
    //     }))

    // }

    const prepareEnvironment = () => {
        let model = new EnvironmentModel();
        model.enableFuzzy = false;
        model.timeOfDayFuzzy = false;
        model.positionFuzzy = false;
        model.setOriginLatitude(41.980381);
        model.setOriginLongitude(-87.934524);
        model.TimeOfDay = "10:00:00";
        model.UseGeo = true;
        model.time = dayjs('2020-01-01 10:00');
        return model
    }

    // const [envConf, setEnvConf] = useState(prepareEnvironment());

    const envConf = env.environmentJSON;
    const setEnvConf = env.environemntJSONSetState;
    const mainJSON = env.mainJSON;
    const setMainJSONState = env.mainJSONSetState;

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };
    
    
    //new added
    // React.useEffect(() => {
    //     setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    //     setMainJSONState(SimulationConfigurationModel.getReactStateBasedUpdate(mainJSON));
    // }, [envConf])
    

    const [fuzzyAlert, setFuzzyAlert] = React.useState(false);
    const [snackBarState, setSnackBarState] = React.useState({
        open: false,
    });


    const handleSnackBarVisibility = (val) => {
        setSnackBarState(prevState => ({
            ...prevState,
            open: val
        }))
    }

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

    return (
        <div>
            <Snackbar open={snackBarState.open}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                autoHideDuration={6000} onClose={e => handleSnackBarVisibility(false)}>
                <Alert onClose={e => handleSnackBarVisibility(false)} severity="info" sx={{ width: '100%' }}>
                    {fuzzyAlert ? "Fuzzy Testing Changes is under development !" : "Wind Type Changes is under Developement !"}
                </Alert>
            </Snackbar>

            <Grid container spacing={2}
                sx={{ width: '100%', paddingBottom: 5, paddingTop: 4, paddingLeft: 2 }}>
                <Grid item xs={3}>
                    <StyledTabs
                        orientation="vertical"
                        value={selectedTab}
                        onChange={handleTabChange}
                        aria-label="Vertical Configuration Tabs"
                        sx={{ borderRight: 1, borderColor: 'divider' }}
                    >
                        <StyledTab label="Region" />
                        <StyledTab label="Wind" />
                        <StyledTab label="SADE" />
                    </StyledTabs>
                </Grid>

                <Grid item xs={9}
                    sx={{
                        maxHeight: '65vh',
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            display: 'none'  // This hides the scrollbar in Webkit browsers
                        },
                        scrollbarWidth: 'none',  // This hides the scrollbar in Firefox
                        msOverflowStyle: 'none'  // This hides the scrollbar in Internet Explorer
                    }}
                >
                    {selectedTab === 1 && (
                        <WindSettings
                            envConf={envConf}
                            setEnvConf={setEnvConf}
                        />
                    )}

                    {selectedTab === 0 && (
                        <EnvironmentRegionSetting
                            envConf={envConf}
                            setEnvConf={setEnvConf}
                        />
                    )}

                    {selectedTab === 2 &&
                        <></>
                    }
                </Grid>
            </Grid>

            <Typography
                // animate
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                }}
            >
            </Typography>
            <Box mb={2}> </Box>
            <Typography
                variant="h6"
                sx={{
                    opacity: 0,
                    transition: 'opacity 0.5s ease-in-out'
                }}
            >
                {backendInfo.backendStatus}
            </Typography>
        </div>
    )
}