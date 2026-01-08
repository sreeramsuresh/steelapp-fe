/**
 * HTTP Client with Automatic Case Conversion, Request Correlation & Error Normalization
 *
 * Category G: Global Error Handling System - Frontend Implementation
 *
 * Wraps axios to automatically:
 * - Convert requests: camelCase → snake_case
 * - Convert responses: snake_case → camelCase
 * - Include X-Request-Id header for distributed tracing
 * - Normalize ALL errors into standard format:
 *   {
 *     requestId: string,
 *     errorCode: string,
 *     message: string,
 *     details: object
 *   }
 *
 * This ensures consistent API communication and error handling regardless of
 * where errors originate (network, API Gateway, gRPC backend).
 */

import api from './axiosApi';
import {
  toSnakeCaseDeep,
  toCamelCaseDeep,
  findSnakeCaseKeys,
} from '../utils/caseConverters';
import { generateRequestId } from '../utils/requestId';

/**
 * Import contract validation library
 * Available in dev mode for contract validation
 * Zero overhead in production
 */
let contracts = null;
if (import.meta.env.DEV) {
  try {
    contracts = require('@steelapp/contracts');
  } catch (e) {
    // @steelapp/contracts not installed yet, validation disabled
  }
}

/**
 * Standard error codes that can be returned from the API
 */
