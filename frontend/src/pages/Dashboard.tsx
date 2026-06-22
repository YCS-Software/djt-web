import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import {
  EvStation,
  ElectricalServices,
  PlayCircle,
  People,
  BoltOutlined,
  AttachMoney,
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
        <CircularProgress />
      </Box>
    );
  }

  // Chart options for session trends
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: sessionTrends.map((t) => t.period),
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { fontSize: '12px' } },
    },
    colors: ['#4CAF50', '#2196F3', '#FF9800'],
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    tooltip: { theme: 'light' },
    legend: { position: 'top' },
  };

  const chartSeries = [
    {
      name: 'Sessions',
      data: sessionTrends.map((t) => t.sessions || 0),
    },
    {
      name: 'Energy (kWh)',
      data: sessionTrends.map((t) => parseFloat(String(t.energy)) || 0),
    },
  ];

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Stations"
            value={overview?.stations.total || 0}
            icon={<EvStation />}
            subtitle={`${overview?.stations.online || 0} online`}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Sessions"
            value={overview?.activeSessions || 0}
            icon={<PlayCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Energy"
            value={`${overview?.today.energy || 0} kWh`}
            icon={<BoltOutlined />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Revenue"
            value={`₹${overview?.today.revenue || 0}`}
            icon={<AttachMoney />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Trends (Last 7 Days)
              </Typography>
              <Chart options={chartOptions} series={chartSeries} type="area" height={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Online</Typography>
                  <Typography variant="h5" color="success.main">
                    {overview?.stations.online || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Offline</Typography>
                  <Typography variant="h5" color="error.main">
                    {overview?.stations.offline || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Total Connectors</Typography>
                  <Typography variant="h5">{overview?.connectors || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Sessions & Top Stations */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Sessions
              </Typography>
              {liveSessions.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>
                  No active sessions
                </Typography>
              ) : (
                <Box>
                  {liveSessions.slice(0, 5).map((session: any) => (
                    <Box
                      key={session.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1.5}
                      borderBottom="1px solid"
                      borderColor="divider"
                    >
                      <Box>
                        <Typography variant="subtitle2">
                          {session.station?.name || 'Unknown Station'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.driver?.name || 'Unknown Driver'}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2">
                          {session.energyDelivered?.toFixed(2) || 0} kWh
                        </Typography>
                        <StatusChip status={session.status} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Stations
              </Typography>
              {topStations.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>
                  No data available
                </Typography>
              ) : (
                <Box>
                  {topStations.map((station: any, index: number) => (
                    <Box
                      key={station.stationId}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1.5}
                      borderBottom="1px solid"
                      borderColor="divider"
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography
                          variant="h6"
                          color={index < 3 ? 'primary.main' : 'text.secondary'}
                        >
                          #{index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle2">
                            {station.station?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {station.sessionCount} sessions
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        ₹{parseFloat(station.totalRevenue || 0).toFixed(0)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
