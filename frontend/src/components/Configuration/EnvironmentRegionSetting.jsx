import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import { StyledSelect } from '../../css/SimulationPageStyles';
import { BootstrapTooltip } from '../../css/muiStyles';
import {
  ENVIRONMENT_ORIGINS,
  ENVIRONMENT_ORIGIN_VALUES,
  originTypes,
  imageUrls,
} from '../../utils/const';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import PropTypes from 'prop-types';
import * as React from 'react';

import TimeGridComponent from './TimeGridComponent';

const EnvironmentRegionSetting = ({ envConf, setEnvConf }) => {
  const handleRegionBasedPropSetting = (val) => {
    if (val.target.value !== originTypes.SpecifyRegion) {
      ENVIRONMENT_ORIGIN_VALUES.forEach((obj) => {
        if (obj.value === val.target.value) {
          updateOriginSettings({
            latitude: obj.latitude,
            longitude: obj.longitude,
            radius: 0.1,
            height: obj.height,
            name: obj.value,
          });
        }
      });
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateOriginSettings({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              radius: 0.1,
              height: 0,
              name: val.target.value,
            });
          },
          (error) => {
            console.error('Error obtaining location: ', error);
            setDefaultOriginValues(val);
          },
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
        setDefaultOriginValues(val);
      }
    }
  };

  const updateOriginSettings = ({ latitude, longitude, radius, height, name }) => {
    envConf.setOriginLatitude(latitude);
    envConf.setOriginLongitude(longitude);
    envConf.setOriginRadius(radius);
    envConf.setOriginHeight(height);
    envConf.setOriginName(name);

    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    //viewerMaintainer.current = true;
  };

  const setDefaultOriginValues = (val) => {
    updateOriginSettings({
      latitude: 0,
      longitude: 0,
      radius: 0.1,
      height: 0,
      name: val.target.value,
    });
  };

  const handleOriginChange = (val) => {
    let keys = Object.keys(val);

    if (val.target.id === 'Latitude') {
      envConf.setOriginLatitude(val.target.value == '' ? 0 : parseFloat(val.target.value));
    } else if (val.target.id === 'Longitude') {
      envConf.setOriginLongitude(val.target.value == '' ? 0 : parseFloat(val.target.value));
    } else if (val.target.id === 'Height') {
      envConf.setOriginHeight(val.target.value == '' ? 0 : parseFloat(val.target.value));
    } else if (val.target.id === 'Radius') {
      envConf.setOriginRadius(val.target.value == '' ? 0 : parseFloat(val.target.value));
    }
    // viewerMaintainer.current = true;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleDragStart = (event) => {
    const imgSrc = event.target.src;
    const dragData = {
      type: 'region',
      src: imgSrc,
    };

    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  return (
    <Grid container spacing={5} direction='column'>
      <Grid item xs={12}>
        <Grid container alignItems='center' direction='row'>
          <Grid item xs={4}>
            <InputLabel
              id='origin-label'
              sx={{ marginRight: 2, width: '200px', flexShrink: 0, color: '#F5F5DC' }}
            >
              Region
            </InputLabel>
          </Grid>
          <Grid item xs={6}>
            <StyledSelect
              label='Region'
              value={envConf.getOriginName()}
              input={<OutlinedInput />}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    backgroundColor: '#F5F5DC',
                  },
                },
              }}
              onChange={handleRegionBasedPropSetting}
              fullWidth
            >
              {ENVIRONMENT_ORIGINS.map((val) => {
                return (
                  <MenuItem value={val.value} key={val.id}>
                    <em>{val.value}</em>
                  </MenuItem>
                );
              })}
            </StyledSelect>
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container alignItems='center' direction='row'>
          <Grid item xs={4}>
            <InputLabel
              id='latitude-label'
              sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}
            >
              Origin Latitude
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
              id='Latitude'
              variant='outlined'
              type='number'
              inputProps={{ step: '.0001' }}
              onChange={handleOriginChange}
              value={envConf.Origin.latitude}
              disabled={envConf.Origin.name === originTypes.SpecifyRegion ? false : true}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container alignItems='center' direction='row'>
          <Grid item xs={4}>
            <InputLabel
              id='longitude-label'
              sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}
            >
              Origin Longitude
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
              id='Longitude'
              variant='outlined'
              type='number'
              inputProps={{ step: '.0001' }}
              onChange={handleOriginChange}
              value={envConf.Origin.longitude}
              disabled={envConf.Origin.name === originTypes.SpecifyRegion ? false : true}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container alignItems='center' direction='row'>
          <Grid item xs={4}>
            <InputLabel
              id='radius-label'
              sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}
            >
              Radius (miles)
            </InputLabel>
          </Grid>
          <Grid item xs={envConf.Origin.name === originTypes.SpecifyRegion ? 5.5 : 6}>
            <TextField
              sx={{
                backgroundColor: '#F5F5DC',
                '& .MuiOutlinedInput-root': {
                  '& .MuiInputBase-input': {
                    padding: '6px 8px',
                  },
                },
              }}
              id='Radius'
              variant='outlined'
              type='number'
              inputProps={{ step: '0.1', min: '0' }}
              onChange={handleOriginChange}
              value={envConf.Origin.radius}
              fullWidth
            />
          </Grid>
          {envConf.Origin.name === originTypes.SpecifyRegion && (
            <Grid item xs={1}>
              <BootstrapTooltip
                title='Drag the icon to the map to specify the center of the region'
                placement='top'
              >
                <img
                  src={imageUrls.location}
                  alt='Draggable Icon'
                  draggable='true'
                  onDragStart={(e) => handleDragStart(e)}
                  style={{ width: 40, cursor: 'grab', marginRight: 20 }}
                />
              </BootstrapTooltip>
            </Grid>
          )}
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container alignItems='center' direction='row'>
          <Grid item xs={4}>
            <InputLabel
              id='time-of-day-label'
              sx={{ marginRight: 2, flexShrink: 0, color: '#F5F5DC', width: '200px' }}
            >
              Time of day
            </InputLabel>
          </Grid>
          <Grid item xs={6}>
            {/* <Tooltip title="Enter time of day (24 Hours Format)" placement='bottom'> */}
            <TimeGridComponent envConf={envConf} setEnvConf={setEnvConf} />
            {/* </Tooltip> */}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

EnvironmentRegionSetting.propTypes = {
  envConf: PropTypes.object.isRequired,
  setEnvConf: PropTypes.func.isRequired,
};

export default EnvironmentRegionSetting;
