import * as React from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import MissionConfiguration from './Configuration/MissionConfiguration';
import EnvironmentConfiguration from './EnvironmentConfiguration';
import MonitorControl from './MonitorControl';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import CesiumMap from './cesium/CesiumMap';
import { mapControls } from '../constants/map';
import ControlsDisplay from './Configuration/ControlsDisplay';
import { BASE_URL } from '../utils/const';
import { buildTaskPayload } from '../utils/taskPayload';
import { isSupported as isSavedSettingsSupported, saveSnapshot } from '../services/savedSettingsStorage';

const StyledButton = styled(Button)`
  border-radius: 25px;
  font-size: 18px;
  font-weight: bolder;
`;

const steps = ['Environment Configuration', 'Mission Configuration', 'Test Configuration'];

export default function HorizontalLinearStepper(data) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [saveDialogError, setSaveDialogError] = React.useState('');
  const [mainJson, setJson, activeScreen] = React.useState({
    Drones: null,
    environment: null,
    monitors: null,
  });

  const windowSize = React.useRef([window.innerWidth, window.innerHeight]);

  const redirectToHome = () => {
    navigate('/');
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const setMainJson = (envJson, id) => {
    if (
      id == 'environment' &&
      mainJson.Drones != null &&
      mainJson.Drones[0].X != envJson.Origin.Latitude
    ) {
      setJson((prevState) => ({
        ...prevState,
        Drones: null,
      }));
    }
    setJson((prevState) => ({
      ...prevState,
      [id]: envJson,
    }));
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      setSubmitError('');
      setSaveDialogError('');
      setSaveDialogOpen(true);
      return;
    }

    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  React.useEffect(() => {
    if (
      mainJson.environment != null &&
      mainJson.environment.enableFuzzy == true &&
      mainJson.environment.enableFuzzy != null
    ) {
      setJson((prevState) => ({
        ...prevState,
        FuzzyTest: {
          target: 'Wind',
          precision: 5,
        },
      }));
      delete mainJson.environment['enableFuzzy'];
    }
    if (
      mainJson.environment != null &&
      mainJson.environment.enableFuzzy == false &&
      mainJson.FuzzyTest != null
    ) {
      delete mainJson.FuzzyTest;
    }
  }, [mainJson]);

  function getValidatedPayload() {
    const payload = buildTaskPayload(mainJson);

    if (payload.Drones.length === 0) {
      const message = 'No drones configured. Please complete Mission Configuration.';
      console.warn(message);
      setSubmitError(message);
      return null;
    }

    if (
      !payload.environment ||
      (payload.environment.UseGeo &&
        (payload.environment.Origin.Latitude == null ||
          payload.environment.Origin.Longitude == null))
    ) {
      const message = 'Environment is incomplete. Please review Environment Configuration.';
      console.warn(message);
      setSubmitError(message);
      return null;
    }

    return payload;
  }

  async function queueTask(payload) {
    try {
      console.log('POST /addTask payload:', payload);
      const res = await fetch(`${BASE_URL}/addTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const bodyText = await res.text(); 
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${bodyText}`);

      let data;
      try {
        data = JSON.parse(bodyText);
      } catch {
        data = { raw: bodyText };
      }
      console.log('Task queued:', data);
      return true;

    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitError(`Submit failed: ${err.message}`);
      return false;
    }
  }

  async function fetchSettingsPreview(payload) {
    const res = await fetch(`${BASE_URL}/api/simulation/settings/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${bodyText}`);
    }

    const responseBody = JSON.parse(bodyText);
    if (!responseBody?.settings) {
      throw new Error('Preview response did not include settings.');
    }

    return responseBody.settings;
  }

  async function handleFinishDecision(shouldSave) {
    setSubmitError('');
    setSaveDialogError('');

    const payload = getValidatedPayload();
    if (!payload) {
      setSaveDialogOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      if (shouldSave) {
        if (!isSavedSettingsSupported()) {
          throw new Error(
            'Browser private file storage is not supported in this browser. Choose No to submit without saving.'
          );
        }

        const previewSettings = await fetchSettingsPreview(payload);
        await saveSnapshot(previewSettings, payload);
      }

      const submitted = await queueTask(payload);
      if (submitted) {
        setSaveDialogOpen(false);
        navigate('/reports');
      } else if (!shouldSave) {
        setSaveDialogError('Task submission failed. Review the error below and try again.');
      } else {
        setSaveDialogError(
          'Settings were saved, but task submission failed. Review the error below and try again.'
        );
      }
    } catch (error) {
      const message = shouldSave
        ? `Save failed: ${error.message}`
        : `Submit failed: ${error.message}`;
      setSaveDialogError(message);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepsComponent = [
    {
      name: 'Environment Configuration',
      id: 1,
      comp: (
        <EnvironmentConfiguration
          environmentJson={setMainJson}
          id='environment'
          mainJsonValue={mainJson}
        />
      ),
    },
    {
      name: 'Mission Configuration',
      id: 2,
      comp: (
        <MissionConfiguration
          droneArrayJson={setMainJson}
          id='Drones'
          mainJsonValue={mainJson}
          windowHeight={windowSize.current[1]}
        />
      ),
    },
    {
      name: 'Test Configuration',
      id: 3,
      comp: (
        <MonitorControl
          monitorJson={setMainJson}
          id='monitors'
          mainJsonValue={mainJson}
          windowHeight={windowSize.current[1]}
        />
      ),
    },
  ];

  return (
    <Box sx={{ width: '95%' }}>
      <Typography sx={{ mb: 1 }} variant='h4' component='h4'>
        Requirement
        <Tooltip title='Home' placement='bottom'>
          <HomeIcon
            style={{ float: 'right', cursor: 'pointer', fontSize: '35px' }}
            onClick={redirectToHome}
          />
        </Tooltip>
      </Typography>
      <Typography sx={{ mt: 2, mb: 1 }} variant='h6' component='h4'>
        {data.desc}
      </Typography>
      <Stepper activeStep={activeStep} style={{ padding: 20 }}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === steps.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            Submitting configuration. Redirecting to reports...
          </Typography>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Box
            sx={{
              display: 'flex',
            }}
          >
            <Box sx={{ width: '45%' }}>
              {stepsComponent.map((compo) => {
                return compo.id === activeStep + 1 ? compo.comp : '';
              })}
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <StyledButton
                    color='inherit'
                    disabled={activeStep === 0 || isSubmitting}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                    variant='outlined'
                  >
                    Back
                </StyledButton>
                <Box sx={{ flex: '1 1 auto' }} />
                <StyledButton variant='outlined' onClick={handleNext} disabled={isSubmitting}>
                  {activeStep === steps.length - 1
                    ? (isSubmitting ? 'Submitting...' : 'Finish')
                    : 'Next'}
                </StyledButton>
              </Box>
              {submitError && (
                <Typography sx={{ mt: 1, color: 'error.main' }}>{submitError}</Typography>
              )}
            </Box>

            <Box sx={{ width: '55%', overflow: 'hidden', ml: 5 }}>
              <Grid container>
                <ControlsDisplay mapControl={mapControls.default} />
                <Grid item xs={12}>
                  <CesiumMap activeConfigStep={activeStep} />
                </Grid>

                <ControlsDisplay mapControl={mapControls[activeScreen]} />
              </Grid>
            </Box>
          </Box>
          <Dialog open={saveDialogOpen} onClose={() => !isSubmitting && setSaveDialogOpen(false)} fullWidth>
            <DialogTitle>Save settings.json and task.json before submission?</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1 }}>
                Do you want to save both the exact generated `settings.json` and the raw `task.json`
                payload to browser-private storage before submitting this simulation task?
              </Typography>
              {!isSavedSettingsSupported() && (
                <Typography color='error.main'>
                  Browser private file storage is not supported here. Choose No to submit without
                  saving.
                </Typography>
              )}
              {saveDialogError && (
                <Typography sx={{ mt: 2, color: 'error.main' }}>{saveDialogError}</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <StyledButton
                variant='outlined'
                onClick={() => setSaveDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </StyledButton>
              <StyledButton
                variant='outlined'
                onClick={() => handleFinishDecision(false)}
                disabled={isSubmitting}
              >
                No, just submit
              </StyledButton>
              <StyledButton
                variant='outlined'
                onClick={() => handleFinishDecision(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Working...' : 'Yes, save both and submit'}
              </StyledButton>
            </DialogActions>
          </Dialog>
        </React.Fragment>
      )}
    </Box>
  );
}
