import * as React from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styled from '@emotion/styled';
import MissionConfiguration from './Configuration/MissionConfiguration';
import EnvironmentConfiguration from './EnvironmentConfiguration';
import MonitorControl from './MonitorControl';
import ImportConfigurationPanel from './Configuration/ImportConfigurationPanel';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import CesiumMap from './cesium/CesiumMap';
import { mapControls } from '../constants/map';
import ControlsDisplay from './Configuration/ControlsDisplay';
import { BASE_URL } from '../utils/const';
import { parseApiError } from '../utils/apiError';
import { buildTaskPayload } from '../utils/taskPayload';
import {
  isSupported as isSavedSettingsSupported,
  saveSnapshot,
} from '../services/savedSettingsStorage';
import { resolveLocationName } from '../services/locationNameResolver';
import { useMainJson } from '../contexts/MainJsonContext';
import { applyImportedConfig } from '../services/configImport/applyImportedConfig';

const StyledButton = styled(Button)`
  border-radius: 25px;
  font-size: 18px;
  font-weight: bolder;
`;

const steps = ['Environment Configuration', 'Mission Configuration', 'Test Configuration'];

function formatFetchError(error, endpointUrl) {
  if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
    return `Unable to reach backend at ${endpointUrl}. Start the backend service and try again.`;
  }

  return error?.message ?? 'Unexpected request failure.';
}

async function readJsonBody(response) {
  if (typeof response?.json === 'function') {
    return response.json();
  }

  if (typeof response?.text === 'function') {
    const bodyText = await response.text();
    return bodyText ? JSON.parse(bodyText) : {};
  }

  return {};
}

export default function HorizontalLinearStepper(data) {
  const navigate = useNavigate();
  const { replaceSimulationConfiguration } = useMainJson();
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [saveDialogError, setSaveDialogError] = React.useState('');
  const [saveConfigName, setSaveConfigName] = React.useState('');
  const [pendingSubmissionPayload, setPendingSubmissionPayload] = React.useState(null);
  const [mainJson, setJson, activeScreen] = React.useState({
    Drones: null,
    environment: null,
    monitors: null,
  });

  const windowSize = React.useRef([window.innerWidth, window.innerHeight]);

  const redirectToHome = () => {
    navigate('/');
  };

  const getCurrentLocationName = React.useCallback(() => {
    const origin = mainJson.environment?.Origin ?? {};
    return origin.Name ?? origin.name ?? '';
  }, [mainJson.environment]);

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const setMainJson = (envJson, id) => {
    setJson((prevState) => ({
      ...prevState,
      [id]: envJson,
    }));
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      setSubmitError('');
      setSaveDialogError('');
      const payload = getValidatedPayload();
      if (!payload) {
        return;
      }

      setPendingSubmissionPayload(payload);
      setSaveConfigName('');
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
        FuzzyTest: prevState.FuzzyTest ?? {
          target: 'Wind',
          precision: 5,
        },
        environment: {
          ...prevState.environment,
          enableFuzzy: undefined,
        },
      }));
    }
    if (
      mainJson.environment != null &&
      mainJson.environment.enableFuzzy == false &&
      mainJson.FuzzyTest != null
    ) {
      setJson((prevState) => {
        const nextState = { ...prevState };
        delete nextState.FuzzyTest;
        return nextState;
      });
    }
  }, [mainJson]);

  const applyConfigToWizard = React.useCallback(
    (config) => {
      if (!config) {
        return;
      }

      applyImportedConfig(config, {
        setWizardState: setJson,
        replaceSimulationConfiguration,
      });
    },
    [replaceSimulationConfiguration],
  );

  React.useEffect(() => {
    applyConfigToWizard(data.importedConfig ?? null);
  }, [applyConfigToWizard, data.importedConfig]);

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
    const endpointUrl = `${BASE_URL}/addTask`;
    try {
      console.log('POST /addTask payload:', payload);
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const apiError = await parseApiError(res);
        console.error('Submit failed:', apiError.code, apiError.details);
        setSubmitError(apiError.message);
        return false;
      }

      const data = await readJsonBody(res);
      console.log('Task queued:', data);
      return true;
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitError(`Submit failed: ${formatFetchError(err, endpointUrl)}`);
      return false;
    }
  }

  async function fetchSettingsPreview(payload) {
    const endpointUrl = `${BASE_URL}/api/simulation/settings/preview`;

    try {
      const res = await fetch(endpointUrl, {
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
    } catch (error) {
      throw new Error(formatFetchError(error, endpointUrl));
    }
  }

  async function handleFinishDecision(shouldSave) {
    setSubmitError('');
    setSaveDialogError('');

    const payload = pendingSubmissionPayload ?? getValidatedPayload();
    if (!payload) {
      setSaveDialogOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      if (shouldSave) {
        if (!isSavedSettingsSupported()) {
          throw new Error(
            'Browser private file storage is not supported in this browser. Choose No to submit without saving.',
          );
        }

        const locationName = await resolveLocationName(payload, getCurrentLocationName());
        const previewSettings = await fetchSettingsPreview(payload);
        await saveSnapshot(previewSettings, payload, {
          displayName: saveConfigName,
          locationLabel: locationName,
        });
      }

      const submitted = await queueTask(payload);
      if (submitted) {
        setSaveDialogOpen(false);
        setPendingSubmissionPayload(null);
        navigate('/reports');
      } else if (!shouldSave) {
        setSaveDialogError('Task submission failed. Review the error below and try again.');
      } else {
        setSaveDialogError(
          'Settings were saved, but task submission failed. Review the error below and try again.',
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
              <ImportConfigurationPanel
                onImportConfig={(config) => {
                  setSubmitError('');
                  applyConfigToWizard(config);
                }}
              />
              {stepsComponent.map((compo) => {
                return compo.id === activeStep + 1 ? (
                  <React.Fragment key={compo.id}>{compo.comp}</React.Fragment>
                ) : null;
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
                    ? isSubmitting
                      ? 'Submitting...'
                      : 'Finish'
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
          <Dialog
            open={saveDialogOpen}
            onClose={() => {
              if (!isSubmitting) {
                setSaveDialogOpen(false);
                setPendingSubmissionPayload(null);
              }
            }}
            fullWidth
          >
            <DialogTitle>Save settings.json and task.json before submission?</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1 }}>
                Save both the exact generated `settings.json` and the raw `task.json` payload to
                browser-private storage before submitting this simulation task.
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label='Saved config name'
                value={saveConfigName}
                onChange={(event) => setSaveConfigName(event.target.value)}
                disabled={isSubmitting}
                inputProps={{ 'data-testid': 'saved-config-name-input', maxLength: 80 }}
                helperText='Optional. Leave blank to use the snapshot id; entered text is prefixed to that id.'
                sx={{ mt: 2 }}
              />
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
                onClick={() => {
                  setSaveDialogOpen(false);
                  setPendingSubmissionPayload(null);
                }}
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
