/**
 * Request ID Generator
 *
 * Generates unique request IDs for tracking requests across the system:
 * Frontend → API Gateway → gRPC Backend
 *
 * Format: req-<timestamp_base36>-<random_6chars>
 * Example: req-m5x7k2p-a3b9c1
 */

/**
 * Generate a unique request ID
 *
 * @returns {string} Unique request ID in format: req-<timestamp>-<random>
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req-${timestamp}-${random}`;
}

/**
 * Validate if a string is a valid request ID format
 *
 * @param {string} id - String to validate
 * @returns {boolean} True if valid request ID format
 */
export function isValidRequestId(id: string): boolean {
  if (typeof id !== "string") return false;
  // Match format: req-<alphanumeric>-<alphanumeric> or gw-<uuid> or plain uuid
  return /^(req-[a-z0-9]+-[a-z0-9]+|gw-[0-9a-f-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(
    id,
  );
}

export default generateRequestId;
