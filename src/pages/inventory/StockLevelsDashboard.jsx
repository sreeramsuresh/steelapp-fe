import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  DollarSign,
  Eye,
  Layers,
  Package,
  Search,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BatchAllocationKPIs from "../../components/dashboard/BatchAllocationKPIs";
import { useTheme } from "../../contexts/ThemeContext";
import { notificationService } from "../../services/notificationService";
import { stockMovementService } from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";
import { formatCurrency } from "../../utils/invoiceUtils";

// ── Stale-while-revalidate cache utilities ───────────────────────
const STOCK_CACHE_KEYS = {
  STOCK_LEVELS_SUMMARY: "stock-levels-summary",
  STOCK_LEVELS_LIST: "stock-levels-list",
};

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getStockCachedData(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStockCachedData(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* quota exceeded — ignore */
  }
}

function isStockCacheFresh(timestamp) {
  return timestamp && Date.now() - timestamp < CACHE_TTL_MS;
}

// ── Column configuration ──────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "product", label: "Product", align: "left", default: true, locked: true },
  { key: "warehouse", label: "Warehouse", align: "left", default: true },
  { key: "onHand", label: "On Hand", align: "right", default: true },
  { key: "reserved", label: "Reserved", align: "right", default: true },
  { key: "available", label: "Available", align: "right", default: true },
  { key: "minStock", label: "Min Stock", align: "right", default: false },
  { key: "status", label: "Status", align: "center", default: true },
  { key: "value", label: "Value", align: "right", default: false },
  { key: "actions", label: "Actions", align: "right", default: true, locked: true },
];

const DEFAULT_VISIBLE = ALL_COLUMNS.filter((c) => c.default).map((c) => c.key);

const COLUMN_STORAGE_KEY = "stock-levels-columns";

function loadSavedColumns() {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return DEFAULT_VISIBLE;
}

// ── Group-by helpers ──────────────────────────────────────────────
function extractGrade(name) {
  if (!name) return "Unknown";
  const match = name.match(/^SS-(\d{3}L?)/i);
  return match ? match[1] : "Other";
}

