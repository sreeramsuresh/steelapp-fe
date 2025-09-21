import { apiService, tokenUtils } from './axiosApi';

class AuthService {
  constructor() {
    this.USER_KEY = 'steel-app-user';
    this.isInitialized = false;
  }

  // Initialize auth service
  initialize() {
    if (this.isInitialized) return;
    
    apiService.initialize();
    this.isInitialized = true;
    
    // Set up automatic token refresh
    this.setupTokenRefresh();
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
        this.setupTokenRefresh();
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
    try {
      // Call logout endpoint to invalidate tokens on server
      await apiService.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearSession();
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      
      if (!refreshToken || tokenUtils.isTokenExpired(refreshToken)) {
        throw new Error('No valid refresh token available');
      }
      
      const response = await apiService.post('/auth/refresh', { refreshToken });
      
      if (response.token) {
        this.setTokens(response.token, response.refreshToken);
        return response.token;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSession();
      throw error;
    }
  }

  // Get current user profile from server
  async getCurrentUser() {
    try {
      const response = await apiService.get('/auth/me');
      
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
    this.removeTokens();
    this.removeUser();
    this.clearTokenRefreshTimer();
  }

  // Authentication status
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && !tokenUtils.isTokenExpired(token) && user);
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

  // Token refresh timer management
  setupTokenRefresh() {
    this.clearTokenRefreshTimer();
    
    const token = this.getToken();
    if (!token || tokenUtils.isTokenExpired(token)) return;
    
    const expirationTime = tokenUtils.getTokenExpirationTime(token);
    if (!expirationTime) return;
    
    // Refresh token 5 minutes before expiration
    const refreshTime = expirationTime - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.tokenRefreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
          this.setupTokenRefresh(); // Setup next refresh
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
          this.clearSession();
          // Reload to ensure clean state after session clear
          window.location.href = '/login';
        }
      }, refreshTime);
    }
  }

  clearTokenRefreshTimer() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
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
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) return false;
      
      if (tokenUtils.isTokenExpired(token)) {
        // Try to refresh if expired
        await this.refreshToken();
        return true;
      }
      
      // Verify with server
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      this.clearSession();
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export token utilities for direct use
export { tokenUtils };

export default authService;
