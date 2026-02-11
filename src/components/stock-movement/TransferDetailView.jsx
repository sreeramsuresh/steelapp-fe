/**
 * TransferDetailView Component
 * Shows full details of a warehouse transfer including line items,
 * timeline, shipping info, and associated stock movements.
 */

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { stockMovementService } from "../../services/stockMovementService";

const statusConfig = {
  DRAFT: { color: "gray", label: "Draft" },
  PENDING: { color: "yellow", label: "Pending" },
  SHIPPED: { color: "blue", label: "Shipped" },
  IN_TRANSIT: { color: "blue", label: "In Transit" },
  RECEIVED: { color: "green", label: "Received" },
  COMPLETED: { color: "green", label: "Completed" },
  CANCELLED: { color: "red", label: "Cancelled" },
};

const TransferDetailView = ({ transfer, onBack }) => {
  const { isDarkMode } = useTheme();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      if (!transfer?.id) return;
      setLoading(true);
      try {
        const response = await stockMovementService.getAllMovements({
          referenceType: "TRANSFER",
          limit: 100,
        });
        const transferMovements = (response.data || []).filter(
          (m) => m.transferId === transfer.id || m.referenceNumber === transfer.transferNumber,
        );
        setMovements(transferMovements);
      } catch (error) {
        console.error("Failed to fetch transfer movements:", error);
        setMovements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, [transfer?.id, transfer?.transferNumber]);

  if (!transfer) return null;

  const outMovements = movements.filter((m) => m.movementType === "TRANSFER_OUT" || m.movementType === "OUT");
  const inMovements = movements.filter((m) => m.movementType === "TRANSFER_IN" || m.movementType === "IN");
  const displayItems = outMovements.length > 0 ? outMovements : inMovements;

  const totalQuantity = displayItems.reduce((sum, m) => sum + (m.quantity || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (statusKey) => {
    const cfg = statusConfig[statusKey] || statusConfig.DRAFT;
    const colors = {
      gray: isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700",
      yellow: isDarkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700",
      blue: isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700",
      green: isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700",
      red: isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[cfg.color]}`}>
        {cfg.label}
      </span>
    );
  };

  const cardClass = `rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`;
  const labelClass = `text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`;
  const valueClass = isDarkMode ? "text-white" : "text-gray-900";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className={`text-xl font-semibold ${valueClass}`}>{transfer.transferNumber}</h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Created {formatDate(transfer.createdAt)}
            </p>
          </div>
        </div>
        {getStatusBadge(transfer.status)}
      </div>

      {/* Transfer Route Card */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${isDarkMode ? "bg-orange-900/30" : "bg-orange-100"}`}>
              <MapPin className={`w-6 h-6 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
            </div>
            <p className={`font-medium ${valueClass}`}>{transfer.sourceWarehouseName || "Source Warehouse"}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Source</p>
          </div>
          <div className="flex-shrink-0 px-6">
            <ArrowRight className={`w-8 h-8 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
          </div>
          <div className="flex-1 text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}>
              <MapPin className={`w-6 h-6 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            </div>
            <p className={`font-medium ${valueClass}`}>{transfer.destinationWarehouseName || "Destination Warehouse"}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Destination</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transfer Info */}
        <div className={`${cardClass} p-5`}>
          <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Transfer Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={labelClass}>Transfer Date</span>
              <span className={valueClass}>{formatDate(transfer.transferDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className={labelClass}>Total Items</span>
              <span className={valueClass}>{displayItems.length} products</span>
            </div>
            <div className="flex justify-between">
              <span className={labelClass}>Total Quantity</span>
              <span className={`font-medium ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                {Math.abs(totalQuantity).toLocaleString()} {displayItems[0]?.unit || "KG"}
              </span>
            </div>
            {transfer.notes && (
              <div>
                <span className={labelClass}>Notes</span>
                <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{transfer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className={`${cardClass} p-5`}>
          <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Timeline
          </h3>
          <div className="space-y-4">
            <TimelineStep
              icon={<Clock className="w-4 h-4" />}
              label="Created"
              date={formatDate(transfer.createdAt)}
              completed={true}
              isDarkMode={isDarkMode}
            />
            <TimelineStep
              icon={<Truck className="w-4 h-4" />}
              label="Shipped"
              date={formatDate(transfer.shippedDate)}
              completed={!!transfer.shippedDate}
              isDarkMode={isDarkMode}
            />
            <TimelineStep
              icon={<CheckCircle className="w-4 h-4" />}
              label="Received"
              date={formatDate(transfer.receivedDate)}
              completed={!!transfer.receivedDate}
              isDarkMode={isDarkMode}
            />
            {transfer.status === "CANCELLED" && (
              <TimelineStep
                icon={<XCircle className="w-4 h-4" />}
                label="Cancelled"
                date={formatDate(transfer.updatedAt)}
                completed={true}
                isCancelled={true}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>
      </div>

      {/* Shipping Info (if available) */}
      {(transfer.vehicleNumber || transfer.driverName) && (
        <div className={`${cardClass} p-5`}>
          <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Shipping Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {transfer.vehicleNumber && (
              <div>
                <span className={labelClass}>Vehicle Number</span>
                <p className={valueClass}>{transfer.vehicleNumber}</p>
              </div>
            )}
            {transfer.driverName && (
              <div>
                <span className={labelClass}>Driver</span>
                <p className={valueClass}>{transfer.driverName}</p>
              </div>
            )}
            {transfer.driverPhone && (
              <div>
                <span className={labelClass}>Driver Phone</span>
                <p className={valueClass}>{transfer.driverPhone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-gray-700/50">
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            <Package className="w-4 h-4 inline mr-2" />
            Transfer Items ({displayItems.length})
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className={`w-6 h-6 mx-auto animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
            <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading items...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-8 text-center">
            <Package className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              No item records found for this transfer
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                  <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Product
                  </th>
                  <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Type
                  </th>
                  <th className={`px-5 py-3 text-right text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Quantity
                  </th>
                  <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Unit
                  </th>
                  <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Batch
                  </th>
                  <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Movement
                  </th>
                  <th className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {displayItems.map((item) => (
                  <tr key={item.id} className={isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}>
                    <td className="px-5 py-3">
                      <p className={`font-medium ${valueClass}`}>{item.productName || "N/A"}</p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>PID-{item.productId}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                        {item.productType || "-"}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {Math.abs(item.quantity || 0).toLocaleString()}
                    </td>
                    <td className={`px-5 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {item.unit || "KG"}
                    </td>
                    <td className={`px-5 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {item.batchNumber || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          item.movementType?.includes("IN")
                            ? isDarkMode
                              ? "bg-green-900/30 text-green-400"
                              : "bg-green-100 text-green-700"
                            : isDarkMode
                              ? "bg-orange-900/30 text-orange-400"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {item.movementType?.includes("IN") ? "Received" : "Dispatched"}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatDate(item.movementDate || item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={isDarkMode ? "bg-gray-800/50" : "bg-gray-50"}>
                  <td colSpan={2} className={`px-5 py-3 font-medium ${valueClass}`}>
                    Total
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                    {Math.abs(totalQuantity).toLocaleString()}
                  </td>
                  <td className={`px-5 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {displayItems[0]?.unit || "KG"}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineStep = ({ icon, label, date, completed, isCancelled, isDarkMode }) => {
  const dotColor = isCancelled
    ? "bg-red-500"
    : completed
      ? "bg-teal-500"
      : isDarkMode
        ? "bg-gray-600"
        : "bg-gray-300";

  const textColor = completed
    ? isDarkMode
      ? "text-white"
      : "text-gray-900"
    : isDarkMode
      ? "text-gray-500"
      : "text-gray-400";

  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${dotColor} text-white`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>{label}</p>
        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{date}</p>
      </div>
    </div>
  );
};

export default TransferDetailView;
