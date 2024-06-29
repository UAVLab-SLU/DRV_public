import React, { useEffect, useState } from 'react';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem } from '@mui/material';
import Select from '@mui/material/Select';
import { OutlinedInput } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DeleteOutline } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { styled as makeStyles } from '@mui/system';

import { WindDirection, WindType } from '../../utils/const';
import { renderSelectField, renderTextField } from '../../utils/SimulationPageUtils';
import { WindModel } from '../../model/WindModel';
import { EnvironmentModel } from '../../model/EnvironmentModel';

const useStyles = makeStyles((theme) => ({
    transparentBackground: {
        backgroundColor: 'transparent !important'
    },
    backdropFilter: {
        backgroundColor: '#14151471',
        '-webkitBackdropFilter': 'sepia(100%)',
        backdropFilter: 'sepia(100%)',
    }
}));


const WindSettings = ({ envConf, setEnvConf }) => {
    const classes = useStyles();

    const addNewWindBlock = () => {
        let newWindBlock = new WindModel();
        envConf.addNewWind(newWindBlock);
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    };

    const setWindBlockData = (index, updatedData) => {
        let wind = envConf.getWindBasedOnIndex(index);
        wind.windType = updatedData.windType ? updatedData.windType : wind.windType;
        wind.windDirection = updatedData.windDirection ? updatedData.windDirection : wind.windDirection;
        wind.windVelocity = updatedData.windVelocity ? updatedData.windVelocity : wind.windVelocity;
        wind.fluctuationPercentage = updatedData.fluctuationPercentage ? updatedData.fluctuationPercentage : wind.fluctuationPercentage;
        envConf.updateWindBasedOnIndex(index, wind);
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    };

    const performWindDelete = (index) => {
        envConf.deleteWindBasedOnIndex(index)
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    } 

    return (
        <Grid container spacing={5} direction="column" classes={{ root: classes.transparentBackground }}>
            {envConf.Wind.map((windBlock, index) => (
                <Grid item container spacing={2} xs={12} classes={{ root: classes.backdropFilter }} key={index}>
                    {renderSelectField("Wind Type", windBlock.windType, (e) =>
                        setWindBlockData(index, { windType: e.target.value }), WindType)}
                    {renderSelectField("Wind Direction", windBlock.windDirection, (e) =>
                        setWindBlockData(index, { windDirection: e.target.value }), WindDirection)}
                    {renderTextField("Wind Velocity (m/s)", windBlock.windVelocity, (e) =>
                        setWindBlockData(index, { windVelocity: e.target.value }), { min: 0 })}

                    {(windBlock.windType === "Turbulent Wind") && (
                        renderTextField("Fluctuation %", windBlock.fluctuationPercentage, (e) =>
                            setWindBlockData(index, { fluctuationPercentage: e.target.value }), { min: 0, max: 100, step: 0.1 })
                    )}

                    <Grid item xs={12}>
                        <IconButton onClick={() => performWindDelete(index)}>
                            <DeleteOutline color="error" />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}

            <Grid item container xs={12}>
                <Grid xs={10}
                    classes={{ root: classes.backdropFilter }}
                    sx={{ border: '1px white solid', textAlign: 'center' }}>
                    <IconButton
                        onClick={addNewWindBlock}
                        color="warning"
                        sx={{
                            fontSize: '1.10rem', // Reduces font size 
                            '& .MuiSvgIcon-root': {
                                fontSize: '1rem' // Reduces icon size
                            },
                            padding: '4px' // Reduces padding around the button
                        }}
                    >
                        <AddIcon /> Add Wind Source
                    </IconButton>
                </Grid>
            </Grid>
        </Grid>
    );
};

WindSettings.propTypes = {
    envConf: PropTypes.object.isRequired,
    setEnvConf: PropTypes.func.isRequired,
};

export default WindSettings;