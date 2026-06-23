import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
  LinearProgress,
  Avatar,
  Stack,
  Chip,
} from '@mui/material';
import {
  EvStation,
  PlayCircle,
  BoltOutlined,
  AttachMoney,
  TrendingUp,
  FiberManualRecord,
  PowerOutlined,
  EmojiEventsOutlined,
  AccountBalanceWalletOutlined,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { AppDispatch, RootState } from '../store';
import {
  fetchOverview,
  fetchSessionTrends,
  fetchTopStations,
  fetchLiveSessions,
} from '../features/dashboard/dashboardSlice';
import StatsCard from '../components/common/StatsCard';
import StatusChip from '../components/common/StatusChip';
import PageHeader from '../components/common/PageHeader';

// EV green palette + accents
const PALETTE = {
  primary: '#2E7D32',
  bright: '#00C853',
  light: '#66BB6A',
  blue: '#2196F3',
  orange: '#FF9800',
};

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { overview, sessionTrends, topStations, liveSessions, loading } = useSelector(
    (state: RootState) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchOverview());
    dispatch(fetchSessionTrends({ period: '7d' }));
    dispatch(fetchTopStations({ limit: 5 }));
    dispatch(fetchLiveSessions());
  }, [dispatch]);

  if (loading && !overview) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: PALETTE.primary }} />
      </Box>
    );
  }

  // ---- Session Trends (primary area/line chart) ----
  const trendOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit',
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [3, 2] },
    xaxis: {
      categories: sessionTrends.map((t: any) => t.period),
      labels: { style: { fontSize: '12px', colors: '#90A4AE' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', colors: '#90A4AE' } },
    },
    grid: { borderColor: '#ECEFF1', strokeDashArray: 4 },
    colors: [PALETTE.bright, PALETTE.blue],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    tooltip: { theme: 'light' },
    legend: { position: 'top', horizontalAlign: 'right' },
  };

  const trendSeries = [
    { name: 'Sessions', data: sessionTrends.map((t: any) => Number(t.sessions) || 0) },
    {
      name: 'Energy (kWh)',
      data: sessionTrends.map((t: any) => parseFloat(String(t.energy)) || 0),
    },
  ];

  // ---- Station Status (donut) ----
  const onlineCount = overview?.stations.online || 0;
  const offlineCount = overview?.stations.offline || 0;
  const totalStations = overview?.stations.total || 0;
  const uptimePct = totalStations > 0 ? Math.round((onlineCount / totalStations) * 100) : 0;

  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: ['Online', 'Offline'],
    colors: [PALETTE.bright, PALETTE.orange],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '74%',
          labels: {
            show: true,
            value: { fontSize: '26px', fontWeight: 700, color: PALETTE.primary },
            total: {
              show: true,
              label: 'Uptime',
              fontSize: '13px',
              color: '#90A4AE',
              formatter: () => `${uptimePct}%`,
            },
          },
        },
      },
    },
    tooltip: { theme: 'light', y: { formatter: (v: number) => `${v} stations` } },
  };
  const donutSeries = [onlineCount, offlineCount];

  const maxRevenue = Math.max(
    1,
    ...topStations.map((s: any) => parseFloat(s.totalRevenue || 0))
  );

  return (
    <Box>
      {/* Section header */}
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of your DJT EV charging network — stations, energy & revenue"
      />

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Stations"
            value={totalStations}
            icon={<EvStation />}
            subtitle={`${onlineCount} online · ${offlineCount} offline`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Sessions"
            value={overview?.activeSessions || 0}
            icon={<PlayCircle />}
            subtitle={`${overview?.connectors || 0} connectors`}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Energy"
            value={`${overview?.today.energy || 0} kWh`}
            icon={<BoltOutlined />}
            subtitle="Delivered today"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Revenue"
            value={`₹${overview?.today.revenue || 0}`}
            icon={<AttachMoney />}
            subtitle="QR & wallet top-ups"
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Session Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sessions &amp; energy delivered over the last 7 days
                  </Typography>
                </Box>
                <Chip
                  icon={<TrendingUp />}
                  label="Last 7 days"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(46,125,50,0.08)',
                    color: PALETTE.primary,
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: PALETTE.primary },
                  }}
                />
              </Box>
              {sessionTrends.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No trend data available yet</Typography>
                </Box>
              ) : (
                <Box mt={1}>
                  <Chart options={trendOptions} series={trendSeries} type="area" height={320} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Station Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Network availability
              </Typography>

              {totalStations === 0 ? (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">No stations registered</Typography>
                </Box>
              ) : (
                <>
                  <Box mt={1}>
                    <Chart options={donutOptions} series={donutSeries} type="donut" height={240} />
                  </Box>
                  <Stack spacing={1.5} mt={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <FiberManualRecord sx={{ fontSize: 12, color: PALETTE.bright }} />
                        <Typography variant="body2">Online</Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {onlineCount}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <FiberManualRecord sx={{ fontSize: 12, color: PALETTE.orange }} />
                        <Typography variant="body2">Offline</Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {offlineCount}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <PowerOutlined sx={{ fontSize: 16, color: PALETTE.blue }} />
                        <Typography variant="body2">Total Connectors</Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {overview?.connectors || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Sessions & Top Stations */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Live Sessions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently charging across the network
                  </Typography>
                </Box>
                <Chip
                  label={`${liveSessions.length} active`}
                  size="small"
                  sx={{ bgcolor: 'rgba(0,200,83,0.12)', color: PALETTE.primary, fontWeight: 600 }}
                />
              </Box>
              <Divider sx={{ mb: 1 }} />
              {liveSessions.length === 0 ? (
                <Box textAlign="center" py={5}>
                  <PlayCircle sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No active sessions right now</Typography>
                </Box>
              ) : (
                <Stack divider={<Divider />}>
                  {liveSessions.slice(0, 5).map((session: any) => (
                    <Box
                      key={session.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1.5}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{ bgcolor: 'rgba(46,125,50,0.1)', color: PALETTE.primary, width: 38, height: 38 }}
                        >
                          <BoltOutlined fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {session.station?.name || 'Unknown Station'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.driver?.name || 'Unknown Driver'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight={600}>
                          {session.energyDelivered?.toFixed(2) || 0} kWh
                        </Typography>
                        <Box mt={0.5}>
                          <StatusChip status={session.status} />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmojiEventsOutlined sx={{ color: PALETTE.orange }} />
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Top Performing Stations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ranked by revenue generated
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {topStations.length === 0 ? (
                <Box textAlign="center" py={5}>
                  <AccountBalanceWalletOutlined
                    sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
                  />
                  <Typography color="text.secondary">No performance data available</Typography>
                </Box>
              ) : (
                <Stack spacing={2} mt={1}>
                  {topStations.map((station: any, index: number) => {
                    const revenue = parseFloat(station.totalRevenue || 0);
                    const pct = Math.round((revenue / maxRevenue) * 100);
                    return (
                      <Box key={station.stationId}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: 13,
                                fontWeight: 700,
                                bgcolor: index < 3 ? PALETTE.primary : 'grey.300',
                                color: index < 3 ? '#fff' : 'text.secondary',
                              }}
                            >
                              {index + 1}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {station.station?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {station.sessionCount} sessions
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" fontWeight={700} sx={{ color: PALETTE.primary }}>
                            {`₹${revenue.toFixed(0)}`}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(46,125,50,0.08)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: index < 3 ? PALETTE.bright : PALETTE.light,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
