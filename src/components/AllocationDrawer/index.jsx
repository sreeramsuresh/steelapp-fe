import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import ProductSelector from './ProductSelector';
import BatchAllocationPanel from './BatchAllocationPanel';
import ReservationTimer from './ReservationTimer';
import SourceTypeSelector from './SourceTypeSelector';
import WarehouseAvailability from './WarehouseAvailability';
import { useReservations } from '../../hooks/useReservations';
import pricelistService from '../../services/pricelistService';
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
  customerId = null,
  priceListId = null,
}) => {
  // Generate stable line item temp ID for this drawer session
  const [lineItemTempId] = useState(() => uuidv4());

  // Price request tracking for race-safe fetching
  const priceRequestIdRef = useRef(0);

  // Drawer state
  const [drawerState, setDrawerState] = useState({
    product: null,
    productId: null,
    productName: '',
    quantity: '',
    unit: 'PCS',
    unitPrice: '',
    sourceType: 'WAREHOUSE', // WAREHOUSE | LOCAL_DROP_SHIP | IMPORT_DROP_SHIP
    selectedAllocations: [],
    allocationMethod: null, // 'FIFO' | 'MANUAL' | null - tracks how allocation was made
    loading: false,
    error: null,
    selectedWarehouseId: null, // NEW - user-selected warehouse
    unitPriceOverridden: false, // NEW - track manual price edits
    priceLoading: false, // NEW - price fetch state
  });

  // Use the reservation hook (now uses selected warehouse)
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
    warehouseId: drawerState.selectedWarehouseId, // Use selected warehouse
    lineItemTempId,
    companyId,
  });

  // Initialize selected warehouse from parent if not set
  useEffect(() => {
    if (!drawerState.selectedWarehouseId && warehouseId) {
      setDrawerState((prev) => ({
        ...prev,
        selectedWarehouseId: warehouseId,
      }));
    }
  }, [warehouseId, drawerState.selectedWarehouseId]);

  // Fetch product price from price list (race-safe)
  const fetchProductPrice = useCallback(
    async (productId, quantity = 1) => {
      if (!productId) return;

      // Generate request ID for race condition handling
      const requestId = ++priceRequestIdRef.current;

      setDrawerState((prev) => ({ ...prev, priceLoading: true }));

      try {
        const params = {};
        if (customerId) params.customer_id = customerId;
        if (priceListId) params.pricelist_id = priceListId;
        if (quantity > 0) params.quantity = quantity;

        const response = await pricelistService.getProductPrice(
          productId,
          params,
        );

        // Only apply if this is the latest request (race-safe)
        if (requestId === priceRequestIdRef.current) {
          setDrawerState((prev) => {
            // Double-check override flag hasn't changed during fetch
            if (prev.unitPriceOverridden) {
              return { ...prev, priceLoading: false };
            }

            return {
              ...prev,
              unitPrice: response.price?.toString() || prev.unitPrice,
              priceLoading: false,
            };
          });
        }
      } catch (err) {
        console.error('Failed to fetch product price:', err);

        // Only update error if this is the latest request
        if (requestId === priceRequestIdRef.current) {
          const status = err.response?.status;

          setDrawerState((prev) => {
            // Only show error if user hasn't manually entered price
            let errorMessage = null;

            if (!prev.unitPrice) {
              if (status === 404) {
                // Product not in pricelist - non-blocking, user can enter manually
                errorMessage = 'Price not available for this product. Please enter manually.';
              } else if (status === 422) {
                // Configuration error - admin needs to fix
                errorMessage = 'Contact administrator: No default pricelist configured for your company.';
              } else {
                // Other errors (500, network, etc.)
                errorMessage = 'Could not fetch price from price list. Please enter manually.';
              }
            }

            return {
              ...prev,
              priceLoading: false,
              error: errorMessage,
            };
          });
        }
      }
    },
    [customerId, priceListId],
  );

  // Fetch price on product selection
  useEffect(() => {
    if (drawerState.productId && !drawerState.unitPriceOverridden) {
      const qty = parseFloat(drawerState.quantity) || 1;
      fetchProductPrice(drawerState.productId, qty);
    }
  }, [drawerState.productId, fetchProductPrice]);

  // Re-fetch price on quantity change (volume discounts) with debounce
  useEffect(() => {
    if (
      drawerState.productId &&
      drawerState.quantity &&
      !drawerState.unitPriceOverridden
    ) {
      const qty = parseFloat(drawerState.quantity);
      if (qty > 0) {
        const timer = setTimeout(() => {
          fetchProductPrice(drawerState.productId, qty);
        }, 500); // Debounce
        return () => clearTimeout(timer);
      }
    }
  }, [
    drawerState.quantity,
    drawerState.productId,
    drawerState.unitPriceOverridden,
    fetchProductPrice,
  ]);

  // Handle product selection
  const handleProductSelect = useCallback(
    (product) => {
      setDrawerState((prev) => ({
        ...prev,
        product,
        productId: product?.id || null,
        productName: product?.displayName || product?.name || '',
        // Reset allocations when product changes
        selectedAllocations: [],
        // Clear error when product changes
        error: null,
      }));

      // Clear any existing reservation and its error state when product changes
      if (reservationId) {
        cancelReservation();
      }
    },
    [reservationId, cancelReservation],
  );

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (e) => {
      const value = e.target.value;
      // Allow empty or valid decimal numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        // P2-2: Warn if changing quantity with active allocations
        if (
          drawerState.sourceType === 'WAREHOUSE' &&
          allocations?.length > 0 &&
          drawerState.quantity !== '' &&
          value !== drawerState.quantity
        ) {
          const currentQty = parseFloat(drawerState.quantity) || 0;
          const newQty = parseFloat(value) || 0;
          const allocatedQty = allocations.reduce(
            (sum, a) => sum + parseFloat(a.quantity || 0),
            0,
          );

          // Only warn if significantly different (not just decimal precision)
          if (Math.abs(newQty - currentQty) > 0.001) {
            const confirmed = window.confirm(
              `Current batch allocations (${allocatedQty.toFixed(2)} ${drawerState.unit}) ` +
                `match the existing quantity (${currentQty.toFixed(2)} ${drawerState.unit}).\n\n` +
                `Changing to ${newQty.toFixed(2)} ${drawerState.unit} will require re-allocation.\n\n` +
                `Continue?`,
            );
            if (!confirmed) return;
          }
        }

        setDrawerState((prev) => ({
          ...prev,
          quantity: value,
          // Clear error when quantity changes
          error: null,
        }));
      }
    },
    [drawerState.sourceType, drawerState.quantity, drawerState.unit, allocations],
  );

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
        unitPriceOverridden: true, // Mark as manually edited
        error: null,
      }));
    }
  }, []);

  // Reset price to auto-fetch mode
  const handleResetPrice = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      unitPriceOverridden: false,
      unitPrice: '',
    }));
    const qty = parseFloat(drawerState.quantity) || 1;
    fetchProductPrice(drawerState.productId, qty);
  }, [drawerState.productId, drawerState.quantity, fetchProductPrice]);

  // Handle source type change
  const handleSourceTypeChange = useCallback(
    async (sourceType) => {
      // P2-3: Warn if switching FROM warehouse TO drop-ship with active allocations
      if (
        drawerState.sourceType === 'WAREHOUSE' &&
        (sourceType === 'LOCAL_DROP_SHIP' || sourceType === 'IMPORT_DROP_SHIP') &&
        allocations?.length > 0
      ) {
        const allocatedQty = allocations.reduce(
          (sum, a) => sum + parseFloat(a.quantity || 0),
          0,
        );

        const confirmed = window.confirm(
          `⚠️ Source Type Change Warning\n\n` +
            `Current allocations: ${allocatedQty.toFixed(2)} ${drawerState.unit} from ${allocations.length} batch(es)\n\n` +
            `Switching to Drop-Ship will:\n` +
            `• Release all warehouse batch reservations\n` +
            `• Clear allocation data\n` +
            `• Mark this item as drop-ship (no warehouse stock impact)\n\n` +
            `Continue?`,
        );

        if (!confirmed) return;

        // Cancel reservation if switching away from warehouse
        if (reservationId) {
          console.log(
            '[SOURCE TYPE CHANGE] Cancelling reservation:',
            reservationId,
          );
          try {
            await cancelReservation();
          } catch (err) {
            console.warn(
              'Failed to cancel reservation on source type change:',
              err,
            );
          }
        }
      }

      setDrawerState((prev) => ({
        ...prev,
        sourceType,
        // Clear allocations when switching away from warehouse
        selectedAllocations:
          sourceType === 'WAREHOUSE' ? prev.selectedAllocations : [],
        allocationMethod:
          sourceType === 'WAREHOUSE' ? prev.allocationMethod : null,
      }));
    },
    [
      drawerState.sourceType,
      drawerState.unit,
      allocations,
      reservationId,
      cancelReservation,
    ],
  );

  // Handle allocation changes from BatchAllocationPanel
  const handleAllocationsChange = useCallback((newAllocations) => {
    setDrawerState((prev) => ({
      ...prev,
      selectedAllocations: newAllocations,
    }));
  }, []);

  // Handle warehouse selection
  const handleWarehouseSelect = useCallback(
    async (newWarehouseId) => {
      // Warn if changing warehouse with active allocations
      if (
        drawerState.selectedWarehouseId !== newWarehouseId &&
        allocations?.length > 0
      ) {
        const confirmed = window.confirm(
          'Changing warehouse will clear current batch allocations. Continue?',
        );
        if (!confirmed) return;
      }

      // Cancel existing reservations
      if (reservationId) {
        console.log(
          '[WAREHOUSE CHANGE] Cancelling reservation:',
          reservationId,
        );
        try {
          await cancelReservation();
        } catch (err) {
          console.warn(
            'Failed to cancel reservation on warehouse change:',
            err,
          );
        }
      }

      // Update selected warehouse and reset allocations
      setDrawerState((prev) => ({
        ...prev,
        selectedWarehouseId: newWarehouseId,
        selectedAllocations: [],
        allocationMethod: null,
        error: null,
      }));
    },
    [
      drawerState.selectedWarehouseId,
      allocations,
      reservationId,
      cancelReservation,
    ],
  );

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
    if (!drawerState.quantity || parseFloat(drawerState.quantity) <= 0)
      return false;
    if (!drawerState.unitPrice || parseFloat(drawerState.unitPrice) <= 0)
      return false;

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
    return (allocations || []).reduce(
      (sum, a) => sum + parseFloat(a.quantity || 0),
      0,
    );
  }, [allocations]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (drawerState.sourceType === 'WAREHOUSE' && allocations?.length > 0) {
      return allocations.reduce(
        (sum, a) => sum + parseFloat(a.totalCost || 0),
        0,
      );
    }
    const qty = parseFloat(drawerState.quantity) || 0;
    const price = parseFloat(drawerState.unitPrice) || 0;
    return qty * price;
  }, [
    drawerState.sourceType,
    drawerState.quantity,
    drawerState.unitPrice,
    allocations,
  ]);

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
      unit: 'PCS',
      unitPrice: '',
      sourceType: 'WAREHOUSE',
      selectedAllocations: [],
      allocationMethod: null,
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
      allocationMode:
        drawerState.sourceType === 'WAREHOUSE'
          ? drawerState.allocationMethod || 'AUTO_FIFO'
          : null,
      reservationId,
      expiresAt,
    };

    // VERIFICATION LOG: Line item added to invoice
    console.log('[ADD LINE ITEM] Sending to parent:', {
      lineItemTempId,
      name: lineItem.name,
      quantity: lineItem.quantity,
      unit: lineItem.unit,
      sourceType: lineItem.sourceType,
      allocationMode: lineItem.allocationMode,
      allocationsCount: lineItem.allocations?.length || 0,
      allocations: lineItem.allocations,
      reservationId: lineItem.reservationId,
    });

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

  // Wrap onCancel to cancel reservation on drawer close
  const handleCancel = useCallback(async () => {
    if (reservationId) {
      console.log('[DRAWER CLOSE] Cancelling active reservation:', {
        reservationId,
        lineItemTempId,
      });
      try {
        await cancelReservation();
        console.log('[DRAWER CLOSE] Reservation cancelled successfully');
      } catch (err) {
        console.warn('[DRAWER CLOSE] Failed to cancel reservation:', err);
      }
    } else {
      console.log('[DRAWER CLOSE] No active reservation to cancel');
    }
    if (onCancel) onCancel();
  }, [reservationId, lineItemTempId, cancelReservation, onCancel]);

  if (!visible) return null;

  const requiredQty = parseFloat(drawerState.quantity) || 0;
  const shortfall = requiredQty - allocatedQuantity;

  return (
    <div className="allocation-drawer">
      <div className="drawer-header">
        <h3>Add Product Line</h3>
        {onCancel && (
          <button
            type="button"
            className="drawer-close-btn"
            onClick={handleCancel}
          >
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
        <WarehouseAvailability
          productId={drawerState.productId}
          selectedWarehouseId={drawerState.selectedWarehouseId}
          onWarehouseSelect={handleWarehouseSelect}
          autoSelectFirst={true}
        />

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
                <div className="price-label-group">
                  <label htmlFor="unitPrice">
                    Unit Price (AED) *
                    {drawerState.priceLoading && (
                      <span className="price-loading-indicator">
                        {' '}
                        (Fetching...)
                      </span>
                    )}
                  </label>
                  {drawerState.unitPriceOverridden && (
                    <button
                      type="button"
                      className="btn-reset-price"
                      onClick={handleResetPrice}
                      title="Reset to price list"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  id="unitPrice"
                  className={`form-input ${drawerState.priceLoading ? 'loading' : ''}`}
                  value={drawerState.unitPrice}
                  onChange={handleUnitPriceChange}
                  placeholder={
                    drawerState.priceLoading ? 'Loading price...' : '0.00'
                  }
                  disabled={drawerState.priceLoading}
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
            warehouseId={drawerState.selectedWarehouseId}
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
                {allocatedQuantity.toFixed(3)} / {requiredQty.toFixed(3)}{' '}
                {drawerState.unit}
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
          <div className="drawer-error">
            {drawerState.error || reservationError}
          </div>
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
  customerId: PropTypes.number,
  priceListId: PropTypes.number,
};

export default AllocationDrawer;
