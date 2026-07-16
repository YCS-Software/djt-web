import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Dialog,
  DialogContent,
  Alert,
  Button,
} from '@mui/material';
import { RefreshOutlined, CloseOutlined, ArrowBackOutlined } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { logsApi, sessionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const GREEN = '#14532d';
const CARD_BORDER = '#eef0f3';

const dirColor = (d: string) => (/in/i.test(d) ? '#1565c0' : /out/i.test(d) ? '#2e7d32' : '#8a94a6');
const typeColor = (t: string) => (/error/i.test(t) ? '#c62828' : /result/i.test(t) ? '#2e7d32' : /call/i.test(t) ? '#1565c0' : '#8a94a6');

const REFRESH_MS = 20000;

const ServerLogs: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('sessionId');

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any | null>(null);

  // Filters (client-side over the fetched CSMS logs).
  const [direction, setDirection] = useState('all');
  const [messageType, setMessageType] = useState('all');
  const [station, setStation] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Scoped to one session when `?sessionId=` is present, else the full CSMS feed.
  const load = useCallback(() => {
    setLoading(true);
    const req = sessionId ? sessionsApi.logs(sessionId) : logsApi.ocpp();
    req
      .then((r) => setRows(r.data?.rows || r.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    load();
    // Only the full feed auto-refreshes; a session view stays put.
    if (sessionId) return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load, sessionId]);

  const directionOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.direction).filter(Boolean))) as string[], [rows]);
  const typeOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.messageType).filter(Boolean))) as string[], [rows]);
  const stationOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.stationName).filter(Boolean))) as string[], [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (direction !== 'all' && r.direction !== direction) return false;
      if (messageType !== 'all' && r.messageType !== messageType) return false;
      if (station !== 'all' && r.stationName !== station) return false;
      if (startDate || endDate) {
        const t = r.timestamp ? new Date(r.timestamp).getTime() : NaN;
        if (Number.isNaN(t)) return false;
        if (startDate && t < new Date(startDate + 'T00:00:00').getTime()) return false;
        if (endDate && t > new Date(endDate + 'T23:59:59').getTime()) return false;
      }
      return true;
    });
  }, [rows, direction, messageType, station, startDate, endDate]);

  const columns: GridColDef[] = [
    { field: 'timestamp', headerName: 'Timestamp', width: 175, valueFormatter: (p: any) => formatDateTime(p.value) },
    { field: 'ocppId', headerName: 'Charge Point', flex: 1, minWidth: 150 },
    { field: 'stationName', headerName: 'Station', flex: 1, minWidth: 140, valueGetter: (p) => p.value || '—' },
    {
      field: 'direction',
      headerName: 'Direction',
      width: 100,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={String(p.value || '—')} size="small" sx={{ bgcolor: `${dirColor(String(p.value))}18`, color: dirColor(String(p.value)), fontWeight: 700, height: 22 }} />
      ),
    },
    {
      field: 'messageType',
      headerName: 'Type',
      width: 120,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={String(p.value || '—')} size="small" sx={{ bgcolor: `${typeColor(String(p.value))}18`, color: typeColor(String(p.value)), fontWeight: 700, height: 22 }} />
      ),
    },
    { field: 'action', headerName: 'OCPP Action', width: 160, valueGetter: (p) => p.value || '—' },
    { field: 'messageId', headerName: 'Msg ID', width: 120, valueGetter: (p) => p.value || '—' },
    {
      field: 'payload',
      headerName: 'Payload',
      flex: 1.4,
      minWidth: 220,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography
          onClick={(e) => {
            e.stopPropagation();
            if (p.value) setPayload({ row: p.row, payload: p.value });
          }}
          sx={{ fontSize: 12, fontFamily: 'monospace', color: '#1565c0', cursor: p.value ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis' }}
          noWrap
        >
          {String(p.value ?? '—')}
        </Typography>
      ),
    },
    { field: 'errorCode', headerName: 'Error', width: 110, valueGetter: (p) => p.value || '—' },
    { field: 'latencyMs', headerName: 'ms', width: 70, type: 'number' },
  ];

  const filterSx = {
    '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: '8px' },
    '& .MuiInputLabel-root': { color: '#4a5a4f', fontWeight: 600 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7dce3' },
  };

  // Pretty-print the payload JSON for the dialog.
  const prettyPayload = (() => {
    if (!payload) return '';
    try {
      return JSON.stringify(JSON.parse(payload.payload), null, 2);
    } catch {
      return String(payload.payload);
    }
  })();

  return (
    <Box>
      <PageHeader title="Server Logs" subtitle="CSMS / OCPP message logs — charge point communication" />

      {sessionId && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              size="small"
              color="inherit"
              startIcon={<ArrowBackOutlined fontSize="small" />}
              onClick={() => navigate('/server-logs')}
            >
              All Logs
            </Button>
          }
        >
          Showing CSMS server logs for <strong>Session #{sessionId}</strong>.
        </Alert>
      )}

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        <FormControl size="small" sx={{ minWidth: 140, ...filterSx }}>
          <InputLabel>Direction</InputLabel>
          <Select value={direction} label="Direction" onChange={(e) => setDirection(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {directionOptions.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150, ...filterSx }}>
          <InputLabel>Message Type</InputLabel>
          <Select value={messageType} label="Message Type" onChange={(e) => setMessageType(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {typeOptions.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170, ...filterSx }}>
          <InputLabel>Station</InputLabel>
          <Select value={station} label="Station" onChange={(e) => setStation(e.target.value)}>
            <MenuItem value="all">All Stations</MenuItem>
            {stationOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={{ width: 150, ...filterSx }} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={{ width: 150, ...filterSx }} />
        <Tooltip title="Refresh · auto every 20s">
          <IconButton onClick={load} sx={{ border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', color: GREEN, bgcolor: '#fff', '&:hover': { bgcolor: '#ecfdf5' } }}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Stack>

      <DataTable rows={filtered} columns={columns} loading={loading} density="compact" getRowId={(r) => String(r.id)} autoHeight />

      {/* Payload viewer */}
      <Dialog open={!!payload} onClose={() => setPayload(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ bgcolor: GREEN, color: '#fff', p: '10px 16px', position: 'relative' }}>
          <Typography sx={{ fontSize: 11, opacity: 0.85, fontWeight: 600, letterSpacing: 1 }}>OCPP PAYLOAD</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 800, pr: 3 }} noWrap>
            {payload?.row?.action || payload?.row?.messageType} · {payload?.row?.ocppId}
          </Typography>
          <IconButton size="small" onClick={() => setPayload(null)} sx={{ position: 'absolute', top: 6, right: 6, color: '#fff' }}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: '12px' }}>
          <Box
            component="pre"
            sx={{ m: 0, p: 1.5, bgcolor: '#f6f8fa', borderRadius: 1, fontSize: 12.5, fontFamily: 'monospace', color: '#2f3b52', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {prettyPayload}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ServerLogs;
