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
import { useEffect, useState } from "react";
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
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deducting, setDeducting] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, fetchMovements]); // fetchMovements is stable

  const fetchMovements = async () => {
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
  };

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
          <h3 className="text-lg font-medium text-gray-900">Stock Movements</h3>
          {movements.length === 0 && (
            <button type="button" onClick={handleManualDeduction}
              disabled={deducting}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {deducting ? "Deducting..." : "Deduct Stock Manually"}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {movements.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            aria-label="icon"
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No stock movements recorded for this invoice</p>
          <p className="text-xs text-gray-400 mt-1">Stock is automatically deducted when invoice is issued</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Stock Deducted</p>
              <p className="mt-1 text-lg font-semibold text-red-700">
                {totalOut.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-red-500">{outMovements.length} movement(s)</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Stock Returned</p>
              <p className="mt-1 text-lg font-semibold text-green-700">
                {totalIn.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-green-500">{inMovements.length} movement(s)</p>
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.movementDate)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="font-medium">{movement.productName || "Unknown Product"}</div>
                      {movement.productSku && <div className="text-xs text-gray-500">SKU: {movement.productSku}</div>}
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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</p>
              {movements
                .filter((m) => m.notes)
                .map((m) => (
                  <div key={m.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
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
