/**
 * TransferForm Component
 * Phase 5: Inter-Warehouse Transfers
 *
 * Form for creating new stock transfers
 * Migrated from Material-UI to Tailwind CSS
 */

import { AlertTriangle, ArrowLeft, ArrowRight, ChevronDown, Loader2, Package, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { productService } from "../../services/dataService";
import { stockMovementService } from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";
import { validateSsotPattern } from "../../utils/productSsotValidation";

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = "KG") => {
  return `${parseFloat(qty || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

const TransferForm = ({ onCancel, onSuccess }) => {
  const { isDarkMode } = useTheme();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockLevels, setStockLevels] = useState({});
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [, setLoadingProducts] = useState(true);

  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [transferType, setTransferType] = useState("REGULAR"); // Epic 7: Transfer type

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

  // Epic 4: Batch allocation state
  const [, _setBatchesPerItem] = useState({}); // Map of itemId -> batches[]

  // Product autocomplete state
  const [activeItemId, setActiveItemId] = useState(null);
  const [productSearchTerms, setProductSearchTerms] = useState({});
  const [filteredProductsMap, setFilteredProductsMap] = useState({});
  const dropdownRefs = useRef({});

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

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const result = await productService.getProducts({ limit: 1000 });
        setProducts(result.data || []);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Load stock levels when source warehouse changes
  useEffect(() => {
    const loadStockLevels = async () => {
      if (!sourceWarehouseId) {
        setStockLevels({});
        return;
      }

      try {
        const result = await stockMovementService.getStockLevels({
          warehouseId: sourceWarehouseId,
          limit: 1000,
        });

        const levels = {};
        (result.data || []).forEach((item) => {
          levels[item.productId] = {
            quantityOnHand: parseFloat(item.quantityOnHand) || 0,
            quantityAvailable: parseFloat(item.quantityAvailable) || 0,
            unit: item.unit || "KG",
          };
        });
        setStockLevels(levels);
      } catch (err) {
        console.error("Error loading stock levels:", err);
      }
    };

    loadStockLevels();
  }, [sourceWarehouseId]);

  // Filter products for autocomplete
  useEffect(() => {
    const newFilteredMap = {};
    Object.keys(productSearchTerms).forEach((itemId) => {
      const search = productSearchTerms[itemId].toLowerCase();
      const selectedIds = items
        .filter((item) => item.id.toString() !== itemId && item.productId)
        .map((item) => item.productId);

      const filtered = products.filter((p) => {
        if (selectedIds.includes(p.id)) return false;
        if (!search) return true;
        return p.name?.toLowerCase().includes(search) || p.sku?.toLowerCase().includes(search);
      });
      newFilteredMap[itemId] = filtered;
    });
    setFilteredProductsMap(newFilteredMap);
  }, [productSearchTerms, products, items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeItemId) {
        const dropdownRef = dropdownRefs.current[activeItemId];
        if (dropdownRef && !dropdownRef.contains(event.target)) {
          setActiveItemId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeItemId]);

  // Add new item
  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      productId: "",
      product: null,
      quantity: "",
      unit: "KG",
      notes: "",
      batchId: "", // Epic 4: Batch allocation
    };
    setItems([...items, newItem]);
    setProductSearchTerms({ ...productSearchTerms, [newItem.id]: "" });
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
    const newSearchTerms = { ...productSearchTerms };
    delete newSearchTerms[itemId];
    setProductSearchTerms(newSearchTerms);
  };

  // Update item
  const handleItemChange = useCallback(
    (itemId, field, value) => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== itemId) return item;

          const updates = { [field]: value };

          // If product changed, update productId and unit
          if (field === "product" && value) {
            updates.productId = value.id;
            updates.unit = stockLevels[value.id]?.unit || "KG";
          }

          return { ...item, ...updates };
        })
      );
    },
    [stockLevels]
  );

  // Handle product select
  const handleProductSelect = useCallback(
    (itemId, product) => {
      const uniqueName = product.uniqueName || product.unique_name || product.name || "";

      // SSOT validation (Epic 5 - TRAN-002)
      const ssotValidation = validateSsotPattern(uniqueName);
      if (!ssotValidation.isValid) {
        setError(`Invalid product name: ${ssotValidation.error}\nPattern: ${ssotValidation.pattern}`);
        return;
      }

      handleItemChange(itemId, "product", product);
      setProductSearchTerms((prev) => ({
        ...prev,
        [itemId]: `${uniqueName} (${product.sku || "No SKU"})`,
      }));
      setActiveItemId(null);
      setError(null); // Clear any previous errors
    },
    [handleItemChange]
  );

  // Validate form - collects all errors for comprehensive feedback
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
    if (items.length === 0) {
      errors.push("Please add at least one item to transfer");
      invalid.add("items");
    }

    // Validate each item
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Please select a product`);
        invalid.add(`item-${index}-product`);
      }
      const qty = parseFloat(item.quantity) || 0;
      if (qty <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        invalid.add(`item-${index}-quantity`);
      }
      const available = stockLevels[item.productId]?.quantityAvailable || 0;
      if (qty > available && item.productId) {
        errors.push(
          `Item ${index + 1}: Insufficient stock for ${item.product?.name || "product"}. Available: ${formatQuantity(available, item.unit)}`
        );
        invalid.add(`item-${index}-quantity`);
      }
    });

    setValidationErrors(errors);
    setInvalidFields(invalid);

    if (errors.length > 0) {
      setError(errors[0]); // Keep first error for backward compatibility
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
        transferType, // Epic 7: Include transfer type
        transferStatus, // Epic 10: TRAN-003
        // Epic 10: TRAN-005 - Transporter details
        driverId: driverId || null,
        driverName: driverName || null,
        vehicleNumber: vehicleNumber || null,
        vehiclePlate: vehiclePlate || null,
        departureTime: departureTime || null,
        expectedArrivalTime: expectedArrivalTime || null,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          batchId: item.batchId ? parseInt(item.batchId, 10) : null, // Epic 4: Include batch ID
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
              {validationErrors.map((err, _idx) => (
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
              <option value="REGULAR">🟢 Regular - Normal inter-warehouse transfer</option>
              <option value="URGENT">🔴 Urgent - Priority handling & expedited processing</option>
              <option value="QUALITY_HOLD">🟡 Quality Hold - Stock quarantined pending inspection</option>
              <option value="REPAIR">⚪ Repair - Stock sent for repair/refurbishment</option>
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

      {/* Items Card */}
      <div
        className={`p-6 rounded-lg shadow mb-6 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Items to Transfer</h2>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!sourceWarehouseId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              !sourceWarehouseId ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        <hr className={`mb-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

        {!sourceWarehouseId ? (
          <div
            className={`p-3 rounded-lg ${
              isDarkMode ? "bg-blue-900 bg-opacity-20 border border-blue-700" : "bg-blue-50 border border-blue-200"
            }`}
          >
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please select a source warehouse first to add items.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div
            className={`p-3 rounded-lg ${
              isDarkMode ? "bg-blue-900 bg-opacity-20 border border-blue-700" : "bg-blue-50 border border-blue-200"
            }`}
          >
            <p className="text-sm text-blue-700 dark:text-blue-300">
              No items added. Click &quot;Add Item&quot; to add products to this transfer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    isDarkMode ? "bg-gray-900" : "bg-gray-50"
                  } border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                >
                  <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Available</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                  <th className="px-4 py-3 text-center text-sm font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const available = stockLevels[item.productId]?.quantityAvailable || 0;
                  const stockUnit = stockLevels[item.productId]?.unit || "KG";
                  const filteredProducts = filteredProductsMap[item.id] || [];

                  return (
                    <tr key={item.id} className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                      <td className="px-4 py-3" style={{ minWidth: "300px" }}>
                        <div
                          className="relative"
                          ref={(el) => {
                            if (el) dropdownRefs.current[item.id] = el;
                          }}
                        >
                          <input
                            type="text"
                            value={productSearchTerms[item.id] || ""}
                            onChange={(e) => {
                              setProductSearchTerms({
                                ...productSearchTerms,
                                [item.id]: e.target.value,
                              });
                              setActiveItemId(item.id);
                            }}
                            onFocus={() => setActiveItemId(item.id)}
                            placeholder="Select product..."
                            className={`w-full px-3 py-2 text-sm rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                          {activeItemId === item.id && filteredProducts.length > 0 && (
                            <div
                              className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg ${
                                isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                              }`}
                            >
                              {filteredProducts.slice(0, 20).map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleProductSelect(item.id, product)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-500 hover:text-white transition-colors ${
                                    item.productId === product.id
                                      ? "bg-blue-500 text-white"
                                      : isDarkMode
                                        ? "text-gray-200"
                                        : "text-gray-900"
                                  }`}
                                >
                                  <div className="font-medium">
                                    {product.uniqueName || product.unique_name || product.name}
                                  </div>
                                  <div className="text-xs opacity-75">{product.sku || "No SKU"}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.productId ? (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              available > 0
                                ? isDarkMode
                                  ? "bg-green-900 bg-opacity-30 border border-green-700 text-green-300"
                                  : "bg-green-100 border border-green-300 text-green-700"
                                : isDarkMode
                                  ? "bg-red-900 bg-opacity-30 border border-red-700 text-red-300"
                                  : "bg-red-100 border border-red-300 text-red-700"
                            }`}
                          >
                            {formatQuantity(available, stockUnit)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                          min="0"
                          step="0.01"
                          className={`w-28 px-3 py-2 text-sm rounded border text-right ${
                            item.productId && parseFloat(item.quantity) > available
                              ? "border-red-500 focus:ring-red-500"
                              : isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(item.id, "notes", e.target.value)}
                          placeholder="Optional..."
                          className={`w-full px-3 py-2 text-sm rounded border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
          disabled={saving || items.length === 0}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            saving || items.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
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
