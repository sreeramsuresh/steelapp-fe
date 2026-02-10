import {
  AlertTriangle,
  ArrowLeft,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Pin,
  Plus,
  Save,
  Settings,
  Trash2,
  Truck,
  User,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ==================== DESIGN TOKENS (Matched to Invoice Form) ====================

// Layout classes (use with isDarkMode ternary)
const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-4`;

const INPUT_CLASSES = (isDarkMode) =>
  `w-full ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-md py-2 px-3 text-sm outline-none shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 h-[38px]`;

const LABEL_CLASSES = (isDarkMode) =>
  `block text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1.5`;

const BTN_CLASSES = (isDarkMode) =>
  `${isDarkMode ? "bg-gray-900 border-gray-700 text-white hover:border-teal-500" : "bg-white border-gray-300 text-gray-900 hover:border-teal-500"} border rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors`;

const BTN_PRIMARY =
  "bg-teal-600 border-transparent text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors";

const BTN_SMALL = (isDarkMode) =>
  `${isDarkMode ? "bg-gray-900 border-gray-700 text-white hover:border-teal-500" : "bg-white border-gray-300 text-gray-900 hover:border-teal-500"} border rounded-lg py-1.5 px-2.5 text-xs cursor-pointer transition-colors`;

const QUICK_LINK_CLASSES = (isDarkMode) =>
  `flex items-center gap-2 py-2 px-2.5 ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-md cursor-pointer text-xs transition-colors hover:border-teal-500 hover:text-teal-400 w-full`;

const DIVIDER_CLASSES = (isDarkMode) => `h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} my-3`;

const DRAWER_OVERLAY = "fixed inset-0 bg-black/55 z-30 transition-opacity";

const DRAWER_PANEL = (isDarkMode) =>
  `fixed top-0 right-0 h-full w-[min(620px,92vw)] z-[31] ${isDarkMode ? "bg-gray-800 border-l border-gray-700" : "bg-white border-l border-gray-200"} overflow-auto transition-transform`;

const DRAWER_HEADER = (isDarkMode) =>
  `sticky top-0 flex justify-between items-start gap-2.5 p-4 ${isDarkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white border-b border-gray-200"} z-[1]`;

const DRAWER_FOOTER_GRADIENT = (isDarkMode) =>
  isDarkMode
    ? "linear-gradient(to top, rgba(31,41,55,1) 70%, rgba(31,41,55,0))"
    : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))";

import PurchaseOrderPreview from "../components/purchase-orders/PurchaseOrderPreview";
import ProductAutocomplete from "../components/shared/ProductAutocomplete";
import TRNInput from "../components/TRNInput";
import { FormSelect } from "../components/ui/form-select";
import { SelectItem } from "../components/ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { useApiData } from "../hooks/useApi";
import { payablesService, productService } from "../services/dataService";
import { importContainerService } from "../services/importContainerService";
import { notificationService } from "../services/notificationService";
import { pinnedProductsService } from "../services/pinnedProductsService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { supplierService } from "../services/supplierService";
import { FINISHES, PRODUCT_TYPES } from "../types";
import { getProductDisplayName, getProductUniqueName } from "../utils/fieldAccessors";
import { calculateItemAmount, calculateSubtotal, formatCurrency, generatePONumber } from "../utils/invoiceUtils";

const { PAYMENT_MODES } = payablesService;

