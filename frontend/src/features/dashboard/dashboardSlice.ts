import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../services/api';

interface DashboardStats {
  stations: {
    total: number;
    online: number;
    offline: number;
  };
  connectors: number;
  activeSessions: number;
  totalDrivers: number;
  today: {
    sessions: number;
    energy: string;
    revenue: string;
  };
}

interface SessionTrend {
  period: string;
  sessions: number;
  energy: number;
  revenue: number;
}

interface ChartPoint {
  date: string;
  value: number;
}

interface SeriesBlock {
  average?: number;
  unit?: string;
  series: ChartPoint[];
}

export interface AnalyticsData {
  summary: {
    partnerOrganizations: number;
    locations: number;
    users: number;
    chargingStations: number;
    evDrivers: number;
    walletBalance: number;
    transactionAmount: number;
    kwhConsumption: number;
    walletTopupCount: number;
  };
  avgUptime: SeriesBlock;
  avgChargeTime: SeriesBlock;
  avgIdleTime: SeriesBlock;
  failedSessions: SeriesBlock;
  consumption: SeriesBlock;
  sessionCount: { finished: number; rejected: number };
  chargerDowntime: { lt12: number; h12_24: number; h24_48: number; gt48: number };
  stationsStatus: { status: string; count: number }[];
}

interface DashboardState {
  analytics: AnalyticsData | null;
  overview: DashboardStats | null;
  sessionTrends: SessionTrend[];
  topStations: any[];
  recentActivity: any[];
  liveSessions: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  analytics: null,
  overview: null,
  sessionTrends: [],
  topStations: [],
  recentActivity: [],
  liveSessions: [],
  loading: false,
  error: null,
};

export const fetchAnalytics = createAsyncThunk(
  'dashboard/fetchAnalytics',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.analytics(params);
      return response.data.analytics as AnalyticsData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch analytics');
    }
  }
);

export const fetchOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.overview(params);
      return response.data.overview;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch overview');
    }
  }
);

export const fetchSessionTrends = createAsyncThunk(
  'dashboard/fetchSessionTrends',
  async (params: { period?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.sessionTrends(params);
      return response.data.trends;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch trends');
    }
  }
);

export const fetchTopStations = createAsyncThunk(
  'dashboard/fetchTopStations',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.topStations(params);
      return response.data.stations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch top stations');
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchRecentActivity',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.recentActivity(params);
      return response.data.activity;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch activity');
    }
  }
);

export const fetchLiveSessions = createAsyncThunk(
  'dashboard/fetchLiveSessions',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.liveSessions(params);
      return response.data.sessions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch live sessions');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.analytics = null;
      state.overview = null;
      state.sessionTrends = [];
      state.topStations = [];
      state.recentActivity = [];
      state.liveSessions = [];
    },
  },
  extraReducers: (builder) => {
    // Analytics (full DJT HAIKA dashboard payload)
    builder.addCase(fetchAnalytics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    });
    builder.addCase(fetchAnalytics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Overview
    builder.addCase(fetchOverview.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchOverview.fulfilled, (state, action) => {
      state.loading = false;
      state.overview = action.payload;
    });
    builder.addCase(fetchOverview.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Session Trends
    builder.addCase(fetchSessionTrends.fulfilled, (state, action) => {
      state.sessionTrends = action.payload;
    });

    // Top Stations
    builder.addCase(fetchTopStations.fulfilled, (state, action) => {
      state.topStations = action.payload;
    });

    // Recent Activity
    builder.addCase(fetchRecentActivity.fulfilled, (state, action) => {
      state.recentActivity = action.payload;
    });

    // Live Sessions
    builder.addCase(fetchLiveSessions.fulfilled, (state, action) => {
      state.liveSessions = action.payload;
    });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
