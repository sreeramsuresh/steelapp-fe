import { AlertCircle, CheckCircle, Clock, Edit, Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/axiosApi";
import { toUAETime } from "../../utils/timezone";

const ACTION_CONFIG = {
  CREATE: { icon: Plus, color: "bg-green-500", label: "Created" },
  INSERT: { icon: Plus, color: "bg-green-500", label: "Created" },
  UPDATE: { icon: Edit, color: "bg-blue-500", label: "Updated" },
  DELETE: { icon: Trash2, color: "bg-red-500", label: "Deleted" },
  RESTORE: { icon: RefreshCw, color: "bg-amber-500", label: "Restored" },
};

function getActionConfig(action) {
  if (!action) return { icon: Clock, color: "bg-gray-400", label: action || "Unknown" };
  const upper = action.toUpperCase();
  for (const [key, config] of Object.entries(ACTION_CONFIG)) {
    if (upper.includes(key)) return config;
  }
  return { icon: Clock, color: "bg-gray-400", label: action };
}

function ChangeSummary({ oldValues, newValues }) {
  const { isDarkMode } = useTheme();

  if (!oldValues && !newValues) return null;

  // For CREATE: show key fields
  if (!oldValues && newValues) {
    const data = typeof newValues === "string" ? JSON.parse(newValues) : newValues;
    const keyFields = ["name", "email", "status", "total", "amount", "invoice_number", "po_number"];
    const relevantEntries = Object.entries(data).filter(([k]) => keyFields.includes(k));
    if (relevantEntries.length === 0) return null;

    return (
      <div className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        {relevantEntries.map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span> {String(value ?? "null")}
          </div>
        ))}
      </div>
    );
  }

  // For UPDATE: show changed fields
  if (oldValues && newValues) {
    const oldData = typeof oldValues === "string" ? JSON.parse(oldValues) : oldValues;
    const newData = typeof newValues === "string" ? JSON.parse(newValues) : newValues;

    const changes = [];
    const skipFields = ["updated_at", "created_at", "updated_by", "created_by"];

    for (const key of Object.keys(newData)) {
      if (skipFields.includes(key)) continue;
      const oldVal = JSON.stringify(oldData[key]);
      const newVal = JSON.stringify(newData[key]);
      if (oldVal !== newVal) {
        changes.push({ key, from: oldData[key], to: newData[key] });
      }
    }

    if (changes.length === 0) return null;

    return (
      <div className={`mt-2 space-y-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        {changes.slice(0, 5).map((change) => (
          <div key={change.key} className="flex gap-1 flex-wrap">
            <span className="font-medium">{change.key}:</span>
            <span className="line-through text-red-400">{String(change.from ?? "null")}</span>
            <span className={isDarkMode ? "text-gray-600" : "text-gray-300"}>→</span>
            <span className="text-green-500">{String(change.to ?? "null")}</span>
          </div>
        ))}
        {changes.length > 5 && (
          <div className={isDarkMode ? "text-gray-500" : "text-gray-400"}>+{changes.length - 5} more changes</div>
        )}
      </div>
    );
  }

  // For DELETE: show it was removed
  if (oldValues && !newValues) {
    return (
      <div className={`mt-2 text-xs italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
        Record permanently removed
      </div>
    );
  }

  return null;
}

export default function EntityAuditTimeline({ entityType, entityId }) {
  const { isDarkMode } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (!entityType || !entityId) return;
    try {
      setLoading(true);
      const response = await apiService.get(`/audit-logs/entity/${entityType}/${entityId}`);
      setLogs(response.logs || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching entity audit logs:", err);
      setError("Failed to load activity history");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className={`w-10 h-10 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No activity history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, idx) => {
        const config = getActionConfig(log.action);
        const Icon = config.icon;
        const isLast = idx === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${config.color}`}>
                <Icon size={14} />
              </div>
              {!isLast && <div className={`w-0.5 flex-1 min-h-[24px] ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {log.description || config.label}
                </span>
                {log.status === "success" ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <Minus size={14} className="text-red-500" />
                )}
              </div>
              <div className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {log.username || "System"} — {toUAETime(log.created_at, { format: "datetime" })}
              </div>
              <ChangeSummary oldValues={log.old_values} newValues={log.new_values} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
