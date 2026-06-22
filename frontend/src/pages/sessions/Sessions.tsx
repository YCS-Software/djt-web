import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Sessions: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Charging Sessions" subtitle="View and manage charging sessions" />
      <Typography>Sessions list with filters</Typography>
    </Box>
  );
};

export default Sessions;
