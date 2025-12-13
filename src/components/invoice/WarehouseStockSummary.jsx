import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Package } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

/**
 * WarehouseStockSummary Component
 *
 * Shows stock availability across ALL warehouses in a horizontal inline format.
 * Example: "Main Warehouse 5    Abu Dhabi Warehouse 10    Dubai Warehouse 8"
 */
const WarehouseStockSummary = ({ productId, warehouses, onWarehouseSelect }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stockByWarehouse, setStockByWarehouse] = useState({});

  const fetchAllWarehouseStock = useCallback(async () => {
    const numericProductId = typeof productId === 'number' ? productId : parseInt(productId);
    if (!numericProductId || numericProductId <= 0 || !warehouses?.length) {
      setStockByWarehouse({});
      return;
    }

    setLoading(true);
    try {
      // Fetch stock for all warehouses in parallel
      const stockPromises = warehouses.map(async (wh) => {
        try {
          const response = await api.get('/stock-batches/available', {
            params: { productId: numericProductId, warehouseId: wh.id },
          });
          const batches = response.batches || [];
          const totalAvailable = batches.reduce((sum, batch) => {
            return sum + (parseFloat(batch.quantityAvailable) || 0);
          }, 0);
          return { warehouseId: wh.id, stock: totalAvailable };
        } catch {
          return { warehouseId: wh.id, stock: 0 };
        }
      });

      const results = await Promise.all(stockPromises);
      const stockMap = {};
      results.forEach(({ warehouseId, stock }) => {
        stockMap[warehouseId] = stock;
      });
      setStockByWarehouse(stockMap);
    } catch (err) {
      console.error('Failed to fetch warehouse stock:', err);
      setStockByWarehouse({});
    } finally {
      setLoading(false);
    }
  }, [productId, warehouses]);

  useEffect(() => {
    fetchAllWarehouseStock();
  }, [fetchAllWarehouseStock]);

  const formatQty = (qty) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <Loader2 size={14} className="animate-spin" />
        <span>Loading stock...</span>
      </div>
    );
  }

  if (!warehouses?.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Package size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
      <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Stock:
      </span>
      <div className="flex items-center gap-4 flex-wrap">
        {warehouses.map((wh) => {
          const stock = stockByWarehouse[wh.id] || 0;
          const hasStock = stock > 0;

          return (
            <button
              key={wh.id}
              type="button"
              onClick={() => onWarehouseSelect && onWarehouseSelect(wh.id, wh.name)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                hasStock
                  ? isDarkMode
                    ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                  : isDarkMode
                    ? 'bg-gray-700/50 text-gray-500'
                    : 'bg-gray-100 text-gray-400'
              } ${onWarehouseSelect ? 'cursor-pointer' : 'cursor-default'}`}
              title={hasStock ? `Click to select ${wh.name}` : 'No stock available'}
              disabled={!onWarehouseSelect}
            >
              <span className="font-medium">{wh.name || wh.code || `WH${wh.id}`}</span>
              <span className={`ml-1.5 font-bold ${
                hasStock
                  ? isDarkMode ? 'text-green-200' : 'text-green-800'
                  : isDarkMode ? 'text-gray-600' : 'text-gray-500'
              }`}>
                {formatQty(stock)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

WarehouseStockSummary.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  warehouses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string,
    code: PropTypes.string,
  })),
  onWarehouseSelect: PropTypes.func,
};

export default WarehouseStockSummary;
