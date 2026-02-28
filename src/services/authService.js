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

  // Token management — tokens are now in HttpOnly cookies set by the server
  setToken(_token) {
    // No-op: server sets HttpOnly cookies
  }

  setRefreshToken(_refreshToken) {
    // No-op: server sets HttpOnly cookies
  }

  getToken() {
    return null; // Tokens are in HttpOnly cookies, not accessible from JS
  }

  getRefreshToken() {
    return null; // Tokens are in HttpOnly cookies, not accessible from JS
  }

  removeToken() {
    tokenUtils.clearSession();
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

  // Authentication status — user in sessionStorage is a hint; validated by /auth/me on boot
  isAuthenticated() {
    return !!this.getUser();
  }

  // Check if user has specific permission
  // Handles both snake_case and camelCase resource keys (API auto-converts)
  hasPermission(resource, action) {
    const user = this.getUser();
    if (!user) return false;

    // Admin has all permissions
    if (user.role === "admin") return true;

    const permissions = user.permissions || {};

    // Try exact match first, then convert snake_case to camelCase
    let resourcePermissions = permissions[resource];
    if (!resourcePermissions && resource.includes("_")) {
      const camelKey = resource.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      resourcePermissions = permissions[camelKey];
    }

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
    return roleNames.some((r) => ["Managing Director", "Operations Manager", "Finance Manager"].includes(r));
  }

  // Update API client headers — no-op, auth is via HttpOnly cookies
  updateApiHeaders() {}

  // Initialize authentication state — no-op, auth is via HttpOnly cookies
  initialize() {}
}

export const authService = new AuthService();
