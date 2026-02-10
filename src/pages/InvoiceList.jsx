import {
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Lock,
  MoreVertical,
  Package,
  Phone,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import DeleteInvoiceModal from "../components/DeleteInvoiceModal";
import InvoicePreview from "../components/InvoicePreview";
import InvoiceStatusColumn from "../components/InvoiceStatusColumn";
import PaymentReminderModal from "../components/PaymentReminderModal";
import PaymentDrawer from "../components/payments/PaymentDrawer";
import { isNewRecord } from "../components/shared/NewBadge";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { useInvoicePresence } from "../hooks/useInvoicePresence";
import { companyService } from "../services";
import { authService } from "../services/axiosAuthService";
import { commissionService } from "../services/commissionService";
import { invoiceService } from "../services/dataService";
import { notificationService } from "../services/notificationService";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { supplierService } from "../services/supplierService";
import { guardInvoicesDev } from "../utils/devGuards";
import { normalizeInvoices } from "../utils/invoiceNormalizer";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { generatePaymentReceipt, printPaymentReceipt } from "../utils/paymentReceiptGenerator";
import { PAYMENT_MODES } from "../utils/paymentUtils";
import { generatePaymentReminder, getInvoiceReminderInfo } from "../utils/reminderUtils";
import { uuid } from "../utils/uuid";
import { getInvoiceActionButtonConfig } from "./invoiceActionsConfig";

/**
 * Void payment reasons for the dropdown
 */
const VOID_REASONS = [
  { value: "cheque_bounced", label: "Cheque bounced" },
  { value: "duplicate_entry", label: "Duplicate entry" },
  { value: "wrong_amount", label: "Wrong amount" },
  { value: "wrong_invoice", label: "Wrong invoice" },
  { value: "customer_refund", label: "Customer refund" },
  { value: "payment_cancelled", label: "Payment cancelled" },
  { value: "data_entry_error", label: "Data entry error" },
  { value: "other", label: "Other" },
];

/**
 * ============================================================================
 * DEV-ONLY DEBUG AND INVARIANT HELPERS
 * ============================================================================
 * These functions help catch schema drift and logic inconsistencies early.
 * All are guarded by NODE_ENV checks - zero production impact.
 */

/**
 * DEV-ONLY: Log invoice state snapshot for debugging
 * @param {Object} invoice - Invoice object
 * @param {Object} permissions - Computed permissions object
 * @param {Object} deliveryNoteStatus - Delivery note status state
 */
const debugInvoiceRow = (_invoice, _permissions, _deliveryNoteStatus) => {
  if (process.env.NODE_ENV === "production") return;
};

/**
 * DEV-ONLY: Assert icon enable/disable logic matches spec
 * @param {string} iconKey - Icon identifier
 * @param {boolean} enabled - Whether icon is enabled
 * @param {Object} invoice - Invoice object
 */
const assertIconInvariants = (iconKey, enabled, invoice) => {
  if (process.env.NODE_ENV === "production") return;

  const isDeleted = invoice.deletedAt !== null;
  const paymentStatus = invoice.paymentStatus || "unpaid";

  switch (iconKey) {
    case "edit": {
      // Spec: Edit disabled for issued/deleted invoices EXCEPT within 24h edit window
      // Check if within 24-hour edit window for issued invoices
      const isIssuedStatus = ["issued", "sent"].includes(invoice.status);
      const issuedAt = invoice.issuedAt ? new Date(invoice.issuedAt) : null;
      const hoursSinceIssued = issuedAt ? (Date.now() - issuedAt) / (1000 * 60 * 60) : Infinity;
      const withinEditWindow = hoursSinceIssued < 24;

      // Only warn if edit is enabled for issued/deleted invoice AND NOT within edit window
      if (enabled && isDeleted) {
        console.error("SCHEMA_MISMATCH[ICON:EDIT]: Edit enabled for deleted invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          isDeleted,
        });
      }
      if (enabled && isIssuedStatus && !withinEditWindow) {
        console.error("SCHEMA_MISMATCH[ICON:EDIT]: Edit enabled for issued invoice past 24h window", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          hoursSinceIssued: hoursSinceIssued.toFixed(1),
        });
      }
      break;
    }

    case "creditNote":
      // Spec: Credit Note ONLY for issued invoices
      if (enabled && invoice.status !== "issued") {
        console.error("SCHEMA_MISMATCH[ICON:CREDIT_NOTE]: Credit Note enabled for non-issued invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
        });
      }
      if (enabled && isDeleted) {
        console.error("SCHEMA_MISMATCH[ICON:CREDIT_NOTE]: Credit Note enabled for deleted invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
      }
      break;

    case "commission":
      // Spec: Commission ONLY for paid invoices with salesAgentId and not deleted
      if (enabled && paymentStatus !== "paid") {
        console.error("SCHEMA_MISMATCH[ICON:COMMISSION]: Commission enabled for non-paid invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          paymentStatus,
        });
      }
      if (enabled && !invoice.salesAgentId) {
        console.error("SCHEMA_MISMATCH[ICON:COMMISSION]: Commission enabled without salesAgentId", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          salesAgentId: invoice.salesAgentId,
        });
      }
      if (enabled && isDeleted) {
        console.error("SCHEMA_MISMATCH[ICON:COMMISSION]: Commission enabled for deleted invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
      }
      break;

    case "reminder":
      // Spec: Reminder ONLY for issued + unpaid/partially_paid
      if (enabled && invoice.status !== "issued") {
        console.error("SCHEMA_MISMATCH[ICON:REMINDER]: Reminder enabled for non-issued invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
        });
      }
      if (enabled && (paymentStatus === "paid" || paymentStatus === "fully_paid")) {
        console.error("SCHEMA_MISMATCH[ICON:REMINDER]: Reminder enabled for paid invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          paymentStatus,
        });
      }
      break;

    case "deliveryNote":
      // Spec: Delivery Note ONLY for issued invoices
      if (enabled && invoice.status !== "issued") {
        console.error("SCHEMA_MISMATCH[ICON:DELIVERY_NOTE]: Delivery Note enabled for non-issued invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
        });
      }
      break;

    case "delete":
      // Spec: Delete disabled for already deleted invoices
      if (enabled && isDeleted) {
        console.error("SCHEMA_MISMATCH[ICON:DELETE]: Delete enabled for already deleted invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
      }
      break;

    case "restore":
      // Spec: Restore only for deleted invoices
      if (enabled && !isDeleted) {
        console.error("SCHEMA_MISMATCH[ICON:RESTORE]: Restore enabled for non-deleted invoice", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
      }
      break;

    default:
      // No invariants for other icons (view, download, recordPayment, phone, statement)
      break;
  }
};

/**
 * DEV-ONLY: Assert payment state consistency
 * @param {Object} invoice - Invoice object
 */
const assertPaymentConsistency = (invoice) => {
  if (process.env.NODE_ENV === "production") return;

  const paymentStatus = invoice.paymentStatus || "unpaid";
  const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.outstanding;

  // Paid invoices should have zero or near-zero balance
  if ((paymentStatus === "paid" || paymentStatus === "fully_paid") && balanceDue > 0.01) {
    console.error("SCHEMA_MISMATCH[PAYMENT]: Paid invoice has positive balanceDue", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentStatus,
      balanceDue,
      outstanding: invoice.outstanding,
    });
  }

  // Unpaid invoices should have positive balance
  if (paymentStatus === "unpaid" && balanceDue <= 0 && invoice.total > 0) {
    console.error("SCHEMA_MISMATCH[PAYMENT]: Unpaid invoice has zero/negative balanceDue", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentStatus,
      balanceDue,
      total: invoice.total,
    });
  }

  // Partially paid should have 0 < balance < total
  if (paymentStatus === "partially_paid") {
    if (balanceDue <= 0) {
      console.error("SCHEMA_MISMATCH[PAYMENT]: Partially paid invoice has zero/negative balanceDue", {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus,
        balanceDue,
      });
    }
    if (balanceDue >= invoice.total) {
      console.error("SCHEMA_MISMATCH[PAYMENT]: Partially paid invoice balanceDue >= total", {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus,
        balanceDue,
        total: invoice.total,
      });
    }
  }
};

