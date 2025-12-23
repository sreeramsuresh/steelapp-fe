/**
 * Response Contract Validator
 *
 * Validates API responses against expected contract to catch backend shape changes early.
 * Enabled in development by default, disabled in production.
 *
 * Correction #3: Imported ONCE at module load time, not dynamically per-request.
 * Dynamic imports are expensive and unnecessary here.
 */

// Contract registry: API endpoint → expected envelope shape
// These keys match the actual axios call paths (relative to baseURL)
// CRITICAL: Keys must match how axios/apiClient actually makes the calls
const CONTRACT_REGISTRY = {
  "/invoices": { arrayKey: "invoices", hasPagination: true },
  "/customers": { arrayKey: "customers", hasPagination: true },
  "/suppliers": { arrayKey: "suppliers", hasPagination: true },
  "/products": { arrayKey: "products", hasPagination: true },
  "/stock-batches": { arrayKey: "batches", hasPagination: true },
  "/warehouses": { arrayKey: "warehouses", hasPagination: true },
  // Add more endpoints as they're implemented
};

/**
 * Contract violation error
 * Thrown in development when response shape doesn't match expected contract
 */
class ContractViolationError extends Error {
  constructor(endpoint, expected, received) {
    super(`Contract violation: ${endpoint}`);
    this.name = "ContractViolationError";
    this.endpoint = endpoint;
    this.expected = expected;
    this.received = received;
  }
}

/**
 * Validate response against contract
 * CRITICAL: Only validate endpoints in CONTRACT_REGISTRY (Correction #7)
 * Do NOT validate mutation endpoints that return {success: true} or single entities
 *
 * @param {string} url - API endpoint URL (relative path from axios baseURL)
 * @param {object} response - Response data object
 * @returns {object} response if valid
 * @throws {ContractViolationError} in development if contract violated
 */
export function validateResponse(url, response) {
  // Only validate in development (Correction #3: not in production)
  if (import.meta.env.MODE === "production") {
    return response;
  }

  // Feature flag: allow disabling validation per environment
  if (import.meta.env.VITE_DISABLE_CONTRACT_VALIDATION === "true") {
    return response;
  }

  // Find contract for this URL (Correction #4: match registry keys precisely)
  const contract = findContract(url);
  if (!contract) {
    // No contract defined for this endpoint, skip validation (Correction #7)
    return response;
  }

  try {
    // Validate envelope shape
    validateEnvelope(response, contract, url);
    return response;
  } catch (error) {
    if (error instanceof ContractViolationError) {
      // Log detailed diagnostics for debugging
      console.error("🚨 CONTRACT VIOLATION DETECTED:", {
        endpoint: error.endpoint,
        expected: error.expected,
        received: error.received,
        actualResponse: response,
      });

      // In dev: throw to fail fast and alert developer
      throw error;
    }
    throw error;
  }
}

/**
 * Find contract matching the URL
 * Supports exact matches and query parameter variations
 * DOES NOT match sub-resources (e.g., /invoices/123 or /invoices/number/next)
 *
 * @param {string} url - Request URL (e.g., "/invoices", "/invoices?page=1")
 * @returns {object|null} Contract object or null if not found
 */
function findContract(url) {
  // Remove query string for matching (e.g., "/invoices?page=1" → "/invoices")
  const cleanUrl = url.split("?")[0];

  // Exact match (fastest)
  if (CONTRACT_REGISTRY[cleanUrl]) {
    return CONTRACT_REGISTRY[cleanUrl];
  }

  // Trailing slash match (e.g., "/invoices/" matches "/invoices" contract)
  for (const pattern in CONTRACT_REGISTRY) {
    if (cleanUrl === `${pattern}/`) {
      return CONTRACT_REGISTRY[pattern];
    }
  }

  // CRITICAL: Do NOT use startsWith() - it causes false positives
  // e.g., "/invoices/number/next" would match "/invoices" contract
  // which is wrong. We only want exact paths and query param variations.

  return null;
}

/**
 * Validate response envelope shape
 * Must be {entityKey: [], pageInfo: {...}} for list endpoints
 *
 * @param {object} response - Response data
 * @param {object} contract - Contract specification
 * @param {string} url - Endpoint URL (for error messages)
 * @throws {ContractViolationError} if shape is wrong
 */
function validateEnvelope(response, contract, url) {
  const { arrayKey, hasPagination } = contract;

  // Assert top-level object exists (not array, not null)
  if (
    typeof response !== "object" ||
    response === null ||
    Array.isArray(response)
  ) {
    throw new ContractViolationError(
      url,
      "Response must be an object (not array or null)",
      typeof response === "object" ? "array" : typeof response,
    );
  }

  // Assert array field exists with correct key
  if (!response.hasOwnProperty(arrayKey)) {
    throw new ContractViolationError(
      url,
      `Response must have "${arrayKey}" key`,
      `Keys present: ${Object.keys(response).join(", ")}`,
    );
  }

  // Assert array field is actually an array
  if (!Array.isArray(response[arrayKey])) {
    throw new ContractViolationError(
      url,
      `${arrayKey} must be an array`,
      `Type received: ${typeof response[arrayKey]}`,
    );
  }

  // Assert pageInfo exists for paginated endpoints
  if (hasPagination) {
    validatePageInfo(response.pageInfo, url);
  }
}

/**
 * Validate pageInfo structure and types
 * Must have: totalItems, totalPages, currentPage, pageSize, hasNext, hasPrev
 *
 * @param {object} pageInfo - PageInfo object from response
 * @param {string} url - Endpoint URL (for error messages)
 * @throws {ContractViolationError} if structure is wrong
 */
function validatePageInfo(pageInfo, url) {
  if (!pageInfo || typeof pageInfo !== "object") {
    throw new ContractViolationError(
      url,
      "pageInfo object required",
      typeof pageInfo,
    );
  }

  // Check all required keys
  const requiredKeys = [
    "totalItems",
    "totalPages",
    "currentPage",
    "pageSize",
    "hasNext",
    "hasPrev",
  ];
  for (const key of requiredKeys) {
    if (!pageInfo.hasOwnProperty(key)) {
      throw new ContractViolationError(
        url,
        `pageInfo.${key} required`,
        `Missing key: ${key}`,
      );
    }
  }

  // Type validation
  const typeErrors = [];
  if (typeof pageInfo.totalItems !== "number")
    typeErrors.push("pageInfo.totalItems must be number");
  if (typeof pageInfo.totalPages !== "number")
    typeErrors.push("pageInfo.totalPages must be number");
  if (typeof pageInfo.currentPage !== "number")
    typeErrors.push("pageInfo.currentPage must be number");
  if (typeof pageInfo.pageSize !== "number")
    typeErrors.push("pageInfo.pageSize must be number");
  if (typeof pageInfo.hasNext !== "boolean")
    typeErrors.push("pageInfo.hasNext must be boolean");
  if (typeof pageInfo.hasPrev !== "boolean")
    typeErrors.push("pageInfo.hasPrev must be boolean");

  if (typeErrors.length > 0) {
    throw new ContractViolationError(
      url,
      "pageInfo type validation",
      typeErrors.join("; "),
    );
  }
}

export { ContractViolationError };
