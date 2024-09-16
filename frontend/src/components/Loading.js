import React from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';

const Loading = () => {
  const isLoading = useSelector((state) => state.loading.isLoading);

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default Loading;
