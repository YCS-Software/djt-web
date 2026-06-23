import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { locationsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchLocations = createAsyncThunk(
  'locations/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await locationsApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load locations');
    }
  }
);

const slice = createSlice({
  name: 'locations',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchLocations.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchLocations.fulfilled, (s, a) => {
      s.loading = false;
      s.rows = a.payload;
    });
    b.addCase(fetchLocations.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
  },
});

export default slice.reducer;
