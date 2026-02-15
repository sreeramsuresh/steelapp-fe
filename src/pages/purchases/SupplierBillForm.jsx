/**
 * SupplierBillForm.jsx - UAE VAT Compliance
 *
 * Form for creating/editing supplier bills (purchase invoices).
 * Supports VAT categories, reverse charge, blocked VAT, and line items.
 */

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  FileSearch,
  FileText,
  Layers,
  Link2,
  Loader2,
  Package,
  Percent,
  Pin,
  Plus,
  Save,
  Scale,
  Settings,
  Ship,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import supplierBillCorrectionConfig from "../../components/finance/supplierBillCorrectionConfig";
import { CorrectionHelpModal, DocumentHistoryPanel } from "../../components/posted-document-framework";
import ProductAutocomplete from "../../components/shared/ProductAutocomplete";
import { FormSelect } from "../../components/ui/form-select";
import { SelectItem } from "../../components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";
import { grnService } from "../../services/grnService";
import { purchaseOrderService } from "../../services/purchaseOrderService";
import { importContainerService } from "../../services/importContainerService";
import { notificationService } from "../../services/notificationService";
import { pinnedProductsService } from "../../services/pinnedProductsService";
import { productService } from "../../services/productService";
import supplierBillService from "../../services/supplierBillService";
import { supplierService } from "../../services/supplierService";
import { calculateItemAmount, formatCurrency, formatDateForInput } from "../../utils/invoiceUtils";
import { getAllowedBases, getBasisLabel } from "../../utils/pricingBasisRules";

// UAE Emirates for place of supply
const EMIRATES = [
  { value: "AE-AZ", label: "Abu Dhabi" },
  { value: "AE-DU", label: "Dubai" },
  { value: "AE-SH", label: "Sharjah" },
  { value: "AE-AJ", label: "Ajman" },
  { value: "AE-UQ", label: "Umm Al Quwain" },
  { value: "AE-RK", label: "Ras Al Khaimah" },
  { value: "AE-FU", label: "Fujairah" },
];

// VAT categories
const VAT_CATEGORIES = [
  { value: "STANDARD", label: "Standard Rate (5%)", rate: 5 },
  { value: "ZERO_RATED", label: "Zero Rated (0%)", rate: 0 },
  { value: "EXEMPT", label: "Exempt", rate: 0 },
  { value: "REVERSE_CHARGE", label: "Reverse Charge", rate: 5 },
  { value: "BLOCKED", label: "Blocked (Non-Recoverable)", rate: 5 },
];

// Payment terms
const PAYMENT_TERMS = [
  { value: "immediate", label: "Immediate" },
  { value: "net_7", label: "Net 7 Days" },
  { value: "net_15", label: "Net 15 Days" },
  { value: "net_30", label: "Net 30 Days" },
  { value: "net_45", label: "Net 45 Days" },
  { value: "net_60", label: "Net 60 Days" },
  { value: "net_90", label: "Net 90 Days" },
];

// Supported currencies for multi-currency bills
const CURRENCIES = [
  { value: "AED", label: "AED - UAE Dirham", rate: 1 },
  { value: "USD", label: "USD - US Dollar", rate: 3.6725 },
  { value: "EUR", label: "EUR - Euro", rate: 4.02 },
  { value: "GBP", label: "GBP - British Pound", rate: 4.65 },
  { value: "SAR", label: "SAR - Saudi Riyal", rate: 0.98 },
  { value: "CNY", label: "CNY - Chinese Yuan", rate: 0.51 },
  { value: "INR", label: "INR - Indian Rupee", rate: 0.044 },
];

// Blocked VAT reasons (per UAE FTA Article 53)
const BLOCKED_VAT_REASONS = [
  { value: "entertainment", label: "Entertainment expenses" },
  { value: "motor_vehicle", label: "Motor vehicles (not for business use)" },
  { value: "personal_use", label: "Personal use goods/services" },
  { value: "no_tax_invoice", label: "No valid tax invoice" },
  { value: "expired_period", label: "Claim period expired" },
  { value: "other", label: "Other (specify in notes)" },
];

// Document types (Phase 2c)
const DOCUMENT_TYPES = [
  { value: "INVOICE", label: "Invoice" },
  { value: "CREDIT_NOTE", label: "Credit Note" },
  { value: "DEBIT_NOTE", label: "Debit Note" },
  { value: "PROFORMA", label: "Proforma Invoice" },
];

// Approval statuses (Phase 2c)
const APPROVAL_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

// Inspection statuses (Phase 2c)
const INSPECTION_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "PASSED", label: "Passed" },
  { value: "FAILED", label: "Failed" },
  { value: "WAIVED", label: "Waived" },
];

// Empty line item template
const createEmptyItem = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  productId: null,
  description: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  vatRate: 5,
  vatAmount: 0,
  vatCategory: "STANDARD",
  expenseCategory: "",
  // Pricing & Commercial Fields
  pricingBasis: "PER_MT",
  unitWeightKg: null,
  quantityUom: "PCS",
  theoreticalWeightKg: null,
  missingWeightWarning: false,
  // Stock-In Fields (Phase 5)
  procurementChannel: "LOCAL", // LOCAL or IMPORTED
  importContainerId: null, // Link to import container for imported items
  // Weight Variance Fields
  poWeightKg: null, // Weight from PO
  receivedWeightKg: null, // Actual received weight from GRN
  weightVarianceKg: null, // Calculated variance
  weightVariancePercent: null, // Variance percentage
  // GRN Linkage
  grnLineId: null, // Link to specific GRN line item
  // Batch Creation
  createBatch: true, // Flag to trigger batch creation on approval
  batchNumber: "", // Pre-assigned batch number if any
  // PO Reference (for deviation warnings)
  poOrderedQty: null,
  poRate: null,
});

// Custom Tailwind Components
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 ${
        isDarkMode ? "disabled:bg-gray-600 focus:ring-offset-gray-800" : "disabled:bg-gray-400 focus:ring-offset-white"
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md`;
    } else if (variant === "secondary") {
      return `${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400 disabled:bg-gray-100 focus:ring-offset-white"
      }`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:bg-gray-50 focus:ring-offset-white"
      } focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? "cursor-not-allowed" : ""
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const _Input = ({
  label,
  error,
  className = "",
  required = false,
  validationState = null,
  showValidation = true,
  id,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const inputId = useMemo(() => id || `input-${Math.random().toString(36).substr(2, 9)}`, [id]);

  const getValidationClasses = () => {
    if (!showValidation) {
      return isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white";
    }

    if (error || validationState === "invalid") {
      return isDarkMode ? "border-red-500 bg-red-900/10" : "border-red-500 bg-red-50";
    }
    if (validationState === "valid") {
      return isDarkMode ? "border-green-500 bg-green-900/10" : "border-green-500 bg-green-50";
    }
    if (required && validationState === null) {
      return isDarkMode ? "border-yellow-600/50 bg-yellow-900/5" : "border-yellow-400/50 bg-yellow-50/30";
    }
    return isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white";
  };

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ""}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-2 py-2 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 h-[38px] ${
          isDarkMode
            ? "text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${getValidationClasses()} ${className}`}
        {...props}
      />
      {error && <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>}
    </div>
  );
};

