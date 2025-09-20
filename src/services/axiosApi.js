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
      };
    } catch (error) {
      console.error('Error decoding user from token:', error);
      return null;
    }
  }
};

// Request interceptor - Add auth token to requests
axiosApi.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getToken();
    
    if (token && !tokenUtils.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
axiosApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthRequest = (url) => typeof url === 'string' && (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/refresh')
    );
    
    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already on the login page or this is an auth endpoint,
      // do not attempt refresh or force a redirect. Let the caller handle it.
      if (currentPath === '/login' || isAuthRequest(originalRequest?.url)) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      
      const refreshToken = tokenUtils.getRefreshToken();
      
      if (refreshToken && !tokenUtils.isTokenExpired(refreshToken)) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { token: newToken, refreshToken: newRefreshToken } = response.data;
          
          // Update stored tokens
          tokenUtils.setToken(newToken);
          if (newRefreshToken) {
            tokenUtils.setRefreshToken(newRefreshToken);
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosApi(originalRequest);
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Refresh failed, redirect to login
          tokenUtils.removeTokens();
          if (currentPath !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No valid refresh token, redirect to login
        tokenUtils.removeTokens();
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    // For other error statuses, just propagate the error
    return Promise.reject(error);
  }
);

// API service class
class ApiService {
  constructor() {
    this.axios = axiosApi;
  }
  
  // Generic request method
  async request(config) {
    try {
      const response = await this.axios(config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  // HTTP methods
  async get(endpoint, params = {}) {
    return this.request({
      method: 'GET',
      url: endpoint,
      params: this.cleanParams(params),
    });
  }
  
  async post(endpoint, data = {}) {
    return this.request({
      method: 'POST',
      url: endpoint,
      data,
    });
  }
  
  async put(endpoint, data = {}) {
    return this.request({
      method: 'PUT',
      url: endpoint,
      data,
    });
  }
  
  async patch(endpoint, data = {}) {
    return this.request({
      method: 'PATCH',
      url: endpoint,
      data,
    });
  }
  
  async delete(endpoint) {
    return this.request({
      method: 'DELETE',
      url: endpoint,
    });
  }
  
  // File upload
  async upload(endpoint, formData) {
    return this.request({
      method: 'POST',
      url: endpoint,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  // Clean parameters (remove undefined/null values)
  cleanParams(params) {
    return Object.fromEntries(
      Object.entries(params).filter(([key, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
  }
  
  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data.message || data.error || 'Unknown error');
      
      // Handle specific error cases
      switch (status) {
        case 401:
          console.warn('Unauthorized access - token may be invalid');
          break;
        case 403:
          console.warn('Forbidden - insufficient permissions');
          break;
        case 404:
          console.warn('Resource not found');
          break;
        case 422:
          console.warn('Validation error:', data.errors || data.message);
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('API error:', data.message || 'Unknown error');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other error
      console.error('Error:', error.message);
    }
  }
  
  // Set auth token manually (for initial login)
  setAuthToken(token) {
    if (token) {
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      tokenUtils.setToken(token);
    } else {
      delete this.axios.defaults.headers.common['Authorization'];
      tokenUtils.removeTokens();
    }
  }
  
  // Remove auth token
  removeAuthToken() {
    delete this.axios.defaults.headers.common['Authorization'];
    tokenUtils.removeTokens();
  }
  
  // Initialize with stored token
  initialize() {
    const token = tokenUtils.getToken();
    if (token && !tokenUtils.isTokenExpired(token)) {
      this.setAuthToken(token);
    } else {
      this.removeAuthToken();
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Auto-initialize on import
apiService.initialize();

export default apiService;
