import { useState, useEffect, useCallback, useRef } from 'react';

export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use apiFunction directly without dependencies to avoid recreating execute on every render
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - apiFunction should be stable (wrapped in useCallback by caller if needed)

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * useApiData - Auto-fetching hook with stale-while-revalidate support
 * @param {Function} apiFunction - Function to call for fetching data
 * @param {Array} dependencies - Dependencies that trigger refetch
 * @param {Object|boolean} options - Options object or boolean for backward compatibility (immediate)
 *   - immediate: boolean - Whether to fetch immediately on mount (default: true)
 *   - initialData: any - Initial data to use before fetch completes (for stale-while-revalidate)
 *   - skipInitialLoading: boolean - Skip showing loading state if initialData is provided
 */
export const useApiData = (apiFunction, dependencies = [], options = true) => {
  // Support backward compatibility: options can be boolean (immediate) or object
  const normalizedOptions = typeof options === 'boolean'
    ? { immediate: options }
    : options;

  const {
    immediate = true,
    initialData = null,
    skipInitialLoading = false,
  } = normalizedOptions;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!skipInitialLoading);
  const [error, setError] = useState(null);

  // Track if initial fetch has been done to prevent double-fetch in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Execute function that updates state
  const execute = useCallback(async (...args) => {
    try {
      // Only show loading if we don't have data yet or skipInitialLoading is false
      if (!data || !skipInitialLoading) {
        setLoading(true);
      }
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFunction, skipInitialLoading]); // Include apiFunction to update when it changes

  useEffect(() => {
    // Only fetch on mount if immediate is true and haven't fetched yet
    if (immediate && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    reset,
  };
};
