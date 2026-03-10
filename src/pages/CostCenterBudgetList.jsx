import { useCallback, useEffect, useRef, useState } from "react";
import { costCenterBudgetService } from "../services/costCenterBudgetService";
import { costCenterService } from "../services/costCenterService";

export default function CostCenterBudgetList() {
  const [budgets, setBudgets] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    costCenterId: "",
  });
  const [showHelper, setShowHelper] = useState(false);
  const helperRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    costCenterId: "",
    fiscalYear: new Date().getFullYear(),
    fiscalMonth: "",
    budgetAmount: "",
    notes: "",
  });

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await costCenterBudgetService.list(filters);
      setBudgets(res.data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCostCenters = useCallback(async () => {
    try {
      const res = await costCenterService.list({ isActive: true });
      setCostCenters(res.data?.data || []);
    } catch (_err) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchCostCenters();
  }, [fetchBudgets, fetchCostCenters]);

  useEffect(() => {
    const handleClick = (e) => {
      if (helperRef.current && !helperRef.current.contains(e.target)) {
        setShowHelper(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await costCenterBudgetService.create(formData);
      setShowForm(false);
      setFormData({
        costCenterId: "",
        fiscalYear: new Date().getFullYear(),
        fiscalMonth: "",
        budgetAmount: "",
        notes: "",
      });
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this budget entry?")) return;
    try {
      await costCenterBudgetService.remove(id);
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (loading) return <div className="p-6">Loading budgets...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 relative" ref={helperRef}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Center Budgets</h1>
          <button
            type="button"
            onClick={() => setShowHelper((v) => !v)}
            className="text-gray-400 hover:text-blue-500 focus:outline-none"
            title="What is a Budget?"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-label="Help">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showHelper && (
            <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">What is a Budget?</p>
              <p className="mb-2">
                A budget sets the maximum planned spend (in AED) for a cost center over a period. Actual expenses are
                compared against it in reports.
              </p>
              <ul className="space-y-1 ml-4 list-disc text-xs">
                <li>
                  <strong>Annual</strong> — Covers the full fiscal year when no month is selected
                </li>
                <li>
                  <strong>Monthly</strong> — Targets a specific month for finer tracking
                </li>
                <li>
                  <strong>Category</strong> — Optionally limit to an expense type (e.g. Salaries, Rent)
                </li>
              </ul>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Budget"}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="flex gap-4 mb-4">
        <input
          type="number"
          placeholder="Fiscal Year"
          value={filters.fiscalYear}
          onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        />
        <select
          value={filters.costCenterId}
          onChange={(e) => setFilters({ ...filters, costCenterId: e.target.value })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Cost Centers</option>
          {costCenters.map((cc) => (
            <option key={cc.id} value={cc.id}>
              {cc.code} - {cc.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              required
              value={formData.costCenterId}
              onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Cost Center</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              placeholder="Fiscal Year"
              value={formData.fiscalYear}
              onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <select
              value={formData.fiscalMonth}
              onChange={(e) => setFormData({ ...formData, fiscalMonth: e.target.value })}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="">Annual</option>
              {months.slice(1).map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              step="0.01"
              placeholder="Budget Amount"
              value={formData.budgetAmount}
              onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
              className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <input
            type="text"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Save Budget
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {budgets.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm">
                  {b.costCenterCode} - {b.costCenterName}
                </td>
                <td className="px-4 py-3 text-sm">{b.fiscalYear}</td>
                <td className="px-4 py-3 text-sm">{b.fiscalMonth ? months[b.fiscalMonth] : "Annual"}</td>
                <td className="px-4 py-3 text-sm">{b.expenseCategoryName || "Total"}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{b.budgetAmount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{b.notes}</td>
                <td className="px-4 py-3 text-sm">
                  <button type="button" onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {budgets.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No budgets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
