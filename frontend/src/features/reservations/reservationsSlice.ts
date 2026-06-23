import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchReservations = createAsyncThunk(
  'reservations/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await reservationsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load reservations');
    }
  }
);

const slice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchReservations.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchReservations.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchReservations.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
