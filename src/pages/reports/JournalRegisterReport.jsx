/**
 * Journal Register Report
 * Auditor-required financial report showing all journal entries
 * Validates that Debit = Credit and supports filtering by source module
 */

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import financialReportsService from "../../services/financialReportsService";
import { notificationService } from "../../services/notificationService";

export default function JournalRegisterReport() {
  const { user: _user } = useAuth();
  const { isDarkMode } = useTheme();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceModule, setSourceModule] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Theme classes
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textLabel = isDarkMode ? "text-gray-300" : "text-gray-700";
  const inputCls = isDarkMode
    ? "bg-gray-700 border-gray-600 text-gray-100"
    : "bg-white border-gray-300";
  const theadBg = isDarkMode ? "bg-gray-700" : "bg-gray-50";
  const hoverRow = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const badgeBg = isDarkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800";
  const emptyBg = isDarkMode
    ? "bg-gray-800 border-gray-600"
    : "bg-gray-50 border-gray-300";
  const paginationBtn = isDarkMode
    ? "border-gray-600 text-gray-300 hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-800"
    : "border-gray-300 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50";

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before end date");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const result = await financialReportsService.getJournalRegister({
        startDate,
        endDate,
        sourceModule: sourceModule || null,
        page: 1,
        limit: 100,
      });

      if (!result.success) {
        setError(result.error || "Failed to generate report");
        return;
      }

      setData(result);
    } catch (err) {
      console.error("Error generating Journal Register:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage) => {
    setLoading(true);
    try {
      const result = await financialReportsService.getJournalRegister({
        startDate,
        endDate,
        sourceModule: sourceModule || null,
        page: newPage,
        limit: 100,
      });

      if (result.success) {
        setData(result);
        setCurrentPage(newPage);
      }
    } catch (err) {
      console.error("Error fetching page:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    notificationService.warning("Excel export will be available in the next phase");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${textPrimary}`}>Journal Register</h1>
        <p className={`${textSecondary} mt-2`}>Complete record of all journal entries posted during the selected period</p>
      </div>

      {/* Filters */}
      <div className={`${cardBg} rounded-lg shadow p-6 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <label htmlFor="journal-start-date" className={`block text-sm font-medium ${textLabel} mb-2`}>
              Start Date
            </label>
            <input
              id="journal-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="journal-end-date" className={`block text-sm font-medium ${textLabel} mb-2`}>
              End Date
            </label>
            <input
              id="journal-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
            />
          </div>

          {/* Source Module Filter */}
          <div>
            <label htmlFor="journal-source-module" className={`block text-sm font-medium ${textLabel} mb-2`}>
              Source Module
            </label>
            <select
              id="journal-source-module"
              value={sourceModule}
              onChange={(e) => setSourceModule(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
            >
              <option value="">All Modules</option>
              <option value="AR">Accounts Receivable</option>
              <option value="AP">Accounts Payable</option>
              <option value="INVENTORY">Inventory</option>
              <option value="VAT">VAT</option>
              <option value="MANUAL">Manual Entry</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`${isDarkMode ? "bg-red-900/30 border border-red-700" : "bg-red-50 border border-red-200"} rounded-lg p-4`}
        >
          <p className={isDarkMode ? "text-red-300" : "text-red-800"}>{error}</p>
        </div>
      )}

      {/* Report Totals */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${cardBg} rounded-lg shadow p-4`}>
            <p className={`${textSecondary} text-sm`}>Total Debit</p>
            <p className={`text-2xl font-bold ${textPrimary} mt-2`}>
              {financialReportsService.formatCurrency(data.totals.debit)}
            </p>
          </div>
          <div className={`${cardBg} rounded-lg shadow p-4`}>
            <p className={`${textSecondary} text-sm`}>Total Credit</p>
            <p className={`text-2xl font-bold ${textPrimary} mt-2`}>
              {financialReportsService.formatCurrency(data.totals.credit)}
            </p>
          </div>
          <div
            className={`rounded-lg shadow p-4 ${
              data.totals.variance < 0.01
                ? isDarkMode
                  ? "bg-green-900/30 border border-green-700"
                  : "bg-green-50 border border-green-200"
                : isDarkMode
                  ? "bg-red-900/30 border border-red-700"
                  : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm ${
                data.totals.variance < 0.01
                  ? isDarkMode
                    ? "text-green-300"
                    : "text-green-700"
                  : isDarkMode
                    ? "text-red-300"
                    : "text-red-700"
              }`}
            >
              {data.totals.variance < 0.01 ? "Status: Balanced" : "Status: Unbalanced"}
            </p>
            <p
              className={`text-2xl font-bold mt-2 ${
                data.totals.variance < 0.01
                  ? isDarkMode
                    ? "text-green-200"
                    : "text-green-900"
                  : isDarkMode
                    ? "text-red-200"
                    : "text-red-900"
              }`}
            >
              Variance: {financialReportsService.formatCurrency(data.totals.variance)}
            </p>
          </div>
        </div>
      )}

      {/* Journal Register Table */}
      {data && (
        <div className={`${cardBg} rounded-lg shadow overflow-x-auto`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={theadBg}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>Date</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Journal #
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Account
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Debit
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Credit
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Narration
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Module
                </th>
              </tr>
            </thead>
            <tbody className={`${cardBg} divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {data.entries.map((entry, idx) => (
                <tr key={entry.id || entry.name || `entry-${idx}`} className={hoverRow}>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    {financialReportsService.formatDate(entry.entry_date)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{entry.journal_number}</td>
                  <td className={`px-4 py-3 text-sm ${textLabel}`}>
                    {entry.account_code} - {entry.account_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {entry.debit_amount > 0 ? financialReportsService.formatCurrency(entry.debit_amount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {entry.credit_amount > 0 ? financialReportsService.formatCurrency(entry.credit_amount) : "-"}
                  </td>
                  <td className={`px-4 py-3 text-sm ${textSecondary}`}>{entry.narration}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`${badgeBg} px-2 py-1 rounded text-xs font-medium`}>{entry.source_module}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && (
        <div className={`${cardBg} rounded-lg shadow p-4 flex items-center justify-between`}>
          <div className={`text-sm ${textSecondary}`}>
            Showing {(currentPage - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(currentPage * data.pagination.limit, data.pagination.total)} of {data.pagination.total} entries
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className={`px-4 py-2 border rounded-md text-sm font-medium ${paginationBtn}`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 text-sm ${textLabel}`}>
              Page {currentPage} of {data.pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= data.pagination.totalPages || loading}
              className={`px-4 py-2 border rounded-md text-sm font-medium ${paginationBtn}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Button */}
      {data && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExportToExcel}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
          >
            Export to Excel
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && !error && (
        <div className={`${emptyBg} rounded-lg border-2 border-dashed p-12 text-center`}>
          <p className={textSecondary}>Select date range and click &quot;Generate&quot;</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={`${emptyBg} rounded-lg border-2 border-dashed p-12 text-center`}>
          <p className={`${textSecondary} animate-pulse`}>Generating Journal Register...</p>
        </div>
      )}
    </div>
  );
}
