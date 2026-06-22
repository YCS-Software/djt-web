import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const PartnerDetail: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Partner Detail" backButton />
      <Typography>Partner detail component</Typography>
    </Box>
  );
};

export default PartnerDetail;
