import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { apiService } from "../services/axiosApi";
import {
  FileText,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { toUAETime, toUAEDateForInput } from "../utils/timezone";

const AuditLogs = () => {
  const { isDarkMode } = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    category: "",
    action: "",
    status: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const itemsPerPage = 50;

  // Categories and actions for filters
  const categories = [
    "AUTH",
    "INVOICE",
    "PAYMENT",
    "CUSTOMER",
    "STATEMENT",
    "SETTINGS",
    "EXPORT",
  ];
  const statuses = ["success", "failed"];

  useEffect(() => {
    fetchLogs();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]); // fetchLogs and fetchStats are stable

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(filters.category && { category: filters.category }),
        ...(filters.action && { action: filters.action }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
      };

      const response = await apiService.get("/audit-logs", { params });

      setLogs(response.logs || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalLogs(response.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get("/audit-logs/stats");
      setStats(response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      action: "",
      status: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      "Date/Time (UAE)",
      "User",
      "Email",
      "Category",
      "Action",
      "Description",
      "Status",
      "IP Address",
    ];
    const csvData = logs.map((log) => [
      toUAETime(log.createdAt, { format: "datetime" }),
      log.username || "-",
      log.userEmail || "-",
      log.category,
      log.action,
      log.description || "-",
      log.status,
      log.ipAddress || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${toUAEDateForInput(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    // Use UAE timezone for display
    return toUAETime(dateString, { format: "datetime" });
  };

  const getCategoryColor = (category) => {
    const colors = {
      AUTH: "blue",
      INVOICE: "green",
      PAYMENT: "purple",
      CUSTOMER: "orange",
      STATEMENT: "indigo",
      SETTINGS: "red",
      EXPORT: "pink",
    };
    return colors[category] || "gray";
  };

  const filteredLogs = logs.filter((log) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      log.username?.toLowerCase().includes(search) ||
      log.userEmail?.toLowerCase().includes(search) ||
      log.description?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search)
    );
  });

  return (
    <div
      className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText
                className={isDarkMode ? "text-blue-400" : "text-blue-600"}
                size={32}
              />
              <div>
                <h1
                  className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Audit Logs
                </h1>
                <p
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Track all user activities and system events
                </p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                logs.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Total Logs
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {totalLogs}
                  </p>
                </div>
                <Activity
                  className={isDarkMode ? "text-blue-400" : "text-blue-600"}
                  size={32}
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Failed Actions
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {stats.categoryStats?.reduce(
                      (sum, cat) => sum + parseInt(cat.failedCount || 0),
                      0,
                    ) || 0}
                  </p>
                </div>
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Categories
                  </p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {stats.categoryStats?.length || 0}
                  </p>
                </div>
                <Filter
                  className={isDarkMode ? "text-green-400" : "text-green-600"}
                  size={32}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div
          className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter
              size={20}
              className={isDarkMode ? "text-gray-400" : "text-gray-600"}
            />
            <h2
              className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Filters
            </h2>
            {(filters.category ||
              filters.status ||
              filters.startDate ||
              filters.endDate ||
              filters.search) && (
              <button
                onClick={clearFilters}
                className={`ml-auto text-sm flex items-center gap-1 px-3 py-1 rounded ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                <Search size={16} className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="User, email, action..."
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Category */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                <Calendar size={16} className="inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* End Date */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                <Calendar size={16} className="inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div
          className={`rounded-lg shadow overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p
                className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Loading audit logs...
              </p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
              <p
                className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {error}
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText
                className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
                size={48}
              />
              <p
                className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                No audit logs found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Date/Time
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        User
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Category
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Action
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Description
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}
                  >
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={`${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <td
                          className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {formatDate(log.createdAt)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          <div className="flex items-center gap-2">
                            <User
                              size={16}
                              className={
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              }
                            />
                            <div>
                              <div className="font-medium">
                                {log.username || "-"}
                              </div>
                              <div
                                className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                              >
                                {log.userEmail || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium bg-${getCategoryColor(log.category)}-100 text-${getCategoryColor(log.category)}-800`}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {log.action}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {log.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.status === "success" ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={16} />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertCircle size={16} />
                              Failed
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-mono ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {log.ipAddress || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className={`px-4 py-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Showing page {currentPage} of {totalPages} ({totalLogs}{" "}
                      total logs)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                          currentPage === 1
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-white"
                              : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                        }`}
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                          currentPage === totalPages
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-white"
                              : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                        }`}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
