import React from 'react';
import { Grid, InputLabel, TextField, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import PlaceIcon from '@mui/icons-material/Place';

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: '#F5F5DC',
    '& .MuiInputBase-input': {
        padding: '6px 8px',
        height: '1em',
    }
}));

const DraggableIcon = styled('div')({
  cursor: 'move',
  display: 'inline-block',
  marginLeft: '10px',
});

const originOptions = [
  {value: "Chicago O'Hare Airport", id: 20},
  {value: "Specify Region", id: 30}
];

const originValues = {
  "Chicago O'Hare Airport": {Latitude: 41.980381, Longitude: -87.934524, Height: 200},
  "Michigan Lake Beach": {Latitude: 42.211223, Longitude: -86.390394, Height: 170}
};

function Region({ envConf, setEnvConf, lastDroppedLocation }) {
  const handleOrigin = (event) => {
    const selectedValue = event.target.value;
    const newOrigin = selectedValue !== "Specify Region"
      ? { ...originValues[selectedValue], Name: selectedValue, Radius: 1 }
      : { Name: selectedValue, Latitude: 0, Longitude: 0, Height: 0, Radius: 1 };
    
    setEnvConf(prev => ({ ...prev, Origin: newOrigin }));
  };

  const handleOriginChange = (event) => {
    const { id, value } = event.target;
    setEnvConf(prev => ({
      ...prev,
      Origin: { ...prev.Origin, [id]: parseFloat(value) }
    }));
  };

  const handleDragStart = (event) => {
    const iconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
    event.dataTransfer.setData("text/plain", JSON.stringify({
      iconUrl,
      radius: envConf.Origin.Radius
    }));
  };

  React.useEffect(() => {
    if (lastDroppedLocation) {
      setEnvConf(prev => ({
        ...prev,
        Origin: { 
          ...prev.Origin, 
          Latitude: lastDroppedLocation.latitude,
          Longitude: lastDroppedLocation.longitude
        }
      }));
    }
  }, [lastDroppedLocation, setEnvConf]);

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
      {['Latitude', 'Longitude', 'Radius'].map(field => (
        <Grid item key={field}>
          <Grid container alignItems="center">
            <Grid item xs={4}>
              <InputLabel sx={{ color: '#F5F5DC' }}>{field}{field === 'Radius' ? ' (miles)' : ''}</InputLabel>
            </Grid>
            <Grid item xs={field === 'Radius' ? 7 : 8}>
              <TextField
                id={field}
                type="number"
                inputProps={{ step: field === 'Radius' ? "1" : "0.0001" }}
                onChange={handleOriginChange}
                value={envConf.Origin[field]}
                disabled={envConf.Origin.Name !== "Specify Region" && field !== 'Radius'}
                fullWidth
                sx={{ backgroundColor: '#F5F5DC' }}
              />
            </Grid>
            {field === 'Radius' && (
              <Grid item xs={1}>
                <DraggableIcon draggable onDragStart={handleDragStart}>
                  <PlaceIcon style={{ color: 'white' }} />
                </DraggableIcon>
              </Grid>
            )}
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
        Radius: PropTypes.number,
      }),
    }).isRequired,
    setEnvConf: PropTypes.func.isRequired,
    lastDroppedLocation: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number,
    }),
  };

export default Region;