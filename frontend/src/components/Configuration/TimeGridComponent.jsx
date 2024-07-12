import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Stack from '@mui/material/Stack';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { TextField } from '@mui/material';


const TimeGridComponent = ({ envConf, setEnvConf }) => {


    const [localTimeState, setLocalTimeState] = useState(envConf.time);
    const [loopForever, setLoopForever] = useState(true);
    const { timeOfDayRef, timeRef, viewerMaintainer } = useMainJson();

    const handleOriginChange = (val) => {

        let keys = Object.keys(val)

        if (keys.includes("$H") && keys.includes("$m") && keys.includes("$s")) {
            timeOfDayRef.current = val.$H + ':' + val.$m + ':' + val.$s;
            timeRef.current = val;
            setLocalTimeState(val);
            viewerMaintainer.current = true;
        }
    }

    useEffect(() => {
        if (!viewerMaintainer.current) {
            setLocalTimeState(timeRef.current)
        }
        if(loopForever){
            setLoopForever(false);
        } else {
            setLoopForever(true);
        }
    }, [loopForever])



    return (
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
                    value={localTimeState}
                    onChange={handleOriginChange}
                    renderInput={(params) => <TextField {...params}
                    // helperText="Enter Time of Day (24 Hour Format)"
                    />}
                />
            </Stack>
        </LocalizationProvider>
    );

}

TimeGridComponent.propTypes = {
    envConf: PropTypes.object.isRequired,
    setEnvConf: PropTypes.func.isRequired,
};

export default TimeGridComponent;