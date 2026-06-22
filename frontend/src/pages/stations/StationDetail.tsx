import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const StationDetail: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Station Detail" backButton />
      <Typography>Station detail with connectors and live data</Typography>
    </Box>
  );
};

export default StationDetail;
