import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { salaryComponentService } from "../services/salaryComponentService";
import { salaryStructureService } from "../services/salaryStructureService";

const emptyItem = { salaryComponentId: "", defaultAmount: "", percentage: "", sortOrder: 1 };

const SalaryStructureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";

  const [form, setForm] = useState({
    name: "",
    description: "",
    designationId: "",
    isDefault: false,
    isActive: true,
    items: [{ ...emptyItem }],
  });
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const compRes = await salaryComponentService.list();
      setComponents(compRes.data?.data || compRes.data || []);

      if (isEdit) {
        const res = await salaryStructureService.getById(id);
        const d = res.data?.data || res.data;
        setForm({
          name: d.name || "",
          description: d.description || "",
          designationId: d.designationId ?? "",
          isDefault: d.isDefault ?? false,
          isActive: d.isActive ?? true,
          items: d.items?.length
            ? d.items.map((item) => ({
                salaryComponentId: item.salaryComponentId ?? "",
                defaultAmount: item.defaultAmount ?? "",
                percentage: item.percentage ?? "",
                sortOrder: item.sortOrder ?? 1,
              }))
            : [{ ...emptyItem }],
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem, sortOrder: prev.items.length + 1 }],
    }));
  };

  const removeItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sortOrder: i + 1 })),
    }));
  };

  const updateItem = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        designationId: form.designationId ? Number(form.designationId) : null,
        items: form.items
          .filter((item) => item.salaryComponentId)
          .map((item) => ({
            salaryComponentId: Number(item.salaryComponentId),
            defaultAmount: item.defaultAmount ? Number(item.defaultAmount) : null,
            percentage: item.percentage ? Number(item.percentage) : null,
            sortOrder: item.sortOrder,
          })),
      };
      if (isEdit) {
        await salaryStructureService.update(id, payload);
      } else {
        await salaryStructureService.create(payload);
      }
      navigate("/app/salary-structures");
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("/app/salary-structures")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Salary Structure" : "New Salary Structure"}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation ID
                <input
                  type="number"
                  value={form.designationId}
                  onChange={(e) => setForm((f) => ({ ...f, designationId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
            </label>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Default Structure
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Structure Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Component</div>
              <div className="col-span-2">Default Amount</div>
              <div className="col-span-2">Percentage</div>
              <div className="col-span-1">Order</div>
              <div className="col-span-1" />
            </div>
            {form.items.map((item, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: dynamic form items have no stable id
              <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded">
                <div className="col-span-1 text-sm text-gray-500">{idx + 1}</div>
                <div className="col-span-5">
                  <select
                    value={item.salaryComponentId}
                    onChange={(e) => updateItem(idx, "salaryComponentId", e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  >
                    <option value="">Select component...</option>
                    {components.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={item.defaultAmount}
                    onChange={(e) => updateItem(idx, "defaultAmount", e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="%"
                    value={item.percentage}
                    onChange={(e) => updateItem(idx, "percentage", e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    min={1}
                    value={item.sortOrder}
                    onChange={(e) => updateItem(idx, "sortOrder", Number(e.target.value))}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/salary-structures")}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalaryStructureForm;
