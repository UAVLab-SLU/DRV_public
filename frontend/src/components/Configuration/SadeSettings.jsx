import React, { useEffect, useState } from 'react';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem } from '@mui/material';
import { AccordionStyled, StyledInputLabel } from '../../css/SimulationPageStyles';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import {ExpandMore} from '@mui/icons-material';
import { SadeModel } from '../../model/SadeModel';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import PropTypes from 'prop-types';

const SadeSettings = ( {envConf, setEnvConf} ) => {

    const handleIncrement = () => {
        let newSade = new SadeModel();
        newSade.sadeName = `SADE ${envConf.getAllSades().length+1}`;
        newSade.Name = newSade.sadeName;
        envConf.addNewSade(newSade);
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    }

    const handleDecrement = () => {
        envConf.popLastSade();
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    }

    const handleChange = (e, index) => {
        const {id, value, type} = e.target;
        let sade = envConf.getSadeBasedOnIndex(index);
        if(id === "sadeName"){
            sade.sadeName = value;
        } else if(id === "height") {
            sade.height = parseFloat(value);
        } else if(id === "latitude1") {
            sade.latitude1 = parseFloat(value);
        } else if(id === "longitude1") {
            sade.longitude1 = parseFloat(value);
        } else if(id === "latitude2") {
            sade.latitude2 = parseFloat(value);
        } else if(id === "longitude2") {
            sade.longitude2 = parseFloat(value);
        } else if(id === "latitude3") {
            sade.latitude3 = parseFloat(value);
        } else if(id === "longitude3") {
            sade.longitude3 = parseFloat(value);
        } else if(id === "latitude4") {
            sade.latitude4 = parseFloat(value);
        } else if(id === "longitude4") {
            sade.longitude4 = parseFloat(value);
        }
        envConf.updateSadeBasedOnIndex(index, sade);
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    }

    return (
        <Grid container direction="column" style={{ padding: '12px', color: '#F5F5F5' }}>
            <Grid item>
                <strong>Configure SADE in your scenario</strong>
            </Grid>
            <Grid container direction="row" alignItems="center" justifyContent="flex-end" style={{ padding: '10px 0', fontSize: '18px', color: '#F5F5DC' }}>
                <Grid item>
                    Number of SADEs &nbsp;&nbsp;
                    <ButtonGroup size="small" aria-label="small outlined button group" color="warning">
                        {envConf.getAllSades().length > 1 && <Button style={{ fontSize: '15px' }} onClick={handleDecrement}>-</Button>}
                        {envConf.getAllSades().length && <Button style={{ fontSize: '15px' }} variant="contained" color="warning">{envConf.getAllSades().length}</Button>}
                        <Button style={{ fontSize: '15px' }} onClick={handleIncrement} disabled={envConf.getAllSades().length === 10}>+</Button>
                    </ButtonGroup>
                </Grid>
            </Grid>

            {envConf.getAllSades()?.map((sade, index) => (
                <AccordionStyled key={index}>
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                        sx={{ backgroundColor: '#643E05' }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="h5" sx={{ color: '#F5F5F5', pb: 1 }}>
                                {sade.sadeName}
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#75531E47' }}>
                        <Grid container spacing={2}>
                            {[
                                { label: 'Name', key: 'sadeName', type: 'text' },
                                { label: 'Height', key: 'height', type: 'number' },
                                { label: 'Latitude 1', key: 'latitude1', type: 'number' },
                                { label: 'Longitude 1', key: 'longitude1', type: 'number' },
                                { label: 'Latitude 2', key: 'latitude2', type: 'number' },
                                { label: 'Longitude 2', key: 'longitude2', type: 'number' },
                                { label: 'Latitude 3', key: 'latitude3', type: 'number' },
                                { label: 'Longitude 3', key: 'longitude3', type: 'number' },
                                { label: 'Latitude 4', key: 'latitude4', type: 'number' },
                                { label: 'Longitude 4', key: 'longitude4', type: 'number' },
                            ].map((field, i) => (
                                <Grid item xs={6} key={i}>
                                    <StyledInputLabel id={field.key}>{field.label}</StyledInputLabel>
                                    <TextField
                                        sx={{
                                            backgroundColor: '#71665E',
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
                </AccordionStyled>
            ))}
        </Grid>
    );

}

SadeSettings.propTypes = {
    envConf: PropTypes.object.isRequired,
    setEnvConf: PropTypes.func.isRequired,
};

export default SadeSettings;


