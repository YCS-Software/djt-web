import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { Home, ErrorOutline } from '@mui/icons-material';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      p={3}
    >
      <ErrorOutline sx={{ fontSize: 120, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h1" fontWeight="bold" color="text.primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        startIcon={<Home />}
        onClick={() => navigate('/dashboard')}
        size="large"
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
