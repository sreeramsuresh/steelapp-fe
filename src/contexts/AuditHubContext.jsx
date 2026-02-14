import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import auditHubService from "../services/auditHubService";
import { authService } from "../services/authService";
import { useAuth } from "./AuthContext";

const AuditHubContext = createContext();

/**
 * Audit Hub Context Provider
 * Manages audit hub state: periods, datasets, reconciliations
 * Enforces multi-tenancy with company_id context
 */

export function AuditHubProvider({ children }) {
  const { user } = useAuth();

  // State
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    status: null,
  });

  // Track initial load to avoid StrictMode duplicate calls
  const initialLoadDone = useRef(false);

  // Load periods
  const loadPeriods = useCallback(
    async (options = {}) => {
      if (!user?.companyId) return;
      // Skip if user doesn't have accounting_periods permission
      if (!authService.hasPermission("accounting_periods", "read")) return;

      setLoading(true);
      setError(null);
      try {
        const data = await auditHubService.getPeriods(user.companyId, filters);
        if (!options.cancelled) {
          setPeriods(data);
        }
      } catch (err) {
        if (!options.cancelled) {
          console.warn("[AuditHub] Load periods failed:", err.message || err);
          setError(err.message);
          setPeriods([]);
        }
      } finally {
        if (!options.cancelled) {
          setLoading(false);
        }
      }
    },
    [user?.companyId, filters]
  );

  // Guard: Redirect if no company context
  useEffect(() => {
    if (!user?.companyId) {
      setError("No company context available");
      setPeriods([]);
      setDatasets([]);
      return;
    }
  }, [user?.companyId]);

  // Load periods whenever company context or filters change
  useEffect(() => {
    if (!user?.companyId) return;

    // Skip StrictMode duplicate mount for initial load
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
    }

    const options = { cancelled: false };
    loadPeriods(options);
    return () => {
      options.cancelled = true;
    };
  }, [user?.companyId, loadPeriods]);

  // Select period and load its datasets
  const selectPeriod = useCallback(
    async (period) => {
      if (!user?.companyId) return;

      setSelectedPeriod(period);
      setLoading(true);
      setError(null);
      try {
        const data = await auditHubService.getDatasets(user.companyId, period.id);
        setDatasets(data);
        setSelectedDataset(null);
      } catch (err) {
        console.error("[AuditHub] Select period error:", err);
        setError(err.message);
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.companyId]
  );

  // Select dataset
  const selectDataset = useCallback((dataset) => {
    setSelectedDataset(dataset);
  }, []);

  // Close period
  const closePeriod = useCallback(
    async (periodId) => {
      if (!user?.companyId) return;

      setLoading(true);
      setError(null);
      try {
        const updatedPeriod = await auditHubService.closePeriod(user.companyId, periodId);

        // Update periods list
        setPeriods((prev) => prev.map((p) => (p.id === periodId ? updatedPeriod : p)));

        // Update selected period if it was the one closed
        if (selectedPeriod?.id === periodId) {
          setSelectedPeriod(updatedPeriod);
        }

        return updatedPeriod;
      } catch (err) {
        console.error("[AuditHub] Close period error:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.companyId, selectedPeriod]
  );

  // Lock period
  const lockPeriod = useCallback(
    async (periodId) => {
      if (!user?.companyId) return;

      setLoading(true);
      setError(null);
      try {
        const updatedPeriod = await auditHubService.lockPeriod(user.companyId, periodId);

        // Update periods list
        setPeriods((prev) => prev.map((p) => (p.id === periodId ? updatedPeriod : p)));

        // Update selected period if it was the one locked
        if (selectedPeriod?.id === periodId) {
          setSelectedPeriod(updatedPeriod);
        }

        return updatedPeriod;
      } catch (err) {
        console.error("[AuditHub] Lock period error:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.companyId, selectedPeriod]
  );

  // Load reconciliations
  const loadReconciliations = useCallback(
    async (fiscalPeriod) => {
      if (!user?.companyId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await auditHubService.getReconciliations(user.companyId, fiscalPeriod);
        setReconciliations(data);
      } catch (err) {
        console.error("[AuditHub] Load reconciliations error:", err);
        setError(err.message);
        setReconciliations([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.companyId]
  );

  // Create period
  const createPeriod = useCallback(
    async (periodType, year, month) => {
      if (!user?.companyId) return;

      setLoading(true);
      setError(null);
      try {
        const newPeriod = await auditHubService.createPeriod(user.companyId, periodType, year, month);

        // Add new period to the list
        setPeriods((prev) => [newPeriod, ...prev]);

        return newPeriod;
      } catch (err) {
        console.error("[AuditHub] Create period error:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.companyId]
  );

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Context value
  const value = {
    // State
    periods,
    selectedPeriod,
    datasets,
    selectedDataset,
    reconciliations,
    loading,
    error,
    filters,
    companyId: user?.companyId,

    // Actions
    loadPeriods,
    selectPeriod,
    selectDataset,
    createPeriod,
    closePeriod,
    lockPeriod,
    loadReconciliations,
    updateFilters,
  };

  return <AuditHubContext.Provider value={value}>{children}</AuditHubContext.Provider>;
}

// Hook to use audit hub context
export function useAuditHub() {
  const context = useContext(AuditHubContext);
  if (!context) {
    throw new Error("useAuditHub must be used within AuditHubProvider");
  }
  return context;
}
