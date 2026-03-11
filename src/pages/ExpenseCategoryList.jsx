import { useCallback, useEffect, useState } from "react";
import { expenseCategoryService } from "../services/expenseCategoryService";
import { financialreportsService } from "../services/financialReportsService";

const EXPENSE_GROUPS = ["TRAVEL", "OFFICE", "UTILITIES", "PROFESSIONAL", "MARKETING", "OTHER"];
const VAT_TREATMENTS = ["STANDARD", "ZERO_RATED", "EXEMPT", "OUT_OF_SCOPE"];

const ExpenseCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterVat, setFilterVat] = useState("");
  const [glAccounts, setGlAccounts] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    glAccountCode: "",
    expenseGroup: "",
    vatTreatment: "STANDARD",
    receiptThreshold: "",
    maxAmount: "",
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterGroup) params.expenseGroup = filterGroup;
      if (filterVat) params.vatApplicable = filterVat;
      const response = await expenseCategoryService.list(params);
      setCategories(response.data?.data || response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load expense categories");
    } finally {
      setLoading(false);
    }
  }, [filterGroup, filterVat]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const fetchGlAccounts = async () => {
      try {
        const res = await financialreportsService.getChartOfAccounts({ type: "expense" });
        const data = res?.data || res || {};
        const accounts = (data.accounts || []).map((a) => ({
          code: a.accountCode || a.code,
          name: a.accountName || a.name,
        }));
        setGlAccounts(accounts);
      } catch (_err) {
        // GL accounts are optional — fail silently
      }
    };
    fetchGlAccounts();
  }, []);

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      glAccountCode: glAccounts.length === 1 ? glAccounts[0].code : "",
      expenseGroup: "",
      vatTreatment: "STANDARD",
      receiptThreshold: "",
      maxAmount: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat) => {
    setForm({
      code: cat.code || "",
      name: cat.name || "",
      glAccountCode: cat.glAccountCode || "",
      expenseGroup: cat.expenseGroup || "",
      vatTreatment: cat.vatTreatment || "STANDARD",
      receiptThreshold: cat.receiptThreshold || "",
      maxAmount: cat.maxAmount || "",
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        receiptThreshold: form.receiptThreshold ? Number(form.receiptThreshold) : null,
        maxAmount: form.maxAmount ? Number(form.maxAmount) : null,
      };
      if (editingId) {
        await expenseCategoryService.update(editingId, payload);
      } else {
        await expenseCategoryService.create(payload);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save expense category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense category?")) return;
    try {
      await expenseCategoryService.remove(id);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete expense category");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expense categories...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Categories</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 font-bold">
            x
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Groups</option>
          {EXPENSE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={filterVat}
          onChange={(e) => setFilterVat(e.target.value)}
          className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All VAT</option>
          <option value="true">VAT Applicable</option>
          <option value="false">Non-VAT</option>
        </select>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? "Edit Category" : "New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GL Account
                <select
                  value={form.glAccountCode}
                  onChange={(e) => setForm({ ...form, glAccountCode: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select GL Account...</option>
                  {glAccounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expense Group
                <select
                  value={form.expenseGroup}
                  onChange={(e) => setForm({ ...form, expenseGroup: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  {EXPENSE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                VAT Treatment
                <select
                  value={form.vatTreatment}
                  onChange={(e) => setForm({ ...form, vatTreatment: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {VAT_TREATMENTS.map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Receipt Threshold
                <input
                  type="number"
                  value={form.receiptThreshold}
                  onChange={(e) => setForm({ ...form, receiptThreshold: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Amount
                <input
                  type="number"
                  value={form.maxAmount}
                  onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {[
                "Code",
                "Name",
                "GL Account",
                "Expense Group",
                "VAT Treatment",
                "Receipt Threshold",
                "Max Amount",
                "Status",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No expense categories found
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{cat.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {cat.glAccountCode
                      ? glAccounts.find((a) => a.code === cat.glAccountCode)
                        ? `${cat.glAccountCode} - ${glAccounts.find((a) => a.code === cat.glAccountCode).name}`
                        : cat.glAccountCode
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{cat.expenseGroup || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {(cat.vatTreatment || "-").replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{cat.receiptThreshold || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{cat.maxAmount || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cat.isActive !== false
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {cat.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(cat)}
                      className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
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

export default ExpenseCategoryList;
