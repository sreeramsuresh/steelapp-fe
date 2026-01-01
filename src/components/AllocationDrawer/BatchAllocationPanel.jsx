import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { batchReservationService } from '../../services/batchReservationService';
import useBulkActions, { BulkCheckbox } from '../../hooks/useBulkActions';

/**
 * BatchAllocationPanel Component
 *
 * Displays available batches and allows FIFO auto-allocation or manual selection.
 * Integrates with the Phase 1 Reservation APIs.
 *
 * Features:
 * - Fetches available batches with real-time availability
 * - Auto-Fill FIFO button for automated allocation
 * - Manual quantity input per batch
 * - Real-time total calculation
 * - Shortfall warning display
 */
const BatchAllocationPanel = ({
  productId,
  warehouseId,
  draftInvoiceId,
  _lineItemTempId,
  requiredQuantity,
  unit = 'KG',
  _companyId,
  _onAllocationsChange,
  reserveFIFO,
  reserveManual,
  allocations = [],
  loading = false,
  error = null,
}) => {
  const [batches, setBatches] = useState([]);
  const [manualAllocations, setManualAllocations] = useState({});
  const [fetchingBatches, setFetchingBatches] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isAllocating, setIsAllocating] = useState(false);

  // Multi-select for manual batch allocation (Phase 4)
  const {
    isSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    hasSelection,
  } = useBulkActions({
    items: batches,
    getId: (batch) => batch.id,
  });

  // Fetch available batches
  const fetchBatches = useCallback(async () => {
    if (!productId || !warehouseId) return;

    setFetchingBatches(true);
    setFetchError(null);

    try {
      const response = await batchReservationService.getAvailableBatches({
        productId,
        warehouseId,
        draftInvoiceId: draftInvoiceId || 0,
      });

      setBatches(response.batches || []);
    } catch (err) {
      console.error('Failed to fetch available batches:', err);
      setFetchError('Failed to load available batches');
      setBatches([]);
    } finally {
      setFetchingBatches(false);
    }
  }, [productId, warehouseId, draftInvoiceId]);

  // Fetch batches when product/warehouse changes
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Clear errors when user changes product or quantity (fixes stale error messages)
  useEffect(() => {
    setFetchError(null);
  }, [productId, requiredQuantity]);

  // Handle Auto-Fill FIFO
  const handleAutoFIFO = useCallback(async () => {
    // Clear previous errors
    setFetchError(null);

    // Validate all required fields with precise error messages
    const errors = [];

    if (!productId) {
      errors.push('• Product: Please select a product first.');
    }
    if (!warehouseId) {
      errors.push(
        '• Warehouse: Please select a warehouse from the list above.',
      );
    }
    if (!requiredQuantity || requiredQuantity <= 0) {
      errors.push('• Quantity: Please enter a quantity greater than 0.');
    }
    if (!unit) {
      errors.push('• Unit: Please select a unit (KG/PCS/MT/M).');
    }

    if (errors.length > 0) {
      setFetchError(
        `Cannot allocate - Missing required fields:\n\n${errors.join('\n')}`,
      );
      return;
    }

    // Check if selected warehouse has stock
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + parseFloat(batch.quantityAllocatable || 0),
      0,
    );

    if (totalAvailable === 0) {
      setFetchError(
        'Cannot allocate - Selected warehouse has 0 stock available.\n\nPlease select a different warehouse or use drop-ship source type.',
      );
      return;
    }

    setIsAllocating(true);
    try {
      await reserveFIFO(requiredQuantity, unit);
      // Refresh batches to get updated availability
      await fetchBatches();
    } catch (err) {
      console.error('FIFO allocation failed:', err);
      // Format backend error nicely
      const backendError =
        err.response?.data?.message || err.message || 'Unknown error';
      setFetchError(`Allocation failed:\n\n${backendError}`);
    } finally {
      setIsAllocating(false);
    }
  }, [
    productId,
    warehouseId,
    requiredQuantity,
    unit,
    batches,
    reserveFIFO,
    fetchBatches,
  ]);

  // Handle manual allocation change for a batch
  const handleManualAllocationChange = useCallback(
    (batchId, value) => {
      // Parse and validate value
      let qty = 0;
      if (value !== '') {
        qty = parseFloat(value);
        if (isNaN(qty) || qty < 0) return;
      }

      // Find the batch to check max allocatable
      const batch = batches.find((b) => b.id === batchId);
      const maxAllocatable = parseFloat(batch?.quantityAllocatable || 0);

      // Clamp to max
      if (qty > maxAllocatable) {
        qty = maxAllocatable;
      }

      setManualAllocations((prev) => ({
        ...prev,
        [batchId]: qty > 0 ? qty : undefined,
      }));
    },
    [batches],
  );

  // Apply manual allocations (only for selected batches with quantities)
  const handleApplyManual = useCallback(async () => {
    const allocs = Object.entries(manualAllocations)
      .filter(([batchId, qty]) => {
        // Only include batches that are selected AND have a quantity
        const batch = batches.find((b) => b.id === parseInt(batchId));
        return batch && isSelected(batch) && qty && qty > 0;
      })
      .map(([batchId, qty]) => ({
        batchId: parseInt(batchId),
        quantity: qty,
      }));

    if (allocs.length === 0) {
      return;
    }

    setIsAllocating(true);
    try {
      await reserveManual(allocs);
      setManualAllocations({});
      clearSelection(); // Clear selection after successful allocation
      await fetchBatches();
    } catch (err) {
      console.error('Manual allocation failed:', err);
    } finally {
      setIsAllocating(false);
    }
  }, [
    manualAllocations,
    batches,
    isSelected,
    reserveManual,
    fetchBatches,
    clearSelection,
  ]);

  // Calculate totals from current allocations
  const { totalAllocated, totalCost } = useMemo(() => {
    const allocated = (allocations || []).reduce(
      (sum, a) => sum + parseFloat(a.quantity || 0),
      0,
    );
    const cost = (allocations || []).reduce(
      (sum, a) => sum + parseFloat(a.totalCost || 0),
      0,
    );
    return { totalAllocated: allocated, totalCost: cost };
  }, [allocations]);

  // Check if we have pending manual allocations
  const hasPendingManual = useMemo(() => {
    return Object.values(manualAllocations).some((qty) => qty && qty > 0);
  }, [manualAllocations]);

  // Shortfall calculation
  const shortfall = requiredQuantity - totalAllocated;
  const isPartialAllocation = shortfall > 0.001;

  // Format date for display
  const _formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (_e) {
      return 'N/A';
    }
  };

  // Get allocation for a specific batch (from current allocations)
  const getAllocationForBatch = (batchId) => {
    return allocations?.find((a) => a.batchId === batchId);
  };

  if (fetchingBatches && batches.length === 0) {
    return (
      <div className="batch-allocation-panel">
        <div className="panel-loading">Loading available batches...</div>
      </div>
    );
  }

  return (
    <div className="batch-allocation-panel">
      <div className="panel-header">
        <h4>Batch Allocation</h4>
        <button
          type="button"
          className="btn-auto-fifo"
          onClick={handleAutoFIFO}
          disabled={loading || isAllocating}
        >
          {isAllocating ? 'Allocating...' : 'Auto-Fill FIFO'}
        </button>
      </div>

      {fetchError && <div className="panel-error">{fetchError}</div>}
      {error && <div className="panel-error">{error}</div>}

      {batches.length === 0 && !fetchingBatches ? (
        <div className="panel-empty">
          No available batches for this product in this warehouse.
        </div>
      ) : (
        <>
          <div className="batch-table-container">
            <table className="batch-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <BulkCheckbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={toggleSelectAll}
                      size="sm"
                      aria-label="Select all batches"
                    />
                  </th>
                  <th>Batch</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Allocate</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const currentAlloc = getAllocationForBatch(batch.id);
                  const allocatedQty = currentAlloc
                    ? parseFloat(currentAlloc.quantity)
                    : 0;
                  const manualQty = manualAllocations[batch.id] || '';
                  const batchSelected = isSelected(batch);
                  const canEnterQty = batchSelected && allocatedQty === 0;

                  return (
                    <tr
                      key={batch.id}
                      className={`${allocatedQty > 0 ? 'allocated-row' : ''} ${batchSelected ? 'selected-row' : ''}`}
                    >
                      <td className="checkbox-col">
                        <BulkCheckbox
                          checked={batchSelected}
                          onChange={() => toggleSelect(batch)}
                          size="sm"
                          disabled={allocatedQty > 0}
                          aria-label={`Select batch ${batch.batchNumber}`}
                        />
                      </td>
                      <td>
                        <div className="batch-info">
                          <span className="batch-number">
                            {batch.batchNumber || 'N/A'}
                          </span>
                          <span className="batch-channel">
                            {batch.procurementChannel || 'LOCAL'}
                          </span>
                          {batch.daysInStock !== undefined && (
                            <span className="batch-age">
                              {batch.daysInStock}d
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="qty-cell">
                        <span className="qty-available">
                          {parseFloat(batch.quantityAllocatable || 0).toFixed(
                            3,
                          )}
                        </span>
                        <span className="qty-unit">{batch.unit || unit}</span>
                      </td>
                      <td className="qty-cell">
                        {parseFloat(batch.quantityReservedOthers || 0) > 0 && (
                          <span className="reserved-indicator">
                            {parseFloat(batch.quantityReservedOthers).toFixed(
                              3,
                            )}
                          </span>
                        )}
                        {allocatedQty > 0 && (
                          <span className="my-allocation">
                            {allocatedQty.toFixed(3)}
                          </span>
                        )}
                      </td>
                      <td className="input-cell">
                        {allocatedQty > 0 ? (
                          <span className="allocated-qty">
                            {allocatedQty.toFixed(3)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            max={parseFloat(batch.quantityAllocatable)}
                            value={manualQty}
                            onChange={(e) =>
                              handleManualAllocationChange(
                                batch.id,
                                e.target.value,
                              )
                            }
                            placeholder={canEnterQty ? '0' : '-'}
                            disabled={loading || isAllocating || !canEnterQty}
                            title={
                              canEnterQty
                                ? 'Enter quantity to allocate'
                                : 'Select batch first to enter quantity'
                            }
                          />
                        )}
                      </td>
                      <td className="cost-cell">
                        <span className="unit-cost">
                          {parseFloat(batch.unitCost || 0).toFixed(2)}
                        </span>
                        <span className="cost-unit">
                          AED/{batch.unit || unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selection info and manual allocation apply button */}
          {(hasSelection || hasPendingManual) && (
            <div className="manual-actions">
              {hasSelection && (
                <span className="selection-info">
                  {selectedCount} batch{selectedCount !== 1 ? 'es' : ''}{' '}
                  selected
                  <button
                    type="button"
                    className="btn-clear-selection"
                    onClick={clearSelection}
                    title="Clear selection"
                  >
                    ×
                  </button>
                </span>
              )}
              {hasPendingManual && (
                <button
                  type="button"
                  className="btn-apply-manual"
                  onClick={handleApplyManual}
                  disabled={loading || isAllocating}
                >
                  Apply Manual Allocations
                </button>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="allocation-totals">
            <div className="total-row">
              <span>Allocated:</span>
              <strong>
                {totalAllocated.toFixed(3)} / {requiredQuantity.toFixed(3)}{' '}
                {unit}
              </strong>
            </div>
            {totalCost > 0 && (
              <div className="total-row">
                <span>Total Cost:</span>
                <strong>{totalCost.toFixed(2)} AED</strong>
              </div>
            )}
          </div>

          {/* Shortfall Warning */}
          {isPartialAllocation && requiredQuantity > 0 && (
            <div className="shortfall-warning">
              <span className="warning-icon">Warning:</span>
              <span>
                Shortfall of {shortfall.toFixed(3)} {unit} - Insufficient stock
                available
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

BatchAllocationPanel.propTypes = {
  productId: PropTypes.number.isRequired,
  warehouseId: PropTypes.number.isRequired,
  draftInvoiceId: PropTypes.number,
  lineItemTempId: PropTypes.string.isRequired,
  requiredQuantity: PropTypes.number,
  unit: PropTypes.string,
  companyId: PropTypes.number,
  onAllocationsChange: PropTypes.func,
  reserveFIFO: PropTypes.func.isRequired,
  reserveManual: PropTypes.func.isRequired,
  allocations: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default BatchAllocationPanel;
