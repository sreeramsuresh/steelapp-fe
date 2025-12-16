import { contractRegistry, ContractDefinition } from './contractRegistry';

/**
 * Pattern Matching for API Contracts
 *
 * Matches incoming requests to registered contract patterns.
 * Supports:
 * - URL parameter segments (/invoices/:id)
 * - Query string stripping
 * - BaseURL normalization
 * - Multiple slash normalization
 */

/**
 * Normalize URL for contract matching.
 *
 * Steps:
 * 1. Remove baseURL prefix (e.g., '/api', 'http://localhost:3000/api')
 * 2. Strip query string
 * 3. Normalize multiple slashes to single
 * 4. Remove trailing slash
 * 5. Ensure leading slash
 *
 * Examples:
 *   '/api/invoices/123?status=draft' → '/invoices/123'
 *   'http://localhost:3000/api/invoices/123' → '/invoices/123'
 *   '//invoices//123/' → '/invoices/123'
 */
function normalizeUrl(url: string): string {
  let normalized = url;

  // Remove common baseURL prefixes
  const baseUrlPatterns = [
    /^https?:\/\/[^/]+\/api/, // Full URL with /api
    /^\/api/, // Relative /api
  ];

  for (const pattern of baseUrlPatterns) {
    normalized = normalized.replace(pattern, '');
  }

  // Strip query string
  const queryIndex = normalized.indexOf('?');
  if (queryIndex !== -1) {
    normalized = normalized.substring(0, queryIndex);
  }

  // Strip hash
  const hashIndex = normalized.indexOf('#');
  if (hashIndex !== -1) {
    normalized = normalized.substring(0, hashIndex);
  }

  // Normalize multiple slashes
  normalized = normalized.replace(/\/+/g, '/');

  // Remove trailing slash (but keep '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

/**
 * Check if URL matches a pattern with :param segments.
 *
 * Examples:
 *   matchesPattern('/invoices/123', '/invoices/:id') → true
 *   matchesPattern('/invoices/123/items/456', '/invoices/:id/items/:itemId') → true
 *   matchesPattern('/invoices', '/invoices/:id') → false
 *
 * @param url - Normalized URL path
 * @param pattern - Pattern with :param segments
 * @returns true if URL matches pattern
 */
function matchesPattern(url: string, pattern: string): boolean {
  const urlParts = url.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  // Must have same number of segments
  if (urlParts.length !== patternParts.length) {
    return false;
  }

  // Check each segment
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const urlPart = urlParts[i];

    // If pattern part starts with ':', it's a parameter - always matches
    if (patternPart.startsWith(':')) {
      continue;
    }

    // Otherwise, must be exact match (case-sensitive)
    if (patternPart !== urlPart) {
      return false;
    }
  }

  return true;
}

/**
 * Find matching contract for a request.
 *
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param url - Request URL (can include baseURL, query params)
 * @returns Matching contract definition or null
 *
 * @example
 * matchContract({ method: 'POST', url: '/api/invoices?draft=true' })
 * // Returns: { request: ZodSchema, response: ZodSchema }
 *
 * matchContract({ method: 'PUT', url: '/api/invoices/123' })
 * // Returns: { request: ZodSchema, response: ZodSchema } (matches /invoices/:id)
 *
 * matchContract({ method: 'GET', url: '/unknown/endpoint' })
 * // Returns: null
 */
export function matchContract(params: {
  method: string;
  url: string;
}): ContractDefinition | null {
  const { method, url } = params;

  // Normalize method to uppercase
  const normalizedMethod = method.toUpperCase();

  // Normalize URL
  const normalizedUrl = normalizeUrl(url);

  // Build contract key: "METHOD /path"
  const exactKey = `${normalizedMethod} ${normalizedUrl}`;

  // First, try exact match (for endpoints without params)
  if (contractRegistry[exactKey]) {
    return contractRegistry[exactKey];
  }

  // Then, try pattern matching (for endpoints with :params)
  for (const [key, contract] of Object.entries(contractRegistry)) {
    const [registryMethod, registryPattern] = key.split(' ', 2);

    // Method must match
    if (registryMethod !== normalizedMethod) {
      continue;
    }

    // Check if URL matches pattern
    if (matchesPattern(normalizedUrl, registryPattern)) {
      return contract;
    }
  }

  // No match found
  return null;
}

/**
 * Extract parameters from URL based on pattern.
 *
 * @param url - Normalized URL path
 * @param pattern - Pattern with :param segments
 * @returns Object with parameter names and values
 *
 * @example
 * extractParams('/invoices/123', '/invoices/:id')
 * // Returns: { id: '123' }
 *
 * extractParams('/invoices/123/items/456', '/invoices/:id/items/:itemId')
 * // Returns: { id: '123', itemId: '456' }
 */
export function extractParams(
  url: string,
  pattern: string
): Record<string, string> {
  const params: Record<string, string> = {};

  const urlParts = url.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (urlParts.length !== patternParts.length) {
    return params;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const urlPart = urlParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.substring(1);
      params[paramName] = urlPart;
    }
  }

  return params;
}
