//import * as React from 'react' 
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { AccordionSummary, Tab, Tabs } from '@mui/material';
import dayjs from 'dayjs';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import styled from '@emotion/styled';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails'
import { makeStyles } from '@mui/styles';
import {ExpandMore} from '@mui/icons-material';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField'
import WindSettings from './WindSettings';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';
import EnvironmentRegionSetting from './EnvironmentRegionSetting';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        padding: '5px'
    },
    transparentBackground: {
        backgroundColor: 'transparent !important'
    },
    backdropFilter: {
        backgroundColor: '#75531E',
        '-webkitBackdropFilter': 'sepia(100%)',
        backdropFilter: 'sepia(100%)',
    }
}));

export default function EnvironmentConfiguration(env) {
    console.log('env', env);
    // Start of Model
    const [selectedTab, setSelectedTab] = useState(0);
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

    // SADE AREA //
    const classes = useStyles();

    const [sadeCount, setSadeCount] = React.useState(mainJSON.Sades != null ? mainJSON.Sades.length: 1);
    const [sadeArray, setSadeArray] = React.useState(mainJSON.Sades != null ? mainJSON.Sades : [{
        id:sadeCount-1,
        sadeName: "SADE " + sadeCount,
        Name:"SADE " + (sadeCount)
    }]);
    
    const setSade = () => {
        const newSade = {
            id: sadeCount,
            sadeName: "SADE " + (sadeCount+1),
            Name: "SADE " + (sadeCount+1)
        };
        setSadeArray(prevArray => [...prevArray, newSade]);
    };

    const popSade = () =>{
        sadeArray.pop();
    };
    
    const handleIncrement = () => {
        setSadeCount(sadeCount +1);
        setSade();
    };
    
    const handleDecrement = () => {
        setSadeCount(sadeCount -1);
        popSade();
    };
    
    const handleChange = (e, index) => {
        const{id, value, type} = e.target;
        setSadeArray(prevState => prevState.map((sade, i) => {
            if (index === i){
                return{...sade, [id] : type === "number" ? parseFloat(value) : value};
            }
            return sade;
        }));
    };

    const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
        marginRight: 2,
        marginLeft: 20,
        flexShrink: 0,
        color: '#FFFFFF',
        width: '200px',
        fontSize: '1.2rem', fontFamily: 'Roboto, sans-serif',
    }));

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

                    {/*SADE Field*/}
                {selectedTab === 2 && (
                    <Grid container direction="column" style={{padding: '12px', color:'#F5F5F5'}}>
                        <Grid item>
                            <strong>Configure SADE in your scenario</strong>
                        </Grid>
                    <Grid container  direction="row" alignItems="center" justifyContent="flex-end" style={{padding: '10px 0', fontSize:'18px', color: '#F5F5DC' }}>
                        <Grid item>
                            Number of SADEs &nbsp;&nbsp;
                            <ButtonGroup size="small" aria-label="small outlined button group" color="warning">
                                {sadeCount > 1 && <Button style={{fontSize:'15px'}} onClick={handleDecrement}>-</Button>}
                                {sadeCount && <Button style={{fontSize:'15px'}} variant="contained" color="warning">{sadeCount}</Button>}
                                <Button style={{fontSize:'15px'}} onClick={handleIncrement} disabled={sadeCount===10}>+</Button>
                            </ButtonGroup>
                        </Grid>
                    </Grid>

                    {sadeArray.map((sade, index) => (
                        <Accordion key={index} classes={{root:classes.transparentBackground}}>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                                sx={{backgroundColor: '#643E05'}}
                            >
                                <Box sx={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
                                    <Typography variant="h5" sx={{color:'#F5F5F5', pb:1}}>
                                        {sade.sadeName}
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{backgroundColor:'#75531E47'}}>
                                <Grid container spacing={2}>
                                    {[
                                        {label:'Name', key:'sadeName', type:'text'},
                                        {label:'Height', key:'height', type:'number'},
                                        {label:'Latitude 1', key:'latitude1', type:'number'},
                                         {label:'Longitude 1', key:'longitude1', type:'number'},
                                        {label:'Latitude 2', key:'latitude2', type:'number'},
                                        {label:'Longitude 2', key:'longitude2', type:'number'},
                                        {label:'Latitude 3', key:'latitude3', type:'number'},
                                        {label:'Longitude 3', key:'longitude3', type:'number'},
                                        {label:'Latitude 4', key:'latitude4', type:'number'},
                                        {label:'Longitude 4', key:'longitude4', type:'number'},
                                    ].map((field, i) => (
                                        <Grid item xs={6} key={i}>
                                            <StyledInputLabel id={field.key}>{field.label}</StyledInputLabel>
                                            <TextField
                                                sx={{
                                                    backgroundColor:'#71665E',
                                                    '& .MuiOutlinedInput-root': {
                                                        '& .MuiInputBase-input': {
                                                            padding: '6px 8px',
                                                            fontSize: '1.2rem',
                                                        },
                                                    },
                                                }}
                                                id={field.key}
                                                type={field.type}
                                                variant="outlined"
                                                onChange={(e) => handleChange(e, index)}
                                                value={sade[field.key] || ''}
                                                fullWidth
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Grid>
                )}
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