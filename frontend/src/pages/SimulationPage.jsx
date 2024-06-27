import { Box } from '@mui/material';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import HorizontalLinearStepper from '../components/SimulationPageComponents/HorizontalLinearStepper';
import { MainJsonProvider } from '../components/MainJsonContext/MainJsonContext';
import { simulationMainBoxstyle } from '../css/SimulationPageStyles';



const requirementsArray = [
  {}
]

const Simulation = () => {

  const location = useLocation()

  if (!location.state) {
    // here we move back the user to /home since he havent selected anything
    return <Navigate to="/home" />
  } else {
    return (
      <>
        <Box sx={simulationMainBoxstyle}>
          <MainJsonProvider>
            <HorizontalLinearStepper desc={location.state.descs} title={location.state.title} />
          </MainJsonProvider>
        </Box>
      </>
    );
  };
}

export default Simulation;