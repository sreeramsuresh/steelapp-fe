import { Eye, Loader2, Plus, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../../../utils/invoiceUtils";

const STATUS_COLORS = {
  draft: "bg-gray-500/20 text-gray-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  paid: "bg-teal-500/20 text-teal-400",
  partially_paid: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function POBillsList() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { summary, poId, loading } = useWorkspace();

  const bills = summary?.bills?.preview || [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          <Receipt className="inline h-5 w-5 mr-2 text-teal-500" />
          Supplier Bills
        </h2>
        <button
          type="button"
          onClick={() => navigate(`/app/supplier-bills/new?poId=${poId}`)}
          className="bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create Bill
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : bills.length === 0 ? (
        <div
          className={`text-center py-12 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"}`}
        >
          <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No supplier bills yet</p>
          <p className="text-sm mt-1 mb-3">Create a bill after receiving goods or confirming delivery.</p>
          <button
            type="button"
            onClick={() => navigate(`/app/supplier-bills/new?poId=${poId}`)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create Supplier Bill for this PO
          </button>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Bill Number
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Date
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Status
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
              {bills.map((bill) => (
                <tr
                  key={bill.id}
                  className={`border-t cursor-pointer transition-colors ${
                    isDarkMode ? "border-gray-700 hover:bg-gray-700/40" : "border-gray-100 hover:bg-gray-50"
                  }`}
                  onClick={() => navigate(`/app/purchases/po/${poId}/bills/${bill.id}`)}
                >
                  <td className={`px-4 py-3 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {bill.bill_number || `BILL-${bill.id}`}
                  </td>
                  <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {formatDate(bill.bill_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[bill.status] || STATUS_COLORS.draft}`}
                    >
                      {(bill.status || "draft").toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(bill.total_amount)}
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

      {summary?.bills?.count > 0 && (
        <div className={`mt-3 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Total billed: {formatCurrency(summary.bills.total_billed)}
        </div>
      )}
    </div>
  );
}
