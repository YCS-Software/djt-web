import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Disputes: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Disputes" subtitle="Handle customer disputes and complaints" />
      <Typography>Disputes list and management</Typography>
    </Box>
  );
};

export default Disputes;