export const ERROR_CODES = {
  // Client errors
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  FAILED_PRECONDITION: 'FAILED_PRECONDITION',

  // Server errors
  INTERNAL: 'INTERNAL',
  UNAVAILABLE: 'UNAVAILABLE',
  DEADLINE_EXCEEDED: 'DEADLINE_EXCEEDED',

  // Network/Client-side errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Normalized API Error class
 *
 * All errors from API calls are converted to this format for consistency.
 */
export class ApiError extends Error {
  /**
   * @param {string} requestId - Request correlation ID
   * @param {string} errorCode - Standardized error code
   * @param {string} message - Human-readable error message
   * @param {Object} details - Additional error details
   * @param {number} httpStatus - HTTP status code (if available)
   */
  constructor(requestId, errorCode, message, details = {}, httpStatus = null) {
    super(message);
    this.name = 'ApiError';
    this.requestId = requestId;
    this.errorCode = errorCode;
    this.details = details;
    this.httpStatus = httpStatus;

    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a specific type
   */
  is(errorCode) {
    return this.errorCode === errorCode;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError() {
    return this.httpStatus >= 400 && this.httpStatus < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError() {
    return this.httpStatus >= 500;
  }

  /**
   * Check if error is a network error
   */
  isNetworkError() {
    return this.errorCode === ERROR_CODES.NETWORK_ERROR;
  }

  /**
   * Get validation errors if this is a validation error
   */
  getValidationErrors() {
    return this.details?.validationErrors || null;
  }

  /**
   * Convert to plain object for logging/serialization
   */
  toJSON() {
    return {
      requestId: this.requestId,
      errorCode: this.errorCode,
      message: this.message,
      details: this.details,
      httpStatus: this.httpStatus,
    };
  }
}

/**
 * Normalize any error into the standard ApiError format
 *
 * @param {Error} error - Original error (Axios, network, etc.)
 * @param {string} requestId - Request correlation ID
 * @returns {ApiError} Normalized API error
 */
function normalizeError(error, requestId) {
  // Already normalized
  if (error instanceof ApiError) {
    return error;
  }

  // Server responded with error status
  if (error.response) {
    const { data, status, headers } = error.response;

    // Use server's requestId if available
    const serverRequestId =
      headers?.['x-request-id'] || data?.requestId || requestId;

    // Server returned standard error format
    if (data && data.errorCode) {
      return new ApiError(
        serverRequestId,
        data.errorCode,
        data.message || 'An error occurred',
        data.details || {},
        status,
      );
    }

    // Legacy format with 'code' instead of 'errorCode'
    if (data && data.code) {
      return new ApiError(
        serverRequestId,
        data.code,
        data.message || 'An error occurred',
        data.details || {},
        status,
      );
    }

    // Server returned non-standard error
    if (data && typeof data === 'object') {
      return new ApiError(
        serverRequestId,
        mapHttpStatusToErrorCode(status),
        data.message || data.error || 'An error occurred',
        data,
        status,
      );
    }

    // Plain text error response
    return new ApiError(
      serverRequestId,
      mapHttpStatusToErrorCode(status),
      typeof data === 'string' ? data : `HTTP ${status} Error`,
      {},
      status,
    );
  }

  // Request made but no response received (network error)
  if (error.request) {
    return new ApiError(
      requestId,
      ERROR_CODES.NETWORK_ERROR,
      'Unable to connect to server. Please check your network connection.',
      { originalMessage: error.message },
      null,
    );
  }

  // Request cancelled
  if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
    return new ApiError(
      requestId,
      ERROR_CODES.REQUEST_CANCELLED,
      'Request was cancelled',
      {},
      null,
    );
  }

  // Request setup error or other error
  return new ApiError(
    requestId,
    ERROR_CODES.UNKNOWN,
    error.message || 'An unexpected error occurred',
    { originalError: error.name },
    null,
  );
}

/**
 * Map HTTP status codes to error codes
 *
 * @param {number} status - HTTP status code
 * @returns {string} Error code
 */
function mapHttpStatusToErrorCode(status) {
  const statusMap = {
    400: ERROR_CODES.INVALID_ARGUMENT,
    401: ERROR_CODES.UNAUTHENTICATED,
    403: ERROR_CODES.PERMISSION_DENIED,
    404: ERROR_CODES.NOT_FOUND,
    409: ERROR_CODES.ALREADY_EXISTS,
    429: ERROR_CODES.RESOURCE_EXHAUSTED,
    500: ERROR_CODES.INTERNAL,
    502: ERROR_CODES.UNAVAILABLE,
    503: ERROR_CODES.UNAVAILABLE,
    504: ERROR_CODES.DEADLINE_EXCEEDED,
  };

  return statusMap[status] || ERROR_CODES.UNKNOWN;
}

/**
 * Dev-time validation: Warn if request contains snake_case keys
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} data - Request data
 */
function devValidateRequest(method, url, data) {
  if (import.meta.env.PROD || !data) return;

  const snakeCaseKeys = findSnakeCaseKeys(data);
  if (snakeCaseKeys.length > 0) {
    console.warn(
      `[httpClient] Request to ${method.toUpperCase()} ${url} contains snake_case keys:`,
      snakeCaseKeys,
      '\nFrontend should use camelCase. Auto-converting, but please fix the source.',
    );
  }
}

/**
 * Contract validation: Validate request against route contract schema
 * Validates camelCase request BEFORE conversion to snake_case
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} data - Request data (camelCase)
 * @returns {Object} { valid: boolean, errors?: Array }
 */
function validateRequestContract(method, url, data) {
  if (!contracts || import.meta.env.PROD) return { valid: true };

  const routeKey = `${method.toUpperCase()} ${url}`;
  const route = contracts.routes?.[routeKey];

  if (!route || !route.contracts?.request) {
    // No contract defined for this route - that's OK, validation disabled
    return { valid: true };
  }

  // Validate against Zod schema
  const result = route.contracts.request.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors,
      routeKey,
    };
  }

  return { valid: true };
}

/**
 * Contract validation: Validate response against route contract schema
 * Validates snake_case response AFTER receiving from server
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} data - Response data (snake_case from server)
 * @returns {Object} { valid: boolean, errors?: Array, leakage?: Array }
 */
function validateResponseContract(method, url, data) {
  if (!contracts || import.meta.env.PROD) return { valid: true };

  const routeKey = `${method.toUpperCase()} ${url}`;
  const route = contracts.routes?.[routeKey];

  if (!route || !route.contracts?.response) {
    // No contract defined for this route
    return { valid: true };
  }

  // Validate against Zod schema
  const result = route.contracts.response.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors,
      routeKey,
    };
  }

  // Check for camelCase leakage in response (should be snake_case from server)
  const leakage = findSnakeCaseKeys(data);
  if (leakage.length > 0) {
    // This is a warning, not a failure - response has camelCase mixed in
    return {
      valid: true, // Still valid, but leakage detected
      leakage,
      message: `Response contains camelCase keys (expected snake_case): ${leakage.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Make an API request with automatic case conversion, correlation, and error normalization
 *
 * @param {string} method - HTTP method (get, post, put, patch, delete)
 * @param {string} url - Request URL (relative to API base)
 * @param {object} [data] - Request body data (camelCase)
 * @param {object} [options] - Additional options
 * @param {string} [options.requestId] - Custom request ID (auto-generated if not provided)
 * @param {object} [options.headers] - Additional headers
 * @param {object} [options.params] - Query parameters
 * @returns {Promise<any>} Response data (camelCase)
 * @throws {ApiError} Normalized error on failure
 */
export async function apiRequest(method, url, data = null, options = {}) {
  // Dev-time validation: warn about snake_case in request
  devValidateRequest(method, url, data);

  // Contract validation: validate request against schema (camelCase)
  if (data && import.meta.env.DEV) {
    const validation = validateRequestContract(method, url, data);
    if (!validation.valid) {
      const errorMsg = `[Contract Guard] Request validation failed for ${validation.routeKey}: ${validation.errors.map(e => `${e.path.join('.')} - ${e.message}`).join('; ')}`;
      console.error(errorMsg);

      // Throw error if strict mode enabled
      if (import.meta.env.VITE_CONTRACT_STRICT === 'true') {
        throw new ApiError(
          options.requestId || generateRequestId(),
          ERROR_CODES.INVALID_ARGUMENT,
          'Request contract validation failed',
          { validationErrors: validation.errors },
          null,
        );
      }
    }
  }

  // Generate or use provided request ID for distributed tracing
  const requestId = options.requestId || generateRequestId();

  // Build config with X-Request-Id header
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'X-Request-Id': requestId,
    },
  };

  // Convert request data to snake_case for backend
  const payload = data ? toSnakeCaseDeep(data) : undefined;

  // Make the request
  let response;

  try {
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(url, config);
        break;
      case 'post':
        response = await api.post(url, payload, config);
        break;
      case 'put':
        response = await api.put(url, payload, config);
        break;
      case 'patch':
        response = await api.patch(url, payload, config);
        break;
      case 'delete':
        response = await api.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  } catch (error) {
    // Normalize and throw ApiError
    throw normalizeError(error, requestId);
  }

  // Contract validation: validate response against schema (snake_case from server)
  if (import.meta.env.DEV) {
    const validation = validateResponseContract(method, url, response.data);
    if (!validation.valid) {
      const errorMsg = `[Contract Guard] Response validation failed for ${validation.routeKey}: ${validation.errors.map(e => `${e.path.join('.')} - ${e.message}`).join('; ')}`;
      console.error(errorMsg);

      // Throw error if strict mode enabled
      if (import.meta.env.VITE_CONTRACT_STRICT === 'true') {
        throw new ApiError(
          requestId,
          ERROR_CODES.INVALID_ARGUMENT,
          'Response contract validation failed',
          { validationErrors: validation.errors },
          response.status,
        );
      }
    } else if (validation.leakage) {
      // Warn about camelCase leakage in response
      console.warn(`[Contract Guard] ${validation.message}`);
    }
  }

  // Convert response to camelCase for frontend
  return toCamelCaseDeep(response.data);
}

/**
 * Convenience methods for HTTP operations
 *
 * All methods return camelCase data and throw ApiError on failure.
 */
export const httpClient = {
  /**
   * GET request
   * @param {string} url - Request URL
   * @param {object} [config] - Axios config (params, headers, requestId, etc.)
   * @returns {Promise<any>} Response data (camelCase)
   * @throws {ApiError}
   */
  get: (url, config) => apiRequest('get', url, null, config),

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {object} data - Request body (camelCase)
   * @param {object} [config] - Axios config
   * @returns {Promise<any>} Response data (camelCase)
   * @throws {ApiError}
   */
  post: (url, data, config) => apiRequest('post', url, data, config),

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {object} data - Request body (camelCase)
   * @param {object} [config] - Axios config
   * @returns {Promise<any>} Response data (camelCase)
   * @throws {ApiError}
   */
  put: (url, data, config) => apiRequest('put', url, data, config),

  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {object} data - Request body (camelCase)
   * @param {object} [config] - Axios config
   * @returns {Promise<any>} Response data (camelCase)
   * @throws {ApiError}
   */
  patch: (url, data, config) => apiRequest('patch', url, data, config),

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {object} [config] - Axios config
   * @returns {Promise<any>} Response data (camelCase)
   * @throws {ApiError}
   */
  delete: (url, config) => apiRequest('delete', url, null, config),
};

/**
 * Helper to check if an error is a specific API error
 *
 * @param {Error} error - Error to check
 * @param {string} errorCode - Error code to match
 * @returns {boolean}
 */
export function isApiError(error, errorCode = null) {
  if (!(error instanceof ApiError)) {
    return false;
  }
  if (errorCode) {
    return error.errorCode === errorCode;
  }
  return true;
}

/**
 * Helper to extract user-friendly message from any error
 *
 * @param {Error} error - Any error
 * @returns {string} User-friendly message
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error?.message || 'An unexpected error occurred';
}

/**
 * Helper to get requestId from error for support/debugging
 *
 * @param {Error} error - Any error
 * @returns {string|null} Request ID or null
 */
export function getErrorRequestId(error) {
  if (error instanceof ApiError) {
    return error.requestId;
  }
  return error?.requestId || null;
}

export default httpClient;
