/**
 * StockReceiptForm Component
 * Phase 4.4: PO Stock Receiving with Partial Support
 *
 * A modal component for receiving stock from a purchase order.
 * Supports:
 * - Full receiving (all pending items)
 * - Partial receiving (selected items with custom quantities)
 * - Warehouse selection
 * - Notes and batch/coil/heat tracking
 *
 * Refactored: Tailwind CSS with dark mode support
 */

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Package, Truck, AlertTriangle, CheckCircle, Warehouse, ChevronDown } from 'lucide-react';
import { stockMovementService } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';

/**
 * Format quantity with unit
 */
const formatQuantity = (quantity, unit = 'KG') => {
  const num = parseFloat(quantity) || 0;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

/**
 * Calculate receiving status for an item
 */
const getReceivingStatus = (item) => {
  const ordered = parseFloat(item.quantity) || 0;
  const received = parseFloat(item.receivedQuantity) || 0;

  if (received >= ordered) {
    return { status: 'complete', label: 'Complete', color: 'green' };
  } else if (received > 0) {
    return { status: 'partial', label: 'Partial', color: 'yellow' };
  }
  return { status: 'pending', label: 'Pending', color: 'gray' };
};

const StockReceiptForm = ({
  open,
  onClose,
  purchaseOrderId,
  poNumber,
  poItems = [],
  defaultWarehouseId = null,
  onSuccess,
}) => {
  const { isDarkMode } = useTheme();

  // Theme classes
  const overlayBg = 'bg-black/60';
  const modalBg = isDarkMode ? 'bg-[#141a20]' : 'bg-white';
  const modalBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const cardBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50';
  const cardBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-300';
  const textPrimary = isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500';
  const tableBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const tableHeaderBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50';
  const tableRowHover = isDarkMode ? 'hover:bg-[#1a2129]' : 'hover:bg-gray-50';
  const inputFocus = 'focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20';

  // State
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(defaultWarehouseId || '');
  const [selectedItems, setSelectedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);

        // Set default warehouse
        if (!selectedWarehouseId && result.data?.length > 0) {
          const defaultWh = result.data.find((w) => w.isDefault) || result.data[0];
          setSelectedWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error('Error fetching warehouses:', err);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    if (open) {
      fetchWarehouses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Initialize selected items and quantities when poItems change
  useEffect(() => {
    if (poItems && poItems.length > 0) {
      const initialSelected = {};
      const initialQuantities = {};

      poItems.forEach((item) => {
        const pending =
          parseFloat(item.pendingQuantity) ||
          parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);

        // Only select items with pending quantities
        if (pending > 0) {
          initialSelected[item.id] = true;
          initialQuantities[item.id] = pending;
        }
      });

      setSelectedItems(initialSelected);
      setQuantities(initialQuantities);
    }
  }, [poItems]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, loading]);

  // Filter items to only those with products (can create stock movements)
  const receivableItems = useMemo(() => {
    return poItems.filter((item) => item.productId || item.product_id);
  }, [poItems]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalOrdered = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let totalToReceive = 0;

    receivableItems.forEach((item) => {
      const ordered = parseFloat(item.quantity) || 0;
      const received = parseFloat(item.receivedQuantity) || 0;
      const pending = parseFloat(item.pendingQuantity) || ordered - received;

      totalOrdered += ordered;
      totalReceived += received;
      totalPending += pending;

      if (selectedItems[item.id]) {
        totalToReceive += parseFloat(quantities[item.id]) || 0;
      }
    });

    return { totalOrdered, totalReceived, totalPending, totalToReceive };
  }, [receivableItems, selectedItems, quantities]);

  // Handle select all
  const handleSelectAll = (checked) => {
    const newSelected = {};
    if (checked) {
      receivableItems.forEach((item) => {
        const pending =
          parseFloat(item.pendingQuantity) ||
          parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);
        if (pending > 0) {
          newSelected[item.id] = true;
        }
      });
    }
    setSelectedItems(newSelected);
  };

  // Handle individual item selection
  const handleSelectItem = (itemId, checked) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, value) => {
    const item = receivableItems.find((i) => i.id === itemId);
    if (!item) return;

    const maxQty =
      parseFloat(item.pendingQuantity) ||
      parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);
    const newValue = Math.min(Math.max(0, parseFloat(value) || 0), maxQty);

    setQuantities((prev) => ({
      ...prev,
      [itemId]: newValue,
    }));
  };

  // Set quantity to max (pending)
  const handleSetMaxQuantity = (itemId) => {
    const item = receivableItems.find((i) => i.id === itemId);
    if (!item) return;

    const maxQty =
      parseFloat(item.pendingQuantity) ||
      parseFloat(item.quantity) - parseFloat(item.receivedQuantity || 0);

    setQuantities((prev) => ({
      ...prev,
      [itemId]: maxQty,
    }));
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Validate
      if (!selectedWarehouseId) {
        setError('Please select a warehouse');
        setLoading(false);
        return;
      }

      // Build items to receive
      const itemsToReceive = [];
      Object.entries(selectedItems).forEach(([itemId, isSelected]) => {
        if (isSelected) {
          const qty = parseFloat(quantities[itemId]) || 0;
          if (qty > 0) {
            const item = receivableItems.find((i) => i.id === parseInt(itemId));
            if (item) {
              itemsToReceive.push({
                itemId: parseInt(itemId),
                productId: item.productId || item.product_id,
                receivedQuantity: qty,
              });
            }
          }
        }
      });

      if (itemsToReceive.length === 0) {
        setError('No items selected for receiving');
        setLoading(false);
        return;
      }

      // Call API
      const result = await stockMovementService.createFromPurchaseOrder(
        purchaseOrderId,
        selectedWarehouseId,
        itemsToReceive,
        notes,
      );

      if (result.success || result.totalCreated > 0) {
        setSuccess(`Successfully received ${result.totalCreated} item(s) into stock`);

        // Call success callback after short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result);
          }
          onClose();
        }, 1500);
      } else if (result.errors && result.errors.length > 0) {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      console.error('Error receiving stock:', err);
      setError(err.message || 'Failed to receive stock');
    } finally {
      setLoading(false);
    }
  };

  // Check if any items are selected
  const hasSelectedItems = Object.values(selectedItems).some((v) => v);
  const allSelected =
    receivableItems.length > 0 &&
    receivableItems
      .filter((i) => {
        const pending =
          parseFloat(i.pendingQuantity) ||
          parseFloat(i.quantity) - parseFloat(i.receivedQuantity || 0);
        return pending > 0;
      })
      .every((i) => selectedItems[i.id]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 ${overlayBg} z-40 transition-opacity`}
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`${modalBg} border ${modalBorder} rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${modalBorder}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${cardBg}`}>
                <Truck className="w-5 h-5 text-[#4aa3ff]" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${textPrimary}`}>Receive Stock</h2>
                <p className={`text-xs ${textMuted}`}>PO: {poNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className={`p-2 rounded-xl ${cardBg} ${textMuted} hover:${textPrimary} transition-colors disabled:opacity-50`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            {/* Warehouse Selection */}
            <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
              <label className={`text-xs font-medium ${textMuted} mb-2 flex items-center gap-2`}>
                <Warehouse className="w-4 h-4" />
                Destination Warehouse
              </label>
              <div className="relative">
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  disabled={loadingWarehouses}
                  className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-2.5 px-3 pr-10 text-sm ${textPrimary} ${inputFocus} outline-none appearance-none disabled:opacity-50`}
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.code ? `(${wh.code})` : ''} {wh.isDefault && '(Default)'}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted} pointer-events-none`} />
              </div>
            </div>

            {/* No receivable items warning */}
            {receivableItems.length === 0 ? (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${textPrimary}`}>No Receivable Items</p>
                  <p className={`text-xs ${textMuted} mt-1`}>
                    No items with linked products found. Stock movements can only be created for items that are linked to products in inventory.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className={`${cardBg} border ${cardBorder} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textMuted}`}>Total Ordered</p>
                    <p className={`text-base font-bold ${textPrimary} font-mono mt-1`}>
                      {formatQuantity(totals.totalOrdered)}
                    </p>
                  </div>
                  <div className={`${cardBg} border ${cardBorder} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textMuted}`}>Already Received</p>
                    <p className="text-base font-bold text-green-400 font-mono mt-1">
                      {formatQuantity(totals.totalReceived)}
                    </p>
                  </div>
                  <div className={`${cardBg} border ${cardBorder} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textMuted}`}>Pending</p>
                    <p className="text-base font-bold text-yellow-400 font-mono mt-1">
                      {formatQuantity(totals.totalPending)}
                    </p>
                  </div>
                  <div className="bg-[#4aa3ff]/20 border border-[#4aa3ff]/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-[#4aa3ff]">To Receive Now</p>
                    <p className="text-base font-bold text-[#4aa3ff] font-mono mt-1">
                      {formatQuantity(totals.totalToReceive)}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className={`border ${tableBorder} rounded-xl overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={tableHeaderBg}>
                          <th className={`p-3 border-b ${tableBorder} w-10`}>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = hasSelectedItems && !allSelected;
                              }}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-400 text-[#4aa3ff] focus:ring-[#4aa3ff]/20"
                            />
                          </th>
                          <th className={`p-3 border-b ${tableBorder} text-left ${textMuted} font-medium`}>
                            Product
                          </th>
                          <th className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium`}>
                            Ordered
                          </th>
                          <th className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium`}>
                            Received
                          </th>
                          <th className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium`}>
                            Pending
                          </th>
                          <th className={`p-3 border-b ${tableBorder} text-center ${textMuted} font-medium`}>
                            Status
                          </th>
                          <th className={`p-3 border-b ${tableBorder} text-right ${textMuted} font-medium min-w-[140px]`}>
                            Qty to Receive
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivableItems.map((item) => {
                          const ordered = parseFloat(item.quantity) || 0;
                          const received = parseFloat(item.receivedQuantity) || 0;
                          const pending = parseFloat(item.pendingQuantity) || ordered - received;
                          const status = getReceivingStatus(item);
                          const isComplete = pending <= 0;
                          const isSelected = selectedItems[item.id];

                          const statusColors = {
                            green: 'bg-green-500/15 text-green-400 border-green-500/30',
                            yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                            gray: isDarkMode ? 'bg-[#2a3640] text-[#93a4b4] border-[#3a4650]' : 'bg-gray-100 text-gray-500 border-gray-300',
                          };

                          return (
                            <tr
                              key={item.id}
                              className={`${isComplete ? 'opacity-50' : ''} ${isSelected && !isComplete ? (isDarkMode ? 'bg-[#4aa3ff]/5' : 'bg-blue-50') : ''} ${tableRowHover} transition-colors`}
                            >
                              <td className={`p-3 border-b ${tableBorder}`}>
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                  disabled={isComplete}
                                  className="w-4 h-4 rounded border-gray-400 text-[#4aa3ff] focus:ring-[#4aa3ff]/20 disabled:opacity-50"
                                />
                              </td>
                              <td className={`p-3 border-b ${tableBorder}`}>
                                <p className={`font-medium ${textPrimary}`}>
                                  {item.name || item.productName || `Product #${item.productId}`}
                                </p>
                                {item.productSku && (
                                  <p className={`text-xs ${textMuted} font-mono`}>SKU: {item.productSku}</p>
                                )}
                              </td>
                              <td className={`p-3 border-b ${tableBorder} text-right font-mono ${textPrimary}`}>
                                {formatQuantity(ordered, item.unit)}
                              </td>
                              <td className={`p-3 border-b ${tableBorder} text-right font-mono text-green-400`}>
                                {formatQuantity(received, item.unit)}
                              </td>
                              <td className={`p-3 border-b ${tableBorder} text-right font-mono ${pending > 0 ? 'text-yellow-400' : textMuted}`}>
                                {formatQuantity(pending, item.unit)}
                              </td>
                              <td className={`p-3 border-b ${tableBorder} text-center`}>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusColors[status.color]}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className={`p-3 border-b ${tableBorder}`}>
                                {!isComplete ? (
                                  <div className="flex items-center gap-2 justify-end">
                                    <input
                                      type="number"
                                      value={quantities[item.id] || ''}
                                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                      disabled={!isSelected}
                                      min={0}
                                      max={pending}
                                      step={0.01}
                                      className={`w-24 ${inputBg} border ${inputBorder} rounded-xl py-1.5 px-2 text-sm text-right font-mono ${textPrimary} ${inputFocus} outline-none disabled:opacity-50`}
                                    />
                                    <button
                                      onClick={() => handleSetMaxQuantity(item.id)}
                                      disabled={!isSelected}
                                      title="Set max quantity"
                                      className={`p-1.5 rounded-lg ${cardBg} ${textMuted} hover:text-[#4aa3ff] transition-colors disabled:opacity-50`}
                                    >
                                      <Package className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`text-center block ${textMuted}`}>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes Accordion */}
                <details className={`${cardBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                  <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                    <div>
                      <div className={`text-sm font-bold ${textPrimary}`}>Receipt Notes</div>
                      <div className={`text-xs ${textMuted}`}>Optional notes about this stock receipt</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                  </summary>
                  <div className={`p-3 border-t ${cardBorder}`}>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this stock receipt..."
                      rows={3}
                      className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-2.5 px-3 text-sm ${textPrimary} ${inputFocus} outline-none resize-none`}
                    />
                  </div>
                </details>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between gap-3 p-4 border-t ${modalBorder}`}>
            <div className={`text-xs ${textMuted}`}>
              {hasSelectedItems ? (
                <span>
                  {Object.values(selectedItems).filter(Boolean).length} item(s) selected
                </span>
              ) : (
                <span>Select items to receive</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className={`px-4 py-2.5 rounded-xl border ${cardBorder} ${textPrimary} text-sm font-medium hover:${cardBg} transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !hasSelectedItems || totals.totalToReceive <= 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4aa3ff] text-white text-sm font-medium hover:bg-[#3d8ee6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Receiving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Receive {formatQuantity(totals.totalToReceive)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StockReceiptForm;
