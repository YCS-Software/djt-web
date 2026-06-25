import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { locationsApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, saving: false, error: null };

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

export const createLocation = createAsyncThunk(
  'locations/create',
  async (data: object, { dispatch, rejectWithValue }) => {
    try {
      await locationsApi.create(data);
      await dispatch(fetchLocations());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to create location');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'locations/update',
  async ({ id, data }: { id: string; data: object }, { dispatch, rejectWithValue }) => {
    try {
      await locationsApi.update(id, data);
      await dispatch(fetchLocations());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to update location');
    }
  }
);

export const deleteLocation = createAsyncThunk(
  'locations/delete',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await locationsApi.delete(id);
      await dispatch(fetchLocations());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to delete location');
    }
  }
);

const slice = createSlice({
  name: 'locations',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchLocations.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchLocations.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchLocations.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
    b.addMatcher(
      (a) => /locations\/(create|update|delete)\/pending/.test(a.type),
      (s) => { s.saving = true; s.error = null; }
    );
    b.addMatcher(
      (a) => /locations\/(create|update|delete)\/(fulfilled|rejected)/.test(a.type),
      (s, a: any) => { s.saving = false; if (a.type.endsWith('rejected')) s.error = a.payload as string; }
    );
  },
});

export default slice.reducer;
