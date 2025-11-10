import { useState, useEffect, useCallback, useRef } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
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
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export const useApiData = (apiFunction, dependencies = [], immediate = true) => {
  const { data, loading, error, execute, reset } = useApi(apiFunction, dependencies);

  // Track if initial fetch has been done to prevent double-fetch in React Strict Mode
  const hasFetchedRef = useRef(false);

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

  return {
    data,
    loading,
    error,
    refetch: execute,
    reset
  };
};