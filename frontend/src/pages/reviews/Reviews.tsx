import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Reviews: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Reviews" subtitle="View and respond to station reviews" />
      <Typography>Reviews list component</Typography>
    </Box>
  );
};

export default Reviews;
