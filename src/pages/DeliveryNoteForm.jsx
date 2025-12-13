import { useState, useEffect, useCallback } from "react";
import {
  Save,
  ArrowLeft,
  Truck,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Package,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { deliveryNotesAPI, invoicesAPI } from "../services/api";
import {
  formatDateForInput,
  validateWeightTolerance,
  calculateWeightVariance,
} from "../utils/invoiceUtils";
import DeliveryNotePreview from "../components/delivery-notes/DeliveryNotePreview";
import AllocationPanel from "../components/invoice/AllocationPanel";

const DeliveryNoteForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { isDarkMode } = useTheme();

  // Check if invoice was pre-selected from InvoiceList
  const preSelectedInvoiceId = location.state?.selectedInvoiceId;

  const [_loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Validation state - MANDATORY for all forms
  const [validationErrors, setValidationErrors] = useState([]);
  const [_invalidFields, setInvalidFields] = useState(new Set());

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  // Form data - use camelCase for state (API Gateway handles conversion)
  const [formData, setFormData] = useState({
    deliveryNoteNumber: "",
    invoiceId: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    // Phase 4: GRN dates
    goodsReceiptDate: new Date().toISOString().split("T")[0],
    inspectionDate: new Date().toISOString().split("T")[0],
    deliveryAddress: {
      street: "",
      city: "",
      poBox: "",
    },
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    notes: "",
    items: [],
    stockDeducted: false,
    stockDeductedAt: null,
  });

  // Expanded item state for showing allocation details
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Invoice selection
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Define handleInvoiceSelect BEFORE the useEffect that uses it
  const handleInvoiceSelect = useCallback(
    async (invoice) => {
      if (!invoice) return;

      try {
        setSelectedInvoice(invoice);

        // Parse address if string
        let invoiceAddress = invoice.customerDetails?.address || {};
        if (typeof invoiceAddress === "string") {
          try {
            invoiceAddress = JSON.parse(invoiceAddress);
          } catch {
            invoiceAddress = { street: invoiceAddress };
          }
        }

        setFormData((prev) => ({
          ...prev,
          invoiceId: invoice.id,
          deliveryAddress: {
            street: invoiceAddress.street || prev.deliveryAddress.street,
            city: invoiceAddress.city || prev.deliveryAddress.city,
            poBox:
              invoiceAddress.poBox ||
              invoiceAddress.po_box ||
              prev.deliveryAddress.poBox,
          },
          items:
            invoice.items?.map((item) => {
              // Calculate theoretical weight based on unit and quantity
              const qty = item.quantity || 0;
              const unitWeight = item.unitWeightKg || item.unit_weight_kg || 0;
              let theoreticalWeightKg = 0;
              if (item.unit === "KG") {
                theoreticalWeightKg = qty;
              } else if (item.unit === "MT") {
                theoreticalWeightKg = qty * 1000;
              } else if (item.unit === "PCS" && unitWeight > 0) {
                theoreticalWeightKg = qty * unitWeight;
              }

              return {
                invoiceItemId: item.id,
                productId: item.productId || item.product_id,
                name: item.name,
                specification: item.specification,
                hsnCode: item.hsnCode || item.hsn_code,
                unit: item.unit,
                orderedQuantity: item.quantity,
                deliveredQuantity: isEdit ? 0 : item.quantity, // For new delivery notes, default to full quantity
                remainingQuantity: isEdit ? item.quantity : 0,
                // Weight tracking fields
                unitWeightKg: unitWeight,
                theoreticalWeightKg,
                actualWeightKg: isEdit ? null : theoreticalWeightKg, // Default to theoretical for new
                productCategory:
                  item.productCategory || item.product_category || "DEFAULT",
              };
            }) || [],
        }));
        setShowInvoiceDialog(false);
      } catch (err) {
        setError(`Failed to load invoice details: ${err.message}`);
      }
    },
    [isEdit],
  );

  // Load delivery note for editing
  useEffect(() => {
    if (isEdit) {
      loadDeliveryNote();
    } else {
      generateDeliveryNoteNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // Load invoices for selection
  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount

  // Auto-select invoice if pre-selected
  useEffect(() => {
    if (preSelectedInvoiceId && !isEdit && invoices.length > 0) {
      const invoice = invoices.find((inv) => inv.id === preSelectedInvoiceId);
      if (invoice) {
        handleInvoiceSelect(invoice);
      }
    }
  }, [preSelectedInvoiceId, invoices, isEdit, handleInvoiceSelect]);

  const loadDeliveryNote = useCallback(async () => {
    try {
      setLoading(true);
      const deliveryNote = await deliveryNotesAPI.getById(id);

      // Parse delivery address if it's a string
      let parsedAddress =
        deliveryNote.deliveryAddress || deliveryNote.delivery_address || {};
      if (typeof parsedAddress === "string") {
        try {
          parsedAddress = JSON.parse(parsedAddress);
        } catch {
          parsedAddress = { street: parsedAddress };
        }
      }

      // Map items to camelCase and include allocation/warehouse data
      const mappedItems = (deliveryNote.items || []).map((item) => ({
        invoiceItemId: item.invoiceItemId || item.invoice_item_id,
        productId: item.productId || item.product_id,
        name: item.name,
        specification: item.specification,
        hsnCode: item.hsnCode || item.hsn_code,
        unit: item.unit,
        orderedQuantity: item.orderedQuantity || item.ordered_quantity || 0,
        deliveredQuantity:
          item.deliveredQuantity || item.delivered_quantity || 0,
        remainingQuantity:
          item.remainingQuantity || item.remaining_quantity || 0,
        isFullyDelivered:
          item.isFullyDelivered || item.is_fully_delivered || false,
        allocations: item.allocations || [],
        warehouseId: item.warehouseId || item.warehouse_id,
        warehouseName: item.warehouseName || item.warehouse_name,
        allocationStatus: item.allocationStatus || item.allocation_status,
        // Weight tracking fields
        unitWeightKg: item.unitWeightKg || item.unit_weight_kg || 0,
        theoreticalWeightKg:
          item.theoreticalWeightKg || item.theoretical_weight_kg || 0,
        actualWeightKg: item.actualWeightKg || item.actual_weight_kg || null,
        weightVarianceKg:
          item.weightVarianceKg || item.weight_variance_kg || null,
        weightVariancePct:
          item.weightVariancePct || item.weight_variance_pct || null,
        productCategory:
          item.productCategory || item.product_category || "DEFAULT",
      }));

      setFormData({
        deliveryNoteNumber:
          deliveryNote.deliveryNoteNumber ||
          deliveryNote.delivery_note_number ||
          "",
        invoiceId: deliveryNote.invoiceId || deliveryNote.invoice_id || "",
        deliveryDate:
          deliveryNote.deliveryDate || deliveryNote.delivery_date
            ? formatDateForInput(
                new Date(
                  deliveryNote.deliveryDate || deliveryNote.delivery_date,
                ),
              )
            : "",
        // Phase 4: GRN date fields
        goodsReceiptDate:
          deliveryNote.goodsReceiptDate || deliveryNote.goods_receipt_date
            ? formatDateForInput(
                new Date(
                  deliveryNote.goodsReceiptDate ||
                    deliveryNote.goods_receipt_date,
                ),
              )
            : formatDateForInput(new Date()),
        inspectionDate:
          deliveryNote.inspectionDate || deliveryNote.inspection_date
            ? formatDateForInput(
                new Date(
                  deliveryNote.inspectionDate || deliveryNote.inspection_date,
                ),
              )
            : formatDateForInput(new Date()),
        deliveryAddress: {
          street: parsedAddress.street || "",
          city: parsedAddress.city || "",
          poBox: parsedAddress.poBox || parsedAddress.po_box || "",
        },
        vehicleNumber:
          deliveryNote.vehicleNumber || deliveryNote.vehicle_number || "",
        driverName: deliveryNote.driverName || deliveryNote.driver_name || "",
        driverPhone:
          deliveryNote.driverPhone || deliveryNote.driver_phone || "",
        notes: deliveryNote.notes || "",
        items: mappedItems,
        stockDeducted:
          deliveryNote.stockDeducted || deliveryNote.stock_deducted || false,
        stockDeductedAt:
          deliveryNote.stockDeductedAt ||
          deliveryNote.stock_deducted_at ||
          null,
      });

      // Load the related invoice
      const invoiceId = deliveryNote.invoiceId || deliveryNote.invoice_id;
      if (invoiceId) {
        const invoice = await invoicesAPI.getById(invoiceId);
        setSelectedInvoice(invoice);
      }
    } catch (err) {
      setError(`Failed to load delivery note: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadInvoices = async () => {
    try {
      // Load invoices that can have delivery notes created (issued or paid)
      const response = await invoicesAPI.getAll({
        limit: 100,
      });
      // Filter to only show issued or paid invoices
      const eligibleInvoices = (response.invoices || []).filter(
        (inv) => inv.status === "issued" || inv.status === "paid",
      );
      setInvoices(eligibleInvoices);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    }
  };

  const generateDeliveryNoteNumber = async () => {
    try {
      const response = await deliveryNotesAPI.getNextNumber();
      setFormData((prev) => ({
        ...prev,
        deliveryNoteNumber:
          response.nextDeliveryNoteNumber || response.deliveryNoteNumber,
      }));
    } catch (err) {
      console.error("Failed to generate delivery note number:", err);
    }
  };

  // NOTE: handleInvoiceSelect is defined at the top of the component (before the useEffects that use it)

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleItemQuantityChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const numValue = parseFloat(value) || 0;

    // Map snake_case field to camelCase
    const camelCaseField =
      field === "delivered_quantity" ? "deliveredQuantity" : field;

    updatedItems[index] = {
      ...updatedItems[index],
      [camelCaseField]: numValue,
    };

    // Calculate remaining quantity
    if (camelCaseField === "deliveredQuantity") {
      updatedItems[index].remainingQuantity =
        updatedItems[index].orderedQuantity - numValue;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Handle actual weight change with variance calculation
  const handleActualWeightChange = (index, value) => {
    const updatedItems = [...formData.items];
    const actualWeight = parseFloat(value) || 0;
    const item = updatedItems[index];

    // Calculate variance
    const variance = calculateWeightVariance(
      actualWeight,
      item.theoreticalWeightKg,
    );

    updatedItems[index] = {
      ...item,
      actualWeightKg: actualWeight,
      weightVarianceKg: variance.varianceKg,
      weightVariancePct: variance.variancePct,
    };

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Get weight variance status for UI
  const getWeightVarianceStatus = (item) => {
    if (!item.actualWeightKg || !item.theoreticalWeightKg) {
      return { severity: "none", message: "Enter actual weight" };
    }
    return validateWeightTolerance(
      item.actualWeightKg,
      item.theoreticalWeightKg,
      item.productCategory,
    );
  };

  const toggleItemExpansion = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  /**
   * Get stock deduction status badge
   */
  const getStockStatusBadge = () => {
    if (formData.stockDeducted) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
          <CheckCircle
            size={16}
            className="text-green-600 dark:text-green-400"
          />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Stock Deducted
          </span>
          {formData.stockDeductedAt && (
            <span className="text-xs text-green-600 dark:text-green-400">
              {new Date(formData.stockDeductedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      );
    }

    if (
      formData.deliveryDate &&
      new Date(formData.deliveryDate) <= new Date()
    ) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700">
          <AlertTriangle
            size={16}
            className="text-orange-600 dark:text-orange-400"
          />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Pending Stock Deduction
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
        <AlertCircle size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Not Yet Delivered
        </span>
      </div>
    );
  };

  const handleSubmit = async () => {
    // STEP 1: Validate all required fields
    const errors = [];
    const invalidFieldsSet = new Set();

    // Delivery note number validation
    if (
      !formData.deliveryNoteNumber ||
      formData.deliveryNoteNumber.trim() === ""
    ) {
      errors.push("Delivery note number is required");
      invalidFieldsSet.add("deliveryNoteNumber");
    }

    // Invoice selection validation
    if (!formData.invoiceId) {
      errors.push("Please select an invoice");
      invalidFieldsSet.add("invoiceId");
    }

    // Delivery date validation
    if (!formData.deliveryDate) {
      errors.push("Delivery date is required");
      invalidFieldsSet.add("deliveryDate");
    }

    // Vehicle number validation (optional but recommended)
    if (!formData.vehicleNumber || formData.vehicleNumber.trim() === "") {
      errors.push("Vehicle number is required");
      invalidFieldsSet.add("vehicleNumber");
    }

    // Driver name validation (optional but recommended)
    if (!formData.driverName || formData.driverName.trim() === "") {
      errors.push("Driver name is required");
      invalidFieldsSet.add("driverName");
    }

    // Items validation
    if (!formData.items || formData.items.length === 0) {
      errors.push("At least one item is required");
    } else {
      formData.items.forEach((item, index) => {
        if (!item.deliveredQuantity || item.deliveredQuantity <= 0) {
          errors.push(
            `Item ${index + 1}: Delivered quantity must be greater than 0`,
          );
          invalidFieldsSet.add(`item.${index}.deliveredQuantity`);
        }
        if (item.deliveredQuantity > item.orderedQuantity) {
          errors.push(
            `Item ${index + 1}: Delivered quantity cannot exceed ordered quantity (${item.orderedQuantity})`,
          );
          invalidFieldsSet.add(`item.${index}.deliveredQuantity`);
        }
        // Weight tolerance validation - block if variance exceeds 2x tolerance
        if (item.theoreticalWeightKg > 0 && item.actualWeightKg > 0) {
          const weightStatus = validateWeightTolerance(
            item.actualWeightKg,
            item.theoreticalWeightKg,
            item.productCategory,
          );
          if (weightStatus.severity === "error") {
            errors.push(
              `Item ${index + 1}: ${weightStatus.message}. Supervisor override required.`,
            );
            invalidFieldsSet.add(`item.${index}.actualWeightKg`);
          }
        }
      });
    }

    // If errors exist, show them and STOP
    if (errors.length > 0) {
      setValidationErrors(errors);
      setInvalidFields(invalidFieldsSet);

      // Auto-scroll to error alert
      setTimeout(() => {
        const errorAlert = document.getElementById("validation-errors-alert");
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: "instant", block: "center" });
        }
      }, 100);

      return; // STOP - do not proceed with save
    }

    // STEP 2: Clear any previous errors
    setValidationErrors([]);
    setInvalidFields(new Set());

    // STEP 3: Proceed with save operation
    setIsSaving(true);

    try {
      // Prepare data for API (API Gateway handles camelCase to snake_case conversion)
      const submitData = {
        deliveryNoteNumber: formData.deliveryNoteNumber,
        invoiceId: formData.invoiceId,
        deliveryDate: formData.deliveryDate,
        // Phase 4: GRN date fields
        goodsReceiptDate: formData.goodsReceiptDate,
        inspectionDate: formData.inspectionDate,
        deliveryAddress: JSON.stringify(formData.deliveryAddress),
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        notes: formData.notes,
        customerId: selectedInvoice?.customerId || selectedInvoice?.customer_id,
        customerDetails: JSON.stringify(selectedInvoice?.customerDetails || {}),
        items: formData.items.map((item) => ({
          invoiceItemId: item.invoiceItemId,
          productId: item.productId,
          name: item.name,
          specification: item.specification,
          hsnCode: item.hsnCode,
          unit: item.unit,
          orderedQuantity: item.orderedQuantity,
          deliveredQuantity: item.deliveredQuantity,
          remainingQuantity: item.remainingQuantity,
          isFullyDelivered: item.deliveredQuantity >= item.orderedQuantity,
          // Weight tracking fields
          theoreticalWeightKg: item.theoreticalWeightKg || null,
          actualWeightKg: item.actualWeightKg || null,
          weightVarianceKg: item.weightVarianceKg || null,
          weightVariancePct: item.weightVariancePct || null,
        })),
      };

      if (isEdit) {
        await deliveryNotesAPI.update(id, submitData);
        setSuccess("Delivery note updated successfully");
      } else {
        await deliveryNotesAPI.create(submitData);
        setSuccess("Delivery note created successfully");
      }

      setTimeout(() => {
        navigate("/delivery-notes");
      }, 2000);
    } catch (err) {
      setError(`Failed to save delivery note: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`p-6 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/delivery-notes")}
          className={`p-2 rounded-lg mr-4 transition-colors ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className={`text-2xl font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          <Truck size={32} className="text-teal-600" />
          {isEdit ? "Edit Delivery Note" : "Create Delivery Note"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Delivery Note Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deliveryNoteNumber}
                  onChange={(e) =>
                    handleInputChange("deliveryNoteNumber", e.target.value)
                  }
                  required
                  disabled={isEdit}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    handleInputChange("deliveryDate", e.target.value)
                  }
                  required
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              {/* Phase 4: GRN Date Fields */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Goods Receipt Date
                  <span className="text-xs text-gray-500 ml-1">
                    (when received)
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.goodsReceiptDate}
                  onChange={(e) =>
                    handleInputChange("goodsReceiptDate", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Inspection Date
                  <span className="text-xs text-gray-500 ml-1">
                    (QC completed)
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) =>
                    handleInputChange("inspectionDate", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              {selectedInvoice &&
                selectedInvoice.poDate &&
                selectedInvoice.expectedDeliveryDate && (
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p
                          className={`text-sm font-medium ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
                        >
                          Delivery Variance
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-2xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                          >
                            {formData.goodsReceiptDate &&
                            selectedInvoice.expectedDeliveryDate
                              ? Math.ceil(
                                  (new Date(formData.goodsReceiptDate) -
                                    new Date(
                                      selectedInvoice.expectedDeliveryDate,
                                    )) /
                                    (1000 * 60 * 60 * 24),
                                )
                              : 0}{" "}
                            days
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              formData.goodsReceiptDate &&
                              selectedInvoice.expectedDeliveryDate
                                ? Math.ceil(
                                    (new Date(formData.goodsReceiptDate) -
                                      new Date(
                                        selectedInvoice.expectedDeliveryDate,
                                      )) /
                                      (1000 * 60 * 60 * 24),
                                  ) <= (selectedInvoice.gracePeriodDays || 5)
                                  ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {formData.goodsReceiptDate &&
                            selectedInvoice.expectedDeliveryDate
                              ? Math.ceil(
                                  (new Date(formData.goodsReceiptDate) -
                                    new Date(
                                      selectedInvoice.expectedDeliveryDate,
                                    )) /
                                    (1000 * 60 * 60 * 24),
                                ) <= (selectedInvoice.gracePeriodDays || 5)
                                ? "✓ ON TIME"
                                : "⚠ LATE"
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Expected
                        </p>
                        <p
                          className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {selectedInvoice.expectedDeliveryDate}
                        </p>
                        <p
                          className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-2`}
                        >
                          Received
                        </p>
                        <p
                          className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {formData.goodsReceiptDate}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              <div className="sm:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Selected Invoice <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={
                      selectedInvoice
                        ? `${selectedInvoice.invoiceNumber} - ${selectedInvoice.customerDetails?.name}`
                        : ""
                    }
                    readOnly
                    required
                    className={`flex-grow px-4 py-3 border rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    } cursor-not-allowed`}
                  />
                  <button
                    onClick={() => setShowInvoiceDialog(true)}
                    disabled={isEdit}
                    className={`px-4 py-3 border rounded-lg transition-colors ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                    } ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Select Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Delivery Address
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.street}
                  onChange={(e) =>
                    handleInputChange("deliveryAddress.street", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.city}
                    onChange={(e) =>
                      handleInputChange("deliveryAddress.city", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    PO Box
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.poBox}
                    onChange={(e) =>
                      handleInputChange("deliveryAddress.poBox", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items with Stock Allocation Visibility */}
          {formData.items.length > 0 && (
            <div
              className={`p-6 mb-6 rounded-xl border ${
                isDarkMode
                  ? "bg-[#1E2328] border-[#37474F]"
                  : "bg-white border-[#E0E0E0]"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Items for Delivery
                </h2>
                {getStockStatusBadge()}
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {/* Item Header - Clickable to expand */}
                    <div
                      className={`p-4 cursor-pointer hover:bg-opacity-80 transition-colors ${
                        expandedItems.has(index)
                          ? "border-b border-gray-300 dark:border-gray-600"
                          : ""
                      }`}
                      onClick={() => toggleItemExpansion(index)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <div className="flex items-start gap-2">
                            <Package
                              size={18}
                              className="text-teal-600 mt-1 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
                              >
                                {item.name}
                              </p>
                              <p
                                className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {item.specification || "No specification"}
                              </p>
                              {item.warehouseName && (
                                <p
                                  className={`text-xs mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                                >
                                  📍 {item.warehouseName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 text-center">
                          <p
                            className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Unit
                          </p>
                          <p
                            className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {item.unit}
                          </p>
                        </div>

                        <div className="col-span-2 text-right">
                          <p
                            className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Ordered
                          </p>
                          <p
                            className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {item.orderedQuantity}
                          </p>
                        </div>

                        <div className="col-span-2 text-right">
                          <p
                            className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Deliver
                          </p>
                          <input
                            type="number"
                            value={item.deliveredQuantity || ""}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleItemQuantityChange(
                                index,
                                "delivered_quantity",
                                e.target.value,
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            min={0}
                            max={item.orderedQuantity}
                            step={0.01}
                            className={`w-full px-2 py-1 border rounded text-right ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          />
                        </div>

                        <div className="col-span-2 text-right">
                          <p
                            className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Remaining
                          </p>
                          <p
                            className={`font-semibold ${
                              item.remainingQuantity === 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {item.remainingQuantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Allocation Details - Expandable */}
                    {expandedItems.has(index) && (
                      <div className="p-4 space-y-4">
                        {/* Weight Tracking Section */}
                        {item.theoreticalWeightKg > 0 && (
                          <div
                            className={`p-4 rounded-lg border ${
                              isDarkMode
                                ? "bg-gray-800/50 border-gray-700"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <h4
                              className={`text-sm font-medium mb-3 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}
                            >
                              Weight Verification
                            </h4>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p
                                  className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Theoretical
                                </p>
                                <p
                                  className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                >
                                  {item.theoreticalWeightKg?.toFixed(2)} kg
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Actual Weight
                                </p>
                                <input
                                  type="number"
                                  value={item.actualWeightKg || ""}
                                  onChange={(e) =>
                                    handleActualWeightChange(
                                      index,
                                      e.target.value,
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  min={0}
                                  step={0.01}
                                  placeholder="Enter actual"
                                  className={`w-full px-2 py-1 border rounded text-right text-sm ${
                                    isDarkMode
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300 text-gray-900"
                                  }`}
                                />
                              </div>
                              <div>
                                <p
                                  className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Variance
                                </p>
                                {item.actualWeightKg ? (
                                  <p
                                    className={`font-medium ${
                                      Math.abs(item.weightVariancePct || 0) > 10
                                        ? "text-red-600"
                                        : Math.abs(
                                              item.weightVariancePct || 0,
                                            ) > 5
                                          ? "text-orange-600"
                                          : "text-green-600"
                                    }`}
                                  >
                                    {item.weightVarianceKg > 0 ? "+" : ""}
                                    {item.weightVarianceKg?.toFixed(2)} kg
                                    <span className="text-xs ml-1">
                                      ({item.weightVariancePct > 0 ? "+" : ""}
                                      {item.weightVariancePct?.toFixed(1)}%)
                                    </span>
                                  </p>
                                ) : (
                                  <p
                                    className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                                  >
                                    —
                                  </p>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Status
                                </p>
                                {(() => {
                                  const status = getWeightVarianceStatus(item);
                                  const colorMap = {
                                    success:
                                      "text-green-600 dark:text-green-400",
                                    caution:
                                      "text-yellow-600 dark:text-yellow-400",
                                    warning:
                                      "text-orange-600 dark:text-orange-400",
                                    error: "text-red-600 dark:text-red-400",
                                    none: isDarkMode
                                      ? "text-gray-500"
                                      : "text-gray-400",
                                  };
                                  return (
                                    <p
                                      className={`text-xs font-medium ${colorMap[status.severity]}`}
                                    >
                                      {status.severity === "error" && (
                                        <AlertTriangle
                                          size={12}
                                          className="inline mr-1"
                                        />
                                      )}
                                      {status.severity === "warning" && (
                                        <AlertCircle
                                          size={12}
                                          className="inline mr-1"
                                        />
                                      )}
                                      {status.severity === "success" && (
                                        <CheckCircle
                                          size={12}
                                          className="inline mr-1"
                                        />
                                      )}
                                      {status.message}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Allocation Panel */}
                        {item.allocations && item.allocations.length > 0 ? (
                          <AllocationPanel
                            productId={item.productId}
                            warehouseId={item.warehouseId}
                            requiredQty={item.deliveredQuantity || 0}
                            allocations={item.allocations}
                            disabled={true}
                          />
                        ) : (
                          <div
                            className={`p-4 rounded-lg border text-center ${
                              isDarkMode
                                ? "bg-gray-800/50 border-gray-700 text-gray-400"
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}
                          >
                            <p className="text-sm">
                              {formData.stockDeducted
                                ? "Stock has been deducted but allocation details are not available."
                                : "Batch allocations will be computed when the delivery note is processed."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Details - Right Column */}
        <div className="md:col-span-1">
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Transport Details
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    handleInputChange("vehicleNumber", e.target.value)
                  }
                  placeholder="e.g., MH-01-AB-1234"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Driver Name
                </label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) =>
                    handleInputChange("driverName", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Driver Phone
                </label>
                <input
                  type="tel"
                  value={formData.driverPhone}
                  onChange={(e) =>
                    handleInputChange("driverPhone", e.target.value)
                  }
                  placeholder="e.g., +91 98765 43210"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>
          </div>

          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Notes
            </h2>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Special instructions, handling notes, etc."
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>

          {/* Validation Errors Alert - MANDATORY */}
          {validationErrors.length > 0 && (
            <div
              id="validation-errors-alert"
              className={`mb-6 p-4 rounded-lg border-2 ${
                isDarkMode
                  ? "bg-red-900/20 border-red-600 text-red-200"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                  size={24}
                />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((validationError, index) => (
                      <li key={index}>{validationError}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setValidationErrors([]);
                      setInvalidFields(new Set());
                    }}
                    className={`mt-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isDarkMode
                        ? "bg-red-800 hover:bg-red-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md mb-4 ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                : "bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
            }`}
          >
            <Eye size={20} />
            Preview
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSaving || !selectedInvoice}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md mb-4 ${
              isSaving || !selectedInvoice
                ? "opacity-60 cursor-not-allowed pointer-events-none"
                : ""
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                {isEdit ? "Update Delivery Note" : "Create Delivery Note"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Selection Dialog */}
      {showInvoiceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Select Invoice</h3>
              <button
                type="button"
                onClick={() => setShowInvoiceDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No invoices available for delivery
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => handleInvoiceSelect(invoice)}
                      className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {invoice.invoiceNumber || invoice.invoice_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.customerDetails?.name ||
                              invoice.customer_name ||
                              "Unknown Customer"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat("en-AE", {
                              style: "currency",
                              currency: "AED",
                            }).format(
                              invoice.grandTotal || invoice.grand_total || 0,
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <DeliveryNotePreview
          deliveryNote={{
            deliveryNoteNumber: formData.deliveryNoteNumber,
            invoiceNumber: selectedInvoice?.invoiceNumber,
            invoiceId: formData.invoiceId,
            deliveryDate: formData.deliveryDate,
            deliveryAddress: formData.deliveryAddress,
            vehicleNumber: formData.vehicleNumber,
            driverName: formData.driverName,
            driverPhone: formData.driverPhone,
            notes: formData.notes,
            items: formData.items,
            status: "pending",
            customerDetails: selectedInvoice?.customerDetails,
          }}
          company={{}}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Success/Error Notifications - will be converted later */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isDarkMode
                ? "bg-red-900/20 border-red-700 text-red-300"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isDarkMode
                ? "bg-green-900/20 border-green-700 text-green-300"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
              <button onClick={() => setSuccess("")} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNoteForm;
