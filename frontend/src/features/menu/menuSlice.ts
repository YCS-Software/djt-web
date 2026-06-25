import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { menuApi } from '../../services/api';

export interface MenuItem {
  title: string;
  path: string;
}
export interface MenuSection {
  heading: string;
  items: MenuItem[];
}

interface State {
  sections: MenuSection[];
  role: string | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: State = { sections: [], role: null, loaded: false, loading: false, error: null };

export const fetchMenu = createAsyncThunk('menu/fetch', async (_: void, { rejectWithValue }) => {
  try {
    const r = await menuApi.get();
    return { sections: (r.data.menu || []) as MenuSection[], role: r.data.role || null };
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Failed to load menu');
  }
});

const slice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearMenu: (s) => {
      s.sections = [];
      s.role = null;
      s.loaded = false;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMenu.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchMenu.fulfilled, (s, a) => {
      s.loading = false;
      s.loaded = true;
      s.sections = a.payload.sections;
      s.role = a.payload.role;
    });
    b.addCase(fetchMenu.rejected, (s, a) => { s.loading = false; s.loaded = true; s.error = a.payload as string; });
  },
});

export const { clearMenu } = slice.actions;
export default slice.reducer;
