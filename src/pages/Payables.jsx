import { Banknote, CheckCircle, Download, Filter, Printer, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddPaymentForm from "../components/payments/AddPaymentForm";
import { FormSelect } from "../components/ui/form-select";
import { SelectItem } from "../components/ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import { payablesService } from "../services/dataService";
import { notificationService } from "../services/notificationService";
import { createPaymentPayload } from "../services/paymentService";
import { formatCurrency, formatDate as formatDateUtil } from "../utils/invoiceUtils";
import { generatePaymentReceipt, printPaymentReceipt } from "../utils/paymentReceiptGenerator";
import { toUAEDateForInput } from "../utils/timezone";
import { uuid } from "../utils/uuid";

// Stale-while-revalidate cache configuration
const CACHE_KEYS = {
  PAYABLES: "finance_payables_cache",
};
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

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
    console.warn("Cache write failed:", e);
  }
};

const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("Cache clear failed:", e);
  }
};

const Pill = ({ color = "gray", children }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    green: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
    red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
    yellow:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700",
    blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
    teal: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700",
  };
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const useURLState = (initial) => {
  // Memoize initial to avoid infinite re-renders when called with inline objects
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — memoize inline object once to prevent infinite re-renders
  const stableInitial = useMemo(() => initial, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => {
    const obj = { ...stableInitial };
    for (const key of Object.keys(stableInitial)) {
      const v = searchParams.get(key);
      if (v !== null) obj[key] = v;
    }
    return obj;
  }, [searchParams, stableInitial]);
  const setState = (patch) => {
    const next = {
      ...state,
      ...(typeof patch === "function" ? patch(state) : patch),
    };
    const entries = Object.entries(next).filter(([, v]) => v !== "" && v !== undefined && v !== null);
    setSearchParams(Object.fromEntries(entries), { replace: true });
  };
  return [state, setState];
};

const StatusPill = ({ status }) => {
  const map = {
    unpaid: { label: "Unpaid", color: "red" },
    partially_paid: { label: "Partially Paid", color: "yellow" },
    paid: { label: "Paid", color: "green" },
    overdue: { label: "Overdue", color: "red" },
  };
  const cfg = map[status] || map.unpaid;
  return <Pill color={cfg.color}>{cfg.label}</Pill>;
};

// Use timezone-aware date formatting from invoiceUtils (which uses timezone.js)
const formatDate = (d) => {
  return formatDateUtil(d);
};

const numberInput = (v) => (v === "" || Number.isNaN(Number(v)) ? "" : v);

const downloadBlob = (blob, filename) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Download failed", e);
  }
};

// Helper functions for PO field access
const getPOValue = (r) => Number(r.poValue || r.totalAmount || r.total || 0);
const getPaid = (r) => Number(r.paid || r.amountPaid || 0);
const getBalance = (r) => Number(r.balance || r.balanceDue || 0);
const getVendorName = (r) => r.vendor?.name || r.supplier?.name || r.vendorName || r.supplierName || "";

// NOTE: InvoicesTab removed - Receivables page handles customer invoice payments
// Payables page now only shows PO/Supplier payments

