import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Breadcrumbs,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  TextField,
} from '@mui/material';
import {
  BusinessCenterOutlined,
  EvStationOutlined,
  CurrencyRupeeOutlined,
  AccountBalanceWalletOutlined,
  AccountBalanceOutlined,
  ReceiptLongOutlined,
  HomeOutlined,
  NavigateNext,
  RefreshOutlined,
  PieChartOutlineOutlined,
} from '@mui/icons-material';
import { GridColDef, useGridApiContext } from '@mui/x-data-grid';
import DataTable from '../../components/common/DataTable';
import { financeApi } from '../../services/api';
import { formatDateTime, formatDate } from '../../utils/date';

// ── Palette (DJT green) ─────────────────────────────────────────────────────
const GREEN = '#14532d';
const GOLD = '#b7791f';
const CARD_BORDER = '#eef0f3';
const LABEL = '#8a94a6';
const VALUE = '#2f3b52';

// Default revenue split (djt-app REVENUE_SHARE_IMPLEMENTATION.md):
// DJT platform keeps 14.58%, the franchise (station owner) keeps 85.42%.
const DEFAULT_FRANCHISE_PCT = 85.42;
const DEFAULT_PLATFORM_PCT = 14.58;

const ACCENTS = [
  ['#2e7d32', '#66bb6a'],
  ['#00838f', '#26c6da'],
  ['#1565c0', '#42a5f5'],
  ['#6a1b9a', '#ab47bc'],
  ['#ad1457', '#ec407a'],
  ['#ef6c00', '#ffa726'],
];

// Period options for the payments / revenue-split filter.
type Range = 'all' | 'today' | 'month' | 'year';
const RANGE_LABELS: Record<Range, string> = {
  all: 'All Time',
  today: 'Today',
  month: 'This Month',
  year: 'This Year',
};

const cardSx = {
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 2,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  height: '100%',
} as const;

// Shared style for the header filter controls: white field + white-backed label
// so the floating label reads clearly on the cream page (no strike-through).
const filterSx = {
  bgcolor: '#fff',
  borderRadius: '8px',
  '& .MuiInputLabel-root': { bgcolor: '#fff', px: '4px', color: '#4a5a4f', fontWeight: 600 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7dce3' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GREEN },
} as const;

// ── Number / money helpers ──────────────────────────────────────────────────
const toNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number): string =>
  `₹ ${toNum(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Franchise row (as served by /web/finance/franchises) ────────────────────
interface FranchiseRow {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  stations: number;
  sessions: number;
  energyKwh: number;
  grossRevenue: number;
  franchiseShare: number;
  platformShare: number;
  sharePct: number;
  platformPct: number;
  lastActivity: string | null;
  status: string;
}

interface Summary {
  franchises: number;
  stations: number;
  sessions: number;
  energyKwh: number;
  grossRevenue: number;
  franchiseShare: number;
  platformShare: number;
}

// ── KPI card ────────────────────────────────────────────────────────────────
interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string[];
}
const StatCard: React.FC<StatProps> = ({ icon, label, value, accent }) => (
  <Card
    elevation={0}
    sx={{
      ...cardSx,
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform .15s ease, box-shadow .15s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' },
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
    <CardContent
      sx={{ display: 'flex', alignItems: 'center', gap: '8px', p: '7px 10px', '&:last-child': { pb: '7px' } }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})`,
          '& svg': { fontSize: 18 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 10.5, color: LABEL, fontWeight: 500 }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: VALUE, lineHeight: 1.15 }} noWrap>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, color: '#9aa5b1', textTransform: 'uppercase', mb: '6px' }}
  >
    {children}
  </Typography>
);

// Per-column horizontal alignment for the summary total row.
const SUMMARY_ALIGN: Record<string, 'left' | 'right' | 'center'> = {
  stations: 'right',
  sessions: 'right',
  energyKwh: 'right',
  grossRevenue: 'right',
  franchiseShare: 'right',
  platformShare: 'right',
  sharePct: 'center',
};

