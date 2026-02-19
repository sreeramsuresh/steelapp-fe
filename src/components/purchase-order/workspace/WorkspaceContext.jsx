import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { purchaseOrderService } from "../../../services/purchaseOrderService";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ poId, children }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!poId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseOrderService.getWorkspaceSummary(poId);
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <WorkspaceContext.Provider value={{ summary, loading, error, refresh: fetchSummary, poId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
