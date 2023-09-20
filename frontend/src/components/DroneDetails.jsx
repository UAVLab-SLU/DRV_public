import { Typography, Select, MenuItem } from '@mui/material';
import { Box } from '@mui/system';
import colors from '../utils/colors';

const DroneDetails = (props) => {
  const handleChange = (event) => {
    // Handle the selected option here
    const selectedOption = event.target.value;
    // You can perform any actions you need with the selected option
    console.log(selectedOption);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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




      <Box sx={{ marginLeft: '20px' }}>
        <Typography sx={{ display: 'flex' }}>Options:</Typography>
        <Select
          value={props.selectedOption}
          onChange={handleChange}
          sx={{ width: 100 }}
        >
          <MenuItem value={1}>Drone Option 1</MenuItem>

          <MenuItem value={2}>Option 2</MenuItem>

          <MenuItem value={3}>Option 3 Add more as needed</MenuItem>

        </Select>
      </Box>



    </Box>
  );
};

export default DroneDetails;
