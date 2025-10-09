import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const axiosApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'steel-app-token';
const REFRESH_TOKEN_KEY = 'steel-app-refresh-token';

// Token utilities
export const tokenUtils = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  setRefreshToken: (refreshToken) => localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  removeTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  },
  
  getTokenExpirationTime: (token) => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },
  
  getUserFromToken: (token) => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        permissions: decoded.permissions
      };
    } catch (error) {
      console.error('Error decoding user from token:', error);
      return null;
    }
  }
};

// Request interceptor - Add auth token to requests
axiosApi.interceptors.request.use((config) => {
  const token = tokenUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token refresh
axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = tokenUtils.getRefreshToken();

      if (refreshToken && !tokenUtils.isTokenExpired(refreshToken)) {
        try {
          console.log('[Interceptor] Attempting token refresh');
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          if (data.token) {
            tokenUtils.setToken(data.token);
            if (data.refreshToken) {
              tokenUtils.setRefreshToken(data.refreshToken);
            }
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return axiosApi(originalRequest);
          }
        } catch (refreshError) {
          console.error('[Interceptor] Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          tokenUtils.removeTokens();
          localStorage.removeItem('steel-app-user');
          window.location.href = '/login';
        }
      } else {
        // No valid refresh token, clear session and redirect
        tokenUtils.removeTokens();
        localStorage.removeItem('steel-app-user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API service
export const apiService = {
  initialize: () => {
    // No longer needed - interceptors handle everything
  },

  setAuthToken: (token) => {
    // No longer needed - interceptors handle this
  },

  removeAuthToken: () => {
    // No longer needed - interceptors handle this
  },

  get: async (url, config = {}) => {
    try {
      const response = await axiosApi.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET ${url} error:`, error.response?.data || error.message);
      throw error;
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      const response = await axiosApi.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} error:`, error.response?.data || error.message);
      throw error;
    }
  },

  put: async (url, data = {}, config = {}) => {
    try {
      const response = await axiosApi.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} error:`, error.response?.data || error.message);
      throw error;
    }
  },

  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await axiosApi.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PATCH ${url} error:`, error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await axiosApi.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} error:`, error.response?.data || error.message);
      throw error;
    }
  },

  upload: async (url, formData, config = {}) => {
    try {
      const response = await axiosApi.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`UPLOAD ${url} error:`, error.response?.data || error.message);
      throw error;
    }
  },
};

export default axiosApi;