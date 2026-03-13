import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useReservations } from "../../hooks/useReservations";
import { authService } from "../../services/axiosAuthService";
import pricelistService from "../../services/pricelistService";
import ConfirmDialog from "../ConfirmDialog";
import BatchAllocationPanel from "./BatchAllocationPanel";
import ProductSelector from "./ProductSelector";
import ReservationTimer from "./ReservationTimer";
import SourceTypeSelector from "./SourceTypeSelector";
import WarehouseAvailability from "./WarehouseAvailability";
import "./AllocationDrawer.css";

/**
 * AllocationDrawer Component
 *
 * A 40% fixed right panel for product selection and batch allocation
 * during invoice creation. Integrates with the Phase 1 Reservation APIs.
 *
 * Business rule: All items entered in PCS. Coils priced PER_MT with variable weight.
 * Coil weight derived from actual batch allocations (warehouse) or manual entry (drop-ship).
 * Unit is always PCS for input; coils convert to MT for transaction/payload.
 */
const AllocationDrawer = ({
  draftInvoiceId = null,
  warehouseId: _vatWarehouseId, // Parent's VAT/place-of-supply warehouse — NOT stock warehouse
  companyId,
  onAddLineItem,
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
    productName: "",
    quantity: "",
    unit: "PCS",
    unitPrice: "",
    sourceType: "WAREHOUSE", // WAREHOUSE | LOCAL_DROP_SHIP | IMPORT_DROP_SHIP
    allocationMethod: null, // 'FIFO' | 'MANUAL' | null - tracks how allocation was made
    loading: false,
    error: null,
    selectedWarehouseId: null, // user-selected warehouse
    unitPriceOverridden: false, // track manual price edits
    priceLoading: false, // price fetch state
    isCoilProduct: false, // Fix #2: auto-determined from product type
    pricingBasisCode: null, // "PER_MT" | "PER_PCS"
    basePrice: null, // Original price from price list (audit trail)
    unitWeightKg: null, // Product weight in kg
    dropShipWeightMt: "", // Manual weight input for drop-ship coils
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null, // 'quantity_change', 'source_type_change', 'warehouse_change'
    newValue: null, // Store the new value to apply when confirmed
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

  // Helper: Determine if product is a coil
  const isCoil = useCallback((product) => {
    if (!product) return false;
    if (product.productCategory && product.productCategory.toUpperCase() === "COIL") {
      return true;
    }
    if (product.form?.toLowerCase().includes("coil")) {
      return true;
    }
    return false;
  }, []);

  // Helper: Convert pricing basis enum to string code
  const deriveBasisCode = useCallback((pricingBasis) => {
    const VALID_BASES = ["PER_KG", "PER_MT", "PER_PCS", "PER_METER", "PER_LOT"];
    if (typeof pricingBasis === "string" && VALID_BASES.includes(pricingBasis.toUpperCase())) {
      return pricingBasis.toUpperCase();
    }
    const basisMap = {
      0: "UNSPECIFIED",
      1: "PER_KG",
      2: "PER_MT",
      3: "PER_PCS",
      4: "PER_METER",
      5: "PER_LOT",
    };
    return basisMap[pricingBasis] || "PER_PCS";
  }, []);

  // Fix #4: Pricing basis label derived from isCoilProduct flag
  const getPricingBasisLabel = () => {
    if (!drawerState.productId) return "";
    return drawerState.isCoilProduct ? "per MT" : "per pc";
  };

  // NOTE: Removed useEffect that initialized selectedWarehouseId from parent's warehouseId.
  // The parent's warehouseId is for VAT/Place of Supply, not physical product location.
  // WarehouseAvailability component with autoSelectFirst={true} handles correct warehouse selection.

  // Fetch product price from price list (race-safe)
  // Fix #2e: Simplified — no PCS↔MT price conversion. PER_MT applies directly to coils, PER_PCS to non-coils.
  const fetchProductPrice = useCallback(
    async (productId, quantity = 1) => {
      if (!productId) return;

      const requestId = ++priceRequestIdRef.current;
      setDrawerState((prev) => ({ ...prev, priceLoading: true }));

      try {
        const params = {};
        if (customerId) params.customer_id = customerId;
        if (priceListId) params.pricelist_id = priceListId;
        if (quantity > 0) params.quantity = quantity;

        const response = await pricelistService.getProductPrice(productId, params);

        if (requestId === priceRequestIdRef.current) {
          setDrawerState((prev) => {
            if (prev.unitPriceOverridden) {
              return { ...prev, priceLoading: false };
            }

            const basisCode = deriveBasisCode(response.pricingBasis);
            const displayPrice = response.price;

            return {
              ...prev,
              unitPrice: displayPrice ? (Math.round(displayPrice * 100) / 100).toString() : prev.unitPrice,
              priceLoading: false,
              pricingBasisCode: basisCode,
              basePrice: response.price,
              error: null,
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch product price:", err);

        if (requestId === priceRequestIdRef.current) {
          const status = err.response?.status;

          setDrawerState((prev) => {
            let errorMessage = null;

            if (!prev.unitPrice) {
              if (status === 404) {
                errorMessage =
                  "Price not found in pricelist for this product. You can click in the Unit Price field above and enter the price manually, or contact your sales manager to add pricing for this product.";
              } else if (status === 400) {
                errorMessage =
                  "No pricelist is configured for your customer. Please select a different customer with a pricelist, or click in the Unit Price field above and enter the price manually.";
              } else {
                errorMessage =
                  "Could not fetch price from pricelist. You can click in the Unit Price field above and enter the price manually, or try again in a moment.";
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
    [customerId, priceListId, deriveBasisCode]
  );

  // Fix #5: Single merged price-fetch effect with conditional debounce
  useEffect(() => {
    if (!drawerState.productId || drawerState.unitPriceOverridden) return;
    const qty = parseFloat(drawerState.quantity) || 1;
    const timer = setTimeout(
      () => {
        fetchProductPrice(drawerState.productId, qty);
      },
      drawerState.quantity ? 500 : 0
    );
    return () => clearTimeout(timer);
  }, [drawerState.productId, drawerState.quantity, drawerState.unitPriceOverridden, fetchProductPrice]);

  // Fix #2a: Handle product selection — auto-determine unit from product type
  const handleProductSelect = useCallback(
    (product) => {
      const coilFlag = isCoil(product);
      setDrawerState((prev) => ({
        ...prev,
        product,
        productId: product?.id || null,
        productName: product?.displayName || product?.name || "",
        // Reset warehouse selection so autoSelectFirst re-triggers for new product
        selectedWarehouseId: null,
        allocationMethod: null,
        error: null,
        // Fix #2a: Auto-determine coil flag; unit always PCS for input
        isCoilProduct: coilFlag,
        unit: "PCS",
        unitWeightKg: product?.unitWeightKg || null,
        dropShipWeightMt: "",
      }));

      // Clear any existing reservation when product changes
      if (reservationId) {
        cancelReservation();
      }
    },
    [reservationId, cancelReservation, isCoil]
  );

  // Handle quantity change (PCS-CENTRIC: Integer comparison)
  const handleQuantityChange = useCallback(
    (e) => {
      const value = e.target.value;

      // Coils: integer PCS only (whole coils)
      if (drawerState.isCoilProduct) {
        if (value !== "" && !/^\d*$/.test(value)) return;
      } else {
        if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      }

      if (
        drawerState.sourceType === "WAREHOUSE" &&
        allocations?.length > 0 &&
        drawerState.quantity !== "" &&
        value !== drawerState.quantity
      ) {
        const currentPcs = Math.floor(parseFloat(drawerState.quantity) || 0);
        const newPcs = Math.floor(parseFloat(value) || 0);
        const allocatedPcs = allocations.reduce(
          (sum, a) => sum + Math.floor(parseFloat(a.pcsAllocated ?? a.quantity ?? 0)),
          0
        );

        if (newPcs !== currentPcs) {
          setConfirmDialog({
            open: true,
            type: "quantity_change",
            newValue: value,
            allocatedPcs,
            currentPcs,
            newPcs,
          });
          return;
        }
      }

      setDrawerState((prev) => ({
        ...prev,
        quantity: value,
        error: null,
      }));
    },
    [drawerState.isCoilProduct, drawerState.sourceType, drawerState.quantity, allocations]
  );

  // Confirm quantity change
  const confirmQuantityChange = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      quantity: confirmDialog.newValue,
      error: null,
    }));
  }, [confirmDialog.newValue]);

  // Fix #3: Store raw string on change, format on blur
  const handleUnitPriceChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDrawerState((prev) => ({
        ...prev,
        unitPrice: value,
        unitPriceOverridden: true,
        error: null,
      }));
    }
  }, []);

  // Fix #3: Format to 2 decimals on blur
  const handleUnitPriceBlur = useCallback(() => {
    setDrawerState((prev) => {
      if (!prev.unitPrice || prev.unitPrice === "") return prev;
      const num = parseFloat(prev.unitPrice);
      if (Number.isNaN(num)) return prev;
      return {
        ...prev,
        unitPrice: (Math.round(num * 100) / 100).toString(),
      };
    });
  }, []);

  // Handle drop-ship coil weight input
  const handleDropShipWeightChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDrawerState((prev) => ({ ...prev, dropShipWeightMt: value, error: null }));
    }
  }, []);

  const handleDropShipWeightBlur = useCallback(() => {
    setDrawerState((prev) => {
      if (!prev.dropShipWeightMt) return prev;
      const num = parseFloat(prev.dropShipWeightMt);
      if (Number.isNaN(num)) return prev;
      return { ...prev, dropShipWeightMt: (Math.round(num * 1000) / 1000).toString() };
    });
  }, []);

  // Reset price to auto-fetch mode
  const handleResetPrice = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      unitPriceOverridden: false,
      unitPrice: "",
    }));
    const qty = parseFloat(drawerState.quantity) || 1;
    fetchProductPrice(drawerState.productId, qty);
  }, [drawerState.productId, drawerState.quantity, fetchProductPrice]);

  // Handle source type change
  const handleSourceTypeChange = useCallback(
    (sourceType) => {
      if (
        drawerState.sourceType === "WAREHOUSE" &&
        (sourceType === "LOCAL_DROP_SHIP" || sourceType === "IMPORT_DROP_SHIP") &&
        allocations?.length > 0
      ) {
        const allocatedQty = allocations.reduce((sum, a) => sum + parseFloat(a.pcsAllocated ?? a.quantity ?? 0), 0);

        setConfirmDialog({
          open: true,
          type: "source_type_change",
          newValue: sourceType,
          allocatedQty,
        });
        return;
      }

      setDrawerState((prev) => ({
        ...prev,
        sourceType,
        allocationMethod: sourceType === "WAREHOUSE" ? prev.allocationMethod : null,
      }));
    },
    [drawerState.sourceType, allocations]
  );

  // Confirm source type change
  const confirmSourceTypeChange = useCallback(async () => {
    const sourceType = confirmDialog.newValue;

    if (reservationId) {
      try {
        await cancelReservation();
      } catch (err) {
        console.warn("Failed to cancel reservation on source type change:", err);
      }
    }

    setDrawerState((prev) => ({
      ...prev,
      sourceType,
      allocationMethod: sourceType === "WAREHOUSE" ? prev.allocationMethod : null,
    }));
  }, [confirmDialog.newValue, reservationId, cancelReservation]);

  // Handle warehouse selection
  const handleWarehouseSelect = useCallback(
    (newWarehouseId) => {
      if (drawerState.selectedWarehouseId !== newWarehouseId && allocations?.length > 0) {
        setConfirmDialog({
          open: true,
          type: "warehouse_change",
          newValue: newWarehouseId,
        });
        return;
      }

      setDrawerState((prev) => ({
        ...prev,
        selectedWarehouseId: newWarehouseId,
        allocationMethod: null,
        error: null,
      }));
    },
    [drawerState.selectedWarehouseId, allocations]
  );

  // Confirm warehouse change
  const confirmWarehouseChange = useCallback(async () => {
    const newWarehouseId = confirmDialog.newValue;

    if (reservationId) {
      try {
        await cancelReservation();
      } catch (err) {
        console.warn("Failed to cancel reservation on warehouse change:", err);
      }
    }

    setDrawerState((prev) => ({
      ...prev,
      selectedWarehouseId: newWarehouseId,
      allocationMethod: null,
      error: null,
    }));
  }, [confirmDialog.newValue, reservationId, cancelReservation]);

  // Fix #6: Handle reservation expiry — also cancel hook-level allocations
  const handleReservationExpired = useCallback(() => {
    cancelReservation();
    setDrawerState((prev) => ({
      ...prev,
      error: "Reservation expired. Please re-allocate batches.",
      allocationMethod: null,
    }));
  }, [cancelReservation]);

  // Validate form (PCS-CENTRIC: Integer comparison for warehouse allocations)
  const isValid = useMemo(() => {
    if (!drawerState.productId) return false;
    if (!drawerState.quantity || parseFloat(drawerState.quantity) <= 0) return false;
    if (!drawerState.unitPrice || parseFloat(drawerState.unitPrice) <= 0) return false;

    if (drawerState.sourceType === "WAREHOUSE") {
      const allocatedPcs = (allocations || []).reduce(
        (sum, a) => sum + Math.floor(parseFloat(a.pcsAllocated ?? a.quantity ?? 0)),
        0
      );
      const requiredPcs = Math.floor(parseFloat(drawerState.quantity));

      if (allocatedPcs >= requiredPcs) return true;
      if ((allocations || []).length === 0) return true;

      return false;
    }

    return true;
  }, [drawerState, allocations]);

  // Calculate allocated quantity
  const allocatedQuantity = useMemo(() => {
    return (allocations || []).reduce((sum, a) => sum + parseFloat(a.pcsAllocated ?? a.quantity ?? 0), 0);
  }, [allocations]);

  // Derive coil weight from allocations or manual input
  // DEFENSIVE: allocation.quantity is weight in KG (string) per backend contract.
  // If backend adds explicit weightKg field in future, prefer that.
  const coilWeightMt = useMemo(() => {
    if (!drawerState.isCoilProduct) return 0;

    // WAREHOUSE: derive from actual batch allocation weights
    if (drawerState.sourceType === "WAREHOUSE" && allocations?.length > 0) {
      return (
        allocations.reduce((sum, a) => {
          // Prefer explicit weight field if present; fall back to quantity (KG string)
          const weightKg = parseFloat(a.weightKg ?? a.quantity ?? 0);
          return sum + weightKg;
        }, 0) / 1000
      );
    }

    // DROP-SHIP: use manual weight entry
    if (drawerState.sourceType !== "WAREHOUSE") {
      return parseFloat(drawerState.dropShipWeightMt) || 0;
    }

    // WAREHOUSE without allocations: no weight (blocked at validation)
    return 0;
  }, [drawerState.isCoilProduct, drawerState.sourceType, drawerState.dropShipWeightMt, allocations]);

  // Separate coil PCS count from weight (both from same allocation set)
  const allocatedCoilCount = useMemo(() => {
    if (!drawerState.isCoilProduct || !allocations?.length) return 0;
    return allocations.reduce((sum, a) => sum + parseInt(a.pcsAllocated || 0, 10), 0);
  }, [drawerState.isCoilProduct, allocations]);

  // Calculate total cost (selling amount)
  const totalCost = useMemo(() => {
    const price = parseFloat(drawerState.unitPrice) || 0;
    if (drawerState.isCoilProduct) {
      // Coils: weight (MT) × price (AED/MT)
      return Math.round(coilWeightMt * price * 100) / 100;
    }
    // Non-coils: PCS × price (AED/PCS)
    const qty = parseFloat(drawerState.quantity) || 0;
    return Math.round(qty * price * 100) / 100;
  }, [drawerState.quantity, drawerState.unitPrice, drawerState.isCoilProduct, coilWeightMt]);

  // Check if user can view margins
  const canViewMargins = useMemo(() => {
    return authService.hasRole(["ceo", "cfo", "sales_manager", "admin", "dev"]);
  }, []);

  // Per-unit cost (buying price from batch) — per MT for coils, per PCS for non-coils
  const unitCogs = useMemo(() => {
    if (drawerState.sourceType !== "WAREHOUSE" || !allocations?.length) return 0;
    const totalCogsSum = allocations.reduce((sum, a) => sum + parseFloat(a.totalCost || 0), 0);
    if (drawerState.isCoilProduct) {
      // Only show per-MT COGS when actual allocated weight is available
      return coilWeightMt > 0 ? totalCogsSum / coilWeightMt : 0;
    }
    // Non-coils: per PCS
    const totalPcs = allocations.reduce((sum, a) => sum + parseFloat(a.pcsAllocated ?? a.quantity ?? 0), 0);
    return totalPcs > 0 ? totalCogsSum / totalPcs : 0;
  }, [drawerState.sourceType, drawerState.isCoilProduct, allocations, coilWeightMt]);

  // Per-piece margin (selling - buying)
  const unitMargin = useMemo(() => {
    const price = parseFloat(drawerState.unitPrice) || 0;
    return price - unitCogs;
  }, [drawerState.unitPrice, unitCogs]);

  // Margin percentage
  const marginPercent = useMemo(() => {
    const price = parseFloat(drawerState.unitPrice) || 0;
    if (price <= 0 || unitCogs <= 0) return 0;
    return (unitMargin / price) * 100;
  }, [drawerState.unitPrice, unitCogs, unitMargin]);

  // Margin color based on percentage
  const marginColor = useMemo(() => {
    if (marginPercent < 5) return "text-red-600";
    if (marginPercent < 10) return "text-yellow-600";
    return "text-green-600";
  }, [marginPercent]);

  // Handle clear — Fix #2g: reset isCoilProduct
  const handleClear = useCallback(async () => {
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
      productName: "",
      quantity: "",
      unit: "PCS",
      unitPrice: "",
      sourceType: "WAREHOUSE",
      allocationMethod: null,
      loading: false,
      error: null,
      pricingBasisCode: null,
      basePrice: null,
      unitWeightKg: null,
      unitPriceOverridden: false,
      priceLoading: false,
      selectedWarehouseId: null,
      isCoilProduct: false,
      dropShipWeightMt: "",
    });
  }, [reservationId, cancelReservation]);

  // Handle add to invoice — coil-aware validation and payload
  const handleAddToInvoice = useCallback(() => {
    if (!isValid) return;

    const pcsEntered = parseFloat(drawerState.quantity);
    const isCoilFlag = drawerState.isCoilProduct;

    // Coil PCS must be positive integer
    if (isCoilFlag) {
      if (!Number.isInteger(pcsEntered) || pcsEntered <= 0) {
        setDrawerState((prev) => ({ ...prev, error: "Enter a whole number of coils (PCS)." }));
        return;
      }
    }

    // Warehouse coils — BLOCK until actual allocated weight
    if (isCoilFlag && drawerState.sourceType === "WAREHOUSE") {
      if (!allocations?.length || coilWeightMt <= 0) {
        setDrawerState((prev) => ({
          ...prev,
          error: "Allocate batches to determine actual coil weight before adding.",
        }));
        return;
      }
      // Allocated coil count must match requested PCS
      if (allocatedCoilCount < pcsEntered) {
        setDrawerState((prev) => ({
          ...prev,
          error: `Allocated ${allocatedCoilCount} coils but ${pcsEntered} requested. Complete allocation first.`,
        }));
        return;
      }
    }

    // Drop-ship coils — require manual weight
    if (isCoilFlag && drawerState.sourceType !== "WAREHOUSE") {
      if (coilWeightMt <= 0) {
        setDrawerState((prev) => ({
          ...prev,
          error: "Enter actual coil weight (MT) for drop-ship before adding.",
        }));
        return;
      }
    }

    // Non-coil guardrail: require unitWeightKg for PCS warehouse items
    if (
      !isCoilFlag &&
      drawerState.unit === "PCS" &&
      (!drawerState.unitWeightKg || drawerState.unitWeightKg <= 0) &&
      drawerState.sourceType === "WAREHOUSE"
    ) {
      setDrawerState((prev) => ({ ...prev, error: "Unit weight (kg/pcs) required. Contact admin." }));
      return;
    }

    // Determine weight basis for audit trail
    const weightBasis = isCoilFlag
      ? drawerState.sourceType === "WAREHOUSE"
        ? "ACTUAL_ALLOCATED"
        : "MANUAL_ENTRY"
      : null;

    const lineItem = {
      lineItemTempId,
      productId: drawerState.productId,
      product: drawerState.product,
      name: drawerState.productName,

      // Transaction values: coils send MT, non-coils send PCS
      quantity: isCoilFlag ? Math.round(coilWeightMt * 1000) / 1000 : pcsEntered,
      unit: isCoilFlag ? "MT" : "PCS",
      rate: parseFloat(drawerState.unitPrice),
      amount: totalCost,

      // Explicit coil fields (not overloaded)
      displayPcs: isCoilFlag ? pcsEntered : null,
      actualWeightMt: isCoilFlag ? Math.round(coilWeightMt * 1000) / 1000 : null,
      weightBasis,

      // Base values for audit trail
      baseRate: drawerState.basePrice,
      basePricingBasis: drawerState.pricingBasisCode,
      pricingBasis: drawerState.pricingBasisCode,

      // Stock allocation
      sourceType: drawerState.sourceType,
      warehouseId: drawerState.sourceType === "WAREHOUSE" ? drawerState.selectedWarehouseId : null,
      allocations: drawerState.sourceType === "WAREHOUSE" ? allocations : [],
      allocationMode: drawerState.sourceType === "WAREHOUSE" ? drawerState.allocationMethod || "AUTO_FIFO" : null,

      reservationId,
      expiresAt,
      unitWeightKg: drawerState.unitWeightKg,
    };

    onAddLineItem(lineItem);
    handleClear();
  }, [
    isValid,
    lineItemTempId,
    drawerState,
    totalCost,
    coilWeightMt,
    allocatedCoilCount,
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
    <div className="allocation-drawer" data-testid="allocation-drawer">
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
                    data-testid="drawer-quantity"
                    className="form-input"
                    value={drawerState.quantity}
                    onChange={handleQuantityChange}
                    placeholder={drawerState.isCoilProduct ? "0" : "0.00"}
                  />
                  {/* Fix #2f: Static read-only unit display — always PCS for input */}
                  <span className="unit-display">PCS</span>
                </div>
                {/* Coil weight display (warehouse) */}
                {drawerState.isCoilProduct && drawerState.sourceType === "WAREHOUSE" && (
                  <div className="coil-weight-info" style={{ fontSize: "0.85em", marginTop: 4 }}>
                    {coilWeightMt > 0 ? (
                      <span style={{ color: "#059669" }}>= {coilWeightMt.toFixed(3)} MT (actual batch weights)</span>
                    ) : parseFloat(drawerState.quantity) > 0 ? (
                      <span style={{ color: "#d97706" }}>Allocate batches to determine actual weight</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            {/* Drop-ship coil: manual weight input */}
            {drawerState.isCoilProduct && drawerState.sourceType !== "WAREHOUSE" && (
              <div className="form-row">
                <div className="form-group" style={{ marginTop: 0 }}>
                  <label htmlFor="dropShipWeight">
                    Actual Weight (MT) *
                    <span className="pricing-basis-label" style={{ fontSize: "0.85em", color: "#666", marginLeft: 8 }}>
                      (required for coil invoicing)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="dropShipWeight"
                    className="form-input"
                    value={drawerState.dropShipWeightMt}
                    onChange={handleDropShipWeightChange}
                    onBlur={handleDropShipWeightBlur}
                    placeholder={
                      drawerState.unitWeightKg
                        ? `Est: ${(((parseFloat(drawerState.quantity) || 0) * drawerState.unitWeightKg) / 1000).toFixed(3)}`
                        : "0.000"
                    }
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <div className="price-label-group">
                  <label htmlFor="unitPrice">
                    Unit Price (AED) *
                    {drawerState.priceLoading && <span className="price-loading-indicator"> (Fetching...)</span>}
                    {!drawerState.priceLoading && getPricingBasisLabel() && (
                      <span
                        className="pricing-basis-label"
                        style={{
                          fontSize: "0.85em",
                          color: "#666",
                          marginLeft: "8px",
                        }}
                      >
                        ({getPricingBasisLabel()})
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
                {/* Fix #3: type="text" + onBlur for formatting */}
                <input
                  type="text"
                  id="unitPrice"
                  data-testid="drawer-unit-price"
                  className={`form-input ${drawerState.priceLoading ? "loading" : ""}`}
                  value={drawerState.unitPrice}
                  onChange={handleUnitPriceChange}
                  onBlur={handleUnitPriceBlur}
                  placeholder={drawerState.priceLoading ? "Loading price..." : "0.00"}
                  disabled={drawerState.priceLoading}
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>
        )}

        {/* Source Type Selector */}
        <SourceTypeSelector value={drawerState.sourceType} onChange={handleSourceTypeChange} />

        {/* Batch Allocation Panel (only for Warehouse source) — Fix #8: removed unused props */}
        {drawerState.sourceType === "WAREHOUSE" && drawerState.productId && (
          <BatchAllocationPanel
            productId={drawerState.productId}
            warehouseId={drawerState.selectedWarehouseId}
            draftInvoiceId={draftInvoiceId}
            lineItemTempId={lineItemTempId}
            requiredQuantity={requiredQty}
            unit={drawerState.unit}
            reserveFIFO={reserveFIFO}
            reserveManual={reserveManual}
            allocations={allocations}
            loading={reservationLoading}
            error={reservationError}
            isCoilProduct={drawerState.isCoilProduct}
            coilWeightMt={coilWeightMt}
          />
        )}

        {/* Reservation Timer */}
        {expiresAt && drawerState.sourceType === "WAREHOUSE" && (
          <ReservationTimer expiresAt={expiresAt} onExpired={handleReservationExpired} onExtend={extendReservation} />
        )}

        {/* Pricing & Margin Section - Only for authorized users */}
        {canViewMargins && unitCogs > 0 && drawerState.sourceType === "WAREHOUSE" && (
          <div className="pricing-margin-section">
            <div className="section-header">Pricing & Margin</div>
            <div className="pricing-row">
              <span>Buying:</span>
              <span className="price-value">
                {unitCogs.toFixed(2)} AED/{drawerState.isCoilProduct ? "MT" : "PCS"}
              </span>
            </div>
            <div className="pricing-row">
              <span>Selling:</span>
              <span className="price-value">
                {parseFloat(drawerState.unitPrice || 0).toFixed(2)} AED/
                {drawerState.isCoilProduct ? "MT" : "PCS"}
              </span>
            </div>
            <div className="pricing-divider"></div>
            <div className="pricing-row margin-row">
              <span>Margin:</span>
              <span className={`margin-value ${marginColor}`}>
                {unitMargin.toFixed(2)} AED/{drawerState.isCoilProduct ? "MT" : "PCS"} ({marginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        {/* Allocation Summary - Shown to all users */}
        {drawerState.sourceType === "WAREHOUSE" && allocations?.length > 0 && (
          <div className="allocation-summary">
            <div className="summary-row">
              <span>Allocated:</span>
              <strong>
                {drawerState.isCoilProduct
                  ? `${allocatedCoilCount} / ${Math.floor(parseFloat(drawerState.quantity) || 0)} PCS`
                  : `${Math.floor(allocatedQuantity)} / ${Math.floor(requiredQty)} PCS`}
                {drawerState.isCoilProduct && coilWeightMt > 0 && (
                  <span style={{ fontWeight: "normal", color: "#666" }}> ({coilWeightMt.toFixed(3)} MT)</span>
                )}
                {(drawerState.isCoilProduct
                  ? allocatedCoilCount >= (parseFloat(drawerState.quantity) || 0)
                  : allocatedQuantity >= requiredQty) && <span className="allocation-check"> ✓</span>}
              </strong>
            </div>
            {drawerState.isCoilProduct
              ? (parseFloat(drawerState.quantity) || 0) - allocatedCoilCount >= 1 && (
                  <div className="summary-row shortfall-warning">
                    <span>Shortfall:</span>
                    <strong className="text-warning">
                      {Math.floor((parseFloat(drawerState.quantity) || 0) - allocatedCoilCount)} PCS
                    </strong>
                  </div>
                )
              : shortfall >= 1 && (
                  <div className="summary-row shortfall-warning">
                    <span>Shortfall:</span>
                    <strong className="text-warning">{Math.floor(shortfall)} PCS</strong>
                  </div>
                )}
            <div className="summary-row line-amount">
              <span>Line Amount:</span>
              <strong className="amount-value">{totalCost.toFixed(2)} AED</strong>
            </div>
          </div>
        )}

        {/* Warehouse Allocation Guidance */}
        {drawerState.sourceType === "WAREHOUSE" &&
          (!allocations || allocations.length === 0) &&
          drawerState.productId && (
            <div className="drawer-info">
              <strong>⚠️ Next Step:</strong> Use the <strong>Auto-Fill FIFO</strong> button or{" "}
              <strong>manually select batches</strong> below to allocate stock from your warehouse inventory. This
              reserves the stock for your invoice.
            </div>
          )}

        {/* Error Display */}
        {(drawerState.error || reservationError) && (
          <div className="drawer-error">
            {drawerState.error || reservationError}
            {drawerState.error?.includes("expired") && (
              <button
                type="button"
                onClick={() => {
                  setDrawerState((prev) => ({ ...prev, error: null }));
                }}
                style={{
                  marginLeft: 8,
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  background: "#0d9488",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Re-allocate
              </button>
            )}
          </div>
        )}
      </div>

      <div className="drawer-footer">
        <button type="button" className="btn-secondary" data-testid="drawer-clear" onClick={handleClear}>
          Clear
        </button>
        <button
          type="button"
          className="btn-primary"
          data-testid="drawer-add-to-invoice"
          onClick={handleAddToInvoice}
          disabled={!isValid || reservationLoading}
        >
          {reservationLoading ? "Loading..." : "Add to Invoice"}
        </button>
      </div>

      {/* Quantity Change Confirmation */}
      {confirmDialog.open && confirmDialog.type === "quantity_change" && (
        <ConfirmDialog
          title="Quantity Change Warning"
          message={`Current batch allocations (${confirmDialog.allocatedPcs} PCS) match the existing quantity (${confirmDialog.currentPcs} PCS).\n\nChanging to ${confirmDialog.newPcs} PCS will require re-allocation.\n\nContinue?`}
          variant="warning"
          onConfirm={() => {
            confirmQuantityChange();
            setConfirmDialog({ open: false, type: null, newValue: null });
          }}
          onCancel={() => setConfirmDialog({ open: false, type: null, newValue: null })}
        />
      )}

      {/* Source Type Change Confirmation */}
      {confirmDialog.open && confirmDialog.type === "source_type_change" && (
        <ConfirmDialog
          title="Source Type Change Warning"
          message={`Current allocations: ${confirmDialog.allocatedQty.toFixed(2)} ${drawerState.unit} from ${allocations.length} batch(es)\n\nSwitching to Drop-Ship will:\n• Release all warehouse batch reservations\n• Clear allocation data\n• Mark this item as drop-ship (no warehouse stock impact)\n\nContinue?`}
          variant="warning"
          onConfirm={() => {
            confirmSourceTypeChange();
            setConfirmDialog({ open: false, type: null, newValue: null });
          }}
          onCancel={() => setConfirmDialog({ open: false, type: null, newValue: null })}
        />
      )}

      {/* Warehouse Change Confirmation */}
      {confirmDialog.open && confirmDialog.type === "warehouse_change" && (
        <ConfirmDialog
          title="Warehouse Change Warning"
          message="Changing warehouse will clear current batch allocations. Continue?"
          variant="warning"
          onConfirm={() => {
            confirmWarehouseChange();
            setConfirmDialog({ open: false, type: null, newValue: null });
          }}
          onCancel={() => setConfirmDialog({ open: false, type: null, newValue: null })}
        />
      )}
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
