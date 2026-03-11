import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAdvanceService } from "../services/employeeAdvanceService";

const STATUS_BADGES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  DISBURSED: "bg-blue-100 text-blue-800",
  SETTLED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
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
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee Advances</h1>
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
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
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
          className="border rounded-lg px-3 py-2 text-sm"
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
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Advance #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Settled</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {advances.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No advances found
                </td>
              </tr>
            ) : (
              advances.map((adv) => (
                <tr key={adv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {adv.advanceNumber || `ADV-${adv.id}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{adv.employeeName || `#${adv.employeeId}`}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(adv.advanceType || "").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {Number(adv.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {adv.advanceDate ? new Date(adv.advanceDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[adv.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {adv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {Number(adv.settledAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
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
