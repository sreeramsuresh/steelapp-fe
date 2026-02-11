/**
 * ReservationDetailView Component
 * Shows full details of a stock reservation including product info,
 * quantities, status, timeline, and reference details.
 */

import { ArrowLeft, Bookmark, Calendar, CheckCircle, Clock, Package, XCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const statusConfig = {
  ACTIVE: { color: "blue", label: "Active" },
  FULFILLED: { color: "green", label: "Fulfilled" },
  PARTIALLY_FULFILLED: { color: "yellow", label: "Partially Fulfilled" },
  EXPIRED: { color: "red", label: "Expired" },
  CANCELLED: { color: "red", label: "Cancelled" },
};

const ReservationDetailView = ({ reservation, onBack }) => {
  const { isDarkMode } = useTheme();

  if (!reservation) return null;

  const formatDate = (dateVal) => {
    if (!dateVal) return "-";
    const ts = dateVal.seconds ? dateVal.seconds * 1000 : new Date(dateVal).getTime();
    if (Number.isNaN(ts)) return "-";
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateVal) => {
    if (!dateVal) return "-";
    const ts = dateVal.seconds ? dateVal.seconds * 1000 : new Date(dateVal).getTime();
    if (Number.isNaN(ts)) return "-";
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (statusKey) => {
    const cfg = statusConfig[statusKey] || { color: "gray", label: statusKey };
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

  const reserved = parseFloat(reservation.quantityReserved) || 0;
  const fulfilled = parseFloat(reservation.quantityFulfilled) || 0;
  const remaining = parseFloat(reservation.quantityRemaining) || 0;
  const fulfillmentPercent = reserved > 0 ? Math.round((fulfilled / reserved) * 100) : 0;

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
            <h2 className={`text-xl font-semibold ${valueClass}`}>{reservation.reservationNumber}</h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Created {formatDate(reservation.createdAt)}
            </p>
          </div>
        </div>
        {getStatusBadge(reservation.status)}
      </div>

      {/* Product & Warehouse Card */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}
            >
              <Package className={`w-6 h-6 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            </div>
            <p className={`font-medium ${valueClass}`}>{reservation.productName || "Unknown Product"}</p>
            {reservation.productSku && (
              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{reservation.productSku}</p>
            )}
          </div>
          <div className="flex-shrink-0 px-6">
            <Bookmark className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
          </div>
          <div className="flex-1 text-center">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${isDarkMode ? "bg-orange-900/30" : "bg-orange-100"}`}
            >
              <Package className={`w-6 h-6 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
            </div>
            <p className={`font-medium ${valueClass}`}>{reservation.warehouseName || "Unknown Warehouse"}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Warehouse</p>
          </div>
        </div>
      </div>

      {/* Quantities & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity Breakdown */}
        <div className={`${cardClass} p-5`}>
          <h3
            className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Quantity Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className={labelClass}>Fulfillment Progress</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                  {fulfillmentPercent}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <div
                  className={`h-2 rounded-full transition-all ${
                    fulfillmentPercent >= 100
                      ? "bg-green-500"
                      : fulfillmentPercent > 0
                        ? "bg-teal-500"
                        : isDarkMode
                          ? "bg-gray-600"
                          : "bg-gray-300"
                  }`}
                  style={{ width: `${Math.min(fulfillmentPercent, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className={labelClass}>Reserved</span>
              <span className={`font-semibold ${valueClass}`}>
                {reserved.toFixed(2)} {reservation.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={labelClass}>Fulfilled</span>
              <span className={`font-medium ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                {fulfilled.toFixed(2)} {reservation.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={labelClass}>Remaining</span>
              <span className={`font-medium ${remaining > 0 ? (isDarkMode ? "text-yellow-400" : "text-yellow-600") : isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {remaining.toFixed(2)} {reservation.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Reservation Info & Timeline */}
        <div className={`${cardClass} p-5`}>
          <h3
            className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Timeline
          </h3>
          <div className="space-y-4">
            <TimelineStep
              icon={<Clock className="w-4 h-4" />}
              label="Created"
              detail={reservation.createdByName || "Unknown"}
              date={formatDate(reservation.createdAt)}
              completed={true}
              isDarkMode={isDarkMode}
            />
            {reservation.status === "PARTIALLY_FULFILLED" && (
              <TimelineStep
                icon={<CheckCircle className="w-4 h-4" />}
                label="Partially Fulfilled"
                detail={`${fulfilled.toFixed(2)} of ${reserved.toFixed(2)} ${reservation.unit}`}
                date={formatDate(reservation.updatedAt)}
                completed={true}
                isDarkMode={isDarkMode}
              />
            )}
            {reservation.status === "FULFILLED" && (
              <TimelineStep
                icon={<CheckCircle className="w-4 h-4" />}
                label="Fully Fulfilled"
                detail={`${reserved.toFixed(2)} ${reservation.unit}`}
                date={formatDate(reservation.updatedAt)}
                completed={true}
                isDarkMode={isDarkMode}
              />
            )}
            {reservation.status === "EXPIRED" && (
              <TimelineStep
                icon={<XCircle className="w-4 h-4" />}
                label="Expired"
                date={formatDateShort(reservation.expiryDate)}
                completed={true}
                isCancelled={true}
                isDarkMode={isDarkMode}
              />
            )}
            {reservation.status === "CANCELLED" && (
              <TimelineStep
                icon={<XCircle className="w-4 h-4" />}
                label="Cancelled"
                date={formatDate(reservation.updatedAt)}
                completed={true}
                isCancelled={true}
                isDarkMode={isDarkMode}
              />
            )}
            {reservation.expiryDate && reservation.status === "ACTIVE" && (
              <TimelineStep
                icon={<Calendar className="w-4 h-4" />}
                label="Expires"
                date={formatDateShort(reservation.expiryDate)}
                completed={false}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>
      </div>

      {/* Reference & Notes */}
      {(reservation.referenceNumber || reservation.notes) && (
        <div className={`${cardClass} p-5`}>
          <h3
            className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Additional Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reservation.referenceNumber && (
              <div>
                <span className={labelClass}>Reference</span>
                <p className={`mt-1 ${valueClass}`}>
                  {reservation.referenceType ? `${reservation.referenceType}: ` : ""}
                  {reservation.referenceNumber}
                </p>
              </div>
            )}
            {reservation.notes && (
              <div>
                <span className={labelClass}>Notes</span>
                <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {reservation.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineStep = ({ icon, label, detail, date, completed, isCancelled, isDarkMode }) => {
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
        {detail && <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{detail}</p>}
        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{date}</p>
      </div>
    </div>
  );
};

export default ReservationDetailView;
