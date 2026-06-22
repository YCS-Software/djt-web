import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import usersReducer from '../features/users/usersSlice';
import partnersReducer from '../features/partners/partnersSlice';
import locationsReducer from '../features/locations/locationsSlice';
import stationsReducer from '../features/stations/stationsSlice';
import driversReducer from '../features/drivers/driversSlice';
import sessionsReducer from '../features/sessions/sessionsSlice';
import tariffsReducer from '../features/tariffs/tariffsSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    partners: partnersReducer,
    locations: locationsReducer,
    stations: stationsReducer,
    drivers: driversReducer,
    sessions: sessionsReducer,
    tariffs: tariffsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
