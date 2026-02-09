/**
 * Stock Movement Form
 * Phase 2: Create/View Stock Movement
 *
 * Form for creating manual stock movements
 * View-only mode for existing movements (movements are immutable)
 *
 * UX Patterns (Tier 2 - Medium):
 * - Sticky header with blur backdrop
 * - Two-column layout (8+4 split)
 * - Sticky sidebar summary
 * - Accordion for optional sections
 */

import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Loader2,
  Package,
  RefreshCw,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormSelect } from "../../components/ui/form-select";
import { SelectItem } from "../../components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";
import { productService } from "../../services/dataService";
import { notificationService } from "../../services/notificationService";
import {
  MOVEMENT_TYPES,
  parseGrpcError,
  REFERENCE_TYPES,
  stockMovementService,
} from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";
import { getProductDisplayName } from "../../utils/fieldAccessors";

// Available units
const UNITS = ["KG", "MT", "PCS", "SHEETS", "COILS", "BUNDLES", "METERS"];

// Allowed movement types for manual creation
const MANUAL_MOVEMENT_TYPES = {
  IN: MOVEMENT_TYPES.IN,
  OUT: MOVEMENT_TYPES.OUT,
  ADJUSTMENT: MOVEMENT_TYPES.ADJUSTMENT,
};

const StockMovementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    productId: "",
    warehouseId: "",
    movementType: "IN",
    quantity: "",
    unit: "KG",
    referenceType: "ADJUSTMENT",
    referenceNumber: "",
    notes: "",
    movementDate: new Date().toISOString().slice(0, 10),
    unitCost: "",
    // PCS-centric pricing fields (Phase 7)
    pricePerKg: "", // User input: purchase price in AED/KG
    weightPerPieceKg: "", // User input: weight per piece in KG
    batchNumber: "",
    coilNumber: "",
    heatNumber: "",
  });

  // Data state
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingMovement, setExistingMovement] = useState(null);

  // Product autocomplete
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ===================== THEME CLASSES =====================
  const cardBg = isDarkMode ? "bg-[#141a20]" : "bg-white";
  const cardBorder = isDarkMode ? "border-[#2a3640]" : "border-gray-200";
  const inputBg = isDarkMode ? "bg-[#0f151b]" : "bg-white";
  const inputBorder = isDarkMode ? "border-[#2a3640]" : "border-gray-300";
  const textPrimary = isDarkMode ? "text-[#e6edf3]" : "text-gray-900";
  const textMuted = isDarkMode ? "text-[#93a4b4]" : "text-gray-500";
  const accordionBg = isDarkMode ? "bg-[#0f151b]" : "bg-gray-50";
  const inputFocus = "focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20";
  const placeholderCls = isDarkMode ? "placeholder:text-[#93a4b4]" : "placeholder:text-gray-500";

  // Fetch products and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          productService.getProducts({ limit: 500 }),
          warehouseService.getAll({ limit: 100 }),
        ]);
        setProducts(productsRes?.data || productsRes || []);
        setWarehouses(warehousesRes?.data || warehousesRes || []);
      } catch (_err) {
        notificationService.error("Failed to load products or warehouses");
      }
    };
    fetchData();
  }, []);

  // Fetch existing movement if editing
  useEffect(() => {
    if (id) {
      const fetchMovement = async () => {
        setLoading(true);
        try {
          const movement = await stockMovementService.getById(id);
          setExistingMovement(movement);
          setFormData({
            productId: movement.productId?.toString() || "",
            warehouseId: movement.warehouseId?.toString() || "",
            movementType: movement.movementType || "IN",
            quantity: movement.quantity?.toString() || "",
            unit: movement.unit || "KG",
            referenceType: movement.referenceType || "ADJUSTMENT",
            referenceNumber: movement.referenceNumber || "",
            notes: movement.notes || "",
            movementDate: movement.movementDate?.slice(0, 10) || "",
            unitCost: movement.unitCost?.toString() || "",
            batchNumber: movement.batchNumber || "",
            coilNumber: movement.coilNumber || "",
            heatNumber: movement.heatNumber || "",
          });
        } catch (_err) {
          notificationService.error("Failed to load stock movement");
          navigate("/app/inventory/stock-movements");
        } finally {
          setLoading(false);
        }
      };
      fetchMovement();
    }
  }, [id, navigate]);

  // Product search with debounce
  useEffect(() => {
    if (!productQuery || productQuery.trim().length < 2) {
      setProductOptions([]);
      return;
    }
    setProductSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = productService.searchProducts
          ? await productService.searchProducts(productQuery, { limit: 10 })
          : await productService.getProducts({
              search: productQuery,
              limit: 10,
            });
        setProductOptions(res?.data || res?.products || res || []);
      } catch {
        setProductOptions([]);
      } finally {
        setProductSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  // PCS-Centric: Auto-calculate unit cost (per piece) from price/kg × weight/piece
  useEffect(() => {
    const priceKg = parseFloat(formData.pricePerKg);
    const weightPiece = parseFloat(formData.weightPerPieceKg);
    if (priceKg > 0 && weightPiece > 0) {
      const costPerPiece = (priceKg * weightPiece).toFixed(2);
      setFormData((prev) => ({ ...prev, unitCost: costPerPiece }));
    }
  }, [formData.pricePerKg, formData.weightPerPieceKg]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectProduct = (product) => {
    if (!product) return;
    setSelectedProduct(product);
    setFormData((prev) => ({ ...prev, productId: product.id }));
    setProductQuery("");
    setProductOptions([]);
    if (errors.productId) {
      setErrors((prev) => ({ ...prev, productId: null }));
    }
  };

  const clearLinkedProduct = () => {
    setSelectedProduct(null);
    setFormData((prev) => ({ ...prev, productId: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.productId) newErrors.productId = "Product is required";
    if (!formData.warehouseId) newErrors.warehouseId = "Warehouse is required";
    if (!formData.movementType) newErrors.movementType = "Movement type is required";
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.unit) newErrors.unit = "Unit is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      notificationService.error("Please fix the validation errors");
      return;
    }

    setSaving(true);
    try {
      const movementData = {
        productId: parseInt(formData.productId, 10),
        warehouseId: parseInt(formData.warehouseId, 10),
        movementType: formData.movementType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        referenceType: formData.referenceType,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
        movementDate: formData.movementDate || undefined,
        // PCS-Centric: unitCost is cost per PIECE (auto-calculated or direct input)
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
        // Weight per piece for derivation (saved to batch for future reference)
        weightPerPieceKg: formData.weightPerPieceKg ? parseFloat(formData.weightPerPieceKg) : undefined,
        batchNumber: formData.batchNumber || undefined,
        coilNumber: formData.coilNumber || undefined,
        heatNumber: formData.heatNumber || undefined,
      };

      await stockMovementService.create(movementData);
      notificationService.success("Stock movement created successfully");
      navigate("/app/inventory/stock-movements");
    } catch (err) {
      const parsedError = parseGrpcError(err);
      if (parsedError.code === "FAILED_PRECONDITION") {
        notificationService.error(`${parsedError.message}. ${parsedError.originalMessage}`);
      } else if (parsedError.code === "INVALID_ARGUMENT") {
        notificationService.error(`Validation error: ${parsedError.originalMessage}`);
      } else {
        notificationService.error(parsedError.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Movement type icon helper
  const getMovementIcon = () => {
    switch (formData.movementType) {
      case "IN":
        return <ArrowDownRight className="h-5 w-5 text-green-500" />;
      case "OUT":
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-[#0b0f14]" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4aa3ff] mx-auto mb-3"></div>
          <p className={textMuted}>Loading stock movement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? "bg-[#0b0f14]" : "bg-gray-50"}`}>
      {/* App Container */}
      <div className="max-w-6xl mx-auto p-4">
        <div className={`${cardBg} border ${cardBorder} rounded-[18px] overflow-hidden`}>
          {/* Sticky Header */}
          <div
            className={`sticky top-0 z-10 backdrop-blur-md ${
              isDarkMode ? "bg-[#0f151b]/94 border-b border-[#2a3640]" : "bg-white/94 border-b border-gray-200"
            } px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/app/inventory/stock-movements")}
                  className={`p-2 rounded-xl transition-colors ${
                    isDarkMode ? "hover:bg-[#141a20] text-[#93a4b4]" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className={`text-lg font-extrabold ${textPrimary}`}>
                    {isEditing ? "View Stock Movement" : "New Stock Movement"}
                  </h1>
                  <p className={`text-xs ${textMuted}`}>
                    {isEditing ? "Movements are immutable for audit" : "Manual stock adjustment"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {formData.movementType && (
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border ${
                      formData.movementType === "IN"
                        ? isDarkMode
                          ? "border-green-500/30 bg-green-500/12 text-green-400"
                          : "border-green-200 bg-green-50 text-green-700"
                        : formData.movementType === "OUT"
                          ? isDarkMode
                            ? "border-red-500/30 bg-red-500/12 text-red-400"
                            : "border-red-200 bg-red-50 text-red-700"
                          : isDarkMode
                            ? "border-amber-500/30 bg-amber-500/12 text-amber-400"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {getMovementIcon()}
                    {MOVEMENT_TYPES[formData.movementType]?.label || formData.movementType}
                  </span>
                )}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                      isDarkMode
                        ? "bg-[#4aa3ff] text-[#001018] hover:bg-[#5bb2ff]"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Create"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-12 gap-3 p-4">
              {/* LEFT COLUMN: Main Form */}
              <div className="col-span-12 lg:col-span-8 space-y-3">
                {/* Section 1: Product & Warehouse */}
                <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                  <div className="mb-3">
                    <div className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}>
                      <Package className="h-4 w-4" />
                      Product & Location
                    </div>
                    <div className={`text-xs ${textMuted}`}>Select product and warehouse</div>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {/* Product */}
                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="product-select" className={`block text-xs ${textMuted} mb-1.5`}>
                        Product <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <FormSelect
                          id="product-select"
                          value={formData.productId || "none"}
                          onValueChange={() => {}}
                          disabled={true}
                          showValidation={false}
                          placeholder="Select product..."
                        >
                          <SelectItem value="none">Select product...</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {getProductDisplayName(p)}
                            </SelectItem>
                          ))}
                        </FormSelect>
                      ) : selectedProduct || formData.productId ? (
                        <div
                          className={`flex items-center justify-between py-2.5 px-3 rounded-xl border ${
                            isDarkMode ? "bg-[#4aa3ff]/10 border-[#4aa3ff]/35" : "bg-teal-50 border-teal-300"
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-medium ${isDarkMode ? "text-[#4aa3ff]" : "text-teal-700"}`}>
                              {selectedProduct?.displayName ||
                                selectedProduct?.name ||
                                products.find((p) => p.id.toString() === formData.productId.toString())?.name ||
                                "Selected"}
                            </div>
                            {selectedProduct?.category && (
                              <div className={`text-xs ${textMuted}`}>
                                {selectedProduct.origin && `${selectedProduct.origin} | `}
                                {selectedProduct.category}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={clearLinkedProduct}
                            className={`px-2.5 py-1 text-xs rounded-xl border ${
                              isDarkMode
                                ? "border-[#2a3640] bg-[#0f151b] hover:border-[#4aa3ff]"
                                : "border-gray-300 bg-white hover:border-teal-500"
                            }`}
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={productQuery}
                            onChange={(e) => setProductQuery(e.target.value)}
                            placeholder="Search product..."
                            className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${
                              errors.productId ? "border-red-500" : inputBorder
                            } ${textPrimary} outline-none ${inputFocus}`}
                          />
                          {productSearching && (
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}>
                              Searching...
                            </div>
                          )}
                          {productOptions.length > 0 && (
                            <div
                              className={`absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-xl border shadow-lg ${cardBg} ${cardBorder}`}
                            >
                              {productOptions.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleSelectProduct(p)}
                                  className={`w-full text-left px-3 py-2.5 transition-colors border-b last:border-b-0 ${cardBorder} ${
                                    isDarkMode ? "hover:bg-[#1a2027]" : "hover:bg-gray-50"
                                  }`}
                                >
                                  <div className={`text-sm font-medium ${textPrimary}`}>{getProductDisplayName(p)}</div>
                                  <div className={`text-xs ${textMuted}`}>
                                    {p.origin && `${p.origin} | `}
                                    {p.category} {p.grade && `| ${p.grade}`}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {errors.productId && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.productId}
                        </p>
                      )}
                    </div>

                    {/* Warehouse */}
                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="stock-warehouse" className={`block text-xs ${textMuted} mb-1.5`}>
                        Warehouse <span className="text-red-500">*</span>
                      </label>
                      <FormSelect
                        id="stock-warehouse"
                        value={formData.warehouseId || "none"}
                        onValueChange={(value) => handleChange("warehouseId", value === "none" ? "" : value)}
                        disabled={isEditing}
                        validationState={errors.warehouseId ? "invalid" : null}
                        showValidation={true}
                        placeholder="Select warehouse..."
                      >
                        <SelectItem value="none">Select warehouse...</SelectItem>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name} {w.code && `(${w.code})`}
                          </SelectItem>
                        ))}
                      </FormSelect>
                      {errors.warehouseId && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.warehouseId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Movement Details */}
                <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                  <div className="mb-3">
                    <div className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}>
                      <RefreshCw className="h-4 w-4" />
                      Movement Details
                    </div>
                    <div className={`text-xs ${textMuted}`}>Type, quantity, and reference</div>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {/* Movement Type */}
                    <div className="col-span-6 md:col-span-4">
                      <label htmlFor="movement-type" className={`block text-xs ${textMuted} mb-1.5`}>
                        Type <span className="text-red-500">*</span>
                      </label>
                      <FormSelect
                        id="movement-type"
                        value={formData.movementType}
                        onValueChange={(value) => handleChange("movementType", value)}
                        disabled={isEditing}
                        showValidation={false}
                      >
                        {Object.entries(isEditing ? MOVEMENT_TYPES : MANUAL_MOVEMENT_TYPES).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-4">
                      <label htmlFor="movement-quantity" className={`block text-xs ${textMuted} mb-1.5`}>
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="movement-quantity"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => handleChange("quantity", e.target.value)}
                        placeholder="0.00"
                        disabled={isEditing}
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${
                          errors.quantity ? "border-red-500" : inputBorder
                        } ${textPrimary} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                      />
                      {errors.quantity && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.quantity}
                        </p>
                      )}
                    </div>

                    {/* Unit */}
                    <div className="col-span-6 md:col-span-4">
                      <label htmlFor="movement-unit" className={`block text-xs ${textMuted} mb-1.5`}>
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <FormSelect
                        id="movement-unit"
                        value={formData.unit}
                        onValueChange={(value) => handleChange("unit", value)}
                        disabled={isEditing}
                        showValidation={false}
                      >
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>

                    {/* Reference Type */}
                    <div className="col-span-6 md:col-span-4">
                      <label htmlFor="stock-reference-type" className={`block text-xs ${textMuted} mb-1.5`}>
                        Reference Type
                      </label>
                      <FormSelect
                        id="stock-reference-type"
                        value={formData.referenceType}
                        onValueChange={(value) => handleChange("referenceType", value)}
                        disabled={isEditing}
                        showValidation={false}
                      >
                        {Object.entries(REFERENCE_TYPES).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>

                    {/* Reference Number */}
                    <div className="col-span-6 md:col-span-4">
                      <label htmlFor="stock-reference-number" className={`block text-xs ${textMuted} mb-1.5`}>
                        Reference #
                      </label>
                      <input
                        id="stock-reference-number"
                        type="text"
                        value={formData.referenceNumber}
                        onChange={(e) => handleChange("referenceNumber", e.target.value)}
                        placeholder="INV-001, PO-001..."
                        disabled={isEditing}
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                      />
                    </div>

                    {/* Movement Date */}
                    <div className="col-span-6 md:col-span-4">
                      <label htmlFor="stock-movement-date" className={`block text-xs ${textMuted} mb-1.5`}>
                        Date
                      </label>
                      <input
                        id="stock-movement-date"
                        type="date"
                        value={formData.movementDate}
                        onChange={(e) => handleChange("movementDate", e.target.value)}
                        disabled={isEditing}
                        className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Steel-Specific Fields Accordion */}
                <details className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                  <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                    <div>
                      <div className={`text-sm font-bold ${textPrimary}`}>Steel Traceability</div>
                      <div className={`text-xs ${textMuted}`}>Batch, coil, heat numbers</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                  </summary>
                  <div className={`p-3 border-t ${cardBorder}`}>
                    {/* PCS-Centric Pricing Section */}
                    <div className={`mb-3 p-2 rounded-lg ${isDarkMode ? "bg-[#1a2129]" : "bg-blue-50"}`}>
                      <div className={`text-xs font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"} mb-2`}>
                        Cost Calculation (PCS-Centric)
                      </div>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6 md:col-span-4">
                          <label htmlFor="stock-price-per-kg" className={`block text-xs ${textMuted} mb-1.5`}>
                            Price Per KG (AED)
                          </label>
                          <input
                            id="stock-price-per-kg"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.pricePerKg}
                            onChange={(e) => handleChange("pricePerKg", e.target.value)}
                            placeholder="e.g., 5.50"
                            disabled={isEditing}
                            className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-4">
                          <label htmlFor="stock-weight-per-piece" className={`block text-xs ${textMuted} mb-1.5`}>
                            Weight Per Piece (KG)
                          </label>
                          <input
                            id="stock-weight-per-piece"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.weightPerPieceKg}
                            onChange={(e) => handleChange("weightPerPieceKg", e.target.value)}
                            placeholder="e.g., 1000"
                            disabled={isEditing}
                            className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                          <label htmlFor="stock-unit-cost" className={`block text-xs ${textMuted} mb-1.5`}>
                            Cost/Piece (AED){" "}
                            <span className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                              = Price × Weight
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              id="stock-unit-cost"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.unitCost}
                              onChange={(e) => handleChange("unitCost", e.target.value)}
                              placeholder="Auto-calculated"
                              disabled={isEditing || (formData.pricePerKg && formData.weightPerPieceKg)}
                              className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus} ${isEditing || (formData.pricePerKg && formData.weightPerPieceKg) ? "opacity-60" : ""}`}
                            />
                            {formData.unitCost &&
                              formData.weightPerPieceKg &&
                              parseFloat(formData.weightPerPieceKg) > 0 && (
                                <div
                                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                                >
                                  ({(parseFloat(formData.unitCost) / parseFloat(formData.weightPerPieceKg)).toFixed(2)}{" "}
                                  /KG)
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6 md:col-span-4">
                        <label htmlFor="stock-batch-number" className={`block text-xs ${textMuted} mb-1.5`}>
                          Batch #
                        </label>
                        <input
                          id="stock-batch-number"
                          type="text"
                          value={formData.batchNumber}
                          onChange={(e) => handleChange("batchNumber", e.target.value)}
                          placeholder="Batch #"
                          disabled={isEditing}
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-4">
                        <label htmlFor="stock-coil-number" className={`block text-xs ${textMuted} mb-1.5`}>
                          Coil #
                        </label>
                        <input
                          id="stock-coil-number"
                          type="text"
                          value={formData.coilNumber}
                          onChange={(e) => handleChange("coilNumber", e.target.value)}
                          placeholder="Coil #"
                          disabled={isEditing}
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-4">
                        <label htmlFor="stock-heat-number" className={`block text-xs ${textMuted} mb-1.5`}>
                          Heat #
                        </label>
                        <input
                          id="stock-heat-number"
                          type="text"
                          value={formData.heatNumber}
                          onChange={(e) => handleChange("heatNumber", e.target.value)}
                          placeholder="Heat #"
                          disabled={isEditing}
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                </details>

                {/* Section 4: Notes Accordion */}
                <details className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                  <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                    <div>
                      <div className={`text-sm font-bold ${textPrimary}`}>Notes</div>
                      <div className={`text-xs ${textMuted}`}>Additional movement notes</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                  </summary>
                  <div className={`p-3 border-t ${cardBorder}`}>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      rows={3}
                      placeholder="Additional notes..."
                      disabled={isEditing}
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} ${placeholderCls} outline-none ${inputFocus} ${isEditing ? "opacity-60" : ""}`}
                    />
                  </div>
                </details>
              </div>

              {/* RIGHT COLUMN: Sticky Sidebar */}
              <div className="col-span-12 lg:col-span-4">
                <div className="lg:sticky lg:top-24 space-y-3">
                  {/* Movement Summary */}
                  <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                    <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>Movement Summary</div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>Type:</span>
                        <span
                          className={`font-medium ${
                            formData.movementType === "IN"
                              ? "text-green-500"
                              : formData.movementType === "OUT"
                                ? "text-red-500"
                                : "text-amber-500"
                          }`}
                        >
                          {MOVEMENT_TYPES[formData.movementType]?.label || formData.movementType}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>Quantity:</span>
                        <span className={`font-mono ${textPrimary}`}>
                          {formData.quantity || "0"} {formData.unit}
                        </span>
                      </div>
                      {formData.unitCost && (
                        <>
                          <div className={`h-px ${cardBorder} my-2`}></div>
                          <div className="flex justify-between text-sm">
                            <span className={textMuted}>Unit Cost:</span>
                            <span className={`font-mono ${textPrimary}`}>
                              AED {parseFloat(formData.unitCost || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`font-bold ${textPrimary}`}>Total Cost:</span>
                            <span className={`font-bold font-mono ${isDarkMode ? "text-[#4aa3ff]" : "text-teal-600"}`}>
                              AED {(parseFloat(formData.quantity || 0) * parseFloat(formData.unitCost || 0)).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Existing Movement Info */}
                  {isEditing && existingMovement && (
                    <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                      <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>Audit Trail</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={textMuted}>ID:</span>
                          <span className={`font-mono ${textPrimary}`}>{existingMovement.id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={textMuted}>Created By:</span>
                          <span className={textPrimary}>{existingMovement.createdByName || "System"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={textMuted}>Balance After:</span>
                          <span className={`font-mono ${textPrimary}`}>
                            {existingMovement.balanceAfter} {existingMovement.unit}
                          </span>
                        </div>
                        {existingMovement.totalCost && (
                          <div className="flex justify-between text-sm">
                            <span className={textMuted}>Total Cost:</span>
                            <span className={`font-mono ${textPrimary}`}>
                              AED {existingMovement.totalCost.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info Card */}
                  <div
                    className={`p-3 rounded-[14px] border ${
                      isDarkMode ? "bg-[#4aa3ff]/10 border-[#4aa3ff]/30" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${isDarkMode ? "text-[#4aa3ff]" : "text-blue-700"}`}>
                      Stock Movements
                    </div>
                    <p className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-blue-600"}`}>
                      Movements are immutable once created. They form an audit trail for inventory tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockMovementForm;
