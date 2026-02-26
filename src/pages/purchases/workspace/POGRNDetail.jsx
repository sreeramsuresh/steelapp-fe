import { AlertTriangle, ArrowLeft, CheckCircle, Loader2, Package, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../../components/purchase-order/workspace/WorkspaceContext";
import { useTheme } from "../../../contexts/ThemeContext";
import apiClient from "../../../services/api.js";
import { grnService } from "../../../services/grnService";
import { formatDate } from "../../../utils/invoiceUtils";

const APPROVABLE_STATUSES = ["draft", "recorded", "pending"];

function formatBinLabel(loc) {
  const name = loc.label || String(loc.id);
  const max = loc.maxWeightKg ?? null;
  const current = loc.currentWeightKg ?? null;
  if (max != null && current != null) {
    return `${name} (${current} / ${max} kg)`;
  }
  return name;
}

export default function POGRNDetail() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { grnId } = useParams();
  const { poId } = useWorkspace();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);

  // Approval state
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState(null);
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [itemLocations, setItemLocations] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await grnService.getById(grnId);
      setGrn(data);
    } catch {
      setGrn(null);
    } finally {
      setLoading(false);
    }
  }, [grnId]);

  useEffect(() => {
    load();
  }, [load]);

  async function openApprovePanel() {
    setApproveError(null);
    setItemLocations({});
    setShowApprovePanel(true);
    const warehouseId = grn?.warehouse_id || grn?.warehouseId;
    if (!warehouseId) {
      setLocations([]);
      return;
    }
    setLocationsLoading(true);
    try {
      const data = await apiClient.get("/warehouse-locations", {
        params: { warehouse_id: warehouseId, active: "true" },
      });
      setLocations(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }

  async function handleConfirmApprove() {
    setApproveError(null);
    setApproving(true);
    try {
      await grnService.approve(grnId, { itemLocations });
      setShowApprovePanel(false);
      await load();
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code || err?.response?.data?.error_code;
      const message = err?.response?.data?.message || err?.message || "Approval failed.";

      if (status === 409 && (code === "LOCATION_IN_USE" || code === "BIN_CAPACITY_EXCEEDED")) {
        setApproveError({ type: "red", message });
      } else if (status === 422 && code === "BIN_UNKNOWN_WEIGHT") {
        setApproveError({ type: "amber", message });
      } else {
        setApproveError({ type: "red", message });
      }
    } finally {
      setApproving(false);
    }
  }

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
  const status = (grn.status || "draft").toLowerCase();
  const canApprove = APPROVABLE_STATUSES.includes(status);

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
            {status.toUpperCase()}
          </span>
          {canApprove && !showApprovePanel && (
            <button
              type="button"
              onClick={openApprovePanel}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Approve GRN
            </button>
          )}
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

      {showApprovePanel && (
        <div
          className={`mt-4 rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-teal-700" : "bg-white border-teal-300"}`}
        >
          <h3 className={`text-base font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Approve GRN — Assign Bin Locations
          </h3>

          {approveError && (
            <div
              className={`flex items-start gap-2 rounded-lg px-4 py-3 mb-4 text-sm ${
                approveError.type === "amber"
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {approveError.type === "amber" ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{approveError.message}</span>
            </div>
          )}

          {locationsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : (
            <div
              className={`rounded-lg border overflow-hidden mb-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                    <th
                      className={`text-left px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Product
                    </th>
                    <th
                      className={`text-right px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Qty
                    </th>
                    <th
                      className={`text-left px-4 py-2.5 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Bin Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                    >
                      <td className={`px-4 py-2.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {item.product_name || item.name || "—"}
                      </td>
                      <td className={`px-4 py-2.5 text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {item.received_quantity || item.quantity || 0}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={itemLocations[item.id] || ""}
                          onChange={(e) =>
                            setItemLocations((prev) => ({
                              ...prev,
                              [item.id]: e.target.value || undefined,
                            }))
                          }
                          className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          <option value="">-- No bin (unassigned) --</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {formatBinLabel(loc)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowApprovePanel(false);
                setApproveError(null);
              }}
              disabled={approving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmApprove}
              disabled={approving || locationsLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
