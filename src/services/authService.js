import { apiClient } from "./api.js";
import { tokenUtils } from "./axiosApi.js";

class AuthService {
  constructor() {
    this.TOKEN_KEY = "steel-app-token";
    this.USER_KEY = "steel-app-user";
    this.REFRESH_TOKEN_KEY = "steel-app-refresh-token";
  }

  // Register new user
  async register(userData) {
    const response = await apiClient.post("/auth/register", userData);

    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
    }

    return response;
  }

  // Login user
  async login(email, password) {
    const response = await apiClient.post("/auth/login", { email, password });

    if (response.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
      this.setUser(response.user);
    }

    return response;
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  // Get current user profile
  async getCurrentUser() {
    return apiClient.get("/auth/me");
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    return apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }

  // Token management
  setToken(token) {
    // Store in localStorage for backward compatibility
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem("token", token); // Also store as 'token' for components using it

    // Store in cookies for automatic refresh interceptor
    tokenUtils.setToken(token);

    this.updateApiHeaders();
  }

  setRefreshToken(refreshToken) {
    // Store in localStorage for backup
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);

    // Store in cookies for automatic refresh interceptor
    tokenUtils.setRefreshToken(refreshToken);
  }

  getToken() {
    // Try cookies first (used by interceptor), then localStorage (backward compatibility)
    return tokenUtils.getToken() || localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken() {
    return tokenUtils.getRefreshToken() || localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  removeToken() {
    // Remove from both localStorage and cookies
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    tokenUtils.removeTokens();
    this.updateApiHeaders();
  }

  // User data management
  setUser(user) {
    // Store in localStorage for backward compatibility
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Also store in sessionStorage for automatic refresh interceptor
    tokenUtils.setUser(user);
  }

  getUser() {
    // Try sessionStorage first (used by interceptor), then localStorage (backward compatibility)
    const sessionUser = tokenUtils.getUser();
    if (sessionUser) return sessionUser;

    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  removeUser() {
    // Remove from both localStorage and sessionStorage
    localStorage.removeItem(this.USER_KEY);
    tokenUtils.removeUser();
  }

  // Authentication status
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check if user has specific permission
  hasPermission(resource, action) {
    const user = this.getUser();
    if (!user) return false;

    // Admin has all permissions
    if (user.role === "admin") return true;

    const permissions = user.permissions || {};
    const resourcePermissions = permissions[resource];

    return resourcePermissions?.[action];
  }

  // Check if user has specific role (checks resolved roleNames from user_roles table)
  hasRole(roles) {
    const user = this.getUser();
    if (!user) return false;

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // Check against resolved role names from login response
    const userRoleNames = user.roleNames || [];
    if (userRoleNames.some((r) => allowedRoles.includes(r))) return true;

    // Fallback: check legacy user.role field
    return allowedRoles.includes(user.role);
  }

  // Check if user is admin or director
  isAdminOrDirector() {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === "admin") return true;
    const roleNames = user.roleNames || [];
    return roleNames.some((r) =>
      ["Managing Director", "Operations Manager", "Finance Manager"].includes(r),
    );
  }

  // Update API client headers
  updateApiHeaders() {
    const token = this.getToken();
    if (token) {
      apiClient.setAuthHeader(token);
    } else {
      apiClient.removeAuthHeader();
    }
  }

  // Initialize authentication state
  initialize() {
    this.updateApiHeaders();
  }
}

export const authService = new AuthService();
