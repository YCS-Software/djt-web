import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Connectors: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Connectors" subtitle="Manage charging connectors and QR codes" />
      <Typography>Connectors list component</Typography>
    </Box>
  );
};

export default Connectors;
