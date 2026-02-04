import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  FileText,
  Filter,
  Loader2,
  Package,
  Save,
  Search,
  Send,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { normalizeUom } from "../utils/fieldAccessors";

// Design system colors
const COLORS = {
  bg: "#0b0f14",
  card: "#141a20",
  border: "#2a3640",
  text: "#e6edf3",
  muted: "#93a4b4",
  good: "#2ecc71",
  warn: "#f39c12",
  bad: "#e74c3c",
  accent: "#4aa3ff",
};

// Reusable Drawer component
const Drawer = ({ isOpen, onClose, title, description, children, isDarkMode }) => {
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
      <div
        className={`fixed inset-0 bg-black/55 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[min(520px,92vw)] z-50
          ${isDarkMode ? `bg-[${COLORS.card}] border-l border-[${COLORS.border}]` : "bg-white border-l border-gray-200"}
          p-4 overflow-auto transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ backgroundColor: isDarkMode ? COLORS.card : undefined }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</div>
            {description && (
              <div
                className={`text-xs mt-1 ${isDarkMode ? `text-[${COLORS.muted}]` : "text-gray-500"}`}
                style={{ color: isDarkMode ? COLORS.muted : undefined }}
              >
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Content */}
        {children}
      </div>
    </>
  );
};

import CreditNotePreview from "../components/credit-notes/CreditNotePreview";
import DraftConflictModal from "../components/DraftConflictModal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useTheme } from "../contexts/ThemeContext";
import useCreditNoteDrafts from "../hooks/useCreditNoteDrafts";
import { companyService } from "../services/companyService";
import { creditNoteService } from "../services/creditNoteService";
import { invoiceService } from "../services/invoiceService";
import { notificationService } from "../services/notificationService";
import {
  calculateItemAmount,
  formatCurrency,
  formatDateForInput,
  validateQuantityPrecision,
} from "../utils/invoiceUtils";

// Reason categories determine credit note type and required fields
const REASON_CATEGORIES = {
  PHYSICAL_RETURN: "physical_return", // Requires items, QC, logistics
  FINANCIAL_ONLY: "financial_only", // Items optional, no logistics
  FLEXIBLE: "flexible", // User chooses
};

const RETURN_REASONS = [
  // Physical Return reasons - require items and logistics
  {
    value: "defective",
    label: "Defective Product",
    category: REASON_CATEGORIES.PHYSICAL_RETURN,
  },
  {
    value: "damaged",
    label: "Damaged in Transit",
    category: REASON_CATEGORIES.PHYSICAL_RETURN,
  },
  {
    value: "wrong_item",
    label: "Wrong Item Sent",
    category: REASON_CATEGORIES.PHYSICAL_RETURN,
  },
  {
    value: "quality_issue",
    label: "Quality Issue",
    category: REASON_CATEGORIES.PHYSICAL_RETURN,
  },
  {
    value: "customer_change_mind",
    label: "Customer Changed Mind",
    category: REASON_CATEGORIES.PHYSICAL_RETURN,
  },
  // Financial Only reasons - no physical return
  {
    value: "overcharge",
    label: "Overcharge/Pricing Error",
    category: REASON_CATEGORIES.FINANCIAL_ONLY,
  },
  {
    value: "duplicate_order",
    label: "Duplicate Order",
    category: REASON_CATEGORIES.FINANCIAL_ONLY,
  },
  {
    value: "goodwill_credit",
    label: "Goodwill Credit",
    category: REASON_CATEGORIES.FINANCIAL_ONLY,
  },
  // Flexible - user decides
  {
    value: "other",
    label: "Other (Specify in Notes)",
    category: REASON_CATEGORIES.FLEXIBLE,
  },
];

// Helper to get reason category
const getReasonCategory = (reasonValue) => {
  const reason = RETURN_REASONS.find((r) => r.value === reasonValue);
  return reason?.category || REASON_CATEGORIES.FLEXIBLE;
};

// Helper to determine if reason requires physical return
const isPhysicalReturnReason = (reasonValue) => {
  return getReasonCategory(reasonValue) === REASON_CATEGORIES.PHYSICAL_RETURN;
};

// Helper to determine if reason is financial only
const isFinancialOnlyReason = (reasonValue) => {
  return getReasonCategory(reasonValue) === REASON_CATEGORIES.FINANCIAL_ONLY;
};

const CREDIT_NOTE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "items_received", label: "Items Received" },
  { value: "items_inspected", label: "Items Inspected" },
  { value: "refunded", label: "Refunded" },
  { value: "completed", label: "Completed" },
];

const REFUND_METHODS = [
  { value: "credit_adjustment", label: "Credit Adjustment (Apply to Account)" },
  { value: "offset_invoice", label: "Offset Against Invoice" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card Refund" },
];

// Methods that require a reference number
const METHODS_REQUIRING_REFERENCE = ["bank_transfer", "cheque", "credit_card", "offset_invoice"];

const CREDIT_NOTE_TYPES = [
  {
    value: "ACCOUNTING_ONLY",
    label: "Accounting Only",
    description: "Financial adjustment without physical return",
  },
  {
    value: "RETURN_WITH_QC",
    label: "Return with QC",
    description: "Physical return requiring quality inspection",
  },
];

const CreditNoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [_invoiceLoading, setInvoiceLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [company, setCompany] = useState(null);

  // Drawer states
  const [logisticsDrawerOpen, setLogisticsDrawerOpen] = useState(false);

  // Form state
  const [creditNote, setCreditNote] = useState({
    creditNoteNumber: "CN-DRAFT",
    invoiceId: null,
    invoiceNumber: "",
    customer: {
      id: null,
      name: "",
      address: {
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
      phone: "",
      email: "",
      trn: "",
    },
    creditNoteDate: formatDateForInput(new Date()),
    status: "draft",
    creditNoteType: "",
    reasonForReturn: "",
    items: [],
    subtotal: 0,
    vatAmount: 0,
    totalCredit: 0,
    // Invoice discount info for proportional allocation
    invoiceDiscountType: "none", // 'none', 'percentage', 'amount'
    invoiceDiscountValue: 0,
    invoiceSubtotal: 0,
    discountAmount: 0, // Calculated discount for credit note
    notes: "",
    // Refund Information
    refundMethod: "",
    refundDate: "",
    refundReference: "",
    // QC Information (for RETURN_WITH_QC type)
    qcResult: null,
    qcNotes: "",
    qcInspectedAt: null,
    qcInspectedBy: null,
    // Return Logistics
    expectedReturnDate: "",
    warehouseId: null,
    returnShippingCost: 0,
    // Additional Charges
    restockingFee: 0,
    // Manual Credit Amount (for ACCOUNTING_ONLY when no items selected)
    manualCreditAmount: 0,
    // Steel Return Specifics (Priority 3 - STEEL-FORMS-PHASE1)
    returnReasonCategory: "",
    vendorClaim: {
      status: "PENDING",
      claimAmount: 0,
      settlementAmount: 0,
      notes: "",
    },
    qualityFailureDetails: {
      testParameter: "",
      measuredValue: "",
      specValue: "",
      testDate: "",
      photos: [],
    },
    heatNumberMatch: {
      matches: null,
      originalHeat: "",
      returnedHeat: "",
      notes: "",
    },
    gradeVerification: {
      pmiTestDone: false,
      verifiedGrade: "",
      originalGrade: "",
      testCertificatePath: "",
    },
    dispositionDecision: "",
    rmaNumber: "",
    rmaValidityDate: "",
    rmaStatus: "PENDING",
    approvalRequiredUi: false,
    approvalThresholdAmount: 5000, // Default threshold AED 5,000
    approverName: "",
    approvalTimestamp: null,
    sourceInvoices: [],
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [_availableInvoices, _setAvailableInvoices] = useState([]);
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(!id);
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [itemQuantityErrors, setItemQuantityErrors] = useState({}); // Track per-item quantity precision errors

  // Determine if credit note is editable (only draft status is editable per finance/VAT compliance)
  const isEditable = !id || creditNote.status === "draft";

  // Mark a field as touched (for showing validation on blur)
  const handleFieldBlur = (fieldName) => {
    setTouchedFields((prev) => new Set([...prev, fieldName]));
  };

  // Check if a field should show error state
  const shouldShowError = (fieldName) => {
    return touchedFields.has(fieldName) && invalidFields.has(fieldName);
  };

  // Field-level error messages
  const fieldErrors = {
    invoiceId: "Please select an invoice",
    creditNoteNumber: "Credit note number is required",
    creditNoteDate: "Date is required",
    reasonForReturn: "Reason for return is required",
    items: "Please select at least one item with quantity to return",
    manualCreditAmount: "Credit amount is required when no items selected",
    expectedReturnDate: "Expected return date is required for physical returns",
  };

  // Derived state: Determine if this is a physical return based on reason OR type
  const isPhysicalReturn = useMemo(() => {
    // If reason is set and it's a physical return reason, it's physical
    if (creditNote.reasonForReturn && isPhysicalReturnReason(creditNote.reasonForReturn)) {
      return true;
    }
    // If reason is financial only, it's not physical
    if (creditNote.reasonForReturn && isFinancialOnlyReason(creditNote.reasonForReturn)) {
      return false;
    }
    // For 'other' or no reason, check the credit note type
    return creditNote.creditNoteType === "RETURN_WITH_QC";
  }, [creditNote.reasonForReturn, creditNote.creditNoteType]);

  // Derived state: Items are required only for physical returns
  const itemsRequired = isPhysicalReturn;

  // Derived state: Logistics section visible only for physical returns
  const showLogisticsSection = isPhysicalReturn;

  // Derived state: Check if any items have been selected with quantity
  const hasSelectedItems = useMemo(() => {
    return creditNote.items.some((item) => item.selected && item.quantityReturned > 0);
  }, [creditNote.items]);

  // Handle reason change - auto-select credit note type
  const handleReasonChange = (newReason) => {
    const category = getReasonCategory(newReason);
    let newType = creditNote.creditNoteType;

    // Auto-select type based on reason category
    if (category === REASON_CATEGORIES.PHYSICAL_RETURN) {
      newType = "RETURN_WITH_QC";
    } else if (category === REASON_CATEGORIES.FINANCIAL_ONLY) {
      newType = "ACCOUNTING_ONLY";
    }
    // For FLEXIBLE, keep current type (user can change manually)

    setCreditNote((prev) => ({
      ...prev,
      reasonForReturn: newReason,
      creditNoteType: newType,
    }));

    // Clear validation error for reason
    if (newReason) {
      setInvalidFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete("reasonForReturn");
        return newSet;
      });
    }
  };

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");

  // Draft conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);

  // Initialize draft system - pass invoiceId from URL param or form state
  const currentInvoiceId = creditNote.invoiceId || searchParams.get("invoiceId");

  const handleDraftConflict = useCallback((conflict) => {
    setPendingConflict(conflict);
    setShowConflictModal(true);
  }, []);

  const { deleteDraft, checkConflict, clearPendingSave } = useCreditNoteDrafts({
    currentInvoiceId: currentInvoiceId ? parseInt(currentInvoiceId, 10) : null,
    onConflict: handleDraftConflict,
  });

  // Fetch company data for preview
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const companyData = await companyService.getCompany();
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to fetch company data:", error);
      }
    };
    fetchCompany();
  }, []);

  // Load credit note if editing, or load invoice from query param
  useEffect(() => {
    if (id) {
      loadCreditNote();
    } else {
      loadNextCreditNoteNumber();

      // Check for invoiceId query parameter (from invoice list navigation)
      const invoiceIdParam = searchParams.get("invoiceId");
      if (invoiceIdParam) {
        // Check for existing draft conflict before loading invoice
        const conflict = checkConflict(parseInt(invoiceIdParam, 10));
        if (conflict.type) {
          handleDraftConflict(conflict);
        } else {
          loadInvoiceForCreditNote(invoiceIdParam);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    checkConflict,
    handleDraftConflict,
    loadCreditNote,
    loadInvoiceForCreditNote,
    loadNextCreditNoteNumber,
    searchParams,
  ]); // loadCreditNote is stable

  // AUTO-SAVE REMOVED - User only wants explicit "Save Draft" button

  const loadCreditNote = async () => {
    try {
      setLoading(true);
      const data = await creditNoteService.getCreditNote(id);

      // Format date for HTML5 date input
      const formattedData = {
        ...data,
        creditNoteDate: data.creditNoteDate
          ? formatDateForInput(new Date(data.creditNoteDate))
          : formatDateForInput(new Date()),
      };

      setCreditNote(formattedData);
      if (data.invoiceId) {
        const invoice = await invoiceService.getInvoice(data.invoiceId);
        setSelectedInvoice(invoice);
      }
    } catch (error) {
      console.error("Error loading credit note:", error);
      notificationService.error("Failed to load credit note");
    } finally {
      setLoading(false);
    }
  };

  // Handle draft conflict resolution
  const handleResumeDraft = useCallback(async (draft) => {
    setIsRestoringDraft(true);
    try {
      // Load the invoice first
      const invoice = await invoiceService.getInvoice(draft.invoiceId);
      setSelectedInvoice(invoice);

      // Restore the draft data with formatted date
      const restoredData = {
        ...draft.data,
        creditNoteDate: draft.data.creditNoteDate
          ? formatDateForInput(new Date(draft.data.creditNoteDate))
          : formatDateForInput(new Date()),
      };
      setCreditNote(restoredData);
      setShowInvoiceSelect(false);
      setShowConflictModal(false);
      setPendingConflict(null);

      notificationService.success("Draft restored successfully");
    } catch (error) {
      console.error("Error restoring draft:", error);
      notificationService.error("Failed to restore draft");
    } finally {
      setIsRestoringDraft(false);
    }
  }, []);

  const handleDiscardDraft = useCallback(
    (invoiceId) => {
      deleteDraft(invoiceId);
      setShowConflictModal(false);
      setPendingConflict(null);

      // Continue with the original action
      const invoiceIdParam = searchParams.get("invoiceId");
      if (invoiceIdParam) {
        loadInvoiceForCreditNote(invoiceIdParam);
      }

      notificationService.info("Draft discarded");
    },
    [deleteDraft, searchParams, loadInvoiceForCreditNote]
  );

  const handleStartFresh = useCallback(() => {
    setShowConflictModal(false);
    setPendingConflict(null);

    // Continue with loading the new invoice
    const invoiceIdParam = searchParams.get("invoiceId");
    if (invoiceIdParam) {
      loadInvoiceForCreditNote(invoiceIdParam);
    }
  }, [searchParams, loadInvoiceForCreditNote]);

  const loadNextCreditNoteNumber = async () => {
    try {
      const response = await creditNoteService.getNextCreditNoteNumber();
      const nextNumber = response.nextNumber || response.nextNumber || "CN-0001";
      setCreditNote((prev) => ({ ...prev, creditNoteNumber: nextNumber }));
    } catch (error) {
      console.error("Error loading next credit note number:", error);
    }
  };

  // Search invoices with debouncing
  const searchInvoices = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await invoiceService.searchForCreditNote(query);
      setSearchResults(response);
      setShowDropdown(response.length > 0);
    } catch (error) {
      console.error("Error searching invoices:", error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInput = (value) => {
    setSearchQuery(value);

    // Clear previous timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for 300ms debounce
    const timer = setTimeout(() => {
      searchInvoices(value);
    }, 300);

    setSearchDebounceTimer(timer);
  };

  // Handle invoice selection from dropdown
  const handleInvoiceSelect = (invoice) => {
    loadInvoiceForCreditNote(invoice.id);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Filter results based on date and amount
  const filteredResults = useMemo(() => {
    let results = searchResults;

    // Date filter
    if (dateFilter !== "all") {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter, 10));
      results = results.filter((inv) => new Date(inv.invoiceDate) >= daysAgo);
    }

    // Amount filter
    if (amountFilter !== "all") {
      results = results.filter((inv) => inv.total >= parseInt(amountFilter, 10));
    }

    return results;
  }, [searchResults, dateFilter, amountFilter]);

  // Clear all filters
  const clearFilters = () => {
    setDateFilter("all");
    setAmountFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters = dateFilter !== "all" || amountFilter !== "all";

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const loadInvoiceForCreditNote = async (invoiceId) => {
    try {
      setInvoiceLoading(true);
      const invoice = await invoiceService.getInvoice(invoiceId);

      // Only allow credit notes for issued invoices
      // Handle both 'issued' and 'STATUS_ISSUED' formats from API
      const normalizedStatus = invoice.status?.toLowerCase().replace("status_", "");
      if (normalizedStatus !== "issued") {
        notificationService.warning("Credit notes can only be created for Final Tax Invoices");
        return;
      }

      setSelectedInvoice(invoice);

      // Determine invoice discount type and value
      const discountPerc = parseFloat(invoice.discountPercentage) || 0;
      const discountFlat = parseFloat(invoice.discountAmount) || 0;
      let invoiceDiscountType = "none";
      let invoiceDiscountValue = 0;

      if (invoice.discountType === "percentage" && discountPerc > 0) {
        invoiceDiscountType = "percentage";
        invoiceDiscountValue = discountPerc;
      } else if (invoice.discountType === "amount" && discountFlat > 0) {
        invoiceDiscountType = "amount";
        invoiceDiscountValue = discountFlat;
      } else if (discountPerc > 0) {
        // Fallback: if no discountType but percentage exists
        invoiceDiscountType = "percentage";
        invoiceDiscountValue = discountPerc;
      } else if (discountFlat > 0) {
        // Fallback: if no discountType but amount exists
        invoiceDiscountType = "amount";
        invoiceDiscountValue = discountFlat;
      }

      // Calculate invoice subtotal (sum of item amounts before discount)
      const invoiceSubtotal =
        parseFloat(invoice.subtotal) || invoice.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

      // Populate credit note with invoice data
      setCreditNote((prev) => ({
        ...prev,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        // Store invoice discount info for proportional allocation
        invoiceDiscountType,
        invoiceDiscountValue,
        invoiceSubtotal,
        discountAmount: 0,
        items: invoice.items.map((item) => ({
          invoiceItemId: item.id,
          productId: item.productId,
          productName: item.name || item.productName,
          description: item.description || "",
          originalQuantity: item.quantity,
          quantityReturned: 0,
          unit: normalizeUom(item), // Unit for quantity precision validation
          rate: item.rate,
          amount: 0,
          vatRate: item.vatRate || 5,
          vatAmount: 0,
          discountAmount: 0, // Item-level discount for credit note
          netAmount: 0, // Amount after discount
          returnStatus: "not_returned",
          selected: false,
          // Weight-based pricing fields (needed for proper amount calculation)
          pricingBasis: item.pricingBasis || "PER_MT",
          unitWeightKg: item.unitWeightKg || null,
          quantityUom: item.quantityUom || "PCS",
          // Store original item amount for proportional discount calculation
          originalItemAmount: parseFloat(item.amount) || 0,
        })),
      }));

      setShowInvoiceSelect(false);
    } catch (error) {
      console.error("Error loading invoice:", error);
      notificationService.error("Failed to load invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleItemSelect = (index, selected) => {
    const updatedItems = [...creditNote.items];
    updatedItems[index].selected = selected;

    // If deselecting, reset quantity to 0
    if (!selected) {
      updatedItems[index].quantityReturned = 0;
    }

    setCreditNote((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...creditNote.items];
    const item = updatedItems[index];

    // Validate quantity
    const qty = parseFloat(quantity) || 0;
    if (qty > item.originalQuantity) {
      notificationService.warning(`Cannot return more than ${item.originalQuantity} units`);
      return;
    }

    if (qty < 0) {
      return;
    }

    // Validate quantity precision for PCS/BUNDLE units
    const precisionResult = validateQuantityPrecision(qty, item.unit);
    setItemQuantityErrors((prevErrors) => {
      if (!precisionResult.valid) {
        return { ...prevErrors, [index]: precisionResult.message };
      }
      const { [index]: _removed, ...rest } = prevErrors;
      return rest;
    });

    item.quantityReturned = qty;
    // Use proper weight-based pricing calculation (same as Invoice)
    item.amount = calculateItemAmount(qty, item.rate, item.pricingBasis, item.unitWeightKg, item.quantityUom);

    // Calculate proportional discount for this item based on original invoice discount
    let itemDiscount = 0;
    if (creditNote.invoiceDiscountType === "percentage" && creditNote.invoiceDiscountValue > 0) {
      // Apply same percentage discount to the credit note item amount
      itemDiscount = (item.amount * creditNote.invoiceDiscountValue) / 100;
    } else if (
      creditNote.invoiceDiscountType === "amount" &&
      creditNote.invoiceSubtotal > 0 &&
      creditNote.invoiceDiscountValue > 0
    ) {
      // Proportional allocation of fixed discount based on item's share of invoice total
      // Use ratio of returned amount to original item amount, then apply proportional discount
      const originalItemShare = item.originalItemAmount / creditNote.invoiceSubtotal;
      const itemsFullDiscount = creditNote.invoiceDiscountValue * originalItemShare;
      // Scale by proportion of quantity returned
      const returnRatio = item.originalQuantity > 0 ? qty / item.originalQuantity : 0;
      itemDiscount = itemsFullDiscount * returnRatio;
    }

    item.discountAmount = itemDiscount;
    item.netAmount = item.amount - itemDiscount;
    // VAT is calculated on the net amount (after discount)
    item.vatAmount = (item.netAmount * item.vatRate) / 100;
    item.selected = qty > 0;

    setCreditNote((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items) => {
    const returnedItems = items.filter((item) => item.selected && item.quantityReturned > 0);

    const subtotal = returnedItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = returnedItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const netTaxable = subtotal - discountAmount;
    const vatAmount = returnedItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalCredit = netTaxable + vatAmount;

    setCreditNote((prev) => ({
      ...prev,
      subtotal,
      discountAmount,
      vatAmount,
      totalCredit,
    }));
  };

  const validateForm = () => {
    const errors = [];
    const invalidFieldsSet = new Set();
    const touchedFieldsSet = new Set(["invoiceId", "creditNoteDate", "reasonForReturn", "creditNoteType"]);

    // Always required
    if (!creditNote.invoiceId) {
      errors.push("Please select an invoice");
      invalidFieldsSet.add("invoiceId");
    }

    if (!creditNote.creditNoteNumber) {
      errors.push("Credit note number is required");
      invalidFieldsSet.add("creditNoteNumber");
    }

    if (!creditNote.creditNoteDate) {
      errors.push("Date is required");
      invalidFieldsSet.add("creditNoteDate");
    }

    if (!creditNote.reasonForReturn) {
      errors.push("Reason for return is required");
      invalidFieldsSet.add("reasonForReturn");
    }

    if (!creditNote.creditNoteType) {
      errors.push("Please select a credit note type");
      invalidFieldsSet.add("creditNoteType");
    }

    const returnedItems = creditNote.items.filter((item) => item.selected && item.quantityReturned > 0);

    // Conditional validation based on credit note type
    if (isPhysicalReturn) {
      // RETURN_WITH_QC: Items are mandatory
      touchedFieldsSet.add("items");
      touchedFieldsSet.add("expectedReturnDate");

      if (returnedItems.length === 0) {
        errors.push("Please select at least one item with quantity to return");
        invalidFieldsSet.add("items");
      }

      if (!creditNote.expectedReturnDate) {
        errors.push("Expected return date is required for physical returns");
        invalidFieldsSet.add("expectedReturnDate");
      }
    } else {
      // ACCOUNTING_ONLY: Either items OR manual credit amount required
      touchedFieldsSet.add("manualCreditAmount");

      const hasManualAmount = creditNote.manualCreditAmount > 0;
      const hasItems = returnedItems.length > 0;

      if (!hasItems && !hasManualAmount) {
        errors.push("Either select items to credit OR enter a manual credit amount");
        invalidFieldsSet.add("manualCreditAmount");
      }

      // When manual credit amount is entered, settlement method is required
      if (hasManualAmount) {
        touchedFieldsSet.add("refundMethod");

        if (!creditNote.refundMethod) {
          errors.push("Please specify how the credit will be settled (Settlement Method)");
          invalidFieldsSet.add("refundMethod");
        }

        // Require reference for specific methods
        if (creditNote.refundMethod && METHODS_REQUIRING_REFERENCE.includes(creditNote.refundMethod)) {
          touchedFieldsSet.add("refundReference");

          if (!creditNote.refundReference) {
            const methodLabel =
              REFUND_METHODS.find((m) => m.value === creditNote.refundMethod)?.label || creditNote.refundMethod;
            errors.push(`Reference number is required for ${methodLabel}`);
            invalidFieldsSet.add("refundReference");
          }
        }
      }
    }

    // Validate item quantities (if any items selected)
    returnedItems.forEach((item, idx) => {
      if (item.quantityReturned > item.originalQuantity) {
        errors.push(`Item "${item.productName}": Cannot return more than original quantity`);
      }
      // Validate quantity precision for PCS/BUNDLE units
      const precisionResult = validateQuantityPrecision(item.quantityReturned, item.unit);
      if (!precisionResult.valid) {
        errors.push(`Item "${item.productName}": ${precisionResult.message}`);
        invalidFieldsSet.add(`item.${idx}.quantity`);
      }
    });

    // Clear item quantity errors state to sync with form validation
    setItemQuantityErrors({});

    setValidationErrors(errors);
    setInvalidFields(invalidFieldsSet);

    // Mark required fields as touched when validation runs (on save attempt)
    setTouchedFields(touchedFieldsSet);

    return errors.length === 0;
  };

  const handleSave = async (issueImmediately = false) => {
    if (!validateForm()) {
      setTimeout(() => {
        document.getElementById("validation-errors-alert")?.scrollIntoView({ behavior: "instant", block: "center" });
      }, 100);
      return;
    }

    try {
      setSaving(true);

      // Prepare items based on credit note type
      let itemsToSave = [];
      let subtotal = creditNote.subtotal;
      let discountAmount = creditNote.discountAmount || 0;
      let vatAmount = creditNote.vatAmount;
      let totalCredit = creditNote.totalCredit;

      if (creditNote.creditNoteType === "RETURN_WITH_QC") {
        // For physical returns, filter only selected items with quantity returned
        itemsToSave = creditNote.items.filter((item) => item.selected && item.quantityReturned > 0);
      } else if (creditNote.creditNoteType === "ACCOUNTING_ONLY" && creditNote.manualCreditAmount > 0) {
        // For ACCOUNTING_ONLY with manual amount, calculate totals from manualCreditAmount
        // Assume manual amount is VAT-inclusive (total credit)
        totalCredit = parseFloat(creditNote.manualCreditAmount) || 0;
        // Calculate VAT-exclusive subtotal (VAT is 5%)
        subtotal = totalCredit / 1.05;
        vatAmount = totalCredit - subtotal;
        discountAmount = 0; // No discount for manual credit
      }

      // Format customer address as string if it's an object
      let customerAddress = creditNote.customer?.address;
      if (customerAddress && typeof customerAddress === "object") {
        const parts = [
          customerAddress.street,
          customerAddress.city,
          customerAddress.state,
          customerAddress.postal_code,
          customerAddress.country,
        ].filter(Boolean);
        customerAddress = parts.join(", ");
      }

      const creditNoteData = {
        ...creditNote,
        items: itemsToSave,
        subtotal,
        discountAmount,
        vatAmount,
        totalCredit,
        customerAddress,
        // Set status based on user action
        status: issueImmediately ? "issued" : "draft",
      };

      // [DEBUG-CN-TYPE] Log credit note type before sending
      // console.log(
      //   '[DEBUG-CN-TYPE] Frontend - creditNote.creditNoteType:',
      //   creditNote.creditNoteType,
      // );
      // console.log(
      //   '[DEBUG-CN-TYPE] Frontend - creditNoteData.creditNoteType:',
      //   creditNoteData.creditNoteType,
      // );
      // console.log(
      //   '[DEBUG-CN-TYPE] Frontend - Full payload:',
      //   JSON.stringify(creditNoteData, null, 2),
      // );

      if (id) {
        await creditNoteService.updateCreditNote(id, creditNoteData);
        notificationService.success("Credit note updated successfully");
      } else {
        await creditNoteService.createCreditNote(creditNoteData);
        notificationService.success(
          issueImmediately ? "Tax document issued successfully" : "Credit note saved as draft"
        );
      }

      // Clear the draft after successful save
      if (creditNote.invoiceId) {
        clearPendingSave();
        deleteDraft(creditNote.invoiceId);
      }

      navigate("/credit-notes");
    } catch (error) {
      console.error("Error saving credit note:", error);
      notificationService.error(error?.response?.data?.error || "Failed to save credit note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading credit note...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="credit-note-form" className={`h-full overflow-auto ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Draft Conflict Modal */}
      {showConflictModal && pendingConflict && (
        <DraftConflictModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          conflict={pendingConflict}
          onResume={handleResumeDraft}
          onDiscard={handleDiscardDraft}
          onStartFresh={handleStartFresh}
          isLoading={isRestoringDraft}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/credit-notes")}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-200 text-gray-700"
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {id ? "Edit Credit Note" : "New Credit Note"}
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {id ? `Editing ${creditNote.creditNoteNumber}` : "Create credit note for returned items"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Preview credit note"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            {/* Save Buttons - Only show for draft credit notes */}
            {isEditable && (
              <>
                {/* Save Draft Button */}
                <button
                  type="button"
                  data-testid="save-draft"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } ${saving ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
                  title="Save as draft without issuing"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Draft
                    </>
                  )}
                </button>

                {/* Issue Tax Document Button */}
                <button
                  type="button"
                  data-testid="submit-credit-note"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    saving ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                  }`}
                  title="Issue tax document immediately"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Issue Tax Document
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Read-Only Warning Banner - Finance & VAT Compliance */}
        {!isEditable && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              isDarkMode ? "bg-amber-900/20 border-amber-600" : "bg-amber-50 border-amber-400"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`flex-shrink-0 h-5 w-5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
              <div className="flex-1">
                <p className={`font-semibold mb-1 ${isDarkMode ? "text-amber-300" : "text-amber-900"}`}>
                  Read-Only Mode - Credit Note Locked
                </p>
                <p className={`text-sm ${isDarkMode ? "text-amber-200" : "text-amber-800"}`}>
                  This credit note is <span className="font-semibold">{creditNote.status}</span> and cannot be edited.
                  {creditNote.status === "issued" && (
                    <>
                      {" "}
                      Once issued, credit notes become tax documents and must remain unchanged per UAE VAT compliance
                      requirements. To make corrections, please use the{" "}
                      <span className="font-semibold">Cancel & Reissue</span> workflow.
                    </>
                  )}
                  {["applied", "refunded", "completed"].includes(creditNote.status) && (
                    <>
                      {" "}
                      This credit note has financial impact (customer balance or payments affected). Contact the finance
                      team for guidance on corrections.
                    </>
                  )}
                  {["items_received", "items_inspected"].includes(creditNote.status) && (
                    <>
                      {" "}
                      Physical goods have been received/inspected. Amounts and items are locked. Contact operations team
                      if corrections are needed.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Field Indicator Legend */}
        <div className={`mb-4 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          <span className="text-red-500 font-bold">*</span> indicates required fields
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div
            id="validation-errors-alert"
            className={`mb-6 p-4 rounded-lg border-2 ${
              isDarkMode ? "bg-red-900/20 border-red-600 text-red-200" : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`} size={24} />
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
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
                  className={`mt-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isDarkMode ? "bg-red-800 hover:bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* Main Content - 8 columns */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Invoice Selection */}
            {showInvoiceSelect && !id && (
              <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  <FileText className="inline h-5 w-5 mr-2" />
                  Select Invoice
                </h2>
                <div>
                  <label
                    htmlFor="invoice-search-input"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Invoice Number <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      />
                      <input
                        id="invoice-search-input"
                        data-testid="invoice-search"
                        type="text"
                        placeholder="Start typing invoice number or customer name..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onFocus={() => {
                          if (searchResults.length > 0) {
                            setShowDropdown(true);
                          }
                        }}
                        onBlur={() => handleFieldBlur("invoiceId")}
                        disabled={!isEditable}
                        aria-required="true"
                        aria-invalid={shouldShowError("invoiceId")}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border transition-colors ${
                          shouldShowError("invoiceId") || invalidFields.has("invoiceId")
                            ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500"
                            : isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500"
                              : "border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500"
                        } focus:outline-none focus:ring-2`}
                      />
                      {isSearching && (
                        <Loader2
                          className={`absolute right-3 top-3 h-5 w-5 animate-spin ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        />
                      )}
                    </div>

                    {/* Filter Controls */}
                    {searchResults.length > 0 && (
                      <div
                        className={`flex flex-wrap gap-2 mt-3 items-center text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        <div className="flex items-center gap-1">
                          <Filter size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Filters:</span>
                        </div>

                        {/* Date Filter */}
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger
                            className={`px-3 h-auto py-1.5 rounded-lg border ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All dates</SelectItem>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Amount Filter */}
                        <Select value={amountFilter} onValueChange={setAmountFilter}>
                          <SelectTrigger
                            className={`px-3 h-auto py-1.5 rounded-lg border ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All amounts</SelectItem>
                            <SelectItem value="1000">Above AED 1,000</SelectItem>
                            <SelectItem value="5000">Above AED 5,000</SelectItem>
                            <SelectItem value="10000">Above AED 10,000</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                              isDarkMode
                                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                            title="Clear all filters"
                          >
                            <X size={14} />
                            Clear
                          </button>
                        )}

                        {/* Results Count */}
                        <span className={`ml-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {filteredResults.length} of {searchResults.length} results
                        </span>
                      </div>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showDropdown && filteredResults.length > 0 && (
                      <div
                        className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-96 overflow-y-auto ${
                          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                        }`}
                      >
                        {filteredResults.map((invoice) => (
                          <button
                            key={invoice.id}
                            type="button"
                            onClick={() => handleInvoiceSelect(invoice)}
                            className={`w-full px-4 py-3 text-left hover:bg-opacity-80 transition-colors border-b last:border-b-0 ${
                              isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {invoice.invoiceNumber}
                                </div>
                                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {invoice.customerName}
                                  {invoice.customerEmail && <span className="ml-2">• {invoice.customerEmail}</span>}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className={`font-medium ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                                  {formatCurrency(invoice.total)}
                                </div>
                                <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No search results message */}
                    {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                      <div
                        className={`absolute z-10 w-full mt-1 p-4 rounded-lg shadow-lg border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700 text-gray-400"
                            : "bg-white border-gray-300 text-gray-600"
                        }`}
                      >
                        No issued invoices found matching &quot;{searchQuery}
                        &quot;
                      </div>
                    )}

                    {/* No filtered results message */}
                    {showDropdown && searchResults.length > 0 && filteredResults.length === 0 && (
                      <div
                        className={`absolute z-10 w-full mt-1 p-4 rounded-lg shadow-lg border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700 text-gray-400"
                            : "bg-white border-gray-300 text-gray-600"
                        }`}
                      >
                        No invoices match the selected filters. Try adjusting or{" "}
                        <button
                          type="button"
                          onClick={clearFilters}
                          className={`underline ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                        >
                          clearing filters
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Type to search invoices by number or customer name
                  </p>
                </div>
              </div>
            )}

            {/* Selected Invoice Info */}
            {selectedInvoice && (
              <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Invoice: {selectedInvoice.invoiceNumber}
                  </h2>
                  {!id && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoice(null);
                        setShowInvoiceSelect(true);
                        setCreditNote((prev) => ({
                          ...prev,
                          invoiceId: null,
                          invoiceNumber: "",
                          items: [],
                        }));
                      }}
                      className={`text-sm ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                    >
                      Change Invoice
                    </button>
                  )}
                </div>
                <div className={`grid grid-cols-2 gap-4 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <div>
                    <span className="font-medium">Customer:</span> {selectedInvoice.customer?.name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(selectedInvoice.date).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> {formatCurrency(selectedInvoice.total)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedInvoice.status}
                  </div>
                </div>
              </div>
            )}

            {/* Items to Return */}
            {selectedInvoice && creditNote.items.length > 0 && (
              <div
                className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm ${
                  invalidFields.has("items") ? "ring-2 ring-red-500" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <Package className="inline h-5 w-5 mr-2" />
                    Select Items to {isPhysicalReturn ? "Return" : "Credit"}{" "}
                    {itemsRequired && <span className="text-red-500 font-bold">*</span>}
                  </h2>
                  <div className="flex items-center gap-2">
                    {!itemsRequired && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"}`}
                      >
                        Optional
                      </span>
                    )}
                    {invalidFields.has("items") && (
                      <span className="text-red-500 text-sm flex items-center gap-1">
                        <AlertTriangle size={14} />
                        At least one item required
                      </span>
                    )}
                  </div>
                </div>
                {/* Helper text for ACCOUNTING_ONLY mode */}
                {!isPhysicalReturn && (
                  <p className={`mb-4 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    💡 For financial-only credit, you can either select items below OR enter a manual credit amount in
                    the sidebar.
                  </p>
                )}
                <div className="space-y-3">
                  {creditNote.items.map((item, index) => (
                    <div
                      key={item.id || item.name || `item-${index}`}
                      className={`p-4 rounded-lg border ${
                        item.selected
                          ? isDarkMode
                            ? "border-teal-500 bg-teal-900/20"
                            : "border-teal-500 bg-teal-50"
                          : isDarkMode
                            ? "border-gray-600"
                            : "border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => handleItemSelect(index, e.target.checked)}
                          disabled={!isEditable}
                          className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 rounded disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {item.productName}
                              </h3>
                              {item.description && (
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className={`text-right text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              <div>Rate: {formatCurrency(item.rate)}</div>
                              {item.selected && item.quantityReturned > 0 && (
                                <div className="font-semibold text-teal-600">
                                  Credit: {formatCurrency((item.netAmount || item.amount) + item.vatAmount)}
                                  {item.discountAmount > 0 && (
                                    <span className="text-xs text-red-500 ml-1">
                                      (incl. disc: -{formatCurrency(item.discountAmount)})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label
                                htmlFor={`original-qty-${index}`}
                                className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                Original Qty
                              </label>
                              <input
                                id={`original-qty-${index}`}
                                type="number"
                                value={item.originalQuantity}
                                disabled
                                className={`w-full px-3 py-2 rounded border text-sm ${
                                  isDarkMode
                                    ? "border-gray-600 bg-gray-700 text-gray-500"
                                    : "border-gray-300 bg-gray-100 text-gray-500"
                                }`}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`return-qty-${index}`}
                                className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                Return Qty {itemsRequired && <span className="text-red-500 font-bold">*</span>}
                              </label>
                              <input
                                id={`return-qty-${index}`}
                                type="number"
                                min="0"
                                max={item.originalQuantity}
                                value={item.quantityReturned}
                                onChange={(e) => {
                                  handleQuantityChange(index, e.target.value);
                                  // Clear items error if quantity entered
                                  if (parseFloat(e.target.value) > 0) {
                                    setInvalidFields((prev) => {
                                      const newSet = new Set(prev);
                                      newSet.delete("items");
                                      return newSet;
                                    });
                                  }
                                }}
                                disabled={!isEditable || !item.selected}
                                aria-required="true"
                                className={`w-full px-3 py-2 rounded border text-sm transition-colors ${
                                  (item.selected && item.quantityReturned === 0 && invalidFields.has("items")) ||
                                  itemQuantityErrors[index]
                                    ? "border-red-500 ring-1 ring-red-500"
                                    : isDarkMode
                                      ? "border-gray-600 bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-500 focus:ring-teal-500 focus:border-teal-500"
                                      : "border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 focus:ring-teal-500 focus:border-teal-500"
                                } focus:outline-none focus:ring-2`}
                              />
                              {/* Inline quantity precision error */}
                              {itemQuantityErrors[index] && (
                                <p className="text-red-500 text-xs mt-1">{itemQuantityErrors[index]}</p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor={`amount-${index}`}
                                className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                Amount
                              </label>
                              <input
                                id={`amount-${index}`}
                                type="text"
                                value={formatCurrency(item.amount)}
                                disabled
                                className={`w-full px-3 py-2 rounded border text-sm ${
                                  isDarkMode
                                    ? "border-gray-600 bg-gray-700 text-gray-500"
                                    : "border-gray-300 bg-gray-100 text-gray-500"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Credit Note Details */}
              <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Credit Note Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="credit-note-number"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Credit Note Number
                    </label>
                    <input
                      id="credit-note-number"
                      data-testid="credit-note-number"
                      type="text"
                      value={creditNote.creditNoteNumber}
                      disabled
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-700 text-gray-500"
                          : "border-gray-300 bg-gray-100 text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="credit-note-type"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Credit Note Type <span className="text-red-500 font-bold">*</span>
                    </label>
                    <Select
                      value={creditNote.creditNoteType || "none"}
                      onValueChange={(value) => {
                        const newValue = value === "none" ? "" : value;
                        setCreditNote((prev) => ({
                          ...prev,
                          creditNoteType: newValue,
                        }));
                        // Clear error when type is selected
                        if (newValue) {
                          setInvalidFields((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete("creditNoteType");
                            return newSet;
                          });
                        }
                      }}
                      disabled={!isEditable}
                    >
                      <SelectTrigger
                        id="credit-note-type"
                        data-testid="credit-note-type"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          !isEditable
                            ? isDarkMode
                              ? "border-gray-600 bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                            : invalidFields.has("creditNoteType")
                              ? "border-red-500 ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20"
                              : isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500"
                                : "border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500"
                        } focus:outline-none focus:ring-2`}
                      >
                        <SelectValue placeholder="-- Select Credit Note Type --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Select Credit Note Type --</SelectItem>
                        {CREDIT_NOTE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {invalidFields.has("creditNoteType") ? (
                      <p className="mt-1 text-xs text-red-500">Please select a credit note type</p>
                    ) : (
                      <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {creditNote.creditNoteType
                          ? CREDIT_NOTE_TYPES.find((t) => t.value === creditNote.creditNoteType)?.description
                          : "Choose whether this is a financial adjustment only or involves physical return"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="credit-note-date"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Date <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="credit-note-date"
                      data-testid="credit-note-date"
                      type="date"
                      value={creditNote.creditNoteDate}
                      onChange={(e) => {
                        setCreditNote((prev) => ({
                          ...prev,
                          creditNoteDate: e.target.value,
                        }));
                        // Clear error when date is selected
                        if (e.target.value) {
                          setInvalidFields((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete("creditNoteDate");
                            return newSet;
                          });
                        }
                      }}
                      onBlur={() => handleFieldBlur("creditNoteDate")}
                      disabled={!isEditable}
                      aria-required="true"
                      aria-invalid={shouldShowError("creditNoteDate")}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        !isEditable ? "cursor-not-allowed opacity-60" : ""
                      } ${
                        shouldShowError("creditNoteDate") || invalidFields.has("creditNoteDate")
                          ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500"
                          : isDarkMode
                            ? "border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500"
                            : "border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500"
                      } focus:outline-none focus:ring-2`}
                    />
                    {(shouldShowError("creditNoteDate") || invalidFields.has("creditNoteDate")) && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        {fieldErrors.creditNoteDate}
                      </p>
                    )}
                  </div>
                  {/* Status - Read-only display, not editable by user */}
                  {id && (
                    <div>
                      <label
                        htmlFor="credit-note-status"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Status
                      </label>
                      <div
                        id="credit-note-status"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-gray-400"
                            : "border-gray-300 bg-gray-100 text-gray-600"
                        }`}
                      >
                        {CREDIT_NOTE_STATUSES.find((s) => s.value === creditNote.status)?.label || creditNote.status}
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Status is managed through workflow actions
                      </p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="reason-for-return"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Reason for Return <span className="text-red-500 font-bold">*</span>
                    </label>
                    <Select
                      value={creditNote.reasonForReturn || "none"}
                      onValueChange={(value) => handleReasonChange(value === "none" ? "" : value)}
                      disabled={!isEditable}
                    >
                      <SelectTrigger
                        id="reason-for-return"
                        data-testid="reason-for-return"
                        onBlur={() => handleFieldBlur("reasonForReturn")}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          !isEditable ? "cursor-not-allowed opacity-60" : ""
                        } ${
                          shouldShowError("reasonForReturn") || invalidFields.has("reasonForReturn")
                            ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500"
                            : isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500"
                              : "border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500"
                        } focus:outline-none focus:ring-2`}
                      >
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select reason...</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Physical Return (Items Required)</SelectLabel>
                          {RETURN_REASONS.filter((r) => r.category === REASON_CATEGORIES.PHYSICAL_RETURN).map(
                            (reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {reason.label}
                              </SelectItem>
                            )
                          )}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Financial Only (No Return)</SelectLabel>
                          {RETURN_REASONS.filter((r) => r.category === REASON_CATEGORIES.FINANCIAL_ONLY).map(
                            (reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {reason.label}
                              </SelectItem>
                            )
                          )}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Other</SelectLabel>
                          {RETURN_REASONS.filter((r) => r.category === REASON_CATEGORIES.FLEXIBLE).map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {(shouldShowError("reasonForReturn") || invalidFields.has("reasonForReturn")) && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        {fieldErrors.reasonForReturn}
                      </p>
                    )}
                    {/* Show helper text about auto-selection */}
                    {creditNote.reasonForReturn && (
                      <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {isPhysicalReturn
                          ? "📦 Physical return - Items and logistics required"
                          : "💰 Financial only - Items optional, no logistics needed"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="credit-note-notes"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Notes
                    </label>
                    <textarea
                      id="credit-note-notes"
                      value={creditNote.notes}
                      onChange={(e) =>
                        setCreditNote((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={4}
                      disabled={!isEditable}
                      placeholder="Additional notes about the return..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        !isEditable ? "cursor-not-allowed opacity-60" : ""
                      } ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>
                </div>
              </div>

              {/* Steel Return Specifics - Show for RETURN_WITH_QC type */}
              {creditNote.creditNoteType === "RETURN_WITH_QC" && (
                <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                  <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Steel Return Classification
                  </h2>
                  <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Detailed classification and quality tracking for returned steel materials.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Return Reason Category */}
                    <div>
                      <label
                        htmlFor="return-reason-category"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Return Reason Category <span className="text-red-500 font-bold">*</span>
                      </label>
                      <Select
                        value={creditNote.returnReasonCategory || "none"}
                        onValueChange={(value) =>
                          setCreditNote((prev) => ({
                            ...prev,
                            returnReasonCategory: value === "none" ? "" : value,
                          }))
                        }
                        disabled={!isEditable}
                      >
                        <SelectTrigger
                          id="return-reason-category"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            !isEditable ? "cursor-not-allowed opacity-60" : ""
                          } ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select category...</SelectItem>
                          <SelectItem value="MATERIAL_DEFECT">Material Defect</SelectItem>
                          <SelectItem value="WRONG_DELIVERY">Wrong Delivery</SelectItem>
                          <SelectItem value="DAMAGE_IN_TRANSIT">Damage in Transit</SelectItem>
                          <SelectItem value="WRONG_GRADE">Wrong Grade</SelectItem>
                          <SelectItem value="WRONG_DIMENSIONS">Wrong Dimensions</SelectItem>
                          <SelectItem value="CUSTOMER_CHANGED_MIND">Customer Changed Mind</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Disposition Decision */}
                    <div>
                      <label
                        htmlFor="disposition-decision"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Disposition Decision <span className="text-red-500 font-bold">*</span>
                      </label>
                      <Select
                        value={creditNote.dispositionDecision || "none"}
                        onValueChange={(value) =>
                          setCreditNote((prev) => ({
                            ...prev,
                            dispositionDecision: value === "none" ? "" : value,
                          }))
                        }
                        disabled={!isEditable}
                      >
                        <SelectTrigger
                          id="disposition-decision"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            !isEditable ? "cursor-not-allowed opacity-60" : ""
                          } ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <SelectValue placeholder="Select disposition..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select disposition...</SelectItem>
                          <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                          <SelectItem value="RESTOCK_AS_NEW">Restock as New</SelectItem>
                          <SelectItem value="RESTOCK_AS_SECOND_GRADE">Restock as Second Grade</SelectItem>
                          <SelectItem value="SCRAP">Scrap</SelectItem>
                          <SelectItem value="RETURN_TO_SUPPLIER">Return to Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Heat Number Match */}
                    <div className="md:col-span-2">
                      <div
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Heat Number Verification
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={creditNote.heatNumberMatch.originalHeat}
                          onChange={(e) =>
                            setCreditNote((prev) => ({
                              ...prev,
                              heatNumberMatch: {
                                ...prev.heatNumberMatch,
                                originalHeat: e.target.value,
                              },
                            }))
                          }
                          placeholder="Original Heat Number"
                          disabled={!isEditable}
                          className={`px-3 py-2 rounded-lg border ${
                            !isEditable ? "cursor-not-allowed opacity-60" : ""
                          } ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <input
                          type="text"
                          value={creditNote.heatNumberMatch.returnedHeat}
                          onChange={(e) =>
                            setCreditNote((prev) => ({
                              ...prev,
                              heatNumberMatch: {
                                ...prev.heatNumberMatch,
                                returnedHeat: e.target.value,
                              },
                            }))
                          }
                          placeholder="Returned Heat Number"
                          disabled={!isEditable}
                          className={`px-3 py-2 rounded-lg border ${
                            !isEditable ? "cursor-not-allowed opacity-60" : ""
                          } ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <Select
                          value={
                            creditNote.heatNumberMatch.matches === null
                              ? "unknown"
                              : creditNote.heatNumberMatch.matches
                                ? "yes"
                                : "no"
                          }
                          onValueChange={(value) =>
                            setCreditNote((prev) => ({
                              ...prev,
                              heatNumberMatch: {
                                ...prev.heatNumberMatch,
                                matches: value === "unknown" ? null : value === "yes",
                              },
                            }))
                          }
                          disabled={!isEditable}
                        >
                          <SelectTrigger
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unknown">Unknown</SelectItem>
                            <SelectItem value="yes">Match</SelectItem>
                            <SelectItem value="no">Mismatch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Grade Verification - PMI Test */}
                    <div className="md:col-span-2">
                      <div
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Grade Verification (PMI Test)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pmi-test-done"
                            checked={creditNote.gradeVerification.pmiTestDone}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                gradeVerification: {
                                  ...prev.gradeVerification,
                                  pmiTestDone: e.target.checked,
                                },
                              }))
                            }
                            disabled={!isEditable}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label
                            htmlFor="pmi-test-done"
                            className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            PMI Test Done
                          </label>
                        </div>
                        <input
                          type="text"
                          value={creditNote.gradeVerification.originalGrade}
                          onChange={(e) =>
                            setCreditNote((prev) => ({
                              ...prev,
                              gradeVerification: {
                                ...prev.gradeVerification,
                                originalGrade: e.target.value,
                              },
                            }))
                          }
                          placeholder="Original Grade"
                          disabled={!isEditable}
                          className={`px-3 py-2 rounded-lg border ${
                            !isEditable ? "cursor-not-allowed opacity-60" : ""
                          } ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <input
                          type="text"
                          value={creditNote.gradeVerification.verifiedGrade}
                          onChange={(e) =>
                            setCreditNote((prev) => ({
                              ...prev,
                              gradeVerification: {
                                ...prev.gradeVerification,
                                verifiedGrade: e.target.value,
                              },
                            }))
                          }
                          placeholder="Verified Grade"
                          disabled={!isEditable || !creditNote.gradeVerification.pmiTestDone}
                          className={`px-3 py-2 rounded-lg border ${
                            !isEditable || !creditNote.gradeVerification.pmiTestDone
                              ? "cursor-not-allowed opacity-60"
                              : ""
                          } ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>
                    </div>

                    {/* Quality Failure Details - conditional on MATERIAL_DEFECT */}
                    {(creditNote.returnReasonCategory === "MATERIAL_DEFECT" ||
                      creditNote.returnReasonCategory === "WRONG_GRADE") && (
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <div
                          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Quality Failure Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={creditNote.qualityFailureDetails.testParameter}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                qualityFailureDetails: {
                                  ...prev.qualityFailureDetails,
                                  testParameter: e.target.value,
                                },
                              }))
                            }
                            placeholder="Test Parameter"
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                          <input
                            type="text"
                            value={creditNote.qualityFailureDetails.measuredValue}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                qualityFailureDetails: {
                                  ...prev.qualityFailureDetails,
                                  measuredValue: e.target.value,
                                },
                              }))
                            }
                            placeholder="Measured Value"
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                          <input
                            type="text"
                            value={creditNote.qualityFailureDetails.specValue}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                qualityFailureDetails: {
                                  ...prev.qualityFailureDetails,
                                  specValue: e.target.value,
                                },
                              }))
                            }
                            placeholder="Spec Value"
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                          <input
                            type="date"
                            value={creditNote.qualityFailureDetails.testDate}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                qualityFailureDetails: {
                                  ...prev.qualityFailureDetails,
                                  testDate: e.target.value,
                                },
                              }))
                            }
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Vendor Claim - conditional on MATERIAL_DEFECT or WRONG_DELIVERY */}
                    {(creditNote.returnReasonCategory === "MATERIAL_DEFECT" ||
                      creditNote.returnReasonCategory === "WRONG_DELIVERY") && (
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <div
                          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Vendor Claim Tracking
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <Select
                            value={creditNote.vendorClaim.status}
                            onValueChange={(value) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                vendorClaim: {
                                  ...prev.vendorClaim,
                                  status: value,
                                },
                              }))
                            }
                            disabled={!isEditable}
                          >
                            <SelectTrigger
                              className={`px-3 py-2 rounded-lg border ${
                                !isEditable ? "cursor-not-allowed opacity-60" : ""
                              } ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white"
                                  : "border-gray-300 bg-white text-gray-900"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="SUBMITTED">Submitted</SelectItem>
                              <SelectItem value="APPROVED">Approved</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                              <SelectItem value="SETTLED">Settled</SelectItem>
                            </SelectContent>
                          </Select>
                          <input
                            type="number"
                            value={creditNote.vendorClaim.claimAmount}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                vendorClaim: {
                                  ...prev.vendorClaim,
                                  claimAmount: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="Claim Amount"
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                          <input
                            type="number"
                            value={creditNote.vendorClaim.settlementAmount}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                vendorClaim: {
                                  ...prev.vendorClaim,
                                  settlementAmount: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="Settlement Amount"
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                          <input
                            type="text"
                            value={creditNote.vendorClaim.notes}
                            onChange={(e) =>
                              setCreditNote((prev) => ({
                                ...prev,
                                vendorClaim: {
                                  ...prev.vendorClaim,
                                  notes: e.target.value,
                                },
                              }))
                            }
                            placeholder="Claim Notes"
                            disabled={!isEditable}
                            className={`px-3 py-2 rounded-lg border ${
                              !isEditable ? "cursor-not-allowed opacity-60" : ""
                            } ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          />
                        </div>
                      </div>
                    )}

                    {/* RMA Information - Auto-generated, display only */}
                    {creditNote.rmaNumber && (
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <div
                          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          RMA (Return Material Authorization)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              RMA Number
                            </div>
                            <div
                              className={`px-3 py-2 rounded-lg border ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white"
                                  : "border-gray-300 bg-gray-100 text-gray-900"
                              }`}
                            >
                              {creditNote.rmaNumber}
                            </div>
                          </div>
                          <div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Valid Until
                            </div>
                            <div
                              className={`px-3 py-2 rounded-lg border ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white"
                                  : "border-gray-300 bg-gray-100 text-gray-900"
                              }`}
                            >
                              {creditNote.rmaValidityDate
                                ? new Date(creditNote.rmaValidityDate).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              RMA Status
                            </div>
                            <div
                              className={`px-3 py-2 rounded-lg border font-medium ${
                                creditNote.rmaStatus === "APPROVED"
                                  ? "text-green-600 border-green-500 bg-green-50"
                                  : creditNote.rmaStatus === "EXPIRED"
                                    ? "text-red-600 border-red-500 bg-red-50"
                                    : isDarkMode
                                      ? "border-gray-600 bg-gray-700 text-white"
                                      : "border-gray-300 bg-gray-100 text-gray-900"
                              }`}
                            >
                              {creditNote.rmaStatus}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Approval Workflow Display */}
                    {creditNote.totalCredit > creditNote.approvalThresholdAmount && (
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <div
                          className={`p-3 rounded-lg ${
                            isDarkMode
                              ? "bg-yellow-900/20 border border-yellow-700"
                              : "bg-yellow-50 border border-yellow-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <span className={`font-medium ${isDarkMode ? "text-yellow-400" : "text-yellow-800"}`}>
                              Approval Required
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>
                            Credit amount {formatCurrency(creditNote.totalCredit)} exceeds approval threshold of{" "}
                            {formatCurrency(creditNote.approvalThresholdAmount)}. Manager approval is required before
                            processing.
                          </p>
                          {creditNote.approverName && (
                            <p className={`text-xs mt-2 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                              Approved by: {creditNote.approverName} on{" "}
                              {creditNote.approvalTimestamp
                                ? new Date(creditNote.approvalTimestamp).toLocaleString()
                                : "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settlement Method - Show for ACCOUNTING_ONLY with manual amount during draft/issued, OR for refunded/completed */}
              {((creditNote.creditNoteType === "ACCOUNTING_ONLY" &&
                creditNote.manualCreditAmount > 0 &&
                ["draft", "issued"].includes(creditNote.status)) ||
                ["refunded", "completed"].includes(creditNote.status)) && (
                <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                  <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Settlement Method
                    {creditNote.manualCreditAmount > 0 && <span className="text-red-500 ml-1">*</span>}
                  </h2>
                  <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Specify how this credit will be applied or refunded to the customer.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="settlement-method"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Settlement Method {creditNote.manualCreditAmount > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <Select
                        value={creditNote.refundMethod || "none"}
                        onValueChange={(value) => {
                          const newValue = value === "none" ? "" : value;
                          setCreditNote((prev) => ({
                            ...prev,
                            refundMethod: newValue,
                          }));
                          if (newValue) {
                            setInvalidFields((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete("refundMethod");
                              return newSet;
                            });
                          }
                        }}
                      >
                        <SelectTrigger
                          id="settlement-method"
                          onBlur={() => handleFieldBlur("refundMethod")}
                          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                            invalidFields.has("refundMethod")
                              ? "border-red-500 ring-1 ring-red-500"
                              : isDarkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <SelectValue placeholder="Select settlement method..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select settlement method...</SelectItem>
                          {REFUND_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Credit Adjustment: Apply to customer account • Offset: Apply to specific invoice •
                        Bank/Cheque/Cash: Direct refund
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="settlement-date"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Settlement Date
                      </label>
                      <input
                        id="settlement-date"
                        type="date"
                        value={creditNote.refundDate}
                        onChange={(e) =>
                          setCreditNote((prev) => ({
                            ...prev,
                            refundDate: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="settlement-reference"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Reference / Transaction ID
                        {creditNote.refundMethod && METHODS_REQUIRING_REFERENCE.includes(creditNote.refundMethod) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        id="settlement-reference"
                        type="text"
                        value={creditNote.refundReference}
                        onChange={(e) => {
                          setCreditNote((prev) => ({
                            ...prev,
                            refundReference: e.target.value,
                          }));
                          if (e.target.value) {
                            setInvalidFields((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete("refundReference");
                              return newSet;
                            });
                          }
                        }}
                        onBlur={() => handleFieldBlur("refundReference")}
                        placeholder={
                          creditNote.refundMethod === "bank_transfer"
                            ? "Bank transaction ID"
                            : creditNote.refundMethod === "cheque"
                              ? "Cheque number"
                              : creditNote.refundMethod === "credit_card"
                                ? "Card transaction ID"
                                : creditNote.refundMethod === "offset_invoice"
                                  ? "Invoice number to offset"
                                  : "Reference number (optional)"
                        }
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          invalidFields.has("refundReference")
                            ? "border-red-500 ring-1 ring-red-500"
                            : isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                              : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QC Information - shown for RETURN_WITH_QC type after inspection */}
              {creditNote.creditNoteType === "RETURN_WITH_QC" &&
                ["items_inspected", "applied", "refunded", "completed"].includes(creditNote.status) && (
                  <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      QC Inspection Results
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label
                            htmlFor="qc-result"
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            QC Result
                          </label>
                          <div
                            id="qc-result"
                            className={`px-4 py-2 rounded-lg border ${
                              isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"
                            }`}
                          >
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                creditNote.qcResult === "GOOD"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : creditNote.qcResult === "BAD"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              }`}
                            >
                              {creditNote.qcResult || "Pending"}
                            </span>
                          </div>
                        </div>
                        {creditNote.qcInspectedAt && (
                          <div className="flex-1">
                            <label
                              htmlFor="qc-inspected-at"
                              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Inspected At
                            </label>
                            <div
                              id="qc-inspected-at"
                              className={`px-4 py-2 rounded-lg border text-sm ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-gray-300"
                                  : "border-gray-300 bg-gray-50 text-gray-600"
                              }`}
                            >
                              {new Date(creditNote.qcInspectedAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                      {creditNote.qcNotes && (
                        <div>
                          <label
                            htmlFor="qc-notes"
                            className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            QC Notes
                          </label>
                          <div
                            id="qc-notes"
                            className={`px-4 py-3 rounded-lg border text-sm ${
                              isDarkMode
                                ? "border-gray-600 bg-gray-700 text-gray-300"
                                : "border-gray-300 bg-gray-50 text-gray-600"
                            }`}
                          >
                            {creditNote.qcNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Quick Actions - Only show for physical returns */}
              {showLogisticsSection && (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setLogisticsDrawerOpen(true)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      } ${invalidFields.has("expectedReturnDate") ? "ring-2 ring-red-500" : ""}`}
                    >
                      <Truck className="h-4 w-4" />
                      <span className="flex-1">Return Logistics</span>
                      {(creditNote.expectedReturnDate ||
                        creditNote.returnShippingCost > 0 ||
                        creditNote.restockingFee > 0) && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? "bg-teal-900/30 text-teal-400" : "bg-teal-100 text-teal-700"}`}
                        >
                          Set
                        </span>
                      )}
                      {invalidFields.has("expectedReturnDate") && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </button>
                  </div>
                  {invalidFields.has("expectedReturnDate") && (
                    <p className="mt-2 text-xs text-red-500">Expected return date is required</p>
                  )}
                </div>
              )}

              {/* Manual Credit Amount - Only show for ACCOUNTING_ONLY when no items selected */}
              {!isPhysicalReturn && (
                <div
                  className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm ${
                    invalidFields.has("manualCreditAmount") ? "ring-2 ring-red-500" : ""
                  }`}
                >
                  <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Manual Credit Amount
                  </h2>
                  <p className={`mb-4 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Enter a credit amount directly if not selecting specific items.{" "}
                    {!hasSelectedItems && <span className="text-red-500 font-bold">*</span>}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="manual-credit-amount"
                        className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Credit Amount (AED) {!hasSelectedItems && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <input
                        id="manual-credit-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={creditNote.manualCreditAmount}
                        onChange={(e) => {
                          setCreditNote((prev) => ({
                            ...prev,
                            manualCreditAmount: parseFloat(e.target.value) || 0,
                          }));
                          // Clear error when amount is entered
                          if (parseFloat(e.target.value) > 0) {
                            setInvalidFields((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete("manualCreditAmount");
                              return newSet;
                            });
                          }
                        }}
                        onBlur={() => handleFieldBlur("manualCreditAmount")}
                        placeholder="0.00"
                        data-testid="manual-credit-amount"
                        aria-required={!hasSelectedItems}
                        aria-invalid={shouldShowError("manualCreditAmount")}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          shouldShowError("manualCreditAmount") || invalidFields.has("manualCreditAmount")
                            ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500"
                            : isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:ring-teal-500 focus:border-teal-500"
                              : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500"
                        } focus:outline-none focus:ring-2`}
                      />
                      {(shouldShowError("manualCreditAmount") || invalidFields.has("manualCreditAmount")) && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {fieldErrors.manualCreditAmount}
                        </p>
                      )}
                      <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Use this for goodwill credits, pricing adjustments, or other financial-only credits
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Summary */}
              {(creditNote.items.some((item) => item.selected) || creditNote.manualCreditAmount > 0) && (
                <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                  <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Credit Summary
                  </h2>
                  <div className="space-y-3">
                    {/* Items credit (if any) */}
                    {creditNote.items.some((item) => item.selected) && (
                      <>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Items Subtotal:</span>
                          <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(creditNote.subtotal)}
                          </span>
                        </div>
                        {/* Discount allocation (if invoice had discount) */}
                        {creditNote.discountAmount > 0 && (
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                              Discount Allocation
                              {creditNote.invoiceDiscountType === "percentage" &&
                                ` (${creditNote.invoiceDiscountValue}%)`}
                              :
                            </span>
                            <span className={`font-medium text-red-500`}>
                              -{formatCurrency(creditNote.discountAmount)}
                            </span>
                          </div>
                        )}
                        {/* Net Taxable (if discount was applied) */}
                        {creditNote.discountAmount > 0 && (
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Net Taxable:</span>
                            <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {formatCurrency(creditNote.subtotal - creditNote.discountAmount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>VAT (5%):</span>
                          <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(creditNote.vatAmount)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Manual credit amount (if any) */}
                    {creditNote.manualCreditAmount > 0 && (
                      <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Manual Credit:</span>
                        <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {formatCurrency(creditNote.manualCreditAmount)}
                        </span>
                      </div>
                    )}

                    {/* Total Credit */}
                    <div
                      className={`flex justify-between pt-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Total Credit:
                      </span>
                      <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {formatCurrency(creditNote.totalCredit + creditNote.manualCreditAmount)}
                      </span>
                    </div>

                    {/* Deductions - only for physical returns */}
                    {isPhysicalReturn && (creditNote.restockingFee > 0 || creditNote.returnShippingCost > 0) && (
                      <>
                        <div className={`pt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>
                          <div className="font-medium mb-2">Deductions:</div>
                          {creditNote.restockingFee > 0 && (
                            <div className="flex justify-between ml-2">
                              <span>Restocking Fee:</span>
                              <span className="text-red-600">-{formatCurrency(creditNote.restockingFee)}</span>
                            </div>
                          )}
                          {creditNote.returnShippingCost > 0 && (
                            <div className="flex justify-between ml-2">
                              <span>Return Shipping:</span>
                              <span className="text-red-600">-{formatCurrency(creditNote.returnShippingCost)}</span>
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex justify-between pt-3 border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                        >
                          <span className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Net Refund:
                          </span>
                          <span className="text-lg font-bold text-teal-600">
                            {formatCurrency(
                              creditNote.totalCredit +
                                creditNote.manualCreditAmount -
                                creditNote.restockingFee -
                                creditNote.returnShippingCost
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Net Refund without deductions */}
                    {!(isPhysicalReturn && (creditNote.restockingFee > 0 || creditNote.returnShippingCost > 0)) && (
                      <div
                        className={`flex justify-between pt-3 border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                      >
                        <span className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Net Refund:
                        </span>
                        <span className="text-lg font-bold text-teal-600">
                          {formatCurrency(creditNote.totalCredit + creditNote.manualCreditAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Logistics Drawer */}
      <Drawer
        isOpen={logisticsDrawerOpen}
        onClose={() => setLogisticsDrawerOpen(false)}
        title="Return Logistics"
        description="Manage shipping and return details for physical returns"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="drawer-expected-return-date"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Expected Return Date <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id="drawer-expected-return-date"
              type="date"
              value={creditNote.expectedReturnDate}
              onChange={(e) => {
                setCreditNote((prev) => ({
                  ...prev,
                  expectedReturnDate: e.target.value,
                }));
                if (e.target.value) {
                  setInvalidFields((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete("expectedReturnDate");
                    return newSet;
                  });
                }
              }}
              disabled={!isEditable}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                invalidFields.has("expectedReturnDate")
                  ? "border-red-500 ring-1 ring-red-500"
                  : isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500"
                    : "border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500"
              } focus:outline-none focus:ring-2`}
            />
            {invalidFields.has("expectedReturnDate") && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle size={14} />
                Expected return date is required for physical returns
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="drawer-return-shipping-cost"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Return Shipping Cost (AED)
            </label>
            <input
              id="drawer-return-shipping-cost"
              type="number"
              min="0"
              step="0.01"
              value={creditNote.returnShippingCost}
              onChange={(e) =>
                setCreditNote((prev) => ({
                  ...prev,
                  returnShippingCost: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={!isEditable}
              placeholder="0.00"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>
          <div>
            <label
              htmlFor="drawer-restocking-fee"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Restocking Fee (AED)
            </label>
            <input
              id="drawer-restocking-fee"
              type="number"
              min="0"
              step="0.01"
              value={creditNote.restockingFee}
              onChange={(e) =>
                setCreditNote((prev) => ({
                  ...prev,
                  restockingFee: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={!isEditable}
              placeholder="0.00"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
            <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Fee charged for processing the return
            </p>
          </div>
        </div>

        {/* Drawer footer */}
        <div
          className="sticky bottom-0 pt-4 mt-6 border-t"
          style={{
            borderColor: isDarkMode ? COLORS.border : "#e5e7eb",
            background: isDarkMode
              ? `linear-gradient(to top, ${COLORS.card}, ${COLORS.card}ee)`
              : "linear-gradient(to top, white, rgba(255,255,255,0.95))",
          }}
        >
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLogisticsDrawerOpen(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </Drawer>

      {/* Credit Note Preview Modal */}
      {showPreview && (
        <CreditNotePreview creditNote={creditNote} company={company} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

// Add DraftConflictModal at component level
CreditNoteForm.DraftConflictModal = DraftConflictModal;

export default CreditNoteForm;
