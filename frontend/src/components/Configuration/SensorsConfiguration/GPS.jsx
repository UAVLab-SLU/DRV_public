import * as React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';


export default function GPS (sensor) {
    const[gps, setGps] = React.useState(sensor.gPSObj)

    React.useEffect(() => {
        sensor.updateJson(gps, sensor.name)
    }, [gps])

    const closeModal = () => {
        sensor.closeModal(gps, sensor.name)
    }

    const handleChangeSwitch = (val) => {
        setGps(prevState => ({
                ...prevState,
                Enabled: val.target.checked
        }))
    }

    const handleChange = (val) => {
        setGps(prevState => ({
            ...prevState,
            [val.target.id]: val.target.type === "number" ? parseInt(val.target.value, 10) : val.target.value
        }))
    }

    return(
        <div>
            <Box>
                <Typography variant="h6" component="h2">
                    {gps.Key}
                </Typography>
                <Typography >
                    <Grid container spacing={2} direction="row">
                        <Grid item xs={3}>
                            <FormGroup>
                                <FormControlLabel disabled control={<Switch checked={gps.Enabled} inputProps={{ 'aria-label': 'controlled' }} />} label="Enabled" />
                            </FormGroup>
                        </Grid>
                        {/* <Grid item xs={3}>
                            <TextField id="Key" onChange={handleChange} label="Name" variant="standard" value={gps.Key}/>
                        </Grid> */}
                        {/* <Grid item xs={3}>
                            <TextField id="EphTimeConstant" onChange={handleChange} label="EphTimeConstant" variant="standard" value={gps.EphTimeConstant}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EpvTimeConstant" onChange={handleChange} label="EpvTimeConstant" variant="standard" value={gps.EpvTimeConstant}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EphInitial" onChange={handleChange} label="EphInitial" variant="standard" value={gps.EphInitial}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EpvInitial" onChange={handleChange} label="EpvInitial" variant="standard" value={gps.EpvInitial}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EphFinal" onChange={handleChange} label="EphFinal" variant="standard" value={gps.EphFinal}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EpvFinal" onChange={handleChange} label="EpvFinal" variant="standard" value={gps.EpvFinal}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EphMin3d" onChange={handleChange} label="EphMin3d" variant="standard" value={gps.EphMin3d}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="EphMin2d" onChange={handleChange} label="EphMin2d" variant="standard" value={gps.EphMin2d}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="UpdateLatency" onChange={handleChange} label="UpdateLatency" variant="standard" value={gps.UpdateLatency}/>
                        </Grid> */}
                        <Tooltip title="Please enter the GPS update frequency (in Hertz) to ensure accurate location tracking. A higher update frequency will provide more real-time and accurate data, while a lower frequency may result in less accurate location updates." placement="top">
                        <Grid item xs={3}>
                            <TextField id="UpdateFrequency" onChange={handleChange} type="number" label="Update Frequency (Hz)" variant="standard" value={gps.UpdateFrequency}/>
                        </Grid>
                        </Tooltip>
                        
                        
                        {/* <Grid item xs={3}>
                            <TextField id="StartupDelay" onChange={handleChange} label="StartupDelay" variant="standard" value={gps.StartupDelay}/>
                        </Grid> */}
                    </Grid>
                    <Grid container direction="row" justifyContent="flex-end" alignItems="center" style={{paddingTop:'15px', marginTop:'15px'}}>
                        <Button variant="outlined" onClick={closeModal}>Ok</Button> &nbsp;&nbsp;&nbsp;
                    </Grid>
                </Typography>
            </Box>
        </div>
    )
}