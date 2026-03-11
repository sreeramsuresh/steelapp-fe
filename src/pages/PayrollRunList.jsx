import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { payrollRunService } from "../services/payrollRunService";

const STATUS_BADGES = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  PROCESSING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPUTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBMITTED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  POSTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PayrollRunList = () => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ month: "", year: "", periodStart: "", periodEnd: "" });
  const [showCreate, setShowCreate] = useState(false);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await payrollRunService.list();
      setRuns(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleAction = async (id, action) => {
    try {
      if (action === "cancel") {
        const reason = window.prompt("Reason for cancellation:");
        if (!reason) return;
        await payrollRunService.cancel(id, reason);
      } else if (action === "compute") {
        await payrollRunService.compute(id);
      } else if (action === "submit") {
        await payrollRunService.submit(id);
      } else if (action === "approve") {
        await payrollRunService.approve(id);
      } else if (action === "processPayment") {
        await payrollRunService.processPayment(id);
      }
      fetchRuns();
    } catch (err) {
      setError(err.message || `Failed to ${action}`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const payload = {
        month: Number(newForm.month),
        year: Number(newForm.year),
        periodStart: newForm.periodStart,
        periodEnd: newForm.periodEnd,
      };
      await payrollRunService.create(payload);
      setShowCreate(false);
      setNewForm({ month: "", year: "", periodStart: "", periodEnd: "" });
      fetchRuns();
    } catch (err) {
      setError(err.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const getActions = (run) => {
    const actions = [];
    switch (run.status) {
      case "DRAFT":
        actions.push({ label: "Compute", action: "compute", color: "text-blue-600" });
        actions.push({ label: "Cancel", action: "cancel", color: "text-red-600" });
        break;
      case "COMPUTED":
        actions.push({ label: "Submit", action: "submit", color: "text-purple-600" });
        actions.push({ label: "Cancel", action: "cancel", color: "text-red-600" });
        break;
      case "SUBMITTED":
        actions.push({ label: "Approve", action: "approve", color: "text-green-600" });
        actions.push({ label: "Cancel", action: "cancel", color: "text-red-600" });
        break;
      case "APPROVED":
        actions.push({ label: "Process Payment", action: "processPayment", color: "text-emerald-600" });
        break;
      default:
        break;
    }
    return actions;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll Runs</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          New Payroll Run
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold dark:text-white mb-3">Create Payroll Run</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
                <select
                  required
                  value={newForm.month}
                  onChange={(e) => setNewForm((f) => ({ ...f, month: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select...</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const name = new Date(2000, i).toLocaleString("default", { month: "long" });
                    return (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
                <input
                  type="number"
                  required
                  min={2020}
                  max={2030}
                  value={newForm.year}
                  onChange={(e) => setNewForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period Start
                <input
                  type="date"
                  required
                  value={newForm.periodStart}
                  onChange={(e) => setNewForm((f) => ({ ...f, periodStart: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period End
                  <input
                    type="date"
                    required
                    value={newForm.periodEnd}
                    onChange={(e) => setNewForm((f) => ({ ...f, periodEnd: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>
              <div className="flex gap-2 items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Run #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Month / Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Employees
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Total Gross
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Total Net
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No payroll runs found
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/payroll-runs/${run.id}`)}
                      className="text-teal-600 hover:text-teal-700 hover:underline font-medium"
                    >
                      {run.runNumber || `PR-${run.id}`}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {run.month
                      ? `${new Date(2000, run.month - 1).toLocaleString("default", { month: "short" })} ${run.year}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {run.periodStart
                      ? `${new Date(run.periodStart).toLocaleDateString()} - ${new Date(run.periodEnd).toLocaleDateString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[run.status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {run.employeeCount ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {run.totalGross != null ? Number(run.totalGross).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {run.totalNet != null ? Number(run.totalNet).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getActions(run).map((act) => (
                        <button
                          key={act.action}
                          type="button"
                          onClick={() => handleAction(run.id, act.action)}
                          className={`text-xs font-medium ${act.color} hover:underline`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollRunList;
