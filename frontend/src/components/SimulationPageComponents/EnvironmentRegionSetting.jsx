import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from '@mui/material/Stack';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StyledSelect } from '../../css/SimulationPageStyles';
// import { ENVIRONMENT_ORIGINS, ENVIRONMENT_ORIGIN_VALUES } from '../../utils/const';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import PropTypes from 'prop-types';


const EnvironmentRegionSetting = ({ envConf, setEnvConf }) => {

    const ENVIRONMENT_ORIGINS = [
        { value: "Chicago O’Hare Airport", id: 20 },
        { value: "Michigan Lake Beach", id: 10 },
        { value: "Specify Region", id: 30 }
      ];
      
    const ENVIRONMENT_ORIGIN_VALUES = [
        { value: "Michigan Lake Beach", Latitude: 42.211223, Longitude: -86.390394, Height: 170 },
        { value: "Chicago O’Hare Airport", Latitude: 41.980381, Longitude: -87.934524, Height: 200 }
      ];


    const handleRegionBasedPropSetting = (val) => {
        if (val.target.value != "Specify Region") {
            ENVIRONMENT_ORIGIN_VALUES.map(obj => {
                if (obj.value == val.target.value) {
                    envConf.setOriginLatitude(obj.Latitude);
                    envConf.setOriginLongitude(obj.Longitude);
                    envConf.setOriginHeight(obj.Height);
                    envConf.setOriginName(obj.value);
                }
            })
        } else {
            envConf.setOriginLatitude(0);
            envConf.setOriginLongitude(0);
            envConf.setOriginHeight(0);
            envConf.setOriginName(val.target.value);
        }
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    }

    const handleOriginChange = (val) => {

        let keys = Object.keys(val)

        if (keys.includes("$H") && keys.includes("$m") && keys.includes("$s")) {
            envConf.TimeOfDay = val.$H + ':' + val.$m + ':' + val.$s;
            envConf.time = val
        } else if (val.target.id === "Latitude") {
            envConf.setOriginLatitude(parseFloat(val.target.value));
        } else if (val.target.id === "Longitude") {
            envConf.getOriginLongitude(parseFloat(val.target.value));
        } else if (val.target.id === "Height") {
            // future implementation
            envConf.setOriginHeight(parseFloat(val.target.value));
        }
        
        setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    }


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
                            value={envConf.Origin.Latitude}
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
                            value={envConf.Origin.Longitude}
                            disabled={envConf.Origin.Name == "Specify Region" ? false : true}
                            fullWidth
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
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Stack spacing={3}
                                    sx={{
                                        backgroundColor: '#F5F5DC',
                                        '& .MuiOutlinedInput-root': {
                                            '& .MuiInputBase-input': {
                                                padding: '6px 8px',
                                            },
                                        },
                                    }}>
                                    <TimePicker
                                        ampm={false}
                                        openTo="hours"
                                        views={['hours', 'minutes', 'seconds']}
                                        inputFormat="HH:mm:ss"
                                        mask="__:__:__"
                                        value={envConf.time}
                                        onChange={handleOriginChange}
                                        renderInput={(params) => <TextField {...params}
                                        // helperText="Enter Time of Day (24 Hour Format)"
                                        />}
                                    />
                                </Stack>
                            </LocalizationProvider>
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