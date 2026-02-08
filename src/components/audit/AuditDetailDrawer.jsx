import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Monitor,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { toUAETime } from "../../utils/timezone";

const ENTITY_ROUTES = {
  customer: "/app/customers",
  supplier: "/app/suppliers",
  product: "/app/products",
  invoice: "/app/invoices",
  credit_note: "/app/credit-notes",
  delivery_note: "/app/delivery-notes",
  purchase_order: "/app/purchase-orders",
  quotation: "/app/quotations",
  warehouse: "/app/warehouses",
};

const ACTION_COLORS = {
  CREATE: "text-green-600 dark:text-green-400",
  INSERT: "text-green-600 dark:text-green-400",
  UPDATE: "text-blue-600 dark:text-blue-400",
  DELETE: "text-red-600 dark:text-red-400",
  LOGIN: "text-purple-600 dark:text-purple-400",
  LOGOUT: "text-gray-600 dark:text-gray-400",
};

function getActionColor(action) {
  if (!action) return "text-gray-600 dark:text-gray-400";
  const upper = action.toUpperCase();
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (upper.includes(key)) return color;
  }
  return "text-gray-600 dark:text-gray-400";
}

function JsonDiff({ label, data, variant }) {
  const { isDarkMode } = useTheme();

  if (!data) {
    return (
      <div
        className={`rounded-lg p-3 ${
          variant === "before"
            ? isDarkMode
              ? "bg-red-900/20 border border-red-800/30"
              : "bg-red-50 border border-red-200"
            : isDarkMode
              ? "bg-green-900/20 border border-green-800/30"
              : "bg-green-50 border border-green-200"
        }`}
      >
        <div className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</div>
        <div className={`text-sm italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          {variant === "before" ? "(no previous data)" : "(record deleted)"}
        </div>
      </div>
    );
  }

  const entries = typeof data === "string" ? JSON.parse(data) : data;

  return (
    <div
      className={`rounded-lg p-3 ${
        variant === "before"
          ? isDarkMode
            ? "bg-red-900/20 border border-red-800/30"
            : "bg-red-50 border border-red-200"
          : isDarkMode
            ? "bg-green-900/20 border border-green-800/30"
            : "bg-green-50 border border-green-200"
      }`}
    >
      <div className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {Object.entries(entries).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs font-mono">
            <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{key}:</span>
            <span className={`truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              {typeof value === "object" ? JSON.stringify(value) : String(value ?? "null")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditDetailDrawer({ log, isOpen, onClose }) {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  if (!isOpen || !log) return null;

  const entityRoute = log.entity_type && ENTITY_ROUTES[log.entity_type];
  const canNavigateToEntity = entityRoute && log.entity_id;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} onKeyDown={() => {}} />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg z-[70] shadow-2xl transform transition-transform duration-300 ${
          isDarkMode ? "bg-gray-900 border-l border-gray-700" : "bg-white border-l border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Audit Entry Detail
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)] px-6 py-4 space-y-5">
          {/* Action & Status */}
          <div className="flex items-center justify-between">
            <span className={`text-lg font-semibold ${getActionColor(log.action)}`}>{log.action}</span>
            {log.status === "success" ? (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle size={16} />
                Success
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                Failed
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div
            className={`grid grid-cols-2 gap-3 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
          >
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Category</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {log.category || "-"}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Timestamp</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                <Clock size={12} className="inline mr-1" />
                {toUAETime(log.created_at, { format: "datetime" })}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>User</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                <User size={12} className="inline mr-1" />
                {log.username || "-"}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Email</div>
              <div className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {log.user_email || "-"}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>IP Address</div>
              <div className={`text-sm font-mono ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                <Globe size={12} className="inline mr-1" />
                {log.ip_address || "-"}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Method</div>
              <div className={`text-sm font-mono ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {log.method || "-"} {log.endpoint || ""}
              </div>
            </div>
          </div>

          {/* User Agent */}
          {log.user_agent && (
            <div>
              <div className={`text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Monitor size={12} className="inline mr-1" />
                User Agent
              </div>
              <div
                className={`text-xs font-mono p-2 rounded ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-600"}`}
              >
                {log.user_agent}
              </div>
            </div>
          )}

          {/* Description */}
          {log.description && (
            <div>
              <div className={`text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Description</div>
              <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{log.description}</div>
            </div>
          )}

          {/* Entity Link */}
          {log.entity_name && (
            <div
              className={`p-3 rounded-lg flex items-center justify-between ${
                isDarkMode ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div>
                <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {log.entity_type || "Entity"}
                </div>
                <div className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {log.entity_name}
                </div>
              </div>
              {canNavigateToEntity && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`${entityRoute}/${log.entity_id}`);
                  }}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink size={14} />
                  View
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {log.error_message && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
              <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Error</div>
              <div className="text-sm text-red-700 dark:text-red-300">{log.error_message}</div>
            </div>
          )}

          {/* Changes (Before / After) */}
          {(log.old_values || log.new_values) && (
            <div>
              <div className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                <ArrowRight size={12} className="inline mr-1" />
                Changes
              </div>
              <div className="space-y-3">
                <JsonDiff label="Before" data={log.old_values} variant="before" />
                <JsonDiff label="After" data={log.new_values} variant="after" />
              </div>
            </div>
          )}

          {/* Extra Details */}
          {log.details && (
            <div>
              <div className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Additional Details
              </div>
              <div
                className={`p-3 rounded-lg text-xs font-mono max-h-48 overflow-y-auto ${
                  isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-600"
                }`}
              >
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(typeof log.details === "string" ? JSON.parse(log.details) : log.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
