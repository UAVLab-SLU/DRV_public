import React, { useState } from 'react';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem } from '@mui/material';
import Select from '@mui/material/Select';
import { OutlinedInput } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DeleteOutline } from '@mui/icons-material';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';

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

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: '#F5F5DC',
    '& .MuiInputBase-input': {
        padding: '6px 8px',
        height: '1em',
    }
}));

const WindDirection = [
    { value: 'N', id: 5 },
    { value: 'S', id: 6 },
    { value: 'E', id: 7 },
    { value: 'W', id: 8 },
    { value: 'NE', id: 1 },
    { value: 'SE', id: 2 },
    { value: 'SW', id: 3 },
    { value: 'NW', id: 4 }
];

const WindType = [
    { value: "Constant Wind", id: 1 },
    { value: "Turbulent Wind", id: 2 },
];

const WindSettings = ({
    envConf, handleWindTypeChange, handleDirection, handleWindChange, handleFLuctuationChange,
    selectedWindType, fluctuationPercentage, windShears,
    setWindBlockData, deleteWindBlock
}) => {
    const classes = useStyles();
    const [windBlocks, setWindBlocks] = useState(() => {
        const storedWindBlocks = localStorage.getItem('windBlocks');
        return storedWindBlocks ? JSON.parse(storedWindBlocks) : [];
    });

    const renderSelectField = (label, value, onChange, options) => (
        <Grid item container alignItems="center" direction="row">
            <Grid item xs={4}>
                <InputLabel sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>{label}</InputLabel>
            </Grid>
            <Grid item xs={6}>
                <StyledSelect
                    value={value}
                    input={<OutlinedInput />}
                    MenuProps={{
                        sx: {
                            '& .MuiPaper-root': {
                                backgroundColor: '#F5F5DC',
                            }
                        }
                    }}
                    onChange={onChange}
                    fullWidth
                >
                    {options.map((val) => (
                        <MenuItem value={val.value} key={val.id}>
                            <em>{val.value}</em>
                        </MenuItem>
                    ))}
                </StyledSelect>
            </Grid>
        </Grid>
    );

    const renderTextField = (label, value, onChange, inputProps) => (
        <Grid item container alignItems="center" direction="row">
            <Grid item xs={4}>
                <InputLabel sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>{label}</InputLabel>
            </Grid>
            <Grid item xs={6}>
                <Tooltip title={`Enter ${label}`} placement='bottom'>
                    <TextField
                        sx={{
                            backgroundColor: '#F5F5DC',
                            '& .MuiOutlinedInput-root': {
                                '& .MuiInputBase-input': {
                                    padding: '6px 8px',
                                },
                            },
                        }}
                        variant="outlined"
                        type="number"
                        onChange={onChange}
                        value={value}
                        inputProps={inputProps}
                        fullWidth
                    />
                </Tooltip>
            </Grid>
        </Grid>
    );

    const addNewWindBlock = () => {
        const newWindBlock = {
            windType: selectedWindType,
            windDirection: envConf.Wind.Direction,
            windVelocity: envConf.Wind.Force,
            fluctuationPercentage: selectedWindType === "Turbulent Wind" ? fluctuationPercentage : 0,
        };
        const updatedWindBlocks = [...windBlocks, newWindBlock];
        setWindBlocks(updatedWindBlocks);
        localStorage.setItem('windBlocks', JSON.stringify(updatedWindBlocks));
    };

    setWindBlockData = (index, updatedData) => {
        const updatedWindBlocks = [...windBlocks];
        updatedWindBlocks[index] = { ...updatedWindBlocks[index], ...updatedData };
        setWindBlocks(updatedWindBlocks);
        localStorage.setItem('windBlocks', JSON.stringify(updatedWindBlocks));
    };

    deleteWindBlock = (index) => {
        const updatedWindBlocks = windBlocks.filter((_, i) => i !== index);
        setWindBlocks(updatedWindBlocks);
        localStorage.setItem('windBlocks', JSON.stringify(updatedWindBlocks));
    };

    return (
        <Grid container spacing={5} direction="column" classes={{ root: classes.transparentBackground }}>
            {windBlocks.map((windBlock, index) => (
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
                        <IconButton onClick={() => deleteWindBlock(index)}>
                            <DeleteOutline color="error" />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}

            <Grid item container xs={12}>
                <Grid xs={10}
                    classes={{ root: classes.backdropFilter }}
                    sx={{ border: '1px white solid', textAlign: 'center' }}>
                    <IconButton onClick={addNewWindBlock} color="warning">
                        <AddIcon /> Add Wind Source
                    </IconButton>
                </Grid>
            </Grid>
        </Grid>
    );
};

WindSettings.propTypes = {
    envConf: PropTypes.object.isRequired,
    handleWindTypeChange: PropTypes.func.isRequired,
    handleDirection: PropTypes.func.isRequired,
    handleWindChange: PropTypes.func.isRequired,
    handleFLuctuationChange: PropTypes.func.isRequired,
    selectedWindType: PropTypes.string.isRequired,
    fluctuationPercentage: PropTypes.number.isRequired,
    windShears: PropTypes.array.isRequired,
    setWindBlockData: PropTypes.func.isRequired,
    deleteWindBlock: PropTypes.func.isRequired
};

export default WindSettings;