import { AlertCircle, Package, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient } from "../../services/api";

export default function BatchesModal({ isOpen, onClose, productId, productName, warehouseId }) {
  const { isDarkMode } = useTheme();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        productId: productId.toString(),
        ...(warehouseId && { warehouseId: warehouseId.toString() }),
        status: "active",
      });

      const response = await apiClient.get(`/api/stock-batches?${params}`);
      setBatches(response.data.batches || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [productId, warehouseId]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchBatches();
    }
  }, [isOpen, productId, fetchBatches]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onClose();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        />

        <div
          className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Package className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Available Batches
                  </h3>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{productName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && batches.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No batches available for this product
                </p>
              </div>
            )}

            {!loading && !error && batches.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heat Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserved Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {batches.map((batch) => (
                      <tr
                        key={batch.id}
                        className={isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {batch.batchNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {batch.heatNumber || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {batch.warehouseName}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {batch.grade || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span
                            className={`text-sm font-semibold ${
                              batch.availableQuantity > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {batch.availableQuantity} {batch.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {batch.reservedQuantity || 0} {batch.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && batches.length > 0 && (
              <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <strong>Total Available:</strong>{" "}
                  {batches.reduce((sum, b) => sum + (b.availableQuantity || 0), 0).toFixed(2)}{" "}
                  {batches[0]?.unit || "MT"}
                </p>
              </div>
            )}
          </div>

          <div
            className={`px-4 py-3 sm:px-6 flex justify-end border-t ${
              isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
