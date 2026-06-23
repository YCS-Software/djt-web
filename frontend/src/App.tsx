import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Layout
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Lazy load pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Users = React.lazy(() => import('./pages/users/Users'));
const UserDetail = React.lazy(() => import('./pages/users/UserDetail'));
const Partners = React.lazy(() => import('./pages/partners/Partners'));
const PartnerDetail = React.lazy(() => import('./pages/partners/PartnerDetail'));
const Locations = React.lazy(() => import('./pages/locations/Locations'));
const LocationDetail = React.lazy(() => import('./pages/locations/LocationDetail'));
const Stations = React.lazy(() => import('./pages/stations/Stations'));
const StationDetail = React.lazy(() => import('./pages/stations/StationDetail'));
const Connectors = React.lazy(() => import('./pages/connectors/Connectors'));
const Drivers = React.lazy(() => import('./pages/drivers/Drivers'));
const DriverDetail = React.lazy(() => import('./pages/drivers/DriverDetail'));
const Sessions = React.lazy(() => import('./pages/sessions/Sessions'));
const Transactions = React.lazy(() => import('./pages/transactions/Transactions'));
const Schedules = React.lazy(() => import('./pages/schedules/Schedules'));
const SessionDetail = React.lazy(() => import('./pages/sessions/SessionDetail'));
const Tariffs = React.lazy(() => import('./pages/tariffs/Tariffs'));
const Reservations = React.lazy(() => import('./pages/reservations/Reservations'));
const Cards = React.lazy(() => import('./pages/cards/Cards'));
const Disputes = React.lazy(() => import('./pages/disputes/Disputes'));
const Coupons = React.lazy(() => import('./pages/coupons/Coupons'));
const Reviews = React.lazy(() => import('./pages/reviews/Reviews'));
const Reports = React.lazy(() => import('./pages/reports/Reports'));
const AuditLogs = React.lazy(() => import('./pages/logs/AuditLogs'));
const OcppLogs = React.lazy(() => import('./pages/logs/OcppLogs'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading component
const PageLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress color="primary" />
  </Box>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* User Management */}
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />

          {/* Partner Management */}
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:id" element={<PartnerDetail />} />

          {/* Location Management */}
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/:id" element={<LocationDetail />} />

          {/* Station Management */}
          <Route path="/stations" element={<Stations />} />
          <Route path="/stations/:id" element={<StationDetail />} />
          <Route path="/connectors" element={<Connectors />} />

          {/* Driver Management */}
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/drivers/:id" element={<DriverDetail />} />

          {/* Sessions */}
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />

          {/* Transactions & Schedules */}
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/schedules" element={<Schedules />} />

          {/* Tariffs & Pricing */}
          <Route path="/tariffs" element={<Tariffs />} />

          {/* Reservations */}
          <Route path="/reservations" element={<Reservations />} />

          {/* RFID Cards */}
          <Route path="/cards" element={<Cards />} />

          {/* Support */}
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/coupons" element={<Coupons />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />

          {/* Logs */}
          <Route path="/logs/audit" element={<AuditLogs />} />
          <Route path="/logs/ocpp" element={<OcppLogs />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;
