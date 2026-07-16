import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Snackbar,
  Alert,
  Typography,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  VisibilityOutlined,
  CloseOutlined,
  QrCodeScannerOutlined,
  EvStationOutlined,
  PaymentOutlined,
  DownloadOutlined,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../../store';
import { fetchStations } from '../../features/stations/stationsSlice';
import { stationsApi } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormDialog, { FieldDef } from '../../components/common/FormDialog';

const GREEN = '#14532d';
const VALUE = '#2f3b52';
const LABEL = '#8a94a6';

const baseColumns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'serial', headerName: 'Serial', flex: 1, minWidth: 120 },
  { field: 'ocppId', headerName: 'OCPP ID', flex: 1, minWidth: 120 },
  { field: 'type', headerName: 'Type', width: 90 },
  { field: 'power', headerName: 'Power', width: 100 },
  { field: 'connectors', headerName: 'Connectors', width: 110, type: 'number' },
  { field: 'station', headerName: 'Station', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', width: 120 },
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

// ── QR "Scan · Charge · Pay" dialog ─────────────────────────────────────────
const Step: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Stack alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        bgcolor: '#ecfdf5',
        color: GREEN,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: VALUE }}>{label}</Typography>
  </Stack>
);

const QrDialog: React.FC<{ station: any | null; onClose: () => void }> = ({ station, onClose }) => {
  const data = station ? `https://djt-ev.web.app/charge/${station.ocppId || station.id}` : '';
  const qrUrl = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(data)}`
    : '';

  const download = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${station?.ocppId || station?.id || 'station'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <Dialog open={!!station} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Header */}
      <Box sx={{ bgcolor: GREEN, color: '#fff', p: '10px 14px', position: 'relative' }}>
        <Typography sx={{ fontSize: 11, opacity: 0.85, fontWeight: 600, letterSpacing: 1 }}>SCAN · CHARGE · PAY</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 800, pr: 3 }} noWrap>
          {station?.name || 'Charging Station'}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', top: 6, right: 6, color: '#fff' }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: '12px 14px', textAlign: 'center' }}>
        {qrUrl && (
          <Box
            component="img"
            src={qrUrl}
            alt="Charging QR"
            sx={{ width: 150, height: 150, borderRadius: 1, border: '1px solid #eef0f3', p: '2px' }}
          />
        )}
        <Typography sx={{ fontSize: 12, color: LABEL, mt: '6px' }}>
          Scan this QR with the DJT EV app to start charging
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: '10px', mb: '2px' }}>
          <Step icon={<QrCodeScannerOutlined />} label="Scan" />
          <Step icon={<EvStationOutlined />} label="Charge" />
          <Step icon={<PaymentOutlined />} label="Pay" />
        </Stack>

        <Divider sx={{ my: '10px' }} />

        <Stack spacing={0.25} sx={{ textAlign: 'left' }}>
          {station?.ocppId && (
            <Typography sx={{ fontSize: 12.5, color: VALUE }}>
              <b>OCPP ID:</b> {station.ocppId}
            </Typography>
          )}
          {station?.serial && (
            <Typography sx={{ fontSize: 12.5, color: VALUE }}>
              <b>Serial:</b> {station.serial}
            </Typography>
          )}
          {station?.station && (
            <Typography sx={{ fontSize: 12.5, color: VALUE }}>
              <b>Location:</b> {station.station}
            </Typography>
          )}
        </Stack>

        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<DownloadOutlined />}
          onClick={download}
          sx={{ mt: '10px', bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 700 }}
        >
          Download QR
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const Stations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { rows, loading } = useSelector((s: RootState) => (s as any).stations);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [qrStation, setQrStation] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchStations());
  }, [dispatch]);

  const columns: GridColDef[] = useMemo(
    () => [
      ...baseColumns,
      {
        field: '__view',
        headerName: 'View',
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlined fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              setQrStation(params.row);
            }}
            sx={{ textTransform: 'none', color: GREEN, borderColor: GREEN, '&:hover': { borderColor: '#0f3d22', bgcolor: '#ecfdf5' } }}
          >
            View
          </Button>
        ),
      },
    ],
    []
  );

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

      <QrDialog station={qrStation} onClose={() => setQrStation(null)} />

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
