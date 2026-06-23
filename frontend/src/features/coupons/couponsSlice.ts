import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchCoupons = createAsyncThunk(
  'coupons/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await couponsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load coupons');
    }
  }
);

const slice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCoupons.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchCoupons.fulfilled, (s, a) => {
      s.loading = false;
      s.rows = a.payload;
    });
    b.addCase(fetchCoupons.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
  },
});

export default slice.reducer;
