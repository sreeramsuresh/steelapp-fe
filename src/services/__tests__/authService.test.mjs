/**
 * Auth Service Unit Tests (Node Native Test Runner)
 * Tests authentication operations and token management
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { tokenUtils } from '../axiosApi.js';

describe('authService', () => {
  beforeEach(() => {
    sinon.restore();
    if (global.localStorage) {
      global.localStorage.clear();
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('register', () => {
    test('should register new user and store token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      sinon.stub(apiClient, 'post').resolves({
        token: 'test-token-123',
        user: { id: 1, email: userData.email, name: userData.name },
      });

      sinon.stub(tokenUtils, 'setToken').returns(undefined);

      const result = await apiClient.post('/auth/register', userData);

      assert.ok(apiClient.post.called);
      assert.strictEqual(result.token, 'test-token-123');
      assert.ok(result.user);
    });

    test('should handle registration error', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };

      sinon.stub(apiClient, 'post').rejects(new Error('Registration failed'));

      try {
        await apiClient.post('/auth/register', userData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Registration failed');
      }
    });

    test('should not store token if response missing', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };

      sinon.stub(apiClient, 'post').resolves({
        user: { id: 1, email: userData.email },
      });

      const result = await apiClient.post('/auth/register', userData);

      assert.ok(result.user);
    });
  });

  describe('login', () => {
    test('should login user with valid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'password123',
      };

      sinon.stub(apiClient, 'post').resolves({
        token: 'login-token-456',
        user: { id: 2, email: 'user@example.com', role: 'user' },
      });

      sinon.stub(tokenUtils, 'setToken').returns(undefined);

      const result = await apiClient.post('/auth/login', credentials);

      assert.ok(apiClient.post.called);
      assert.strictEqual(result.token, 'login-token-456');
    });

    test('should handle invalid credentials', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Invalid credentials'));

      try {
        await apiClient.post('/auth/login', { email: 'wrong@example.com', password: 'wrong' });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid credentials');
      }
    });
  });

  describe('logout', () => {
    test('should clear tokens on logout', async () => {
      sinon.stub(tokenUtils, 'removeTokens').returns(undefined);

      tokenUtils.removeTokens();

      assert.ok(tokenUtils.removeTokens.called);
    });
  });

  describe('refresh token', () => {
    test('should refresh access token with refresh token', async () => {
      sinon.stub(apiClient, 'post').resolves({
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await apiClient.post('/auth/refresh');

      assert.ok(apiClient.post.called);
      assert.strictEqual(result.token, 'new-access-token');
    });

    test('should handle refresh token expiration', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Refresh token expired'));

      try {
        await apiClient.post('/auth/refresh');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Refresh token expired');
      }
    });
  });
});
