import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useApiHealth - Hook that polls the API Gateway health endpoint
 *
 * Checks if the backend server is running and accessible.
 * Polls every 30 seconds by default.
 *
 * @param {Object} options
 * @param {number} options.pollingInterval - How often to check (ms), default 30000 (30s)
 * @param {string} options.healthUrl - URL to check, default 'http://localhost:3000/health'
 * @param {boolean} options.enabled - Whether polling is enabled, default true
 *
 * @returns {Object}
 *   - isHealthy: boolean - Whether the API is responding
 *   - isChecking: boolean - Whether a check is in progress
 *   - lastChecked: Date|null - When the last check occurred
 *   - error: string|null - Error message if unhealthy
 *   - checkNow: function - Manually trigger a health check
 */
export const useApiHealth = (options = {}) => {
  const {
    pollingInterval = 30000, // 30 seconds
    healthUrl = "http://localhost:3000/health",
    enabled = true,
  } = options;

  const [isHealthy, setIsHealthy] = useState(true); // Assume healthy initially
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);

  /**
   * Perform a health check against the API Gateway
   */
  const checkHealth = useCallback(async () => {
    if (!enabled) return;

    setIsChecking(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
        // Don't send credentials for health check
        credentials: "omit",
      });

      clearTimeout(timeoutId);

      if (isMountedRef.current) {
        if (response.ok) {
          setIsHealthy(true);
          setError(null);
        } else {
          setIsHealthy(false);
          setError(`Server returned status ${response.status}`);
        }
        setLastChecked(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsHealthy(false);

        // Provide user-friendly error messages
        if (err.name === "AbortError") {
          setError("Server is not responding (timeout)");
        } else if (err.message.includes("Failed to fetch")) {
          setError("Cannot connect to server");
        } else {
          setError(err.message || "Health check failed");
        }
        setLastChecked(new Date());
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [enabled, healthUrl]);

  // Initial check on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      // Small delay before first check to let the UI render first
      const initialCheckTimeout = setTimeout(checkHealth, 1000);

      return () => {
        clearTimeout(initialCheckTimeout);
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, checkHealth]);

  // Set up polling interval
  useEffect(() => {
    if (enabled && pollingInterval > 0) {
      intervalRef.current = setInterval(checkHealth, pollingInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    return () => {};
  }, [enabled, pollingInterval, checkHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isHealthy,
    isChecking,
    lastChecked,
    error,
    checkNow: checkHealth,
  };
};

export default useApiHealth;
