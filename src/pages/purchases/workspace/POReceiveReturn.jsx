import { AlertTriangle, CheckCircle2, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { notificationService } from "../../../services/notificationService";
import { purchaseOrderService } from "../../../services/purchaseOrderService";

export default function POReceiveReturn() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { summary, poId, refresh } = useWorkspace();
  const workflow = summary?.workflow;
  const po = summary?.po;
  const _dispatch = summary?.dispatch;

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);

  // Fetch warehouses
  useEffect(() => {
    let cancelled = false;
    purchaseOrderService.getWarehouses().then((res) => {
      if (cancelled) return;
      const list = res?.data || res || [];
      setWarehouses(Array.isArray(list) ? list : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialise item quantities from dispatch/PO items
  useEffect(() => {
    const sourceItems = summary?.items || po?.items || [];
    setItems(
      sourceItems.map((item) => ({
        item_id: item.id || item.item_id,
        product_name: item.product_name || item.description || "Item",
        dispatched_qty: item.dispatched_qty ?? item.quantity ?? 0,
        quantity: item.dispatched_qty ?? item.quantity ?? 0,
      }))
    );
  }, [summary, po]);

  const cardClass = `rounded-lg border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const labelClass = `block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`;
  const inputClass = `w-full px-3 py-2 rounded border text-sm ${
    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
  }`;

  // Gate: only available for dropship POs that have been dispatched but not yet received
  const canReceive = workflow?.isDropship && workflow?.dispatchComplete && po?.stock_status !== "in_warehouse";

  if (!canReceive) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Receive to Warehouse is not available for this purchase order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleQtyChange = (idx) => (e) => {
    const val = Number(e.target.value) || 0;
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: Math.min(val, item.dispatched_qty) } : item))
    );
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      notificationService.error("Please select a warehouse");
      return;
    }
    if (!reason.trim()) {
      notificationService.error("Reason is required");
      return;
    }
    if (items.every((i) => i.quantity <= 0)) {
      notificationService.error("At least one item must have a quantity greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await purchaseOrderService.receiveToWarehouse(poId, {
        items: items.filter((i) => i.quantity > 0).map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
        warehouse_id: warehouseId,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      notificationService.success("Goods received to warehouse successfully");
      await refresh();
      navigate(`/app/purchases/po/${poId}/overview`);
    } catch (err) {
      notificationService.error(err.message || "Failed to receive goods to warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-purple-500/20">
            <Package className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Receive to Warehouse</h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Receive rejected dropship goods back into a warehouse.
            </p>
          </div>
        </div>

        {/* Warehouse selector */}
        <div className="mb-4">
          <label htmlFor="receive-warehouse" className={labelClass}>
            Warehouse <span className="text-red-400">*</span>
          </label>
          <select
            id="receive-warehouse"
            className={inputClass}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">Select warehouse...</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>

        {/* Per-item quantities */}
        <div className="mb-4">
          <div className={labelClass}>Items to Receive</div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.item_id}
                className={`flex items-center gap-3 p-2 rounded ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
              >
                <span className={`flex-1 text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {item.product_name}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={item.dispatched_qty}
                    value={item.quantity}
                    onChange={handleQtyChange(idx)}
                    className={`w-20 px-2 py-1 rounded border text-sm text-center ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                  <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    / {item.dispatched_qty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label htmlFor="receive-reason" className={labelClass}>
            Reason <span className="text-red-400">*</span>
          </label>
          <input
            id="receive-reason"
            type="text"
            className={inputClass}
            placeholder="e.g. Customer rejected — quality issue"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label htmlFor="receive-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="receive-notes"
            className={inputClass}
            rows={3}
            placeholder="Optional additional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? "Receiving..." : "Confirm Receive to Warehouse"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/app/purchases/po/${poId}/overview`)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
