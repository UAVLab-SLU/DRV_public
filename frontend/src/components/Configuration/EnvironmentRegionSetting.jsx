import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import { StyledSelect } from '../../css/SimulationPageStyles';
import { ENVIRONMENT_ORIGINS, ENVIRONMENT_ORIGIN_VALUES } from '../../utils/const';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import PropTypes from 'prop-types';
<<<<<<< HEAD
import * as React from 'react';

=======
import TimeGridComponent from './TimeGridComponent';
>>>>>>> b41fb86ad170084ff643486329d30f99117f0626


const EnvironmentRegionSetting = ({ envConf, setEnvConf }) => {

<<<<<<< HEAD
    const pinImage = [
        { src: '/images/pin-icon.png'}
    ];
=======
>>>>>>> b41fb86ad170084ff643486329d30f99117f0626

    const handleRegionBasedPropSetting = (val) => {
        if (val.target.value != "Specify Region") {
            ENVIRONMENT_ORIGIN_VALUES.map(obj => {
                if (obj.value == val.target.value) {
<<<<<<< HEAD
                    envConf.setOriginLatitude(obj.Latitude);
                    envConf.setOriginLongitude(obj.Longitude);
                    envConf.setOriginRadius(obj.Radius);
                    envConf.setOriginHeight(obj.Height);
=======
                    envConf.setOriginLatitude(obj.latitude);
                    envConf.setOriginLongitude(obj.longitude);
                    envConf.setOriginHeight(obj.height);
>>>>>>> b41fb86ad170084ff643486329d30f99117f0626
                    envConf.setOriginName(obj.value);
                }
            })
        } else {
            envConf.setOriginLatitude(0);
            envConf.setOriginLongitude(0);
            envConf.setOriginRadius(0);
            envConf.setOriginHeight(0);
            envConf.setOriginName(val.target.value);
        }
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
        //viewerMaintainer.current = true;
    }

    const handleOriginChange = (val) => {

        let keys = Object.keys(val)

        if (val.target.id === "Latitude") {
            envConf.setOriginLatitude(parseFloat(val.target.value));
        } else if (val.target.id === "Longitude") {
            envConf.setOriginLongitude(parseFloat(val.target.value));
        } else if (val.target.id === "Height") {
            // future implementation
            envConf.setOriginHeight(parseFloat(val.target.value));
        } else if (val.target.id === "Radius") {
            envConf.setOriginRadius(parseFloat(val.target.value));
        }
        // viewerMaintainer.current = true;
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));

    }
    
    const handleDragStart = (event) => {
        const imgSrc = event.target.src;
        const dragData = {
            type: 'radius',
            src: imgSrc,
            radius: envConf.Origin.Radius || 0
        };
        
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    };


    return (
        <Grid container spacing={5} direction="column" >
            <Grid item xs={12}>
                <Grid container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="origin-label" sx={{ marginRight: 2, width: '200px', flexShrink: 0, color: '#F5F5DC' }}>Region</InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <StyledSelect
                            label="Region"
                            value={envConf.getOriginName()}
                            input={<OutlinedInput />}
                            MenuProps={{
                                sx: {
                                    '& .MuiPaper-root': {
                                        backgroundColor: '#F5F5DC',
                                    }
                                }
                            }}
                            onChange={handleRegionBasedPropSetting}
                            fullWidth
                        >
                            {ENVIRONMENT_ORIGINS.map((val) => {
                                return (<MenuItem value={val.value} key={val.id} >
                                    <em>{val.value}</em>
                                </MenuItem>)
                            })}
                        </StyledSelect>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Grid container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="latitude-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Latitude
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            sx={{
                                backgroundColor: '#F5F5DC',
                                '& .MuiOutlinedInput-root': {
                                    '& .MuiInputBase-input': {
                                        padding: '6px 8px',
                                    },
                                },
                            }}
                            id="Latitude"
                            variant="outlined"
                            type="number"
                            inputProps={{ step: ".0001" }}
                            onChange={handleOriginChange}
                            value={envConf.Origin.latitude}
                            disabled={envConf.Origin.Name == "Specify Region" ? false : true}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Grid container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="longitude-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Longitude
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            sx={{
                                backgroundColor: '#F5F5DC',
                                '& .MuiOutlinedInput-root': {
                                    '& .MuiInputBase-input': {
                                        padding: '6px 8px',
                                    },
                                },
                            }}
                            id="Longitude"
                            variant="outlined"
                            type="number"
                            inputProps={{ step: ".0001" }}
                            onChange={handleOriginChange}
                            value={envConf.Origin.longitude}
                            disabled={envConf.Origin.Name == "Specify Region" ? false : true}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Grid container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="radius-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Enter radius (miles)
                        </InputLabel>
                    </Grid>
                    <Grid item xs={5}>
                        <TextField
                            sx={{
                                backgroundColor: '#F5F5DC',
                                '& .MuiOutlinedInput-root': {
                                    '& .MuiInputBase-Input': {
                                        padding: '6px 8px',
                                    },
                                },
                            }}
                            id="Radius"
                            variant="outlined"
                            type="number"
                            inputProps={{ step: "0.1", min: "0" }}
                            onChange={handleOriginChange}
                            value={envConf.Origin.Radius === 0 || envConf.Origin.Radius === '' ? '' : envConf.Origin.Radius}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={1}>
                        <img
                            src={pinImage[0].src}
                            alt="Draggable Icon"
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e)}
                            style={{ width: 40, cursor: 'grab', marginRight: 20 }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Grid container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="time-of-day-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Time of day
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        {/* <Tooltip title="Enter time of day (24 Hours Format)" placement='bottom'> */}
                        <TimeGridComponent envConf={envConf} setEnvConf={setEnvConf} />
                        {/* </Tooltip> */}
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}

EnvironmentRegionSetting.propTypes = {
    envConf: PropTypes.object.isRequired,
    setEnvConf: PropTypes.func.isRequired,
};

export default EnvironmentRegionSetting;