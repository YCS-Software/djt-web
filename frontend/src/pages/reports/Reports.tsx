import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchReports } from '../../features/reports/reportsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return isNaN(n) ? String(value) : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'station', headerName: 'Station', flex: 1, minWidth: 120 },
  { field: 'city', headerName: 'City', flex: 1, minWidth: 120 },
  { field: 'sessions', headerName: 'Sessions', flex: 1, minWidth: 120 },
  { field: 'energyKwh', headerName: 'Energy Kwh', flex: 1, minWidth: 120, valueFormatter: (params) => formatNumber(params.value) },
  { field: 'revenue', headerName: 'Revenue', flex: 1, minWidth: 120, valueFormatter: (params) => formatNumber(params.value) },
];

const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).reports);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Revenue, energy and session reports by station" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Reports;
