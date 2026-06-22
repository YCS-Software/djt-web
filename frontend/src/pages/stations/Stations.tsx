import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Stations: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Charging Stations" subtitle="Manage OCPP charging stations" />
      <Typography>Stations list component</Typography>
    </Box>
  );
};

export default Stations;
