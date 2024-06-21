// Region.jsx
import React from 'react';
import { Grid, InputLabel, TextField, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Tab, Tabs, Select } from '@mui/material';

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: '#F5F5DC',
        '& .MuiInputBase-input': {
            padding: '6px 8px',
            height: '1em',
        }
}));


const originOptions = [
  {value: "Chicago O'Hare Airport", id: 20},
  {value: "Specify Region", id: 30}
];

const originValues = {
  "Chicago O'Hare Airport": {Latitude: 41.980381, Longitude: -87.934524, Height: 200},
  "Michigan Lake Beach": {Latitude: 42.211223, Longitude: -86.390394, Height: 170}
};

export default function Region({ envConf, setEnvConf }) {
  const handleOrigin = (event) => {
    const selectedValue = event.target.value;
    const newOrigin = selectedValue !== "Specify Region"
      ? { ...originValues[selectedValue], Name: selectedValue }
      : { Name: selectedValue, Latitude: 0, Longitude: 0, Height: 0 };
    
    setEnvConf(prev => ({ ...prev, Origin: newOrigin }));
  };

  const handleOriginChange = (event) => {
    const { id, value } = event.target;
    setEnvConf(prev => ({
      ...prev,
      Origin: { ...prev.Origin, [id]: parseFloat(value) }
    }));
  };

  return (
    <Grid container spacing={2} direction="column">
      <Grid item>
        <Grid container alignItems="center">
          <Grid item xs={4}>
            <InputLabel sx={{ color: '#F5F5DC' }}>Region</InputLabel>
          </Grid>
          <Grid item xs={8}>
            <StyledSelect
              value={envConf.Origin.Name}
              onChange={handleOrigin}
              fullWidth
            >
              {originOptions.map(({ value, id }) => (
                <MenuItem value={value} key={id}>{value}</MenuItem>
              ))}
            </StyledSelect>
          </Grid>
        </Grid>
      </Grid>
      {['Latitude', 'Longitude'].map(field => (
        <Grid item key={field}>
          <Grid container alignItems="center">
            <Grid item xs={4}>
              <InputLabel sx={{ color: '#F5F5DC' }}>{field}</InputLabel>
            </Grid>
            <Grid item xs={8}>
              <TextField
                id={field}
                type="number"
                inputProps={{ step: "0.0001" }}
                onChange={handleOriginChange}
                value={envConf.Origin[field]}
                disabled={envConf.Origin.Name !== "Specify Region"}
                fullWidth
                sx={{ backgroundColor: '#F5F5DC' }}
              />
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
}

Region.propTypes = {
    envConf: PropTypes.shape({
      Origin: PropTypes.shape({
        Name: PropTypes.string,
        Latitude: PropTypes.number,
        Longitude: PropTypes.number,
      }),
    }).isRequired,
    setEnvConf: PropTypes.func.isRequired,
  };