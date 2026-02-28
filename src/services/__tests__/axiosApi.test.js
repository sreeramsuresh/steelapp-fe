import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiService, tokenUtils } from '../axiosApi.js';

// Mock axios at the module level
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn(),
    },
  };
});

describe('axiosApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiService', () => {
    it('should have setAuthToken as a no-op', () => {
      expect(() => apiService.setAuthToken('token')).not.toThrow();
    });

    it('should have removeAuthToken as a no-op', () => {
      expect(() => apiService.removeAuthToken()).not.toThrow();
    });

    it('should have cleanParams utility', () => {
      const cleaned = apiService.cleanParams({ a: 1, b: null, c: '', d: undefined, e: 'ok' });
      expect(cleaned).toEqual({ a: 1, e: 'ok' });
    });

    it('cleanParams should handle empty object', () => {
      expect(apiService.cleanParams({})).toEqual({});
    });

    it('cleanParams should handle non-object input', () => {
      expect(apiService.cleanParams(null)).toEqual({});
    });
  });

  describe('tokenUtils', () => {
    beforeEach(() => {
      // Clear cookies and sessionStorage
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
    });

    it('should set and get token', () => {
      tokenUtils.setToken('access-token-123');
      // Token is stored in cookies via document.cookie
      expect(document.cookie).toContain('accessToken');
    });

    it('should set refresh token', () => {
      tokenUtils.setRefreshToken('refresh-token-456');
      expect(document.cookie).toContain('refreshToken');
    });

    it('should not set token when falsy', () => {
      const before = document.cookie;
      tokenUtils.setToken(null);
      // No new cookie should be set
      expect(document.cookie).toBe(before);
    });

    it('should store user data in sessionStorage', () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        role: 'admin',
        name: 'Test User',
        companyId: '5',
        permissions: { invoices: true },
        roleNames: ['Admin'],
      };

      tokenUtils.setUser(user);

      expect(sessionStorage.getItem('userId')).toBe('1');
      expect(sessionStorage.getItem('userEmail')).toBe('test@test.com');
      expect(sessionStorage.getItem('userRole')).toBe('admin');
      expect(sessionStorage.getItem('userName')).toBe('Test User');
      expect(sessionStorage.getItem('userCompanyId')).toBe('5');
    });

    it('should retrieve user from sessionStorage', () => {
      sessionStorage.setItem('userId', '1');
      sessionStorage.setItem('userEmail', 'test@test.com');
      sessionStorage.setItem('userRole', 'admin');
      sessionStorage.setItem('userName', 'Test');
      sessionStorage.setItem('userCompanyId', '5');
      sessionStorage.setItem('userPermissions', '{"invoices":true}');
      sessionStorage.setItem('userRoleNames', '["Admin"]');

      const user = tokenUtils.getUser();

      expect(user.id).toBe('1');
      expect(user.email).toBe('test@test.com');
      expect(user.permissions).toEqual({ invoices: true });
      expect(user.roleNames).toEqual(['Admin']);
    });

    it('should return null if no user stored', () => {
      sessionStorage.clear();
      expect(tokenUtils.getUser()).toBeNull();
    });

    it('should remove user from sessionStorage', () => {
      sessionStorage.setItem('userId', '1');
      sessionStorage.setItem('userEmail', 'test@test.com');

      tokenUtils.removeUser();

      expect(sessionStorage.getItem('userId')).toBeNull();
      expect(sessionStorage.getItem('userEmail')).toBeNull();
    });

    it('should not set user when falsy', () => {
      sessionStorage.clear();
      tokenUtils.setUser(null);
      expect(sessionStorage.getItem('userId')).toBeNull();
    });
  });
});
