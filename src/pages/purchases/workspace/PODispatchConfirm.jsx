import { ArrowRight, CheckCircle2, Loader2, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { notificationService } from "../../../services/notificationService";
import { purchaseOrderService } from "../../../services/purchaseOrderService";

export default function PODispatchConfirm() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { summary, poId, refresh } = useWorkspace();
  const dispatch = summary?.dispatch;
  const workflow = summary?.workflow;

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    dispatch_date: new Date().toISOString().split("T")[0],
    carrier: "",
    tracking_no: "",
    delivery_note_ref: "",
    remarks: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.dispatch_date) {
      notificationService.error("Dispatch date is required");
      return;
    }
    setSubmitting(true);
    try {
      await purchaseOrderService.confirmDispatch(poId, form);
      notificationService.success("Dispatch confirmed successfully");
      await refresh();
      setShowForm(false);
    } catch (err) {
      notificationService.error(err.message || "Failed to confirm dispatch");
    } finally {
      setSubmitting(false);
    }
  };

  const basePath = `/app/purchases/po/${poId}`;
  const cardClass = `rounded-lg border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const labelClass = `block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`;
  const inputClass = `w-full px-3 py-2 rounded border text-sm ${
    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
  }`;

  // Already dispatched — show confirmation card
  if (dispatch?.confirmed) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Dispatch Confirmed</h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Goods have been dispatched directly to the customer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {dispatch.dispatch_date && (
              <div>
                <div className={labelClass}>Dispatch Date</div>
                <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {new Date(dispatch.dispatch_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {dispatch.carrier && (
              <div>
                <div className={labelClass}>Carrier</div>
                <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{dispatch.carrier}</div>
              </div>
            )}
            {dispatch.tracking_no && (
              <div>
                <div className={labelClass}>Tracking No.</div>
                <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {dispatch.tracking_no}
                </div>
              </div>
            )}
            {dispatch.confirmed_at && (
              <div>
                <div className={labelClass}>Confirmed At</div>
                <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {new Date(dispatch.confirmed_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/bills`)}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-500"
          >
            Next: Create Supplier Bill
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Not yet dispatched
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-orange-500/20">
            <Truck className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Dispatch to Customer</h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Confirm that goods from this dropship order have been dispatched directly to the customer.
            </p>
          </div>
        </div>

        {!workflow?.dispatchEnabled && (
          <div
            className={`text-sm p-3 rounded ${isDarkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700"}`}
          >
            Confirm the PO with the supplier before dispatching.
          </div>
        )}

        {workflow?.dispatchEnabled && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-500"
          >
            <Truck className="h-4 w-4" />
            Confirm Dispatch to Customer
          </button>
        )}

        {showForm && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="dispatch-date" className={labelClass}>
                Dispatch Date <span className="text-red-400">*</span>
              </label>
              <input
                id="dispatch-date"
                type="date"
                className={inputClass}
                value={form.dispatch_date}
                onChange={handleChange("dispatch_date")}
              />
            </div>
            <div>
              <label htmlFor="dispatch-carrier" className={labelClass}>
                Carrier
              </label>
              <input
                id="dispatch-carrier"
                type="text"
                className={inputClass}
                placeholder="e.g. FedEx, DHL, Aramex"
                value={form.carrier}
                onChange={handleChange("carrier")}
              />
            </div>
            <div>
              <label htmlFor="dispatch-tracking" className={labelClass}>
                Tracking No.
              </label>
              <input
                id="dispatch-tracking"
                type="text"
                className={inputClass}
                value={form.tracking_no}
                onChange={handleChange("tracking_no")}
              />
            </div>
            <div>
              <label htmlFor="dispatch-dn-ref" className={labelClass}>
                Delivery Note Ref
              </label>
              <input
                id="dispatch-dn-ref"
                type="text"
                className={inputClass}
                placeholder="DN-XXXX"
                value={form.delivery_note_ref}
                onChange={handleChange("delivery_note_ref")}
              />
            </div>
            <div>
              <label htmlFor="dispatch-remarks" className={labelClass}>
                Remarks
              </label>
              <textarea
                id="dispatch-remarks"
                className={inputClass}
                rows={3}
                value={form.remarks}
                onChange={handleChange("remarks")}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-500 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitting ? "Confirming..." : "Confirm Dispatch"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
