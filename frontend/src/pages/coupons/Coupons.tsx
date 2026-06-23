import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchCoupons } from '../../features/coupons/couponsSlice';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const columns: GridColDef[] = [
  { field: 'code', headerName: 'Code', flex: 1, minWidth: 120 },
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 120 },
  { field: 'discountType', headerName: 'Discount Type', flex: 1, minWidth: 120 },
  {
    field: 'discountValue',
    headerName: 'Discount Value',
    flex: 1,
    minWidth: 120,
    valueFormatter: (params) =>
      params.value == null || params.value === '' ? '' : Number(params.value).toFixed(2),
  },
  { field: 'startDate', headerName: 'Start Date', flex: 1, minWidth: 120 },
  { field: 'endDate', headerName: 'End Date', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const Coupons: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).coupons);

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader title="Coupons" subtitle="Discount offers and promo codes" />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />
    </Box>
  );
};

export default Coupons;
