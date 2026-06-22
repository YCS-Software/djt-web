import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stationsApi } from '../../services/api';

interface Station {
  id: string;
  name: string;
  ocppIdentity: string;
  status: string;
  isOnline: boolean;
  location?: any;
  connectors?: any[];
}

interface StationsState {
  stations: Station[];
  selectedStation: Station | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: StationsState = {
  stations: [],
  selectedStation: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchStations = createAsyncThunk('stations/fetchStations', async (params?: object) => {
  const response = await stationsApi.list(params);
  return response.data;
});

export const fetchStationById = createAsyncThunk('stations/fetchStationById', async (id: string) => {
  const response = await stationsApi.getById(id);
  return response.data.station;
});

export const createStation = createAsyncThunk('stations/createStation', async (data: object) => {
  const response = await stationsApi.create(data);
  return response.data.station;
});

export const updateStation = createAsyncThunk(
  'stations/updateStation',
  async ({ id, data }: { id: string; data: object }) => {
    const response = await stationsApi.update(id, data);
    return response.data.station;
  }
);

export const resetStation = createAsyncThunk(
  'stations/resetStation',
  async ({ id, type }: { id: string; type?: string }) => {
    const response = await stationsApi.reset(id, type);
    return response.data;
  }
);

const stationsSlice = createSlice({
  name: 'stations',
  initialState,
  reducers: {
    clearSelectedStation: (state) => { state.selectedStation = null; },
    updateStationStatus: (state, action) => {
      const { stationId, status, isOnline } = action.payload;
      const station = state.stations.find((s) => s.id === stationId);
      if (station) {
        if (status) station.status = status;
        if (isOnline !== undefined) station.isOnline = isOnline;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => { state.loading = true; })
      .addCase(fetchStations.fulfilled, (state, action) => {
        state.loading = false;
        state.stations = action.payload.stations;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchStationById.fulfilled, (state, action) => {
        state.selectedStation = action.payload;
      })
      .addCase(createStation.fulfilled, (state, action) => {
        state.stations.unshift(action.payload);
      })
      .addCase(updateStation.fulfilled, (state, action) => {
        const index = state.stations.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) state.stations[index] = action.payload;
        state.selectedStation = action.payload;
      });
  },
});

export const { clearSelectedStation, updateStationStatus } = stationsSlice.actions;
export default stationsSlice.reducer;
