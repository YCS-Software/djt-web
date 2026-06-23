import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchPartners } from '../../features/partners/partnersSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 120 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
  { field: 'stations', headerName: 'Stations', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120 },
];

const Partners: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).partners);

  useEffect(() => {
    dispatch(fetchPartners());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Partner Organizations" subtitle="Charging network partner organizations" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Partners;
