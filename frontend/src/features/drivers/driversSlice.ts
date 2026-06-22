import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { driversApi } from '../../services/api';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  wallet?: { balance: number };
}

interface DriversState {
  drivers: Driver[];
  selectedDriver: Driver | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: DriversState = {
  drivers: [],
  selectedDriver: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchDrivers = createAsyncThunk('drivers/fetchDrivers', async (params?: object) => {
  const response = await driversApi.list(params);
  return response.data;
});

export const fetchDriverById = createAsyncThunk('drivers/fetchDriverById', async (id: string) => {
  const response = await driversApi.getById(id);
  return response.data.driver;
});

export const createDriver = createAsyncThunk('drivers/createDriver', async (data: object) => {
  const response = await driversApi.create(data);
  return response.data.driver;
});

export const updateDriver = createAsyncThunk(
  'drivers/updateDriver',
  async ({ id, data }: { id: string; data: object }) => {
    const response = await driversApi.update(id, data);
    return response.data.driver;
  }
);

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    clearSelectedDriver: (state) => { state.selectedDriver = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => { state.loading = true; })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = action.payload.drivers;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchDriverById.fulfilled, (state, action) => {
        state.selectedDriver = action.payload;
      })
      .addCase(createDriver.fulfilled, (state, action) => {
        state.drivers.unshift(action.payload);
      })
      .addCase(updateDriver.fulfilled, (state, action) => {
        const index = state.drivers.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.drivers[index] = action.payload;
        state.selectedDriver = action.payload;
      });
  },
});

export const { clearSelectedDriver } = driversSlice.actions;
export default driversSlice.reducer;
