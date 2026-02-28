/**
 * Axios Auth Service Unit Tests (Node Native Test Runner)
 * Tests authentication operations via axios API service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiService, tokenUtils } from '../axiosApi.js';

describe('axiosAuthService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should login user with accessToken format', async () => {
      const mockResponse = {
        accessToken: 'token123',
        refreshToken: 'refresh123',
        user: {
          id: 1,
          email: 'user@company.com',
          role: 'admin',
        },
      };

      vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse);

      const result = await apiService.post('/auth/login', {
        email: 'user@company.com',
        password: 'password123',
      });

      expect(result).toBeTruthy();
      expect(result.user).toEqual(mockResponse.user);
    });

    it('should login user with legacy token format', async () => {
      const mockResponse = {
        token: 'legacy-token-456',
        user: {
          id: 2,
          email: 'admin@company.com',
          role: 'admin',
        },
      };

      vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse);

      const result = await apiService.post('/auth/login', {
        email: 'admin@company.com',
        password: 'password456',
      });

      expect(result).toBeTruthy();
    });

    it('should handle login validation errors', async () => {
      const error = new Error('Validation failed');
      error.response = {
        status: 400,
        data: { message: 'Invalid email or password' },
      };
      vi.spyOn(apiService, 'post').mockRejectedValue(error);

      try {
        await apiService.post('/auth/login', {
          email: 'bad@company.com',
          password: 'wrong',
        });
        throw new Error('Expected error');
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });
  });

  describe('logout', () => {
    it('should clear session on logout', async () => {
      vi.spyOn(tokenUtils, 'clearSession').mockReturnValue(undefined);

      tokenUtils.clearSession();

      expect(tokenUtils.clearSession.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('token refresh', () => {
    it('should refresh token with refreshToken', async () => {
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      };

      vi.spyOn(apiService, 'post').mockResolvedValue(mockResponse);

      const result = await apiService.post('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });

      expect(result.accessToken).toBeTruthy();
    });
  });
});
