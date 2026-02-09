import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import bankReconciliationService from "../../services/bankReconciliationService";

export default function BankLedgerReport() {
  const { user: _user } = useAuth();
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    accountCode: "1100", // Default to Cash
    startDate: null,
    endDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Theme classes
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textLabel = isDarkMode ? "text-gray-300" : "text-gray-700";
  const inputCls = isDarkMode
    ? "bg-gray-700 border-gray-600 text-gray-100"
    : "bg-white border-gray-300";
  const theadBg = isDarkMode ? "bg-gray-700" : "bg-gray-50";
  const rowBorder = isDarkMode ? "border-gray-700" : "border-b";
  const hoverRow = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const badgeBg = isDarkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800";

  const fetchData = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await bankReconciliationService.getBankLedger(
        filters.accountCode,
        filters.startDate,
        filters.endDate,
      );
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch bank ledger");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${textPrimary}`}>Bank Ledger</h1>

      {/* Filters */}
      <div className={`${cardBg} p-4 rounded-lg shadow mb-6`}>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label htmlFor="bank-account" className={`block text-sm font-medium ${textLabel} mb-1`}>
              Bank Account
            </label>
            <select
              id="bank-account"
              value={filters.accountCode}
              onChange={(e) => setFilters({ ...filters, accountCode: e.target.value })}
              className={`w-full border rounded px-3 py-2 ${inputCls}`}
            >
              <option value="1100">1100 - Cash on Hand</option>
              <option value="1110">1110 - Cash in Transit</option>
              <option value="1150">1150 - Bank Account</option>
              <option value="1151">1151 - Bank Account 2</option>
            </select>
          </div>
          <div>
            <label htmlFor="start-date" className={`block text-sm font-medium ${textLabel} mb-1`}>
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className={`w-full border rounded px-3 py-2 ${inputCls}`}
            />
          </div>
          <div>
            <label htmlFor="end-date" className={`block text-sm font-medium ${textLabel} mb-1`}>
              End Date
            </label>
            <input
              id="end-date"
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2"
            >
              {loading ? "Loading..." : "Generate"}
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

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Opening Balance</div>
            <div className="text-2xl font-bold text-blue-600">
              {bankReconciliationService.formatCurrency(data.opening_balance)}
            </div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Total Debits</div>
            <div className="text-2xl font-bold text-green-600">
              {bankReconciliationService.formatCurrency(data.total_debits)}
            </div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Total Credits</div>
            <div className="text-2xl font-bold text-red-600">
              {bankReconciliationService.formatCurrency(data.total_credits)}
            </div>
          </div>
          <div className={`${cardBg} p-4 rounded-lg shadow`}>
            <div className={`${textSecondary} text-sm`}>Closing Balance</div>
            <div className="text-2xl font-bold text-blue-600">
              {bankReconciliationService.formatCurrency(data.closing_balance)}
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {loading ? (
        <div className={`${cardBg} p-8 rounded-lg shadow text-center`}>
          <div className={`${textSecondary} animate-pulse`}>Loading bank ledger...</div>
        </div>
      ) : data ? (
        <div className={`${cardBg} rounded-lg shadow overflow-x-auto`}>
          <table className="min-w-full">
            <thead>
              <tr className={`${theadBg} ${rowBorder}`}>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Date</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Journal #</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Batch #</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Narration</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Debit</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Credit</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Balance</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Module</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((txn, idx) => (
                <tr key={txn.id || txn.name || `txn-${idx}`} className={`${rowBorder} ${hoverRow}`}>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    {bankReconciliationService.formatDate(txn.entry_date)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>{txn.journal_number}</td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>{txn.batch_number}</td>
                  <td className={`px-4 py-3 text-sm ${textSecondary}`}>{txn.narration}</td>
                  <td className="px-4 py-3 text-right text-sm text-green-600">
                    {txn.debit_amount > 0 ? bankReconciliationService.formatCurrency(txn.debit_amount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-600">
                    {txn.credit_amount > 0 ? bankReconciliationService.formatCurrency(txn.credit_amount) : "-"}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(txn.running_balance)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block ${badgeBg} px-2 py-1 rounded text-xs`}>{txn.source_module}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
