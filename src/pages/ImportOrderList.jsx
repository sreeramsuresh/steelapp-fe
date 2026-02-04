import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import { importOrderService } from "../services/importOrderService";

const ImportOrderList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  });

  // Load orders
  const loadOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.perPage,
        ...filters,
      };

      const response = await importOrderService.getImportOrders(params);
      setOrders(response.orders || []);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.perPage, filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle search
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

  // Handle status update
  const _handleStatusUpdate = async (orderId, status) => {
    try {
      await importOrderService.updateStatus(orderId, status);
      loadOrders(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (orderId) => {
    const confirmed = await confirm({
      title: "Delete Import Order?",
      message: "Are you sure you want to delete this import order? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await importOrderService.deleteImportOrder(orderId);
      loadOrders(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    }
  };

  const statusOptions = importOrderService.getStatusOptions();

  return (
    <div className={`p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Import Orders</h1>
          <p className="text-gray-500 mt-1">Manage your import orders and track shipments</p>
        </div>
        <Link
          to="/import-orders/new"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          New Import Order
        </Link>
      </div>

      {/* Filters */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-4 mb-6 shadow-sm`}>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
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
            value={filters.startDate}
            onChange={(e) => handleFilterChange("start_date", e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("end_date", e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
            placeholder="End Date"
          />
        </form>
      </div>

      {/* Error Display */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Orders Table */}
      <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No import orders found</p>
            <Link to="/import-orders/new" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
              Create your first import order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}`}>
                {orders.map((order) => (
                  <tr key={order.id} className={`hover:${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{order.importOrderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{order.supplierName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{order.originPort || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{new Date(order.orderDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {order.currency} {parseFloat(order.total || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "confirmed"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusOptions.find((s) => s.value === order.status)?.label || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/import-orders/${order.id}`} className="text-teal-600 hover:text-teal-900">
                        <Eye size={16} className="inline" />
                      </Link>
                      <Link to={`/import-orders/${order.id}/edit`} className="text-blue-600 hover:text-blue-900">
                        <Edit size={16} className="inline" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.perPage + 1} to{" "}
              {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => loadOrders(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => loadOrders(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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

export default ImportOrderList;
