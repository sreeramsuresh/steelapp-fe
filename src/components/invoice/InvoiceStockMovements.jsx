/**
 * InvoiceStockMovements Component
 *
 * Displays stock movements linked to an invoice.
 * Shows:
 * - OUT movements (stock deducted when invoice issued)
 * - IN movements (stock returned from credit notes/cancellations)
 *
 * Phase 3: Invoice-Stock Integration
 */

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { invoiceService } from "../../services/invoiceService";

const movementTypeColors = {
  OUT: "bg-red-100 text-red-800",
  IN: "bg-green-100 text-green-800",
  TRANSFER_OUT: "bg-orange-100 text-orange-800",
  TRANSFER_IN: "bg-blue-100 text-blue-800",
  ADJUSTMENT: "bg-purple-100 text-purple-800",
};

const referenceTypeLabels = {
  INVOICE: "Invoice",
  RETURN: "Return",
  CREDIT_NOTE: "Credit Note",
  PURCHASE_ORDER: "Purchase Order",
  ADJUSTMENT: "Adjustment",
  TRANSFER: "Transfer",
  INITIAL: "Initial Stock",
};

export default function InvoiceStockMovements({
  invoiceId,
  invoiceNumber: _invoiceNumber,
  showHeader = true,
  className = "",
  onStockDeducted = null,
}) {
  const { isDarkMode } = useTheme();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deducting, setDeducting] = useState(false);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getInvoiceStockMovements(invoiceId);
      setMovements(data);
    } catch (err) {
      console.error("Failed to fetch stock movements:", err);
      setError(err.message || "Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      fetchMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, fetchMovements]); // fetchMovements is stable

  const handleManualDeduction = async () => {
    try {
      setDeducting(true);
      setError(null);
      const result = await invoiceService.createStockMovements(invoiceId);

      if (result.success) {
        await fetchMovements();
        if (onStockDeducted) {
          onStockDeducted(result);
        }
      } else if (result.errors?.length > 0) {
        setError(result.errors.join(", "));
      }
    } catch (err) {
      console.error("Failed to create stock movements:", err);
      setError(err.message || "Failed to deduct stock");
    } finally {
      setDeducting(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    // Handle both timestamp object and ISO string
    const date = dateValue.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
    return format(date, "dd MMM yyyy HH:mm");
  };

  const formatQuantity = (qty, unit) => {
    const num = parseFloat(qty) || 0;
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit || "KG"}`;
  };

  // Group movements by type for summary
  const outMovements = movements.filter((m) => m.movementType === "OUT");
  const inMovements = movements.filter((m) => m.movementType === "IN");

  const totalOut = outMovements.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
  const totalIn = inMovements.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Stock Movements</h3>
          {movements.length === 0 && (
            <button
              type="button"
              onClick={handleManualDeduction}
              disabled={deducting}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {deducting ? "Deducting..." : "Deduct Stock Manually"}
            </button>
          )}
        </div>
      )}

      {error && (
        <div
          className={`mb-4 p-3 rounded-md border ${isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"}`}
        >
          <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-700"}`}>{error}</p>
        </div>
      )}

      {movements.length === 0 ? (
        <div
          className={`text-center py-6 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
        >
          <svg
            aria-label="icon"
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>No stock movements</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            No stock movements recorded for this invoice
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Stock is automatically deducted when invoice is issued
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-100"}`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-red-400" : "text-red-600"}`}
              >
                Stock Deducted
              </p>
              <p className={`mt-1 text-lg font-semibold ${isDarkMode ? "text-red-300" : "text-red-700"}`}>
                {totalOut.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                {outMovements.length} movement(s)
              </p>
            </div>
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-100"}`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-green-400" : "text-green-600"}`}
              >
                Stock Returned
              </p>
              <p className={`mt-1 text-lg font-semibold ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                {totalIn.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-500"}`}>
                {inMovements.length} movement(s)
              </p>
            </div>
          </div>

          {/* Movements Table */}
          <div className={`overflow-hidden border rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <table className={`min-w-full divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance After
                  </th>
                </tr>
              </thead>
              <tbody
                className={isDarkMode ? "bg-gray-800 divide-y divide-gray-700" : "bg-white divide-y divide-gray-200"}
              >
                {movements.map((movement) => (
                  <tr key={movement.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.movementDate)}
                    </td>
                    <td className={`px-4 py-2 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      <div className="font-medium">{movement.productName || "Unknown Product"}</div>
                      {movement.productSku && (
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          SKU: {movement.productSku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          movementTypeColors[movement.movementType] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {movement.movementType}
                      </span>
                      {movement.referenceType !== "INVOICE" && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({referenceTypeLabels[movement.referenceType] || movement.referenceType})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                      <span className={movement.movementType === "OUT" ? "text-red-600" : "text-green-600"}>
                        {movement.movementType === "OUT" ? "-" : "+"}
                        {formatQuantity(movement.quantity, movement.unit)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {movement.warehouseName || movement.warehouseCode || "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                      {formatQuantity(movement.balanceAfter, movement.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {movements.some((m) => m.notes) && (
            <div className="mt-4 space-y-2">
              <p
                className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Notes
              </p>
              {movements
                .filter((m) => m.notes)
                .map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm p-2 rounded ${isDarkMode ? "text-gray-400 bg-gray-700" : "text-gray-600 bg-gray-50"}`}
                  >
                    {m.notes}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
