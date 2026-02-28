/**
 * Single source of truth for the API health check URL.
 *
 * Derives the health endpoint from VITE_API_BASE_URL:
 *   - "https://api.example.com/api" → "https://api.example.com/health"
 *   - "/api"                        → "/health"
 *   - "" (unset)                    → "/health"
 *
 * The backend serves /health at the server root, not under /api.
 */
const API_BASE = import.meta?.env?.VITE_API_BASE_URL ?? "";
export const HEALTH_URL = API_BASE.replace(/\/api\/?$/, "") + "/health";
