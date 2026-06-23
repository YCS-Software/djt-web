import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { partnersApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchPartners = createAsyncThunk(
  'partners/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await partnersApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load partners');
    }
  }
);

const slice = createSlice({
  name: 'partners',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPartners.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchPartners.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchPartners.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
