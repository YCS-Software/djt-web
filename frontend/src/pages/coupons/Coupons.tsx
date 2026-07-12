import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Snackbar, Alert } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchCoupons } from '../../features/coupons/couponsSlice';
import { couponsApi } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormDialog, { FieldDef } from '../../components/common/FormDialog';
import { formatDate } from '../../utils/date';

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
  { field: 'startDate', headerName: 'Start Date', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDate(p.value) },
  { field: 'endDate', headerName: 'End Date', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDate(p.value) },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const fields: FieldDef[] = [
  { name: 'code', label: 'Coupon Code', required: true },
  { name: 'title', label: 'Title', required: true },
  {
    name: 'discountType',
    label: 'Discount Type',
    type: 'select',
    options: [
      { value: 'percentage', label: 'Percentage' },
      { value: 'flat', label: 'Flat' },
    ],
  },
  { name: 'discountValue', label: 'Discount Value', type: 'number' },
  { name: 'minAmount', label: 'Min Transaction Amount', type: 'number' },
  { name: 'maxUses', label: 'Max Uses / User', type: 'number' },
  { name: 'startDate', label: 'Start Date', helperText: 'YYYY-MM-DD' },
  { name: 'endDate', label: 'End Date', helperText: 'YYYY-MM-DD' },
];

const Coupons: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).coupons);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const handleSubmit = async (values: Record<string, any>) => {
    setSaving(true);
    try {
      await couponsApi.create(values);
      setToast({ msg: 'Coupon created', type: 'success' });
      setFormOpen(false);
      dispatch(fetchCoupons());
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.error || 'Failed to create coupon', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Coupons"
        subtitle="Discount offers and promo codes"
        action={{ label: 'Add Coupon', onClick: () => setFormOpen(true) }}
      />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />

      <FormDialog
        open={formOpen}
        title="Add Coupon"
        fields={fields}
        loading={saving}
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert severity={toast.type} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default Coupons;
