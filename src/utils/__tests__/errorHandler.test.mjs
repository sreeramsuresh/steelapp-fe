import '../../__tests__/init.mjs';
/**
 * Error Handler Utilities Tests
 * Tests error categorization and messaging
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  isSystemError,
  isNetworkError,
  ErrorTypes,
  DisplayTypes,
  getErrorMessage,
  getRawErrorMessage,
} from '../errorHandler.js';

describe('errorHandler', () => {
  describe('ErrorTypes constants', () => {
    test('should have all error type constants', () => {
      assert.strictEqual(ErrorTypes.SYSTEM, 'SYSTEM');
      assert.strictEqual(ErrorTypes.BUSINESS, 'BUSINESS');
      assert.strictEqual(ErrorTypes.VALIDATION, 'VALIDATION');
      assert.strictEqual(ErrorTypes.AUTH, 'AUTH');
    });
  });

  describe('DisplayTypes constants', () => {
    test('should have all display type constants', () => {
      assert.strictEqual(DisplayTypes.PAGE, 'page');
      assert.strictEqual(DisplayTypes.BANNER, 'banner');
      assert.strictEqual(DisplayTypes.TOAST, 'toast');
      assert.strictEqual(DisplayTypes.INLINE, 'inline');
    });
  });

  describe('isSystemError()', () => {
    test('should return true for 5xx errors', () => {
      assert.strictEqual(isSystemError(500), true);
      assert.strictEqual(isSystemError(502), true);
      assert.strictEqual(isSystemError(503), true);
      assert.strictEqual(isSystemError(504), true);
    });

    test('should return true for undefined status', () => {
      assert.strictEqual(isSystemError(undefined), true);
      assert.strictEqual(isSystemError(null), true);
    });

    test('should return false for 4xx errors', () => {
      assert.strictEqual(isSystemError(400), false);
      assert.strictEqual(isSystemError(404), false);
      assert.strictEqual(isSystemError(422), false);
    });

    test('should return false for 2xx and 3xx errors', () => {
      assert.strictEqual(isSystemError(200), false);
      assert.strictEqual(isSystemError(201), false);
      assert.strictEqual(isSystemError(302), false);
    });
  });

  describe('isNetworkError()', () => {
    test('should return true for connection refused', () => {
      const error = { code: 'ECONNREFUSED', response: undefined };
      assert.strictEqual(isNetworkError(error), true);
    });

    test('should return true for connection aborted', () => {
      const error = { code: 'ECONNABORTED', response: undefined };
      assert.strictEqual(isNetworkError(error), true);
    });

    test('should return true for timeout errors', () => {
      const error = { code: 'ETIMEDOUT', response: undefined };
      assert.strictEqual(isNetworkError(error), true);
    });

    test('should return true for network error code', () => {
      const error = { code: 'ERR_NETWORK', response: undefined };
      assert.strictEqual(isNetworkError(error), true);
    });

    test('should return true for network error messages', () => {
      const error1 = { message: 'Network Error occurred', response: undefined };
      const error2 = { message: 'Request timeout exceeded', response: undefined };
      const error3 = { message: 'Failed to fetch data', response: undefined };
      assert.strictEqual(isNetworkError(error1), true);
      assert.strictEqual(isNetworkError(error2), true);
      assert.strictEqual(isNetworkError(error3), true);
    });

    test('should return false for server response errors', () => {
      const error = {
        response: { status: 500, data: {} },
        message: 'Server error'
      };
      assert.strictEqual(isNetworkError(error), false);
    });

    test('should return false for other error types', () => {
      const error = {
        code: 'UNKNOWN_ERROR',
        message: 'Some other error',
        response: undefined
      };
      assert.strictEqual(isNetworkError(error), false);
    });
  });

  describe('getErrorMessage()', () => {
    test('should return error object for system errors', () => {
      const error = { response: { status: 500 }, message: 'Server error' };
      const result = getErrorMessage(error);
      assert.ok(typeof result === 'object');
      assert.ok(result.type === ErrorTypes.SYSTEM);
      assert.ok(result.message);
    });

    test('should handle network timeout', () => {
      const error = {
        code: 'ETIMEDOUT',
        message: 'timeout',
        response: undefined
      };
      const result = getErrorMessage(error);
      assert.ok(result.type === ErrorTypes.SYSTEM);
      assert.ok(result.isNetworkError === true);
    });

    test('should handle connection refused', () => {
      const error = {
        code: 'ECONNREFUSED',
        response: undefined
      };
      const result = getErrorMessage(error);
      assert.ok(result.type === ErrorTypes.SYSTEM);
      assert.ok(result.message);
    });
  });

  describe('getRawErrorMessage()', () => {
    test('should extract raw error message from error object', () => {
      const error = { message: 'Original error message', response: {} };
      const result = getRawErrorMessage(error);
      assert.ok(typeof result === 'string');
      assert.ok(result === 'Original error message' || result === 'An error occurred');
    });

    test('should handle errors without message property', () => {
      const error = { response: { data: {} } };
      const result = getRawErrorMessage(error);
      assert.ok(typeof result === 'string');
      assert.ok(result.length > 0);
    });

    test('should handle string error input', () => {
      const result = getRawErrorMessage('Error string');
      assert.strictEqual(result, 'Error string');
    });

    test('should return default message for missing fields', () => {
      const error = { response: { data: {} }, message: undefined };
      const result = getRawErrorMessage(error);
      assert.strictEqual(result, 'An error occurred');
    });
  });
});
