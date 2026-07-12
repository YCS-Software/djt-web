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
const FinanceDashboard = React.lazy(() => import('./pages/finance/FinanceDashboard'));
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

// DJT EV menu screens (mirrors djt-ev.web.app)
const LiveSessions = React.lazy(() => import('./pages/sessions/LiveSessions'));
const Business = React.lazy(() => import('./pages/business/Business'));
const Settlements = React.lazy(() => import('./pages/settlements/Settlements'));
const Subscriptions = React.lazy(() => import('./pages/subscriptions/Subscriptions'));
const MemberGroups = React.lazy(() => import('./pages/memberGroups/MemberGroups'));
const CourtesySessions = React.lazy(() => import('./pages/courtesySessions/CourtesySessions'));
const Agents = React.lazy(() => import('./pages/agents/Agents'));
const CDR = React.lazy(() => import('./pages/cdr/CDR'));
const EmspTokens = React.lazy(() => import('./pages/emspTokens/EmspTokens'));
const Downtime = React.lazy(() => import('./pages/downtime/Downtime'));
const Maps = React.lazy(() => import('./pages/maps/Maps'));
const SmartScheduling = React.lazy(() => import('./pages/smartScheduling/SmartScheduling'));
const StaticData = React.lazy(() => import('./pages/staticData/StaticData'));
const Configurations = React.lazy(() => import('./pages/configurations/Configurations'));
const Connections = React.lazy(() => import('./pages/connections/Connections'));
const BulkRemote = React.lazy(() => import('./pages/bulkRemote/BulkRemote'));
const Instructions = React.lazy(() => import('./pages/instructions/Instructions'));
const ServerLogs = React.lazy(() => import('./pages/logs/ServerLogs'));
const QrGenerator = React.lazy(() => import('./pages/qr/QrGenerator'));
const AccessControl = React.lazy(() => import('./pages/accessControl/AccessControl'));
const BusinessConfiguration = React.lazy(() => import('./pages/admin/BusinessConfiguration'));
const PlatformConfiguration = React.lazy(() => import('./pages/admin/PlatformConfiguration'));
const AppControl = React.lazy(() => import('./pages/admin/AppControl'));
const PaywallControl = React.lazy(() => import('./pages/admin/PaywallControl'));
const ProductsLink = React.lazy(() => import('./pages/admin/ProductsLink'));

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
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/live-sessions" element={<LiveSessions />} />

          {/* Manage */}
          <Route path="/business" element={<Business />} />
          <Route path="/settlements" element={<Settlements />} />

          {/* Network extras */}
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/member-groups" element={<MemberGroups />} />
          <Route path="/courtesy-sessions" element={<CourtesySessions />} />
          <Route path="/agents" element={<Agents />} />

          {/* Roaming */}
          <Route path="/cdr" element={<CDR />} />
          <Route path="/emsp-tokens" element={<EmspTokens />} />

          {/* Charge extras */}
          <Route path="/downtime" element={<Downtime />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/smart-scheduling" element={<SmartScheduling />} />

          {/* Tools & Utilities */}
          <Route path="/static-data" element={<StaticData />} />
          <Route path="/configurations" element={<Configurations />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/bulk-remote" element={<BulkRemote />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/server-logs" element={<ServerLogs />} />
          <Route path="/qr-generator" element={<QrGenerator />} />
          <Route path="/access-control" element={<AccessControl />} />

          {/* Admin Tools */}
          <Route path="/admin/business-config" element={<BusinessConfiguration />} />
          <Route path="/admin/platform-config" element={<PlatformConfiguration />} />
          <Route path="/admin/app-control" element={<AppControl />} />
          <Route path="/admin/paywall-control" element={<PaywallControl />} />
          <Route path="/admin/products-link" element={<ProductsLink />} />

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
