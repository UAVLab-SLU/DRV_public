import { Box } from '@mui/material';
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
  const { clearAllDrones } = useMainJson();

  useEffect(() => {
    clearAllDrones();
  }, []);

 console.log({location });
  return (
    <>
      <Box sx={style}>
        <HorizontalLinearStepper desc={location.state.descs} title={location.state.title}/>
      </Box>
    </>
  );
};

export default Wizard;
