import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APPROVAL_ACTIONS } from "../config/approvalActions";
import { approvalsHubService } from "../services/approvalsHubService";
import { authService } from "../services/axiosAuthService";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";

// ── Type icon + color map ───────────────────────────────────────────
const TYPE_CONFIG = {
  purchase_order: { short: "PO", color: "blue" },
  supplier_bill: { short: "Bill", color: "purple" },
  grn: { short: "GRN", color: "teal" },
  debit_note: { short: "DN", color: "orange" },
  operating_expense: { short: "OpEx", color: "pink" },
  employee_advance: { short: "Adv", color: "cyan" },
  payroll_run: { short: "Pay", color: "indigo" },
  commission: { short: "Comm", color: "amber" },
};

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "purchase_order", label: "Purchase Orders" },
  { value: "supplier_bill", label: "Supplier Bills" },
  { value: "grn", label: "GRNs" },
  { value: "debit_note", label: "Debit Notes" },
  { value: "operating_expense", label: "Operating Expenses" },
  { value: "employee_advance", label: "Employee Advances" },
  { value: "payroll_run", label: "Payroll Runs" },
  { value: "commission", label: "Commissions" },
];

// ── Status pill ─────────────────────────────────────────────────────
function AgeBadge({ ageDays, isOverdue }) {
  const cls = isOverdue
    ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"
    : ageDays >= 2
      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700"
      : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700";
  return <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}>{ageDays}d</span>;
}

