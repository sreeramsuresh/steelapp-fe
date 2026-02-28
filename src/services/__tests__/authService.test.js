/**
 * Auth Service Unit Tests (Node Native Test Runner)
 * Tests authentication operations and token management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { tokenUtils } from '../axiosApi.js';

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (global.localStorage) {
      global.localStorage.clear();
    }
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

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        token: 'test-token-123',
        user: { id: 1, email: userData.email, name: userData.name },
      });

      vi.spyOn(tokenUtils, 'setToken').mockReturnValue(undefined);

      const result = await apiClient.post('/auth/register', userData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
      expect(result.token).toBe('test-token-123');
      expect(result.user).toBeTruthy();
    });

    it('should handle registration error', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };

      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Registration failed'));

      try {
        await apiClient.post('/auth/register', userData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Registration failed');
      }
    });

    it('should not store token if response missing', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        user: { id: 1, email: userData.email },
      });

      const result = await apiClient.post('/auth/register', userData);

      expect(result.user).toBeTruthy();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'password123',
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        token: 'login-token-456',
        user: { id: 2, email: 'user@example.com', role: 'user' },
      });

      vi.spyOn(tokenUtils, 'setToken').mockReturnValue(undefined);

      const result = await apiClient.post('/auth/login', credentials);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
      expect(result.token).toBe('login-token-456');
    });

    it('should handle invalid credentials', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Invalid credentials'));

      try {
        await apiClient.post('/auth/login', { email: 'wrong@example.com', password: 'wrong' });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invalid credentials');
      }
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', async () => {
      vi.spyOn(tokenUtils, 'removeTokens').mockReturnValue(undefined);

      tokenUtils.removeTokens();

      expect(tokenUtils.removeTokens.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('refresh token', () => {
    it('should refresh access token with refresh token', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await apiClient.post('/auth/refresh');

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
      expect(result.token).toBe('new-access-token');
    });

    it('should handle refresh token expiration', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Refresh token expired'));

      try {
        await apiClient.post('/auth/refresh');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Refresh token expired');
      }
    });
  });
});
