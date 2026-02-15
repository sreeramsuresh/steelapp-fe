import { ArrowLeft, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { grnService } from "../../../services/grnService";
import { formatDate } from "../../../utils/invoiceUtils";

export default function POGRNDetail() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { grnId } = useParams();
  const { poId } = useWorkspace();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await grnService.getById(grnId);
        setGrn(data);
      } catch {
        setGrn(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [grnId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8 text-center">
        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>GRN not found.</p>
      </div>
    );
  }

  const items = grn.items || grn.grn_items || [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <button
        type="button"
        onClick={() => navigate(`/app/purchases/po/${poId}/grn`)}
        className={`flex items-center gap-1.5 text-sm mb-4 ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to GRN List
      </button>

      <div
        className={`rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-6 w-6 text-teal-500" />
          <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {grn.grn_number || grn.grnNumber || `GRN-${grn.id}`}
          </h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            {(grn.status || "draft").toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Received Date</div>
            <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatDate(grn.received_date || grn.receivedDate)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Warehouse</div>
            <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {grn.warehouse_name || grn.warehouseName || "—"}
            </div>
          </div>
          <div>
            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Notes</div>
            <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{grn.notes || "—"}</div>
          </div>
        </div>

        {items.length > 0 && (
          <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                  <th className={`text-left px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Product
                  </th>
                  <th
                    className={`text-right px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Qty
                  </th>
                  <th
                    className={`text-right px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Weight (kg)
                  </th>
                  <th className={`text-left px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Batch/Heat
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`px-4 py-2.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {item.product_name || item.name || "—"}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {item.received_quantity || item.quantity || 0}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {item.actual_weight_kg || item.weight || "—"}
                    </td>
                    <td className={`px-4 py-2.5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {item.batch_number || item.heat_number || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
