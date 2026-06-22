import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Partners: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Partners" subtitle="Manage charging network partners" />
      <Typography>Partners list component</Typography>
    </Box>
  );
};

export default Partners;
