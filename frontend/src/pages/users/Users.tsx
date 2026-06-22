import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Users: React.FC = () => {
  return (
    <Box>
      <PageHeader title="User Management" subtitle="Manage system users and their roles" />
      <Typography>Users list component - implement data grid here</Typography>
    </Box>
  );
};

export default Users;
