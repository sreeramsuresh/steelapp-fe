import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import ProductSelector from './ProductSelector';
import BatchAllocationPanel from './BatchAllocationPanel';
import ReservationTimer from './ReservationTimer';
import SourceTypeSelector from './SourceTypeSelector';
import WarehouseAvailability from './WarehouseAvailability';
import { useReservations } from '../../hooks/useReservations';
import './AllocationDrawer.css';

/**
 * AllocationDrawer Component
 *
 * A 40% fixed right panel for product selection and batch allocation
 * during invoice creation. Integrates with the Phase 1 Reservation APIs.
 *
 * Features:
 * - Product autocomplete search
 * - Source type selection (Warehouse/Drop-Ship)
 * - Batch allocation panel with FIFO auto-allocation
 * - Reservation timer with countdown
 * - Validation before adding to invoice
 */
const AllocationDrawer = ({
  draftInvoiceId = null,
  warehouseId,
  companyId,
  onAddLineItem,
  onCancel,
  visible = true,
}) => {
  // Generate stable line item temp ID for this drawer session
  const [lineItemTempId] = useState(() => uuidv4());

  // Drawer state
  const [drawerState, setDrawerState] = useState({
    product: null,
    productId: null,
    productName: '',
    quantity: '',
    unit: 'KG',
    unitPrice: '',
    sourceType: 'WAREHOUSE', // WAREHOUSE | LOCAL_DROP_SHIP | IMPORT_DROP_SHIP
    selectedAllocations: [],
    loading: false,
    error: null,
  });

  // Use the reservation hook
  const {
    reservationId,
    expiresAt,
    allocations,
    loading: reservationLoading,
    error: reservationError,
    reserveFIFO,
    reserveManual,
    cancelReservation,
    extendReservation,
  } = useReservations({
    draftInvoiceId,
    productId: drawerState.productId,
    warehouseId,
    lineItemTempId,
    companyId,
  });

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    setDrawerState((prev) => ({
      ...prev,
      product,
      productId: product?.id || null,
      productName: product?.displayName || product?.name || '',
      // Reset allocations when product changes
      selectedAllocations: [],
    }));
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((e) => {
    const value = e.target.value;
    // Allow empty or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDrawerState((prev) => ({
        ...prev,
        quantity: value,
      }));
    }
  }, []);

  // Handle unit change
  const handleUnitChange = useCallback((e) => {
    setDrawerState((prev) => ({
      ...prev,
      unit: e.target.value,
    }));
  }, []);

  // Handle unit price change
  const handleUnitPriceChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDrawerState((prev) => ({
        ...prev,
        unitPrice: value,
      }));
    }
  }, []);

  // Handle source type change
  const handleSourceTypeChange = useCallback((sourceType) => {
    setDrawerState((prev) => ({
      ...prev,
      sourceType,
      // Clear allocations when switching away from warehouse
      selectedAllocations: sourceType === 'WAREHOUSE' ? prev.selectedAllocations : [],
    }));
  }, []);

  // Handle allocation changes from BatchAllocationPanel
  const handleAllocationsChange = useCallback((newAllocations) => {
    setDrawerState((prev) => ({
      ...prev,
      selectedAllocations: newAllocations,
    }));
  }, []);

  // Handle reservation expiry
  const handleReservationExpired = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      selectedAllocations: [],
      error: 'Reservation expired. Please re-allocate batches.',
    }));
  }, []);

  // Validate form
  const isValid = useMemo(() => {
    if (!drawerState.productId) return false;
    if (!drawerState.quantity || parseFloat(drawerState.quantity) <= 0) return false;
    if (!drawerState.unitPrice || parseFloat(drawerState.unitPrice) <= 0) return false;

    if (drawerState.sourceType === 'WAREHOUSE') {
      // Must have allocations matching quantity
      const allocatedQty = (allocations || []).reduce(
        (sum, a) => sum + parseFloat(a.quantity || 0),
        0,
      );
      return Math.abs(allocatedQty - parseFloat(drawerState.quantity)) < 0.001;
    }

    return true; // Drop-ship doesn't need allocations
  }, [drawerState, allocations]);

  // Calculate allocated quantity
  const allocatedQuantity = useMemo(() => {
    return (allocations || []).reduce((sum, a) => sum + parseFloat(a.quantity || 0), 0);
  }, [allocations]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (drawerState.sourceType === 'WAREHOUSE' && allocations?.length > 0) {
      return allocations.reduce((sum, a) => sum + parseFloat(a.totalCost || 0), 0);
    }
    const qty = parseFloat(drawerState.quantity) || 0;
    const price = parseFloat(drawerState.unitPrice) || 0;
    return qty * price;
  }, [drawerState.sourceType, drawerState.quantity, drawerState.unitPrice, allocations]);

  // Handle clear
  const handleClear = useCallback(async () => {
    // Cancel any existing reservations
    if (reservationId) {
      try {
        await cancelReservation();
      } catch (_err) {
        // Ignore errors on clear
      }
    }

    setDrawerState({
      product: null,
      productId: null,
      productName: '',
      quantity: '',
      unit: 'KG',
      unitPrice: '',
      sourceType: 'WAREHOUSE',
      selectedAllocations: [],
      loading: false,
      error: null,
    });
  }, [reservationId, cancelReservation]);

  // Handle add to invoice
  const handleAddToInvoice = useCallback(() => {
    if (!isValid) return;

    const lineItem = {
      lineItemTempId,
      productId: drawerState.productId,
      product: drawerState.product,
      name: drawerState.productName,
      quantity: parseFloat(drawerState.quantity),
      unit: drawerState.unit,
      rate: parseFloat(drawerState.unitPrice),
      amount: totalCost,
      sourceType: drawerState.sourceType,
      warehouseId: drawerState.sourceType === 'WAREHOUSE' ? warehouseId : null,
      allocations: drawerState.sourceType === 'WAREHOUSE' ? allocations : [],
      reservationId,
      expiresAt,
    };

    onAddLineItem(lineItem);

    // Clear the drawer for next item
    handleClear();
  }, [
    isValid,
    lineItemTempId,
    drawerState,
    totalCost,
    warehouseId,
    allocations,
    reservationId,
    expiresAt,
    onAddLineItem,
    handleClear,
  ]);

  if (!visible) return null;

  const requiredQty = parseFloat(drawerState.quantity) || 0;
  const shortfall = requiredQty - allocatedQuantity;

  return (
    <div className="allocation-drawer">
      <div className="drawer-header">
        <h3>Add Product Line</h3>
        {onCancel && (
          <button type="button" className="drawer-close-btn" onClick={onCancel}>
            x
          </button>
        )}
      </div>

      <div className="drawer-content">
        {/* Product Selector */}
        <ProductSelector
          companyId={companyId}
          selectedProduct={drawerState.product}
          onSelectProduct={handleProductSelect}
        />

        {/* Warehouse Availability */}
        <WarehouseAvailability productId={drawerState.productId} />

        {/* Quantity and Price Section */}
        {drawerState.productId && (
          <div className="quantity-price-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <div className="quantity-input-group">
                  <input
                    type="text"
                    id="quantity"
                    className="form-input"
                    value={drawerState.quantity}
                    onChange={handleQuantityChange}
                    placeholder="0.00"
                  />
                  <select
                    className="unit-select"
                    value={drawerState.unit}
                    onChange={handleUnitChange}
                  >
                    <option value="KG">KG</option>
                    <option value="PCS">PCS</option>
                    <option value="MT">MT</option>
                    <option value="M">M</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="unitPrice">Unit Price (AED) *</label>
                <input
                  type="text"
                  id="unitPrice"
                  className="form-input"
                  value={drawerState.unitPrice}
                  onChange={handleUnitPriceChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}

        {/* Source Type Selector */}
        <SourceTypeSelector
          value={drawerState.sourceType}
          onChange={handleSourceTypeChange}
        />

        {/* Batch Allocation Panel (only for Warehouse source) */}
        {drawerState.sourceType === 'WAREHOUSE' && drawerState.productId && (
          <BatchAllocationPanel
            productId={drawerState.productId}
            warehouseId={warehouseId}
            draftInvoiceId={draftInvoiceId}
            lineItemTempId={lineItemTempId}
            requiredQuantity={requiredQty}
            unit={drawerState.unit}
            companyId={companyId}
            onAllocationsChange={handleAllocationsChange}
            reserveFIFO={reserveFIFO}
            reserveManual={reserveManual}
            allocations={allocations}
            loading={reservationLoading}
            error={reservationError}
          />
        )}

        {/* Reservation Timer */}
        {expiresAt && drawerState.sourceType === 'WAREHOUSE' && (
          <ReservationTimer
            expiresAt={expiresAt}
            onExpired={handleReservationExpired}
            onExtend={extendReservation}
          />
        )}

        {/* Allocation Summary */}
        {drawerState.sourceType === 'WAREHOUSE' && allocations?.length > 0 && (
          <div className="allocation-summary">
            <div className="summary-row">
              <span>Allocated:</span>
              <strong>
                {allocatedQuantity.toFixed(3)} / {requiredQty.toFixed(3)} {drawerState.unit}
              </strong>
            </div>
            {shortfall > 0.001 && (
              <div className="summary-row shortfall-warning">
                <span>Shortfall:</span>
                <strong className="text-warning">
                  {shortfall.toFixed(3)} {drawerState.unit}
                </strong>
              </div>
            )}
            <div className="summary-row">
              <span>Total Cost:</span>
              <strong>{totalCost.toFixed(2)} AED</strong>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(drawerState.error || reservationError) && (
          <div className="drawer-error">{drawerState.error || reservationError}</div>
        )}
      </div>

      <div className="drawer-footer">
        <button type="button" className="btn-secondary" onClick={handleClear}>
          Clear
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleAddToInvoice}
          disabled={!isValid || reservationLoading}
        >
          {reservationLoading ? 'Loading...' : 'Add to Invoice'}
        </button>
      </div>
    </div>
  );
};

AllocationDrawer.propTypes = {
  draftInvoiceId: PropTypes.number,
  warehouseId: PropTypes.number.isRequired,
  companyId: PropTypes.number.isRequired,
  onAddLineItem: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  visible: PropTypes.bool,
};

export default AllocationDrawer;
