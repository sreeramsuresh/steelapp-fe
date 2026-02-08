import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Filter,
  Package,
  Search,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BatchAllocationKPIs from "../../components/dashboard/BatchAllocationKPIs";
import { FormSelect } from "../../components/ui/form-select";
import { SelectItem } from "../../components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";
import { notificationService } from "../../services/notificationService";
import {
  getStockCachedData,
  isStockCacheFresh,
  STOCK_CACHE_KEYS,
  setStockCachedData,
  stockMovementService,
} from "../../services/stockMovementService";
import { warehouseService } from "../../services/warehouseService";
import { formatCurrency } from "../../utils/invoiceUtils";

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
  const [showFilters, setShowFilters] = useState(false);

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
    if (!stockLevels.length && !summary) {
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
      // Only clear data if we don&apos;t have cached data to fall back on
      if (!stockLevels.length) {
        setStockLevels([]);
      }
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, warehouseFilter, lowStockOnly, includeZero, stockLevels.length, summary]);

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
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 px-4 sm:px-0">
          {/* Total Products */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
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
          </div>

          {/* Total Quantity */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
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

          {/* Low Stock */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
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
          </div>

          {/* Out of Stock */}
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
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
          </div>
        </div>
      )}

      {/* Batch Allocation KPIs Section */}
      <div className="mb-6 px-4 sm:px-0">
        <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Batch Allocation Health
        </h2>
        <BatchAllocationKPIs />
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
              Stock Levels
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Current inventory levels across all warehouses
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/app/inventory/stock-movements"
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

        {/* Filters */}
        <div className="mb-6 px-4 sm:px-0">
          <div className="flex gap-4 flex-wrap items-center">
            {/* Search */}
            <div className="flex-grow min-w-[300px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
              </div>
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                showFilters
                  ? "bg-teal-600 text-white border-teal-600"
                  : isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} />
              Filters
              {(warehouseFilter !== "all" || lowStockOnly || includeZero) && (
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              )}
            </button>
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex flex-wrap gap-4 items-center">
                {/* Warehouse */}
                <div className="min-w-[180px]">
                  <FormSelect
                    label="Warehouse"
                    value={warehouseFilter}
                    onValueChange={(value) => {
                      setWarehouseFilter(value);
                      setPage(1);
                    }}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={String(wh.id)}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>

                {/* Low Stock Only */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lowStockOnly"
                    checked={lowStockOnly}
                    onChange={(e) => {
                      setLowStockOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="lowStockOnly" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Low Stock Only
                  </label>
                </div>

                {/* Include Zero */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeZero"
                    checked={includeZero}
                    onChange={(e) => {
                      setIncludeZero(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="includeZero" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Include Zero Stock
                  </label>
                </div>

                {/* Reset */}
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <X size={16} />
                  Reset
                </button>
              </div>
            </div>
          )}
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
            {(searchTerm || warehouseFilter !== "all" || lowStockOnly) && (
              <button type="button" onClick={resetFilters} className="mt-4 text-teal-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {stockLevels.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Product
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Warehouse
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    On Hand
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Reserved
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Available
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Min Stock
                  </th>
                  <th
                    className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Value
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {stockLevels.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"} transition-colors ${
                      item.isLowStock || item.isOutOfStock ? (isDarkMode ? "bg-red-900/5" : "bg-red-50/50") : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {item.productName || "-"}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {item.productSku || ""} {item.productType ? `- ${item.productType}` : ""}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Warehouse size={14} className="opacity-50" />
                        {item.warehouseName || "-"}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {item.quantityOnHand?.toFixed(2)} {item.unit}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}
                    >
                      {item.quantityReserved > 0 ? `${item.quantityReserved.toFixed(2)} ${item.unit}` : "-"}
                    </td>
                    <td
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
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {item.minimumStock > 0 ? `${item.minimumStock} ${item.unit}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(item)}</td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {formatCurrency(item.totalValue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/inventory/stock-movements?product_id=${item.productId}`)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? "hover:bg-gray-700 text-blue-400" : "hover:bg-gray-100 text-blue-600"
                        }`}
                        title="View Movement History"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
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
