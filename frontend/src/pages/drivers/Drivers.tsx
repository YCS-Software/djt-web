import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Drivers: React.FC = () => {
  return (
    <Box>
      <PageHeader title="EV Drivers" subtitle="Manage driver accounts and wallets" />
      <Typography>Drivers list component</Typography>
    </Box>
  );
};

export default Drivers;
