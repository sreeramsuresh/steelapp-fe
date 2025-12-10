import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Package, Ship } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { stockBatchService } from '../services/stockBatchService';

/**
 * ProcurementBadge Component
 * 
 * Displays stock availability by procurement channel (LOCAL/IMPORTED).
 * Shows two small badges indicating available stock in each channel.
 * 
 * Usage:
 *   <ProcurementBadge productId={123} companyId={1} />
 *   <ProcurementBadge localQty={500} importedQty={1200} unit="kg" />
 */
const ProcurementBadge = ({
  productId,
  companyId,
  localQty: propLocalQty,
  importedQty: propImportedQty,
  unit = 'kg',
  size = 'default',
  showZero = false,
  onLoad,
}) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [localQty, setLocalQty] = useState(propLocalQty ?? null);
  const [importedQty, setImportedQty] = useState(propImportedQty ?? null);

  // Fetch procurement summary if productId is provided and quantities not passed
  useEffect(() => {
    if (productId && companyId && propLocalQty === undefined && propImportedQty === undefined) {
      const fetchSummary = async () => {
        setLoading(true);
        try {
          const summary = await stockBatchService.getProcurementSummary(productId, { companyId });
          setLocalQty(summary.localQty ?? 0);
          setImportedQty(summary.importedQty ?? 0);
          if (onLoad) {
            onLoad(summary);
          }
        } catch (error) {
          console.error('Failed to load procurement summary:', error);
          setLocalQty(0);
          setImportedQty(0);
        } finally {
          setLoading(false);
        }
      };
      fetchSummary();
    }
  }, [productId, companyId, propLocalQty, propImportedQty, onLoad]);

  // Update from props if provided
  useEffect(() => {
    if (propLocalQty !== undefined) setLocalQty(propLocalQty);
    if (propImportedQty !== undefined) setImportedQty(propImportedQty);
  }, [propLocalQty, propImportedQty]);

  // Format quantity for display
  const formatQty = (qty) => {
    if (qty === null || qty === undefined) return '...';
    if (qty >= 1000) {
      return `${(qty / 1000).toFixed(1)}t`;
    }
    return `${qty.toLocaleString()} ${unit}`;
  };

  // Size variants
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    default: 'px-2 py-1 text-xs gap-1',
    lg: 'px-3 py-1.5 text-sm gap-1.5',
  };

  const iconSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;

  // Don't render if both are zero and showZero is false
  if (!showZero && !loading && localQty === 0 && importedQty === 0) {
    return null;
  }

  const showLocal = showZero || loading || (localQty !== null && localQty > 0);
  const showImported = showZero || loading || (importedQty !== null && importedQty > 0);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* LOCAL Badge - Blue */}
      {showLocal && (
        <span
          className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${
            isDarkMode
              ? 'bg-blue-900/40 text-blue-300 border-blue-700'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          } ${loading ? 'animate-pulse' : ''}`}
          title={`Local stock: ${localQty ?? 0} ${unit}`}
        >
          <Package size={iconSize} />
          <span>LOCAL: {loading ? '...' : formatQty(localQty)}</span>
        </span>
      )}

      {/* IMPORTED Badge - Green */}
      {showImported && (
        <span
          className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${
            isDarkMode
              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          } ${loading ? 'animate-pulse' : ''}`}
          title={`Imported stock: ${importedQty ?? 0} ${unit}`}
        >
          <Ship size={iconSize} />
          <span>IMPORTED: {loading ? '...' : formatQty(importedQty)}</span>
        </span>
      )}
    </div>
  );
};

ProcurementBadge.propTypes = {
  /** Product ID to fetch summary for */
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Company ID for API calls */
  companyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Pre-loaded local quantity (skips API call) */
  localQty: PropTypes.number,
  /** Pre-loaded imported quantity (skips API call) */
  importedQty: PropTypes.number,
  /** Unit of measurement */
  unit: PropTypes.string,
  /** Badge size variant */
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  /** Show badges even when quantity is zero */
  showZero: PropTypes.bool,
  /** Callback when data is loaded */
  onLoad: PropTypes.func,
};

export default ProcurementBadge;
