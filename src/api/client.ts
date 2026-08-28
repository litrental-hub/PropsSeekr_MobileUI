import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import { storage } from '../utils/storage';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  config => {
    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// The API has no refresh-token contract. A rejected access token must clear
// local auth state rather than attempting a nonexistent refresh endpoint.
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest?.url !== '/auth/logout') {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
