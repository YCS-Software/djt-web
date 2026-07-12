import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchReservations } from '../../features/reservations/reservationsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { formatDate } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'code', headerName: 'Code', flex: 1, minWidth: 120 },
  { field: 'user', headerName: 'User', flex: 1, minWidth: 120 },
  { field: 'station', headerName: 'Station', flex: 1, minWidth: 120 },
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDate(p.value) },
  { field: 'time', headerName: 'Time', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const Reservations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).reservations);

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Reservations" subtitle="Connector reservations" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Reservations;