// Toggle Switch Component (extracted to avoid creating components during render)
const ToggleSwitch = ({ enabled, onChange, label, description, isDarkMode }) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex-1 pr-4">
      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:ring-offset-2 ${
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

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg border z-50 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
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
        <ToggleSwitch
          enabled={preferences.showValidationHighlighting}
          onChange={() => onPreferenceChange("showValidationHighlighting", !preferences.showValidationHighlighting)}
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
          isDarkMode={isDarkMode}
        />
        <ToggleSwitch
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

// ==================== DESIGN TOKENS ====================
// const COLORS = {
//   bg: '#0b0f14',
//   card: '#141a20',
//   border: '#2a3640',
//   text: '#e6edf3',
//   muted: '#93a4b4',
//   good: '#2ecc71',
//   warn: '#f39c12',
//   bad: '#e74c3c',
//   accent: '#4aa3ff',
//   accentHover: '#5bb2ff',
//   inputBg: '#0f151b',
// };

// Drawer Component for secondary content
const Drawer = ({ isOpen, onClose, title, subtitle, children, isDarkMode, width = "w-[min(620px,92vw)]" }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-label="Close drawer"
      />
      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full ${width} z-[31]
          ${isDarkMode ? "bg-gray-800 border-l border-gray-700" : "bg-white border-l border-gray-200"}
          overflow-auto transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4">
          {/* Header */}
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3
            ${isDarkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white border-b border-gray-200"}
            z-[1]`}
          >
            <div>
              <div className="text-sm font-bold">{title}</div>
              {subtitle && (
                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Content */}
          {children}
        </div>
      </div>
    </>
  );
};

// ==================== DESIGN TOKENS (Matched to PO Form) ====================
const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-4`;

const INPUT_CLASSES = (isDarkMode) =>
  `w-full ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-md py-2 px-3 text-sm outline-none shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 h-[38px]`;

const LABEL_CLASSES = (isDarkMode) =>
  `block text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1.5`;

const QUICK_LINK_CLASSES = (isDarkMode) =>
  `flex items-center gap-2 py-2 px-2.5 ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-md cursor-pointer text-xs transition-colors hover:border-teal-500 hover:text-teal-400 w-full`;

const TH_CLASSES = (isDarkMode) =>
  `px-2 py-2 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-700"}`;

const SupplierBillForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [showCorrectionGuide, setShowCorrectionGuide] = useState(false);
  const [pinnedProductIds, setPinnedProductIds] = useState(() => {
    const saved = localStorage.getItem("supplierBillPinnedProducts");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchInputs, setSearchInputs] = useState({});
  const searchTimerRef = useRef(null);

  // Drawer states
  const [chargesDrawerOpen, setChargesDrawerOpen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false);
  const [accountingDrawerOpen, setAccountingDrawerOpen] = useState(false);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [inspectionDrawerOpen, setInspectionDrawerOpen] = useState(false);
  const [retentionDrawerOpen, setRetentionDrawerOpen] = useState(false);

  // Stock detail sub-row expand state (keyed by item index)
  const [expandedStockRows, setExpandedStockRows] = useState({});

  // Validation highlighting state
  const [fieldValidation, setFieldValidation] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Form preferences
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem("supplierBillFormPreferences");
    return saved
      ? JSON.parse(saved)
      : {
          showValidationHighlighting: true,
          showSpeedButtons: true,
        };
  });

  // Bill data state
  const [bill, setBill] = useState({
    supplierId: null,
    supplier: null,
    billNumber: "",
    supplierInvoiceNumber: "",
    billDate: formatDateForInput(new Date()),
    dueDate: "",
    receivedDate: formatDateForInput(new Date()),
    vatCategory: "STANDARD",
    placeOfSupply: "AE-DU",
    isReverseCharge: false,
    reverseChargeAmount: 0,
    blockedVatReason: "",
    paymentTerms: "net_30",
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    // Multi-currency support
    currency: "AED",
    exchangeRate: 1,
    totalAed: 0, // Total in base currency (AED)
    status: "draft",
    notes: "",
    terms: "",
    items: [createEmptyItem()],
    // Additional charges (Landed Cost Components)
    freightCharges: 0,
    customsDuty: 0,
    insuranceCharges: 0,
    handlingCharges: 0,
    otherCharges: 0,
    // GRN Matching (3-way match: PO -> GRN -> Bill)
    grnId: null,
    grnNumber: "",
    purchaseOrderId: null,
    poNumber: "",
    // Procurement Channel (affects VAT treatment)
    procurementChannel: "LOCAL", // LOCAL = input VAT, IMPORTED = reverse charge
    // Import Reference
    importContainerId: null,
    importContainerNumber: "",
    // Landed Cost Calculation
    totalLandedCost: 0, // subtotal + all charges
    landedCostPerUnit: 0, // For allocation to inventory
    // Batch Creation Control
    triggerBatchCreation: true, // On approval, create/update stock batches
    // Phase 2c: Document Management
    supplierInvoiceDate: "",
    attachmentUrls: [],
    documentType: "INVOICE",
    // Phase 2c: Approval Workflow
    approvalStatus: "PENDING",
    approvedBy: null,
    approvedAt: null,
    rejectionReason: "",
    // Phase 2c: Payment Tracking (auto-calculated by triggers)
    paymentStatus: "UNPAID",
    lastPaymentDate: null,
    paymentCount: 0,
    // Phase 2c: Accounting
    costCenter: "",
    department: "",
    projectCode: "",
    // Phase 2c: Import Details
    portOfEntry: "",
    arrivalDate: null,
    billOfLading: "",
    // Phase 2c: Quality Inspection
    inspectionRequired: false,
    inspectionDate: null,
    inspectionStatus: null,
    // Phase 2c: Retention
    retentionPercentage: 0,
    retentionAmount: 0, // auto-calculated by trigger
    retentionReleaseDate: null,
  });

  // GRN/Import Container selection state
  const [availableGRNs, setAvailableGRNs] = useState([]);
  const [availableContainers, setAvailableContainers] = useState([]);
  const [showGRNMatchModal, setShowGRNMatchModal] = useState(false);
  const [loadingGRNs, setLoadingGRNs] = useState(false);

  const loadVendors = useCallback(async () => {
    try {
      const response = await supplierService.getSuppliers();
      setVendors(response.suppliers || []);
    } catch (error) {
      console.error("Failed to load vendors:", error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await productService.getProducts();
      const raw = response.products || response;
      setProducts(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }, []);

  const loadBill = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supplierBillService.getById(id);
      setBill({
        ...data,
        items: data.items?.length > 0 ? data.items : [createEmptyItem()],
      });
    } catch (error) {
      console.error("Error loading supplier bill:", error);
      notificationService.error("Failed to load supplier bill");
      navigate("/app/supplier-bills");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadNextBillNumber = useCallback(async () => {
    try {
      const response = await supplierBillService.getNextNumber();
      setBill((prev) => ({
        ...prev,
        billNumber: response.billNumber || "VB-0001",
      }));
    } catch (error) {
      console.error("Error loading next bill number:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadVendors();
    loadProducts();
    if (isEditMode) {
      loadBill();
    } else {
      loadNextBillNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, loadBill, loadNextBillNumber, loadProducts, loadVendors]); // loadSupplierBill and loadNextBillNumber are stable

  // Auto-populate from PO when navigated with ?poId= query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const poId = params.get("poId");
    if (!poId || isEditMode || bill.purchaseOrderId) return;

    const loadPO = async () => {
      try {
        const po = await purchaseOrderService.getById(poId);
        if (!po) return;

        // Map PO items to bill line items
        const poItems = (po.items || []).map((item) => {
          const qty = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.rate || item.unitPrice) || 0;
          const basis = item.pricing_basis || item.pricingBasis || "PER_MT";
          const uom = item.uom || item.unit || item.quantityUom || "PCS";
          const unitWt = item.unit_weight_kg || item.unitWeightKg || null;
          const vatRate = item.vat_rate || item.vatRate || 5;
          const amount = calculateItemAmount(qty, price, basis, unitWt, uom);
          const vatAmount = (amount * vatRate) / 100;

          return {
            ...createEmptyItem(),
            description: item.product_name || item.productName || item.name || "",
            productId: item.product_id || item.productId || null,
            quantity: qty,
            unitPrice: price,
            amount,
            vatAmount,
            pricingBasis: basis,
            unitWeightKg: unitWt,
            quantityUom: uom,
            vatRate,
            procurementChannel: item.isDropship || item.is_dropship ? "DROPSHIP" : item.channel || item.procurementChannel || "LOCAL",
            poOrderedQty: qty,
            poRate: price,
          };
        });

        // Determine consensus procurement channel from items
        const dropshipFlags = (po.items || []).map((item) => item.is_dropship || item.isDropship);
        const allDropship = dropshipFlags.length > 0 && dropshipFlags.every(Boolean);
        const noneDropship = dropshipFlags.every((f) => !f);
        const itemChannels = poItems.map((i) => i.procurementChannel);
        const uniqueChannels = [...new Set(itemChannels)];

        let consensusChannel = null;
        let triggerBatch = true;
        if (allDropship) {
          consensusChannel = "DROPSHIP";
          triggerBatch = false;
        } else if (noneDropship && uniqueChannels.length === 1) {
          consensusChannel = uniqueChannels[0];
        }

        setBill((prev) => ({
          ...prev,
          supplierId: String(po.supplier_id || po.supplierId || prev.supplierId || ""),
          purchaseOrderId: po.id,
          poNumber: po.po_number || po.poNumber || "",
          currency: po.currency || prev.currency,
          notes: po.notes || prev.notes,
          procurementChannel: consensusChannel || prev.procurementChannel,
          triggerBatchCreation: triggerBatch,
          items: poItems.length > 0 ? poItems : prev.items,
        }));

        if (poItems.length > 0) {
          recalculateTotals(poItems);
        }

        // Load GRNs/containers for the PO supplier
        const suppId = po.supplier_id || po.supplierId;
        if (suppId) {
          loadUnbilledGRNs(suppId);
          loadImportContainers(suppId);
        }

        notificationService.success(`Pre-filled from PO ${po.po_number || po.poNumber || poId}`);
      } catch (error) {
        console.error("Failed to load PO for auto-populate:", error);
        notificationService.error("Failed to load Purchase Order");
      }
    };

    loadPO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, isEditMode]);

  // Field validation computation
  useEffect(() => {
    const validation = {};
    validation.supplierId = bill.supplierId ? "valid" : "invalid";
    validation.billNumber = bill.billNumber ? "valid" : "invalid";
    validation.billDate = bill.billDate ? "valid" : "invalid";
    validation.procurementChannel = bill.procurementChannel ? "valid" : "invalid";
    setFieldValidation(validation);
  }, [bill.supplierId, bill.billNumber, bill.billDate, bill.procurementChannel]);

  const showFieldValidation = useCallback(
    (fieldName) => {
      return formPreferences.showValidationHighlighting && (touchedFields[fieldName] || hasAttemptedSave);
    },
    [formPreferences.showValidationHighlighting, touchedFields, hasAttemptedSave],
  );

  // Calculate due date when bill date or payment terms change
  useEffect(() => {
    if (bill.billDate && bill.paymentTerms) {
      const billDate = new Date(bill.billDate);
      let daysToAdd = 0;
      switch (bill.paymentTerms) {
        case "net_7":
          daysToAdd = 7;
          break;
        case "net_15":
          daysToAdd = 15;
          break;
        case "net_30":
          daysToAdd = 30;
          break;
        case "net_45":
          daysToAdd = 45;
          break;
        case "net_60":
          daysToAdd = 60;
          break;
        case "net_90":
          daysToAdd = 90;
          break;
        default:
          daysToAdd = 0;
      }
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      setBill((prev) => ({ ...prev, dueDate: formatDateForInput(dueDate) }));
    }
  }, [bill.billDate, bill.paymentTerms]);

  // Save form preferences to localStorage
  useEffect(() => {
    localStorage.setItem("supplierBillFormPreferences", JSON.stringify(formPreferences));
  }, [formPreferences]);

  // Load unbilled GRNs for the selected supplier
  const loadUnbilledGRNs = async (supplierId) => {
    if (!supplierId) {
      setAvailableGRNs([]);
      return;
    }
    try {
      setLoadingGRNs(true);
      const grns = await grnService.getUnbilled({ supplierId });
      setAvailableGRNs(grns || []);
    } catch (error) {
      console.error("Failed to load unbilled GRNs:", error);
      setAvailableGRNs([]);
    } finally {
      setLoadingGRNs(false);
    }
  };

  // Load available import containers for the selected supplier
  const loadImportContainers = async (supplierId) => {
    if (!supplierId) {
      setAvailableContainers([]);
      return;
    }
    try {
      const response = await importContainerService.getBySupplier(supplierId);
      const containers = response.data || response.containers || response || [];
      setAvailableContainers(Array.isArray(containers) ? containers : []);
    } catch (error) {
      console.error("Failed to load import containers:", error);
      setAvailableContainers([]);
    }
  };

  // Handle GRN selection for 3-way match
  const handleGRNSelect = (grn) => {
    if (!grn) {
      // Clear GRN linkage
      setBill((prev) => ({
        ...prev,
        grnId: null,
        grnNumber: "",
        purchaseOrderId: null,
        poNumber: "",
      }));
      return;
    }

    // Pre-fill line items from GRN
    const grnItems = (grn.items || []).map((grnItem) => ({
      ...createEmptyItem(),
      productId: grnItem.productId,
      description: grnItem.description || grnItem.productName || "",
      quantity: grnItem.acceptedQuantity || grnItem.receivedQuantity || 0,
      unitPrice: grnItem.unitPrice || 0,
      pricingBasis: grnItem.pricingBasis || "PER_MT",
      unitWeightKg: grnItem.unitWeightKg || null,
      quantityUom: grnItem.quantityUom || "PCS",
      // Stock-in fields from GRN
      poWeightKg: grnItem.poWeightKg || null,
      receivedWeightKg: grnItem.receivedWeightKg || null,
      weightVarianceKg: grnItem.weightVarianceKg || null,
      weightVariancePercent: grnItem.weightVariancePercent || null,
      grnLineId: grnItem.id,
      procurementChannel: grn.procurementChannel || "LOCAL",
      importContainerId: grn.importContainerId || null,
      batchNumber: grnItem.batchNumber || "",
    }));

    // Determine procurement channel and VAT category
    const isImported = grn.procurementChannel === "IMPORTED" || grn.importContainerId;
    const vatCategory = isImported ? "REVERSE_CHARGE" : "STANDARD";

    setBill((prev) => ({
      ...prev,
      grnId: grn.id,
      grnNumber: grn.grnNumber,
      purchaseOrderId: grn.purchaseOrderId,
      poNumber: grn.poNumber || "",
      procurementChannel: grn.procurementChannel || "LOCAL",
      importContainerId: grn.importContainerId || null,
      importContainerNumber: grn.containerNumber || "",
      vatCategory,
      isReverseCharge: isImported,
      items: grnItems.length > 0 ? grnItems : prev.items,
    }));

    // Recalculate totals
    if (grnItems.length > 0) {
      recalculateTotals(grnItems);
    }

    setShowGRNMatchModal(false);
    notificationService.success(`Linked to GRN ${grn.grnNumber}`);
  };

  // Calculate landed cost
  const calculateLandedCost = useCallback(() => {
    const additionalCharges =
      (parseFloat(bill.freightCharges) || 0) +
      (parseFloat(bill.customsDuty) || 0) +
      (parseFloat(bill.insuranceCharges) || 0) +
      (parseFloat(bill.handlingCharges) || 0) +
      (parseFloat(bill.otherCharges) || 0);

    const totalLandedCost = bill.subtotal + additionalCharges;

    // Calculate per-unit landed cost for allocation
    const totalUnits = bill.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      // For weight-based items, use theoretical weight
      if (item.quantityUom === "MT") return sum + qty * 1000;
      if (item.quantityUom === "KG") return sum + qty;
      if (item.unitWeightKg) return sum + qty * item.unitWeightKg;
      return sum + qty;
    }, 0);

    const landedCostPerUnit = totalUnits > 0 ? totalLandedCost / totalUnits : 0;

    return { totalLandedCost, landedCostPerUnit };
  }, [
    bill.subtotal,
    bill.freightCharges,
    bill.customsDuty,
    bill.insuranceCharges,
    bill.handlingCharges,
    bill.otherCharges,
    bill.items,
  ]);

  // Update landed cost when relevant fields change
  useEffect(() => {
    const { totalLandedCost, landedCostPerUnit } = calculateLandedCost();
    setBill((prev) => ({
      ...prev,
      totalLandedCost,
      landedCostPerUnit,
    }));
  }, [calculateLandedCost]);

  // Handle supplier selection
  const handleSupplierChange = (supplierId) => {
    const supplier = vendors.find((v) => v.id === supplierId || v.id === parseInt(supplierId, 10));
    setBill((prev) => ({
      ...prev,
      supplierId: supplierId || null,
      supplier: supplier || null,
      // Clear GRN linkage when supplier changes
      grnId: null,
      grnNumber: "",
      purchaseOrderId: null,
      poNumber: "",
      importContainerId: null,
      importContainerNumber: "",
    }));

    // Load unbilled GRNs and import containers for this supplier
    if (supplierId) {
      loadUnbilledGRNs(supplierId);
      loadImportContainers(supplierId);
    } else {
      setAvailableGRNs([]);
      setAvailableContainers([]);
    }
  };

  // Handle VAT category change — sets default for NEW items only
  const handleVatCategoryChange = (category) => {
    const isReverseCharge = category === "REVERSE_CHARGE";
    setBill((prev) => ({
      ...prev,
      vatCategory: category,
      isReverseCharge,
      blockedVatReason: category === "BLOCKED" ? prev.blockedVatReason : "",
    }));
  };

  // Add new line item — inherits bill-level defaults for VAT
  const handleAddItem = () => {
    const vatConfig = VAT_CATEGORIES.find((c) => c.value === bill.vatCategory);
    setBill((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...createEmptyItem(),
          vatRate: vatConfig?.rate || 5,
          vatCategory: prev.vatCategory || "STANDARD",
          procurementChannel: prev.procurementChannel === "IMPORTED" ? "IMPORTED" : "LOCAL",
        },
      ],
    }));
  };

  // Remove line item
  const handleRemoveItem = (index) => {
    if (bill.items.length <= 1) {
      notificationService.warning("At least one item is required");
      return;
    }
    const updatedItems = bill.items.filter((_, i) => i !== index);
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Update line item
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...bill.items];
    const item = { ...updatedItems[index] };

    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value || p.id === parseInt(value, 10));
      if (product) {
        item.productId = product.id;
        item.description =
          product.displayName ||
          product.display_name ||
          product.uniqueName ||
          product.unique_name ||
          product.description ||
          "";
        item.unitPrice = product.purchasePrice || product.cost || product.price || 0;

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
        item.pricingBasis = product.pricingBasis || product.pricing_basis || "PER_MT";
        item.unitWeightKg = product.unitWeightKg || product.unit_weight_kg || null;
        item.quantityUom = quantityUom;

        // Flag if weight is missing for weight-based pricing
        item.missingWeightWarning =
          (item.pricingBasis === "PER_MT" || item.pricingBasis === "PER_KG") &&
          quantityUom === "PCS" &&
          !item.unitWeightKg;
      }
    } else if (field === "procurementChannel") {
      item.procurementChannel = value;
      const isImported = value === "IMPORTED";
      item.vatCategory = isImported ? "REVERSE_CHARGE" : "STANDARD";
      item.vatRate = 5; // 5% for both; category determines VAT return treatment
    } else {
      item[field] = value;
    }

    // Recalculate item amounts when pricing fields change
    if (
      ["quantity", "unitPrice", "vatRate", "unitWeightKg", "pricingBasis", "procurementChannel"].includes(field) ||
      field === "productId"
    ) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 0;
      const pricingBasis = item.pricingBasis || "PER_MT";
      const unitWeightKg = item.unitWeightKg;
      const quantityUom = item.quantityUom || "PCS";

      // Use calculateItemAmount for proper pricing calculation
      item.amount = calculateItemAmount(qty, price, pricingBasis, unitWeightKg, quantityUom);
      item.vatAmount = (item.amount * vatRate) / 100;

      // Update theoretical weight when quantity or unitWeightKg changes
      if (field === "quantity" || field === "unitWeightKg" || field === "productId") {
        if (quantityUom === "MT") {
          item.theoreticalWeightKg = qty * 1000;
        } else if (quantityUom === "KG") {
          item.theoreticalWeightKg = qty;
        } else if (unitWeightKg) {
          item.theoreticalWeightKg = qty * unitWeightKg;
        }
      }

      // Update missing weight warning
      if (field === "unitWeightKg" || field === "pricingBasis") {
        item.missingWeightWarning =
          (pricingBasis === "PER_MT" || pricingBasis === "PER_KG") && quantityUom === "PCS" && !unitWeightKg;
      }
    }

    updatedItems[index] = item;
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Recalculate all items with new VAT rate
  // Recalculate totals — supports mixed reverse charge per-item
  const recalculateTotals = useCallback((items) => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vatAmount) || 0), 0);
    const reverseChargeAmount = items
      .filter((item) => item.vatCategory === "REVERSE_CHARGE")
      .reduce((sum, item) => sum + (parseFloat(item.vatAmount) || 0), 0);

    setBill((prev) => {
      const allCharges =
        (parseFloat(prev.freightCharges) || 0) +
        (parseFloat(prev.customsDuty) || 0) +
        (parseFloat(prev.insuranceCharges) || 0) +
        (parseFloat(prev.handlingCharges) || 0) +
        (parseFloat(prev.otherCharges) || 0);

      const total = subtotal + vatAmount + allCharges;

      // Derive bill-level procurement from items
      const channels = items.map((i) => i.procurementChannel || "LOCAL");
      const allImported = channels.every((c) => c === "IMPORTED");
      const hasImported = channels.some((c) => c === "IMPORTED");

      return {
        ...prev,
        subtotal,
        vatAmount,
        total,
        reverseChargeAmount,
        procurementChannel: allImported ? "IMPORTED" : "LOCAL",
        isReverseCharge: hasImported,
      };
    });
  }, []);

  // Quick add product handler — inherits bill-level defaults
  const handleQuickAddProduct = useCallback(
    (product) => {
      const procChannel = bill.procurementChannel === "IMPORTED" ? "IMPORTED" : "LOCAL";
      const vatCat = procChannel === "IMPORTED" ? "REVERSE_CHARGE" : bill.vatCategory || "STANDARD";
      const vatRate = 5; // UAE standard

      const newItem = {
        ...createEmptyItem(),
        productId: product.id,
        description:
          product.displayName ||
          product.display_name ||
          product.uniqueName ||
          product.unique_name ||
          product.description ||
          "",
        unitPrice: product.purchasePrice || product.cost || product.price || 0,
        pricingBasis: product.pricingBasis || product.pricing_basis || "PER_MT",
        unitWeightKg: product.unitWeightKg || product.unit_weight_kg || null,
        quantityUom: product.primaryUom || product.primary_uom || "PCS",
        procurementChannel: procChannel,
        vatCategory: vatCat,
        vatRate,
      };

      // Calculate amount and VAT
      const qty = 1;
      const price = newItem.unitPrice;
      newItem.amount = calculateItemAmount(qty, price, newItem.pricingBasis, newItem.unitWeightKg, newItem.quantityUom);
      newItem.vatAmount = (newItem.amount * vatRate) / 100;

      setBill((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      recalculateTotals([...bill.items, newItem]);
    },
    [bill.items, bill.procurementChannel, bill.vatCategory, recalculateTotals]
  );

  // Toggle pin product
  const togglePinProduct = async (e, productId) => {
    e.stopPropagation();
    try {
      if (pinnedProductIds.includes(productId)) {
        await pinnedProductsService.unpinProduct(productId);
        setPinnedProductIds((prev) => prev.filter((pid) => pid !== productId));
        localStorage.setItem(
          "supplierBillPinnedProducts",
          JSON.stringify(pinnedProductIds.filter((pid) => pid !== productId))
        );
      } else {
        if (pinnedProductIds.length >= 10) {
          notificationService.error("Maximum 10 pinned products allowed");
          return;
        }
        await pinnedProductsService.pinProduct(productId);
        const newPinned = [...pinnedProductIds, productId];
        setPinnedProductIds(newPinned);
        localStorage.setItem("supplierBillPinnedProducts", JSON.stringify(newPinned));
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  // Sort products: pinned first, then by purchase frequency
  const sortedProducts = useMemo(() => {
    const pinned = products.filter((p) => pinnedProductIds.includes(p.id));
    const unpinned = products
      .filter((p) => !pinnedProductIds.includes(p.id))
      .sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
    return [...pinned, ...unpinned];
  }, [products, pinnedProductIds]);

  // Product autocomplete options (mapped for ProductAutocomplete component)
  const productOptions = useMemo(() => {
    return sortedProducts.map((product) => {
      const displayName =
        product.displayName ||
        product.display_name ||
        product.uniqueName ||
        product.unique_name ||
        product.name ||
        "N/A";
      return {
        ...product,
        label: displayName,
        name: displayName,
        subtitle:
          `${product.category || ""} ${product.grade ? `• ${product.grade}` : ""} ${product.purchasePrice ? `• د.إ${product.purchasePrice}` : ""}`.trim(),
      };
    });
  }, [sortedProducts]);

  const searchOptions = useMemo(() => {
    const list = searchInputs?.__results || [];
    return list.map((product) => {
      const displayName =
        product.displayName ||
        product.display_name ||
        product.uniqueName ||
        product.unique_name ||
        product.name ||
        "N/A";
      return {
        ...product,
        label: displayName,
        name: displayName,
        subtitle:
          `${product.category || ""} ${product.grade ? `• ${product.grade}` : ""} ${product.purchasePrice ? `• د.إ${product.purchasePrice}` : ""}`.trim(),
      };
    });
  }, [searchInputs.__results]);

  // Derived procurement channel from items (for display)
  const derivedProcurement = useMemo(() => {
    if (bill.procurementChannel === "DROPSHIP") return "DROPSHIP";
    const channels = bill.items.map((i) => i.procurementChannel || "LOCAL");
    const allLocal = channels.every((c) => c === "LOCAL");
    const allImported = channels.every((c) => c === "IMPORTED");
    const allDropship = channels.every((c) => c === "DROPSHIP");
    if (allDropship) return "DROPSHIP";
    if (allLocal) return "LOCAL";
    if (allImported) return "IMPORTED";
    return "MIXED";
  }, [bill.items, bill.procurementChannel]);

  // Whether any item is imported (for showing Import Details section)
  const hasImportedItems = useMemo(
    () => bill.items.some((item) => item.procurementChannel === "IMPORTED"),
    [bill.items]
  );

  const handleProductSearchInput = useCallback((index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Debounced API search
    clearTimeout(searchTimerRef.current);
    const term = (value || "").trim();
    try {
      searchTimerRef.current = setTimeout(async () => {
        if (!term) {
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
          return;
        }
        try {
          const resp = await productService.getProducts({ search: term, limit: 20 });
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

  const handleProductSelectFromAutocomplete = (index, selectedProduct) => {
    if (!selectedProduct) return;
    handleItemChange(index, "productId", selectedProduct.id);
    setSearchInputs((prev) => ({ ...prev, [index]: "" }));
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!bill.supplierId) {
      errors.push("Please select a vendor");
    }
    if (!bill.billNumber) {
      errors.push("Bill number is required");
    }
    if (!bill.billDate) {
      errors.push("Bill date is required");
    }
    if (!bill.procurementChannel) {
      errors.push("Procurement channel is required — please select Local, Import, or Dropship");
    }
    if (bill.vatCategory === "BLOCKED" && !bill.blockedVatReason) {
      errors.push("Blocked VAT reason is required");
    }

    // Match the same logic as handleSave - accept description, productName, or product_name
    const validItems = bill.items.filter(
      (item) => (item.description || item.productName || item.product_name) && item.quantity > 0 && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      errors.push("At least one valid line item is required");
    }

    // CRITICAL: Block save when unit weight is missing for weight-based pricing
    bill.items.forEach((item, index) => {
      if (item.missingWeightWarning) {
        errors.push(
          `Item ${index + 1}: Unit weight is missing for "${item.description}". This product has weight-based pricing (${item.pricingBasis}) but no unit weight. Please contact admin to add unit weight to the product master.`
        );
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle save
  const handleSave = async (status = "draft") => {
    setHasAttemptedSave(true);
    if (!validateForm()) {
      notificationService.error("Please fix the validation errors");
      return;
    }

    try {
      setSaving(true);

      // Filter valid items only (require productName OR description, plus quantity/price > 0)
      // Handle both camelCase (form state) and snake_case (API response) field names
      const validItems = bill.items.filter(
        (item) => (item.description || item.productName || item.product_name) && item.quantity > 0 && item.unitPrice > 0
      );

      const billData = {
        ...bill,
        status,
        items: validItems,
      };

      if (isEditMode) {
        await supplierBillService.update(id, billData);
        notificationService.success("Supplier bill updated successfully");
      } else {
        await supplierBillService.create(billData);
        notificationService.success("Supplier bill created successfully");
      }

      navigate("/app/supplier-bills");
    } catch (error) {
      console.error("Error saving supplier bill:", error);
      notificationService.error(error.message || "Failed to save supplier bill");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading supplier bill...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="supplier-bill-form"
      className={`h-full overflow-auto ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-20 shrink-0 backdrop-blur-md border-b ${
          isDarkMode ? "bg-gray-900/92 border-gray-700" : "bg-white/92 border-gray-200"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/app/supplier-bills")}
                className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Back to supplier bills"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className={`text-lg md:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {isEditMode ? "Edit Supplier Bill" : "New Supplier Bill"}
                </h1>
                <p className={`text-xs md:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {bill.billNumber || "Bill #"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-start relative">
              {/* Match to GRN Button */}
              {bill.supplierId && !bill.grnId && (
                <Button
                  variant="outline"
                  onClick={() => setShowGRNMatchModal(true)}
                  disabled={loadingGRNs || !bill.supplierId}
                  title="Link this bill to a Goods Receipt Note for 3-way matching"
                >
                  {loadingGRNs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Match to GRN
                </Button>
              )}

              {/* Show linked GRN/PO badge */}
              {bill.grnId && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    isDarkMode
                      ? "bg-teal-900/30 text-teal-300 border border-teal-700"
                      : "bg-teal-50 text-teal-700 border border-teal-200"
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  <span>GRN: {bill.grnNumber}</span>
                  {bill.poNumber && <span className="text-xs opacity-75">| PO: {bill.poNumber}</span>}
                  <button
                    type="button"
                    onClick={() => handleGRNSelect(null)}
                    className="ml-1 p-0.5 hover:bg-teal-600/20 rounded"
                    title="Unlink GRN"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowCorrectionGuide(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Correction Guide"
                title="Correction Guide"
              >
                <BookOpen className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowFormSettings(!showFormSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Form settings"
                title="Form Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <FormSettingsPanel
                isOpen={showFormSettings}
                onClose={() => setShowFormSettings(false)}
                preferences={formPreferences}
                onPreferenceChange={(key, value) => {
                  setFormPreferences((prev) => ({ ...prev, [key]: value }));
                }}
              />

              <Button
                variant="secondary"
                data-testid="save-draft"
                onClick={() => handleSave("draft")}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </Button>

              <Button data-testid="save-approve" onClick={() => handleSave("approved")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save & Approve
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              isDarkMode ? "bg-red-900/20 border-red-600 text-red-200" : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={isDarkMode ? "text-red-400" : "text-red-600"} size={24} />
              <div>
                <h4 className="font-bold mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, _index) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Document History / Correction Chain */}
        {id && (
          <div className="mb-4">
            <DocumentHistoryPanel
              documentType="supplier_bill"
              documentId={id}
              documentStatus={bill.status}
              allowedActions={
                ["approved", "posted", "issued"].includes((bill.status || "").toLowerCase())
                  ? [
                      {
                        label: "Create Debit Note",
                        type: "debit_note",
                        href: `/app/debit-notes/new?supplierBillId=${id}`,
                      },
                    ]
                  : []
              }
            />
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* Main Content - 8 columns */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Compact Document Details Header */}
            <div className={CARD_CLASSES(isDarkMode)}>
              <h2
                className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Document Details
              </h2>
              {/* Row 1: Bill Number | Bill Date | Due Date | Procurement Channel badge */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6 md:col-span-3">
                  <_Input
                    id="bill-number"
                    label="Bill Number"
                    required
                    type="text"
                    value={bill.billNumber}
                    onChange={(e) => setBill((prev) => ({ ...prev, billNumber: e.target.value }))}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, billNumber: true }))}
                    validationState={fieldValidation.billNumber || null}
                    showValidation={showFieldValidation("billNumber")}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <_Input
                    id="bill-date"
                    data-testid="bill-date"
                    label="Bill Date"
                    required
                    type="date"
                    value={bill.billDate}
                    onChange={(e) => setBill((prev) => ({ ...prev, billDate: e.target.value }))}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, billDate: true }))}
                    validationState={fieldValidation.billDate || null}
                    showValidation={showFieldValidation("billDate")}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="due-date" className={LABEL_CLASSES(isDarkMode)}>
                    Due Date
                  </label>
                  <input
                    id="due-date"
                    data-testid="due-date"
                    type="date"
                    value={bill.dueDate}
                    onChange={(e) => setBill((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="header-procurement" className={LABEL_CLASSES(isDarkMode)}>
                    Procurement
                  </label>
                  <div
                    id="header-procurement"
                    className={`px-3 py-2 text-sm rounded-md border h-[38px] flex items-center ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        derivedProcurement === "DROPSHIP"
                          ? isDarkMode
                            ? "bg-purple-900/50 text-purple-300"
                            : "bg-purple-100 text-purple-700"
                          : derivedProcurement === "IMPORTED"
                            ? isDarkMode
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                            : derivedProcurement === "MIXED"
                              ? isDarkMode
                                ? "bg-amber-900/50 text-amber-300"
                                : "bg-amber-100 text-amber-700"
                              : isDarkMode
                                ? "bg-green-900/50 text-green-300"
                                : "bg-green-100 text-green-700"
                      }`}
                    >
                      {derivedProcurement === "DROPSHIP"
                        ? "Dropship"
                        : derivedProcurement === "IMPORTED"
                          ? "Import"
                          : derivedProcurement === "MIXED"
                            ? "Mixed"
                            : "Local"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Row 2: Supplier | Supplier Invoice # | Payment Terms */}
              <div className="grid grid-cols-12 gap-3 mt-3">
                <div className="col-span-12 md:col-span-6">
                  <FormSelect
                    label="Supplier"
                    data-testid="supplier-select"
                    value={bill.supplierId || "none"}
                    onValueChange={(value) => {
                      setTouchedFields((prev) => ({ ...prev, supplierId: true }));
                      handleSupplierChange(value === "none" ? "" : value);
                    }}
                    required={true}
                    validationState={showFieldValidation("supplierId") ? fieldValidation.supplierId || null : null}
                    showValidation={showFieldValidation("supplierId")}
                    placeholder="Select Supplier..."
                  >
                    <SelectItem value="none">Select Supplier...</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="supplier-invoice-number" className={LABEL_CLASSES(isDarkMode)}>
                    Supplier Invoice #
                  </label>
                  <input
                    id="supplier-invoice-number"
                    data-testid="supplier-invoice-number"
                    type="text"
                    value={bill.supplierInvoiceNumber}
                    onChange={(e) => setBill((prev) => ({ ...prev, supplierInvoiceNumber: e.target.value }))}
                    placeholder="Reference"
                    className={INPUT_CLASSES(isDarkMode)}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <FormSelect
                    label="Payment Terms"
                    value={bill.paymentTerms}
                    onValueChange={(value) => setBill((prev) => ({ ...prev, paymentTerms: value }))}
                    showValidation={false}
                  >
                    {PAYMENT_TERMS.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
              </div>
              {/* Row 3: Currency | Exchange Rate | Default VAT Category | Place of Supply */}
              <div className="grid grid-cols-12 gap-3 mt-3">
                <div className="col-span-6 md:col-span-3" data-testid="currency">
                  <FormSelect
                    label="Currency"
                    value={bill.currency}
                    onValueChange={(value) => {
                      const selectedCurrency = CURRENCIES.find((c) => c.value === value);
                      setBill((prev) => ({
                        ...prev,
                        currency: value,
                        exchangeRate: selectedCurrency?.rate || 1,
                        totalAed: prev.total * (selectedCurrency?.rate || 1),
                      }));
                    }}
                    showValidation={false}
                  >
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                {bill.currency !== "AED" && (
                  <div className="col-span-6 md:col-span-3">
                    <label htmlFor="exchange-rate" className={LABEL_CLASSES(isDarkMode)}>
                      Exchange Rate
                    </label>
                    <input
                      id="exchange-rate"
                      data-testid="exchange-rate"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={bill.exchangeRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 1;
                        setBill((prev) => ({ ...prev, exchangeRate: rate, totalAed: prev.total * rate }));
                      }}
                      className={INPUT_CLASSES(isDarkMode)}
                    />
                  </div>
                )}
                <div className={`col-span-6 ${bill.currency !== "AED" ? "md:col-span-3" : "md:col-span-3"}`}>
                  <FormSelect
                    label="Default VAT Category"
                    value={bill.vatCategory}
                    onValueChange={(value) => handleVatCategoryChange(value)}
                    required={true}
                    showValidation={false}
                    data-testid="vat-category"
                  >
                    {VAT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
                <div className={`col-span-6 ${bill.currency !== "AED" ? "md:col-span-3" : "md:col-span-3"}`}>
                  <FormSelect
                    label="Place of Supply"
                    value={bill.placeOfSupply}
                    onValueChange={(value) => setBill((prev) => ({ ...prev, placeOfSupply: value }))}
                    showValidation={false}
                  >
                    {EMIRATES.map((emirate) => (
                      <SelectItem key={emirate.value} value={emirate.value}>
                        {emirate.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
              </div>
              {/* Blocked VAT Reason - only shown for BLOCKED category */}
              {bill.vatCategory === "BLOCKED" && (
                <div className="mt-3">
                  <FormSelect
                    label="Blocked VAT Reason"
                    value={bill.blockedVatReason || "none"}
                    onValueChange={(value) =>
                      setBill((prev) => ({ ...prev, blockedVatReason: value === "none" ? "" : value }))
                    }
                    required={true}
                    showValidation={false}
                    placeholder="Select reason..."
                    data-testid="blocked-vat-reason"
                  >
                    <SelectItem value="none">Select reason...</SelectItem>
                    {BLOCKED_VAT_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </FormSelect>
                  <p className={`mt-1 text-xs ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                    Blocked VAT cannot be recovered per UAE FTA Article 53
                  </p>
                </div>
              )}
              {/* Reverse Charge Notice - inline below header */}
              {bill.isReverseCharge && (
                <div
                  className={`mt-3 p-3 rounded-lg ${isDarkMode ? "bg-blue-900/20 border border-blue-600" : "bg-blue-50 border border-blue-200"}`}
                >
                  <p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
                    <strong>Reverse Charge:</strong> You will account for VAT of {formatCurrency(bill.vatAmount)} on
                    this purchase. This will be shown as both input and output VAT on your VAT return.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Add Speed Buttons */}
            {formPreferences.showSpeedButtons && sortedProducts.length > 0 && (
              <div className={CARD_CLASSES(isDarkMode)}>
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
                          onClick={() => handleQuickAddProduct(product)}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                              : "bg-white border-gray-300 hover:bg-gray-50 text-gray-900"
                          }`}
                        >
                          <div className="font-medium truncate">
                            {product.displayName ||
                              product.display_name ||
                              product.uniqueName ||
                              product.unique_name ||
                              product.name}
                          </div>
                          <div className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {formatCurrency(product.purchasePrice || product.cost || product.price || 0)}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => togglePinProduct(e, product.id)}
                          className={`absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            isPinned ? "text-teal-500" : isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                          title={isPinned ? "Unpin" : "Pin"}
                        >
                          <Pin className={`h-3 w-3 ${isPinned ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Line Items — HTML Table */}
            <div className={CARD_CLASSES(isDarkMode)}>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Line Items ({bill.items.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  data-testid="add-item"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {/* Mobile placeholder */}
              <div className="md:hidden">
                <p className={`text-xs text-center py-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  Line items table is best viewed on desktop. Rotate your device or use a wider screen.
                </p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table
                  className={`min-w-full table-fixed ${isDarkMode ? "divide-gray-600" : "divide-gray-200"}`}
                  data-testid="line-items-table"
                >
                  <thead className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                    <tr>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "20%" }}>
                        Product
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "6%" }}>
                        Qty
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "6%" }}>
                        Unit Wt
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "6%" }}>
                        Tot Wt
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "10%" }}>
                        Rate
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "8%" }}>
                        Source
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "5%" }}>
                        VAT %
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "9%" }}>
                        Amount
                      </th>
                      <th className={TH_CLASSES(isDarkMode)} style={{ width: "3%" }}></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {bill.items.map((item, index) => {
                      const totalWt = item.theoreticalWeightKg || item.quantity * (item.unitWeightKg || 0);
                      const isStockExpanded = expandedStockRows[index];
                      return (
                        <React.Fragment key={item.id}>
                          {/* Main item row */}
                          <tr className={isDarkMode ? "bg-gray-800" : "bg-white"} data-testid={`item-row-${index}`}>
                            {/* Product */}
                            <td className="px-2 py-2 align-middle">
                              <ProductAutocomplete
                                id={`item-product-${index}`}
                                options={
                                  searchInputs[index]
                                    ? searchOptions.length
                                      ? searchOptions
                                      : productOptions
                                    : productOptions
                                }
                                value={item.productId ? productOptions.find((p) => p.id === item.productId) : null}
                                inputValue={searchInputs[index] || item.description || ""}
                                onInputChange={(_event, newInputValue) =>
                                  handleProductSearchInput(index, newInputValue)
                                }
                                onChange={(_event, newValue) => {
                                  if (newValue) handleProductSelectFromAutocomplete(index, newValue);
                                }}
                                placeholder="Search products..."
                                disabled={loading}
                                renderOption={(option) => (
                                  <div>
                                    <div className="font-medium">
                                      {option.displayName ||
                                        option.display_name ||
                                        option.uniqueName ||
                                        option.unique_name ||
                                        option.name ||
                                        "Product"}
                                    </div>
                                    {option.subtitle && (
                                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        {option.subtitle}
                                      </div>
                                    )}
                                  </div>
                                )}
                                noOptionsText="No products found"
                              />
                            </td>
                            {/* Qty */}
                            <td className="px-2 py-2 align-middle">
                              <input
                                id={`item-quantity-${index}`}
                                data-testid={`item-quantity-${index}`}
                                type="number"
                                min="0"
                                step={item.quantityUom === "MT" || item.quantityUom === "KG" ? "0.001" : "1"}
                                value={item.quantity}
                                onChange={(e) => {
                                  const allowDecimal = item.quantityUom === "MT" || item.quantityUom === "KG";
                                  const val = allowDecimal ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                                  handleItemChange(index, "quantity", Number.isNaN(val) ? "" : val);
                                }}
                                style={{ MozAppearance: "textfield" }}
                                className={`w-full px-2 py-1.5 text-xs border rounded-md text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                              />
                            </td>
                            {/* Unit Wt */}
                            <td className="px-2 py-2 align-middle">
                              <input
                                id={`item-unit-weight-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.unitWeightKg || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "unitWeightKg",
                                    e.target.value === "" ? null : parseFloat(e.target.value)
                                  )
                                }
                                style={{ MozAppearance: "textfield" }}
                                className={`w-full px-2 py-1.5 text-xs border rounded-md text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} ${item.missingWeightWarning ? "border-red-500" : ""}`}
                              />
                            </td>
                            {/* Tot Wt */}
                            <td className="px-2 py-2 align-middle">
                              <div
                                className={`px-2 py-1.5 text-xs rounded-md text-right truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                                title={totalWt ? totalWt.toFixed(2) : "-"}
                              >
                                {totalWt ? totalWt.toFixed(2) : "-"}
                              </div>
                            </td>
                            {/* Rate */}
                            <td className="px-1 py-2 align-middle">
                              <div
                                className={`flex rounded-md overflow-hidden border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}
                              >
                                <input
                                  id={`item-unit-price-${index}`}
                                  data-testid={`item-unit-price-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)
                                  }
                                  style={{ MozAppearance: "textfield" }}
                                  className={`min-w-0 w-0 flex-1 px-2 py-1.5 text-xs border-0 outline-none text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
                                />
                                <select
                                  value={item.pricingBasis || "PER_MT"}
                                  onChange={(e) => handleItemChange(index, "pricingBasis", e.target.value)}
                                  className={`flex-shrink-0 text-[10px] font-bold px-1 border-l cursor-pointer outline-none ${
                                    item.pricingBasis === "PER_KG"
                                      ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                                      : item.pricingBasis === "PER_PCS"
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700"
                                        : "bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                  }`}
                                >
                                  {getAllowedBases(item.productCategory).map((b) => (
                                    <option key={b} value={b}>
                                      /{getBasisLabel(b).replace("per ", "")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            {/* Source */}
                            <td className="px-2 py-2 align-middle">
                              <FormSelect
                                id={`item-procurement-channel-${index}`}
                                value={item.procurementChannel || bill.procurementChannel || "LOCAL"}
                                onValueChange={(value) => handleItemChange(index, "procurementChannel", value)}
                                showValidation={false}
                              >
                                <SelectItem value="LOCAL">Local</SelectItem>
                                <SelectItem value="IMPORTED">Import</SelectItem>
                              </FormSelect>
                            </td>
                            {/* VAT % */}
                            <td className="px-2 py-2 align-middle">
                              <input
                                id={`item-vat-rate-${index}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={item.vatRate}
                                onChange={(e) => handleItemChange(index, "vatRate", parseFloat(e.target.value) || 0)}
                                style={{ MozAppearance: "textfield" }}
                                className={`w-full px-2 py-1.5 text-xs border rounded-md text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                              />
                            </td>
                            {/* Amount */}
                            <td className="px-2 py-2 align-middle">
                              <div
                                className={`px-2 py-1.5 text-xs font-medium text-right truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                                title={formatCurrency(item.amount)}
                              >
                                {(parseFloat(item.amount) || 0).toFixed(2)}
                              </div>
                            </td>
                            {/* Delete + Expand */}
                            <td className="px-2 py-2 align-middle text-center">
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => setExpandedStockRows((prev) => ({ ...prev, [index]: !prev[index] }))}
                                  className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                                  title="Stock details"
                                >
                                  {isStockExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* PO Deviation Warnings */}
                          {(item.poOrderedQty != null && item.quantity > item.poOrderedQty) ||
                          (item.poRate != null &&
                            item.poRate > 0 &&
                            Math.abs(item.unitPrice - item.poRate) / item.poRate > 0.01) ? (
                            <tr>
                              <td
                                colSpan={9}
                                className={`px-3 py-1 ${isDarkMode ? "bg-amber-900/15" : "bg-amber-50/80"}`}
                              >
                                {item.poOrderedQty != null && item.quantity > item.poOrderedQty && (
                                  <p className={`text-xs ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
                                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                                    Quantity exceeds PO ordered quantity ({item.poOrderedQty})
                                  </p>
                                )}
                                {item.poRate != null &&
                                  item.poRate > 0 &&
                                  Math.abs(item.unitPrice - item.poRate) / item.poRate > 0.01 && (
                                    <p className={`text-xs ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
                                      <AlertTriangle className="inline h-3 w-3 mr-1" />
                                      Invoice price differs from PO rate ({item.poRate})
                                    </p>
                                  )}
                              </td>
                            </tr>
                          ) : null}
                          {/* Missing Weight Warning row */}
                          {item.missingWeightWarning && (
                            <tr>
                              <td
                                colSpan={9}
                                className={`px-3 py-1.5 ${isDarkMode ? "bg-amber-900/20" : "bg-amber-50"}`}
                              >
                                <p className={`text-xs ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
                                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                                  Unit weight missing for weight-based pricing ({item.pricingBasis}). Contact admin to
                                  update product master.
                                </p>
                              </td>
                            </tr>
                          )}
                          {/* Stock Details sub-row (collapsible) */}
                          {isStockExpanded && (
                            <tr className={isDarkMode ? "bg-gray-900/50" : "bg-gray-50/50"}>
                              <td colSpan={9} className="px-3 py-2">
                                <div className="grid grid-cols-6 gap-3">
                                  <div>
                                    <label
                                      htmlFor={`item-po-weight-${index}`}
                                      className={`block text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                                    >
                                      <Scale className="inline h-3 w-3 mr-1" />
                                      PO Wt (kg)
                                    </label>
                                    <input
                                      id={`item-po-weight-${index}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="-"
                                      value={item.poWeightKg || ""}
                                      onChange={(e) => {
                                        const poWt = e.target.value === "" ? null : parseFloat(e.target.value);
                                        const recvWt = item.receivedWeightKg || 0;
                                        const variance = poWt && recvWt ? recvWt - poWt : null;
                                        const variancePercent = poWt && variance ? (variance / poWt) * 100 : null;
                                        handleItemChange(index, "poWeightKg", poWt);
                                        if (variance !== null) {
                                          handleItemChange(index, "weightVarianceKg", variance);
                                          handleItemChange(index, "weightVariancePercent", variancePercent);
                                        }
                                      }}
                                      className={`w-full px-2 py-1.5 rounded border text-xs ${isDarkMode ? "border-gray-700 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-900"} focus:outline-none focus:ring-1 focus:ring-teal-500`}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`item-received-weight-${index}`}
                                      className={`block text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                                    >
                                      Recv Wt (kg)
                                    </label>
                                    <input
                                      id={`item-received-weight-${index}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="-"
                                      value={item.receivedWeightKg || ""}
                                      onChange={(e) => {
                                        const recvWt = e.target.value === "" ? null : parseFloat(e.target.value);
                                        const poWt = item.poWeightKg || 0;
                                        const variance = poWt && recvWt ? recvWt - poWt : null;
                                        const variancePercent = poWt && variance ? (variance / poWt) * 100 : null;
                                        handleItemChange(index, "receivedWeightKg", recvWt);
                                        if (variance !== null) {
                                          handleItemChange(index, "weightVarianceKg", variance);
                                          handleItemChange(index, "weightVariancePercent", variancePercent);
                                        }
                                      }}
                                      className={`w-full px-2 py-1.5 rounded border text-xs ${isDarkMode ? "border-gray-700 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-900"} focus:outline-none focus:ring-1 focus:ring-teal-500`}
                                    />
                                  </div>
                                  <div>
                                    <div
                                      className={`block text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                                    >
                                      Variance
                                    </div>
                                    <div
                                      className={`px-2 py-1.5 rounded border text-xs ${
                                        item.weightVarianceKg
                                          ? item.weightVarianceKg > 0
                                            ? isDarkMode
                                              ? "border-green-600 bg-green-900/20 text-green-400"
                                              : "border-green-300 bg-green-50 text-green-700"
                                            : item.weightVarianceKg < 0
                                              ? isDarkMode
                                                ? "border-red-600 bg-red-900/20 text-red-400"
                                                : "border-red-300 bg-red-50 text-red-700"
                                              : isDarkMode
                                                ? "border-gray-700 bg-gray-700/50 text-gray-400"
                                                : "border-gray-300 bg-gray-100 text-gray-500"
                                          : isDarkMode
                                            ? "border-gray-700 bg-gray-700/50 text-gray-400"
                                            : "border-gray-300 bg-gray-100 text-gray-500"
                                      }`}
                                    >
                                      {item.weightVarianceKg
                                        ? `${item.weightVarianceKg > 0 ? "+" : ""}${item.weightVarianceKg.toFixed(2)} kg (${item.weightVariancePercent?.toFixed(1) || 0}%)`
                                        : "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <label
                                      htmlFor={`item-batch-number-${index}`}
                                      className={`block text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                                    >
                                      <Layers className="inline h-3 w-3 mr-1" />
                                      Batch #
                                    </label>
                                    <input
                                      id={`item-batch-number-${index}`}
                                      type="text"
                                      placeholder="Auto"
                                      value={item.batchNumber || ""}
                                      onChange={(e) => handleItemChange(index, "batchNumber", e.target.value)}
                                      className={`w-full px-2 py-1.5 rounded border text-xs ${isDarkMode ? "border-gray-700 bg-gray-900 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"} focus:outline-none focus:ring-1 focus:ring-teal-500`}
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.createBatch !== false}
                                        onChange={(e) => handleItemChange(index, "createBatch", e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        Create Batch
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Inline Totals at bottom of table */}
              <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex justify-end">
                  <div className="w-56 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Subtotal:</span>
                      <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {(bill.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                        VAT ({VAT_CATEGORIES.find((c) => c.value === bill.vatCategory)?.rate || 5}%):
                      </span>
                      <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {(bill.vatAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className={`h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isDarkMode ? "text-white" : "text-gray-900"}>Total:</span>
                      <span className="text-teal-600">{formatCurrency(bill.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 4 columns, sticky */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Totals */}
              <div
                className={`p-4 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h2
                  className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Subtotal:</span>
                    <span
                      data-testid="subtotal"
                      className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatCurrency(bill.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                      VAT ({VAT_CATEGORIES.find((c) => c.value === bill.vatCategory)?.rate || 5}
                      %):
                    </span>
                    <span
                      data-testid="vat-amount"
                      className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatCurrency(bill.vatAmount)}
                    </span>
                  </div>
                  {(bill.freightCharges > 0 ||
                    bill.customsDuty > 0 ||
                    bill.insuranceCharges > 0 ||
                    bill.handlingCharges > 0 ||
                    bill.otherCharges > 0) && (
                    <div className={`flex justify-between text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <span>Additional Charges:</span>
                      <span>
                        {formatCurrency(
                          (parseFloat(bill.freightCharges) || 0) +
                            (parseFloat(bill.customsDuty) || 0) +
                            (parseFloat(bill.insuranceCharges) || 0) +
                            (parseFloat(bill.handlingCharges) || 0) +
                            (parseFloat(bill.otherCharges) || 0)
                        )}
                      </span>
                    </div>
                  )}
                  {bill.isReverseCharge && (
                    <div className={`flex justify-between text-sm ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                      <span>Reverse Charge VAT:</span>
                      <span data-testid="reverse-charge-amount">{formatCurrency(bill.reverseChargeAmount)}</span>
                    </div>
                  )}
                  <div
                    className={`flex justify-between pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <span className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Total:</span>
                    <span data-testid="total" className="text-lg font-bold text-teal-600">
                      {formatCurrency(bill.total)}
                    </span>
                  </div>

                  {/* Landed Cost Section */}
                  {bill.totalLandedCost > 0 && bill.totalLandedCost !== bill.total && (
                    <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                      <div className="flex justify-between">
                        <span className={`text-sm font-medium ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                          Total Landed Cost:
                        </span>
                        <span className={`text-sm font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                          {formatCurrency(bill.totalLandedCost)}
                        </span>
                      </div>
                      {bill.landedCostPerUnit > 0 && (
                        <div
                          className={`flex justify-between text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                        >
                          <span>Landed Cost / KG:</span>
                          <span>{formatCurrency(bill.landedCostPerUnit)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Quick Actions
                </div>
                <div className="space-y-1.5">
                  {/* Documents */}
                  <button
                    type="button"
                    onClick={() => setDocumentsDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <FileText className="h-4 w-4 opacity-60" />
                    Edit Documents
                    {(bill.supplierInvoiceDate || bill.attachmentUrls?.length > 0) && (
                      <span className={`ml-auto w-2 h-2 rounded-full ${isDarkMode ? "bg-teal-400" : "bg-teal-500"}`} />
                    )}
                  </button>
                  {/* Approval */}
                  <button
                    type="button"
                    onClick={() => setApprovalDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <ClipboardCheck className="h-4 w-4 opacity-60" />
                    Approval Status
                    {bill.approvalStatus !== "PENDING" && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                          bill.approvalStatus === "APPROVED"
                            ? isDarkMode
                              ? "bg-green-900/50 text-green-300"
                              : "bg-green-100 text-green-700"
                            : isDarkMode
                              ? "bg-red-900/50 text-red-300"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {bill.approvalStatus}
                      </span>
                    )}
                  </button>
                  {/* Accounting */}
                  <button
                    type="button"
                    onClick={() => setAccountingDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <DollarSign className="h-4 w-4 opacity-60" />
                    Accounting Details
                    {(bill.costCenter || bill.department || bill.projectCode) && (
                      <span className={`ml-auto w-2 h-2 rounded-full ${isDarkMode ? "bg-teal-400" : "bg-teal-500"}`} />
                    )}
                  </button>
                  {/* Import Details */}
                  <button
                    type="button"
                    onClick={() => setImportDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <Ship className="h-4 w-4 opacity-60" />
                    Import Details
                    {(bill.portOfEntry || bill.billOfLading || bill.importContainerId) && (
                      <span className={`ml-auto w-2 h-2 rounded-full ${isDarkMode ? "bg-teal-400" : "bg-teal-500"}`} />
                    )}
                  </button>
                  {/* Quality Inspection */}
                  <button
                    type="button"
                    onClick={() => setInspectionDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <FileSearch className="h-4 w-4 opacity-60" />
                    Quality Inspection
                    {bill.inspectionRequired && (
                      <span className={`ml-auto w-2 h-2 rounded-full ${isDarkMode ? "bg-teal-400" : "bg-teal-500"}`} />
                    )}
                  </button>
                  {/* Retention */}
                  <button
                    type="button"
                    onClick={() => setRetentionDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <Percent className="h-4 w-4 opacity-60" />
                    Retention
                    {bill.retentionPercentage > 0 && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${isDarkMode ? "bg-teal-900/50 text-teal-300" : "bg-teal-100 text-teal-700"}`}
                      >
                        {bill.retentionPercentage}%
                      </span>
                    )}
                  </button>
                  {/* Charges & Duty (existing) */}
                  <button
                    type="button"
                    onClick={() => setChargesDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <Scale className="h-4 w-4 opacity-60" />
                    Edit Charges & Duty
                    {(bill.freightCharges > 0 ||
                      bill.customsDuty > 0 ||
                      bill.insuranceCharges > 0 ||
                      bill.handlingCharges > 0 ||
                      bill.otherCharges > 0) && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${isDarkMode ? "bg-teal-900/50 text-teal-300" : "bg-teal-100 text-teal-700"}`}
                      >
                        {formatCurrency(
                          (parseFloat(bill.freightCharges) || 0) +
                            (parseFloat(bill.customsDuty) || 0) +
                            (parseFloat(bill.insuranceCharges) || 0) +
                            (parseFloat(bill.handlingCharges) || 0) +
                            (parseFloat(bill.otherCharges) || 0)
                        )}
                      </span>
                    )}
                  </button>
                  {/* Notes & Terms (existing) */}
                  <button
                    type="button"
                    onClick={() => setNotesDrawerOpen(true)}
                    className={QUICK_LINK_CLASSES(isDarkMode)}
                  >
                    <FileText className="h-4 w-4 opacity-60" />
                    Notes & Terms
                    {(bill.notes || bill.terms) && (
                      <span className={`ml-auto w-2 h-2 rounded-full ${isDarkMode ? "bg-teal-400" : "bg-teal-500"}`} />
                    )}
                  </button>
                </div>
              </div>

              {/* Stock-In Information */}
              <div
                className={`p-4 rounded-2xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h2
                  className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Stock-In Details
                </h2>
                <div className={`space-y-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {/* Procurement Channel — derived from items */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Procurement:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        derivedProcurement === "DROPSHIP"
                          ? isDarkMode
                            ? "bg-purple-900/50 text-purple-300"
                            : "bg-purple-100 text-purple-700"
                          : derivedProcurement === "IMPORTED"
                            ? isDarkMode
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                            : derivedProcurement === "MIXED"
                              ? isDarkMode
                                ? "bg-amber-900/50 text-amber-300"
                                : "bg-amber-100 text-amber-700"
                              : isDarkMode
                                ? "bg-green-900/50 text-green-300"
                                : "bg-green-100 text-green-700"
                      }`}
                    >
                      {derivedProcurement === "DROPSHIP"
                        ? "Dropship"
                        : derivedProcurement === "IMPORTED"
                          ? "Import"
                          : derivedProcurement === "MIXED"
                            ? "Mixed"
                            : "Local"}
                    </span>
                  </div>

                  {/* GRN Link */}
                  {bill.grnNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">GRN:</span>
                      <span className="text-teal-600">{bill.grnNumber}</span>
                    </div>
                  )}

                  {/* PO Link */}
                  {bill.poNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">PO:</span>
                      <span>{bill.poNumber}</span>
                    </div>
                  )}

                  {/* Import Container */}
                  {bill.importContainerNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">Container:</span>
                      <span>{bill.importContainerNumber}</span>
                    </div>
                  )}

                  {/* Landed Cost */}
                  {bill.totalLandedCost > 0 && (
                    <>
                      <div
                        className={`flex justify-between pt-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                      >
                        <span className="font-medium">Total Landed Cost:</span>
                        <span className="font-bold text-teal-600">{formatCurrency(bill.totalLandedCost)}</span>
                      </div>
                      {bill.landedCostPerUnit > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>Per KG:</span>
                          <span>{formatCurrency(bill.landedCostPerUnit)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Batch Creation — Select All shortcut */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium">Create Batches:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <span className="sr-only">Toggle all batch creation</span>
                      <input
                        type="checkbox"
                        checked={bill.items.every((item) => item.createBatch !== false)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBill((prev) => ({
                            ...prev,
                            triggerBatchCreation: checked,
                            items: prev.items.map((item) => ({ ...item, createBatch: checked })),
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div
                        className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${
                          isDarkMode ? "bg-gray-600 peer-checked:bg-teal-600" : "bg-gray-300 peer-checked:bg-teal-600"
                        }`}
                      ></div>
                    </label>
                  </div>
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Toggle all items. Override individual items in line items table.
                  </p>
                </div>
              </div>
            </div>
            {/* End sticky wrapper */}
          </div>
          {/* End sidebar column */}
        </div>
        {/* End 12-col grid */}
      </main>

      {/* Charges & Duty Drawer */}
      <Drawer
        isOpen={chargesDrawerOpen}
        onClose={() => setChargesDrawerOpen(false)}
        title="Freight & Duty Charges"
        subtitle="Additional landed cost components for this bill"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="freight-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Freight Charges
              </label>
              <input
                id="freight-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={bill.freightCharges || ""}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setBill((prev) => ({ ...prev, freightCharges: amount }));
                  recalculateTotals(bill.items);
                }}
                className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500"
                } focus:ring-1 focus:ring-teal-500`}
              />
            </div>
            <div>
              <label
                htmlFor="customs-duty"
                className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Customs Duty
              </label>
              <input
                id="customs-duty"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={bill.customsDuty || ""}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setBill((prev) => ({ ...prev, customsDuty: amount }));
                  recalculateTotals(bill.items);
                }}
                className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500"
                } focus:ring-1 focus:ring-teal-500`}
              />
            </div>
            <div>
              <label
                htmlFor="insurance-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Insurance Charges
              </label>
              <input
                id="insurance-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={bill.insuranceCharges || ""}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setBill((prev) => ({ ...prev, insuranceCharges: amount }));
                  recalculateTotals(bill.items);
                }}
                className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500"
                } focus:ring-1 focus:ring-teal-500`}
              />
            </div>
            <div>
              <label
                htmlFor="handling-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Handling Charges
              </label>
              <input
                id="handling-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={bill.handlingCharges || ""}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setBill((prev) => ({ ...prev, handlingCharges: amount }));
                  recalculateTotals(bill.items);
                }}
                className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500"
                } focus:ring-1 focus:ring-teal-500`}
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="other-charges"
                className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Other Charges
              </label>
              <input
                id="other-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={bill.otherCharges || ""}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setBill((prev) => ({ ...prev, otherCharges: amount }));
                  recalculateTotals(bill.items);
                }}
                className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-teal-500"
                } focus:ring-1 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* Summary */}
          <div
            className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-900 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}
          >
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Charges</span>
              <span className="text-sm font-bold font-mono">
                {formatCurrency(
                  (parseFloat(bill.freightCharges) || 0) +
                    (parseFloat(bill.customsDuty) || 0) +
                    (parseFloat(bill.insuranceCharges) || 0) +
                    (parseFloat(bill.handlingCharges) || 0) +
                    (parseFloat(bill.otherCharges) || 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setChargesDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Notes & Terms Drawer */}
      <Drawer
        isOpen={notesDrawerOpen}
        onClose={() => setNotesDrawerOpen(false)}
        title="Notes & Terms"
        subtitle="Internal notes and payment terms for this bill"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label
              htmlFor="bill-notes"
              className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Bill Notes
            </label>
            <textarea
              id="bill-notes"
              value={bill.notes || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this supplier bill..."
              rows={4}
              className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none resize-none ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-teal-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
              } focus:ring-1 focus:ring-teal-500`}
            />
          </div>
          <div>
            <label
              htmlFor="payment-terms"
              className={`block text-xs mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Payment Terms
            </label>
            <textarea
              id="payment-terms"
              value={bill.terms || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, terms: e.target.value }))}
              placeholder="Enter payment terms..."
              rows={4}
              className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none resize-none ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-teal-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
              } focus:ring-1 focus:ring-teal-500`}
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setNotesDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Documents Drawer */}
      <Drawer
        isOpen={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
        title="Document Management"
        subtitle="Document type, supplier invoice date, and attachments"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="drawer-doc-type" className={LABEL_CLASSES(isDarkMode)}>
              Document Type
            </label>
            <select
              id="drawer-doc-type"
              value={bill.documentType || "INVOICE"}
              onChange={(e) => setBill((prev) => ({ ...prev, documentType: e.target.value }))}
              className={INPUT_CLASSES(isDarkMode)}
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="drawer-supplier-inv-date" className={LABEL_CLASSES(isDarkMode)}>
              Supplier Invoice Date
            </label>
            <input
              id="drawer-supplier-inv-date"
              type="date"
              value={bill.supplierInvoiceDate ? formatDateForInput(bill.supplierInvoiceDate) : ""}
              onChange={(e) => setBill((prev) => ({ ...prev, supplierInvoiceDate: e.target.value }))}
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-attachment-urls" className={LABEL_CLASSES(isDarkMode)}>
              Attachment URLs
            </label>
            <textarea
              id="drawer-attachment-urls"
              value={(bill.attachmentUrls || []).join("\n")}
              onChange={(e) =>
                setBill((prev) => ({
                  ...prev,
                  attachmentUrls: e.target.value.split("\n").filter((u) => u.trim()),
                }))
              }
              placeholder="Enter one URL per line..."
              rows={3}
              className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none resize-none ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-teal-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
              } focus:ring-1 focus:ring-teal-500`}
            />
          </div>
        </div>
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setDocumentsDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Approval & Status Drawer */}
      <Drawer
        isOpen={approvalDrawerOpen}
        onClose={() => setApprovalDrawerOpen(false)}
        title="Approval & Status"
        subtitle="Approval workflow status and rejection details"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="drawer-approval-status" className={LABEL_CLASSES(isDarkMode)}>
              Approval Status
            </label>
            <select
              id="drawer-approval-status"
              value={bill.approvalStatus || "PENDING"}
              onChange={(e) => setBill((prev) => ({ ...prev, approvalStatus: e.target.value }))}
              className={INPUT_CLASSES(isDarkMode)}
            >
              {APPROVAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {bill.approvalStatus === "REJECTED" && (
            <div>
              <label htmlFor="drawer-rejection-reason" className={LABEL_CLASSES(isDarkMode)}>
                Rejection Reason
              </label>
              <textarea
                id="drawer-rejection-reason"
                value={bill.rejectionReason || ""}
                onChange={(e) => setBill((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                placeholder="Reason for rejection..."
                rows={3}
                className={`w-full py-2 px-3 text-sm rounded-md border shadow-sm outline-none resize-none ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                } focus:ring-1 focus:ring-teal-500`}
              />
            </div>
          )}
          {bill.approvedBy && (
            <div>
              <label htmlFor="drawer-approved-by" className={LABEL_CLASSES(isDarkMode)}>
                Approved By
              </label>
              <input
                id="drawer-approved-by"
                type="text"
                value={bill.approvedBy || ""}
                readOnly
                className={`${INPUT_CLASSES(isDarkMode)} opacity-60 cursor-not-allowed`}
              />
            </div>
          )}
          {bill.approvedAt && (
            <div>
              <label htmlFor="drawer-approved-at" className={LABEL_CLASSES(isDarkMode)}>
                Approved At
              </label>
              <input
                id="drawer-approved-at"
                type="text"
                value={bill.approvedAt ? new Date(bill.approvedAt).toLocaleString() : ""}
                readOnly
                className={`${INPUT_CLASSES(isDarkMode)} opacity-60 cursor-not-allowed`}
              />
            </div>
          )}
        </div>
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setApprovalDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Accounting Details Drawer */}
      <Drawer
        isOpen={accountingDrawerOpen}
        onClose={() => setAccountingDrawerOpen(false)}
        title="Accounting Details"
        subtitle="Cost center, department, and project code"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="drawer-cost-center" className={LABEL_CLASSES(isDarkMode)}>
              Cost Center
            </label>
            <input
              id="drawer-cost-center"
              type="text"
              value={bill.costCenter || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, costCenter: e.target.value }))}
              placeholder="Enter cost center..."
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-department" className={LABEL_CLASSES(isDarkMode)}>
              Department
            </label>
            <input
              id="drawer-department"
              type="text"
              value={bill.department || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, department: e.target.value }))}
              placeholder="Enter department..."
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-project-code" className={LABEL_CLASSES(isDarkMode)}>
              Project Code
            </label>
            <input
              id="drawer-project-code"
              type="text"
              value={bill.projectCode || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, projectCode: e.target.value }))}
              placeholder="Enter project code..."
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
        </div>
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setAccountingDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Import Details Drawer */}
      <Drawer
        isOpen={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        title="Import Details"
        subtitle="Import container, port of entry, and shipping details"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          {hasImportedItems && availableContainers.length > 0 && (
            <div>
              <label htmlFor="drawer-import-container" className={LABEL_CLASSES(isDarkMode)}>
                Import Container
              </label>
              <select
                id="drawer-import-container"
                value={bill.importContainerId || ""}
                onChange={(e) => {
                  const container = availableContainers.find((c) => c.id === e.target.value);
                  setBill((prev) => ({
                    ...prev,
                    importContainerId: e.target.value || null,
                    importContainerNumber: container ? container.containerNumber : "",
                  }));
                }}
                className={INPUT_CLASSES(isDarkMode)}
              >
                <option value="">No container linked</option>
                {availableContainers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.containerNumber} — {c.status}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="drawer-port-of-entry" className={LABEL_CLASSES(isDarkMode)}>
              Port of Entry
            </label>
            <input
              id="drawer-port-of-entry"
              type="text"
              value={bill.portOfEntry || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, portOfEntry: e.target.value }))}
              placeholder="e.g. Jebel Ali, Khalifa Port..."
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-arrival-date" className={LABEL_CLASSES(isDarkMode)}>
              Arrival Date
            </label>
            <input
              id="drawer-arrival-date"
              type="date"
              value={bill.arrivalDate ? formatDateForInput(bill.arrivalDate) : ""}
              onChange={(e) => setBill((prev) => ({ ...prev, arrivalDate: e.target.value }))}
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-bill-of-lading" className={LABEL_CLASSES(isDarkMode)}>
              Bill of Lading
            </label>
            <input
              id="drawer-bill-of-lading"
              type="text"
              value={bill.billOfLading || ""}
              onChange={(e) => setBill((prev) => ({ ...prev, billOfLading: e.target.value }))}
              placeholder="B/L number..."
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
        </div>
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setImportDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Quality Inspection Drawer */}
      <Drawer
        isOpen={inspectionDrawerOpen}
        onClose={() => setInspectionDrawerOpen(false)}
        title="Quality Inspection"
        subtitle="Inspection requirements and status"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="inspectionRequired"
              checked={bill.inspectionRequired || false}
              onChange={(e) => setBill((prev) => ({ ...prev, inspectionRequired: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="inspectionRequired" className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              Inspection Required
            </label>
          </div>
          {bill.inspectionRequired && (
            <>
              <div>
                <label htmlFor="drawer-inspection-date" className={LABEL_CLASSES(isDarkMode)}>
                  Inspection Date
                </label>
                <input
                  id="drawer-inspection-date"
                  type="date"
                  value={bill.inspectionDate ? formatDateForInput(bill.inspectionDate) : ""}
                  onChange={(e) => setBill((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>
              <div>
                <label htmlFor="drawer-inspection-status" className={LABEL_CLASSES(isDarkMode)}>
                  Inspection Status
                </label>
                <select
                  id="drawer-inspection-status"
                  value={bill.inspectionStatus || ""}
                  onChange={(e) => setBill((prev) => ({ ...prev, inspectionStatus: e.target.value || null }))}
                  className={INPUT_CLASSES(isDarkMode)}
                >
                  <option value="">Select status...</option>
                  {INSPECTION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setInspectionDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* Retention Drawer */}
      <Drawer
        isOpen={retentionDrawerOpen}
        onClose={() => setRetentionDrawerOpen(false)}
        title="Retention"
        subtitle="Retention percentage, release date, and calculated amount"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="drawer-retention-pct" className={LABEL_CLASSES(isDarkMode)}>
              Retention Percentage (%)
            </label>
            <input
              id="drawer-retention-pct"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={bill.retentionPercentage || 0}
              onChange={(e) =>
                setBill((prev) => ({
                  ...prev,
                  retentionPercentage: Number.parseFloat(e.target.value) || 0,
                }))
              }
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-retention-release" className={LABEL_CLASSES(isDarkMode)}>
              Release Date
            </label>
            <input
              id="drawer-retention-release"
              type="date"
              value={bill.retentionReleaseDate ? formatDateForInput(bill.retentionReleaseDate) : ""}
              onChange={(e) => setBill((prev) => ({ ...prev, retentionReleaseDate: e.target.value }))}
              className={INPUT_CLASSES(isDarkMode)}
            />
          </div>
          <div>
            <label htmlFor="drawer-retention-amount" className={LABEL_CLASSES(isDarkMode)}>
              Retention Amount
            </label>
            <input
              id="drawer-retention-amount"
              type="text"
              value={formatCurrency(bill.retentionAmount || 0)}
              readOnly
              className={`${INPUT_CLASSES(isDarkMode)} opacity-60 cursor-not-allowed`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Auto-calculated from retention % and bill total
            </p>
          </div>
        </div>
        <div
          className="sticky bottom-0 pt-4 mt-6"
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(17,24,39,1) 70%, rgba(17,24,39,0))"
              : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
          }}
        >
          <button
            type="button"
            onClick={() => setRetentionDrawerOpen(false)}
            className="w-full bg-teal-600 text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </Drawer>

      {/* GRN Match Modal */}
      {showGRNMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl shadow-2xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`sticky top-0 px-6 py-4 border-b ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Select GRN to Match
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGRNMatchModal(false)}
                  className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Link this supplier bill to a Goods Receipt Note for 3-way matching (PO - GRN - Bill)
              </p>
            </div>

            <div className="p-6">
              {loadingGRNs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : availableGRNs.length === 0 ? (
                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No unbilled GRNs available for this vendor.</p>
                  <p className="text-sm mt-1">Create a GRN first or select a different vendor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableGRNs.map((grn) => (
                    <button
                      type="button"
                      key={grn.id}
                      onClick={() => handleGRNSelect(grn)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isDarkMode
                          ? "border-gray-700 hover:border-teal-500 hover:bg-gray-700/50"
                          : "border-gray-200 hover:border-teal-500 hover:bg-teal-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {grn.grnNumber}
                          </div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {grn.poNumber && `PO: ${grn.poNumber}`}
                            {grn.receivedDate && ` | Received: ${grn.receivedDate}`}
                          </div>
                          {grn.items && grn.items.length > 0 && (
                            <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {grn.items.length} item
                              {grn.items.length !== 1 ? "s" : ""} | Total: {formatCurrency(grn.totalAmount || 0)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {grn.procurementChannel === "IMPORTED" && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                isDarkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <Ship className="h-3 w-3 inline mr-1" />
                              Import
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isDarkMode ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-700"
                            }`}
                          >
                            {grn.status || "approved"}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Skip GRN Matching Option */}
              <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <button
                  type="button"
                  onClick={() => setShowGRNMatchModal(false)}
                  className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Skip - Create bill without GRN link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Correction Guide Modal */}
      <CorrectionHelpModal
        open={showCorrectionGuide}
        onOpenChange={setShowCorrectionGuide}
        config={supplierBillCorrectionConfig}
      />
    </div>
  );
};

export default SupplierBillForm;
