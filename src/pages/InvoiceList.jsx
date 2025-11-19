import React, { useState, useEffect } from "react";
import {
  Edit,
  Eye,
  Download,
  Trash2,
  Search,
  FileDown,
  Truck,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  RotateCcw,
  FileText,
  Phone,
  DollarSign,
  CircleDollarSign,
  FileMinus,
  Award,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { createCompany } from "../types";
import { invoiceService, payablesService, PAYMENT_MODES } from "../services/dataService";
import { deliveryNotesAPI, accountStatementsAPI } from "../services/api";
import { notificationService } from "../services/notificationService";
import { authService } from "../services/axiosAuthService";
import { apiClient } from "../services/api";
import { uuid } from "../utils/uuid";
import { commissionService } from "../services/commissionService";
import InvoicePreview from "../components/InvoicePreview";
import DeleteInvoiceModal from "../components/DeleteInvoiceModal";
import PaymentReminderModal from "../components/PaymentReminderModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { generatePaymentReminder, getInvoiceReminderInfo } from "../utils/reminderUtils";
import InvoiceStatusColumn from "../components/InvoiceStatusColumn";
import { normalizeInvoices } from "../utils/invoiceNormalizer";
import { guardInvoicesDev } from "../utils/devGuards";

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
  const [loading, setLoading] = useState(true); // Controls spinner visibility

  // DEBUG: Track component instance to detect multiple mounts
  const instanceRef = React.useRef(Math.random().toString(36).substr(2, 9));
  const renderCount = React.useRef(0);
  renderCount.current++;
  
  console.log(`[${instanceRef.current}] RENDER #${renderCount.current} - loading=${loading}, invoices.length=${invoices.length}`);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [sendingReminderIds, setSendingReminderIds] = useState(new Set());
  const [calculatingCommissionIds, setCalculatingCommissionIds] = useState(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deliveryNoteStatus, setDeliveryNoteStatus] = useState({});
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [createdDeliveryNote, setCreatedDeliveryNote] = useState(null);
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

  const company = createCompany();

  // Process delivery note status from invoice data
  const processDeliveryNoteStatus = (invoices) => {
    const statusMap = {};

    invoices.forEach((invoice) => {
      if (invoice.deliveryStatus) {
        statusMap[invoice.id] = {
          hasNotes: invoice.deliveryStatus.hasNotes,
          count: invoice.deliveryStatus.count,
        };
      } else {
        statusMap[invoice.id] = { hasNotes: false, count: 0 };
      }
    });

    setDeliveryNoteStatus(statusMap);
  };

  // Fetch invoices with pagination and abort controller
  // LOADING PATTERN: setLoading(true) at start, setLoading(false) in finally block
  const fetchInvoices = React.useCallback(async (page, limit, search, status, includeDeleted, signal) => {
    try {
      // START LOADING: Set loading state before fetch
      console.log(`[${instanceRef.current}] fetchInvoices START - setLoading(true)`);
      setLoading(true);
      const queryParams = {
        page: page,
        limit: limit,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        include_deleted: includeDeleted ? 'true' : undefined,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key]
      );

      // Use invoiceService to get ALL invoices (including draft and proforma)
      const response = await invoiceService.getInvoices(queryParams, signal);

      // Check if request was aborted before updating state
      if (signal?.aborted) {
        return;
      }

      // invoiceService returns { invoices, pagination }
      const invoicesData = response.invoices || response;
      const normalizedInvoices = normalizeInvoices(Array.isArray(invoicesData) ? invoicesData : [], 'fetchInvoices');
      
      // In development, wrap with guards that warn on snake_case access
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
      if (error.name === 'AbortError' || error.message === 'canceled') {
        return;
      }
      console.error("Error fetching invoices:", error);
      setInvoices([]);
      setPagination(null);
    } finally {
      // END LOADING: Always turn off loading unless request was aborted
      if (!signal?.aborted) {
        console.log(`[${instanceRef.current}] fetchInvoices END - setLoading(false)`);
        setLoading(false);
      } else {
        console.log(`[${instanceRef.current}] fetchInvoices ABORTED - NOT setting loading to false`);
      }
    }
  }, []);

  // Consolidated effect with debouncing and request cancellation
  // TRIGGERS: Runs when page, filters, or search changes
  // CLEANUP: Aborts pending requests when dependencies change
  useEffect(() => {
    console.log(`[${instanceRef.current}] FETCH EFFECT TRIGGERED - currentPage=${currentPage}, searchTerm="${searchTerm}", statusFilter=${statusFilter}`);
    const abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      console.log(`[${instanceRef.current}] CALLING fetchInvoices after ${searchTerm ? 500 : 0}ms debounce`);
      fetchInvoices(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
        showDeleted,
        abortController.signal
      );
    }, searchTerm ? 500 : 0); // Debounce search by 500ms, others immediately

    return () => {
      console.log(`[${instanceRef.current}] FETCH EFFECT CLEANUP - aborting`);
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [currentPage, pageSize, searchTerm, statusFilter, showDeleted]);

  // Reset to page 1 when filters change
  useEffect(() => {
    console.log(`[${instanceRef.current}] RESET PAGE EFFECT - currentPage was ${currentPage}, setting to 1`);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, showDeleted, currentPage]);

  // Initialize search from URL param
  useEffect(() => {
    const q = searchParams.get("search") || "";
    if (q !== searchTerm) {
      setSearchTerm(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Clear selections when filters or search changes (Gmail behavior)
  useEffect(() => {
    setSelectedInvoiceIds(new Set());
  }, [searchTerm, statusFilter, paymentStatusFilter, showDeleted, activeCardFilter]);

  // Client-side payment status and card filtering
  // GOLD STANDARD: Use backend-provided payment status instead of calculating
  /** @type {import('../types/invoice').Invoice[]} */
  const filteredInvoices = React.useMemo(() => {
    console.log(`[${instanceRef.current}] 🔍 FILTERING invoices - input length:`, invoices?.length, 'filters:', {
      paymentStatusFilter,
      activeCardFilter
    });
    console.log(`[${instanceRef.current}] 🔍 SAMPLE INVOICE OBJECT:`, invoices?.[0], 'keys:', Object.keys(invoices?.[0] || {}));
    
    let filtered = invoices;

    // Apply payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter((invoice) => {
        // Only apply payment filter to issued invoices
        if (invoice.status !== 'issued') {
          return true; // Show non-issued invoices regardless of payment filter
        }

        // Use backend-provided payment status (GOLD STANDARD)
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return paymentStatus === paymentStatusFilter;
      });
    }

    // Apply card-specific filters
    if (activeCardFilter === 'outstanding') {
      filtered = filtered.filter(invoice => {
        if (invoice.status !== 'issued') return false;
        // Use backend-provided payment status
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return paymentStatus === 'unpaid' || paymentStatus === 'partially_paid';
      });
    } else if (activeCardFilter === 'overdue') {
      filtered = filtered.filter(invoice => {
        if (invoice.status !== 'issued') return false;
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Use backend-provided payment status
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return dueDate < today && (paymentStatus === 'unpaid' || paymentStatus === 'partially_paid');
      });
    } else if (activeCardFilter === 'due_soon') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 7);

      filtered = filtered.filter(invoice => {
        if (invoice.status !== 'issued') return false;
        const dueDate = new Date(invoice.dueDate);
        // Use backend-provided payment status
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return dueDate >= today && dueDate <= futureDate && (paymentStatus === 'unpaid' || paymentStatus === 'partially_paid');
      });
    }

    console.log(`[${instanceRef.current}] 🔍 FILTERING RESULT - filtered length:`, filtered?.length);
    return filtered;
  }, [invoices, paymentStatusFilter, activeCardFilter]);

  // Selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = new Set(filteredInvoices.map(inv => inv.id));
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

  const isAllSelected = filteredInvoices.length > 0 &&
    filteredInvoices.every(inv => selectedInvoiceIds.has(inv.id));

  const isSomeSelected = filteredInvoices.some(inv => selectedInvoiceIds.has(inv.id)) && !isAllSelected;

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setCurrentPage(1);
  };


  const getTotalAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  // Dashboard metric calculations
  // GOLD STANDARD: Use backend-provided payment data (no client-side calculation)
  const getOutstandingAmount = () => {
    return invoices
      .filter(invoice => {
        if (invoice.status !== 'issued') return false;
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return paymentStatus === 'unpaid' || paymentStatus === 'partially_paid';
      })
      .reduce((sum, invoice) => {
        // Use backend-calculated outstanding amount
        return sum + Number(invoice.outstanding || 0);
      }, 0);
  };

  const getOverdueMetrics = () => {
    const overdueInvoices = invoices.filter(invoice => {
      if (invoice.status !== 'issued') return false;
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentStatus = invoice.paymentStatus || 'unpaid';
      return dueDate < today && (paymentStatus === 'unpaid' || paymentStatus === 'partially_paid');
    });

    const amount = overdueInvoices.reduce((sum, invoice) => {
      // Use backend-calculated outstanding amount
      return sum + Number(invoice.outstanding || 0);
    }, 0);

    return { count: overdueInvoices.length, amount };
  };

  const getDueSoonMetrics = (days = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    const dueSoonInvoices = invoices.filter(invoice => {
      if (invoice.status !== 'issued') return false;
      const dueDate = new Date(invoice.dueDate);
      const paymentStatus = invoice.paymentStatus || 'unpaid';
      return dueDate >= today && dueDate <= futureDate && (paymentStatus === 'unpaid' || paymentStatus === 'partially_paid');
    });

    const amount = dueSoonInvoices.reduce((sum, invoice) => {
      // Use backend-calculated outstanding amount
      return sum + Number(invoice.outstanding || 0);
    }, 0);

    return { count: dueSoonInvoices.length, amount };
  };

  const getPaidAmount = () => {
    return invoices
      .filter(invoice => {
        if (invoice.status !== 'issued') return false;
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return paymentStatus === 'paid';
      })
      .reduce((sum, invoice) => sum + invoice.total, 0);
  };

  // Handle dashboard card clicks to filter invoices
  const handleCardClick = (filterType) => {
    if (activeCardFilter === filterType) {
      // Click again to clear filter
      setActiveCardFilter(null);
      setPaymentStatusFilter('all');
      setStatusFilter('all');
    } else {
      setActiveCardFilter(filterType);
      setCurrentPage(1);

      switch(filterType) {
        case 'outstanding':
          setStatusFilter('issued');
          setPaymentStatusFilter('all'); // Will be filtered client-side to show unpaid + partially_paid
          break;
        case 'overdue':
          // Overdue requires custom logic, we'll handle via paymentStatusFilter
          setStatusFilter('issued');
          setPaymentStatusFilter('all'); // Custom filter needed
          break;
        case 'paid':
          setStatusFilter('issued');
          setPaymentStatusFilter('paid');
          break;
        case 'due_soon':
          setStatusFilter('issued');
          setPaymentStatusFilter('all'); // Custom filter needed
          break;
        default:
          break;
      }
    }
  };

  // Validate if invoice is complete enough for PDF download
  const validateInvoiceForDownload = (invoice) => {
    const hasCustomer = invoice.customer?.name && invoice.customer.name.trim() !== '';
    const hasItems = invoice.items && invoice.items.length > 0;
    const hasValidItems = hasItems && invoice.items.every(item =>
      item.name && item.name.trim() !== '' &&
      item.quantity > 0 &&
      item.rate > 0
    );
    const hasDate = !!invoice.date;
    const hasDueDate = !!invoice.dueDate;

    return {
      isValid: hasCustomer && hasItems && hasValidItems && hasDate && hasDueDate,
      missing: {
        customer: !hasCustomer,
        items: !hasItems || !hasValidItems,
        date: !hasDate,
        dueDate: !hasDueDate
      }
    };
  };

  const handleDownloadPDF = async (invoice) => {
    if (downloadingIds.has(invoice.id)) return;

    // Validate invoice completeness
    const validation = validateInvoiceForDownload(invoice);

    if (!validation.isValid) {
      const missingFields = [];
      if (validation.missing.customer) missingFields.push('Customer');
      if (validation.missing.items) missingFields.push('Items (with name, quantity, and rate)');
      if (validation.missing.date) missingFields.push('Invoice Date');
      if (validation.missing.dueDate) missingFields.push('Due Date');

      const statusLabel = invoice.status === 'draft' ? 'Draft' :
                         invoice.status === 'proforma' ? 'Proforma' : 'Invoice';

      notificationService.warning(
        `${statusLabel} is incomplete. Missing: ${missingFields.join(', ')}. Please edit and complete all required fields before downloading PDF.`,
        { duration: 6000 }
      );
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(invoice.id));

    try {
      // Use the backend PDF endpoint instead of regenerating
      const { apiClient } = await import("../services/api");
      const response = await apiClient.get(`/invoices/${invoice.id}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
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
      notificationService.error('No reminder needed for this invoice');
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
        notificationService.error(result.error || 'Failed to generate reminder');
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

  const handleGenerateStatement = (invoice) => {
    const customerId = invoice.customer?.id || invoice.customerId;
    const customerName = invoice.customer?.name || invoice.customerName;

    // Navigate to Finance Dashboard with customer pre-selected for SOA generation
    navigate(`/finance?tab=statements&customerId=${customerId}&customerName=${encodeURIComponent(customerName)}`);
  };

  const handleOpenPaymentReminder = (invoice) => {
    setPaymentReminderInvoice(invoice);
    setShowPaymentReminderModal(true);
  };

  const handleClosePaymentReminder = () => {
    setShowPaymentReminderModal(false);
    setPaymentReminderInvoice(null);
  };

  const handlePaymentReminderSaved = (reminder) => {
    notificationService.success('Payment reminder note saved successfully!');
    // Refresh invoices to show updated promise indicator
    fetchInvoices(currentPage, pageSize, searchTerm, statusFilter, showDeleted);
  };

  const handleRecordPayment = async (invoice) => {
    try {
      // Use payablesService to get invoice with correct payment data and outstanding balance
      const invoiceData = await payablesService.getInvoice(invoice.id);

      setPaymentDrawerInvoice(invoiceData);
      setShowRecordPaymentDrawer(true);
    } catch (error) {
      console.error('Error loading invoice details:', error);
      notificationService.error('Failed to load invoice details');
    }
  };

  const handleCloseRecordPaymentDrawer = () => {
    setShowRecordPaymentDrawer(false);
    setPaymentDrawerInvoice(null);
  };

  const handleCalculateCommission = async (invoice) => {
    if (calculatingCommissionIds.has(invoice.id)) return;

    if (!invoice.salesAgentId) {
      notificationService.warning('No sales agent assigned to this invoice');
      return;
    }

    if (invoice.paymentStatus !== 'paid') {
      notificationService.warning('Commission can only be calculated for fully paid invoices');
      return;
    }

    setCalculatingCommissionIds((prev) => new Set(prev).add(invoice.id));

    try {
      await commissionService.calculateCommission(invoice.id);
      notificationService.success('Commission calculated successfully');
      // Optionally refresh invoice list to show updated commission status
    } catch (error) {
      console.error('Error calculating commission:', error);
      notificationService.error(error.message || 'Failed to calculate commission');
    } finally {
      setCalculatingCommissionIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleAddPayment = async ({ amount, method, referenceNo, notes, paymentDate }) => {
    const inv = paymentDrawerInvoice;
    if (!inv) return;
    const outstanding = Number(inv.outstanding || 0);
    if (!(Number(amount) > 0)) {
      notificationService.error('Amount must be greater than 0');
      return;
    }
    if (Number(amount) > outstanding) {
      notificationService.error('Amount exceeds outstanding balance');
      return;
    }

    // Optimistic UI update (like Receivables does)
    const newPayment = {
      id: uuid(),
      payment_date: payment_date || new Date().toISOString().slice(0,10),
      amount: Number(amount),
      method,
      reference_no,
      notes,
      created_at: new Date().toISOString(),
    };

    const updatedPayments = [...(inv.payments || []), newPayment];
    const received = (inv.received || 0) + newPayment.amount;
    const newOutstanding = Math.max(0, +(outstanding - newPayment.amount).toFixed(2));

    // Calculate payment_status (not invoice status)
    let payment_status = 'unpaid';
    if (newOutstanding === 0) payment_status = 'paid';
    else if (newOutstanding < (inv.invoiceAmount || 0)) payment_status = 'partially_paid';

    const updatedInv = {
      ...inv,
      payments: updatedPayments,
      received,
      outstanding: newOutstanding,
      payment_status
    };

    // Update drawer immediately
    setPaymentDrawerInvoice(updatedInv);

    try {
      // Save to backend using invoiceService (correct endpoint)
      await invoiceService.addInvoicePayment(inv.id, newPayment);

      notificationService.success('Payment recorded successfully!');

      // Fetch fresh drawer data to show backend-generated receipt number
      const freshData = await payablesService.getInvoice(inv.id);
      setPaymentDrawerInvoice(freshData);

      // Update the specific invoice in the list (in-place update without re-fetching entire list)
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === inv.id
            ? {
                ...invoice,
                payment_status: freshData.paymentStatus,
                received: freshData.received,
                outstanding: freshData.outstanding,
                balance_due: freshData.outstanding
              }
            : invoice
        )
      );

      // Auto-calculate commission if invoice is now fully paid and has a sales agent
      if (payment_status === 'paid' && inv.salesAgentId) {
        try {
          await commissionService.calculateCommission(inv.id);
          notificationService.success('Commission calculated automatically');
        } catch (commError) {
          console.error('Error auto-calculating commission:', commError);
          // Don't show error to user - commission can be calculated manually later
        }
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      notificationService.error(error?.response?.data?.error || 'Failed to record payment');

      // Reload drawer on error to get correct state
      try {
        const freshData = await payablesService.getInvoice(inv.id);
        setPaymentDrawerInvoice(freshData);
      } catch (e) {
        console.error('Error reloading invoice:', e);
      }
    }
  };

  const handleVoidLastPayment = async () => {
    const inv = paymentDrawerInvoice;
    if (!inv) return;
    const payments = (inv.payments || []).filter(p => !p.voided);
    if (payments.length === 0) return;

    const last = payments[payments.length - 1];

    // Optimistic UI update
    const updatedPayments = inv.payments.map(p =>
      p.id === last.id ? { ...p, voided: true, voided_at: new Date().toISOString() } : p
    );
    const received = updatedPayments.filter(p => !p.voided).reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, +((inv.invoiceAmount || 0) - received).toFixed(2));
    let status = 'unpaid';
    if (outstanding === 0) status = 'paid';
    else if (outstanding < (inv.invoiceAmount || 0)) status = 'partially_paid';

    const updatedInv = {
      ...inv,
      payments: updatedPayments,
      received,
      outstanding,
      status
    };

    setPaymentDrawerInvoice(updatedInv);

    try {
      await invoiceService.voidInvoicePayment(inv.id, last.id, 'User void via UI');

      notificationService.success('Payment voided successfully');

      // Fetch fresh drawer data
      const freshData = await payablesService.getInvoice(inv.id);
      setPaymentDrawerInvoice(freshData);

      // Update the specific invoice in the list (in-place update without re-fetching entire list)
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === inv.id
            ? {
                ...invoice,
                payment_status: freshData.paymentStatus,
                received: freshData.received,
                outstanding: freshData.outstanding,
                balance_due: freshData.outstanding
              }
            : invoice
        )
      );
    } catch (error) {
      console.error('Error voiding payment:', error);
      notificationService.error('Failed to void payment');

      // Reload drawer on error
      try {
        const freshData = await payablesService.getInvoice(inv.id);
        setPaymentDrawerInvoice(freshData);
      } catch (e) {
        console.error('Error reloading invoice:', e);
      }
    }
  };

  const handleBulkDownload = async (selectedIds = null) => {
    // Determine which invoices to download
    const invoicesToDownload = selectedIds
      ? filteredInvoices.filter(inv => selectedIds.has(inv.id))
      : filteredInvoices;

    if (invoicesToDownload.length === 0) {
      notificationService.error('No invoices selected for download');
      return;
    }

    // Validate all invoices first and separate complete from incomplete
    const validInvoices = [];
    const invalidInvoices = [];

    invoicesToDownload.forEach(invoice => {
      const validation = validateInvoiceForDownload(invoice);
      if (validation.isValid) {
        validInvoices.push(invoice);
      } else {
        invalidInvoices.push(invoice);
      }
    });

    // If there are invalid invoices, show warning
    if (invalidInvoices.length > 0) {
      const invalidNumbers = invalidInvoices.map(inv => inv.invoiceNumber).join(', ');

      if (invalidInvoices.length === invoicesToDownload.length) {
        const message = `All selected invoices are incomplete and cannot be downloaded. Please edit and complete them first: ${invalidNumbers}`;
        notificationService.warning(message, { duration: 8000 });
        return;
      }

      const confirmed = await confirm({
        title: 'Some Invoices Incomplete',
        message: `${invalidInvoices.length} incomplete invoice${invalidInvoices.length > 1 ? 's' : ''} will be skipped: ${invalidNumbers}\n\nProceed with downloading ${validInvoices.length} complete invoice${validInvoices.length > 1 ? 's' : ''}?`,
        confirmText: `Download ${validInvoices.length}`,
        variant: 'warning'
      });
      if (!confirmed) return;
    } else {
      const message = selectedIds
        ? `Download PDFs for ${validInvoices.length} selected invoice${validInvoices.length !== 1 ? 's' : ''}?`
        : `Download PDFs for all ${validInvoices.length} invoice${validInvoices.length !== 1 ? 's' : ''} on this page?`;

      const confirmed = await confirm({
        title: 'Download PDFs',
        message: message,
        confirmText: 'Download',
        variant: 'info'
      });
      if (!confirmed) return;
    }

    let successCount = 0;
    let failCount = 0;

    // Import apiClient for PDF downloads
    const { apiClient } = await import("../services/api");

    for (const invoice of validInvoices) {
      try {
        // Use backend PDF endpoint
        const response = await apiClient.get(`/invoices/${invoice.id}/pdf`, {
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
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
        `Downloaded ${successCount} invoice PDF${successCount !== 1 ? 's' : ''} successfully!`
      );
    } else {
      notificationService.warning(
        `Downloaded ${successCount} PDF${successCount !== 1 ? 's' : ''}. ${failCount} failed.`
      );
    }
  };

  const handleCreateDeliveryNote = async (invoice) => {
    try {
      const confirmed = await confirm({
        title: 'Create Delivery Note',
        message: `Create a delivery note for Invoice #${invoice.invoiceNumber}?\n\nNote: Only one delivery note is allowed per invoice.`,
        confirmText: 'Create',
        variant: 'info'
      });
      if (!confirmed) return;
      // Create delivery note using axios client (auth + baseURL + refresh)
      const { apiClient } = await import("../services/api");
      const resp = await apiClient.post(`/invoices/${invoice.id}/generate-delivery-note`);
      const dn = resp?.deliveryNote || resp?.data?.deliveryNote || resp;

      notificationService.createSuccess("Delivery note");
      // Open modal with the created delivery note
      if (dn && dn.id) {
        setCreatedDeliveryNote(dn);
        setShowDeliveryModal(true);
      }
      // Refresh invoices to get updated status
      fetchInvoices();
    } catch (error) {
      console.error("Error creating delivery note:", error);
      // If a delivery note already exists, fetch it and open modal
      const msg = error?.response?.data?.error || error?.message || "";
      if (String(msg).toLowerCase().includes("already exists")) {
        try {
          const list = await deliveryNotesAPI.getAll({ invoice_id: invoice.id, limit: 1, page: 1 });
          const dn = Array.isArray(list?.deliveryNotes) ? list.deliveryNotes[0] : (Array.isArray(list) ? list[0] : null);
          if (dn) {
            setCreatedDeliveryNote(dn);
            setShowDeliveryModal(true);
            notificationService.warning("Delivery note already exists. Showing it.");
            return;
          }
        } catch (e) {
          // ignore and fall through to error toast
        }
      }
      notificationService.createError("Delivery note", error);
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
        reasonCode: deleteData.reasonCode
      });
      notificationService.success('Invoice deleted successfully (soft delete with audit trail)');

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
      console.error('Error deleting invoice:', error);
      notificationService.error(error?.response?.data?.error || 'Failed to delete invoice');
      throw error; // Re-throw so modal can handle loading state
    }
  };

  const handleRestoreInvoice = async (invoice) => {
    const number = invoice.invoiceNumber || invoice.id;
    const confirmed = await confirm({
      title: 'Restore Invoice',
      message: `Restore invoice ${number}?\n\nThis will undelete the invoice and make it active again.`,
      confirmText: 'Restore',
      variant: 'info'
    });
    if (!confirmed) return;

    try {
      await invoiceService.restoreInvoice(invoice.id);
      notificationService.success('Invoice restored successfully');
      await fetchInvoices();
    } catch (error) {
      console.error('Error restoring invoice:', error);
      notificationService.error(error?.response?.data?.error || 'Failed to restore invoice');
    }
  };

  // Helper function to get action button configurations
  const getActionButtonConfig = (invoice) => {
    const isDeleted = invoice.deletedAt !== null;
    const canUpdate = authService.hasPermission('invoices', 'update');
    const canDelete = authService.hasPermission('invoices', 'delete');
    const canRead = authService.hasPermission('invoices', 'read');
    const canCreateCreditNote = authService.hasPermission('invoices', 'update');
    const canReadCustomers = authService.hasPermission('customers', 'read');
    const canReadDeliveryNotes = authService.hasPermission('delivery_notes', 'read');
    const canCreateDeliveryNotes = authService.hasPermission('delivery_notes', 'create');

    return {
      edit: {
        enabled: canUpdate && !isDeleted && invoice.status !== 'issued',
        tooltip: !canUpdate
          ? 'No permission to edit'
          : isDeleted
            ? 'Cannot edit deleted invoice'
            : invoice.status === 'issued'
              ? 'Cannot edit issued invoice'
              : 'Edit Invoice',
        link: `/edit/${invoice.id}`
      },
      creditNote: {
        enabled: canCreateCreditNote && !isDeleted && invoice.status === 'issued',
        tooltip: !canCreateCreditNote
          ? 'No permission to create credit notes'
          : isDeleted
            ? 'Cannot create credit note for deleted invoice'
            : invoice.status !== 'issued'
              ? 'Only available for issued invoices'
              : 'Create Credit Note',
        link: `/credit-notes/new?invoiceId=${invoice.id}`
      },
      view: {
        enabled: true,
        tooltip: 'View Invoice'
      },
      download: {
        enabled: canRead,
        tooltip: !canRead
          ? 'No permission to download'
          : !validateInvoiceForDownload(invoice).isValid
            ? `Incomplete ${invoice.status === 'draft' ? 'draft' : invoice.status === 'proforma' ? 'proforma' : 'invoice'} - Click to see missing fields`
            : 'Download PDF',
        isValid: validateInvoiceForDownload(invoice).isValid
      },
      recordPayment: {
        enabled: !isDeleted,
        tooltip: isDeleted
          ? 'Cannot view payments for deleted invoice'
          : invoice.paymentStatus === 'paid'
            ? 'View Payment History'
            : 'Record Payment',
        isPaid: invoice.paymentStatus === 'paid',
        canAddPayment: canUpdate && invoice.paymentStatus !== 'paid' && (invoice.balanceDue === undefined || invoice.balanceDue > 0)
      },
      commission: {
        enabled: invoice.paymentStatus === 'paid' && invoice.salesAgentId && !isDeleted,
        tooltip: invoice.paymentStatus !== 'paid'
          ? 'Only available for paid invoices'
          : !invoice.salesAgentId
            ? 'No sales agent assigned'
            : isDeleted
              ? 'Cannot calculate for deleted invoice'
              : 'Calculate Commission'
      },
      reminder: {
        enabled: getInvoiceReminderInfo(invoice)?.shouldShowReminder,
        tooltip: getInvoiceReminderInfo(invoice)?.shouldShowReminder
          ? `Send payment reminder (${getInvoiceReminderInfo(invoice)?.config.label})`
          : 'No reminder needed'
      },
      phone: {
        enabled: !isDeleted,
        tooltip: isDeleted
          ? 'Cannot add notes to deleted invoice'
          : 'Payment Reminder - Phone Call Notes'
      },
      statement: {
        enabled: canReadCustomers,
        tooltip: canReadCustomers
          ? 'Generate Statement of Accounts'
          : 'No permission to generate statements'
      },
      deliveryNote: {
        enabled: invoice.status === 'issued' && (deliveryNoteStatus[invoice.id]?.hasNotes ? canReadDeliveryNotes : canCreateDeliveryNotes),
        tooltip: invoice.status !== 'issued'
          ? 'Only available for issued invoices'
          : deliveryNoteStatus[invoice.id]?.hasNotes
            ? `View Delivery Notes (${deliveryNoteStatus[invoice.id]?.count})`
            : !canCreateDeliveryNotes
              ? 'No permission to create delivery notes'
              : 'Create delivery note',
        hasNotes: deliveryNoteStatus[invoice.id]?.hasNotes
      },
      delete: {
        enabled: canDelete && !isDeleted,
        tooltip: !canDelete
          ? 'No permission to delete'
          : isDeleted
            ? 'Invoice already deleted'
            : 'Delete Invoice'
      },
      restore: {
        enabled: isDeleted && canUpdate,
        tooltip: !isDeleted
          ? 'Invoice not deleted'
          : !canUpdate
            ? 'No permission to restore'
            : 'Restore Invoice'
      }
    };
  };

  const handleViewInvoice = async (invoice) => {
    try {
      // Fetch complete invoice details including items
      const fullInvoice = await invoiceService.getInvoice(invoice.id);
      setPreviewInvoice(fullInvoice);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      notificationService.error("Failed to load invoice details");
    }
  };

  // SPINNER LOGIC: Show spinner ONLY when loading is true
  // Once loading is false, always show the invoice list (even if empty)
  console.log(`[${instanceRef.current}] SPINNER CHECK - loading=${loading} → ${loading ? 'SHOWING SPINNER' : 'SHOWING INVOICE LIST'}`);
  
  if (loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${
          isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
        }`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span
            className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Loading invoices...
          </span>
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
        <div className={`w-full max-w-3xl rounded-2xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F] text-white' : 'bg-white border-[#E0E0E0] text-gray-900'}`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Truck className="text-teal-600" size={20} />
              <div className="font-semibold">Delivery Note {dn.deliveryNote_number}</div>
            </div>
            <button onClick={() => setShowDeliveryModal(false)} className={isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Invoice #</div>
                <div className="font-medium text-teal-600">{dn.invoiceNumber || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Delivery Date</div>
                <div className="font-medium">{formatDate(dn.deliveryDate)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium">{dn.customerDetails?.name || '-'}</div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
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
                    <tr key={it.id} className={isDarkMode ? 'border-b border-[#37474F]' : 'border-b border-gray-100'}>
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2">{it.specification || '-'}</td>
                      <td className="px-3 py-2">{it.unit || ''}</td>
                      <td className="px-3 py-2 text-right">{it.orderedQuantity}</td>
                      <td className="px-3 py-2 text-right">{it.deliveredQuantity}</td>
                      <td className="px-3 py-2 text-right">{it.remainingQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
            <button
              onClick={() => navigate(`/delivery-notes/${dn.id}`)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500"
            >
              View Full Details
            </button>
            <button
              onClick={() => setShowDeliveryModal(false)}
              className={isDarkMode ? 'px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700' : 'px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'}
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
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${
        isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
      }`}
    >
      {/* Invoice Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <InvoicePreview
              invoice={previewInvoice}
              company={company}
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

      {/* Delivery Note Modal */}
      <DeliveryNoteModal />

      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode
            ? "bg-[#1E2328] border-[#37474F]"
            : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1
              className={`text-2xl font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              📄 All Invoices
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage and track all your invoices
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {authService.hasPermission('invoices', 'create') && (
              <Link
                to="/create-invoice"
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
            onClick={() => handleCardClick('outstanding')}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === 'outstanding'
                ? isDarkMode
                  ? "bg-orange-900/30 border-orange-600 ring-2 ring-orange-600"
                  : "bg-orange-50 border-orange-500 ring-2 ring-orange-500"
                : isDarkMode
                ? "bg-[#1E2328] border-[#37474F] hover:border-orange-600/50"
                : "bg-white border-[#E0E0E0] hover:border-orange-500/50"
            }`}
          >
            <div className="py-4 px-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-orange-600 font-semibold">
                Outstanding
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(getOutstandingAmount())}
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Click to filter
              </p>
            </div>
          </button>

          {/* Overdue Card */}
          <button
            onClick={() => handleCardClick('overdue')}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === 'overdue'
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
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(getOverdueMetrics().amount)}
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {getOverdueMetrics().count} invoice{getOverdueMetrics().count !== 1 ? 's' : ''}
              </p>
            </div>
          </button>

          {/* Due Soon Card */}
          <button
            onClick={() => handleCardClick('due_soon')}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === 'due_soon'
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
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(getDueSoonMetrics(7).amount)}
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {getDueSoonMetrics(7).count} invoice{getDueSoonMetrics(7).count !== 1 ? 's' : ''}
              </p>
            </div>
          </button>

          {/* Paid Amount Card */}
          <button
            onClick={() => handleCardClick('paid')}
            className={`text-center border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
              activeCardFilter === 'paid'
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
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getPaidAmount())}
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Click to filter
              </p>
            </div>
          </button>
        </div>

        {/* Active Filter Banner */}
        {activeCardFilter && (
          <div className={`flex items-center justify-between px-4 py-3 mb-6 rounded-lg border ${
            isDarkMode
              ? "bg-teal-900/20 border-teal-600/50"
              : "bg-teal-50 border-teal-200"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? "text-teal-300" : "text-teal-700"
              }`}>
                Showing: {
                  activeCardFilter === 'outstanding' ? 'Outstanding Invoices' :
                  activeCardFilter === 'overdue' ? 'Overdue Invoices' :
                  activeCardFilter === 'due_soon' ? 'Invoices Due in 7 Days' :
                  activeCardFilter === 'paid' ? 'Paid Invoices' : ''
                }
              </span>
            </div>
            <button
              onClick={() => {
                setActiveCardFilter(null);
                setPaymentStatusFilter('all');
                setStatusFilter('all');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? "bg-teal-800 text-teal-100 hover:bg-teal-700"
                  : "bg-teal-600 text-white hover:bg-teal-700"
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
              <Search
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
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
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
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
              <ChevronDown
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          </div>
          <div className="min-w-[170px] relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          </div>
          <div className="min-w-[150px] relative">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={20}>20 per page</option>
              <option value={25}>25 per page</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedInvoiceIds.size > 0 && (
          <div className={`flex items-center justify-end px-4 py-3 mb-6 rounded-lg border ${
            isDarkMode
              ? "bg-teal-900/20 border-teal-600/50"
              : "bg-teal-50 border-teal-200"
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkDownload(selectedInvoiceIds)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-teal-700 text-white hover:bg-teal-600"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                <Download size={16} />
                Download Selected
              </button>
              <button
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
                <th
                  className={`px-4 py-3 text-left ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) {
                        input.indeterminate = isSomeSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Invoice #
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Customer
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Due Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Amount
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {console.log("TABLE FIELD CHECK", {
                sampleKeys: Object.keys(filteredInvoices[0] || {}),
                sampleInvoiceNumber: filteredInvoices[0]?.invoiceNumber,
                sampleCustomerName: filteredInvoices[0]?.customerDetails?.name,
                count: filteredInvoices.length
              })}
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className={`text-6xl ${isDarkMode ? 'opacity-50' : 'opacity-30'}`}>
                        📄
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold mb-2 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                          No Invoices Found
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                          {activeCardFilter
                            ? "No invoices match the selected filter. Try a different filter or clear it."
                            : searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all"
                            ? "No invoices match your search criteria. Try adjusting your filters."
                            : "Create your first invoice to get started"}
                        </p>
                        {activeCardFilter && (
                          <button
                            onClick={() => {
                              setActiveCardFilter(null);
                              setPaymentStatusFilter('all');
                              setStatusFilter('all');
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
                        {!activeCardFilter && !searchTerm && statusFilter === "all" && paymentStatusFilter === "all" && (
                          <Link
                            to="/create-invoice"
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
                filteredInvoices.map((invoice, index) => {
                console.log(`[${instanceRef.current}] 🔨 CREATING ROW ${index + 1}/${filteredInvoices.length}`, {
                  id: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: invoice.customerDetails?.name
                });
                const isDeleted = invoice.deletedAt;
                const isSelected = selectedInvoiceIds.has(invoice.id);
                return (
                <tr
                  key={invoice.id}
                  className={`hover:${
                    isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"
                  } transition-colors ${
                    isDeleted
                      ? isDarkMode
                        ? 'bg-red-900/10 opacity-60'
                        : 'bg-red-50/50 opacity-70'
                      : isSelected
                      ? isDarkMode
                        ? 'bg-teal-900/20'
                        : 'bg-teal-50'
                      : ''
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
                    <div className={`text-sm font-semibold ${isDeleted ? 'line-through' : ''} text-teal-600`}>
                      {invoice.invoiceNumber}
                    </div>
                    {isDeleted && (
                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                        title={`Deleted: ${invoice.deletionReason || 'No reason provided'}`}
                      >
                        🗑️ DELETED
                      </div>
                    )}
                    {invoice.recreatedFrom && (
                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-yellow-400" : "text-yellow-600"
                        }`}
                      >
                        🔄 Recreated from {invoice.recreatedFrom}
                      </div>
                    )}
                    {invoice.status === "cancelled" && (
                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        ❌ Cancelled & Recreated
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {invoice.customerDetails?.name || invoice.customer?.name}
                      </div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {invoice.customerDetails?.email || invoice.customer?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {formatDate(invoice.invoiceDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {formatDate(invoice.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(invoice.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <InvoiceStatusColumn
                      invoice={invoice}
                      isDarkMode={isDarkMode}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-0.5 justify-end">
                      {(() => {
                        const actions = getActionButtonConfig(invoice);

                        return (
                          <>
                            {/* Edit button - Always visible */}
                            {actions.edit.enabled ? (
                              <Link
                                to={actions.edit.link}
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  isDarkMode
                                    ? "text-blue-400 hover:text-blue-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-blue-50 text-blue-600 bg-white"
                                }`}
                                title={actions.edit.tooltip}
                              >
                                <Edit size={18} />
                              </Link>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.edit.tooltip}
                              >
                                <Edit size={18} />
                              </button>
                            )}

                            {/* Credit Note button - Always visible */}
                            {actions.creditNote.enabled ? (
                              <button
                                onClick={() => navigate(actions.creditNote.link)}
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  isDarkMode
                                    ? "text-purple-400 hover:text-purple-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-purple-50 text-purple-600 bg-white"
                                }`}
                                title={actions.creditNote.tooltip}
                              >
                                <FileMinus size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.creditNote.tooltip}
                              >
                                <FileMinus size={18} />
                              </button>
                            )}

                            {/* View button - Always enabled */}
                            <button
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
                                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                                    isDarkMode ? 'bg-orange-400' : 'bg-orange-500'
                                  }`} title="Incomplete"></div>
                                )}
                              </div>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.download.tooltip}
                              >
                                <Download size={18} />
                              </button>
                            )}

                            {/* Record Payment button - Always visible (green for unpaid, blue for paid/view-only) */}
                            {actions.recordPayment.enabled ? (
                              <button
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
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.recordPayment.tooltip}
                              >
                                <CircleDollarSign size={18} />
                              </button>
                            )}

                            {/* Commission button - Always visible */}
                            {actions.commission.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                                  calculatingCommissionIds.has(invoice.id)
                                    ? "bg-transparent"
                                    : isDarkMode
                                    ? "text-blue-400 hover:text-blue-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-blue-50 text-blue-600 bg-white"
                                }`}
                                title={actions.commission.tooltip}
                                onClick={() => handleCalculateCommission(invoice)}
                                disabled={calculatingCommissionIds.has(invoice.id)}
                              >
                                {calculatingCommissionIds.has(invoice.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <Award size={18} />
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.commission.tooltip}
                              >
                                <Award size={18} />
                              </button>
                            )}

                            {/* Reminder button - Always visible */}
                            {actions.reminder.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                                  sendingReminderIds.has(invoice.id)
                                    ? "bg-transparent"
                                    : isDarkMode
                                    ? "text-yellow-400 hover:text-yellow-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-yellow-50 text-yellow-600 bg-white"
                                }`}
                                title={actions.reminder.tooltip}
                                onClick={() => handleSendReminder(invoice)}
                                disabled={sendingReminderIds.has(invoice.id)}
                              >
                                {sendingReminderIds.has(invoice.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <Bell size={18} />
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.reminder.tooltip}
                              >
                                <Bell size={18} />
                              </button>
                            )}

                            {/* Phone button - Always visible */}
                            {actions.phone.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  isDarkMode
                                    ? "text-orange-400 hover:text-orange-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-orange-50 text-orange-600 bg-white"
                                }`}
                                title={actions.phone.tooltip}
                                onClick={() => handleOpenPaymentReminder(invoice)}
                              >
                                <Phone size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.phone.tooltip}
                              >
                                <Phone size={18} />
                              </button>
                            )}

                            {/* Statement button - Always visible */}
                            {actions.statement.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  isDarkMode
                                    ? "text-purple-400 hover:text-purple-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-purple-50 text-purple-600 bg-white"
                                }`}
                                title={actions.statement.tooltip}
                                onClick={() => handleGenerateStatement(invoice)}
                              >
                                <FileText size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.statement.tooltip}
                              >
                                <FileText size={18} />
                              </button>
                            )}

                            {/* Delivery Note button - Always visible */}
                            {actions.deliveryNote.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  actions.deliveryNote.hasNotes
                                    ? isDarkMode
                                      ? "text-yellow-400 hover:text-yellow-300 bg-gray-800/30 hover:bg-gray-700/50"
                                      : "hover:bg-yellow-50 text-yellow-600 bg-white"
                                    : isDarkMode
                                    ? "text-green-400 hover:text-green-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-green-50 text-green-600 bg-white"
                                }`}
                                title={actions.deliveryNote.tooltip}
                                onClick={() =>
                                  actions.deliveryNote.hasNotes
                                    ? navigate(`/delivery-notes?invoiceId=${invoice.id}`)
                                    : handleCreateDeliveryNote(invoice)
                                }
                              >
                                <Truck size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.deliveryNote.tooltip}
                              >
                                <Truck size={18} />
                              </button>
                            )}

                            {/* Delete button - Always visible */}
                            {actions.delete.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  isDarkMode
                                    ? "text-red-400 hover:text-red-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-red-50 text-red-600 bg-white"
                                }`}
                                title={actions.delete.tooltip}
                                onClick={() => handleDeleteInvoice(invoice)}
                              >
                                <Trash2 size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.delete.tooltip}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}

                            {/* Restore button - Always visible */}
                            {actions.restore.enabled ? (
                              <button
                                className={`p-2 rounded transition-all shadow-sm hover:shadow-md ${
                                  isDarkMode
                                    ? "text-green-400 hover:text-green-300 bg-gray-800/30 hover:bg-gray-700/50"
                                    : "hover:bg-green-50 text-green-600 bg-white"
                                }`}
                                title={actions.restore.tooltip}
                                onClick={() => handleRestoreInvoice(invoice)}
                              >
                                <RotateCcw size={18} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className={`p-2 rounded shadow-sm cursor-not-allowed opacity-30 ${
                                  isDarkMode ? "bg-gray-800/30 text-gray-500" : "bg-gray-100 text-gray-400"
                                }`}
                                title={actions.restore.tooltip}
                              >
                                <RotateCcw size={18} />
                              </button>
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
            <div
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Showing {(pagination.currentPage - 1) * pagination.perPage + 1}{" "}
              to{" "}
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.total
              )}{" "}
              of {pagination.total} invoices
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) =>
                  handlePageChange(e, pagination.currentPage - 1)
                }
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
              <span
                className={`px-3 py-1 text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={(e) =>
                  handlePageChange(e, pagination.currentPage + 1)
                }
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
      />

      {/* Record Payment Drawer - Exact replica from Receivables */}
      {showRecordPaymentDrawer && paymentDrawerInvoice && (
        <div className="fixed inset-0 z-[1100] flex">
          <div className="flex-1 bg-black/30" onClick={handleCloseRecordPaymentDrawer}></div>
          <div className={`w-full max-w-md h-full overflow-auto ${
            isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'
          } shadow-xl`}>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {paymentDrawerInvoice.invoiceNo || paymentDrawerInvoice.invoiceNumber}
                </div>
                <div className="text-sm opacity-70">
                  {paymentDrawerInvoice.customer?.name || ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                  paymentDrawerInvoice.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : paymentDrawerInvoice.paymentStatus === 'partially_paid'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}>
                  {paymentDrawerInvoice.paymentStatus === 'paid' ? 'Paid' :
                   paymentDrawerInvoice.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Unpaid'}
                </span>
                <button onClick={handleCloseRecordPaymentDrawer} className="p-2 rounded hover:bg-gray-100">
                  <X size={18}/>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Invoice Summary Section */}
              <div className={`p-4 rounded-lg border-2 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-700'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
              }`}>
                <div className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                  isDarkMode ? 'text-blue-100' : 'text-blue-900'
                }`}>
                  <CircleDollarSign size={18} />
                  Invoice Summary
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Total Amount
                    </div>
                    <div className={`font-bold text-lg ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>
                      {formatCurrency(paymentDrawerInvoice.invoiceAmount || paymentDrawerInvoice.total || 0)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Paid Amount
                    </div>
                    <div className={`font-bold text-lg ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(paymentDrawerInvoice.received || 0)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Balance Due
                    </div>
                    <div className={`font-bold text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {formatCurrency(paymentDrawerInvoice.outstanding || 0)}
                    </div>
                  </div>
                </div>
                <div className={`pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
                  isDarkMode ? 'border-blue-700 text-blue-300' : 'border-blue-300 text-blue-700'
                }`}>
                  <div>
                    <strong>Invoice Date:</strong> {formatDate(paymentDrawerInvoice.invoiceDate) || 'N/A'}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {formatDate(paymentDrawerInvoice.dueDate) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Payments Timeline */}
              <div>
                <div className="font-semibold mb-2">Payments</div>
                <div className="space-y-2">
                  {(paymentDrawerInvoice.payments || []).length === 0 && (
                    <div className="text-sm opacity-70">No payments recorded yet.</div>
                  )}
                  {(paymentDrawerInvoice.payments || []).map((p, idx) => {
                    const paymentIndex = (paymentDrawerInvoice.payments || []).length - idx;
                    const paymentMode = PAYMENT_MODES[p.method] || PAYMENT_MODES.other;
                    return (
                      <div key={p.id || idx} className={`p-2 rounded border ${
                        p.voided ? 'opacity-60 line-through' : ''
                      }`}>
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{formatCurrency(p.amount || 0)}</div>
                            <div className="opacity-70">
                              {paymentMode.icon} {paymentMode.label}
                              {p.referenceNo && <> • {p.referenceNo}</>}
                            </div>
                            {p.receiptNumber && (
                              <div className="text-xs mt-1 text-teal-600 font-semibold">
                                Receipt: {p.receiptNumber}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div>{formatDate(p.paymentDate)}</div>
                            {p.voided && <div className="text-xs text-red-600">Voided</div>}
                          </div>
                        </div>
                        {p.notes && <div className="text-xs mt-1 opacity-80">{p.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Payment Form */}
              {paymentDrawerInvoice.outstanding > 0 ? (
                <AddPaymentForm
                  outstanding={paymentDrawerInvoice.outstanding || 0}
                  onSave={handleAddPayment}
                />
              ) : (
                <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="font-medium">Invoice Fully Paid</span>
                </div>
              )}

              {/* Quick Actions */}
              {paymentDrawerInvoice.outstanding > 0 &&
               paymentDrawerInvoice.payments &&
               paymentDrawerInvoice.payments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-2 rounded border"
                    onClick={handleVoidLastPayment}
                  >
                    <Trash2 size={16} className="inline mr-1"/>Void last
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

// Payment Form Component - Exact replica from Receivables
const AddPaymentForm = ({ outstanding = 0, onSave }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const modeConfig = PAYMENT_MODES[method] || PAYMENT_MODES.cash;
  const numberInput = (v) => (v === '' || isNaN(Number(v)) ? '' : v);

  const canSave =
    Number(amount) > 0 &&
    Number(amount) <= Number(outstanding || 0) &&
    (!modeConfig.requiresRef || (reference && reference.trim() !== '')) &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSave({ amount: Number(amount), method, reference_no: reference, notes, payment_date: date });
      // Clear form after successful save
      setDate(new Date().toISOString().slice(0,10));
      setAmount('');
      setMethod('cash');
      setReference('');
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50">
      <div className="font-semibold mb-3 text-teal-900 flex items-center gap-2">
        <CircleDollarSign size={18} />
        Record Payment Details
      </div>
      {outstanding > 0 && (
        <>
          <div className="mb-3 px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg flex justify-between items-center border border-blue-200">
            <span className="font-semibold">Outstanding Balance:</span>
            <button
              type="button"
              onClick={() => setAmount(outstanding.toString())}
              className="font-bold text-blue-800 hover:text-blue-900 cursor-pointer hover:scale-105 transition-all group px-2 py-1 rounded hover:bg-blue-200"
              title="Click to apply this amount to payment"
            >
              {formatCurrency(outstanding)}
              <span className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                ✓ Apply
              </span>
            </button>
          </div>
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-800">
              <strong>📋 Note:</strong> All payment details are required for proper accounting records. Click the balance amount above to auto-fill the payment amount.
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="px-3 py-2.5 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            value={date}
            onChange={e=>setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">
            Amount <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-1">(max: {formatCurrency(outstanding)})</span>
          </label>
          <input
            type="number"
            step="0.01"
            max={outstanding}
            className={`px-3 py-2.5 rounded-lg border w-full focus:ring-2 focus:ring-teal-500 transition-all ${
              Number(amount) > Number(outstanding)
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-teal-500'
            }`}
            value={amount}
            onChange={e=>setAmount(numberInput(e.target.value))}
            placeholder="0.00"
            required
          />
          {Number(amount) > Number(outstanding) && (
            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <span>⚠️</span> Amount cannot exceed outstanding balance
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            value={method}
            onChange={e=>{setMethod(e.target.value); setReference('');}}
            required
          >
            {Object.values(PAYMENT_MODES).map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">
            {modeConfig.refLabel || 'Reference #'}
            {modeConfig.requiresRef && <span className="text-red-500"> *</span>}
            {!modeConfig.requiresRef && <span className="text-gray-500 font-normal ml-1">(Optional)</span>}
          </label>
          <input
            className={`px-3 py-2.5 rounded-lg border w-full focus:ring-2 transition-all ${
              modeConfig.requiresRef && (!reference || reference.trim() === '')
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'
            }`}
            value={reference}
            onChange={e=>setReference(e.target.value)}
            placeholder={modeConfig.requiresRef ? `Enter ${modeConfig.refLabel || 'reference'} (required)` : 'Optional'}
            required={modeConfig.requiresRef}
          />
          {modeConfig.requiresRef && (!reference || reference.trim() === '') && (
            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <span>⚠️</span> Required for {modeConfig.label}
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1.5">
            Notes <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <textarea
            className="px-3 py-2.5 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-y min-h-[60px]"
            rows={2}
            value={notes}
            onChange={e=>setNotes(e.target.value)}
            placeholder="Add any additional notes about this payment..."
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {notes.length}/200
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          disabled={!canSave}
          onClick={handleSave}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${canSave ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              💾 Save Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InvoiceList;
