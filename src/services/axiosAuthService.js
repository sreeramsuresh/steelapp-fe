import { apiService, tokenUtils } from './axiosApi';

class AuthService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize auth service
  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  // Login user (supporting both response formats)
  async login(email, password) {
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });

      console.log('Login response:', response); // Debug log

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
        
        // Store user data in sessionStorage
        tokenUtils.setUser(user);
        
        return response;
      } else {
        console.error('Missing required fields in response:', { accessToken, refreshToken, user });
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const data = error.response?.data;
      const status = error.response?.status;
      
      // Handle error messages
      const details = Array.isArray(data?.errors)
        ? data.errors.map((e) => e.msg).join(', ')
        : data?.error || data?.message;
      
      const msg = details || 
        (status === 400 ? 'Invalid input. Check email and password.' : 'Login failed');
      
      throw new Error(msg);
    }
  }

  // Logout user (matching GigLabz approach)
  async logout() {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      
      if (refreshToken) {
        await apiService.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear session regardless of API call result
      this.clearSession();
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);

      if (response.accessToken && response.refreshToken && response.user) {
        const { accessToken, refreshToken, user } = response;
        
        tokenUtils.setToken(accessToken);
        tokenUtils.setRefreshToken(refreshToken);
        tokenUtils.setUser(user);
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Get current user profile from server
  async getCurrentUser(config = {}) {
    try {
      const response = await apiService.get('/auth/me', config);

      if (response.user) {
        tokenUtils.setUser(response.user);
        return response.user;
      }

      return response;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  // Manual token refresh (for rare cases)
  async refreshToken() {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post('/auth/refresh-token', {
        refreshToken,
      });

      console.log('Refresh response:', response); // Debug log

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

      throw new Error('Token refresh failed - no tokens in response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        this.clearSession();
      }
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      return response;
    } catch (error) {
      console.error('Change password failed:', error);
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  }

  // Clear all session data (matching GigLabz comprehensive cleanup)
  clearSession() {
    console.log('[Auth] Clearing session - User will be logged out');
    tokenUtils.clearSession();
    // Clear page size preferences on logout
    sessionStorage.removeItem('invoiceListPageSize');
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
