import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FormSelect } from "../../components/ui/form-select";
import { SelectItem } from "../../components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../services/api";
import { authService } from "../../services/axiosAuthService";
import { toUAEDateForInput } from "../../utils/timezone";

const STATUS_BADGES = {
  MISSING_COST: {
    label: "No cost captured",
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  MISSING_WEIGHT: {
    label: "Weight unknown",
    bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  UNSUPPORTED_BASIS: { label: "KG N/A", bg: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  ZERO_WEIGHT: { label: "Zero weight", bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const QUALITY_BADGE = {
  INFERRED: { label: "Inferred", bg: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
};

export default function NormalizedMarginReport() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: toUAEDateForInput(startOfMonth),
      endDate: toUAEDateForInput(now),
    };
  });
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Filter options
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Data
  const [summaryData, setSummaryData] = useState(null);
  const [linesData, setLinesData] = useState([]);
  const [linesPage, setLinesPage] = useState(1);
  const [linesTotalPages, setLinesTotalPages] = useState(1);
  const [linesLoading, setLinesLoading] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("product_name");
  const [sortDir, setSortDir] = useState("asc");

  const isAdmin =
    authService.hasRole("admin") || authService.hasRole("super_admin") || authService.hasRole("managing_director");

  const buildParams = useCallback(() => {
    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };
    if (selectedCustomer !== "all") params.customerId = selectedCustomer;
    if (selectedProduct !== "all") params.productId = selectedProduct;
    if (selectedStatus !== "all") params.normalisationStatus = selectedStatus;
    return params;
  }, [dateRange.startDate, dateRange.endDate, selectedCustomer, selectedProduct, selectedStatus]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([api.get("/customers"), api.get("/products")]);
      const rawCustomers = customersRes?.data || customersRes?.customers || customersRes;
      setCustomers(Array.isArray(rawCustomers) ? rawCustomers : []);
      const rawProducts = productsRes?.data || productsRes?.products || productsRes;
      setProducts(Array.isArray(rawProducts) ? rawProducts : []);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const response = await api.get("/reports/normalized-margin/summary", { params });
      const data = response?.data ?? response ?? {};
      setSummaryData(data);
    } catch (error) {
      console.warn("Normalized margin summary API not available:", error.message);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchLines = useCallback(
    async (page = 1) => {
      try {
        setLinesLoading(true);
        const params = { ...buildParams(), page, limit: 50, sortField, sortDir };
        const response = await api.get("/reports/normalized-margin/lines", { params });
        const data = response?.data ?? response ?? {};
        setLinesData(data.rows || data.lines || []);
        setLinesTotalPages(data.totalPages || 1);
        setLinesPage(page);
      } catch (error) {
        console.warn("Normalized margin lines API not available:", error.message);
        setLinesData([]);
      } finally {
        setLinesLoading(false);
      }
    },
    [buildParams, sortField, sortDir]
  );

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === "lines") {
      fetchLines(1);
    }
  }, [activeTab, fetchLines]);

  const handleRefresh = async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    try {
      await api.post("/reports/normalized-margin/refresh");
      toast.success("Materialized view refreshed");
      await fetchSummary();
      if (activeTab === "lines") await fetchLines(1);
    } catch (error) {
      toast.error(`Refresh failed: ${error.message || "Unknown error"}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleExportCSV = () => {
    const rows = summaryData?.summary_rows || [];
    if (rows.length === 0) {
      toast("No data to export", { icon: "!" });
      return;
    }
    const headers = ["Product", "Lines", "Avg Sell/KG", "Avg Cost/KG", "Avg Margin/KG", "Margin %"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.product_name || ""}"`,
          r.line_count || 0,
          (r.avg_sell_per_kg || 0).toFixed(4),
          (r.avg_cost_per_kg || 0).toFixed(4),
          (r.avg_margin_per_kg || 0).toFixed(4),
          (r.margin_percent || 0).toFixed(2),
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `normalized-margin-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount || 0);

  const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;

  const kpi = summaryData?.kpi || {};
  const exclusions = summaryData?.exclusions || {};
  const lastRefreshed = summaryData?.last_refreshed_at;

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Normalized Margin Report
                </h1>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Per-KG margin analysis across all invoice lines
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } ${refreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Staleness Banner */}
          {lastRefreshed && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm ${
                isDarkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-700"
              }`}
            >
              <Info size={16} />
              <span>
                Data as of{" "}
                {new Date(lastRefreshed).toLocaleString("en-AE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label
                    htmlFor="nm-start-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <Calendar size={16} className="inline mr-1" />
                    Start Date
                  </label>
                  <input
                    id="nm-start-date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } border focus:ring-2 focus:ring-emerald-500`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="nm-end-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <Calendar size={16} className="inline mr-1" />
                    End Date
                  </label>
                  <input
                    id="nm-end-date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } border focus:ring-2 focus:ring-emerald-500`}
                  />
                </div>

                <div>
                  <FormSelect
                    label="Customer"
                    value={selectedCustomer}
                    onValueChange={(value) => setSelectedCustomer(value)}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <FormSelect
                    label="Product"
                    value={selectedProduct}
                    onValueChange={(value) => setSelectedProduct(value)}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <FormSelect
                    label="Status"
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value)}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="OK">OK</SelectItem>
                    <SelectItem value="MISSING_COST">Missing Cost</SelectItem>
                    <SelectItem value="MISSING_WEIGHT">Missing Weight</SelectItem>
                    <SelectItem value="UNSUPPORTED_BASIS">Unsupported Basis</SelectItem>
                    <SelectItem value="ZERO_WEIGHT">Zero Weight</SelectItem>
                  </FormSelect>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    fetchSummary();
                    if (activeTab === "lines") fetchLines(1);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mt-4 flex space-x-1">
            {["summary", "lines"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? isDarkMode
                      ? "bg-gray-900 text-white border-b-2 border-emerald-500"
                      : "bg-gray-50 text-gray-900 border-b-2 border-emerald-600"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "summary" ? "Summary" : "Line Details"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw
                className={`mx-auto h-12 w-12 animate-spin ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading report data...</p>
            </div>
          </div>
        ) : activeTab === "summary" ? (
          <SummaryTab
            kpi={kpi}
            exclusions={exclusions}
            summaryRows={summaryData?.summary_rows || []}
            isDarkMode={isDarkMode}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            SortIcon={SortIcon}
          />
        ) : (
          <LinesTab
            lines={linesData}
            loading={linesLoading}
            page={linesPage}
            totalPages={linesTotalPages}
            onPageChange={fetchLines}
            isDarkMode={isDarkMode}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}
      </div>
    </div>
  );
}

function SummaryTab({
  kpi,
  exclusions,
  summaryRows,
  isDarkMode,
  formatCurrency,
  formatPercent,
  sortField,
  sortDir,
  onSort,
  SortIcon,
}) {
  const sortedRows = useMemo(() => {
    const rows = [...summaryRows];
    rows.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return rows;
  }, [summaryRows, sortField, sortDir]);

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Avg Sell / KG"
          value={formatCurrency(kpi.avg_sell_per_kg)}
          isDarkMode={isDarkMode}
          color="from-blue-600 to-blue-700"
        />
        <KPICard
          title="Avg Cost / KG"
          value={formatCurrency(kpi.avg_cost_per_kg)}
          isDarkMode={isDarkMode}
          color="from-red-600 to-red-700"
        />
        <KPICard
          title="Avg Margin / KG"
          value={formatCurrency(kpi.avg_margin_per_kg)}
          isDarkMode={isDarkMode}
          color="from-green-600 to-green-700"
        />
        <KPICard
          title="Overall Margin %"
          value={formatPercent(kpi.overall_margin_percent)}
          isDarkMode={isDarkMode}
          color="from-emerald-600 to-emerald-700"
        />
      </div>

      {/* Exclusions */}
      {exclusions.total_excluded > 0 && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle size={18} className={isDarkMode ? "text-yellow-400" : "text-yellow-600"} />
            <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {exclusions.total_excluded} lines excluded from KPI calculations
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {exclusions.by_reason &&
              Object.entries(exclusions.by_reason).map(([reason, count]) => {
                const badge = STATUS_BADGES[reason];
                return (
                  <span
                    key={reason}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${badge ? badge.bg : "bg-gray-200 text-gray-700"}`}
                  >
                    {badge ? badge.label : reason}: {count}
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"} border-b ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                {[
                  { key: "product_name", label: "Product", align: "text-left" },
                  { key: "line_count", label: "Lines", align: "text-right" },
                  { key: "avg_sell_per_kg", label: "Avg Sell/KG", align: "text-right" },
                  { key: "avg_cost_per_kg", label: "Avg Cost/KG", align: "text-right" },
                  { key: "avg_margin_per_kg", label: "Avg Margin/KG", align: "text-right" },
                  { key: "margin_percent", label: "Margin %", align: "text-right" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 ${col.align} text-sm font-medium cursor-pointer select-none ${
                      isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}
                    <SortIcon field={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No data available for the selected filters
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, index) => (
                  <tr
                    key={row.product_name || index}
                    className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${
                      index % 2 === 0 ? (isDarkMode ? "bg-gray-800/50" : "bg-gray-50/50") : ""
                    }`}
                  >
                    <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {row.product_name}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {row.line_count}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {formatCurrency(row.avg_sell_per_kg)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {formatCurrency(row.avg_cost_per_kg)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        (row.avg_margin_per_kg || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(row.avg_margin_per_kg)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        (row.margin_percent || 0) >= 15
                          ? "text-green-600"
                          : (row.margin_percent || 0) >= 10
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {formatPercent(row.margin_percent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function LinesTab({ lines, loading, page, totalPages, onPageChange, isDarkMode, formatCurrency, formatPercent }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className={`h-8 w-8 animate-spin ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"} border-b ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                {[
                  "Invoice #",
                  "Customer",
                  "Product",
                  "Qty",
                  "Weight (KG)",
                  "Sell/KG",
                  "Cost/KG",
                  "Margin/KG",
                  "Margin %",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-sm font-medium whitespace-nowrap ${
                      h === "Invoice #" || h === "Customer" || h === "Product" || h === "Status"
                        ? "text-left"
                        : "text-right"
                    } ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No line data available
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => {
                  const statusBadge = STATUS_BADGES[line.normalisationStatus];
                  const qualityBadge = line.snapshotQuality === "INFERRED" ? QUALITY_BADGE.INFERRED : null;
                  return (
                    <tr
                      key={line.id || index}
                      className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${
                        index % 2 === 0 ? (isDarkMode ? "bg-gray-800/50" : "bg-gray-50/50") : ""
                      }`}
                    >
                      <td className={`px-3 py-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {line.invoiceNumber || "-"}
                      </td>
                      <td className={`px-3 py-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {line.customerName || "-"}
                      </td>
                      <td className={`px-3 py-2 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {line.productName || "-"}
                      </td>
                      <td className={`px-3 py-2 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {line.quantity ?? "-"}
                      </td>
                      <td className={`px-3 py-2 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {line.weightKg != null ? Number(line.weightKg).toFixed(2) : "-"}
                      </td>
                      <td className={`px-3 py-2 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {line.sell_per_kg != null ? formatCurrency(line.sell_per_kg) : "-"}
                      </td>
                      <td className={`px-3 py-2 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {line.cost_per_kg != null ? formatCurrency(line.cost_per_kg) : "-"}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm text-right font-medium ${
                          (line.margin_per_kg || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {line.margin_per_kg != null ? formatCurrency(line.margin_per_kg) : "-"}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm text-right font-medium ${
                          (line.margin_percent || 0) >= 15
                            ? "text-green-600"
                            : (line.margin_percent || 0) >= 10
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {line.margin_percent != null ? formatPercent(line.margin_percent) : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {statusBadge ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg}`}>
                              {statusBadge.label}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              OK
                            </span>
                          )}
                          {qualityBadge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${qualityBadge.bg}`}>
                              {qualityBadge.label}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Page {page} of {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={`px-3 py-1 rounded text-sm ${
                isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } ${page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className={`px-3 py-1 rounded text-sm ${
                isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } ${page >= totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function KPICard({ title, value, isDarkMode, color }) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
