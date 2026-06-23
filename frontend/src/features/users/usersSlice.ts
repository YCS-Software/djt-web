import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, error: null };

export const fetchUsers = createAsyncThunk(
  'users/fetch',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const r = await usersApi.list(params);
      return r.data.rows as any[];
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to load users');
    }
  }
);

const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchUsers.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchUsers.fulfilled, (s, a) => { s.loading = false; s.rows = a.payload; });
    b.addCase(fetchUsers.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export default slice.reducer;
