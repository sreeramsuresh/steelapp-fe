import { ArrowLeft, Wallet } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../../../utils/invoiceUtils";

export default function POPaymentDetail() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const { poId, summary } = useWorkspace();

  const payment = summary?.payments?.preview?.find((p) => String(p.id) === String(paymentId));

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <button
        type="button"
        onClick={() => navigate(`/app/purchases/po/${poId}/payments`)}
        className={`flex items-center gap-1.5 text-sm mb-4 ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payments
      </button>

      <div className={`rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="h-6 w-6 text-teal-500" />
          <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Payment Detail
          </h2>
        </div>

        {payment ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Date</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {formatDate(payment.payment_date)}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Amount</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(payment.amount)}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Method</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {(payment.payment_method || "—").replace(/_/g, " ")}
              </div>
            </div>
            <div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Reference</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {payment.reference_number || "—"}
              </div>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Payment #{paymentId} not found in preview data.
          </p>
        )}
      </div>
    </div>
  );
}
