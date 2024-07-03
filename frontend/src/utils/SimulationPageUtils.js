import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import OutlinedInput from '@mui/material/OutlinedInput';
import styled from '@emotion/styled';
import Select, { SelectChangeEvent } from '@mui/material/Select';

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: '#F5F5DC',
        '& .MuiInputBase-input': {
            padding: '6px 8px',
            height: '1em',
        }
}));

export const steps = [
    'Environment Configuration',
    'Mission Configuration',
    'Test Configuration'
];


export const renderSelectField = (label, value, onChange, options) => (
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


export const renderTextField = (label, value, onChange, inputProps) => (
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