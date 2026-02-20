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
    selectedAllocations: [],
    allocationMethod: null, // 'FIFO' | 'MANUAL' | null - tracks how allocation was made
    loading: false,
    error: null,
    selectedWarehouseId: null, // NEW - user-selected warehouse
    unitPriceOverridden: false, // NEW - track manual price edits
    priceLoading: false, // NEW - price fetch state
    // Phase 1: Unit conversion foundation
    pricingBasisCode: null, // String: "PER_KG" | "PER_MT" | "PER_PCS" | "PER_METER" | "PER_LOT"
    baseUnit: null, // Unit that basePrice is expressed in (derived from pricingBasisCode)
    basePrice: null, // Original price from price list (before conversions)
    currentDisplayUnit: null, // BUGFIX: Track what unit the currently displayed unitPrice is in
    unitWeightKg: null, // Product weight in kg (for piece-to-weight conversions)
    primaryUom: null, // Product's primary unit from product master
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

  // Helper: Determine if product is a coil (audit team requirement)
  const isCoil = useCallback((product) => {
    if (!product) return false;

    // Priority 1: Check product_category field
    if (product.productCategory && product.productCategory.toUpperCase() === "COIL") {
      return true;
    }

    // Priority 2: Check form field (fallback)
    if (product.form?.toLowerCase().includes("coil")) {
      return true;
    }

    return false;
  }, []);

  // Helper: Convert pricing basis enum to string code
  const deriveBasisCode = useCallback((pricingBasis) => {
    // Handle string values from REST API (e.g. "PER_MT", "PER_PCS")
    const VALID_BASES = ["PER_KG", "PER_MT", "PER_PCS", "PER_METER", "PER_LOT"];
    if (typeof pricingBasis === "string" && VALID_BASES.includes(pricingBasis.toUpperCase())) {
      return pricingBasis.toUpperCase();
    }
    // Handle legacy protobuf enum integers (0-5)
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

  // Helper: Derive base unit from pricing basis code
  const deriveBaseUnit = useCallback((basisCode) => {
    const unitMap = {
      PER_KG: "KG",
      PER_MT: "MT",
      PER_PCS: "PCS",
      PER_METER: "M",
      PER_LOT: "LOT",
    };
    return unitMap[basisCode] || "PCS"; // Default to PCS if unknown
  }, []);

  // Helper: Calculate price per piece from price per MT (audit team requirement)
  // Formula: pricePerPCS = pricePerMT * (kgPerPiece / 1000)
  const calculatePricePerPCS = useCallback((pricePerMT, product) => {
    if (pricePerMT == null || !product) return null; // Allow zero price

    // Try to get kgPerPiece from product fields (priority order)
    let kgPerPiece = null;

    // Priority 1: unit_weight_kg field
    if (product.unitWeightKg != null && product.unitWeightKg > 0) {
      kgPerPiece = product.unitWeightKg;
    }
    // Priority 2: pieces_per_mt field (if it exists)
    // Formula: kgPerPiece = 1000 / pieces_per_mt
    else if (product.piecesPerMt != null && product.piecesPerMt > 0) {
      kgPerPiece = 1000 / product.piecesPerMt;
    }
    // Priority 3: Could add dimension-based calculation here in future
    // else if (product.width && product.thickness && product.length) {
    //   kgPerPiece = calculateTheoreticalWeight(product);
    // }

    if (!kgPerPiece) {
      return null; // Cannot calculate without weight data
    }

    // Apply formula: pricePerPCS = pricePerMT * (kgPerPiece / 1000)
    return pricePerMT * (kgPerPiece / 1000);
  }, []);

  // Phase 2: Conversion Logic

  // Check if conversion between units is supported
  const isConversionSupported = useCallback((fromUnit, toUnit, unitWeightKg, pricingBasisCode) => {
    if (fromUnit === toUnit) return true; // Same unit, no conversion needed

    // Block PER_METER and PER_LOT conversions (unsupported)
    if (pricingBasisCode === "PER_METER" || pricingBasisCode === "PER_LOT") {
      return false;
    }

    // Weight conversions (MT ↔ KG) - always supported
    if ((fromUnit === "MT" && toUnit === "KG") || (fromUnit === "KG" && toUnit === "MT")) {
      return true;
    }

    // Piece-to-weight conversions (PCS ↔ KG/MT) - require unitWeightKg
    const isPieceToWeight =
      (fromUnit === "PCS" && (toUnit === "KG" || toUnit === "MT")) ||
      ((fromUnit === "KG" || fromUnit === "MT") && toUnit === "PCS");

    if (isPieceToWeight) {
      return unitWeightKg != null && unitWeightKg > 0;
    }

    // All other conversions unsupported
    return false;
  }, []);

  // CRITICAL FIX: Pure function to get conversion factor (basis → targetUnit)
  // Returns null if conversion impossible; throws if guardconditions violated
  const getFactor = useCallback((pricingBasisCode, targetUnit, unitWeightKg) => {
    if (!pricingBasisCode) return null;

    const basisCode = pricingBasisCode.toUpperCase();
    const unit = (targetUnit || "").toUpperCase();

    // Block unsupported bases
    if (basisCode === "PER_METER" || basisCode === "PER_LOT") {
      return null; // Cannot convert
    }

    // Map basis to its native unit and factor
    const mapping = {
      PER_MT: { nativeUnit: "MT", factors: { MT: 1, KG: 1 / 1000, PCS: unitWeightKg ? unitWeightKg / 1000 : null } },
      PER_KG: { nativeUnit: "KG", factors: { KG: 1, MT: 1000, PCS: unitWeightKg ? unitWeightKg : null } },
      PER_PCS: {
        nativeUnit: "PCS",
        factors: { PCS: 1, KG: unitWeightKg ? 1 / unitWeightKg : null, MT: unitWeightKg ? 1000 / unitWeightKg : null },
      },
    };

    const basisData = mapping[basisCode];
    if (!basisData) return null;

    const factor = basisData.factors[unit];
    return factor; // May be null if PCS conversion blocked by missing unitWeightKg
  }, []);

  // CRITICAL FIX: Pure function that derives display rate from immutable base
  // Returns { displayRate, isValid, error }
  const deriveDisplayRate = useCallback(
    (baseRate, basePricingBasis, targetUnit, unitWeightKg) => {
      if (baseRate == null || !basePricingBasis || !targetUnit) {
        return { displayRate: "", isValid: false, error: null };
      }

      const factor = getFactor(basePricingBasis, targetUnit, unitWeightKg);

      // Factor is null if conversion unsupported or blocked
      if (factor === null) {
        const errorMsg =
          basePricingBasis === "PER_METER"
            ? "Conversions from per-meter not supported"
            : basePricingBasis === "PER_LOT"
              ? "Fixed lot pricing cannot be converted"
              : targetUnit === "PCS" && (!unitWeightKg || unitWeightKg <= 0)
                ? "Unit weight (kg/pcs) required to convert to pieces"
                : "Conversion not supported";
        return { displayRate: "", isValid: false, error: errorMsg };
      }

      const displayRate = baseRate * factor;
      return { displayRate: Math.round(displayRate * 100) / 100, isValid: true, error: null };
    },
    [getFactor]
  );

  // Convert quantity from one unit to another (preserves physical amount)
  const convertQuantity = useCallback((qty, fromUnit, toUnit, unitWeightKg) => {
    if (fromUnit === toUnit || qty == null) return qty;

    const numQty = parseFloat(qty);
    if (Number.isNaN(numQty)) return qty;

    // MT to KG: 10 MT = 10,000 KG
    if (fromUnit === "MT" && toUnit === "KG") {
      return numQty * 1000;
    }

    // KG to MT: 10,000 KG = 10 MT
    if (fromUnit === "KG" && toUnit === "MT") {
      return numQty / 1000;
    }

    // PCS to KG: 10 PCS × 2.5 kg/pcs = 25 KG
    if (fromUnit === "PCS" && toUnit === "KG") {
      if (!unitWeightKg || unitWeightKg === 0) return numQty;
      return numQty * unitWeightKg;
    }

    // KG to PCS: 25 KG / 2.5 kg/pcs = 10 PCS
    if (fromUnit === "KG" && toUnit === "PCS") {
      if (!unitWeightKg || unitWeightKg === 0) return numQty;
      return numQty / unitWeightKg;
    }

    // PCS to MT: 10 PCS × (2.5 kg/pcs / 1000) = 0.025 MT
    if (fromUnit === "PCS" && toUnit === "MT") {
      if (!unitWeightKg || unitWeightKg === 0) return numQty;
      return numQty * (unitWeightKg / 1000);
    }

    // MT to PCS: 0.025 MT / (2.5 kg/pcs / 1000) = 10 PCS
    if (fromUnit === "MT" && toUnit === "PCS") {
      if (!unitWeightKg || unitWeightKg === 0) return numQty;
      return numQty / (unitWeightKg / 1000);
    }

    return numQty; // Fallback: no conversion
  }, []);

  // Format price with backend-aligned precision
  const formatPrice = useCallback((price) => {
    const numPrice = parseFloat(price);
    if (Number.isNaN(numPrice)) return "";

    // CRITICAL: Format with proper decimal places to avoid floating-point display artifacts
    // All prices display with 2 decimal places for consistency and audit trail
    return numPrice.toFixed(2);
  }, []);

  // Format quantity with unit-appropriate precision
  const formatQuantity = useCallback((qty, unit) => {
    const numQty = parseFloat(qty);
    if (Number.isNaN(numQty)) return "";

    // PCS: whole numbers only
    if (unit === "PCS") {
      return Math.round(numQty);
    }
    return numQty; // Return numeric value
  }, []);

  // Phase 4: Get available units based on product and pricing basis
  const getAvailableUnits = useCallback(() => {
    const allUnits = ["KG", "PCS", "MT", "M"];
    const currentUnit = drawerState.unit;

    // If no product selected, allow all units
    if (!drawerState.productId) {
      return allUnits.map((unit) => ({
        value: unit,
        disabled: false,
        reason: null,
      }));
    }

    return allUnits.map((unit) => {
      // AUDIT TEAM REQUIREMENT: Disable PCS for coils (coils should stay in MT/KG only)
      if (unit === "PCS" && isCoil(drawerState.product)) {
        return {
          value: unit,
          disabled: true,
          reason: "Coils cannot be sold in pieces",
        };
      }

      // Current unit is always enabled (to stay on it)
      if (unit === currentUnit) {
        return { value: unit, disabled: false, reason: null };
      }

      // Check if conversion from current unit to this unit is supported
      const supported = isConversionSupported(
        currentUnit,
        unit,
        drawerState.unitWeightKg,
        drawerState.pricingBasisCode
      );

      if (!supported) {
        let reason = "Conversion not available";

        if (drawerState.pricingBasisCode === "PER_METER" && unit !== "M") {
          reason = "Product priced per meter";
        } else if (drawerState.pricingBasisCode === "PER_LOT" && unit !== "LOT") {
          reason = "Product priced per lot";
        } else if (!drawerState.unitWeightKg && (unit === "KG" || unit === "MT")) {
          reason = "Product weight required";
        }

        return { value: unit, disabled: true, reason };
      }

      return { value: unit, disabled: false, reason: null };
    });
  }, [
    drawerState.unit,
    drawerState.productId,
    drawerState.unitWeightKg,
    drawerState.pricingBasisCode,
    drawerState.product,
    isCoil,
    isConversionSupported,
  ]);

  // Compute available units with useMemo
  const availableUnits = useMemo(() => getAvailableUnits(), [getAvailableUnits]);

  // Phase 5: Get pricing basis label for UI indicator
  // BUGFIX: Use currentDisplayUnit instead of pricingBasisCode so label matches displayed price
  const getPricingBasisLabel = () => {
    if (!drawerState.currentDisplayUnit) return "";

    return "per pc";
  };

  // NOTE: Removed useEffect that initialized selectedWarehouseId from parent's warehouseId.
  // The parent's warehouseId is for VAT/Place of Supply, not physical product location.
  // WarehouseAvailability component with autoSelectFirst={true} handles correct warehouse selection
  // based on where the product actually has stock.

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

        const response = await pricelistService.getProductPrice(productId, params);

        // Only apply if this is the latest request (race-safe)
        if (requestId === priceRequestIdRef.current) {
          setDrawerState((prev) => {
            // Double-check override flag hasn't changed during fetch
            if (prev.unitPriceOverridden) {
              return { ...prev, priceLoading: false };
            }

            // Phase 1: Store pricing basis information
            const basisCode = deriveBasisCode(response.pricingBasis);
            const baseUnit = deriveBaseUnit(basisCode);

            // AUDIT TEAM REQUIREMENT: Auto-calculate /PCS for non-coil items
            let displayPrice = response.price;
            let displayUnit = baseUnit;
            let autoCalcError = null;

            // If non-coil product priced in /MT and current unit is PCS, auto-calculate /PCS
            if (!isCoil(prev.product) && basisCode === "PER_MT" && prev.unit === "PCS") {
              const pricePerPCS = calculatePricePerPCS(response.price, prev.product);

              if (pricePerPCS !== null) {
                displayPrice = pricePerPCS;
                displayUnit = "PCS";
              } else {
                // Missing weight data - block with clear error
                autoCalcError =
                  "Cannot convert price to PCS: product is missing unit weight configuration. Try selecting a different unit (KG, MT) or contact your administrator to configure the unit weight in product settings.";
              }
            }

            return {
              ...prev,
              unitPrice: autoCalcError
                ? ""
                : displayPrice
                  ? (Math.round(displayPrice * 100) / 100).toString()
                  : prev.unitPrice,
              priceLoading: false,
              // Store pricing basis metadata
              pricingBasisCode: basisCode,
              baseUnit,
              basePrice: response.price, // Store numeric base price (always in /MT)
              currentDisplayUnit: autoCalcError ? null : displayUnit, // BUGFIX: Track what unit the displayed price is in
              error: autoCalcError || prev.error,
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch product price:", err);

        // Only update error if this is the latest request
        if (requestId === priceRequestIdRef.current) {
          const status = err.response?.status;

          setDrawerState((prev) => {
            // Only show error if user hasn't manually entered price
            let errorMessage = null;

            if (!prev.unitPrice) {
              if (status === 404) {
                // Product not in pricelist - non-blocking, user can enter manually
                errorMessage =
                  "Price not found in pricelist for this product. You can click in the Unit Price field above and enter the price manually, or contact your sales manager to add pricing for this product.";
              } else if (status === 400) {
                // Configuration error (no default pricelist) - provide actionable guidance
                errorMessage =
                  "No pricelist is configured for your customer. Please select a different customer with a pricelist, or click in the Unit Price field above and enter the price manually.";
              } else {
                // Other errors (500, network, etc.)
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
    [customerId, priceListId, calculatePricePerPCS, deriveBaseUnit, deriveBasisCode, isCoil]
  );

  // Fetch price on product selection
  useEffect(() => {
    if (drawerState.productId && !drawerState.unitPriceOverridden) {
      const qty = parseFloat(drawerState.quantity) || 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProductPrice(drawerState.productId, qty);
    }
  }, [drawerState.productId, drawerState.quantity, drawerState.unitPriceOverridden, fetchProductPrice]);

  // Re-fetch price on quantity change (volume discounts) with debounce
  useEffect(() => {
    if (drawerState.productId && drawerState.quantity && !drawerState.unitPriceOverridden) {
      const qty = parseFloat(drawerState.quantity);
      if (qty > 0) {
        const timer = setTimeout(() => {
          fetchProductPrice(drawerState.productId, qty);
        }, 500); // Debounce
        return () => clearTimeout(timer);
      }
    }
  }, [drawerState.quantity, drawerState.productId, drawerState.unitPriceOverridden, fetchProductPrice]);

  // Handle product selection
  const handleProductSelect = useCallback(
    (product) => {
      setDrawerState((prev) => ({
        ...prev,
        product,
        productId: product?.id || null,
        productName: product?.displayName || product?.name || "",
        // Reset allocations when product changes
        selectedAllocations: [],
        // Clear error when product changes
        error: null,
        // Phase 1: Store product UOM and weight information
        unitWeightKg: product?.unitWeightKg || null,
        primaryUom: product?.primaryUom || null,
      }));

      // Clear any existing reservation and its error state when product changes
      if (reservationId) {
        cancelReservation();
      }
    },
    [reservationId, cancelReservation]
  );

  // Handle quantity change (PCS-CENTRIC: Integer comparison)
  const handleQuantityChange = useCallback(
    (e) => {
      const value = e.target.value;
      // Allow empty or valid decimal numbers
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        // P2-2: Warn if changing quantity with active allocations
        if (
          drawerState.sourceType === "WAREHOUSE" &&
          allocations?.length > 0 &&
          drawerState.quantity !== "" &&
          value !== drawerState.quantity
        ) {
          const currentPcs = Math.floor(parseFloat(drawerState.quantity) || 0);
          const newPcs = Math.floor(parseFloat(value) || 0);
          const allocatedPcs = allocations.reduce((sum, a) => sum + Math.floor(parseFloat(a.pcsAllocated ?? a.quantity ?? 0)), 0);

          // PCS-CENTRIC: Only warn if integer PCS changes
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
          // Clear error when quantity changes
          error: null,
        }));
      }
    },
    [drawerState.sourceType, drawerState.quantity, allocations]
  );

  // Confirm quantity change
  const confirmQuantityChange = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      quantity: confirmDialog.newValue,
      error: null,
    }));
  }, [confirmDialog.newValue]);

  // Handle unit change - CRITICAL FIX: Derive display rate from baseRate, never in-place convert
  const handleUnitChange = useCallback(
    (e) => {
      const newUnit = e.target.value;

      setDrawerState((prev) => {
        const oldUnit = prev.unit;

        // No change needed if same unit
        if (oldUnit === newUnit) return prev;

        // Check if conversion is supported
        const canConvert = isConversionSupported(oldUnit, newUnit, prev.unitWeightKg, prev.pricingBasisCode);

        if (!canConvert) {
          // Show error and don't change unit
          let errorMsg = "Cannot convert to this unit.";

          if (prev.pricingBasisCode === "PER_METER") {
            errorMsg = "Length-based conversions not available. Please use meters.";
          } else if (prev.pricingBasisCode === "PER_LOT") {
            errorMsg = "Lot-based conversions not available. Please use lots.";
          } else if (!prev.unitWeightKg && (newUnit === "KG" || newUnit === "MT")) {
            errorMsg = "Weight conversions require product weight data.";
          }

          return {
            ...prev,
            error: errorMsg,
          };
        }

        // CRITICAL FIX: ALWAYS derive new display price from immutable baseRate + basePricingBasis
        // Do NOT convert the already-displayed price (which may be auto-calculated or user-entered)
        let newPrice = prev.unitPrice; // Default: keep existing if override
        let newError = null;

        if (!prev.unitPriceOverridden && prev.basePrice != null && prev.pricingBasisCode) {
          // Re-derive display price from base (single source of truth)
          const { displayRate, isValid, error } = deriveDisplayRate(
            prev.basePrice,
            prev.pricingBasisCode,
            newUnit,
            prev.unitWeightKg
          );

          if (isValid) {
            newPrice = displayRate;
          } else {
            // Conversion failed (e.g., PCS without weight)
            newPrice = "";
            newError = error;
          }
        }

        // ALWAYS convert quantity to preserve physical meaning
        let newQuantity = prev.quantity;
        if (prev.quantity) {
          newQuantity = convertQuantity(prev.quantity, oldUnit, newUnit, prev.unitWeightKg);
        }

        // Format values
        const formattedPrice = formatPrice(newPrice);
        const formattedQuantity = formatQuantity(newQuantity, newUnit);

        return {
          ...prev,
          unit: newUnit,
          unitPrice: formattedPrice.toString(),
          quantity: formattedQuantity.toString(),
          currentDisplayUnit: newUnit, // Track that price is now displayed in newUnit
          error: newError || null,
        };
      });
    },
    [deriveDisplayRate, convertQuantity, formatPrice, formatQuantity, isConversionSupported]
  );

  // Handle unit price change
  const handleUnitPriceChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Format price to 2 decimal places if it's a valid number
      let formattedValue = value;
      if (value && !Number.isNaN(parseFloat(value))) {
        const numValue = parseFloat(value);
        formattedValue = (Math.round(numValue * 100) / 100).toString();
      }

      setDrawerState((prev) => ({
        ...prev,
        unitPrice: formattedValue,
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
      unitPrice: "",
    }));
    const qty = parseFloat(drawerState.quantity) || 1;
    fetchProductPrice(drawerState.productId, qty);
  }, [drawerState.productId, drawerState.quantity, fetchProductPrice]);

  // Handle source type change
  const handleSourceTypeChange = useCallback(
    (sourceType) => {
      // P2-3: Warn if switching FROM warehouse TO drop-ship with active allocations
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
        // Clear allocations when switching away from warehouse
        selectedAllocations: sourceType === "WAREHOUSE" ? prev.selectedAllocations : [],
        allocationMethod: sourceType === "WAREHOUSE" ? prev.allocationMethod : null,
      }));
    },
    [drawerState.sourceType, allocations]
  );

  // Confirm source type change
  const confirmSourceTypeChange = useCallback(async () => {
    const sourceType = confirmDialog.newValue;

    // Cancel reservation if switching away from warehouse
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
      // Clear allocations when switching away from warehouse
      selectedAllocations: sourceType === "WAREHOUSE" ? prev.selectedAllocations : [],
      allocationMethod: sourceType === "WAREHOUSE" ? prev.allocationMethod : null,
    }));
  }, [confirmDialog.newValue, reservationId, cancelReservation]);

  // Handle allocation changes from BatchAllocationPanel
  const handleAllocationsChange = useCallback((newAllocations) => {
    setDrawerState((prev) => ({
      ...prev,
      selectedAllocations: newAllocations,
    }));
  }, []);

  // Handle warehouse selection
  const handleWarehouseSelect = useCallback(
    (newWarehouseId) => {
      // Warn if changing warehouse with active allocations
      if (drawerState.selectedWarehouseId !== newWarehouseId && allocations?.length > 0) {
        setConfirmDialog({
          open: true,
          type: "warehouse_change",
          newValue: newWarehouseId,
        });
        return;
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
    [drawerState.selectedWarehouseId, allocations]
  );

  // Confirm warehouse change
  const confirmWarehouseChange = useCallback(async () => {
    const newWarehouseId = confirmDialog.newValue;

    // Cancel existing reservations
    if (reservationId) {
      try {
        await cancelReservation();
      } catch (err) {
        console.warn("Failed to cancel reservation on warehouse change:", err);
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
  }, [confirmDialog.newValue, reservationId, cancelReservation]);

  // Handle reservation expiry
  const handleReservationExpired = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      selectedAllocations: [],
      error: "Reservation expired. Please re-allocate batches.",
      allocationMethod: null,
    }));
  }, []);

  // Validate form (PCS-CENTRIC: Integer comparison for warehouse allocations)
  const isValid = useMemo(() => {
    if (!drawerState.productId) return false;
    if (!drawerState.quantity || parseFloat(drawerState.quantity) <= 0) return false;
    if (!drawerState.unitPrice || parseFloat(drawerState.unitPrice) <= 0) return false;

    if (drawerState.sourceType === "WAREHOUSE") {
      // PCS-CENTRIC: For warehouse source, allow adding line item if:
      // 1. Allocations exist and match required quantity, OR
      // 2. No allocations yet but user is in the allocation workflow (warehouse selected + batch panel visible)
      // This allows users to add the line first and complete allocation as next step
      const allocatedPcs = (allocations || []).reduce((sum, a) => sum + Math.floor(parseFloat(a.pcsAllocated ?? a.quantity ?? 0)), 0);
      const requiredPcs = Math.floor(parseFloat(drawerState.quantity));

      // Allow if fully allocated OR if user hasn't attempted allocation yet (empty allocations list)
      if (allocatedPcs >= requiredPcs) return true; // Fully allocated - allow
      if ((allocations || []).length === 0) return true; // No allocations yet - allow (user will allocate next)

      // Partial allocation - don't allow (must be all-or-nothing)
      return false;
    }

    return true; // Drop-ship doesn't need allocations
  }, [drawerState, allocations]);

  // Calculate allocated quantity
  const allocatedQuantity = useMemo(() => {
    return (allocations || []).reduce((sum, a) => sum + parseFloat(a.pcsAllocated ?? a.quantity ?? 0), 0);
  }, [allocations]);

  // Calculate total cost (selling amount = qty × unitPrice)
  // NOTE: Backend's allocation.totalCost is COGS (for margin tracking), NOT the invoice amount
  const totalCost = useMemo(() => {
    const qty = parseFloat(drawerState.quantity) || 0;
    const price = parseFloat(drawerState.unitPrice) || 0;
    return qty * price;
  }, [drawerState.quantity, drawerState.unitPrice]);

  // Calculate COGS separately for margin tracking (optional - for future margin reports)
  const totalCogs = useMemo(() => {
    if (drawerState.sourceType === "WAREHOUSE" && allocations?.length > 0) {
      return allocations.reduce((sum, a) => sum + parseFloat(a.totalCost || 0), 0);
    }
    return 0;
  }, [drawerState.sourceType, allocations]);

  // Check if user can view margins (CEO, CFO, Sales Manager, Admin, Dev)
  const canViewMargins = useMemo(() => {
    return authService.hasRole(["ceo", "cfo", "sales_manager", "admin", "dev"]);
  }, []);

  // Per-piece unit cost (buying price from batch)
  const unitCogs = useMemo(() => {
    const qty = parseFloat(drawerState.quantity) || 0;
    if (qty <= 0 || totalCogs <= 0) return 0;
    return totalCogs / qty;
  }, [totalCogs, drawerState.quantity]);

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

  // Margin color based on percentage (Red < 5%, Yellow 5-10%, Green > 10%)
  const marginColor = useMemo(() => {
    if (marginPercent < 5) return "text-red-600";
    if (marginPercent < 10) return "text-yellow-600";
    return "text-green-600";
  }, [marginPercent]);

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
      productName: "",
      quantity: "",
      unit: "PCS",
      unitPrice: "",
      sourceType: "WAREHOUSE",
      selectedAllocations: [],
      allocationMethod: null,
      loading: false,
      error: null,
      // CRITICAL: Also clear base pricing info
      pricingBasisCode: null,
      baseUnit: null,
      basePrice: null,
      currentDisplayUnit: null,
      unitWeightKg: null,
      primaryUom: null,
      unitPriceOverridden: false,
      priceLoading: false,
      selectedWarehouseId: null,
    });
  }, [reservationId, cancelReservation]);

  // Handle add to invoice - CRITICAL: persist baseRate + basePricingBasis for audit trail
  const handleAddToInvoice = useCallback(() => {
    if (!isValid) return;

    // GUARDRAIL: If PCS conversion involved, require unitWeightKg (skip for dropship - manual pricing)
    if (
      drawerState.unit === "PCS" &&
      (!drawerState.unitWeightKg || drawerState.unitWeightKg <= 0) &&
      drawerState.sourceType === "WAREHOUSE"
    ) {
      setDrawerState((prev) => ({
        ...prev,
        error: "Unit weight (kg/pcs) required for PCS pricing. Contact admin.",
      }));
      return;
    }

    const lineItem = {
      // Line item identification
      lineItemTempId,
      productId: drawerState.productId,
      product: drawerState.product,
      name: drawerState.productName,

      // Display values (what user saw and entered)
      quantity: parseFloat(drawerState.quantity),
      unit: drawerState.unit, // Display unit
      rate: parseFloat(drawerState.unitPrice), // Display rate (per unit)
      amount: totalCost, // Display quantity × display rate

      // CRITICAL FIX: Base values for audit trail and unambiguous interpretation
      baseRate: drawerState.basePrice,
      basePricingBasis: drawerState.pricingBasisCode,
      pricingBasis: drawerState.pricingBasisCode, // Alias for compatibility

      // Stock allocation metadata
      sourceType: drawerState.sourceType,
      warehouseId: drawerState.sourceType === "WAREHOUSE" ? warehouseId : null,
      allocations: drawerState.sourceType === "WAREHOUSE" ? allocations : [],
      allocationMode: drawerState.sourceType === "WAREHOUSE" ? drawerState.allocationMethod || "AUTO_FIFO" : null,

      // Reservation tracking
      reservationId,
      expiresAt,

      // Product weight for conversions
      unitWeightKg: drawerState.unitWeightKg,
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
                    placeholder="0.00"
                  />
                  <select className="unit-select" value={drawerState.unit} onChange={handleUnitChange}>
                    {availableUnits.map((unitOption) => (
                      <option
                        key={unitOption.value}
                        value={unitOption.value}
                        disabled={unitOption.disabled}
                        title={unitOption.disabled ? unitOption.reason : ""}
                      >
                        {unitOption.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
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
                <input
                  type="number"
                  id="unitPrice"
                  data-testid="drawer-unit-price"
                  className={`form-input ${drawerState.priceLoading ? "loading" : ""}`}
                  value={drawerState.unitPrice}
                  onChange={handleUnitPriceChange}
                  placeholder={drawerState.priceLoading ? "Loading price..." : "0.00"}
                  disabled={drawerState.priceLoading}
                  step="0.01"
                  inputMode="decimal"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Source Type Selector */}
        <SourceTypeSelector value={drawerState.sourceType} onChange={handleSourceTypeChange} />

        {/* Batch Allocation Panel (only for Warehouse source) */}
        {drawerState.sourceType === "WAREHOUSE" && drawerState.productId && (
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
                {unitCogs.toFixed(2)} AED/{drawerState.unit}
              </span>
            </div>
            <div className="pricing-row">
              <span>Selling:</span>
              <span className="price-value">
                {parseFloat(drawerState.unitPrice || 0).toFixed(2)} AED/
                {drawerState.unit}
              </span>
            </div>
            <div className="pricing-divider"></div>
            <div className="pricing-row margin-row">
              <span>Margin:</span>
              <span className={`margin-value ${marginColor}`}>
                {unitMargin.toFixed(2)} AED/{drawerState.unit} ({marginPercent.toFixed(1)}%)
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
                {Math.floor(allocatedQuantity)} / {Math.floor(requiredQty)} {drawerState.unit}
                {allocatedQuantity >= requiredQty && <span className="allocation-check"> ✓</span>}
              </strong>
            </div>
            {shortfall >= 1 && (
              <div className="summary-row shortfall-warning">
                <span>Shortfall:</span>
                <strong className="text-warning">
                  {Math.floor(shortfall)} {drawerState.unit}
                </strong>
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
                  setDrawerState((prev) => ({ ...prev, error: null, selectedAllocations: [] }));
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
