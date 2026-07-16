import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BoltOutlined,
  CurrencyRupeeOutlined,
  ReceiptLongOutlined,
  AccountBalanceOutlined,
  ManageSearchOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { sessionsApi } from '../../services/api';
import { formatDateTime } from '../../utils/date';

const GREEN = '#14532d';
const VALUE = '#2f3b52';
const LABEL = '#8a94a6';
const CARD_BORDER = '#eef0f3';

const num = (digits: number) => (p: any) => {
  const n = Number(p.value);
  return isNaN(n) ? (p.value ?? '') : n.toFixed(digits);
};
const inr = (v: number): string =>
  `₹ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const kwh = (v: number): string =>
  `${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Summary {
  totalConsumption: number;
  totalAmount: number;
  totalEnergyPrice: number;
  totalTax: number;
}

// ── Summary stat card ───────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; accent: string[] }> = ({
  icon,
  label,
  value,
  accent,
}) => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${CARD_BORDER}`,
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: `linear-gradient(180deg, ${accent[0]}, ${accent[1]})`,
      },
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: '10px', p: '12px 14px', '&:last-child': { pb: '12px' } }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: LABEL, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 19, fontWeight: 800, color: VALUE, lineHeight: 1.2 }} noWrap>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Filters
  const [status, setStatus] = useState('all');
  const [stationName, setStationName] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    sessionsApi
      .list()
      .then((r) => setRows(r.data?.rows || r.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    sessionsApi
      .summary()
      .then((r) => setSummary(r.data || null))
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => [
      { icon: <BoltOutlined />, label: 'Total Consumption (kWh)', value: kwh(summary?.totalConsumption ?? 0), accent: ['#2e7d32', '#66bb6a'] },
      { icon: <CurrencyRupeeOutlined />, label: 'Total Amount (with taxes)', value: inr(summary?.totalAmount ?? 0), accent: ['#1565c0', '#42a5f5'] },
      { icon: <ReceiptLongOutlined />, label: 'Total Energy Price (with taxes)', value: inr(summary?.totalEnergyPrice ?? 0), accent: ['#6a1b9a', '#ab47bc'] },
      { icon: <AccountBalanceOutlined />, label: 'Total Tax', value: inr(summary?.totalTax ?? 0), accent: ['#ef6c00', '#ffa726'] },
    ],
    [summary]
  );

  const statusOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))) as string[], [rows]);
  const stationOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.stationName).filter(Boolean))) as string[], [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (stationName !== 'all' && r.stationName !== stationName) return false;
      if (startDate || endDate) {
        const t = r.startTime ? new Date(r.startTime).getTime() : NaN;
        if (Number.isNaN(t)) return false;
        if (startDate && t < new Date(startDate + 'T00:00:00').getTime()) return false;
        if (endDate && t > new Date(endDate + 'T23:59:59').getTime()) return false;
      }
      return true;
    });
  }, [rows, status, stationName, startDate, endDate]);

  const columns: GridColDef[] = [
    { field: 'sessionCode', headerName: 'Session', flex: 1, minWidth: 160 },
    { field: 'transactionId', headerName: 'Txn ID', width: 110, valueGetter: (p) => p.value || '—' },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (p: GridRenderCellParams) => (p.value ? <StatusChip status={String(p.value)} /> : null),
    },
    { field: 'stationName', headerName: 'Charging Station', flex: 1, minWidth: 160 },
    { field: 'member', headerName: 'EV Driver', flex: 1, minWidth: 130 },
    { field: 'energy', headerName: 'Energy (kWh)', width: 120, type: 'number', valueFormatter: num(3) },
    { field: 'cost', headerName: 'Cost', width: 105, type: 'number', valueFormatter: num(2) },
    { field: 'durationMins', headerName: 'Duration', width: 100, type: 'number' },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      width: 115,
      renderCell: (p: GridRenderCellParams) => (p.value ? <StatusChip status={String(p.value)} /> : null),
    },
    { field: 'startTime', headerName: 'Started', width: 170, valueFormatter: (p: any) => formatDateTime(p.value) },
    { field: 'endTime', headerName: 'Ended', width: 170, valueFormatter: (p: any) => formatDateTime(p.value) },
    {
      field: '__view',
      headerName: 'Logs',
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<ManageSearchOutlined fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/server-logs?sessionId=${params.row.id}`);
          }}
          sx={{ textTransform: 'none', color: GREEN, borderColor: GREEN, '&:hover': { borderColor: '#0f3d22', bgcolor: '#ecfdf5' } }}
        >
          View
        </Button>
      ),
    },
  ];

  const filterSx = {
    '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: '8px' },
    '& .MuiInputLabel-root': { color: '#4a5a4f', fontWeight: 600 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7dce3' },
  };

  return (
    <Box>
      <PageHeader title="Charging Sessions" subtitle="All charging sessions with consumption, billing and server logs" />

      {/* Live totals */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {stats.map((st) => (
          <Grid item xs={12} sm={6} md={3} key={st.label}>
            <StatCard {...st} />
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150, ...filterSx }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 190, ...filterSx }}>
          <InputLabel>Charging Station</InputLabel>
          <Select value={stationName} label="Charging Station" onChange={(e) => setStationName(e.target.value)}>
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
        <Tooltip title="Refresh">
          <IconButton onClick={load} sx={{ border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', color: GREEN, bgcolor: '#fff', '&:hover': { bgcolor: '#ecfdf5' } }}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Stack>

      <DataTable
        rows={filtered}
        columns={columns}
        loading={loading}
        getRowId={(r) => String(r.id)}
        onRowClick={(params) => navigate(`/sessions/${params.row.id}`)}
        autoHeight
      />
    </Box>
  );
};

export default Sessions;
