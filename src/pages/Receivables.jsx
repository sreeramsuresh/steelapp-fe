import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  Banknote,
  Download,
  RefreshCw,
  X,
  CheckCircle,
  Trash2,
  Printer,
} from 'lucide-react';
import { payablesService, invoiceService } from '../services/dataService';
import { createPaymentPayload } from '../services/paymentService';
import { uuid } from '../utils/uuid';
import {
  formatCurrency,
  formatDate as formatDateUtil,
} from '../utils/invoiceUtils';
import { authService } from '../services/axiosAuthService';
import { notificationService } from '../services/notificationService';
import {
  generatePaymentReceipt,
  printPaymentReceipt,
} from '../utils/paymentReceiptGenerator';
import { PAYMENT_MODES } from '../utils/paymentUtils';
import AddPaymentForm from '../components/payments/AddPaymentForm';
import PaymentDrawer from '../components/payments/PaymentDrawer';
import { FormSelect } from '../components/ui/form-select';
import { SelectItem } from '../components/ui/select';

// Stale-while-revalidate cache configuration
const CACHE_KEYS = {
  RECEIVABLES: 'finance_receivables_cache',
};
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Void payment reasons for the dropdown
 */
const VOID_REASONS = [
  { value: 'cheque_bounced', label: 'Cheque bounced' },
  { value: 'duplicate_entry', label: 'Duplicate entry' },
  { value: 'wrong_amount', label: 'Wrong amount' },
  { value: 'wrong_invoice', label: 'Wrong invoice' },
  { value: 'customer_refund', label: 'Customer refund' },
  { value: 'payment_cancelled', label: 'Payment cancelled' },
  { value: 'data_entry_error', label: 'Data entry error' },
  { value: 'other', label: 'Other' },
];

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
};

const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Cache clear failed:', e);
  }
};

