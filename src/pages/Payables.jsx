import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  Banknote,
  Download,
  RefreshCw,
  X,
  Trash2,
  CheckCircle,
  Printer,
} from "lucide-react";
import { payablesService } from "../services/dataService";
import { createPaymentPayload } from "../services/paymentService";
import { uuid } from "../utils/uuid";
import {
  formatCurrency,
  formatDate as formatDateUtil,
} from "../utils/invoiceUtils";
import { authService } from "../services/axiosAuthService";
import { notificationService } from "../services/notificationService";
import {
  generatePaymentReceipt,
  printPaymentReceipt,
} from "../utils/paymentReceiptGenerator";
import { toUAEDateForInput } from "../utils/timezone";
import AddPaymentForm from "../components/payments/AddPaymentForm";

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
    gray: "bg-gray-100 text-gray-800 border-gray-300",
    green: "bg-green-100 text-green-800 border-green-300",
    red: "bg-red-100 text-red-800 border-red-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    teal: "bg-teal-100 text-teal-800 border-teal-300",
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
      ...(typeof patch === "function" ? patch(state) : patch),
    };
    const entries = Object.entries(next).filter(
      ([, v]) => v !== "" && v !== undefined && v !== null,
    );
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

const numberInput = (v) => (v === "" || isNaN(Number(v)) ? "" : v);

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
const getVendorName = (r) =>
  r.vendor?.name || r.supplier?.name || r.vendorName || r.supplierName || "";

// NOTE: InvoicesTab removed - Receivables page handles customer invoice payments
// Payables page now only shows PO/Supplier payments

