import { apiService, tokenUtils } from './axiosApi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');
const REFRESH_ENDPOINT = import.meta.env.VITE_REFRESH_ENDPOINT || '/auth/refresh';

class AuthService {
  constructor() {
    this.USER_KEY = 'steel-app-user';
    this.isInitialized = false;
    this._refreshPromise = null; // avoid concurrent refreshes
  }

  // Initialize auth service
  initialize() {
    if (this.isInitialized) return;
    
    apiService.initialize();
    this.isInitialized = true;
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.token) {
        this.setTokens(response.token, response.refreshToken);
        this.setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      
      if (response.token) {
        this.setTokens(response.token, response.refreshToken);
        this.setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      const data = error.response?.data;
      const status = error.response?.status;
      // Prefer explicit backend error messages
      const details = Array.isArray(data?.errors)
        ? data.errors.map((e) => e.msg).join(', ')
        : (data?.error || data?.message);
      const msg = details || (status === 400 ? 'Invalid input. Check email and password.' : 'Login failed');
      throw new Error(msg);
    }
  }

  // Logout user
  async logout() {
    console.log('🚨 authService.logout() called!');
    try {
      console.log('🚨 Making API call to /auth/logout...');
      // Call logout endpoint to invalidate tokens on server (send refreshToken like GigLabz)
      const refreshToken = this.getRefreshToken();
      try {
        await apiService.post('/auth/logout', refreshToken ? { refreshToken } : {});
      } catch (e) {
        // Fallback to GigLabz path if needed
        try {
          await apiService.post('/logout', refreshToken ? { refreshToken } : {});
        } catch (e2) {
          console.warn('🚨 Logout API call failed (both paths):', e2);
        }
      }
      console.log('🚨 Logout API call successful');
    } catch (error) {
      console.warn('🚨 Logout API call failed:', error);
    } finally {
      console.log('🚨 Calling clearSession()...');
      this.clearSession();
      console.log('🚨 Session cleared successfully');
    }
  }

  // Refresh token with single-flight and shorter timeout
  async refreshToken({ timeout = 9000 } = {}) {
    const run = async () => {
      try {
        const refreshToken = tokenUtils.getRefreshToken();
        console.log('[Auth] 🔄 Manual token refresh requested...');

        if (!refreshToken || tokenUtils.isTokenExpired(refreshToken)) {
          console.log('[Auth] ❌ No valid refresh token available');
          throw new Error('No valid refresh token available');
        }

        const response = await apiService.post(
          REFRESH_ENDPOINT,
          { refreshToken },
          { timeout }
        );

        const newAccess = response.token || response.accessToken;
        if (newAccess) {
          console.log('[Auth] ✅ Token refresh successful');
          this.setTokens(newAccess, response.refreshToken);
          return newAccess;
        }

        throw new Error('Token refresh failed - no token in response');
      } catch (error) {
        console.error('[Auth] ❌ Token refresh failed:', error);
        if (error?.response?.status === 401) {
          this.clearSession();
        }
        throw error;
      } finally {
        this._refreshPromise = null;
      }
    };

    if (this._refreshPromise) return this._refreshPromise;
    this._refreshPromise = run();
    return this._refreshPromise;
  }

  // Get current user profile from server
  async getCurrentUser(config = {}) {
    try {
      const response = await apiService.get('/auth/me', config);
      
      if (response.user) {
        this.setUser(response.user);
        return response.user;
      }
      
      return response;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return response;
    } catch (error) {
      console.error('Change password failed:', error);
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await apiService.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await apiService.post('/auth/reset-password', {
        token,
        newPassword
      });
      
      return response;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  // Token management
  setTokens(token, refreshToken) {
    tokenUtils.setToken(token);
    if (refreshToken) {
      tokenUtils.setRefreshToken(refreshToken);
    }
    apiService.setAuthToken(token);
  }

  getToken() {
    return tokenUtils.getToken();
  }

  getRefreshToken() {
    return tokenUtils.getRefreshToken();
  }

  removeTokens() {
    tokenUtils.removeTokens();
    apiService.removeAuthToken();
  }

  // User data management
  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem(this.USER_KEY);
        return null;
      }
    }
    
    // Try to get user from token if no stored user data
    const token = this.getToken();
    if (token && !tokenUtils.isTokenExpired(token)) {
      const userFromToken = tokenUtils.getUserFromToken(token);
      if (userFromToken) {
        this.setUser(userFromToken);
        return userFromToken;
      }
    }
    
    return null;
  }

  removeUser() {
    localStorage.removeItem(this.USER_KEY);
  }

  // Clear all session data
  clearSession() {
    console.log('[Auth] 🚨 CLEARING SESSION - User will be logged out');
    this.removeTokens();
    this.removeUser();
  }

  // Authentication status
  isAuthenticated() {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const user = this.getUser();
    const hasValidAccess = !!(token && !tokenUtils.isTokenExpired(token));
    const hasValidRefresh = !!(refreshToken && !tokenUtils.isTokenExpired(refreshToken));
    return !!(user && (hasValidAccess || hasValidRefresh));
  }

  // Check if user has specific permission
  hasPermission(resource, action) {
    const user = this.getUser();
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    const permissions = user.permissions || {};
    const resourcePermissions = permissions[resource];
    
    return resourcePermissions && resourcePermissions[action];
  }

  // Check if user has specific role
  hasRole(roles) {
    const user = this.getUser();
    if (!user) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  }

  // Token refresh timer management - simplified
  setupTokenRefresh() {
    // Let axios interceptors handle token refresh automatically
    console.log('[Auth] Token refresh will be handled by axios interceptors');
  }

  clearTokenRefreshTimer() {
    // No longer needed - interceptors handle everything
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

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/auth/profile', profileData);
      
      if (response.user) {
        this.setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  }

  // Verify token validity
  async verifyToken({ timeout = 9000 } = {}) {
    try {
      const token = this.getToken();
      if (!token) return false;
      
      if (tokenUtils.isTokenExpired(token)) {
        // Try to refresh if expired
        await this.refreshToken({ timeout });
        return true;
      }
      
      // Verify with server
      await this.getCurrentUser({ timeout });
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Bubble up transient/network/timeout errors so caller can decide
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      const isNetwork = !error?.response; // likely network or CORS
      if (isTimeout || isNetwork) {
        throw error;
      }
      // For auth failures, signal invalid token
      if (error?.response?.status === 401) {
        return false;
      }
      // For other server errors, let caller keep user logged in
      throw error;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export token utilities for direct use
export { tokenUtils };

export default authService;
