import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stationsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchStations = createAsyncThunk(
  'stations/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await stationsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load stations');
    }
  }
);

const slice = createSlice({
  name: 'stations',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchStations.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchStations.fulfilled, (s, a) => {
      s.loading = false;
      s.rows = a.payload;
    });
    b.addCase(fetchStations.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
  },
});

export default slice.reducer;
