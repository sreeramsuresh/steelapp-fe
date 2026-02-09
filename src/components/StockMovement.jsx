import {
  Plus as Add,
  AlertCircle,
  Trash2 as Delete,
  Edit,
  Filter,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { productService } from "../services/productService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { purchaseOrderSyncService } from "../services/purchaseOrderSyncService";
import { stockMovementService } from "../services/stockMovementService";
import { createStockMovement, FINISHES, MOVEMENT_TYPES, PRODUCT_TYPES, STEEL_GRADES } from "../types";
import { getProductDisplayName } from "../utils/fieldAccessors";
import ConfirmDialog from "./ConfirmDialog";

const StockMovement = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(createStockMovement());

  // Product catalog search state
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [_productSearching, setProductSearching] = useState(false);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch regular stock movements
      const response = await stockMovementService.getAllMovements();
      const stockMovements = response.data || [];

      // Fetch all purchase orders and filter for in-transit ones
      const poResponse = await purchaseOrderService.getAll();
      let allPOs = [];

      // Handle different response formats
      if (Array.isArray(poResponse)) {
        allPOs = poResponse;
      } else if (poResponse.data && Array.isArray(poResponse.data)) {
        allPOs = poResponse.data;
      } else if (poResponse.purchaseOrders && Array.isArray(poResponse.purchaseOrders)) {
        allPOs = poResponse.purchaseOrders;
      }
      // Filter for in-transit purchase orders.
      // Backend doesn't expose transit_status; use stock_status === 'transit'
      // and exclude ones already received/cancelled.
      allPOs.filter((po) => po.stockStatus === "transit" && po.status !== "received" && po.status !== "cancelled");
      // Use the sync service to generate transit movements
      const inTransitMovements = purchaseOrderSyncService.generateTransitStockMovements(allPOs);
      // Build a quick map of PO number -> status/stock_status for filtering
      const poMap = new Map();
      for (const po of allPOs) {
        if (po.poNumber)
          poMap.set(String(po.poNumber), {
            status: po.status,
            stock_status: po.stockStatus,
          });
      }

      // Combine both movements and filter inconsistencies:
      // - Hide IN movements that reference a PO still in transit (not received)
      // - Hide virtual transit OUT if the PO is no longer transit
      const combined = [...stockMovements, ...inTransitMovements].filter((m) => {
        const key = m.invoiceNo ? String(m.invoiceNo) : "";
        const poInfo = poMap.get(key);
        if (poInfo) {
          if (m.movement === "IN" && poInfo.stockStatus === "transit" && poInfo.status !== "received") {
            return false;
          }
          if (m.isTransit && poInfo.stockStatus !== "transit") {
            return false;
          }
        }
        return true;
      });

      setMovements(combined);
    } catch (_fetchError) {
      setError("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleOpenDialog = (movement = null) => {
    if (movement) {
      setEditingMovement(movement);
      setFormData(movement);
    } else {
      setEditingMovement(null);
      setFormData(createStockMovement());
    }
    setProductQuery("");
    setProductOptions([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMovement(null);
    setFormData(createStockMovement());
    setProductQuery("");
    setProductOptions([]);
    setError("");
  };

  const handleSubmit = async () => {
    try {
      const movementData = {
        ...formData,
        quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
        currentStock: formData.currentStock === "" ? 0 : Number(formData.currentStock),
      };

      if (editingMovement) {
        await stockMovementService.updateMovement(editingMovement.id, movementData);
      } else {
        await stockMovementService.createMovement(movementData);
      }
      await fetchMovements();
      handleCloseDialog();
    } catch (_saveError) {
      setError("Failed to save stock movement");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete Stock Movement?",
      message: "Are you sure you want to delete this stock movement? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await stockMovementService.deleteMovement(id);
      await fetchMovements();
    } catch (_deleteError) {
      setError("Failed to delete stock movement");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Product catalog search with debounce
  useEffect(() => {
    if (!openDialog) return;
    if (!productQuery || productQuery.trim().length < 2) {
      setProductOptions([]);
      return;
    }
    setProductSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await productService.searchProducts(productQuery, {
          limit: 10,
        });
        const rows = res?.data || res?.products || res || [];
        setProductOptions(rows);
      } catch (_e) {
        setProductOptions([]);
      } finally {
        setProductSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery, openDialog]);

  // Handle product selection from catalog - auto-populate fields
  const handleSelectProduct = (product) => {
    if (!product) return;

    // Helper to extract thickness from product
    const getThickness = (p) => {
      if (p.thickness) return p.thickness;
      if (p.specifications?.thickness) return p.specifications.thickness;
      return "";
    };

    // Map product fields to stock movement form
    setFormData((prev) => ({
      ...prev,
      productId: product.id,
      // Use displayName for user-facing display
      productName: getProductDisplayName(product) || "N/A",
      // Product type from category
      productType: product.category || product.productType || prev.productType,
      // Steel specifications
      grade: product.grade || product.steelGrade || prev.grade,
      finish: product.finish || product.surfaceFinish || prev.finish,
      size: product.size || product.dimensions || prev.size,
      thickness: getThickness(product) || prev.thickness,
      // Additional pipe/tube fields
      sizeInch: product.sizeInch || product.size_inch || "",
      od: product.od || "",
      length: product.length || "",
      // Commodity
      commodity: product.commodity || "SS",
      // Origin
      origin: product.origin || "",
      // Unit of Measure fields (added 2025-12-09)
      primaryUom: product.primaryUom || product.primary_uom || "PCS",
      unitWeightKg: product.unitWeightKg || product.unit_weight_kg || null,
      allowDecimalQuantity: product.allowDecimalQuantity ?? product.allow_decimal_quantity ?? false,
    }));
    setProductQuery("");
    setProductOptions([]);
  };

  // Clear linked product
  const clearLinkedProduct = () => {
    setFormData((prev) => ({ ...prev, productId: null, productName: "" }));
  };

  const filteredMovements = movements.filter((movement) =>
    Object.values(movement).some((value) => value?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AE");
  };

  if (loading) {
    return (
      <div
        className={`p-6 min-h-[calc(100vh-64px)] w-full overflow-auto ${
          isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
        } md:p-4 sm:p-3`}
      >
        <div className="flex items-center justify-center min-h-96 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading stock movements...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 min-h-[calc(100vh-64px)] w-full overflow-auto ${
        isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
      } md:p-4 sm:p-3`}
    >
      <div className={`mb-6 pb-4 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
        <h1 className={`text-3xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          📦 Stock Movements
        </h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Track all incoming and outgoing stock movements
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <div
            className={`p-4 rounded-lg border shadow-lg flex items-center gap-2 ${
              isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <AlertCircle size={20} />
            <span className="flex-grow">{error}</span>
            <button type="button" onClick={() => setError("")} className="ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div
        className={`mb-6 border rounded-xl ${
          isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
        }`}
      >
        <div className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
              </div>
              <input
                type="text"
                placeholder="Search movements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            {/* eslint-disable-next-line local-rules/no-dead-button */}
            <button
              type="button"
              onClick={() => {
                // TODO: Implement filter functionality
              }}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                isDarkMode
                  ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Filter size={16} />
              Filter
            </button>
            <button
              type="button"
              onClick={() => handleOpenDialog()}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md font-semibold"
            >
              <Add size={16} />
              Add Movement
            </button>
          </div>
        </div>
      </div>

      <div
        className={`border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md ${
          isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Date
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Movement
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Product Type
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Grade
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Thickness
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Size
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Finish
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Invoice No
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Qty
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Current Stock
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Seller
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredMovements.map((movement) => (
                <tr
                  key={movement.id}
                  className={`transition-colors ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {formatDate(movement.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full min-w-16 ${
                        movement.movement === "IN"
                          ? isDarkMode
                            ? "bg-green-900/30 text-green-300"
                            : "bg-green-100 text-green-800"
                          : isDarkMode
                            ? "bg-red-900/30 text-red-300"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {movement.movement === "IN" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {movement.movement}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {movement.productType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${
                        isDarkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {movement.grade}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {movement.thickness}
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {movement.size}
                  </td>
                  <td className="px-4 py-3">
                    {movement.finish && (
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded border ${
                          isDarkMode ? "border-purple-600 text-purple-300" : "border-purple-300 text-purple-700"
                        }`}
                      >
                        {movement.finish}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {movement.invoiceNo && (
                      <span
                        className={`text-xs font-mono px-2 py-1 rounded inline-block ${
                          isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {movement.invoiceNo}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-semibold ${
                        movement.quantity < 0
                          ? isDarkMode
                            ? "text-yellow-400"
                            : "text-yellow-600"
                          : isDarkMode
                            ? "text-white"
                            : "text-gray-900"
                      }`}
                    >
                      {movement.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {movement.currentStock}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {movement.seller}
                  </td>
                  <td className="px-4 py-3">
                    {movement.isTransit ? (
                      <span className={`text-xs italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        In Transit
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDialog(movement)}
                          className={`p-2 rounded transition-colors ${
                            isDarkMode ? "hover:bg-teal-900/30 text-teal-400" : "hover:bg-teal-100 text-teal-600"
                          }`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(movement.id)}
                          className={`p-2 rounded transition-colors ${
                            isDarkMode ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-100 text-red-600"
                          }`}
                        >
                          <Delete size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center">
                    <div className={`p-12 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <div
                        className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                          isDarkMode ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Package size={32} />
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        No stock movements found
                      </h3>
                      <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {searchTerm ? "Try adjusting your search term" : "Add your first stock movement to get started"}
                      </p>
                      {!searchTerm && (
                        <button
                          type="button"
                          onClick={() => handleOpenDialog()}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 mx-auto"
                        >
                          <Add size={16} />
                          Add Movement
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {openDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <button
              type="button"
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={handleCloseDialog}
              onKeyDown={(e) => e.key === "Enter" && handleCloseDialog()}
            />
            <div
              className={`relative max-w-2xl w-full rounded-2xl shadow-xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}
            >
              <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {editingMovement ? "Edit Stock Movement" : "Add Stock Movement"}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Catalog Search - spans full width */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="product-catalog"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Product (from Catalog)
                    </label>
                    {formData.productId ? (
                      <div
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`}
                      >
                        <div>
                          <div className="font-medium text-teal-500">{formData.productName}</div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Linked to catalog
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearLinkedProduct}
                          className={`px-3 py-1 rounded border ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}`}
                        >
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="product-catalog"
                          type="text"
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Search and select a product to auto-fill fields..."
                          className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            isDarkMode
                              ? "bg-[#121418] border-[#37474F] text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                        />
                        {_productSearching && (
                          <div
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Searching...
                          </div>
                        )}
                        {productOptions.length > 0 && (
                          <div
                            className={`absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border shadow ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
                          >
                            {productOptions.map((p) => (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                className={`w-full text-left px-3 py-2 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                              >
                                <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {getProductDisplayName(p)}
                                </div>
                                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {p.origin ? `${p.origin} | ` : ""}
                                  {p.category} {p.grade ? `| ${p.grade}` : ""} {p.size ? `| ${p.size}` : ""}{" "}
                                  {p.thickness ? `| ${p.thickness}mm` : ""}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Selecting a product will auto-fill grade, finish, size, and thickness fields
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="date"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="movement-type"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Movement Type
                    </label>
                    <select
                      id="movement-type"
                      value={formData.movement}
                      onChange={(e) => handleInputChange("movement", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      {MOVEMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="product-type"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Product Type
                    </label>
                    <select
                      id="product-type"
                      value={formData.productType}
                      onChange={(e) => handleInputChange("productType", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="grade"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Grade
                    </label>
                    <select
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => handleInputChange("grade", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      {STEEL_GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="thickness"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Thickness
                    </label>
                    <input
                      id="thickness"
                      type="text"
                      value={formData.thickness}
                      onChange={(e) => handleInputChange("thickness", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="size"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Size
                    </label>
                    <input
                      id="size"
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleInputChange("size", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="finish"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Finish
                    </label>
                    <select
                      id="finish"
                      value={formData.finish}
                      onChange={(e) => handleInputChange("finish", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      {FINISHES.map((finish) => (
                        <option key={finish} value={finish}>
                          {finish}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="invoice-no"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Invoice No
                    </label>
                    <input
                      id="invoice-no"
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quantity"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Quantity {formData.primaryUom ? `(${formData.primaryUom})` : ""}
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      step={formData.allowDecimalQuantity ? "0.001" : "1"}
                      value={formData.quantity || ""}
                      onChange={(e) => {
                        let value = e.target.value === "" ? "" : parseFloat(e.target.value);
                        // For piece-based products, enforce whole numbers
                        if (value !== "" && !formData.allowDecimalQuantity && !Number.isInteger(value)) {
                          value = Math.round(value);
                        }
                        handleInputChange("quantity", value || "");
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                    {formData.primaryUom === "PCS" && formData.unitWeightKg && formData.quantity && (
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                        Total weight: {(formData.unitWeightKg * formData.quantity).toFixed(2)} kg
                      </p>
                    )}
                    {!formData.allowDecimalQuantity && (
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Whole numbers only (piece-based product)
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="current-stock"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Current Stock
                    </label>
                    <input
                      id="current-stock"
                      type="number"
                      value={formData.currentStock || ""}
                      onChange={(e) =>
                        handleInputChange("currentStock", e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="seller"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Seller
                    </label>
                    <input
                      id="seller"
                      type="text"
                      value={formData.seller}
                      onChange={(e) => handleInputChange("seller", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? "bg-[#121418] border-[#37474F] text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div
                className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
              >
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className={`px-4 py-2 border rounded-lg transition-colors font-medium ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 font-semibold"
                >
                  {editingMovement ? "Update Movement" : "Add Movement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default StockMovement;
