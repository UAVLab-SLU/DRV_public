import { Alert, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HorizontalLinearStepper from '../components/HorizontalLinearStepper';
import { useMainJson } from '../contexts/MainJsonContext';

const style = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '95%',
  height: '90%',
  bgcolor: 'background.paper',
  p: 4,
};

const Wizard = () => {
  const location = useLocation();
  const routeState = location.state ?? {};
  const { clearAllDrones } = useMainJson();

  useEffect(() => {
    if (!routeState.importedConfig) {
      clearAllDrones();
    }
  }, []);

  return (
    <>
      <Box sx={style}>
        <Box sx={{ width: '100%' }}>
          {routeState.importStatus && (
            <Alert severity={routeState.importStatus.severity} sx={{ mb: 2 }}>
              <div>{routeState.importStatus.message}</div>
              {routeState.importStatus.details?.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                  {routeState.importStatus.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
          <HorizontalLinearStepper
            desc={routeState.descs ?? 'Load or edit a simulation configuration.'}
            title={routeState.title ?? ''}
            importedConfig={routeState.importedConfig ?? null}
          />
        </Box>
      </Box>
    </>
  );
};

export default Wizard;
