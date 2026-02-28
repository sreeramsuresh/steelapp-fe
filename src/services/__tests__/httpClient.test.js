import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiError, ERROR_CODES, apiRequest, httpClient, isApiError, getErrorMessage, getErrorRequestId } from '../httpClient.js';

// Mock dependencies
vi.mock('../config/env.js', () => ({
  default: { DEV: false, PROD: false },
}));

vi.mock('../utils/caseConverters', () => ({
  findSnakeCaseKeys: vi.fn(() => []),
  toCamelCaseDeep: vi.fn((data) => data),
  toSnakeCaseDeep: vi.fn((data) => data),
}));

vi.mock('../utils/requestId', () => ({
  generateRequestId: vi.fn(() => 'test-request-id'),
}));

vi.mock('../axiosApi', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('httpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ApiError', () => {
    it('should create an ApiError instance', () => {
      const err = new ApiError('req-1', 'NOT_FOUND', 'Item not found', {}, 404);

      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.name).toBe('ApiError');
      expect(err.requestId).toBe('req-1');
      expect(err.errorCode).toBe('NOT_FOUND');
      expect(err.message).toBe('Item not found');
      expect(err.httpStatus).toBe(404);
      expect(err.details).toEqual({});
    });

    it('should check error code with is()', () => {
      const err = new ApiError('r', 'NOT_FOUND', 'msg');

      expect(err.is('NOT_FOUND')).toBe(true);
      expect(err.is('INTERNAL')).toBe(false);
    });

    it('should identify client errors', () => {
      const err = new ApiError('r', 'NOT_FOUND', 'msg', {}, 404);

      expect(err.isClientError()).toBe(true);
      expect(err.isServerError()).toBe(false);
    });

    it('should identify server errors', () => {
      const err = new ApiError('r', 'INTERNAL', 'msg', {}, 500);

      expect(err.isServerError()).toBe(true);
      expect(err.isClientError()).toBe(false);
    });

    it('should identify network errors', () => {
      const err = new ApiError('r', ERROR_CODES.NETWORK_ERROR, 'msg');

      expect(err.isNetworkError()).toBe(true);
    });

    it('should return validation errors from details', () => {
      const validationErrors = [{ field: 'email', message: 'Required' }];
      const err = new ApiError('r', 'INVALID_ARGUMENT', 'msg', { validationErrors });

      expect(err.getValidationErrors()).toEqual(validationErrors);
    });

    it('should return null when no validation errors', () => {
      const err = new ApiError('r', 'INTERNAL', 'msg');

      expect(err.getValidationErrors()).toBeNull();
    });

    it('should serialize to JSON', () => {
      const err = new ApiError('req-1', 'NOT_FOUND', 'Not found', { key: 'val' }, 404);
      const json = err.toJSON();

      expect(json).toEqual({
        requestId: 'req-1',
        errorCode: 'NOT_FOUND',
        message: 'Not found',
        details: { key: 'val' },
        httpStatus: 404,
      });
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all expected error codes', () => {
      expect(ERROR_CODES.INVALID_ARGUMENT).toBe('INVALID_ARGUMENT');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
      expect(ERROR_CODES.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
      expect(ERROR_CODES.INTERNAL).toBe('INTERNAL');
      expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ERROR_CODES.REQUEST_CANCELLED).toBe('REQUEST_CANCELLED');
      expect(ERROR_CODES.UNKNOWN).toBe('UNKNOWN');
    });
  });

  describe('apiRequest', () => {
    let api;

    beforeEach(async () => {
      const mod = await import('../axiosApi');
      api = mod.default;
    });

    it('should make a GET request', async () => {
      api.get.mockResolvedValue({ data: { id: 1 } });

      const result = await apiRequest('get', '/test');

      expect(api.get).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('should make a POST request with payload', async () => {
      api.post.mockResolvedValue({ data: { id: 2 } });

      const result = await apiRequest('post', '/test', { name: 'foo' });

      expect(api.post).toHaveBeenCalled();
      expect(result).toEqual({ id: 2 });
    });

    it('should make a PUT request', async () => {
      api.put.mockResolvedValue({ data: { updated: true } });

      const result = await apiRequest('put', '/test/1', { name: 'bar' });

      expect(api.put).toHaveBeenCalled();
      expect(result).toEqual({ updated: true });
    });

    it('should make a PATCH request', async () => {
      api.patch.mockResolvedValue({ data: { patched: true } });

      const result = await apiRequest('patch', '/test/1', { name: 'baz' });

      expect(api.patch).toHaveBeenCalled();
      expect(result).toEqual({ patched: true });
    });

    it('should make a DELETE request', async () => {
      api.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await apiRequest('delete', '/test/1');

      expect(api.delete).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });

    it('should throw on unsupported method', async () => {
      await expect(apiRequest('options', '/test')).rejects.toThrow();
    });

    it('should normalize API errors with server response', async () => {
      const axiosError = {
        response: {
          status: 404,
          data: { errorCode: 'NOT_FOUND', message: 'Resource not found' },
          headers: {},
        },
      };
      api.get.mockRejectedValue(axiosError);

      try {
        await apiRequest('get', '/test');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.errorCode).toBe('NOT_FOUND');
        expect(err.httpStatus).toBe(404);
      }
    });

    it('should normalize network errors', async () => {
      const netError = { request: {}, message: 'Network Error' };
      api.get.mockRejectedValue(netError);

      try {
        await apiRequest('get', '/test');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.errorCode).toBe(ERROR_CODES.NETWORK_ERROR);
      }
    });

    it('should normalize cancelled requests', async () => {
      const cancelError = { name: 'CanceledError', code: 'ERR_CANCELED', message: 'canceled' };
      api.get.mockRejectedValue(cancelError);

      try {
        await apiRequest('get', '/test');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.errorCode).toBe(ERROR_CODES.REQUEST_CANCELLED);
      }
    });

    it('should include X-Request-Id header', async () => {
      api.get.mockResolvedValue({ data: {} });

      await apiRequest('get', '/test');

      const config = api.get.mock.calls[0][1];
      expect(config.headers['X-Request-Id']).toBe('test-request-id');
    });

    it('should use custom requestId from options', async () => {
      api.get.mockResolvedValue({ data: {} });

      await apiRequest('get', '/test', null, { requestId: 'custom-id' });

      const config = api.get.mock.calls[0][1];
      expect(config.headers['X-Request-Id']).toBe('custom-id');
    });
  });

  describe('httpClient convenience methods', () => {
    let api;

    beforeEach(async () => {
      const mod = await import('../axiosApi');
      api = mod.default;
    });

    it('get delegates to apiRequest', async () => {
      api.get.mockResolvedValue({ data: { ok: true } });
      const result = await httpClient.get('/foo');
      expect(result).toEqual({ ok: true });
    });

    it('post delegates to apiRequest', async () => {
      api.post.mockResolvedValue({ data: { created: true } });
      const result = await httpClient.post('/foo', { a: 1 });
      expect(result).toEqual({ created: true });
    });

    it('put delegates to apiRequest', async () => {
      api.put.mockResolvedValue({ data: { updated: true } });
      const result = await httpClient.put('/foo', { a: 2 });
      expect(result).toEqual({ updated: true });
    });

    it('patch delegates to apiRequest', async () => {
      api.patch.mockResolvedValue({ data: { patched: true } });
      const result = await httpClient.patch('/foo', { a: 3 });
      expect(result).toEqual({ patched: true });
    });

    it('delete delegates to apiRequest', async () => {
      api.delete.mockResolvedValue({ data: { deleted: true } });
      const result = await httpClient.delete('/foo');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('isApiError', () => {
    it('should return true for ApiError instances', () => {
      const err = new ApiError('r', 'INTERNAL', 'msg');
      expect(isApiError(err)).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isApiError(new Error('regular'))).toBe(false);
    });

    it('should check specific error code', () => {
      const err = new ApiError('r', 'NOT_FOUND', 'msg');
      expect(isApiError(err, 'NOT_FOUND')).toBe(true);
      expect(isApiError(err, 'INTERNAL')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from ApiError', () => {
      const err = new ApiError('r', 'NOT_FOUND', 'Item not found');
      expect(getErrorMessage(err)).toBe('Item not found');
    });

    it('should return message from regular error', () => {
      expect(getErrorMessage(new Error('regular msg'))).toBe('regular msg');
    });

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });
  });

  describe('getErrorRequestId', () => {
    it('should return requestId from ApiError', () => {
      const err = new ApiError('req-123', 'INTERNAL', 'msg');
      expect(getErrorRequestId(err)).toBe('req-123');
    });

    it('should return null for regular error', () => {
      expect(getErrorRequestId(new Error('msg'))).toBeNull();
    });

    it('should return requestId from error with requestId property', () => {
      const err = new Error('msg');
      err.requestId = 'custom-id';
      expect(getErrorRequestId(err)).toBe('custom-id');
    });
  });
});