const InvoiceList = ({ defaultStatusFilter = "all" }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Set theme for notification service
  React.useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);
  // STATE: Primary invoice data and loading state
  /** @type {[import('../types/invoice').Invoice[], Function]} */
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);

  // STATE: Loading and summary data
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Page size: default 10, max 30, persisted in sessionStorage
  const [pageSize, setPageSize] = useState(() => {
    const stored = sessionStorage.getItem("invoiceListPageSize");
    if (stored) {
      const parsed = parseInt(stored, 10);
      // Normalize to valid options: 10, 20, 30
      if (parsed >= 30) return 30;
      if (parsed >= 20) return 20;
      return 10;
    }
    return 10; // Default
  });
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [sendingReminderIds, setSendingReminderIds] = useState(new Set());
  const [_calculatingCommissionIds, _setCalculatingCommissionIds] = useState(new Set());
  const [_selectedInvoice, _setSelectedInvoice] = useState(null);
  const [deliveryNoteStatus, setDeliveryNoteStatus] = useState({});
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [createdDeliveryNote, _setCreatedDeliveryNote] = useState(null);
  const [searchParams] = useSearchParams();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [activeCardFilter, setActiveCardFilter] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(new Set());
  const [showPaymentReminderModal, setShowPaymentReminderModal] = useState(false);
  const [paymentReminderInvoice, setPaymentReminderInvoice] = useState(null);
  const [showRecordPaymentDrawer, setShowRecordPaymentDrawer] = useState(false);
  const [paymentDrawerInvoice, setPaymentDrawerInvoice] = useState(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Dropship PO chip state
  const [dropshipPOPopover, setDropshipPOPopover] = useState(null); // invoice id with open popover
  const [dropshipPOModal, setDropshipPOModal] = useState({ open: false, invoiceId: null, invoiceNumber: "" });
  const [dropshipModalItems, setDropshipModalItems] = useState([]);
  const [dropshipSuppliers, setDropshipSuppliers] = useState([]);
  const [dropshipSelectedSupplier, setDropshipSelectedSupplier] = useState(null);
  const [creatingDropshipPO, setCreatingDropshipPO] = useState(false);
  const [loadingDropshipItems, setLoadingDropshipItems] = useState(false);
  const dropshipPopoverRef = useRef(null);

  // Void payment dropdown state
  const [voidDropdownPaymentId, setVoidDropdownPaymentId] = useState(null);
  const [voidCustomReason, setVoidCustomReason] = useState("");
  const [isVoidingPayment, setIsVoidingPayment] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [printingReceiptId, setPrintingReceiptId] = useState(null);

  // Presence tracking for payment drawer
  const { otherSessions, updateMode: _updateMode } = useInvoicePresence(
    showRecordPaymentDrawer ? paymentDrawerInvoice?.id : null,
    "payment"
  );

  // Track if we've already processed the openPayment URL param to prevent infinite reopening
  const paymentParamProcessedRef = useRef(false);

  // Company data for invoice preview - fetch real data including logo and template settings
  const [company, setCompany] = useState(null);

  // Fetch company data on mount (required for invoice preview to show logo and correct template)
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const companyData = await companyService.getCompany();
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to fetch company data:", error);
        // Fallback to empty object - InvoicePreview will use DEFAULT_TEMPLATE_SETTINGS
        setCompany({});
      }
    };
    fetchCompany();
  }, []);

  // Process delivery note status from invoice data
  // Enhanced to include firstId and isFullyDelivered for smart navigation
  const processDeliveryNoteStatus = React.useCallback((invoiceList) => {
    const statusMap = {};

    invoiceList.forEach((invoice) => {
      if (invoice.deliveryStatus) {
        statusMap[invoice.id] = {
          hasNotes: invoice.deliveryStatus.hasNotes,
          count: invoice.deliveryStatus.count,
          firstId: invoice.deliveryStatus.firstId || null,
          isFullyDelivered: invoice.deliveryStatus.isFullyDelivered || false,
        };
      } else {
        statusMap[invoice.id] = {
          hasNotes: false,
          count: 0,
          firstId: null,
          isFullyDelivered: false,
        };
      }
    });

    setDeliveryNoteStatus(statusMap);
  }, []);

  // Fetch invoices with pagination and abort controller
  // LOADING PATTERN: setLoading(true) at start, setLoading(false) in finally block
  const fetchInvoices = React.useCallback(
    async (page, limit, search, status, includeDeleted, signal) => {
      try {
        setLoading(true);
        const queryParams = {
          page,
          limit,
          search: search || undefined,
          status: status === "all" ? undefined : status,
          include_deleted: includeDeleted ? "true" : undefined,
        };

        // Remove undefined values
        Object.keys(queryParams).forEach((key) => {
          if (queryParams[key] === undefined) {
            delete queryParams[key];
          }
        });

        // Use invoiceService to get ALL invoices (including draft and proforma)
        const response = await invoiceService.getInvoices(queryParams, signal);

        // Check if request was aborted before updating state
        if (signal?.aborted) {
          return;
        }

        // invoiceService returns { invoices, pagination }
        const invoicesData = response.invoices || response;
        const normalizedInvoices = normalizeInvoices(Array.isArray(invoicesData) ? invoicesData : [], "fetchInvoices");

        // ✅ NEW: Use shared devguard system
        const guardedInvoices = guardInvoicesDev(normalizedInvoices);

        setInvoices(guardedInvoices);

        // Set pagination if available
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination(null);
        }

        // Process delivery note status from invoice data
        processDeliveryNoteStatus(invoicesData);
      } catch (error) {
        // Ignore abort errors
        if (error.name === "AbortError" || error.message === "canceled") {
          return;
        }
        setInvoices([]);
        setPagination(null);
      } finally {
        // END LOADING: Always turn off loading unless request was aborted
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      // Process delivery note status from invoice data
      processDeliveryNoteStatus,
    ]
  );

  // Consolidated effect with debouncing and request cancellation
  // TRIGGERS: Runs when page, filters, or search changes
  // CLEANUP: Aborts pending requests when dependencies change
  useEffect(() => {
    const abortController = new AbortController();

    const timeoutId = setTimeout(
      () => {
        fetchInvoices(currentPage, pageSize, searchTerm, statusFilter, showDeleted, abortController.signal);
      },
      searchTerm ? 500 : 0
    ); // Debounce search by 500ms, others immediately

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchTerm, statusFilter, showDeleted, fetchInvoices]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, paymentStatusFilter, showDeleted]);

  // Initialize search from URL param
  useEffect(() => {
    const q = searchParams.get("search") || "";
    if (q !== searchTerm) {
      setSearchTerm(q);
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, searchTerm]); // searchTerm intentionally omitted - only sync from URL on mount/URL change

  // Auto-open payment drawer when navigating with openPayment query param
  // (e.g., from Create Invoice success modal)
  // Use ref to prevent infinite reopening when closing the drawer
  useEffect(() => {
    const openPaymentId = searchParams.get("openPayment");

    if (openPaymentId && invoices.length > 0 && !paymentParamProcessedRef.current) {
      // Find the invoice in the loaded list
      const invoiceToOpen = invoices.find((inv) => String(inv.id) === String(openPaymentId));

      if (invoiceToOpen) {
        // Mark as processed BEFORE fetching to prevent double-processing
        paymentParamProcessedRef.current = true;

        // Fetch full invoice data (including payments) before opening drawer
        // List view doesn&apos;t include payments array, need to call getInvoice
        invoiceService
          .getInvoice(invoiceToOpen.id)
          .then((fullInvoiceData) => {
            setPaymentDrawerInvoice(fullInvoiceData);
            setShowRecordPaymentDrawer(true);
          })
          .catch((error) => {
            console.error("Error loading invoice for payment drawer:", error);
            notificationService.error("Failed to load invoice details");
            // Reset ref on error so user can try again
            paymentParamProcessedRef.current = false;
          });

        // Clear the query param from URL to prevent re-opening on refresh
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("openPayment");
        const newUrl = newParams.toString()
          ? `${window.location.pathname}?${newParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [searchParams, invoices]);

  // Clear selections when filters or search changes (Gmail behavior)
  useEffect(() => {
    setSelectedInvoiceIds(new Set());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest(".actions-dropdown")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  // Close void payment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (voidDropdownPaymentId && !event.target.closest(".void-dropdown")) {
        setVoidDropdownPaymentId(null);
        setVoidCustomReason("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [voidDropdownPaymentId]);

  // Client-side payment status and card filtering
  // GOLD STANDARD: Use backend-provided payment status instead of calculating
  /** @type {import('../types/invoice').Invoice[]} */
  const filteredInvoices = React.useMemo(() => {
    let filtered = invoices;

    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((invoice) => {
        // Normalize status to handle both 'issued' and 'STATUS_ISSUED' formats
        const normalizedStatus = (invoice.status || "").toLowerCase().replace("status_", "");

        // For "paid" filter, only show ISSUED invoices that are fully paid
        // DRAFT invoices cannot be "fully paid"
        if (paymentStatusFilter === "paid") {
          if (normalizedStatus !== "issued") return false;
          const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase().replace("payment_status_", "");
          return paymentStatus === "paid";
        }

        // For unpaid filter, include DRAFT invoices (they are technically unpaid)
        if (paymentStatusFilter === "unpaid") {
          if (normalizedStatus !== "issued") return true; // DRAFT = unpaid
          const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase().replace("payment_status_", "");
          return paymentStatus === "unpaid";
        }

        // For partially_paid filter, only show ISSUED invoices
        if (paymentStatusFilter === "partially_paid") {
          if (normalizedStatus !== "issued") return false;
          const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase().replace("payment_status_", "");
          return paymentStatus === "partially_paid";
        }

        // Use backend-provided payment status (GOLD STANDARD)
        const paymentStatus = (invoice.paymentStatus || "unpaid").toLowerCase().replace("payment_status_", "");
        return paymentStatus === paymentStatusFilter;
      });
    }

    // Apply card-specific filters
    // Helper for normalization within useMemo scope
    const normStatus = (s) => (s || "").toLowerCase().replace("status_", "");
    const normPayStatus = (ps) => (ps || "unpaid").toLowerCase().replace("payment_status_", "");

    if (activeCardFilter === "outstanding") {
      filtered = filtered.filter((invoice) => {
        if (normStatus(invoice.status) !== "issued") return false;
        const paymentStatus = normPayStatus(invoice.paymentStatus);
        return paymentStatus === "unpaid" || paymentStatus === "partially_paid";
      });
    } else if (activeCardFilter === "overdue") {
      filtered = filtered.filter((invoice) => {
        if (normStatus(invoice.status) !== "issued") return false;
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paymentStatus = normPayStatus(invoice.paymentStatus);
        return dueDate < today && (paymentStatus === "unpaid" || paymentStatus === "partially_paid");
      });
    } else if (activeCardFilter === "due_soon") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 7);

      filtered = filtered.filter((invoice) => {
        if (normStatus(invoice.status) !== "issued") return false;
        const dueDate = new Date(invoice.dueDate);
        const paymentStatus = normPayStatus(invoice.paymentStatus);
        return (
          dueDate >= today &&
          dueDate <= futureDate &&
          (paymentStatus === "unpaid" || paymentStatus === "partially_paid")
        );
      });
    } else if (activeCardFilter === "paid") {
      filtered = filtered.filter((invoice) => {
        if (normStatus(invoice.status) !== "issued") return false;
        return normPayStatus(invoice.paymentStatus) === "paid";
      });
    }

    return filtered;
  }, [invoices, paymentStatusFilter, activeCardFilter]);

  // Selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = new Set(filteredInvoices.map((inv) => inv.id));
      setSelectedInvoiceIds(newSelected);
    } else {
      setSelectedInvoiceIds(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    const newSelected = new Set(selectedInvoiceIds);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoiceIds(newSelected);
  };

  const isAllSelected = filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedInvoiceIds.has(inv.id));

  const isSomeSelected = filteredInvoices.some((inv) => selectedInvoiceIds.has(inv.id)) && !isAllSelected;

  const handlePageChange = (_event, newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    // Clamp to valid options: 10, 20, 30
    const validSize = newSize >= 30 ? 30 : newSize >= 20 ? 20 : 10;
    setPageSize(validSize);
    setCurrentPage(1);
    // Persist to sessionStorage
    sessionStorage.setItem("invoiceListPageSize", validSize.toString());
  };

  // Dashboard metric calculations
  // GOLD STANDARD: Use backend-provided payment data (no client-side calculation)
  // Helper to normalize status/paymentStatus from API format variations
  const normalizeStatus = React.useCallback((status) => (status || "").toLowerCase().replace("status_", ""), []);
  const normalizePaymentStatus = React.useCallback(
    (ps) => (ps || "unpaid").toLowerCase().replace("payment_status_", ""),
    []
  );

  // ============================================================================
  // STALE-WHILE-REVALIDATE: Compute and cache summary data
  // ============================================================================

  // Compute summary metrics from invoices
  const computedSummary = React.useMemo(() => {
    if (invoices.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);

    let outstandingAmount = 0;
    let outstandingCount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let dueSoonCount = 0;
    let dueSoonAmount = 0;
    let paidAmount = 0;
    let paidCount = 0;

    invoices.forEach((invoice) => {
      const status = normalizeStatus(invoice.status);
      if (status !== "issued") return;

      const paymentStatus = normalizePaymentStatus(invoice.paymentStatus);
      const outstanding = Number(invoice.outstanding || 0);
      const total = Number(invoice.total || 0);
      const dueDate = new Date(invoice.dueDate);

      // Paid invoices
      if (paymentStatus === "paid") {
        paidAmount += total;
        paidCount++;
        return;
      }

      // Outstanding (unpaid or partially paid)
      if (paymentStatus === "unpaid" || paymentStatus === "partially_paid") {
        outstandingAmount += outstanding;
        outstandingCount++;

        // Overdue
        if (dueDate < today) {
          overdueCount++;
          overdueAmount += outstanding;
        }
        // Due soon (next 7 days)
        else if (dueDate >= today && dueDate <= futureDate) {
          dueSoonCount++;
          dueSoonAmount += outstanding;
        }
      }
    });

    return {
      outstandingAmount,
      outstandingCount,
      overdueCount,
      overdueAmount,
      dueSoonCount,
      dueSoonAmount,
      paidAmount,
      paidCount,
    };
  }, [invoices, normalizePaymentStatus, normalizeStatus]);

  // Update summary data when computed
  React.useEffect(() => {
    if (computedSummary) {
      setSummaryData(computedSummary);
    }
  }, [computedSummary]);

  // Get effective summary data (fresh or cached)
  const effectiveSummary = computedSummary ||
    summaryData || {
      outstandingAmount: 0,
      outstandingCount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      dueSoonCount: 0,
      dueSoonAmount: 0,
      paidAmount: 0,
      paidCount: 0,
    };

  // Legacy functions now delegate to effectiveSummary for backward compatibility
  const getOutstandingAmount = () => effectiveSummary.outstandingAmount;
  const getOverdueMetrics = () => ({
    count: effectiveSummary.overdueCount,
    amount: effectiveSummary.overdueAmount,
  });
  const getDueSoonMetrics = () => ({
    count: effectiveSummary.dueSoonCount,
    amount: effectiveSummary.dueSoonAmount,
  });
  const getPaidAmount = () => effectiveSummary.paidAmount;

  // Handle dashboard card clicks to filter invoices
  const handleCardClick = (filterType) => {
    if (activeCardFilter === filterType) {
      // Click again to clear filter
      setActiveCardFilter(null);
      setPaymentStatusFilter("all");
      setStatusFilter("all");
    } else {
      setActiveCardFilter(filterType);
      setCurrentPage(1);

      switch (filterType) {
        case "outstanding":
          setStatusFilter("issued");
          setPaymentStatusFilter("all"); // Will be filtered client-side to show unpaid + partially_paid
          break;
        case "overdue":
          // Overdue requires custom logic, we'll handle via paymentStatusFilter
          setStatusFilter("issued");
          setPaymentStatusFilter("all"); // Custom filter needed
          break;
        case "paid":
          setStatusFilter("issued");
          setPaymentStatusFilter("paid");
          break;
        case "due_soon":
          setStatusFilter("issued");
          setPaymentStatusFilter("all"); // Custom filter needed
          break;
        default:
          break;
      }
    }
  };

  // Validate if invoice is complete enough for PDF download
  const validateInvoiceForDownload = (invoice) => {
    const hasCustomer = invoice.customer?.name && invoice.customer.name.trim() !== "";
    // In list view, items array may be empty but itemCount tells us items exist in DB
    const hasItems = (invoice.items && invoice.items.length > 0) || invoice.itemCount > 0;
    const hasValidItems =
      invoice.items && invoice.items.length > 0
        ? invoice.items.every((item) => item.name && item.name.trim() !== "" && item.quantity > 0 && item.rate > 0)
        : invoice.itemCount > 0; // Trust DB items if not loaded
    const hasDate = !!invoice.date;
    const hasDueDate = !!invoice.dueDate;

    return {
      isValid: hasCustomer && hasItems && hasValidItems && hasDate && hasDueDate,
      missing: {
        customer: !hasCustomer,
        items: !hasItems || !hasValidItems,
        date: !hasDate,
        dueDate: !hasDueDate,
      },
    };
  };

  // Helper function to get human-readable missing fields list
  const getMissingFieldsList = (invoice) => {
    const validation = validateInvoiceForDownload(invoice);
    const missingFields = [];

    if (validation.missing.customer) missingFields.push("Customer");
    if (validation.missing.date) missingFields.push("Invoice Date");
    if (validation.missing.dueDate) missingFields.push("Due Date");
    if (validation.missing.items) missingFields.push("Items (with name, quantity, and rate)");

    return missingFields.length > 0 ? `Missing: ${missingFields.join(", ")}` : "Incomplete invoice";
  };

  const handleDownloadPDF = async (invoice) => {
    if (downloadingIds.has(invoice.id)) return;

    // Validate invoice completeness
    const validation = validateInvoiceForDownload(invoice);

    if (!validation.isValid) {
      const missingFields = [];
      if (validation.missing.customer) missingFields.push("Customer");
      if (validation.missing.items) missingFields.push("Items (with name, quantity, and rate)");
      if (validation.missing.date) missingFields.push("Invoice Date");
      if (validation.missing.dueDate) missingFields.push("Due Date");

      const statusLabel = invoice.status === "draft" ? "Draft" : invoice.status === "proforma" ? "Proforma" : "Invoice";

      notificationService.warning(
        `${statusLabel} is incomplete. Missing: ${missingFields.join(", ")}. Please edit and complete all required fields before downloading PDF.`,
        { duration: 6000 }
      );
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(invoice.id));

    try {
      // Use the backend PDF endpoint instead of regenerating
      const { apiClient: pdfClient } = await import("../services/api");
      const response = await pdfClient.get(`/invoices/${invoice.id}/pdf`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notificationService.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download error:", error);
      notificationService.error(error.message || "Failed to download PDF");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleSendReminder = async (invoice) => {
    if (sendingReminderIds.has(invoice.id)) return;

    const reminderInfo = getInvoiceReminderInfo(invoice);
    if (!reminderInfo || !reminderInfo.shouldShowReminder) {
      notificationService.error("No reminder needed for this invoice");
      return;
    }

    setSendingReminderIds((prev) => new Set(prev).add(invoice.id));

    try {
      // Fetch complete invoice details
      const fullInvoice = await invoiceService.getInvoice(invoice.id);
      const result = await generatePaymentReminder(fullInvoice, company);

      if (result.success) {
        notificationService.success(`Payment reminder generated successfully! (${reminderInfo.config.label})`);
      } else {
        notificationService.error(result.error || "Failed to generate reminder");
      }
    } catch (error) {
      console.error("Reminder generation error:", error);
      notificationService.error(error.message || "Failed to generate payment reminder");
    } finally {
      setSendingReminderIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleOpenPaymentReminder = (invoice) => {
    setPaymentReminderInvoice(invoice);
    setShowPaymentReminderModal(true);
  };

  const handleClosePaymentReminder = () => {
    setShowPaymentReminderModal(false);
    setPaymentReminderInvoice(null);
  };

  const handlePaymentReminderSaved = (_reminder) => {
    notificationService.success("Payment reminder note saved successfully!");
    // Refresh invoices to show updated promise indicator
    fetchInvoices(currentPage, pageSize, searchTerm, statusFilter, showDeleted);
  };

  const handleRecordPayment = async (invoice) => {
    try {
      // Get invoice with correct payment data and outstanding balance
      const invoiceData = await invoiceService.getInvoice(invoice.id);

      setPaymentDrawerInvoice(invoiceData);
      setShowRecordPaymentDrawer(true);
    } catch (error) {
      console.error("Error loading invoice details:", error);
      notificationService.error("Failed to load invoice details");
    }
  };

  const handleCloseRecordPaymentDrawer = () => {
    setShowRecordPaymentDrawer(false);
    setPaymentDrawerInvoice(null);
    // Reset void dropdown state
    setVoidDropdownPaymentId(null);
    setVoidCustomReason("");
    // Reset the param processed flag so drawer can be reopened
    paymentParamProcessedRef.current = false;
  };

  const handleDownloadReceipt = async (payment, paymentIndex) => {
    const inv = paymentDrawerInvoice;
    if (!inv) {
      notificationService.error("Unable to generate receipt. Missing invoice information.");
      return;
    }

    const companyInfo = JSON.parse(localStorage.getItem("companySettings") || "{}");

    setDownloadingReceiptId(payment.id);
    try {
      const invoiceData = {
        invoiceNumber: inv.invoiceNo || inv.invoiceNumber,
        total: inv.invoiceAmount || inv.total || 0,
        payments: inv.payments || [],
        customer: inv.customer || {
          name: inv.customer?.name || "",
          id: inv.customer?.id || "",
        },
      };
      const result = await generatePaymentReceipt(payment, invoiceData, companyInfo, paymentIndex);
      if (!result.success) {
        notificationService.error(`Error generating receipt: ${result.error}`);
      } else {
        notificationService.success("Receipt downloaded successfully");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      notificationService.error("Failed to generate receipt. Please try again.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    const inv = paymentDrawerInvoice;
    if (!inv) {
      notificationService.error("Unable to print receipt. Missing invoice information.");
      return;
    }

    const companyInfo = JSON.parse(localStorage.getItem("companySettings") || "{}");

    setPrintingReceiptId(payment.id);
    try {
      const invoiceData = {
        invoiceNumber: inv.invoiceNo || inv.invoiceNumber,
        total: inv.invoiceAmount || inv.total || 0,
        payments: inv.payments || [],
        customer: inv.customer || {
          name: inv.customer?.name || "",
          id: inv.customer?.id || "",
        },
      };
      const result = await printPaymentReceipt(payment, invoiceData, companyInfo, paymentIndex);
      if (!result.success) {
        notificationService.error(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      notificationService.error("Failed to print receipt. Please try again.");
    } finally {
      setPrintingReceiptId(null);
    }
  };

  const handleAddPayment = async (paymentData) => {
    // Guard against double-submit
    if (isSavingPayment) return;

    const inv = paymentDrawerInvoice;
    if (!inv) return;
    const outstanding = Number(inv.outstanding || 0);

    // Extract amount - shared AddPaymentForm sends just 'amount'
    const amount = paymentData.amount;
    if (!(Number(amount) > 0)) {
      notificationService.error("Amount must be greater than 0");
      return;
    }
    if (Number(amount) > outstanding) {
      notificationService.error("Amount exceeds outstanding balance");
      return;
    }

    setIsSavingPayment(true);

    // Accept both camelCase (from shared AddPaymentForm) and snake_case (legacy)
    // Shared AddPaymentForm outputs: { amount, method, paymentMethod, referenceNo, referenceNumber, notes, paymentDate }
    const method = paymentData.method || paymentData.paymentMethod;
    const referenceNo = paymentData.referenceNo || paymentData.referenceNumber || paymentData.reference_no;
    const notes = paymentData.notes;
    const paymentDate = paymentData.paymentDate || paymentData.payment_date || new Date().toISOString().slice(0, 10);

    // Normalize to camelCase for API Gateway (which converts to snake_case for backend)
    const paymentPayload = {
      paymentDate,
      amount: Number(amount),
      method,
      referenceNo,
      notes,
    };

    // Optimistic UI update (frontend state uses snake_case from backend)
    const newPayment = {
      id: uuid(),
      payment_date: paymentDate,
      amount: Number(amount),
      method,
      reference_no: referenceNo,
      notes,
      created_at: new Date().toISOString(),
    };

    const updatedPayments = [...(inv.payments || []), newPayment];
    const received = (inv.received || 0) + newPayment.amount;
    const newOutstanding = Math.max(0, +(outstanding - newPayment.amount).toFixed(2));

    // Calculate payment_status (not invoice status)
    let payment_status = "unpaid";
    if (newOutstanding === 0) payment_status = "paid";
    else if (newOutstanding < (inv.invoiceAmount || 0)) payment_status = "partially_paid";

    const updatedInv = {
      ...inv,
      payments: updatedPayments,
      received,
      outstanding: newOutstanding,
      payment_status,
    };

    // Update drawer immediately
    setPaymentDrawerInvoice(updatedInv);

    try {
      // Save to backend using invoiceService (send camelCase, API Gateway converts)
      await invoiceService.addInvoicePayment(inv.id, paymentPayload);

      notificationService.success("Payment recorded successfully!");

      // Fetch fresh drawer data to show backend-generated receipt number
      const freshData = await invoiceService.getInvoice(inv.id);
      setPaymentDrawerInvoice(freshData);

      // Update the specific invoice in the list (in-place update without re-fetching entire list)
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice.id === inv.id
            ? {
                ...invoice,
                payment_status: freshData.payment_status,
                received: freshData.received,
                outstanding: freshData.outstanding,
                balance_due: freshData.outstanding,
              }
            : invoice
        )
      );

      // Auto-calculate commission if invoice is now fully paid and has a sales agent
      if (payment_status === "paid" && inv.salesAgentId) {
        try {
          await commissionService.calculateCommission(inv.id);
          notificationService.success("Commission calculated automatically");
        } catch (commError) {
          console.error("Error auto-calculating commission:", commError);
          // Don't show error to user - commission can be calculated manually later
        }
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      notificationService.error(error?.response?.data?.error || "Failed to record payment");

      // Reload drawer on error to get correct state
      try {
        const freshData = await invoiceService.getInvoice(inv.id);
        setPaymentDrawerInvoice(freshData);
      } catch (e) {
        console.error("Error reloading invoice:", e);
      }
    } finally {
      setIsSavingPayment(false);
    }
  };

  /**
   * Void a specific payment with a reason
   * @param {string|number} paymentId - The payment ID to void
   * @param {string} reason - The void reason (from VOID_REASONS or custom)
   */
  const handleVoidPayment = async (paymentId, reason) => {
    const inv = paymentDrawerInvoice;
    if (!inv || !paymentId || !reason) return;

    // Find the payment to void
    const paymentToVoid = (inv.payments || []).find((p) => p.id === paymentId);
    if (!paymentToVoid || paymentToVoid.voided) return;

    setIsVoidingPayment(true);

    // Get the current user for audit trail
    const currentUser = authService.getCurrentUser();
    const voidedBy = currentUser?.name || currentUser?.email || "User";

    // Optimistic UI update
    const updatedPayments = inv.payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            voided: true,
            voided_at: new Date().toISOString(),
            void_reason: reason,
            voided_by: voidedBy,
          }
        : p
    );
    const received = updatedPayments.filter((p) => !p.voided).reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, +((inv.invoiceAmount || inv.total || 0) - received).toFixed(2));
    let payment_status = "unpaid";
    if (outstanding === 0) payment_status = "paid";
    else if (outstanding < (inv.invoiceAmount || inv.total || 0)) payment_status = "partially_paid";

    const updatedInv = {
      ...inv,
      payments: updatedPayments,
      received,
      outstanding,
      payment_status,
    };

    setPaymentDrawerInvoice(updatedInv);

    try {
      await invoiceService.voidInvoicePayment(inv.id, paymentId, reason);

      notificationService.success("Payment voided successfully");

      // Fetch fresh drawer data
      const freshData = await invoiceService.getInvoice(inv.id);
      setPaymentDrawerInvoice(freshData);

      // Update the specific invoice in the list (in-place update without re-fetching entire list)
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice.id === inv.id
            ? {
                ...invoice,
                payment_status: freshData.payment_status || freshData.paymentStatus,
                paymentStatus: freshData.payment_status || freshData.paymentStatus,
                received: freshData.received,
                outstanding: freshData.outstanding,
                balance_due: freshData.outstanding,
                balanceDue: freshData.outstanding,
              }
            : invoice
        )
      );

      // Close dropdown and reset state
      setVoidDropdownPaymentId(null);
      setVoidCustomReason("");
    } catch (error) {
      console.error("Error voiding payment:", error);
      notificationService.error(error?.response?.data?.error || "Failed to void payment");

      // Reload drawer on error
      try {
        const freshData = await invoiceService.getInvoice(inv.id);
        setPaymentDrawerInvoice(freshData);
      } catch (e) {
        console.error("Error reloading invoice:", e);
      }
    } finally {
      setIsVoidingPayment(false);
    }
  };

  /**
   * Handle submitting a custom void reason
   */
  const handleSubmitCustomVoidReason = (paymentId) => {
    if (voidCustomReason.trim()) {
      handleVoidPayment(paymentId, voidCustomReason.trim());
    }
  };

  const handleBulkDownload = async (selectedIds = null) => {
    // Determine which invoices to download
    const invoicesToDownload = selectedIds
      ? filteredInvoices.filter((inv) => selectedIds.has(inv.id))
      : filteredInvoices;

    if (invoicesToDownload.length === 0) {
      notificationService.error("No invoices selected for download");
      return;
    }

    // Validate all invoices first and separate complete from incomplete
    const validInvoices = [];
    const invalidInvoices = [];

    invoicesToDownload.forEach((invoice) => {
      const validation = validateInvoiceForDownload(invoice);
      if (validation.isValid) {
        validInvoices.push(invoice);
      } else {
        invalidInvoices.push(invoice);
      }
    });

    // If there are invalid invoices, show warning
    if (invalidInvoices.length > 0) {
      const invalidNumbers = invalidInvoices.map((inv) => inv.invoiceNumber).join(", ");

      if (invalidInvoices.length === invoicesToDownload.length) {
        const message = `All selected invoices are incomplete and cannot be downloaded. Please edit and complete them first: ${invalidNumbers}`;
        notificationService.warning(message, { duration: 8000 });
        return;
      }

      const confirmed = await confirm({
        title: "Some Invoices Incomplete",
        message: `${invalidInvoices.length} incomplete invoice${invalidInvoices.length > 1 ? "s" : ""} will be skipped: ${invalidNumbers}\n\nProceed with downloading ${validInvoices.length} complete invoice${validInvoices.length > 1 ? "s" : ""}?`,
        confirmText: `Download ${validInvoices.length}`,
        variant: "warning",
      });
      if (!confirmed) return;
    } else {
      const message = selectedIds
        ? `Download PDFs for ${validInvoices.length} selected invoice${validInvoices.length !== 1 ? "s" : ""}?`
        : `Download PDFs for all ${validInvoices.length} invoice${validInvoices.length !== 1 ? "s" : ""} on this page?`;

      const confirmed = await confirm({
        title: "Download PDFs",
        message,
        confirmText: "Download",
        variant: "info",
      });
      if (!confirmed) return;
    }

    let successCount = 0;
    let failCount = 0;

    // Import apiClient for PDF downloads
    const { apiClient: bulkPdfClient } = await import("../services/api");

    for (const invoice of validInvoices) {
      try {
        // Use backend PDF endpoint
        const response = await bulkPdfClient.get(`/invoices/${invoice.id}/pdf`, {
          responseType: "blob",
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        successCount++;
        // Add a small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${invoice.invoiceNumber}:`, error);
        failCount++;
      }
    }

    // Clear selection after bulk download
    if (selectedIds) {
      setSelectedInvoiceIds(new Set());
    }

    if (failCount === 0) {
      notificationService.success(
        `Downloaded ${successCount} invoice PDF${successCount !== 1 ? "s" : ""} successfully!`
      );
    } else {
      notificationService.warning(
        `Downloaded ${successCount} PDF${successCount !== 1 ? "s" : ""}. ${failCount} failed.`
      );
    }
  };

  /**
   * Smart Delivery Note Navigation
   * - No DN: Navigate to create form with invoice pre-selected
   * - 1 DN: Navigate directly to that DN details
   * - Multiple DNs: Navigate to filtered list
   */
  const handleDeliveryNoteClick = (invoice, actions) => {
    if (actions.deliveryNote.hasNotes) {
      if (actions.deliveryNote.count === 1 && actions.deliveryNote.firstId) {
        // Single DN - navigate directly to it
        navigate(`/app/delivery-notes/${actions.deliveryNote.firstId}`);
      } else {
        // Multiple DNs - show filtered list
        navigate(`/app/delivery-notes?invoiceId=${invoice.id}`);
      }
    } else {
      // No DN - navigate to create form with invoice pre-selected
      navigate("/app/delivery-notes/new", {
        state: { selectedInvoiceId: invoice.id },
      });
    }
  };

  const handleDeleteInvoice = (invoice) => {
    // Open modal to collect deletion reason
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (deleteData) => {
    try {
      await invoiceService.deleteInvoice(deleteData.invoiceId, {
        reason: deleteData.reason,
        reasonCode: deleteData.reasonCode,
      });
      notificationService.success("Invoice deleted successfully (soft delete with audit trail)");

      // Close modal
      setShowDeleteModal(false);
      setInvoiceToDelete(null);

      // Refresh invoice list
      // If the last item on the page was deleted, optionally go back one page
      const remaining = (invoices?.length || 1) - 1;
      if (remaining === 0 && pagination && currentPage > 1) {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else {
        await fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      notificationService.error(error?.response?.data?.error || "Failed to delete invoice");
      throw error; // Re-throw so modal can handle loading state
    }
  };

  const handleRestoreInvoice = async (invoice) => {
    const number = invoice.invoiceNumber || invoice.id;
    const confirmed = await confirm({
      title: "Restore Invoice",
      message: `Restore invoice ${number}?\n\nThis will undelete the invoice and make it active again.`,
      confirmText: "Restore",
      variant: "info",
    });
    if (!confirmed) return;

    try {
      await invoiceService.restoreInvoice(invoice.id);
      notificationService.success("Invoice restored successfully");
      await fetchInvoices();
    } catch (error) {
      console.error("Error restoring invoice:", error);
      notificationService.error(error?.response?.data?.error || "Failed to restore invoice");
    }
  };

  // Helper function to get action button configurations
  const getActionButtonConfig = (invoice) => {
    // Gather all permissions from authService
    const canUpdate = authService.hasPermission("invoices", "update");
    const canDelete = authService.hasPermission("invoices", "delete");
    const canRead = authService.hasPermission("invoices", "read");
    const canCreateCreditNote = authService.hasPermission("invoices", "update");
    const canReadCustomers = authService.hasPermission("customers", "read");
    const canReadDeliveryNotes = authService.hasPermission("delivery_notes", "read");
    const canCreateDeliveryNotes = authService.hasPermission("delivery_notes", "create");

    const permissions = {
      canUpdate,
      canDelete,
      canRead,
      canCreateCreditNote,
      canReadCustomers,
      canReadDeliveryNotes,
      canCreateDeliveryNotes,
    };

    // DEV-ONLY: Debug logging and payment consistency check
    if (process.env.NODE_ENV !== "production") {
      debugInvoiceRow(invoice, permissions, deliveryNoteStatus);
      assertPaymentConsistency(invoice);
    }

    // Call shared pure function to compute action states
    const actions = getInvoiceActionButtonConfig(
      invoice,
      permissions,
      deliveryNoteStatus,
      getInvoiceReminderInfo,
      validateInvoiceForDownload
    );

    // DEV-ONLY: Assert icon invariants
    if (process.env.NODE_ENV !== "production") {
      Object.entries(actions).forEach(([key, cfg]) => {
        assertIconInvariants(key, cfg.enabled, invoice);
      });
    }

    return actions;
  };

  // --- Dropship PO Chip handlers ---

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropshipPopoverRef.current && !dropshipPopoverRef.current.contains(e.target)) {
        setDropshipPOPopover(null);
      }
    };
    if (dropshipPOPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropshipPOPopover]);

  const handleOpenDropshipPOModal = async (invoice) => {
    setDropshipPOModal({ open: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
    setDropshipSelectedSupplier(null);
    setLoadingDropshipItems(true);
    try {
      // Fetch full invoice to get item details
      const [fullInvoice, suppliersResult] = await Promise.all([
        invoiceService.getInvoice(invoice.id),
        supplierService.getSuppliers({ limit: 200 }),
      ]);
      // Filter to dropship items without linked PO
      const unlinkedItems = (fullInvoice.items || []).filter(
        (item) =>
          (item.sourceType === "LOCAL_DROP_SHIP" || item.sourceType === "IMPORT_DROP_SHIP") && !item.linkedPoItemId
      );
      setDropshipModalItems(unlinkedItems);
      setDropshipSuppliers(suppliersResult.suppliers || []);
    } catch {
      setDropshipModalItems([]);
      setDropshipSuppliers([]);
      notificationService.error("Failed to load dropship items");
    } finally {
      setLoadingDropshipItems(false);
    }
  };

  const handleCreateDropshipPOFromList = async () => {
    if (!dropshipSelectedSupplier || dropshipModalItems.length === 0) return;
    setCreatingDropshipPO(true);
    try {
      const result = await purchaseOrderService.createDropshipPO({
        invoiceId: dropshipPOModal.invoiceId,
        itemIds: dropshipModalItems.map((item) => item.id),
        supplierId: dropshipSelectedSupplier.id,
        supplierDetails: {
          id: dropshipSelectedSupplier.id,
          name: dropshipSelectedSupplier.name || dropshipSelectedSupplier.company,
        },
      });
      notificationService.success(`Dropship PO ${result.po_number || result.poNumber} created successfully`);
      setDropshipPOModal({ open: false, invoiceId: null, invoiceNumber: "" });
      // Refresh invoice list to update PO chips
      fetchInvoices(currentPage, pageSize, searchTerm, statusFilter, showDeleted);
    } catch (err) {
      notificationService.error(err.message || "Failed to create dropship PO");
    } finally {
      setCreatingDropshipPO(false);
    }
  };

  const handleDropshipChipClick = (e, invoice) => {
    e.stopPropagation();
    const hasPOs = invoice.dropshipPOs && invoice.dropshipPOs.length > 0;
    const needsPO = invoice.dropshipItemsNeedingPO > 0;

    if (!hasPOs && needsPO) {
      // No POs yet — open create modal
      handleOpenDropshipPOModal(invoice);
    } else if (hasPOs && invoice.dropshipPOs.length === 1 && !needsPO) {
      // Single PO, all linked — navigate directly
      navigate(`/app/purchase-orders/${invoice.dropshipPOs[0].id}/edit`);
    } else {
      // Multiple POs or partial — toggle popover
      setDropshipPOPopover(dropshipPOPopover === invoice.id ? null : invoice.id);
    }
  };

  // Render the PO chip for an invoice row
  const renderDropshipPOChip = (invoice) => {
    const itemCount = invoice.dropshipItemCount || 0;
    if (itemCount === 0) return null; // No dropship items — no chip

    const pos = invoice.dropshipPOs || [];
    const needsPO = invoice.dropshipItemsNeedingPO || 0;
    const poCount = pos.length;
    const isPartial = poCount > 0 && needsPO > 0;
    const allLinked = poCount > 0 && needsPO === 0;
    const noneLinked = poCount === 0 && needsPO > 0;

    // Chip colors
    const chipClass = allLinked
      ? isDarkMode
        ? "bg-purple-900/50 text-purple-300 border-purple-700"
        : "bg-purple-50 text-purple-700 border-purple-200"
      : isDarkMode
        ? "bg-orange-900/50 text-orange-300 border-orange-700"
        : "bg-orange-50 text-orange-700 border-orange-200";

    const iconColor = allLinked ? "text-purple-500" : "text-orange-500";

    return (
      <span className="relative inline-flex items-center">
        <button
          type="button"
          onClick={(e) => handleDropshipChipClick(e, invoice)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded border cursor-pointer hover:opacity-80 transition-opacity ${chipClass}`}
          title={
            noneLinked
              ? `${needsPO} dropship item(s) need PO — Click to create`
              : isPartial
                ? `${poCount} PO(s) linked, ${needsPO} item(s) still need PO`
                : poCount === 1
                  ? `View ${pos[0].poNumber}`
                  : `${poCount} Dropship POs linked`
          }
        >
          <Package className={`w-3 h-3 ${iconColor}`} />
          <span>PO</span>
          {poCount > 1 && <span className="font-bold">{poCount}</span>}
          {(noneLinked || isPartial) && <span className="text-orange-500 font-bold">!</span>}
        </button>

        {/* Popover for multiple POs or partial state */}
        {dropshipPOPopover === invoice.id && (
          <div
            ref={dropshipPopoverRef}
            role="menu"
            className={`absolute left-0 top-full mt-1 z-50 w-64 rounded-lg shadow-lg border p-3 ${
              isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && setDropshipPOPopover(null)}
          >
            <div className={`text-xs font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Linked Purchase Orders
            </div>
            {pos.map((po) => (
              <Link
                key={po.id}
                to={`/app/purchase-orders/${po.id}/edit`}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-opacity-80 transition-colors ${
                  isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"
                }`}
                onClick={() => setDropshipPOPopover(null)}
              >
                <span className="font-medium">{po.poNumber}</span>
                <span className="flex items-center gap-1">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      po.status === "confirmed" || po.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : po.status === "draft"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {po.status}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
              </Link>
            ))}
            {needsPO > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropshipPOPopover(null);
                  handleOpenDropshipPOModal(invoice);
                }}
                className="mt-2 w-full text-xs text-center py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
              >
                Create PO for {needsPO} remaining item(s)
              </button>
            )}
          </div>
        )}
      </span>
    );
  };

  const handleViewInvoice = async (invoice) => {
    try {
      // Fetch complete invoice details including items
      const fullInvoice = await invoiceService.getInvoice(invoice.id);
      setPreviewInvoice(fullInvoice);
      setShowPreviewModal(true);

      // If company data not loaded yet, fetch it now
      // This ensures preview shows correct logo and template settings
      if (!company) {
        try {
          const companyData = await companyService.getCompany();
          setCompany(companyData);
        } catch (companyError) {
          console.warn("Failed to fetch company data for preview:", companyError);
          // Continue showing preview with defaults
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      notificationService.error("Failed to load invoice details");
    }
  };

  // SPINNER LOGIC: Show spinner ONLY when loading is true
  // Once loading is false, always show the invoice list (even if empty)
  if (loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading invoices...</span>
        </div>
      </div>
    );
  }

  // Delivery Note Preview Modal
  const DeliveryNoteModal = () => {
    if (!showDeliveryModal || !createdDeliveryNote) return null;
    const dn = createdDeliveryNote;
    const items = Array.isArray(dn.items) ? dn.items : [];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div
          className={`w-full max-w-3xl rounded-2xl border ${isDarkMode ? "bg-[#1E2328] border-[#37474F] text-white" : "bg-white border-[#E0E0E0] text-gray-900"}`}
        >
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
          >
            <div className="flex items-center gap-3">
              <Truck className="text-teal-600" size={20} />
              <div className="font-semibold">Delivery Note {dn.deliveryNote_number}</div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeliveryModal(false)}
              className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Invoice #</div>
                <div className="font-medium text-teal-600">{dn.invoiceNumber || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Delivery Date</div>
                <div className="font-medium">{formatDate(dn.deliveryDate)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium">{dn.customerDetails?.name || "-"}</div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Spec</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2 text-right">Delivered</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className={isDarkMode ? "border-b border-[#37474F]" : "border-b border-gray-100"}>
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2">{it.specification || "-"}</td>
                      <td className="px-3 py-2">{it.unit || ""}</td>
                      <td className="px-3 py-2 text-right">{it.orderedQuantity}</td>
                      <td className="px-3 py-2 text-right">{it.deliveredQuantity}</td>
                      <td className="px-3 py-2 text-right">{it.remainingQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div
            className={`px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
          >
            <button
              type="button"
              onClick={() => navigate(`/app/delivery-notes/${dn.id}`)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500"
            >
              View Full Details
            </button>
            <button
              type="button"
              onClick={() => setShowDeliveryModal(false)}
              className={
                isDarkMode
                  ? "px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                  : "px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
              }
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      {/* Invoice Preview Modal
          Uses company data for template settings (colors, logo, fonts).
          Falls back to DEFAULT_TEMPLATE_SETTINGS if company not loaded.
          This ensures preview matches final PDF appearance. */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <InvoicePreview
              invoice={previewInvoice}
              company={company || {}}
              onClose={() => {
                setShowPreviewModal(false);
                setPreviewInvoice(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Invoice Modal */}
      <DeleteInvoiceModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        invoice={invoiceToDelete}
      />

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
                onClick={() => setDropshipPOModal({ open: false, invoiceId: null, invoiceNumber: "" })}
                className={`p-1 rounded hover:bg-opacity-80 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Invoice: <span className="font-medium text-teal-600">{dropshipPOModal.invoiceNumber}</span>
            </div>

            {loadingDropshipItems ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                <span className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Loading items...
                </span>
              </div>
            ) : dropshipModalItems.length === 0 ? (
              <div className={`text-sm text-center py-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                No unlinked dropship items found.
              </div>
            ) : (
              <>
                {/* Items list */}
                <div className={`text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Items ({dropshipModalItems.length})
                </div>
                <div
                  className={`mb-4 max-h-40 overflow-y-auto rounded border ${
                    isDarkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  {dropshipModalItems.map((item) => (
                    <div
                      key={item.id}
                      className={`px-3 py-2 text-sm border-b last:border-b-0 ${
                        isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="font-medium truncate">{item.name || item.productName}</div>
                      <div className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Qty: {item.quantity} {item.unit || "PCS"} | Rate: {formatCurrency(item.rate || item.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Supplier dropdown */}
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

                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDropshipPOModal({ open: false, invoiceId: null, invoiceNumber: "" })}
                    className={`px-4 py-2 text-sm rounded border ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!dropshipSelectedSupplier || creatingDropshipPO}
                    onClick={handleCreateDropshipPOFromList}
                    className={`px-4 py-2 text-sm rounded font-medium text-white ${
                      !dropshipSelectedSupplier || creatingDropshipPO
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700"
                    }`}
                  >
                    {creatingDropshipPO ? "Creating..." : "Create Dropship PO"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delivery Note Modal */}
      <DeliveryNoteModal />

      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              📄 All Invoices
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Manage and track all your invoices</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {authService.hasPermission("invoices", "create") && (
              <Link
                to="/app/invoices/new"
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                <Plus size={18} />
                Create Invoice
              </Link>
            )}
          </div>
        </div>

        {/* Financial Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {/* Outstanding Amount Card */}
          <button
            type="button"
            onClick={() => handleCardClick("outstanding")}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === "outstanding"
                ? isDarkMode
                  ? "bg-orange-900/30 border-orange-600 ring-2 ring-orange-600"
                  : "bg-orange-50 border-orange-500 ring-2 ring-orange-500"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-orange-600/50"
                  : "bg-white border-[#E0E0E0] hover:border-orange-500/50"
            }`}
          >
            <div className="py-4 px-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-orange-600 font-semibold">Outstanding</div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(getOutstandingAmount())}</div>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {effectiveSummary.outstandingCount} invoice{effectiveSummary.outstandingCount !== 1 ? "s" : ""}
              </p>
            </div>
          </button>

          {/* Overdue Card */}
          <button
            type="button"
            onClick={() => handleCardClick("overdue")}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === "overdue"
                ? isDarkMode
                  ? "bg-red-900/30 border-red-600 ring-2 ring-red-600"
                  : "bg-red-50 border-red-500 ring-2 ring-red-500"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-red-600/50"
                  : "bg-white border-[#E0E0E0] hover:border-red-500/50"
            }`}
          >
            <div className="py-4 px-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-red-600 font-semibold flex items-center justify-center gap-1">
                <AlertCircle size={14} />
                Overdue
              </div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(getOverdueMetrics().amount)}</div>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {getOverdueMetrics().count} invoice
                {getOverdueMetrics().count !== 1 ? "s" : ""}
              </p>
            </div>
          </button>

          {/* Due Soon Card */}
          <button
            type="button"
            onClick={() => handleCardClick("due_soon")}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === "due_soon"
                ? isDarkMode
                  ? "bg-yellow-900/30 border-yellow-600 ring-2 ring-yellow-600"
                  : "bg-yellow-50 border-yellow-500 ring-2 ring-yellow-500"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-yellow-600/50"
                  : "bg-white border-[#E0E0E0] hover:border-yellow-500/50"
            }`}
          >
            <div className="py-4 px-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-yellow-600 font-semibold flex items-center justify-center gap-1">
                <Bell size={14} />
                Due in 7 Days
              </div>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(getDueSoonMetrics(7).amount)}</div>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {getDueSoonMetrics(7).count} invoice
                {getDueSoonMetrics(7).count !== 1 ? "s" : ""}
              </p>
            </div>
          </button>

          {/* Paid Amount Card */}
          <button
            type="button"
            onClick={() => handleCardClick("paid")}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === "paid"
                ? isDarkMode
                  ? "bg-green-900/30 border-green-600 ring-2 ring-green-600"
                  : "bg-green-50 border-green-500 ring-2 ring-green-500"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-green-600/50"
                  : "bg-white border-[#E0E0E0] hover:border-green-500/50"
            }`}
          >
            <div className="py-4 px-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-green-600 font-semibold flex items-center justify-center gap-1">
                <CheckCircle size={14} />
                Paid
              </div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(getPaidAmount())}</div>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {effectiveSummary.paidCount} invoice{effectiveSummary.paidCount !== 1 ? "s" : ""}
              </p>
            </div>
          </button>
        </div>

        {/* Active Filter Banner */}
        {activeCardFilter && (
          <div
            className={`flex items-center justify-between px-4 py-3 mb-6 rounded-lg border ${
              isDarkMode ? "bg-teal-900/20 border-teal-600/50" : "bg-teal-50 border-teal-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-teal-300" : "text-teal-700"}`}>
                Showing:{" "}
                {activeCardFilter === "outstanding"
                  ? "Outstanding Invoices"
                  : activeCardFilter === "overdue"
                    ? "Overdue Invoices"
                    : activeCardFilter === "due_soon"
                      ? "Invoices Due in 7 Days"
                      : activeCardFilter === "paid"
                        ? "Paid Invoices"
                        : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveCardFilter(null);
                setPaymentStatusFilter("all");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode ? "bg-teal-800 text-teal-100 hover:bg-teal-700" : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              <X size={16} />
              Clear Filter
            </button>
          </div>
        )}

        {/* Filters Section */}
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <div className="flex-grow flex-shrink min-w-[200px] max-w-[350px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              className={`flex items-center gap-2 cursor-pointer px-4 py-3 border rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="text-teal-600 focus:ring-teal-500 rounded"
              />
              <span className="text-sm font-medium">Show Deleted</span>
            </label>
          </div>
          <div className="min-w-[170px] relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft Invoice</option>
              <option value="proforma">Proforma Invoice</option>
              <option value="sent">Sent</option>
              <option value="issued">Issued</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
          </div>
          <div className="min-w-[170px] relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
          </div>
          <div className="min-w-[150px] relative">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={30}>30 per page</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedInvoiceIds.size > 0 && (
          <div
            className={`flex items-center justify-end px-4 py-3 mb-6 rounded-lg border ${
              isDarkMode ? "bg-teal-900/20 border-teal-600/50" : "bg-teal-50 border-teal-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkDownload(selectedInvoiceIds)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode ? "bg-teal-700 text-white hover:bg-teal-600" : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                <Download size={16} />
                Download Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceIds(new Set())}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <X size={16} />
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
              <tr>
                <th className={`px-4 py-3 text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all invoices"
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Invoice #
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Customer
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Due Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Amount
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className={`text-6xl ${isDarkMode ? "opacity-50" : "opacity-30"}`}>📄</div>
                      <div>
                        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          No Invoices Found
                        </h3>
                        <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {activeCardFilter
                            ? "No invoices match the selected filter. Try a different filter or clear it."
                            : searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all"
                              ? "No invoices match your search criteria. Try adjusting your filters."
                              : "Create your first invoice to get started"}
                        </p>
                        {activeCardFilter && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCardFilter(null);
                              setPaymentStatusFilter("all");
                              setStatusFilter("all");
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              isDarkMode
                                ? "bg-teal-800 text-teal-100 hover:bg-teal-700"
                                : "bg-teal-600 text-white hover:bg-teal-700"
                            }`}
                          >
                            <X size={16} />
                            Clear Dashboard Filter
                          </button>
                        )}
                        {!activeCardFilter &&
                          !searchTerm &&
                          statusFilter === "all" &&
                          paymentStatusFilter === "all" && (
                            <Link
                              to="/app/invoices/new"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            >
                              <Plus size={16} />
                              Create Invoice
                            </Link>
                          )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, _index) => {
                  const isDeleted = invoice.deletedAt;
                  const isSelected = selectedInvoiceIds.has(invoice.id);
                  return (
                    <tr
                      key={invoice.id}
                      className={`${isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"} transition-colors ${
                        isDeleted
                          ? isDarkMode
                            ? "bg-red-900/10 opacity-60"
                            : "bg-red-50/50 opacity-70"
                          : isSelected
                            ? isDarkMode
                              ? "bg-teal-900/20"
                              : "bg-teal-50"
                            : ""
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Invoice number + star + CN badge — fixed width for PO chip alignment */}
                          <span
                            className={`inline-flex items-center min-w-[145px] text-sm font-semibold ${isDeleted ? "line-through" : ""} text-teal-600`}
                          >
                            {invoice.invoiceNumber}
                            {isNewRecord(invoice.createdAt, 2) && (
                              <span className="text-yellow-500 text-[9px] -mt-2 ml-0.5" title="Recently created">
                                ★
                              </span>
                            )}
                            {/* Credit Note Badge */}
                            {(invoice.creditNotesCount > 0 || invoice.hasCreditNotes) && (
                              <span
                                className={`ml-1.5 px-1.5 py-0.5 text-xs font-medium rounded ${
                                  isDarkMode ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"
                                }`}
                                title={`${invoice.creditNotesCount || 1} Credit Note(s)`}
                              >
                                CN
                              </span>
                            )}
                          </span>
                          {/* Dropship PO Chip — fixed position after invoice number */}
                          {renderDropshipPOChip(invoice)}
                        </div>
                        {isDeleted && (
                          <div
                            className={`text-xs mt-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                            title={`Deleted: ${invoice.deletionReason || "No reason provided"}`}
                          >
                            🗑️ DELETED
                          </div>
                        )}
                        {invoice.recreatedFrom && (
                          <div className={`text-xs mt-1 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                            🔄 Recreated from {invoice.recreatedFrom}
                          </div>
                        )}
                        {invoice.status === "cancelled" && (
                          <div className={`text-xs mt-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                            ❌ Cancelled & Recreated
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {invoice.customerDetails?.name || invoice.customer?.name}
                          </div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {invoice.customerDetails?.email || invoice.customer?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                          title={formatCurrency(invoice.total)}
                        >
                          {formatCurrency(invoice.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InvoiceStatusColumn invoice={invoice} isDarkMode={isDarkMode} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-0.5 justify-end">
                          {(() => {
                            const actions = getActionButtonConfig(invoice);

                            return (
                              <>
                                {/* Edit/Lock Action: Edit (within 24h) or Lock (after 24h) */}
                                {actions.editOrLock.enabled ? (
                                  <Link
                                    to={actions.editOrLock.link}
                                    className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                      isDarkMode
                                        ? "text-blue-400 hover:text-blue-300 bg-gray-800/30 hover:bg-gray-700/50"
                                        : "hover:bg-blue-50 text-blue-600 bg-white"
                                    }`}
                                    title={actions.editOrLock.tooltip}
                                  >
                                    <Edit size={18} />
                                  </Link>
                                ) : (
                                  <span
                                    className={`p-2 rounded shadow-sm ${
                                      isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    <Lock size={18} />
                                  </span>
                                )}

                                {/* Credit Note moved to More dropdown */}

                                {/* View button - Always enabled */}
                                <button
                                  type="button"
                                  className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                    isDarkMode
                                      ? "text-cyan-400 hover:text-cyan-300 bg-gray-800/30 hover:bg-gray-700/50"
                                      : "hover:bg-cyan-50 text-cyan-600 bg-white"
                                  }`}
                                  title={actions.view.tooltip}
                                  onClick={() => handleViewInvoice(invoice)}
                                >
                                  <Eye size={18} />
                                </button>

                                {/* Download button - Always visible */}
                                {actions.download.enabled ? (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      className={`p-2 rounded transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                                        downloadingIds.has(invoice.id)
                                          ? "bg-transparent"
                                          : !actions.download.isValid
                                            ? isDarkMode
                                              ? "text-orange-400 hover:text-orange-300 bg-gray-800/30 hover:bg-gray-700/50"
                                              : "hover:bg-orange-50 text-orange-600 bg-white"
                                            : isDarkMode
                                              ? "text-green-400 hover:text-green-300 bg-gray-800/30 hover:bg-gray-700/50"
                                              : "hover:bg-green-50 text-green-600 bg-white"
                                      }`}
                                      title={actions.download.tooltip}
                                      onClick={() => handleDownloadPDF(invoice)}
                                      disabled={downloadingIds.has(invoice.id)}
                                    >
                                      {downloadingIds.has(invoice.id) ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                      ) : (
                                        <Download size={18} />
                                      )}
                                    </button>
                                    {!actions.download.isValid && (
                                      <Link
                                        to={`/invoices/${invoice.id}`}
                                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center hover:scale-125 transition-transform cursor-pointer ${
                                          isDarkMode
                                            ? "bg-orange-400 hover:bg-orange-300"
                                            : "bg-orange-500 hover:bg-orange-600"
                                        }`}
                                        title={`${getMissingFieldsList(invoice)} - Click to edit`}
                                      >
                                        <span className="text-xs font-bold text-white">!</span>
                                      </Link>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                      isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                    }`}
                                    title={actions.download.tooltip}
                                  >
                                    <Download size={18} />
                                  </button>
                                )}

                                {/* Delivery Note Direct Action - Smart Navigation with Badge */}
                                {/* Icon colors: Green truck = no DN (create mode), Blue truck = has DN (view mode) */}
                                {actions.deliveryNote.enabled ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeliveryNoteClick(invoice, actions)}
                                    className={`relative p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                      actions.deliveryNote.hasNotes
                                        ? isDarkMode
                                          ? "text-blue-400 hover:text-blue-300 bg-gray-800/30 hover:bg-gray-700/50"
                                          : "hover:bg-blue-50 text-blue-600 bg-white"
                                        : isDarkMode
                                          ? "text-green-400 hover:text-green-300 bg-gray-800/30 hover:bg-gray-700/50"
                                          : "hover:bg-green-50 text-green-600 bg-white"
                                    }`}
                                    title={
                                      !actions.deliveryNote.hasNotes
                                        ? "Create Delivery Note"
                                        : actions.deliveryNote.count === 1
                                          ? "View Delivery Note"
                                          : `View ${actions.deliveryNote.count} Delivery Notes`
                                    }
                                  >
                                    <Truck size={18} />
                                    {/* Badge with count and color */}
                                    {actions.deliveryNote.hasNotes && (
                                      <span
                                        className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold rounded-full ${
                                          actions.deliveryNote.isFullyDelivered
                                            ? "bg-green-500 text-white"
                                            : "bg-yellow-500 text-gray-900"
                                        }`}
                                      >
                                        {actions.deliveryNote.count}
                                      </span>
                                    )}
                                  </button>
                                ) : ["issued", "sent"].includes(invoice.status) ? null : (
                                  <span
                                    className={`p-2 rounded shadow-sm opacity-30 ${
                                      isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                    }`}
                                    title={actions.deliveryNote.tooltip}
                                  >
                                    <Truck size={18} />
                                  </span>
                                )}

                                {/* Separator: Core Actions | Payment Group */}
                                <div className={`w-px h-5 mx-1 ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`} />

                                {/* Record Payment button - Always visible (green for unpaid, blue for paid/view-only) */}
                                {actions.recordPayment.enabled ? (
                                  <button
                                    type="button"
                                    className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                      actions.recordPayment.isPaid
                                        ? isDarkMode
                                          ? "text-blue-400 hover:text-blue-300 bg-gray-800/30 hover:bg-gray-700/50"
                                          : "hover:bg-blue-50 text-blue-600 bg-white"
                                        : isDarkMode
                                          ? "text-emerald-400 hover:text-emerald-300 bg-gray-800/30 hover:bg-gray-700/50"
                                          : "hover:bg-emerald-50 text-emerald-600 bg-white"
                                    }`}
                                    title={actions.recordPayment.tooltip}
                                    onClick={() => handleRecordPayment(invoice)}
                                  >
                                    <CircleDollarSign size={18} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                      isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                    }`}
                                    title={actions.recordPayment.tooltip}
                                  >
                                    <CircleDollarSign size={18} />
                                  </button>
                                )}

                                {/* More Actions Dropdown - Delivery Note removed (now direct action) */}
                                {(actions.creditNote.enabled ||
                                  actions.reminder.enabled ||
                                  actions.phone.enabled ||
                                  actions.delete.enabled ||
                                  actions.restore.enabled) && (
                                  <div className="relative actions-dropdown">
                                    <button
                                      type="button"
                                      className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                        isDarkMode
                                          ? "text-gray-400 hover:text-gray-300 bg-gray-800/30 hover:bg-gray-700/50"
                                          : "hover:bg-gray-100 text-gray-600 bg-white"
                                      }`}
                                      title="More actions"
                                      onClick={() =>
                                        setOpenDropdownId(openDropdownId === invoice.id ? null : invoice.id)
                                      }
                                    >
                                      <MoreVertical size={18} />
                                    </button>

                                    {openDropdownId === invoice.id && (
                                      <div
                                        className={`absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg shadow-lg border ${
                                          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                                        }`}
                                      >
                                        {/* Credit Note */}
                                        {actions.creditNote.enabled && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenDropdownId(null);
                                              navigate(actions.creditNote.link);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                                              isDarkMode
                                                ? "text-teal-400 hover:bg-gray-700"
                                                : "text-teal-600 hover:bg-teal-50"
                                            }`}
                                          >
                                            <ReceiptText size={16} />
                                            <span>Credit Note</span>
                                          </button>
                                        )}

                                        {/* Payment Reminder */}
                                        {actions.reminder.enabled && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenDropdownId(null);
                                              handleSendReminder(invoice);
                                            }}
                                            disabled={sendingReminderIds.has(invoice.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                                              isDarkMode
                                                ? "text-yellow-400 hover:bg-gray-700"
                                                : "text-yellow-600 hover:bg-yellow-50"
                                            } ${sendingReminderIds.has(invoice.id) ? "opacity-50" : ""}`}
                                          >
                                            <Bell size={16} />
                                            <span>Send Reminder</span>
                                          </button>
                                        )}

                                        {/* Phone Notes */}
                                        {actions.phone.enabled && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenDropdownId(null);
                                              handleOpenPaymentReminder(invoice);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                                              isDarkMode
                                                ? "text-orange-400 hover:bg-gray-700"
                                                : "text-orange-600 hover:bg-orange-50"
                                            }`}
                                          >
                                            <Phone size={16} />
                                            <span>Phone Notes</span>
                                          </button>
                                        )}

                                        {/* Duplicate Invoice */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            navigate(`/app/invoices/new?duplicateFrom=${invoice.id}`);
                                          }}
                                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                                            isDarkMode
                                              ? "text-blue-400 hover:bg-gray-700"
                                              : "text-blue-600 hover:bg-blue-50"
                                          }`}
                                        >
                                          <Copy size={16} />
                                          <span>Duplicate</span>
                                        </button>

                                        {/* Delivery Note moved to direct action button - no longer in dropdown */}

                                        {/* Divider before danger zone */}
                                        {(actions.delete.enabled || actions.restore.enabled) &&
                                          (actions.creditNote.enabled ||
                                            actions.reminder.enabled ||
                                            actions.phone.enabled) && (
                                            <div
                                              className={`my-1 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                                            />
                                          )}

                                        {/* Delete */}
                                        {actions.delete.enabled && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenDropdownId(null);
                                              handleDeleteInvoice(invoice);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                                              isDarkMode
                                                ? "text-red-400 hover:bg-gray-700"
                                                : "text-red-600 hover:bg-red-50"
                                            }`}
                                          >
                                            <Trash2 size={16} />
                                            <span>Delete</span>
                                          </button>
                                        )}

                                        {/* Restore */}
                                        {actions.restore.enabled && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenDropdownId(null);
                                              handleRestoreInvoice(invoice);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                                              isDarkMode
                                                ? "text-green-400 hover:bg-gray-700"
                                                : "text-green-600 hover:bg-green-50"
                                            }`}
                                          >
                                            <RotateCcw size={16} />
                                            <span>Restore</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className={`flex justify-between items-center mt-6 pt-4 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {pagination.totalItems === 0
                ? "No invoices found"
                : `Showing ${(pagination.currentPage - 1) * pagination.perPage + 1} to ${Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of ${pagination.totalItems} invoices`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handlePageChange(e, pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                  pagination.currentPage === 1
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Page {pagination.totalPages === 0 ? 0 : pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={(e) => handlePageChange(e, pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                  pagination.currentPage === pagination.totalPages
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Reminder Modal */}
      <PaymentReminderModal
        isOpen={showPaymentReminderModal}
        onClose={handleClosePaymentReminder}
        invoice={paymentReminderInvoice}
        onSave={handlePaymentReminderSaved}
        isViewOnly={paymentReminderInvoice?.paymentStatus === "paid"}
      />

      {/* Record Payment Drawer */}
      <PaymentDrawer
        invoice={paymentDrawerInvoice}
        isOpen={showRecordPaymentDrawer}
        onClose={handleCloseRecordPaymentDrawer}
        onAddPayment={handleAddPayment}
        isSaving={isSavingPayment}
        canManage={true}
        isDarkMode={isDarkMode}
        otherSessions={otherSessions}
        onPrintReceipt={handlePrintReceipt}
        onDownloadReceipt={handleDownloadReceipt}
        onVoidPayment={handleVoidPayment}
        isVoidingPayment={isVoidingPayment}
        voidDropdownPaymentId={voidDropdownPaymentId}
        onVoidDropdownToggle={(id) => {
          setVoidDropdownPaymentId(id);
          setVoidCustomReason("");
        }}
        voidCustomReason={voidCustomReason}
        onVoidCustomReasonChange={setVoidCustomReason}
        onSubmitCustomVoidReason={handleSubmitCustomVoidReason}
        downloadingReceiptId={downloadingReceiptId}
        printingReceiptId={printingReceiptId}
        PAYMENT_MODES={PAYMENT_MODES}
        VOID_REASONS={VOID_REASONS}
      />

      {/* Professional Confirmation Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default InvoiceList;
