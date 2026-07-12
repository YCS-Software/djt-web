import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchReviews } from '../../features/reviews/reviewsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'user', headerName: 'User', flex: 1, minWidth: 120 },
  { field: 'station', headerName: 'Station', flex: 1, minWidth: 120 },
  { field: 'rating', headerName: 'Rating', type: 'number', flex: 1, minWidth: 120 },
  { field: 'review', headerName: 'Review', flex: 1, minWidth: 120 },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const Reviews: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).reviews);

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader
        title="Reviews"
        subtitle="Driver reviews of charging stations"
      />
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        autoHeight
      />
    </Box>
  );
};

export default Reviews;
