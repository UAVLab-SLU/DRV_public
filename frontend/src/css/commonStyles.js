import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { Box, Button, TextField, Modal, Typography, Grid, InputLabel, MenuItem, FormControl, Select, Divider } from '@mui/material';

export const StyledButton = styled(Button)`
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  height: 50px;
  width: 370px;
  color: 'white';
  border: 2px solid #CC7E09;
  background-color: transparent;
  font-size: 38px;
  &:hover {
    background-color: #CC7E09;
  }
  
  &:active{
    background-color: #CC7E09;
    border: 2px solid #CC7E09;
  }
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

export const StyledBackground = {
  backgroundImage: 'url("/images/dji-air-4.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100vw',
  height: '100vh',
};

export const StyledBox = {
  background: 'linear-gradient(to bottom, #211401 14%, #3D250199 66%, #3C260350 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  width: '30vw',
  height: '100vh',
  transform: 'translateX(-93%)',
};

export const StyledHiddenBox = {
  background: 'linear-gradient(to bottom, #211401 24%, #3C260358 100%)',
  display:'flex',
  flexDirection:'column',
  alignItems: 'left',
  width: '62.9vw',
  height: '20vh',
  position: 'absolute',
  top: '80vh',
  right: '0vw',
  visibility: 'hidden',
  padding: '10px',
  color: 'white',
};

export const StyledDivider = {
  width: '80%',
  height: '4px',
  backgroundColor: '#DEE2E6',
  marginTop: '15px',
  alignItems: 'center',
};