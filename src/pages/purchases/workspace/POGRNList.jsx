import { Eye, Loader2, Package, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StockReceiptForm from "../../../components/purchase-order/StockReceiptForm";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { grnService } from "../../../services/grnService";
import { purchaseOrderService } from "../../../services/purchaseOrderService";
import { formatDate } from "../../../utils/invoiceUtils";

const STATUS_COLORS = {
  draft: "bg-gray-500/20 text-gray-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function POGRNList() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { summary, poId, refresh } = useWorkspace();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGRN, setShowCreateGRN] = useState(false);
  const [poData, setPoData] = useState(null);

  const fetchGrns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await grnService.getByPurchaseOrder(poId);
      setGrns(Array.isArray(data) ? data : data?.grns || data?.goods_received_notes || []);
    } catch {
      setGrns(summary?.grns?.preview || []);
    } finally {
      setLoading(false);
    }
  }, [poId, summary]);

  useEffect(() => {
    fetchGrns();
  }, [fetchGrns]);

  // Fetch full PO data (items needed for StockReceiptForm)
  useEffect(() => {
    if (!poId) return;
    purchaseOrderService.getById(poId).then(setPoData).catch(() => {});
  }, [poId]);

  const handleGRNCreated = () => {
    setShowCreateGRN(false);
    fetchGrns();
    refresh();
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          <Package className="inline h-5 w-5 mr-2 text-teal-500" />
          Goods Received Notes
        </h2>
        <button
          type="button"
          onClick={() => setShowCreateGRN(true)}
          className="bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create GRN
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : grns.length === 0 ? (
        <div
          className={`text-center py-12 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"}`}
        >
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No GRNs yet</p>
          <p className="text-sm mt-1">Create a GRN to record received goods for this PO.</p>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  GRN Number
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Received Date
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Status
                </th>
                <th className={`text-right px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {grns.map((grn) => (
                <tr
                  key={grn.id}
                  className={`border-t cursor-pointer transition-colors ${
                    isDarkMode ? "border-gray-700 hover:bg-gray-700/40" : "border-gray-100 hover:bg-gray-50"
                  }`}
                  onClick={() => navigate(`/app/purchases/po/${poId}/grn/${grn.id}`)}
                >
                  <td className={`px-4 py-3 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {grn.grn_number || grn.grnNumber || `GRN-${grn.id}`}
                  </td>
                  <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {formatDate(grn.received_date || grn.receivedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[grn.status] || STATUS_COLORS.draft}`}
                    >
                      {(grn.status || "draft").toUpperCase()}
                    </span>
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

      <StockReceiptForm
        open={showCreateGRN}
        purchaseOrderId={parseInt(poId, 10)}
        poNumber={poData?.poNumber || summary?.po?.po_number || ""}
        poItems={(poData?.items || []).map((item) => ({
          id: item.id,
          product_id: item.productId || item.product_id,
          name: item.name || item.productName || item.productType,
          quantity: item.quantity,
          unit: item.unit || "KG",
          received_qty: item.receivedQty || item.received_qty || 0,
        }))}
        onClose={() => setShowCreateGRN(false)}
        onSuccess={handleGRNCreated}
      />
    </div>
  );
}