const POTab = ({ canManage }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [filters, setFilters] = useURLState({
    q: "",
    status: "all",
    dateType: "po",
    start: "",
    end: "",
    vendor: "",
    minBal: "",
    maxBal: "",
    page: "1",
    size: "10",
  });

  // Initialize state with cached data if available (stale-while-revalidate)
  const initializeFromCache = useCallback(() => {
    const cached = getCachedData(CACHE_KEYS.PAYABLES);
    if (cached?.data) {
      const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;
      return {
        items: cached.data.items || [],
        loading: isStale,
        hasCache: true,
      };
    }
    return { items: [], loading: true, hasCache: false };
  }, []);

  const cachedState = initializeFromCache();
  const [loading, setLoading] = useState(cachedState.loading);
  const [items, setItems] = useState(cachedState.items);
  const [drawer, setDrawer] = useState({ open: false, item: null });
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [printingReceiptId, setPrintingReceiptId] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ open: false, type: null });
  const [localSearch, setLocalSearch] = useState(filters.q);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce search - wait 300ms after user stops typing
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only re-run on localSearch change to avoid debounce reset
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.q) {
        setFilters({ q: localSearch, page: "1" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Generate cache key based on current filters
  const getCacheKeyWithFilters = useCallback(() => {
    const filterKey = JSON.stringify({
      q: filters.q,
      status: filters.status,
      start: filters.start,
      end: filters.end,
      vendor: filters.vendor,
      minBal: filters.minBal,
      maxBal: filters.maxBal,
    });
    return `${CACHE_KEYS.PAYABLES}_${btoa(filterKey).slice(0, 20)}`;
  }, [filters.q, filters.status, filters.start, filters.end, filters.vendor, filters.minBal, filters.maxBal]);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = getCacheKeyWithFilters();

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached?.data) {
          const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;
          setItems(cached.data.items || []);

          if (!isStale) {
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
        const { items: fetchedPOs } = await payablesService.getPOs({
          search: filters.q || undefined,
          status: filters.status === "all" ? undefined : filters.status,
          start_date: filters.start || undefined,
          end_date: filters.end || undefined,
          vendor: filters.vendor || undefined,
          min_balance: filters.minBal || undefined,
          max_balance: filters.maxBal || undefined,
        });

        setItems(fetchedPOs);
        // Update cache with fresh data
        setCachedData(cacheKey, { items: fetchedPOs });
      } catch (error) {
        console.error("Failed to fetch payables:", error);
        notificationService.error("Failed to load payables. Showing cached data if available.");
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
      filters.vendor,
      filters.minBal,
      filters.maxBal,
      getCacheKeyWithFilters,
    ]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aggregates = useMemo(() => {
    const totalPO = items.reduce((s, r) => s + getPOValue(r), 0);
    const totalPaid = items.reduce((s, r) => s + getPaid(r), 0);
    const totalBalance = items.reduce((s, r) => s + getBalance(r), 0);
    const overdue = items.filter((r) => r.status === "overdue").reduce((s, r) => s + getBalance(r), 0);
    const today = new Date();
    const upcoming = items
      .filter((r) => r.dueDate && new Date(r.dueDate) > today && new Date(r.dueDate) < new Date(+today + 7 * 864e5))
      .reduce((s, r) => s + getBalance(r), 0);
    return { totalPO, totalPaid, totalBalance, overdue, upcoming };
  }, [items]);

  const openDrawer = (item) => setDrawer({ open: true, item });
  const closeDrawer = () => setDrawer({ open: false, item: null });

  const handleAddPayment = async ({ amount, method, referenceNo, notes, paymentDate }) => {
    const po = drawer.item;
    if (!po) return;
    const balance = Number(po.balance || 0);
    if (!(Number(amount) > 0)) return notificationService.error("Amount must be greater than 0");
    if (Number(amount) > balance) return notificationService.error("Amount exceeds balance");

    // Clear cache on mutation to ensure fresh data on next fetch
    clearCache(getCacheKeyWithFilters());

    const apiPayload = createPaymentPayload({
      amount,
      paymentMethod: method,
      paymentDate: paymentDate || toUAEDateForInput(new Date()),
      referenceNumber: referenceNo,
      notes,
    });

    const newPayment = {
      id: uuid(),
      ...apiPayload,
      method,
      referenceNo,
    };
    const updated = { ...po, payments: [...(po.payments || []), newPayment] };
    const paid = (po.paid || 0) + newPayment.amount;
    const newBal = Math.max(0, +(balance - newPayment.amount).toFixed(2));
    let status = "unpaid";
    if (newBal === 0) status = "paid";
    else if (newBal < (po.poValue || 0)) status = "partially_paid";
    const updatedPO = { ...updated, paid, balance: newBal, status };
    setDrawer({ open: true, item: updatedPO });
    setItems((prev) => prev.map((i) => (i.id === po.id ? updatedPO : i)));
    try {
      await payablesService.addPOPayment(po.id, apiPayload);
    } catch (e) {
      console.warn("Failed to persist PO payment to backend:", e.message);
    }
  };

  const handleVoidLast = async () => {
    const po = drawer.item;
    if (!po) return;
    const payments = (po.payments || []).filter((p) => !p.voided);
    if (!payments.length) return;
    const last = payments[payments.length - 1];

    // Clear cache on mutation to ensure fresh data on next fetch
    clearCache(getCacheKeyWithFilters());

    const updatedPayments = po.payments.map((p) =>
      p.id === last.id ? { ...p, voided: true, voidedAt: new Date().toISOString() } : p
    );
    const paid = updatedPayments.filter((p) => !p.voided).reduce((s, p) => s + Number(p.amount || 0), 0);
    const balance = Math.max(0, +((po.poValue || 0) - paid).toFixed(2));
    let status = "unpaid";
    if (balance === 0) status = "paid";
    else if (balance < (po.poValue || 0)) status = "partially_paid";
    const updatedPO = {
      ...po,
      payments: updatedPayments,
      paid,
      balance,
      status,
    };
    setDrawer({ open: true, item: updatedPO });
    setItems((prev) => prev.map((i) => (i.id === po.id ? updatedPO : i)));
    try {
      await payablesService.voidPOPayment(po.id, last.id, "User void via UI");
    } catch (_e) {
      /* ignore */
    }
  };

  const handleMarkPaid = async () => {
    const po = drawer.item;
    if (!po) return;
    const amt = Number(po.balance || 0);
    if (amt <= 0) return;
    await handleAddPayment({
      amount: amt,
      method: "Other",
      referenceNo: "Auto-Paid",
      notes: "Mark as Fully Paid",
      paymentDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleDownloadReceipt = async (payment, paymentIndex) => {
    const po = drawer.item;
    if (!po) {
      notificationService.error("Unable to generate receipt. Missing PO information.");
      return;
    }
    const companyInfo = JSON.parse(localStorage.getItem("companySettings") || "{}");
    setDownloadingReceiptId(payment.id);
    try {
      const poData = {
        invoiceNumber: po.poNo || po.poNumber,
        total: po.poValue || 0,
        payments: po.payments || [],
        customer: po.vendor || {},
      };
      const result = await generatePaymentReceipt(payment, poData, companyInfo, paymentIndex);
      if (!result.success) {
        notificationService.error(`Error generating receipt: ${result.error}`);
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      notificationService.error("Failed to generate receipt.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    const po = drawer.item;
    if (!po) {
      notificationService.error("Unable to print receipt. Missing PO information.");
      return;
    }
    const companyInfo = JSON.parse(localStorage.getItem("companySettings") || "{}");
    setPrintingReceiptId(payment.id);
    try {
      const poData = {
        invoiceNumber: po.poNo || po.poNumber,
        total: po.poValue || 0,
        payments: po.payments || [],
        customer: po.vendor || {},
      };
      const result = await printPaymentReceipt(payment, poData, companyInfo, paymentIndex);
      if (!result.success) {
        notificationService.error(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      notificationService.error("Failed to print receipt.");
    } finally {
      setPrintingReceiptId(null);
    }
  };

  const exportPOs = async () => {
    try {
      const params = {
        search: filters.q || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        start_date: filters.start || undefined,
        end_date: filters.end || undefined,
        vendor: filters.vendor || undefined,
        min_balance: filters.minBal || undefined,
        max_balance: filters.maxBal || undefined,
      };
      const blob = await payablesService.exportDownload("pos", params, "csv");
      downloadBlob(blob, "pos.csv");
      return;
    } catch (_e) {
      console.warn("Backend export failed, falling back to client CSV");
    }
    const headers = [
      "PO #",
      "Vendor",
      "PO Date",
      "Due Date",
      "Currency",
      "PO Value",
      "Paid To-Date",
      "Balance",
      "Status",
    ];
    const rows = items.map((r) => [
      r.poNo || r.poNumber,
      getVendorName(r),
      r.poDate || r.date,
      r.dueDate,
      r.currency || "AED",
      getPOValue(r),
      getPaid(r),
      getBalance(r),
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((v) => (v !== undefined && v !== null ? `${v}`.replace(/"/g, '""') : ""))
          .map((v) => `"${v}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Primary Filters Row */}
      <div
        className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <input
            id="payables-po-search"
            name="poSearch"
            placeholder="Search POs..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 rounded border min-w-[200px] flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            aria-label="Search by PO number"
          />
          <FormSelect
            value={filters.status}
            onValueChange={(value) => setFilters({ status: value, page: "1" })}
            showValidation={false}
            className="w-36"
          >
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </FormSelect>
          <input
            id="payables-start-date"
            name="startDate"
            type="date"
            value={filters.start}
            onChange={(e) => setFilters({ start: e.target.value, page: "1" })}
            className="px-2 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            aria-label="Start date"
          />
          <span className="opacity-70 shrink-0">to</span>
          <input
            id="payables-end-date"
            name="endDate"
            type="date"
            value={filters.end}
            onChange={(e) => setFilters({ end: e.target.value, page: "1" })}
            className="px-2 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            aria-label="End date"
          />
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-1.5 text-sm"
          >
            <RefreshCw size={14} />
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded border flex items-center gap-1.5 text-sm transition-colors ${
              showAdvancedFilters
                ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-300"
                : "dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Filter size={14} />
            More
          </button>
          <button
            type="button"
            onClick={exportPOs}
            className="px-3 py-2 rounded border flex items-center gap-1.5 text-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Advanced Filters (collapsible) */}
        {showAdvancedFilters && (
          <div
            className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}
          >
            <div>
              <label htmlFor="payables-vendor-search" className="block text-xs font-medium mb-1 opacity-70">
                Vendor
              </label>
              <input
                id="payables-vendor-search"
                name="vendorSearch"
                placeholder="Name or code"
                value={filters.vendor}
                onChange={(e) => setFilters({ vendor: e.target.value, page: "1" })}
                className="px-3 py-2 rounded border w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                aria-label="Search by vendor name"
              />
            </div>
            <div>
              <label htmlFor="payables-date-type" className="block text-xs font-medium mb-1 opacity-70">
                Date Type
              </label>
              <FormSelect
                value={filters.dateType}
                onValueChange={(value) => setFilters({ dateType: value, page: "1" })}
                showValidation={false}
              >
                <SelectItem value="po">PO Date</SelectItem>
                <SelectItem value="due">Due Date</SelectItem>
              </FormSelect>
            </div>
            <div>
              <label htmlFor="payables-min-balance" className="block text-xs font-medium mb-1 opacity-70">
                Min Balance
              </label>
              <input
                id="payables-min-balance"
                name="minBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.minBal}
                onChange={(e) => setFilters({ minBal: numberInput(e.target.value), page: "1" })}
                className="px-3 py-2 rounded border w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                aria-label="Minimum balance"
              />
            </div>
            <div>
              <label htmlFor="payables-max-balance" className="block text-xs font-medium mb-1 opacity-70">
                Max Balance
              </label>
              <input
                id="payables-max-balance"
                name="maxBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.maxBal}
                onChange={(e) => setFilters({ maxBal: numberInput(e.target.value), page: "1" })}
                className="px-3 py-2 rounded border w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                aria-label="Maximum balance"
              />
            </div>
          </div>
        )}
      </div>

      {/* Clickable KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFilters({ status: "all", page: "1" })}
          className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
            filters.status === "all"
              ? isDarkMode
                ? "bg-teal-900/30 border-teal-600 ring-1 ring-teal-600"
                : "bg-teal-50 border-teal-300 ring-1 ring-teal-300"
              : isDarkMode
                ? "bg-[#1E2328] border-[#37474F] hover:border-gray-500"
                : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-xs opacity-70">Total PO Value</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalPO)}</div>
        </button>
        <button
          type="button"
          onClick={() => setFilters({ status: "paid", page: "1" })}
          className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
            filters.status === "paid"
              ? isDarkMode
                ? "bg-green-900/30 border-green-600 ring-1 ring-green-600"
                : "bg-green-50 border-green-300 ring-1 ring-green-300"
              : isDarkMode
                ? "bg-[#1E2328] border-[#37474F] hover:border-gray-500"
                : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-xs opacity-70">Total Paid</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalPaid)}</div>
        </button>
        <button
          type="button"
          onClick={() => setFilters({ status: "unpaid", page: "1" })}
          className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
            filters.status === "unpaid"
              ? isDarkMode
                ? "bg-red-900/30 border-red-600 ring-1 ring-red-600"
                : "bg-red-50 border-red-300 ring-1 ring-red-300"
              : isDarkMode
                ? "bg-[#1E2328] border-[#37474F] hover:border-gray-500"
                : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-xs opacity-70">Total Balance</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalBalance)}</div>
        </button>
        <button
          type="button"
          onClick={() => setFilters({ status: "overdue", page: "1" })}
          className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
            filters.status === "overdue"
              ? isDarkMode
                ? "bg-orange-900/30 border-orange-600 ring-1 ring-orange-600"
                : "bg-orange-50 border-orange-300 ring-1 ring-orange-300"
              : isDarkMode
                ? "bg-[#1E2328] border-[#37474F] hover:border-gray-500"
                : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-xs opacity-70">Overdue Payables</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.overdue)}</div>
        </button>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-xs opacity-70">Upcoming (7 days)</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.upcoming)}</div>
        </div>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="overflow-auto">
          {/* Table — 8 columns: PO#, Vendor, Date, Due, Amount, Balance, Status + Pay action */}
          <table className="min-w-full divide-y">
            <thead>
              <tr className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <th className="px-3 py-3 text-left text-xs uppercase">PO #</th>
                <th className="px-3 py-3 text-left text-xs uppercase">Vendor</th>
                <th className="px-3 py-3 text-left text-xs uppercase">Date</th>
                <th className="px-3 py-3 text-left text-xs uppercase">Due</th>
                <th className="px-3 py-3 text-right text-xs uppercase">Amount</th>
                <th className="px-3 py-3 text-right text-xs uppercase">Balance</th>
                <th className="px-3 py-3 text-center text-xs uppercase">Status</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      <p className="font-medium">
                        {filters.q || filters.status !== "all" || filters.start || filters.vendor
                          ? "No results match your filters"
                          : "No purchase orders found"}
                      </p>
                      <p className="text-sm mt-1">
                        {filters.q || filters.status !== "all" || filters.start || filters.vendor
                          ? "Try adjusting your filters"
                          : "Create a purchase order to get started"}
                      </p>
                      {!(filters.q || filters.status !== "all" || filters.start || filters.vendor) && (
                        <button
                          type="button"
                          onClick={() => navigate("/app/purchase-orders/new")}
                          className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Create Purchase Order
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className={`${isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"} cursor-pointer`}
                    onClick={() => openDrawer(row)}
                  >
                    <td className="px-3 py-2 text-teal-600 font-semibold whitespace-nowrap">
                      {row.poNo || row.poNumber}
                    </td>
                    <td className="px-3 py-2">{getVendorName(row)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{formatDate(row.poDate || row.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1.5">
                        <span>{formatDate(row.dueDate)}</span>
                        {row.status === "overdue" && <Pill color="red">Overdue</Pill>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div>{formatCurrency(getPOValue(row))}</div>
                      {getPaid(row) > 0 && (
                        <div className="text-[10px] text-green-600 opacity-80">
                          Paid: {formatCurrency(getPaid(row))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {formatCurrency(getBalance(row))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusPill status={row.status} />
                    </td>
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation cell in clickable row */}
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded ${canManage ? "text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30" : "text-gray-400 cursor-not-allowed"}`}
                        disabled={!canManage}
                        onClick={() => canManage && openDrawer(row)}
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawer.open && drawer.item && (
        <div className="fixed inset-0 z-[1100] flex">
          <button type="button" className="flex-1 bg-black/30" onClick={closeDrawer} aria-label="Close drawer"></button>
          <div
            className={`w-full max-w-md h-full overflow-auto ${isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"} shadow-xl`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{drawer.item.poNo || drawer.item.poNumber}</div>
                <div className="text-sm opacity-70">{getVendorName(drawer.item)}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={drawer.item.status} />
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="opacity-70">PO Date</div>
                  <div>{formatDate(drawer.item.poDate || drawer.item.date)}</div>
                </div>
                <div>
                  <div className="opacity-70">Due Date</div>
                  <div>{formatDate(drawer.item.dueDate)}</div>
                </div>
                <div>
                  <div className="opacity-70">Currency</div>
                  <div>{drawer.item.currency || "AED"}</div>
                </div>
                <div>
                  <div className="opacity-70">PO Value</div>
                  <div className="font-semibold">{formatCurrency(getPOValue(drawer.item))}</div>
                </div>
                <div>
                  <div className="opacity-70">Paid</div>
                  <div className="font-semibold">{formatCurrency(getPaid(drawer.item))}</div>
                </div>
                <div>
                  <div className="opacity-70">Balance</div>
                  <div className="font-semibold">{formatCurrency(getBalance(drawer.item))}</div>
                </div>
              </div>

              {/* Payments Timeline */}
              <div>
                <div className="font-semibold mb-2">Payments</div>
                <div className="space-y-2">
                  {(drawer.item.payments || []).length === 0 && (
                    <div className="text-sm opacity-70">No payments recorded yet.</div>
                  )}
                  {(drawer.item.payments || []).map((p, idx) => {
                    const paymentIndex = idx + 1;
                    const isDownloading = downloadingReceiptId === p.id;
                    const isPrinting = printingReceiptId === p.id;
                    return (
                      <div
                        key={p.id || idx}
                        className={`p-2 rounded border ${p.voided ? "opacity-60 line-through" : ""}`}
                      >
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{formatCurrency(p.amount || 0)}</div>
                            <div className="opacity-70">
                              {p.paymentMethod || p.method} • {p.referenceNo || p.referenceNumber || "—"}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div>{formatDate(p.paymentDate)}</div>
                              {p.voided && <div className="text-xs text-red-600">Voided</div>}
                            </div>
                            {!p.voided && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePrintReceipt(p, paymentIndex)}
                                  disabled={isPrinting}
                                  className={`p-1.5 rounded transition-colors ${isPrinting ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-50 text-purple-600 hover:text-purple-700"}`}
                                  title="Print payment receipt"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(p, paymentIndex)}
                                  disabled={isDownloading}
                                  className={`p-1.5 rounded transition-colors ${isDownloading ? "opacity-50 cursor-not-allowed" : "hover:bg-teal-50 text-teal-600 hover:text-teal-700"}`}
                                  title="Download payment receipt"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {p.notes && <div className="text-xs mt-1 opacity-80">{p.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Payment */}
              {canManage && drawer.item.balance > 0 ? (
                <AddPaymentForm outstanding={drawer.item.balance || 0} onSave={handleAddPayment} entityType="po" />
              ) : drawer.item.balance === 0 ? (
                <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="font-medium">Purchase Order Fully Paid</span>
                </div>
              ) : (
                <div className="text-sm opacity-70">You don&apos;t have permission to add payments.</div>
              )}

              {/* Quick Actions */}
              {canManage && drawer.item.balance > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded border dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setConfirmAction({ open: true, type: "markPaid" })}
                  >
                    <CheckCircle size={16} className="inline mr-1" />
                    Mark as Fully Paid
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded border dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setConfirmAction({ open: true, type: "voidLast" })}
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Void last
                  </button>
                  {(() => {
                    const payments = (drawer.item?.payments || []).filter((p) => !p.voided);
                    if (!payments.length) return null;
                    const last = payments[payments.length - 1];
                    return (
                      <>
                        <button
                          type="button"
                          className="px-3 py-2 rounded border dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={async () => {
                            try {
                              const blob = await payablesService.downloadPOVoucher(drawer.item.id, last.id);
                              downloadBlob(blob, `voucher-${drawer.item.poNo || drawer.item.poNumber}-${last.id}.pdf`);
                            } catch (_e) {
                              notificationService.error("Failed to download voucher");
                            }
                          }}
                        >
                          Download voucher
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded border dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={async () => {
                            try {
                              await payablesService.emailPOVoucher(drawer.item.id, last.id);
                              notificationService.success("Voucher emailed to vendor");
                            } catch (_e) {
                              notificationService.error("Failed to email voucher");
                            }
                          }}
                        >
                          Email voucher
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for destructive actions */}
      {confirmAction.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className={`rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
          >
            <h3 className="text-lg font-semibold mb-2">
              {confirmAction.type === "voidLast" ? "Void Last Payment?" : "Mark as Fully Paid?"}
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {confirmAction.type === "voidLast"
                ? "This will void the most recent payment on this purchase order. This action cannot be easily undone."
                : `This will record a payment of ${formatCurrency(drawer.item?.balance || 0)} to mark this PO as fully paid.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
                onClick={() => setConfirmAction({ open: false, type: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm text-white ${
                  confirmAction.type === "voidLast" ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
                }`}
                onClick={() => {
                  setConfirmAction({ open: false, type: null });
                  if (confirmAction.type === "voidLast") handleVoidLast();
                  else handleMarkPaid();
                }}
              >
                {confirmAction.type === "voidLast" ? "Void Payment" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Payables = () => {
  const { isDarkMode } = useTheme();
  const canManage =
    authService.hasPermission("payables", "manage") ||
    authService.hasPermission("payables", "write") ||
    authService.hasRole(["admin", "finance"]);

  return (
    <div className={`p-2 sm:p-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <Banknote size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl">💳 Payables</h1>
            <div className="text-xs opacity-70">Track vendor payments and purchase orders</div>
          </div>
        </div>
      </div>

      {/* PO Payments Content - No tabs needed */}
      <POTab canManage={canManage} />
    </div>
  );
};

export default Payables;
