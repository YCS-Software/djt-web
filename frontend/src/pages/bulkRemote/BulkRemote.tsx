import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { SettingsRemoteOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { bulkRemoteApi } from '../../services/api';

const GREEN = '#14532d';

const ACTIONS = [
  { value: 'Reset', label: 'Reset (Soft)' },
  { value: 'HardReset', label: 'Reset (Hard)' },
  { value: 'UnlockConnector', label: 'Unlock Connector' },
  { value: 'RemoteStop', label: 'Remote Stop' },
  { value: 'ClearCache', label: 'Clear Cache' },
  { value: 'UpdateFirmware', label: 'Update Firmware' },
];

const columns = [
  { field: 'name', headerName: 'Station', flex: 1, minWidth: 160 },
  { field: 'code', headerName: 'Code', width: 130 },
  { field: 'city', headerName: 'City', flex: 1, minWidth: 120 },
  { field: 'status', headerName: 'Status', width: 120 },
];

const BulkRemote: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('Reset');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    bulkRemoteApi
      .list()
      .then((r) => setRows((r.data?.rows || r.data?.data || r.data || []).map((x: any, i: number) => ({ id: x.id ?? i, ...x }))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const execute = async () => {
    if (!selected.length) {
      setToast({ msg: 'Select at least one station', type: 'error' });
      return;
    }
    setBusy(true);
    try {
      await bulkRemoteApi.execute({ action, stationIds: selected });
      setToast({ msg: `"${action}" sent to ${selected.length} station(s)`, type: 'success' });
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.error || 'Failed to send command', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Bulk Remote" subtitle="Send remote commands to multiple charging stations" />

      <Card elevation={0} sx={{ border: '1px solid #eef0f3', borderRadius: 2, mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField select label="Remote Action" value={action} onChange={(e) => setAction(e.target.value)} size="small" fullWidth>
                {ACTIONS.map((a) => (
                  <MenuItem key={a.value} value={a.value}>
                    {a.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                {selected.length} station(s) selected
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
              <Button
                variant="contained"
                startIcon={<SettingsRemoteOutlined />}
                onClick={execute}
                disabled={busy}
                sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#0f3d22' }, textTransform: 'none', fontWeight: 600 }}
              >
                {busy ? 'Sending…' : 'Execute'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        autoHeight
        checkboxSelection
        onSelectionChange={(ids) => setSelected(ids)}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? (
          <Alert severity={toast.type} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default BulkRemote;
