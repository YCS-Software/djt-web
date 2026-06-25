import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { partnersApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, saving: false, error: null };

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

export const createPartner = createAsyncThunk(
  'partners/create',
  async (data: object, { dispatch, rejectWithValue }) => {
    try {
      await partnersApi.create(data);
      await dispatch(fetchPartners());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to create partner');
    }
  }
);

export const updatePartner = createAsyncThunk(
  'partners/update',
  async ({ id, data }: { id: string; data: object }, { dispatch, rejectWithValue }) => {
    try {
      await partnersApi.update(id, data);
      await dispatch(fetchPartners());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to update partner');
    }
  }
);

export const deletePartner = createAsyncThunk(
  'partners/delete',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await partnersApi.delete(id);
      await dispatch(fetchPartners());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to delete partner');
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
    b.addMatcher(
      (a) => /partners\/(create|update|delete)\/pending/.test(a.type),
      (s) => { s.saving = true; s.error = null; }
    );
    b.addMatcher(
      (a) => /partners\/(create|update|delete)\/(fulfilled|rejected)/.test(a.type),
      (s, a: any) => { s.saving = false; if (a.type.endsWith('rejected')) s.error = a.payload as string; }
    );
  },
});

export default slice.reducer;
