import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchDrivers } from '../../features/drivers/driversSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const formatMoney = (value: any) => {
  const n = Number(value);
  return Number.isNaN(n) ? '' : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 120 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
  {
    field: 'walletBalance',
    headerName: 'Wallet Balance',
    flex: 1,
    minWidth: 120,
    valueFormatter: (value) => formatMoney(value),
  },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120 },
];

const Drivers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).drivers);

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader
        title="EV Drivers"
        subtitle="Registered EV drivers and wallet balances"
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

export default Drivers;
