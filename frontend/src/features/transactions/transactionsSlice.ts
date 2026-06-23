import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchTransactions = createAsyncThunk(
  'transactions/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await transactionsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load transactions');
    }
  }
);

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTransactions.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchTransactions.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchTransactions.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
