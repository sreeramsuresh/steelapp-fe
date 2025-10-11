import axios from "axios";
import { jwtDecode } from "jwt-decode";

const isDev = import.meta.env.DEV;
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const REFRESH_ENDPOINT =
  import.meta.env.VITE_REFRESH_ENDPOINT || "/auth/refresh";

// Create axios instance
const axiosApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple cookie helper (avoid adding deps)
const cookie = {
  get(name) {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(
      new RegExp(
        "(?:^|; )" +
          name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") +
          "=([^;]*)"
      )
    );
    return match ? decodeURIComponent(match[1]) : null;
  },
  set(name, value, { days = 7, path = "/" } = {}) {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; expires=${expires}; path=${path}`;
  },
  remove(name, { path = "/" } = {}) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  },
};

// Token management
const TOKEN_KEY = "steel-app-token";
const REFRESH_TOKEN_KEY = "steel-app-refresh-token";
const COOKIE_ACCESS = "accessToken";
const COOKIE_REFRESH = "refreshToken";

// Token utilities
export const tokenUtils = {
  // Cookies only to mirror GigLabz logic
  getToken: () => cookie.get(COOKIE_ACCESS),
  getRefreshToken: () => cookie.get(COOKIE_REFRESH),
  setToken: (token) => {
    if (token) cookie.set(COOKIE_ACCESS, token, { days: 1 });
  },
  setRefreshToken: (refreshToken) => {
    if (refreshToken) cookie.set(COOKIE_REFRESH, refreshToken, { days: 7 });
  },
  removeTokens: () => {
    cookie.remove(COOKIE_ACCESS);
    cookie.remove(COOKIE_REFRESH);
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  },

  getTokenExpirationTime: (token) => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error("Error decoding token:", error);
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
        permissions: decoded.permissions,
      };
    } catch (error) {
      console.error("Error decoding user from token:", error);
      return null;
    }
  },
};

// Request interceptor - Add auth token to requests and check expiration
axiosApi.interceptors.request.use(async (config) => {
  const token = tokenUtils.getToken();

  if (token) {
    // Check if token expires within 1 minute (proactive refresh)
    const expirationTime = tokenUtils.getTokenExpirationTime(token);
    const currentTime = Date.now();
    const oneMinuteFromNow = currentTime + 60 * 1000; // 1 minute buffer

    if (expirationTime && expirationTime < oneMinuteFromNow) {
      console.log("[Interceptor] Token expires soon, refreshing proactively");

      const refreshToken = tokenUtils.getRefreshToken();
      if (refreshToken && !tokenUtils.isTokenExpired(refreshToken)) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}${REFRESH_ENDPOINT}`,
            { refreshToken },
            { withCredentials: true }
          );

          const newAccess = data.accessToken || data.token;
          if (newAccess) {
            tokenUtils.setToken(newAccess);
            if (data.refreshToken)
              tokenUtils.setRefreshToken(data.refreshToken);
            config.headers.Authorization = `Bearer ${newAccess}`;
            console.log("[Interceptor] Token refreshed proactively");
          }
        } catch (error) {
          console.error("[Interceptor] Proactive refresh failed:", error);
          // Continue with expired token - let response interceptor handle it
        }
      }
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Response interceptor - Handle token refresh (403 only)
axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    // Match GigLabz: trigger refresh only on 403
    if (status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = tokenUtils.getRefreshToken();

      if (refreshToken && !tokenUtils.isTokenExpired(refreshToken)) {
        try {
          console.log("[Interceptor] Attempting token refresh");
          const { data } = await axios.post(
            `${API_BASE_URL}${REFRESH_ENDPOINT}`,
            { refreshToken },
            { withCredentials: true }
          );

          const newAccess = data.accessToken;
          if (!newAccess) throw new Error("No accessToken in refresh response");

          tokenUtils.setToken(newAccess);
          if (data.refreshToken) tokenUtils.setRefreshToken(data.refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return axiosApi(originalRequest);
        } catch (refreshError) {
          console.error("[Interceptor] Token refresh failed:", refreshError);
          // Clear tokens only (GigLabz behavior)
          tokenUtils.removeTokens();
          return Promise.reject(refreshError);
        }
      } else {
        // No valid refresh token, clear tokens
        tokenUtils.removeTokens();
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
      // Reduce noise for frequent auth refresh failures during offline/slow backend
      if (typeof url === "string" && url.includes("/auth/refresh")) {
        console.warn(
          `POST ${url} warn:`,
          error.response?.data || error.message
        );
      } else {
        console.error(
          `POST ${url} error:`,
          error.response?.data || error.message
        );
      }
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
      console.error(
        `PATCH ${url} error:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await axiosApi.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(
        `DELETE ${url} error:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  upload: async (url, formData, config = {}) => {
    try {
      const response = await axiosApi.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        `UPLOAD ${url} error:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default axiosApi;
