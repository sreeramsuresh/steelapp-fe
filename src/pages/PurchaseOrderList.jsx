import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import PurchaseOrderPreview from "../components/purchase-orders/PurchaseOrderPreview";
import { NewBadge } from "../components/shared";
import { useTheme } from "../contexts/ThemeContext";
import { useApiData } from "../hooks/useApi";
import { useConfirm } from "../hooks/useConfirm";
import { authService } from "../services/axiosAuthService";
import { companyService } from "../services/companyService";
import { notificationService } from "../services/notificationService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { validatePurchaseOrderForDownload } from "../utils/recordUtils";

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Initialize state
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [showPreview, setShowPreview] = useState(false);
  const [previewPO, setPreviewPO] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  const getStatusBadge = (status = "draft") => {
    const statusConfig = {
      draft: {
        className: isDarkMode
          ? "bg-gray-900/30 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-800 border-gray-300",
        label: "DRAFT",
      },
      pending: {
        className: isDarkMode
          ? "bg-orange-900/30 text-orange-300 border-orange-600"
          : "bg-orange-100 text-orange-800 border-orange-300",
        label: "PENDING",
      },
      confirmed: {
        className: isDarkMode
          ? "bg-blue-900/30 text-blue-300 border-blue-600"
          : "bg-blue-100 text-blue-800 border-blue-300",
        label: "CONFIRMED",
      },
      received: {
        className: isDarkMode
          ? "bg-green-900/30 text-green-300 border-green-600"
          : "bg-green-100 text-green-800 border-green-300",
        label: "RECEIVED",
      },
      cancelled: {
        className: isDarkMode ? "bg-red-900/30 text-red-300 border-red-600" : "bg-red-100 text-red-800 border-red-300",
        label: "CANCELLED",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Show completion from status, and true transit from stock_status; otherwise show RETAIN
  const getTransitStatusBadge = (po) => {
    const key = po?.status === "received" ? "completed" : po?.stockStatus === "transit" ? "in_transit" : "retain";

    const transitConfig = {
      in_transit: {
        className: isDarkMode
          ? "bg-yellow-900/30 text-yellow-300 border-yellow-600"
          : "bg-yellow-100 text-yellow-800 border-yellow-300",
        label: "IN TRANSIT",
      },
      completed: {
        className: isDarkMode
          ? "bg-green-900/30 text-green-300 border-green-600"
          : "bg-green-100 text-green-800 border-green-300",
        label: "COMPLETED",
      },
      retain: {
        className: isDarkMode
          ? "bg-gray-800/40 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-700 border-gray-300",
        label: "RETAIN",
      },
    };

    const config = transitConfig[key] || transitConfig.retain;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Debounce search - wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
      };

      const response = await purchaseOrderService.getAll(params);

      // Handle different response formats
      let orders = [];
      let total = 0;

      if (Array.isArray(response)) {
        // Direct array response
        orders = response;
        total = response.length;
      } else if (response.data && Array.isArray(response.data)) {
        // Paginated response with data array
        orders = response.data;
        total = response.total || response.data.length;
      } else if (response.purchaseOrders && Array.isArray(response.purchaseOrders)) {
        // Response with purchase_orders array
        orders = response.purchaseOrders;
        total = response.total || response.purchaseOrders.length;
      }

      const calculatedTotalPages = Math.ceil(total / 10);
      setPurchaseOrders(orders);
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch purchase orders";
      setError(errorMessage);
      notificationService.error(errorMessage);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const { data: company } = useApiData(companyService.getCompany, [], true);

  // Preview handler
  const handlePreview = (po) => {
    setPreviewPO(po);
    setShowPreview(true);
  };

  // Download handler with validation
  const handleDownloadPDF = async (po) => {
    // Validate before download
    const validation = validatePurchaseOrderForDownload(po);
    if (!validation.isValid) {
      notificationService.error(`Cannot download: ${validation.warnings.join(", ")}`);
      return;
    }

    // Set loading state
    setDownloadingIds((prev) => new Set([...prev, po.id]));

    try {
      // Use backend PDF generation only (per PDF_WORKFLOW.md)
      await purchaseOrderService.downloadPDF(po.id);
      notificationService.success("PDF downloaded successfully");
    } catch (_err) {
      notificationService.error("Failed to download PDF");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(po.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete Purchase Order?",
      message: "Are you sure you want to delete this purchase order? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (confirmed) {
      try {
        await purchaseOrderService.delete(id);
        notificationService.success("Purchase order deleted successfully");
        fetchPurchaseOrders();
      } catch (_err) {
        notificationService.error("Failed to delete purchase order");
      }
    }
  };

  if (loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading purchase orders...</span>
        </div>
      </div>
    );
  }

  if (purchaseOrders.length === 0 && !loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
          }`}
        >
          <ShoppingCart size={64} className="mx-auto mb-4 opacity-50" />
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            No Purchase Orders Yet
          </h2>
          <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Create your first purchase order to start tracking procurement
          </p>
          <Link
            to="/app/purchase-orders/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            Create Purchase Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              🛒 Purchase Orders
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage and track all your purchase orders
            </p>
          </div>
          {authService.hasPermission("purchase_orders", "create") && (
            <Link
              to="/app/purchase-orders/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Plus size={18} />
              Create PO
            </Link>
          )}
        </div>

        {/* Filters Section */}
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <div className="flex-grow min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search purchase orders"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
          <div className="min-w-[150px] relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  PO Number
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Supplier
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Items
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Total
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Transit Status
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-6 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {debouncedSearch || statusFilter !== "all"
                      ? "No purchase orders match your filters. Try adjusting your search or status filter."
                      : "No purchase orders found"}
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr
                    key={po.id}
                    className={`${isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"} transition-colors cursor-pointer`}
                    onClick={() => navigate(`/app/purchases/po/${po.id}/overview`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {po.poNumber}
                        <NewBadge createdAt={po.createdAt} hoursThreshold={2} />
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {po.supplierName || po.supplierDetails?.name || po.supplierDetails?.companyName || "-"}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {formatDate(po.poDate)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {po.items?.length || 0} items
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatCurrency(
                        po.total || po.subtotal || po.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
                        po.currency
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(po.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTransitStatusBadge(po)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {authService.hasPermission("purchase_orders", "read") && (
                          <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? "hover:bg-gray-700 text-blue-400" : "hover:bg-gray-100 text-blue-600"
                            }`}
                            onClick={() => handlePreview(po)}
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {authService.hasPermission("purchase_orders", "update") && (
                          <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? "hover:bg-gray-700 text-teal-400" : "hover:bg-gray-100 text-teal-600"
                            }`}
                            onClick={() => navigate(`/app/purchase-orders/${po.id}/edit`)}
                            title="Legacy Edit"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {authService.hasPermission("purchase_orders", "read") && (
                          <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${
                              downloadingIds.has(po.id)
                                ? "opacity-50 cursor-not-allowed"
                                : isDarkMode
                                  ? "hover:bg-gray-700 text-green-400"
                                  : "hover:bg-gray-100 text-green-600"
                            }`}
                            onClick={() => handleDownloadPDF(po)}
                            disabled={downloadingIds.has(po.id)}
                            title="Download PDF"
                          >
                            {downloadingIds.has(po.id) ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        )}
                        {authService.hasPermission("purchase_orders", "delete") && (
                          <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? "hover:bg-gray-700 text-red-400" : "hover:bg-gray-100 text-red-600"
                            }`}
                            onClick={() => handleDelete(po.id)}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`p-2 rounded transition-colors ${
                  page === 1
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded transition-colors ${
                  page === totalPages
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className={`ml-2 ${isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isDarkMode
                ? "bg-green-900/20 border-green-700 text-green-300"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className={`ml-2 ${isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"}`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Preview Modal */}
      {showPreview && previewPO && (
        <PurchaseOrderPreview
          purchaseOrder={previewPO}
          company={company || {}}
          onClose={() => {
            setShowPreview(false);
            setPreviewPO(null);
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrderList;
