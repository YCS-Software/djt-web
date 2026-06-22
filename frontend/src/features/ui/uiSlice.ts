import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UiState {
  sidebarOpen: boolean;
  notifications: Notification[];
  loading: boolean;
  globalError: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  notifications: [],
  loading: false,
  globalError: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      state.notifications.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  setLoading,
  setGlobalError,
} = uiSlice.actions;

export default uiSlice.reducer;
