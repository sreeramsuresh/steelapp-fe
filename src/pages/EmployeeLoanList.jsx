import { useCallback, useEffect, useState } from "react";
import { employeeLoanService } from "../services/employeeLoanService";

const STATUS_BADGES = {
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  DEFAULTED: "bg-red-100 text-red-800",
  WRITTEN_OFF: "bg-gray-100 text-gray-600",
};

const EmployeeLoanList = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    loanType: "",
    principalAmount: "",
    interestRate: "0",
    startDate: "",
    monthlyInstallment: "",
  });

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await employeeLoanService.list(params);
      setLoans(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await employeeLoanService.create({
        employeeId: parseInt(formData.employeeId, 10),
        loanType: formData.loanType,
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        monthlyInstallment: parseFloat(formData.monthlyInstallment),
      });
      setShowForm(false);
      setFormData({
        employeeId: "",
        loanType: "",
        principalAmount: "",
        interestRate: "0",
        startDate: "",
        monthlyInstallment: "",
      });
      fetchLoans();
    } catch (err) {
      setError(err.message || "Failed to create loan");
    }
  };

  const handleDisburse = async (id) => {
    try {
      await employeeLoanService.disburse(id);
      fetchLoans();
    } catch (err) {
      setError(err.message || "Failed to disburse loan");
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
        <h1 className="text-2xl font-bold text-gray-900">Employee Loans</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          {showForm ? "Cancel" : "New Loan"}
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

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Employee ID</span>
            <input
              type="number"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Loan Type</span>
            <input
              type="text"
              value={formData.loanType}
              onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
              placeholder="e.g., Personal, Housing"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Principal Amount</span>
            <input
              type="number"
              required
              step="0.01"
              value={formData.principalAmount}
              onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</span>
            <input
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Start Date</span>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Monthly Installment</span>
            <input
              type="number"
              required
              step="0.01"
              value={formData.monthlyInstallment}
              onChange={(e) => setFormData({ ...formData, monthlyInstallment: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Create Loan
            </button>
          </div>
        </form>
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
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly EMI</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No loans found
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{loan.employeeName || `#${loan.employeeId}`}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{loan.loanType || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {Number(loan.principalAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {Number(loan.monthlyInstallment || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {Number(loan.totalPaid || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {Number(loan.outstandingBalance || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[loan.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {(loan.status || "").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {loan.status === "ACTIVE" && !loan.disbursementBatchId && (
                      <button
                        type="button"
                        onClick={() => handleDisburse(loan.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Disburse
                      </button>
                    )}
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

export default EmployeeLoanList;
