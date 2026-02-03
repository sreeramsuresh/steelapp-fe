import { AlertTriangle, Check, Loader2, Package, RefreshCw, Ship } from "lucide-react";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../services/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";

/**
 * BatchPicker Component
 *
 * Allows users to manually select specific batches for invoice line items
 * instead of automatic FIFO allocation.
 *
 * Props:
 * - productId: Product ID to fetch batches for
 * - warehouseId: Warehouse ID to filter batches
 * - requiredQty: Total quantity needed for the line item
 * - onSelectAllocations: Callback with selected allocations array
 * - initialAllocations: Pre-selected allocations (for edit mode)
 * - disabled: Whether the picker is in view-only mode
 */
const BatchPicker = ({
  productId,
  warehouseId,
  requiredQty,
  onSelectAllocations,
  initialAllocations = [],
  disabled = false,
}) => {
  // Debug: Log props on every render
  // console.log('[BatchPicker] RENDER - Props received:', {
  //   productId,
  //   productIdType: typeof productId,
  //   warehouseId,
  //   requiredQty,
  //   initialAllocationsLength: initialAllocations?.length,
  // });

  const { isDarkMode } = useTheme();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState({}); // { batchId: quantity }

  // Calculate totals
  const totalSelected = Object.values(selections).reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);
  const isComplete = Math.abs(totalSelected - requiredQty) < 0.01;
  const isOverAllocated = totalSelected > requiredQty + 0.01;
  const remaining = requiredQty - totalSelected;

  /**
   * Fetch available batches from API
   */
  const fetchBatches = useCallback(async () => {
    // Ensure productId is a valid positive number before fetching
    const numericProductId = typeof productId === "number" ? productId : parseInt(productId);
    const validProductId = numericProductId && numericProductId > 0;

    // console.log('[BatchPicker] fetchBatches called:', {
    //   productId,
    //   numericProductId,
    //   validProductId,
    //   warehouseId,
    // });

    if (!validProductId) {
      // console.log('[BatchPicker] Invalid productId, skipping fetch');
      setBatches([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = { productId: numericProductId };
      // Only add warehouseId if it's a valid value (not undefined, null, empty string, or string "undefined")
      if (warehouseId && warehouseId !== "undefined" && warehouseId !== "null") {
        params.warehouseId = warehouseId;
      }

      const response = await api.get("/stock-batches/available", { params });
      // Note: api.get() returns response.data directly, so response IS the data object
      setBatches(response.batches || []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
      setError(err.response?.data?.error || "Failed to load batches");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [productId, warehouseId]);

  // Fetch batches when product/warehouse changes
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Initialize selections from initialAllocations - only on mount
  // Using ref to track if we've already initialized to prevent infinite loops
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    // Only initialize once on mount, not on every initialAllocations change
    // This prevents infinite loops where:
    // 1. selections change -> notify parent -> parent updates manualAllocations
    // 2. manualAllocations passed as initialAllocations -> triggers this effect
    // 3. setSelections called -> back to step 1
    if (!hasInitializedRef.current && initialAllocations.length > 0) {
      hasInitializedRef.current = true;
      const initial = {};
      initialAllocations.forEach((alloc) => {
        const batchId = alloc.batch_id || alloc.batchId;
        initial[batchId] = alloc.quantity;
      });
      setSelections(initial);
    }
  }, [initialAllocations]);

  // Notify parent of selection changes - use ref to avoid infinite loops
  const onSelectAllocationsRef = useRef(onSelectAllocations);
  onSelectAllocationsRef.current = onSelectAllocations;

  useEffect(() => {
    if (onSelectAllocationsRef.current) {
      const allocations = Object.entries(selections)
        .filter(([, qty]) => parseFloat(qty) > 0)
        .map(([batchId, quantity]) => {
          const batch = batches.find((b) => b.id === parseInt(batchId));
          return {
            batch_id: parseInt(batchId),
            batchId: parseInt(batchId),
            quantity: parseFloat(quantity),
            batchNumber: batch?.batchNumber || "",
            unitCost: batch?.unitCost || 0,
            procurementChannel: batch?.procurementChannel || "LOCAL",
          };
        });
      onSelectAllocationsRef.current(allocations);
    }
  }, [selections, batches]);

  /**
   * Handle quantity change for a batch
   */
  const handleQuantityChange = (batchId, value) => {
    const qty = value === "" ? "" : parseFloat(value) || 0;
    setSelections((prev) => ({
      ...prev,
      [batchId]: qty,
    }));
  };

  /**
   * Auto-fill FIFO (select oldest batches first)
   */
  const autoFillFIFO = () => {
    const newSelections = {};
    let remainingQty = requiredQty;

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const available = batch.quantityAvailable || 0;
      const toAllocate = Math.min(remainingQty, available);

      if (toAllocate > 0) {
        newSelections[batch.id] = toAllocate;
        remainingQty -= toAllocate;
      }
    }

    setSelections(newSelections);
  };

  /**
   * Clear all selections
   */
  const clearSelections = () => {
    setSelections({});
  };

  /**
   * Get procurement channel badge
   */
  const getProcurementBadge = (channel) => {
    if (channel === "IMPORTED") {
      return (
        <Badge
          className={`inline-flex items-center gap-1 ${
            isDarkMode
              ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <Ship size={12} />
          IMPORTED
        </Badge>
      );
    }

    return (
      <Badge
        className={`inline-flex items-center gap-1 ${
          isDarkMode ? "bg-blue-900/40 text-blue-300 border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200"
        }`}
      >
        <Package size={12} />
        LOCAL
      </Badge>
    );
  };

  /**
   * Format currency
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value || 0);
  };

  /**
   * Format quantity
   */
  const formatQty = (qty) => {
    return new Intl.NumberFormat("en-AE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`p-6 rounded-lg border text-center ${
          isDarkMode ? "bg-gray-800/50 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
        }`}
      >
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading available batches...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`p-4 rounded-lg border ${
          isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span className="text-sm">{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchBatches} className="ml-auto">
            <RefreshCw size={14} className="mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No batches available
  if (batches.length === 0) {
    return (
      <div
        className={`p-4 rounded-lg border ${
          isDarkMode ? "bg-amber-900/20 border-amber-700 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span className="text-sm">
            No available batches found for this product
            {warehouseId ? " in the selected warehouse" : ""}.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
          Select Batches (Manual Allocation)
        </h4>

        {!disabled && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={autoFillFIFO} className="text-xs">
              Auto-Fill FIFO
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelections} className="text-xs">
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div
        className={`flex items-center justify-between p-2 rounded-lg border ${
          isComplete
            ? isDarkMode
              ? "bg-green-900/20 border-green-700 text-green-300"
              : "bg-green-50 border-green-200 text-green-700"
            : isOverAllocated
              ? isDarkMode
                ? "bg-red-900/20 border-red-700 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
              : isDarkMode
                ? "bg-amber-900/20 border-amber-700 text-amber-300"
                : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        <div className="flex items-center gap-2">
          {isComplete ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm">
            Required: <strong>{formatQty(requiredQty)}</strong> | Selected: <strong>{formatQty(totalSelected)}</strong>
            {!isComplete && (
              <>
                {" | "}
                {isOverAllocated ? "Over by: " : "Remaining: "}
                <strong>{formatQty(Math.abs(remaining))}</strong>
              </>
            )}
          </span>
        </div>
        {isComplete && <span className="text-xs font-medium">Fully Allocated</span>}
      </div>

      {/* Batches Table */}
      <div className={`rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <Table>
          <TableHeader>
            <TableRow className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
              <TableHead className="w-[130px]">Batch #</TableHead>
              <TableHead className="w-[100px]">Source</TableHead>
              <TableHead className="text-right w-[100px]">Available</TableHead>
              <TableHead className="text-right w-[100px]">Cost/PCS</TableHead>
              <TableHead className="text-right w-[120px]">Allocate Qty</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {batches.map((batch) => {
              const selectedQty = selections[batch.id] || 0;
              const isSelected = selectedQty > 0;

              return (
                <TableRow
                  key={batch.id}
                  className={`
                    ${
                      isSelected
                        ? isDarkMode
                          ? "bg-teal-900/20"
                          : "bg-teal-50"
                        : isDarkMode
                          ? "hover:bg-gray-800/50"
                          : "hover:bg-gray-50"
                    }
                  `}
                >
                  <TableCell className="font-mono text-sm">
                    {batch.batchNumber || "-"}
                    {batch.heatNumber && <div className="text-xs text-gray-500">Heat: {batch.heatNumber}</div>}
                  </TableCell>
                  <TableCell>{getProcurementBadge(batch.procurementChannel)}</TableCell>
                  <TableCell className="text-right font-medium">{formatQty(batch.quantityAvailable)}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(batch.unitCost)}</TableCell>
                  <TableCell className="text-right">
                    <input
                      type="number"
                      min="0"
                      max={batch.quantityAvailable}
                      step="0.01"
                      value={selectedQty}
                      onChange={(e) => handleQuantityChange(batch.id, e.target.value)}
                      disabled={disabled}
                      className={`
                        w-20 px-2 py-1 text-right text-sm rounded border
                        ${disabled ? "cursor-not-allowed opacity-50" : ""}
                        ${
                          isSelected
                            ? isDarkMode
                              ? "bg-teal-900/30 border-teal-600 text-teal-200"
                              : "bg-teal-50 border-teal-400 text-teal-700"
                            : isDarkMode
                              ? "bg-gray-700 border-gray-600 text-gray-200"
                              : "bg-white border-gray-300 text-gray-700"
                        }
                        focus:outline-none focus:ring-1 focus:ring-teal-500
                      `}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          <TableFooter>
            <TableRow className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
              <TableCell colSpan={4} className="font-semibold">
                Total Selected
              </TableCell>
              <TableCell
                className={`text-right font-bold ${
                  isComplete
                    ? "text-green-600 dark:text-green-400"
                    : isOverAllocated
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {formatQty(totalSelected)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Help text */}
      <div
        className={`text-xs p-2 rounded ${isDarkMode ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-600"}`}
      >
        <p>
          Enter quantities for each batch you want to allocate. Total must equal the required quantity. Use
          &quot;Auto-Fill FIFO&quot; to automatically select oldest batches first.
        </p>
      </div>
    </div>
  );
};

BatchPicker.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  warehouseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  requiredQty: PropTypes.number.isRequired,
  onSelectAllocations: PropTypes.func,
  initialAllocations: PropTypes.arrayOf(
    PropTypes.shape({
      batch_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      batchId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      quantity: PropTypes.number,
    })
  ),
  disabled: PropTypes.bool,
};

export default BatchPicker;
