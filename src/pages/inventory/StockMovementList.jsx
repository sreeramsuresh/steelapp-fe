import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { authService } from "../../services/axiosAuthService";
import { notificationService } from "../../services/notificationService";
import { MOVEMENT_TYPES, REFERENCE_TYPES, stockMovementService } from "../../services/stockMovementService";
import { formatDate } from "../../utils/invoiceUtils";

/**
 * Stock Movement List Page
 * Phase 2: Core Stock Movement CRUD
 *
 * Displays a paginated, filterable list of stock movements
 */
const StockMovementList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // State
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Get movement type badge
  const getMovementTypeBadge = (type) => {
    const config = MOVEMENT_TYPES[type] || { label: type, color: "gray" };

    const colorClasses = {
      green: isDarkMode
        ? "bg-green-900/30 text-green-300 border-green-600"
        : "bg-green-100 text-green-800 border-green-300",
      red: isDarkMode ? "bg-red-900/30 text-red-300 border-red-600" : "bg-red-100 text-red-800 border-red-300",
      orange: isDarkMode
        ? "bg-orange-900/30 text-orange-300 border-orange-600"
        : "bg-orange-100 text-orange-800 border-orange-300",
      blue: isDarkMode ? "bg-blue-900/30 text-blue-300 border-blue-600" : "bg-blue-100 text-blue-800 border-blue-300",
      purple: isDarkMode
        ? "bg-purple-900/30 text-purple-300 border-purple-600"
        : "bg-purple-100 text-purple-800 border-purple-300",
      yellow: isDarkMode
        ? "bg-yellow-900/30 text-yellow-300 border-yellow-600"
        : "bg-yellow-100 text-yellow-800 border-yellow-300",
      teal: isDarkMode ? "bg-teal-900/30 text-teal-300 border-teal-600" : "bg-teal-100 text-teal-800 border-teal-300",
      gray: isDarkMode ? "bg-gray-900/30 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-300",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${colorClasses[config.color] || colorClasses.gray}`}
      >
        {type === "IN" || type === "TRANSFER_IN" || type === "RELEASE" ? (
          <ArrowUpCircle size={12} />
        ) : type === "OUT" || type === "TRANSFER_OUT" || type === "RESERVATION" ? (
          <ArrowDownCircle size={12} />
        ) : (
          <RefreshCcw size={12} />
        )}
        {config.label}
      </span>
    );
  };

  // Format quantity with sign
  const formatQuantityWithSign = (movement) => {
    const qty = parseFloat(movement.quantity) || 0;
    const isInbound = ["IN", "TRANSFER_IN", "RELEASE"].includes(movement.movementType);
    const isAdjustment = movement.movementType === "ADJUSTMENT";

    if (isAdjustment) {
      return qty >= 0 ? `+${qty.toFixed(2)}` : qty.toFixed(2);
    }

    return isInbound ? `+${qty.toFixed(2)}` : `-${qty.toFixed(2)}`;
  };

  // Get quantity color class
  const getQuantityColorClass = (movement) => {
    const isInbound = ["IN", "TRANSFER_IN", "RELEASE"].includes(movement.movementType);
    const isAdjustment = movement.movementType === "ADJUSTMENT";
    const qty = parseFloat(movement.quantity) || 0;

    if (isAdjustment) {
      return qty >= 0
        ? isDarkMode
          ? "text-green-400"
          : "text-green-600"
        : isDarkMode
          ? "text-red-400"
          : "text-red-600";
    }

    return isInbound
      ? isDarkMode
        ? "text-green-400"
        : "text-green-600"
      : isDarkMode
        ? "text-red-400"
        : "text-red-600";
  };

  // Fetch movements
  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const filters = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        movementType: movementTypeFilter !== "all" ? movementTypeFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const response = await stockMovementService.getAll(filters);
      setMovements(response.data || []);
      setPagination(response.pagination || {});
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch stock movements";
      setError(errorMessage);
      notificationService.error(errorMessage);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, movementTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setMovementTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Calculate total pages
  const totalPages = pagination.totalPages || Math.ceil((pagination.totalItems || 0) / 20);

  // Loading state
  if (loading && movements.length === 0) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading stock movements...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (movements.length === 0 && !loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
          }`}
        >
          <Package size={64} className="mx-auto mb-4 opacity-50" />
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            No Stock Movements Yet
          </h2>
          <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Create your first stock movement to start tracking inventory
          </p>
          <Link
            to="/inventory/stock-movements/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            Create Stock Movement
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Stock Movements
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Track all inventory movements across warehouses
            </p>
          </div>
          <div className="flex gap-2">
            {authService.hasPermission("inventory", "create") && (
              <Link
                to="/inventory/stock-movements/new"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Plus size={18} />
                New Movement
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 px-4 sm:px-0">
          {/* Main search and filter toggle */}
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-grow min-w-[300px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
              </div>
              <input
                type="text"
                placeholder="Search movements..."
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

            <button type="button" onClick={() => setShowFilters(!showFilters)}
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
              {(movementTypeFilter !== "all" || dateFrom || dateTo) && (
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              )}
            </button>
          </button>

          {/* Extended filters */}
          {showFilters && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex flex-wrap gap-4 items-end">
                {/* Movement Type */}
                <div className="min-w-[180px]">
                  <label
                    htmlFor="movement-type-filter"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Movement Type
                  </label>
                  <div className="relative">
                    <select
                      id="movement-type-filter"
                      value={movementTypeFilter}
                      onChange={(e) => {
                        setMovementTypeFilter(e.target.value);
                        setPage(1);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg appearance-none ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="all">All Types</option>
                      {Object.entries(MOVEMENT_TYPES).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    />
                  </div>
                </div>

                {/* Date From */}
                <div className="min-w-[160px]">
                  <label
                    htmlFor="movement-date-from"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    From Date
                  </label>
                  <div className="relative">
                    <input
                      id="movement-date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Date To */}
                <div className="min-w-[160px]">
                  <label
                    htmlFor="movement-date-to"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    To Date
                  </label>
                  <div className="relative">
                    <input
                      id="movement-date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Reset button */}
                <button type="button" onClick={resetFilters}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Date
                </th>
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
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Type
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Quantity
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Reference
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Balance After
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Notes
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {movements.map((movement) => (
                <tr
                  key={movement.id}
                  className={`hover:${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"} transition-colors`}
                >
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="opacity-50" />
                      {formatDate(movement.movementDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {movement.productName || "-"}
                    </div>
                    <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {movement.productSku || ""}
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Warehouse size={14} className="opacity-50" />
                      {movement.warehouseName || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getMovementTypeBadge(movement.movementType)}</td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getQuantityColorClass(movement)}`}
                  >
                    {formatQuantityWithSign(movement)} {movement.unit}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {movement.referenceNumber || "-"}
                    {movement.referenceType && (
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {REFERENCE_TYPES[movement.referenceType]?.label || movement.referenceType}
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {(movement.balanceAfter || 0).toFixed(2)} {movement.unit}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm max-w-[200px] truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {movement.notes || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button type="button" onClick={() => navigate(`/inventory/stock-movements/${movement.id}`)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? "hover:bg-gray-700 text-blue-400" : "hover:bg-gray-100 text-blue-600"
                      }`}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 px-4 sm:px-0">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(Math.max(1, page - 1))}
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
              <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))}
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

export default StockMovementList;
