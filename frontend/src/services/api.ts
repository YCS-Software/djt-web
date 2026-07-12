import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// All admin-console resource endpoints live under the /web namespace served by
// djt-app (api/routes/web/webRtr.js), behind verifyToken + isAdmin.
export const usersApi = {
  list: (params?: object) => api.get('/web/users', { params }),
  getById: (id: string) => api.get(`/web/users/${id}`),
  create: (data: object) => api.post('/web/users', data),
  update: (id: string, data: object) => api.put(`/web/users/${id}`, data),
  delete: (id: string) => api.delete(`/web/users/${id}`),
};

export const partnersApi = {
  list: (params?: object) => api.get('/web/partners', { params }),
  getById: (id: string) => api.get(`/web/partners/${id}`),
  create: (data: object) => api.post('/web/partners', data),
  update: (id: string, data: object) => api.put(`/web/partners/${id}`, data),
  delete: (id: string) => api.delete(`/web/partners/${id}`),
  getWallet: (id: string) => api.get(`/web/partners/${id}/wallet`),
  getStats: (id: string) => api.get(`/web/partners/${id}/stats`),
};

export const locationsApi = {
  list: (params?: object) => api.get('/web/locations', { params }),
  getById: (id: string) => api.get(`/web/locations/${id}`),
  create: (data: object) => api.post('/web/locations', data),
  update: (id: string, data: object) => api.put(`/web/locations/${id}`, data),
  delete: (id: string) => api.delete(`/web/locations/${id}`),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/web/locations/nearby', { params: { lat, lng, radius } }),
};

export const stationsApi = {
  list: (params?: object) => api.get('/web/stations', { params }),
  getById: (id: string) => api.get(`/web/stations/${id}`),
  create: (data: object) => api.post('/web/stations', data),
  update: (id: string, data: object) => api.put(`/web/stations/${id}`, data),
  delete: (id: string) => api.delete(`/web/stations/${id}`),
  reset: (id: string, type?: string) => api.post(`/web/stations/${id}/reset`, { type }),
  remoteStart: (id: string, connectorId: number, idTag: string) =>
    api.post(`/web/stations/${id}/remote-start`, { connectorId, idTag }),
  remoteStop: (id: string, sessionId: string) =>
    api.post(`/web/stations/${id}/remote-stop`, { sessionId }),
  getStats: (id: string) => api.get(`/web/stations/${id}/stats`),
};

export const connectorsApi = {
  list: (params?: object) => api.get('/web/connectors', { params }),
  getById: (id: string) => api.get(`/web/connectors/${id}`),
  create: (data: object) => api.post('/web/connectors', data),
  update: (id: string, data: object) => api.put(`/web/connectors/${id}`, data),
  delete: (id: string) => api.delete(`/web/connectors/${id}`),
  regenerateQR: (id: string) => api.post(`/web/connectors/${id}/regenerate-qr`),
};

export const driversApi = {
  list: (params?: object) => api.get('/web/drivers', { params }),
  getById: (id: string) => api.get(`/web/drivers/${id}`),
  create: (data: object) => api.post('/web/drivers', data),
  update: (id: string, data: object) => api.put(`/web/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/web/drivers/${id}`),
  getWallet: (id: string) => api.get(`/web/drivers/${id}/wallet`),
  topupWallet: (id: string, amount: number) =>
    api.post(`/web/drivers/${id}/wallet/topup`, { amount }),
  getSessions: (id: string, params?: object) =>
    api.get(`/web/drivers/${id}/sessions`, { params }),
  getStats: (id: string) => api.get(`/web/drivers/${id}/stats`),
};

export const sessionsApi = {
  list: (params?: object) => api.get('/web/sessions', { params }),
  getById: (id: string) => api.get(`/web/sessions/${id}`),
  getActive: (params?: object) => api.get('/web/live-sessions', { params }),
  stop: (id: string) => api.post(`/web/live-sessions/${id}/stop`),
  getMeterValues: (id: string) => api.get(`/web/sessions/${id}/meter-values`),
  getStats: (params?: object) => api.get('/web/sessions/stats', { params }),
};

export const tariffsApi = {
  list: (params?: object) => api.get('/web/tariffs', { params }),
  getById: (id: string) => api.get(`/web/tariffs/${id}`),
  create: (data: object) => api.post('/web/tariffs', data),
  update: (id: string, data: object) => api.put(`/web/tariffs/${id}`, data),
  delete: (id: string) => api.delete(`/web/tariffs/${id}`),
  calculateCost: (id: string, data: object) =>
    api.post(`/web/tariffs/${id}/calculate`, data),
};

export const reservationsApi = {
  list: (params?: object) => api.get('/web/reservations', { params }),
  getById: (id: string) => api.get(`/web/reservations/${id}`),
  create: (data: object) => api.post('/web/reservations', data),
  cancel: (id: string, reason?: string) =>
    api.post(`/web/reservations/${id}/cancel`, { reason }),
  getAvailableSlots: (connectorId: string, date: string) =>
    api.get('/web/reservations/available-slots', { params: { connectorId, date } }),
};

export const cardsApi = {
  list: (params?: object) => api.get('/web/cards', { params }),
  getById: (id: string) => api.get(`/web/cards/${id}`),
  create: (data: object) => api.post('/web/cards', data),
  update: (id: string, data: object) => api.put(`/web/cards/${id}`, data),
  block: (id: string, reason?: string) => api.post(`/web/cards/${id}/block`, { reason }),
  unblock: (id: string) => api.post(`/web/cards/${id}/unblock`),
  delete: (id: string) => api.delete(`/web/cards/${id}`),
};

