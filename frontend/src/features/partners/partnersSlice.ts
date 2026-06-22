import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { partnersApi } from '../../services/api';

interface Partner {
  id: string;
  name: string;
  email: string;
  companyName: string;
  status: string;
  wallet?: { balance: number };
}

interface PartnersState {
  partners: Partner[];
  selectedPartner: Partner | null;
  loading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number };
}

const initialState: PartnersState = {
  partners: [],
  selectedPartner: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20 },
};

export const fetchPartners = createAsyncThunk('partners/fetchPartners', async (params?: object) => {
  const response = await partnersApi.list(params);
  return response.data;
});

export const fetchPartnerById = createAsyncThunk('partners/fetchPartnerById', async (id: string) => {
  const response = await partnersApi.getById(id);
  return response.data.partner;
});

export const createPartner = createAsyncThunk('partners/createPartner', async (data: object) => {
  const response = await partnersApi.create(data);
  return response.data.partner;
});

export const updatePartner = createAsyncThunk(
  'partners/updatePartner',
  async ({ id, data }: { id: string; data: object }) => {
    const response = await partnersApi.update(id, data);
    return response.data.partner;
  }
);

const partnersSlice = createSlice({
  name: 'partners',
  initialState,
  reducers: {
    clearSelectedPartner: (state) => { state.selectedPartner = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartners.pending, (state) => { state.loading = true; })
      .addCase(fetchPartners.fulfilled, (state, action) => {
        state.loading = false;
        state.partners = action.payload.partners;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchPartnerById.fulfilled, (state, action) => {
        state.selectedPartner = action.payload;
      })
      .addCase(createPartner.fulfilled, (state, action) => {
        state.partners.unshift(action.payload);
      })
      .addCase(updatePartner.fulfilled, (state, action) => {
        const index = state.partners.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.partners[index] = action.payload;
        state.selectedPartner = action.payload;
      });
  },
});

export const { clearSelectedPartner } = partnersSlice.actions;
export default partnersSlice.reducer;
