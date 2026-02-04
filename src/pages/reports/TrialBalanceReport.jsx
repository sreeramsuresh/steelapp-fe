/**
 * Trial Balance Report
 * Auditor-required financial report showing debit/credit balances by account
 * Validates that Total Debit = Total Credit
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import financialReportsService from "../../services/financialReportsService";

export default function TrialBalanceReport() {
  const { user: _user } = useAuth();
  const [periodId, setPeriodId] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [includeZeroBalances, setIncludeZeroBalances] = useState(false);

  // Fetch periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        // TODO: Replace with actual API call to get accounting periods
        setPeriods([
          { id: 1, label: "January 2025", year: 2025, month: 1 },
          { id: 2, label: "December 2024", year: 2024, month: 12 },
          { id: 3, label: "November 2024", year: 2024, month: 11 },
        ]);
      } catch (err) {
        console.error("Error fetching periods:", err);
      }
    };

    fetchPeriods();
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
    // Navigate to General Ledger for this account
    window.location.href = `/reports/general-ledger/${accountCode}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trial Balance Report</h1>
        <p className="text-gray-600 mt-2">Verify that Total Debits = Total Credits for audit purposes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period Selector */}
          <div>
            <label htmlFor="trial-balance-period" className="block text-sm font-medium text-gray-700 mb-2">
              Accounting Period
            </label>
            <select
              id="trial-balance-period"
              value={periodId || ""}
              onChange={(e) => setPeriodId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <span className="ml-2 text-sm text-gray-700">Include Zero Balances</span>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Trial Balance Status Badge */}
      {data && (
        <div
          className={`rounded-lg p-4 ${
            data.totals.balanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold text-lg ${data.totals.balanced ? "text-green-800" : "text-red-800"}`}>
                {data.totals.balanced ? "✓ Trial Balance is Balanced" : "✗ Trial Balance is NOT Balanced"}
              </h3>
              <p className={`text-sm mt-1 ${data.totals.balanced ? "text-green-700" : "text-red-700"}`}>
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
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.accounts.map((account, idx) => (
                <tr key={account.id || account.name || `account-${idx}`} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{account.account_code}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{account.account_name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{account.account_category}</td>
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
              <tr className="bg-gray-100 font-bold">
                <td colSpan="3" className="px-6 py-3 text-sm">
                  TOTALS
                </td>
                <td className="px-6 py-3 text-sm text-right font-mono">
                  {financialReportsService.formatCurrency(data.totals.debit)}
                </td>
                <td className="px-6 py-3 text-sm text-right font-mono">
                  {financialReportsService.formatCurrency(data.totals.credit)}
                </td>
                <td className="px-6 py-3 text-sm text-center">
                  <span className={`font-bold ${data.totals.balanced ? "text-green-700" : "text-red-700"}`}>
                    {data.totals.balanced ? "✓" : "✗"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && !error && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600">Select an accounting period and click &quot;Generate Report&quot;</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600 animate-pulse">Generating Trial Balance...</p>
        </div>
      )}
    </div>
  );
}
