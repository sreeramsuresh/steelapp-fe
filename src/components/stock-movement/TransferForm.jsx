/**
 * TransferForm Component
 * Phase 5: Inter-Warehouse Transfers
 *
 * Form for creating new stock transfers
 * Uses inline stock picker — shows all available stock from source warehouse
 */

import { AlertTriangle, ArrowLeft, ArrowRight, ChevronDown, Loader2, Package, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { stockMovementService } from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = "KG") => {
  return `${parseFloat(qty || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

const TransferForm = ({ onCancel, onSuccess }) => {
  const { isDarkMode } = useTheme();

  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [transferType, setTransferType] = useState("REGULAR");

  // Epic 10: TRAN-003 - Transfer approval workflow
  const [transferStatus] = useState("DRAFT");

  // Epic 10: TRAN-005 - Transporter details
  const [driverId] = useState("");
  const [driverName] = useState("");
  const [vehicleNumber] = useState("");
  const [vehiclePlate] = useState("");
  const [departureTime] = useState("");
  const [expectedArrivalTime] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Stock picker state
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockLoadError, setStockLoadError] = useState(null);
  const [stockSearch, setStockSearch] = useState("");

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
      } catch (err) {
        console.error("Error loading warehouses:", err);
        setError("Failed to load warehouses");
      } finally {
        setLoadingWarehouses(false);
      }
    };
    loadWarehouses();
  }, []);

  // Load stock levels when source warehouse changes
  useEffect(() => {
    let cancelled = false;

    const loadWarehouseStock = async () => {
      if (!sourceWarehouseId) {
        setWarehouseStock([]);
        setStockLoadError(null);
        return;
      }
      try {
        setLoadingStock(true);
        setStockLoadError(null);
        setStockSearch("");
        const result = await stockMovementService.getStockLevels({
          warehouseId: sourceWarehouseId,
          limit: 1000,
        });
        if (cancelled) return;
        const stock = (result.data || [])
          .filter((item) => item.quantityAvailable > 0)
          .map((item) => ({
            productId: String(item.productId),
            productName: item.productName || `Product #${item.productId}`,
            productSku: item.productSku || "",
            quantityOnHand: item.quantityOnHand,
            quantityAvailable: item.quantityAvailable,
            unit: item.unit || "KG",
            selected: false,
            transferQty: "",
            notes: "",
          }));
        setWarehouseStock(stock);
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading warehouse stock:", err);
        setStockLoadError("Failed to load stock for this warehouse");
      } finally {
        if (!cancelled) setLoadingStock(false);
      }
    };

    loadWarehouseStock();
    return () => {
      cancelled = true;
    };
  }, [sourceWarehouseId]);

  // Stock picker handlers
  const handleToggleItem = (productId) => {
    setWarehouseStock((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleAll = () => {
    const visibleIds = new Set(filteredStock.map((item) => item.productId));
    const allChecked = filteredStock.length > 0 && filteredStock.every((item) => item.selected);
    setWarehouseStock((prev) =>
      prev.map((item) => (visibleIds.has(item.productId) ? { ...item, selected: !allChecked } : item))
    );
  };

  const handleTransferQtyChange = (productId, value) => {
    setWarehouseStock((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const numVal = Number(value);
        const shouldAutoSelect = value !== "" && numVal > 0;
        return {
          ...item,
          transferQty: value,
          selected: shouldAutoSelect ? true : item.selected,
        };
      })
    );
  };

  const handleItemNotes = (productId, value) => {
    setWarehouseStock((prev) => prev.map((item) => (item.productId === productId ? { ...item, notes: value } : item)));
  };

  // Derived state
  const filteredStock = useMemo(() => {
    if (!stockSearch) return warehouseStock;
    const term = stockSearch.toLowerCase();
    return warehouseStock.filter(
      (item) => item.productName.toLowerCase().includes(term) || item.productSku.toLowerCase().includes(term)
    );
  }, [warehouseStock, stockSearch]);

  const selectedItems = useMemo(
    () => warehouseStock.filter((item) => item.selected && item.transferQty !== "" && Number(item.transferQty) > 0),
    [warehouseStock]
  );

  const allVisibleSelected = filteredStock.length > 0 && filteredStock.every((item) => item.selected);

  const sourceWarehouseName = useMemo(
    () => warehouses.find((w) => String(w.id) === String(sourceWarehouseId))?.name || "Selected Warehouse",
    [warehouses, sourceWarehouseId]
  );

  // Validate form
  const validateForm = () => {
    const errors = [];
    const invalid = new Set();

    if (!sourceWarehouseId) {
      errors.push("Please select a source warehouse");
      invalid.add("sourceWarehouse");
    }
    if (!destinationWarehouseId) {
      errors.push("Please select a destination warehouse");
      invalid.add("destinationWarehouse");
    }
    if (sourceWarehouseId && destinationWarehouseId && sourceWarehouseId === destinationWarehouseId) {
      errors.push("Source and destination warehouses must be different");
      invalid.add("sourceWarehouse");
      invalid.add("destinationWarehouse");
    }
    if (selectedItems.length === 0) {
      errors.push("Please select at least one item to transfer");
      invalid.add("items");
    }
    selectedItems.forEach((item) => {
      const qty = Number(item.transferQty) || 0;
      if (qty <= 0) {
        errors.push(`${item.productName}: Quantity must be greater than 0`);
      }
      if (qty > item.quantityAvailable) {
        errors.push(
          `${item.productName}: Insufficient stock. Available: ${formatQuantity(item.quantityAvailable, item.unit)}`
        );
      }
    });

    setValidationErrors(errors);
    setInvalidFields(invalid);

    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }

    setError(null);
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const transferData = {
        sourceWarehouseId: parseInt(sourceWarehouseId, 10),
        destinationWarehouseId: parseInt(destinationWarehouseId, 10),
        expectedDate: expectedDate || null,
        transferType,
        transferStatus,
        driverId: driverId || null,
        driverName: driverName || null,
        vehicleNumber: vehicleNumber || null,
        vehiclePlate: vehiclePlate || null,
        departureTime: departureTime || null,
        expectedArrivalTime: expectedArrivalTime || null,
        notes,
        items: selectedItems.map((item) => ({
          productId: parseInt(item.productId, 10),
          quantity: parseFloat(item.transferQty),
          unit: item.unit,
          notes: item.notes,
        })),
      };

      const result = await stockMovementService.createTransfer(transferData);
      onSuccess?.(result);
    } catch (err) {
      console.error("Error creating transfer:", err);
      setError(err.message || "Failed to create transfer");
    } finally {
      setSaving(false);
    }
  };

  // Performance: Memoize warehouse filtering to avoid recalculating on every render
  const sourceWarehouses = useMemo(() => {
    return warehouses.filter((wh) => wh.id !== parseInt(destinationWarehouseId, 10));
  }, [warehouses, destinationWarehouseId]);

  const destinationWarehouses = useMemo(() => {
    return warehouses.filter((wh) => wh.id !== parseInt(sourceWarehouseId, 10));
  }, [warehouses, sourceWarehouseId]);

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-[#0a0e12] text-white" : "bg-gray-50 text-gray-900"}`}
      data-testid="transfer-form"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ArrowRight className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Create Stock Transfer</h1>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            isDarkMode ? "bg-red-900 bg-opacity-30 border border-red-700" : "bg-red-50 border border-red-200"
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setValidationErrors([]);
              setInvalidFields(new Set());
              setError(null);
            }}
            className="text-red-500 hover:text-red-700"
          >
            <Package className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* API Error Alert (non-validation errors) */}
      {error && validationErrors.length === 0 && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            isDarkMode ? "bg-red-900 bg-opacity-30 border border-red-700" : "bg-red-50 border border-red-200"
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <Package className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Transfer Details Card */}
      <div
        className={`p-6 rounded-lg shadow mb-6 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4">Transfer Details</h2>
        <hr className={`mb-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Source Warehouse */}
          <div>
            <label
              htmlFor="source-warehouse"
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Source Warehouse *
            </label>
            <div className="relative">
              <select
                id="source-warehouse"
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                disabled={loadingWarehouses}
                className={`w-full px-3 py-2 rounded-lg border appearance-none ${
                  invalidFields.has("sourceWarehouse")
                    ? "border-red-500 ring-1 ring-red-500"
                    : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                } ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loadingWarehouses ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-testid="source-warehouse-select"
              >
                <option value="">Select source...</option>
                {sourceWarehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Destination Warehouse */}
          <div>
            <label
              htmlFor="destination-warehouse"
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Destination Warehouse *
            </label>
            <div className="relative">
              <select
                id="destination-warehouse"
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
                disabled={loadingWarehouses}
                className={`w-full px-3 py-2 rounded-lg border appearance-none ${
                  invalidFields.has("destinationWarehouse")
                    ? "border-red-500 ring-1 ring-red-500"
                    : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                } ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loadingWarehouses ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-testid="destination-warehouse-select"
              >
                <option value="">Select destination...</option>
                {destinationWarehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Expected Date */}
          <div>
            <label
              htmlFor="expected-date"
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Expected Arrival Date
            </label>
            <input
              id="expected-date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Epic 7: Transfer Type */}
          <div>
            <label
              htmlFor="transfer-type"
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Transfer Type
            </label>
            <select
              id="transfer-type"
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="REGULAR">Regular - Normal inter-warehouse transfer</option>
              <option value="URGENT">Urgent - Priority handling & expedited processing</option>
              <option value="QUALITY_HOLD">Quality Hold - Stock quarantined pending inspection</option>
              <option value="REPAIR">Repair - Stock sent for repair/refurbishment</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {transferType === "URGENT" && "Priority handling with expedited processing"}
              {transferType === "QUALITY_HOLD" && "Stock quarantined pending quality inspection"}
              {transferType === "REPAIR" && "Stock sent for repair or refurbishment"}
              {transferType === "REGULAR" && "Standard inter-warehouse transfer"}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes about this transfer..."
            className={`w-full px-3 py-2 rounded-lg border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Items Card — Stock Picker */}
      <div
        className={`p-6 rounded-lg shadow mb-6 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {sourceWarehouseId ? `Stock in ${sourceWarehouseName}` : "Items to Transfer"}
          </h2>
          {selectedItems.length > 0 && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isDarkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
              }`}
            >
              {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>
        <hr className={`mb-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

        {/* State: No warehouse selected */}
        {!sourceWarehouseId && (
          <div
            className={`p-3 rounded-lg ${isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}
          >
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please select a source warehouse first to see available stock.
            </p>
          </div>
        )}

        {/* State: Loading */}
        {sourceWarehouseId && loadingStock && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Loading stock...</span>
          </div>
        )}

        {/* State: Error */}
        {sourceWarehouseId && !loadingStock && stockLoadError && (
          <div
            className={`p-3 rounded-lg ${isDarkMode ? "bg-red-900/30 border border-red-700" : "bg-red-50 border border-red-200"}`}
          >
            <p className="text-sm text-red-700 dark:text-red-300">{stockLoadError}</p>
          </div>
        )}

        {/* State: Empty warehouse */}
        {sourceWarehouseId && !loadingStock && !stockLoadError && warehouseStock.length === 0 && (
          <div
            className={`p-3 rounded-lg ${isDarkMode ? "bg-yellow-900/20 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"}`}
          >
            <p className="text-sm text-yellow-700 dark:text-yellow-300">No available stock in this warehouse.</p>
          </div>
        )}

        {/* State: Stock loaded */}
        {sourceWarehouseId && !loadingStock && !stockLoadError && warehouseStock.length > 0 && (
          <>
            {/* Search bar */}
            <div className="mb-3">
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search by product name or SKU..."
                className={`w-full max-w-sm px-3 py-2 text-sm rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Stock table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`${isDarkMode ? "bg-gray-900" : "bg-gray-50"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <th className="px-4 py-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleAll}
                        className="rounded"
                        aria-label="Select all visible items"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Available</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Transfer Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => {
                    const qty = Number(item.transferQty) || 0;
                    const isOverAvailable = item.transferQty !== "" && qty > item.quantityAvailable;
                    return (
                      <tr
                        key={item.productId}
                        className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${
                          item.selected ? (isDarkMode ? "bg-blue-900/20" : "bg-blue-50") : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleItem(item.productId)}
                            className="rounded"
                            aria-label={`Select ${item.productName}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.productSku || "\u2014"}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              isDarkMode
                                ? "bg-green-900/30 border border-green-700 text-green-300"
                                : "bg-green-100 border border-green-300 text-green-700"
                            }`}
                          >
                            {formatQuantity(item.quantityAvailable, item.unit)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={item.transferQty}
                            onChange={(e) => handleTransferQtyChange(item.productId, e.target.value)}
                            min="0"
                            step="any"
                            placeholder="0"
                            className={`w-28 px-3 py-2 text-sm rounded border text-right ${
                              isOverAvailable
                                ? "border-red-500 focus:ring-red-500"
                                : isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2`}
                            aria-label={`Transfer quantity for ${item.productName}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleItemNotes(item.productId, e.target.value)}
                            placeholder="Optional..."
                            className={`w-full px-3 py-2 text-sm rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            aria-label={`Notes for ${item.productName}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`px-4 py-2 rounded-lg font-medium ${
            isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || selectedItems.length === 0}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            saving || selectedItems.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Create Transfer
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TransferForm;
