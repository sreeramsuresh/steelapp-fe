import { apiClient } from './api';

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'steel-app-token';
    this.USER_KEY = 'steel-app-user';
  }

  // Register new user
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    
    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
    }
    
    return response;
  }

  // Login user
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
    }
    
    return response;
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  // Get current user profile
  async getCurrentUser() {
    return apiClient.get('/auth/me');
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  // Token management
  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.updateApiHeaders();
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.updateApiHeaders();
  }

  // User data management
  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  removeUser() {
    localStorage.removeItem(this.USER_KEY);
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