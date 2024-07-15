import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import { StyledSelect } from '../../css/SimulationPageStyles';
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
    if (val.target.value != originTypes.SpecifyRegion) {
      ENVIRONMENT_ORIGIN_VALUES.map((obj) => {
        if (obj.value == val.target.value) {
          envConf.setOriginLatitude(obj.latitude);
          envConf.setOriginLongitude(obj.longitude);
          envConf.setOriginRadius(0);
          envConf.setOriginHeight(obj.height);
          envConf.setOriginName(obj.value);
        }
      });
    } else {
      envConf.setOriginLatitude(0);
      envConf.setOriginLongitude(0);
      envConf.setOriginRadius(0);
      envConf.setOriginHeight(0);
      envConf.setOriginName(val.target.value);
    }
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
    //viewerMaintainer.current = true;
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
              Enter radius (miles)
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
              <img
                src={imageUrls.location}
                alt='Draggable Icon'
                draggable='true'
                onDragStart={(e) => handleDragStart(e)}
                style={{ width: 40, cursor: 'grab', marginRight: 20 }}
              />
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
