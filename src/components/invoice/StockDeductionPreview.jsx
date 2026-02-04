/**
 * StockDeductionPreview Component
 *
 * Shows a preview of stock that will be deducted when an invoice is issued.
 * Displays:
 * - Products with product_id (inventory-tracked items)
 * - Current stock levels
 * - Stock after deduction
 * - Warnings for low/negative stock
 *
 * Phase 3: Invoice-Stock Integration
 */

import { useEffect, useState } from "react";
import { apiClient } from "../../services/api";

export default function StockDeductionPreview({
  items = [],
  warehouseId = null,
  warehouseName = "",
  onClose,
  onConfirm,
  className = "",
}) {
  const [stockLevels, setStockLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter items that have product_id (inventory-tracked)
  const inventoryItems = items.filter((item) => item.productId || item.product_id);

  useEffect(() => {
    if (inventoryItems.length > 0) {
      fetchStockLevels();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchStockLevels, inventoryItems.length]); // fetchStockLevels is stable

  const fetchStockLevels = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current stock for each product
      const levels = {};
      for (const item of inventoryItems) {
        const productId = item.productId || item.product_id;
        try {
          const params = { product_id: productId };
          if (warehouseId) {
            params.warehouse_id = warehouseId;
          }
          const response = await apiClient.get("/stock-movements/current-stock", { params });
          levels[productId] = {
            currentStock: parseFloat(response.totalQuantity || response.total_quantity || 0),
            available: parseFloat(response.totalAvailable || response.total_available || 0),
            unit: response.unit || "KG",
          };
        } catch {
          levels[productId] = { currentStock: 0, available: 0, unit: "KG" };
        }
      }
      setStockLevels(levels);
    } catch (err) {
      console.error("Failed to fetch stock levels:", err);
      setError("Failed to load current stock levels");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (productId, quantity) => {
    const stock = stockLevels[productId];
    if (!stock) return { status: "unknown", message: "Stock data unavailable" };

    const afterDeduction = stock.currentStock - parseFloat(quantity);

    if (afterDeduction < 0) {
      return {
        status: "negative",
        message: `Will go negative (${afterDeduction.toFixed(2)})`,
        color: "text-red-600 bg-red-50",
      };
    } else if (afterDeduction < stock.currentStock * 0.1) {
      return {
        status: "low",
        message: `Low stock warning`,
        color: "text-yellow-600 bg-yellow-50",
      };
    } else {
      return {
        status: "ok",
        message: "Sufficient stock",
        color: "text-green-600 bg-green-50",
      };
    }
  };

  const hasNegativeStock = inventoryItems.some((item) => {
    const productId = item.productId || item.product_id;
    const stock = stockLevels[productId];
    return stock && stock.currentStock - parseFloat(item.quantity) < 0;
  });

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Stock Deduction Preview</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {warehouseName && (
          <p className="mt-1 text-sm text-gray-500">
            Warehouse: <span className="font-medium">{warehouseName}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {inventoryItems.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="mt-3 text-sm text-gray-500">No inventory-tracked items in this invoice</p>
            <p className="text-xs text-gray-400 mt-1">Items without a linked product will not affect stock levels</p>
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            {hasNegativeStock && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Insufficient Stock Warning</h3>
                    <p className="mt-1 text-sm text-red-700">
                      Some items will result in negative stock. You can still proceed (backorder), but please verify.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Deduction</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">After</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryItems.map((item, index) => {
                    const productId = item.productId || item.product_id;
                    const stock = stockLevels[productId] || {
                      currentStock: 0,
                      unit: "KG",
                    };
                    const quantity = parseFloat(item.quantity) || 0;
                    const afterDeduction = stock.currentStock - quantity;
                    const status = getStockStatus(productId, quantity);

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{item.name}</div>
                          {item.size && (
                            <div className="text-xs text-gray-500">
                              {item.size} {item.thickness ? `x ${item.thickness}mm` : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {stock.currentStock.toFixed(2)} {stock.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                          -{quantity.toFixed(2)} {item.unit || stock.unit}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${afterDeduction < 0 ? "text-red-600" : "text-gray-900"}`}
                        >
                          {afterDeduction.toFixed(2)} {stock.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}
                          >
                            {status.status === "negative" && (
                              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {status.status === "ok" && (
                              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {status.message}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total items to deduct:</span>
                <span className="font-medium text-gray-900">{inventoryItems.length}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Total quantity:</span>
                <span className="font-medium text-red-600">
                  -{inventoryItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {onConfirm && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              hasNegativeStock ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {hasNegativeStock ? "Proceed Anyway" : "Confirm & Issue"}
          </button>
        </div>
      )}
    </div>
  );
}