// DevExtreme-style summary: a total row rendered in the grid footer with each
// column's total sitting directly under that column, scroll-synced with the
// grid body so the values stay aligned when the table scrolls horizontally.
const SummaryRow: React.FC<{ totals: Summary }> = ({ totals }) => {
  const apiRef = useGridApiContext();
  const [offset, setOffset] = useState(0);
  useEffect(
    () => apiRef.current.subscribeEvent('scrollPositionChange', (p: any) => setOffset(p.left || 0)),
    [apiRef]
  );
  const cols = apiRef.current.getVisibleColumns();

  const strong = (node: React.ReactNode, color: string = VALUE) => (
    <Typography sx={{ fontSize: 12.5, fontWeight: 800, color }}>{node}</Typography>
  );
  const cell = (field: string): React.ReactNode => {
    switch (field) {
      case 'name':
        return (
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: GREEN }} noWrap>
            TOTAL · {totals.franchises} franchises
          </Typography>
        );
      case 'stations':
        return strong(totals.stations);
      case 'sessions':
        return strong(totals.sessions);
      case 'energyKwh':
        return strong(totals.energyKwh.toFixed(2));
      case 'sharePct': {
        const pct = totals.grossRevenue > 0 ? (totals.franchiseShare / totals.grossRevenue) * 100 : DEFAULT_FRANCHISE_PCT;
        return strong(`${pct.toFixed(1)}%`, GREEN);
      }
      case 'grossRevenue':
        return strong(inr(totals.grossRevenue));
      case 'franchiseShare':
        return strong(inr(totals.franchiseShare), GREEN);
      case 'platformShare':
        return strong(inr(totals.platformShare), GOLD);
      default:
        return null;
    }
  };

  return (
    <Box sx={{ overflow: 'hidden', borderTop: `2px solid ${GREEN}`, bgcolor: '#eef8f1' }}>
      <Box sx={{ display: 'flex', width: 'max-content', transform: `translateX(-${offset}px)` }}>
        {cols.map((c: any) => {
          const align = SUMMARY_ALIGN[c.field] || 'left';
          return (
            <Box
              key={c.field}
              sx={{
                width: c.computedWidth,
                flexShrink: 0,
                px: '10px',
                py: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
                borderRight: '1px solid #dcebe1',
              }}
            >
              {cell(c.field)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const REFRESH_MS = 60_000;

const FinanceDashboard: React.FC = () => {
  const [franchises, setFranchises] = useState<FranchiseRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<Range>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'earning'>('all');
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  // A custom date range (both bounds set) overrides the named period.
  const customActive = !!(startDate && endDate);
  const periodLabel = customActive
    ? `${formatDate(startDate)} – ${formatDate(endDate)}`
    : RANGE_LABELS[timeRange];

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = startDate && endDate ? { startDate, endDate } : { range: timeRange };
      const res = await financeApi.franchises(params);
      const rows: FranchiseRow[] = res?.data?.rows || [];
      setFranchises(rows);
      setSummary(res?.data?.summary || null);
      setRefreshedAt(new Date());
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          (e?.response?.status ? `Failed to load (HTTP ${e.response.status})` : 'Failed to load finance data')
      );
      setFranchises([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange, startDate, endDate]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  const visible = useMemo(() => {
    if (statusFilter === 'active') return franchises.filter((f) => /active/i.test(f.status));
    if (statusFilter === 'earning') return franchises.filter((f) => f.grossRevenue > 0);
    return franchises;
  }, [franchises, statusFilter]);

  const totals = useMemo<Summary>(() => {
    if (summary) return summary;
    return franchises.reduce(
      (acc, f) => {
        acc.grossRevenue += f.grossRevenue;
        acc.franchiseShare += f.franchiseShare;
        acc.platformShare += f.platformShare;
        acc.energyKwh += f.energyKwh;
        acc.sessions += f.sessions;
        acc.stations += f.stations;
        acc.franchises += 1;
        return acc;
      },
      { franchises: 0, stations: 0, sessions: 0, energyKwh: 0, grossRevenue: 0, franchiseShare: 0, platformShare: 0 }
    );
  }, [summary, franchises]);

  const hasRevenue = totals.grossRevenue > 0;

  const stats: StatProps[] = useMemo(
    () => [
      { icon: <BusinessCenterOutlined />, label: 'Franchises', value: totals.franchises, accent: ACCENTS[0] },
      { icon: <EvStationOutlined />, label: 'Franchise Stations', value: totals.stations, accent: ACCENTS[1] },
      { icon: <ReceiptLongOutlined />, label: 'Charging Sessions', value: totals.sessions, accent: ACCENTS[2] },
      { icon: <CurrencyRupeeOutlined />, label: 'Gross Revenue', value: inr(totals.grossRevenue), accent: ACCENTS[3] },
      { icon: <AccountBalanceWalletOutlined />, label: 'Franchise Share', value: inr(totals.franchiseShare), accent: ACCENTS[4] },
      { icon: <AccountBalanceOutlined />, label: 'DJT Platform Share', value: inr(totals.platformShare), accent: ACCENTS[5] },
    ],
    [totals]
  );

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Franchise', flex: 1, minWidth: 150, disableColumnMenu: true },
    { field: 'stations', headerName: 'Stations', width: 78, type: 'number', disableColumnMenu: true },
    { field: 'sessions', headerName: 'Sessions', width: 82, type: 'number', disableColumnMenu: true },
    {
      field: 'energyKwh',
      headerName: 'Energy',
      width: 82,
      type: 'number',
      disableColumnMenu: true,
      valueFormatter: (p: any) => toNum(p.value).toFixed(2),
    },
    {
      field: 'sharePct',
      headerName: 'Share %',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: true,
      renderCell: (p) => (
        <Chip
          label={`${toNum(p.value).toFixed(1)}%`}
          size="small"
          sx={{ bgcolor: '#ecfdf5', color: GREEN, fontWeight: 700, borderRadius: 1, height: 22 }}
        />
      ),
    },
    {
      field: 'grossRevenue',
      headerName: 'Gross Revenue',
      width: 120,
      type: 'number',
      disableColumnMenu: true,
      valueFormatter: (p: any) => inr(toNum(p.value)),
    },
    {
      field: 'franchiseShare',
      headerName: 'Franchise Payout',
      width: 140,
      type: 'number',
      disableColumnMenu: true,
      renderCell: (p) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: GREEN }}>{inr(toNum(p.value))}</Typography>
      ),
    },
    {
      field: 'platformShare',
      headerName: 'DJT Share',
      width: 100,
      type: 'number',
      disableColumnMenu: true,
      renderCell: (p) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: GOLD }}>{inr(toNum(p.value))}</Typography>
      ),
    },
    {
      field: 'lastActivity',
      headerName: 'Last Activity',
      width: 135,
      disableColumnMenu: true,
      valueFormatter: (p: any) => formatDateTime(p.value),
    },
    { field: 'status', headerName: 'Status', width: 90, disableColumnMenu: true },
  ];

  if (loading && franchises.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pt: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Breadcrumb + filters */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="10px">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ fontSize: 14 }}>
          <Typography sx={{ fontWeight: 700, color: VALUE }}>Dashboard</Typography>
          <Link underline="none" color="inherit" sx={{ display: 'flex', alignItems: 'center', color: LABEL }}>
            <HomeOutlined sx={{ fontSize: 18 }} />
          </Link>
          <Typography sx={{ color: GREEN, fontWeight: 600 }}>Finance</Typography>
        </Breadcrumbs>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 140, ...filterSx }} disabled={customActive}>
            <InputLabel>Period</InputLabel>
            <Select
              value={timeRange}
              label="Period"
              onChange={(e) => {
                setTimeRange(e.target.value as Range);
                setStartDate('');
                setEndDate('');
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ width: 150, ...filterSx }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ width: 150, ...filterSx }}
          />
          {customActive && (
            <Link
              component="button"
              underline="hover"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              sx={{ fontSize: 13, color: GREEN, fontWeight: 600 }}
            >
              Clear
            </Link>
          )}
          <FormControl size="small" sx={{ minWidth: 170, ...filterSx }}>
            <InputLabel>Show</InputLabel>
            <Select value={statusFilter} label="Show" onChange={(e) => setStatusFilter(e.target.value as any)}>
              <MenuItem value="all">All Franchises</MenuItem>
              <MenuItem value="earning">Earning (has revenue)</MenuItem>
              <MenuItem value="active">Active only</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={refreshedAt ? `Updated ${formatDateTime(refreshedAt)} · auto-refresh 60s` : 'Refresh'}>
            <IconButton
              onClick={loadAll}
              sx={{
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: '8px',
                color: GREEN,
                bgcolor: '#fff',
                '&:hover': { bgcolor: '#ecfdf5' },
              }}
            >
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: '8px', py: '2px' }}>
          {error}
        </Alert>
      )}

      {!error && !hasRevenue && (
        <Alert severity="info" icon={<PieChartOutlineOutlined />} sx={{ borderRadius: '8px', py: '2px' }}>
          No completed charging revenue for <strong>{periodLabel}</strong> — franchises shown at the default
          split (Franchise {DEFAULT_FRANCHISE_PCT}% / DJT {DEFAULT_PLATFORM_PCT}%).
        </Alert>
      )}

      {/* KPIs */}
      <Box sx={{ flexShrink: 0 }}>
        <SectionLabel>Overview · {periodLabel}</SectionLabel>
        <Grid container spacing={1.25}>
          {stats.map((st) => (
            <Grid item xs={6} sm={4} md={4} lg={2} key={st.label}>
              <StatCard {...st} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Per-franchise share breakdown — the focal point: each franchise's cut
          of the money for the selected period. Fills remaining height; the
          table scrolls internally so the page itself never scrolls. */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Card
          elevation={0}
          sx={{
            border: `2px solid ${GREEN}`,
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(20,83,45,0.10)',
            overflow: 'hidden',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Table header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              p: '10px 16px',
              flexShrink: 0,
              bgcolor: GREEN,
              color: '#fff',
            }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>
              Franchises &amp; Their Shares · {periodLabel}
            </Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
              {totals.franchises} franchises · {totals.sessions} sessions
            </Typography>
          </Box>
          {/* Table fills the rest and scrolls internally. The segmented summary
              is rendered inside the grid footer, with pagination BELOW it —
              pagination only appears when there are more than 5 records. */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              '& .MuiPaper-root': { height: '100%', border: 'none', borderRadius: 0, boxShadow: 'none' },
              '& .MuiPaper-root > .MuiBox-root': { height: '100% !important' },
              '& .MuiDataGrid-footerContainer': { display: 'block', p: 0, borderTop: 'none' },
            }}
          >
            <DataTable
              rows={visible}
              columns={columns}
              loading={loading}
              pageSize={5}
              density="compact"
              getRowId={(r) => String(r.id)}
              footerContent={<SummaryRow totals={totals} />}
              hidePagination={visible.length <= 5}
            />
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default FinanceDashboard;
