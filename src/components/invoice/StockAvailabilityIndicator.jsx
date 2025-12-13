import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle, Package, Loader2, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

/**
 * StockAvailabilityIndicator Component
 *
 * Shows real-time stock availability for a product in a warehouse.
 * Used in Auto (FIFO) allocation mode to warn users when stock is insufficient.
 *
 * Props:
 * - productId: Product ID to check stock for
 * - warehouseId: Warehouse ID to check stock in
 * - requiredQty: Quantity needed for the line item
 * - compact: If true, shows a minimal inline indicator
 * - iconOnly: If true (with compact), shows only icon with tooltip (uniform row height)
 */
const StockAvailabilityIndicator = ({
  productId,
  warehouseId,
  requiredQty,
  compact = false,
  iconOnly = false,
}) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState(null);

  /**
   * Fetch available stock from API
   */
  const fetchStock = useCallback(async () => {
    const numericProductId = typeof productId === 'number' ? productId : parseInt(productId);
    const validProductId = numericProductId && numericProductId > 0;

    if (!validProductId) {
      setStockData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = { productId: numericProductId };
      // Only add warehouseId if it's a valid value (not undefined, null, empty string, or string "undefined")
      if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        params.warehouseId = warehouseId;
      }

      const response = await api.get('/stock-batches/available', { params });
      const batches = response.batches || [];

      // Calculate total available quantity
      const totalAvailable = batches.reduce((sum, batch) => {
        return sum + (parseFloat(batch.quantityAvailable) || 0);
      }, 0);

      setStockData({
        totalAvailable,
        batchCount: batches.length,
        batches,
      });
    } catch (err) {
      console.error('Failed to fetch stock availability:', err);
      setError(err.response?.data?.error || 'Failed to check stock');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  }, [productId, warehouseId]);

  // Fetch stock when product/warehouse changes
  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Calculate status
  const isSufficient = stockData && stockData.totalAvailable >= requiredQty;
  const isPartial = stockData && stockData.totalAvailable > 0 && stockData.totalAvailable < requiredQty;
  const isZero = stockData && stockData.totalAvailable === 0;
  const shortfall = stockData ? Math.max(0, requiredQty - stockData.totalAvailable) : requiredQty;

  // Format quantity display
  const formatQty = (qty) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  // Compact mode: show icon with optional text
  if (compact) {
    // Icon-only mode: just icons with detailed tooltips (for uniform row heights)
    if (iconOnly) {
      if (loading) {
        return (
          <span title="Checking stock..." className="flex-shrink-0">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </span>
        );
      }

      if (error || !stockData) {
        return (
          <span title={error || 'Unable to check stock'} className="flex-shrink-0">
            <AlertTriangle size={16} className="text-gray-400" />
          </span>
        );
      }

      if (isZero) {
        return (
          <span
            title={`No stock available${warehouseId ? ' in selected warehouse' : ''}`}
            className="flex-shrink-0 cursor-help"
          >
            <AlertTriangle size={16} className="text-red-500" />
          </span>
        );
      }

      if (isPartial) {
        return (
          <span
            title={`Only ${formatQty(stockData.totalAvailable)} available. Need ${formatQty(requiredQty)}, short by ${formatQty(shortfall)}`}
            className="flex-shrink-0 cursor-help"
          >
            <AlertTriangle size={16} className="text-amber-500" />
          </span>
        );
      }

      if (isSufficient) {
        return (
          <span
            title={`${formatQty(stockData.totalAvailable)} available in ${stockData.batchCount} batch(es)`}
            className="flex-shrink-0 cursor-help"
          >
            <CheckCircle size={16} className="text-green-500" />
          </span>
        );
      }

      return null;
    }

    // Compact mode with text
    if (loading) {
      return (
        <span title="Checking stock...">
          <Loader2 size={14} className="animate-spin text-gray-400" />
        </span>
      );
    }

    if (error || !stockData) {
      return (
        <span title={error || 'Unable to check stock'}>
          <AlertTriangle size={14} className="text-gray-400" />
        </span>
      );
    }

    if (isZero) {
      return (
        <span
          title={`No stock available${warehouseId ? ' in selected warehouse' : ''}`}
          className="inline-flex items-center gap-1"
        >
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-xs text-red-500 font-medium">No Stock</span>
        </span>
      );
    }

    if (isPartial) {
      return (
        <span
          title={`Only ${formatQty(stockData.totalAvailable)} available. Short by ${formatQty(shortfall)}`}
          className="inline-flex items-center gap-1"
        >
          <AlertTriangle size={14} className="text-amber-500" />
          <span className="text-xs text-amber-500 font-medium">
            {formatQty(stockData.totalAvailable)} avail
          </span>
        </span>
      );
    }

    if (isSufficient) {
      return (
        <span
          title={`${formatQty(stockData.totalAvailable)} available in ${stockData.batchCount} batch(es)`}
          className="inline-flex items-center gap-1"
        >
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-xs text-green-600 font-medium">
            {formatQty(stockData.totalAvailable)} avail
          </span>
        </span>
      );
    }

    return null;
  }

  // Full mode: detailed display
  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <Loader2 size={16} className="animate-spin" />
        <span>Checking stock availability...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-between p-2 rounded border ${
        isDarkMode
          ? 'bg-gray-800/50 border-gray-700 text-gray-400'
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={fetchStock}
          className={`p-1 rounded hover:bg-opacity-20 ${
            isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
          }`}
          title="Retry"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  if (!stockData) {
    return null;
  }

  // No stock available
  if (isZero) {
    return (
      <div className={`p-3 rounded-lg border ${
        isDarkMode
          ? 'bg-red-900/20 border-red-700'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              Stock Not Available
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              No stock found for this product{warehouseId ? ' in the selected warehouse' : ''}.
              Consider using Drop Ship or selecting a different warehouse.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Partial stock available
  if (isPartial) {
    return (
      <div className={`p-3 rounded-lg border ${
        isDarkMode
          ? 'bg-amber-900/20 border-amber-700'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              Insufficient Stock
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              Only <strong>{formatQty(stockData.totalAvailable)}</strong> available across {stockData.batchCount} batch(es).
              Need <strong>{formatQty(requiredQty)}</strong>, short by <strong>{formatQty(shortfall)}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sufficient stock
  return (
    <div className={`p-2 rounded-lg border ${
      isDarkMode
        ? 'bg-green-900/20 border-green-700'
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center gap-2">
        <Package size={16} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
        <p className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
          <strong>{formatQty(stockData.totalAvailable)}</strong> available in {stockData.batchCount} batch(es).
          System will auto-allocate using FIFO when invoice is issued.
        </p>
      </div>
    </div>
  );
};

StockAvailabilityIndicator.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  warehouseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  requiredQty: PropTypes.number.isRequired,
  compact: PropTypes.bool,
  iconOnly: PropTypes.bool,
};

export default StockAvailabilityIndicator;
