import { Pencil, Play, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { recurringExpenseService } from "../services/recurringExpenseService";

const FREQUENCIES = ["MONTHLY", "QUARTERLY", "ANNUAL"];

const emptyForm = {
  templateName: "",
  expenseCategoryId: "",
  supplierId: "",
  costCenterId: "",
  defaultAmount: "",
  currency: "AED",
  frequency: "MONTHLY",
  dayOfMonth: "1",
  narration: "",
  isActive: true,
};

const RecurringExpenseList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [generating, setGenerating] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await recurringExpenseService.list();
      setItems(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load recurring expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = async (item) => {
    try {
      const res = await recurringExpenseService.getById(item.id);
      const d = res.data?.data || res.data;
      setForm({
        templateName: d.templateName || "",
        expenseCategoryId: d.expenseCategoryId ?? "",
        supplierId: d.supplierId ?? "",
        costCenterId: d.costCenterId ?? "",
        defaultAmount: d.defaultAmount ?? "",
        currency: d.currency || "AED",
        frequency: d.frequency || "MONTHLY",
        dayOfMonth: d.dayOfMonth ?? "1",
        narration: d.narration || "",
        isActive: d.isActive ?? true,
      });
      setEditingId(item.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load details");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recurring expense template?")) return;
    try {
      await recurringExpenseService.remove(id);
      fetchItems();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleGenerate = async (id) => {
    try {
      setGenerating(id);
      await recurringExpenseService.generate(id);
      fetchItems();
    } catch (err) {
      setError(err.message || "Failed to generate");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAllDue = async () => {
    try {
      setGenerating("all");
      await recurringExpenseService.generateDue();
      fetchItems();
    } catch (err) {
      setError(err.message || "Failed to generate due expenses");
    } finally {
      setGenerating(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        expenseCategoryId: form.expenseCategoryId ? Number(form.expenseCategoryId) : null,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        costCenterId: form.costCenterId ? Number(form.costCenterId) : null,
        defaultAmount: form.defaultAmount ? Number(form.defaultAmount) : null,
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : null,
      };
      if (editingId) {
        await recurringExpenseService.update(editingId, payload);
      } else {
        await recurringExpenseService.create(payload);
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      setError(err.message || "Failed to save");
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
        <h1 className="text-2xl font-bold text-gray-900">Recurring Expenses</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateAllDue}
            disabled={generating === "all"}
            className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={generating === "all" ? "animate-spin" : ""} />
            Generate All Due
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            New Template
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Generated</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No recurring expenses found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.templateName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.categoryName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.supplierName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {item.defaultAmount != null
                      ? `${item.currency || ""} ${Number(item.defaultAmount).toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.frequency}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.lastGeneratedAt ? new Date(item.lastGeneratedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerate(item.id)}
                        disabled={generating === item.id}
                        className="p-1 text-gray-500 hover:text-teal-600 disabled:opacity-50"
                        title="Generate Now"
                      >
                        <Play size={16} className={generating === item.id ? "animate-pulse" : ""} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1 text-gray-500 hover:text-teal-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Template" : "New Template"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                  <input
                    type="text"
                    required
                    value={form.templateName}
                    onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category ID
                    <input
                      type="number"
                      value={form.expenseCategoryId}
                      onChange={(e) => setForm((f) => ({ ...f, expenseCategoryId: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier ID
                    <input
                      type="number"
                      value={form.supplierId}
                      onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Center ID
                    <input
                      type="number"
                      value={form.costCenterId}
                      onChange={(e) => setForm((f) => ({ ...f, costCenterId: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Amount
                    <input
                      type="number"
                      step="0.01"
                      value={form.defaultAmount}
                      onChange={(e) => setForm((f) => ({ ...f, defaultAmount: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Month
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={form.dayOfMonth}
                      onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Narration
                  <textarea
                    value={form.narration}
                    onChange={(e) => setForm((f) => ({ ...f, narration: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={3}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  id="recurring-active"
                />
                <label htmlFor="recurring-active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
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

export default RecurringExpenseList;
