import React, { useEffect, useState } from 'react';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem } from '@mui/material';
import { AccordionStyled, StyledInputLabel } from '../../css/SimulationPageStyles';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import DrawIcon from '@mui/icons-material/Draw';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ExpandMore } from '@mui/icons-material';
import { SadeModel } from '../../model/SadeModel';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import { updateRectangle, updateRectangleByNewCenter } from '../../utils/mapUtils';
import PropTypes from 'prop-types';

const SadeSettings = ({ envConf, setEnvConf }) => {
  const handleIncrement = () => {
    let newSade = new SadeModel();
    newSade.name = `SADE Zone ${envConf.getAllSades().length + 1}`;
    envConf.addNewSade(newSade);
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleDecrement = () => {
    envConf.popLastSade();
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleRefresh = (index, sadeZoneName) => {
    let newSade = new SadeModel();
    newSade.name = sadeZoneName;
    envConf.updateSadeBasedOnIndex(index, newSade);
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const setActiveSadeZoneIndex = (index) => {
    envConf.activeSadeZoneIndex = index;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleChange = (e, index) => {
    const { id, value, type } = e.target;
    let sade = envConf.getSadeBasedOnIndex(index);
    if (id === 'name') {
      sade.name = value;
    } else if (id === 'height') {
      sade.height = value ? parseFloat(value) : 0;
    } else if (id === 'length') {
      sade.length = parseFloat(value);
      sade.rectangle = value
        ? updateRectangle(sade.longitude1, sade.latitude1, sade.length, sade.width)
        : 0;
    } else if (id === 'width') {
      sade.width = parseFloat(value);
      sade.rectangle = value
        ? updateRectangle(sade.longitude1, sade.latitude1, sade.length, sade.width)
        : 0;
    } else if (id === 'latitude1') {
      sade.latitude1 = value ? parseFloat(value) : 0;
      sade.rectangle = updateRectangleByNewCenter(
        sade.longitude1,
        sade.latitude1,
        sade.length,
        sade.width,
      );
    } else if (id === 'longitude1') {
      sade.longitude1 = value ? parseFloat(value) : 0;
      sade.rectangle = updateRectangleByNewCenter(
        sade.longitude1,
        sade.latitude1,
        sade.length,
        sade.width,
      );
    }
    envConf.updateSadeBasedOnIndex(index, sade);
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  return (
    <Grid container direction='column' style={{ color: '#F5F5F5' }}>
      <Grid
        container
        item
        direction='row'
        alignItems='center'
        justifyContent='flex-end'
        sx={{ mb: '30px', fontSize: '18px', color: '#F5F5DC' }}
      >
        <Grid item>
          Number of SADEs &nbsp;&nbsp;
          <ButtonGroup size='small' aria-label='small outlined button group' color='warning'>
            {envConf.getAllSades().length > 0 && (
              <Button sx={{ fontSize: '15px' }} onClick={handleDecrement}>
                -
              </Button>
            )}
            <Button style={{ fontSize: '15px' }} variant='contained' color='warning'>
              {envConf.getAllSades().length}
            </Button>
            <Button
              style={{ fontSize: '15px' }}
              onClick={handleIncrement}
              disabled={envConf.getAllSades().length === 10}
            >
              +
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>

      {envConf.getAllSades()?.map((sade, index) => (
        <Grid container item key={index}>
          <Grid item xs={11}>
            <AccordionStyled key={index}>
              <AccordionSummary
                expandIcon={<ExpandMore style={{ color: '#F5F5DC' }} />}
                aria-controls='panel1a-content'
                id='panel1a-header'
                sx={{ backgroundColor: '#643E05' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Typography variant='h5' sx={{ color: '#F5F5DC', pb: 1 }}>
                    {sade.name}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: '#75531E47' }}>
                <Grid container spacing={2}>
                  {[
                    { label: 'Name', key: 'name', type: 'text' },
                    { label: 'Height (m)', key: 'height', type: 'number' },
                    { label: 'Length (m)', key: 'length', type: 'number' },
                    { label: 'Width (m)', key: 'width', type: 'number' },
                    { label: 'Center Latitude', key: 'latitude1', type: 'number' },
                    { label: 'Center Longitude', key: 'longitude1', type: 'number' },
                  ].map(
                    (field, i) =>
                      (field.key == 'name' || sade.rectangle) && (
                        <Grid item xs={6} key={i}>
                          <StyledInputLabel id={field.key}>{field.label}</StyledInputLabel>
                          <TextField
                            sx={{
                              backgroundColor: '#71665E',
                              '& .MuiOutlinedInput-root': {
                                '& .MuiInputBase-input': {
                                  padding: '6px 8px',
                                  fontSize: '1.2rem',
                                },
                              },
                            }}
                            id={field.key}
                            type={field.type}
                            variant='outlined'
                            onChange={(e) => handleChange(e, index)}
                            value={sade[field.key] || ''}
                            fullWidth
                          />
                        </Grid>
                      ),
                  )}
                </Grid>
              </AccordionDetails>
            </AccordionStyled>
          </Grid>
          <Grid container direction='column' item xs={1}>
            <ButtonGroup
              size='small'
              orientation='vertical'
              variant='outlined'
              aria-label='small outlined button group'
              color='warning'
              sx={{ paddingTop: '5px' }}
            >
              <Button onClick={() => setActiveSadeZoneIndex(index)}>
                <DrawIcon
                  style={{ color: envConf.activeSadeZoneIndex == index ? '#F5F5DC' : '#FF7F50' }}
                />
              </Button>
              <Button onClick={() => handleRefresh(index, sade.name)}>
                <RefreshIcon style={{ color: '#FF7F50' }} />
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
};

SadeSettings.propTypes = {
  envConf: PropTypes.object.isRequired,
  setEnvConf: PropTypes.func.isRequired,
};

export default SadeSettings;
