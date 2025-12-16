import { ZodError, ZodIssue } from 'zod';
import { matchContract } from './matchContract';

/**
 * Contract Validation - DEV-only request/response validation
 *
 * Validates API requests and responses against registered Zod schemas.
 * Throws ContractViolationError on validation failure.
 */

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

/**
 * Contract Violation Error
 *
 * Thrown when a request or response fails contract validation.
 * Contains detailed Zod validation issues for debugging.
 */
export class ContractViolationError extends Error {
  name = 'ContractViolationError';
  method: string;
  url: string;
  issues: ZodIssue[];
  phase: 'request' | 'response';

  constructor(params: {
    method: string;
    url: string;
    issues: ZodIssue[];
    phase: 'request' | 'response';
  }) {
    const { method, url, issues, phase } = params;

    // Build concise error message
    const issueCount = issues.length;
    const firstIssue = issues[0];
    const path = firstIssue.path.join('.');
    const message =
      `${phase.toUpperCase()} contract violation: ${method} ${url}\n` +
      `  └─ ${path ? `${path}: ` : ''}${firstIssue.message}${
        issueCount > 1 ? `\n  └─ ...and ${issueCount - 1} more issue(s)` : ''
      }`;

    super(message);

    this.method = method;
    this.url = url;
    this.issues = issues;
    this.phase = phase;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ContractViolationError.prototype);
  }

  /**
   * Format all validation issues for detailed logging.
   */
  formatIssues(): string {
    return this.issues
      .map((issue, idx) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `${idx + 1}. ${path}: ${issue.message}`;
      })
      .join('\n');
  }

  /**
   * Get summary for console logging.
   */
  toLogString(): string {
    return (
      `[ContractViolationError] ${this.method} ${this.url} (${this.phase})\n` +
      `Issues (${this.issues.length}):\n${this.formatIssues()}`
    );
  }
}

// ============================================================================
// VALIDATION GUARDS
// ============================================================================

/**
 * Check if data should be validated.
 *
 * Skip validation for:
 * - FormData (file uploads)
 * - null/undefined
 * - Blob/ArrayBuffer/File
 */
function shouldValidateData(data: unknown): boolean {
  if (data === null || data === undefined) {
    return false;
  }

  if (data instanceof FormData) {
    return false;
  }

  if (data instanceof Blob || data instanceof File) {
    return false;
  }

  if (data instanceof ArrayBuffer) {
    return false;
  }

  // Only validate plain objects and arrays
  return typeof data === 'object';
}

/**
 * Check if response should be validated.
 *
 * Skip validation for:
 * - Non-JSON response types (blob, arraybuffer, text)
 * - null/undefined
 */
function shouldValidateResponse(
  responseType: string | undefined,
  data: unknown,
): boolean {
  // Skip blob/arraybuffer responses (file downloads)
  if (responseType === 'blob' || responseType === 'arraybuffer') {
    return false;
  }

  if (data === null || data === undefined) {
    return false;
  }

  // Only validate JSON responses (plain objects/arrays)
  return typeof data === 'object';
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate outgoing request against registered contract.
 *
 * Called BEFORE api.request() is executed.
 *
 * @param config - Axios request config
 * @throws ContractViolationError if validation fails
 *
 * @example
 * validateRequestContract({
 *   method: 'POST',
 *   url: '/invoices',
 *   data: { customerId: 123, items: [...] }
 * });
 */
export function validateRequestContract(config: {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
  responseType?: string;
}): void {
  const { method = 'GET', url = '', data, responseType } = config;

  // Find matching contract
  const contract = matchContract({ method, url });

  if (!contract) {
    // No contract registered - warn once and allow through
    warnMissingContract(method, url);
    return;
  }

  if (!contract.request) {
    // Contract exists but no request schema - allow through
    return;
  }

  // Skip validation for certain data types
  if (!shouldValidateData(data)) {
    return;
  }

  // Validate request data
  try {
    contract.request.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ContractViolationError({
        method,
        url,
        issues: error.issues,
        phase: 'request',
      });
    }
    // Re-throw non-Zod errors
    throw error;
  }
}

/**
 * Validate incoming response against registered contract.
 *
 * Called AFTER api.request() completes successfully.
 *
 * @param params - Response details
 * @throws ContractViolationError if validation fails
 *
 * @example
 * validateResponseContract({
 *   method: 'POST',
 *   url: '/invoices',
 *   data: { id: 123, invoiceNumber: 'INV-001', ... },
 *   responseType: 'json'
 * });
 */
export function validateResponseContract(params: {
  method: string;
  url: string;
  data: unknown;
  responseType?: string;
}): void {
  const { method, url, data, responseType } = params;

  // Find matching contract
  const contract = matchContract({ method, url });

  if (!contract) {
    // No contract registered - allow through
    return;
  }

  if (!contract.response) {
    // Contract exists but no response schema - allow through
    return;
  }

  // Skip validation for non-JSON responses
  if (!shouldValidateResponse(responseType, data)) {
    return;
  }

  // Validate response data
  try {
    contract.response.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ContractViolationError({
        method,
        url,
        issues: error.issues,
        phase: 'response',
      });
    }
    // Re-throw non-Zod errors
    throw error;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Warn once per endpoint about missing contract coverage.
 * Used to encourage adding contracts for all critical endpoints.
 */
const warnedEndpoints = new Set<string>();

export function warnMissingContract(method: string, url: string): void {
  const key = `${method} ${url}`;

  if (!warnedEndpoints.has(key)) {
    warnedEndpoints.add(key);
    console.warn(
      `[Contract Guard] No contract registered for: ${key}\n` +
        `  └─ Consider adding to contractRegistry.ts for validation.`,
    );
  }
}

/**
 * Clear warned endpoints cache (useful for tests).
 */
export function clearWarnedEndpoints(): void {
  warnedEndpoints.clear();
}
