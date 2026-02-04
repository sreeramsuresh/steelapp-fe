/**
 * PurchaseOrderPreview Component
 * View-only preview modal for Purchase Orders.
 * Part of the unified Preview/Download system.
 *
 * Rules:
 * - Preview allowed anytime (even for incomplete/unsaved records)
 * - NO action buttons inside preview modal (only X close button)
 * - Shows validation warnings at bottom if incomplete
 */

import { AlertTriangle, X } from "lucide-react";
import PropTypes from "prop-types";
import { useMemo } from "react";
import { getDocumentTemplateColor } from "../../constants/defaultTemplateSettings";
import { useTheme } from "../../contexts/ThemeContext";
import { formatCurrency, TIMEZONE_DISCLAIMER, toUAEDateProfessional } from "../../utils/invoiceUtils";
import { validatePurchaseOrderForDownload } from "../../utils/recordUtils";

const PurchaseOrderPreview = ({ purchaseOrder, company, onClose }) => {
  const { isDarkMode } = useTheme();

  // Get the template color for purchase orders
  const templateColor = useMemo(() => {
    return getDocumentTemplateColor("purchaseOrder", company);
  }, [company]);

  // Validate purchase order and get warnings
  const validation = useMemo(() => {
    return validatePurchaseOrderForDownload(purchaseOrder);
  }, [purchaseOrder]);

  // Get status display
  const getStatusLabel = (status) => {
    const labels = {
      draft: "Draft",
      pending: "Pending",
      confirmed: "Confirmed",
      received: "Received",
      cancelled: "Cancelled",
    };
    return labels[status] || status || "Draft";
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-orange-100 text-orange-800",
      confirmed: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.draft;
  };

  // Extract data
  const items = purchaseOrder.items || [];
  const supplierName = purchaseOrder.supplierName || purchaseOrder.supplier_name || "";
  const supplierDetails = purchaseOrder.supplierDetails || purchaseOrder.supplier_details || {};
  const supplierAddress = supplierDetails.address || {};

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const vatAmount = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    const vatRate = parseFloat(item.vatRate || item.vat_rate) || 0;
    return sum + (amount * vatRate) / 100;
  }, 0);
  const total = subtotal + vatAmount + (parseFloat(purchaseOrder.otherCharges || purchaseOrder.other_charges) || 0);

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
            Purchase Order Preview
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

        {/* Purchase Order Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: isDarkMode ? "#1a1a2e" : "#f5f5f5" }}>
          {/* Document Container */}
          <div
            className={`max-w-3xl mx-auto ${isDarkMode ? "bg-gray-900" : "bg-white"} shadow-lg rounded-lg overflow-hidden`}
          >
            {/* Document Header */}
            <div className="text-white p-6" style={{ backgroundColor: templateColor }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">PURCHASE ORDER</h1>
                  <p className="text-white/80 mt-1">
                    {purchaseOrder.poNumber || purchaseOrder.po_number || "PO-DRAFT"}
                  </p>
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
                    Supplier Details
                  </h3>
                  <p className="font-medium">{supplierName || "Supplier Name"}</p>
                  {supplierDetails.company && <p className="text-sm">{supplierDetails.company}</p>}
                  {supplierAddress.street && <p className="text-sm">{supplierAddress.street}</p>}
                  {(supplierAddress.city || supplierAddress.emirate) && (
                    <p className="text-sm">
                      {[supplierAddress.city, supplierAddress.emirate].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {supplierDetails.vatNumber && <p className="text-sm mt-1">VAT: {supplierDetails.vatNumber}</p>}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Date: </span>
                    <span className="font-medium">
                      {toUAEDateProfessional(purchaseOrder.poDate || purchaseOrder.po_date)}
                    </span>
                  </div>
                  {(purchaseOrder.deliveryDate || purchaseOrder.delivery_date) && (
                    <div className="mb-2">
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Delivery: </span>
                      <span className="font-medium">
                        {toUAEDateProfessional(purchaseOrder.deliveryDate || purchaseOrder.delivery_date)}
                      </span>
                    </div>
                  )}
                  <div className="mb-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(purchaseOrder.status)}`}
                    >
                      {getStatusLabel(purchaseOrder.status)}
                    </span>
                  </div>
                  {(purchaseOrder.warehouseName || purchaseOrder.warehouse_name) && (
                    <div>
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Warehouse: </span>
                      <span className="font-medium">{purchaseOrder.warehouseName || purchaseOrder.warehouse_name}</span>
                    </div>
                  )}
                </div>
              </div>

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
                        <th className="px-4 py-2 text-right font-medium">Qty</th>
                        <th className="px-4 py-2 text-right font-medium">Rate</th>
                        <th className="px-4 py-2 text-right font-medium">VAT</th>
                        <th className="px-4 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length > 0 ? (
                        items.map((item, index) => (
                          <tr key={index} className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.name || item.productName || "Unnamed Item"}</div>
                              {(item.specification || item.grade || item.size) && (
                                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {[item.grade, item.finish, item.size, item.thickness].filter(Boolean).join(" | ")}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.quantity || 0} {item.unit || "pcs"}
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.rate || item.unitPrice || 0)}</td>
                            <td className="px-4 py-3 text-right">{item.vatRate || item.vat_rate || 0}%</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount || 0)}</td>
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

              {/* Totals */}
              <div
                className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>VAT:</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                {(purchaseOrder.otherCharges || purchaseOrder.other_charges) && (
                  <div className="flex justify-between py-1 text-sm">
                    <span>Other Charges:</span>
                    <span>
                      {formatCurrency(parseFloat(purchaseOrder.otherCharges || purchaseOrder.other_charges) || 0)}
                    </span>
                  </div>
                )}
                <div
                  className={`flex justify-between py-2 mt-2 border-t font-bold text-lg ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                >
                  <span>Total:</span>
                  <span style={{ color: templateColor }}>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Terms & Notes */}
              {(purchaseOrder.notes || purchaseOrder.termsAndConditions || purchaseOrder.terms_and_conditions) && (
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  {purchaseOrder.notes && (
                    <div className="mb-4">
                      <h4 className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                        Notes:
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{purchaseOrder.notes}</p>
                    </div>
                  )}
                  {(purchaseOrder.termsAndConditions || purchaseOrder.terms_and_conditions) && (
                    <div>
                      <h4 className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                        Terms & Conditions:
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {purchaseOrder.termsAndConditions || purchaseOrder.terms_and_conditions}
                      </p>
                    </div>
                  )}
                </div>
              )}

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

PurchaseOrderPreview.propTypes = {
  purchaseOrder: PropTypes.object.isRequired,
  company: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

PurchaseOrderPreview.defaultProps = {
  company: {},
};

export default PurchaseOrderPreview;
