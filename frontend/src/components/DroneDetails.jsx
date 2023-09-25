import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import colors from '../utils/colors';

const DroneDetails = (props) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Box sx={{ display: 'flex' }}>
        <Typography sx={{ display: 'flex' }}>Name:</Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 40,
            bgcolor: colors.SKY_BLUE,
            borderRadius: 1,
          }}
        >
          Drone 1
        </Box>
      </Box>
    </Box>
  );
};

export default DroneDetails;