function TypeBadge({ docType }) {
  const cfg = TYPE_CONFIG[docType] || { short: "?", color: "gray" };
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${colors[cfg.color]}`}>{cfg.short}</span>
  );
}

// ── Confirm Dialog ──────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, warning, onConfirm, onCancel, actionLabel, isDanger }) {
  const [comment, setComment] = useState("");

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        {warning && (
          <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{warning}</p>
          </div>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <textarea
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 mb-4"
          rows={3}
          placeholder="Add a comment (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(comment);
              setComment("");
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ───────────────────────────────────────────────────
function DetailDrawer({ open, detail, loading, onClose, onAction, actionLoading }) {
  const [comment, setComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const navigate = useNavigate();

  if (!open) return null;

  const handleAddComment = async () => {
    if (!comment.trim() || !detail) return;
    setAddingComment(true);
    try {
      await approvalsHubService.addComment(detail.document.docType, detail.document.docId, comment.trim());
      setComment("");
      // Refresh detail
      onAction("refresh");
    } catch {
      // Error handled by parent
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 border-none cursor-default"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            {detail && (
              <>
                <div className="flex items-center gap-2">
                  <TypeBadge docType={detail.document.docType} />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {detail.document.docNumber || `#${detail.document.docId}`}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{detail.document.displayLabel}</p>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : detail ? (
          <div className="px-6 py-4 space-y-6">
            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Amount</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(detail.document.amount)}{" "}
                  <span className="text-sm font-normal">{detail.document.currency}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Status</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {detail.document.status}
                </p>
              </div>
              {detail.document.counterpartyName && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {detail.document.counterpartyType === "employee" ? "Employee" : "Supplier"}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{detail.document.counterpartyName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Requested By</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{detail.document.requestedByName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Date</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(detail.document.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Age</p>
                <AgeBadge ageDays={detail.document.ageDays} isOverdue={detail.document.isOverdue} />
              </div>
            </div>

            {/* Open Full Document */}
            {detail.document.documentUrl && (
              <button
                type="button"
                onClick={() => navigate(detail.document.documentUrl)}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> Open Full Document
              </button>
            )}

            {/* Line Items */}
            {detail.lineItems && detail.lineItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Line Items</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Product
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Rate
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Amount
                        </th>
                        {detail.showCostData && (
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Margin%
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {detail.lineItems.map((li) => (
                        <tr key={li.id} className="bg-white dark:bg-gray-800">
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            {li.productName || "—"}
                            {li.grade && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({li.grade})</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                            {li.quantity} {li.uom}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(li.rate)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(li.amount)}
                          </td>
                          {detail.showCostData && (
                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                              {li.marginPercent != null ? (
                                <span
                                  className={
                                    li.marginPercent < 0
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-green-600 dark:text-green-400"
                                  }
                                >
                                  {li.marginPercent}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approval Trail */}
            {detail.approvalTrail && detail.approvalTrail.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Approval Trail</h3>
                <div className="space-y-2">
                  {detail.approvalTrail.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          entry.action === "approve"
                            ? "bg-green-500"
                            : entry.action === "reject"
                              ? "bg-red-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-gray-100">
                          <span className="font-medium">{entry.actorName}</span>{" "}
                          <span className="capitalize">
                            {entry.action === "comment" ? "commented" : `${entry.action}d`}
                          </span>
                          {entry.oldStatus && entry.newStatus && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {" "}
                              ({entry.oldStatus} → {entry.newStatus})
                            </span>
                          )}
                        </p>
                        {entry.comment && (
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5 italic">"{entry.comment}"</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(entry.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comment Input */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Add Comment</h3>
              <div className="flex gap-2">
                <textarea
                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  rows={2}
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!comment.trim() || addingComment}
                  className="self-end px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Approve/Reject Buttons */}
            {(detail.canApprove || detail.canReject) && (
              <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                {detail.canApprove && (
                  <button
                    type="button"
                    onClick={() => onAction("approve")}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                {detail.canReject && (
                  <button
                    type="button"
                    onClick={() => onAction("reject")}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            Failed to load document details
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
const ApprovalsHub = () => {
  // Permission check
  const canView =
    authService.hasPermission("approvals", "read") ||
    authService.hasRole(["admin", "managing_director", "finance_manager", "operations_manager"]);

  // State
  const [summary, setSummary] = useState({ counts: {}, total: 0, overdue: 0, highValue: 0 });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [filters, setFilters] = useState({
    type: "",
    search: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef(null);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    warning: null,
    action: null,
    isDanger: false,
    actionLabel: "",
  });

  // ── Data fetching ─────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const result = await approvalsHubService.getSummary();
      setSummary(result);
    } catch (err) {
      console.error("Failed to fetch approval summary:", err);
    }
  }, []);

  const fetchList = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = { page, limit: pagination.limit };
        if (filters.type) params.type = filters.type;
        if (filters.search) params.search = filters.search;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.amountMin) params.amountMin = filters.amountMin;
        if (filters.amountMax) params.amountMax = filters.amountMax;
        const result = await approvalsHubService.getList(params);
        setItems(result.items || []);
        setPagination((prev) => ({ ...prev, page: result.page, total: result.total }));
      } catch (err) {
        console.error("Failed to fetch approvals:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchList(pagination.page)]);
    setRefreshing(false);
  }, [fetchSummary, fetchList, pagination.page]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    fetchSummary();
    fetchList(1);
  }, []);

  // Debounced search
  const handleSearchChange = (value) => {
    setFilters((f) => ({ ...f, search: value }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchList(1), 400);
  };

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const applyFilters = () => fetchList(1);

  // ── Detail drawer ─────────────────────────────────────────────────
  const openDetail = async (item) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const result = await approvalsHubService.getDetail(item.docType, item.docId);
      setDetail(result);
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDrawerAction = async (action) => {
    if (!detail) return;
    const { docType, docId } = detail.document;

    if (action === "refresh") {
      setDetailLoading(true);
      try {
        const result = await approvalsHubService.getDetail(docType, docId);
        setDetail(result);
      } catch {
        // ignore
      } finally {
        setDetailLoading(false);
      }
      return;
    }

    // High-impact confirmation
    if (detail.highImpact && action === "approve") {
      setConfirmDialog({
        open: true,
        title: `Approve ${detail.document.displayLabel}`,
        message: `Are you sure you want to approve ${detail.document.docNumber || `#${docId}`}?`,
        warning: detail.highImpactWarning,
        action: "approve",
        isDanger: false,
        actionLabel: "Approve",
      });
      return;
    }

    if (action === "reject") {
      setConfirmDialog({
        open: true,
        title: `Reject ${detail.document.displayLabel}`,
        message: `Are you sure you want to reject ${detail.document.docNumber || `#${docId}`}?`,
        warning: null,
        action: "reject",
        isDanger: true,
        actionLabel: "Reject",
      });
      return;
    }

    // Non-high-impact approve — execute directly
    await executeAction(action);
  };

  const executeAction = async (action, comment) => {
    if (!detail) return;
    const { docType, docId } = detail.document;
    const actionFn = APPROVAL_ACTIONS[docType]?.[action];
    if (!actionFn) return;

    setActionLoading(true);
    try {
      await actionFn(docId, { comment });
      setDrawerOpen(false);
      setDetail(null);
      await refresh();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      alert(`Failed to ${action}: ${err?.response?.data?.message || err.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = (comment) => {
    setConfirmDialog((d) => ({ ...d, open: false }));
    executeAction(confirmDialog.action, comment);
  };

  // ── Inline approve/reject (table row buttons) ─────────────────────
  const handleInlineAction = (item, action) => {
    if (item.highImpact && action === "approve") {
      setConfirmDialog({
        open: true,
        title: `Approve ${item.displayLabel}`,
        message: `Are you sure you want to approve ${item.docNumber || `#${item.docId}`}?`,
        warning: item.highImpactWarning,
        action: "inline-approve",
        isDanger: false,
        actionLabel: "Approve",
      });
      // Store the item for the inline handler
      setConfirmDialog((d) => ({ ...d, _item: item }));
      return;
    }
    if (action === "reject") {
      setConfirmDialog({
        open: true,
        title: `Reject ${item.displayLabel}`,
        message: `Are you sure you want to reject ${item.docNumber || `#${item.docId}`}?`,
        warning: null,
        action: "inline-reject",
        isDanger: true,
        actionLabel: "Reject",
      });
      setConfirmDialog((d) => ({ ...d, _item: item }));
      return;
    }
    // Direct approve (non-high-impact)
    executeInlineAction(item, action);
  };

  const executeInlineAction = async (item, action, comment) => {
    const actionFn = APPROVAL_ACTIONS[item.docType]?.[action];
    if (!actionFn) return;
    setActionLoading(true);
    try {
      await actionFn(item.docId, { comment });
      await refresh();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      alert(`Failed to ${action}: ${err?.response?.data?.message || err.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInlineConfirm = (comment) => {
    const item = confirmDialog._item;
    const action = confirmDialog.action === "inline-approve" ? "approve" : "reject";
    setConfirmDialog((d) => ({ ...d, open: false }));
    if (item) executeInlineAction(item, action, comment);
  };

  // ── Access denied ─────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You don't have permission to view the Approvals Hub.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Approvals Hub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and approve pending requests across all modules
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Total Pending</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <p className="text-xs text-red-500 dark:text-red-400 uppercase font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Overdue
          </p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{summary.overdue}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-medium">High Value (&gt;50K)</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary.highValue}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">By Type</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(summary.counts || {}).map(
              ([type, count]) =>
                count > 0 && (
                  <span key={type} className="flex items-center gap-1 text-xs">
                    <TypeBadge docType={type} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{count}</span>
                  </span>
                )
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Type filter */}
          <select
            value={filters.type}
            onChange={(e) => {
              handleFilterChange("type", e.target.value);
              setTimeout(() => fetchList(1), 0);
            }}
            className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search doc#, counterparty, requester..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Toggle advanced filters */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border ${
              showFilters
                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-end gap-3 flex-wrap">
            <div>
              <label htmlFor="approvals-date-from" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Date From
              </label>
              <input
                id="approvals-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="approvals-date-to" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Date To
              </label>
              <input
                id="approvals-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="approvals-amount-min" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Min Amount
              </label>
              <input
                id="approvals-amount-min"
                type="number"
                value={filters.amountMin}
                onChange={(e) => handleFilterChange("amountMin", e.target.value)}
                placeholder="0"
                className="w-28 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="approvals-amount-max" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Max Amount
              </label>
              <input
                id="approvals-amount-max"
                type="number"
                value={filters.amountMax}
                onChange={(e) => handleFilterChange("amountMax", e.target.value)}
                placeholder="999999"
                className="w-28 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              type="button"
              onClick={applyFilters}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <ClipboardCheck className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">No pending approvals</p>
            <p className="text-sm mt-1">All caught up! Check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Doc #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Counterparty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Requested By
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Age
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr
                    key={`${item.docType}-${item.docId}`}
                    onClick={() => openDetail(item)}
                    onKeyDown={(e) => e.key === "Enter" && openDetail(item)}
                    tabIndex={0}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <TypeBadge docType={item.docType} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.docNumber || `#${item.docId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {item.counterpartyName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.requestedByName}</td>
                    <td className="px-4 py-3 text-center">
                      <AgeBadge ageDays={item.ageDays} isOverdue={item.isOverdue} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="toolbar"
                      >
                        {item.canApprove && (
                          <button
                            type="button"
                            onClick={() => handleInlineAction(item, "approve")}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {item.canReject && (
                          <button
                            type="button"
                            onClick={() => handleInlineAction(item, "reject")}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchList(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                {pagination.page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => fetchList(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        detail={detail}
        loading={detailLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDetail(null);
        }}
        onAction={handleDrawerAction}
        actionLoading={actionLoading}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        warning={confirmDialog.warning}
        actionLabel={confirmDialog.actionLabel}
        isDanger={confirmDialog.isDanger}
        onCancel={() => setConfirmDialog((d) => ({ ...d, open: false }))}
        onConfirm={(comment) => {
          if (confirmDialog.action?.startsWith("inline-")) {
            handleInlineConfirm(comment);
          } else {
            handleConfirm(comment);
          }
        }}
      />
    </div>
  );
};

export default ApprovalsHub;
