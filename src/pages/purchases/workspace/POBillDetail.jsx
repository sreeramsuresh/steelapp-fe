import { ArrowLeft, Receipt } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";

export default function POBillDetail() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { billId } = useParams();
  const { poId } = useWorkspace();

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <button
        type="button"
        onClick={() => navigate(`/app/purchases/po/${poId}/bills`)}
        className={`flex items-center gap-1.5 text-sm mb-4 ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bills
      </button>

      <div className={`rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="h-6 w-6 text-teal-500" />
          <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Bill Detail
          </h2>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Viewing supplier bill #{billId}.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/app/supplier-bills/${billId}`)}
          className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors"
        >
          Open Full Bill
        </button>
      </div>
    </div>
  );
}
