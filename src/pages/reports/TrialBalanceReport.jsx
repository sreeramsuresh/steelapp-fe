/**
 * Trial Balance Report
 * Auditor-required financial report showing debit/credit balances by account
 * Validates that Total Debit = Total Credit
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import financialReportsService from "../../services/financialReportsService";

export default function TrialBalanceReport() {
  const { user: _user } = useAuth();
  const { isDarkMode } = useTheme();
  const [periodId, setPeriodId] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [includeZeroBalances, setIncludeZeroBalances] = useState(false);

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
  const totalsBg = isDarkMode ? "bg-gray-700" : "bg-gray-100";
  const emptyBg = isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-300";

  // Generate dynamic period options based on current date
  useEffect(() => {
    const now = new Date();
    const generatedPeriods = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString("en-US", { month: "long", year: "numeric" });
      generatedPeriods.push({
        id: i + 1,
        label: monthName,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }
    setPeriods(generatedPeriods);
  }, []);

  const handleGenerateReport = async () => {
    if (!periodId) {
      setError("Please select an accounting period");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await financialReportsService.getTrialBalance(periodId, {
        includeZeroBalances,
      });

      if (!result.success) {
        setError(result.error || "Failed to generate report");
        return;
      }

      setData(result);
    } catch (err) {
      console.error("Error generating Trial Balance:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (accountCode) => {
    window.location.href = `/reports/general-ledger/${accountCode}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${textPrimary}`}>Trial Balance Report</h1>
        <p className={`${textSecondary} mt-2`}>Verify that Total Debits = Total Credits for audit purposes</p>
      </div>

      {/* Filters */}
      <div className={`${cardBg} rounded-lg shadow p-6 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period Selector */}
          <div>
            <label htmlFor="trial-balance-period" className={`block text-sm font-medium ${textLabel} mb-2`}>
              Accounting Period
            </label>
            <select
              id="trial-balance-period"
              value={periodId || ""}
              onChange={(e) => setPeriodId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
            >
              <option value="">Select Period...</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Include Zero Balances */}
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeZeroBalances}
                onChange={(e) => setIncludeZeroBalances(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className={`ml-2 text-sm ${textLabel}`}>Include Zero Balances</span>
            </label>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading || !periodId}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Generating..." : "Generate Report"}
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

      {/* Trial Balance Status Badge */}
      {data && (
        <div
          className={`rounded-lg p-4 ${
            data.totals.balanced
              ? isDarkMode
                ? "bg-green-900/30 border border-green-700"
                : "bg-green-50 border border-green-200"
              : isDarkMode
                ? "bg-red-900/30 border border-red-700"
                : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                className={`font-bold text-lg ${
                  data.totals.balanced
                    ? isDarkMode
                      ? "text-green-300"
                      : "text-green-800"
                    : isDarkMode
                      ? "text-red-300"
                      : "text-red-800"
                }`}
              >
                {data.totals.balanced ? "Trial Balance is Balanced" : "Trial Balance is NOT Balanced"}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  data.totals.balanced
                    ? isDarkMode
                      ? "text-green-400"
                      : "text-green-700"
                    : isDarkMode
                      ? "text-red-400"
                      : "text-red-700"
                }`}
              >
                Total Debit: {financialReportsService.formatCurrency(data.totals.debit)} | Total Credit:{" "}
                {financialReportsService.formatCurrency(data.totals.credit)} | Variance:{" "}
                {financialReportsService.formatCurrency(data.totals.variance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      {data && (
        <div className={`${cardBg} rounded-lg shadow overflow-x-auto`}>
          <table className={`min-w-full divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            <thead className={theadBg}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Account Code
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Account Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Debit
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Credit
                </th>
                <th className={`px-6 py-3 text-center text-xs font-medium ${textLabel} uppercase tracking-wider`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={`${cardBg} divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {data.accounts.map((account, idx) => (
                <tr
                  key={account.id || account.name || `account-${idx}`}
                  className={`${hoverRow} cursor-pointer`}
                >
                  <td className={`px-6 py-3 text-sm font-medium ${textPrimary}`}>{account.account_code}</td>
                  <td className={`px-6 py-3 text-sm ${textLabel}`}>{account.account_name}</td>
                  <td className={`px-6 py-3 text-sm ${textSecondary}`}>{account.account_category}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono">
                    {account.closing_debit > 0 ? financialReportsService.formatCurrency(account.closing_debit) : "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-mono">
                    {account.closing_credit > 0 ? financialReportsService.formatCurrency(account.closing_credit) : "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-center">
                    <button
                      type="button"
                      onClick={() => handleDrillDown(account.account_code)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View GL
                    </button>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className={`${totalsBg} font-bold`}>
                <td colSpan="3" className={`px-6 py-3 text-sm ${textPrimary}`}>
                  TOTALS
                </td>
                <td className={`px-6 py-3 text-sm text-right font-mono ${textPrimary}`}>
                  {financialReportsService.formatCurrency(data.totals.debit)}
                </td>
                <td className={`px-6 py-3 text-sm text-right font-mono ${textPrimary}`}>
                  {financialReportsService.formatCurrency(data.totals.credit)}
                </td>
                <td className="px-6 py-3 text-sm text-center">
                  <span className={`font-bold ${data.totals.balanced ? "text-green-500" : "text-red-500"}`}>
                    {data.totals.balanced ? "Balanced" : "Unbalanced"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && !error && (
        <div className={`${emptyBg} rounded-lg border-2 border-dashed p-12 text-center`}>
          <p className={textSecondary}>Select an accounting period and click &quot;Generate Report&quot;</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={`${emptyBg} rounded-lg border-2 border-dashed p-12 text-center`}>
          <p className={`${textSecondary} animate-pulse`}>Generating Trial Balance...</p>
        </div>
      )}
    </div>
  );
}
