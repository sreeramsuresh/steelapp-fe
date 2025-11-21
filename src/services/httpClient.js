/**
 * HTTP Client with Automatic Case Conversion & Request Correlation
 * 
 * Wraps axios to automatically:
 * - Convert requests: camelCase → snake_case
 * - Convert responses: snake_case → camelCase
 * - Include X-Request-Id header for distributed tracing
 * 
 * This ensures consistent API communication regardless of convention differences.
 * 
 * NOTE: The API Gateway already handles case conversion, so this provides
 * an additional safety layer and dev-time validation.
 */

import api from './axiosApi';
import { toSnakeCaseDeep, toCamelCaseDeep, findSnakeCaseKeys } from '../utils/caseConverters';
import { generateRequestId } from '../utils/requestId';

/**
 * Dev-time validation: Warn if request contains snake_case keys
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
      '\nFrontend should use camelCase. Auto-converting, but please fix the source.'
    );
  }
}

/**
 * Make an API request with automatic case conversion and request correlation
 * 
 * @param {string} method - HTTP method (get, post, put, patch, delete)
 * @param {string} url - Request URL (relative to API base)
 * @param {object} [data] - Request body data (camelCase)
 * @param {object} [options] - Additional options
 * @param {string} [options.requestId] - Custom request ID (optional, auto-generated if not provided)
 * @param {object} [options.headers] - Additional headers
 * @param {object} [options.params] - Query parameters
 * @returns {Promise<any>} Response data (camelCase)
 */
export async function apiRequest(method, url, data = null, options = {}) {
  // Dev-time validation
  devValidateRequest(method, url, data);

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
    // Enhance error with requestId for debugging
    if (error.response) {
      // Server responded with error status
      error.requestId = requestId;
      error.serverRequestId = error.response.headers?.['x-request-id'];
    } else {
      // Network error or request setup error
      error.requestId = requestId;
    }
    throw error;
  }

  // Convert response to camelCase for frontend
  // Note: API Gateway already converts to camelCase, but this ensures safety
  return toCamelCaseDeep(response.data);
}

/**
 * Convenience methods for HTTP operations
 */
export const httpClient = {
  /**
   * GET request
   * @param {string} url - Request URL
   * @param {object} [config] - Axios config (params, headers, requestId, etc.)
   */
  get: (url, config) => apiRequest('get', url, null, config),
  
  /**
   * POST request
   * @param {string} url - Request URL
   * @param {object} data - Request body (camelCase)
   * @param {object} [config] - Axios config
   */
  post: (url, data, config) => apiRequest('post', url, data, config),
  
  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {object} data - Request body (camelCase)
   * @param {object} [config] - Axios config
   */
  put: (url, data, config) => apiRequest('put', url, data, config),
  
  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {object} data - Request body (camelCase)
   * @param {object} [config] - Axios config
   */
  patch: (url, data, config) => apiRequest('patch', url, data, config),
  
  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {object} [config] - Axios config
   */
  delete: (url, config) => apiRequest('delete', url, null, config),
};

export default httpClient;
