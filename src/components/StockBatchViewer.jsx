import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Package,
  Ship,
  Calendar,
  MapPin,
  Factory,
  Hash,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { stockBatchService } from '../services/stockBatchService';
import { formatCurrency } from '../utils/invoiceUtils';

/**
 * StockBatchViewer Component
 *
 * Displays stock batches for a specific product, grouped or filtered by procurement channel.
 * Shows batch details including costs, quantities, and import-specific information.
 *
 * Usage:
 *   <StockBatchViewer productId={123} companyId={1} />
 *   <StockBatchViewer productId={123} companyId={1} channelFilter="IMPORTED" />
 */
const StockBatchViewer = ({
  productId,
  companyId,
  channelFilter,
  onClose,
  isModal = false,
  showHeader = true,
}) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batches, setBatches] = useState([]);
  const [activeChannel, setActiveChannel] = useState(channelFilter || 'ALL');
  const [expandedBatches, setExpandedBatches] = useState(new Set());

  // Fetch batches
  useEffect(() => {
    if (!productId || !companyId) return;

    const fetchBatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { companyId, hasStock: true };
        if (channelFilter && channelFilter !== 'ALL') {
          params.procurementChannel = channelFilter;
        }
        const response = await stockBatchService.getBatchesByProduct(
          productId,
          params,
        );
        setBatches(response.batches || response || []);
      } catch (err) {
        console.error('Failed to load batches:', err);
        setError(err.message || 'Failed to load stock batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [productId, companyId, channelFilter]);

  // Filter and group batches
  const filteredBatches = useMemo(() => {
    if (activeChannel === 'ALL') return batches;
    return batches.filter((b) => b.procurementChannel === activeChannel);
  }, [batches, activeChannel]);

  const groupedBatches = useMemo(() => {
    return {
      LOCAL: filteredBatches.filter((b) => b.procurementChannel === 'LOCAL'),
      IMPORTED: filteredBatches.filter(
        (b) => b.procurementChannel === 'IMPORTED',
      ),
    };
  }, [filteredBatches]);

  // Calculate totals
  const totals = useMemo(() => {
    const localQty = groupedBatches.LOCAL.reduce(
      (sum, b) => sum + (b.quantityRemaining || 0),
      0,
    );
    const importedQty = groupedBatches.IMPORTED.reduce(
      (sum, b) => sum + (b.quantityRemaining || 0),
      0,
    );
    return { localQty, importedQty, totalQty: localQty + importedQty };
  }, [groupedBatches]);

  // Calculate days in stock
  const getDaysInStock = (receivedDate) => {
    if (!receivedDate) return null;
    const received = new Date(receivedDate);
    const now = new Date();
    const diffTime = Math.abs(now - received);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Toggle batch expansion
  const toggleBatch = (batchId) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const containerClasses = isModal
    ? `fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`
    : '';

  const contentClasses = isModal
    ? `w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-xl ${
        isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
      }`
    : `rounded-xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`;

  const content = (
    <div className={contentClasses}>
      {/* Header */}
      {showHeader && (
        <div
          className={`px-6 py-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Stock Batches
            </h2>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className={`p-1 rounded-lg hover:bg-opacity-10 ${
                  isDarkMode
                    ? 'hover:bg-white text-gray-400'
                    : 'hover:bg-black text-gray-500'
                }`}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Channel Filter Tabs */}
          {!channelFilter && (
            <div className="flex gap-2 mt-4">
              {['ALL', 'LOCAL', 'IMPORTED'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeChannel === channel
                      ? isDarkMode
                        ? 'bg-teal-600 text-white'
                        : 'bg-teal-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {channel === 'ALL' ? 'All Channels' : channel}
                  {channel === 'LOCAL' &&
                    ` (${totals.localQty.toLocaleString()} kg)`}
                  {channel === 'IMPORTED' &&
                    ` (${totals.importedQty.toLocaleString()} kg)`}
                  {channel === 'ALL' &&
                    ` (${totals.totalQty.toLocaleString()} kg)`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={`p-6 ${isModal ? 'overflow-y-auto max-h-[calc(90vh-120px)]' : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
            />
          </div>
        ) : error ? (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              isDarkMode
                ? 'bg-red-900/30 text-red-300'
                : 'bg-red-50 text-red-700'
            }`}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div
            className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>No stock batches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBatches.map((batch) => {
              const isExpanded = expandedBatches.has(batch.id);
              const daysInStock = getDaysInStock(batch.receivedDate);
              const isImported = batch.procurementChannel === 'IMPORTED';

              return (
                <div
                  key={batch.id}
                  className={`rounded-lg border overflow-hidden ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800/50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Batch Header */}
                  <button
                    onClick={() => toggleBatch(batch.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-50 ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown
                          size={18}
                          className={
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }
                        />
                      ) : (
                        <ChevronRight
                          size={18}
                          className={
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }
                        />
                      )}

                      {/* Channel Icon */}
                      {isImported ? (
                        <Ship
                          size={18}
                          className={
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }
                        />
                      ) : (
                        <Package
                          size={18}
                          className={
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }
                        />
                      )}

                      {/* Batch Number */}
                      <div>
                        <span
                          className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {batch.batchNumber || `Batch #${batch.id}`}
                        </span>
                        <span
                          className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {isImported ? 'IMPORTED' : 'LOCAL'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quantity */}
                      <div className="text-right">
                        <div
                          className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {(batch.quantityRemaining || 0).toLocaleString()} kg
                        </div>
                        <div
                          className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          of {(batch.quantityReceived || 0).toLocaleString()} kg
                        </div>
                      </div>

                      {/* Days in Stock */}
                      {daysInStock !== null && (
                        <div
                          className={`text-sm ${
                            daysInStock > 90
                              ? isDarkMode
                                ? 'text-amber-400'
                                : 'text-amber-600'
                              : isDarkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                          }`}
                        >
                          {daysInStock}d
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      className={`px-4 pb-4 pt-2 border-t ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Unit Cost */}
                        <div>
                          <div
                            className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            Unit Cost
                          </div>
                          <div
                            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {formatCurrency(batch.unitCost || 0)}
                          </div>
                        </div>

                        {/* Landed Cost (for imports) */}
                        {isImported && (
                          <div>
                            <div
                              className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              Landed Cost/Unit
                            </div>
                            <div
                              className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {formatCurrency(batch.landedCostPerUnit || 0)}
                            </div>
                          </div>
                        )}

                        {/* Received Date */}
                        <div>
                          <div
                            className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            <Calendar size={12} className="inline mr-1" />
                            Received
                          </div>
                          <div
                            className={
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }
                          >
                            {formatDate(batch.receivedDate)}
                          </div>
                        </div>

                        {/* Days in Stock */}
                        <div>
                          <div
                            className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            Days in Stock
                          </div>
                          <div
                            className={`font-medium ${
                              daysInStock > 90
                                ? isDarkMode
                                  ? 'text-amber-400'
                                  : 'text-amber-600'
                                : isDarkMode
                                  ? 'text-white'
                                  : 'text-gray-900'
                            }`}
                          >
                            {daysInStock ?? '-'} days
                          </div>
                        </div>

                        {/* Import-specific fields */}
                        {isImported && (
                          <>
                            {/* Container Number */}
                            {batch.containerNumber && (
                              <div>
                                <div
                                  className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                  <Hash size={12} className="inline mr-1" />
                                  Container
                                </div>
                                <div
                                  className={
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }
                                >
                                  {batch.containerNumber}
                                </div>
                              </div>
                            )}

                            {/* Country of Origin */}
                            {batch.countryOfOrigin && (
                              <div>
                                <div
                                  className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                  <MapPin size={12} className="inline mr-1" />
                                  Origin
                                </div>
                                <div
                                  className={
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }
                                >
                                  {batch.countryOfOrigin}
                                </div>
                              </div>
                            )}

                            {/* Mill Name */}
                            {batch.millName && (
                              <div>
                                <div
                                  className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                  <Factory size={12} className="inline mr-1" />
                                  Mill
                                </div>
                                <div
                                  className={
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }
                                >
                                  {batch.millName}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return <div className={containerClasses}>{content}</div>;
  }

  return content;
};

StockBatchViewer.propTypes = {
  /** Product ID to show batches for */
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  /** Company ID for API calls */
  companyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  /** Filter to specific channel: LOCAL, IMPORTED, or ALL */
  channelFilter: PropTypes.oneOf(['LOCAL', 'IMPORTED', 'ALL']),
  /** Callback when modal is closed */
  onClose: PropTypes.func,
  /** Render as modal overlay */
  isModal: PropTypes.bool,
  /** Show header with title and filters */
  showHeader: PropTypes.bool,
};

export default StockBatchViewer;
