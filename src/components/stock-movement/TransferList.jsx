/**
 * TransferList Component
 * Phase 5: Inter-Warehouse Transfers
 * Phase 3 Redesign: Standardized filter bar with search input
 *
 * Lists all stock transfers with filtering and actions
 */

import { Eye, Loader2, Package, Plus, RotateCcw, Search, Truck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { stockMovementService, TRANSFER_STATUSES } from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";

/**
 * Format date for display
 */
const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date =
    typeof dateValue === "object" && dateValue.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Get status chip props
 */
const getStatusChip = (status) => {
  const statusInfo = TRANSFER_STATUSES[status] || {
    label: status,
    color: "default",
  };
  return statusInfo;
};

/**
 * Map MUI colors to Tailwind badge colors (Light theme)
 */
const getStatusBadgeClasses = (color, isDarkMode) => {
  const colorMap = isDarkMode
    ? {
        default: "bg-gray-700 text-gray-300 border-gray-600",
        primary: "bg-blue-900/20 text-blue-300 border-blue-700",
        success: "bg-green-900/20 text-green-300 border-green-700",
        warning: "bg-yellow-900/20 text-yellow-300 border-yellow-700",
        error: "bg-red-900/20 text-red-300 border-red-700",
        info: "bg-teal-900/20 text-teal-300 border-teal-700",
      }
    : {
        default: "bg-gray-100 text-gray-700 border-gray-300",
        primary: "bg-blue-50 text-blue-700 border-blue-200",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
        error: "bg-red-50 text-red-700 border-red-200",
        info: "bg-teal-50 text-teal-700 border-teal-200",
      };
  return colorMap[color] || colorMap.default;
};

const TransferList = ({ onCreateNew, onViewTransfer }) => {
  const { isDarkMode } = useTheme();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseError, setWarehouseError] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState("");
  const [destWarehouseFilter, setDestWarehouseFilter] = useState("");

  // Action dialogs
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null,
    transfer: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Load warehouses for filter dropdowns (Bug #67 fix)
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setWarehouseError(null);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
      } catch (err) {
        console.error("Error loading warehouses:", err);
        setWarehouseError("Failed to load warehouses. Some filters may not be available.");
      }
    };
    loadWarehouses();
  }, []);

  // Load transfers
  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await stockMovementService.listTransfers({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        sourceWarehouseId: sourceWarehouseFilter || undefined,
        destinationWarehouseId: destWarehouseFilter || undefined,
        search: searchQuery || undefined,
      });

      // Client-side search filter if API doesn&apos;t support it
      let filteredData = result.data || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (t) =>
            t.transferNumber?.toLowerCase().includes(query) ||
            t.sourceWarehouseName?.toLowerCase().includes(query) ||
            t.destinationWarehouseName?.toLowerCase().includes(query) ||
            t.notes?.toLowerCase().includes(query)
        );
      }

      setTransfers(filteredData);
      setTotalCount(result.pagination?.totalItems || filteredData.length || 0);
    } catch (err) {
      console.error("Error loading transfers:", err);
      setError("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, sourceWarehouseFilter, destWarehouseFilter, searchQuery]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  // Handle page change
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle ship action
  const handleShip = async () => {
    if (!actionDialog.transfer) return;

    try {
      setActionLoading(true);
      await stockMovementService.shipTransfer(actionDialog.transfer.id);
      setActionDialog({ open: false, type: null, transfer: null });
      loadTransfers();
    } catch (err) {
      console.error("Error shipping transfer:", err);
      setError(err.message || "Failed to ship transfer");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle receive action
  const handleReceive = async () => {
    if (!actionDialog.transfer) return;

    try {
      setActionLoading(true);
      await stockMovementService.receiveTransfer(actionDialog.transfer.id);
      setActionDialog({ open: false, type: null, transfer: null });
      loadTransfers();
    } catch (err) {
      console.error("Error receiving transfer:", err);
      setError(err.message || "Failed to receive transfer");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = async () => {
    if (!actionDialog.transfer) return;

    try {
      setActionLoading(true);
      await stockMovementService.cancelTransfer(actionDialog.transfer.id);
      setActionDialog({ open: false, type: null, transfer: null });
      loadTransfers();
    } catch (err) {
      console.error("Error cancelling transfer:", err);
      setError(err.message || "Failed to cancel transfer");
    } finally {
      setActionLoading(false);
    }
  };

  // Get available actions for a transfer
  const getAvailableActions = (transfer) => {
    const actions = [];

    actions.push({ type: "view", label: "View", icon: Eye });

    if (transfer.status === "DRAFT" || transfer.status === "PENDING") {
      actions.push({ type: "ship", label: "Ship", icon: Truck });
      actions.push({ type: "cancel", label: "Cancel", icon: X });
    }

    if (transfer.status === "SHIPPED" || transfer.status === "IN_TRANSIT") {
      actions.push({
        type: "receive",
        label: "Receive",
        icon: Package,
      });
      actions.push({ type: "cancel", label: "Cancel", icon: X });
    }

    return actions;
  };

  // Handle action click
  const handleActionClick = (type, transfer) => {
    if (type === "view") {
      onViewTransfer?.(transfer);
      return;
    }

    setActionDialog({ open: true, type, transfer });
  };

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className={isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Warehouse Loading Error (Bug #67 fix) */}
      {warehouseError && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${isDarkMode ? "bg-yellow-900/20 border-yellow-700 text-yellow-300" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}
        >
          <span>{warehouseError}</span>
          <button
            type="button"
            onClick={() => setWarehouseError(null)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Standardized Filter Bar - Phase 3 Redesign */}
      <div
        className={`rounded-xl border overflow-hidden p-4 mb-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="flex gap-4 flex-wrap items-center">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className={`px-3 py-2 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]`}
          >
            <option value="">All Status</option>
            {Object.values(TRANSFER_STATUSES).map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={sourceWarehouseFilter}
            onChange={(e) => {
              setSourceWarehouseFilter(e.target.value);
              setPage(0);
            }}
            className={`px-3 py-2 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]`}
          >
            <option value="">All Sources</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          <select
            value={destWarehouseFilter}
            onChange={(e) => {
              setDestWarehouseFilter(e.target.value);
              setPage(0);
            }}
            className={`px-3 py-2 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]`}
          >
            <option value="">All Destinations</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Action Buttons */}
          <button
            type="button"
            onClick={loadTransfers}
            disabled={loading}
            title="Refresh"
            className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"}`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Plus size={18} />
            New Transfer
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={isDarkMode ? "bg-gray-700 border-b border-gray-600" : "bg-gray-50 border-b border-gray-200"}
            >
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipped
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-teal-500" size={32} />
                    </div>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => {
                  const statusInfo = getStatusChip(transfer.status);
                  const actions = getAvailableActions(transfer);

                  return (
                    <tr key={transfer.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {transfer.transferNumber}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {transfer.sourceWarehouseName || "-"}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {transfer.destinationWarehouseName || "-"}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {transfer.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(statusInfo.color, isDarkMode)}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {formatDate(transfer.createdAt)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {formatDate(transfer.shippedDate)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {formatDate(transfer.receivedDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-1">
                          {actions.map((action) => {
                            const IconComponent = action.icon;
                            return (
                              <button
                                type="button"
                                key={action.type}
                                onClick={() => handleActionClick(action.type, transfer)}
                                title={action.label}
                                className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
                              >
                                <IconComponent size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className={`px-2 py-1 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {totalCount === 0
                ? "0 of 0"
                : `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalCount)} of ${totalCount}`}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={(e) => handleChangePage(e, page - 1)}
                disabled={page === 0}
                className={`px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"}`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={(e) => handleChangePage(e, page + 1)}
                disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                className={`px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      {actionDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setActionDialog({ open: false, type: null, transfer: null })}
            aria-label="Close dialog"
          />

          {/* Dialog */}
          <div
            className={`relative rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {/* Title */}
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {actionDialog.type === "ship" && "Ship Transfer"}
              {actionDialog.type === "receive" && "Receive Transfer"}
              {actionDialog.type === "cancel" && "Cancel Transfer"}
            </h3>

            {/* Content */}
            <div className="mb-6 text-gray-600">
              {actionDialog.type === "ship" && (
                <p>
                  Are you sure you want to ship transfer{" "}
                  <strong className="text-gray-900">{actionDialog.transfer?.transferNumber}</strong>? This will deduct
                  stock from the source warehouse.
                </p>
              )}
              {actionDialog.type === "receive" && (
                <p>
                  Are you sure you want to receive transfer{" "}
                  <strong className="text-gray-900">{actionDialog.transfer?.transferNumber}</strong>? This will add
                  stock to the destination warehouse.
                </p>
              )}
              {actionDialog.type === "cancel" && (
                <p>
                  Are you sure you want to cancel transfer{" "}
                  <strong className="text-gray-900">{actionDialog.transfer?.transferNumber}</strong>?
                  {actionDialog.transfer?.status === "SHIPPED" && " Stock will be restored to the source warehouse."}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionDialog({ open: false, type: null, transfer: null })}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"}`}
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (actionDialog.type === "ship") handleShip();
                  else if (actionDialog.type === "receive") handleReceive();
                  else if (actionDialog.type === "cancel") handleCancel();
                }}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionDialog.type === "cancel"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {actionLoading && <Loader2 className="animate-spin" size={16} />}
                {actionDialog.type === "ship" && "Yes, Ship"}
                {actionDialog.type === "receive" && "Yes, Receive"}
                {actionDialog.type === "cancel" && "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferList;
