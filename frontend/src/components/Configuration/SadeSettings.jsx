import React, { useEffect, useState } from 'react';
import { Grid, TextField, IconButton } from '@mui/material';
import { AccordionStyled, StyledInputLabel } from '../../css/SimulationPageStyles';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteIcon from '@mui/icons-material/Delete';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ExpandMore } from '@mui/icons-material';
import { BootstrapTooltip } from '../../css/muiStyles';
import { SadeModel } from '../../model/SadeModel';
import { EnvironmentModel } from '../../model/EnvironmentModel';
import { updateRectangle } from '../../utils/mapUtils';

const SadeSettings = ({ envConf, setEnvConf }) => {
  const [duplicateNameIndex, setDuplicateNameIndex] = useState(null);

  const handleIncrement = () => {
    let sade_id = envConf.getAllSades().length + 1;
    let newSade = new SadeModel();
    newSade.id = sade_id;
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

  const handleReset = (index, sade) => {
    let newSade = new SadeModel();
    envConf.updateSadeBasedOnIndex(index, newSade);
    envConf.activeSadeZoneIndex = null;
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const setActiveSadeZoneIndex = (index) => {
    if (envConf.activeSadeZoneIndex === index) {
      envConf.activeSadeZoneIndex = null;
    } else {
      envConf.activeSadeZoneIndex = index;
    }
    setEnvConf(EnvironmentModel.getReactStateBasedUpdate(envConf));
  };

  const handleChange = (e, index) => {
    const { id, value, type } = e.target;
    let sade = envConf.getSadeBasedOnIndex(index);
    if (id === 'name') {
      sade.name = value;
      const isDuplicate = envConf.getAllSades().some((s, idx) => s.name === value && idx !== index);
      isDuplicate ? setDuplicateNameIndex(index) : setDuplicateNameIndex(null);
    } else if (id === 'height') {
      sade.height = value != '' ? parseFloat(value) : 0;
    } else if (id === 'length') {
      sade.length = value != '' ? parseFloat(value) : 0;
      sade.rectangle =
        value != '' ? updateRectangle(sade.centerLong, sade.centerLat, sade.length, sade.width) : 0;
    } else if (id === 'width') {
      sade.width = value != '' ? parseFloat(value) : 0;
      sade.rectangle =
        value != '' ? updateRectangle(sade.centerLong, sade.centerLat, sade.length, sade.width) : 0;
    } else if (id === 'centerLat') {
      sade.centerLat = value != '' ? parseFloat(value) : 0;
      sade.rectangle = updateRectangle(sade.centerLong, sade.centerLat, sade.length, sade.width);
    } else if (id === 'centerLong') {
      sade.centerLong = value != '' ? parseFloat(value) : 0;
      sade.rectangle = updateRectangle(sade.centerLong, sade.centerLat, sade.length, sade.width);
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
                  {sade.name.length > 10 ? `${sade.name.substring(0, 10)}...` : sade.name}
                </Typography>
                <ButtonGroup size='large' variant='text' color='warning' sx={{ mr: 3 }}>
                  <Button onClick={(e) => handleActionClick(e, 'setActive', index)}>
                    <BootstrapTooltip
                      title='Click to activate, then hold SHIFT & drag the MOUSE to draw the sade-zone on the map.'
                      placement='top'
                    >
                      <DrawIcon
                        style={{
                          color: envConf.activeSadeZoneIndex === index ? '#F5F5DC' : '#FF7F50',
                        }}
                      />
                    </BootstrapTooltip>
                  </Button>
                  <Button onClick={(e) => handleActionClick(e, 'reset', index, sade)}>
                    <BootstrapTooltip title='Resets current sade-zone values' placement='top'>
                      <RefreshIcon />
                    </BootstrapTooltip>
                  </Button>
                  <Button onClick={(e) => handleActionClick(e, 'delete', index)}>
                    <BootstrapTooltip title='Deletes current sade-zone' placement='top'>
                      <DeleteIcon />
                    </BootstrapTooltip>
                  </Button>
                </ButtonGroup>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: '#75531E47' }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Name', key: 'name', type: 'text' },
                  { label: 'Height (m)', key: 'height', type: 'number', step: 1 },
                  { label: 'Length (m)', key: 'length', type: 'number', step: 1 },
                  { label: 'Width (m)', key: 'width', type: 'number', step: 1 },
                  { label: 'Center Latitude', key: 'centerLat', type: 'number', step: 0.0001 },
                  { label: 'Center Longitude', key: 'centerLong', type: 'number', step: 0.0001 },
                ].map((field, i) => {
                  if (field.key === 'name') {
                    return (
                      <Grid item xs={6} key={i}>
                        <StyledInputLabel id={field.key}>{field.label}</StyledInputLabel>
                        <TextField
                          id={field.key}
                          type={field.type}
                          variant='outlined'
                          value={sade[field.key]}
                          onChange={(e) => handleChange(e, index)}
                          sx={{
                            backgroundColor: '#71665E',
                            '& .MuiOutlinedInput-root': {
                              '& .MuiInputBase-input': {
                                padding: '6px 8px',
                                fontSize: '1.2rem',
                              },
                            },
                          }}
                          error={duplicateNameIndex === index}
                          helperText={
                            duplicateNameIndex === index ? 'Duplicate name detected!' : ''
                          }
                          FormHelperTextProps={{
                            component: 'div',
                            style: { color: 'white' },
                          }}
                          InputProps={{
                            endAdornment: duplicateNameIndex === index && (
                              <IconButton>
                                <WarningAmberIcon color='error' />
                              </IconButton>
                            ),
                          }}
                        />
                      </Grid>
                    );
                  } else {
                    return (
                      (field.key === 'height' || sade.rectangle !== null) && (
                        <Grid item xs={6} key={i}>
                          <StyledInputLabel id={field.key}>{field.label}</StyledInputLabel>
                          {['centerLat', 'centerLong'].includes(field.key) ? (
                            <BootstrapTooltip
                              title={`Stepping distance of 0.0001, equivalent to 1m`}
                              placement='bottom'
                            >
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
                                value={sade[field.key] ?? 0}
                                inputProps={{ step: field.step ?? null }}
                                fullWidth
                              />
                            </BootstrapTooltip>
                          ) : (
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
                              value={sade[field.key] ?? 0}
                              inputProps={{ step: field.step ?? null }}
                              fullWidth
                            />
                          )}
                        </Grid>
                      )
                    );
                  }
                })}
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
