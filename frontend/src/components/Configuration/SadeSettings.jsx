import React, { useEffect, useState } from 'react';
import { Grid, TextField, IconButton, InputLabel, Tooltip, MenuItem } from '@mui/material';
import { AccordionStyled, StyledInputLabel } from '../../css/SimulationPageStyles';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteIcon from '@mui/icons-material/Delete';
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
    envConf.addNewSade(newSade);
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleDecrement = () => {
    envConf.popLastSade();
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleDelete = (index) => {
    envConf.deleteSadeBasedOnIndex(index);
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleReset = (index, sadeZoneName) => {
    let newSade = new SadeModel();
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
        ? updateRectangle(sade.centerLong, sade.centerLat, sade.length, sade.width)
        : 0;
    } else if (id === 'width') {
      sade.width = parseFloat(value);
      sade.rectangle = value
        ? updateRectangle(sade.centerLong, sade.centerLat, sade.length, sade.width)
        : 0;
    } else if (id === 'centerLat') {
      sade.centerLat = value ? parseFloat(value) : 0;
      sade.rectangle = updateRectangleByNewCenter(
        sade.centerLong,
        sade.centerLat,
        sade.length,
        sade.width,
      );
    } else if (id === 'centerLong') {
      sade.centerLong = value ? parseFloat(value) : 0;
      sade.rectangle = updateRectangleByNewCenter(
        sade.centerLong,
        sade.centerLat,
        sade.length,
        sade.width,
      );
    }
    envConf.updateSadeBasedOnIndex(index, sade);
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleActionClick = (event, action, index, sadeName) => {
    event.stopPropagation(); // Prevents the accordion from toggling
    if (action === 'setActive') {
      setActiveSadeZoneIndex(index);
    } else if (action === 'reset') {
      handleReset(index, sadeName);
    } else if (action === 'delete') {
      handleDelete(index);
    }
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
        <Grid item key={index}>
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
                <ButtonGroup size='large' variant='text' color='warning'>
                  <Button onClick={(e) => handleActionClick(e, 'setActive', index)}>
                    <Tooltip
                      title='Click to activate, then hold SHIFT & drag the MOUSE to draw the sade-zone on the map.'
                      enterDelay={300}
                      leaveDelay={500}
                    >
                      <DrawIcon
                        style={{
                          color: envConf.activeSadeZoneIndex === index ? '#F5F5DC' : '#FF7F50',
                        }}
                      />
                    </Tooltip>
                  </Button>
                  <Button onClick={(e) => handleActionClick(e, 'reset', index, sade.name)}>
                    <Tooltip
                      title='Resets current sade-zone values'
                      enterDelay={300}
                      leaveDelay={200}
                    >
                      <RefreshIcon />
                    </Tooltip>
                  </Button>
                  <Button onClick={(e) => handleActionClick(e, 'delete', index)}>
                    <Tooltip title='Deletes current sade-zone' enterDelay={300} leaveDelay={200}>
                      <DeleteIcon />
                    </Tooltip>
                  </Button>
                </ButtonGroup>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: '#75531E47' }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Name', key: 'name', type: 'text' },
                  { label: 'Height (m)', key: 'height', type: 'number' },
                  { label: 'Length (m)', key: 'length', type: 'number' },
                  { label: 'Width (m)', key: 'width', type: 'number' },
                  { label: 'Center Latitude', key: 'centerLat', type: 'number' },
                  { label: 'Center Longitude', key: 'centerLong', type: 'number' },
                ].map(
                  (field, i) =>
                    (field.key == 'name' || field.key == 'height' || sade.rectangle) && (
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
      ))}
    </Grid>
  );
};

SadeSettings.propTypes = {
  envConf: PropTypes.object.isRequired,
  setEnvConf: PropTypes.func.isRequired,
};

export default SadeSettings;
