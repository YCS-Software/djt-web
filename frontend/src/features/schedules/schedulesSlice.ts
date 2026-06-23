import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { schedulesApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchSchedules = createAsyncThunk(
  'schedules/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await schedulesApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load schedules');
    }
  }
);

const slice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSchedules.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchSchedules.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchSchedules.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
