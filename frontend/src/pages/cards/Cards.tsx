import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Snackbar, Alert } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchCards } from '../../features/cards/cardsSlice';
import { cardsApi } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormDialog, { FieldDef } from '../../components/common/FormDialog';
import { formatDateTime, formatDate } from '../../utils/date';

const columns: GridColDef[] = [
  { field: 'user', headerName: 'User', flex: 1, minWidth: 120 },
  { field: 'type', headerName: 'Type', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
  { field: 'expiresAt', headerName: 'Expires At', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDate(p.value) },
  { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 120, valueFormatter: (p: any) => formatDateTime(p.value) },
];

const fields: FieldDef[] = [
  { name: 'userId', label: 'EV Driver User ID', type: 'number', required: true, helperText: 'usr_id of the driver' },
  { name: 'rfid', label: 'RFID / Card Number', required: true },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'rfid', label: 'RFID' },
      { value: 'virtual', label: 'Virtual' },
    ],
  },
  { name: 'expiresAt', label: 'Expires At', helperText: 'YYYY-MM-DD (default +1 year)' },
];

const Cards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rows, loading } = useSelector((s: RootState) => (s as any).cards);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    dispatch(fetchCards());
  }, [dispatch]);

  const handleSubmit = async (values: Record<string, any>) => {
    setSaving(true);
    try {
      await cardsApi.create(values);
      setToast({ msg: 'Charge card created', type: 'success' });
      setFormOpen(false);
      dispatch(fetchCards());
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.error || 'Failed to create card', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Charge Cards"
        subtitle="RFID / charge tokens issued to drivers"
        action={{ label: 'Add Charge Card', onClick: () => setFormOpen(true) }}
      />
      <DataTable rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} autoHeight />

      <FormDialog
        open={formOpen}
        title="Add Charge Card"
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

export default Cards;
