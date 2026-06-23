import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { disputesApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchDisputes = createAsyncThunk(
  'disputes/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await disputesApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load disputes');
    }
  }
);

const slice = createSlice({
  name: 'disputes',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDisputes.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchDisputes.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchDisputes.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
