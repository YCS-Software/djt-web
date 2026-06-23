import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchReviews = createAsyncThunk(
  'reviews/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await reviewsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load reviews');
    }
  }
);

const slice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchReviews.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchReviews.fulfilled, (s, a) => {
      s.loading = false;
      s.rows = a.payload;
    });
    b.addCase(fetchReviews.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
  },
});

export default slice.reducer;
