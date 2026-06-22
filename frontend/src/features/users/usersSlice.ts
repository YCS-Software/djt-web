import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  partnerId?: string;
  createdAt: string;
}

interface UsersState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

const initialState: UsersState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (params?: object) => {
  const response = await usersApi.list(params);
  return response.data;
});

export const fetchUserById = createAsyncThunk('users/fetchUserById', async (id: string) => {
  const response = await usersApi.getById(id);
  return response.data.user;
});

export const createUser = createAsyncThunk('users/createUser', async (data: object) => {
  const response = await usersApi.create(data);
  return response.data.user;
});

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id: string; data: object }) => {
    const response = await usersApi.update(id, data);
    return response.data.user;
  }
);

export const deleteUser = createAsyncThunk('users/deleteUser', async (id: string) => {
  await usersApi.delete(id);
  return id;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSelectedUser: (state) => { state.selectedUser = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selectedUser = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
        state.selectedUser = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      });
  },
});

export const { clearSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;
