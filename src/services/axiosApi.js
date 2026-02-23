import axios from "axios";

const IS_DEV = import.meta?.env?.DEV ?? false;

// DEV-ONLY: snake_case detection in API responses
const SNAKE_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/;
const ALLOWLISTED_KEYS_AXIOS = new Set(["rawPayload", "metadata", "htmlContent"]);

const findSnakeCaseKeys = (obj, path = "") => {
  if (!obj || typeof obj !== "object") return [];
  const hits = [];
  for (const key of Object.keys(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (SNAKE_RE.test(key)) hits.push(fullPath);
    if (!ALLOWLISTED_KEYS_AXIOS.has(key) && typeof obj[key] === "object") {
      hits.push(...findSnakeCaseKeys(obj[key], fullPath));
    }
  }
  return hits;
};
const DISABLE_VALIDATION = import.meta?.env?.VITE_DISABLE_CONTRACT_VALIDATION === "true";

// ============================================================================
// DEV-ONLY: Response Validator Import (Module Load Time - Correction #3)
// ============================================================================
// Validator is imported ONCE at module load, not dynamically per-request.
// This avoids dynamic import overhead while still being tree-shakeable
// (it's only used when IS_DEV is true in conditional blocks).
// ============================================================================
let validateResponse = null;
let _contractGuard = null;

if (IS_DEV && !DISABLE_VALIDATION) {
  // Import validator at module load time (once)
  import("./validators/responseValidator.js")
    .then((module) => {
      validateResponse = module.validateResponse;
      _contractGuard = module;
    })
    .catch(() => {
      // Silently fail if validator module not found
      // This allows development without the validator module
    });
}

// Helper function to get contract guard dynamically
async function getContractGuard() {
  if (_contractGuard) {
    return _contractGuard;
  }
  try {
    const module = await import("./validators/responseValidator.js");
    _contractGuard = module;
    return module;
  } catch (_err) {
    return null;
  }
}

// Resolve API base URL with a LAN-safe fallback.
// If the env points to localhost but the app is accessed via a LAN IP/hostname,
// use relative "/api" so the Vite proxy handles requests correctly.
let API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? "/api";
try {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (API_BASE_URL && /localhost|127\.0\.0\.1/.test(API_BASE_URL) && host && !/^(localhost|127\.0\.0\.1)$/.test(host)) {
    API_BASE_URL = "/api";
  }
} catch (_) {
  // no-op; keep configured base URL
}

const REFRESH_ENDPOINT = import.meta?.env?.VITE_REFRESH_ENDPOINT ?? "/auth/refresh-token";

// Simple cookie helper (matching GigLabz approach)
const Cookies = {
  get(name) {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]/+^])/g, "\\$1")}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },

  set(name, value, options = {}) {
    if (typeof document === "undefined") return;
    const { expires = 7, path = "/" } = options;
    const expiresDate = new Date(Date.now() + expires * 864e5).toUTCString();
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie utility - intentional cookie management
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresDate}; path=${path}`;
  },

  remove(name, options = {}) {
    if (typeof document === "undefined") return;
    const { path = "/" } = options;
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie utility - intentional cookie management
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  },
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10000ms to handle complex queries (user lists, analytics)
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - adds Bearer token and handles FormData
api.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // For FormData, let the browser set the Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// Response interceptor - handles 403 and refreshes (matching GigLabz logic)
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV || import.meta.env.MODE === "test") {
      const hits = findSnakeCaseKeys(response.data);
      if (hits.length > 0) {
        throw new Error(
          `[camelCase contract violation] Response from ${response.config.url} ` +
            `contains snake_case keys: ${hits.slice(0, 5).join(", ")}`
        );
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Account deactivated — force logout immediately, no refresh attempt
    if (error.response?.status === 403 && error.response?.data?.code === "ACCOUNT_DEACTIVATED") {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      localStorage.removeItem("steel-app-token");
      localStorage.removeItem("steel-app-user");
      localStorage.removeItem("token");
      alert("Your account has been deactivated. Please contact your administrator.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Trigger refresh on 401 only (not 403 — that means permission denied, not token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get("refreshToken");

      if (!refreshToken) {
        // No refresh token, clear tokens and reject
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}${REFRESH_ENDPOINT}`,
          { refreshToken },
          { withCredentials: true }
        );

        // Backend already sends camelCase
        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken || data.refreshToken;

        if (newAccessToken) {
          // Store new tokens
          Cookies.set("accessToken", newAccessToken);
          if (newRefreshToken) {
            Cookies.set("refreshToken", newRefreshToken, { expires: 7 });
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("No tokens in refresh response");
        }
      } catch (refreshError) {
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
  // For compatibility with older callers that try to push tokens directly
  // Interceptors handle tokens, so these are intentional no-ops
  setAuthToken: (_token) => {
    // no-op; Authorization header is set by the request interceptor
  },

  removeAuthToken: () => {
    // no-op; clearing cookies/session is handled via tokenUtils.clearSession
  },

  get: async (url, config = {}) => {
    // If config has params property, use it as-is (it may also have signal, etc.)
    // Otherwise, treat the config object itself as params and wrap it
    const axiosConfig =
      config && !("params" in config) && !("signal" in config) && typeof config === "object"
        ? { params: apiService.cleanParams(config) }
        : config;
    const response = await api.get(url, axiosConfig);
    const data = response.data;

    // Validate response contract in development (Correction #3 & #7)
    // Only validates endpoints in CONTRACT_REGISTRY (list endpoints with pagination)
    // Skips mutation endpoints and single-entity responses
    if (IS_DEV && validateResponse) {
      try {
        return validateResponse(url, data);
      } catch (validationError) {
        console.error("Response validation error:", validationError);
        throw validationError;
      }
    }

    return data;
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
    // Don't set Content-Type header - let the request interceptor handle it
    // The interceptor will detect FormData and delete the header so the browser
    // can set it automatically with the correct boundary
    const response = await api.post(url, formData, config);
    return response.data;
  },

  // Additional utility methods for compatibility
  cleanParams: (params = {}) => {
    try {
      return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
    } catch {
      return params || {};
    }
  },

  request: async (config = {}) => {
    // ========================================================================
    // DEV-ONLY: Request Contract Validation (Dynamic Import)
    // ========================================================================
    if (IS_DEV) {
      const guard = await getContractGuard();
      if (guard) {
        guard.validateRequestContract(config);
      }
    }

    // ========================================================================
    // Execute Request (Original Behavior)
    // ========================================================================
    try {
      const response = await api.request(config);

      // ======================================================================
      // DEV-ONLY: Response Contract Validation (Dynamic Import)
      // ======================================================================
      if (IS_DEV) {
        const guard = await getContractGuard();
        if (guard) {
          guard.validateResponseContract({
            method: config.method || "GET",
            url: config.url || "",
            data: response.data,
            responseType: config.responseType,
          });
        }
      }

      // Return unwrapped data (original behavior)
      return response.data;
    } catch (error) {
      // ======================================================================
      // Enhanced Error Logging
      // ======================================================================
      // Check if error is ContractViolationError (DEV only)
      if (IS_DEV) {
        const guard = await getContractGuard();
        if (guard && error instanceof guard.ContractViolationError) {
          // Contract violation already logged above - just re-throw
          throw error;
        }
      }

      // Original error logging for network/server errors
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
      sessionStorage.setItem("userCompanyId", user.companyId || "");
      sessionStorage.setItem("userPermissions", JSON.stringify(user.permissions || {}));
      sessionStorage.setItem("userRoleNames", JSON.stringify(user.roleNames || []));
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
      companyId: sessionStorage.getItem("userCompanyId"),
      permissions: JSON.parse(sessionStorage.getItem("userPermissions") || "{}"),
      roleNames: JSON.parse(sessionStorage.getItem("userRoleNames") || "[]"),
    };
  },

  removeUser: () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userCompanyId");
    sessionStorage.removeItem("userPermissions");
    sessionStorage.removeItem("userRoleNames");
  },

  clearSession: () => {
    tokenUtils.removeTokens();
    tokenUtils.removeUser();

    // Comprehensive cookie cleanup (matching GigLabz approach)
    // eslint-disable-next-line no-assign-to-cookie-api
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.substring(0, cookie.indexOf("=")).trim();
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie utility - intentional cookie clearing
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie utility - intentional cookie clearing
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  },
};

export default api;
