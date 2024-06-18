import React from 'react';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem, Button } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { OutlinedInput } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DeleteOutline } from '@mui/icons-material';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
// import "../styles/MissionConfiguration.css";

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

const WindSettings = ({envConf, handleWindTypeChange, handleDirection, handleWindChange, handleFLuctuationChange,
    selectedWindType, fluctuationPercentage, windShears, addNewWindShear, 
    windShearData, setWindShearData, deleteWindShear}
) => {
    const classes = useStyles();
    const WindDirection = [
        {value:'N', id:5},
        {value:'S', id:6},
        {value:'E', id:7},
        {value:'W', id:8},
        {value:'NE', id:1},
        {value:'SE', id:2},
        {value:'SW', id:3},
        {value:'NW', id:4}
    ];

    const WindType = [
        { value: "Constant Wind", id: 1 },
        { value: "Turbulent Wind", id: 2 },
        { value: "Wind Shear", id: 3 },
    ]

    const StyledSelect = styled(Select)(({ theme }) => ({
        backgroundColor: '#F5F5DC',
            '& .MuiInputBase-input': {
                padding: '6px 8px',
                height: '1em',
            } 
    }));

    return (
        <Grid container spacing={5} direction="column" classes={{ root: classes.transparentBackground }} >
            <Grid item container spacing={2} xs={12} classes={{ root: classes.backdropFilter, zIndex: 2 }} >
                <Grid item container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="WindType" sx={{ marginRight: 2, width: '200px', flexShrink: 0, color: '#F5F5DC' }}>Wind Type</InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <StyledSelect
                            value={selectedWindType}
                            input={<OutlinedInput/>}
                            MenuProps= {{
                                sx: {
                                    '& .MuiPaper-root': {
                                        backgroundColor: '#F5F5DC',
                                    }
                                }
                            }}
                            onChange={handleWindTypeChange}
                            fullWidth
                            >
                            {WindType.map((val) => (
                                <MenuItem value={val.value} key={val.id}>
                                    <em>{val.value}</em>
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </Grid>
                </Grid>

                <Grid item container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="direction-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Wind Direction
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <StyledSelect
                            labelId="direction-label"
                            input={<OutlinedInput/>}
                            MenuProps= {{
                                sx: {
                                    '& .MuiPaper-root': {
                                        backgroundColor: '#F5F5DC',
                                    }
                                }
                            }}
                            value={envConf.Wind.Direction}
                            onChange={handleDirection}
                            fullWidth
                            >
                            {WindDirection.map((val) => (
                            <MenuItem value={val.value} key={val.id}>
                                <em>{val.value}</em>
                            </MenuItem>
                            ))}
                        </StyledSelect>
                    </Grid>
                </Grid>

            {/* WIND ORIGIN DROP DOWN */}
            {/* <Grid item xs={3}> */} 
                {/*<FormControl variant="standard" sx={{ minWidth: 150 }}>*/}
                    {/*<InputLabel id="WindOrigin">Wind Origin</InputLabel>*/}
                        {/*<Select*/}
                        {/* label="Wind Origin"*/}
                            {/*value={selectedWindOrigin}*/}
                        {/* onChange={handleWindOriginChange}>*/}
                        {/*{WindOrigin.map(function (val) {*/}
                            {/*return (*/}
                            {/* <MenuItem value={val.value} key={val.id}>*/}
                            {/*     <em>{val.value}</em>*/}
                            {/* </MenuItem>)*/}
                            {/* })}*/}
                {/* </Select>*/}
                {/*</FormControl>*/}
            {/*</Grid>*/}
        
                <Grid item container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="velocity-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Wind Velocity (m/s)
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <Tooltip title="Enter Wind Velocity in Meters per second" placement='bottom'>
                            <TextField
                                sx = {{
                                    backgroundColor: '#F5F5DC',
                                    '& .MuiOutlinedInput-root': {
                                        '& .MuiInputBase-input': {
                                            padding: '6px 8px',
                                        },
                                    },
                                }}
                                id="Force"
                                variant="outlined"
                                type="number"
                                onChange={handleWindChange}
                                value={envConf.Wind.Force}
                                inputProps={{ min: 0 }}
                                fullWidth
                            />
                        </Tooltip>
                    </Grid>
                </Grid>

            {(selectedWindType === "Turbulent Wind" || selectedWindType === "Wind Shear")  && (
                    <Grid item container alignItems="center" direction="row">
                        <Grid item xs={4}>
                            <InputLabel id="fluctuation-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                                Fluctuation %
                            </InputLabel>
                        </Grid>
                        <Grid item xs={6}>
                            <Tooltip title="Enter Fluctuation %" placement='bottom'>
                                <TextField id="Fluctuation %" fullWidth
                                    variant="outlined" 
                                    type="number"
                                    sx = {{
                                        backgroundColor: '#F5F5DC',
                                        '& .MuiOutlinedInput-root': {
                                            '& .MuiInputBase-input': {
                                                padding: '6px 8px',
                                            },
                                        },
                                    }}
                                    onChange={handleFLuctuationChange} 
                                    value={fluctuationPercentage} 
                                    inputProps={{ min: 0, 
                                        max: 100, 
                                        step: 0.1 
                                    }} 
                                />
                            </Tooltip>
                        </Grid>
                    </Grid>
            )}
            </Grid>

            {(windShears.length<2 && selectedWindType === "Wind Shear") ? (
            <Grid item container xs={12} ><Grid xs={10} 
            classes={{ root: classes.backdropFilter }}
            // className="drone-accordion-details" 
            sx={{border: '1px white solid', textAlign: 'center'}}><IconButton onClick={addNewWindShear} color="warning">
                <AddIcon />
            </IconButton> </Grid></Grid>) : null} 

            {/* WIND SHEAR WINDOW */}
            {/* <Dialog open={isAddWindShearOpen} close = {closeAddWindShearWindow} disableBackdropClick={true} disableEscapeKeyDown={true}>
                <DialogTitle>Enter Wind Shear Data</DialogTitle>
                <DialogContent>
                    <Grid container spacing={5} direction="row" >
                        <Grid item xs={3}>
                            <FormControl variant="standard" sx={{ minWidth: 130 }}>
                                <InputLabel id="WindDirection">Wind Direction</InputLabel>
                                    <Select
                                        labelId="WindDirection"
                                        label="Wind Direction"
                                        value={windShearData.windDirection}
                                        onChange={(e) =>
                                        setWindShearData({
                                            ...windShearData,
                                            windDirection: e.target.value,
                                            })}>
                                        
                                        {Direction.map(function (val) {
                                            return (
                                                <MenuItem value={val.value} key={val.id}>
                                                {val.value}
                                            </MenuItem>
                                            );
                                        })}
                                    </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                        <TextField
                            label="Wind Velocity (m/s)"
                            type="number"
                            value={windShearData.windVelocity}
                            variant="standard"
                            onChange={(e) =>
                                setWindShearData({
                                ...windShearData,
                                windVelocity: e.target.value,
                                })
                            }
                            inputProps = {{min:0}}
                            fullWidth
                            size="large" 
                            style={{ width: '120%' }}/>
                        </Grid>
                        <Grid item xs={3}>
                    
                        <TextField
                            label="Fluctuation %"
                            type="number"
                            variant="standard"
                            value={windShearData.fluctuationPercentage}
                                onChange={(e) =>
                                setWindShearData({
                                ...windShearData,
                                fluctuationPercentage: e.target.value,
                                })
                            }
                            fullWidth
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            size="medium" 
                            style={{ width: '120%' }}/>
                        </Grid>
                        <Grid item xs = {3}>
                            <IconButton onClick={addNewWindShear} color="primary">
                                <AddIcon />
                            </IconButton>
                        </Grid>

                        {/* Display wind shear instances in the dialog */}
                        {/* {windShears.map((shear, index) => ( 
                                <Grid item xs={12} key={index}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <ul style={{ flex: '1', marginRight: '10px' }}>
                                            <li>
                                                Direction: {shear.windDirection}, Velocity: {shear.windVelocity}, Fluctuation %: {shear.fluctuationPercentage}
                                            </li>
                                        </ul>
                                        <IconButton onClick={() => deleteWindShear(index)} color="blue">
                                            <CloseIcon />
                                        </IconButton>
                                    </div>
                                </Grid>
                        ))}

                        <Grid item xs = {3}>
                            <Button onClick={closeAddWindShearWindow}>Save</Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog> */}
            
            {selectedWindType === "Wind Shear" &&  windShears.map((shear, index) => ((
            <React.Fragment key={index}>
                <Grid item container spacing={2} xs={12} classes={{ root: classes.backdropFilter }} >
                <Grid item container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="direction-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Wind Direction
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <StyledSelect fullWidth
                            labelId="direction-label"
                            input={<OutlinedInput/>}
                            MenuProps= {{
                                sx: {
                                    '& .MuiPaper-root': {
                                        backgroundColor: '#F5F5DC',
                                    }
                                }
                            }}
                            value={windShearData.windDirection}
                            onChange={(e) =>
                            setWindShearData({
                                ...windShearData,
                                windDirection: e.target.value,
                                })}>
                            
                            {WindDirection.map(function (val) {
                                return (
                                    <MenuItem value={val.value} key={val.id}>
                                    {val.value}
                                </MenuItem>
                                );
                            })}
                        </StyledSelect>
                    </Grid>
                </Grid>
            
                <Grid item container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="velocity-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Wind Velocity (m/s)
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <Tooltip title="Enter Wind Velocity in Meters per second" placement='bottom'>
                            <TextField id="Force" fullWidth
                                variant="outlined" type="number" 
                                value={windShearData.windVelocity}
                                sx = {{
                                    backgroundColor: '#F5F5DC',
                                    '& .MuiOutlinedInput-root': {
                                        '& .MuiInputBase-input': {
                                            padding: '6px 8px',
                                        },
                                    },
                                }}
                                onChange={(e) =>
                                    setWindShearData({
                                    ...windShearData,
                                    windVelocity: e.target.value,
                                    })
                                }
                                inputProps={{ min: 0 }}/>
                        </Tooltip>
                    </Grid>
                </Grid>
                        
                <Grid item container alignItems="center" direction="row">
                    <Grid item xs={4}>
                        <InputLabel id="fluctuation-label" sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}>
                            Fluctuation %
                        </InputLabel>
                    </Grid>
                    <Grid item xs={6}>
                        <Tooltip title="Enter Fluctuation %" placement='bottom'>
                            <TextField id="Fluctuation %" fullWidth
                                variant="outlined" 
                                type="number" 
                                value={windShearData.fluctuationPercentage}
                                sx = {{
                                    backgroundColor: '#F5F5DC',
                                    '& .MuiOutlinedInput-root': {
                                        '& .MuiInputBase-input': {
                                            padding: '6px 8px',
                                        },
                                    },
                                }}
                                onChange={(e) =>
                                    setWindShearData({
                                    ...windShearData,
                                    fluctuationPercentage: e.target.value,
                                    })
                                }
                                inputProps={{ min: 0, max: 100, step: 0.1 }} 
                            />
                        </Tooltip>
                    </Grid>
                </Grid>

            <Grid item xs={12}>
            <IconButton onClick={() => deleteWindShear(index)}>
                    <DeleteOutline color="error"/>
                </IconButton>
            </Grid> 
            </Grid>     
            </React.Fragment> 

            // <Grid item xs={3} sx={{ marginTop: '10px' }}>
            //     <Button onClick={() => openAddWindShearWindow()}> Click to Enter Wind Shear Information</Button>
            // </Grid>
            )))}
        </Grid>
    )
}

WindSettings.propTypes = {
    envConf: PropTypes.object.isRequired,
    handleWindTypeChange: PropTypes.func.isRequired,
    handleDirection: PropTypes.func.isRequired,
    handleWindChange: PropTypes.func.isRequired,
    handleFLuctuationChange: PropTypes.func.isRequired,
    selectedWindType: PropTypes.string.isRequired,
    fluctuationPercentage: PropTypes.number.isRequired,
    windShears: PropTypes.array.isRequired,
    addNewWindShear: PropTypes.func.isRequired,
    windShearData: PropTypes.object.isRequired,
    setWindShearData: PropTypes.func.isRequired,
    deleteWindShear: PropTypes.func.isRequired
};

export default WindSettings;
