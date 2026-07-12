import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchDisputes } from '../../features/disputes/disputesSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { formatDateTime } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'user', headerName: 'User', flex: 1, minWidth: 120 },
  { field: 'subject', headerName: 'Subject', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const Disputes: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).disputes);

  useEffect(() => {
    dispatch(fetchDisputes());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Disputes" subtitle="Customer disputes and resolutions" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Disputes;
