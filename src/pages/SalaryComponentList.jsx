import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { salaryComponentService } from "../services/salaryComponentService";

const COMPONENT_TYPES = ["EARNING", "DEDUCTION", "EMPLOYER_CONTRIBUTION"];
const CALC_TYPES = ["FIXED", "PERCENTAGE", "FORMULA"];

const emptyForm = {
  code: "",
  name: "",
  componentType: "EARNING",
  isTaxable: false,
  isFixed: true,
  calculationType: "FIXED",
  glAccountId: "",
  description: "",
  isActive: true,
};

const SalaryComponentList = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [filterType, setFilterType] = useState("");

  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterType ? { componentType: filterType } : {};
      const res = await salaryComponentService.list(params);
      setComponents(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load salary components");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = async (comp) => {
    try {
      const res = await salaryComponentService.getById(comp.id);
      const d = res.data?.data || res.data;
      setForm({
        code: d.code || "",
        name: d.name || "",
        componentType: d.componentType || "EARNING",
        isTaxable: d.isTaxable ?? false,
        isFixed: d.isFixed ?? true,
        calculationType: d.calculationType || "FIXED",
        glAccountId: d.glAccountId ?? "",
        description: d.description || "",
        isActive: d.isActive ?? true,
      });
      setEditingId(comp.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load component");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this salary component?")) return;
    try {
      await salaryComponentService.remove(id);
      fetchComponents();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        glAccountId: form.glAccountId ? Number(form.glAccountId) : null,
      };
      if (editingId) {
        await salaryComponentService.update(editingId, payload);
      } else {
        await salaryComponentService.create(payload);
      }
      setModalOpen(false);
      fetchComponents();
    } catch (err) {
      setError(err.message || "Failed to save");
    }
  };

  const typeBadge = (type) => {
    const colors = {
      EARNING: "bg-green-100 text-green-800",
      DEDUCTION: "bg-red-100 text-red-800",
      EMPLOYER_CONTRIBUTION: "bg-blue-100 text-blue-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
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
        <h1 className="text-2xl font-bold text-gray-900">Salary Components</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {COMPONENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            New Component
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Taxable</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fixed/Variable</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GL Account</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {components.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No components found
                </td>
              </tr>
            ) : (
              components.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge(c.componentType)}`}>
                      {(c.componentType || "").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{c.isTaxable ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-sm text-center">{c.isFixed ? "Fixed" : "Variable"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.calculationType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.glAccountId || "-"}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="p-1 text-gray-500 hover:text-teal-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Component" : "New Component"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Type
                    <select
                      value={form.componentType}
                      onChange={(e) => setForm((f) => ({ ...f, componentType: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {COMPONENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calculation Type
                    <select
                      value={form.calculationType}
                      onChange={(e) => setForm((f) => ({ ...f, calculationType: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {CALC_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GL Account ID
                  <input
                    type="number"
                    value={form.glAccountId}
                    onChange={(e) => setForm((f) => ({ ...f, glAccountId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
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
                    checked={form.isTaxable}
                    onChange={(e) => setForm((f) => ({ ...f, isTaxable: e.target.checked }))}
                  />
                  Taxable
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isFixed}
                    onChange={(e) => setForm((f) => ({ ...f, isFixed: e.target.checked }))}
                  />
                  Fixed
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

export default SalaryComponentList;
