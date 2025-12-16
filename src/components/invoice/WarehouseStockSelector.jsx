import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../contexts/ThemeContext";
import { Package, Loader2, AlertCircle } from "lucide-react";
import api from "../../services/api";

/**
 * WarehouseStockSelector Component
 *
 * Displays all warehouses with their stock availability in a horizontal format
 * and allows selection of a warehouse. Shows stock quantity for each warehouse.
 *
 * Example: Stock availability:  Warehouse Main 2    Abu Dhabi Warehouse 5    Dubai Warehouse 6
 *
 * Props:
 * - productId: Product ID to check stock for
 * - warehouses: Array of warehouse objects { id, name, code }
 * - selectedWarehouseId: Currently selected warehouse ID
 * - onWarehouseSelect: Callback when warehouse is selected (warehouseId, hasStock)
 * - companyId: Company ID (required for API calls)
 */
const WarehouseStockSelector = ({
  productId,
  warehouses = [],
  selectedWarehouseId,
  onWarehouseSelect,
  companyId,
}) => {
  const { isDarkMode } = useTheme();
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch stock for all warehouses
   */
  useEffect(() => {
    const fetchStockForAllWarehouses = async () => {
      if (!productId || !warehouses.length || !companyId) {
        setStockData({});
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const stockPromises = warehouses.map(async (warehouse) => {
          try {
            const response = await api.get("/stock-batches/available", {
              params: {
                productId,
                warehouseId: warehouse.id,
                companyId,
                hasStock: false, // Get all batches, even with 0 stock
              },
            });

            const batches = response.batches || [];
            const totalAvailable = batches.reduce((sum, batch) => {
              return sum + (parseFloat(batch.quantityAvailable) || 0);
            }, 0);

            return {
              warehouseId: warehouse.id,
              available: totalAvailable,
            };
          } catch (err) {
            console.warn(
              `Failed to fetch stock for warehouse ${warehouse.id}:`,
              err,
            );
            return {
              warehouseId: warehouse.id,
              available: 0,
            };
          }
        });

        const results = await Promise.all(stockPromises);
        const stockMap = {};
        results.forEach((result) => {
          stockMap[result.warehouseId] = result.available;
        });

        setStockData(stockMap);

        // Auto-select DROP_SHIP if all warehouses have 0 stock
        const allWarehousesZeroStock = results.every(
          (result) => result.available === 0,
        );
        if (allWarehousesZeroStock && onWarehouseSelect) {
          // Notify parent that all warehouses have zero stock
          // Parent should handle switching to DROP_SHIP mode
          onWarehouseSelect(null, false);
        }
      } catch (err) {
        console.error("Error fetching warehouse stock:", err);
        setError("Failed to load stock availability");
      } finally {
        setLoading(false);
      }
    };

    fetchStockForAllWarehouses();
  }, [productId, warehouses, companyId, onWarehouseSelect]);

  /**
   * Handle warehouse selection
   */
  const handleSelect = (warehouseId) => {
    const hasStock = (stockData[warehouseId] || 0) > 0;
    onWarehouseSelect(warehouseId, hasStock);
  };

  /**
   * Format quantity display
   */
  const formatQty = (qty) => {
    return new Intl.NumberFormat("en-AE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 size={16} className="animate-spin text-gray-400" />
        <span
          className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Loading stock availability...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-2">
        <AlertCircle size={16} className="text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      </div>
    );
  }

  if (!warehouses.length) {
    return (
      <div
        className={`text-sm py-2 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}
      >
        No warehouses available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
      >
        Stock availability:
      </div>
      <div className="flex flex-wrap gap-2">
        {warehouses.map((warehouse) => {
          const available = stockData[warehouse.id] || 0;
          const isSelected =
            selectedWarehouseId &&
            warehouse.id.toString() === selectedWarehouseId.toString();
          const hasStock = available > 0;

          return (
            <button
              key={warehouse.id}
              type="button"
              onClick={() => handleSelect(warehouse.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? isDarkMode
                      ? "border-teal-500 bg-teal-900/30 text-teal-300"
                      : "border-teal-600 bg-teal-50 text-teal-700"
                    : isDarkMode
                      ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }
              `}
              title={`${warehouse.name} - ${formatQty(available)} available`}
            >
              <Package
                size={16}
                className={
                  hasStock
                    ? "text-green-500"
                    : isDarkMode
                      ? "text-red-400"
                      : "text-red-500"
                }
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {warehouse.name || warehouse.code || `WH-${warehouse.id}`}
                </span>
                <span
                  className={`text-sm font-bold ${
                    hasStock
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatQty(available)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

WarehouseStockSelector.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
      code: PropTypes.string,
    }),
  ).isRequired,
  selectedWarehouseId: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
  onWarehouseSelect: PropTypes.func.isRequired,
  companyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
};

export default WarehouseStockSelector;
