import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { Box, Button, TextField, Modal, Typography, Grid, InputLabel, MenuItem, FormControl, Select } from '@mui/material';

export const StyledButton = styled(Button)`
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  height: 50px;
`;

export const StyledText = styled.p`
  font-weight: bold;
  font-size: 20px;
`;

export const StyledLink = styled(Link)`
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px !important;
  width: 300px !important;
`;

export const StyledTextField = styled(TextField)`
  width: 800px;
  height: 200px;
`;

// Modal styles
export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800, // Increase the width
  height: 400, // Increase the height
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


export const homePageBoxStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexDirection: 'column',
  '& > :not(style)': {
    m: 1,
    width: 1000,
  },
}
