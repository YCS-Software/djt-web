import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchStations } from '../../features/stations/stationsSlice';
import { stationsApi } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormDialog, { FieldDef } from '../../components/common/FormDialog';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'serial', headerName: 'Serial', flex: 1, minWidth: 120 },
  { field: 'ocppId', headerName: 'OCPP ID', flex: 1, minWidth: 120 },
  { field: 'type', headerName: 'Type', flex: 1, minWidth: 120 },
  { field: 'power', headerName: 'Power', flex: 1, minWidth: 120 },
  { field: 'connectors', headerName: 'Connectors', flex: 1, minWidth: 120 },
  { field: 'station', headerName: 'Station', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

const fields: FieldDef[] = [
  { name: 'stationId', label: 'Station ID', type: 'number', required: true, helperText: 'sttn_id (location/site)' },
  { name: 'name', label: 'Charger Name', required: true },
  { name: 'serial', label: 'Serial Number' },
  { name: 'ocppId', label: 'OCPP ID' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'AC', label: 'AC' },
      { value: 'DC', label: 'DC' },
      { value: 'DCS', label: 'DCS' },
    ],
  },
  { name: 'power', label: 'Max Power', helperText: 'e.g. 60kW' },
  { name: 'connectors', label: 'Connectors', type: 'number' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'available', label: 'Available' },
      { value: 'offline', label: 'Offline' },
      { value: 'maintenance', label: 'Maintenance' },
    ],
  },
];

const Stations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { rows, loading } = useSelector((s: RootState) => (s as any).stations);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    dispatch(fetchStations());
  }, [dispatch]);

  const handleSubmit = async (values: Record<string, any>) => {
    setSaving(true);
    try {
      await stationsApi.create(values);
      setToast({ msg: 'Charging station created', type: 'success' });
      setFormOpen(false);
      dispatch(fetchStations());
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.error || 'Failed to create station', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Charging Stations"
        subtitle="Chargers (machines) across all locations"
        action={{ label: 'Add Charging Station', onClick: () => setFormOpen(true) }}
      />
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        onRowClick={(params) => navigate(`/stations/${params.row.id}`)}
        autoHeight
      />

      <FormDialog
        open={formOpen}
        title="Add Charging Station"
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

export default Stations;
