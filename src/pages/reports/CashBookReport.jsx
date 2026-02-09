import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import bankReconciliationService from "../../services/bankReconciliationService";

export default function CashBookReport() {
  const { user: _user } = useAuth();
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    cashAccountCode: "1100",
    page: 1,
    limit: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Theme classes
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textLabel = isDarkMode ? "text-gray-300" : "text-gray-700";
  const inputCls = isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300";
  const theadBg = isDarkMode ? "bg-gray-700" : "bg-gray-50";
  const rowBorder = isDarkMode ? "border-gray-700" : "border-b";
  const hoverRow = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const paginationBorder = isDarkMode ? "border-gray-700" : "border-t";
  const paginationBtn = isDarkMode
    ? "border-gray-600 text-gray-300 disabled:opacity-50"
    : "border rounded disabled:opacity-50";

  const fetchData = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cashBookResult, summaryResult] = await Promise.all([
        bankReconciliationService.getCashBook(filters.startDate, filters.endDate, {
          cashAccountCode: filters.cashAccountCode,
          page: filters.page,
          limit: filters.limit,
        }),
        bankReconciliationService.getCashBookSummary(filters.startDate, filters.endDate, filters.cashAccountCode),
      ]);
      setData(cashBookResult);
      setSummary(summaryResult);
    } catch (err) {
      setError(err.message || "Failed to fetch cash book");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${textPrimary}`}>Cash Book</h1>

      {/* Filters */}
      <div className={`${cardBg} p-4 rounded-lg shadow mb-6`}>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label htmlFor="cash-account" className={`block text-sm font-medium ${textLabel} mb-1`}>
              Cash Account
            </label>
            <select
              id="cash-account"
              value={filters.cashAccountCode}
              onChange={(e) => setFilters({ ...filters, cashAccountCode: e.target.value })}
              className={`w-full border rounded px-3 py-2 text-sm ${inputCls}`}
            >
              <option value="1100">1100 - Cash on Hand</option>
              <option value="1110">1110 - Cash in Transit</option>
            </select>
          </div>
          <div>
            <label htmlFor="cash-start-date" className={`block text-sm font-medium ${textLabel} mb-1`}>
              Start Date
            </label>
            <input
              id="cash-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className={`w-full border rounded px-3 py-2 ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="cash-end-date" className={`block text-sm font-medium ${textLabel} mb-1`}>
              End Date
            </label>
            <input
              id="cash-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className={`w-full border rounded px-3 py-2 ${inputCls}`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2 text-sm"
            >
              {loading ? "Loading..." : "Generate"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 text-sm"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`${isDarkMode ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border border-red-200 text-red-700"} px-4 py-3 rounded mb-6`}
        >
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Total Receipts</div>
            <div className="text-xl font-bold text-green-600">
              {bankReconciliationService.formatCurrency(summary.totals.total_receipts)}
            </div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Total Payments</div>
            <div className="text-xl font-bold text-red-600">
              {bankReconciliationService.formatCurrency(summary.totals.total_payments)}
            </div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Net Cash Flow</div>
            <div
              className={`text-xl font-bold ${summary.totals.net_cash_flow >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {bankReconciliationService.formatCurrency(summary.totals.net_cash_flow)}
            </div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Total Days</div>
            <div className={`text-xl font-bold ${textPrimary}`}>{summary.totals.total_days}</div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Transactions</div>
            <div className={`text-xl font-bold ${textPrimary}`}>{data?.pagination?.total || 0}</div>
          </div>
        </div>
      )}

      {/* Daily Summary */}
      {summary?.summary && summary.summary.length > 0 && (
        <div className={`${cardBg} rounded-lg shadow mb-6 overflow-x-auto`}>
          <table className="min-w-full">
            <thead>
              <tr className={`${theadBg} ${rowBorder}`}>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Date</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Receipts</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Payments</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Net Flow</th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${textPrimary}`}>Receipt #</th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${textPrimary}`}>Payment #</th>
              </tr>
            </thead>
            <tbody>
              {summary.summary.map((day, idx) => (
                <tr key={day.id || day.name || `day-${idx}`} className={`${rowBorder} ${hoverRow}`}>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    {bankReconciliationService.formatDate(day.entry_date)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-green-600">
                    {bankReconciliationService.formatCurrency(day.total_receipts)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-600">
                    {bankReconciliationService.formatCurrency(day.total_payments)}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(day.net_cash_flow)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span
                      className={`${isDarkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"} px-2 py-1 rounded text-xs`}
                    >
                      {day.receipt_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span
                      className={`${isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"} px-2 py-1 rounded text-xs`}
                    >
                      {day.payment_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions */}
      {loading ? (
        <div className={`${cardBg} p-8 rounded-lg shadow text-center`}>
          <div className={`${textSecondary} animate-pulse`}>Loading cash book...</div>
        </div>
      ) : data?.entries && data.entries.length > 0 ? (
        <div className={`${cardBg} rounded-lg shadow overflow-x-auto`}>
          <table className="min-w-full">
            <thead>
              <tr className={`${theadBg} ${rowBorder}`}>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Date</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Journal #</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Type</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Contra Account</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Description</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Receipt</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Payment</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>By</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, idx) => (
                <tr key={entry.id || entry.name || `entry-${idx}`} className={`${rowBorder} ${hoverRow} text-sm`}>
                  <td className={`px-4 py-3 ${textPrimary}`}>
                    {bankReconciliationService.formatDate(entry.entry_date)}
                  </td>
                  <td className={`px-4 py-3 font-medium ${textPrimary}`}>{entry.journal_number}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        entry.transaction_type === "RECEIPT"
                          ? isDarkMode
                            ? "bg-green-900 text-green-200"
                            : "bg-green-100 text-green-800"
                          : isDarkMode
                            ? "bg-red-900 text-red-200"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.transaction_type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${textPrimary}`}>{entry.contra_account}</td>
                  <td className={`px-4 py-3 ${textSecondary}`}>{entry.description}</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {entry.receipt_amount > 0 ? bankReconciliationService.formatCurrency(entry.receipt_amount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {entry.payment_amount > 0 ? bankReconciliationService.formatCurrency(entry.payment_amount) : "-"}
                  </td>
                  <td className={`px-4 py-3 ${textSecondary}`}>{entry.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data.pagination && data.pagination.pages > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 ${paginationBorder}`}>
              <div className={`text-sm ${textSecondary}`}>
                Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
              </div>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      page: Math.max(1, filters.page - 1),
                    })
                  }
                  disabled={filters.page === 1}
                  className={`px-3 py-1 border rounded ${paginationBtn}`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= data.pagination.pages}
                  className={`px-3 py-1 border rounded ${paginationBtn}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
