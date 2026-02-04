/**
 * QCInspectionModal - Quality Control inspection form
 *
 * Allows entering QC results for each item in a credit note.
 * Submits to backend which handles inventory restock and scrap creation.
 */

import { ClipboardCheck, Loader2, Package, Warehouse, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { creditNoteService } from "../../services/creditNoteService";
import { notificationService } from "../../services/notificationService";
import { warehouseService } from "../../services/warehouseService";

const QC_RESULTS = [
  {
    value: "GOOD",
    label: "Good - All items can be restocked",
    color: "text-green-600",
  },
  {
    value: "BAD",
    label: "Bad - All items defective/damaged",
    color: "text-red-600",
  },
  {
    value: "PARTIAL",
    label: "Partial - Some good, some bad",
    color: "text-yellow-600",
  },
];

const SCRAP_REASON_CATEGORIES = [
  { value: "MANUFACTURING_DEFECT", label: "Manufacturing Defect" },
  { value: "SHIPPING_DAMAGE", label: "Shipping Damage" },
  { value: "CUSTOMER_DAMAGE", label: "Customer Damage" },
  { value: "QUALITY_ISSUE", label: "Quality Issue" },
  { value: "EXPIRED", label: "Expired" },
  { value: "OTHER", label: "Other" },
];

const QCInspectionModal = ({ isOpen, onClose, creditNote, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [qcResult, setQcResult] = useState("GOOD");
  const [qcNotes, setQcNotes] = useState("");
  const [itemResults, setItemResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullCreditNote, setFullCreditNote] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQcResult("GOOD");
      setQcNotes("");
      setItemResults([]);
      setFullCreditNote(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Fetch warehouses when modal opens
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!isOpen) return;

      try {
        setWarehousesLoading(true);
        const response = await warehouseService.getAll({ isActive: true });
        setWarehouses(response.data || response.warehouses || response || []);
      } catch (error) {
        console.error("Failed to fetch warehouses:", error);
        // Don't block - user can still proceed without warehouse selection
      } finally {
        setWarehousesLoading(false);
      }
    };

    fetchWarehouses();
  }, [isOpen]);

  // Fetch full credit note with items when modal opens
  useEffect(() => {
    const fetchCreditNote = async () => {
      if (!isOpen || !creditNote?.id) return;

      // If creditNote already has items, use it directly
      if (creditNote.items && creditNote.items.length > 0) {
        setFullCreditNote(creditNote);
        return;
      }

      // Otherwise, fetch the full credit note
      try {
        setLoading(true);
        const fetched = await creditNoteService.getCreditNote(creditNote.id);
        setFullCreditNote(fetched);
      } catch (error) {
        console.error("Failed to fetch credit note:", error);
        notificationService.error("Failed to load credit note items");
      } finally {
        setLoading(false);
      }
    };

    fetchCreditNote();
  }, [isOpen, creditNote]);

  // Initialize item results when fullCreditNote changes
  useEffect(() => {
    if (fullCreditNote?.items && warehouses.length > 0) {
      // Default to first warehouse if available
      const defaultWarehouseId = warehouses[0]?.id || 0;

      setItemResults(
        fullCreditNote.items.map((item) => ({
          id: item.id,
          creditNoteItemId: item.id,
          productName: item.productName || item.product_name || "",
          quantityReturned: item.quantityReturned || item.quantity_returned || 0,
          restockedQuantity: item.quantityReturned || item.quantity_returned || 0,
          damagedQuantity: 0,
          defectiveQuantity: 0,
          inspectionNotes: "",
          warehouseId: item.warehouseId || item.warehouse_id || defaultWarehouseId,
          scrapReasonCategory: "OTHER",
          scrapReason: "",
        }))
      );
    } else if (fullCreditNote?.items) {
      // Warehouses not loaded yet, initialize without default
      setItemResults(
        fullCreditNote.items.map((item) => ({
          id: item.id,
          creditNoteItemId: item.id,
          productName: item.productName || item.product_name || "",
          quantityReturned: item.quantityReturned || item.quantity_returned || 0,
          restockedQuantity: item.quantityReturned || item.quantity_returned || 0,
          damagedQuantity: 0,
          defectiveQuantity: 0,
          inspectionNotes: "",
          warehouseId: item.warehouseId || item.warehouse_id || 0,
          scrapReasonCategory: "OTHER",
          scrapReason: "",
        }))
      );
    }
  }, [fullCreditNote, warehouses]);

  const handleItemChange = (index, field, value) => {
    setItemResults((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-adjust quantities
      const item = updated[index];
      const total = item.quantityReturned;
      if (field === "restockedQuantity") {
        const remaining = total - parseFloat(value || 0);
        updated[index].damagedQuantity = Math.max(0, remaining);
        updated[index].defectiveQuantity = 0;
      }

      return updated;
    });
  };

  const validateForm = () => {
    // Check if any item with restocked quantity > 0 is missing warehouse
    const itemsMissingWarehouse = itemResults.filter(
      (item) => parseFloat(item.restockedQuantity) > 0 && !item.warehouseId
    );

    if (itemsMissingWarehouse.length > 0) {
      notificationService.error("Please select a warehouse for all items being restocked");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const result = await creditNoteService.markItemsInspected(creditNote.id, {
        qcResult,
        qcNotes,
        itemResults: itemResults.map((item) => ({
          creditNoteItemId: item.creditNoteItemId,
          restockedQuantity: parseFloat(item.restockedQuantity) || 0,
          damagedQuantity: parseFloat(item.damagedQuantity) || 0,
          defectiveQuantity: parseFloat(item.defectiveQuantity) || 0,
          inspectionNotes: item.inspectionNotes,
          warehouseId: parseInt(item.warehouseId, 10) || 0,
          scrapReasonCategory: item.scrapReasonCategory,
          scrapReason: item.scrapReason,
        })),
      });

      notificationService.success("Items inspected successfully");
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (error) {
      console.error("Failed to submit inspection:", error);
      notificationService.error(error.message || "Failed to submit inspection");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = loading || warehousesLoading;
  const canSubmit = !isLoading && itemResults.length > 0 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`max-w-4xl w-full mx-4 rounded-lg shadow-xl max-h-[90vh] overflow-hidden ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">QC Inspection</h2>
          </div>
          <button type="button" onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className={`ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading items...</span>
            </div>
          )}

          {/* No Items Warning */}
          {!isLoading && itemResults.length === 0 && (
            <div className={`text-center py-8 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No items found for inspection.</p>
              <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                This credit note may not have any items to inspect.
              </p>
            </div>
          )}

          {/* Overall QC Result */}
          {!isLoading && itemResults.length > 0 && (
            <>
              <div className="mb-6">
                <span className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Overall QC Result
                </span>
                <div className="flex gap-4 flex-wrap">
                  {QC_RESULTS.map((result) => (
                    <label key={result.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="qcResult"
                        value={result.value}
                        checked={qcResult === result.value}
                        onChange={(e) => setQcResult(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className={`text-sm ${result.color}`}>{result.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* QC Notes */}
              <div className="mb-6">
                <label
                  htmlFor="qc-notes"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                >
                  QC Notes
                </label>
                <textarea
                  id="qc-notes"
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="General inspection notes..."
                />
              </div>

              {/* Item Results */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Item Inspection
                </h3>

                {itemResults.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                  >
                    <div className="font-medium mb-3">{item.productName}</div>
                    <div className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Returned Qty: {item.quantityReturned}
                    </div>

                    {/* Warehouse Selection - CRITICAL for stock restock */}
                    <div className="mb-4">
                      <label
                        htmlFor={`warehouse-${item.id}`}
                        className={`block text-xs mb-1 flex items-center gap-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Warehouse className="w-3 h-3" />
                        Restock to Warehouse <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`warehouse-${item.id}`}
                        value={item.warehouseId || ""}
                        onChange={(e) => handleItemChange(index, "warehouseId", parseInt(e.target.value, 10) || 0)}
                        className={`w-full px-2 py-1 border rounded text-sm ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } ${
                          parseFloat(item.restockedQuantity) > 0 && !item.warehouseId
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      >
                        <option value="">-- Select Warehouse --</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name}
                          </option>
                        ))}
                      </select>
                      {parseFloat(item.restockedQuantity) > 0 && !item.warehouseId && (
                        <p className="text-xs text-red-500 mt-1">Warehouse required for restocking</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label
                          htmlFor={`restock-${item.id}`}
                          className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Restock Qty
                        </label>
                        <input
                          id={`restock-${item.id}`}
                          type="number"
                          min="0"
                          max={item.quantityReturned}
                          value={item.restockedQuantity}
                          onChange={(e) => handleItemChange(index, "restockedQuantity", e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`damaged-${item.id}`}
                          className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Damaged Qty
                        </label>
                        <input
                          id={`damaged-${item.id}`}
                          type="number"
                          min="0"
                          value={item.damagedQuantity}
                          onChange={(e) => handleItemChange(index, "damagedQuantity", e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`defective-${item.id}`}
                          className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Defective Qty
                        </label>
                        <input
                          id={`defective-${item.id}`}
                          type="number"
                          min="0"
                          value={item.defectiveQuantity}
                          onChange={(e) => handleItemChange(index, "defectiveQuantity", e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>

                    {(parseFloat(item.damagedQuantity) > 0 || parseFloat(item.defectiveQuantity) > 0) && (
                      <div
                        className={`grid grid-cols-2 gap-4 mt-3 p-3 rounded ${
                          isDarkMode ? "bg-red-900/20" : "bg-red-50"
                        }`}
                      >
                        <div>
                          <label
                            htmlFor={`scrap-category-${item.id}`}
                            className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Scrap Reason Category
                          </label>
                          <select
                            id={`scrap-category-${item.id}`}
                            value={item.scrapReasonCategory}
                            onChange={(e) => handleItemChange(index, "scrapReasonCategory", e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          >
                            {SCRAP_REASON_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`scrap-reason-${item.id}`}
                            className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Scrap Reason
                          </label>
                          <input
                            id={`scrap-reason-${item.id}`}
                            type="text"
                            value={item.scrapReason}
                            onChange={(e) => handleItemChange(index, "scrapReason", e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                            placeholder="Details..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <button type="button" onClick={onClose}
            disabled={submitting}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Complete Inspection
          </button>
        </div>
      </div>
    </div>
  );
};

export default QCInspectionModal;
