/**
 * AdvancePaymentList.jsx - UAE VAT Compliance
 *
 * List view for advance payments (customer deposits).
 * UAE VAT requires VAT to be accounted for when advance payment is received.
 */

import {
  ArrowRight,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useTheme } from "../../contexts/ThemeContext";
import { useConfirm } from "../../hooks/useConfirm";
import advancePaymentService from "../../services/advancePaymentService";
import { customerService } from "../../services/customerService";
import { notificationService } from "../../services/notificationService";
import { formatCurrency, formatDate } from "../../utils/invoiceUtils";

// Status options
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "received", label: "Active" },
  { value: "partially_applied", label: "Partially Applied" },
  { value: "fully_applied", label: "Fully Applied" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

// Status badge colors
const STATUS_COLORS = {
  received: {
    bg: "bg-green-200 dark:bg-green-800",
    text: "text-green-800 dark:text-green-100",
    label: "Active",
  },
  partially_applied: {
    bg: "bg-amber-200 dark:bg-amber-800",
    text: "text-amber-800 dark:text-amber-100",
    label: "Partially Applied",
  },
  fully_applied: {
    bg: "bg-blue-200 dark:bg-blue-800",
    text: "text-blue-800 dark:text-blue-100",
    label: "Applied",
  },
  refunded: {
    bg: "bg-gray-200 dark:bg-gray-700",
    text: "text-gray-800 dark:text-gray-200",
    label: "Refunded",
  },
  cancelled: {
    bg: "bg-red-200 dark:bg-red-800",
    text: "text-red-800 dark:text-red-100",
    label: "Cancelled",
  },
};

// Input component for Autocomplete
const Input = ({
  label,
  error,
  className = "",
  required = false,
  validationState = null,
  showValidation = true,
  id,
  "data-testid": dataTestId,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const generatedId = useId();
  const inputId = useMemo(() => id || generatedId, [id, generatedId]);

  const getValidationClasses = () => {
    if (!showValidation) {
      return isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white";
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
    return isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white";
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
        data-testid={dataTestId}
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

// Autocomplete component with fuzzy search
const Autocomplete = ({
  options = [],
  value: _value,
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
  required = false,
  validationState = null,
  showValidation = true,
  "data-testid": dataTestId,
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const prevFilteredOptionsRef = useRef(filteredOptions);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    if (prevFilteredOptionsRef.current !== filteredOptions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(-1);
      prevFilteredOptionsRef.current = filteredOptions;
    }
  }, [filteredOptions]);

  // Fuzzy match helpers
  const norm = useCallback((s) => (s || "").toString().toLowerCase().trim(), []);
  const ed1 = useCallback((a, b) => {
    if (a === b) return 0;
    const la = a.length,
      lb = b.length;
    if (Math.abs(la - lb) > 1) return 2;
    let dpPrev = new Array(lb + 1);
    let dpCurr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dpPrev[j] = j;
    for (let i = 1; i <= la; i++) {
      dpCurr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lb; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dpCurr[j] = Math.min(dpPrev[j] + 1, dpCurr[j - 1] + 1, dpPrev[j - 1] + cost);
      }
      const tmp = dpPrev;
      dpPrev = dpCurr;
      dpCurr = tmp;
    }
    return dpPrev[lb];
  }, []);

  const tokenMatch = useCallback(
    (token, optLabel) => {
      const t = norm(token);
      const l = norm(optLabel);
      if (!t) return true;
      if (l.includes(t)) return true;
      const words = l.split(/\s+/);
      for (const w of words) {
        if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
      }
      return false;
    },
    [ed1, norm]
  );

  const fuzzyFilter = useCallback(
    (opts, query) => {
      const q = norm(query);
      if (!q) return opts;
      const tokens = q.split(/\s+/).filter(Boolean);
      const scored = [];
      for (const o of opts) {
        const optLabel = norm(o.label || o.name || "");
        if (!optLabel) continue;
        let ok = true;
        let score = 0;
        for (const t of tokens) {
          if (!tokenMatch(t, optLabel)) {
            ok = false;
            break;
          }
          const idx = optLabel.indexOf(norm(t));
          score += idx >= 0 ? 0 : 1;
        }
        if (ok) scored.push({ o, score });
      }
      scored.sort((a, b) => a.score - b.score);
      return scored.map((s) => s.o);
    },
    [tokenMatch, norm]
  );

  // Compute filtered options based on input value
  useEffect(() => {
    const newFiltered = inputValue ? fuzzyFilter(options, inputValue).slice(0, 20) : options;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredOptions(newFiltered);
  }, [options, inputValue, fuzzyFilter]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const updateDropdownPosition = useCallback(() => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;

      dropdown.style.position = "fixed";
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      dropdown.style.minWidth = `${inputRect.width}px`;
      dropdown.style.width = "auto";
      dropdown.style.maxWidth = "90vw";
      dropdown.style.zIndex = "9999";
    }
  }, [isOpen]);

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
  }, [isOpen, updateDropdownPosition]);

  return (
    <div className="relative">
      <div ref={inputRef}>
        <Input
          label={label}
          value={inputValue || ""}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          title={title}
          error={error}
          required={required}
          validationState={validationState}
          showValidation={showValidation}
          data-testid={dataTestId}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          data-testid={dataTestId ? `${dataTestId}-listbox` : undefined}
          role="listbox"
          className={`border rounded-lg shadow-xl max-h-60 overflow-auto ${
            isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || index}
                data-testid={dataTestId ? `${dataTestId}-option-${index}` : undefined}
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  index === highlightedIndex
                    ? isDarkMode
                      ? "bg-teal-700 text-white border-gray-700"
                      : "bg-teal-100 text-gray-900 border-gray-100"
                    : isDarkMode
                      ? "hover:bg-gray-700 text-white border-gray-700"
                      : "hover:bg-gray-50 text-gray-900 border-gray-100"
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
                tabIndex={-1}
                onMouseDown={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={`px-3 py-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{noOptionsText}</div>
          )}
        </div>
      )}
    </div>
  );
};

