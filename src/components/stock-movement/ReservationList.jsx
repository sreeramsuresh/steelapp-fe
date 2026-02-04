/**
 * ReservationList Component
 * Phase 6: Stock Reservations
 * Phase 3 Redesign: Standardized filter bar with search input
 *
 * Lists all stock reservations with filtering and actions
 */

import { CheckCircle, Eye, Loader2, Plus, RotateCcw, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RESERVATION_STATUSES, stockMovementService } from "../../services/stockMovementService";
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
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = "KG") => {
  return `${parseFloat(qty || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

/**
 * Get status chip props
 */
const getStatusChip = (status) => {
  const statusInfo = RESERVATION_STATUSES[status] || {
    label: status,
    color: "default",
  };
  return statusInfo;
};

/**
 * Map MUI colors to Tailwind badge colors (Light theme)
 */
const getStatusBadgeClasses = (color) => {
  const colorMap = {
    default: "bg-gray-100 text-gray-700 border-gray-300",
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-teal-50 text-teal-700 border-teal-200",
  };
  return colorMap[color] || colorMap.default;
};

const ReservationList = ({ onCreateNew, onViewReservation }) => {
  const [reservations, setReservations] = useState([]);
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
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [includeExpired, setIncludeExpired] = useState(false);

  // Action dialogs
  const [fulfillDialog, setFulfillDialog] = useState({
    open: false,
    reservation: null,
  });
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    reservation: null,
  });
  const [fulfillQuantity, setFulfillQuantity] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load warehouses for filter dropdown (Bug #71 fix)
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

  // Load reservations
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await stockMovementService.listReservations({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        includeExpired,
        search: searchQuery || undefined,
      });

      // Client-side search filter if API doesn&apos;t support it
      let filteredData = result.data || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (r) =>
            r.reservationNumber?.toLowerCase().includes(query) ||
            r.productName?.toLowerCase().includes(query) ||
            r.productSku?.toLowerCase().includes(query) ||
            r.warehouseName?.toLowerCase().includes(query) ||
            r.notes?.toLowerCase().includes(query)
        );
      }

      setReservations(filteredData);
      setTotalCount(result.pagination?.totalItems || filteredData.length || 0);
    } catch (err) {
      console.error("Error loading reservations:", err);
      setError("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, warehouseFilter, includeExpired, searchQuery]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Handle page change
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open fulfill dialog
  const handleOpenFulfillDialog = (reservation) => {
    setFulfillQuantity(reservation.quantityRemaining.toString());
    setFulfillDialog({ open: true, reservation });
  };

  // Handle fulfill action
  const handleFulfill = async () => {
    if (!fulfillDialog.reservation) return;

    try {
      setActionLoading(true);
      await stockMovementService.fulfillReservation(fulfillDialog.reservation.id, {
        quantity: parseFloat(fulfillQuantity),
      });
      setFulfillDialog({ open: false, reservation: null });
      setFulfillQuantity("");
      loadReservations();
    } catch (err) {
      console.error("Error fulfilling reservation:", err);
      setError(err.message || "Failed to fulfill reservation");
    } finally {
      setActionLoading(false);
    }
  };

  // Open cancel dialog
  const handleOpenCancelDialog = (reservation) => {
    setCancelReason("");
    setCancelDialog({ open: true, reservation });
  };

  // Handle cancel action
  const handleCancel = async () => {
    if (!cancelDialog.reservation) return;

    try {
      setActionLoading(true);
      await stockMovementService.cancelReservation(cancelDialog.reservation.id, cancelReason);
      setCancelDialog({ open: false, reservation: null });
      setCancelReason("");
      loadReservations();
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      setError(err.message || "Failed to cancel reservation");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate fulfillment progress
  const getFulfillmentProgress = (reservation) => {
    const reserved = reservation.quantityReserved || 0;
    const fulfilled = reservation.quantityFulfilled || 0;
    if (reserved === 0) return 0;
    return Math.round((fulfilled / reserved) * 100);
  };

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Warehouse Loading Error (Bug #71 fix) */}
      {warehouseError && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
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
      <div className="rounded-xl border overflow-hidden bg-white border-gray-200 p-4 mb-4">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            />
          </button>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]"
          >
            <option value="">All Status</option>
            {Object.values(RESERVATION_STATUSES).map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          <select
            value={includeExpired ? "yes" : "no"}
            onChange={(e) => {
              setIncludeExpired(e.target.value === "yes");
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]"
          >
            <option value="no">Hide Expired</option>
            <option value="yes">Show Expired</option>
          </select>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Action Buttons */}
          <button
            type="button"
            onClick={loadReservations}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Plus size={18} />
            New Reservation
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-white border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservation #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-teal-500" size={32} />
                    </div>
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No reservations found
                  </td>
                </tr>
              ) : (
                reservations.map((reservation) => {
                  const statusInfo = getStatusChip(reservation.status);
                  const progress = getFulfillmentProgress(reservation);
                  const canFulfill = ["ACTIVE", "PARTIALLY_FULFILLED"].includes(reservation.status);
                  const canCancel = ["ACTIVE", "PARTIALLY_FULFILLED"].includes(reservation.status);

                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{reservation.reservationNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900">{reservation.productName}</div>
                        {reservation.productSku && (
                          <div className="text-xs text-gray-500">{reservation.productSku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{reservation.warehouseName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {formatQuantity(reservation.quantityReserved, reservation.unit)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ minWidth: 150 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${progress === 100 ? "bg-green-500" : "bg-blue-500"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 min-w-[35px] text-right">{progress}%</span>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {formatQuantity(reservation.quantityFulfilled, reservation.unit)} /{" "}
                          {formatQuantity(reservation.quantityReserved, reservation.unit)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(statusInfo.color)}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(reservation.expiryDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(reservation.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewReservation?.(reservation)}
                            title="View"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          >
                            <Eye size={18} />
                          </button>
                          {canFulfill && (
                            <button
                              type="button"
                              onClick={() => handleOpenFulfillDialog(reservation)}
                              title="Fulfill"
                              className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelDialog(reservation)}
                              title="Cancel"
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <X size={18} />
                            </button>
                          )}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="px-2 py-1 rounded border bg-white border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={(e) => handleChangePage(e, page + 1)}
                disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fulfill Dialog */}
      {fulfillDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFulfillDialog({ open: false, reservation: null })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setFulfillDialog({ open: false, reservation: null });
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
          />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fulfill Reservation</h3>
            <div className="space-y-3 mb-6 text-gray-600">
              <p>
                Reservation: <strong className="text-gray-900">{fulfillDialog.reservation?.reservationNumber}</strong>
              </p>
              <p>
                Product: <strong className="text-gray-900">{fulfillDialog.reservation?.productName}</strong>
              </p>
              <p>
                Remaining:{" "}
                <strong className="text-gray-900">
                  {formatQuantity(fulfillDialog.reservation?.quantityRemaining, fulfillDialog.reservation?.unit)}
                </strong>
              </p>
              <div>
                <label htmlFor="fulfill-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Fulfill
                </label>
                <input
                  id="fulfill-quantity"
                  type="number"
                  value={fulfillQuantity}
                  onChange={(e) => setFulfillQuantity(e.target.value)}
                  min={0}
                  max={fulfillDialog.reservation?.quantityRemaining}
                  step={0.01}
                  className="w-full px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max: {fulfillDialog.reservation?.quantityRemaining || 0} {fulfillDialog.reservation?.unit || "KG"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFulfillDialog({ open: false, reservation: null })}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFulfill}
                disabled={actionLoading || !fulfillQuantity || parseFloat(fulfillQuantity) <= 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                {actionLoading && <Loader2 className="animate-spin" size={16} />}
                Fulfill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {cancelDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCancelDialog({ open: false, reservation: null })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setCancelDialog({ open: false, reservation: null });
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
          />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Reservation</h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                Are you sure you want to cancel reservation{" "}
                <strong className="text-gray-900">{cancelDialog.reservation?.reservationNumber}</strong>?
              </p>
              <p className="text-gray-500">
                This will release{" "}
                {formatQuantity(cancelDialog.reservation?.quantityRemaining, cancelDialog.reservation?.unit)} of
                reserved stock.
              </p>
              <div>
                <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="Enter reason for cancellation..."
                  className="w-full px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelDialog({ open: false, reservation: null })}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                {actionLoading && <Loader2 className="animate-spin" size={16} />}
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationList;
