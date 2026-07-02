import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Breadcrumbs,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  LinearProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BusinessCenterOutlined,
  LocationOnOutlined,
  GroupsOutlined,
  EvStationOutlined,
  PersonOutlineOutlined,
  AccountBalanceWalletOutlined,
  ReceiptLongOutlined,
  BoltOutlined,
  FlashOnOutlined,
  FilterAltOutlined,
  HomeOutlined,
  NavigateNext,
  RefreshOutlined,
  PlayCircleOutlineOutlined,
  EmojiEventsOutlined,
  CurrencyRupeeOutlined,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { AppDispatch, RootState } from '../store';
import {
  fetchAnalytics,
  fetchOverview,
  fetchTopStations,
  fetchRecentActivity,
  fetchLiveSessions,
} from '../features/dashboard/dashboardSlice';
import { partnersApi } from '../services/api';

// Time-range option -> human label (also used for the Performance section title).
const RANGE_LABELS: Record<string, string> = {
  all: 'All Time',
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
};

// ── Palette (DJT green) ─────────────────────────────────────────────────────
const GREEN = '#14532d';
const GREEN_BAR = '#2e7d32';
const CARD_BORDER = '#eef0f3';
const LABEL = '#8a94a6';
const VALUE = '#2f3b52';
const TITLE = '#5a6b7b';
const DONUT_GREENS = ['#1b5e20', '#2e7d32', '#66bb6a', '#a5d6a7'];

// Per-KPI accent gradients for a denser, more scannable card grid.
const ACCENTS = [
  ['#2e7d32', '#66bb6a'],
  ['#1565c0', '#42a5f5'],
  ['#6a1b9a', '#ab47bc'],
  ['#00838f', '#26c6da'],
  ['#ef6c00', '#ffa726'],
  ['#ad1457', '#ec407a'],
  ['#283593', '#5c6bc0'],
  ['#4527a0', '#7e57c2'],
  ['#00695c', '#26a69a'],
];

const cardSx = {
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 2,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  height: '100%',
} as const;

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
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, pl: 3 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
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
        <Typography sx={{ fontSize: 12.5, color: LABEL, fontWeight: 500 }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 23, fontWeight: 800, color: VALUE, lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Chart card shell ────────────────────────────────────────────────────────
interface ChartCardProps {
  title: string;
  average?: string;
  showFilter?: boolean;
  children: React.ReactNode;
}
const ChartCard: React.FC<ChartCardProps> = ({ title, average, showFilter = false, children }) => (
  <Card elevation={0} sx={cardSx}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: TITLE, letterSpacing: 0.3 }}>
          {title}
        </Typography>
        {showFilter && <FilterAltOutlined sx={{ color: GREEN, fontSize: 20 }} />}
      </Box>
      {average !== undefined && (
        <Chip
          label={average}
          size="small"
          sx={{ mt: 1, bgcolor: '#ecfdf5', color: GREEN, fontWeight: 600, fontSize: 12, borderRadius: 1 }}
        />
      )}
      <Box mt={1}>{children}</Box>
    </CardContent>
  </Card>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: '#9aa5b1', textTransform: 'uppercase', mb: 1.5 }}
  >
    {children}
  </Typography>
);

const NoData: React.FC<{ height?: number }> = ({ height = 240 }) => (
  <Box display="flex" alignItems="center" justifyContent="center" height={height}>
    <Typography color="text.secondary">No Data Available</Typography>
  </Box>
);

// ── "Today" live tile ─────────────────────────────────────────────────────────
interface TodayTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tint: string;
}
const TodayTile: React.FC<TodayTileProps> = ({ icon, label, value, tint }) => (
  <Card elevation={0} sx={cardSx}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: tint,
          bgcolor: `${tint}18`,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11.5, color: LABEL, fontWeight: 500 }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 800, color: VALUE, lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

// Relative-time formatter for the activity feed ("5m ago").
const timeAgo = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Apex option builders ────────────────────────────────────────────────────
const barOptions = (categories: string[], color: string, yFmt: (v: number) => string): ApexOptions => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  plotOptions: { bar: { columnWidth: '38%', borderRadius: 3 } },
  dataLabels: { enabled: false },
  colors: [color],
  xaxis: {
    categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#90a4ae', fontSize: '11px' } },
  },
  yaxis: { labels: { formatter: yFmt, style: { colors: '#90a4ae', fontSize: '11px' } } },
  grid: { borderColor: CARD_BORDER, strokeDashArray: 4 },
  tooltip: { theme: 'light' },
});

