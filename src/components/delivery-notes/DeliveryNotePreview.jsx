/**
 * DeliveryNotePreview Component
 * View-only preview modal for Delivery Notes.
 * Part of the unified Preview/Download system.
 *
 * Rules:
 * - Preview allowed anytime (even for incomplete/unsaved records)
 * - NO action buttons inside preview modal (only X close button)
 * - Shows validation warnings at bottom if incomplete
 */

import { AlertTriangle, CheckCircle, Clock, RefreshCw, Truck, X, XCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useMemo } from "react";
import { getDocumentTemplateColor } from "../../constants/defaultTemplateSettings";
import { useTheme } from "../../contexts/ThemeContext";
import { TIMEZONE_DISCLAIMER, toUAEDateProfessional } from "../../utils/invoiceUtils";
import { validateDeliveryNoteForDownload } from "../../utils/recordUtils";

const DeliveryNotePreview = ({ deliveryNote, company, onClose }) => {
  const { isDarkMode } = useTheme();

  // Get the template color for delivery notes
  const templateColor = useMemo(() => {
    return getDocumentTemplateColor("deliveryNote", company);
  }, [company]);

  // Validate delivery note and get warnings
  const validation = useMemo(() => {
    return validateDeliveryNoteForDownload(deliveryNote);
  }, [deliveryNote]);

  // Get status display with icons
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Pending",
        icon: <Clock size={12} />,
        className: isDarkMode
          ? "bg-amber-900/30 text-amber-300 border-amber-600"
          : "bg-amber-100 text-amber-800 border-amber-300",
      },
      in_transit: {
        label: "In Transit",
        icon: <Truck size={12} />,
        className: isDarkMode
          ? "bg-orange-900/30 text-orange-300 border-orange-600"
          : "bg-orange-100 text-orange-800 border-orange-300",
      },
      partial: {
        label: "Partial Delivery",
        icon: <RefreshCw size={12} />,
        className: isDarkMode
          ? "bg-blue-900/30 text-blue-300 border-blue-600"
          : "bg-blue-100 text-blue-800 border-blue-300",
      },
      delivered: {
        label: "Delivered",
        icon: <CheckCircle size={12} />,
        className: isDarkMode
          ? "bg-green-900/30 text-green-300 border-green-600"
          : "bg-green-100 text-green-800 border-green-300",
      },
      completed: {
        label: "Completed",
        icon: <CheckCircle size={12} />,
        className: isDarkMode
          ? "bg-green-900/30 text-green-300 border-green-600"
          : "bg-green-100 text-green-800 border-green-300",
      },
      cancelled: {
        label: "Cancelled",
        icon: <XCircle size={12} />,
        className: isDarkMode ? "bg-red-900/30 text-red-300 border-red-600" : "bg-red-100 text-red-800 border-red-300",
      },
    };
    return configs[status] || configs.pending;
  };

  // Extract data
  const items = deliveryNote.items || [];
  const deliveryAddress = deliveryNote.deliveryAddress || deliveryNote.delivery_address || {};
  const customerName = deliveryNote.customerDetails?.name || deliveryNote.customer_name || "";
  const customerCompany = deliveryNote.customerDetails?.company || "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        {/* Header - Only X button (view-only) */}
        <div
          className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Delivery Note Preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Close preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Delivery Note Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: isDarkMode ? "#1a1a2e" : "#f5f5f5" }}>
          {/* Document Container */}
          <div
            className={`max-w-3xl mx-auto ${isDarkMode ? "bg-gray-900" : "bg-white"} shadow-lg rounded-lg overflow-hidden`}
          >
            {/* Document Header */}
            <div className="text-white p-6" style={{ backgroundColor: templateColor }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Truck size={32} />
                  <div>
                    <h1 className="text-2xl font-bold">DELIVERY NOTE</h1>
                    <p className="text-white/80 mt-1">
                      {deliveryNote.deliveryNoteNumber || deliveryNote.delivery_note_number || "DN-DRAFT"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{company?.name || "Company Name"}</p>
                  <p className="text-sm text-white/80">{company?.address?.street || ""}</p>
                  <p className="text-sm text-white/80">{company?.phone || ""}</p>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className={`p-6 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-2`}>
                    Deliver To
                  </h3>
                  <p className="font-medium">{customerName || "Customer Name"}</p>
                  {customerCompany && <p className="text-sm">{customerCompany}</p>}
                  {deliveryAddress.street && <p className="text-sm">{deliveryAddress.street}</p>}
                  {(deliveryAddress.city || deliveryAddress.poBox) && (
                    <p className="text-sm">
                      {[deliveryAddress.city, deliveryAddress.poBox && `P.O. Box ${deliveryAddress.poBox}`]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Delivery Date: </span>
                    <span className="font-medium">
                      {toUAEDateProfessional(deliveryNote.deliveryDate || deliveryNote.delivery_date)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Invoice #: </span>
                    <span className="font-medium" style={{ color: templateColor }}>
                      {deliveryNote.invoiceNumber || deliveryNote.invoice_number || "-"}
                    </span>
                  </div>
                  <div className="mb-2">
                    {(() => {
                      const statusConfig = getStatusConfig(deliveryNote.status);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${statusConfig.className}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Transport Details */}
              {(deliveryNote.vehicleNumber ||
                deliveryNote.vehicle_number ||
                deliveryNote.driverName ||
                deliveryNote.driver_name) && (
                <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-2`}>
                    Transport Details
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Vehicle: </span>
                      <span className="font-medium">
                        {deliveryNote.vehicleNumber || deliveryNote.vehicle_number || "-"}
                      </span>
                    </div>
                    <div>
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Driver: </span>
                      <span className="font-medium">{deliveryNote.driverName || deliveryNote.driver_name || "-"}</span>
                    </div>
                    <div>
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Phone: </span>
                      <span className="font-medium">
                        {deliveryNote.driverPhone || deliveryNote.driver_phone || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-3`}>
                  Items ({items.length})
                </h3>
                <div
                  className={`border rounded-lg overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                >
                  <table className="w-full text-sm">
                    <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Item</th>
                        <th className="px-4 py-2 text-left font-medium">Specification</th>
                        <th className="px-4 py-2 text-right font-medium">Unit</th>
                        <th className="px-4 py-2 text-right font-medium">Ordered</th>
                        <th className="px-4 py-2 text-right font-medium">Delivered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length > 0 ? (
                        items.map((item, index) => (
                          <tr key={index} className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.name || item.productName || "Unnamed Item"}</div>
                            </td>
                            <td className="px-4 py-3">{item.specification || "-"}</td>
                            <td className="px-4 py-3 text-right">{item.unit || "pcs"}</td>
                            <td className="px-4 py-3 text-right">
                              {item.orderedQuantity || item.ordered_quantity || 0}
                            </td>
                            <td className="px-4 py-3 text-right font-medium" style={{ color: templateColor }}>
                              {item.deliveredQuantity || item.delivered_quantity || 0}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                            No items added
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {deliveryNote.notes && (
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <h4 className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                    Notes:
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{deliveryNote.notes}</p>
                </div>
              )}

              {/* Signature Area */}
              <div className={`mt-8 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className={`border-b-2 ${isDarkMode ? "border-gray-600" : "border-gray-400"} mb-2 h-12`}></div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Driver Signature</p>
                  </div>
                  <div className="text-center">
                    <div className={`border-b-2 ${isDarkMode ? "border-gray-600" : "border-gray-400"} mb-2 h-12`}></div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Receiver Signature</p>
                  </div>
                </div>
              </div>

              {/* Timezone Disclaimer Footer */}
              <div className={`mt-6 pt-3 border-t text-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <p className={`text-xs italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {TIMEZONE_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Warnings Footer */}
        {!validation.isValid && validation.warnings.length > 0 && (
          <div
            className={`p-4 border-t ${isDarkMode ? "border-gray-700 bg-yellow-900/20" : "border-gray-200 bg-yellow-50"}`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-yellow-300" : "text-yellow-800"}`}>
                  Incomplete record - Cannot download until resolved:
                </p>
                <ul
                  className={`text-sm mt-1 list-disc list-inside ${isDarkMode ? "text-yellow-200" : "text-yellow-700"}`}
                >
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

DeliveryNotePreview.propTypes = {
  deliveryNote: PropTypes.object.isRequired,
  company: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

DeliveryNotePreview.defaultProps = {
  company: {},
};

export default DeliveryNotePreview;
