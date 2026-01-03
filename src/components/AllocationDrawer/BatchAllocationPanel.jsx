import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { batchReservationService } from '../../services/batchReservationService';
import useBulkActions, { BulkCheckbox } from '../../hooks/useBulkActions';

/**
 * BatchAllocationPanel Component (PCS-CENTRIC)
 *
 * INDUSTRY STANDARD IMPLEMENTATION:
 * - Allocation is ALWAYS in PCS (pieces), never KG
 * - Weight is displayed for informational purposes only
 * - Shortfall is reported in PCS, never KG
 * - Integer-only input for PCS quantities
 *
 * Features:
 * - Fetches available batches with real-time PCS availability
 * - Auto-Fill FIFO button for automated PCS allocation
 * - Manual PCS input per batch (integer only)
 * - Displays both PCS and derived KG weight
 * - PCS-based shortfall warning display
 */
const BatchAllocationPanel = ({
  productId,
  warehouseId,
  draftInvoiceId,
  _lineItemTempId,
  requiredQuantity, // Now interpreted as PCS (integer)
  unit = 'PCS', // Default to PCS (industry standard)
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
      // PCS-CENTRIC: Pass integer PCS to backend (industry standard)
      const requestedPcs = Math.floor(requiredQuantity);
      await reserveFIFO(requestedPcs, 'PCS');
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

  // Handle manual allocation change for a batch (PCS-CENTRIC: integer only)
  const handleManualAllocationChange = useCallback(
    (batchId, value) => {
      // Parse and validate value (INTEGER PCS ONLY)
      let pcs = 0;
      if (value !== '') {
        pcs = parseInt(value, 10);
        if (isNaN(pcs) || pcs < 0) return;
      }

      // Find the batch to check max allocatable PCS
      const batch = batches.find((b) => b.id === batchId);
      // Use pcsAvailable (new PCS field) or fall back to quantityAllocatable
      const maxAllocatablePcs = parseInt(
        batch?.pcsAvailable || batch?.quantityAllocatable || 0,
        10,
      );

      // Clamp to max
      if (pcs > maxAllocatablePcs) {
        pcs = maxAllocatablePcs;
      }

      setManualAllocations((prev) => ({
        ...prev,
        [batchId]: pcs > 0 ? pcs : undefined,
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
  // Note: totalCost (COGS) is calculated in parent for per-unit margin display
  const { totalAllocated } = useMemo(() => {
    const allocated = (allocations || []).reduce(
      (sum, a) => sum + parseFloat(a.quantity || 0),
      0,
    );
    return { totalAllocated: allocated };
  }, [allocations]);

  // Check if we have pending manual allocations
  const hasPendingManual = useMemo(() => {
    return Object.values(manualAllocations).some((qty) => qty && qty > 0);
  }, [manualAllocations]);

  // Shortfall calculation (PCS-CENTRIC: integer comparison)
  const shortfall = Math.floor(requiredQuantity) - Math.floor(totalAllocated);
  const isPartialAllocation = shortfall >= 1; // Integer PCS shortfall

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
    <div
      className="batch-allocation-panel"
      data-testid="batch-allocation-panel"
    >
      <div className="panel-header">
        <h4>Batch Allocation</h4>
        <button
          type="button"
          className="btn-auto-fifo"
          data-testid="auto-fill-fifo"
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
                        {/* PCS-CENTRIC: Show PCS as primary, weight as derived */}
                        <div className="pcs-primary">
                          <span className="pcs-value">
                            {parseInt(
                              batch.pcsAvailable ||
                                batch.quantityAllocatable ||
                                0,
                              10,
                            )}
                          </span>
                          <span className="pcs-label">PCS</span>
                        </div>
                        {batch.weightKgAvailable && (
                          <div className="weight-derived">
                            ≈ {parseFloat(batch.weightKgAvailable).toFixed(1)}{' '}
                            KG
                          </div>
                        )}
                      </td>
                      <td className="qty-cell">
                        {/* PCS-CENTRIC: Show reserved PCS */}
                        {parseInt(
                          batch.pcsReservedOthers ||
                            batch.quantityReservedOthers ||
                            0,
                          10,
                        ) > 0 && (
                          <span className="reserved-indicator">
                            {parseInt(
                              batch.pcsReservedOthers ||
                                batch.quantityReservedOthers ||
                                0,
                              10,
                            )}{' '}
                            PCS
                          </span>
                        )}
                        {allocatedQty > 0 && (
                          <span className="my-allocation">
                            {Math.floor(allocatedQty)} PCS
                          </span>
                        )}
                      </td>
                      <td className="input-cell">
                        {allocatedQty > 0 ? (
                          <span className="allocated-qty">
                            {Math.floor(allocatedQty)} PCS
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max={parseInt(
                              batch.pcsAvailable ||
                                batch.quantityAllocatable ||
                                0,
                              10,
                            )}
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
                                ? 'Enter PCS to allocate (integer only)'
                                : 'Select batch first to enter quantity'
                            }
                            className="pcs-input"
                          />
                        )}
                      </td>
                      <td className="cost-cell">
                        <div className="cost-per-piece">
                          <span className="unit-cost">
                            {parseFloat(batch.unitCost || 0).toLocaleString(
                              'en-AE',
                              { maximumFractionDigits: 0 },
                            )}
                          </span>
                          <span className="cost-unit">AED/PCS</span>
                        </div>
                        {parseFloat(batch.weightPerPieceKg || 0) > 0 && (
                          <div className="cost-per-kg-derived">
                            (
                            {(
                              parseFloat(batch.unitCost || 0) /
                              parseFloat(batch.weightPerPieceKg || 1)
                            ).toFixed(2)}{' '}
                            AED/KG)
                          </div>
                        )}
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

          {/* Totals - PCS-CENTRIC (COGS display removed - shown in parent with per-unit margin) */}
          <div className="allocation-totals">
            <div className="total-row">
              <span>Allocated:</span>
              <strong>
                {Math.floor(totalAllocated)} / {Math.floor(requiredQuantity)}{' '}
                PCS
              </strong>
            </div>
          </div>

          {/* Shortfall Warning - PCS-CENTRIC (NEVER show KG shortfall) */}
          {isPartialAllocation && requiredQuantity > 0 && (
            <div className="shortfall-warning">
              <span className="warning-icon">⚠</span>
              <span>
                Shortfall: {Math.floor(shortfall)} PCS - Insufficient stock
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
