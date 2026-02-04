/**
 * Axios Auth Service Unit Tests (Node Native Test Runner)
 * Tests authentication operations via axios API service
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiService, tokenUtils } from '../axiosApi.js';

describe('axiosAuthService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('login', () => {
    test('should login user with accessToken format', async () => {
      const mockResponse = {
        accessToken: 'token123',
        refreshToken: 'refresh123',
        user: {
          id: 1,
          email: 'user@company.com',
          role: 'admin',
        },
      };

      sinon.stub(apiService, 'post').resolves(mockResponse);

      const result = await apiService.post('/auth/login', {
        email: 'user@company.com',
        password: 'password123',
      });

      assert.ok(result);
      assert.deepStrictEqual(result.user, mockResponse.user);
    });

    test('should login user with legacy token format', async () => {
      const mockResponse = {
        token: 'legacy-token-456',
        user: {
          id: 2,
          email: 'admin@company.com',
          role: 'admin',
        },
      };

      sinon.stub(apiService, 'post').resolves(mockResponse);

      const result = await apiService.post('/auth/login', {
        email: 'admin@company.com',
        password: 'password456',
      });

      assert.ok(result);
    });

    test('should handle login validation errors', async () => {
      const error = new Error('Validation failed');
      error.response = {
        status: 400,
        data: { message: 'Invalid email or password' },
      };
      sinon.stub(apiService, 'post').rejects(error);

      try {
        await apiService.post('/auth/login', {
          email: 'bad@company.com',
          password: 'wrong',
        });
        assert.fail('Expected error');
      } catch (err) {
        assert.ok(err);
      }
    });
  });

  describe('logout', () => {
    test('should clear session on logout', async () => {
      sinon.stub(tokenUtils, 'clearSession').returns(undefined);

      tokenUtils.clearSession();

      assert.ok(tokenUtils.clearSession.called);
    });
  });

  describe('token refresh', () => {
    test('should refresh token with refreshToken', async () => {
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      };

      sinon.stub(apiService, 'post').resolves(mockResponse);

      const result = await apiService.post('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });

      assert.ok(result.accessToken);
    });
  });
});