const AdvancePaymentList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Data state
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [customers, setCustomers] = useState([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [customerInputValue, setCustomerInputValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState(null);

  // Summary state
  const [refundModal, setRefundModal] = useState({ open: false, payment: null });
  const [refundMethod, setRefundMethod] = useState("bank_transfer");

  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    totalVat: 0,
    totalAvailable: 0,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load customers for filter dropdown
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerService.getCustomers({
          status: "active",
          limit: 1000,
        });
        const raw = response.customers || response;
        setCustomers(Array.isArray(raw) ? raw : []);
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    };
    loadCustomers();
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await advancePaymentService.getAll(params);
      setPayments(response.data || []);
      setPagination(response.pagination);

      // Calculate summary
      const summaryData = (response.data || []).reduce(
        (acc, payment) => ({
          totalPayments: acc.totalPayments + 1,
          totalAmount: acc.totalAmount + (payment.totalAmount || 0),
          totalVat: acc.totalVat + (payment.vatAmount || 0),
          totalAvailable: acc.totalAvailable + (payment.amountAvailable || 0),
        }),
        { totalPayments: 0, totalAmount: 0, totalVat: 0, totalAvailable: 0 }
      );
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading advance payments:", error);
      notificationService.error("Failed to load advance payments");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, customerFilter, startDate, endDate]);

  // Load payments when filters change
  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPayments]); // loadPayments is stable

  const handleApplyToInvoice = (payment) => {
    navigate(`/app/advance-payments/${payment.id}/apply`);
  };

  const handleRefund = async (payment) => {
    const confirmed = await confirm({
      title: "Refund Advance Payment?",
      message: `Are you sure you want to refund the remaining balance of ${formatCurrency(payment.amountAvailable)}?`,
      confirmText: "Refund",
      variant: "default",
    });

    if (!confirmed) return;

    setRefundMethod("bank_transfer");
    setRefundModal({ open: true, payment });
  };

  const handleRefundSubmit = async () => {
    const payment = refundModal.payment;
    setRefundModal({ open: false, payment: null });
    const refundDate = new Date().toISOString().split("T")[0];
    try {
      await advancePaymentService.refund(payment.id, {
        amount: payment.amountAvailable,
        refundDate,
        refundMethod,
        reason: "Customer requested refund",
      });
      notificationService.success("Refund processed successfully");
      loadPayments();
    } catch (error) {
      console.error("Error processing refund:", error);
      notificationService.error("Failed to process refund");
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      await advancePaymentService.downloadReceipt(payment.id, payment.receiptNumber);
      notificationService.success("Receipt downloaded");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      notificationService.error("Failed to download receipt");
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.received;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCustomerFilter("");
    setCustomerInputValue("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || customerFilter || startDate || endDate;

  // Initial loading spinner
  if (initialLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading advance payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              💵 Advance Receipts (Pre-Invoice)
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              UAE VAT Article 26: Payments received before invoice issuance create an immediate tax point. VAT must be
              declared in the period received.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/advance-payments/new")}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Record Advance Payment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
                <FileText className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Receipts</p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {summary.totalPayments}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-green-900/30" : "bg-green-100"}`}>
                <DollarSign className={`h-5 w-5 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Amount</p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-amber-900/30" : "bg-amber-100"}`}>
                <Building2 className={`h-5 w-5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>VAT Collected</p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(summary.totalVat)}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}>
                <CheckCircle className={`h-5 w-5 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Available Balance</p>
                <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(summary.totalAvailable)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="text"
                  placeholder="Search by receipt number or customer..."
                  aria-label="Search advance payments"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-600"
                  : isDarkMode
                    ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-teal-600 text-white rounded-full">
                  {[statusFilter, customerFilter, startDate, endDate].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadPayments}
              disabled={loading}
              aria-label="Refresh list"
              title="Refresh list"
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer */}
                <div>
                  <Autocomplete
                    label="Customer"
                    placeholder="All Customers"
                    options={customers.map((c) => ({
                      id: c.id,
                      label: c.name,
                      name: c.name,
                    }))}
                    value={customerFilter ? customers.find((c) => c.id === parseInt(customerFilter, 10)) : null}
                    inputValue={customerInputValue}
                    onInputChange={(_e, newValue) => {
                      setCustomerInputValue(newValue || "");
                    }}
                    onChange={(_e, selected) => {
                      if (selected) {
                        setCustomerFilter(String(selected.id));
                        setCustomerInputValue(selected.name);
                      } else {
                        setCustomerFilter("");
                        setCustomerInputValue("");
                      }
                      setCurrentPage(1);
                    }}
                    noOptionsText="No customers found"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label
                    htmlFor="advance-payment-start-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    From Date
                  </label>
                  <input
                    id="advance-payment-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor="advance-payment-end-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    To Date
                  </label>
                  <input
                    id="advance-payment-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-white hover:bg-gray-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payments Table */}
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                {debouncedSearch || hasActiveFilters ? "No matching advance payments" : "No advance payments found"}
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {debouncedSearch || hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "Click the button above to record your first advance payment"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Receipt #
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Customer
                    </th>
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Amount
                    </th>
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      VAT
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Applied To
                    </th>
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors cursor-pointer`}
                      onClick={() => navigate(`/app/advance-payments/${payment.id}`)}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        <div className="font-medium">{payment.receiptNumber}</div>
                        {payment.referenceNumber && (
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Ref: {payment.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className={`px-6 py-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <div className="max-w-xs truncate">{payment.customerName || "N/A"}</div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {formatCurrency(payment.totalAmount)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {formatCurrency(payment.vatAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                      <td className={`px-6 py-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {payment.applications && payment.applications.length > 0 ? (
                          <div className="text-sm">
                            {payment.applications.slice(0, 2).map((app, idx) => (
                              <div key={app.id || app.name || `app-${idx}`}>{app.invoiceNumber}</div>
                            ))}
                            {payment.applications.length > 2 && (
                              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                +{payment.applications.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Not applied
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => navigate(`/app/advance-payments/${payment.id}`)}
                            className={`p-2 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-300" : "hover:bg-gray-200 text-gray-600"}`}
                            title="View"
                            aria-label="View payment"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Download Receipt */}
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(payment)}
                            className={`p-2 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-300" : "hover:bg-gray-200 text-gray-600"}`}
                            title="Download Receipt"
                            aria-label="Download receipt"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {/* Apply to Invoice - only if has available balance */}
                          {payment.amountAvailable > 0 &&
                            payment.status !== "refunded" &&
                            payment.status !== "cancelled" && (
                              <button
                                type="button"
                                onClick={() => handleApplyToInvoice(payment)}
                                className={`p-2 rounded transition-colors ${isDarkMode ? "hover:bg-blue-900/30 text-blue-400" : "hover:bg-blue-100 text-blue-600"}`}
                                title="Apply to Invoice"
                                aria-label="Apply to invoice"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}
                          {/* Refund - only if has available balance */}
                          {payment.amountAvailable > 0 &&
                            payment.status !== "refunded" &&
                            payment.status !== "cancelled" && (
                              <button
                                type="button"
                                onClick={() => handleRefund(payment)}
                                className={`p-2 rounded transition-colors ${isDarkMode ? "hover:bg-amber-900/30 text-amber-400" : "hover:bg-amber-100 text-amber-600"}`}
                                title="Refund"
                                aria-label="Refund payment"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total > pageSize && (
            <div className={`px-6 py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, pagination.total)} to{" "}
                  {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} payments
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-1 rounded border ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkMode
                          ? "border-gray-600 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-gray-50"
                    } ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage * pageSize >= pagination.total}
                    className={`flex items-center gap-1 px-3 py-1 rounded border ${
                      currentPage * pageSize >= pagination.total
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkMode
                          ? "border-gray-600 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-gray-50"
                    } ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Refund Method Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
            <h3 className="text-lg font-semibold mb-2">Select Refund Method</h3>
            <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Choose the refund payment method for {formatCurrency(refundModal.payment?.amountAvailable || 0)}.
            </p>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              aria-label="Refund method"
              className={`w-full p-2 rounded border text-sm mb-4 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" className={`px-4 py-2 rounded text-sm ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setRefundModal({ open: false, payment: null })}>
                Cancel
              </button>
              <button type="button" className="px-4 py-2 rounded text-sm text-white bg-teal-600 hover:bg-teal-700" onClick={handleRefundSubmit}>
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancePaymentList;
