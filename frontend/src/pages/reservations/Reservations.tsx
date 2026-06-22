import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Reservations: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Reservations" subtitle="Manage connector reservations" />
      <Typography>Reservations list and calendar</Typography>
    </Box>
  );
};

export default Reservations;
