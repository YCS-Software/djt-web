import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const DriverDetail: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Driver Detail" backButton />
      <Typography>Driver profile, wallet, vehicles, sessions</Typography>
    </Box>
  );
};

export default DriverDetail;
