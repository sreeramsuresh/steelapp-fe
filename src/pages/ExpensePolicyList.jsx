import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { expensePolicyService } from "../services/expensePolicyService";

const emptyForm = {
  policyName: "",
  expenseCategoryId: "",
  departmentId: "",
  maxAmountPerTransaction: "",
  maxAmountPerMonth: "",
  receiptRequired: true,
  autoApproveBelow: "",
  isActive: true,
  description: "",
};

const ExpensePolicyList = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await expensePolicyService.list();
      setPolicies(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = async (policy) => {
    try {
      const res = await expensePolicyService.getById(policy.id);
      const d = res.data?.data || res.data;
      setForm({
        policyName: d.policyName || "",
        expenseCategoryId: d.expenseCategoryId ?? "",
        departmentId: d.departmentId ?? "",
        maxAmountPerTransaction: d.maxAmountPerTransaction ?? "",
        maxAmountPerMonth: d.maxAmountPerMonth ?? "",
        receiptRequired: d.receiptRequired ?? true,
        autoApproveBelow: d.autoApproveBelow ?? "",
        isActive: d.isActive ?? true,
        description: d.description || "",
      });
      setEditingId(policy.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load policy");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense policy?")) return;
    try {
      await expensePolicyService.remove(id);
      fetchPolicies();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        expenseCategoryId: form.expenseCategoryId ? Number(form.expenseCategoryId) : null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        maxAmountPerTransaction: form.maxAmountPerTransaction ? Number(form.maxAmountPerTransaction) : null,
        maxAmountPerMonth: form.maxAmountPerMonth ? Number(form.maxAmountPerMonth) : null,
        autoApproveBelow: form.autoApproveBelow ? Number(form.autoApproveBelow) : null,
      };
      if (editingId) {
        await expensePolicyService.update(editingId, payload);
      } else {
        await expensePolicyService.create(payload);
      }
      setModalOpen(false);
      fetchPolicies();
    } catch (err) {
      setError(err.message || "Failed to save");
    }
  };

  const fmt = (val) => (val != null ? Number(val).toLocaleString() : "-");

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Policies</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          New Policy
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Policy Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Department
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Max/Transaction
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Max/Month
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Receipt Req.
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Auto-Approve Below
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No policies found
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.policyName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{p.categoryName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{p.departmentName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {fmt(p.maxAmountPerTransaction)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {fmt(p.maxAmountPerMonth)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center dark:text-gray-300">
                    {p.receiptRequired ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                    {fmt(p.autoApproveBelow)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">{editingId ? "Edit Policy" : "New Policy"}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} className="dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Policy Name
                  <input
                    type="text"
                    required
                    value={form.policyName}
                    onChange={(e) => setForm((f) => ({ ...f, policyName: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category ID
                    <input
                      type="number"
                      value={form.expenseCategoryId}
                      onChange={(e) => setForm((f) => ({ ...f, expenseCategoryId: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department ID
                    <input
                      type="number"
                      value={form.departmentId}
                      onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max / Transaction
                    <input
                      type="number"
                      step="0.01"
                      value={form.maxAmountPerTransaction}
                      onChange={(e) => setForm((f) => ({ ...f, maxAmountPerTransaction: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max / Month
                    <input
                      type="number"
                      step="0.01"
                      value={form.maxAmountPerMonth}
                      onChange={(e) => setForm((f) => ({ ...f, maxAmountPerMonth: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auto-Approve Below
                    <input
                      type="number"
                      step="0.01"
                      value={form.autoApproveBelow}
                      onChange={(e) => setForm((f) => ({ ...f, autoApproveBelow: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.receiptRequired}
                      onChange={(e) => setForm((f) => ({ ...f, receiptRequired: e.target.checked }))}
                    />
                    Receipt Required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePolicyList;
