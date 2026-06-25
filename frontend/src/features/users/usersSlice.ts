import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../../services/api';

interface State {
  rows: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: State = { rows: [], loading: false, saving: false, error: null };

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

export const createUser = createAsyncThunk(
  'users/create',
  async (data: object, { dispatch, rejectWithValue }) => {
    try {
      await usersApi.create(data);
      await dispatch(fetchUsers());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: object }, { dispatch, rejectWithValue }) => {
    try {
      await usersApi.update(id, data);
      await dispatch(fetchUsers());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await usersApi.delete(id);
      await dispatch(fetchUsers());
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || 'Failed to delete user');
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
    b.addMatcher(
      (a) => /users\/(create|update|delete)\/pending/.test(a.type),
      (s) => { s.saving = true; s.error = null; }
    );
    b.addMatcher(
      (a) => /users\/(create|update|delete)\/(fulfilled|rejected)/.test(a.type),
      (s, a: any) => { s.saving = false; if (a.type.endsWith('rejected')) s.error = a.payload as string; }
    );
  },
});

export default slice.reducer;
