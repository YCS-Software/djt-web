import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Cards: React.FC = () => {
  return (
    <Box>
      <PageHeader title="RFID Cards" subtitle="Manage RFID charging cards" />
      <Typography>Cards list and requests</Typography>
    </Box>
  );
};

export default Cards;
