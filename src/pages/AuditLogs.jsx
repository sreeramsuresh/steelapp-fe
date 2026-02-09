import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AuditDetailDrawer from "../components/audit/AuditDetailDrawer";
import { FormSelect } from "../components/ui/form-select";
import { SelectItem } from "../components/ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { apiService } from "../services/axiosApi";
import { toUAEDateForInput, toUAETime } from "../utils/timezone";

const CATEGORIES = [
  "AUTH",
  "INVOICE",
  "PAYMENT",
  "CUSTOMER",
  "SUPPLIER",
  "PRODUCT",
  "PURCHASE_ORDER",
  "DELIVERY_NOTE",
  "CREDIT_NOTE",
  "QUOTATION",
  "INVENTORY",
  "WAREHOUSE",
  "SETTINGS",
  "EXPORT",
  "STATEMENT",
  "USER",
  "ROLE",
];

const CATEGORY_COLORS = {
  AUTH: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  INVOICE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PAYMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  CUSTOMER: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  SUPPLIER: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  PRODUCT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  PURCHASE_ORDER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  DELIVERY_NOTE: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  CREDIT_NOTE: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  QUOTATION: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  INVENTORY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  WAREHOUSE: "bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300",
  SETTINGS: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EXPORT: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  STATEMENT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  USER: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  ROLE: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
};

const AuditLogs = () => {
  const { isDarkMode } = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    category: "",
    action: "",
    status: "",
    startDate: "",
    endDate: "",
    search: "",
    userId: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const itemsPerPage = 50;

  // Users list for filter
  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiService
      .get("/admin/users")
      .then((res) => setUsers(res.users || res || []))
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(filters.category && { category: filters.category }),
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.userId && { userId: filters.userId }),
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
  }, [currentPage, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiService.get("/audit-logs/stats");
      setStats(response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      action: "",
      status: "",
      startDate: "",
      endDate: "",
      search: "",
      userId: "",
    });
    setCurrentPage(1);
  };

  const handleRowClick = async (log) => {
    try {
      const fullLog = await apiService.get(`/audit-logs/${log.id}`);
      setSelectedLog(fullLog);
    } catch {
      setSelectedLog(log);
    }
    setDrawerOpen(true);
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      "Date/Time (UAE)",
      "User",
      "Email",
      "Category",
      "Action",
      "Entity",
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
      log.entityName || "-",
      log.description || "-",
      log.status,
      log.ipAddress || "-",
    ]);

    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
      "\n"
    );

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
    return toUAETime(dateString, { format: "datetime" });
  };

  const getCategoryBadge = (category) => {
    const colorClass = CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    return colorClass;
  };

  const filteredLogs = logs.filter((log) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      log.username?.toLowerCase().includes(search) ||
      log.userEmail?.toLowerCase().includes(search) ||
      log.description?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search) ||
      log.entityName?.toLowerCase().includes(search)
    );
  });

  const hasActiveFilters =
    filters.category || filters.status || filters.startDate || filters.endDate || filters.search || filters.userId;

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className={isDarkMode ? "text-blue-400" : "text-blue-600"} size={32} />
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Audit Trail</h1>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Track all user activities and system changes
                </p>
              </div>
            </div>
            <button
              type="button"
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
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Logs</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{totalLogs}</p>
                </div>
                <Activity className={isDarkMode ? "text-blue-400" : "text-blue-600"} size={32} />
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Failed Actions</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stats.categoryStats?.reduce((sum, cat) => sum + parseInt(cat.failedCount || 0, 10), 0) || 0}
                  </p>
                </div>
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Active Categories</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stats.categoryStats?.length || 0}
                  </p>
                </div>
                <Filter className={isDarkMode ? "text-green-400" : "text-green-600"} size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow`}>
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Filters</h2>
            {hasActiveFilters && (
              <button
                type="button"
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            {/* Search */}
            <div className="space-y-0.5">
              <label
                htmlFor="audit-search"
                className={`block text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
              >
                Search
              </label>
              <input
                id="audit-search"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="User, action, entity..."
                className={`w-full h-[38px] px-3 text-sm rounded-md border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Category */}
            <FormSelect
              label="Category"
              value={filters.category || "none"}
              onValueChange={(value) => handleFilterChange("category", value === "none" ? "" : value)}
              showValidation={false}
            >
              <SelectItem value="none">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </FormSelect>

            {/* User Filter */}
            <FormSelect
              label="User"
              value={filters.userId || "none"}
              onValueChange={(value) => handleFilterChange("userId", value === "none" ? "" : value)}
              showValidation={false}
            >
              <SelectItem value="none">All Users</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </FormSelect>

            {/* Start Date */}
            <div className="space-y-0.5">
              <label
                htmlFor="audit-start-date"
                className={`block text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
              >
                Start Date
              </label>
              <input
                id="audit-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className={`w-full h-[38px] px-3 text-sm rounded-md border ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* End Date */}
            <div className="space-y-0.5">
              <label
                htmlFor="audit-end-date"
                className={`block text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
              >
                End Date
              </label>
              <input
                id="audit-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className={`w-full h-[38px] px-3 text-sm rounded-md border ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* Status */}
            <FormSelect
              label="Status"
              value={filters.status || "none"}
              onValueChange={(value) => handleFilterChange("status", value === "none" ? "" : value)}
              showValidation={false}
            >
              <SelectItem value="none">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </FormSelect>
          </div>
        </div>

        {/* Logs Table */}
        <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
              <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{error}</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} size={48} />
              <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      {["Date/Time", "User", "Category", "Action", "Entity", "Description", "Status"].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(log)}
                        onKeyDown={(e) => e.key === "Enter" && handleRowClick(log)}
                        className={`cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"} transition-colors`}
                      >
                        <td
                          className={`px-4 py-3 text-sm whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {formatDate(log.createdAt)}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                          <div className="flex items-center gap-2">
                            <User size={16} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                            <div>
                              <div className="font-medium">{log.username || "-"}</div>
                              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                {log.userEmail || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(log.category)}`}
                          >
                            {log.category?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {log.action}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {log.entityName || "-"}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm max-w-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
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
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                      Showing page {currentPage} of {totalPages} ({totalLogs} total logs)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Detail Drawer */}
      <AuditDetailDrawer log={selectedLog} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default AuditLogs;
