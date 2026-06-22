import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sessionsApi } from '../../services/api';

interface Session {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  energyDelivered?: number;
  totalCost?: number;
  station?: any;
  driver?: any;
}

interface SessionsState {
  sessions: Session[];
  activeSessions: Session[];
  selectedSession: Session | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: SessionsState = {
  sessions: [],
  activeSessions: [],
  selectedSession: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchSessions = createAsyncThunk('sessions/fetchSessions', async (params?: object) => {
  const response = await sessionsApi.list(params);
  return response.data;
});

export const fetchActiveSessions = createAsyncThunk('sessions/fetchActiveSessions', async (params?: object) => {
  const response = await sessionsApi.getActive(params);
  return response.data.sessions;
});

export const fetchSessionById = createAsyncThunk('sessions/fetchSessionById', async (id: string) => {
  const response = await sessionsApi.getById(id);
  return response.data.session;
});

export const stopSession = createAsyncThunk('sessions/stopSession', async (id: string) => {
  await sessionsApi.stop(id);
  return id;
});

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearSelectedSession: (state) => { state.selectedSession = null; },
    updateSessionInList: (state, action) => {
      const { sessionId, data } = action.payload;
      const index = state.sessions.findIndex((s) => s.id === sessionId);
      if (index !== -1) {
        state.sessions[index] = { ...state.sessions[index], ...data };
      }
      const activeIndex = state.activeSessions.findIndex((s) => s.id === sessionId);
      if (activeIndex !== -1) {
        state.activeSessions[activeIndex] = { ...state.activeSessions[activeIndex], ...data };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => { state.loading = true; })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload.sessions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.activeSessions = action.payload;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.selectedSession = action.payload;
      })
      .addCase(stopSession.fulfilled, (state, action) => {
        state.activeSessions = state.activeSessions.filter((s) => s.id !== action.payload);
      });
  },
});

export const { clearSelectedSession, updateSessionInList } = sessionsSlice.actions;
export default sessionsSlice.reducer;
