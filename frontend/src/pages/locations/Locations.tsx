import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Locations: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Locations" subtitle="Manage charging locations" />
      <Typography>Locations list with map component</Typography>
    </Box>
  );
};

export default Locations;
