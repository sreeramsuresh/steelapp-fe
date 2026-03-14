import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { employeeSalaryService } from "../services/employeeSalaryService";
import { salaryStructureService } from "../services/salaryStructureService";
import { formatBusinessDate } from "../utils/timezone";

const EmployeeSalaryTab = ({ employeeId }) => {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null); // "assign" | "adjust" | null
  const [structures, setStructures] = useState([]);
  const [assignForm, setAssignForm] = useState({
    salaryStructureId: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    baseAmount: "",
  });
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: "INCREMENT",
    adjustmentAmount: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const fetchData = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const [curRes, histRes] = await Promise.all([
        employeeSalaryService.getCurrent(employeeId),
        employeeSalaryService.getHistory(employeeId),
      ]);
      setCurrent(curRes.data?.data || curRes.data || null);
      setHistory(histRes.data?.data || histRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to load salary data");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAssign = async () => {
    try {
      const res = await salaryStructureService.list();
      setStructures(res.data?.data || res.data || []);
      setAssignForm({
        salaryStructureId: "",
        effectiveDate: new Date().toISOString().slice(0, 10),
        baseAmount: "",
      });
      setModalMode("assign");
    } catch (err) {
      setError(err.message || "Failed to load structures");
    }
  };

  const openAdjust = () => {
    setAdjustForm({
      adjustmentType: "INCREMENT",
      adjustmentAmount: "",
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: "",
    });
    setModalMode("adjust");
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await employeeSalaryService.assign(employeeId, {
        ...assignForm,
        salaryStructureId: Number(assignForm.salaryStructureId),
        baseAmount: assignForm.baseAmount ? Number(assignForm.baseAmount) : null,
      });
      setModalMode(null);
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to assign");
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await employeeSalaryService.adjust(employeeId, {
        ...adjustForm,
        adjustmentAmount: Number(adjustForm.adjustmentAmount),
      });
      setModalMode(null);
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to adjust");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Current Salary */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Salary</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openAssign}
              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Assign Structure
            </button>
            {current && (
              <button
                type="button"
                onClick={openAdjust}
                className="px-3 py-1.5 text-sm border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
              >
                Adjust Salary
              </button>
            )}
          </div>
        </div>
        {current ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Structure:</span>{" "}
                <span className="font-medium">{current.structureName || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Base Amount:</span>{" "}
                <span className="font-medium">
                  {current.baseAmount != null ? Number(current.baseAmount).toLocaleString() : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Effective Date:</span>{" "}
                <span className="font-medium">
                  {current.effectiveDate ? formatBusinessDate(current.effectiveDate) : "-"}
                </span>
              </div>
            </div>
            {current.components?.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Component Breakdown</h4>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {current.components.map((comp) => (
                      <tr key={comp.componentName || comp.code}>
                        <td className="px-3 py-2">{comp.componentName || comp.code}</td>
                        <td className="px-3 py-2 text-gray-500">{comp.componentType}</td>
                        <td className="px-3 py-2 text-right">{Number(comp.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No salary structure assigned</p>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary History</h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">No history available</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Structure</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Base Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((h) => (
                <tr key={h.id || `${h.effectiveDate}-${h.changeType}`}>
                  <td className="px-3 py-2">{h.effectiveDate ? formatBusinessDate(h.effectiveDate) : "-"}</td>
                  <td className="px-3 py-2">{h.structureName || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {h.baseAmount != null ? Number(h.baseAmount).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2">{h.changeType || "-"}</td>
                  <td className="px-3 py-2 text-gray-500">{h.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Modal */}
      {modalMode === "assign" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Assign Salary Structure</h2>
              <button type="button" onClick={() => setModalMode(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Structure
                  <select
                    required
                    value={assignForm.salaryStructureId}
                    onChange={(e) => setAssignForm((f) => ({ ...f, salaryStructureId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select structure...</option>
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                  <input
                    type="date"
                    required
                    value={assignForm.effectiveDate}
                    onChange={(e) => setAssignForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Amount
                  <input
                    type="number"
                    step="0.01"
                    value={assignForm.baseAmount}
                    onChange={(e) => setAssignForm((f) => ({ ...f, baseAmount: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {modalMode === "adjust" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Adjust Salary</h2>
              <button type="button" onClick={() => setModalMode(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdjust} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                  <select
                    value={adjustForm.adjustmentType}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, adjustmentType: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="INCREMENT">Increment</option>
                    <option value="DECREMENT">Decrement</option>
                    <option value="REVISION">Revision</option>
                  </select>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={adjustForm.adjustmentAmount}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, adjustmentAmount: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                  <input
                    type="date"
                    required
                    value={adjustForm.effectiveDate}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                  <textarea
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSalaryTab;
