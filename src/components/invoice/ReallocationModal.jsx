import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  AlertTriangle,
  Package,
  Ship,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import api from '../../services/api';

/**
 * ReallocationModal Component
 * Phase 3: Supervisor workflow for changing batch allocations
 *
 * Props:
 * - isOpen: Whether modal is visible
 * - onClose: Callback when modal closes
 * - invoiceItemId: Invoice item being reallocated
 * - productId: Product ID for fetching available batches
 * - warehouseId: Warehouse ID for filtering batches
 * - currentAllocations: Current batch allocations
 * - requiredQty: Required quantity for the line item
 * - onReallocationComplete: Callback with updated allocations
 */
const ReallocationModal = ({
  isOpen,
  onClose,
  invoiceItemId,
  productId,
  warehouseId,
  currentAllocations = [],
  requiredQty,
  onReallocationComplete,
}) => {
  const { isDarkMode } = useTheme();
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [newAllocations, setNewAllocations] = useState({}); // { batchId: quantity }
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');

  // Valid reason codes (must match backend)
  const REASON_CODES = [
    {
      value: 'CUSTOMER_REQUEST',
      label: 'Customer Request',
      desc: 'Customer asked for specific batch/heat number',
    },
    {
      value: 'QUALITY_ISSUE',
      label: 'Quality Issue',
      desc: 'Original batch has quality concerns',
    },
    {
      value: 'CERTIFICATE_MISMATCH',
      label: 'Certificate Mismatch',
      desc: 'Mill cert does not match requirements',
    },
    {
      value: 'ENTRY_ERROR',
      label: 'Entry Error',
      desc: 'Operator made a mistake',
    },
    {
      value: 'STOCK_ADJUSTMENT',
      label: 'Stock Adjustment',
      desc: 'Inventory count correction',
    },
    {
      value: 'SUPERVISOR_OVERRIDE',
      label: 'Supervisor Override',
      desc: 'Manager decision',
    },
  ];

  // Initialize from current allocations when modal opens
  useEffect(() => {
    if (isOpen && currentAllocations.length > 0) {
      const initial = {};
      currentAllocations.forEach((alloc) => {
        const batchId = alloc.batchId || alloc.batch_id;
        initial[batchId] = alloc.quantity || 0;
      });
      setNewAllocations(initial);
    } else if (isOpen) {
      setNewAllocations({});
    }
    // Reset form state
    setReasonCode('');
    setReasonText('');
    setError(null);
  }, [isOpen, currentAllocations]);

  // Fetch available batches
  const fetchBatches = useCallback(async () => {
    if (!productId || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const params = { productId };
      // Only add warehouseId if it's a valid value (not undefined, null, empty string, or string "undefined")
      if (
        warehouseId &&
        warehouseId !== 'undefined' &&
        warehouseId !== 'null'
      ) {
        params.warehouseId = warehouseId;
      }

      const response = await api.get('/stock-batches/available', { params });
      setAvailableBatches(response.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setError(err.response?.data?.error || 'Failed to load available batches');
    } finally {
      setLoading(false);
    }
  }, [productId, warehouseId, isOpen]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Calculate totals
  const totalNewAllocated = Object.values(newAllocations).reduce(
    (sum, qty) => sum + (parseFloat(qty) || 0),
    0,
  );
  const isComplete = Math.abs(totalNewAllocated - requiredQty) < 0.01;
  const isOverAllocated = totalNewAllocated > requiredQty + 0.01;

  // Calculate cost variance preview
  const calculateCostVariance = () => {
    // Get current cost
    const currentCost = currentAllocations.reduce((sum, alloc) => {
      const qty = alloc.quantity || 0;
      const cost = alloc.unitCost || alloc.unit_cost || 0;
      return sum + qty * cost;
    }, 0);

    // Get new cost
    const newCost = Object.entries(newAllocations).reduce(
      (sum, [batchId, qty]) => {
        const batch = availableBatches.find((b) => b.id === parseInt(batchId));
        const unitCost = batch?.unitCost || 0;
        return sum + (parseFloat(qty) || 0) * unitCost;
      },
      0,
    );

    return newCost - currentCost;
  };

  const costVariance = calculateCostVariance();

  // Handle quantity change
  const handleQuantityChange = (batchId, value) => {
    const qty = value === '' ? '' : parseFloat(value) || 0;
    setNewAllocations((prev) => ({
      ...prev,
      [batchId]: qty,
    }));
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!reasonCode) {
      setError('Please select a reason code');
      return;
    }

    if (!isComplete) {
      setError('Total allocated must equal required quantity');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build changes array by comparing old vs new
      const changes = [];

      // Find deallocations (old batches not in new or reduced quantity)
      currentAllocations.forEach((alloc) => {
        const batchId = alloc.batchId || alloc.batch_id;
        const oldQty = alloc.quantity || 0;
        const newQty = parseFloat(newAllocations[batchId]) || 0;

        if (newQty < oldQty) {
          // Deallocate the difference
          changes.push({
            oldBatchId: batchId,
            oldQuantity: oldQty - newQty,
            newBatchId: 0,
            newQuantity: 0,
          });
        }
      });

      // Find new allocations (batches not in old or increased quantity)
      Object.entries(newAllocations).forEach(([batchIdStr, newQty]) => {
        const batchId = parseInt(batchIdStr);
        const qty = parseFloat(newQty) || 0;
        if (qty <= 0) return;

        const oldAlloc = currentAllocations.find(
          (a) => (a.batchId || a.batch_id) === batchId,
        );
        const oldQty = oldAlloc?.quantity || 0;

        if (qty > oldQty) {
          // Allocate the difference
          changes.push({
            oldBatchId: 0,
            oldQuantity: 0,
            newBatchId: batchId,
            newQuantity: qty - oldQty,
          });
        }
      });

      if (changes.length === 0) {
        setError('No changes detected');
        setSubmitting(false);
        return;
      }

      const response = await api.post(
        `/invoices/items/${invoiceItemId}/reallocate`,
        {
          changes,
          reasonCode,
          reasonText,
        },
      );

      if (response.success) {
        onReallocationComplete?.(response.newAllocations || []);
        onClose();
      } else {
        setError(response.message || 'Reallocation failed');
      }
    } catch (err) {
      console.error('Reallocation failed:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to reallocate batches',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-fill FIFO
  const autoFillFIFO = () => {
    const selections = {};
    let remaining = requiredQty;

    for (const batch of availableBatches) {
      if (remaining <= 0) break;

      const available = batch.quantityAvailable || 0;
      const toAllocate = Math.min(remaining, available);

      if (toAllocate > 0) {
        selections[batch.id] = toAllocate;
        remaining -= toAllocate;
      }
    }

    setNewAllocations(selections);
  };

  // Clear all
  const clearSelections = () => {
    setNewAllocations({});
  };

  // Format helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value || 0);
  };

  const formatQty = (qty) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  const getProcurementBadge = (channel) => {
    if (channel === 'IMPORTED') {
      return (
        <Badge
          className={`inline-flex items-center gap-1 ${
            isDarkMode
              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <Ship size={12} />
          IMP
        </Badge>
      );
    }
    return (
      <Badge
        className={`inline-flex items-center gap-1 ${
          isDarkMode
            ? 'bg-blue-900/40 text-blue-300 border-blue-700'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}
      >
        <Package size={12} />
        LOCAL
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
            isDarkMode
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className="text-lg font-semibold">Reallocate Batches</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error display */}
          {error && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-red-900/20 border border-red-700 text-red-300'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <AlertTriangle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Summary row */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${
              isComplete
                ? isDarkMode
                  ? 'bg-green-900/20 border border-green-700'
                  : 'bg-green-50 border border-green-200'
                : isOverAllocated
                  ? isDarkMode
                    ? 'bg-red-900/20 border border-red-700'
                    : 'bg-red-50 border border-red-200'
                  : isDarkMode
                    ? 'bg-amber-900/20 border border-amber-700'
                    : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-4 text-sm">
              <span>
                Required: <strong>{formatQty(requiredQty)}</strong>
              </span>
              <ArrowRight size={16} />
              <span>
                Allocated: <strong>{formatQty(totalNewAllocated)}</strong>
              </span>
              {costVariance !== 0 && (
                <span
                  className={
                    costVariance > 0 ? 'text-red-500' : 'text-green-500'
                  }
                >
                  Cost Variance: {costVariance > 0 ? '+' : ''}
                  {formatCurrency(costVariance)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={autoFillFIFO}>
                Auto-Fill FIFO
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelections}>
                Clear
              </Button>
            </div>
          </div>

          {/* Batches table */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading batches...</span>
            </div>
          ) : (
            <div
              className={`rounded-lg border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Table>
                <TableHeader>
                  <TableRow
                    className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}
                  >
                    <TableHead className="w-[130px]">Batch #</TableHead>
                    <TableHead className="w-[80px]">Source</TableHead>
                    <TableHead className="text-right w-[100px]">
                      Available
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Unit Cost
                    </TableHead>
                    <TableHead className="text-right w-[120px]">
                      Allocate Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableBatches.map((batch) => {
                    const currentAlloc = currentAllocations.find(
                      (a) => (a.batchId || a.batch_id) === batch.id,
                    );
                    const isCurrentlyAllocated = !!currentAlloc;
                    const selectedQty = newAllocations[batch.id] || 0;

                    return (
                      <TableRow
                        key={batch.id}
                        className={`${
                          selectedQty > 0
                            ? isDarkMode
                              ? 'bg-teal-900/20'
                              : 'bg-teal-50'
                            : isCurrentlyAllocated
                              ? isDarkMode
                                ? 'bg-blue-900/10'
                                : 'bg-blue-50/50'
                              : ''
                        }`}
                      >
                        <TableCell className="font-mono text-sm">
                          {batch.batchNumber || '-'}
                          {isCurrentlyAllocated && (
                            <span className="ml-2 text-xs text-blue-500">
                              (current)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getProcurementBadge(batch.procurementChannel)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatQty(batch.quantityAvailable)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(batch.unitCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <input
                            type="number"
                            min="0"
                            max={
                              batch.quantityAvailable +
                              (currentAlloc?.quantity || 0)
                            }
                            step="0.01"
                            value={selectedQty}
                            onChange={(e) =>
                              handleQuantityChange(batch.id, e.target.value)
                            }
                            className={`w-20 px-2 py-1 text-right text-sm rounded border ${
                              selectedQty > 0
                                ? isDarkMode
                                  ? 'bg-teal-900/30 border-teal-600 text-teal-200'
                                  : 'bg-teal-50 border-teal-400 text-teal-700'
                                : isDarkMode
                                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                                  : 'bg-white border-gray-300 text-gray-700'
                            } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Reallocation Guidance */}
          <div
            className={`p-3 rounded-lg border text-sm ${isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'}`}
          >
            <p className="font-medium mb-1">About Reallocation:</p>
            <p className="text-xs mb-2">
              Change which stock batches are allocated to this invoice line. This is useful for handling customer requests, quality issues, or corrections to initial allocations.
            </p>
            <p className="text-xs font-medium">Requirements:</p>
            <ul className="text-xs list-disc list-inside space-y-1 mt-1">
              <li>Total allocated quantity must match the line quantity</li>
              <li>You must select a reason code explaining the change</li>
              <li>Available batches shown are for the same product and warehouse</li>
            </ul>
          </div>

          {/* Reason code selection */}
          <div className="space-y-3 mt-4">
            <h4
              className={`text-sm font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              Reason for Reallocation <span className="text-red-500">*</span>
            </h4>

            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            >
              <option value="">Select a reason...</option>
              {REASON_CODES.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label} - {code.desc}
                </option>
              ))}
            </select>

            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t ${
            isDarkMode
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !isComplete || !reasonCode}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Apply Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

ReallocationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoiceItemId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  warehouseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currentAllocations: PropTypes.array,
  requiredQty: PropTypes.number.isRequired,
  onReallocationComplete: PropTypes.func,
};

export default ReallocationModal;
