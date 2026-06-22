import React from 'react';
import { Box, Typography } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';

const Reports: React.FC = () => {
  return (
    <Box>
      <PageHeader title="Reports" subtitle="Generate and export reports" />
      <Typography>Reports dashboard with export options</Typography>
    </Box>
  );
};

export default Reports;
