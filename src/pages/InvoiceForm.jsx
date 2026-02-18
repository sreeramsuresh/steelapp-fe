import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  BookOpen,
  CheckCircle,
  DollarSign,
  Download,
  Eye,
  FileText,
  List,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import ConfirmDialog from "../components/ConfirmDialog";
import invoiceCorrectionConfig from "../components/finance/invoiceCorrectionConfig";
import InvoicePreview from "../components/InvoicePreview";
import AddProductDrawer from "../components/invoice/AddProductDrawer";
import ChargesDrawer from "../components/invoice/ChargesDrawer";
import FormSettingsPanel from "../components/invoice/FormSettingsPanel";
import Alert from "../components/invoice/InvoiceAlert";
import Autocomplete from "../components/invoice/InvoiceAutocomplete";
import Button from "../components/invoice/InvoiceButton";
import Card from "../components/invoice/InvoiceCard";
import Input from "../components/invoice/InvoiceInput";
import Textarea from "../components/invoice/InvoiceTextarea";
import InvoiceValidationPanel from "../components/invoice/InvoiceValidationPanel";
import { CARD_CLASSES, DIVIDER_CLASSES, INVOICE_ROUTES, QUICK_LINK_CLASSES } from "../components/invoice/invoiceStyles";
import LoadingSpinner from "../components/invoice/LoadingSpinner";
import NotesDrawer from "../components/invoice/NotesDrawer";
import VatHelpIcon from "../components/invoice/VatHelpIcon";
import LoadingOverlay from "../components/LoadingOverlay";
import { CorrectionHelpModal, DocumentHistoryPanel } from "../components/posted-document-framework";
import FormErrorBoundaryWithTheme from "../components/quotations/FormErrorBoundary";
import { useTheme } from "../contexts/ThemeContext";
import { useApi, useApiData } from "../hooks/useApi";
// AutoSave removed - was causing status bug on new invoices
import useInvoiceTemplates from "../hooks/useInvoiceTemplates";
import useKeyboardShortcuts, { getShortcutDisplayString, INVOICE_SHORTCUTS } from "../hooks/useKeyboardShortcuts";
import { invoicesAPI } from "../services/api";
import { authService } from "../services/axiosAuthService";
import { batchReservationService } from "../services/batchReservationService";
import { commissionService } from "../services/commissionService";
import { companyService } from "../services/companyService";
import { customerService } from "../services/customerService";
import { invoiceService } from "../services/invoiceService";
import { notificationService } from "../services/notificationService";
import pricelistService from "../services/pricelistService";
import { productService } from "../services/productService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { supplierService } from "../services/supplierService";
import { createInvoice, createSteelItem, UAE_EMIRATES } from "../types";
import {
  calculateDiscountedTRN,
  calculateSubtotal,
  calculateTotal,
  formatCurrency,
  formatDateDMY,
  formatDateForInput,
  normalizeLLC,
  titleCase,
} from "../utils/invoiceUtils";
import { PAYMENT_MODES } from "../utils/paymentUtils";
import { getDefaultBasis } from "../utils/pricingBasisRules";
import { toUAEDateForInput } from "../utils/timezone";

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get("duplicateFrom");
  const { isDarkMode } = useTheme();

  // Permission guard: can user create or edit invoices?
  const canWrite = id
    ? authService.hasPermission("invoices", "update")
    : authService.hasPermission("invoices", "create");

  // Field refs for scroll-to-field functionality (Option C Hybrid UX)
  const customerRef = useRef(null);
  const dateRef = useRef(null);
  const dueDateRef = useRef(null);
  const itemsRef = useRef(null);

  // Additional refs for auto-focus navigation through mandatory fields
  const paymentModeRef = useRef(null);
  const addItemButtonRef = useRef(null);
  const saveButtonRef = useRef(null);

  // Scroll to field function - maps error field names to refs
  const scrollToField = useCallback((fieldName) => {
    let targetRef = null;
    let targetElement = null;

    // Map field names to refs
    if (fieldName === "customer.name" || fieldName === "customer") {
      targetRef = customerRef;
    } else if (fieldName === "date") {
      targetRef = dateRef;
    } else if (fieldName === "dueDate") {
      targetRef = dueDateRef;
    } else if (fieldName.startsWith("item.")) {
      // Extract item index: 'item.0.rate' -> 0
      const match = fieldName.match(/item\.(\d+)\./);
      if (match) {
        const itemIndex = parseInt(match[1], 10);
        // Try to find the line item element by index
        targetElement = document.querySelector(`[data-item-index="${itemIndex}"]`);
      }
      if (!targetElement) {
        targetRef = itemsRef; // Fallback to items section
      }
    }

    // Scroll to the target
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the element briefly
      targetElement.classList.add("ring-2", "ring-red-500", "ring-offset-2");
      setTimeout(() => {
        targetElement.classList.remove("ring-2", "ring-red-500", "ring-offset-2");
      }, 2000);
    } else if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the element briefly
      targetRef.current.classList.add("ring-2", "ring-red-500", "ring-offset-2");
      setTimeout(() => {
        targetRef.current.classList.remove("ring-2", "ring-red-500", "ring-offset-2");
      }, 2000);
    }

    // Clear validation errors after scrolling (user is addressing them)
    // Don't clear - let user fix and re-save
  }, []);

  const [showPreview, setShowPreview] = useState(false);
  const [_isFormValidForSave, setIsFormValidForSave] = useState(true);
  const [_isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [_pdfButtonHighlight, setPdfButtonHighlight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Removed unused state: selectedProductForRow, setSelectedProductForRow
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [tradeLicenseStatus, setTradeLicenseStatus] = useState(null);
  const [showTradeLicenseAlert, setShowTradeLicenseAlert] = useState(false);

  // Save confirmation for Final Tax Invoice (new invoices only)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  // Success modal after creating invoice
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Phase 4: Auto drop-ship and partial allocation suggestion modals
  // Removed popup modals - replaced with inline SourceTypeSelector dropdown

  // Form preferences state (with localStorage persistence)
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [showCorrectionGuide, setShowCorrectionGuide] = useState(false);
  const [showFreightCharges, setShowFreightCharges] = useState(false);

  // Phase 1.1 UX Refactoring: Drawer states for secondary content
  const [showChargesDrawer, setShowChargesDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [showAddProductDrawer, setShowAddProductDrawer] = useState(false);

  // Confirmation dialogs
  const [issueConfirm, setIssueConfirm] = useState({ open: false });
  const [validationModal, setValidationModal] = useState({
    open: false,
    criticalIssues: [],
    warnings: [],
  });
  const [deleteLineItemConfirm, setDeleteLineItemConfirm] = useState({
    open: false,
    itemId: null,
    itemName: null,
    tempId: null,
  });

  // Dropship PO creation state
  const [dropshipPOModal, setDropshipPOModal] = useState({ open: false, itemIndex: null });
  const [dropshipSuppliers, setDropshipSuppliers] = useState([]);
  const [dropshipSelectedSupplier, setDropshipSelectedSupplier] = useState(null);
  const [creatingDropshipPO, setCreatingDropshipPO] = useState(false);

  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem("invoiceFormPreferences");
    return saved
      ? JSON.parse(saved)
      : {
          showValidationHighlighting: true,
        };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("invoiceFormPreferences", JSON.stringify(formPreferences));
  }, [formPreferences]);

  // ============================================================
  // PHASE 1 UI IMPROVEMENTS: Keyboard Shortcuts & Auto-Save
  // ============================================================

  // Draft recovery removed - autosave was causing status bug

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Real-time field validation states (null = untouched, 'valid' = valid, 'invalid' = invalid)
  const [fieldValidation, setFieldValidation] = useState({});

  // Helper to enforce invoice number prefix by status
  const withStatusPrefix = (num, status) => {
    const desired = status === "draft" ? "DFT" : status === "proforma" ? "PFM" : "INV";

    if (!num || typeof num !== "string") {
      // Generate the base number format YYYYMM-NNNN from backend API
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      return `${desired}-${year}${month}-0001`;
    }

    // Handle numbers that already have the correct format: PREFIX-YYYYMM-NNNN
    const formatMatch = num.match(/^(DFT|PFM|INV)-(\d{6}-\d{4})$/);
    if (formatMatch) {
      // Replace the prefix but keep the YYYYMM-NNNN part
      return `${desired}-${formatMatch[2]}`;
    }

    // Handle legacy format or partial numbers - try to extract meaningful parts
    const parts = num.split("-");
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
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
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
  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    // Invoice number will be auto-generated by the database on save
    newInvoice.invoiceNumber = "(Auto-assigned on save)";
    // Default status to 'draft'
    newInvoice.status = "draft";
    // Start with one empty item row
    newInvoice.items = [createSteelItem()];
    return newInvoice;
  });

  // Validate individual field in real-time
  const validateField = useCallback(
    (fieldName, value) => {
      let isValid = false;

      switch (fieldName) {
        case "customer":
          isValid = value?.id && value.name;
          break;
        case "dueDate":
          isValid = value && value.trim() !== "";
          break;
        case "status":
          isValid = value && ["draft", "proforma", "issued"].includes(value);
          break;
        case "paymentMode":
          isValid = value && value.trim() !== "";
          break;
        case "warehouse": {
          // Warehouse is optional for drafts, required for issued/proforma
          const invoiceStatus = invoice?.status || "draft";
          if (invoiceStatus === "draft") {
            isValid = true; // Optional for drafts
          } else {
            isValid = value && String(value).trim() !== "";
          }
          break;
        }
        case "currency":
          isValid = value && value.trim() !== "";
          break;
        case "placeOfSupply":
          isValid = value && value.trim() !== "";
          break;
        case "supplyDate":
          isValid = value && value.trim() !== "";
          break;
        case "items":
          isValid =
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((item) => item.name && item.quantity > 0 && item.rate > 0);
          break;
        default:
          isValid = true;
      }

      setFieldValidation((prev) => ({
        ...prev,
        [fieldName]: isValid ? "valid" : "invalid",
      }));

      return isValid;
    },
    [invoice?.status]
  );

  // Track if form has unsaved changes (for navigation warning)
  const [formDirty, setFormDirty] = useState(false);
  // Removed unused states: showExitConfirmModal, setShowExitConfirmModal, pendingNavigation, setPendingNavigation

  // Track the ORIGINAL saved status for isLocked calculation
  // This prevents the locked banner from showing when just changing the dropdown
  const [originalSavedStatus, setOriginalSavedStatus] = useState(null);

  // Phase 4: Store saved batch consumptions separately from draft allocations
  // This prevents overwriting user edits when loading existing invoice data
  const [savedConsumptionsByItemId, setSavedConsumptionsByItemId] = useState({});
  const [_consumptionsFetched, setConsumptionsFetched] = useState(false);

  // Mark form as dirty when user makes meaningful changes (not during initial load/hydration)
  // formDirty is set explicitly by user actions: adding items (line ~3089), deleting items (line ~3130),
  // and via handleFieldChange below. This avoids false positives from state initialization.
  const initialLoadDoneRef = useRef(false);
  useEffect(() => {
    // Allow 2 renders for initial hydration (data fetch + state setup)
    const timer = setTimeout(() => {
      initialLoadDoneRef.current = true;
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Reset dirty flag when invoice is saved successfully
  useEffect(() => {
    if (createdInvoiceId) {
      setFormDirty(false);
    }
  }, [createdInvoiceId]);

  // Warn before browser close/refresh if there are unsaved changes
  // Only warn if the form has actual content (customer selected or items added)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasCustomer = !!invoice?.customer?.id;
      const hasItems = invoice?.items?.some((item) => item.name || item.productId);
      if (formDirty && (hasCustomer || hasItems)) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formDirty, invoice?.customer?.id, invoice?.items]);

  // Keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        // Allow Ctrl+S even in inputs
        if (!(e.ctrlKey && e.key === "s")) return;
      }

      // Ctrl+S / Cmd+S: Save invoice
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveButtonRef.current?.click();
      }
      // Ctrl+Shift+A / Cmd+Shift+A: Add item
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        addItemButtonRef.current?.click();
      }
      // Escape: Close drawers (handled by drawer components) or go back
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // UAE VAT COMPLIANCE: Check if invoice is locked
  // Issued invoices can be edited within 24 hours of issuance (creates revision)
  // After 24 hours, invoice is permanently locked
  // IMPORTANT: New invoices (no id) are NEVER locked, even if status is 'issued'
  // IMPORTANT: Use originalSavedStatus (not current form status) to prevent
  //            the locked banner from showing when user changes status dropdown
  const isLocked = useMemo(() => {
    // NEW INVOICES ARE NEVER LOCKED - they haven't been saved yet
    // The 'id' parameter from useParams() is only present when editing an existing invoice
    if (!id) return false;

    // Use the ORIGINAL saved status, not the current form state
    // This prevents locked banner from appearing when converting draft to final
    // The banner should only show for invoices that were ALREADY saved as 'issued'
    if (originalSavedStatus !== "issued") return false;

    // Check 24-hour edit window
    const issuedAt = invoice?.issuedAt;
    if (!issuedAt) {
      // No issuedAt means this is a legacy invoice that was issued before edit window feature
      // These are considered locked (cannot edit without credit note)
      return true;
    }

    const issuedDate = new Date(issuedAt);
    const now = new Date();
    const hoursSinceIssued = (now - issuedDate) / (1000 * 60 * 60);

    return hoursSinceIssued >= 24; // Locked if 24+ hours since issued
  }, [id, originalSavedStatus, invoice?.issuedAt]);

  // Calculate if we're in revision mode (editing issued invoice within 24h)
  // Use originalSavedStatus to ensure this only applies to invoices that were
  // ALREADY saved as 'issued', not invoices being converted to 'issued'
  const isRevisionMode = useMemo(() => {
    // Must be editing an existing invoice
    if (!id) return false;

    // Use original saved status - only in revision mode if invoice was SAVED as issued
    if (originalSavedStatus !== "issued") return false;

    const issuedAt = invoice?.issuedAt;
    if (!issuedAt) return false;

    const issuedDate = new Date(issuedAt);
    const now = new Date();
    const hoursSinceIssued = (now - issuedDate) / (1000 * 60 * 60);

    return hoursSinceIssued < 24; // In revision mode if within 24 hours
  }, [id, originalSavedStatus, invoice?.issuedAt]);

  // Calculate hours remaining in edit window
  const hoursRemainingInEditWindow = useMemo(() => {
    if (!isRevisionMode || !invoice?.issuedAt) return 0;

    const issuedDate = new Date(invoice.issuedAt);
    const now = new Date();
    const hoursSinceIssued = (now - issuedDate) / (1000 * 60 * 60);

    return Math.max(0, Math.ceil(24 - hoursSinceIssued));
  }, [isRevisionMode, invoice?.issuedAt]);

  // Auto-focus to next mandatory field
  const focusNextMandatoryField = useCallback(() => {
    // Check mandatory fields in order and focus the first unfilled one
    // 1. Customer (mandatory)
    if (!invoice.customer?.id) {
      customerRef.current?.querySelector("input")?.focus();
      return;
    }

    // 2. Payment Mode (mandatory)
    if (!invoice.modeOfPayment) {
      paymentModeRef.current?.focus();
      return;
    }

    // 3. At least one item with valid product, quantity, and rate (mandatory)
    const hasValidItem = invoice.items?.some((item) => item.productId && item.quantity > 0 && item.rate > 0);
    if (!hasValidItem) {
      // Focus Add Item button if no items, or focus the items section
      addItemButtonRef.current?.focus();
      addItemButtonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    // All mandatory fields filled - focus Save button
    saveButtonRef.current?.focus();
    saveButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [invoice.customer?.id, invoice.modeOfPayment, invoice.items]);

  // No extra payment terms fields; Due Date remains directly editable

  // Check if any line items require warehouse (sourceType === 'WAREHOUSE')
  const needsWarehouseSelector = useMemo(() => {
    // Show warehouse selector if no items exist (new invoice) or if any item uses warehouse stock
    if (!invoice.items || invoice.items.length === 0) {
      return true;
    }
    return invoice.items.some((item) => !item.sourceType || item.sourceType === "WAREHOUSE");
  }, [invoice.items]);

  // Memoize API functions to maintain stable identity across renders
  // This ensures refetch functions from useApiData are stable and don't cause infinite loops in useEffect
  const getCompanyFn = useCallback(() => companyService.getCompany(), []);
  const getProductsFn = useCallback(() => productService.getProducts({ limit: 1000 }), []);
  const getCustomersFn = useCallback(() => customerService.getCustomers({ status: "active", limit: 1000 }), []);
  const getAgentsFn = useCallback(() => commissionService.getAgents(), []);
  const getNextInvoiceNumberFn = useCallback(() => invoiceService.getNextInvoiceNumber(), []);
  const getExistingInvoiceFn = useCallback(() => (id ? invoiceService.getInvoice(id) : null), [id]);
  const { data: company, loading: loadingCompany, refetch: refetchCompany } = useApiData(getCompanyFn, [], true);
  const { execute: saveInvoice, loading: savingInvoice } = useApi(invoiceService.createInvoice);
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(invoiceService.updateInvoice);
  const { data: existingInvoice, loading: loadingInvoice } = useApiData(getExistingInvoiceFn, [id], {
    immediate: !!id,
    skipInitialLoading: !id,
  });
  const { data: _nextInvoiceData, refetch: refetchNextInvoice } = useApiData(getNextInvoiceNumberFn, [], !id);
  const { data: customersData, loading: loadingCustomers } = useApiData(getCustomersFn, []);
  const { data: salesAgentsData, loading: loadingAgents } = useApiData(getAgentsFn, []);
  const { loading: loadingProducts, refetch: refetchProducts } = useApiData(getProductsFn, []);
  const { execute: _createProduct, loading: _creatingProduct } = useApi(productService.createProduct);

  // Pricelist state
  const [selectedPricelistId, setSelectedPricelistId] = useState(null);
  const [pricelistName, setPricelistName] = useState(null);

  // ============================================================
  // AUTO-SAVE REMOVED - Was causing status bug on new invoices
  // ============================================================

  // ============================================================
  // PHASE 2-5 UI IMPROVEMENTS
  // ============================================================

  // Invoice templates - read from company settings (edit in Company Settings page)
  const { currentTemplate } = useInvoiceTemplates("standard", company);

  // Refetch products when form loads to ensure fresh data (updated names, latest sales data)
  useEffect(() => {
    refetchProducts();
  }, [refetchProducts]);

  // Also refetch when window regains focus (user returns from product management)
  useEffect(() => {
    const handleFocus = () => {
      refetchProducts();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchProducts]);

  // Refetch company data when window regains focus (user returns from company settings)
  useEffect(() => {
    const handleFocus = () => {
      refetchCompany();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchCompany]);

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
        const res = await (await import("../services/api")).apiClient.get("/warehouses");
        const list = res?.warehouses || res?.data?.warehouses || [];
        const active = list.filter((w) => w.isActive !== false);
        setWarehouses(active);

        // Set default warehouse for new invoices (uses isDefault flag)
        if (!id && active.length > 0 && !invoice.warehouseId) {
          const defaultWarehouse = active.find((w) => w.isDefault) || active[0];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, invoice.warehouseId]); // Mount-only: Load warehouses once when component mounts or id changes

  // Heavily optimized calculations with minimal dependencies
  const computedSubtotal = useMemo(() => calculateSubtotal(invoice.items), [invoice.items]);
  const computedVatAmount = useMemo(() => {
    return calculateDiscountedTRN(
      invoice.items,
      invoice.discountType,
      invoice.discountPercentage,
      invoice.discountAmount
    );
  }, [invoice.items, invoice.discountType, invoice.discountPercentage, invoice.discountAmount]);

  const computedDiscountAmount = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;

    if (invoice.discountType === "percentage") {
      return (computedSubtotal * discountPercentage) / 100;
    } else {
      return discountAmount;
    }
  }, [computedSubtotal, invoice.discountAmount, invoice.discountPercentage, invoice.discountType]);

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
  }, [computedSubtotal, computedVatAmount, invoice.discountAmount, invoice.discountPercentage, invoice.discountType]);

  // No longer needed - invoice numbers are generated by database on save
  // useEffect(() => {
  //   if (nextInvoiceData && nextInvoiceData.nextInvoiceNumber && !id) {
  //     setInvoice((prev) => ({
  //       ...prev,
  //       invoiceNumber: withStatusPrefix(
  //         nextInvoiceData.nextInvoiceNumber,
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
          `This invoice has been deleted and cannot be edited. Reason: ${existingInvoice.deletionReason || "No reason provided"}`
        );
        navigate("/app/invoices");
        return;
      }
      // Auto-populate date to today if empty (common in Odoo/Zoho)
      const invoiceWithDate = {
        ...existingInvoice,
        date: existingInvoice.date
          ? formatDateForInput(new Date(existingInvoice.date))
          : formatDateForInput(new Date()),
      };
      setInvoice(invoiceWithDate);

      // Capture the original saved status for isLocked calculation
      // This prevents the locked banner from showing when just changing the dropdown
      const savedStatus = (existingInvoice.status || "").toLowerCase().replace("status_", "");
      setOriginalSavedStatus(savedStatus);
    }
  }, [existingInvoice, id, navigate]);

  // Duplicate invoice: load source invoice and pre-populate as new draft
  useEffect(() => {
    if (!duplicateFromId || id) return; // Only for new invoices with duplicateFrom param
    const loadSourceInvoice = async () => {
      try {
        const source = await invoiceService.getInvoice(duplicateFromId);
        if (source) {
          setInvoice((prev) => ({
            ...prev,
            // Copy customer info
            customer: source.customer || prev.customer,
            // Copy items but clear IDs so they're treated as new
            items: (source.items || []).map((item) => ({
              ...item,
              id: undefined,
              lineItemTempId: `dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            })),
            // Copy financial fields
            currency: source.currency || prev.currency,
            notes: source.notes || "",
            terms: source.terms || "",
            placeOfSupply: source.placeOfSupply || "",
            isExport: source.isExport || false,
            // Reset status to draft for the duplicate
            status: "draft",
            // Set fresh dates
            date: formatDateForInput(new Date()),
          }));
          notificationService.success("Invoice duplicated - review and save as new");
        }
      } catch (err) {
        console.warn("Failed to load source invoice for duplication:", err);
        notificationService.error("Failed to duplicate invoice");
      }
    };
    loadSourceInvoice();
  }, [duplicateFromId, id]);

  // Phase 4: Fetch saved batch consumptions for existing invoices
  // This runs after existingInvoice is loaded and the invoice ID is known
  useEffect(() => {
    const fetchConsumptions = async () => {
      // Only fetch for existing invoices that have been finalized (issued/proforma)
      if (!id || !existingInvoice) return;

      const status = (existingInvoice.status || "").toLowerCase().replace("status_", "");
      // Only fetch consumptions for invoices that have been through finalization
      if (status !== "issued" && status !== "proforma") {
        setConsumptionsFetched(true);
        return;
      }

      try {
        const response = await batchReservationService.getInvoiceBatchConsumptions(parseInt(id, 10));
        if (response?.items) {
          // Map consumptions by invoice_item_id for easy lookup
          const byItemId = {};
          response.items.forEach((item) => {
            byItemId[item.invoiceItemId] = {
              consumptions: item.consumptions || [],
              totalQuantity: item.totalQuantity || "0",
              totalCogs: item.totalCogs || "0",
              isDropShip: item.isDropShip || false,
            };
          });
          setSavedConsumptionsByItemId(byItemId);
        }
        setConsumptionsFetched(true);
      } catch (err) {
        console.error("Failed to fetch batch consumptions:", err);
        // Don't block the form if consumption fetch fails
        setConsumptionsFetched(true);
      }
    };

    fetchConsumptions();
  }, [id, existingInvoice]);

  // Validate fields on load and when invoice changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Dependencies tracked for granular validation updates
  useEffect(() => {
    if (invoice) {
      validateField("customer", invoice.customer);
      validateField("dueDate", invoice.dueDate);
      validateField("status", invoice.status);
      validateField("paymentMode", invoice.modeOfPayment);
      validateField("warehouse", invoice.warehouseId);
      validateField("currency", invoice.currency);
      validateField("placeOfSupply", invoice.placeOfSupply);
      validateField("supplyDate", invoice.supplyDate);
      validateField("items", invoice.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    invoice.customer.id,
    invoice.dueDate,
    invoice.status,
    invoice.modeOfPayment,
    invoice.warehouseId,
    invoice.currency,
    invoice.items.length,
    validateField,
    invoice.placeOfSupply,
    invoice.supplyDate,
    invoice.items,
    invoice,
  ]);
  // Note: Using granular dependencies (invoice.customer.id, invoice.items.length, etc.) instead of entire invoice object to avoid unnecessary re-validations

  const checkTradeLicenseStatus = useCallback(async (customerId) => {
    try {
      // Use axios-based client to benefit from auth + baseURL
      const { apiClient } = await import("../services/api");
      const licenseStatus = await apiClient.get(`/customers/${customerId}/trade-license-status`);
      if (licenseStatus) {
        setTradeLicenseStatus(licenseStatus);
        // Show alert for expired or expiring licenses
        if (
          licenseStatus.hasLicense &&
          (licenseStatus.status === "expired" || licenseStatus.status === "expiring_soon")
        ) {
          setShowTradeLicenseAlert(true);
        } else {
          setShowTradeLicenseAlert(false);
        }
      }
    } catch (_error) {
      // Fall back to fetch with defensive parsing to capture server HTML errors
      try {
        const resp = await fetch(`/api/customers/${customerId}/trade-license-status`);
        const ct = resp.headers.get("content-type") || "";
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 200)}`);
        }
        if (!ct.includes("application/json")) {
          const txt = await resp.text();
          throw new SyntaxError(`Unexpected content-type: ${ct}. Body starts: ${txt.slice(0, 80)}`);
        }
        const licenseStatus = await resp.json();
        setTradeLicenseStatus(licenseStatus);
      } catch (_fallbackErr) {
        // Silently ignore - trade license check is optional feature, route may not exist
        // console.debug('Trade license check unavailable:', fallbackErr.message);
      }
    }
  }, []);

  const handleCustomerSelect = useCallback(
    async (customerId) => {
      const customers = customersData?.customers || [];
      const selectedCustomer = customers.find((c) => c.id === customerId);

      if (selectedCustomer) {
        setInvoice((prev) => ({
          ...prev,
          customer: {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email || "",
            phone: selectedCustomer.phone || "",
            // Use TRN number from customer data
            vatNumber: selectedCustomer.trnNumber || selectedCustomer.vatNumber || "",
            address: {
              street: selectedCustomer.address?.street || "",
              city: selectedCustomer.address?.city || "",
              emirate: selectedCustomer.address?.emirate || "",
              poBox: selectedCustomer.address?.poBox || "",
            },
          },
        }));

        // Auto-calculate due date from customer payment terms
        const paymentTermsDays = selectedCustomer.paymentTermsDays != null ? selectedCustomer.paymentTermsDays : 30;
        const invoiceDateStr = invoice.date || toUAEDateForInput(new Date());
        const invoiceDateMs = new Date(invoiceDateStr).getTime();
        const calculatedDueDate = toUAEDateForInput(new Date(invoiceDateMs + paymentTermsDays * 24 * 60 * 60 * 1000));

        setInvoice((prev) => ({
          ...prev,
          dueDate: calculatedDueDate,
          ...(selectedCustomer.defaultPaymentMethod ? { modeOfPayment: selectedCustomer.defaultPaymentMethod } : {}),
        }));

        // Fetch customer's pricelist
        if (selectedCustomer.pricelistId) {
          try {
            const response = await pricelistService.getById(selectedCustomer.pricelistId);
            setSelectedPricelistId(selectedCustomer.pricelistId);
            setPricelistName(response.data.name);
          } catch (_error) {
            // Silently ignore - pricelist is optional, may not be configured
            // console.debug('Pricelist fetch failed:', error.message);
            setSelectedPricelistId(null);
            setPricelistName(null);
          }
        } else {
          // Use default pricelist
          setSelectedPricelistId(null);
          setPricelistName("Default Price List");
        }

        // Check trade license status
        checkTradeLicenseStatus(customerId);

        // Validate customer field
        validateField("customer", {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
        });

        // Clear customer-related validation errors since user has now selected a customer
        setValidationErrors((prev) => prev.filter((err) => !err.toLowerCase().includes("customer")));
        setInvalidFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete("customer");
          newSet.delete("customer.name");
          return newSet;
        });

        // Auto-focus to next mandatory field after customer selection
        setTimeout(() => focusNextMandatoryField(), 100);
      }
    },
    [customersData, validateField, focusNextMandatoryField, checkTradeLicenseStatus, invoice.date]
  );

  const handleSalesAgentSelect = useCallback((agentId) => {
    setInvoice((prev) => ({
      ...prev,
      sales_agent_id: agentId && agentId !== "none" ? parseInt(agentId, 10) : null,
    }));
  }, []);

  // No automatic coupling; due date is independently editable by the user

  const removeItem = useCallback((index) => {
    setInvoice((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      // Always maintain at least one empty row
      if (newItems.length === 0) {
        newItems.push(createSteelItem());
      }
      return { ...prev, items: newItems };
    });
  }, []);

  // ============================================================
  // PHASE 3: AllocationDrawer Line Item Handlers
  // ============================================================

  /**
   * Handle adding a line item from the AllocationDrawer
   * This callback receives the full line item data including allocations
   */
  const handleAddLineItem = useCallback((lineItemData) => {
    // lineItemData structure from AllocationDrawer:
    // {
    //   lineItemTempId: 'uuid-v4-string',
    //   productId: 123,
    //   product: { ... full product object },
    //   name: 'SS-304-Sheet-2B-1220mm-1.5mm-2440mm',
    //   quantity: 500,
    //   unit: 'KG',
    //   rate: 75.00,
    //   amount: 37500.00,
    //   sourceType: 'WAREHOUSE',
    //   warehouseId: 1,
    //   allocations: [ ... batch allocations with reservation data ],
    //   reservationId: 456,
    //   expiresAt: '2024-12-14T11:30:00Z'
    // }

    setInvoice((prev) => {
      // Remove empty placeholder items (items without productId)
      const existingValidItems = prev.items.filter((item) => item.productId || item.name);

      // Create the new line item with all data from drawer
      const newItem = {
        id: uuidv4(),
        lineItemTempId: lineItemData.lineItemTempId,
        productId: lineItemData.productId,
        name: lineItemData.name,
        // Copy product details for display
        category: lineItemData.product?.category || "",
        commodity: lineItemData.product?.commodity || "",
        grade: lineItemData.product?.grade || "",
        finish: lineItemData.product?.finish || "",
        size: lineItemData.product?.size || "",
        thickness: lineItemData.product?.thickness || "",
        origin: lineItemData.product?.origin || "",
        // Quantity and pricing
        quantity: parseFloat(lineItemData.quantity),
        quantityUom: lineItemData.unit || "KG",
        rate: parseFloat(lineItemData.rate),
        pricingBasis:
          lineItemData.pricingBasis || lineItemData.basePricingBasis || getDefaultBasis(lineItemData.product?.category), // Use base pricing basis from drawer
        baseRate: lineItemData.baseRate, // CRITICAL: Persist immutable base price
        basePricingBasis: lineItemData.basePricingBasis, // CRITICAL: Persist immutable base basis
        amount: parseFloat(lineItemData.amount),
        // Stock source
        sourceType: lineItemData.sourceType,
        warehouseId: lineItemData.warehouseId,
        // CANONICAL allocation representation (single source of truth)
        allocations: lineItemData.allocations || [],
        allocationMode: lineItemData.allocationMode || "AUTO_FIFO",
        // Reservation tracking
        reservationId: lineItemData.reservationId,
        reservationExpiresAt: lineItemData.expiresAt,
        // Weight info (calculated)
        unitWeightKg: lineItemData.product?.unitWeightKg || 1,
        theoreticalWeightKg: parseFloat(lineItemData.quantity),
        // VAT (default 5% for standard supply)
        supplyType: "standard",
        vatRate: 5,
      };

      return {
        ...prev,
        items: [...existingValidItems, newItem],
      };
    });

    // Show success notification
    notificationService.success(`Added: ${lineItemData.name} (${lineItemData.quantity} ${lineItemData.unit})`);

    // Trigger recalculation of totals
    setFormDirty(true);
  }, []);

  /**
   * Handle deleting a line item that was added via the drawer
   * This also cancels any associated reservations
   */
  const handleDeleteLineItem = useCallback(
    async (lineItemTempId) => {
      // Find the item to get reservation info
      const itemToDelete = invoice.items.find((item) => item.lineItemTempId === lineItemTempId);

      if (!itemToDelete) {
        notificationService.error("Item not found");
        return;
      }

      // Cancel reservations for this line item if it has any
      if (itemToDelete.lineItemTempId && itemToDelete.sourceType === "WAREHOUSE") {
        try {
          await batchReservationService.cancelLineItemReservations({
            draftInvoiceId: invoice.id || 0,
            lineItemTempId: itemToDelete.lineItemTempId,
          });
        } catch (err) {
          console.warn("Failed to cancel reservation on delete:", err);
          // Continue with deletion even if reservation cancel fails
        }
      }

      // Remove the item from invoice
      setInvoice((prev) => {
        const newItems = prev.items.filter((item) => item.lineItemTempId !== lineItemTempId);
        // Always maintain at least one empty row if all items deleted
        if (newItems.length === 0) {
          newItems.push(createSteelItem());
        }
        return { ...prev, items: newItems };
      });

      notificationService.success("Line item deleted");
      setFormDirty(true);
    },
    [invoice.id, invoice.items]
  );

  /**
   * Get status icon for a line item based on its allocation state
   */
  const getLineItemStatusIcon = useCallback((item) => {
    // Drop-ship items show ship icon
    if (item.sourceType === "LOCAL_DROP_SHIP" || item.sourceType === "IMPORT_DROP_SHIP") {
      return {
        icon: "ship",
        title: "Drop-ship order",
        className: "text-blue-500",
      };
    }

    // Warehouse items - check allocation status
    if (!item.allocations || item.allocations.length === 0) {
      return {
        icon: "empty",
        title: "Not allocated",
        className: "text-gray-400",
      };
    }

    const allocatedQty = (item.allocations || []).reduce((sum, a) => sum + parseFloat(a.quantity || 0), 0);
    const requiredQty = parseFloat(item.quantity) || 0;

    if (Math.abs(allocatedQty - requiredQty) < 0.001) {
      return {
        icon: "check",
        title: "Fully allocated",
        className: "text-green-500",
      };
    }

    if (allocatedQty > 0 && allocatedQty < requiredQty) {
      return {
        icon: "partial",
        title: `Partially allocated (${allocatedQty.toFixed(2)}/${requiredQty.toFixed(2)})`,
        className: "text-amber-500",
      };
    }

    return {
      icon: "empty",
      title: "Not allocated",
      className: "text-gray-400",
    };
  }, []);

  // ============================================================
  // END PHASE 3: AllocationDrawer Line Item Handlers
  // ============================================================

  const handleSave = async () => {
    // Prevent double-click / rapid clicks at entry point
    if (isSaving) {
      return;
    }

    // For new invoices with Final Tax Invoice status, show confirmation first
    if (!id && invoice.status === "issued") {
      setShowSaveConfirmDialog(true);
      return;
    }

    // Otherwise proceed with save directly
    await performSave();
  };

  // Function to check if form has all required fields
  const validateRequiredFields = () => {
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information (both ID and name required)
    if (!invoice.customer?.id) {
      errors.push("Customer is required. Please select a customer from the dropdown.");
      invalidFieldsSet.add("customer.name");
    } else if (!invoice.customer?.name || invoice.customer.name.trim() === "") {
      errors.push("Customer name is required");
      invalidFieldsSet.add("customer.name");
    }

    // Check if there are any items (filter out empty placeholder items)
    // Placeholder items have no productId and no name - same logic as UI display
    const realItems = (invoice.items || []).filter((item) => item.productId || (item.name && item.name.trim() !== ""));

    if (realItems.length === 0) {
      errors.push("At least one item is required");
    } else {
      // Validate each real item
      realItems.forEach((item, index) => {
        if (!item.name || item.name.trim() === "") {
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
        // CRITICAL: Block save when unit weight is missing for weight-based pricing
        // This prevents incorrect pricing calculations (e.g., 30x overcharge)
        if (item.missingWeightWarning) {
          errors.push(
            `Item ${index + 1}: Unit weight is missing for "${item.name}". Unit weight is required for price calculation. Please contact admin to add unit weight to the product master.`
          );
          invalidFieldsSet.add(`item.${index}.unitWeight`);
        }
      });
    }

    // Check dates
    if (!invoice.date) {
      errors.push("Invoice date is required");
      invalidFieldsSet.add("date");
    }
    if (!invoice.dueDate) {
      errors.push("Due date is required");
      invalidFieldsSet.add("dueDate");
    }

    // Check status (required field)
    if (!invoice.status || !["draft", "proforma", "issued"].includes(invoice.status)) {
      errors.push("Invoice status is required");
      invalidFieldsSet.add("status");
    }

    return {
      isValid: errors.length === 0,
      errors,
      invalidFields: invalidFieldsSet,
    };
  };

  // UAE VAT COMPLIANCE: Issue Final Tax Invoice
  // This action is IRREVERSIBLE - invoice becomes a legal tax document
  const handleIssueInvoice = async () => {
    if (!invoice?.id) {
      notificationService.error("Please save the invoice first before issuing.");
      return;
    }

    if (isLocked) {
      notificationService.warning("This invoice has already been issued.");
      return;
    }

    // Validate allocation completeness for warehouse items
    const incompleteAllocations = [];
    (invoice.items || []).forEach((item, idx) => {
      if (item.sourceType === "WAREHOUSE") {
        const allocatedQty = (item.allocations || []).reduce((sum, a) => sum + parseFloat(a.quantity || 0), 0);
        const requiredQty = parseFloat(item.quantity) || 0;

        if (Math.abs(allocatedQty - requiredQty) > 0.001) {
          incompleteAllocations.push({
            index: idx + 1,
            name: item.name,
            required: requiredQty,
            allocated: allocatedQty,
          });
        }
      }
    });

    if (incompleteAllocations.length > 0) {
      const message = `Cannot issue invoice - incomplete allocations:\n\n${incompleteAllocations
        .map(
          (ia) =>
            `Line ${ia.index}: ${ia.name}\n  Required: ${ia.required.toFixed(3)}\n  Allocated: ${ia.allocated.toFixed(3)}`
        )
        .join("\n\n")}`;

      notificationService.error(message);
      return;
    }

    // Phase 13: Validate pricing before finalization
    try {
      setIsValidating(true);

      const response = await fetch("/api/invoices/validate-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          customer_id: invoice.customer?.id,
          line_items: (invoice.items || []).map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const validationResult = await response.json();

      // Show validation modal if there are issues or warnings
      if (!validationResult.valid || validationResult.warnings.length > 0) {
        setValidationModal({
          open: true,
          criticalIssues: validationResult.critical_issues || [],
          warnings: validationResult.warnings || [],
        });
        return;
      }

      // If no issues, show confirmation dialog
      setIssueConfirm({ open: true });
    } catch (error) {
      console.error("Pricing validation error:", error);
      notificationService.warning("Could not validate pricing. Proceeding with caution.");
      setIssueConfirm({ open: true });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidationProceed = async () => {
    // Close validation modal and show issue confirmation
    setValidationModal({ open: false, criticalIssues: [], warnings: [] });
    setIssueConfirm({ open: true });
  };

  const confirmIssueInvoice = async () => {
    try {
      setIsSaving(true);
      const issuedInvoice = await invoiceService.issueInvoice(invoice.id);

      // Update local state with the issued invoice
      setInvoice((prev) => ({
        ...prev,
        ...issuedInvoice,
        status: "issued",
      }));

      notificationService.success(
        "Invoice issued successfully as Final Tax Invoice. It is now locked and cannot be modified."
      );
    } catch (error) {
      console.error("Failed to issue invoice:", error);
      notificationService.error(`Failed to issue invoice: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteLineItem = () => {
    const { itemId, tempId } = deleteLineItemConfirm;
    if (tempId) {
      handleDeleteLineItem(tempId);
    } else {
      removeItem(invoice.items.findIndex((i) => i.id === itemId));
    }
  };

  // Handler for preview button - validates before opening preview
  const handlePreviewClick = async () => {
    if (!company) {
      notificationService.warning("Company data is still loading. Please wait...");
      return;
    }

    // Refetch company data to ensure latest template colors are used
    try {
      await refetchCompany();
    } catch (error) {
      console.warn("Failed to refresh company data:", error);
      // Continue with cached data rather than blocking preview
    }

    // Validate required fields silently (don&apos;t show errors, just set flag)
    const validation = validateRequiredFields();
    setIsFormValidForSave(validation.isValid);

    // Always open preview - save button will be disabled if invalid
    setShowPreview(true);
  };

  const performSave = async (statusOverride = null) => {
    // Prevent double-saves
    if (isSaving) {
      return;
    }

    // Use statusOverride if provided (for Final Tax Invoice confirmation flow)
    // This ensures the status is correct regardless of React state timing issues
    const effectiveStatus = statusOverride || invoice.status;

    // DEBUG: Log status at start of performSave

    // Filter out empty placeholder items before validation
    // Placeholder items have no productId and no name - same logic as UI display
    // Note: Can't rely on quantity/rate since defaults are quantity=1, rate=0
    const nonBlankItems = (invoice.items || []).filter(
      (item) => item.productId || (item.name && item.name.trim() !== "")
    );

    // Validate required fields before saving
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information (both ID and name required)
    if (!invoice.customer?.id) {
      errors.push("Customer is required. Please select a customer from the dropdown.");
      invalidFieldsSet.add("customer.name");
    } else if (!invoice.customer?.name || invoice.customer.name.trim() === "") {
      errors.push("Customer name is required");
      invalidFieldsSet.add("customer.name");
    }

    // Check if there are any items after filtering blanks
    if (!nonBlankItems || nonBlankItems.length === 0) {
      errors.push("At least one item is required");
    } else {
      // Validate each non-blank item
      nonBlankItems.forEach((item, index) => {
        if (!item.name || item.name.trim() === "") {
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
      errors.push("Invoice date is required");
      invalidFieldsSet.add("date");
    }
    if (!invoice.dueDate) {
      errors.push("Due date is required");
      invalidFieldsSet.add("dueDate");
    }

    // Check status (required field) - use effectiveStatus for Final Tax Invoice flow
    if (!effectiveStatus || !["draft", "proforma", "issued"].includes(effectiveStatus)) {
      errors.push("Invoice status is required");
      invalidFieldsSet.add("status");
    }

    // If there are validation errors, show them and stop
    if (errors.length > 0) {
      setValidationErrors(errors);
      setInvalidFields(invalidFieldsSet);

      // Scroll to the first error (save button area) - instant to prevent layout shift
      setTimeout(() => {
        const errorAlert = document.getElementById("validation-errors-alert");
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: "instant", block: "center" });
        }
      }, 100);

      setIsSaving(false); // Reset saving state on validation error
      return;
    }

    // Clear any previous validation errors
    setValidationErrors([]);
    setInvalidFields(new Set());

    setIsSaving(true);
    try {
      // Convert empty string values to numbers before saving
      // IMPORTANT: Use effectiveStatus to ensure correct status for Final Tax Invoice flow
      const processedInvoice = {
        ...invoice,
        status: effectiveStatus, // Use effectiveStatus, not invoice.status (fixes DFT- prefix bug)
        discountAmount: invoice.discountAmount === "" ? 0 : Number(invoice.discountAmount),
        discountPercentage: invoice.discountPercentage === "" ? 0 : Number(invoice.discountPercentage),
        items: nonBlankItems.map((item) => ({
          ...item,
          quantity: item.quantity === "" ? 0 : Number(item.quantity),
          rate: item.rate === "" ? 0 : Number(item.rate),
          discount: item.discount === "" ? 0 : Number(item.discount),
          vatRate: item.vatRate === "" ? 0 : Number(item.vatRate),
          // Phase 2: Manual batch allocation - deterministic mapping from canonical allocations
          allocation_mode: item.allocationMode || "AUTO_FIFO",
          manual_allocations: (item.allocations || []).map((a) => ({
            batch_id: a.batchId,
            quantity: a.quantity,
          })),
        })),
      };

      if (id) {
        // Update existing invoice using cancel and recreate approach
        const updatedInvoice = await updateInvoice(invoice.id, processedInvoice);
        if (onSave) onSave(updatedInvoice);

        // Navigate to the new invoice ID (backend creates new invoice using cancel-and-recreate)
        // The backend returns: { id: oldId, new_invoice_id: actualNewId }
        // We need to navigate to the NEW invoice to continue editing
        if (updatedInvoice.newInvoiceId && updatedInvoice.newInvoiceId !== parseInt(id, 10)) {
          notificationService.success(
            "Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data."
          );
          // Navigate to new invoice ID with smooth transition (300ms)
          setTimeout(() => {
            const newId = updatedInvoice?.newInvoiceId;
            if (newId) {
              navigate(INVOICE_ROUTES.view(newId), { replace: true });
            } else {
              console.error("Navigation failed: newInvoiceId is undefined");
              navigate(INVOICE_ROUTES.list(), { replace: true });
            }
          }, 300);
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
        setInvoice((prev) => ({
          ...prev,
          invoiceNumber: newInvoice.invoiceNumber,
        }));

        // Store the created invoice ID for success modal
        setCreatedInvoiceId(newInvoice.id);

        // Close preview modal if it's open
        setShowPreview(false);

        // Phase 4: Finalize invoice with batch allocations
        // Check if invoice has warehouse items with allocations (lineItemTempId indicates Phase 3+ allocation)
        const warehouseItemsWithAllocations = invoice.items.filter(
          (item) => item.sourceType === "WAREHOUSE" && item.lineItemTempId
        );

        if (warehouseItemsWithAllocations.length > 0 && newInvoice.items?.length > 0) {
          try {
            // Build line item mappings from frontend items to backend items
            // Match by lineItemTempId which is stored in both
            const lineItemMappings = warehouseItemsWithAllocations
              .map((frontendItem) => {
                // Find corresponding backend item by line_item_temp_id
                const backendItem = newInvoice.items.find(
                  (bi) =>
                    bi.lineItemTempId === frontendItem.lineItemTempId ||
                    bi.line_item_temp_id === frontendItem.lineItemTempId
                );
                if (backendItem) {
                  return {
                    lineItemTempId: frontendItem.lineItemTempId,
                    invoiceItemId: backendItem.id,
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (lineItemMappings.length > 0) {
              const finalizeResult = await batchReservationService.finalizeInvoice({
                draftInvoiceId: newInvoice.id,
                lineItemMappings,
                targetStatus: effectiveStatus, // 'issued' or 'proforma'
                skipStockDeduction: false,
              });

              if (finalizeResult.success) {
                // Update invoice number if it was generated during finalization
                if (finalizeResult.invoiceNumber) {
                  setInvoice((prev) => ({
                    ...prev,
                    invoiceNumber: finalizeResult.invoiceNumber,
                  }));
                }
              } else {
                notificationService.warning("Invoice saved but stock finalization incomplete. Please review.");
              }
            }
          } catch (finalizeError) {
            // Check for specific error types
            const errorMessage = finalizeError?.response?.data?.message || finalizeError?.message || "Unknown error";

            if (errorMessage.toLowerCase().includes("expired")) {
              notificationService.error(
                "Some batch reservations have expired. Invoice saved but stock not deducted. Please re-allocate batches."
              );
            } else if (
              errorMessage.toLowerCase().includes("insufficient") ||
              errorMessage.toLowerCase().includes("stock")
            ) {
              notificationService.error(
                "Stock no longer available. Invoice saved but stock not deducted. Another user may have used the same batches."
              );
            } else {
              notificationService.warning(`Invoice saved but finalization failed: ${errorMessage}`);
            }
            // Continue - invoice is saved, just finalization failed
          }
        }

        // Phase 2.1: If invoice has pending confirmation, navigate to confirmation screen
        // NOTE: This is from the old Phase 2 flow - now superseded by Phase 4 finalize
        if (newInvoice.expiresAt) {
          notificationService.success("Invoice created! Please confirm batch allocation within 5 minutes.");
          navigate(`/app/invoices/${newInvoice.id}/confirm-allocation`);
          return;
        }

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

      // Check for numeric overflow error
      const errorCode = error?.response?.data?.errorCode;
      if (errorCode === "NUMERIC_OVERFLOW") {
        const limits = error?.response?.data?.details?.limits;
        let msg = "Values are too large for the system. Maximum limits:\n";
        if (limits) {
          msg += `• Quantity: ${limits.quantity.max.toLocaleString()}\n`;
          msg += `• Unit Price: ${limits.rate.max.toLocaleString()}\n`;
          msg += `• Line Amount: ${limits.amount.max.toLocaleString()}\n`;
          msg += `• Invoice Total: ${limits.total.max.toLocaleString()}`;
        }
        errorMessage = msg;
      }

      // Check for discount validation errors
      if (errorCode === "INVALID_DISCOUNT") {
        errorMessage = `Discount validation failed: ${error?.response?.data?.message || "Discount must be 0-100%"}`;
      }

      // Check for amount mismatch errors
      if (error?.response?.data?.message?.includes("amount mismatch")) {
        errorMessage = `${error.response.data.message}. Ensure quantity × rate matches the item amount.`;
      }

      // Check for total mismatch errors
      if (error?.response?.data?.message?.includes("Total mismatch")) {
        errorMessage = `${error.response.data.message}. The system recalculated totals and they don't match. Please verify your invoice values.`;
      }

      // Check for duplicate invoice number error (from database unique constraint)
      if (
        errorMessage.toLowerCase().includes("duplicate") ||
        errorMessage.toLowerCase().includes("unique_invoice_number") ||
        error?.response?.status === 409
      ) {
        // If this is a NEW invoice (not an edit), auto-fetch next available number
        if (!id) {
          errorMessage = `Invoice number ${invoice.invoiceNumber} already exists. Fetching a new invoice number...`;
          notificationService.warning(errorMessage);

          // Refetch the next invoice number
          try {
            await refetchNextInvoice();
            notificationService.success("New invoice number assigned. Please try saving again.");
            return; // Exit early so user can try again with new number
          } catch (_refetchError) {
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
          errorMessage += `\n${details.join("\n")}`;
        } else if (typeof details === "object") {
          errorMessage += `\n${Object.entries(details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join("\n")}`;
        }
      }

      notificationService.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmDialog(false);

    // Pass 'issued' explicitly since user confirmed Final Tax Invoice dialog
    // This ensures status is correct regardless of React state timing
    await performSave("issued");
  };

  const handleCancelSave = () => {
    setShowSaveConfirmDialog(false);
  };

  // Handle actions from success modal
  const handleSuccessDownloadPDF = async () => {
    setShowSuccessModal(false);

    // Wait for modal close animation, then trigger PDF download and navigate
    setTimeout(async () => {
      await handleDownloadPDF();
      notificationService.success("Invoice created successfully! PDF downloaded.");

      // Navigate after PDF download completes (smooth transition)
      navigate("/app/invoices");
    }, 300);
  };

  const handleSuccessGoToList = () => {
    setShowSuccessModal(false);

    // Smooth transition delay for modal close animation
    setTimeout(() => {
      notificationService.success("Invoice created successfully!");
      navigate("/app/invoices");
    }, 300);
  };

  // Navigate to invoice list and auto-open payment drawer
  const handleSuccessRecordPayment = () => {
    setShowSuccessModal(false);

    // Navigate to invoice list with query param to auto-open payment drawer
    setTimeout(() => {
      navigate(`/app/invoices?openPayment=${createdInvoiceId}`);
    }, 300);
  };

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);

    // Navigate to edit mode to prevent duplicate creation
    // User can continue viewing/editing the invoice
    if (createdInvoiceId) {
      navigate(INVOICE_ROUTES.view(createdInvoiceId));
      notificationService.success("Invoice created successfully! Now in edit mode.");
    } else {
      console.error("Navigation failed: createdInvoiceId is undefined");
      navigate(INVOICE_ROUTES.list());
    }
  }, [createdInvoiceId, navigate]);

  // Phase 4: Removed drop-ship popup handlers - now using inline SourceTypeSelector dropdown

  // ============================================================
  // DROPSHIP PO CREATION
  // ============================================================
  const handleOpenDropshipPOModal = useCallback(async (itemIndex) => {
    setDropshipPOModal({ open: true, itemIndex });
    setDropshipSelectedSupplier(null);
    try {
      const result = await supplierService.getSuppliers({ limit: 200 });
      setDropshipSuppliers(result.suppliers || []);
    } catch {
      setDropshipSuppliers([]);
    }
  }, []);

  const handleCreateDropshipPO = useCallback(async () => {
    const { itemIndex } = dropshipPOModal;
    const item = invoice.items[itemIndex];
    if (!item || !dropshipSelectedSupplier) return;

    setCreatingDropshipPO(true);
    try {
      const result = await purchaseOrderService.createDropshipPO({
        invoiceId: parseInt(id, 10),
        itemIds: [item.id],
        supplierId: dropshipSelectedSupplier.id,
        supplierDetails: {
          id: dropshipSelectedSupplier.id,
          name: dropshipSelectedSupplier.name || dropshipSelectedSupplier.company,
        },
      });

      // Update the local invoice item with the linked PO item ID
      const poItem = result.items?.find((pi) => pi.linked_invoice_item_id === item.id);
      if (poItem) {
        setInvoice((prev) => ({
          ...prev,
          items: prev.items.map((it, idx) =>
            idx === itemIndex ? { ...it, linkedPoItemId: poItem.id, _linkedPONumber: result.po_number } : it
          ),
        }));
      }

      if (result.already_exists) {
        notificationService.info(`Dropship PO ${result.po_number} already exists`);
      } else {
        notificationService.success(`Dropship PO ${result.po_number} created for "${item.name}"`);
      }
      setDropshipPOModal({ open: false, itemIndex: null });
    } catch (err) {
      notificationService.error(err.message || "Failed to create dropship PO");
    } finally {
      setCreatingDropshipPO(false);
    }
  }, [dropshipPOModal, invoice.items, dropshipSelectedSupplier, id]);

  // Handle ESC key to close success modal (only for Draft/Proforma, not Final Tax Invoice)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && showSuccessModal) {
        // Only allow ESC to close for Draft and Proforma invoices
        const isFinalTaxInvoice = invoice.status === "issued";
        if (!isFinalTaxInvoice) {
          handleSuccessModalClose();
        }
      }
    };

    if (showSuccessModal) {
      document.addEventListener("keydown", handleEscKey);
      return () => {
        document.removeEventListener("keydown", handleEscKey);
      };
    }
  }, [showSuccessModal, invoice.status, handleSuccessModalClose]);

  const handleDownloadPDF = useCallback(async () => {
    // Use either the route ID or the newly created invoice ID
    const invoiceId = id || createdInvoiceId;

    // Require invoice to be saved first
    if (!invoiceId) {
      notificationService.warning("Please save the invoice first before downloading PDF");
      return;
    }

    // If company details still loading, set a pending flag and retry when ready
    if (loadingCompany) {
      setPdfPending(true);
      notificationService.info("Loading company details… Will download when ready.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Use backend API to generate searchable text PDF with proper fonts and margins
      await invoicesAPI.downloadPDF(invoiceId);
      notificationService.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      notificationService.error(`PDF generation failed: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [id, createdInvoiceId, loadingCompany]);

  // Auto-retry PDF generation once company finishes loading if user requested it
  const [pdfPending, setPdfPending] = useState(false);
  useEffect(() => {
    if (pdfPending && !loadingCompany) {
      setPdfPending(false);
      // Retry PDF download now that company details are loaded
      handleDownloadPDF();
    }
  }, [pdfPending, loadingCompany, handleDownloadPDF]);

  // ============================================================
  // KEYBOARD SHORTCUTS - Scoped to this page only
  // ============================================================
  useKeyboardShortcuts(
    {
      [INVOICE_SHORTCUTS.SAVE]: () => {
        // Ctrl+S - Save invoice
        if (!isSaving && !savingInvoice && !updatingInvoice) {
          handleSave();
        }
      },
      [INVOICE_SHORTCUTS.PREVIEW]: () => {
        // Ctrl+P - Preview invoice (override browser print)
        if (!showPreview) {
          handlePreviewClick();
        }
      },
      [INVOICE_SHORTCUTS.CLOSE]: () => {
        // Escape - Close modals or go back
        if (showSuccessModal) {
          handleSuccessModalClose();
        } else if (showSaveConfirmDialog) {
          handleCancelSave();
        } else if (showFormSettings) {
          setShowFormSettings(false);
        }
      },
    },
    {
      enabled: !showPreview, // Disable when preview is open (it has its own handlers)
      allowInInputs: ["escape"], // Allow Escape in inputs to close modals
    }
  );

  if (showPreview) {
    // Preview is view-only - no Save button per unified design rules
    // User must close preview and save from form
    return (
      <InvoicePreview
        invoice={invoice}
        company={company || {}}
        onClose={() => setShowPreview(false)}
        invoiceId={id}
        template={currentTemplate}
      />
    );
  }

  if (loadingInvoice) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading invoice...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading overlay for initial page load */}
      <LoadingOverlay
        show={loadingCompany || loadingCustomers || loadingProducts || loadingAgents}
        message="Loading invoice form..."
        detail="Initializing form data"
      />

      <div
        className={`min-h-screen pb-32 md:pb-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
        data-testid="invoice-form"
      >
        {/* Sticky Header - Mobile & Desktop */}
        <header
          className={`sticky top-0 z-20 shrink-0 backdrop-blur-md border-b ${
            isDarkMode ? "bg-gray-900/92 border-gray-700" : "bg-white/92 border-gray-200"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(INVOICE_ROUTES.list())}
                  className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-label="Back to invoices"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className={`text-lg md:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {id ? "Edit Invoice" : "New Invoice"}
                  </h1>
                  <p className={`text-xs md:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {invoice.invoiceNumber || "Invoice #"}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex gap-2 items-start relative">
                {/* Correction Guide */}
                <button
                  type="button"
                  onClick={() => setShowCorrectionGuide(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? "text-amber-400 hover:bg-amber-900/20" : "text-amber-600 hover:bg-amber-50"
                  }`}
                  aria-label="Correction Guide"
                  title="Correction Guide"
                >
                  <BookOpen className="h-5 w-5" />
                </button>
                {/* Settings Icon */}
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

                {/* Settings Panel */}
                <FormSettingsPanel
                  isOpen={showFormSettings}
                  onClose={() => setShowFormSettings(false)}
                  preferences={formPreferences}
                  onPreferenceChange={(key, value) => {
                    setFormPreferences((prev) => ({
                      ...prev,
                      [key]: value,
                    }));
                  }}
                />

                <Button variant="outline" onClick={handlePreviewClick} disabled={loadingCompany}>
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <div className="flex flex-col items-start">
                  <Button
                    ref={saveButtonRef}
                    onClick={handleSave}
                    disabled={!canWrite || savingInvoice || updatingInvoice || isSaving || isLocked}
                    title={
                      !canWrite
                        ? "You do not have permission to save invoices"
                        : isLocked
                          ? "Invoice is locked (24h edit window expired)"
                          : isRevisionMode
                            ? `Save revision (${hoursRemainingInEditWindow}h remaining)`
                            : `Save as draft (${getShortcutDisplayString(INVOICE_SHORTCUTS.SAVE)})`
                    }
                    data-testid="save-draft"
                  >
                    {savingInvoice || updatingInvoice || isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {savingInvoice || updatingInvoice || isSaving
                      ? "Saving..."
                      : isRevisionMode
                        ? "Save Revision"
                        : "Save Draft"}
                  </Button>
                  {isRevisionMode && (
                    <span className={`text-[10px] mt-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                      {hoursRemainingInEditWindow}h left to edit
                    </span>
                  )}
                </div>

                {/* UAE VAT: Issue Final Tax Invoice Button - Only for drafts, not revisions */}
                {id && !isLocked && !isRevisionMode && invoice.status !== "issued" && (
                  <div className="flex flex-col items-center">
                    <Button
                      variant="success"
                      onClick={handleIssueInvoice}
                      disabled={savingInvoice || updatingInvoice || isSaving}
                      title="Issue as Final Tax Invoice (locks invoice permanently)"
                      className="bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600"
                    >
                      <Download className="h-4 w-4" />
                      Issue Final Invoice
                    </Button>
                    <span className={`text-[10px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Once issued, cannot be edited
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - 12-column grid layout (8+4) */}
        <main className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="grid grid-cols-12 gap-3">
            {/* Left Panel (8 cols) - Main Form Content */}
            <div className="col-span-12 lg:col-span-8 space-y-3">
              {/* UAE VAT COMPLIANCE: Locked Invoice Warning Banner */}
              {isLocked && (
                <div
                  className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                    isDarkMode
                      ? "bg-amber-900/20 border-amber-600 text-amber-200"
                      : "bg-amber-50 border-amber-500 text-amber-800"
                  }`}
                >
                  <AlertTriangle
                    className={`flex-shrink-0 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
                    size={24}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">Final Tax Invoice - Locked</h4>
                    <p className="text-sm mt-1">
                      This invoice has been issued as a Final Tax Invoice and cannot be modified. UAE VAT compliance
                      requires any corrections to be made via Credit Note.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate(`/app/credit-notes/new?invoiceId=${invoice.id}`)}
                    >
                      Create Credit Note
                    </Button>
                  </div>
                </div>
              )}

              {/* Document History / Correction Chain (Phase 3) */}
              {id && (
                <DocumentHistoryPanel
                  documentType="invoice"
                  documentId={id}
                  documentStatus={originalSavedStatus}
                  allowedActions={
                    isLocked
                      ? [
                          {
                            label: "Create Credit Note",
                            type: "credit_note",
                            href: `/app/credit-notes/new?invoiceId=${id}`,
                          },
                        ]
                      : []
                  }
                />
              )}

              {/* Validation Errors Alert */}
              {validationErrors.length > 0 && (
                <div
                  id="validation-errors-alert"
                  className={`mt-6 p-4 rounded-lg border-2 ${
                    isDarkMode ? "bg-red-900/20 border-red-600 text-red-200" : "bg-red-50 border-red-500 text-red-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`flex-shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                      size={24}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">Please fix the following errors:</h4>
                      <ul className="space-y-1 text-sm">
                        {validationErrors.map((error) => {
                          // Parse error to extract field name for scrolling
                          let fieldName = null;
                          if (error.includes("Customer")) fieldName = "customer.name";
                          else if (error.includes("Invoice date")) fieldName = "date";
                          else if (error.includes("Due date")) fieldName = "dueDate";
                          else if (error.includes("At least one item")) fieldName = "item.0.name";
                          else if (error.match(/Item \d+/)) {
                            const match = error.match(/Item (\d+)/);
                            if (match) {
                              const itemNum = parseInt(match[1], 10) - 1; // Convert to 0-indexed
                              if (error.includes("Rate")) fieldName = `item.${itemNum}.rate`;
                              else if (error.includes("Quantity")) fieldName = `item.${itemNum}.quantity`;
                              else if (error.includes("Product")) fieldName = `item.${itemNum}.name`;
                              else fieldName = `item.${itemNum}`;
                            }
                          }

                          return (
                            <li key={error}>
                              <button
                                type="button"
                                onClick={() => fieldName && scrollToField(fieldName)}
                                disabled={!fieldName}
                                className={`flex items-center gap-2 w-full text-left ${fieldName ? "cursor-pointer hover:underline hover:text-red-400" : "opacity-60 cursor-default"}`}
                                title={fieldName ? "Click to scroll to field" : ""}
                              >
                                <span className="text-red-500">•</span>
                                <span>{error}</span>
                                {fieldName && <span className="text-xs opacity-60">↓</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        type="button"
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

              {/* Two-Column Header Layout - Customer/Sales + Invoice Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* LEFT COLUMN: Customer & Sales Information */}
                <Card className={`p-3 md:p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  {/* Customer Selection - Priority #1 */}
                  <div className="mb-4" ref={customerRef}>
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Customer Information
                    </h3>
                    {/* Customer Selector - Enhanced with Search */}
                    <div className="space-y-0.5">
                      <Autocomplete
                        label="Select Customer"
                        data-testid="customer-autocomplete"
                        options={(customersData?.customers || []).map((c) => ({
                          id: c.id,
                          label: `${c.code ? `[${c.code}] ` : ""}${titleCase(normalizeLLC(c.name))} - ${c.email || "No email"}`,
                          name: c.name,
                          email: c.email,
                          phone: c.phone,
                        }))}
                        value={
                          invoice.customer.id
                            ? {
                                id: invoice.customer.id,
                                label: `${titleCase(normalizeLLC(invoice.customer.name))} - ${invoice.customer.email || "No email"}`,
                              }
                            : null
                        }
                        onChange={(_e, selected) => {
                          if (selected?.id) {
                            handleCustomerSelect(selected.id);
                            // Show selected customer name in the input field
                            setCustomerSearchInput(titleCase(normalizeLLC(selected.name || "")));
                          }
                        }}
                        inputValue={customerSearchInput}
                        onInputChange={(_e, value) => setCustomerSearchInput(value)}
                        placeholder="Search customers by name or email..."
                        disabled={loadingCustomers}
                        noOptionsText={loadingCustomers ? "Loading customers..." : "No customers found"}
                        error={invalidFields.has("customer.name")}
                        className="text-base"
                        required={true}
                        validationState={fieldValidation.customer}
                        showValidation={formPreferences.showValidationHighlighting}
                      />
                      {invalidFields.has("customer.name") && (
                        <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                          Customer is required
                        </p>
                      )}
                    </div>

                    {/* Display customer details - always visible */}
                    <div
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"
                      }`}
                    >
                      <h4 className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {invoice.customer.name ? "Selected Customer:" : "Customer Details:"}
                      </h4>
                      <div className={`space-y-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        <p>
                          <span className="font-medium">Name:</span>{" "}
                          {invoice.customer.name ? titleCase(normalizeLLC(invoice.customer.name)) : ""}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {invoice.customer.email || ""}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span> {invoice.customer.phone || ""}
                        </p>
                        <p>
                          <span className="font-medium">TRN:</span> {invoice.customer.vatNumber || ""}
                        </p>
                        <p>
                          <span className="font-medium">Address:</span>{" "}
                          {invoice.customer.address?.street || invoice.customer.address?.city
                            ? [
                                invoice.customer.address.street,
                                invoice.customer.address.city,
                                invoice.customer.address.emirate,
                                invoice.customer.address.poBox,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : ""}
                        </p>
                        <p className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="font-medium">Price List:</span>{" "}
                          {pricelistName && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                              {pricelistName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Trade License Status Alert */}
                    {showTradeLicenseAlert && tradeLicenseStatus && (
                      <Alert variant="warning" onClose={() => setShowTradeLicenseAlert(false)}>
                        <div>
                          <h4 className="font-medium mb-1">Trade License Alert</h4>
                          <p className="text-sm">{tradeLicenseStatus.message}</p>
                          {tradeLicenseStatus.licenseNumber && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">License Number:</span> {tradeLicenseStatus.licenseNumber}
                            </p>
                          )}
                          {tradeLicenseStatus.expiryDate && (
                            <p className="text-sm">
                              <span className="font-medium">Expiry Date:</span>{" "}
                              {formatDateDMY(tradeLicenseStatus.expiryDate)}
                            </p>
                          )}
                        </div>
                      </Alert>
                    )}

                    {loadingCustomers && (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Loading customers...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sales Agent Selection */}
                  <div
                    className="border-t pt-4 mt-4"
                    style={{
                      borderColor: isDarkMode ? "rgb(75 85 99)" : "rgb(229 231 235)",
                    }}
                  >
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Sales Information
                    </h3>
                    <FormSelect
                      label="Sales Agent (Optional)"
                      value={invoice.sales_agent_id || "none"}
                      onValueChange={(value) => handleSalesAgentSelect(value)}
                      disabled={loadingAgents}
                      className="text-base"
                    >
                      <SelectItem value="none">No sales agent</SelectItem>
                      {(salesAgentsData?.data || []).map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.fullName || agent.username}
                          {agent.defaultCommissionRate ? ` (${agent.defaultCommissionRate}% commission)` : ""}
                        </SelectItem>
                      ))}
                    </FormSelect>
                    {loadingAgents && (
                      <div className="flex items-center space-x-2 mt-2">
                        <LoadingSpinner size="sm" />
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Loading sales agents...
                        </span>
                      </div>
                    )}

                    {/* Commission Details - Only shown when sales agent is selected */}
                    {invoice.sales_agent_id && (
                      <div
                        className="border-t pt-4 mt-4"
                        style={{
                          borderColor: isDarkMode ? "rgb(75 85 99)" : "rgb(229 231 235)",
                        }}
                      >
                        <div className="space-y-3">
                          <Input
                            label="Commission Percentage (%)"
                            type="number"
                            value={invoice.commissionPercentage || 10}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setInvoice((prev) => ({
                                  ...prev,
                                  commissionPercentage: 0,
                                }));
                                return;
                              }
                              const num = Number(raw);
                              if (Number.isNaN(num)) return;
                              const clamped = Math.max(0, Math.min(100, num));
                              setInvoice((prev) => ({
                                ...prev,
                                commissionPercentage: clamped,
                              }));
                            }}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="10.00"
                            inputMode="decimal"
                            onKeyDown={(e) => {
                              const blocked = ["e", "E", "+", "-"];
                              if (blocked.includes(e.key)) e.preventDefault();
                            }}
                            disabled={isLocked}
                            className="text-base"
                          />
                          <div className={`p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-2`}>
                              Commission Amount (Accrual)
                            </p>
                            <p className={`text-lg font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                              AED {((computedTotal * (invoice.commissionPercentage || 10)) / 100).toFixed(2)}
                            </p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} mt-2`}>
                              Accrues when invoice is issued. 15-day grace period for adjustments.
                            </p>
                          </div>
                          {id && invoice.commissionStatus && (
                            <div
                              className={`p-3 rounded border ${
                                isDarkMode ? "bg-gray-700 border-gray-600" : "bg-blue-50 border-blue-200"
                              }`}
                            >
                              <p
                                className={`text-xs font-semibold ${
                                  isDarkMode ? "text-blue-300" : "text-blue-800"
                                } mb-1`}
                              >
                                Commission Status
                              </p>
                              <p
                                className={`text-sm font-medium ${
                                  invoice.commissionStatus === "PAID"
                                    ? "text-green-600"
                                    : invoice.commissionStatus === "APPROVED"
                                      ? "text-blue-600"
                                      : invoice.commissionStatus === "PENDING"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                }`}
                              >
                                {invoice.commissionStatus}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* RIGHT COLUMN: Invoice Details */}
                <Card className={`p-3 md:p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Invoice Details
                  </h3>
                  <div className="space-y-4">
                    {/* Invoice Number and Status - Invoice identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        label="Invoice Number"
                        value={invoice.invoiceNumber}
                        readOnly
                        className="text-base bg-gray-50"
                        placeholder="Auto-generated on save"
                      />
                      <FormSelect
                        label="Invoice Status"
                        value={invoice.status}
                        required={true}
                        validationState={fieldValidation.status}
                        onValueChange={(newStatus) => {
                          setInvoice((prev) => ({
                            ...prev,
                            status: newStatus,
                            invoiceNumber: !id ? withStatusPrefix(prev.invoiceNumber, newStatus) : prev.invoiceNumber,
                          }));
                          validateField("status", newStatus);
                        }}
                        className="text-base"
                      >
                        <SelectItem value="draft">Draft Invoice</SelectItem>
                        <SelectItem value="proforma">Proforma Invoice</SelectItem>
                        <SelectItem value="issued">Final Tax Invoice</SelectItem>
                      </FormSelect>
                    </div>

                    {/* Invoice Date and Due Date - Date fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        label="Invoice Date"
                        type="date"
                        value={formatDateForInput(invoice.date)}
                        readOnly
                        error={invalidFields.has("date")}
                        className="text-base"
                      />
                      <div ref={dueDateRef}>
                        <Input
                          label="Due Date"
                          type="date"
                          value={formatDateForInput(invoice.dueDate)}
                          min={dueMinStr}
                          max={dueMaxStr}
                          required={true}
                          validationState={fieldValidation.dueDate}
                          showValidation={formPreferences.showValidationHighlighting}
                          error={invalidFields.has("dueDate")}
                          onChange={(e) => {
                            const v = e.target.value;
                            let validatedValue = v;
                            if (v && v < dueMinStr) validatedValue = dueMinStr;
                            if (v && v > dueMaxStr) validatedValue = dueMaxStr;
                            setInvoice((prev) => ({
                              ...prev,
                              dueDate: validatedValue,
                            }));
                            validateField("dueDate", validatedValue);
                          }}
                          className="text-base"
                        />
                      </div>
                    </div>

                    {/* Payment Terms and Currency - Transaction settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormSelect
                        label="Payment Terms"
                        value={invoice.modeOfPayment || ""}
                        required={false}
                        validationState={fieldValidation.paymentMode}
                        onValueChange={(value) => {
                          setInvoice((prev) => ({
                            ...prev,
                            modeOfPayment: value,
                          }));
                          validateField("paymentMode", value);
                          // Auto-focus to next mandatory field after payment terms selection
                          if (value) {
                            setTimeout(() => focusNextMandatoryField(), 100);
                          }
                        }}
                        className="text-base"
                      >
                        {Object.values(PAYMENT_MODES).map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.icon} {mode.label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                      <FormSelect
                        label="Currency"
                        value={invoice.currency || "AED"}
                        required={true}
                        validationState={fieldValidation.currency}
                        onValueChange={(value) => {
                          setInvoice((prev) => ({
                            ...prev,
                            currency: value,
                          }));
                          validateField("currency", value);
                        }}
                        className="text-base"
                      >
                        <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                        <SelectItem value="QAR">QAR (Qatari Riyal)</SelectItem>
                        <SelectItem value="OMR">OMR (Omani Rial)</SelectItem>
                        <SelectItem value="BHD">BHD (Bahraini Dinar)</SelectItem>
                        <SelectItem value="KWD">KWD (Kuwaiti Dinar)</SelectItem>
                      </FormSelect>
                    </div>

                    {/* Warehouse - Only shown when warehouse items exist */}
                    {needsWarehouseSelector && (
                      <div className="grid grid-cols-1 gap-2">
                        <FormSelect
                          label="Warehouse"
                          value={invoice.warehouseId || ""}
                          required={invoice.status !== "draft"}
                          validationState={fieldValidation.warehouse}
                          onValueChange={(warehouseId) => {
                            const w = warehouses.find((wh) => wh.id.toString() === warehouseId);
                            setInvoice((prev) => ({
                              ...prev,
                              warehouseId,
                              warehouseName: w ? w.name : "",
                              warehouseCode: w ? w.code : "",
                              warehouseCity: w ? w.city : "",
                            }));
                            validateField("warehouse", warehouseId);
                          }}
                          className="text-base"
                        >
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} - {w.city}
                            </SelectItem>
                          ))}
                        </FormSelect>
                      </div>
                    )}

                    {/* Customer PO Fields - Customer reference info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        label="Customer PO Number"
                        value={invoice.customerPurchaseOrderNumber || ""}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            customerPurchaseOrderNumber: e.target.value,
                          }))
                        }
                        placeholder="PO number"
                        className="text-base"
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
                        className="text-base"
                      />
                    </div>

                    {/* VAT Compliance Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormSelect
                        label={
                          <span className="inline-flex items-center gap-1">
                            <span>
                              Place of Supply
                              {invoice.status === "issued" && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                            <VatHelpIcon
                              content={[
                                "When required: Mandatory for all invoices.",
                                "Specifies which Emirate the supply is made from.",
                                "Used for compliance with FTA Form 201.",
                              ]}
                            />
                          </span>
                        }
                        value={invoice.placeOfSupply || ""}
                        validationState={fieldValidation.placeOfSupply}
                        onValueChange={(value) => {
                          setInvoice((prev) => ({
                            ...prev,
                            placeOfSupply: value,
                          }));
                          validateField("placeOfSupply", value);
                        }}
                        className="text-base"
                      >
                        {UAE_EMIRATES.map((emirate) => (
                          <SelectItem key={emirate} value={emirate}>
                            {emirate}
                          </SelectItem>
                        ))}
                      </FormSelect>
                      <Input
                        label={
                          <span className="inline-flex items-center gap-1">
                            <span>Supply Date</span>
                            <VatHelpIcon
                              content={[
                                "When required: Mandatory. Determines VAT liability date.",
                                "Must be the date supply is made (goods delivered/services rendered).",
                                "Defaults to invoice date if empty.",
                              ]}
                            />
                          </span>
                        }
                        type="date"
                        value={invoice.supplyDate || ""}
                        validationState={fieldValidation.supplyDate}
                        showValidation={formPreferences.showValidationHighlighting}
                        onChange={(e) => {
                          setInvoice((prev) => ({
                            ...prev,
                            supplyDate: e.target.value,
                          }));
                          validateField("supplyDate", e.target.value);
                        }}
                        className="text-base"
                      />
                    </div>

                    {/* Exchange Rate Date - Conditional (shown for foreign currency) */}
                    {invoice.currency && invoice.currency !== "AED" && (
                      <Input
                        label="Exchange Rate Date"
                        type="date"
                        value={invoice.exchangeRateDate || ""}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            exchangeRateDate: e.target.value,
                          }))
                        }
                        className="text-base"
                      />
                    )}
                  </div>
                </Card>
              </div>

              {/* Items Section - Responsive */}
              <Card className={`p-3 md:p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`} ref={itemsRef}>
                <div className="mb-4 flex justify-between items-center">
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Line Items
                    {invoice.items.filter((i) => i.productId).length > 0 && (
                      <span className="ml-2 text-teal-600">
                        ({invoice.items.filter((i) => i.productId).length} items)
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddProductDrawer(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isDarkMode
                        ? "bg-teal-600 hover:bg-teal-500 text-white"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    data-testid="add-item-drawer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {/* Line Items Display */}
                <div className="overflow-x-auto">
                  {/* Empty state when no items */}
                  {invoice.items.filter((item) => item.productId || item.name).length === 0 ? (
                    <div
                      className={`text-center py-8 px-4 border-2 border-dashed rounded-lg ${
                        isDarkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"
                      }`}
                    >
                      <List className="mx-auto h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm font-medium mb-1">No line items yet</p>
                      <p className="text-xs opacity-75">
                        Search for products in the panel on the right and click &quot;Add to Invoice&quot;
                      </p>
                    </div>
                  ) : (
                    <table
                      className={`min-w-full table-fixed divide-y ${
                        isDarkMode ? "divide-gray-600" : "divide-gray-200"
                      }`}
                    >
                      <thead className="bg-teal-600">
                        <tr className="h-10">
                          <th className="py-2 px-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-10">
                            #
                          </th>
                          <th
                            className="pl-3 pr-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white"
                            style={{ width: "35%" }}
                          >
                            Product
                          </th>
                          <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-24">
                            Qty
                          </th>
                          <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-24">
                            Rate
                          </th>
                          <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-28">
                            Amount
                          </th>
                          <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-16">
                            Status
                          </th>
                          <th className="py-2 px-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-10"></th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDarkMode ? "bg-gray-800 divide-gray-600" : "bg-white divide-gray-200"
                        }`}
                      >
                        {invoice.items
                          .filter((item) => item.productId || item.name)
                          .map((item, index) => {
                            const statusInfo = getLineItemStatusIcon(item);
                            return (
                              <tr
                                key={item.lineItemTempId || item.id || `item-${index}`}
                                className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                              >
                                {/* # */}
                                <td className="py-2 px-2 text-center text-sm">{index + 1}</td>
                                {/* Product */}
                                <td className="pl-3 pr-2 py-2">
                                  <div>
                                    <div
                                      className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                    >
                                      {item.name || "Unnamed Product"}
                                    </div>
                                    {/* Phase 4: Display batch allocations from saved consumptions or draft allocations */}
                                    {item.sourceType === "WAREHOUSE" &&
                                      (() => {
                                        // Use saved consumptions for finalized invoices, draft allocations otherwise
                                        const savedConsumption = savedConsumptionsByItemId[item.id];
                                        const displayAllocations =
                                          savedConsumption?.consumptions?.length > 0
                                            ? savedConsumption.consumptions
                                            : item.allocations || [];

                                        if (displayAllocations.length === 0) return null;

                                        return (
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            {displayAllocations.slice(0, 2).map((alloc, i) => (
                                              <span key={alloc.id || alloc.name || `alloc-${i}`}>
                                                {alloc.batchNumber || `Batch ${alloc.batchId}`}:{" "}
                                                {parseFloat(alloc.quantity || alloc.quantityConsumed || 0).toFixed(0)}{" "}
                                                kg
                                                {i < Math.min(displayAllocations.length - 1, 1) && ", "}
                                              </span>
                                            ))}
                                            {displayAllocations.length > 2 && (
                                              <span className="text-teal-600">
                                                {" "}
                                                +{displayAllocations.length - 2} more
                                              </span>
                                            )}
                                            {savedConsumption && (
                                              <span className="ml-1 text-green-600" title="Saved to database">
                                                ✓
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    {(item.sourceType === "LOCAL_DROP_SHIP" ||
                                      item.sourceType === "IMPORT_DROP_SHIP") && (
                                      <div className="text-xs text-blue-500 mt-0.5 flex items-center gap-1.5">
                                        <span>
                                          {item.sourceType === "LOCAL_DROP_SHIP"
                                            ? "Local Drop-Ship"
                                            : "Import Drop-Ship"}
                                        </span>
                                        {item.linkedPoItemId || item._linkedPONumber ? (
                                          <span className="text-green-600 font-medium" title="Linked to supplier PO">
                                            PO Linked
                                          </span>
                                        ) : id ? (
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-600 text-white rounded text-[10px] font-medium hover:bg-orange-500"
                                            onClick={() => handleOpenDropshipPOModal(index)}
                                          >
                                            Create Dropship PO
                                          </button>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {/* Qty */}
                                <td className="px-2 py-2 text-center text-sm">
                                  {item.quantity || 0} {item.quantityUom || "KG"}
                                </td>
                                {/* Rate */}
                                <td className="px-2 py-2 text-right text-sm">{formatCurrency(item.rate || 0)}</td>
                                {/* Amount */}
                                <td className="px-2 py-2 text-right text-sm font-medium">
                                  <div>{formatCurrency(item.amount || item.quantity * item.rate || 0)}</div>
                                  {/* Phase 7: Line item cost/margin display for confirmed invoices */}
                                  {item.costPrice > 0 && (
                                    <div
                                      className={`text-[10px] mt-0.5 ${item.marginPercent >= 15 ? "text-green-500" : item.marginPercent >= 0 ? "text-yellow-500" : "text-red-500"}`}
                                    >
                                      Cost: {formatCurrency(item.costPrice)} | {item.marginPercent?.toFixed(1) || 0}%
                                    </div>
                                  )}
                                </td>
                                {/* Status Icon */}
                                <td className="px-2 py-2 text-center">
                                  <span className={statusInfo.className} title={statusInfo.title}>
                                    {statusInfo.icon === "check" && <CheckCircle className="w-5 h-5 inline" />}
                                    {statusInfo.icon === "partial" && <AlertTriangle className="w-5 h-5 inline" />}
                                    {statusInfo.icon === "empty" && (
                                      <span className="inline-block w-5 h-5 rounded-full border-2 border-current"></span>
                                    )}
                                    {statusInfo.icon === "ship" && <span className="text-lg">🚢</span>}
                                  </span>
                                </td>
                                {/* Delete */}
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteLineItemConfirm({
                                        open: true,
                                        itemId: item.id,
                                        itemName: item.name,
                                        tempId: item.lineItemTempId,
                                      });
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                    title="Delete item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
            {/* End Left Panel */}

            {/* Right Panel (4 cols) - Sticky Summary */}
            <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 self-start">
              <Card className={CARD_CLASSES(isDarkMode)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-extrabold">Summary</div>
                  </div>
                </div>

                {/* Summary Rows */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Subtotal</span>
                    <span
                      className={`font-mono ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                      data-testid="subtotal"
                    >
                      {formatCurrency(computedSubtotal)}
                    </span>
                  </div>

                  {computedDiscountAmount > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Discount</span>
                      <span className="font-mono text-yellow-500">-{formatCurrency(computedDiscountAmount)}</span>
                    </div>
                  )}

                  {(invoice.packingCharges || 0) +
                    (invoice.freightCharges || 0) +
                    (invoice.insuranceCharges || 0) +
                    (invoice.loadingCharges || 0) +
                    (invoice.otherCharges || 0) >
                    0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Charges</span>
                      <span className={`font-mono ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                        {formatCurrency(
                          (invoice.packingCharges || 0) +
                            (invoice.freightCharges || 0) +
                            (invoice.insuranceCharges || 0) +
                            (invoice.loadingCharges || 0) +
                            (invoice.otherCharges || 0)
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>VAT (5%)</span>
                    <span
                      className={`font-mono ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                      data-testid="vat-amount"
                    >
                      {formatCurrency(computedVatAmount)}
                    </span>
                  </div>

                  <div className={DIVIDER_CLASSES(isDarkMode)} />

                  <div className="flex justify-between items-center py-2">
                    <span className={`font-extrabold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Total</span>
                    <span className="font-mono text-lg font-extrabold text-teal-400" data-testid="total">
                      {formatCurrency(computedTotal)}
                    </span>
                  </div>

                  {/* Phase 7: COGS/Profit Section - Show for confirmed invoices with COGS data */}
                  {(invoice.totalCogs > 0 || invoice.status === "CONFIRMED") && (
                    <>
                      <div className={DIVIDER_CLASSES(isDarkMode)} />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center py-1">
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Cost of Goods
                          </span>
                          <span className={`font-mono text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {formatCurrency(invoice.totalCogs || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Gross Profit
                          </span>
                          <span
                            className={`font-mono text-xs ${(invoice.totalProfit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {formatCurrency(invoice.totalProfit || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Margin</span>
                          <span
                            className={`font-mono text-xs font-semibold ${(invoice.grossMarginPercent || 0) >= 15 ? "text-green-400" : (invoice.grossMarginPercent || 0) >= 0 ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {(invoice.grossMarginPercent || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className={DIVIDER_CLASSES(isDarkMode)} />

                {/* Quick Actions */}
                <div>
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wide mb-2 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Quick Actions
                  </h3>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowChargesDrawer(true)}
                      className={QUICK_LINK_CLASSES(isDarkMode)}
                    >
                      <DollarSign className="w-4 h-4 opacity-60" />
                      <span className="flex-1">Edit Charges & Discount</span>
                      {(computedDiscountAmount > 0 || showFreightCharges) && (
                        <span className="text-xs text-teal-400">Active</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowNotesDrawer(true)}
                      className={QUICK_LINK_CLASSES(isDarkMode)}
                    >
                      <FileText className="w-4 h-4 opacity-60" />
                      <span className="flex-1">Edit Notes & Terms</span>
                      {(invoice.notes || invoice.taxNotes || invoice.terms) && (
                        <span className="text-xs text-teal-400">Has content</span>
                      )}
                    </button>
                  </div>

                  <p className={`text-xs mt-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Payments are recorded after invoice creation via the Payment Drawer
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>

        {/* Sticky Mobile Footer - Actions & Total */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-20 border-t shadow-2xl ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="px-4 py-3">
            {/* Total Display */}
            <div className="flex justify-between items-center mb-3">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Total Amount
              </span>
              <span className="text-xl font-bold text-teal-500">{formatCurrency(computedTotal)}</span>
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
                ref={saveButtonRef}
                onClick={handleSave}
                disabled={
                  !canWrite || savingInvoice || updatingInvoice || isSaving || (id && invoice.status === "issued")
                }
                className="flex-1 min-h-[48px]"
                title={!canWrite ? "You do not have permission to save invoices" : "Save invoice (Ctrl+S)"}
              >
                {savingInvoice || updatingInvoice || isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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
                <h3 className="text-lg font-semibold mb-2">Confirm Final Tax Invoice Creation</h3>
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
                type="button"
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
                type="button"
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
      {showSuccessModal &&
        (() => {
          // Check if this is a Final Tax Invoice (cannot be edited after creation)
          const isFinalTaxInvoice = invoice.status === "issued";
          const canContinueEditing = !isFinalTaxInvoice; // Draft and Proforma can be edited

          return (
            <button
              type="button"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={canContinueEditing ? handleSuccessModalClose : undefined}
              tabIndex={canContinueEditing ? 0 : -1}
              onKeyDown={(e) => canContinueEditing && e.key === "Escape" && handleSuccessModalClose()}
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <div
                className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl relative overflow-hidden ${
                  isDarkMode ? "bg-gray-900" : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                {/* Success Header with Gradient */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white/20 rounded-full p-3">
                      <svg
                        aria-label="icon"
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Icon</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Invoice Created!</h3>
                      <p className="text-emerald-100 text-sm mt-0.5">
                        {isFinalTaxInvoice
                          ? `Final Tax Invoice ${invoice.invoiceNumber || ""}`
                          : invoice.status === "proforma"
                            ? "Proforma Invoice"
                            : "Draft saved"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close button - only show for Draft/Proforma */}
                {canContinueEditing && (
                  <button
                    type="button"
                    onClick={handleSuccessModalClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}

                {/* Action Buttons */}
                <div className="p-6 space-y-3">
                  <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    What would you like to do next?
                  </p>

                  {/* Download PDF Button */}
                  <button
                    type="button"
                    onClick={handleSuccessDownloadPDF}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                  >
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Download size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Download PDF</div>
                      <div className="text-xs text-teal-100">Save invoice to your device</div>
                    </div>
                  </button>

                  {/* Record Payment Button - Only for Final Tax Invoice */}
                  {isFinalTaxInvoice && (
                    <button
                      type="button"
                      onClick={handleSuccessRecordPayment}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                    >
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Banknote size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Record Payment</div>
                        <div className="text-xs text-amber-100">Record advance or full payment</div>
                      </div>
                    </button>
                  )}

                  {/* Go to Invoice List Button */}
                  <button
                    type="button"
                    onClick={handleSuccessGoToList}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all border ${
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                      <List size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Go to Invoice List</div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        View all invoices
                      </div>
                    </div>
                  </button>
                </div>

                {/* Continue editing hint - only show for Draft/Proforma */}
                {canContinueEditing && (
                  <div className={`px-6 pb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    <p className="text-xs text-center">Press ESC or click outside to continue editing</p>
                  </div>
                )}
              </div>
            </button>
          );
        })()}

      {/* Phase 4: Removed drop-ship popup modals - now using inline SourceTypeSelector dropdown */}

      {/* Dropship PO Creation Modal */}
      {dropshipPOModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Create Dropship PO</h3>
              <button
                type="button"
                onClick={() => setDropshipPOModal({ open: false, itemIndex: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dropshipPOModal.itemIndex !== null && invoice.items[dropshipPOModal.itemIndex] && (
              <div className={`text-sm mb-4 p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="font-medium">{invoice.items[dropshipPOModal.itemIndex].name}</div>
                <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Qty: {invoice.items[dropshipPOModal.itemIndex].quantity} | Rate:{" "}
                  {formatCurrency(invoice.items[dropshipPOModal.itemIndex].rate)}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="dropship-supplier-select"
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Select Supplier
              </label>
              <select
                id="dropship-supplier-select"
                className={`w-full px-3 py-2 rounded border text-sm ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
                value={dropshipSelectedSupplier?.id || ""}
                onChange={(e) => {
                  const supplier = dropshipSuppliers.find((s) => s.id === parseInt(e.target.value, 10));
                  setDropshipSelectedSupplier(supplier || null);
                }}
              >
                <option value="">-- Select a supplier --</option>
                {dropshipSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.company || `Supplier #${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={`px-4 py-2 text-sm rounded ${
                  isDarkMode
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setDropshipPOModal({ open: false, itemIndex: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                disabled={!dropshipSelectedSupplier || creatingDropshipPO}
                onClick={handleCreateDropshipPO}
              >
                {creatingDropshipPO ? "Creating..." : "Create Dropship PO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Issued Invoice Saves */}
      <LoadingOverlay
        show={isSaving && invoice.status === "issued"}
        message="Saving invoice..."
        detail="Updating inventory and generating records"
      />

      {/* Phase 1.1 UX: Charges & Discount Drawer */}
      <ChargesDrawer
        isOpen={showChargesDrawer}
        onClose={() => setShowChargesDrawer(false)}
        isDarkMode={isDarkMode}
        invoice={invoice}
        setInvoice={setInvoice}
        formatCurrency={formatCurrency}
        computedSubtotal={computedSubtotal}
        showFreightCharges={showFreightCharges}
        setShowFreightCharges={setShowFreightCharges}
        Input={Input}
        Select={FormSelect}
        VatHelpIcon={VatHelpIcon}
      />

      {/* Phase 1.1 UX: Notes & Terms Drawer */}
      <NotesDrawer
        isOpen={showNotesDrawer}
        onClose={() => setShowNotesDrawer(false)}
        isDarkMode={isDarkMode}
        invoice={invoice}
        setInvoice={setInvoice}
        Textarea={Textarea}
        VatHelpIcon={VatHelpIcon}
      />

      {/* Add Product Drawer */}
      <AddProductDrawer
        isOpen={showAddProductDrawer}
        onClose={() => setShowAddProductDrawer(false)}
        isDarkMode={isDarkMode}
        draftInvoiceId={typeof invoice.id === "number" ? invoice.id : null}
        warehouseId={invoice.warehouseId ? parseInt(invoice.warehouseId, 10) : warehouses[0]?.id || 1}
        companyId={company?.id}
        customerId={invoice.customer?.id || null} // NEW - for pricing
        priceListId={selectedPricelistId || null} // NEW - for pricing
        onAddLineItem={handleAddLineItem}
      />

      {/* Phase 13: Invoice Pricing Validation Modal */}
      {validationModal.open && (
        <InvoiceValidationPanel
          isOpen={validationModal.open}
          onClose={() => setValidationModal({ open: false, criticalIssues: [], warnings: [] })}
          criticalIssues={validationModal.criticalIssues}
          warnings={validationModal.warnings}
          isDarkMode={isDarkMode}
          onProceed={handleValidationProceed}
          isLoading={isSaving}
        />
      )}

      {/* Issue Final Tax Invoice Confirmation Dialog */}
      {issueConfirm.open && (
        <ConfirmDialog
          title="Issue Final Tax Invoice?"
          message="WARNING: Once issued, this invoice cannot be modified. Any corrections must be made via Credit Note. This action cannot be undone. Are you sure you want to proceed?"
          variant="danger"
          onConfirm={() => {
            confirmIssueInvoice();
            setIssueConfirm({ open: false });
          }}
          onCancel={() => setIssueConfirm({ open: false })}
        />
      )}

      {/* Delete Line Item Confirmation Dialog */}
      {deleteLineItemConfirm.open && (
        <ConfirmDialog
          title="Delete Line Item?"
          message={`Delete "${deleteLineItemConfirm.itemName}"?`}
          variant="danger"
          onConfirm={() => {
            confirmDeleteLineItem();
            setDeleteLineItemConfirm({
              open: false,
              itemId: null,
              itemName: null,
              tempId: null,
            });
          }}
          onCancel={() =>
            setDeleteLineItemConfirm({
              open: false,
              itemId: null,
              itemName: null,
              tempId: null,
            })
          }
        />
      )}

      {/* Correction Guide Modal */}
      <CorrectionHelpModal
        open={showCorrectionGuide}
        onOpenChange={setShowCorrectionGuide}
        config={invoiceCorrectionConfig}
        onNavigate={(url) => {
          setShowCorrectionGuide(false);
          navigate(url);
        }}
      />
    </>
  );
};

// Wrap with error boundary to prevent full app crash
const InvoiceFormWithErrorBoundary = (props) => (
  <FormErrorBoundaryWithTheme formName="Invoice Form">
    <InvoiceForm {...props} />
  </FormErrorBoundaryWithTheme>
);

export default InvoiceFormWithErrorBoundary;
