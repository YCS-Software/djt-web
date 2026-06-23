import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cardsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchCards = createAsyncThunk(
  'cards/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await cardsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load cards');
    }
  }
);

const slice = createSlice({
  name: 'cards',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCards.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchCards.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchCards.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
