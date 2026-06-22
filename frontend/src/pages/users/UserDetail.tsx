import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const UserDetail: React.FC = () => {
  return (
    <Box>
      <PageHeader title="User Detail" backButton />
      <Typography>User detail component - implement user profile here</Typography>
    </Box>
  );
};

export default UserDetail;
