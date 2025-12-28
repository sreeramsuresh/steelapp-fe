import { useState, useCallback, useEffect, useRef } from 'react';
import { batchReservationService } from '../services/batchReservationService';

/**
 * useReservations Hook
 *
 * Manages the lifecycle of batch reservations for a single line item.
 * Provides FIFO and manual reservation methods, expiry tracking,
 * and automatic cleanup on unmount.
 *
 * Features:
 * - FIFO auto-allocation
 * - Manual batch selection
 * - Reservation expiry tracking
 * - Auto-cancel on unmount
 * - Extend reservation capability
 *
 * @param {Object} options - Hook options
 * @param {number} options.draftInvoiceId - Draft invoice ID (optional for new invoices)
 * @param {number} options.productId - Product ID for reservations
 * @param {number} options.warehouseId - Warehouse ID for reservations
 * @param {string} options.lineItemTempId - Unique temp ID for this line item
 * @param {number} options.companyId - Company ID for multi-tenancy
 * @returns {Object} Reservation state and methods
 */
export function useReservations({
  draftInvoiceId,
  productId,
  warehouseId,
  lineItemTempId,
  companyId: _companyId,
}) {
  // Reservation state
  const [reservationId, setReservationId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track if component is mounted for async operations
  const isMountedRef = useRef(true);

  // Track active reservation for cleanup
  const activeReservationRef = useRef(null);

  // Update ref when reservationId changes
  useEffect(() => {
    activeReservationRef.current = reservationId;
  }, [reservationId]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Cancel any active reservations when component unmounts
      if (activeReservationRef.current) {
        batchReservationService
          .cancelReservation(activeReservationRef.current)
          .catch((err) => {
            console.warn('Failed to cancel reservation on unmount:', err);
          });
      }
    };
  }, []);

  // Reset state when product/warehouse changes
  useEffect(() => {
    setReservationId(null);
    setExpiresAt(null);
    setAllocations([]);
    setError(null);
  }, [productId, warehouseId]);

  /**
   * Process reservation response and update state
   */
  const processReservationResponse = useCallback((response) => {
    if (!isMountedRef.current) return;

    if (response.success) {
      setReservationId(response.reservationId || null);
      setExpiresAt(response.expiresAt || null);
      setAllocations(response.allocations || []);
      setError(null);

      // Check for partial allocation warning
      if (response.message && response.message.includes('partial')) {
        setError(response.message);
      }
    } else {
      setError(response.message || 'Reservation failed');
    }
  }, []);

  /**
   * Reserve batches using FIFO (First In First Out) selection
   * Automatically selects from oldest available batches
   *
   * @param {number} requiredQuantity - Quantity to reserve
   * @param {string} unit - Unit of measure (default: 'KG')
   */
  const reserveFIFO = useCallback(
    async (requiredQuantity, unit = 'KG') => {
      if (!productId || !warehouseId || !lineItemTempId) {
        setError('Missing required parameters for reservation');
        return;
      }

      setLoading(true);
      setError(null);

      const requestParams = {
        draftInvoiceId: draftInvoiceId || 0,
        productId,
        warehouseId,
        requiredQuantity,
        unit,
        lineItemTempId,
      };

      // console.log('[FIFO Reserve] Request params:', requestParams);

      try {
        const response =
          await batchReservationService.reserveFIFO(requestParams);

        processReservationResponse(response);
      } catch (err) {
        if (isMountedRef.current) {
          const errorMessage =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Failed to reserve batches';
          setError(errorMessage);
          console.error('FIFO reservation error:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [
      draftInvoiceId,
      productId,
      warehouseId,
      lineItemTempId,
      processReservationResponse,
    ],
  );

  /**
   * Reserve specific batches selected by user
   *
   * @param {Array} manualAllocations - Array of {batchId, quantity}
   */
  const reserveManual = useCallback(
    async (manualAllocations) => {
      if (!productId || !warehouseId || !lineItemTempId) {
        setError('Missing required parameters for reservation');
        return;
      }

      if (!manualAllocations || manualAllocations.length === 0) {
        setError('No allocations provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await batchReservationService.reserveManual({
          draftInvoiceId: draftInvoiceId || 0,
          productId,
          warehouseId,
          lineItemTempId,
          allocations: manualAllocations,
        });

        processReservationResponse(response);
      } catch (err) {
        if (isMountedRef.current) {
          const errorMessage =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Failed to reserve batches';
          setError(errorMessage);
          console.error('Manual reservation error:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [
      draftInvoiceId,
      productId,
      warehouseId,
      lineItemTempId,
      processReservationResponse,
    ],
  );

  /**
   * Cancel current reservations for this line item
   */
  const cancelReservation = useCallback(async () => {
    if (!lineItemTempId) return;

    setLoading(true);

    try {
      await batchReservationService.cancelLineItemReservations({
        draftInvoiceId: draftInvoiceId || 0,
        lineItemTempId,
      });

      if (isMountedRef.current) {
        setReservationId(null);
        setExpiresAt(null);
        setAllocations([]);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to cancel reservation:', err);
        // Don't set error for cancel failures - just log it
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [draftInvoiceId, lineItemTempId]);

  /**
   * Extend reservation expiry time by 30 minutes
   */
  const extendReservation = useCallback(async () => {
    if (!draftInvoiceId && !lineItemTempId) return;

    setLoading(true);

    try {
      const response = await batchReservationService.extendReservation({
        draftInvoiceId: draftInvoiceId || 0,
        lineItemTempId,
        extendMinutes: 30,
      });

      if (isMountedRef.current && response.success) {
        setExpiresAt(response.expiresAt || null);
        // Also update allocations if returned
        if (response.allocations && response.allocations.length > 0) {
          setAllocations(response.allocations);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to extend reservation';
        setError(errorMessage);
        console.error('Extend reservation error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [draftInvoiceId, lineItemTempId]);

  /**
   * Load existing reservations for a draft invoice
   * Used when editing an existing draft
   */
  const loadExistingReservations = useCallback(async () => {
    // Only load if we have a valid numeric draft invoice ID
    if (!draftInvoiceId || typeof draftInvoiceId !== 'number') return;

    setLoading(true);

    try {
      const response = await batchReservationService.getDraftReservations(
        draftInvoiceId,
        lineItemTempId,
      );

      if (isMountedRef.current && response.success) {
        // Map reservations to allocations format
        const loadedAllocations = (response.reservations || []).map((r) => ({
          reservationId: r.reservationId,
          batchId: r.batchId,
          batchNumber: r.batchNumber,
          quantity: r.quantity,
          unit: r.unit,
          unitCost: r.unitCost,
          totalCost: r.totalCost,
          expiresAt: r.expiresAt,
        }));

        setAllocations(loadedAllocations);

        // Set expiry from first allocation (all should have same expiry)
        if (loadedAllocations.length > 0) {
          setExpiresAt(loadedAllocations[0].expiresAt);
          setReservationId(loadedAllocations[0].reservationId);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to load existing reservations:', err);
        // Don't set error - not critical if we can't load existing
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [draftInvoiceId, lineItemTempId]);

  // Load existing reservations when editing a draft
  useEffect(() => {
    if (draftInvoiceId && lineItemTempId) {
      loadExistingReservations();
    }
  }, [draftInvoiceId, lineItemTempId, loadExistingReservations]);

  return {
    // State
    reservationId,
    expiresAt,
    allocations,
    loading,
    error,

    // Methods
    reserveFIFO,
    reserveManual,
    cancelReservation,
    extendReservation,
    loadExistingReservations,

    // Computed values
    hasAllocations: allocations.length > 0,
    totalAllocated: allocations.reduce(
      (sum, a) => sum + parseFloat(a.quantity || 0),
      0,
    ),
    totalCost: allocations.reduce(
      (sum, a) => sum + parseFloat(a.totalCost || 0),
      0,
    ),
  };
}

export default useReservations;