const POTab = ({ canManage }) => {
  const { isDarkMode } = useTheme();
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
    if (cached && cached.data) {
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
  }, [
    filters.q,
    filters.status,
    filters.start,
    filters.end,
    filters.vendor,
    filters.minBal,
    filters.maxBal,
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
    ],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aggregates = useMemo(() => {
    const totalPO = items.reduce((s, r) => s + getPOValue(r), 0);
    const totalPaid = items.reduce((s, r) => s + getPaid(r), 0);
    const totalBalance = items.reduce((s, r) => s + getBalance(r), 0);
    const overdue = items
      .filter((r) => r.status === "overdue")
      .reduce((s, r) => s + getBalance(r), 0);
    const today = new Date();
    const upcoming = items
      .filter(
        (r) =>
          r.dueDate &&
          new Date(r.dueDate) > today &&
          new Date(r.dueDate) < new Date(+today + 7 * 864e5),
      )
      .reduce((s, r) => s + getBalance(r), 0);
    return { totalPO, totalPaid, totalBalance, overdue, upcoming };
  }, [items]);

  const openDrawer = (item) => setDrawer({ open: true, item });
  const closeDrawer = () => setDrawer({ open: false, item: null });

  const handleAddPayment = async ({
    amount,
    method,
    referenceNo,
    notes,
    paymentDate,
  }) => {
    const po = drawer.item;
    if (!po) return;
    const balance = Number(po.balance || 0);
    if (!(Number(amount) > 0)) return alert("Amount must be > 0");
    if (Number(amount) > balance) return alert("Amount exceeds balance");

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
      p.id === last.id
        ? { ...p, voided: true, voidedAt: new Date().toISOString() }
        : p,
    );
    const paid = updatedPayments
      .filter((p) => !p.voided)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
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
    } catch (e) {
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
      alert("Unable to generate receipt. Missing PO information.");
      return;
    }
    const companyInfo = JSON.parse(
      localStorage.getItem("companySettings") || "{}",
    );
    setDownloadingReceiptId(payment.id);
    try {
      const poData = {
        invoiceNumber: po.poNo || po.poNumber,
        total: po.poValue || 0,
        payments: po.payments || [],
        customer: po.vendor || {},
      };
      const result = await generatePaymentReceipt(
        payment,
        poData,
        companyInfo,
        paymentIndex,
      );
      if (!result.success) {
        alert(`Error generating receipt: ${result.error}`);
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Failed to generate receipt.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    const po = drawer.item;
    if (!po) {
      alert("Unable to print receipt. Missing PO information.");
      return;
    }
    const companyInfo = JSON.parse(
      localStorage.getItem("companySettings") || "{}",
    );
    setPrintingReceiptId(payment.id);
    try {
      const poData = {
        invoiceNumber: po.poNo || po.poNumber,
        total: po.poValue || 0,
        payments: po.payments || [],
        customer: po.vendor || {},
      };
      const result = await printPaymentReceipt(
        payment,
        poData,
        companyInfo,
        paymentIndex,
      );
      if (!result.success) {
        alert(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("Failed to print receipt.");
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
    } catch (e) {
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
          .map((v) =>
            v !== undefined && v !== null ? `${v}`.replace(/"/g, '""') : "",
          )
          .map((v) => `"${v}"`)
          .join(","),
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
      <div
        className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <select
              value={filters.dateType}
              onChange={(e) => setFilters({ dateType: e.target.value })}
              className="px-2 py-2 rounded border w-32"
            >
              <option value="po">PO Date</option>
              <option value="due">Due Date</option>
            </select>
            <input
              type="date"
              value={filters.start}
              onChange={(e) => setFilters({ start: e.target.value })}
              className="px-2 py-2 rounded border flex-1 min-w-0"
            />
            <span className="opacity-70 shrink-0">to</span>
            <input
              type="date"
              value={filters.end}
              onChange={(e) => setFilters({ end: e.target.value })}
              className="px-2 py-2 rounded border flex-1 min-w-0"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              placeholder="Vendor"
              value={filters.vendor}
              onChange={(e) => setFilters({ vendor: e.target.value })}
              className="px-3 py-2 rounded border w-full min-w-0"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="px-2 py-2 rounded border w-full"
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              placeholder="PO # or search"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="px-3 py-2 rounded border w-full min-w-0"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Min Balance"
              value={filters.minBal}
              onChange={(e) =>
                setFilters({ minBal: numberInput(e.target.value) })
              }
              className="px-3 py-2 rounded border w-full min-w-0"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Max Balance"
              value={filters.maxBal}
              onChange={(e) =>
                setFilters({ maxBal: numberInput(e.target.value) })
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
              onClick={exportPOs}
              className="px-3 py-2 rounded border flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-xs opacity-70">Total PO Value</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.totalPO)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-xs opacity-70">Total Paid</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.totalPaid)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-xs opacity-70">Total Balance</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.totalBalance)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-xs opacity-70">Overdue Payables</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.overdue)}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
        >
          <div className="text-xs opacity-70">Upcoming (7 days)</div>
          <div className="text-lg font-semibold">
            {formatCurrency(aggregates.upcoming)}
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
      >
        <div className="overflow-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr
                className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                <th className="px-4 py-3 text-left text-xs uppercase">PO #</th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  PO Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Currency
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  PO Value
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  Paid To-Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase">
                  Last Payment
                </th>
                <th className="px-4 py-3 text-right text-xs uppercase">
                  Balance
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
              className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}
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
                    className={`hover:${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"} cursor-pointer`}
                  >
                    <td
                      className="px-4 py-2 text-teal-600 font-semibold"
                      onClick={() => openDrawer(row)}
                    >
                      {row.poNo || row.poNumber}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      {getVendorName(row)}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      {formatDate(row.poDate || row.date)}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(row.dueDate)}</span>
                        {row.status === "overdue" && (
                          <Pill color="red">Overdue</Pill>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      {row.currency || "AED"}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      onClick={() => openDrawer(row)}
                    >
                      {formatCurrency(getPOValue(row))}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      onClick={() => openDrawer(row)}
                    >
                      <div>
                        <div className="font-medium">
                          {formatCurrency(getPaid(row))}
                        </div>
                        {row.payments &&
                          row.payments.filter((p) => !p.voided).length > 0 && (
                            <div className="text-xs opacity-70">
                              {row.payments.filter((p) => !p.voided).length}{" "}
                              payment
                              {row.payments.filter((p) => !p.voided).length !==
                              1
                                ? "s"
                                : ""}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      {row.payments && row.payments.length > 0 ? (
                        <div className="text-xs">
                          <div className="font-medium">
                            {formatDate(
                              row.payments[row.payments.length - 1]
                                ?.paymentDate,
                            )}
                          </div>
                          <div className="opacity-70">
                            {formatCurrency(
                              row.payments[row.payments.length - 1]?.amount ||
                                0,
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          No payments
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      onClick={() => openDrawer(row)}
                    >
                      {formatCurrency(getBalance(row))}
                    </td>
                    <td className="px-4 py-2" onClick={() => openDrawer(row)}>
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className={`px-2 py-1 ${canManage ? "text-teal-600" : "text-gray-400 cursor-not-allowed"}`}
                        disabled={!canManage}
                        onClick={() => canManage && openDrawer(row)}
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
      </div>

      {/* Drawer */}
      {drawer.open && drawer.item && (
        <div className="fixed inset-0 z-[1100] flex">
          <div className="flex-1 bg-black/30" onClick={closeDrawer}></div>
          <div
            className={`w-full max-w-md h-full overflow-auto ${isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"} shadow-xl`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {drawer.item.poNo || drawer.item.poNumber}
                </div>
                <div className="text-sm opacity-70">
                  {getVendorName(drawer.item)}
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
                  <div className="opacity-70">PO Date</div>
                  <div>
                    {formatDate(drawer.item.poDate || drawer.item.date)}
                  </div>
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
                  <div className="font-semibold">
                    {formatCurrency(getPOValue(drawer.item))}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Paid</div>
                  <div className="font-semibold">
                    {formatCurrency(getPaid(drawer.item))}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Balance</div>
                  <div className="font-semibold">
                    {formatCurrency(getBalance(drawer.item))}
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
                        className={`p-2 rounded border ${p.voided ? "opacity-60 line-through" : ""}`}
                      >
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">
                              {formatCurrency(p.amount || 0)}
                            </div>
                            <div className="opacity-70">
                              {p.paymentMethod || p.method} •{" "}
                              {p.referenceNo || p.referenceNumber || "—"}
                            </div>
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
                                  className={`p-1.5 rounded transition-colors ${isPrinting ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-50 text-purple-600 hover:text-purple-700"}`}
                                  title="Print payment receipt"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownloadReceipt(p, paymentIndex)
                                  }
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
              {canManage && drawer.item.balance > 0 ? (
                <AddPaymentForm
                  outstanding={drawer.item.balance || 0}
                  onSave={handleAddPayment}
                  entityType="po"
                />
              ) : drawer.item.balance === 0 ? (
                <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="font-medium">Purchase Order Fully Paid</span>
                </div>
              ) : (
                <div className="text-sm opacity-70">
                  You don&apos;t have permission to add payments.
                </div>
              )}

              {/* Quick Actions */}
              {canManage && drawer.item.balance > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-2 rounded border"
                    onClick={handleMarkPaid}
                  >
                    <CheckCircle size={16} className="inline mr-1" />
                    Mark as Fully Paid
                  </button>
                  <button
                    className="px-3 py-2 rounded border"
                    onClick={handleVoidLast}
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Void last
                  </button>
                  {(() => {
                    const payments = (drawer.item?.payments || []).filter(
                      (p) => !p.voided,
                    );
                    if (!payments.length) return null;
                    const last = payments[payments.length - 1];
                    return (
                      <>
                        <button
                          className="px-3 py-2 rounded border"
                          onClick={async () => {
                            try {
                              const blob =
                                await payablesService.downloadPOVoucher(
                                  drawer.item.id,
                                  last.id,
                                );
                              downloadBlob(
                                blob,
                                `voucher-${drawer.item.poNo || drawer.item.poNumber}-${last.id}.pdf`,
                              );
                            } catch (e) {
                              notificationService.error(
                                "Failed to download voucher",
                              );
                            }
                          }}
                        >
                          Download voucher
                        </button>
                        <button
                          className="px-3 py-2 rounded border"
                          onClick={async () => {
                            try {
                              await payablesService.emailPOVoucher(
                                drawer.item.id,
                                last.id,
                              );
                              notificationService.success(
                                "Voucher emailed to vendor",
                              );
                            } catch (e) {
                              notificationService.error(
                                "Failed to email voucher",
                              );
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
    <div
      className={`p-2 sm:p-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <Banknote size={20} />
          </div>
          <div>
            <div className="font-bold text-xl">Payables</div>
            <div className="text-xs opacity-70">
              Track vendor payments and purchase orders
            </div>
          </div>
        </div>
      </div>

      {/* PO Payments Content - No tabs needed */}
      <POTab canManage={canManage} />
    </div>
  );
};

export default Payables;
