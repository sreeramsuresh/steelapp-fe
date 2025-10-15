import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REFRESH_ENDPOINT = import.meta.env.VITE_REFRESH_ENDPOINT || "/auth/refresh-token";

// Simple cookie helper (matching GigLabz approach)
const Cookies = {
  get(name) {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  },
  
  set(name, value, options = {}) {
    if (typeof document === "undefined") return;
    const { expires = 7, path = "/" } = options;
    const expiresDate = new Date(Date.now() + expires * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresDate}; path=${path}`;
  },
  
  remove(name, options = {}) {
    if (typeof document === "undefined") return;
    const { path = "/" } = options;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - adds Bearer token
api.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - handles 403 and refreshes (matching GigLabz logic)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only trigger refresh on 403 status (not 401) and if not already retried
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get("refreshToken");
      
      if (!refreshToken) {
        // No refresh token, clear tokens and reject
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        return Promise.reject(error);
      }
      
      try {
        console.log("[Interceptor] Attempting token refresh");
        const { data } = await axios.post(`${API_BASE_URL}${REFRESH_ENDPOINT}`, {
          refreshToken,
        });
        
        if (data.accessToken && data.refreshToken) {
          // Store new tokens
          Cookies.set("accessToken", data.accessToken);
          Cookies.set("refreshToken", data.refreshToken, { expires: 7 });
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("No tokens in refresh response");
        }
      } catch (refreshError) {
        console.error("[Interceptor] Token refresh failed:", refreshError);
        // Clear tokens on refresh failure
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        
        // Optional: Redirect to login (commented out like GigLabz)
        // window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Simple API service
export const apiService = {
  get: async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  patch: async (url, data = {}, config = {}) => {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  delete: async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
  },

  upload: async (url, formData, config = {}) => {
    const response = await api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Additional utility methods for compatibility
  cleanParams: (params = {}) => {
    try {
      return Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      );
    } catch {
      return params || {};
    }
  },

  request: async (config = {}) => {
    try {
      const response = await api.request(config);
      return response.data;
    } catch (error) {
      const label = `${config.method || 'GET'} ${config.url}`;
      console.error(`${label} error:`, error.response?.data || error.message);
      throw error;
    }
  },
};

// Token utilities (simplified)
export const tokenUtils = {
  getToken: () => Cookies.get("accessToken"),
  getRefreshToken: () => Cookies.get("refreshToken"),
  
  setToken: (token) => {
    if (token) Cookies.set("accessToken", token);
  },
  
  setRefreshToken: (refreshToken) => {
    if (refreshToken) Cookies.set("refreshToken", refreshToken, { expires: 7 });
  },
  
  removeTokens: () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
  },
  
  // Store user data in sessionStorage (matching GigLabz approach)
  setUser: (user) => {
    if (user) {
      sessionStorage.setItem("userId", user.id || "");
      sessionStorage.setItem("userEmail", user.email || "");
      sessionStorage.setItem("userRole", user.role || "");
      sessionStorage.setItem("userName", user.name || "");
      sessionStorage.setItem("userPermissions", JSON.stringify(user.permissions || {}));
    }
  },
  
  getUser: () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) return null;
    
    return {
      id: userId,
      email: sessionStorage.getItem("userEmail"),
      role: sessionStorage.getItem("userRole"),
      name: sessionStorage.getItem("userName"),
      permissions: JSON.parse(sessionStorage.getItem("userPermissions") || "{}"),
    };
  },
  
  removeUser: () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userPermissions");
  },
  
  clearSession: () => {
    tokenUtils.removeTokens();
    tokenUtils.removeUser();
    
    // Comprehensive cookie cleanup (matching GigLabz approach)
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.substr(0, cookie.indexOf("=")).trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  },
};

export default api;