import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Download,
  ChevronDown,
  X,
  AlertTriangle,
  Info,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  createInvoice,
  createCompany,
  createSteelItem,
  PAYMENT_MODES,
  DELIVERY_TERMS,
  DISCOUNT_TYPES,
  STEEL_GRADES,
  FINISHES,
} from "../types";
import {
  generateInvoiceNumber,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotalTRN,
  calculateTotal,
  formatCurrency,
  formatDateForInput,
  titleCase,
  normalizeLLC,
  calculateDiscountedTRN,
} from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import InvoicePreview from "../components/InvoicePreview";
import { invoiceService, companyService } from "../services";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { useApiData, useApi } from "../hooks/useApi";
import { notificationService } from "../services/notificationService";
import PaymentSummary from "../components/PaymentSummary";
import PaymentLedger from "../components/PaymentLedger";
import AddPaymentModal from "../components/AddPaymentModal";
import {
  calculateTotalPaid,
  calculateBalanceDue,
  calculatePaymentStatus,
  getLastPaymentDate
} from "../utils/paymentUtils";
import { getInvoiceReminderInfo, formatDaysMessage } from "../utils/reminderUtils";

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
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${
        isDarkMode ? "bg-gray-600" : "bg-gray-400"
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${
        isDarkMode ? "gray-800" : "white"
      }`;
    } else if (variant === "secondary") {
      return `${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-gray-200 hover:bg-gray-300"
      } ${isDarkMode ? "text-white" : "text-gray-800"} focus:ring-${
        isDarkMode ? "gray-500" : "gray-400"
      } disabled:${
        isDarkMode ? "bg-gray-800" : "bg-gray-100"
      } focus:ring-offset-${isDarkMode ? "gray-800" : "white"}`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      } focus:ring-teal-500 disabled:${
        isDarkMode ? "bg-gray-800" : "bg-gray-50"
      } focus:ring-offset-${isDarkMode ? "gray-800" : "white"}`;
    }
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
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

