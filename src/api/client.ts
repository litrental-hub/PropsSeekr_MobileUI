import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import { storage } from '../utils/storage';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  config => {
    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor — handle 401 / token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        const { accessToken } = res.data;
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (_) {
        // Refresh failed — clear tokens and force logout
        storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
        storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
        // TODO: navigate to login screen via navigation ref
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
