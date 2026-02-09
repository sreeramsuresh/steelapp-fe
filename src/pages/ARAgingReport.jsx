import { ArrowUpDown, Clock, Download, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { apiClient } from "../services/api";
import { formatCurrency } from "../utils/invoiceUtils";

/**
 * Safe number formatting helper.
 * Handles strings, null, undefined, objects - always returns a formatted string.
 */
const safeToFixed = (value, decimals = 2) => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? "0" : num.toFixed(decimals);
};

/**
 * AR Aging Report Page
 *
 * Full-page report showing AR aging buckets for all customers.
 * Features:
 * - Search by customer name or code
 * - Column sorting (by AR amount, DSO, etc.)
 * - Pagination
 * - Aggregate totals row
 * - Click row to navigate to customer AR detail
 */
export default function ARAgingReport() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [pageInfo, setPageInfo] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("totalAr");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch data
  const fetchARAgingData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await apiClient.get("/reports/ar-aging", params);

      if (response) {
        setData(response.rows || []);
        setTotals(response.totals || null);
        setPageInfo(
          response.pageInfo || {
            total: 0,
            page: 1,
            limit: pageSize,
            totalPages: 0,
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch AR aging data:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchARAgingData();
  }, [fetchARAgingData]);

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  };

  // Handle row click - navigate to customer detail with AR tab
  const handleRowClick = (customerId) => {
    navigate(`/app/customers/${customerId}?tab=ar-aging`);
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Sort data client-side (or pass to API if backend supports it)
  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Credit grade badge color
  const getGradeColor = (grade) => {
    const colors = {
      A: "bg-green-100 text-green-800 border-green-300",
      B: "bg-blue-100 text-blue-800 border-blue-300",
      C: "bg-yellow-100 text-yellow-800 border-yellow-300",
      D: "bg-orange-100 text-orange-800 border-orange-300",
      E: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[grade] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600`}>
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                AR Aging Report
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Accounts Receivable aging analysis by customer
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchARAgingData}
              disabled={loading}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              onClick={() => {
                // TODO: Implement export functionality
              }}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total AR</p>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(totals.totalAr)}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Overdue</p>
              <p className={`text-2xl font-bold text-red-500`}>{formatCurrency(totals.totalOverdue)}</p>
            </div>

            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Overdue %</p>
              <p
                className={`text-2xl font-bold ${parseFloat(totals.overduePercentage) > 30 ? "text-red-500" : isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {safeToFixed(totals.overduePercentage, 1)}%
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Avg DSO</p>
              <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {safeToFixed(totals.averageDso, 0)} days
              </p>
            </div>
          </div>
        )}

        {/* Guidance Section */}
        <div
          className={`p-4 rounded-lg mb-6 border ${isDarkMode ? "bg-blue-900 border-blue-700" : "bg-blue-50 border-blue-200"}`}
        >
          <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>
            Understanding AR Aging
          </h3>
          <ul className={`text-sm space-y-1 list-disc list-inside ${isDarkMode ? "text-blue-200" : "text-blue-800"}`}>
            <li>
              <strong>Aging Buckets:</strong> Current (0 days), 1-30, 31-60, 61-90, and 90+ days overdue
            </li>
            <li>
              <strong>DSO (Days Sales Outstanding):</strong> Average number of days to collect payment after sale
            </li>
            <li>
              <strong>Credit Grade:</strong> A (Excellent), B (Good), C (Fair), D (Poor), E (At Risk)
            </li>
            <li>
              <strong>Overdue %:</strong> Percentage of AR that is past due (90+ days bucket)
            </li>
          </ul>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={20}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder="Search by customer name or code..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-md border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-750" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("customerCode")}
                    className="flex items-center gap-1 hover:text-blue-500"
                  >
                    Code <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("customerName")}
                    className="flex items-center gap-1 hover:text-blue-500"
                  >
                    Customer <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  Current
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  1-30 Days
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  31-60 Days
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  61-90 Days
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  90+ Days
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("totalAr")}
                    className="flex items-center gap-1 hover:text-blue-500 ml-auto"
                  >
                    Total AR <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  className={`px-4 py-3 text-center text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("dsoDays")}
                    className="flex items-center gap-1 hover:text-blue-500 mx-auto"
                  >
                    DSO <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  className={`px-4 py-3 text-center text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider`}
                >
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw size={24} className="animate-spin text-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className={`px-4 py-8 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    No AR aging data found
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => (
                  <tr
                    key={row.customerId}
                    onClick={() => handleRowClick(row.customerId)}
                    className={`cursor-pointer transition-colors ${
                      isDarkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {row.customerCode}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {row.customerName}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {formatCurrency(row.agingCurrent)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${row.aging1To30 > 0 ? "text-yellow-600" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {formatCurrency(row.aging1To30)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${row.aging31To60 > 0 ? "text-orange-600" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {formatCurrency(row.aging31To60)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${row.aging61To90 > 0 ? "text-red-500" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {formatCurrency(row.aging61To90)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${row.aging90Plus > 0 ? "text-red-700 font-bold" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {formatCurrency(row.aging90Plus)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatCurrency(row.totalAr)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {row.dsoDays} d
                    </td>
                    <td className={`px-4 py-3 text-center`}>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getGradeColor(row.creditGrade)}`}
                      >
                        {row.creditGrade || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))
              )}

              {/* Totals Row */}
              {totals && sortedData.length > 0 && (
                <tr className={`font-bold ${isDarkMode ? "bg-gray-750" : "bg-gray-100"}`}>
                  <td colSpan={2} className={`px-4 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    TOTAL ({totals.totalCustomers} customers)
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(totals.agingCurrent)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(totals.aging1To30)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(totals.aging31To60)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(totals.aging61To90)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right text-red-600`}>{formatCurrency(totals.aging90Plus)}</td>
                  <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(totals.totalAr)}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageInfo.totalPages > 1 && (
          <div
            className={`px-4 py-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}
          >
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, pageInfo.total)} of {pageInfo.total}{" "}
              customers
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md text-sm ${
                  page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                Previous
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Page {page} of {pageInfo.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page === pageInfo.totalPages}
                className={`px-3 py-1 rounded-md text-sm ${
                  page === pageInfo.totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                }`}
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
