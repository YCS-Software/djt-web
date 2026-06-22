import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Tariffs: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Tariffs" subtitle="Manage pricing and tariff plans" />
      <Typography>Tariffs list and configuration</Typography>
    </Box>
  );
};

export default Tariffs;