function groupItems(items, groupBy) {
  if (!groupBy || groupBy === "none") return null;
  const groups = {};
  for (const item of items) {
    let key;
    if (groupBy === "grade") key = extractGrade(item.productName);
    else if (groupBy === "warehouse") key = item.warehouseName || "Unassigned";
    else key = "All";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Stock Levels Dashboard
 * Phase 2: View current stock levels across all products/warehouses
 *
 * Displays inventory levels with low stock highlighting
 */
const StockLevelsDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Initialize state from cache for instant display (stale-while-revalidate)
  const initializeFromCache = () => {
    const cachedSummary = getStockCachedData(STOCK_CACHE_KEYS.STOCK_LEVELS_SUMMARY);
    const cachedList = getStockCachedData(STOCK_CACHE_KEYS.STOCK_LEVELS_LIST);
    return {
      stockLevels: cachedList?.data?.stockLevels || [],
      summary: cachedSummary?.data || null,
      pagination: cachedList?.data?.pagination || {},
      hasCache: !!(cachedSummary?.data || cachedList?.data?.stockLevels?.length),
    };
  };

  const cachedState = initializeFromCache();

  // State - initialize from cache if available
  const [stockLevels, setStockLevels] = useState(cachedState.stockLevels);
  const [summary, setSummary] = useState(cachedState.summary);
  const [warehouses, setWarehouses] = useState([]);
  // Set loading=false if we have cached data (instant display)
  const [loading, setLoading] = useState(!cachedState.hasCache);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [includeZero, setIncludeZero] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(cachedState.pagination);

  // Track whether we have data (avoids stale closure in useCallback)
  const hasDataRef = useRef(cachedState.hasCache);

  // Phase 1 additions: Group By, Column Configuration, Batch KPI toggle
  const [groupBy, setGroupBy] = useState("none");
  const [visibleColumns, setVisibleColumns] = useState(loadSavedColumns);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showBatchKpis, setShowBatchKpis] = useState(false);
  const columnPickerRef = useRef(null);

  // Persist column visibility
  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const col = ALL_COLUMNS.find((c) => c.key === key);
      if (col?.locked) return prev;
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Close column picker on click outside
  useEffect(() => {
    const handler = (e) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Grouped data (memoized)
  const groupedData = useMemo(() => groupItems(stockLevels, groupBy), [stockLevels, groupBy]);

  // Active columns for rendering (memoized)
  const activeColumns = useMemo(() => ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)), [visibleColumns]);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await warehouseService.getAll({ limit: 100 });
        setWarehouses(res?.data || res || []);
      } catch (err) {
        console.error("Failed to load warehouses:", err);
      }
    };
    fetchWarehouses();
  }, []);

  // Fetch stock levels with stale-while-revalidate caching
  const fetchStockLevels = useCallback(async () => {
    // Check if we have valid cached data and this is a default filter request
    const isDefaultFilters = page === 1 && !searchTerm && warehouseFilter === "all" && !lowStockOnly && !includeZero;
    const cachedSummary = getStockCachedData(STOCK_CACHE_KEYS.STOCK_LEVELS_SUMMARY);
    const cachedList = getStockCachedData(STOCK_CACHE_KEYS.STOCK_LEVELS_LIST);
    const _hasFreshCache =
      isDefaultFilters &&
      cachedSummary &&
      isStockCacheFresh(cachedSummary.timestamp) &&
      cachedList &&
      isStockCacheFresh(cachedList.timestamp);

    // Only show loading spinner if we have no cached data
    if (!hasDataRef.current) {
      setLoading(true);
    }
    setError("");

    try {
      const filters = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        warehouseId: warehouseFilter !== "all" ? parseInt(warehouseFilter, 10) : undefined,
        lowStockOnly: lowStockOnly || undefined,
        includeZero: includeZero || undefined,
      };

      const response = await stockMovementService.getStockLevels(filters);
      setStockLevels(response.data || []);
      setPagination(response.pagination || {});
      setSummary(response.summary || null);
      hasDataRef.current = true;

      // Cache the results for default filter requests (page 1, no filters)
      if (isDefaultFilters) {
        setStockCachedData(STOCK_CACHE_KEYS.STOCK_LEVELS_SUMMARY, response.summary || null);
        setStockCachedData(STOCK_CACHE_KEYS.STOCK_LEVELS_LIST, {
          stockLevels: response.data || [],
          pagination: response.pagination || {},
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch stock levels";
      setError(errorMessage);
      notificationService.error(errorMessage);
      // Only clear data if we don't have cached data to fall back on
      if (!hasDataRef.current) {
        setStockLevels([]);
      }
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, warehouseFilter, lowStockOnly, includeZero]);

  useEffect(() => {
    fetchStockLevels();
  }, [fetchStockLevels]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setWarehouseFilter("all");
    setLowStockOnly(false);
    setIncludeZero(false);
    setPage(1);
  };

  // Get status badge
  const getStatusBadge = (item) => {
    if (item.isOutOfStock || item.quantityAvailable <= 0) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${
            isDarkMode ? "bg-red-900/30 text-red-300 border-red-600" : "bg-red-100 text-red-800 border-red-300"
          }`}
        >
          <X size={12} />
          Out of Stock
        </span>
      );
    }

    if (item.isLowStock || item.quantityAvailable <= item.minimumStock) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${
            isDarkMode
              ? "bg-yellow-900/30 text-yellow-300 border-yellow-600"
              : "bg-yellow-100 text-yellow-800 border-yellow-300"
          }`}
        >
          <AlertTriangle size={12} />
          Low Stock
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${
          isDarkMode
            ? "bg-green-900/30 text-green-300 border-green-600"
            : "bg-green-100 text-green-800 border-green-300"
        }`}
      >
        In Stock
      </span>
    );
  };

  // Calculate total pages
  const totalPages = pagination.totalPages || Math.ceil((pagination.totalItems || 0) / 20);

  // ── Render a single stock row (only visible columns) ──
  const renderStockRow = (item) => {
    const isAlert = item.isLowStock || item.isOutOfStock;
    return (
      <tr
        key={item.id}
        className={`${isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"} transition-colors ${
          isAlert
            ? isDarkMode
              ? "bg-red-900/10 border-l-2 border-l-red-500"
              : "bg-red-50 border-l-2 border-l-red-400"
            : ""
        }`}
      >
        {activeColumns.map((col) => {
          switch (col.key) {
            case "product":
              return (
                <td key="product" className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {item.productName || "-"}
                  </div>
                  <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {item.productSku || ""} {item.productType ? `- ${item.productType}` : ""}
                  </div>
                </td>
              );
            case "warehouse":
              return (
                <td
                  key="warehouse"
                  className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  <div className="flex items-center gap-2">
                    <Warehouse size={14} className="opacity-50" />
                    {item.warehouseName || "-"}
                  </div>
                </td>
              );
            case "onHand":
              return (
                <td
                  key="onHand"
                  className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  {item.quantityOnHand?.toFixed(2)} {item.unit}
                </td>
              );
            case "reserved":
              return (
                <td
                  key="reserved"
                  className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}
                >
                  {item.quantityReserved > 0 ? `${item.quantityReserved.toFixed(2)} ${item.unit}` : "-"}
                </td>
              );
            case "available":
              return (
                <td
                  key="available"
                  className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    item.quantityAvailable <= 0
                      ? isDarkMode
                        ? "text-red-400"
                        : "text-red-600"
                      : item.quantityAvailable <= item.minimumStock
                        ? isDarkMode
                          ? "text-yellow-400"
                          : "text-yellow-600"
                        : isDarkMode
                          ? "text-green-400"
                          : "text-green-600"
                  }`}
                >
                  {item.quantityAvailable?.toFixed(2)} {item.unit}
                </td>
              );
            case "minStock":
              return (
                <td
                  key="minStock"
                  className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {item.minimumStock > 0 ? `${item.minimumStock} ${item.unit}` : "-"}
                </td>
              );
            case "status":
              return (
                <td key="status" className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusBadge(item)}
                </td>
              );
            case "value":
              return (
                <td
                  key="value"
                  className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  {formatCurrency(item.totalValue || 0)}
                </td>
              );
            case "actions":
              return (
                <td key="actions" className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/stock-movements?product_id=${item.productId}`)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? "hover:bg-gray-700 text-blue-400" : "hover:bg-gray-100 text-blue-600"
                    }`}
                    title="View Movement History"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              );
            default:
              return null;
          }
        })}
      </tr>
    );
  };

  // Loading state
  if (loading && stockLevels.length === 0) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading stock levels...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      {/* ── Clickable KPI Cards ── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 px-4 sm:px-0">
          {/* Total Products — click resets all filters */}
          <button
            type="button"
            onClick={resetFilters}
            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
              !lowStockOnly && !includeZero
                ? isDarkMode
                  ? "bg-[#1E2328] border-blue-500 ring-1 ring-blue-500/30"
                  : "bg-white border-blue-400 ring-1 ring-blue-400/30"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-blue-500/50"
                  : "bg-white border-[#E0E0E0] hover:border-blue-400/50"
            }`}
            title="Click to show all products"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
                <Package size={20} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Products</p>
                <p className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {summary.totalProducts || 0}
                </p>
              </div>
            </div>
          </button>

          {/* Total Quantity */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
            title="Sum of all on-hand quantities across warehouses"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}>
                <BarChart3 size={20} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Quantity</p>
                <p className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {(summary.totalQuantity || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
            title="Estimated value of all stock based on last purchase price"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-green-900/30" : "bg-green-100"}`}>
                <DollarSign size={20} className={isDarkMode ? "text-green-400" : "text-green-600"} />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Value</p>
                <p className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(summary.totalValue || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Low Stock — CLICKABLE: toggles lowStockOnly filter */}
          <button
            type="button"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setIncludeZero(false);
              setPage(1);
            }}
            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
              lowStockOnly
                ? isDarkMode
                  ? "bg-yellow-900/20 border-yellow-500 ring-1 ring-yellow-500/30"
                  : "bg-yellow-50 border-yellow-400 ring-1 ring-yellow-400/30"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-yellow-500/50"
                  : "bg-white border-[#E0E0E0] hover:border-yellow-400/50"
            }`}
            title="Click to filter low stock items only"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
                <AlertTriangle size={20} className={isDarkMode ? "text-yellow-400" : "text-yellow-600"} />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Low Stock</p>
                <p className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {summary.lowStockCount || 0}
                </p>
              </div>
            </div>
          </button>

          {/* Out of Stock — CLICKABLE: toggles includeZero filter */}
          <button
            type="button"
            onClick={() => {
              setIncludeZero(!includeZero);
              setLowStockOnly(false);
              setPage(1);
            }}
            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
              includeZero
                ? isDarkMode
                  ? "bg-red-900/20 border-red-500 ring-1 ring-red-500/30"
                  : "bg-red-50 border-red-400 ring-1 ring-red-400/30"
                : isDarkMode
                  ? "bg-[#1E2328] border-[#37474F] hover:border-red-500/50"
                  : "bg-white border-[#E0E0E0] hover:border-red-400/50"
            }`}
            title="Click to show out-of-stock items"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-900/30" : "bg-red-100"}`}>
                <TrendingDown size={20} className={isDarkMode ? "text-red-400" : "text-red-600"} />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Out of Stock</p>
                <p className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {summary.outOfStockCount || 0}
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Batch Allocation KPIs — collapsed by default ── */}
      <div className="mb-6 px-4 sm:px-0">
        <button
          type="button"
          onClick={() => setShowBatchKpis(!showBatchKpis)}
          className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ChevronDown size={16} className={`transition-transform ${showBatchKpis ? "rotate-0" : "-rotate-90"}`} />
          Batch Allocation Health
        </button>
        {showBatchKpis && <BatchAllocationKPIs />}
      </div>

      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              📈 Stock Levels
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Current inventory levels across all warehouses
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/app/stock-movements"
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              View Movements
            </Link>
          </div>
        </div>

        {/* ── Primary Filter Bar ── */}
        <div className="mb-6 px-4 sm:px-0">
          <div className="flex gap-3 flex-wrap items-center">
            {/* Search */}
            <div className="flex-grow min-w-[220px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
              </div>
              <input
                type="text"
                placeholder="Search product or SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Warehouse — always visible */}
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={String(wh.id)}>
                  {wh.name}
                </option>
              ))}
            </select>

            {/* Group By */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className={`px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="none">No Grouping</option>
              <option value="grade">Group by Grade</option>
              <option value="warehouse">Group by Warehouse</option>
            </select>

            {/* Configure Columns */}
            <div ref={columnPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                  showColumnPicker
                    ? "bg-teal-600 text-white border-teal-600"
                    : isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Columns3 size={16} />
                Columns
              </button>
              {showColumnPicker && (
                <div
                  className={`absolute right-0 top-full mt-1 w-56 rounded-lg border shadow-xl z-50 py-2 ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer ${
                        col.locked ? "opacity-50 cursor-not-allowed" : ""
                      } ${isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        disabled={col.locked}
                        onChange={() => toggleColumn(col.key)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      {col.label}
                      {col.locked && <span className="text-xs opacity-50 ml-auto">Required</span>}
                    </label>
                  ))}
                  <div className={`border-t mt-1 pt-1 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setVisibleColumns(DEFAULT_VISIBLE);
                        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(DEFAULT_VISIBLE));
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        isDarkMode ? "text-teal-400 hover:bg-gray-700" : "text-teal-600 hover:bg-gray-50"
                      }`}
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active filter indicator + reset */}
            {(warehouseFilter !== "all" || lowStockOnly || includeZero || searchTerm) && (
              <button
                type="button"
                onClick={resetFilters}
                className={`flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <X size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div
            className={`mb-4 p-4 rounded-lg border mx-4 sm:mx-0 ${
              isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {stockLevels.length === 0 && !loading && (
          <div className={`text-center p-12 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>No stock levels found</p>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Stock appears here after goods are received via GRN approval against Purchase Orders.
            </p>
            {(searchTerm || warehouseFilter !== "all" || lowStockOnly) && (
              <button type="button" onClick={resetFilters} className="mt-4 text-teal-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Table — dynamic columns + group-by */}
        {stockLevels.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
                <tr>
                  {activeColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-6 py-3 ${
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                      } text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {groupBy !== "none" && groupedData
                  ? groupedData.map(([groupName, items]) => (
                      <Fragment key={groupName}>
                        {/* Group header */}
                        <tr className={isDarkMode ? "bg-gray-800/80" : "bg-gray-100"}>
                          <td
                            colSpan={activeColumns.length}
                            className={`px-6 py-2 text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                          >
                            <div className="flex items-center gap-2">
                              <Layers size={14} />
                              {groupBy === "grade" ? `Grade: ${groupName}` : groupName}
                              <span className={`text-xs font-normal ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                ({items.length} {items.length === 1 ? "item" : "items"})
                              </span>
                            </div>
                          </td>
                        </tr>
                        {items.map((item) => renderStockRow(item))}
                      </Fragment>
                    ))
                  : stockLevels.map((item) => renderStockRow(item))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 px-4 sm:px-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`p-2 rounded transition-colors ${
                  page === 1
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded transition-colors ${
                  page === totalPages
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockLevelsDashboard;
