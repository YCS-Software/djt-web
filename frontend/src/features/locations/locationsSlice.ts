import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { locationsApi } from '../../services/api';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: string;
  stations?: any[];
}

interface LocationsState {
  locations: Location[];
  selectedLocation: Location | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: LocationsState = {
  locations: [],
  selectedLocation: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchLocations = createAsyncThunk('locations/fetchLocations', async (params?: object) => {
  const response = await locationsApi.list(params);
  return response.data;
});

export const fetchLocationById = createAsyncThunk('locations/fetchLocationById', async (id: string) => {
  const response = await locationsApi.getById(id);
  return response.data.location;
});

export const createLocation = createAsyncThunk('locations/createLocation', async (data: object) => {
  const response = await locationsApi.create(data);
  return response.data.location;
});

export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async ({ id, data }: { id: string; data: object }) => {
    const response = await locationsApi.update(id, data);
    return response.data.location;
  }
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearSelectedLocation: (state) => { state.selectedLocation = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => { state.loading = true; })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload.locations;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchLocationById.fulfilled, (state, action) => {
        state.selectedLocation = action.payload;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.locations.unshift(action.payload);
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        const index = state.locations.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) state.locations[index] = action.payload;
        state.selectedLocation = action.payload;
      });
  },
});

export const { clearSelectedLocation } = locationsSlice.actions;
export default locationsSlice.reducer;
