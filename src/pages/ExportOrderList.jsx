import {
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Eye,
  Filter,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Ship,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { exportOrderService } from "../services/exportOrderService";

// GCC Country codes for flag display
const GCC_COUNTRIES = {
  "Saudi Arabia": "SA",
  Kuwait: "KW",
  Bahrain: "BH",
  Qatar: "QA",
  Oman: "OM",
  UAE: "AE",
};

// Country flag emoji helper
const getCountryFlag = (countryName) => {
  const code = GCC_COUNTRIES[countryName];
  if (!code) return null;
  // Convert country code to flag emoji
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const ExportOrderList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    start_date: "",
    end_date: "",
    vat_treatment: "",
    destination_type: "",
    export_type: "",
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "orderDate",
    direction: "desc",
  });

  // Show/hide advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Status options from service
  const statusOptions = exportOrderService.getStatusOptions();

  // VAT treatment options for UAE export compliance
  const vatTreatmentOptions = [
    { value: "zero_rated", label: "Zero-Rated (0%)", color: "green" },
    { value: "exempt", label: "Exempt", color: "blue" },
    { value: "re_export", label: "Re-Export", color: "purple" },
  ];

  // Destination type options
  const destinationTypeOptions = [
    { value: "gcc", label: "GCC Countries" },
    { value: "international", label: "International" },
    { value: "designated_zone_export", label: "Designated Zone Export" },
  ];

  // Export type options
  const exportTypeOptions = [
    { value: "direct_export", label: "Direct Export" },
    { value: "re_export", label: "Re-Export" },
    { value: "dz_export", label: "DZ Export" },
  ];

  // Load orders
  const loadOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit: pagination.per_page,
          sort_by: sortConfig.key,
          sort_order: sortConfig.direction,
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
        };

        const response = await exportOrderService.getExportOrders(params);
        setOrders(response.orders || response.data || []);
        setPagination(
          response.pagination || {
            current_page: page,
            per_page: 50,
            total: response.total || 0,
            total_pages: response.total_pages || Math.ceil((response.total || 0) / 50),
          }
        );
      } catch (err) {
        setError(err.message || "Failed to load export orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.per_page, sortConfig.key, sortConfig.direction, filters]
  );

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders(1);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      start_date: "",
      end_date: "",
      vat_treatment: "",
      destination_type: "",
      export_type: "",
    });
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Render sort indicator
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await exportOrderService.updateStatus(orderId, newStatus);
      loadOrders(pagination.current_page);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  // Handle delete
  const handleDelete = async (orderId) => {
    const confirmed = await confirm({
      title: "Delete Export Order?",
      message: "Are you sure you want to delete this export order? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await exportOrderService.deleteExportOrder(orderId);
      loadOrders(pagination.current_page);
    } catch (err) {
      setError(err.message || "Failed to delete export order");
    }
  };

  // Handle bulk selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  // Handle export to Excel
  const handleExportToExcel = async () => {
    try {
      // Build query params for export
      const params = new URLSearchParams();
      if (selectedOrders.length > 0) {
        params.set("ids", selectedOrders.join(","));
      } else {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
      }

      // Trigger download (this would call an export endpoint)
      window.open(`/api/export-orders/export?${params.toString()}`, "_blank");
    } catch (_err) {
      setError("Failed to export to Excel");
    }
  };

  // Calculate total value of displayed orders
  const totalValue = useMemo(() => {
    return orders.reduce((sum, order) => {
      return sum + parseFloat(order.total || order.totalAmount || 0);
    }, 0);
  }, [orders]);

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      draft: "bg-gray-100 text-gray-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-yellow-100 text-yellow-800",
      shipped: "bg-orange-100 text-orange-800",
      in_transit: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  // Get VAT badge
  const renderVatBadge = (vatTreatment) => {
    if (vatTreatment === "zero_rated") {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">0% VAT</span>;
    }
    if (vatTreatment === "exempt") {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">EXEMPT</span>;
    }
    if (vatTreatment === "re_export") {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">RE-EXPORT</span>
      );
    }
    return null;
  };

  // Check if country is GCC
  const isGccCountry = (country) => {
    return Object.keys(GCC_COUNTRIES).includes(country);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = "AED") => {
    return `${currency} ${parseFloat(amount || 0).toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="text-teal-600" size={28} />
            Export Orders
          </h1>
          <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage export orders with UAE VAT compliance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportToExcel}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
            }`}
            title="Export to Excel"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link
            to="/export-orders/new"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            New Export Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-4 mb-6 shadow-sm`}>
        <form onSubmit={handleSearch}>
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by order number, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={`px-3 py-2 border rounded-lg ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className={`px-3 py-2 border rounded-lg ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className={`px-3 py-2 border rounded-lg ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
              placeholder="End Date"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`text-sm flex items-center gap-1 ${
                isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
              }`}
            >
              <Filter size={16} />
              {showAdvancedFilters ? "Hide" : "Show"} UAE VAT Filters
              {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {Object.values(filters).some((v) => v !== "") && (
              <button
                type="button"
                onClick={clearFilters}
                className={`text-sm flex items-center gap-1 ${
                  isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <RefreshCw size={14} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filters (UAE VAT Compliance) */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <select
                value={filters.vat_treatment}
                onChange={(e) => handleFilterChange("vat_treatment", e.target.value)}
                className={`px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              >
                <option value="">All VAT Treatments</option>
                {vatTreatmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.destination_type}
                onChange={(e) => handleFilterChange("destination_type", e.target.value)}
                className={`px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              >
                <option value="">All Destinations</option>
                {destinationTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.export_type}
                onChange={(e) => handleFilterChange("export_type", e.target.value)}
                className={`px-3 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}
              >
                <option value="">All Export Types</option>
                {exportTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            &times;
          </button>
        </div>
      )}

      {/* Selected Items Actions */}
      {selectedOrders.length > 0 && (
        <div
          className={`${isDarkMode ? "bg-teal-900/30 border-teal-700" : "bg-teal-50 border-teal-200"} border rounded-lg p-3 mb-4 flex items-center justify-between`}
        >
          <span className={isDarkMode ? "text-teal-300" : "text-teal-700"}>
            {selectedOrders.length} order(s) selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportToExcel}
              className="px-3 py-1 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded"
            >
              Export Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedOrders([])}
              className={`px-3 py-1 text-sm rounded ${
                isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading export orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} size={48} />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No export orders found</p>
            <Link to="/export-orders/new" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
              Create your first export order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  {/* Bulk Selection */}
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                    onClick={() => handleSort("exportOrderNumber")}
                  >
                    Order Number {renderSortIndicator("exportOrderNumber")}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                    onClick={() => handleSort("customerName")}
                  >
                    Customer {renderSortIndicator("customerName")}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                    onClick={() => handleSort("destinationCountry")}
                  >
                    Destination {renderSortIndicator("destinationCountry")}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                    onClick={() => handleSort("orderDate")}
                  >
                    Order Date {renderSortIndicator("orderDate")}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                    onClick={() => handleSort("total")}
                  >
                    Total {renderSortIndicator("total")}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    VAT
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                    } ${selectedOrders.includes(order.id) ? (isDarkMode ? "bg-teal-900/20" : "bg-teal-50") : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>

                    {/* Order Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {order.exportOrderNumber || order.export_order_number || "N/A"}
                      </div>
                      {order.exportType === "re_export" && order.originalBoeReference && (
                        <div className="text-xs text-gray-500 mt-1">BOE: {order.originalBoeReference}</div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{order.customerName || order.customer_name || "N/A"}</div>
                    </td>

                    {/* Destination */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm flex items-center gap-2">
                        {isGccCountry(order.destinationCountry) && (
                          <span className="text-lg" title="GCC Country">
                            {getCountryFlag(order.destinationCountry)}
                          </span>
                        )}
                        <div>
                          <div>{order.destinationCountry || order.destination_country || "N/A"}</div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {order.destinationPort || order.destination_port || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Order Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{formatDate(order.orderDate || order.order_date)}</div>
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {formatCurrency(order.total || order.totalAmount, order.currency || "AED")}
                      </div>
                    </td>

                    {/* Status with Quick Update */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${getStatusBadgeClass(order.status)}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* VAT Treatment */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {renderVatBadge(order.exportVatTreatment || order.export_vat_treatment)}
                        {order.exportType === "re_export" && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            RE-EXPORT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/export-orders/${order.id}`}
                          className="text-teal-600 hover:text-teal-900 p-1"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/export-orders/${order.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Total Summary Row */}
              <tfoot
                className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"} border-t-2 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <tr>
                  <td
                    colSpan="5"
                    className={`px-6 py-3 text-sm font-semibold text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Page Total ({orders.length} orders):
                  </td>
                  <td className={`px-6 py-3 text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(totalValue, "AED")}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div
            className={`px-6 py-3 flex flex-col sm:flex-row items-center justify-between border-t gap-3 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadOrders(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = pagination.current_page - 2 + i;
                  }

                  return (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => loadOrders(pageNum)}
                      className={`w-8 h-8 text-sm rounded ${
                        pageNum === pagination.current_page
                          ? "bg-teal-600 text-white"
                          : isDarkMode
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => loadOrders(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ExportOrderList;
