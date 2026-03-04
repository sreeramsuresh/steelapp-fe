import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * ApiHealthContext - Global API health state
 *
 * Combines:
 * 1. Health endpoint polling (every 30s)
 * 2. Immediate detection when any API call fails with network error
 *
 * This ensures the banner appears IMMEDIATELY when gateway goes down,
 * not waiting for the next health poll.
 */

import { HEALTH_URL } from "../utils/healthUrl";

const ApiHealthContext = createContext(null);

// Module-level listeners for reporting unhealthy status from outside React
let unhealthyListeners = [];

/**
 * Report API as unhealthy - can be called from anywhere (e.g., useApi hook)
 * This triggers the banner immediately without waiting for health poll
 */
export const reportApiUnhealthy = (errorMessage) => {
  unhealthyListeners.forEach((listener) => {
    listener(errorMessage);
  });
};

export const useApiHealthContext = () => {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error("useApiHealthContext must be used within ApiHealthProvider");
  }
  return context;
};

export const ApiHealthProvider = ({ children }) => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);
  const healthUrl = HEALTH_URL;
  const pollingInterval = 30000;

  /**
   * Handle unhealthy report from API calls
   */
  const handleUnhealthyReport = useCallback((errorMessage) => {
    if (isMountedRef.current) {
      setIsHealthy(false);
      setError(errorMessage || "Cannot connect to server");
      setIsDismissed(false); // Force banner to reappear
    }
  }, []);

  // Subscribe to unhealthy reports
  useEffect(() => {
    unhealthyListeners.push(handleUnhealthyReport);
    return () => {
      unhealthyListeners = unhealthyListeners.filter((l) => l !== handleUnhealthyReport);
    };
  }, [handleUnhealthyReport]);

  /**
   * Perform health check
   */
  const checkHealth = useCallback(async () => {
    setIsChecking(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
        credentials: "omit",
      });

      clearTimeout(timeoutId);

      if (isMountedRef.current) {
        const nowHealthy = response.ok;
        setIsHealthy(nowHealthy);
        setLastChecked(new Date());
        if (nowHealthy) {
          setError(null);
        } else {
          setError(`Server returned status ${response.status}`);
          setIsDismissed(false);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsHealthy(false);
        setIsDismissed(false);

        if (err.name === "AbortError") {
          setError("Server is not responding (timeout)");
        } else if (err.message.includes("Failed to fetch")) {
          setError("Cannot connect to server");
        } else {
          setError(err.message || "Health check failed");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Initial check
  useEffect(() => {
    isMountedRef.current = true;
    const timeout = setTimeout(checkHealth, 1000);
    return () => clearTimeout(timeout);
  }, [checkHealth]);

  // Polling
  useEffect(() => {
    intervalRef.current = setInterval(checkHealth, pollingInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      isHealthy,
      isChecking,
      lastChecked,
      error,
      isDismissed,
      checkNow: checkHealth,
      dismiss,
    }),
    [isHealthy, isChecking, lastChecked, error, isDismissed, checkHealth, dismiss]
  );

  return <ApiHealthContext.Provider value={value}>{children}</ApiHealthContext.Provider>;
};

ApiHealthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ApiHealthContext;
