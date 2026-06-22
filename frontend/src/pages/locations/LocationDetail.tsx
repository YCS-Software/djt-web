import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const LocationDetail: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Location Detail" backButton />
      <Typography>Location detail with map</Typography>
    </Box>
  );
};

export default LocationDetail;
