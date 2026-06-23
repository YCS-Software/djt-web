import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchReports = createAsyncThunk(
  'reports/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await reportsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load reports');
    }
  }
);

const slice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchReports.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchReports.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchReports.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
