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
  Pin,
  PinOff,
  Settings,
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
  formatDateDMY,
  titleCase,
  normalizeLLC,
  calculateDiscountedTRN,
} from "../utils/invoiceUtils";
import InvoicePreview from "../components/InvoicePreview";
import { invoiceService, companyService } from "../services";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { pinnedProductsService } from "../services/pinnedProductsService";
import { invoicesAPI } from "../services/api";
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

const Input = ({ label, error, className = "", required = false, validationState = null, showValidation = true, ...props }) => {
  const { isDarkMode } = useTheme();

  // Determine border and background color based on validation state
  const getValidationClasses = () => {
    // If validation highlighting is disabled, show default styles
    if (!showValidation) {
      return isDarkMode
        ? 'border-gray-600 bg-gray-800'
        : 'border-gray-300 bg-white';
    }

    if (error || validationState === 'invalid') {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    if (validationState === 'valid') {
      return isDarkMode
        ? 'border-green-500 bg-green-900/10'
        : 'border-green-500 bg-green-50';
    }
    if (required && validationState === null) {
      // Untouched required field - show subtle indication
      return isDarkMode
        ? 'border-yellow-600/50 bg-yellow-900/5'
        : 'border-yellow-400/50 bg-yellow-50/30';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 ${
          isDarkMode
            ? "text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${getValidationClasses()} ${className}`}
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

const Select = ({ label, children, error, className = "", required = false, validationState = null, showValidation = true, ...props }) => {
  const { isDarkMode } = useTheme();

  // Determine border and background color based on validation state
  const getValidationClasses = () => {
    // If validation highlighting is disabled, show default styles
    if (!showValidation) {
      return isDarkMode
        ? 'border-gray-600 bg-gray-800'
        : 'border-gray-300 bg-white';
    }

    if (error || validationState === 'invalid') {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    if (validationState === 'valid') {
      return isDarkMode
        ? 'border-green-500 bg-green-900/10'
        : 'border-green-500 bg-green-50';
    }
    if (required && validationState === null) {
      // Untouched required field - show subtle indication
      return isDarkMode
        ? 'border-yellow-600/50 bg-yellow-900/5'
        : 'border-yellow-400/50 bg-yellow-50/30';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full pl-3 pr-9 py-2 border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 appearance-none ${
            isDarkMode
              ? "text-white disabled:bg-gray-700 disabled:text-gray-500"
              : "text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
          } ${getValidationClasses()} ${className}`}
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

const Textarea = ({ label, error, className = "", autoGrow = false, ...props }) => {
  const { isDarkMode } = useTheme();
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && autoGrow) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match content, with a minimum of one line
      textarea.style.height = `${Math.max(textarea.scrollHeight, 44)}px`;
    }
  }, [autoGrow]);

  useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  const handleChange = (e) => {
    if (props.onChange) {
      props.onChange(e);
    }
    adjustHeight();
  };

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
        ref={textareaRef}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 resize-none ${
          isDarkMode
            ? "border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${error ? "border-red-500" : ""} ${autoGrow ? "overflow-hidden" : ""} ${className}`}
        {...props}
        onChange={handleChange}
        rows={autoGrow ? 1 : props.rows}
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
  error,
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
          error={error}
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

// Form Settings Panel Component
const FormSettingsPanel = ({ isOpen, onClose, preferences, onPreferenceChange }) => {
  const { isDarkMode } = useTheme();
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          enabled
            ? 'bg-teal-600'
            : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg border z-50 ${
        isDarkMode
          ? 'bg-gray-800 border-gray-600'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Form Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-2 divide-y divide-gray-200 dark:divide-gray-700">
        <ToggleSwitch
          enabled={preferences.showValidationHighlighting}
          onChange={() => onPreferenceChange('showValidationHighlighting', !preferences.showValidationHighlighting)}
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
        />
        <ToggleSwitch
          enabled={preferences.showSpeedButtons}
          onChange={() => onPreferenceChange('showSpeedButtons', !preferences.showSpeedButtons)}
          label="Quick Add Speed Buttons"
          description="Show pinned & top products for quick adding"
        />
      </div>

      {/* Footer note */}
      <div className={`px-4 py-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        Settings are saved automatically
      </div>
    </div>
  );
};

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Helper function to generate auto-concatenated product name
  const generateProductName = useCallback((item) => {
    const parts = [];
    // Commodity is not available in steel item, we'll use a default "SS" if not set
    // Category/Product Type
    if (item.productType) parts.push(item.productType);
    // Grade with GR prefix
    if (item.grade) {
      const g = String(item.grade).trim();
      const m = g.match(/^gr\s*(.+)$/i);
      parts.push(m ? `GR${m[1]}` : `GR${g}`);
    }
    // Finish
    if (item.finish) parts.push(item.finish);
    // Size (add " for pipes/tubes)
    const isPipeOrTube = /pipe|tube/i.test(item.productType || '');
    if (item.size) {
      parts.push(isPipeOrTube ? `${item.size}"` : item.size);
    }
    // Thickness
    if (item.thickness) parts.push(item.thickness);
    return parts.join(' ');
  }, []);

  // Debounce timeout refs for charges fields
  const chargesTimeout = useRef(null);

  const [showPreview, setShowPreview] = useState(false);
  const [isFormValidForSave, setIsFormValidForSave] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfButtonHighlight, setPdfButtonHighlight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Save confirmation for Final Tax Invoice (new invoices only)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  // Success modal after creating invoice
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Payment tracking management
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Form preferences state (with localStorage persistence)
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem('invoiceFormPreferences');
    return saved ? JSON.parse(saved) : {
      showValidationHighlighting: true,
      showSpeedButtons: true
    };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invoiceFormPreferences', JSON.stringify(formPreferences));
  }, [formPreferences]);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Real-time field validation states (null = untouched, 'valid' = valid, 'invalid' = invalid)
  const [fieldValidation, setFieldValidation] = useState({});

  // Validate individual field in real-time
  const validateField = useCallback((fieldName, value) => {
    let isValid = false;

    switch(fieldName) {
      case 'customer':
        isValid = value && value.id && value.name;
        break;
      case 'dueDate':
        isValid = value && value.trim() !== '';
        break;
      case 'status':
        isValid = value && ['draft', 'proforma', 'issued'].includes(value);
        break;
      case 'paymentMode':
        isValid = value && value.trim() !== '';
        break;
      case 'warehouse':
        isValid = value && value.trim() !== '';
        break;
      case 'currency':
        isValid = value && value.trim() !== '';
        break;
      case 'items':
        isValid = Array.isArray(value) && value.length > 0 && value.every(item =>
          item.name && item.quantity > 0 && item.rate > 0
        );
        break;
      default:
        isValid = true;
    }

    setFieldValidation(prev => ({
      ...prev,
      [fieldName]: isValid ? 'valid' : 'invalid'
    }));

    return isValid;
  }, []);

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
    // Invoice number will be auto-generated by the database on save
    newInvoice.invoiceNumber = "(Auto-assigned on save)";
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

  // Pinned products state
  const [pinnedProductIds, setPinnedProductIds] = useState([]);
  const { data: pinnedData, refetch: refetchPinned } = useApiData(
    () => pinnedProductsService.getPinnedProducts(),
    []
  );

  // Update pinned products when data loads
  useEffect(() => {
    if (pinnedData?.pinnedProducts) {
      setPinnedProductIds(pinnedData.pinnedProducts);
    }
  }, [pinnedData]);

  // Handle pin/unpin
  const handleTogglePin = async (e, productId) => {
    e.stopPropagation(); // Prevent adding item to invoice
    try {
      if (pinnedProductIds.includes(productId)) {
        await pinnedProductsService.unpinProduct(productId);
        setPinnedProductIds(prev => prev.filter(id => id !== productId));
      } else {
        if (pinnedProductIds.length >= 10) {
          notificationService.error('Maximum 10 products can be pinned');
          return;
        }
        await pinnedProductsService.pinProduct(productId);
        setPinnedProductIds(prev => [...prev, productId]);
      }
    } catch (error) {
      notificationService.error(error.message || 'Failed to update pin');
    }
  };

  // Get sorted products: pinned first, then top sold
  const sortedProducts = useMemo(() => {
    const allProducts = productsData?.products || [];
    const pinned = allProducts.filter(p => pinnedProductIds.includes(p.id));
    const unpinned = allProducts.filter(p => !pinnedProductIds.includes(p.id));
    return [...pinned, ...unpinned].slice(0, 10);
  }, [productsData, pinnedProductIds]);

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

        // Set default warehouse (Sharjah or first warehouse) for new invoices
        if (!id && active.length > 0 && !invoice.warehouseId) {
          // Try to find Sharjah warehouse, otherwise use first one
          const sharjahWarehouse = active.find(w =>
            w.city?.toLowerCase().includes('sharjah') ||
            w.name?.toLowerCase().includes('sharjah')
          );
          const defaultWarehouse = sharjahWarehouse || active[0];

          setInvoice((prev) => ({
            ...prev,
            warehouseId: defaultWarehouse.id.toString(),
            warehouseName: defaultWarehouse.name || "",
            warehouseCode: defaultWarehouse.code || "",
            warehouseCity: defaultWarehouse.city || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch warehouses:", err);
        setWarehouses([]);
      }
    };
    fetchWarehouses();
  }, [id, invoice.warehouseId]);

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

  // No longer needed - invoice numbers are generated by database on save
  // useEffect(() => {
  //   if (nextInvoiceData && nextInvoiceData.next_invoice_number && !id) {
  //     setInvoice((prev) => ({
  //       ...prev,
  //       invoiceNumber: withStatusPrefix(
  //         nextInvoiceData.next_invoice_number,
  //         prev.status || "draft"
  //       ),
  //     }));
  //   }
  // }, [nextInvoiceData, id]);

  useEffect(() => {
    if (existingInvoice && id) {
      // Check if invoice is deleted - prevent editing
      if (existingInvoice.deletedAt) {
        notificationService.error(
          `This invoice has been deleted and cannot be edited. Reason: ${existingInvoice.deletionReason || 'No reason provided'}`
        );
        navigate('/invoices');
        return;
      }
      setInvoice(existingInvoice);
    }
  }, [existingInvoice, id, navigate]);

  // Validate fields on load and when invoice changes
  useEffect(() => {
    if (invoice) {
      validateField('customer', invoice.customer);
      validateField('dueDate', invoice.dueDate);
      validateField('status', invoice.status);
      validateField('paymentMode', invoice.modeOfPayment);
      validateField('warehouse', invoice.warehouseId);
      validateField('currency', invoice.currency);
      validateField('items', invoice.items);
    }
  }, [invoice.customer.id, invoice.dueDate, invoice.status, invoice.modeOfPayment, invoice.warehouseId, invoice.currency, invoice.items.length, validateField]);

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

        // Validate customer field
        validateField('customer', { id: selectedCustomer.id, name: selectedCustomer.name });
      }
    },
    [customersData, validateField]
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

      // Auto-update VAT rate based on supply type
      if (field === "supplyType") {
        if (value === "standard") {
          newItems[index].vatRate = 5;
        } else if (value === "zero_rated" || value === "exempt") {
          newItems[index].vatRate = 0;
        }
      }

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

    // Modal will close itself via onClose(), just clean up editing state
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
    console.log('🔍 handleSave called - id:', id, 'status:', invoice.status);

    // Prevent double-click / rapid clicks at entry point
    if (isSaving) {
      console.log('⏸️  Save already in progress, ignoring click');
      return;
    }

    // For new invoices with Final Tax Invoice status, show confirmation first
    if (!id && invoice.status === 'issued') {
      console.log('✅ Showing Final Tax Invoice confirmation dialog');
      setShowSaveConfirmDialog(true);
      return;
    }

    console.log('⏩ Proceeding directly to performSave (no confirmation needed)');
    // Otherwise proceed with save directly
    await performSave();
  };

  // Function to check if form has all required fields
  const validateRequiredFields = () => {
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information
    if (!invoice.customer?.name || invoice.customer.name.trim() === '') {
      errors.push('Customer name is required');
      invalidFieldsSet.add('customer.name');
    }

    // Check if there are any items
    if (!invoice.items || invoice.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      // Validate each item
      invoice.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }
      });
    }

    // Check dates
    if (!invoice.date) {
      errors.push('Invoice date is required');
      invalidFieldsSet.add('date');
    }
    if (!invoice.dueDate) {
      errors.push('Due date is required');
      invalidFieldsSet.add('dueDate');
    }

    return { isValid: errors.length === 0, errors, invalidFields: invalidFieldsSet };
  };

  // Handler for preview button - validates before opening preview
  const handlePreviewClick = () => {
    if (!company) {
      notificationService.warning("Company data is still loading. Please wait...");
      return;
    }

    // Validate required fields silently (don't show errors, just set flag)
    const validation = validateRequiredFields();
    setIsFormValidForSave(validation.isValid);

    // Always open preview - save button will be disabled if invalid
    setShowPreview(true);
  };

  // Wrapper function for preview window save - validates first, closes preview if errors
  const handleSaveFromPreview = async () => {
    // Run validation check first
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information
    if (!invoice.customer?.name || invoice.customer.name.trim() === '') {
      errors.push('Customer name is required');
      invalidFieldsSet.add('customer.name');
    }

    // Check if there are any items
    if (!invoice.items || invoice.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      // Validate each item
      invoice.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }
      });
    }

    // Check dates
    if (!invoice.date) {
      errors.push('Invoice date is required');
      invalidFieldsSet.add('date');
    }
    if (!invoice.dueDate) {
      errors.push('Due date is required');
      invalidFieldsSet.add('dueDate');
    }

    // If there are validation errors, set them and throw error
    if (errors.length > 0) {
      setValidationErrors(errors);
      setInvalidFields(invalidFieldsSet);

      // Throw error immediately to stop InvoicePreview from trying to download PDF
      // The preview component will catch this and close itself
      throw new Error('VALIDATION_FAILED');
    }

    // If validation passes, proceed with actual save
    await performSave();
  };

  const performSave = async () => {
    // Prevent double-saves
    if (isSaving) {
      console.log('Save already in progress, skipping duplicate save');
      return;
    }

    // Validate required fields before saving
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information
    if (!invoice.customer?.name || invoice.customer.name.trim() === '') {
      errors.push('Customer name is required');
      invalidFieldsSet.add('customer.name');
    }

    // Check if there are any items
    if (!invoice.items || invoice.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      // Validate each item
      invoice.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }
      });
    }

    // Check dates
    if (!invoice.date) {
      errors.push('Invoice date is required');
      invalidFieldsSet.add('date');
    }
    if (!invoice.dueDate) {
      errors.push('Due date is required');
      invalidFieldsSet.add('dueDate');
    }

    // If there are validation errors, show them and stop
    if (errors.length > 0) {
      setValidationErrors(errors);
      setInvalidFields(invalidFieldsSet);

      // Scroll to the first error (save button area)
      setTimeout(() => {
        const errorAlert = document.getElementById('validation-errors-alert');
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      return;
    }

    // Clear any previous validation errors
    setValidationErrors([]);
    setInvalidFields(new Set());

    setIsSaving(true);
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

        // Navigate to the new invoice ID (backend creates new invoice using cancel-and-recreate)
        // The backend returns: { id: oldId, new_invoice_id: actualNewId }
        // We need to navigate to the NEW invoice to continue editing
        if (updatedInvoice.new_invoice_id && updatedInvoice.new_invoice_id !== parseInt(id)) {
          notificationService.success(
            "Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data."
          );
          // Navigate to new invoice ID after a short delay to allow state to update
          setTimeout(() => {
            navigate(`/edit/${updatedInvoice.new_invoice_id}`, { replace: true });
          }, 500);
        } else {
          notificationService.success(
            "Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data."
          );
        }
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(processedInvoice);
        if (onSave) onSave(newInvoice);

        // Update the form with the database-generated invoice number
        setInvoice(prev => ({
          ...prev,
          invoiceNumber: newInvoice.invoice_number
        }));

        // Store the created invoice ID for success modal
        setCreatedInvoiceId(newInvoice.id);

        // Close preview modal if it's open
        setShowPreview(false);

        // Show success modal with options
        setShowSuccessModal(true);

        // Trigger PDF button highlight animation for 3 seconds
        setPdfButtonHighlight(true);
        setTimeout(() => setPdfButtonHighlight(false), 3000);

        // OLD AUTO-NAVIGATION CODE (commented for easy revert):
        // notificationService.success("Invoice created successfully!");
        // setTimeout(() => {
        //   navigate('/invoices');
        // }, 1500);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);

      // Extract detailed error message
      let errorMessage = "Failed to save invoice. Please try again.";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Check for duplicate invoice number error (from database unique constraint)
      if (errorMessage.toLowerCase().includes('duplicate') ||
          errorMessage.toLowerCase().includes('unique_invoice_number') ||
          (error?.response?.status === 409)) {

        // If this is a NEW invoice (not an edit), auto-fetch next available number
        if (!id) {
          errorMessage = `Invoice number ${invoice.invoiceNumber} already exists. Fetching a new invoice number...`;
          notificationService.warning(errorMessage);

          // Refetch the next invoice number
          try {
            await refetchNextInvoice();
            notificationService.success('New invoice number assigned. Please try saving again.');
            return; // Exit early so user can try again with new number
          } catch (refetchError) {
            errorMessage = `Failed to get a new invoice number. Please refresh the page.`;
          }
        } else {
          errorMessage = `Invoice number ${invoice.invoiceNumber} already exists. This should not happen when editing. Please contact support.`;
        }
      }

      // Show detailed validation errors if available
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        if (Array.isArray(details)) {
          errorMessage += "\n" + details.join("\n");
        } else if (typeof details === 'object') {
          errorMessage += "\n" + Object.entries(details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join("\n");
        }
      }

      notificationService.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmDialog(false);
    await performSave();
  };

  const handleCancelSave = () => {
    setShowSaveConfirmDialog(false);
  };

  // Handle actions from success modal
  const handleSuccessDownloadPDF = async () => {
    setShowSuccessModal(false);

    // Wait a moment for modal to close, then trigger PDF download
    setTimeout(async () => {
      await handleDownloadPDF();

      // After PDF download, navigate to invoice list
      setTimeout(() => {
        notificationService.success("Invoice created successfully! PDF downloaded.");
        navigate('/invoices');
      }, 500); // Small delay to allow PDF download to complete
    }, 300);
  };

  const handleSuccessGoToList = () => {
    setShowSuccessModal(false);
    notificationService.success("Invoice created successfully!");
    navigate('/invoices');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);

    // Navigate to edit mode to prevent duplicate creation
    // User can continue viewing/editing the invoice
    if (createdInvoiceId) {
      navigate(`/edit/${createdInvoiceId}`);
      notificationService.success("Invoice created successfully! Now in edit mode.");
    }
  };

  // Handle ESC key to close success modal (only for Draft/Proforma, not Final Tax Invoice)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showSuccessModal) {
        // Only allow ESC to close for Draft and Proforma invoices
        const isFinalTaxInvoice = invoice.status === 'issued';
        if (!isFinalTaxInvoice) {
          handleSuccessModalClose();
        }
      }
    };

    if (showSuccessModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [showSuccessModal, createdInvoiceId, invoice.status]);

  const handleDownloadPDF = async () => {
    // Use either the route ID or the newly created invoice ID
    const invoiceId = id || createdInvoiceId;

    // Require invoice to be saved first
    if (!invoiceId) {
      notificationService.warning('Please save the invoice first before downloading PDF');
      return;
    }

    // If company details still loading, set a pending flag and retry when ready
    if (loadingCompany) {
      setPdfPending(true);
      notificationService.info('Loading company details… Will download when ready.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Use backend API to generate searchable text PDF with proper fonts and margins
      await invoicesAPI.downloadPDF(invoiceId);
      notificationService.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('PDF generation error:', error);
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
      // Retry PDF download now that company details are loaded
      handleDownloadPDF();
    }
  }, [pdfPending, loadingCompany]);

  if (showPreview) {
    return (
      <InvoicePreview
        invoice={invoice}
        company={company || {}}
        onClose={() => setShowPreview(false)}
        invoiceId={id}
        onSave={handleSaveFromPreview}
        isSaving={savingInvoice || updatingInvoice || isSaving}
        isFormValid={isFormValidForSave}
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
    <>
      <div
        className={`min-h-screen pb-32 md:pb-6 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {/* Sticky Header - Mobile & Desktop */}
      <header
        className={`sticky top-0 z-20 border-b ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } shadow-sm`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/invoices")}
                className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Back to invoices"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1
                  className={`text-lg md:text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {id ? "Edit Invoice" : "New Invoice"}
                </h1>
                <p
                  className={`text-xs md:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {invoice.invoiceNumber || "Invoice #"}
                </p>
              </div>
            </div>
            <div className="hidden md:flex gap-2 items-center relative">
              {/* Settings Icon */}
              <button
                onClick={() => setShowFormSettings(!showFormSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Form settings"
                title="Form Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Settings Panel */}
              <FormSettingsPanel
                isOpen={showFormSettings}
                onClose={() => setShowFormSettings(false)}
                preferences={formPreferences}
                onPreferenceChange={(key, value) => {
                  setFormPreferences(prev => ({
                    ...prev,
                    [key]: value
                  }));
                }}
              />

              <Button
                variant="outline"
                onClick={handlePreviewClick}
                disabled={loadingCompany}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={savingInvoice || updatingInvoice || isSaving || (id && invoice.status === 'issued')}
              >
                {savingInvoice || updatingInvoice || isSaving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingInvoice || updatingInvoice || isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Single Column Layout */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Validation Errors Alert */}
          {validationErrors.length > 0 && (
            <div
              id="validation-errors-alert"
              className={`mt-6 p-4 rounded-lg border-2 ${
                isDarkMode
                  ? "bg-red-900/20 border-red-600 text-red-200"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`} size={24} />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
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

          {/* Final Tax Invoice Lock Warning - Only show when editing a Final Tax Invoice */}
          {id && invoice.status === 'issued' && (
            <Alert variant="info" className="mt-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">
                    Final Tax Invoice is Locked
                  </h4>
                  <p className="text-sm mb-2">
                    This invoice has been finalized and cannot be edited to maintain compliance and audit integrity.
                  </p>
                  <p className="text-xs opacity-90">
                    <strong>Note:</strong> To correct this invoice, create a credit note or issue a new invoice instead.
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {/* Payment Reminder Alert - Only show for existing invoices */}
          {(() => {
            const reminderInfo = getInvoiceReminderInfo(invoice);
            if (!reminderInfo || !reminderInfo.shouldShowReminder || !id) return null;

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
                      <p><strong>Due Date:</strong> {formatDateDMY(invoice.dueDate)}</p>
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

        {/* Edit Invoice Warning */}
        {id && (
          <Alert variant="warning">
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

            {/* Single Column Form - Mobile Friendly */}
            <Card className={`p-4 md:p-6 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}>
              {/* Customer Selection - Priority #1 */}
              <div className="mb-6">
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Customer Information
                </h3>
                  {/* Customer Selector - Priority #1 Field */}
                  <Select
                    label="Select Customer"
                    value={invoice.customer.id || ""}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    disabled={loadingCustomers}
                    required={true}
                    validationState={fieldValidation.customer}
                    showValidation={formPreferences.showValidationHighlighting}
                    error={invalidFields.has('customer.name')}
                    className="text-base min-h-[44px]"
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

              {/* Invoice Details Section */}
              <div className="border-t pt-6 mt-6" style={{
                borderColor: isDarkMode ? 'rgb(75 85 99)' : 'rgb(229 231 235)'
              }}>
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Invoice Details
                </h3>

                <div className="space-y-4">
                  {/* Invoice Number - Read Only */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Invoice Number"
                      value={invoice.invoiceNumber}
                      readOnly
                      className="text-base bg-gray-50"
                      placeholder="Auto-generated on save"
                    />
                    <Input
                      label="Date"
                      type="date"
                      value={formatDateForInput(invoice.date)}
                      readOnly
                      error={invalidFields.has('date')}
                      className="text-base"
                    />
                    <Input
                      label="Due Date"
                      type="date"
                      value={formatDateForInput(invoice.dueDate)}
                      min={dueMinStr}
                      max={dueMaxStr}
                      required={true}
                      validationState={fieldValidation.dueDate}
                      showValidation={formPreferences.showValidationHighlighting}
                      error={invalidFields.has('dueDate')}
                      onChange={(e) => {
                        const v = e.target.value;
                        let validatedValue = v;
                        if (v && v < dueMinStr) validatedValue = dueMinStr;
                        if (v && v > dueMaxStr) validatedValue = dueMaxStr;
                        setInvoice((prev) => ({ ...prev, dueDate: validatedValue }));
                        validateField('dueDate', validatedValue);
                      }}
                      className="text-base min-h-[44px]"
                    />
                  </div>

                  {/* Status and Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Invoice Status"
                      value={invoice.status || "draft"}
                      required={true}
                      validationState={fieldValidation.status}
                      showValidation={formPreferences.showValidationHighlighting}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setInvoice((prev) => ({
                          ...prev,
                          status: newStatus,
                          invoiceNumber: !id ? withStatusPrefix(prev.invoiceNumber, newStatus) : prev.invoiceNumber
                        }));
                        validateField('status', newStatus);
                      }}
                      className="text-base min-h-[44px]"
                    >
                      <option value="draft">Draft Invoice</option>
                      <option value="proforma">Proforma Invoice</option>
                      <option value="issued">Final Tax Invoice</option>
                    </Select>
                    <Select
                      label="Payment Mode"
                      value={invoice.modeOfPayment || ""}
                      required={true}
                      validationState={fieldValidation.paymentMode}
                      showValidation={formPreferences.showValidationHighlighting}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInvoice((prev) => ({
                          ...prev,
                          modeOfPayment: value,
                        }));
                        validateField('paymentMode', value);
                      }}
                      className="text-base min-h-[44px]"
                    >
                      <option value="">Select payment mode</option>
                      {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Cheque Number - Conditional */}
                  {(invoice.modeOfPayment === 'Cheque' || invoice.modeOfPayment === 'CDC' || invoice.modeOfPayment === 'PDC') && (
                    <Input
                      label="Cheque Number"
                      value={invoice.chequeNumber || ''}
                      onChange={(e) => setInvoice(prev => ({ ...prev, chequeNumber: e.target.value }))}
                      placeholder="Enter cheque reference number"
                      className="text-base min-h-[44px]"
                    />
                  )}

                  {/* Warehouse and Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Warehouse"
                      value={invoice.warehouseId || ""}
                      required={true}
                      validationState={fieldValidation.warehouse}
                      showValidation={formPreferences.showValidationHighlighting}
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
                        validateField('warehouse', id);
                      }}
                      className="text-base min-h-[44px]"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} - {w.city}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label="Currency"
                      value={invoice.currency || "AED"}
                      required={true}
                      validationState={fieldValidation.currency}
                      showValidation={formPreferences.showValidationHighlighting}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInvoice((prev) => ({
                          ...prev,
                          currency: value,
                        }));
                        validateField('currency', value);
                      }}
                      className="text-base min-h-[44px]"
                    >
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="QAR">QAR (Qatari Riyal)</option>
                      <option value="OMR">OMR (Omani Rial)</option>
                      <option value="BHD">BHD (Bahraini Dinar)</option>
                      <option value="KWD">KWD (Kuwaiti Dinar)</option>
                    </Select>
                  </div>

                  {/* Exchange Rate - Conditional */}
                  {invoice.currency && invoice.currency !== 'AED' && (
                    <Input
                      label={`Exchange Rate (1 ${invoice.currency} = ? AED)`}
                      type="number"
                      value={invoice.exchangeRate || ''}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          exchangeRate: e.target.value,
                        }))
                      }
                      placeholder="e.g., 3.67 for USD"
                      step="0.000001"
                      min="0"
                      inputMode="decimal"
                      className="text-base min-h-[44px]"
                    />
                  )}

                  {/* Customer PO Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Customer PO Number"
                      value={invoice.customerPurchaseOrderNumber || ""}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          customerPurchaseOrderNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter customer PO number"
                      className="text-base min-h-[44px]"
                    />
                    <Input
                      label="Customer PO Date"
                      type="date"
                      value={invoice.customerPurchaseOrderDate || ""}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          customerPurchaseOrderDate: e.target.value,
                        }))
                      }
                      className="text-base min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </Card>


            {/* Items Section - Responsive */}
            <Card className={`p-4 md:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="mb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Line Items
                </h3>
              </div>

              {/* Quick Add Speed Buttons - Pinned & Top Products */}
              {formPreferences.showSpeedButtons && (
              <div className="mb-4">
                <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Quick Add (Pinned & Top Products)
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortedProducts.map((product) => {
                    const isPinned = pinnedProductIds.includes(product.id);
                    return (
                      <div key={product.id} className="relative group">
                        <button
                          onClick={() => {
                            const newItem = createSteelItem();
                            newItem.productId = product.id;
                            newItem.name = product.full_name || product.name;
                            newItem.unit = product.unit || "kg";
                            newItem.rate = parseFloat(product.price) || 0;
                            newItem.hsnCode = product.hsn_code || "";
                            newItem.gstRate = parseFloat(product.gst_rate) || 5;
                            // Copy product specifications
                            newItem.grade = product.grade || "";
                            newItem.productType = product.category || "";
                            newItem.finish = product.finish || "";
                            newItem.thickness = product.thickness || "";
                            newItem.size = product.size || "";
                            setInvoice((prev) => ({
                              ...prev,
                              items: [...prev.items.slice(0, -1), newItem, createSteelItem()]
                            }));
                          }}
                          className={`px-3 py-2 pr-8 rounded-lg border-2 text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                            isPinned
                              ? isDarkMode
                                ? "border-teal-700 bg-teal-900/40 text-teal-300 hover:bg-teal-900/60 shadow-md hover:shadow-lg"
                                : "border-teal-600 bg-teal-100 text-teal-800 hover:bg-teal-200 shadow-md hover:shadow-lg"
                              : isDarkMode
                              ? "border-teal-600 bg-teal-900/20 text-teal-400 hover:bg-teal-900/40 hover:shadow-md"
                              : "border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:shadow-md"
                          }`}
                          style={{ maxWidth: 'fit-content' }}
                        >
                          {product.full_name || product.name}
                        </button>
                        <button
                          onClick={(e) => handleTogglePin(e, product.id)}
                          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 hover:scale-110 ${
                            isPinned
                              ? isDarkMode
                                ? "text-teal-300 hover:text-teal-200"
                                : "text-teal-700 hover:text-teal-800"
                              : isDarkMode
                              ? "text-gray-400 hover:text-teal-400"
                              : "text-gray-500 hover:text-teal-600"
                          }`}
                          title={isPinned ? "Unpin product" : "Pin product"}
                        >
                          {isPinned ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

              {/* Add Item Button */}
              <div className="mb-4">
                <Button
                  onClick={addItem}
                  variant="primary"
                  size="sm"
                  className="min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Item</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>

              {/* Items Table - Desktop & Tablet */}
              <div className="hidden md:block overflow-x-auto">
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
                        style={{ width: "12%" }}
                      >
                        Supply Type
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "8%" }}
                      >
                        VAT %
                      </th>
                      <th
                        className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                        style={{ width: "14%" }}
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
                              error={invalidFields.has(`item.${index}.name`)}
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
                            error={invalidFields.has(`item.${index}.quantity`)}
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
                                  : parseFloat(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                            className="w-full text-right"
                            error={invalidFields.has(`item.${index}.rate`)}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <select
                            value={item.supplyType || "standard"}
                            onChange={(e) =>
                              handleItemChange(index, "supplyType", e.target.value)
                            }
                            className={`w-full px-2 py-1 border rounded text-xs ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          >
                            <option value="standard">Standard (5%)</option>
                            <option value="zero_rated">Zero-Rated (0%)</option>
                            <option value="exempt">Exempt</option>
                          </select>
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
                                  : parseFloat(e.target.value)
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
              <div className="md:hidden space-y-4">
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
                        error={invalidFields.has(`item.${index}.name`)}
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
                          error={invalidFields.has(`item.${index}.quantity`)}
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
                                : parseFloat(e.target.value)
                            )
                          }
                          min="0"
                          step="0.01"
                          error={invalidFields.has(`item.${index}.rate`)}
                        />
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Supply Type
                          </label>
                          <select
                            value={item.supplyType || "standard"}
                            onChange={(e) =>
                              handleItemChange(index, "supplyType", e.target.value)
                            }
                            className={`w-full px-3 py-2 border rounded ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          >
                            <option value="standard">Standard (5%)</option>
                            <option value="zero_rated">Zero-Rated (0%)</option>
                            <option value="exempt">Exempt</option>
                          </select>
                        </div>
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
                                : parseFloat(e.target.value)
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

            {/* Invoice Summary - Single Column */}
            <Card className={`p-4 md:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Summary & Totals
              </h3>
              <div className="max-w-lg ml-auto">

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
              </div>
            </Card>

            {/* Notes - Single Column */}
            <Card className={`p-4 md:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="space-y-6">
                {/* Invoice Notes */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    Notes
                  </h3>
                  <Textarea
                    value={invoice.notes}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Additional notes for the customer..."
                    autoGrow={true}
                    className="text-base min-h-[44px]"
                  />
                </div>

                {/* VAT Tax Notes */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    VAT Tax Notes
                  </h3>
                  <Textarea
                    value={invoice.taxNotes || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, taxNotes: e.target.value }))
                    }
                    placeholder="Explanation for zero-rated or exempt supplies (FTA requirement)..."
                    autoGrow={true}
                    className="text-base min-h-[44px]"
                  />
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Required when items are zero-rated or exempt from VAT
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Tracking Section - Show for Final Tax Invoices (issued status) */}
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

            {/* Payment Terms */}
            <Card className={`p-4 md:p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Payment Terms & Conditions
              </h3>
              <Textarea
                value={invoice.terms}
                onChange={(e) =>
                  setInvoice((prev) => ({ ...prev, terms: e.target.value }))
                }
                placeholder="Enter payment terms and conditions..."
                rows="3"
                className="text-base min-h-[44px]"
              />
            </Card>
          </main>

          {/* Sticky Mobile Footer - Actions & Total */}
          <div className={`md:hidden fixed bottom-0 left-0 right-0 z-20 border-t shadow-2xl ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`} style={{paddingBottom: "env(safe-area-inset-bottom)"}}>
            <div className="px-4 py-3">
              {/* Total Display */}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}>
                  Total Amount
                </span>
                <span className="text-xl font-bold text-teal-500">
                  {formatCurrency(computedTotal)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviewClick}
                  disabled={loadingCompany}
                  className="flex-1 min-h-[48px]"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={savingInvoice || updatingInvoice || isSaving || (id && invoice.status === 'issued')}
                  className="flex-1 min-h-[48px]"
                >
                  {savingInvoice || updatingInvoice || isSaving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingInvoice || updatingInvoice || isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Confirmation Dialog (for Final Tax Invoice) */}
      {showSaveConfirmDialog && (
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
                  Confirm Final Tax Invoice Creation
                </h3>
                <p className="text-sm mb-4">
                  You are about to create and save a <strong>Final Tax Invoice</strong>.
                </p>
                <p className="text-sm mb-2">
                  <strong>This action will:</strong>
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Deduct inventory from stock immediately</li>
                  <li>Record revenue in the system</li>
                  <li>Create an invoice that cannot be edited (requires credit note)</li>
                  <li>Generate an official tax invoice number (INV-YYYYMM-NNNN)</li>
                </ul>
                <p className="text-sm mt-3 font-semibold text-red-600 dark:text-red-400">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelSave}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Create Final Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Success Modal - Invoice Created */}
      {showSuccessModal && (() => {
        // Check if this is a Final Tax Invoice (cannot be edited after creation)
        const isFinalTaxInvoice = invoice.status === 'issued';
        const canContinueEditing = !isFinalTaxInvoice; // Draft and Proforma can be edited

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={canContinueEditing ? handleSuccessModalClose : undefined}
          >
            <div
              className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl relative ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - only show for Draft/Proforma */}
              {canContinueEditing && (
                <button
                  onClick={handleSuccessModalClose}
                  className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                  }`}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}

              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-full p-3 mr-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">
                    Invoice Created Successfully!
                  </h3>
                  <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {isFinalTaxInvoice
                      ? "Your Final Tax Invoice has been created and saved."
                      : `Your ${invoice.status === 'proforma' ? 'Proforma Invoice' : 'Draft'} has been created and saved.`
                    }
                  </p>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                    What would you like to do next?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleSuccessDownloadPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <Download size={20} />
                  Download PDF
                </button>
                <button
                  onClick={handleSuccessGoToList}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Go to Invoice List
                </button>
              </div>

              {/* Continue editing hint - only show for Draft/Proforma */}
              {canContinueEditing && (
                <p className={`text-xs mt-4 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Press ESC or click outside to continue editing the invoice
                </p>
              )}
            </div>
          </div>
        );
      })()}

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
    </>
  );
};

export default InvoiceForm;
