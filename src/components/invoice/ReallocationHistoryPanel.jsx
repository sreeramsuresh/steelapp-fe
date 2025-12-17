import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  History,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import apiClient from "../../services/apiClient";

/**
 * ReallocationHistoryPanel Component
 *
 * Displays the history of batch reallocation changes for an invoice or invoice item.
 * Shows who made changes, when, why, and the cost variance impact.
 */
const ReallocationHistoryPanel = ({
  invoiceId,
  invoiceItemId,
  collapsed: initialCollapsed = true,
}) => {
  const { isDarkMode } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  // Fetch reallocation history
  const fetchHistory = useCallback(async () => {
    if (!invoiceId && !invoiceItemId) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      if (invoiceItemId) {
        response = await apiClient.get(
          `/invoices/items/${invoiceItemId}/reallocation-history`,
        );
      } else {
        response = await apiClient.get(
          `/invoices/${invoiceId}/reallocation-history`,
        );
      }
      setHistory(response.history || []);
    } catch (err) {
      console.error("Failed to fetch reallocation history:", err);
      setError(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [invoiceId, invoiceItemId]);

  // Fetch on mount and when IDs change
  useEffect(() => {
    if (!collapsed) {
      fetchHistory();
    }
  }, [collapsed, fetchHistory]);

  /**
   * Format currency
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  /**
   * Format date/time
   */
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Get reason code badge
   */
  const getReasonBadge = (reasonCode) => {
    const reasonLabels = {
      CUSTOMER_REQUEST: { label: "Customer Request", color: "blue" },
      QUALITY_ISSUE: { label: "Quality Issue", color: "red" },
      CERTIFICATE_MISMATCH: { label: "Certificate Mismatch", color: "amber" },
      ENTRY_ERROR: { label: "Entry Error", color: "orange" },
      STOCK_ADJUSTMENT: { label: "Stock Adjustment", color: "purple" },
      SUPERVISOR_OVERRIDE: { label: "Supervisor Override", color: "gray" },
    };

    const reason = reasonLabels[reasonCode] || {
      label: reasonCode,
      color: "gray",
    };
    const colorClasses = {
      blue: isDarkMode
        ? "bg-blue-900/40 text-blue-300"
        : "bg-blue-50 text-blue-700",
      red: isDarkMode ? "bg-red-900/40 text-red-300" : "bg-red-50 text-red-700",
      amber: isDarkMode
        ? "bg-amber-900/40 text-amber-300"
        : "bg-amber-50 text-amber-700",
      orange: isDarkMode
        ? "bg-orange-900/40 text-orange-300"
        : "bg-orange-50 text-orange-700",
      purple: isDarkMode
        ? "bg-purple-900/40 text-purple-300"
        : "bg-purple-50 text-purple-700",
      gray: isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-700",
    };

    return (
      <Badge className={`text-xs ${colorClasses[reason.color]}`}>
        {reason.label}
      </Badge>
    );
  };

  /**
   * Get cost variance indicator
   */
  const getCostVarianceDisplay = (variance) => {
    if (!variance || Math.abs(variance) < 0.01) {
      return <span className="text-gray-500">-</span>;
    }

    const isPositive = variance > 0;
    return (
      <span
        className={`inline-flex items-center gap-1 ${
          isPositive
            ? "text-red-600 dark:text-red-400"
            : "text-green-600 dark:text-green-400"
        }`}
      >
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {formatCurrency(Math.abs(variance))}
      </span>
    );
  };

  // If no invoice/item ID, don't render
  if (!invoiceId && !invoiceItemId) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border ${
        isDarkMode
          ? "border-gray-700 bg-gray-800/30"
          : "border-gray-200 bg-gray-50/50"
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
          isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <History size={16} className="text-gray-500" />
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Batch Reallocation History
          </span>
          {history.length > 0 && (
            <Badge
              className={`text-xs ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {history.length} change{history.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </button>

      {/* Content - Collapsible */}
      {!collapsed && (
        <div
          className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading history...
            </div>
          ) : error ? (
            <div
              className={`p-4 flex items-center gap-2 text-sm ${
                isDarkMode ? "text-red-400" : "text-red-600"
              }`}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          ) : history.length === 0 ? (
            <div
              className={`p-4 text-center text-sm ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              No reallocation history found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}
                  >
                    <TableHead className="w-[160px]">Date/Time</TableHead>
                    <TableHead className="w-[120px]">Changed By</TableHead>
                    <TableHead className="w-[120px]">From Batch</TableHead>
                    <TableHead className="w-[120px]">To Batch</TableHead>
                    <TableHead className="text-right w-[80px]">Qty</TableHead>
                    <TableHead className="text-right w-[100px]">
                      Cost Impact
                    </TableHead>
                    <TableHead className="w-[140px]">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => (
                    <TableRow
                      key={entry.id || index}
                      className={
                        isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                      }
                    >
                      <TableCell className="text-sm">
                        {formatDateTime(entry.changedAt || entry.changed_at)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.changedByName ||
                          entry.changed_by_name ||
                          "System"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.oldBatchNumber || entry.old_batch_number || "-"}
                        {entry.oldQuantity > 0 && (
                          <span className="text-gray-500 ml-1">
                            ({entry.oldQuantity || entry.old_quantity})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.newBatchNumber || entry.new_batch_number || "-"}
                        {entry.newQuantity > 0 && (
                          <span className="text-gray-500 ml-1">
                            ({entry.newQuantity || entry.new_quantity})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.quantityChanged ||
                          entry.quantity_changed ||
                          entry.newQuantity ||
                          entry.new_quantity ||
                          0}
                      </TableCell>
                      <TableCell className="text-right">
                        {getCostVarianceDisplay(
                          entry.costVariance || entry.cost_variance,
                        )}
                      </TableCell>
                      <TableCell>
                        {getReasonBadge(entry.reasonCode || entry.reason_code)}
                        {(entry.reasonText || entry.reason_text) && (
                          <p
                            className={`text-xs mt-1 ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {entry.reasonText || entry.reason_text}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {history.length > 0 && (
            <div
              className={`p-3 border-t ${
                isDarkMode
                  ? "border-gray-700 bg-gray-800/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span
                  className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                >
                  Total Cost Impact:
                </span>
                <span className="font-semibold">
                  {getCostVarianceDisplay(
                    history.reduce(
                      (sum, e) =>
                        sum + (e.costVariance || e.cost_variance || 0),
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ReallocationHistoryPanel.propTypes = {
  invoiceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  invoiceItemId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  collapsed: PropTypes.bool,
};

export default ReallocationHistoryPanel;
