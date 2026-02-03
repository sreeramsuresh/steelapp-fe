/**
 * Customer Invoices Tab
 *
 * Displays all invoices for a specific customer with comprehensive filtering and analysis:
 * - Summary Cards: Total count, total amount, outstanding balance, overdue count
 * - Filters: Status (all/open/paid/partially-paid/overdue), Date range (all/30/60/90 days)
 * - Sortable Columns: Invoice date, amount, due date, status
 * - Pagination: 20 invoices per page
 * - Status Badges: Color-coded visual status (Paid, Open, Partially Paid, Overdue)
 *
 * Performance Features:
 * - 5-minute data caching to reduce API calls
 * - Manual refresh button to force cache clear
 * - Loading states with skeleton UI
 * - Error handling with retry capability
 *
 * API Endpoint: GET /api/invoices?customerId={customerId}
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.customerId - Customer ID to fetch invoices for
 * @returns {JSX.Element} Invoice list with filters and summary
 */

import { AlertCircle, AlertTriangle, Clock, DollarSign, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiClient } from "../../../services/api";
import { formatCurrency, formatDate } from "../../../utils/invoiceUtils";

export default function CustomerInvoicesTab({ customerId }) {
  const { isDarkMode } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  // Caching state
  const [cachedData, setCachedData] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cachedData || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  }, [cachedData, cacheTimestamp, CACHE_DURATION]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/invoices?customerId=${customerId}`);
      const invoiceData = response.invoices || [];
      setInvoices(invoiceData);
      setFilteredInvoices(invoiceData);

      // Update cache
      setCachedData(invoiceData);
      setCacheTimestamp(Date.now());
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Manual refresh - clears cache and refetches
  const handleRefresh = () => {
    setCachedData(null);
    setCacheTimestamp(null);
    fetchInvoices();
  };

  useEffect(() => {
    if (customerId) {
      // Use cache if valid
      if (isCacheValid()) {
        setInvoices(cachedData);
        setFilteredInvoices(cachedData);
        setLoading(false);
        return;
      }

      // Otherwise fetch fresh data
      fetchInvoices();
    }
  }, [customerId, cachedData, cacheTimestamp, isCacheValid, fetchInvoices]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...invoices];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status?.toLowerCase() === statusFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateRangeFilter !== "all") {
      const daysBack = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((inv) => new Date(inv.date) >= cutoffDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      if (sortField === "date") {
        aVal = new Date(a.date);
        bVal = new Date(b.date);
      } else if (sortField === "dueDate") {
        aVal = new Date(a.dueDate);
        bVal = new Date(b.dueDate);
      } else if (sortField === "totalAmount") {
        aVal = parseFloat(a.totalAmount) || 0;
        bVal = parseFloat(b.totalAmount) || 0;
      } else {
        return 0;
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [invoices, statusFilter, dateRangeFilter, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = {
    totalCount: filteredInvoices.length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0),
    totalOutstanding: filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.outstandingAmount) || 0), 0),
    overdueCount: filteredInvoices.filter((inv) => {
      if (inv.status?.toLowerCase() === "paid") return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < new Date();
    }).length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Determine invoice status with overdue logic
  const getInvoiceStatus = (invoice) => {
    const status = invoice.status?.toLowerCase() || "open";
    if (status === "paid") return "paid";

    const outstanding = parseFloat(invoice.outstandingAmount) || 0;
    const total = parseFloat(invoice.totalAmount) || 0;

    if (outstanding === 0) return "paid";
    if (outstanding < total && outstanding > 0) return "partially-paid";

    // Check if overdue
    const dueDate = new Date(invoice.dueDate);
    const now = new Date();
    if (dueDate < now) return "overdue";

    return "open";
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      paid: {
        bg: isDarkMode ? "bg-green-900/30" : "bg-green-100",
        text: isDarkMode ? "text-green-400" : "text-green-700",
        label: "Paid",
      },
      open: {
        bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-100",
        text: isDarkMode ? "text-blue-400" : "text-blue-700",
        label: "Open",
      },
      "partially-paid": {
        bg: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100",
        text: isDarkMode ? "text-yellow-400" : "text-yellow-700",
        label: "Partially Paid",
      },
      overdue: {
        bg: isDarkMode ? "bg-red-900/30" : "bg-red-100",
        text: isDarkMode ? "text-red-400" : "text-red-700",
        label: "Overdue",
      },
    };

    const config = statusConfig[status] || statusConfig["open"];

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
    );
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Styling
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const primaryText = isDarkMode ? "text-gray-100" : "text-gray-900";
  const secondaryText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`p-6 rounded-lg ${isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"} border`}
      >
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-red-500" />
          <p className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>Error Loading Invoices</p>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>{error}</p>
        <button
          onClick={fetchInvoices}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${primaryText}`}>Customer Invoices</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
          }`}
          title="Refresh invoices data"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Invoices</p>
            <FileText size={18} className="text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{summaryStats.totalCount}</p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Amount</p>
            <DollarSign size={18} className="text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{formatCurrency(summaryStats.totalAmount)}</p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Outstanding</p>
            <Clock size={18} className="text-yellow-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{formatCurrency(summaryStats.totalOutstanding)}</p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Overdue Count</p>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{summaryStats.overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="status-filter" className={`block text-sm font-medium ${secondaryText} mb-2`}>
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="paid">Paid</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="date-range-filter" className={`block text-sm font-medium ${secondaryText} mb-2`}>
              Date Range
            </label>
            <select
              id="date-range-filter"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider cursor-pointer ${hoverBg}`}
                  onClick={() => handleSort("invoiceNumber")}
                >
                  Invoice Number
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider cursor-pointer ${hoverBg}`}
                  onClick={() => handleSort("date")}
                >
                  Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider cursor-pointer ${hoverBg}`}
                  onClick={() => handleSort("dueDate")}
                >
                  Due Date {sortField === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider cursor-pointer ${hoverBg}`}
                  onClick={() => handleSort("totalAmount")}
                >
                  Total Amount {sortField === "totalAmount" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Outstanding
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-4 py-8 text-center ${secondaryText}`}>
                    No invoices found
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice);
                  return (
                    <tr key={invoice.id} className={hoverBg}>
                      <td className={`px-4 py-3 whitespace-nowrap ${primaryText} font-medium`}>
                        {invoice.invoiceNumber}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap ${secondaryText}`}>{formatDate(invoice.date)}</td>
                      <td className={`px-4 py-3 whitespace-nowrap ${secondaryText}`}>{formatDate(invoice.dueDate)}</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right ${primaryText}`}>
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right ${primaryText}`}>
                        {formatCurrency(invoice.outstandingAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-4 py-3 border-t ${borderColor} flex items-center justify-between`}>
            <div className={`text-sm ${secondaryText}`}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${borderColor} ${primaryText} disabled:opacity-50 disabled:cursor-not-allowed ${hoverBg}`}
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md border ${borderColor} ${
                        currentPage === pageNum ? "bg-blue-600 text-white border-blue-600" : `${primaryText} ${hoverBg}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border ${borderColor} ${primaryText} disabled:opacity-50 disabled:cursor-not-allowed ${hoverBg}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
