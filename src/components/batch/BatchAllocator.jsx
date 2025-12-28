/**
 * BatchAllocator Component
 * Epic 4: FIFO Batch Allocation
 *
 * Reusable component for allocating stock from batches with FIFO logic.
 * Used in ExportOrderForm, ReservationForm, and TransferForm.
 */

import { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { batchReservationService } from '../../services/batchReservationService';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const BatchAllocator = ({
  open,
  onClose,
  productId,
  warehouseId,
  requiredQuantity,
  currentAllocations = [],
  onAllocate,
  mode: _mode = 'export', // "export" | "reservation" | "transfer"
  draftInvoiceId = null,
}) => {
  const { isDarkMode } = useTheme();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState(currentAllocations);
  const [_fifoSuggested, _setFifoSuggested] = useState(false);

  // Load available batches
  useEffect(() => {
    if (!open || !productId || !warehouseId) return;

    const loadBatches = async () => {
      try {
        setLoading(true);
        const response = await batchReservationService.getAvailableBatches({
          productId,
          warehouseId,
          draftInvoiceId,
        });

        const availableBatches = response.batches || [];
        // Sort by oldest first (FIFO)
        availableBatches.sort(
          (a, b) =>
            new Date(a.created_at || a.procurementDate) -
            new Date(b.created_at || b.procurementDate),
        );

        setBatches(availableBatches);
      } catch (err) {
        console.error('Error loading batches:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, [open, productId, warehouseId, draftInvoiceId]);

  // Calculate totals
  const allocatedQuantity = allocations.reduce(
    (sum, a) => sum + parseFloat(a.quantity || 0),
    0,
  );
  const remainingQuantity =
    parseFloat(requiredQuantity || 0) - allocatedQuantity;
  const isFullyAllocated = remainingQuantity <= 0.01;

  // FIFO Auto-Allocate
  const handleAutoAllocateFIFO = () => {
    const newAllocations = [];
    let remaining = parseFloat(requiredQuantity || 0);

    for (const batch of batches) {
      if (remaining <= 0) break;

      const available = parseFloat(
        batch.quantityAvailable || batch.quantity_available || 0,
      );
      if (available <= 0) continue;

      const allocQty = Math.min(remaining, available);
      newAllocations.push({
        batchId: batch.id || batch.batchId,
        batchNumber:
          batch.batchNumber || batch.batch_number || `BATCH-${batch.id}`,
        quantity: allocQty,
        unitCost: batch.unitCost || batch.unit_cost || 0,
        supplier: batch.supplier || batch.supplierName || 'N/A',
        procurementDate: batch.procurementDate || batch.created_at,
      });

      remaining -= allocQty;
    }

    setAllocations(newAllocations);
  };

  // Manual allocation change
  const handleAllocationChange = (batchId, quantity) => {
    const batch = batches.find(
      (b) => b.id === batchId || b.batchId === batchId,
    );
    if (!batch) return;

    const qty = parseFloat(quantity || 0);
    const available = parseFloat(
      batch.quantityAvailable || batch.quantity_available || 0,
    );

    if (qty > available) {
      return; // Don't allow exceeding available
    }

    const existing = allocations.find((a) => a.batchId === batchId);
    if (existing) {
      if (qty <= 0) {
        setAllocations(allocations.filter((a) => a.batchId !== batchId));
      } else {
        setAllocations(
          allocations.map((a) =>
            a.batchId === batchId ? { ...a, quantity: qty } : a,
          ),
        );
      }
    } else if (qty > 0) {
      setAllocations([
        ...allocations,
        {
          batchId: batch.id || batch.batchId,
          batchNumber:
            batch.batchNumber || batch.batch_number || `BATCH-${batch.id}`,
          quantity: qty,
          unitCost: batch.unitCost || batch.unit_cost || 0,
          supplier: batch.supplier || batch.supplierName || 'N/A',
          procurementDate: batch.procurementDate || batch.created_at,
        },
      ]);
    }
  };

  // Save allocations
  const handleSave = () => {
    onAllocate(allocations);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-2xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode
              ? 'border-gray-700 bg-gray-900'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-teal-500" />
            <h2 className="text-xl font-semibold">Batch Allocation</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Required
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(requiredQuantity)} KG
              </div>
            </div>
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Allocated
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(allocatedQuantity)} KG
              </div>
            </div>
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700'
                  : remainingQuantity > 0.01
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-teal-50 border-teal-200'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Remaining
              </div>
              <div
                className={`text-2xl font-bold ${
                  remainingQuantity > 0.01
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-teal-600 dark:text-teal-400'
                }`}
              >
                {formatNumber(remainingQuantity)} KG
              </div>
            </div>
          </div>

          {/* FIFO Auto-Allocate Button */}
          <div className="mb-4">
            <button
              onClick={handleAutoAllocateFIFO}
              disabled={loading || batches.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white disabled:opacity-50'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white disabled:opacity-50'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Auto-allocate FIFO (Oldest First)
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          )}

          {/* No batches available */}
          {!loading && batches.length === 0 && (
            <div
              className={`flex flex-col items-center justify-center py-12 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <AlertTriangle className="w-12 h-12 text-orange-500 mb-3" />
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                No batches available for this product/warehouse
              </p>
            </div>
          )}

          {/* Batch List */}
          {!loading && batches.length > 0 && (
            <div className="space-y-3">
              {batches.map((batch) => {
                const batchId = batch.id || batch.batchId;
                const available = parseFloat(
                  batch.quantityAvailable || batch.quantity_available || 0,
                );
                const allocation = allocations.find(
                  (a) => a.batchId === batchId,
                );
                const allocated = parseFloat(allocation?.quantity || 0);

                return (
                  <div
                    key={batchId}
                    className={`p-4 rounded-lg border transition-all ${
                      allocated > 0
                        ? isDarkMode
                          ? 'bg-teal-900 bg-opacity-30 border-teal-600'
                          : 'bg-teal-50 border-teal-300'
                        : isDarkMode
                          ? 'bg-gray-900 border-gray-700 hover:border-gray-600'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-semibold text-sm">
                            {batch.batchNumber ||
                              batch.batch_number ||
                              `BATCH-${batchId}`}
                          </span>
                          {allocated > 0 && (
                            <CheckCircle className="w-4 h-4 text-teal-500" />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Package className="w-3 h-3" />
                            Available: {formatNumber(available)} KG
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <TrendingUp className="w-3 h-3" />
                            Cost: AED{' '}
                            {formatNumber(
                              batch.unitCost || batch.unit_cost || 0,
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(
                              batch.procurementDate || batch.created_at,
                            )}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            Supplier:{' '}
                            {batch.supplier || batch.supplierName || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={available}
                          value={allocated || ''}
                          onChange={(e) =>
                            handleAllocationChange(batchId, e.target.value)
                          }
                          placeholder="0.00"
                          className={`w-28 px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <span className="text-xs font-medium text-gray-500">
                          KG
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current Allocations Summary */}
          {allocations.length > 0 && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <h3 className="text-sm font-semibold mb-3">
                Current Allocations ({allocations.length} batch
                {allocations.length !== 1 ? 'es' : ''})
              </h3>
              <div className="space-y-2">
                {allocations.map((alloc) => (
                  <div
                    key={alloc.batchId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono">{alloc.batchNumber}</span>
                    <span className="font-semibold">
                      {formatNumber(alloc.quantity)} KG × AED{' '}
                      {formatNumber(alloc.unitCost)} = AED{' '}
                      {formatNumber(alloc.quantity * alloc.unitCost)}
                    </span>
                  </div>
                ))}
                <div
                  className={`pt-2 border-t ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span className="text-teal-600 dark:text-teal-400">
                      AED{' '}
                      {formatNumber(
                        allocations.reduce(
                          (sum, a) => sum + a.quantity * a.unitCost,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>Weighted Avg Cost:</span>
                    <span>
                      AED{' '}
                      {allocatedQuantity > 0
                        ? formatNumber(
                          allocations.reduce(
                            (sum, a) => sum + a.quantity * a.unitCost,
                            0,
                          ) / allocatedQuantity,
                        )
                        : '0.00'}
                      /KG
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t ${
            isDarkMode
              ? 'border-gray-700 bg-gray-900'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {isFullyAllocated ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Fully Allocated</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {formatNumber(remainingQuantity)} KG remaining
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isFullyAllocated}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                isFullyAllocated
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Save Allocations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAllocator;