export const disputesApi = {
  list: (params?: object) => api.get('/web/disputes', { params }),
  getById: (id: string) => api.get(`/web/disputes/${id}`),
  create: (data: object) => api.post('/web/disputes', data),
  update: (id: string, data: object) => api.put(`/web/disputes/${id}`, data),
  resolve: (id: string, data: object) => api.post(`/web/disputes/${id}/resolve`, data),
};

export const couponsApi = {
  list: (params?: object) => api.get('/web/coupons', { params }),
  getById: (id: string) => api.get(`/web/coupons/${id}`),
  create: (data: object) => api.post('/web/coupons', data),
  update: (id: string, data: object) => api.put(`/web/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/web/coupons/${id}`),
  validate: (code: string, orderAmount?: number) =>
    api.post('/web/coupons/validate', { code, orderAmount }),
};

export const reviewsApi = {
  list: (params?: object) => api.get('/web/reviews', { params }),
  getById: (id: string) => api.get(`/web/reviews/${id}`),
  reply: (id: string, reply: string) => api.post(`/web/reviews/${id}/reply`, { reply }),
  delete: (id: string) => api.delete(`/web/reviews/${id}`),
  getByStation: (stationId: string, params?: object) =>
    api.get(`/web/reviews/station/${stationId}`, { params }),
};

export const transactionsApi = {
  list: (params?: object) => api.get('/web/transactions', { params }),
  getById: (id: string) => api.get(`/web/transactions/${id}`),
};

export const schedulesApi = {
  list: (params?: object) => api.get('/web/schedules', { params }),
  getById: (id: string) => api.get(`/web/schedules/${id}`),
};

// Report builder (djt-app): meta lists report types + columns; generate runs one.
export const reportsApi = {
  list: (params?: object) => api.get('/web/reports', { params }),
  meta: () => api.get('/web/reports/meta'),
  generate: (params: object) => api.get('/web/reports/generate', { params }),
};

// Admin web-console dashboard endpoints live under the /web namespace.
export const dashboardApi = {
  analytics: (params?: object) => api.get('/web/dashboard/analytics', { params }),
  overview: (params?: object) => api.get('/web/dashboard/overview', { params }),
  sessionTrends: (params?: object) => api.get('/web/dashboard/session-trends', { params }),
  stationStatus: (params?: object) => api.get('/web/dashboard/station-status', { params }),
  topStations: (params?: object) => api.get('/web/dashboard/top-stations', { params }),
  recentActivity: (params?: object) => api.get('/web/dashboard/recent-activity', { params }),
  liveSessions: (params?: object) => api.get('/web/dashboard/live-sessions', { params }),
};

// Finance dashboard — franchises (station owners) and their revenue share.
// `range` is one of: all | today | month | year (period the split is computed for).
export const financeApi = {
  franchises: (params?: { range?: string }) => api.get('/web/finance/franchises', { params }),
};

export const logsApi = {
  audit: (params?: object) => api.get('/web/audit-logs', { params }),
  auditById: (id: string) => api.get(`/web/audit-logs/${id}`),
  ocpp: (params?: object) => api.get('/web/server-logs', { params }),
  ocppById: (id: string) => api.get(`/web/server-logs/${id}`),
};

// ── DJT EV menu resources (mirrors djt-ev.web.app) ──────────────────────────
// Every operation is under the /web admin namespace served by djt-app.
const crud = (base: string) => ({
  list: (params?: object) => api.get(`/web/${base}`, { params }),
  getById: (id: string) => api.get(`/web/${base}/${id}`),
  create: (data: object) => api.post(`/web/${base}`, data),
  update: (id: string, data: object) => api.put(`/web/${base}/${id}`, data),
  delete: (id: string) => api.delete(`/web/${base}/${id}`),
});

export const businessApi = crud('businesses');
export const settlementsApi = {
  ...crud('settlements'),
  markSettled: (id: string, data?: object) => api.post(`/web/settlements/${id}/settle`, data || {}),
};
export const subscriptionsApi = crud('subscriptions');
export const memberGroupsApi = crud('member-groups');
export const courtesySessionsApi = crud('courtesy-sessions');
export const agentsApi = crud('agents');
export const cdrApi = { list: (params?: object) => api.get('/web/cdr', { params }) };
export const emspTokensApi = crud('emsp-tokens');
export const downtimeApi = { list: (params?: object) => api.get('/web/downtime', { params }) };
export const smartSchedulingApi = crud('smart-scheduling');
export const staticDataApi = { list: (params?: object) => api.get('/web/static-data', { params }) };
export const configurationsApi = {
  list: (params?: object) => api.get('/web/configurations', { params }),
  get: () => api.get('/web/configurations'),
  save: (data: object) => api.put('/web/configurations', data),
};
export const connectionsApi = { list: (params?: object) => api.get('/web/connections', { params }) };
export const bulkRemoteApi = {
  list: (params?: object) => api.get('/web/stations', { params }),
  execute: (data: object) => api.post('/web/stations/bulk-remote', data),
};
export const instructionsApi = { list: (params?: object) => api.get('/web/instructions', { params }) };
export const accessControlApi = crud('roles');
export const productsLinkApi = crud('products');
export const settingsApi = {
  get: (scope: string) => api.get(`/web/settings/${scope}`),
  save: (scope: string, data: object) => api.put(`/web/settings/${scope}`, data),
};

// Role-based navigation menu for the logged-in admin (login-based sidebar).
export const menuApi = {
  get: () => api.get('/web/menu'),
};

export default api;
