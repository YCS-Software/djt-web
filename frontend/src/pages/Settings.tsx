import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../components/common/PageHeader';

const Settings: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Settings" subtitle="System configuration and preferences" />
      <Typography>Settings panel with tabs</Typography>
    </Box>
  );
};

export default Settings;
