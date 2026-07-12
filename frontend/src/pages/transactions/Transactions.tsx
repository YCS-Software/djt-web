import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchTransactions } from '../../features/transactions/transactionsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { formatDateTime } from '../../utils/date';

const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return isNaN(n) ? String(value) : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'user', headerName: 'User', flex: 1, minWidth: 120 },
  { field: 'type', headerName: 'Type', flex: 1, minWidth: 120 },
  { field: 'category', headerName: 'Category', flex: 1, minWidth: 120 },
  { field: 'amount', headerName: 'Amount', flex: 1, minWidth: 120, valueFormatter: (params) => formatNumber(params.value) },
  { field: 'balanceAfter', headerName: 'Balance After', flex: 1, minWidth: 120, valueFormatter: (params) => formatNumber(params.value) },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const Transactions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).transactions);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Transactions" subtitle="Wallet and payment transactions" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Transactions;
