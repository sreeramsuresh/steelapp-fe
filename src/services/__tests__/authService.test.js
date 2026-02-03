import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../authService';
import { apiClient } from '../api';
import { tokenUtils } from '../axiosApi';

vi.mock('../api');
vi.mock('../axiosApi');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register new user and store token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      apiClient.post.mockResolvedValue({
        token: 'test-token-123',
        user: { id: 1, email: userData.email, name: userData.name },
      });

      const result = await authService.register(userData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toHaveProperty('token', 'test-token-123');
      expect(result).toHaveProperty('user');
      expect(tokenUtils.setToken).toHaveBeenCalledWith('test-token-123');
    });

    it('should handle registration error', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };

      apiClient.post.mockRejectedValue(new Error('Registration failed'));

      await expect(authService.register(userData)).rejects.toThrow('Registration failed');
    });

    it('should not store token if response missing', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };

      apiClient.post.mockResolvedValue({
        user: { id: 1, email: userData.email },
      });

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(tokenUtils.setToken).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user and store tokens', async () => {
      apiClient.post.mockResolvedValue({
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 1, email: 'test@example.com' },
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toHaveProperty('token', 'access-token');
      expect(tokenUtils.setToken).toHaveBeenCalledWith('access-token');
      expect(tokenUtils.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(tokenUtils.setUser).toHaveBeenCalled();
    });

    it('should handle login without refresh token', async () => {
      apiClient.post.mockResolvedValue({
        token: 'access-token',
        user: { id: 1, email: 'test@example.com' },
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token', 'access-token');
      expect(tokenUtils.setToken).toHaveBeenCalledWith('access-token');
      expect(tokenUtils.setRefreshToken).not.toHaveBeenCalled();
    });

    it('should handle login error', async () => {
      apiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('logout', () => {
    it('should call logout endpoint and remove tokens', async () => {
      apiClient.post.mockResolvedValue({});
      localStorage.setItem('steel-app-token', 'test-token');

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(tokenUtils.removeTokens).toHaveBeenCalled();
      expect(tokenUtils.removeUser).toHaveBeenCalled();
      expect(apiClient.removeAuthHeader).toHaveBeenCalled();
    });

    it('should remove tokens even if endpoint fails', async () => {
      apiClient.post.mockRejectedValue(new Error('Network error'));
      localStorage.setItem('steel-app-token', 'test-token');

      await authService.logout();

      expect(tokenUtils.removeTokens).toHaveBeenCalled();
      expect(tokenUtils.removeUser).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user profile', async () => {
      apiClient.get.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });

      const result = await authService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should handle fetch error', async () => {
      apiClient.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      apiClient.post.mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      });

      const result = await authService.changePassword('oldPassword', 'newPassword');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });
      expect(result).toHaveProperty('success', true);
    });

    it('should handle password change error', async () => {
      apiClient.post.mockRejectedValue(new Error('Current password incorrect'));

      await expect(authService.changePassword('wrongPassword', 'newPassword')).rejects.toThrow(
        'Current password incorrect',
      );
    });
  });

  describe('setToken', () => {
    it('should set token in localStorage and tokenUtils', () => {
      authService.setToken('test-token-123');

      expect(localStorage.setItem).toHaveBeenCalledWith('steel-app-token', 'test-token-123');
      expect(tokenUtils.setToken).toHaveBeenCalledWith('test-token-123');
      expect(apiClient.setAuthHeader).toHaveBeenCalled();
    });
  });

  describe('setRefreshToken', () => {
    it('should set refresh token', () => {
      authService.setRefreshToken('refresh-token-456');

      expect(localStorage.setItem).toHaveBeenCalledWith('steel-app-refresh-token', 'refresh-token-456');
      expect(tokenUtils.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
    });
  });

  describe('getToken', () => {
    it('should get token from cache first', () => {
      tokenUtils.getToken.mockReturnValue('cached-token');

      const token = authService.getToken();

      expect(token).toBe('cached-token');
    });

    it('should get token from localStorage if cache empty', () => {
      tokenUtils.getToken.mockReturnValue(null);
      localStorage.getItem.mockReturnValue('storage-token');

      const token = authService.getToken();

      expect(token).toBe('storage-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should get refresh token', () => {
      tokenUtils.getRefreshToken.mockReturnValue('cached-refresh');

      const token = authService.getRefreshToken();

      expect(token).toBe('cached-refresh');
    });
  });

  describe('removeToken', () => {
    it('should remove all tokens', () => {
      authService.removeToken();

      expect(localStorage.removeItem).toHaveBeenCalledWith('steel-app-token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('steel-app-refresh-token');
      expect(tokenUtils.removeTokens).toHaveBeenCalled();
      expect(apiClient.removeAuthHeader).toHaveBeenCalled();
    });
  });

  describe('setUser', () => {
    it('should set user data', () => {
      const user = { id: 1, email: 'test@example.com', role: 'admin' };

      authService.setUser(user);

      expect(localStorage.setItem).toHaveBeenCalledWith('steel-app-user', JSON.stringify(user));
      expect(tokenUtils.setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('getUser', () => {
    it('should get user from session storage if available', () => {
      const user = { id: 1, email: 'test@example.com', role: 'admin' };
      tokenUtils.getUser.mockReturnValue(user);

      const result = authService.getUser();

      expect(result).toEqual(user);
    });

    it('should get user from localStorage if session storage empty', () => {
      const user = { id: 1, email: 'test@example.com' };
      tokenUtils.getUser.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(JSON.stringify(user));

      const result = authService.getUser();

      expect(result).toEqual(user);
    });

    it('should return null if no user found', () => {
      tokenUtils.getUser.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      const result = authService.getUser();

      expect(result).toBeNull();
    });
  });

  describe('removeUser', () => {
    it('should remove user data', () => {
      authService.removeUser();

      expect(localStorage.removeItem).toHaveBeenCalledWith('steel-app-user');
      expect(tokenUtils.removeUser).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token and user exist', () => {
      tokenUtils.getToken.mockReturnValue('test-token');
      tokenUtils.getUser.mockReturnValue({ id: 1, email: 'test@example.com' });

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      tokenUtils.getToken.mockReturnValue(null);
      tokenUtils.getUser.mockReturnValue({ id: 1, email: 'test@example.com' });

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when no user', () => {
      tokenUtils.getToken.mockReturnValue('test-token');
      tokenUtils.getUser.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when neither token nor user exist', () => {
      tokenUtils.getToken.mockReturnValue(null);
      tokenUtils.getUser.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for admin user', () => {
      tokenUtils.getUser.mockReturnValue({ role: 'admin' });

      expect(authService.hasPermission('invoices', 'delete')).toBe(true);
    });

    it('should return true if user has specific permission', () => {
      tokenUtils.getUser.mockReturnValue({
        role: 'user',
        permissions: {
          invoices: { read: true, create: true },
        },
      });

      expect(authService.hasPermission('invoices', 'read')).toBe(true);
    });

    it('should return false if user lacks permission', () => {
      tokenUtils.getUser.mockReturnValue({
        role: 'user',
        permissions: {
          invoices: { read: true },
        },
      });

      expect(authService.hasPermission('invoices', 'delete')).toBe(false);
    });

    it('should return false if no user', () => {
      tokenUtils.getUser.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      expect(authService.hasPermission('invoices', 'read')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      tokenUtils.getUser.mockReturnValue({ role: 'admin' });

      expect(authService.hasRole('admin')).toBe(true);
    });

    it('should return true for array of roles with match', () => {
      tokenUtils.getUser.mockReturnValue({ role: 'manager' });

      expect(authService.hasRole(['admin', 'manager'])).toBe(true);
    });

    it('should return false for non-matching role', () => {
      tokenUtils.getUser.mockReturnValue({ role: 'user' });

      expect(authService.hasRole('admin')).toBe(false);
    });

    it('should return false if no user', () => {
      tokenUtils.getUser.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      expect(authService.hasRole('admin')).toBe(false);
    });
  });

  describe('updateApiHeaders', () => {
    it('should update API headers when token exists', () => {
      tokenUtils.getToken.mockReturnValue('test-token');

      authService.updateApiHeaders();

      expect(apiClient.setAuthHeader).toHaveBeenCalled();
    });

    it('should remove auth header when no token', () => {
      tokenUtils.getToken.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      authService.updateApiHeaders();

      expect(apiClient.removeAuthHeader).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should update API headers on initialization', () => {
      tokenUtils.getToken.mockReturnValue('test-token');

      authService.initialize();

      expect(apiClient.setAuthHeader).toHaveBeenCalled();
    });

    it('should remove auth header if no token', () => {
      tokenUtils.getToken.mockReturnValue(null);
      localStorage.getItem.mockReturnValue(null);

      authService.initialize();

      expect(apiClient.removeAuthHeader).toHaveBeenCalled();
    });
  });
});