// Payment Form Component
const PaymentForm = ({ onSubmit, onCancel, totalAmount, paidAmount, isDarkMode }) => {
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    paymentMethod: "cash",
    referenceNumber: "",
    notes: "",
  });

  const maxAmount = totalAmount - paidAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      notificationService.error("Please enter a valid amount");
      return;
    }

    if (amount > maxAmount) {
      notificationService.error(`Amount cannot exceed outstanding balance of ${formatCurrency(maxAmount)}`);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`w-full max-w-md p-6 rounded-xl shadow-xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="po-payment-date"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Payment Date
            </label>
            <input
              id="po-payment-date"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            />
          </div>

          <div>
            <label
              htmlFor="po-payment-amount"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Amount (Max: {formatCurrency(maxAmount)})
            </label>
            <input
              id="po-payment-amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder="0.00"
              required
            />
          </div>

          <FormSelect
            label="Payment Method"
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
          >
            {Object.values(PAYMENT_MODES).map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.icon} {mode.label}
              </SelectItem>
            ))}
          </FormSelect>

          <div>
            <label
              htmlFor="po-payment-reference"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Reference Number
            </label>
            <input
              id="po-payment-reference"
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              placeholder="Transaction reference, cheque number, etc."
            />
          </div>

          <div>
            <label
              htmlFor="po-payment-notes"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Notes
            </label>
            <textarea
              id="po-payment-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              rows={2}
              placeholder="Additional notes about this payment"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ProductAutocomplete imported from ../components/shared/ProductAutocomplete
const Autocomplete = ProductAutocomplete;

// Toggle Switch Component (extracted to avoid creating components during render)
const ToggleSwitchPO = ({ enabled, onChange, label, description, isDarkMode }) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex-1 pr-4">
      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
        enabled ? "bg-teal-600" : isDarkMode ? "bg-gray-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

// Form Settings Panel Component
const FormSettingsPanel = ({ isOpen, onClose, preferences, onPreferenceChange }) => {
  const { isDarkMode } = useTheme();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg border z-50 ${
        isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
      }`}
    >
      <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Form Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 divide-y divide-gray-200 dark:divide-gray-700">
        <ToggleSwitchPO
          enabled={preferences.showValidationHighlighting}
          onChange={() => onPreferenceChange("showValidationHighlighting", !preferences.showValidationHighlighting)}
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
          isDarkMode={isDarkMode}
        />
        <ToggleSwitchPO
          enabled={preferences.showSpeedButtons}
          onChange={() => onPreferenceChange("showSpeedButtons", !preferences.showSpeedButtons)}
          label="Quick Add Speed Buttons"
          description="Show pinned & top products for quick adding"
          isDarkMode={isDarkMode}
        />
      </div>

      <div
        className={`px-4 py-2 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"} border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
      >
        Settings are saved automatically
      </div>
    </div>
  );
};

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [purchaseOrder, setPurchaseOrder] = useState({
    poNumber: generatePONumber(), // Fallback PO number generation
    supplierName: "",
    supplierEmail: "",
    supplierPhone: "",
    supplierAddress: "",
    supplierTRN: "", // Tax Registration Number (UAE requirement)
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    gracePeriodDays: 5, // Phase 4: Grace period for on-time delivery evaluation (default 5 days)
    status: "draft",
    stockStatus: "retain", // Default to 'retain' (form-level, deprecated for new POs)
    // Exchange rate for multi-currency POs
    exchangeRate: null, // Exchange rate to AED (null when currency is AED)
    // Incoterms and delivery
    incoterms: "", // FOB, CIF, EXW, etc.
    // Buyer/Purchaser information
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerDepartment: "",
    // Approval workflow
    approvalStatus: "pending", // pending/approved/rejected
    approvedBy: "",
    approvalDate: "",
    approvalComments: "",
    items: [
      {
        productType: "",
        name: "", // This will be same as productType for consistency
        productId: null, // Product ID for lookup
        grade: "",
        thickness: "",
        size: "",
        finish: "",
        specification: "", // Keep for backward compatibility
        itemDescription: "", // Detailed description
        hsnCode: "", // HSN/SAC code
        unit: "kg", // Unit of Measure (kg, mt, pcs, sqm, etc.)
        quantity: 0,
        rate: 0,
        discountType: "amount", // amount or percentage
        discount: 0,
        vatRate: 5, // Configurable VAT rate per item (default 5%)
        supplyType: "standard", // standard, zero_rated, exempt (matching Invoice form)
        amount: 0,
        // Phase 4: Stock-In Enhancements - Line-level fields
        lineStockStatus: "PENDING", // PENDING, PARTIAL, RECEIVED - supports partial receipts
        expectedWeightKg: null, // Expected weight at PO time for variance tracking
        // GRN linkage fields (populated when GRN is created)
        grnId: null,
        grnNumber: null,
        receivedQty: null, // Quantity actually received via GRN
        receivedWeightKg: null, // Actual weight received via GRN
      },
    ],
    subtotal: 0,
    // Order-level discount
    discountType: "amount", // amount or percentage
    discountPercentage: 0,
    discountAmount: 0,
    // Additional charges
    freightCharges: 0,
    shippingCharges: 0,
    handlingCharges: 0,
    otherCharges: 0,
    vatAmount: 0,
    total: 0,
    notes: "",
    terms: "", // General terms and conditions
    paymentTerms: "Net 30", // Standardized payment terms
    dueDate: "",
    currency: "AED",
    supplierContactName: "",
    supplierContactEmail: "",
    supplierContactPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [_errors, setErrors] = useState({});
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [importContainers, setImportContainers] = useState([]);
  const [searchInputs, setSearchInputs] = useState({});
  const [payments, setPayments] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [_expandedItems, _setExpandedItems] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Drawer states for refactored UX
  const [chargesDrawerOpen, setChargesDrawerOpen] = useState(false);
  const [deliveryDrawerOpen, setDeliveryDrawerOpen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false);
  const [buyerDrawerOpen, setBuyerDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  // Receive to Warehouse modal state (dropship customer rejection)
  const [receiveToWarehouseOpen, setReceiveToWarehouseOpen] = useState(false);
  const [rtwSaving, setRtwSaving] = useState(false);
  const [rtwWarehouseId, setRtwWarehouseId] = useState("");
  const [rtwReason, setRtwReason] = useState("");
  const [rtwNotes, setRtwNotes] = useState("");
  const [rtwItems, setRtwItems] = useState([]);

  // Validation state - MANDATORY for all forms
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Pinned products state (matching Invoice form)
  const [pinnedProductIds, setPinnedProductIds] = useState([]);
  const { data: pinnedData, refetch: _refetchPinned } = useApiData(() => pinnedProductsService.getPinnedProducts(), []);

  // Form preferences state (with localStorage persistence)
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem("purchaseOrderFormPreferences");
    return saved
      ? JSON.parse(saved)
      : {
          showValidationHighlighting: true,
          showSpeedButtons: true,
        };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("purchaseOrderFormPreferences", JSON.stringify(formPreferences));
  }, [formPreferences]);

  // Update pinned products when data loads
  useEffect(() => {
    if (pinnedData?.pinnedProducts) {
      setPinnedProductIds(pinnedData.pinnedProducts);
    }
  }, [pinnedData]);

  // Handle pin/unpin
  const handleTogglePin = async (e, productId) => {
    e.stopPropagation(); // Prevent adding item to PO
    try {
      if (pinnedProductIds.includes(productId)) {
        await pinnedProductsService.unpinProduct(productId);
        setPinnedProductIds((prev) => prev.filter((pinnedId) => pinnedId !== productId));
      } else {
        if (pinnedProductIds.length >= 10) {
          notificationService.error("Maximum 10 products can be pinned");
          return;
        }
        await pinnedProductsService.pinProduct(productId);
        setPinnedProductIds((prev) => [...prev, productId]);
      }
    } catch (error) {
      notificationService.error(error.message || "Failed to update pin");
    }
  };

  // Get sorted products: pinned first, then top sold (matching Invoice form)
  const sortedProducts = useMemo(() => {
    const allProducts = availableProducts || [];
    const pinned = allProducts.filter((p) => pinnedProductIds.includes(p.id));
    const unpinned = allProducts.filter((p) => !pinnedProductIds.includes(p.id));
    return [...pinned, ...unpinned].slice(0, 10);
  }, [availableProducts, pinnedProductIds]);

  // Quick add item from speed button (matching Invoice form)
  const handleQuickAddItem = useCallback((product) => {
    const productDisplayName = getProductDisplayName(product);
    const newItem = {
      productType: productDisplayName,
      name: productDisplayName,
      productId: product.id,
      grade: product.grade || "",
      finish: product.finish || "",
      size: product.size || "",
      thickness: product.thickness || "",
      specification: product.specifications || product.description || "",
      itemDescription: "",
      hsnCode: product.hsnCode || "",
      unit: product.unit || "kg",
      quantity: 0,
      rate: product.sellingPrice || product.purchasePrice || 0,
      discountType: "amount",
      discount: 0,
      vatRate: 5,
      supplyType: "standard",
      amount: 0,
      // Procurement channel fields (v2)
      procurementChannel: "LOCAL",
      importContainerId: null,
      expectedMarginPct: 8,
      // Phase 4: Stock-In Enhancements - Line-level fields
      lineStockStatus: "PENDING",
      expectedWeightKg: null,
      grnId: null,
      grnNumber: null,
      receivedQty: null,
      receivedWeightKg: null,
    };

    setPurchaseOrder((prev) => {
      const updatedItems = [...prev.items, newItem];
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = updatedItems.reduce((sum, item) => {
        const itemAmount = item.amount || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemAmount * vatRate) / 100;
      }, 0);
      const total = subtotal + vatAmount;

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        vatAmount,
        total,
      };
    });
  }, []);

  // Payment calculation functions
  const updatePaymentStatus = useCallback((paymentList, total) => {
    const totalPaid = paymentList.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const outstanding = Math.max(0, total - totalPaid);

    let status = "unpaid";
    if (outstanding === 0 && total > 0) status = "paid";
    else if (outstanding < total && outstanding > 0) status = "partially_paid";

    setPaymentStatus(status);
    return { totalPaid, outstanding, status };
  }, []);

  const handleAddPayment = (paymentData) => {
    const newPayment = {
      id: Date.now().toString(),
      ...paymentData,
      created_at: new Date().toISOString(),
      voided: false,
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    updatePaymentStatus(updatedPayments, purchaseOrder.total);
    setShowPaymentForm(false);
  };

  const handleVoidPayment = async (paymentId) => {
    const confirmed = window.confirm("Are you sure you want to void this payment? This action cannot be undone.");
    if (!confirmed) return;

    const updatedPayments = payments.map((p) =>
      p.id === paymentId ? { ...p, voided: true, voided_at: new Date().toISOString() } : p
    );
    setPayments(updatedPayments);
    updatePaymentStatus(updatedPayments, purchaseOrder.total);
  };

  // Dropship helpers
  const hasDropshipItems = useMemo(
    () => purchaseOrder.items.some((item) => item.isDropship),
    [purchaseOrder.items],
  );

  const canReceiveToWarehouse = useMemo(
    () => id && hasDropshipItems && (purchaseOrder.stockStatus === "received" || purchaseOrder.stockStatus === "in_warehouse"),
    [id, hasDropshipItems, purchaseOrder.stockStatus],
  );

  const openReceiveToWarehouse = useCallback(() => {
    const dropshipItems = purchaseOrder.items
      .filter((item) => item.isDropship && item.id)
      .map((item) => ({
        itemId: item.id,
        name: item.name || item.productType,
        maxQuantity: item.quantity || 0,
        quantity: item.quantity || 0,
      }));
    setRtwItems(dropshipItems);
    setRtwWarehouseId("");
    setRtwReason("");
    setRtwNotes("");
    setReceiveToWarehouseOpen(true);
  }, [purchaseOrder.items]);

  const handleReceiveToWarehouse = async () => {
    if (!rtwWarehouseId) {
      notificationService.error("Please select a warehouse");
      return;
    }
    if (!rtwReason.trim()) {
      notificationService.error("Reason is required");
      return;
    }
    const itemsToSend = rtwItems
      .filter((item) => item.quantity > 0)
      .map((item) => ({ item_id: item.itemId, quantity: item.quantity }));

    if (itemsToSend.length === 0) {
      notificationService.error("Please specify quantities for at least one item");
      return;
    }

    // Quantity guard
    const overReceive = rtwItems.find((item) => item.quantity > item.maxQuantity);
    if (overReceive) {
      notificationService.error(`Quantity for "${overReceive.name}" exceeds maximum receivable (${overReceive.maxQuantity})`);
      return;
    }

    setRtwSaving(true);
    try {
      await purchaseOrderService.receiveToWarehouse(id, {
        items: itemsToSend,
        warehouse_id: parseInt(rtwWarehouseId, 10),
        reason: rtwReason.trim(),
        notes: rtwNotes.trim() || undefined,
      });
      notificationService.success("Goods received to warehouse successfully");
      setReceiveToWarehouseOpen(false);
      // Reload PO to reflect updated status
      window.location.reload();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error.message || "Failed to receive to warehouse";
      notificationService.error(msg);
    } finally {
      setRtwSaving(false);
    }
  };

  const calculateDueDate = useCallback((poDate, terms) => {
    if (!poDate || !terms) return "";
    const date = new Date(poDate);
    const match = terms.match(/(\d+)/);
    if (match) {
      date.setDate(date.getDate() + parseInt(match[1], 10));
      return date.toISOString().slice(0, 10);
    }
    return "";
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setPurchaseOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Auto-calculate due date when PO date or payment terms change
  useEffect(() => {
    if (purchaseOrder.poDate && purchaseOrder.paymentTerms) {
      const calculatedDueDate = calculateDueDate(purchaseOrder.poDate, purchaseOrder.paymentTerms);
      if (calculatedDueDate && calculatedDueDate !== purchaseOrder.dueDate) {
        handleInputChange("dueDate", calculatedDueDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder.poDate, purchaseOrder.paymentTerms, calculateDueDate, handleInputChange, purchaseOrder.dueDate]);

  // Update payment status when total changes
  useEffect(() => {
    if (payments.length > 0) {
      updatePaymentStatus(payments, purchaseOrder.total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder.total, payments, updatePaymentStatus]);

  // Normalize date value for <input type="date">
  const toDateInput = useCallback((d) => {
    if (!d) return "";
    try {
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "";
      return dt.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }, []);
  // Suppliers
  const { data: suppliersData, loading: loadingSuppliers } = useApiData(
    () => supplierService.getSuppliers({ status: "active" }),
    []
  );

  // Supplier options for dropdown
  const suppliers = useMemo(() => {
    return (suppliersData?.suppliers || []).map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || supplier.company || "",
      paymentTerms: supplier.paymentTerms || supplier.payment_terms,
      defaultCurrency: supplier.defaultCurrency || supplier.default_currency,
      contactName: supplier.contactName || supplier.contact_name,
      contactEmail: supplier.contactEmail || supplier.contact_email,
      contactPhone: supplier.contactPhone || supplier.contact_phone,
    }));
  }, [suppliersData]);

  // Product options for autocomplete
  const productOptions = useMemo(() => {
    return (availableProducts || []).map((product) => {
      // Handle both camelCase and snake_case from API
      const uniqueName = getProductUniqueName(product);
      const displayName = getProductDisplayName(product);
      const sellingPrice = product.sellingPrice ?? product.selling_price ?? 0;
      // Use uniqueName for dropdown display, displayName for documents
      const label = uniqueName || displayName || "N/A";
      return {
        ...product,
        label,
        searchDisplay: label,
        uniqueName: uniqueName || "",
        displayName: displayName || "",
        subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${sellingPrice}`,
      };
    });
  }, [availableProducts]);

  const searchOptions = useMemo(() => {
    const list = searchInputs?.__results || [];
    return list.map((product) => {
      // Handle both camelCase and snake_case from API
      const uniqueName = getProductUniqueName(product);
      const displayName = getProductDisplayName(product);
      const sellingPrice = product.sellingPrice ?? product.selling_price ?? 0;
      // Use uniqueName for dropdown display, displayName for documents
      const label = uniqueName || displayName || "N/A";
      return {
        ...product,
        label,
        searchDisplay: label,
        uniqueName: uniqueName || "",
        displayName: displayName || "",
        subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${sellingPrice}`,
      };
    });
  }, [searchInputs.__results]);

  // Load existing purchase order when editing
  useEffect(() => {
    const loadExisting = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await purchaseOrderService.getById(id);

        // Resolve supplier address — may be a JSON object from supplier_details
        const supplierDetails = data.supplier_details || data.supplierDetails || {};
        let resolvedAddress = data.supplierAddress || data.supplier_address || "";
        if (!resolvedAddress && supplierDetails.address) {
          resolvedAddress =
            typeof supplierDetails.address === "object"
              ? supplierDetails.address.full_address || supplierDetails.address.fullAddress || ""
              : supplierDetails.address;
        }
        if (typeof resolvedAddress === "object") {
          resolvedAddress = resolvedAddress.full_address || resolvedAddress.fullAddress || "";
        }

        // Map backend fields to form model (handle both camelCase and snake_case)
        setPurchaseOrder((prev) => ({
          ...prev,
          poNumber: data.poNumber || data.po_number || prev.poNumber,
          supplierName: data.supplierName || data.supplier_name || "",
          supplierEmail: data.supplierEmail || data.supplier_email || supplierDetails.email || "",
          supplierPhone: data.supplierPhone || data.supplier_phone || supplierDetails.phone || "",
          supplierAddress: resolvedAddress,
          poDate: toDateInput(data.poDate || data.po_date) || prev.poDate,
          expectedDeliveryDate: toDateInput(data.expectedDeliveryDate || data.expected_delivery_date) || "",
          status: data.status || "draft",
          stockStatus: data.stockStatus || data.stock_status || "retain",
          currency: data.currency || prev.currency,
          supplierContactName:
            data.supplierContactName || data.supplier_contact_name || supplierDetails.contact_name || "",
          supplierContactEmail:
            data.supplierContactEmail ||
            data.supplier_contact_email ||
            supplierDetails.contact_email ||
            data.supplierEmail ||
            data.supplier_email ||
            "",
          supplierContactPhone:
            data.supplierContactPhone ||
            data.supplier_contact_phone ||
            supplierDetails.contact_phone ||
            data.supplierPhone ||
            data.supplier_phone ||
            "",
          exchangeRate: data.exchangeRate || data.exchange_rate || null,
          items: Array.isArray(data.items)
            ? data.items.map((it) => ({
                id: it.id,
                productId: it.product_id || it.productId,
                productType: it.name || "",
                name: it.name || "",
                grade: "",
                thickness: "",
                size: "",
                finish: "",
                specification: it.specifications || it.specification || "",
                quantity: it.quantity || 0,
                rate: it.rate || 0,
                amount: it.amount || 0,
                vatRate: it.vat_rate || it.vatRate || 0,
                vatAmount: it.vat_amount || it.vatAmount || 0,
                isDropship: it.is_dropship || it.isDropship || false,
                linkedInvoiceItemId: it.linked_invoice_item_id || it.linkedInvoiceItemId || null,
                // Phase 4: Stock-In Enhancement fields
                lineStockStatus: it.lineStockStatus || it.line_stock_status || "PENDING",
                expectedWeightKg: it.expectedWeightKg || it.expected_weight_kg || null,
                grnId: it.grnId || it.grn_id || null,
                grnNumber: it.grnNumber || it.grn_number || null,
                receivedQty: it.receivedQty || it.received_qty || null,
                receivedWeightKg: it.receivedWeightKg || it.received_weight_kg || null,
              }))
            : prev.items,
          subtotal: data.subtotal || 0,
          vatAmount: data.vatAmount || data.tax_amount || data.taxAmount || 0,
          total: data.total || 0,
          notes: data.notes || "",
          terms: data.terms || "",
          paymentTerms: data.paymentTerms || data.payment_terms || prev.paymentTerms,
          dueDate: toDateInput(data.dueDate || data.due_date) || "",
        }));

        // Load existing payments
        if (data.payments && Array.isArray(data.payments)) {
          setPayments(data.payments);
          updatePaymentStatus(data.payments, data.total || 0);
        }

        // Set warehouse if available (handle both camelCase and snake_case)
        const warehouseId = data.warehouseId || data.warehouse_id;
        if (warehouseId) {
          setSelectedWarehouse(warehouseId.toString());
        }
      } catch (_e) {
        notificationService.error("Failed to load purchase order");
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [id, toDateInput, updatePaymentStatus]);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const response = await productService.getProducts();
      const products = response?.products || [];
      setAvailableProducts(products);
    } catch (_error) {
      // Fallback to static product types if service fails
      setAvailableProducts(PRODUCT_TYPES.map((type) => ({ id: type, name: type, category: type })));
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      // Try to fetch real warehouses from API first
      const response = await purchaseOrderService.getWarehouses();
      const apiWarehouses = response?.warehouses || response?.data || response;

      if (apiWarehouses && Array.isArray(apiWarehouses) && apiWarehouses.length > 0) {
        setWarehouses(apiWarehouses.filter((w) => w.isActive !== false));
        return;
      }
    } catch (_error) {
      // Try to seed warehouses if they don&apos;t exist
      try {
        await purchaseOrderService.seedWarehouses();
        notificationService.success("Warehouses initialized successfully. Please try again.");
        return;
      } catch (_seedError) {
        // Silently ignore seed failure
      }
    }

    // Fallback to sample warehouse data if API fails
    const sampleWarehouses = [
      {
        id: "WH-MAIN",
        name: "Main Warehouse",
        city: "Sharjah",
        isActive: true,
      },
      {
        id: "WH-DBX",
        name: "Dubai Branch Warehouse",
        city: "Dubai",
        isActive: true,
      },
      {
        id: "WH-AUH",
        name: "Abu Dhabi Warehouse",
        city: "Abu Dhabi",
        isActive: true,
      },
    ];
    setWarehouses(sampleWarehouses.filter((w) => w.isActive));
    notificationService.warning("Using offline warehouse data. Some features may not work properly.");
  }, []);

  // Fetch import containers for procurement channel selection
  const fetchImportContainers = useCallback(async () => {
    try {
      const response = await importContainerService.getContainers({
        status: "PENDING", // Only show containers that can receive goods
        limit: 50,
      });
      const containers = response?.containers || response?.data || response || [];
      setImportContainers(Array.isArray(containers) ? containers : []);
    } catch (error) {
      console.error("Failed to fetch import containers:", error);
      setImportContainers([]);
    }
  }, []);

  // Fetch available products, warehouses, and import containers
  useEffect(() => {
    fetchAvailableProducts();
    fetchWarehouses();
    fetchImportContainers();
  }, [fetchAvailableProducts, fetchImportContainers, fetchWarehouses]);

  // Get next PO number from server (only for new purchase orders)
  const { data: nextPOData } = useApiData(
    () => purchaseOrderService.getNextNumber(),
    [],
    !id // Only fetch when creating new PO (not editing)
  );

  // Update PO number when server data is available
  useEffect(() => {
    if (nextPOData?.nextPoNumber && !id) {
      setPurchaseOrder((prev) => ({
        ...prev,
        poNumber: nextPOData.nextPoNumber,
      }));
    }
  }, [nextPOData, id]);

  // Try to map existing PO supplier to a supplier record by name (best-effort)
  useEffect(() => {
    const list = suppliersData?.suppliers || [];
    if (list.length && purchaseOrder.supplierName && !selectedSupplierId) {
      const match = list.find((s) => s.name && s.name.toLowerCase() === purchaseOrder.supplierName.toLowerCase());
      if (match) setSelectedSupplierId(String(match.id));
    }
  }, [suppliersData, purchaseOrder.supplierName, selectedSupplierId]);

  const handleSupplierSelect = (supplierId) => {
    const suppliersList = suppliersData?.suppliers || [];
    const found = suppliersList.find((s) => String(s.id) === String(supplierId));
    if (!found) {
      setPurchaseOrder((prev) => ({
        ...prev,
        supplierName: "",
        supplierEmail: "",
        supplierPhone: "",
        supplierAddress: "",
      }));
      return;
    }
    setPurchaseOrder((prev) => ({
      ...prev,
      supplierName: found.name || "",
      supplierEmail: found.email || "",
      supplierPhone: found.phone || "",
      supplierAddress: found.address || found.company || "",
      terms: found.paymentTerms || prev.terms || "",
      currency: found.defaultCurrency || prev.currency || "AED",
      supplierContactName: found.contactName || "",
      supplierContactEmail: found.contactEmail || found.email || "",
      supplierContactPhone: found.contactPhone || found.phone || "",
    }));
  };

  // Helper function to extract thickness from product specs or size string
  const getThickness = (product) => {
    try {
      const cat = (product?.category || "").toString().toLowerCase();
      const isPipe = /pipe/.test(cat);
      const specThk = product?.specifications?.thickness || product?.specifications?.Thickness;
      if (specThk && String(specThk).trim()) return String(specThk).trim();
      if (isPipe) return ""; // avoid deriving thickness from pipe size
      const sizeStr = product?.size ? String(product.size) : "";
      const mmMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(mm)\b/i);
      if (mmMatch) return `${mmMatch[1]}mm`;
      const xParts = sizeStr
        .split(/x|X|\*/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (xParts.length >= 2) {
        const last = xParts[xParts.length - 1];
        const numMatch = last.match(/\d+(?:\.\d+)?/);
        if (numMatch) return `${numMatch[0]}mm`;
      }
    } catch (_err) {
      // Silently ignore parsing error
    }
    return "";
  };

  const handleProductSelect = (index, selectedProduct) => {
    // Accept either a product object or a name string (backward compatibility)
    const product =
      typeof selectedProduct === "object" && selectedProduct !== null
        ? selectedProduct
        : availableProducts.find((p) => p.id === selectedProduct || p.name === selectedProduct);

    if (product && typeof product === "object") {
      const updatedItems = [...purchaseOrder.items];

      // Try multiple possible field names for finish and thickness
      const rawFinish = product.finish || product.surfaceFinish || product.finishType || "";

      // Match finish with predefined FINISHES options (case-insensitive)
      const finish = (() => {
        if (!rawFinish) return "";
        const rawFinishLower = rawFinish.toLowerCase();
        const matchedFinish = FINISHES.find((f) => f.toLowerCase() === rawFinishLower);
        return matchedFinish || rawFinish; // Use matched finish or original if no match
      })();

      const thickness = product.thickness || product.thick || getThickness(product);

      const productDisplayName = getProductDisplayName(product);

      // Determine quantityUom from product's primary_uom or fallback to category detection
      const primaryUom = (product.primaryUom || product.primary_uom || "").toUpperCase();
      let quantityUom;
      if (primaryUom === "MT" || primaryUom === "KG") {
        quantityUom = primaryUom;
      } else {
        const category = (product.category || "").toLowerCase();
        const isCoil = category.includes("coil");
        quantityUom = isCoil ? "MT" : "PCS";
      }

      // Get pricing basis and unit weight from product
      const pricingBasis = product.pricingBasis || product.pricing_basis || "PER_MT";
      const unitWeightKg = product.unitWeightKg || product.unit_weight_kg || null;

      // Flag if weight is missing for weight-based pricing
      const missingWeightWarning =
        (pricingBasis === "PER_MT" || pricingBasis === "PER_KG") && quantityUom === "PCS" && !unitWeightKg;

      const quantity = updatedItems[index].quantity || 0;
      const rate = product.sellingPrice || product.purchasePrice || product.price || 0;

      // Calculate theoretical weight
      let theoreticalWeightKg = null;
      if (quantityUom === "MT") {
        theoreticalWeightKg = quantity * 1000;
      } else if (quantityUom === "KG") {
        theoreticalWeightKg = quantity;
      } else if (unitWeightKg) {
        theoreticalWeightKg = quantity * unitWeightKg;
      }

      // Calculate amount using pricing-aware function
      const amount = calculateItemAmount(quantity, rate, pricingBasis, unitWeightKg, quantityUom);

      updatedItems[index] = {
        ...updatedItems[index],
        productType: productDisplayName,
        name: productDisplayName,
        productId: product.id,
        grade: product.grade || product.steelGrade || "",
        finish,
        size: product.size || product.dimensions || "",
        thickness,
        specification: product.specifications || product.description || "",
        hsnCode: product.hsnCode || "",
        unit: product.unit || "kg",
        rate,
        supplyType: updatedItems[index].supplyType || "standard",
        vatRate: updatedItems[index].vatRate || 5,
        amount,
        // Pricing & Commercial Fields
        pricingBasis,
        unitWeightKg,
        quantityUom,
        theoreticalWeightKg,
        missingWeightWarning,
      };

      // Recalculate totals with item-level VAT rates
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = updatedItems.reduce((sum, item) => {
        const itemAmount = item.amount || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemAmount * vatRate) / 100;
      }, 0);
      const total = subtotal + vatAmount;

      setPurchaseOrder((prev) => ({
        ...prev,
        items: updatedItems,
        subtotal,
        vatAmount,
        total,
      }));

      // Clear search input for this row
      setSearchInputs((prev) => ({ ...prev, [index]: "" }));
    }
  };

  const searchTimerRef = useRef(null);

  const handleSearchInputChange = useCallback((index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Update the item name immediately for responsive typing
    setPurchaseOrder((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        name: value,
        productId: null, // Clear product ID when typing custom name
      };
      return {
        ...prev,
        items: newItems,
      };
    });

    // Debounced search
    clearTimeout(searchTimerRef.current);
    const term = (value || "").trim();
    try {
      searchTimerRef.current = setTimeout(async () => {
        if (!term) {
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
          return;
        }
        try {
          const resp = await productService.getProducts({
            search: term,
            limit: 20,
          });
          setSearchInputs((prev) => ({
            ...prev,
            __results: resp?.products || [],
          }));
        } catch (_err) {
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
        }
      }, 300);
    } catch (_err) {
      // Silently ignore search error
    }
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-update VAT rate based on supply type (matching Invoice form)
    if (field === "supplyType") {
      if (value === "standard") {
        updatedItems[index].vatRate = 5;
      } else if (value === "zero_rated" || value === "exempt") {
        updatedItems[index].vatRate = 0;
      }
    }

    // Auto-update expected margin based on procurement channel
    if (field === "procurementChannel") {
      if (value === "IMPORTED") {
        updatedItems[index].expectedMarginPct = 18; // Default 18% for imports
      } else {
        updatedItems[index].expectedMarginPct = 8; // Default 8% for local
        updatedItems[index].importContainerId = null; // Clear container reference
      }
    }

    // Calculate amount when quantity, rate, discount, unitWeightKg, or pricingBasis changes
    if (
      field === "quantity" ||
      field === "rate" ||
      field === "discount" ||
      field === "discountType" ||
      field === "vatRate" ||
      field === "supplyType" ||
      field === "unitWeightKg" ||
      field === "pricingBasis"
    ) {
      const item = updatedItems[index];
      const quantity = field === "quantity" ? parseFloat(value) || 0 : item.quantity || 0;
      const rate = field === "rate" ? parseFloat(value) || 0 : item.rate || 0;
      const discount = field === "discount" ? parseFloat(value) || 0 : item.discount || 0;
      const discountType = field === "discountType" ? value : item.discountType || "amount";
      const unitWeightKg = field === "unitWeightKg" ? parseFloat(value) || null : item.unitWeightKg;
      const pricingBasis = field === "pricingBasis" ? value : item.pricingBasis || "PER_MT";
      const quantityUom = item.quantityUom || "PCS";

      // Calculate gross amount using pricing-aware function
      const grossAmount = calculateItemAmount(quantity, rate, pricingBasis, unitWeightKg, quantityUom);

      // Apply item-level discount
      const discountAmount = discountType === "percentage" ? (grossAmount * discount) / 100 : discount;

      // Net amount after discount (before VAT)
      updatedItems[index].amount = grossAmount - discountAmount;

      // Update theoretical weight when quantity or unitWeightKg changes
      if (field === "quantity" || field === "unitWeightKg") {
        if (quantityUom === "MT") {
          updatedItems[index].theoreticalWeightKg = quantity * 1000;
        } else if (quantityUom === "KG") {
          updatedItems[index].theoreticalWeightKg = quantity;
        } else if (unitWeightKg) {
          updatedItems[index].theoreticalWeightKg = quantity * unitWeightKg;
        }
      }

      // Update missing weight warning
      if (field === "unitWeightKg" || field === "pricingBasis") {
        updatedItems[index].missingWeightWarning =
          (pricingBasis === "PER_MT" || pricingBasis === "PER_KG") && quantityUom === "PCS" && !unitWeightKg;
      }
    }

    setPurchaseOrder((prev) => {
      const newPO = {
        ...prev,
        items: updatedItems,
      };

      // Recalculate totals with order-level discount and charges
      const itemsSubtotal = calculateSubtotal(updatedItems);

      // Apply order-level discount
      const orderDiscountAmount =
        prev.discountType === "percentage"
          ? (itemsSubtotal * (prev.discountPercentage || 0)) / 100
          : prev.discountAmount || 0;

      const subtotalAfterDiscount = itemsSubtotal - orderDiscountAmount;

      // Calculate VAT per item (item-level VAT rates)
      const vatAmount = updatedItems.reduce((sum, item) => {
        const itemAmount = item.amount || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemAmount * vatRate) / 100;
      }, 0);

      // Add all charges
      const allCharges =
        (parseFloat(prev.freightCharges) || 0) +
        (parseFloat(prev.shippingCharges) || 0) +
        (parseFloat(prev.handlingCharges) || 0) +
        (parseFloat(prev.otherCharges) || 0);

      const total = subtotalAfterDiscount + vatAmount + allCharges;

      return {
        ...newPO,
        subtotal: itemsSubtotal,
        vatAmount,
        total,
      };
    });
  };

  const addItem = () => {
    setPurchaseOrder((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productType: "",
          name: "",
          productId: null,
          grade: "",
          thickness: "",
          size: "",
          finish: "",
          specification: "",
          itemDescription: "",
          hsnCode: "",
          unit: "kg",
          quantity: 0,
          rate: 0,
          discountType: "amount",
          discount: 0,
          vatRate: 5,
          supplyType: "standard",
          amount: 0,
          // Procurement channel fields (v2)
          procurementChannel: "LOCAL",
          importContainerId: null,
          expectedMarginPct: 8, // Default 8% for LOCAL, 18% for IMPORTED
          // Pricing & Commercial Fields
          pricingBasis: "PER_MT",
          unitWeightKg: null,
          quantityUom: "PCS",
          theoreticalWeightKg: null,
          missingWeightWarning: false,
          // Phase 4: Stock-In Enhancements - Line-level fields
          lineStockStatus: "PENDING", // PENDING, PARTIAL, RECEIVED - supports partial receipts
          expectedWeightKg: null, // Expected weight at PO time for variance tracking
          // GRN linkage fields (populated when GRN is created)
          grnId: null,
          grnNumber: null,
          receivedQty: null, // Quantity actually received via GRN
          receivedWeightKg: null, // Actual weight received via GRN
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (purchaseOrder.items.length > 1) {
      const updatedItems = purchaseOrder.items.filter((_, i) => i !== index);
      setPurchaseOrder((prev) => {
        const newPO = {
          ...prev,
          items: updatedItems,
        };

        // Recalculate totals
        const subtotal = calculateSubtotal(updatedItems);
        const vatAmount = subtotal * 0.05; // 5% TRN
        const total = subtotal + vatAmount;

        return {
          ...newPO,
          subtotal,
          vatAmount,
          total,
        };
      });
    }
  };

  const handleSubmit = async (status = "draft") => {
    // STEP 1: Validate all required fields
    const submitValidationErrors = [];
    const invalidFieldsSet = new Set();

    const poData = { ...purchaseOrder, status };

    // Supplier validation
    if (!poData.supplierName || poData.supplierName.trim() === "") {
      submitValidationErrors.push("Supplier name is required");
      invalidFieldsSet.add("supplierName");
    }

    // Warehouse validation
    if (!selectedWarehouse) {
      submitValidationErrors.push("Please select a destination warehouse");
      invalidFieldsSet.add("warehouse");
    }

    // Items validation
    if (!poData.items || poData.items.length === 0) {
      submitValidationErrors.push("At least one item is required");
    } else {
      let hasValidItem = false;
      poData.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === "") {
          submitValidationErrors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        } else if (item.quantity > 0) {
          hasValidItem = true;
        }

        if (!item.quantity || item.quantity <= 0) {
          submitValidationErrors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }

        if (!item.rate || item.rate <= 0) {
          submitValidationErrors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }

        // CRITICAL: Block save when unit weight is missing for weight-based pricing
        if (item.missingWeightWarning) {
          submitValidationErrors.push(
            `Item ${index + 1}: Unit weight is missing for "${item.name}". This product has weight-based pricing (${item.pricingBasis}) but no unit weight. Please contact admin to add unit weight to the product master.`
          );
          invalidFieldsSet.add(`item.${index}.unitWeight`);
        }
      });

      if (!hasValidItem) {
        submitValidationErrors.push("At least one item must have a valid quantity");
      }
    }

    // If errors exist, show them and STOP
    if (submitValidationErrors.length > 0) {
      setValidationErrors(submitValidationErrors);
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
      // Get warehouse details
      const selectedWarehouseDetails = warehouses.find((w) => w.id?.toString() === selectedWarehouse);

      // If using sample data, remove warehouse_id to avoid FK constraint error
      const useApiWarehouse = selectedWarehouseDetails?.id && !selectedWarehouseDetails.id.toString().startsWith("WH-");

      // Transform data to match backend expectations (snake_case)
      const transformedData = {
        supplier_id: selectedSupplierId ? parseInt(selectedSupplierId, 10) : null, // FK to suppliers table
        po_number: poData.poNumber,
        supplier_name: poData.supplierName,
        supplier_email: poData.supplierEmail || null,
        supplier_phone: poData.supplierPhone || null,
        supplier_address: poData.supplierAddress || null,
        supplier_trn: poData.supplierTRN || null,
        po_date: poData.poDate,
        expected_delivery_date: poData.expectedDeliveryDate || null,
        grace_period_days: poData.gracePeriodDays || 5, // Phase 4: Grace period for on-time delivery
        status: poData.status,
        stock_status: poData.stockStatus,
        currency: poData.currency || "AED",
        exchange_rate: poData.exchangeRate || null, // Phase 4: Exchange rate for multi-currency POs
        payment_terms: poData.paymentTerms || poData.terms || null,
        due_date: poData.dueDate || null,
        supplier_contact_name: poData.supplierContactName || null,
        supplier_contact_email: poData.supplierContactEmail || null,
        supplier_contact_phone: poData.supplierContactPhone || null,
        // Buyer fields
        buyer_name: poData.buyerName || null,
        buyer_email: poData.buyerEmail || null,
        buyer_phone: poData.buyerPhone || null,
        buyer_department: poData.buyerDepartment || null,
        // Trade terms
        incoterms: poData.incoterms || null,
        // Approval workflow
        approval_status: poData.approvalStatus || "pending",
        // Additional charges
        freight_charges: parseFloat(poData.freightCharges) || 0,
        shipping_charges: parseFloat(poData.shippingCharges) || 0,
        handling_charges: parseFloat(poData.handlingCharges) || 0,
        other_charges: parseFloat(poData.otherCharges) || 0,
        // Order-level discount
        discount_type: poData.discountType || "amount",
        discount_percentage: parseFloat(poData.discountPercentage) || 0,
        discount_amount: parseFloat(poData.discountAmount) || 0,
        // Only include warehouse_id if it's a real warehouse from API
        ...(useApiWarehouse ? { warehouse_id: parseInt(selectedWarehouse, 10) } : {}),
        warehouse_name: selectedWarehouseDetails
          ? `${selectedWarehouseDetails.name} (${selectedWarehouseDetails.city})`
          : "",
        notes: poData.notes || null,
        terms: poData.terms || null,
        subtotal: parseFloat(poData.subtotal) || 0,
        vat_amount: parseFloat(poData.vatAmount) || 0,
        total: parseFloat(poData.total) || 0,
        // Include payment data
        payments: payments.map((payment) => ({
          id: payment.id,
          payment_date: payment.paymentDate,
          amount: parseFloat(payment.amount) || 0,
          payment_method: payment.paymentMethod,
          reference_number: payment.referenceNumber || null,
          notes: payment.notes || null,
          voided: payment.voided || false,
          voided_at: payment.voidedAt || null,
          created_at: payment.createdAt,
        })),
        payment_status: paymentStatus,
        // Transform items array
        items: poData.items.map((item) => ({
          product_type: item.productType || item.name || "",
          name: item.name || item.productType || "",
          grade: item.grade || null,
          thickness: item.thickness || null,
          size: item.size || null,
          finish: item.finish || null,
          specification: item.specifications || null,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0,
          vat_rate: parseFloat(item.vatRate) || 5,
          unit: item.unit || "kg",
          // Pricing & Commercial Fields
          pricing_basis: item.pricingBasis || "PER_MT",
          unit_weight_kg: item.unitWeightKg ? parseFloat(item.unitWeightKg) : null,
          quantity_uom: item.quantityUom || "PCS",
          theoretical_weight_kg: item.theoreticalWeightKg ? parseFloat(item.theoreticalWeightKg) : null,
          // Phase 4: Stock-In Enhancement fields
          line_stock_status: item.lineStockStatus || "PENDING",
          expected_weight_kg: item.expectedWeightKg ? parseFloat(item.expectedWeightKg) : null,
          grn_id: item.grnId || null,
          grn_number: item.grnNumber || null,
          received_qty: item.receivedQty ? parseFloat(item.receivedQty) : null,
          received_weight_kg: item.receivedWeightKg ? parseFloat(item.receivedWeightKg) : null,
        })),
      };

      let savedPO;
      if (id) {
        // Update existing purchase order
        savedPO = await purchaseOrderService.update(id, transformedData);
      } else {
        // Create new purchase order
        savedPO = await purchaseOrderService.create(transformedData);
      }

      // If stock status is received, trigger inventory creation via the stock-status endpoint
      if (poData.stockStatus === "received") {
        try {
          const stockStatusResponse = await (await import("../services/api")).apiClient.patch(
            `/purchase-orders/${savedPO.id}/stock-status`,
            {
              stock_status: "received",
            }
          );

          if (stockStatusResponse.inventoryCreated) {
            notificationService.success("Inventory items created successfully!");
          }
        } catch (_stockError) {
          notificationService.warning(
            "Purchase order saved but inventory creation failed. Please check the inventory manually."
          );
        }
      }

      // Show success notification
      const action = id ? "updated" : "created";
      notificationService.success(`Purchase order ${action} successfully!`);

      navigate("/app/purchase-orders");
    } catch (error) {
      // Extract more detailed error message
      let errorMessage = "Unknown error";
      const errorData = error.response?.data;

      // Check for validation errors array
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Join all error messages
        errorMessage = errorData.errors
          .map((err) => (typeof err === "string" ? err : err.message || err.msg || JSON.stringify(err)))
          .join(", ");

        // Show each error as a separate notification
        errorData.errors.forEach((err) => {
          const msg = typeof err === "string" ? err : err.message || err.msg || JSON.stringify(err);
          notificationService.error(msg);
        });
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific warehouse foreign key error
      if (errorData?.message?.includes("Warehouse with ID")) {
        notificationService.error(
          "Database setup required: Warehouses not initialized. " +
            "Please start PostgreSQL service and refresh the page to auto-initialize warehouses."
        );
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`} data-testid="purchase-order-form">
      {/* ==================== STICKY HEADER ==================== */}
      <header
        className={`sticky top-0 z-20 shrink-0 backdrop-blur-md border-b ${
          isDarkMode ? "bg-gray-900/92 border-gray-700" : "bg-white/92 border-gray-200"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/app/purchase-orders")}
              className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Back to purchase orders"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-lg md:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {id ? "Edit" : "Create"} Purchase Order
              </h1>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {purchaseOrder.poNumber || "New PO"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Pill */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                purchaseOrder.status === "draft"
                  ? "bg-gray-500/20 text-gray-400"
                  : purchaseOrder.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : purchaseOrder.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {purchaseOrder.status?.toUpperCase() || "DRAFT"}
            </span>
            {hasDropshipItems && (
              <span className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                DROPSHIP
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowFormSettings(!showFormSettings)}
              className={BTN_SMALL(isDarkMode)}
              aria-label="Form settings"
              title="Form Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <FormSettingsPanel
              isOpen={showFormSettings}
              onClose={() => setShowFormSettings(false)}
              preferences={formPreferences}
              onPreferenceChange={(key, value) => {
                setFormPreferences((prev) => ({ ...prev, [key]: value }));
              }}
            />

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={BTN_CLASSES(isDarkMode)}
              title="Preview Purchase Order"
            >
              <Eye size={16} className="inline mr-1.5" />
              Preview
            </button>
            {canReceiveToWarehouse && (
              <button
                type="button"
                onClick={openReceiveToWarehouse}
                className="bg-amber-600 border-transparent text-white font-bold hover:bg-amber-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
                title="Receive dropship goods to warehouse after customer rejection"
              >
                <Warehouse size={16} className="inline mr-1.5" />
                Receive to Warehouse
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={isSaving}
              className={`${BTN_CLASSES(isDarkMode)} ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
              data-testid="save-draft"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("pending")}
              disabled={isSaving}
              className={`${BTN_PRIMARY} ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
              data-testid="submit-po"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
              ) : (
                <Save size={16} className="inline mr-1.5" />
              )}
              Submit PO
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div
            id="validation-errors-alert"
            className={`mb-4 p-4 rounded-2xl border-2 ${
              isDarkMode ? "bg-red-900/20 border-red-600 text-red-200" : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`} size={20} />
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {validationErrors.map((error, _index) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setValidationErrors([]);
                    setInvalidFields(new Set());
                  }}
                  className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    isDarkMode ? "bg-red-800 hover:bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8+4 GRID LAYOUT ==================== */}
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT COLUMN - Main Form (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* ===== PO DETAILS + SUPPLIER (Consolidated Card) ===== */}
            <div className={CARD_CLASSES(isDarkMode)}>
              <div
                className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Document Details
              </div>
              <div className="grid grid-cols-12 gap-3">
                {/* Row 1: PO Number, Date, Expected Delivery */}
                <div className="col-span-12 sm:col-span-3">
                  <label htmlFor="po-number" className={LABEL_CLASSES(isDarkMode)}>
                    PO Number
                  </label>
                  <input
                    id="po-number"
                    type="text"
                    value={purchaseOrder.poNumber}
                    onChange={(e) => handleInputChange("poNumber", e.target.value)}
                    placeholder="PO-2024-001"
                    className={INPUT_CLASSES(isDarkMode)}
                    data-testid="po-number"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="po-date" className={LABEL_CLASSES(isDarkMode)}>
                    PO Date
                  </label>
                  <input
                    id="po-date"
                    type="date"
                    value={purchaseOrder.poDate}
                    onChange={(e) => handleInputChange("poDate", e.target.value)}
                    className={INPUT_CLASSES(isDarkMode)}
                    data-testid="po-date"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="expected-delivery-date" className={LABEL_CLASSES(isDarkMode)}>
                    Expected Delivery
                  </label>
                  <input
                    id="expected-delivery-date"
                    type="date"
                    value={purchaseOrder.expectedDeliveryDate}
                    onChange={(e) => handleInputChange("expectedDeliveryDate", e.target.value)}
                    className={INPUT_CLASSES(isDarkMode)}
                    data-testid="expected-delivery-date"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Warehouse"
                    value={selectedWarehouse || "none"}
                    onValueChange={(value) => setSelectedWarehouse(value === "none" ? "" : value)}
                    required={true}
                    validationState={invalidFields.has("warehouse") ? "invalid" : null}
                    data-testid="warehouse-select"
                  >
                    <SelectItem value="none">Select Warehouse</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name} - {warehouse.city}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>

                {/* Divider */}
                <div className="col-span-12">
                  <div className={DIVIDER_CLASSES(isDarkMode)} />
                </div>

                {/* Row 2: Supplier */}
                <div className="col-span-12 sm:col-span-6">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <FormSelect
                        label="Supplier"
                        value={selectedSupplierId || "none"}
                        onValueChange={(value) => {
                          const supplierId = value === "none" ? "" : value;
                          setSelectedSupplierId(supplierId);
                          handleSupplierSelect(supplierId);
                        }}
                        disabled={loadingSuppliers}
                        required={true}
                        validationState={invalidFields.has("supplier") ? "invalid" : null}
                        data-testid="supplier-select"
                      >
                        <SelectItem value="none">Select Supplier</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </FormSelect>
                    </div>
                    {selectedSupplierId && (
                      <button
                        type="button"
                        onClick={() => setBuyerDrawerOpen(true)}
                        className={BTN_SMALL(isDarkMode)}
                        title="Edit Supplier Details"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {purchaseOrder.supplierTRN && (
                    <div className={`text-xs mt-1 font-mono ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      TRN: {purchaseOrder.supplierTRN}
                    </div>
                  )}
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Stock Status"
                    value={purchaseOrder.stockStatus}
                    onValueChange={(value) => handleInputChange("stockStatus", value)}
                  >
                    <SelectItem value="retain">Retain (To be received)</SelectItem>
                    <SelectItem value="transit">In Transit</SelectItem>
                    {hasDropshipItems ? (
                      <>
                        <SelectItem value="received">Delivered to Customer (Dropship)</SelectItem>
                        <SelectItem value="in_warehouse">Received to Warehouse (Rejection)</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="received">Received at Warehouse</SelectItem>
                    )}
                  </FormSelect>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormSelect
                    label="Incoterms"
                    value={purchaseOrder.incoterms || "none"}
                    onValueChange={(value) => handleInputChange("incoterms", value === "none" ? "" : value)}
                  >
                    <SelectItem value="none">Select Incoterm</SelectItem>
                    <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                    <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                    <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                    <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                    <SelectItem value="DAP">DAP - Delivered at Place</SelectItem>
                    <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                    <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
                    <SelectItem value="CIP">CIP - Carriage and Insurance Paid To</SelectItem>
                  </FormSelect>
                </div>
              </div>
            </div>

            {/* ===== LINE ITEMS SECTION ===== */}
            <div className={CARD_CLASSES(isDarkMode)}>
              <div className="flex justify-between items-center mb-3">
                <div
                  className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Line Items
                </div>
                <button type="button" onClick={addItem} className={BTN_PRIMARY} data-testid="add-item">
                  <Plus size={16} className="inline mr-1" />
                  Add Item
                </button>
              </div>

              {/* Quick Add Speed Buttons */}
              {formPreferences.showSpeedButtons && (
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Quick Add (Pinned & Top Products)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sortedProducts.slice(0, 8).map((product) => {
                      const isPinned = pinnedProductIds.includes(product.id);
                      return (
                        <div key={product.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleQuickAddItem(product)}
                            className={`w-full px-2.5 py-2 pr-7 rounded-md border text-xs font-medium transition-all truncate text-left ${
                              isPinned
                                ? isDarkMode
                                  ? "border-teal-700 bg-teal-900/40 text-teal-300 hover:bg-teal-900/60"
                                  : "border-teal-600 bg-teal-100 text-teal-800 hover:bg-teal-200"
                                : isDarkMode
                                  ? "border-gray-700 bg-gray-900 text-gray-400 hover:border-teal-500"
                                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                            }`}
                            title={
                              product.displayName ||
                              product.display_name ||
                              product.name ||
                              product.description ||
                              product.sku ||
                              "Product"
                            }
                          >
                            {product.uniqueName ||
                              product.unique_name ||
                              product.name ||
                              product.description ||
                              product.sku ||
                              "Product"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(e, product.id)}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all ${
                              isPinned
                                ? isDarkMode
                                  ? "text-teal-300"
                                  : "text-teal-700"
                                : isDarkMode
                                  ? "text-gray-500 hover:text-teal-400"
                                  : "text-gray-400 hover:text-teal-600"
                            }`}
                            title={isPinned ? "Unpin product" : "Pin product"}
                          >
                            {isPinned ? <Pin size={12} fill="currentColor" /> : <Pin size={12} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Desktop Table - preserve existing table structure but remove duplicate */}
              <div className="hidden md:block overflow-x-auto">
                <table
                  className={`min-w-full table-fixed ${isDarkMode ? "divide-gray-600" : "divide-gray-200"}`}
                  data-testid="line-items-table"
                >
                  <thead className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                    <tr>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "18%" }}
                      >
                        Product
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "5%" }}
                      >
                        Qty
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "5%" }}
                      >
                        Unit Wt
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "5%" }}
                      >
                        Exp. Wt
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "8%" }}
                      >
                        Rate
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "8%" }}
                      >
                        Channel
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "8%" }}
                      >
                        Supply Type
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "5%" }}
                      >
                        VAT %
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "8%" }}
                      >
                        Amount
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "7%" }}
                      >
                        Stock
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "8%" }}
                      >
                        GRN
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        style={{ width: "4%" }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {purchaseOrder.items.map((item, index) => (
                      <tr
                        key={item.id || index}
                        data-item-index={index}
                        data-testid={`item-row-${index}`}
                        className={isDarkMode ? "bg-gray-800" : "bg-white"}
                      >
                        <td className="px-2 py-2 align-middle">
                          <Autocomplete
                            options={
                              searchInputs[index]
                                ? searchOptions.length
                                  ? searchOptions
                                  : productOptions
                                : productOptions
                            }
                            value={item.productId ? productOptions.find((p) => p.id === item.productId) : null}
                            inputValue={searchInputs[index] || item.name || ""}
                            onInputChange={(_event, newInputValue) => handleSearchInputChange(index, newInputValue)}
                            onChange={(_event, newValue) => {
                              if (newValue) handleProductSelect(index, newValue);
                            }}
                            placeholder="Search products..."
                            disabled={loading}
                            error={invalidFields.has(`item.${index}.name`)}
                            renderOption={(option) => (
                              <div>
                                <div className="font-medium">
                                  {option.uniqueName ||
                                    option.unique_name ||
                                    option.displayName ||
                                    option.display_name ||
                                    option.name ||
                                    option.description ||
                                    option.sku ||
                                    "Product"}
                                </div>
                                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {option.origin ? `${option.origin} • ` : ""}
                                  {option.subtitle}
                                </div>
                              </div>
                            )}
                            noOptionsText="No products found"
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) => {
                              const allowDecimal = item.quantityUom === "MT" || item.quantityUom === "KG";
                              const val = allowDecimal ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                              handleItemChange(
                                index,
                                "quantity",
                                e.target.value === "" ? "" : Number.isNaN(val) ? "" : val
                              );
                            }}
                            min="0"
                            step={item.quantityUom === "MT" || item.quantityUom === "KG" ? "0.001" : "1"}
                            className={`w-full px-2 py-1.5 text-xs border rounded-md text-right ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} ${invalidFields.has(`item.${index}.quantity`) ? "border-red-500" : ""}`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.unitWeightKg || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitWeightKg",
                                e.target.value === "" ? null : parseFloat(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className={`w-full px-2 py-1.5 text-xs border rounded-md text-right ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} ${item.missingWeightWarning ? "border-red-500" : ""}`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.expectedWeightKg || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "expectedWeightKg",
                                e.target.value === "" ? null : parseFloat(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                            placeholder={(() => {
                              const calcWt = item.theoreticalWeightKg || item.quantity * (item.unitWeightKg || 0);
                              return calcWt ? calcWt.toFixed(2) : "0.00";
                            })()}
                            className={`w-full px-2 py-1.5 text-xs border rounded-md text-right ${isDarkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                          />
                        </td>
                        <td className="px-1 py-2 align-middle">
                          <div
                            className={`flex rounded-md overflow-hidden border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}
                          >
                            <input
                              type="number"
                              value={item.rate || ""}
                              onChange={(e) =>
                                handleItemChange(index, "rate", e.target.value === "" ? "" : parseFloat(e.target.value))
                              }
                              min="0"
                              step="0.01"
                              className={`flex-1 w-full px-2 py-1.5 text-xs border-0 outline-none text-right ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${invalidFields.has(`item.${index}.rate`) ? "border-red-500" : ""}`}
                              style={{ minWidth: 0 }}
                            />
                            <select
                              value={item.pricingBasis || "PER_MT"}
                              onChange={(e) => handleItemChange(index, "pricingBasis", e.target.value)}
                              className={`text-[10px] font-bold px-1.5 border-l cursor-pointer outline-none ${
                                item.pricingBasis === "PER_KG"
                                  ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                                  : item.pricingBasis === "PER_PCS"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700"
                                    : isDarkMode
                                      ? "bg-gray-700 text-gray-400 border-gray-700"
                                      : "bg-gray-50 text-gray-600 border-gray-300"
                              }`}
                            >
                              <option value="PER_MT">/MT</option>
                              <option value="PER_KG">/kg</option>
                              <option value="PER_PCS">/pc</option>
                            </select>
                          </div>
                          {/* PCS-Centric: Show derived cost/piece for MT/KG pricing */}
                          {item.rate > 0 && item.unitWeightKg > 0 && item.pricingBasis !== "PER_PCS" && (
                            <div className={`text-[10px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {item.pricingBasis === "PER_MT"
                                ? `= ${((item.rate / 1000) * item.unitWeightKg).toFixed(2)}/pc`
                                : `= ${(item.rate * item.unitWeightKg).toFixed(2)}/pc`}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <div className="space-y-1">
                            <select
                              value={item.procurementChannel || "LOCAL"}
                              onChange={(e) => handleItemChange(index, "procurementChannel", e.target.value)}
                              className={`w-full px-2 py-1 border rounded-md text-xs ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} ${
                                item.procurementChannel === "IMPORTED"
                                  ? isDarkMode
                                    ? "border-emerald-600"
                                    : "border-emerald-400"
                                  : isDarkMode
                                    ? "border-blue-600"
                                    : "border-blue-400"
                              }`}
                            >
                              <option value="LOCAL">LOCAL</option>
                              <option value="IMPORTED">IMPORTED</option>
                            </select>
                            {item.procurementChannel === "IMPORTED" && (
                              <select
                                value={item.importContainerId || ""}
                                onChange={(e) => handleItemChange(index, "importContainerId", e.target.value || null)}
                                className={`w-full px-2 py-1 border rounded-md text-xs ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                              >
                                <option value="">No container</option>
                                {importContainers.map((container) => (
                                  <option key={container.id} value={container.id}>
                                    {container.containerNumber || `Container #${container.id}`}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <select
                            value={item.supplyType || "standard"}
                            onChange={(e) => handleItemChange(index, "supplyType", e.target.value)}
                            className={`w-full px-2 py-1 border rounded-md text-xs ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          >
                            <option value="standard">Standard (5%)</option>
                            <option value="zero_rated">Zero-Rated (0%)</option>
                            <option value="exempt">Exempt</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.vatRate || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "vatRate",
                                e.target.value === "" ? "" : parseFloat(e.target.value)
                              )
                            }
                            min="0"
                            max="15"
                            step="0.01"
                            placeholder="5.00"
                            className={`w-full px-2 py-1.5 text-xs border rounded-md text-right ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <div
                            className={`font-mono text-xs text-right ${isDarkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {formatCurrency(item.amount)}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <select
                            value={item.lineStockStatus || "PENDING"}
                            onChange={(e) => handleItemChange(index, "lineStockStatus", e.target.value)}
                            className={`w-full px-1 py-1 border rounded-md text-xs ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} ${
                              item.lineStockStatus === "RECEIVED"
                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                                : item.lineStockStatus === "PARTIAL"
                                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700"
                                  : ""
                            }`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="RECEIVED">Received</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          {item.grnNumber ? (
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                              <span className="font-medium text-teal-500">{item.grnNumber}</span>
                              {item.receivedQty && (
                                <div className="text-[10px]">
                                  Rcvd: {item.receivedQty} {item.receivedWeightKg ? `(${item.receivedWeightKg}kg)` : ""}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={purchaseOrder.items.length === 1}
                            className={`hover:text-red-300 ${isDarkMode ? "text-red-400 disabled:text-gray-600" : "text-red-500 disabled:text-gray-400"}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - placeholder for now, keep existing mobile layout logic */}
              <div className="md:hidden text-xs text-center py-4 text-gray-400">
                Mobile view: use desktop for best experience
              </div>

              {/* Inline Totals (visible on left column, quick reference) */}
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex justify-end">
                  <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Subtotal:</span>
                      <span className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {formatCurrency(purchaseOrder.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>VAT (5%):</span>
                      <span className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {formatCurrency(purchaseOrder.vatAmount)}
                      </span>
                    </div>
                    <div className={`h-px my-1 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isDarkMode ? "text-white" : "text-gray-900"}>Total:</span>
                      <span className="text-teal-400 font-mono">{formatCurrency(purchaseOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* END LEFT COLUMN - Close it here, we'll add sidebar next */}
          </div>

          {/* RIGHT COLUMN - Sticky Summary Sidebar (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-[72px] space-y-4">
              {/* Order Summary Card */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div
                  className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Order Summary
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Items</span>
                    <span className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {purchaseOrder.items.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Subtotal</span>
                    <span className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`} data-testid="subtotal">
                      {formatCurrency(purchaseOrder.subtotal)}
                    </span>
                  </div>
                  {(parseFloat(purchaseOrder.freightCharges) > 0 ||
                    parseFloat(purchaseOrder.shippingCharges) > 0 ||
                    parseFloat(purchaseOrder.handlingCharges) > 0 ||
                    parseFloat(purchaseOrder.otherCharges) > 0) && (
                    <div className="flex justify-between text-xs">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Charges</span>
                      <span className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {formatCurrency(
                          (parseFloat(purchaseOrder.freightCharges) || 0) +
                            (parseFloat(purchaseOrder.shippingCharges) || 0) +
                            (parseFloat(purchaseOrder.handlingCharges) || 0) +
                            (parseFloat(purchaseOrder.otherCharges) || 0)
                        )}
                      </span>
                    </div>
                  )}
                  {(parseFloat(purchaseOrder.discountAmount) > 0 ||
                    parseFloat(purchaseOrder.discountPercentage) > 0) && (
                    <div className="flex justify-between text-xs text-green-500">
                      <span>Discount</span>
                      <span className="font-mono">
                        -
                        {formatCurrency(
                          purchaseOrder.discountType === "percentage"
                            ? (purchaseOrder.subtotal * (parseFloat(purchaseOrder.discountPercentage) || 0)) / 100
                            : parseFloat(purchaseOrder.discountAmount) || 0
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>VAT (5%)</span>
                    <span
                      className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      data-testid="vat-amount"
                    >
                      {formatCurrency(purchaseOrder.vatAmount)}
                    </span>
                  </div>
                  <div className={DIVIDER_CLASSES(isDarkMode)} />
                  <div className="flex justify-between font-bold">
                    <span className={isDarkMode ? "text-white" : "text-gray-900"}>Grand Total</span>
                    <span className="text-teal-400 font-mono text-lg" data-testid="total">
                      {formatCurrency(purchaseOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status Card */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div className="flex justify-between items-center mb-3">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Payment
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                      paymentStatus === "paid"
                        ? "bg-green-500/20 text-green-400"
                        : paymentStatus === "partially_paid"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {paymentStatus === "paid" ? "Paid" : paymentStatus === "partially_paid" ? "Partial" : "Unpaid"}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Paid</span>
                    <span className="font-mono text-green-500">
                      {formatCurrency(
                        payments.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Outstanding</span>
                    <span className="font-mono text-red-400">
                      {formatCurrency(
                        Math.max(
                          0,
                          purchaseOrder.total -
                            payments.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                        )
                      )}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className={`w-full rounded-full h-1.5 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (payments.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / purchaseOrder.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setChargesDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <DollarSign size={16} className="opacity-60" />
                    Edit Charges & Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <Truck size={16} className="opacity-60" />
                    Edit Delivery Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotesDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <FileText size={16} className="opacity-60" />
                    Add Notes & Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyerDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <User size={16} className="opacity-60" />
                    Edit Buyer Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <CreditCard size={16} className="opacity-60" />
                    View Payments
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <ClipboardCheck size={16} className="opacity-60" />
                    Approval Workflow
                  </button>
                  {canReceiveToWarehouse && (
                    <button
                      type="button"
                      onClick={openReceiveToWarehouse}
                      className="flex items-center gap-2 py-2 px-2.5 bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 rounded-md cursor-pointer text-xs font-semibold transition-colors w-full"
                    >
                      <Warehouse size={16} />
                      Receive to Warehouse (Rejection)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== DRAWERS ==================== */}

      {/* Charges & Discount Drawer */}

      <button
        type="button"
        className={`${DRAWER_OVERLAY} ${chargesDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"} border-0`}
        onClick={() => setChargesDrawerOpen(false)}
        aria-label="Close charges drawer"
      />
      <div className={`${DRAWER_PANEL(isDarkMode)} ${chargesDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          <div className={DRAWER_HEADER(isDarkMode)}>
            <div>
              <div className="text-sm font-extrabold">Charges & Discount</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Add freight, shipping, handling, or discounts
              </div>
            </div>
            <button type="button" onClick={() => setChargesDrawerOpen(false)} className={BTN_SMALL(isDarkMode)}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {/* Additional Charges */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="freight-charges" className={LABEL_CLASSES(isDarkMode)}>
                  Freight Charges
                </label>
                <input
                  id="freight-charges"
                  type="number"
                  step="0.01"
                  value={purchaseOrder.freightCharges}
                  onChange={(e) => handleInputChange("freightCharges", e.target.value)}
                  placeholder="0.00"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="shipping-charges" className={LABEL_CLASSES(isDarkMode)}>
                  Shipping Charges
                </label>
                <input
                  id="shipping-charges"
                  type="number"
                  step="0.01"
                  value={purchaseOrder.shippingCharges}
                  onChange={(e) => handleInputChange("shippingCharges", e.target.value)}
                  placeholder="0.00"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="handling-charges" className={LABEL_CLASSES(isDarkMode)}>
                  Handling Charges
                </label>
                <input
                  id="handling-charges"
                  type="number"
                  step="0.01"
                  value={purchaseOrder.handlingCharges}
                  onChange={(e) => handleInputChange("handlingCharges", e.target.value)}
                  placeholder="0.00"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="other-charges" className={LABEL_CLASSES(isDarkMode)}>
                  Other Charges
                </label>
                <input
                  id="other-charges"
                  type="number"
                  step="0.01"
                  value={purchaseOrder.otherCharges}
                  onChange={(e) => handleInputChange("otherCharges", e.target.value)}
                  placeholder="0.00"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
            <div className={DIVIDER_CLASSES(isDarkMode)} />
            {/* Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormSelect
                  label="Discount Type"
                  value={purchaseOrder.discountType}
                  onValueChange={(value) => handleInputChange("discountType", value)}
                >
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </FormSelect>
              </div>
              <div>
                <label htmlFor="discount-amount-input" className={LABEL_CLASSES(isDarkMode)}>
                  {purchaseOrder.discountType === "percentage" ? "Discount %" : "Discount Amount"}
                </label>
                <input
                  id="discount-amount-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={purchaseOrder.discountType === "percentage" ? 100 : undefined}
                  value={
                    purchaseOrder.discountType === "percentage"
                      ? purchaseOrder.discountPercentage
                      : purchaseOrder.discountAmount
                  }
                  onChange={(e) =>
                    handleInputChange(
                      purchaseOrder.discountType === "percentage" ? "discountPercentage" : "discountAmount",
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 pt-4 mt-6" style={{ background: DRAWER_FOOTER_GRADIENT(isDarkMode) }}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setChargesDrawerOpen(false)} className={BTN_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Terms Drawer */}

      <button
        type="button"
        className={`${DRAWER_OVERLAY} ${deliveryDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"} border-0`}
        onClick={() => setDeliveryDrawerOpen(false)}
        aria-label="Close delivery drawer"
      />
      <div className={`${DRAWER_PANEL(isDarkMode)} ${deliveryDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          <div className={DRAWER_HEADER(isDarkMode)}>
            <div>
              <div className="text-sm font-extrabold">Delivery Terms</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Shipping, warehouse, and delivery settings
              </div>
            </div>
            <button type="button" onClick={() => setDeliveryDrawerOpen(false)} className={BTN_SMALL(isDarkMode)}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <FormSelect
                label="Incoterms"
                value={purchaseOrder.incoterms || "none"}
                onValueChange={(value) => handleInputChange("incoterms", value === "none" ? "" : value)}
              >
                <SelectItem value="none">Select Incoterm</SelectItem>
                <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                <SelectItem value="DAP">DAP - Delivered at Place</SelectItem>
                <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
                <SelectItem value="CIP">CIP - Carriage and Insurance Paid To</SelectItem>
              </FormSelect>
            </div>
            <div>
              <FormSelect
                label="Destination Warehouse"
                value={selectedWarehouse || "none"}
                onValueChange={(value) => setSelectedWarehouse(value === "none" ? "" : value)}
              >
                <SelectItem value="none">Select Warehouse</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name} - {warehouse.city}
                  </SelectItem>
                ))}
              </FormSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="expectedDeliveryDate" className={LABEL_CLASSES(isDarkMode)}>
                  Expected Delivery
                </label>
                <input
                  id="expectedDeliveryDate"
                  type="date"
                  value={purchaseOrder.expectedDeliveryDate}
                  onChange={(e) => handleInputChange("expectedDeliveryDate", e.target.value)}
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="gracePeriodDays" className={LABEL_CLASSES(isDarkMode)}>
                  Grace Period (Days)
                </label>
                <input
                  id="gracePeriodDays"
                  type="number"
                  min="0"
                  max="30"
                  value={purchaseOrder.gracePeriodDays}
                  onChange={(e) => handleInputChange("gracePeriodDays", parseInt(e.target.value, 10) || 5)}
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
            <div>
              <FormSelect
                label="Stock Status"
                value={purchaseOrder.stockStatus}
                onValueChange={(value) => handleInputChange("stockStatus", value)}
              >
                <SelectItem value="retain">Retain (To be received)</SelectItem>
                <SelectItem value="transit">In Transit</SelectItem>
                {hasDropshipItems ? (
                  <>
                    <SelectItem value="received">Delivered to Customer (Dropship)</SelectItem>
                    <SelectItem value="in_warehouse">Received to Warehouse (Rejection)</SelectItem>
                  </>
                ) : (
                  <SelectItem value="received">Received (Add to Inventory)</SelectItem>
                )}
              </FormSelect>
            </div>
          </div>
          <div className="sticky bottom-0 pt-4 mt-6" style={{ background: DRAWER_FOOTER_GRADIENT(isDarkMode) }}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setDeliveryDrawerOpen(false)} className={BTN_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms Drawer */}

      <button
        type="button"
        className={`${DRAWER_OVERLAY} ${notesDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"} border-0`}
        onClick={() => setNotesDrawerOpen(false)}
        aria-label="Close notes drawer"
      />
      <div className={`${DRAWER_PANEL(isDarkMode)} ${notesDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          <div className={DRAWER_HEADER(isDarkMode)}>
            <div>
              <div className="text-sm font-extrabold">Notes & Terms</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Internal notes and payment terms
              </div>
            </div>
            <button type="button" onClick={() => setNotesDrawerOpen(false)} className={BTN_SMALL(isDarkMode)}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="purchaseOrderNotes" className={LABEL_CLASSES(isDarkMode)}>
                Notes
              </label>
              <textarea
                id="purchaseOrderNotes"
                rows={4}
                value={purchaseOrder.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                className={`${INPUT_CLASSES(isDarkMode)} min-h-[100px]`}
              />
            </div>
            <div>
              <label htmlFor="purchaseOrderTerms" className={LABEL_CLASSES(isDarkMode)}>
                Terms & Conditions
              </label>
              <textarea
                id="purchaseOrderTerms"
                rows={4}
                value={purchaseOrder.terms}
                onChange={(e) => handleInputChange("terms", e.target.value)}
                placeholder="Terms and conditions..."
                className={`${INPUT_CLASSES(isDarkMode)} min-h-[100px]`}
              />
            </div>
          </div>
          <div className="sticky bottom-0 pt-4 mt-6" style={{ background: DRAWER_FOOTER_GRADIENT(isDarkMode) }}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setNotesDrawerOpen(false)} className={BTN_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Info Drawer (also used for Supplier details) */}

      <button
        type="button"
        className={`${DRAWER_OVERLAY} ${buyerDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"} border-0`}
        onClick={() => setBuyerDrawerOpen(false)}
        aria-label="Close buyer drawer"
      />
      <div className={`${DRAWER_PANEL(isDarkMode)} ${buyerDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          <div className={DRAWER_HEADER(isDarkMode)}>
            <div>
              <div className="text-sm font-extrabold">Buyer & Supplier Info</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Contact details for this order
              </div>
            </div>
            <button type="button" onClick={() => setBuyerDrawerOpen(false)} className={BTN_SMALL(isDarkMode)}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {/* Supplier Section */}
            <div
              className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Supplier Details
            </div>
            <div>
              <label htmlFor="supplierName" className={LABEL_CLASSES(isDarkMode)}>
                Supplier Name
              </label>
              <input
                id="supplierName"
                type="text"
                value={purchaseOrder.supplierName}
                onChange={(e) => handleInputChange("supplierName", e.target.value)}
                placeholder="Supplier company name"
                className={INPUT_CLASSES(isDarkMode)}
              />
            </div>
            <div>
              <label htmlFor="supplierAddress" className={LABEL_CLASSES(isDarkMode)}>
                Supplier Address
              </label>
              <textarea
                id="supplierAddress"
                rows={2}
                value={purchaseOrder.supplierAddress}
                onChange={(e) => handleInputChange("supplierAddress", e.target.value)}
                placeholder="Full address"
                className={INPUT_CLASSES(isDarkMode)}
              />
            </div>
            <div>
              <TRNInput
                value={purchaseOrder.supplierTRN}
                onChange={(value) => handleInputChange("supplierTRN", value)}
                label="Supplier TRN"
                required={true}
              />
            </div>
            <div className={DIVIDER_CLASSES(isDarkMode)} />
            {/* Buyer Section */}
            <div
              className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Buyer Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="buyerName" className={LABEL_CLASSES(isDarkMode)}>
                  Buyer Name
                </label>
                <input
                  id="buyerName"
                  type="text"
                  value={purchaseOrder.buyerName}
                  onChange={(e) => handleInputChange("buyerName", e.target.value)}
                  placeholder="Name of person placing order"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="buyerDepartment" className={LABEL_CLASSES(isDarkMode)}>
                  Department
                </label>
                <input
                  id="buyerDepartment"
                  type="text"
                  value={purchaseOrder.buyerDepartment}
                  onChange={(e) => handleInputChange("buyerDepartment", e.target.value)}
                  placeholder="e.g., Procurement"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="buyerEmail" className={LABEL_CLASSES(isDarkMode)}>
                  Buyer Email
                </label>
                <input
                  id="buyerEmail"
                  type="email"
                  value={purchaseOrder.buyerEmail}
                  onChange={(e) => handleInputChange("buyerEmail", e.target.value)}
                  placeholder="buyer@company.com"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="buyerPhone" className={LABEL_CLASSES(isDarkMode)}>
                  Buyer Phone
                </label>
                <input
                  id="buyerPhone"
                  type="tel"
                  value={purchaseOrder.buyerPhone}
                  onChange={(e) => handleInputChange("buyerPhone", e.target.value)}
                  placeholder="+971 50 123 4567"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 pt-4 mt-6" style={{ background: DRAWER_FOOTER_GRADIENT(isDarkMode) }}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setBuyerDrawerOpen(false)} className={BTN_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Drawer */}

      <button
        type="button"
        className={`${DRAWER_OVERLAY} ${paymentDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"} border-0`}
        onClick={() => setPaymentDrawerOpen(false)}
        aria-label="Close payment drawer"
      />
      <div className={`${DRAWER_PANEL(isDarkMode)} ${paymentDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          <div className={DRAWER_HEADER(isDarkMode)}>
            <div>
              <div className="text-sm font-extrabold">Payment Details</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Payment terms, history, and status
              </div>
            </div>
            <button type="button" onClick={() => setPaymentDrawerOpen(false)} className={BTN_SMALL(isDarkMode)}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {/* Payment Terms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormSelect
                  label="Payment Terms"
                  value={purchaseOrder.paymentTerms}
                  onValueChange={(value) => handleInputChange("paymentTerms", value)}
                >
                  <SelectItem value="Net 7">Net 7 days</SelectItem>
                  <SelectItem value="Net 15">Net 15 days</SelectItem>
                  <SelectItem value="Net 30">Net 30 days</SelectItem>
                  <SelectItem value="Net 60">Net 60 days</SelectItem>
                  <SelectItem value="Net 90">Net 90 days</SelectItem>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                  <SelectItem value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</SelectItem>
                  <SelectItem value="Custom">Custom Terms</SelectItem>
                </FormSelect>
              </div>
              <div>
                <label htmlFor="dueDate" className={LABEL_CLASSES(isDarkMode)}>
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={purchaseOrder.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-2.5">
              <div
                className={`${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-2.5`}
              >
                <div className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total</div>
                <div className="text-sm font-extrabold mt-1 font-mono">{formatCurrency(purchaseOrder.total)}</div>
              </div>
              <div
                className={`${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-2.5`}
              >
                <div className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Paid</div>
                <div className="text-sm font-extrabold mt-1 font-mono text-green-500">
                  {formatCurrency(
                    payments.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                  )}
                </div>
              </div>
              <div
                className={`${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-2.5`}
              >
                <div className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Outstanding</div>
                <div className="text-sm font-extrabold mt-1 font-mono text-red-400">
                  {formatCurrency(
                    Math.max(
                      0,
                      purchaseOrder.total -
                        payments.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    )
                  )}
                </div>
              </div>
            </div>
            {/* Add Payment Button */}
            <button
              type="button"
              onClick={() => {
                setPaymentDrawerOpen(false);
                setShowPaymentForm(true);
              }}
              className={`w-full ${BTN_PRIMARY}`}
            >
              <Plus size={16} className="inline mr-1" />
              Add Payment
            </button>
            {/* Payment History */}
            {payments.length > 0 && (
              <>
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Payment History
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-3 rounded-[14px] border flex justify-between items-center ${
                        payment.voided
                          ? `opacity-60 ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300"}`
                          : isDarkMode
                            ? "bg-gray-900 border-gray-700"
                            : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div>
                        <div className={`font-medium text-sm ${payment.voided ? "line-through" : ""}`}>
                          {formatCurrency(payment.amount)}
                          {payment.voided && <span className="text-red-500 ml-2 text-xs">(VOIDED)</span>}
                        </div>
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {payment.paymentMethod} - {payment.paymentDate}
                          {payment.referenceNumber && ` | Ref: ${payment.referenceNumber}`}
                        </div>
                      </div>
                      {!payment.voided && (
                        <button
                          type="button"
                          onClick={() => handleVoidPayment(payment.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="sticky bottom-0 pt-4 mt-6" style={{ background: DRAWER_FOOTER_GRADIENT(isDarkMode) }}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setPaymentDrawerOpen(false)} className={BTN_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Workflow Drawer */}

      <button
        type="button"
        className={`${DRAWER_OVERLAY} ${approvalDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"} border-0`}
        onClick={() => setApprovalDrawerOpen(false)}
        aria-label="Close approval drawer"
      />
      <div className={`${DRAWER_PANEL(isDarkMode)} ${approvalDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4">
          <div className={DRAWER_HEADER(isDarkMode)}>
            <div>
              <div className="text-sm font-extrabold">Approval Workflow</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Manage approval status and comments
              </div>
            </div>
            <button type="button" onClick={() => setApprovalDrawerOpen(false)} className={BTN_SMALL(isDarkMode)}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormSelect
                  label="Approval Status"
                  value={purchaseOrder.approvalStatus}
                  onValueChange={(value) => handleInputChange("approvalStatus", value)}
                >
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </FormSelect>
              </div>
              <div>
                <label htmlFor="approvedBy" className={LABEL_CLASSES(isDarkMode)}>
                  Approved By
                </label>
                <input
                  id="approvedBy"
                  type="text"
                  value={purchaseOrder.approvedBy}
                  onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                  placeholder="Name of approver"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="approvalDate" className={LABEL_CLASSES(isDarkMode)}>
                Approval Date
              </label>
              <input
                id="approvalDate"
                type="date"
                value={purchaseOrder.approvalDate}
                onChange={(e) => handleInputChange("approvalDate", e.target.value)}
                className={INPUT_CLASSES(isDarkMode)}
              />
            </div>
            <div>
              <label htmlFor="approvalComments" className={LABEL_CLASSES(isDarkMode)}>
                Approval Comments
              </label>
              <textarea
                id="approvalComments"
                rows={4}
                value={purchaseOrder.approvalComments}
                onChange={(e) => handleInputChange("approvalComments", e.target.value)}
                placeholder="Comments from approver..."
                className={`${INPUT_CLASSES(isDarkMode)} min-h-[100px]`}
              />
            </div>
          </div>
          <div className="sticky bottom-0 pt-4 mt-6" style={{ background: DRAWER_FOOTER_GRADIENT(isDarkMode) }}>
            <div className="flex justify-end">
              <button type="button" onClick={() => setApprovalDrawerOpen(false)} className={BTN_PRIMARY}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Payment Form Modal - keep existing */}
      {showPaymentForm && (
        <PaymentForm
          onSubmit={handleAddPayment}
          onCancel={() => setShowPaymentForm(false)}
          totalAmount={purchaseOrder.total}
          paidAmount={payments.filter((p) => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Preview Modal - keep existing */}
      {showPreview && (
        <PurchaseOrderPreview purchaseOrder={purchaseOrder} company={{}} onClose={() => setShowPreview(false)} />
      )}

      {/* Receive to Warehouse Modal (Dropship Customer Rejection) */}
      {receiveToWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`w-full max-w-lg p-6 rounded-xl shadow-xl ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Warehouse size={20} className="text-amber-500" />
                Receive to Warehouse
              </h3>
              <button
                type="button"
                onClick={() => setReceiveToWarehouseOpen(false)}
                className={BTN_SMALL(isDarkMode)}
              >
                <X size={16} />
              </button>
            </div>

            <p className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Receive dropship goods into warehouse after customer rejection. This creates real Stock IN movements.
            </p>

            {/* Warehouse Selector */}
            <div className="mb-4">
              <FormSelect
                label="Target Warehouse *"
                value={rtwWarehouseId || "none"}
                onValueChange={(value) => setRtwWarehouseId(value === "none" ? "" : value)}
              >
                <SelectItem value="none">Select Warehouse</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name} {warehouse.city ? `- ${warehouse.city}` : ""}
                  </SelectItem>
                ))}
              </FormSelect>
            </div>

            {/* Per-item quantity inputs */}
            <div className="mb-4">
              <label className={LABEL_CLASSES(isDarkMode)}>Items to Receive</label>
              <div className={`rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"} overflow-hidden`}>
                {rtwItems.map((item, index) => (
                  <div
                    key={item.itemId}
                    className={`flex items-center justify-between px-3 py-2 ${
                      index > 0 ? `border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}` : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {item.name}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Max: {item.maxQuantity}
                      </div>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(item.maxQuantity, parseFloat(e.target.value) || 0));
                          setRtwItems((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, quantity: val } : it)),
                          );
                        }}
                        className={`${INPUT_CLASSES(isDarkMode)} text-center`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reason (required) */}
            <div className="mb-3">
              <label htmlFor="rtwReason" className={LABEL_CLASSES(isDarkMode)}>
                Reason *
              </label>
              <input
                id="rtwReason"
                type="text"
                value={rtwReason}
                onChange={(e) => setRtwReason(e.target.value)}
                placeholder="e.g. Customer rejected goods — quality issue"
                className={INPUT_CLASSES(isDarkMode)}
              />
            </div>

            {/* Notes (optional) */}
            <div className="mb-4">
              <label htmlFor="rtwNotes" className={LABEL_CLASSES(isDarkMode)}>
                Notes (optional)
              </label>
              <textarea
                id="rtwNotes"
                rows={2}
                value={rtwNotes}
                onChange={(e) => setRtwNotes(e.target.value)}
                placeholder="Additional notes..."
                className={`${INPUT_CLASSES(isDarkMode)} min-h-[60px]`}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiveToWarehouseOpen(false)}
                className={BTN_CLASSES(isDarkMode)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReceiveToWarehouse}
                disabled={rtwSaving}
                className={`${BTN_PRIMARY} ${rtwSaving ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {rtwSaving ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                Receive to Warehouse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderForm;
