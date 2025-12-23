/**
 * TransferList Component
 * Phase 5: Inter-Warehouse Transfers
 * Phase 3 Redesign: Standardized filter bar with search input
 *
 * Lists all stock transfers with filtering and actions
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Eye,
  Truck,
  Package,
  X,
  RotateCcw,
  Search,
  Loader2,
} from "lucide-react";
import {
  stockMovementService,
  TRANSFER_STATUSES,
} from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";

/**
 * Format date for display
 */
const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date =
    typeof dateValue === "object" && dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue);
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
 * Map MUI colors to Tailwind badge colors
 */
const getStatusBadgeClasses = (color) => {
  const colorMap = {
    default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    primary: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    info: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  };
  return colorMap[color] || colorMap.default;
};

const TransferList = ({ onCreateNew, onViewTransfer }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

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

  // Load warehouses for filter dropdowns
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
      } catch (err) {
        console.error("Error loading warehouses:", err);
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
            (t.transferNumber &&
              t.transferNumber.toLowerCase().includes(query)) ||
            (t.sourceWarehouseName &&
              t.sourceWarehouseName.toLowerCase().includes(query)) ||
            (t.destinationWarehouseName &&
              t.destinationWarehouseName.toLowerCase().includes(query)) ||
            (t.notes && t.notes.toLowerCase().includes(query)),
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
  }, [
    page,
    rowsPerPage,
    statusFilter,
    sourceWarehouseFilter,
    destWarehouseFilter,
    searchQuery,
  ]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
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
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Standardized Filter Bar - Phase 3 Redesign */}
      <div className="rounded-xl border overflow-hidden bg-[#1E2328] border-[#37474F] p-4 mb-4">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]"
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
            className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]"
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
            className="px-3 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]"
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
            onClick={loadTransfers}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Plus size={18} />
            New Transfer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-[#1E2328] border-[#37474F]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-[#37474F]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Transfer #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Shipped
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#37474F]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <Loader2
                        className="animate-spin text-teal-500"
                        size={32}
                      />
                    </div>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => {
                  const statusInfo = getStatusChip(transfer.status);
                  const actions = getAvailableActions(transfer);

                  return (
                    <tr key={transfer.id} className="hover:bg-[#252a30]">
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {transfer.transferNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {transfer.sourceWarehouseName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {transfer.destinationWarehouseName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {transfer.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(statusInfo.color)}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(transfer.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(transfer.shippedDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(transfer.receivedDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-1">
                          {actions.map((action) => {
                            const IconComponent = action.icon;
                            return (
                              <button
                                key={action.type}
                                onClick={() =>
                                  handleActionClick(action.type, transfer)
                                }
                                title={action.label}
                                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#37474F] bg-[#1E2328]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="px-2 py-1 rounded border bg-gray-800 border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {page * rowsPerPage + 1}-
              {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-1">
              <button
                onClick={(e) => handleChangePage(e, page - 1)}
                disabled={page === 0}
                className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                Previous
              </button>
              <button
                onClick={(e) => handleChangePage(e, page + 1)}
                disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                className="px-3 py-1 rounded border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() =>
              setActionDialog({ open: false, type: null, transfer: null })
            }
          />

          {/* Dialog */}
          <div className="relative bg-[#1E2328] border border-[#37474F] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-4">
              {actionDialog.type === "ship" && "Ship Transfer"}
              {actionDialog.type === "receive" && "Receive Transfer"}
              {actionDialog.type === "cancel" && "Cancel Transfer"}
            </h3>

            {/* Content */}
            <div className="mb-6 text-gray-300">
              {actionDialog.type === "ship" && (
                <p>
                  Are you sure you want to ship transfer{" "}
                  <strong className="text-white">
                    {actionDialog.transfer?.transferNumber}
                  </strong>
                  ? This will deduct stock from the source warehouse.
                </p>
              )}
              {actionDialog.type === "receive" && (
                <p>
                  Are you sure you want to receive transfer{" "}
                  <strong className="text-white">
                    {actionDialog.transfer?.transferNumber}
                  </strong>
                  ? This will add stock to the destination warehouse.
                </p>
              )}
              {actionDialog.type === "cancel" && (
                <p>
                  Are you sure you want to cancel transfer{" "}
                  <strong className="text-white">
                    {actionDialog.transfer?.transferNumber}
                  </strong>
                  ?
                  {actionDialog.transfer?.status === "SHIPPED" &&
                    " Stock will be restored to the source warehouse."}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setActionDialog({ open: false, type: null, transfer: null })
                }
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                No, Go Back
              </button>
              <button
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
                {actionLoading && (
                  <Loader2 className="animate-spin" size={16} />
                )}
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