const Input = ({ label, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Select = ({ label, children, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full pl-3 pr-9 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 appearance-none ${
            isDarkMode
              ? "border-gray-600 bg-gray-800 text-white disabled:bg-gray-700 disabled:text-gray-500"
              : "border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
          } ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        />
      </div>
      {error && (
        <p
          className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Textarea = ({ label, error, className = "", ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Card = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
        isDarkMode
          ? "bg-gray-800 border border-gray-600"
          : "bg-white border border-gray-200"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Alert = ({ variant = "info", children, onClose, className = "" }) => {
  const { isDarkMode } = useTheme();

  const getVariantClasses = () => {
    const darkVariants = {
      info: "bg-blue-900/20 border-blue-500/30 text-blue-300",
      warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
      error: "bg-red-900/20 border-red-500/30 text-red-300",
      success: "bg-green-900/20 border-green-500/30 text-green-300",
    };

    const lightVariants = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
      success: "bg-green-50 border-green-200 text-green-800",
    };

    return isDarkMode ? darkVariants[variant] : lightVariants[variant];
  };

  return (
    <div
      className={`border rounded-lg p-4 ${getVariantClasses()} ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === "warning" && <AlertTriangle className="h-5 w-5" />}
          {variant === "info" && <Info className="h-5 w-5" />}
        </div>
        <div className="ml-3 flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${
              isDarkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const Autocomplete = ({
  options = [],
  value,
  onChange,
  onInputChange,
  inputValue,
  placeholder,
  label,
  disabled = false,
  renderOption,
  noOptionsText = "No options",
  className = "",
  title,
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Lightweight fuzzy match: token-based includes with typo tolerance (edit distance <= 1)
  const norm = (s) => (s || '').toString().toLowerCase().trim();
  const ed1 = (a, b) => {
    // Early exits
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return 2; // too far
    // DP edit distance capped at 1 for speed
    let dpPrev = new Array(lb + 1);
    let dpCurr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dpPrev[j] = j;
    for (let i = 1; i <= la; i++) {
      dpCurr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lb; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dpCurr[j] = Math.min(
          dpPrev[j] + 1,            // deletion
          dpCurr[j - 1] + 1,        // insertion
          dpPrev[j - 1] + cost      // substitution
        );
        // Early cut: if all >1 can break (skip for simplicity)
      }
      // swap
      const tmp = dpPrev; dpPrev = dpCurr; dpCurr = tmp;
    }
    return dpPrev[lb];
  };

  const tokenMatch = (token, label) => {
    const t = norm(token);
    const l = norm(label);
    if (!t) return true;
    if (l.includes(t)) return true;
    // fuzzy: split label into words and check any word within edit distance 1
    const words = l.split(/\s+/);
    for (const w of words) {
      if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
    }
    return false;
  };

  const fuzzyFilter = (opts, query) => {
    const q = norm(query);
    if (!q) return opts;
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const o of opts) {
      const label = norm(o.label || o.name || '');
      if (!label) continue;
      let ok = true;
      let score = 0;
      for (const t of tokens) {
        if (!tokenMatch(t, label)) { ok = false; break; }
        // basic score: shorter distance preferred
        const idx = label.indexOf(norm(t));
        score += idx >= 0 ? 0 : 1; // penalize fuzzy matches
      }
      if (ok) scored.push({ o, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.map(s => s.o);
  };

  useEffect(() => {
    if (inputValue) {
      const filtered = fuzzyFilter(options, inputValue);
      setFilteredOptions(filtered.slice(0, 20));
    } else {
      setFilteredOptions(options);
    }
  }, [options, inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
  };

  const updateDropdownPosition = () => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;

      dropdown.style.position = "fixed";
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      // Make dropdown at least as wide as the input, but allow it to grow to fit contents
      dropdown.style.minWidth = `${inputRect.width}px`;
      dropdown.style.width = 'auto';
      dropdown.style.maxWidth = '90vw';
      dropdown.style.zIndex = "9999";
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <div ref={inputRef}>
        <Input
          label={label}
          value={inputValue || ""}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          title={title}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`border rounded-lg shadow-xl max-h-60 overflow-auto ${
            isDarkMode
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || index}
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-white border-gray-700"
                    : "hover:bg-gray-50 text-gray-900 border-gray-100"
                }`}
                onMouseDown={() => handleOptionSelect(option)}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              className={`px-3 py-2 text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {noOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div
            className={`absolute inset-0 ${
              isDarkMode ? "bg-gray-900" : "bg-black"
            } opacity-75`}
          ></div>
        </div>

        <div
          className={`inline-block align-bottom border rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${
            sizes[size]
          } sm:w-full sm:p-6 ${
            isDarkMode
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-medium ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className={
                isDarkMode
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-700"
              }
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = "md" }) => {
  const { isDarkMode } = useTheme();
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-blue-600 ${
        sizes[size]
      } ${isDarkMode ? "border-gray-300" : "border-gray-200"}`}
    ></div>
  );
};

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Debounce timeout refs for charges fields
  const chargesTimeout = useRef(null);

  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    category: "rebar",
    grade: "",
    size: "",
    weight: "",
    unit: "kg",
    description: "",
    current_stock: "",
    min_stock: "",
    max_stock: "",
    cost_price: "",
    selling_price: "",
    supplier: "",
    location: "",
    specifications: {
      length: "",
      width: "",
      thickness: "",
      diameter: "",
      tensileStrength: "",
      yieldStrength: "",
      carbonContent: "",
      coating: "",
      standard: "",
    },
  });
  const [selectedProductForRow, setSelectedProductForRow] = useState(-1);
  const [searchInputs, setSearchInputs] = useState({});
  const [tradeLicenseStatus, setTradeLicenseStatus] = useState(null);
  const [showTradeLicenseAlert, setShowTradeLicenseAlert] = useState(false);

  // Status transition management
  const [originalStatus, setOriginalStatus] = useState(null);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  // Payment tracking management
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Helper to enforce invoice number prefix by status
  const withStatusPrefix = (num, status) => {
    const desired =
      status === "draft" ? "DFT" : status === "proforma" ? "PFM" : "INV";
    
    if (!num || typeof num !== "string") {
      // Generate the base number format YYYYMM-NNNN from backend API
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      return `${desired}-${year}${month}-0001`;
    }
    
    // Handle numbers that already have the correct format: PREFIX-YYYYMM-NNNN
    const formatMatch = num.match(/^(DFT|PFM|INV)-(\d{6}-\d{4})$/);
    if (formatMatch) {
      // Replace the prefix but keep the YYYYMM-NNNN part
      return `${desired}-${formatMatch[2]}`;
    }
    
    // Handle legacy format or partial numbers - try to extract meaningful parts
    const parts = num.split('-');
    if (parts.length >= 2) {
      // If it looks like YYYYMM-NNNN format, use it
      const datePart = parts[parts.length - 2];
      const numberPart = parts[parts.length - 1];
      if (/^\d{6}$/.test(datePart) && /^\d{4}$/.test(numberPart)) {
        return `${desired}-${datePart}-${numberPart}`;
      }
    }
    
    // Fallback: generate new format
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${desired}-${year}${month}-0001`;
  };

  /**
   * ⚠️ INVOICE STATUS TRANSITION RULES ⚠️
   *
   * ALLOWED TRANSITIONS:
   * - draft → proforma (convert draft to quote)
   * - draft → issued (direct finalization - issue tax invoice)
   * - proforma → issued (convert quote to final tax invoice after sale completion)
   *
   * FORBIDDEN TRANSITIONS:
   * - issued → draft (cannot un-finalize)
   * - issued → proforma (cannot un-finalize)
   * - Any backward movement from issued status
   *
   * INVENTORY IMPACT BY STATUS:
   * - draft: NO inventory impact (work in progress)
   * - proforma: NO inventory impact (quote only, no commitment)
   * - issued (Final Tax Invoice): YES - inventory deducted, revenue recorded
   *
   * Backend should enforce inventory deduction ONLY when status changes to 'issued'
   */
  const ALLOWED_STATUS_TRANSITIONS = {
    'draft': ['proforma', 'issued'],
    'proforma': ['issued'],
    'issued': [] // Final Tax Invoice cannot be changed (requires credit note)
  };

  const isValidStatusTransition = (fromStatus, toStatus) => {
    if (fromStatus === toStatus) return true;
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTargets.includes(toStatus);
  };

  const needsConfirmation = (fromStatus, toStatus) => {
    // Require confirmation when moving to 'issued' (Final Tax Invoice)
    return toStatus === 'issued' && fromStatus !== 'issued';
  };

  const canEditInvoice = (status) => {
    // Cannot edit Final Tax Invoice (issued status) - requires credit note
    return status !== 'issued';
  };

  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    newInvoice.invoiceNumber = withStatusPrefix(
      generateInvoiceNumber(),
      newInvoice.status || "draft"
    );
    return newInvoice;
  });

  // No extra payment terms fields; Due Date remains directly editable

  // Remove deferred value which might be causing delays
  const deferredItems = invoice.items;

  const { data: company, loading: loadingCompany } = useApiData(
    companyService.getCompany,
    [],
    true
  );
  const { execute: saveInvoice, loading: savingInvoice } = useApi(
    invoiceService.createInvoice
  );
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(
    invoiceService.updateInvoice
  );
  const { data: existingInvoice, loading: loadingInvoice } = useApiData(
    () => (id ? invoiceService.getInvoice(id) : null),
    [id],
    !!id
  );
  const { data: nextInvoiceData } = useApiData(
    () => invoiceService.getNextInvoiceNumber(),
    [],
    !id
  );
  const { data: customersData, loading: loadingCustomers } = useApiData(
    () => customerService.getCustomers({ status: "active" }),
    []
  );
  const {
    data: productsData,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useApiData(() => productService.getProducts({ limit: 1000 }), []);
  const { execute: createProduct, loading: creatingProduct } = useApi(
    productService.createProduct
  );

  // Date helpers for constraints
  const invoiceDateObj = useMemo(() => {
    try {
      return invoice.date ? new Date(invoice.date) : new Date();
    } catch {
      return new Date();
    }
  }, [invoice.date]);

  const dueMinStr = useMemo(() => formatDateForInput(invoiceDateObj), [invoiceDateObj]);
  const dueMaxStr = useMemo(() => {
    const d = new Date(invoiceDateObj.getTime());
    d.setMonth(d.getMonth() + 6);
    return formatDateForInput(d);
  }, [invoiceDateObj]);

  // Warehouses state
  const [warehouses, setWarehouses] = useState([]);

  // Fetch warehouses once (active only)
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await (await import("../services/api")).apiClient.get(
          "/warehouses"
        );
        const list = res?.warehouses || res?.data?.warehouses || [];
        const active = list.filter((w) => w.is_active !== false);
        setWarehouses(active);
      } catch (err) {
        console.warn("Failed to fetch warehouses:", err);
        setWarehouses([]);
      }
    };
    fetchWarehouses();
  }, []);

  // Heavily optimized calculations with minimal dependencies
  const computedSubtotal = useMemo(
    () => calculateSubtotal(invoice.items),
    [invoice.items]
  );
  const computedVatAmount = useMemo(() => {
    return calculateDiscountedTRN(
      invoice.items,
      invoice.discountType,
      invoice.discountPercentage,
      invoice.discountAmount
    );
  }, [
    invoice.items,
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount,
  ]);

  const computedDiscountAmount = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;

    if (invoice.discountType === "percentage") {
      return (computedSubtotal * discountPercentage) / 100;
    } else {
      return discountAmount;
    }
  }, [
    computedSubtotal,
    invoice.discountAmount,
    invoice.discountPercentage,
    invoice.discountType,
  ]);

  // Parse charges only when calculating final total to avoid blocking on every keystroke
  const computedTotal = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;

    let totalDiscount = 0;
    if (invoice.discountType === "percentage") {
      totalDiscount = (computedSubtotal * discountPercentage) / 100;
    } else {
      totalDiscount = discountAmount;
    }

    const subtotalAfterDiscount = Math.max(0, computedSubtotal - totalDiscount);
    return calculateTotal(subtotalAfterDiscount, computedVatAmount);
  }, [
    computedSubtotal,
    computedVatAmount,
    invoice.discountAmount,
    invoice.discountPercentage,
    invoice.discountType,
  ]);

  useEffect(() => {
    if (nextInvoiceData && nextInvoiceData.next_invoice_number && !id) {
      setInvoice((prev) => ({
        ...prev,
        invoiceNumber: withStatusPrefix(
          nextInvoiceData.next_invoice_number,
          prev.status || "draft"
        ),
      }));
    }
  }, [nextInvoiceData, id]);

  // Track original status when invoice is loaded/changed
  useEffect(() => {
    if (invoice.status && !originalStatus) {
      setOriginalStatus(invoice.status);
    }
  }, [invoice.status, originalStatus]);

  useEffect(() => {
    if (existingInvoice && id) {
      setInvoice(existingInvoice);
    }
  }, [existingInvoice, id]);

  const checkTradeLicenseStatus = async (customerId) => {
    try {
      // Use axios-based client to benefit from auth + baseURL
      const { apiClient } = await import("../services/api");
      const licenseStatus = await apiClient.get(
        `/customers/${customerId}/trade-license-status`
      );
      if (licenseStatus) {
        setTradeLicenseStatus(licenseStatus);
        // Show alert for expired or expiring licenses
        if (
          licenseStatus.hasLicense &&
          (licenseStatus.status === "expired" ||
            licenseStatus.status === "expiring_soon")
        ) {
          setShowTradeLicenseAlert(true);
        } else {
          setShowTradeLicenseAlert(false);
        }
      }
    } catch (error) {
      // Fall back to fetch with defensive parsing to capture server HTML errors
      try {
        const resp = await fetch(
          `/api/customers/${customerId}/trade-license-status`
        );
        const ct = resp.headers.get("content-type") || "";
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 200)}`);
        }
        if (!ct.includes("application/json")) {
          const txt = await resp.text();
          throw new SyntaxError(
            `Unexpected content-type: ${ct}. Body starts: ${txt.slice(0, 80)}`
          );
        }
        const licenseStatus = await resp.json();
        setTradeLicenseStatus(licenseStatus);
      } catch (fallbackErr) {
        console.error("Error checking trade license status:", fallbackErr);
      }
    }
  };

  const handleCustomerSelect = useCallback(
    (customerId) => {
      const customers = customersData?.customers || [];
      const selectedCustomer = customers.find((c) => c.id == customerId);

      if (selectedCustomer) {
        setInvoice((prev) => ({
          ...prev,
          customer: {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email || "",
            phone: selectedCustomer.phone || "",
            // Use TRN number from customer data
            vatNumber: selectedCustomer.trn_number || selectedCustomer.vat_number || "",
            address: {
              street: selectedCustomer.address?.street || "",
              city: selectedCustomer.address?.city || "",
              emirate: selectedCustomer.address?.emirate || "",
              poBox: selectedCustomer.address?.poBox || "",
            },
          },
        }));

        // Check trade license status
        checkTradeLicenseStatus(customerId);
      }
    },
    [customersData]
  );

  const handleProductSelect = useCallback((index, product) => {
    if (product && typeof product === "object") {
      // Helper: extract thickness from product specs or size string
      const getThickness = (p) => {
        try {
          const cat = (p?.category || '').toString().toLowerCase();
          const isPipe = /pipe/.test(cat);
          const specThk = p?.specifications?.thickness || p?.specifications?.Thickness;
          if (specThk && String(specThk).trim()) return String(specThk).trim();
          if (isPipe) return ""; // avoid deriving thickness from pipe size
          const sizeStr = p?.size ? String(p.size) : "";
          const mmMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(mm)\b/i);
          if (mmMatch) return `${mmMatch[1]}mm`;
          const xParts = sizeStr.split(/x|X|\*/).map((s) => s.trim()).filter(Boolean);
          if (xParts.length >= 2) {
            const last = xParts[xParts.length - 1];
            const numMatch = last.match(/\d+(?:\.\d+)?/);
            if (numMatch) return `${numMatch[0]}mm`;
          }
        } catch {}
        return "";
      };

      setInvoice((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          name: product.name,
          category: product.category || "",
          commodity: product.commodity || "SS",
          grade: product.grade || "",
          finish: product.finish || "",
          size: product.size || "",
          sizeInch: product.size_inch || "",
          od: product.od || "",
          length: product.length || "",
          thickness: getThickness(product),
          // unit removed from invoice UI
          rate: product.selling_price || 0,
          vatRate: newItems[index].vatRate || 5, // Preserve existing VAT rate or default to 5%
          amount: calculateItemAmount(
            newItems[index].quantity,
            product.selling_price || 0
          ),
        };

        return {
          ...prev,
          items: newItems,
        };
      });

      // Clear search input for this row
      setSearchInputs((prev) => ({ ...prev, [index]: "" }));
    }
  }, []);

  // No automatic coupling; due date is independently editable by the user

  const searchTimerRef = useRef(null);

  const handleSearchInputChange = useCallback((index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Update the item name immediately for responsive typing
    setInvoice((prev) => {
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
    // Debounced server-side product search
    try {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(async () => {
        const term = (value || '').trim();
        if (!term) return;
        try {
          const resp = await productService.getProducts({ search: term, limit: 20 });
          // Overwrite the shared productsData with the fetched subset is complex;
          // instead we keep a local map of options for active row via Autocomplete filtering.
          // Here we attach the fetched results to a special key for the row.
          setSearchInputs((prev) => ({ ...prev, __results: resp?.products || [] }));
        } catch (err) {
          console.warn('Product search failed:', err);
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
        }
      }, 300);
    } catch {}
  }, []);

  const isProductExisting = useCallback(
    (index) => {
      const searchValue = searchInputs[index] || "";
      const products = productsData?.products || [];
      return products.some(
        (product) => product.name.toLowerCase() === searchValue.toLowerCase()
      );
    },
    [productsData, searchInputs]
  );

  const handleItemChange = useCallback((index, field, value) => {
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      if (field === "quantity" || field === "rate") {
        newItems[index].amount = calculateItemAmount(
          newItems[index].quantity,
          newItems[index].rate
        );
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  const productOptions = useMemo(() => {
    const list = productsData?.products || [];
    return list.map((product) => ({
      ...product,
      label: product.name,
      subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${
        product.selling_price || 0
      }`,
    }));
  }, [productsData]);

  const searchOptions = useMemo(() => {
    const list = searchInputs?.__results || [];
    return list.map((product) => ({
      ...product,
      label: product.name,
      subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${
        product.selling_price || 0
      }`,
    }));
  }, [searchInputs.__results]);

  // Dynamic option lists augmented from products data
  const allGrades = useMemo(() => {
    try {
      const set = new Set(STEEL_GRADES || []);
      (productsData?.products || []).forEach((p) => {
        if (p && p.grade && String(p.grade).trim()) set.add(String(p.grade).trim());
      });
      return Array.from(set);
    } catch {
      return STEEL_GRADES || [];
    }
  }, [productsData]);

  const allFinishes = useMemo(() => {
    try {
      const set = new Set(FINISHES || []);
      (productsData?.products || []).forEach((p) => {
        if (p && p.finish && String(p.finish).trim()) set.add(String(p.finish).trim());
      });
      return Array.from(set);
    } catch {
      return FINISHES || [];
    }
  }, [productsData]);

  // Simplified filtering to reduce computation
  const getFilteredOptions = useCallback((options, inputValue) => {
    if (!inputValue) return options.slice(0, 20);
    return options
      .filter((option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase())
      )
      .slice(0, 20);
  }, []);

  // Debounced handler for charges fields to prevent calculation blocking
  const handleChargeChange = useCallback((field, value) => {
    // Update UI immediately for responsive typing
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const addItem = useCallback(() => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, createSteelItem()],
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // Status change handler with validation and confirmation
  const handleStatusChange = (newStatus) => {
    const currentStatus = invoice.status || 'draft';

    // For new invoices (no id), allow any status selection freely
    // Only apply transition validation for existing invoices
    if (id) {
      // Check if transition is valid for existing invoices
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        notificationService.error(
          `Cannot change from ${currentStatus.toUpperCase()} to ${newStatus.toUpperCase()}. ` +
          `Final Tax Invoice cannot be changed back to Draft or Proforma.`
        );
        return;
      }
    }

    // Check if confirmation is needed (moving to Final Tax Invoice)
    if (needsConfirmation(currentStatus, newStatus)) {
      setPendingStatusChange(newStatus);
      setShowStatusConfirmDialog(true);
      return;
    }

    // Apply status change directly
    applyStatusChange(newStatus);
  };

  const applyStatusChange = (newStatus) => {
    setInvoice((prev) => ({
      ...prev,
      status: newStatus,
      invoiceNumber: withStatusPrefix(prev.invoiceNumber, newStatus),
    }));

    // Show notification about inventory impact
    if (newStatus === 'issued') {
      notificationService.info(
        'Status changed to Final Tax Invoice. Inventory will be deducted when you save.'
      );
    }
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      applyStatusChange(pendingStatusChange);
      setPendingStatusChange(null);
    }
    setShowStatusConfirmDialog(false);
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
    setShowStatusConfirmDialog(false);
  };

  // Payment management handlers
  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowPaymentModal(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setShowPaymentModal(true);
  };

  const handleSavePayment = (paymentData) => {
    setInvoice((prev) => {
      let updatedPayments;

      if (editingPayment) {
        // Update existing payment
        updatedPayments = prev.payments.map((p) =>
          p.id === paymentData.id ? paymentData : p
        );
      } else {
        // Add new payment
        updatedPayments = [...prev.payments, paymentData];
      }

      // Recalculate payment fields
      const totalPaid = calculateTotalPaid(updatedPayments);
      const balanceDue = calculateBalanceDue(prev.total, updatedPayments);
      const paymentStatus = calculatePaymentStatus(prev.total, updatedPayments);
      const lastPaymentDate = getLastPaymentDate(updatedPayments);

      return {
        ...prev,
        payments: updatedPayments,
        total_paid: totalPaid,
        balance_due: balanceDue,
        payment_status: paymentStatus,
        last_payment_date: lastPaymentDate
      };
    });

    setShowPaymentModal(false);
    setEditingPayment(null);
    notificationService.success(
      editingPayment ? 'Payment updated successfully!' : 'Payment added successfully!'
    );
  };

  const handleDeletePayment = (paymentId) => {
    setInvoice((prev) => {
      const updatedPayments = prev.payments.filter((p) => p.id !== paymentId);

      // Recalculate payment fields
      const totalPaid = calculateTotalPaid(updatedPayments);
      const balanceDue = calculateBalanceDue(prev.total, updatedPayments);
      const paymentStatus = calculatePaymentStatus(prev.total, updatedPayments);
      const lastPaymentDate = getLastPaymentDate(updatedPayments);

      return {
        ...prev,
        payments: updatedPayments,
        total_paid: totalPaid,
        balance_due: balanceDue,
        payment_status: paymentStatus,
        last_payment_date: lastPaymentDate
      };
    });

    notificationService.success('Payment deleted successfully!');
  };

  const handleSave = async () => {
    try {
      // Convert empty string values to numbers before saving
      const processedInvoice = {
        ...invoice,
        discountAmount:
          invoice.discountAmount === "" ? 0 : Number(invoice.discountAmount),
        discountPercentage:
          invoice.discountPercentage === ""
            ? 0
            : Number(invoice.discountPercentage),
        advanceReceived:
          invoice.advanceReceived === "" ? 0 : Number(invoice.advanceReceived),
        items: invoice.items.map((item) => ({
          ...item,
          quantity: item.quantity === "" ? 0 : Number(item.quantity),
          rate: item.rate === "" ? 0 : Number(item.rate),
          discount: item.discount === "" ? 0 : Number(item.discount),
          vatRate: item.vatRate === "" ? 0 : Number(item.vatRate),
        })),
      };

      if (id) {
        // Update existing invoice using cancel and recreate approach
        const updatedInvoice = await updateInvoice(
          invoice.id,
          processedInvoice
        );
        if (onSave) onSave(updatedInvoice);

        notificationService.success(
          "Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data."
        );
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(processedInvoice);
        if (onSave) onSave(newInvoice);
        notificationService.success("Invoice created successfully!");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      notificationService.error("Failed to save invoice. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    // If company details still loading, set a pending flag and retry when ready
    if (loadingCompany) {
      setPdfPending(true);
      notificationService.info('Loading company details… Will download when ready.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const fallbackCompany = company || {
        name: 'Your Company',
        address: { street: '', city: '', country: 'UAE' },
        phone: '',
        email: '',
        vat_number: '',
      };
      await generateInvoicePDF(invoice, fallbackCompany);
      notificationService.success("PDF generated successfully!");
    } catch (error) {
      notificationService.error(`PDF generation failed: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Auto-retry PDF generation once company finishes loading if user requested it
  const [pdfPending, setPdfPending] = useState(false);
  useEffect(() => {
    if (pdfPending && !loadingCompany) {
      setPdfPending(false);
      // Use real company now available
      (async () => {
        setIsGeneratingPDF(true);
        try {
          await generateInvoicePDF(invoice, company || {
            name: 'Your Company',
            address: { street: '', city: '', country: 'UAE' },
            phone: '',
            email: '',
            vat_number: '',
          });
          notificationService.success('PDF generated successfully!');
        } catch (err) {
          notificationService.error(`PDF generation failed: ${err.message}`);
        } finally {
          setIsGeneratingPDF(false);
        }
      })();
    }
  }, [pdfPending, loadingCompany, company, invoice]);

  if (showPreview) {
    return (
      <InvoicePreview
        invoice={invoice}
        company={company || {}}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  if (loadingInvoice) {
    return (
      <div
        className={`h-full flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Loading invoice...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full p-4 overflow-auto ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-none">
        <Card className="p-4 sm:p-6">
          {/* Header */}
          <div
            className={`sticky top-0 z-10 flex flex-col gap-4 mb-6 pb-4 p-4 -m-4 sm:-m-6 sm:p-6 rounded-t-2xl border-b ${
              isDarkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/invoices")}
                className={`p-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1
                  className={`text-xl sm:text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {id ? "📝 Edit Invoice" : "📄 Create Invoice"}
                </h1>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {id ? 'Update invoice details' : 'Create a new invoice for your customer'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  if (!company) {
                    notificationService.warning(
                      "Company data is still loading. Please wait..."
                    );
                    return;
                  }
                  setShowPreview(true);
                }}
                disabled={loadingCompany}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full sm:w-auto"
              >
                {(isGeneratingPDF || (loadingCompany && pdfPending)) ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGeneratingPDF
                  ? "Generating..."
                  : loadingCompany
                    ? (pdfPending ? "Loading company…" : "Download PDF")
                    : "Download PDF"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={savingInvoice || updatingInvoice || (id && invoice.status === 'issued')}
                className="w-full sm:w-auto"
                title={id && invoice.status === 'issued' ? 'Final Tax Invoice cannot be edited. Create a credit note to reverse.' : ''}
              >
                {savingInvoice || updatingInvoice ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingInvoice || updatingInvoice
                  ? "Saving..."
                  : (id && invoice.status === 'issued' ? "Cannot Edit Final Invoice" : "Save Invoice")}
              </Button>
              </div>
            </div>
          </div>

          {/* Payment Reminder Alert */}
          {(() => {
            const reminderInfo = getInvoiceReminderInfo(invoice);
            if (!reminderInfo || !reminderInfo.shouldShowReminder) return null;

            const { config, daysUntilDue, balanceDue, isOverdue } = reminderInfo;
            const daysMessage = formatDaysMessage(daysUntilDue);

            return (
              <Alert
                variant={isOverdue ? "danger" : "warning"}
                className="mt-6"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2">
                      {config.label}: {daysMessage}
                    </h4>
                    <p className="text-sm mb-3">
                      This invoice {isOverdue ? 'is overdue' : 'will be due soon'}.
                      Outstanding balance: <strong>{formatCurrency(balanceDue)}</strong>
                    </p>
                    <div className="text-xs opacity-90">
                      <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                      <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
                      {isOverdue && (
                        <p className="mt-2 font-semibold">
                          ⚡ Action Required: Consider sending a payment reminder to the customer.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })()}

          <div className="pt-8">
            {/* Edit Invoice Warning */}
            {id && (
              <Alert variant="warning" className="mb-6">
                <div>
                  <h4 className="font-medium mb-2">Invoice Editing Policy</h4>
                  <p className="text-sm">
                    🔄 To maintain audit trails and inventory accuracy, editing
                    will:
                    <br />• Cancel the original invoice and reverse its
                    inventory impact
                    <br />• Create a new invoice with your updated data
                    <br />• Apply new inventory movements
                    <br />• Note: Delivery notes are managed separately and are
                    not auto-created on save.
                  </p>
                </div>
              </Alert>
            )}

            {/* Form Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Invoice Details */}
              <Card className="p-4 sm:p-6">
                <h2
                  className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  📄 Invoice Details
                </h2>
                <div className="space-y-4">
                  <Input
                    label="Invoice Number"
                    value={invoice.invoiceNumber}
                    readOnly
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Date"
                      type="date"
                      value={formatDateForInput(invoice.date)}
                      readOnly
                    />
                    <Input
                      label="Due Date"
                      type="date"
                      value={formatDateForInput(invoice.dueDate)}
                      min={dueMinStr}
                      max={dueMaxStr}
                      onChange={(e) =>
                        setInvoice((prev) => {
                          let v = e.target.value;
                          if (v && v < dueMinStr) v = dueMinStr;
                          if (v && v > dueMaxStr) v = dueMaxStr;
                          return { ...prev, dueDate: v };
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Invoice Status"
                      value={invoice.status || "draft"}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={!canEditInvoice(invoice.status)}
                    >
                      <option value="draft">Draft Invoice</option>
                      <option value="proforma">Proforma Invoice</option>
                      <option value="issued">Final Tax Invoice</option>
                    </Select>
                    {invoice.status === 'issued' && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ Final Tax Invoice cannot be edited. Create a credit note to reverse.
                      </p>
                    )}
                    <Select
                      label="Payment Mode"
                      value={invoice.modeOfPayment || ""}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          modeOfPayment: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select payment mode</option>
                      {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </Select>
                    {(invoice.modeOfPayment === 'Cheque' || invoice.modeOfPayment === 'CDC' || invoice.modeOfPayment === 'PDC') && (
                      <Input
                        label="Cheque Number (optional)"
                        value={invoice.chequeNumber || ''}
                        onChange={(e) => setInvoice(prev => ({ ...prev, chequeNumber: e.target.value }))}
                        placeholder="Enter cheque reference number"
                      />
                    )}
                    <Select
                      label="Warehouse"
                      value={invoice.warehouseId || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const w = warehouses.find((wh) => wh.id.toString() === id);
                        setInvoice((prev) => ({
                          ...prev,
                          warehouseId: id,
                          warehouseName: w ? w.name : "",
                          warehouseCode: w ? w.code : "",
                          warehouseCity: w ? w.city : "",
                        }));
                      }}
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} - {w.city}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Customer Purchase Order Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Customer PO Number (Optional)"
                      value={invoice.customerPurchaseOrderNumber || ""}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          customerPurchaseOrderNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter customer PO number"
                    />
                    <Input
                      label="Customer PO Date (Optional)"
                      type="date"
                      value={invoice.customerPurchaseOrderDate || ""}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          customerPurchaseOrderDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Delivery notes are created separately from invoice save */}
                </div>
              </Card>

              {/* Customer Details */}
              <Card className="p-4 sm:p-6">
                <h2
                  className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  👤 Customer Details
                </h2>
                <div className="space-y-4">
                  <Select
                    label="Select Customer"
                    value={invoice.customer.id || ""}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    disabled={loadingCustomers}
                  >
                    <option value="">Select a customer</option>
                    {(customersData?.customers || []).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {titleCase(normalizeLLC(customer.name))} - {customer.email}
                      </option>
                    ))}
                  </Select>

                  {/* Display selected customer details */}
                  {invoice.customer.name && (
                    <div
                      className={`p-4 rounded-lg border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-100 border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-2 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Selected Customer:
                      </h4>
                      <div
                        className={`space-y-1 text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <p>
                          <span className="font-medium">Name:</span>{" "}
                          {titleCase(normalizeLLC(invoice.customer.name))}
                        </p>
                        {invoice.customer.email && (
                          <p>
                            <span className="font-medium">Email:</span>{" "}
                            {invoice.customer.email}
                          </p>
                        )}
                        {invoice.customer.phone && (
                          <p>
                            <span className="font-medium">Phone:</span>{" "}
                            {invoice.customer.phone}
                          </p>
                        )}
                        {invoice.customer.vatNumber && (
                          <p>
                            <span className="font-medium">TRN:</span>{" "}
                            {invoice.customer.vatNumber}
                          </p>
                        )}
                        {(invoice.customer.address.street ||
                          invoice.customer.address.city) && (
                          <p>
                            <span className="font-medium">Address:</span>{" "}
                            {[
                              invoice.customer.address.street,
                              invoice.customer.address.city,
                              invoice.customer.address.emirate,
                              invoice.customer.address.poBox,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Final Tax Invoice Warning */}
                  {invoice.status === 'issued' && (
                    <Alert variant="warning">
                      <div>
                        <h4 className="font-medium mb-1 flex items-center">
                          <AlertTriangle size={18} className="mr-2" />
                          Final Tax Invoice - Editing Restricted
                        </h4>
                        <p className="text-sm mb-2">
                          This is a <strong>Final Tax Invoice</strong> with legal and tax implications.
                          Editing is restricted to maintain audit trails and comply with regulations.
                        </p>
                        <p className="text-sm">
                          ℹ️ To make changes: Create a <strong>Credit Note</strong> to reverse this invoice,
                          then create a new invoice with the correct details.
                        </p>
                      </div>
                    </Alert>
                  )}

                  {/* Trade License Status Alert */}
                  {showTradeLicenseAlert && tradeLicenseStatus && (
                    <Alert
                      variant="warning"
                      onClose={() => setShowTradeLicenseAlert(false)}
                    >
                      <div>
                        <h4 className="font-medium mb-1">
                          Trade License Alert
                        </h4>
                        <p className="text-sm">{tradeLicenseStatus.message}</p>
                        {tradeLicenseStatus.licenseNumber && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">License Number:</span>{" "}
                            {tradeLicenseStatus.licenseNumber}
                          </p>
                        )}
                        {tradeLicenseStatus.expiryDate && (
                          <p className="text-sm">
                            <span className="font-medium">Expiry Date:</span>{" "}
                            {new Date(
                              tradeLicenseStatus.expiryDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Alert>
                  )}

                  {loadingCustomers && (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Loading customers...
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Transport & Delivery Details (disabled for Phase 1) */}
            {false && (
              <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
                <h2
                  className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  🚚 Transport & Delivery Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Despatched Through"
                    value={invoice.despatchedThrough || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        despatchedThrough: e.target.value,
                      }))
                    }
                    placeholder="Transport company/agent"
                  />
                  <Input
                    label="Destination"
                    value={invoice.destination || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                    placeholder="Delivery destination"
                  />
                  <Select
                    label="Terms of Delivery"
                    value={invoice.termsOfDelivery || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        termsOfDelivery: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select delivery terms</option>
                    {DELIVERY_TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Other Reference"
                    value={invoice.otherReference || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        otherReference: e.target.value,
                      }))
                    }
                    placeholder="Additional reference"
                  />
                </div>
              </Card>
            )}

            {/* Items Section */}
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                <h2
                  className={`text-base sm:text-lg font-semibold mb-3 sm:mb-0 flex items-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  🏗️ Stainless Steel Items
                </h2>
                <Button onClick={addItem} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {/* Items Table - Desktop */}
              <div className="hidden xl:block overflow-x-auto">
                <table
                  className={`min-w-full table-fixed divide-y ${
                    isDarkMode ? "divide-gray-600" : "divide-gray-200"
                  }`}
                >
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "40%" }}
                      >
                        Product
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "10%" }}
                      >
                        Qty
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "12%" }}
                      >
                        Rate
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "10%" }}
                      >
                        VAT %
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "16%" }}
                      >
                        Amount
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "8%" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode
                        ? "bg-gray-800 divide-gray-600"
                        : "bg-white divide-gray-200"
                    }`}
                  >
                    {deferredItems.slice(0, 20).map((item, index) => {
                      const tooltip = [
                        item.name ? `Name: ${item.name}` : '',
                        item.category ? `Category: ${item.category}` : '',
                        item.commodity ? `Commodity: ${item.commodity}` : '',
                        item.grade ? `Grade: ${item.grade}` : '',
                        item.finish ? `Finish: ${item.finish}` : '',
                        item.size ? `Size: ${item.size}` : '',
                        item.sizeInch ? `Size (Inch): ${item.sizeInch}` : '',
                        item.od ? `OD: ${item.od}` : '',
                        item.length ? `Length: ${item.length}` : '',
                        item.thickness ? `Thickness: ${item.thickness}` : '',
                        item.unit ? `Unit: ${item.unit}` : '',
                        item.hsn_code ? `HSN: ${item.hsn_code}` : '',
                      ].filter(Boolean).join('\n');
                      return (
                      <tr key={item.id}>
                        <td className="px-2 py-2 align-middle">
                          <div className="w-full">
                            <Autocomplete
                              options={(searchInputs[index] ? (searchOptions.length ? searchOptions : productOptions) : productOptions)}
                              value={
                                item.productId
                                  ? productOptions.find(
                                      (p) => p.id === item.productId
                                    )
                                  : null
                              }
                              inputValue={
                                searchInputs[index] || item.name || ""
                              }
                              onInputChange={(event, newInputValue) => {
                                handleSearchInputChange(index, newInputValue);
                              }}
                              onChange={(event, newValue) => {
                                if (newValue) {
                                  handleProductSelect(index, newValue);
                                }
                              }}
                              placeholder="Search products..."
                              disabled={loadingProducts}
                              title={tooltip}
                              renderOption={(option) => (
                                <div>
                                  <div className="font-medium">
                                    {option.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {option.subtitle}
                                  </div>
                                </div>
                              )}
                              noOptionsText="No products found"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <Input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                e.target.value === ""
                                  ? ""
                                  : Number.isNaN(Number(e.target.value))
                                  ? ""
                                  : parseInt(e.target.value, 10)
                              )
                            }
                            min="0"
                            step="1"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onKeyDown={(e) => {
                              const allow = [
                                "Backspace",
                                "Delete",
                                "Tab",
                                "Escape",
                                "Enter",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ];
                              if (
                                allow.includes(e.key) ||
                                (e.ctrlKey || e.metaKey)
                              ) {
                                return;
                              }
                              if (!/^[0-9]$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const t = (e.clipboardData || window.clipboardData).getData(
                                "text"
                              );
                              const digits = (t || "").replace(/\D/g, "");
                              handleItemChange(
                                index,
                                "quantity",
                                digits ? parseInt(digits, 10) : ""
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full text-right"
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <Input
                            type="number"
                            value={item.rate || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "rate",
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value) || ""
                              )
                            }
                            min="0"
                            step="0.01"
                            className="w-full text-right"
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <Input
                            type="number"
                            value={item.vatRate || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "vatRate",
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value) || ""
                              )
                            }
                            min="0"
                            max="15"
                            step="0.01"
                            placeholder="5.00"
                            className="w-full text-right"
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} text-right`}>
                            {formatCurrency(item.amount)}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
                          <button
                            onClick={() => removeItem(index)}
                            disabled={invoice.items.length === 1}
                            className={`hover:text-red-300 ${
                              isDarkMode
                                ? "text-red-400 disabled:text-gray-600"
                                : "text-red-500 disabled:text-gray-400"
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Items Cards - Mobile */}
              <div className="xl:hidden space-y-4">
                {deferredItems.slice(0, 10).map((item, index) => {
                  const tooltip = [
                    item.name ? `Name: ${item.name}` : '',
                    item.category ? `Category: ${item.category}` : '',
                    item.commodity ? `Commodity: ${item.commodity}` : '',
                    item.grade ? `Grade: ${item.grade}` : '',
                    item.finish ? `Finish: ${item.finish}` : '',
                    item.size ? `Size: ${item.size}` : '',
                    item.sizeInch ? `Size (Inch): ${item.sizeInch}` : '',
                    item.od ? `OD: ${item.od}` : '',
                    item.length ? `Length: ${item.length}` : '',
                    item.thickness ? `Thickness: ${item.thickness}` : '',
                    item.unit ? `Unit: ${item.unit}` : '',
                    item.hsn_code ? `HSN: ${item.hsn_code}` : '',
                  ].filter(Boolean).join('\n');
                  return (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Item #{index + 1}
                      </h4>
                      <button
                        onClick={() => removeItem(index)}
                        disabled={invoice.items.length === 1}
                        className={`hover:text-red-300 ${
                          isDarkMode
                            ? "text-red-400 disabled:text-gray-600"
                            : "text-red-500 disabled:text-gray-400"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <Autocomplete
                        options={(searchInputs[index] ? (searchOptions.length ? searchOptions : productOptions) : productOptions)}
                        value={
                          item.productId
                            ? productOptions.find(
                                (p) => p.id === item.productId
                              )
                            : null
                        }
                        inputValue={searchInputs[index] || item.name || ""}
                        onInputChange={(event, newInputValue) => {
                          handleSearchInputChange(index, newInputValue);
                        }}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            handleProductSelect(index, newValue);
                          }
                        }}
                        label="Product"
                        placeholder="Search products..."
                        disabled={loadingProducts}
                        title={tooltip}
                        renderOption={(option) => (
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-sm text-gray-500">
                              {option.subtitle}
                            </div>
                          </div>
                        )}
                        noOptionsText="No products found"
                      />

                      {/* Removed Grade, Finish, Size, Thickness fields */}

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Qty"
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value === ""
                                ? ""
                                : Number.isNaN(Number(e.target.value))
                                ? ""
                                : parseInt(e.target.value, 10)
                            )
                          }
                          min="0"
                          step="1"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          onKeyDown={(e) => {
                            const allow = [
                              "Backspace",
                              "Delete",
                              "Tab",
                              "Escape",
                              "Enter",
                              "ArrowLeft",
                              "ArrowRight",
                              "Home",
                              "End",
                            ];
                            if (allow.includes(e.key) || (e.ctrlKey || e.metaKey)) {
                              return;
                            }
                            if (!/^[0-9]$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const t = (e.clipboardData || window.clipboardData).getData("text");
                            const digits = (t || "").replace(/\D/g, "");
                            handleItemChange(
                              index,
                              "quantity",
                              digits ? parseInt(digits, 10) : ""
                            );
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        <Input
                          label="Rate"
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "rate",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || ""
                            )
                          }
                          min="0"
                          step="0.01"
                        />
                        <Input
                          label="VAT %"
                          type="number"
                          value={item.vatRate || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "vatRate",
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value) || ""
                            )
                          }
                          min="0"
                          max="15"
                          step="0.01"
                          placeholder="5.00"
                        />
                      </div>

                      <div
                        className={`flex justify-end p-3 rounded-md ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Amount: {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  </Card>
                )})}
                {deferredItems.length > 10 && (
                  <div
                    className={`text-center py-4 text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Showing first 10 items. Add more items as needed.
                  </div>
                )}
              </div>
            </Card>

            {/* Summary and Notes */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <h2
                  className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  📝 Notes
                </h2>
                <Textarea
                  value={invoice.notes}
                  onChange={(e) =>
                    setInvoice((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes..."
                  rows="4"
                />
              </Card>

              <Card className="p-4 sm:p-6">
                <h2
                  className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  💰 Invoice Summary
                </h2>
                <div className="space-y-4">
                  <div
                    className={`flex justify-between items-center ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(computedSubtotal)}
                    </span>
                  </div>

                  {/* Discount Section */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <Select
                        label="Discount Type"
                        value={invoice.discountType || "amount"}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            discountType: e.target.value,
                            discountAmount: "",
                            discountPercentage: "",
                          }))
                        }
                      >
                        <option value="amount">Amount</option>
                        <option value="percentage">Percentage</option>
                      </Select>

                      {invoice.discountType === "percentage" ? (
                        <Input
                          label="Discount Percentage (%)"
                          type="number"
                          value={invoice.discountPercentage || ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              setInvoice((prev) => ({ ...prev, discountPercentage: "" }));
                              return;
                            }
                            const num = Number(raw);
                            if (Number.isNaN(num)) return;
                            const clamped = Math.max(0, Math.min(100, num));
                            setInvoice((prev) => ({
                              ...prev,
                              discountPercentage: clamped,
                            }));
                          }}
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.00"
                          inputMode="decimal"
                          onKeyDown={(e) => {
                            // Disallow exponent & plus/minus signs
                            const blocked = ["e", "E", "+", "-"];
                            if (blocked.includes(e.key)) e.preventDefault();
                          }}
                        />
                      ) : (
                        <Input
                          label="Discount Amount"
                          type="number"
                          value={invoice.discountAmount || ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              setInvoice((prev) => ({ ...prev, discountAmount: "" }));
                              return;
                            }
                            const num = Number(raw);
                            if (Number.isNaN(num)) return;
                            const clamped = Math.max(0, Math.min(computedSubtotal, num));
                            setInvoice((prev) => ({ ...prev, discountAmount: clamped }));
                          }}
                          min="0"
                          max={computedSubtotal}
                          step="0.01"
                          placeholder="0.00"
                          inputMode="decimal"
                          onKeyDown={(e) => {
                            const blocked = ["e", "E", "+", "-"];
                            if (blocked.includes(e.key)) e.preventDefault();
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      )}
                    </div>
                  </div>

                  {computedDiscountAmount > 0 && (
                    <div
                      className={`flex justify-between items-center ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <span>Discount:</span>
                      <span className="font-medium text-red-500">
                        -{formatCurrency(computedDiscountAmount)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex justify-between items-center ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <span>VAT Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(computedVatAmount)}
                    </span>
                  </div>

                  <div
                    className={`border-t pt-4 ${
                      isDarkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-lg font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Total:
                      </span>
                      <span className="text-lg font-bold text-teal-400">
                        {formatCurrency(computedTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Advance and Balance */}
                  <div className="space-y-3">
                    <Input
                      label="Advance Received"
                      type="number"
                      value={invoice.advanceReceived || ""}
                      onChange={(e) =>
                        handleChargeChange("advanceReceived", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {invoice.advanceReceived > 0 && (
                      <div
                        className={`flex justify-between items-center p-3 rounded-md border ${
                          isDarkMode
                            ? "bg-teal-900/20 border-teal-500/30"
                            : "bg-teal-50 border-teal-200"
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Balance Amount:
                        </span>
                        <span className="font-medium text-teal-400">
                          {formatCurrency(
                            Math.max(
                              0,
                              computedTotal - (invoice.advanceReceived || 0)
                            )
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Tracking Section - Only show for issued invoices */}
            {invoice.status === 'issued' && (
              <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
                <h2
                  className={`text-xl font-bold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  💰 Payment Tracking
                </h2>

                {/* Payment Summary */}
                <div className="mb-6">
                  <PaymentSummary
                    invoiceTotal={computedTotal}
                    payments={invoice.payments || []}
                  />
                </div>

                {/* Payment Ledger */}
                <PaymentLedger
                  payments={invoice.payments || []}
                  invoice={invoice}
                  company={company}
                  onAddPayment={handleAddPayment}
                  onEditPayment={handleEditPayment}
                  onDeletePayment={handleDeletePayment}
                />
              </Card>
            )}

            {/* Terms & Conditions */}
            <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
              <h2
                className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                📋 Payment as per payment terms
              </h2>
              <Textarea
                value={invoice.terms}
                onChange={(e) =>
                  setInvoice((prev) => ({ ...prev, terms: e.target.value }))
                }
                placeholder="Payment terms and conditions..."
                rows="3"
              />
            </Card>
          </div>
        </Card>
      </div>

      {/* Status Change Confirmation Dialog */}
      {showStatusConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex items-start mb-4">
              <AlertTriangle className="text-yellow-500 mr-3 flex-shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Confirm Status Change to Final Tax Invoice
                </h3>
                <p className="text-sm mb-4">
                  You are about to finalize this invoice as an official <strong>Tax Invoice</strong>.
                </p>
                <p className="text-sm">
                  Ready to proceed? Once finalized, this invoice cannot be edited.
                  You can track payments separately after issuance.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelStatusChange}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Issue Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Modal */}
      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setEditingPayment(null);
        }}
        onSave={handleSavePayment}
        invoiceTotal={computedTotal}
        existingPayments={invoice.payments || []}
        editingPayment={editingPayment}
      />
    </div>
  );
};

export default InvoiceForm;
