import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const SessionDetail: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Session Detail" backButton />
      <Typography>Session details, meter values, billing</Typography>
    </Box>
  );
};

export default SessionDetail;
