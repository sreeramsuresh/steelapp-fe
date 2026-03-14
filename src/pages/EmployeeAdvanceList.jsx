import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAdvanceService } from "../services/employeeAdvanceService";
import { formatBusinessDate } from "../utils/timezone";

const STATUS_BADGES = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DISBURSED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SETTLED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

const EmployeeAdvanceList = () => {
  const navigate = useNavigate();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const fetchAdvances = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterEmployee) params.employeeId = filterEmployee;
      const res = await employeeAdvanceService.list(params);
      setAdvances(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load advances");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterEmployee]);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  const handleAction = async (id, action) => {
    try {
      if (action === "approve") {
        await employeeAdvanceService.approve(id);
      } else if (action === "disburse") {
        await employeeAdvanceService.disburse(id);
      }
      fetchAdvances();
    } catch (err) {
      setError(err.message || `Failed to ${action}`);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Advances</h1>
        <button
          type="button"
          onClick={() => navigate("/app/employee-advances/new")}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          New Advance
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

      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_BADGES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by Employee ID"
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Advance #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Settled
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Remaining
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {advances.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No advances found
                </td>
              </tr>
            ) : (
              advances.map((adv) => (
                <tr key={adv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {adv.advanceNumber || `ADV-${adv.id}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {adv.employeeName || `#${adv.employeeId}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {(adv.advanceType || "").replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {Number(adv.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {adv.advanceDate ? formatBusinessDate(adv.advanceDate) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[adv.status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}`}
                    >
                      {adv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {Number(adv.settledAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {Number(adv.remainingAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {adv.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleAction(adv.id, "approve")}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Approve
                        </button>
                      )}
                      {adv.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleAction(adv.id, "disburse")}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Disburse
                        </button>
                      )}
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

export default EmployeeAdvanceList;
