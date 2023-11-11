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


const defaultMagnetometer = {
    NoiseSigma: 0.005,
    ScaleFactor: 1,
    NoiseBias: 0, 
    UpdateLatency: 0, 
    UpdateFrequency: 50,
    StartupDelay: 0,
   
  };


export default function Magnetometer (sensor) {
    const [magnetometer, setMagnetometer]  = React.useState(defaultMagnetometer)

    const handleChangeSwitch = (val) => {
        setMagnetometer(prevState => ({
                ...prevState,
                Enabled: val.target.checked
        }))
    }

    React.useEffect(() => {
        sensor.updateJson(magnetometer, sensor.name)
    }, [magnetometer])

    
    const closeModal = () => {
        sensor.closeModal(magnetometer, sensor.name)
    }

    const handleChange = (val) => {
        setMagnetometer(prevState => ({
            ...prevState,
            [val.target.id]: val.target.type === "number" ? parseInt(val.target.value, 10) : val.target.value
        }))
    }  

    const handleReset = () => {
        setMagnetometer(defaultMagnetometer);
      };


    return(
        <div>
            <Box>
                <Typography variant="h6" component="h2">
                    {magnetometer.Key || "Magnetometer"}
                </Typography> 


                <Typography>
                    <Grid container spacing={2} direction="row">
                        <Grid item xs={3}>
                            <FormGroup>
                                <FormControlLabel disabled control={<Switch checked={magnetometer.Enabled} inputProps={{ 'aria-label': 'controlled' }} />} label="Enabled" />
                            </FormGroup>
                        </Grid>
                        {/* <Grid item xs={3}>
                            <TextField id="Key" onChange={handleChange} label="Name" variant="standard" value={magnetometer.Key}/>
                        </Grid> */}
                        {/* <Grid item xs={3}>
                            <TextField id="NoiseSigma" onChange={handleChange} label="NoiseSigma" variant="standard" value={magnetometer.NoiseSigma}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="ScaleFactor" onChange={handleChange} label="ScaleFactor" variant="standard" value={magnetometer.ScaleFactor}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="NoiseBias" onChange={handleChange} label="NoiseBias" variant="standard" value={magnetometer.NoiseBias}/>
                        </Grid>
                        <Grid item xs={3}>
                            <TextField id="UpdateLatency" onChange={handleChange} label="UpdateLatency" variant="standard" value={magnetometer.UpdateLatency}/>
                        </Grid> */}
                        <Tooltip title="The frequency at which the compass should send readings to the flight controller.">
                        <Grid item xs={3}>
                            <TextField id="UpdateFrequency" onChange={handleChange} label="Update Frequency (Hz)" type="number" variant="standard" value={magnetometer.UpdateFrequency}/>
                        </Grid>
                        </Tooltip>   

                        <Tooltip title= "Noise Sigma">     
                         <Grid item xs={3}>  
                          <TextField 
                           id="NoiseSigma" 
                           label="NoiseSigma" 
                           type="number" 
                           InputProps={{ 
                            inputProps: { min: 0, max: Infinity, step: 0.1 }, 
                             onChange: (e) => { 
                                let value = parseFloat(e.target.value);  
                                 value = Math.round(value / 0.1) * 0.1; 
                                 value = Math.min(Math.max(value, 0), Infinity); 
                                   // Format the value to a string with 2 decimal places 
                                  const formattedValue = value.toFixed(2); 
                                   setMagnetometer({ ...magnetometer, NoiseSigma: formattedValue }); 
                                 }, 
                                 }}   
                                value={magnetometer.NoiseSigma} 
                                onChange={handleChange}  
                                variant="standard"  
                                //style={{ marginBottom: '16px' }}   
                                style={{ width: 169 }} 
                                 />  
                                 </Grid>  
                                 </Tooltip>    


                                      
                                <Grid item xs={3}>   
                                <Tooltip title= "Noise Bias">  
                                <TextField  
                                id="NoiseBias"  
                                label="NoiseBias"  
                                type="number"  
                                InputProps={{  
                                    inputProps: { min: 0, max: Infinity, step: 0.1 },  
                                    onChange: (e) => {  
                                        let value = parseFloat(e.target.value);   
                                        value = Math.round(value / 0.1) * 0.1; 
                                        value = Math.min(Math.max(value, 0), Infinity) 
                                        // Format the value to a string with 2 decimal places  
                                        const formattedValue = value.toFixed(2);  
                                        setMagnetometer({ ...magnetometer, NoiseBias: formattedValue });  
                                    },  
                                }}   
                                value={magnetometer.NoiseBias} 
                                onChange={handleChange}  
                                variant="standard"  
                                //style={{ marginBottom: '16px' }}   
                                style={{ width: 169 }} 
                                 />  
                                </Tooltip>    
                                </Grid>  
                                
                                 
                                
                                 <Grid item xs={6}>
                                 <TextField    
                                 id="UpdateLatency"   
                                 label="Update Latency (s)"   
                                 type="number"   
                                 InputProps={{ 
                                    inputProps: { min: 0, max: Infinity, step: 0.1 }, 
                                    onChange: (e) => { 
                                        let value = parseFloat(e.target.value); 
                                        value = Math.round(value / 0.1) * 0.1; 
                                        value = Math.min(Math.max(value, 0), Infinity); 
                                        // Format the value to a string with 2 decimal places 
                                        const formattedValue = value.toFixed(2); 
                                        setMagnetometer({ ...magnetometer, UpdateLatency: formattedValue }); 
                                    }, 
                                 }}   
                                 value={magnetometer.UpdateLatency}  
                                 onChange={handleChange}   
                                 variant="standard"   
                                 style={{ width: 169, marginLeft: 205 }}   
                                 />    
                                 </Grid>  

                                
                                  <Tooltip title= "StartupDelay"> 
                                  <Grid item xs={3}>
                                  <TextField    
                                  id="StartupDelay"   
                                  label="StartupDelay (s)"   
                                  type="number"   
                                  InputProps={{ inputProps: {min: 0, max: Infinity } }}   
                                  value={magnetometer.StartupDelay}   
                                  onChange={handleChange}    
                                  variant="standard"   
                                  style={{ width: 169 }}  
                                  />   
                                   </Grid>   
                                   </Tooltip> 

                                

                                <Tooltip title= "ScaleFactor">  
                                <Grid item xs ={3}>
                                  <TextField    
                                  id="ScaleFactor"   
                                  label="Scale Factor"   
                                  type="number"   
                                  InputProps={{ inputProps: {min: 0, max: Infinity } }}   
                                  value={magnetometer.ScaleFactor}   
                                  onChange={handleChange}    
                                  variant="standard"   
                                  style={{ width: 169 }}  
                                  />     
                                  </Grid>
                                   </Tooltip>
                                  
                                    
    
                      </Grid>    
                        {/* <Grid item xs={3}>
                            <TextField id="StartupDelay" onChange={handleChange} label="StartupDelay" variant="standard" value={magnetometer.StartupDelay}/>
                        </Grid> */}
                    <Grid container direction="row" justifyContent="flex-end" alignItems="center" style={{paddingTop:'15px', marginTop:'15px'}}>
                        <Button variant="outlined" onClick={closeModal}>Ok</Button> &nbsp;&nbsp;&nbsp; 

                        <Grid container spacing = {2}>
                        <Button variant="outlined" onClick={handleReset}>  
                        Reset  
                        </Button>  
                        </Grid>
                    </Grid>   

                    
                </Typography>  
            </Box>
        </div>
    )
}