import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography } from '@mui/material';
import { EvStation } from '@mui/icons-material';
import { RootState } from '../../store';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <EvStation sx={{ fontSize: 36, color: 'white' }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            EV Charging Admin
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue
          </Typography>
        </Box>

        <Outlet />
      </Paper>
    </Box>
  );
};

export default AuthLayout;
