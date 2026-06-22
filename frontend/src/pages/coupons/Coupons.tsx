import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Coupons: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Coupons" subtitle="Manage promotional coupons" />
      <Typography>Coupons list and creation</Typography>
    </Box>
  );
};

export default Coupons;