const Pill = ({ color = 'gray', children }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    teal: 'bg-teal-100 text-teal-800 border-teal-300',
  };
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${colors[color] || colors.gray}`}
    >
      {children}
    </span>
  );
};

const useURLState = (initial) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => {
    const obj = { ...initial };
    for (const key of Object.keys(initial)) {
      const v = searchParams.get(key);
      if (v !== null) obj[key] = v;
    }
    return obj;
  }, [searchParams, initial]);
  const setState = (patch) => {
    const next = {
      ...state,
      ...(typeof patch === 'function' ? patch(state) : patch),
    };
    const entries = Object.entries(next).filter(
      ([, v]) => v !== '' && v !== undefined && v !== null,
    );
    setSearchParams(Object.fromEntries(entries), { replace: true });
  };
  return [state, setState];
};

const StatusPill = ({ status }) => {
  const map = {
    unpaid: { label: 'Unpaid', color: 'red' },
    partially_paid: { label: 'Partially Paid', color: 'yellow' },
    paid: { label: 'Paid', color: 'green' },
    overdue: { label: 'Overdue', color: 'red' },
  };
  const cfg = map[status] || map.unpaid;
  return <Pill color={cfg.color}>{cfg.label}</Pill>;
};

// Use timezone-aware date formatting from invoiceUtils (which uses timezone.js)
const formatDate = (d) => {
  return formatDateUtil(d);
};

const numberInput = (v) => (v === '' || isNaN(Number(v)) ? '' : v);

const downloadBlob = (blob, filename) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download failed', e);
  }
};

const Receivables = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [filters, setFilters] = useURLState({
    q: '',
    status: 'all',
    dateType: 'invoice',
    start: '',
    end: '',
    customer: '',
    minOut: '',
    maxOut: '',
    page: '1',
    size: '10',
  });

  // Initialize state with cached data if available (stale-while-revalidate)
  const initializeFromCache = useCallback(() => {
    const cached = getCachedData(CACHE_KEYS.RECEIVABLES);
    if (cached && cached.data) {
      const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;
      return {
        items: cached.data.items || [],
        loading: isStale, // If stale, show loading indicator while revalidating
        hasCache: true,
      };
    }
    return { items: [], loading: true, hasCache: false };
  }, []);

  const cachedState = initializeFromCache();
  const [loading, setLoading] = useState(cachedState.loading);
  const [items, setItems] = useState(cachedState.items);
  const [selected, setSelected] = useState(new Set());
  const [drawer, setDrawer] = useState({ open: false, item: null });
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [printingReceiptId, setPrintingReceiptId] = useState(null);
  const [voidDropdownPaymentId, setVoidDropdownPaymentId] = useState(null);
  const [voidCustomReason, setVoidCustomReason] = useState('');
  const [isVoidingPayment, setIsVoidingPayment] = useState(false);
  const page = Number(filters.page || 1);
  const size = Number(filters.size || 10);

  const canManage =
    authService.hasPermission('payables', 'manage') ||
    authService.hasPermission('payables', 'write') ||
    authService.hasRole(['admin', 'finance']);

  // Generate cache key based on current filters (for filter-specific caching)
  const getCacheKeyWithFilters = useCallback(() => {
    const filterKey = JSON.stringify({
      q: filters.q,
      status: filters.status,
      start: filters.start,
      end: filters.end,
      dateType: filters.dateType,
      customer: filters.customer,
      minOut: filters.minOut,
      maxOut: filters.maxOut,
      page: filters.page,
      size: filters.size,
    });
    return `${CACHE_KEYS.RECEIVABLES}_${btoa(filterKey).slice(0, 20)}`;
  }, [
    filters.q,
    filters.status,
    filters.start,
    filters.end,
    filters.dateType,
    filters.customer,
    filters.minOut,
    filters.maxOut,
    filters.page,
    filters.size,
  ]);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = getCacheKeyWithFilters();

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached && cached.data) {
          const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;
          setItems(cached.data.items || []);

          if (!isStale) {
            // Cache is fresh, no need to fetch
            setLoading(false);
            return;
          }
          // Cache is stale, continue to fetch but don&apos;t show loading (stale-while-revalidate)
          setLoading(false);
        } else {
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      // Fetch fresh data in background
      try {
        const { items: fetchedItems } = await payablesService.getInvoices({
          search: filters.q || undefined,
          status: filters.status === 'all' ? undefined : filters.status,
          start_date: filters.start || undefined,
          end_date: filters.end || undefined,
          date_type: filters.dateType,
          customer: filters.customer || undefined,
          min_outstanding: filters.minOut || undefined,
          max_outstanding: filters.maxOut || undefined,
          page,
          limit: size,
        });

        setItems(fetchedItems);
        // Update cache with fresh data
        setCachedData(cacheKey, { items: fetchedItems });
      } catch (error) {
        console.error('Failed to fetch receivables:', error);
        // On error, keep showing cached data if available
      } finally {
        setLoading(false);
      }
    },
    [
      filters.q,
      filters.status,
      filters.start,
      filters.end,
      filters.dateType,
      filters.customer,
      filters.minOut,
      filters.maxOut,
      page,
      size,
      getCacheKeyWithFilters,
    ],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper to get invoice amount - handles both old and new API field names
  const getInvoiceAmount = (r) =>
    Number(r.invoiceAmount || r.totalAmount || r.total || 0);
  // Helper to get received amount - handles both old and new API field names
  const getReceived = (r) => Number(r.received || r.amountPaid || 0);
  // Helper to get outstanding amount - handles both old and new API field names
  const getOutstanding = (r) => Number(r.outstanding || r.balanceDue || 0);
  // Helper to get customer name - handles both nested object and flat field
  const getCustomerName = (r) => r.customer?.name || r.customerName || '';
  // Helper to get customer ID
  const getCustomerId = (r) => r.customer?.id || r.customerId || '';

  const aggregates = useMemo(() => {
    const totalInvoiced = items.reduce((s, r) => s + getInvoiceAmount(r), 0);
    const totalReceived = items.reduce((s, r) => s + getReceived(r), 0);
    const totalOutstanding = items.reduce((s, r) => s + getOutstanding(r), 0);
    const overdueAmount = items
      .filter((r) => r.status === 'overdue')
      .reduce((s, r) => s + getOutstanding(r), 0);
    const today = new Date();
    const pastDueDays = items
      .filter(
        (r) =>
          r.dueDate && new Date(r.dueDate) < today && getOutstanding(r) > 0,
      )
      .map((r) =>
        Math.floor((today - new Date(r.dueDate)) / (1000 * 60 * 60 * 24)),
      );
    const avgDaysPastDue = pastDueDays.length
      ? Math.round(pastDueDays.reduce((a, b) => a + b, 0) / pastDueDays.length)
      : 0;
    return {
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      overdueAmount,
      avgDaysPastDue,
    };
  }, [items]);

  const allSelected = selected.size > 0 && selected.size === items.length;
  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  };
  const toggleOne = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const openDrawer = (item) => setDrawer({ open: true, item });
  const closeDrawer = () => setDrawer({ open: false, item: null });

  const handleAddPayment = async ({
    amount,
    method,
    referenceNo,
    notes,
    paymentDate,
  }) => {
    // Guard against double-submit
    if (isSavingPayment) return;

    const inv = drawer.item;
    if (!inv) return;
    const outstanding = getOutstanding(inv);
    const invoiceAmount = getInvoiceAmount(inv);
    const currentReceived = getReceived(inv);
    if (!(Number(amount) > 0)) return alert('Amount must be > 0');
    if (Number(amount) > outstanding)
      return alert('Amount exceeds outstanding');

    setIsSavingPayment(true);

    // Clear cache on mutation to ensure fresh data on next fetch
    clearCache(getCacheKeyWithFilters());

    // Use standardized payment payload (camelCase for API Gateway auto-conversion)
    const apiPayload = createPaymentPayload({
      amount,
      paymentMethod: method, // Map local 'method' to standard 'paymentMethod'
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      referenceNumber: referenceNo, // Map local 'referenceNo' to standard 'referenceNumber'
      notes,
    });

    // Create local payment object for optimistic UI update
    const newPayment = {
      id: uuid(),
      ...apiPayload,
      method, // Keep 'method' for backward compat with UI display
      referenceNo, // Keep 'referenceNo' for backward compat with UI display
      createdAt: new Date().toISOString(),
    };
    const updated = { ...inv, payments: [...(inv.payments || []), newPayment] };
    const newReceived = currentReceived + newPayment.amount;
    const newOutstanding = Math.max(
      0,
      +(outstanding - newPayment.amount).toFixed(2),
    );
    let newStatus = inv.status;
    if (newOutstanding === 0) newStatus = 'paid';
    else if (newOutstanding < invoiceAmount) newStatus = 'partially_paid';
    const derived = {
      received: newReceived,
      outstanding: newOutstanding,
      status: newStatus,
    };
    const updatedInv = { ...updated, ...derived };
    // Store original state for rollback
    const originalInv = inv;

    // Optimistic UI update
    setDrawer({ open: true, item: updatedInv });
    setItems((prev) => prev.map((i) => (i.id === inv.id ? updatedInv : i)));

    try {
      // Send standardized payload to API
      await invoiceService.addInvoicePayment(inv.id, apiPayload);

      notificationService.success('Payment recorded successfully!');

      // Fetch fresh data to get backend-generated receipt number
      const freshData = await invoiceService.getInvoice(inv.id);
      const freshComputed = {
        received: freshData.received || newReceived,
        outstanding: freshData.outstanding || newOutstanding,
        status:
          freshData.payment_status || freshData.paymentStatus || newStatus,
        invoiceAmount:
          freshData.invoiceAmount || freshData.total || invoiceAmount,
      };
      const freshInv = { ...freshData, ...freshComputed };
      setDrawer({ open: true, item: freshInv });
      setItems((prev) => prev.map((i) => (i.id === inv.id ? freshInv : i)));
    } catch (e) {
      // Error - show notification and reload fresh data
      console.error('Failed to persist payment to backend:', e);
      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Failed to record payment';
      notificationService.error(errorMsg);

      // Reload fresh data to restore correct state
      try {
        const freshData = await invoiceService.getInvoice(inv.id);
        setDrawer({ open: true, item: freshData });
        setItems((prev) => prev.map((i) => (i.id === inv.id ? freshData : i)));
      } catch (reloadErr) {
        console.error('Error reloading invoice:', reloadErr);
        // Fallback to original state if reload fails
        setDrawer({ open: true, item: originalInv });
        setItems((prev) =>
          prev.map((i) => (i.id === inv.id ? originalInv : i)),
        );
      }
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleVoidLast = async () => {
    const inv = drawer.item;
    if (!inv) return;
    const payments = (inv.payments || []).filter((p) => !p.voided);
    if (payments.length === 0) return;
    const last = payments[payments.length - 1];

    // Clear cache on mutation to ensure fresh data on next fetch
    clearCache(getCacheKeyWithFilters());

    const updatedPayments = inv.payments.map((p) =>
      p.id === last.id
        ? { ...p, voided: true, voidedAt: new Date().toISOString() }
        : p,
    );
    const updated = { ...inv, payments: updatedPayments };
    const invoiceAmount = getInvoiceAmount(inv);
    const received = updatedPayments
      .filter((p) => !p.voided)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, +(invoiceAmount - received).toFixed(2));
    let status = 'unpaid';
    if (outstanding === 0) status = 'paid';
    else if (outstanding < invoiceAmount) status = 'partially_paid';
    const updatedInv = { ...updated, received, outstanding, status };
    // Optimistic UI update
    setDrawer({ open: true, item: updatedInv });
    setItems((prev) => prev.map((i) => (i.id === inv.id ? updatedInv : i)));

    try {
      await invoiceService.voidInvoicePayment(
        inv.id,
        last.id,
        'User void via UI',
      );
      notificationService.success('Payment voided successfully');

      // Fetch fresh data
      const freshData = await invoiceService.getInvoice(inv.id);
      setDrawer({ open: true, item: freshData });
      setItems((prev) => prev.map((i) => (i.id === inv.id ? freshData : i)));
    } catch (e) {
      console.error('Failed to persist void to backend:', e);
      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Failed to void payment';
      notificationService.error(errorMsg);

      // Reload fresh data to restore correct state
      try {
        const freshData = await invoiceService.getInvoice(inv.id);
        setDrawer({ open: true, item: freshData });
        setItems((prev) => prev.map((i) => (i.id === inv.id ? freshData : i)));
      } catch (reloadErr) {
        console.error('Error reloading invoice:', reloadErr);
      }
    }
  };

  const handleVoidPayment = async (paymentId, reason) => {
    const inv = drawer.item;
    if (!inv || !paymentId || !reason) return;

    const paymentToVoid = (inv.payments || []).find((p) => p.id === paymentId);
    if (!paymentToVoid || paymentToVoid.voided) return;

    setIsVoidingPayment(true);

    // Optimistic UI update
    const updatedPayments = inv.payments.map((p) =>
      p.id === paymentId
        ? {
          ...p,
          voided: true,
          voided_at: new Date().toISOString(),
          void_reason: reason,
          voided_by: authService.getCurrentUser()?.name || 'User',
        }
        : p,
    );
    const invoiceAmount = getInvoiceAmount(inv);
    const received = updatedPayments
      .filter((p) => !p.voided)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, +(invoiceAmount - received).toFixed(2));
    let status = 'unpaid';
    if (outstanding === 0) status = 'paid';
    else if (outstanding < invoiceAmount) status = 'partially_paid';

    const updatedInv = {
      ...inv,
      payments: updatedPayments,
      received,
      outstanding,
      status,
    };

    // Optimistic UI update
    setDrawer({ open: true, item: updatedInv });
    setItems((prev) => prev.map((i) => (i.id === inv.id ? updatedInv : i)));

    try {
      await invoiceService.voidInvoicePayment(inv.id, paymentId, reason);
      setVoidDropdownPaymentId(null);
      setVoidCustomReason('');
      notificationService.success('Payment voided successfully');

      // Fetch fresh data
      const freshData = await invoiceService.getInvoice(inv.id);
      setDrawer({ open: true, item: freshData });
      setItems((prev) => prev.map((i) => (i.id === inv.id ? freshData : i)));
    } catch (error) {
      console.error('Error voiding payment:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to void payment';
      notificationService.error(errorMsg);

      // Reload fresh data to restore correct state
      try {
        const freshData = await invoiceService.getInvoice(inv.id);
        setDrawer({ open: true, item: freshData });
        setItems((prev) => prev.map((i) => (i.id === inv.id ? freshData : i)));
      } catch (reloadErr) {
        console.error('Error reloading invoice:', reloadErr);
      }
    } finally {
      setIsVoidingPayment(false);
    }
  };

  const handleDownloadReceipt = async (payment, paymentIndex) => {
    const inv = drawer.item;
    if (!inv) {
      alert('Unable to generate receipt. Missing invoice information.');
      return;
    }

    // Get company info from localStorage or API
    const companyInfo = JSON.parse(
      localStorage.getItem('companySettings') || '{}',
    );

    setDownloadingReceiptId(payment.id);
    try {
      const invoiceData = {
        invoiceNumber: inv.invoiceNo || inv.invoiceNumber,
        total: getInvoiceAmount(inv),
        payments: inv.payments || [],
        customer: inv.customer || {
          name: getCustomerName(inv),
          id: getCustomerId(inv),
        },
      };
      const result = await generatePaymentReceipt(
        payment,
        invoiceData,
        companyInfo,
        paymentIndex,
      );
      if (!result.success) {
        alert(`Error generating receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    const inv = drawer.item;
    if (!inv) {
      alert('Unable to print receipt. Missing invoice information.');
      return;
    }

    // Get company info from localStorage or API
    const companyInfo = JSON.parse(
      localStorage.getItem('companySettings') || '{}',
    );

    setPrintingReceiptId(payment.id);
    try {
      const invoiceData = {
        invoiceNumber: inv.invoiceNo || inv.invoiceNumber,
        total: getInvoiceAmount(inv),
        payments: inv.payments || [],
        customer: inv.customer || {
          name: getCustomerName(inv),
          id: getCustomerId(inv),
        },
      };
      const result = await printPaymentReceipt(
        payment,
        invoiceData,
        companyInfo,
        paymentIndex,
      );
      if (!result.success) {
        alert(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt. Please try again.');
    } finally {
      setPrintingReceiptId(null);
    }
  };

  const exportInvoices = async () => {
    try {
      const params = {
        search: filters.q || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
        start_date: filters.start || undefined,
        end_date: filters.end || undefined,
        date_type: filters.dateType,
        customer: filters.customer || undefined,
        min_outstanding: filters.minOut || undefined,
        max_outstanding: filters.maxOut || undefined,
      };
      const blob = await payablesService.exportDownload(
        'invoices',
        params,
        'csv',
      );
      downloadBlob(blob, 'invoices.csv');
      return;
    } catch (e) {
      console.warn('Backend export failed, falling back to client CSV');
    }
    const headers = [
      'Invoice #',
      'Customer',
      'Invoice Date',
      'Due Date',
      'Currency',
      'Invoice Amount',
      'Received To-Date',
      'Outstanding',
      'Status',
    ];
    const rows = items.map((r) => [
      r.invoiceNo || r.invoiceNumber,
      getCustomerName(r),
      r.invoiceDate || r.date,
      r.dueDate || r.dueDate,
      r.currency || 'AED',
      getInvoiceAmount(r),
      getReceived(r),
      getOutstanding(r),
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((v) =>
            v !== undefined && v !== null ? `${v}`.replace(/"/g, '""') : '',
          )
          .map((v) => `"${v}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`p-2 sm:p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <Banknote size={20} />
          </div>
          <div>
            <div className="font-bold text-xl">Receivables</div>
            <div className="text-xs opacity-70">
              Track customer invoices and receipts
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div
        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <FormSelect
              value={filters.dateType}
              onValueChange={(value) =>
                setFilters({ dateType: value, page: '1' })
              }
              showValidation={false}
              className="w-32"
            >
              <SelectItem value="invoice">Invoice Date</SelectItem>
              <SelectItem value="due">Due Date</SelectItem>
            </FormSelect>
            <input
              type="date"
              value={filters.start}
              onChange={(e) => setFilters({ start: e.target.value, page: '1' })}
              className="px-2 py-2 rounded border flex-1 min-w-0"
            />
            <span className="opacity-70 shrink-0">to</span>
            <input
              type="date"
              value={filters.end}
              onChange={(e) => setFilters({ end: e.target.value, page: '1' })}
              className="px-2 py-2 rounded border flex-1 min-w-0"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              placeholder="Customer (name/email)"
              value={filters.customer}
              onChange={(e) =>
                setFilters({ customer: e.target.value, page: '1' })
              }
              className="px-3 py-2 rounded border w-full min-w-0"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <FormSelect
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ status: value, page: '1' })
              }
              showValidation={false}
            >
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </FormSelect>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              placeholder="Invoice # or search"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value, page: '1' })}
              className="px-3 py-2 rounded border w-full min-w-0"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Min Outstanding"
              value={filters.minOut}
              onChange={(e) =>
                setFilters({ minOut: numberInput(e.target.value), page: '1' })
              }
              className="px-3 py-2 rounded border w-full min-w-0"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Max Outstanding"
              value={filters.maxOut}
              onChange={(e) =>
                setFilters({ maxOut: numberInput(e.target.value), page: '1' })
              }
              className="px-3 py-2 rounded border w-full min-w-0"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-end sm:justify-end">
            <button
              onClick={() => fetchData(true)}
              className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Apply
            </button>
            <button
              onClick={exportInvoices}
              className="px-3 py-2 rounded border flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
        >
          <div className="text-xs opacity-70">Total Invoiced</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.totalInvoiced)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
        >
          <div className="text-xs opacity-70">Total Received</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.totalReceived)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
        >
          <div className="text-xs opacity-70">Total Outstanding</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.totalOutstanding)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
        >
          <div className="text-xs opacity-70">Overdue Amount</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.overdueAmount)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
        >
          <div className="text-xs opacity-70">Avg Days Past Due</div>
          <div className="text-lg font-semibold">
            {aggregates.avgDaysPastDue}
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}
      >
        <div className="overflow-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr
                className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Invoice Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Currency
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  Invoice Amount
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  Received To-Date
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  Outstanding
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
            >
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center">
                    No records
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} cursor-pointer`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td
                      className="px-4 py-2 text-teal-600 font-semibold"
                      onClick={() => openDrawer(row)}
                    >
                      {row.invoiceNo || row.invoiceNumber}
                    </td>
                    <td className="px-4 py-2">
                      {getCustomerName(row) ? (
                        <button
                          className="text-teal-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const cid = getCustomerId(row);
                            const name = getCustomerName(row);
                            if (cid)
                              navigate(
                                `/payables/customer/${cid}?name=${encodeURIComponent(name)}`,
                              );
                            else
                              navigate(
                                `/payables/customer/${encodeURIComponent(name)}?name=${encodeURIComponent(name)}`,
                              );
                          }}
                        >
                          {getCustomerName(row)}
                        </button>
                      ) : (
                        <span
                          onClick={() => openDrawer(row)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              openDrawer(row);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          style={{ cursor: 'pointer' }}
                        >
                          {getCustomerName(row)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      {formatDate(row.invoiceDate || row.date)}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(row.dueDate || row.dueDate)}</span>
                        {row.status === 'overdue' && (
                          <Pill color="red">Overdue</Pill>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      {row.currency || 'AED'}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      onClick={() => openDrawer(row)}
                    >
                      {formatCurrency(getInvoiceAmount(row))}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      onClick={() => openDrawer(row)}
                    >
                      {formatCurrency(getReceived(row))}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      onClick={() => openDrawer(row)}
                    >
                      {formatCurrency(getOutstanding(row))}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className={`px-2 py-1 ${canManage ? 'text-teal-600' : 'text-gray-400 cursor-not-allowed'}`}
                        onClick={() => canManage && openDrawer(row)}
                        disabled={!canManage}
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div
            className={`flex items-center justify-between px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="text-sm">{selected.size} selected</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded border"
                onClick={() => exportInvoices()}
              >
                <Download size={16} className="inline mr-1" />
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Drawer */}
      <PaymentDrawer
        invoice={drawer.item}
        isOpen={drawer.open}
        onClose={closeDrawer}
        onAddPayment={handleAddPayment}
        isSaving={isSavingPayment}
        canManage={canManage}
        isDarkMode={isDarkMode}
        otherSessions={[]}
        onPrintReceipt={handlePrintReceipt}
        onDownloadReceipt={handleDownloadReceipt}
        onVoidPayment={handleVoidPayment}
        isVoidingPayment={isVoidingPayment}
        voidDropdownPaymentId={voidDropdownPaymentId}
        onVoidDropdownToggle={(id) => {
          setVoidDropdownPaymentId(id);
          setVoidCustomReason('');
        }}
        voidCustomReason={voidCustomReason}
        onVoidCustomReasonChange={setVoidCustomReason}
        onSubmitCustomVoidReason={(paymentId) => {
          if (voidCustomReason.trim()) {
            handleVoidPayment(paymentId, voidCustomReason.trim());
          }
        }}
        downloadingReceiptId={downloadingReceiptId}
        printingReceiptId={printingReceiptId}
        PAYMENT_MODES={PAYMENT_MODES}
        VOID_REASONS={VOID_REASONS}
      />

      {/* Temporary: Keep old drawer structure for reference - to be removed */}
      {false && drawer.open && drawer.item && (
        <div className="fixed inset-0 z-[1100] flex">
          <div
            className="flex-1 bg-black/30"
            onClick={closeDrawer}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                closeDrawer();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close drawer"
          ></div>
          <div
            className={`w-full max-w-md h-full overflow-auto ${isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'} shadow-xl`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {drawer.item.invoiceNo || drawer.item.invoiceNumber}
                </div>
                <div className="text-sm opacity-70">
                  {getCustomerName(drawer.item)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={drawer.item.status} />
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="opacity-70">Invoice Date</div>
                  <div>
                    {formatDate(drawer.item.invoiceDate || drawer.item.date)}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Due Date</div>
                  <div>
                    {formatDate(drawer.item.dueDate || drawer.item.due_date)}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Currency</div>
                  <div>{drawer.item.currency || 'AED'}</div>
                </div>
                <div>
                  <div className="opacity-70">Invoice Amount</div>
                  <div className="font-semibold">
                    {formatCurrency(getInvoiceAmount(drawer.item))}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Received</div>
                  <div className="font-semibold">
                    {formatCurrency(getReceived(drawer.item))}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Outstanding</div>
                  <div className="font-semibold">
                    {formatCurrency(getOutstanding(drawer.item))}
                  </div>
                </div>
              </div>

              {/* Payments Timeline */}
              <div>
                <div className="font-semibold mb-2">Payments</div>
                <div className="space-y-2">
                  {(drawer.item.payments || []).length === 0 && (
                    <div className="text-sm opacity-70">
                      No payments recorded yet.
                    </div>
                  )}
                  {(drawer.item.payments || []).map((p, idx) => {
                    const paymentIndex = idx + 1;
                    const isDownloading = downloadingReceiptId === p.id;
                    const isPrinting = printingReceiptId === p.id;

                    return (
                      <div
                        key={p.id || idx}
                        className={`p-2 rounded border ${p.voided ? 'opacity-60 line-through' : ''}`}
                      >
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">
                              {formatCurrency(p.amount || 0)}
                            </div>
                            <div className="opacity-70">
                              {p.paymentMethod || p.method} •{' '}
                              {p.referenceNumber || p.referenceNo || '—'}
                            </div>
                            {p.receiptNumber && (
                              <div className="text-xs mt-1 text-teal-600 font-semibold">
                                Receipt: {p.receiptNumber}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div>{formatDate(p.paymentDate)}</div>
                              {p.voided && (
                                <div className="text-xs text-red-600">
                                  Voided
                                </div>
                              )}
                            </div>
                            {!p.voided && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handlePrintReceipt(p, paymentIndex)
                                  }
                                  disabled={isPrinting}
                                  className={`p-1.5 rounded transition-colors ${
                                    isPrinting
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                                  }`}
                                  title="Print payment receipt"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownloadReceipt(p, paymentIndex)
                                  }
                                  disabled={isDownloading}
                                  className={`p-1.5 rounded transition-colors ${
                                    isDownloading
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-teal-50 text-teal-600 hover:text-teal-700'
                                  }`}
                                  title="Download payment receipt"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {p.notes && (
                          <div className="text-xs mt-1 opacity-80">
                            {p.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Payment */}
              {getOutstanding(drawer.item) <= 0 ||
              getInvoiceAmount(drawer.item) === 0 ||
              drawer.item.status === 'paid' ? (
                  <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span className="font-medium">
                      {getInvoiceAmount(drawer.item) === 0
                        ? 'No Payment Required (Zero Invoice)'
                        : 'Invoice Fully Paid'}
                    </span>
                  </div>
                ) : canManage ? (
                  <AddPaymentForm
                    outstanding={getOutstanding(drawer.item)}
                    onSave={handleAddPayment}
                    isSaving={isSavingPayment}
                    onCancel={closeDrawer}
                  />
                ) : (
                  <div className="text-sm opacity-70">
                  You don&apos;t have permission to add payments.
                  </div>
                )}

              {/* Quick Actions */}
              {canManage &&
                getOutstanding(drawer.item) > 0 &&
                drawer.item.payments &&
                drawer.item.payments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-2 rounded border"
                    onClick={handleVoidLast}
                  >
                    <Trash2 size={16} className="inline mr-1" />
                      Void last
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receivables;
