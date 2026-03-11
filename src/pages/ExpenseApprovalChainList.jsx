import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { expenseApprovalChainService } from "../services/expenseApprovalChainService";

const emptyStep = { stepOrder: 1, role: "", userId: "", isMandatory: true };

const emptyForm = {
  name: "",
  minAmount: "",
  maxAmount: "",
  departmentId: "",
  expenseGroup: "",
  isActive: true,
  steps: [{ ...emptyStep }],
};

const ExpenseApprovalChainList = () => {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchChains = useCallback(async () => {
    try {
      setLoading(true);
      const res = await expenseApprovalChainService.list();
      setChains(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load approval chains");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  const openCreate = () => {
    setForm({ ...emptyForm, steps: [{ ...emptyStep }] });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = async (chain) => {
    try {
      const res = await expenseApprovalChainService.getById(chain.id);
      const data = res.data?.data || res.data;
      setForm({
        name: data.name || "",
        minAmount: data.minAmount ?? "",
        maxAmount: data.maxAmount ?? "",
        departmentId: data.departmentId ?? "",
        expenseGroup: data.expenseGroup ?? "",
        isActive: data.isActive ?? true,
        steps: data.steps?.length ? data.steps : [{ ...emptyStep }],
      });
      setEditingId(chain.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load chain details");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this approval chain?")) return;
    try {
      await expenseApprovalChainService.remove(id);
      fetchChains();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        minAmount: form.minAmount ? Number(form.minAmount) : null,
        maxAmount: form.maxAmount ? Number(form.maxAmount) : null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      };
      if (editingId) {
        await expenseApprovalChainService.update(editingId, payload);
      } else {
        await expenseApprovalChainService.create(payload);
      }
      setModalOpen(false);
      fetchChains();
    } catch (err) {
      setError(err.message || "Failed to save");
    }
  };

  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, { ...emptyStep, stepOrder: prev.steps.length + 1 }],
    }));
  };

  const removeStep = (idx) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })),
    }));
  };

  const updateStep = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Approval Chains</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          New Chain
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
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Min Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Max Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Expense Group
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
            {chains.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No approval chains found
                </td>
              </tr>
            ) : (
              chains.map((chain) => (
                <tr key={chain.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{chain.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {chain.minAmount != null ? Number(chain.minAmount).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {chain.maxAmount != null ? Number(chain.maxAmount).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{chain.departmentName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{chain.expenseGroup || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        chain.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {chain.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(chain)}
                        className="p-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(chain.id)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">
                {editingId ? "Edit Approval Chain" : "New Approval Chain"}
              </h2>
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
                  Name
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Amount
                    <input
                      type="number"
                      step="0.01"
                      value={form.minAmount}
                      onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Amount
                    <input
                      type="number"
                      step="0.01"
                      value={form.maxAmount}
                      onChange={(e) => setForm((f) => ({ ...f, maxAmount: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expense Group
                    <input
                      type="text"
                      value={form.expenseGroup}
                      onChange={(e) => setForm((f) => ({ ...f, expenseGroup: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  id="chain-active"
                />
                <label htmlFor="chain-active" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Approval Steps</span>
                  <button type="button" onClick={addStep} className="text-sm text-teal-600 hover:text-teal-700">
                    + Add Step
                  </button>
                </div>
                <div className="space-y-2">
                  {form.steps.map((step, idx) => (
                    <div
                      key={step.stepOrder}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8">
                        #{step.stepOrder}
                      </span>
                      <input
                        type="text"
                        placeholder="Role"
                        value={step.role}
                        onChange={(e) => updateStep(idx, "role", e.target.value)}
                        className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="User ID"
                        value={step.userId}
                        onChange={(e) => updateStep(idx, "userId", e.target.value)}
                        className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={step.isMandatory}
                          onChange={(e) => updateStep(idx, "isMandatory", e.target.checked)}
                        />
                        Required
                      </label>
                      {form.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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

export default ExpenseApprovalChainList;
