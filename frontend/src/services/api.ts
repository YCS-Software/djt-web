import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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

// API methods
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

export const usersApi = {
  list: (params?: object) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: object) => api.post('/users', data),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const partnersApi = {
  list: (params?: object) => api.get('/partners', { params }),
  getById: (id: string) => api.get(`/partners/${id}`),
  create: (data: object) => api.post('/partners', data),
  update: (id: string, data: object) => api.put(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
  getWallet: (id: string) => api.get(`/partners/${id}/wallet`),
  getStats: (id: string) => api.get(`/partners/${id}/stats`),
};

export const locationsApi = {
  list: (params?: object) => api.get('/locations', { params }),
  getById: (id: string) => api.get(`/locations/${id}`),
  create: (data: object) => api.post('/locations', data),
  update: (id: string, data: object) => api.put(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/locations/nearby', { params: { lat, lng, radius } }),
};

export const stationsApi = {
  list: (params?: object) => api.get('/stations', { params }),
  getById: (id: string) => api.get(`/stations/${id}`),
  create: (data: object) => api.post('/stations', data),
  update: (id: string, data: object) => api.put(`/stations/${id}`, data),
  delete: (id: string) => api.delete(`/stations/${id}`),
  reset: (id: string, type?: string) => api.post(`/stations/${id}/reset`, { type }),
  remoteStart: (id: string, connectorId: number, idTag: string) =>
    api.post(`/stations/${id}/remote-start`, { connectorId, idTag }),
  remoteStop: (id: string, sessionId: string) =>
    api.post(`/stations/${id}/remote-stop`, { sessionId }),
  getStats: (id: string) => api.get(`/stations/${id}/stats`),
};

export const connectorsApi = {
  list: (params?: object) => api.get('/connectors', { params }),
  getById: (id: string) => api.get(`/connectors/${id}`),
  create: (data: object) => api.post('/connectors', data),
  update: (id: string, data: object) => api.put(`/connectors/${id}`, data),
  delete: (id: string) => api.delete(`/connectors/${id}`),
  regenerateQR: (id: string) => api.post(`/connectors/${id}/regenerate-qr`),
};

export const driversApi = {
  list: (params?: object) => api.get('/drivers', { params }),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: object) => api.post('/drivers', data),
  update: (id: string, data: object) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  getWallet: (id: string) => api.get(`/drivers/${id}/wallet`),
  topupWallet: (id: string, amount: number) =>
    api.post(`/drivers/${id}/wallet/topup`, { amount }),
  getSessions: (id: string, params?: object) =>
    api.get(`/drivers/${id}/sessions`, { params }),
  getStats: (id: string) => api.get(`/drivers/${id}/stats`),
};

export const sessionsApi = {
  list: (params?: object) => api.get('/sessions', { params }),
  getById: (id: string) => api.get(`/sessions/${id}`),
  getActive: (params?: object) => api.get('/sessions/active', { params }),
  stop: (id: string) => api.post(`/sessions/${id}/stop`),
  getMeterValues: (id: string) => api.get(`/sessions/${id}/meter-values`),
  getStats: (params?: object) => api.get('/sessions/stats', { params }),
};

export const tariffsApi = {
  list: (params?: object) => api.get('/tariffs', { params }),
  getById: (id: string) => api.get(`/tariffs/${id}`),
  create: (data: object) => api.post('/tariffs', data),
  update: (id: string, data: object) => api.put(`/tariffs/${id}`, data),
  delete: (id: string) => api.delete(`/tariffs/${id}`),
  calculateCost: (id: string, data: object) =>
    api.post(`/tariffs/${id}/calculate`, data),
};

export const reservationsApi = {
  list: (params?: object) => api.get('/reservations', { params }),
  getById: (id: string) => api.get(`/reservations/${id}`),
  create: (data: object) => api.post('/reservations', data),
  cancel: (id: string, reason?: string) =>
    api.post(`/reservations/${id}/cancel`, { reason }),
  getAvailableSlots: (connectorId: string, date: string) =>
    api.get('/reservations/available-slots', { params: { connectorId, date } }),
};

export const cardsApi = {
  list: (params?: object) => api.get('/cards', { params }),
  getById: (id: string) => api.get(`/cards/${id}`),
  create: (data: object) => api.post('/cards', data),
  update: (id: string, data: object) => api.put(`/cards/${id}`, data),
  block: (id: string, reason?: string) => api.post(`/cards/${id}/block`, { reason }),
  unblock: (id: string) => api.post(`/cards/${id}/unblock`),
  delete: (id: string) => api.delete(`/cards/${id}`),
};

export const disputesApi = {
  list: (params?: object) => api.get('/disputes', { params }),
  getById: (id: string) => api.get(`/disputes/${id}`),
  create: (data: object) => api.post('/disputes', data),
  update: (id: string, data: object) => api.put(`/disputes/${id}`, data),
  resolve: (id: string, data: object) => api.post(`/disputes/${id}/resolve`, data),
};

export const couponsApi = {
  list: (params?: object) => api.get('/coupons', { params }),
  getById: (id: string) => api.get(`/coupons/${id}`),
  create: (data: object) => api.post('/coupons', data),
  update: (id: string, data: object) => api.put(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
  validate: (code: string, orderAmount?: number) =>
    api.post('/coupons/validate', { code, orderAmount }),
};

export const reviewsApi = {
  list: (params?: object) => api.get('/reviews', { params }),
  getById: (id: string) => api.get(`/reviews/${id}`),
  reply: (id: string, reply: string) => api.post(`/reviews/${id}/reply`, { reply }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  getByStation: (stationId: string, params?: object) =>
    api.get(`/reviews/station/${stationId}`, { params }),
};

export const reportsApi = {
  sessions: (params?: object) => api.get('/reports/sessions', { params }),
  revenue: (params?: object) => api.get('/reports/revenue', { params }),
  energy: (params?: object) => api.get('/reports/energy', { params }),
  utilization: (params?: object) => api.get('/reports/utilization', { params }),
  driverActivity: (params?: object) => api.get('/reports/driver-activity', { params }),
  settlement: (params?: object) => api.get('/reports/settlement', { params }),
};

export const dashboardApi = {
  overview: (params?: object) => api.get('/dashboard/overview', { params }),
  sessionTrends: (params?: object) => api.get('/dashboard/session-trends', { params }),
  stationStatus: (params?: object) => api.get('/dashboard/station-status', { params }),
  topStations: (params?: object) => api.get('/dashboard/top-stations', { params }),
  recentActivity: (params?: object) => api.get('/dashboard/recent-activity', { params }),
  liveSessions: (params?: object) => api.get('/dashboard/live-sessions', { params }),
};

export const logsApi = {
  audit: (params?: object) => api.get('/audit-logs', { params }),
  auditById: (id: string) => api.get(`/audit-logs/${id}`),
  ocpp: (params?: object) => api.get('/ocpp-logs', { params }),
  ocppById: (id: string) => api.get(`/ocpp-logs/${id}`),
};

export default api;
