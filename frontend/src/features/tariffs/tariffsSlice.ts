import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tariffsApi } from '../../services/api';

interface Tariff {
  id: string;
  name: string;
  energyRate: number;
  timeRate?: number;
  parkingRate?: number;
  isActive: boolean;
}

interface TariffsState {
  tariffs: Tariff[];
  selectedTariff: Tariff | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: TariffsState = {
  tariffs: [],
  selectedTariff: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchTariffs = createAsyncThunk('tariffs/fetchTariffs', async (params?: object) => {
  const response = await tariffsApi.list(params);
  return response.data;
});

export const fetchTariffById = createAsyncThunk('tariffs/fetchTariffById', async (id: string) => {
  const response = await tariffsApi.getById(id);
  return response.data.tariff;
});

export const createTariff = createAsyncThunk('tariffs/createTariff', async (data: object) => {
  const response = await tariffsApi.create(data);
  return response.data.tariff;
});

export const updateTariff = createAsyncThunk(
  'tariffs/updateTariff',
  async ({ id, data }: { id: string; data: object }) => {
    const response = await tariffsApi.update(id, data);
    return response.data.tariff;
  }
);

const tariffsSlice = createSlice({
  name: 'tariffs',
  initialState,
  reducers: {
    clearSelectedTariff: (state) => { state.selectedTariff = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTariffs.pending, (state) => { state.loading = true; })
      .addCase(fetchTariffs.fulfilled, (state, action) => {
        state.loading = false;
        state.tariffs = action.payload.tariffs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTariffs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchTariffById.fulfilled, (state, action) => {
        state.selectedTariff = action.payload;
      })
      .addCase(createTariff.fulfilled, (state, action) => {
        state.tariffs.unshift(action.payload);
      })
      .addCase(updateTariff.fulfilled, (state, action) => {
        const index = state.tariffs.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) state.tariffs[index] = action.payload;
        state.selectedTariff = action.payload;
      });
  },
});

export const { clearSelectedTariff } = tariffsSlice.actions;
export default tariffsSlice.reducer;
