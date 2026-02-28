import { ROLE_PERMISSIONS } from "../config/rolePermissions";
import { apiService, tokenUtils } from "./axiosApi";

class AuthService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize auth service
  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  // Convert flat permission keys (e.g., "invoices.read") to nested format
  // Expected by hasPermission method
  _buildPermissionsObject(flatPermissions) {
    const nestedPermissions = {};
    Object.entries(flatPermissions).forEach(([key]) => {
      const [resource, action] = key.split(".");
      if (!nestedPermissions[resource]) {
        nestedPermissions[resource] = {};
      }
      nestedPermissions[resource][action] = true;
    });
    return nestedPermissions;
  }

  // Populate permissions based on user role
  _populatePermissionsForRole(user) {
    if (!user) return user;

    const rolePerms = ROLE_PERMISSIONS[user.role] || {};
    if (Object.keys(rolePerms).length > 0) {
      user.permissions = this._buildPermissionsObject(rolePerms);
    } else {
      user.permissions = {};
    }
    return user;
  }

  // Login user (supporting both response formats)
  async login(email, password) {
    try {
      const response = await apiService.post("/auth/login", {
        email,
        password,
      });

      // Handle 2FA challenge — server returns requires2FA instead of tokens
      if (response.requires2FA) {
        return {
          requires2FA: true,
          twoFactorToken: response.twoFactorToken,
          methods: response.methods,
        };
      }

      // Support both response formats: SteelApp (token) and GigLabz (accessToken)
      const accessToken = response.accessToken || response.token;
      const refreshToken = response.refreshToken || response.refreshToken;
      const user = response.user;

      if (accessToken && user) {
        // Store tokens in cookies
        tokenUtils.setToken(accessToken);
        if (refreshToken) {
          tokenUtils.setRefreshToken(refreshToken);
        }

        // Use backend-resolved permissions if available, otherwise fall back to static role map
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          this._populatePermissionsForRole(user);
        }

        // Store user data in sessionStorage
        tokenUtils.setUser(user);

        return response;
      } else {
        console.error("Missing required fields in response:", {
          accessToken,
          refreshToken,
          user,
        });
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Login failed:", error);
      const data = error.response?.data;
      const status = error.response?.status;

      // Handle account lockout (423)
      if (status === 423) {
        const err = new Error(data?.message || "Account is temporarily locked");
        err.code = "ACCOUNT_LOCKED";
        err.remainingMinutes = data?.remainingMinutes;
        err.lockedUntil = data?.lockedUntil;
        throw err;
      }

      // Handle error messages
      const details = Array.isArray(data?.errors)
        ? data.errors.map((e) => e.msg).join(", ")
        : data?.error || data?.message;

      const msg = details || (status === 400 ? "Invalid input. Check email and password." : "Login failed");

      throw new Error(msg);
    }
  }

  // Logout user (matching GigLabz approach)
  async logout() {
    try {
      const refreshToken = tokenUtils.getRefreshToken();

      if (refreshToken) {
        await apiService.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear session regardless of API call result
      this.clearSession();
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.post("/auth/register", userData);

      if (response.accessToken && response.refreshToken && response.user) {
        const { accessToken, refreshToken, user } = response;

        tokenUtils.setToken(accessToken);
        tokenUtils.setRefreshToken(refreshToken);

        // Use backend-resolved permissions if available, otherwise fall back to static role map
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          this._populatePermissionsForRole(user);
        }

        tokenUtils.setUser(user);
      }

      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  }

  // Get current user profile from server
  async getCurrentUser(config = {}) {
    try {
      const response = await apiService.get("/auth/me", config);

      if (response.user) {
        // Use backend-resolved permissions if available, otherwise fall back to static role map
        if (!response.user.permissions || Object.keys(response.user.permissions).length === 0) {
          this._populatePermissionsForRole(response.user);
        }
        tokenUtils.setUser(response.user);
        return response.user;
      }

      return response;
    } catch (error) {
      console.error("Get current user failed:", error);
      throw error;
    }
  }

  // Manual token refresh (for rare cases)
  async refreshToken() {
    try {
      const refreshToken = tokenUtils.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiService.post("/auth/refresh-token", {
        refreshToken,
      });

      // Support both response formats
      const newAccessToken = response.accessToken || response.token;
      const newRefreshToken = response.refreshToken || response.refreshToken;

      if (newAccessToken) {
        tokenUtils.setToken(newAccessToken);
        if (newRefreshToken) {
          tokenUtils.setRefreshToken(newRefreshToken);
        }
        return newAccessToken;
      }

      throw new Error("Token refresh failed - no tokens in response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        this.clearSession();
      }
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      return response;
    } catch (error) {
      console.error("Change password failed:", error);
      throw new Error(error.response?.data?.message || "Password change failed");
    }
  }

  // ── Password Reset ────────────────────────────────

  async forgotPassword(email) {
    try {
      const response = await apiService.post("/auth/forgot-password", { email });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to request password reset");
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await apiService.post("/auth/reset-password", { token, newPassword });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to reset password");
    }
  }

  // ── Two-Factor Authentication ─────────────────────

  async verify2FA(twoFactorToken, code, method) {
    try {
      const response = await apiService.post("/auth/verify-2fa", {
        twoFactorToken,
        code,
        method,
      });

      // On success, store tokens just like a normal login
      const accessToken = response.accessToken || response.token;
      const refreshToken = response.refreshToken;
      const user = response.user;

      if (accessToken && user) {
        tokenUtils.setToken(accessToken);
        if (refreshToken) {
          tokenUtils.setRefreshToken(refreshToken);
        }
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          this._populatePermissionsForRole(user);
        }
        tokenUtils.setUser(user);
      }

      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Invalid verification code");
    }
  }

  async sendEmailOTP(twoFactorToken) {
    try {
      const response = await apiService.post("/auth/2fa/send-email-otp", { twoFactorToken });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send email code");
    }
  }

  async setup2FA() {
    try {
      const response = await apiService.post("/auth/2fa/setup");
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to start 2FA setup");
    }
  }

  async verifySetup2FA(code, tempSecret) {
    try {
      const response = await apiService.post("/auth/2fa/verify-setup", { code, tempSecret });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to verify 2FA setup");
    }
  }

  async disable2FA(password) {
    try {
      const response = await apiService.post("/auth/2fa/disable", { password });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to disable 2FA");
    }
  }

  async get2FAStatus() {
    try {
      const response = await apiService.get("/auth/2fa/status");
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to get 2FA status");
    }
  }

  async regenerateRecoveryCodes(password) {
    try {
      const response = await apiService.post("/auth/2fa/regenerate-recovery-codes", { password });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to regenerate recovery codes");
    }
  }

  // ── Passkeys / WebAuthn ───────────────────────────

  async passkeyRegisterStart() {
    try {
      const response = await apiService.post("/auth/passkey/register/start");
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to start passkey registration");
    }
  }

  async passkeyRegisterFinish(credential) {
    try {
      const response = await apiService.post("/auth/passkey/register/finish", { credential });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to complete passkey registration");
    }
  }

  async passkeyLoginStart(email) {
    try {
      const response = await apiService.post("/auth/passkey/login/start", { email });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to start passkey authentication");
    }
  }

  async passkeyLoginFinish(credential) {
    try {
      const response = await apiService.post("/auth/passkey/login/finish", { credential });

      // On success, store tokens just like a normal login
      const accessToken = response.accessToken || response.token;
      const refreshToken = response.refreshToken;
      const user = response.user;

      if (accessToken && user) {
        tokenUtils.setToken(accessToken);
        if (refreshToken) {
          tokenUtils.setRefreshToken(refreshToken);
        }
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          this._populatePermissionsForRole(user);
        }
        tokenUtils.setUser(user);
      }

      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to complete passkey authentication");
    }
  }

  async listPasskeys() {
    try {
      const response = await apiService.get("/auth/passkey/credentials");
      return response.credentials || response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to list passkeys");
    }
  }

  async deletePasskey(id) {
    try {
      const response = await apiService.delete(`/auth/passkey/credentials/${id}`);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete passkey");
    }
  }

  async renamePasskey(id, label) {
    try {
      const response = await apiService.patch(`/auth/passkey/credentials/${id}`, { label });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to rename passkey");
    }
  }

  // ── Accept Invitation ────────────────────────────

  async acceptInvite(token, username, password, name) {
    try {
      const response = await apiService.post("/auth/accept-invite", {
        token,
        username,
        password,
        name: name || undefined,
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to accept invitation");
    }
  }

  // ── Session Management ────────────────────────────

  // Clear all session data (matching GigLabz comprehensive cleanup)
  clearSession() {
    // eslint-disable-next-line no-console
    console.log("[Auth] Clearing session - User will be logged out");
    tokenUtils.clearSession();
    // Clear page size preferences on logout
    sessionStorage.removeItem("invoiceListPageSize");
  }

  // Refresh session from /auth/me (picks up latest permissions from server)
  async refreshSession() {
    try {
      const response = await apiService.get("/auth/me");
      if (response?.user) {
        tokenUtils.setUser(response.user);
        return true;
      }
    } catch (err) {
      console.error("[Auth] Session refresh failed:", err.message);
    }
    return false;
  }

  // Register window focus listener to auto-refresh session (max once per 60s)
  initFocusRefresh() {
    let lastRefresh = 0;
    window.addEventListener("focus", async () => {
      const now = Date.now();
      if (now - lastRefresh > 60_000 && this.isAuthenticated()) {
        lastRefresh = now;
        await this.refreshSession();
      }
    });
  }

  // Authentication status
  isAuthenticated() {
    const token = tokenUtils.getToken();
    const user = tokenUtils.getUser();

    // Simple check: if we have both token and user data, consider authenticated
    // Let the interceptor handle token refresh automatically
    return !!(token && user);
  }

  // Get user data
  getUser() {
    return tokenUtils.getUser();
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

  // Check if user has specific role (checks both JWT role and DB-assigned roleNames)
  hasRole(roles) {
    const user = this.getUser();
    if (!user) return false;

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // Check JWT role field
    if (allowedRoles.includes(user.role)) return true;

    // Check DB-assigned role names
    const userRoleNames = user.roleNames || [];
    return userRoleNames.some((rn) => allowedRoles.includes(rn));
  }

  // Get user roles and permissions
  getUserPermissions() {
    const user = this.getUser();
    return user?.permissions || {};
  }

  getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export token utilities for direct use
export { tokenUtils };

export default authService;
