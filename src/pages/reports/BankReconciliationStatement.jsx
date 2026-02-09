import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import bankReconciliationService from "../../services/bankReconciliationService";

export default function BankReconciliationStatement() {
  const { user: _user } = useAuth();
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [statementId, setStatementId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Theme classes
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textLabel = isDarkMode ? "text-gray-300" : "text-gray-700";
  const inputCls = isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300";
  const stripeBg = isDarkMode ? "bg-gray-700" : "bg-gray-50";
  const borderColor = isDarkMode ? "border-gray-700" : "border-t";

  const fetchBRS = async () => {
    if (!statementId) {
      setError("Please select a statement");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await bankReconciliationService.getBankReconciliation(statementId);
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch bank reconciliation statement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${textPrimary}`}>Bank Reconciliation Statement</h1>

      {/* Statement Selector */}
      <div className={`${cardBg} p-4 rounded-lg shadow mb-6`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="statement-id" className={`block text-sm font-medium ${textLabel} mb-1`}>
              Select Statement
            </label>
            <input
              id="statement-id"
              type="number"
              value={statementId}
              onChange={(e) => setStatementId(e.target.value)}
              placeholder="Enter statement ID"
              className={`w-full border rounded px-3 py-2 ${inputCls}`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchBRS}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2"
            >
              {loading ? "Loading..." : "Load Statement"}
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

      {/* BRS Report */}
      {data && (
        <div className="space-y-6">
          {/* Reconciliation Status */}
          <div className={`${cardBg} p-6 rounded-lg shadow`}>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Bank Reconciliation Statement</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className={textSecondary}>Period:</span>
                    <span className={`ml-2 font-medium ${textPrimary}`}>
                      {bankReconciliationService.formatDate(data.statement_period_start)} to{" "}
                      {bankReconciliationService.formatDate(data.statement_period_end)}
                    </span>
                  </p>
                  <p>
                    <span className={textSecondary}>Status:</span>
                    <span className={`ml-2 font-medium ${data.is_balanced ? "text-green-500" : "text-red-500"}`}>
                      {data.is_balanced ? "Balanced" : "Unbalanced"}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Variance</h3>
                <div className={`text-4xl font-bold ${data.is_balanced ? "text-green-500" : "text-red-500"}`}>
                  {bankReconciliationService.formatCurrency(data.variance)}
                </div>
              </div>
            </div>

            {/* Reconciliation Steps */}
            <table className="w-full">
              <tbody>
                {data.reconciliation_steps.map((step, idx) => (
                  <tr key={step.id || step.name || `step-${idx}`} className={idx % 2 === 0 ? stripeBg : ""}>
                    <td className={`px-4 py-3 text-sm ${textPrimary} font-medium`}>{step.step}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={step.amount < 0 ? "text-red-500" : textPrimary}>
                        {bankReconciliationService.formatCurrency(Math.abs(step.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className={`${cardBg} p-6 rounded-lg shadow`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Bank Side</h3>
              <div className="space-y-4">
                <div>
                  <div className={`${textSecondary} text-sm`}>Opening Balance</div>
                  <div className={`text-xl font-bold ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(data.bank_opening_balance)}
                  </div>
                </div>
                <div>
                  <div className={`${textSecondary} text-sm`}>Closing Balance</div>
                  <div className={`text-xl font-bold ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(data.bank_closing_balance)}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${cardBg} p-6 rounded-lg shadow`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Book Side</h3>
              <div className="space-y-4">
                <div>
                  <div className={`${textSecondary} text-sm`}>GL Balance</div>
                  <div className={`text-xl font-bold ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(data.book_balance)}
                  </div>
                </div>
                <div>
                  <div className={`${textSecondary} text-sm`}>Reconciled Balance</div>
                  <div className={`text-xl font-bold ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(data.reconciled_balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="grid grid-cols-2 gap-6">
            <div className={`${cardBg} p-6 rounded-lg shadow`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Adjustments</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className={textSecondary}>Unpresented Cheques</span>
                  <span className={`font-medium ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(data.unpresented_cheques)}
                  </span>
                </div>
                <div className={`flex justify-between ${borderColor} pt-3`}>
                  <span className={textSecondary}>Uncredited Deposits</span>
                  <span className={`font-medium ${textPrimary}`}>
                    {bankReconciliationService.formatCurrency(data.uncredited_deposits)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`${cardBg} p-6 rounded-lg shadow`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Deposits & Withdrawals</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className={textSecondary}>Total Deposits</span>
                  <span className="font-medium text-green-500">
                    {bankReconciliationService.formatCurrency(data.total_deposits)}
                  </span>
                </div>
                <div className={`flex justify-between ${borderColor} pt-3`}>
                  <span className={textSecondary}>Total Withdrawals</span>
                  <span className="font-medium text-red-500">
                    {bankReconciliationService.formatCurrency(data.total_withdrawals)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
