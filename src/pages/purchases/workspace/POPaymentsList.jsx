import { Eye, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../../../utils/invoiceUtils";

export default function POPaymentsList() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { summary, poId } = useWorkspace();

  const payments = summary?.payments?.preview || [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          <Wallet className="inline h-5 w-5 mr-2 text-teal-500" />
          Payments
        </h2>
      </div>

      {payments.length === 0 ? (
        <div
          className={`text-center py-12 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"}`}
        >
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No payments yet</p>
          <p className="text-sm mt-1">Payments appear here once recorded against supplier bills.</p>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Date
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Method
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Reference
                </th>
                <th className={`text-right px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Amount
                </th>
                <th className={`text-right px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className={`border-t cursor-pointer transition-colors ${
                    isDarkMode ? "border-gray-700 hover:bg-gray-700/40" : "border-gray-100 hover:bg-gray-50"
                  }`}
                  onClick={() => navigate(`/app/purchases/po/${poId}/payments/${payment.id}`)}
                >
                  <td className={`px-4 py-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {(payment.payment_method || "—").replace(/_/g, " ")}
                  </td>
                  <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {payment.reference_number || "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Eye className={`inline h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary?.payments?.count > 0 && (
        <div className={`mt-3 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Total paid: {formatCurrency(summary.payments.total_paid)}
          {summary.bills?.total_billed > 0 && <span> / Billed: {formatCurrency(summary.bills.total_billed)}</span>}
        </div>
      )}
    </div>
  );
}
