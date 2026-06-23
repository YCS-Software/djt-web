import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchLocations } from '../../features/locations/locationsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return isNaN(n) ? String(value) : n.toFixed(2);
};

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'code', headerName: 'Code', flex: 1, minWidth: 120 },
  { field: 'city', headerName: 'City', flex: 1, minWidth: 120 },
  { field: 'state', headerName: 'State', flex: 1, minWidth: 120 },
  { field: 'totalChargers', headerName: 'Total Chargers', flex: 1, minWidth: 120 },
  {
    field: 'pricePerKwh',
    headerName: 'Price/kWh',
    flex: 1,
    minWidth: 120,
    valueFormatter: (value) => formatNumber(value),
  },
  { field: 'rating', headerName: 'Rating', flex: 1, minWidth: 120, type: 'number' },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const Locations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).locations);

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Locations" subtitle="Charging site locations across the network" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Locations;
