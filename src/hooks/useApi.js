import { useState, useEffect, useCallback, useRef } from "react";
import {
  getErrorMessage,
  ErrorTypes,
  DisplayTypes,
} from "../utils/errorHandler";
import notificationService from "../services/notificationService";
import { reportApiUnhealthy } from "../contexts/ApiHealthContext";

/**
 * useApi - Hook for API calls with centralized error handling
 *
 * Error handling behavior based on error type:
 * - VALIDATION → sets fieldErrors, no toast
 * - BUSINESS (displayAs: toast) → shows toast.error(), sets error
 * - SYSTEM → sets appError for ErrorState/ErrorBanner display
 *
 * @returns {Object}
 *   - data: Response data
 *   - loading: Boolean loading state
 *   - error: Error message string (for backward compatibility)
 *   - appError: Full error object for ErrorState component
 *   - fieldErrors: Field-level validation errors { fieldName: message }
 *   - execute: Function to call the API
 *   - reset: Function to reset state
 *   - clearFieldError: Function to clear a specific field error
 */
export const useApi = (apiFunction, _dependencies = [], options = {}) => {
  const { initialData = null, showToasts = true } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appError, setAppError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        setAppError(null);
        setFieldErrors({});
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorInfo = getErrorMessage(err);

        // Set raw error message for backward compatibility
        setError(errorInfo.message);

        // Handle based on error type and display preference
        switch (errorInfo.type) {
          case ErrorTypes.VALIDATION:
            // Set field-level errors for inline display
            setFieldErrors(errorInfo.fields || {});
            // Don't show toast for validation errors - they're shown inline
            break;

          case ErrorTypes.BUSINESS:
            if (errorInfo.displayAs === DisplayTypes.TOAST && showToasts) {
              notificationService.error(errorInfo.message);
            } else if (errorInfo.displayAs === DisplayTypes.PAGE) {
              setAppError(errorInfo);
            }
            break;

          case ErrorTypes.AUTH:
            // Set appError for full-page display
            setAppError(errorInfo);
            // Optionally redirect to login
            if (errorInfo.action === "LOGIN") {
              // Give time for the user to see the error before redirect
              setTimeout(() => {
                window.location.href = "/login";
              }, 2000);
            }
            break;

          case ErrorTypes.SYSTEM:
          default:
            // System errors are displayed via ErrorState or ErrorBanner
            setAppError(errorInfo);
            // Report to ApiHealthContext for instant banner display
            if (errorInfo.isNetworkError) {
              reportApiUnhealthy(errorInfo.message);
            }
            // Also show a toast for immediate feedback if enabled
            if (showToasts && errorInfo.displayAs === DisplayTypes.BANNER) {
              notificationService.error(errorInfo.message);
            }
            break;
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showToasts],
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setAppError(null);
    setFieldErrors({});
    setLoading(false);
  }, [initialData]);

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const clearAppError = useCallback(() => {
    setAppError(null);
  }, []);

  return {
    data,
    loading,
    error,
    appError,
    fieldErrors,
    execute,
    reset,
    clearFieldError,
    clearAppError,
  };
};

/**
 * useApiData - Auto-fetching hook with stale-while-revalidate support
 *
 * Same error handling as useApi, but automatically fetches on mount.
 *
 * @param {Function} apiFunction - Function to call for fetching data
 * @param {Array} dependencies - Dependencies that trigger refetch
 * @param {Object|boolean} options - Options object or boolean for backward compatibility
 *   - immediate: boolean - Whether to fetch immediately on mount (default: true)
 *   - initialData: any - Initial data to use before fetch completes
 *   - skipInitialLoading: boolean - Skip showing loading state if initialData is provided
 *   - showToasts: boolean - Whether to show toast notifications for errors (default: true)
 */
export const useApiData = (apiFunction, dependencies = [], options = true) => {
  // Support backward compatibility: options can be boolean (immediate) or object
  const normalizedOptions =
    typeof options === "boolean" ? { immediate: options } : options;

  const {
    immediate = true,
    initialData = null,
    skipInitialLoading = false,
    showToasts = true,
  } = normalizedOptions;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!skipInitialLoading);
  const [error, setError] = useState(null);
  const [appError, setAppError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Track if initial fetch has been done to prevent double-fetch in React Strict Mode
  const hasFetchedRef = useRef(false);

  const execute = useCallback(
    async (...args) => {
      try {
        // Only show loading if we don't have data yet or skipInitialLoading is false
        if (!data || !skipInitialLoading) {
          setLoading(true);
        }
        setError(null);
        setAppError(null);
        setFieldErrors({});
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorInfo = getErrorMessage(err);

        // Set raw error message for backward compatibility
        setError(errorInfo.message);

        // Handle based on error type and display preference
        switch (errorInfo.type) {
          case ErrorTypes.VALIDATION:
            setFieldErrors(errorInfo.fields || {});
            break;

          case ErrorTypes.BUSINESS:
            if (errorInfo.displayAs === DisplayTypes.TOAST && showToasts) {
              notificationService.error(errorInfo.message);
            } else if (errorInfo.displayAs === DisplayTypes.PAGE) {
              setAppError(errorInfo);
            }
            break;

          case ErrorTypes.AUTH:
            setAppError(errorInfo);
            if (errorInfo.action === "LOGIN") {
              setTimeout(() => {
                window.location.href = "/login";
              }, 2000);
            }
            break;

          case ErrorTypes.SYSTEM:
          default:
            setAppError(errorInfo);
            // Report to ApiHealthContext for instant banner display
            if (errorInfo.isNetworkError) {
              reportApiUnhealthy(errorInfo.message);
            }
            if (showToasts && errorInfo.displayAs === DisplayTypes.BANNER) {
              notificationService.error(errorInfo.message);
            }
            break;
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFunction, skipInitialLoading, showToasts],
  );

  useEffect(() => {
    // Only fetch on mount if immediate is true and haven't fetched yet
    if (immediate && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      execute().catch(() => {
        // Error already handled in execute
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for dependency changes (after initial mount)
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    // Skip first render (already handled above)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // On dependency changes, refetch if immediate is true
    if (immediate) {
      execute().catch(() => {
        // Error already handled in execute
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setAppError(null);
    setFieldErrors({});
    setLoading(false);
  }, [initialData]);

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const clearAppError = useCallback(() => {
    setAppError(null);
  }, []);

  return {
    data,
    loading,
    error,
    appError,
    fieldErrors,
    refetch: execute,
    reset,
    clearFieldError,
    clearAppError,
  };
};
