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


const defaultGps = {
    EphTimeConstant: 0.9,
    EpvTimeConstant: 0.9,
    EphInitial: 25, 
    EpvInitial: 25,
    EphFinal: 0.1,
    EpvFinal: 0.1, 
    EphMin3d: 3,
    EphMin2d: 4,
    UpdateLatency: 0.2,
    UpdateFrequency: 50,
    StartupDelay: 1  
  };

export default function GPS (sensor) {
    const[gps, setGps] = React.useState(defaultGps) 
    

    React.useEffect(() => {
        sensor.updateJson(gps, sensor.name)  
          }, [gps]);

    const closeModal = () => {
        sensor.closeModal(gps, sensor.name)
    }

    const handleChangeSwitch = (val) => {
        setGps(prevState => ({
                ...prevState,
                Enabled: val.target.checked
        }))
    }  
    const tooltips = {
        EphTimeConstant: "Tooltip text...",
        EpvTimeConstant: "Tooltip text...",
      }

    const handleChange = (val) => {   
        setGps(prevState => ({
            ...prevState,
            [val.target.id]: val.target.type === "number" ? parseInt(val.target.value, 10) : val.target.value
        }));  
    } 


    const handleReset = () => {
        setGps(defaultGps);
      };
    return(
        <div>  
            <Typography variant="h6" component="h2" style={{ marginBottom: '5px' }}>
                    {gps.Key}
                </Typography> 

                <Grid container spacing={2} direction="row">
                        <Grid item xs={3}> 
                        <Tooltip title={tooltips.EphTimeConstant}> 
                        </Tooltip>
                            <FormGroup>
                                <FormControlLabel disabled control={<Switch checked={gps.Enabled} inputProps={{ 'aria-label': 'controlled' }} />} label="Enabled" />
                            </FormGroup>
                </Grid>   
                </Grid>  
            <Box>     
            
            
            <Grid container spacing={2}>   
            <Grid container item xs={12}>
            <Tooltip title={tooltips.EphTimeConstant}>    
        

         <Grid item xs={3}>
                <TextField id="EphTimeConstant" onChange={handleChange} label="EphTimeConstant" type="number" variant="standard" value={gps.EphTimeConstant}/>
         </Grid> 
            
         </Tooltip>  
         
         <Tooltip title={tooltips.EpvTimeConstant}>  
         <Grid item xs={3}>
                <TextField id="EpvTimeConstant" onChange={handleChange} label="EpvTimeConstant" type="number" variant="standard" value={gps.EpvTimeConstant}/>
         </Grid>  

         </Tooltip>    
         <Grid item xs={3}>
                <TextField id="EphInitial" onChange={handleChange} label="EphInitial" type="number" variant="standard" value={gps.EphInitial}/>
         </Grid>  
         <Grid item xs={3}>
                <TextField id="EpvInitial" onChange={handleChange} label="EpvIntial" type="number" variant="standard" value={gps.EpvInitial}/>
         </Grid>     

         </Grid> 

         <Grid item xs={3}>
                <TextField id="EphFinal" onChange={handleChange} label="EphFinal" type="number" variant="standard" value={gps.EphFinal}/>
         </Grid>    

         <Grid item xs={2.9}>
                <TextField id="EpvFinal" onChange={handleChange} label="EpvFinal" type="number" variant="standard" value={gps.EpvFinal} style={{ width: '85%' }}/>
         </Grid> 

         <Grid item xs={2.9}>
                <TextField id="EphMin3d" onChange={handleChange} label="EphMin3d" type="number" variant="standard" value={gps.EphMin3d} />
         </Grid> 

         <Grid item xs={3}>
                <TextField id="EphMin2d" onChange={handleChange} label="EphMin2d" type="number" variant="standard" value={gps.EphMin2d}/>
         </Grid> 

         
         <Grid/>  


        
         </Grid>
                
                <Typography >
                <Grid container spacing={4} >
                <Grid container item xs={9} style={{marginTop: 10}}>
                <Grid container spacing={4} direction="row">
                        <Grid item xs={10.5}>
                          
            
                        
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
                         <Grid container xs={18} spacing={12} justifyContent="flex-end" >
                       

                        <Tooltip title="Please enter the GPS update frequency (in Hertz) to ensure accurate location tracking. A higher update frequency will provide more real-time and accurate data, while a lower frequency may result in less accurate location updates." placement="top">
                        <Grid item xs={4}>
                            <TextField id="UpdateFrequency" onChange={handleChange} type="number" label="Update Frequency (Hz)" variant="standard" value={gps.UpdateFrequency} style={{ width: '150%' }}/> 
                        </Grid>  
                         
                        
                        </Tooltip>  
                    


                    <Grid item xs={3.99}>
                            <TextField id="StartupDelay" onChange={handleChange} label="Startup Delay (s)" type="number" variant="standard" value={gps.StartupDelay} style={{ width: '150%' }}/>
                    </Grid> 

                    <Grid item xs={4.01}>
                            <TextField id="UpdateLatency" onChange={handleChange} label="Update Latency (Hz)" type="number" variant="standard" value={gps.UpdateLatency} style={{ width: '155%' }}/>
                    </Grid>

                      </Grid>  
                      </Grid>  
                      </Grid> 
                      </Grid> 

                
                        
                        {/* <Grid item xs={3}>
                            <TextField id="StartupDelay" onChange={handleChange} label="StartupDelay" variant="standard" value={gps.StartupDelay}/>
                        </Grid> */}
                
                    
                    <Grid container direction="row" justifyContent="flex-end" alignItems="center" style={{paddingTop:'15px', marginTop:'15px'}}>
                        <Grid item xs={3}><Button onClick={() => setGps(defaultGps)} style={{paddingLeft:'25px', margin: '5px'}}> Reset to Default </Button></Grid>
                        <Grid item xs={9}><Button variant="outlined" onClick={closeModal} style={{float:'right'}}>Ok</Button> &nbsp;&nbsp;&nbsp;</Grid>
                    </Grid>
                    </Grid>  
                </Typography>  
            </Box> 
        </div> 
    )
}