const donutOptions = (labels: string[], colors: string[]): ApexOptions => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels,
  colors,
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${Math.round(val)}%`,
    style: { fontSize: '12px', fontWeight: 700, colors: ['#fff'] },
    dropShadow: { enabled: false },
  },
  plotOptions: { pie: { donut: { size: '68%' } } },
  stroke: { width: 2, colors: ['#fff'] },
  legend: { position: 'bottom', fontSize: '13px', itemMargin: { horizontal: 8, vertical: 2 } },
  tooltip: { theme: 'light', y: { formatter: (v: number) => `${v}` } },
});

// Auto-refresh cadence for the live widgets (Today strip, activity feed).
const REFRESH_MS = 60_000;

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, overview, topStations, recentActivity, loading } = useSelector(
    (state: RootState) => state.dashboard
  );
  const [timeRange, setTimeRange] = useState('all');
  const [partnerOrg, setPartnerOrg] = useState('all');
  const [partners, setPartners] = useState<{ id: string | number; name: string }[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  // Populate the Partner Organization filter from the real partners list.
  useEffect(() => {
    let alive = true;
    partnersApi
      .list()
      .then((r) => {
        const rows = r?.data?.rows || r?.data || [];
        if (alive) setPartners(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setPartners([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadAll = React.useCallback(() => {
    // Both filters are honored server-side by /web/dashboard/analytics.
    const params: { range: string; partnerId?: string } = { range: timeRange };
    if (partnerOrg !== 'all') params.partnerId = partnerOrg;
    dispatch(fetchAnalytics(params));
    dispatch(fetchOverview(params));
    dispatch(fetchTopStations({ limit: 5 }));
    dispatch(fetchRecentActivity({ limit: 8 }));
    dispatch(fetchLiveSessions());
    setRefreshedAt(new Date());
  }, [dispatch, timeRange, partnerOrg]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  const a = analytics;
  const s = a?.summary;

  // Memoize derived datasets so the heavy Apex grid does not recompute on every
  // unrelated render (filter focus, hover, etc.).
  const cats = (block?: { series: { date: string }[] }) => block?.series.map((p) => p.date) || [];
  const vals = (block?: { series: { value: number }[] }) => block?.series.map((p) => p.value) || [];

  const stats: StatProps[] = useMemo(
    () => [
      { icon: <BusinessCenterOutlined />, label: 'Partner Organizations', value: s?.partnerOrganizations ?? 0, accent: ACCENTS[0] },
      { icon: <LocationOnOutlined />, label: 'Locations', value: s?.locations ?? 0, accent: ACCENTS[1] },
      { icon: <GroupsOutlined />, label: 'Users', value: s?.users ?? 0, accent: ACCENTS[2] },
      { icon: <EvStationOutlined />, label: 'Charging Stations', value: s?.chargingStations ?? 0, accent: ACCENTS[3] },
      { icon: <PersonOutlineOutlined />, label: 'EV Drivers', value: s?.evDrivers ?? 0, accent: ACCENTS[4] },
      { icon: <AccountBalanceWalletOutlined />, label: 'Remaining Wallet Balance', value: (s?.walletBalance ?? 0).toFixed(2), accent: ACCENTS[5] },
      { icon: <ReceiptLongOutlined />, label: 'Charging Transaction Amount', value: (s?.transactionAmount ?? 0).toFixed(2), accent: ACCENTS[6] },
      { icon: <BoltOutlined />, label: 'kWh Consumption', value: (s?.kwhConsumption ?? 0).toFixed(2), accent: ACCENTS[7] },
      { icon: <FlashOnOutlined />, label: 'Wallet Topup Count', value: s?.walletTopupCount ?? 0, accent: ACCENTS[8] },
    ],
    [s]
  );

  const charts = useMemo(() => {
    const sum = (block?: { series: { value: number }[] }) =>
      (block?.series || []).reduce((t, p) => t + p.value, 0);
    return {
      uptime: { options: barOptions(cats(a?.avgUptime), GREEN_BAR, (v) => `${v.toFixed(2)} %`), data: vals(a?.avgUptime) },
      chargeTime: { options: barOptions(cats(a?.avgChargeTime), GREEN_BAR, (v) => `${v.toFixed(2)} hr.`), data: vals(a?.avgChargeTime) },
      idleTime: { options: barOptions(cats(a?.avgIdleTime), GREEN_BAR, (v) => `${v.toFixed(2)} hr.`), data: vals(a?.avgIdleTime) },
      failed: { options: barOptions(cats(a?.failedSessions), GREEN_BAR, (v) => `${v}`), data: vals(a?.failedSessions) },
      consumption: {
        options: {
          ...barOptions(cats(a?.consumption), GREEN_BAR, (v) => `${v.toFixed(2)}`),
          chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'inherit' },
          stroke: { curve: 'smooth' as const, width: 2 },
          fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        } as ApexOptions,
        data: vals(a?.consumption),
        total: sum(a?.consumption),
      },
    };
  }, [a]);

  if (loading && !analytics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: GREEN }} />
      </Box>
    );
  }

  // ── Donut datasets ──
  const sessionTotal = (a?.sessionCount.finished ?? 0) + (a?.sessionCount.rejected ?? 0);
  const downtime = a?.chargerDowntime;
  const downtimeTotal = downtime ? downtime.lt12 + downtime.h12_24 + downtime.h24_48 + downtime.gt48 : 0;
  const statusTotal = (a?.stationsStatus || []).reduce((t, x) => t + x.count, 0);

  return (
    <Box>
      {/* Breadcrumb + filters */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ fontSize: 14 }}>
            <Typography sx={{ fontWeight: 700, color: VALUE }}>Dashboard</Typography>
            <Link underline="none" color="inherit" sx={{ display: 'flex', alignItems: 'center', color: LABEL }}>
              <HomeOutlined sx={{ fontSize: 18 }} />
            </Link>
            <Typography sx={{ color: GREEN, fontWeight: 600 }}>Dashboard</Typography>
          </Breadcrumbs>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Select Time Range</InputLabel>
            <Select value={timeRange} label="Select Time Range" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Select Partner Organization</InputLabel>
            <Select value={partnerOrg} label="Select Partner Organization" onChange={(e) => setPartnerOrg(e.target.value)}>
              <MenuItem value="all">All Organizations</MenuItem>
              {partners.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip
            title={refreshedAt ? `Updated ${refreshedAt.toLocaleTimeString()} · auto-refresh 60s` : 'Refresh'}
          >
            <IconButton
              onClick={loadAll}
              sx={{
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 2,
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

      {/* Overview KPIs */}
      <SectionLabel>Overview</SectionLabel>
      <Grid container spacing={2.5} mb={3}>
        {stats.map((st) => (
          <Grid item xs={12} sm={6} md={4} key={st.label}>
            <StatCard {...st} />
          </Grid>
        ))}
      </Grid>

      {/* Today — live snapshot (not shown on the reference analytics page) */}
      <SectionLabel>Today · Live</SectionLabel>
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <TodayTile
            icon={<PlayCircleOutlineOutlined />}
            label="Active Sessions"
            value={overview?.activeSessions ?? 0}
            tint="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TodayTile
            icon={<BoltOutlined />}
            label="Today's Sessions"
            value={overview?.today?.sessions ?? 0}
            tint="#1565c0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TodayTile
            icon={<FlashOnOutlined />}
            label="Today's Energy (kWh)"
            value={overview?.today?.energy ?? '0.00'}
            tint="#ef6c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TodayTile
            icon={<CurrencyRupeeOutlined />}
            label="Today's Revenue"
            value={`₹ ${overview?.today?.revenue ?? '0.00'}`}
            tint="#6a1b9a"
          />
        </Grid>
      </Grid>

      {/* Performance */}
      <SectionLabel>Performance · {RANGE_LABELS[timeRange] || 'Last 7 Days'}</SectionLabel>
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={4}>
          <ChartCard title="AVG UPTIME" average={`AVERAGE : ${(a?.avgUptime.average ?? 0).toFixed(2)}%`} showFilter>
            <Chart options={charts.uptime.options} series={[{ name: 'Uptime', data: charts.uptime.data }]} type="bar" height={300} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="AVG CHARGE TIME" average={`AVERAGE : ${(a?.avgChargeTime.average ?? 0).toFixed(2)} hr`} showFilter>
            <Chart options={charts.chargeTime.options} series={[{ name: 'Charge time', data: charts.chargeTime.data }]} type="bar" height={300} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="AVG IDLE TIME" average={`AVERAGE : ${(a?.avgIdleTime.average ?? 0).toFixed(2)} hr`} showFilter>
            <Chart options={charts.idleTime.options} series={[{ name: 'Idle time', data: charts.idleTime.data }]} type="bar" height={300} />
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={4}>
          <ChartCard title="FAILED SESSIONS" showFilter>
            <Chart options={charts.failed.options} series={[{ name: 'Failed', data: charts.failed.data }]} type="bar" height={300} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="CONSUMPTION" average={`AVERAGE : ${(a?.consumption.average ?? 0).toFixed(2)} kWh`} showFilter>
            {charts.consumption.total === 0 ? (
              <NoData height={300} />
            ) : (
              <Chart options={charts.consumption.options} series={[{ name: 'kWh', data: charts.consumption.data }]} type="area" height={300} />
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="CHARGING SESSION COUNT">
            {sessionTotal === 0 ? (
              <NoData height={320} />
            ) : (
              <Chart
                options={donutOptions(['Rejected', 'Finished'], ['#1b5e20', '#66bb6a'])}
                series={[a?.sessionCount.rejected ?? 0, a?.sessionCount.finished ?? 0]}
                type="donut"
                height={320}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Reliability */}
      <SectionLabel>Reliability</SectionLabel>
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={6}>
          <ChartCard title="CHARGER DOWNTIME">
            {downtimeTotal === 0 ? (
              <NoData height={340} />
            ) : (
              <Chart
                options={donutOptions(['< 12 Hours', '12-24 Hours', '24-48 Hours', '>48 Hours'], DONUT_GREENS)}
                series={[downtime!.lt12, downtime!.h12_24, downtime!.h24_48, downtime!.gt48]}
                type="donut"
                height={340}
              />
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="CHARGING STATIONS STATUS">
            {statusTotal === 0 ? (
              <NoData height={340} />
            ) : (
              <Chart
                options={donutOptions((a?.stationsStatus || []).map((x) => x.status), DONUT_GREENS)}
                series={(a?.stationsStatus || []).map((x) => x.count)}
                type="donut"
                height={340}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Network activity — top stations + recent activity (new insights) */}
      <SectionLabel>Network Activity</SectionLabel>
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={6}>
          <ChartCard title="TOP PERFORMING STATIONS">
            {!topStations || topStations.length === 0 ? (
              <NoData height={280} />
            ) : (
              <Box mt={1}>
                {(() => {
                  const maxRev = Math.max(...topStations.map((t: any) => Number(t.totalRevenue) || 0), 1);
                  return topStations.map((t: any, i: number) => {
                    const rev = Number(t.totalRevenue) || 0;
                    return (
                      <Box key={t.stationId ?? i} sx={{ py: 1.25 }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: 13,
                              fontWeight: 700,
                              bgcolor: i === 0 ? '#f6c453' : i === 1 ? '#c9d1d9' : i === 2 ? '#e0a878' : '#eef0f3',
                              color: i < 3 ? '#3a2f00' : '#8a94a6',
                            }}
                          >
                            {i < 3 ? <EmojiEventsOutlined sx={{ fontSize: 16 }} /> : i + 1}
                          </Avatar>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: VALUE, flex: 1 }} noWrap>
                            {t.station?.name || `Station ${t.stationId}`}
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: GREEN }}>
                            ₹ {rev.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={(rev / maxRev) * 100}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#eef0f3',
                              '& .MuiLinearProgress-bar': { bgcolor: GREEN_BAR, borderRadius: 3 },
                            }}
                          />
                          <Typography sx={{ fontSize: 11.5, color: LABEL, minWidth: 64, textAlign: 'right' }}>
                            {t.sessionCount ?? 0} sessions
                          </Typography>
                        </Box>
                      </Box>
                    );
                  });
                })()}
              </Box>
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="RECENT ACTIVITY">
            {!recentActivity || recentActivity.length === 0 ? (
              <NoData height={280} />
            ) : (
              <Box mt={1}>
                {recentActivity.map((r: any, i: number) => (
                  <Box key={r.id ?? i}>
                    <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#ecfdf5', color: GREEN }}>
                        <EvStationOutlined sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: VALUE }} noWrap>
                          {r.user?.name || 'Driver'} · {r.station?.name || 'Station'}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: LABEL }}>
                          {(r.type || 'session')} · {timeAgo(r.timestamp)}
                        </Typography>
                      </Box>
                      {r.amount != null && (
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: GREEN }}>
                          ₹ {Number(r.amount).toFixed(2)}
                        </Typography>
                      )}
                      <Chip
                        label={r.status || '—'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10.5,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          bgcolor: /complete|finish|success/i.test(r.status || '') ? '#ecfdf5' : '#fff4e5',
                          color: /complete|finish|success/i.test(r.status || '') ? GREEN : '#b7791f',
                        }}
                      />
                    </Box>
                    {i < recentActivity.length - 1 && <Divider sx={{ borderColor: CARD_BORDER }} />}
                  </Box>
                ))}
              </Box>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box display="flex" justifyContent="flex-end" gap={3} mt={2} mb={1}>
        <Link underline="hover" sx={{ fontSize: 13, color: LABEL }}>
          Terms and Conditions
        </Link>
        <Link underline="hover" sx={{ fontSize: 13, color: LABEL }}>
          Privacy Policy
        </Link>
      </Box>
    </Box>
  );
};

export default Dashboard;
