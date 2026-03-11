import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { financialreportsService } from "../services/financialReportsService";
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
  const [glAccounts, setGlAccounts] = useState([]);

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

  useEffect(() => {
    const fetchGlAccounts = async () => {
      try {
        const res = await financialreportsService.getChartOfAccounts({});
        const data = res?.data || res || {};
        const accounts = (data.accounts || []).map((a) => ({
          id: a.id || a.accountId,
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

  const openCreate = () => {
    setForm({
      ...emptyForm,
      glAccountId: glAccounts.length === 1 ? String(glAccounts[0].id) : "",
    });
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
      EARNING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      DEDUCTION: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      EMPLOYER_CONTRIBUTION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Salary Components</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
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
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Taxable
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Fixed/Variable
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Calculation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                GL Account
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Active
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {components.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No components found
                </td>
              </tr>
            ) : (
              components.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{c.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge(c.componentType)}`}>
                      {(c.componentType || "").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center dark:text-gray-300">{c.isTaxable ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-sm text-center dark:text-gray-300">
                    {c.isFixed ? "Fixed" : "Variable"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{c.calculationType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {c.glAccountId
                      ? glAccounts.find((a) => String(a.id) === String(c.glAccountId))
                        ? `${glAccounts.find((a) => String(a.id) === String(c.glAccountId)).code} - ${glAccounts.find((a) => String(a.id) === String(c.glAccountId)).name}`
                        : c.glAccountId
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"}`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="p-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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
              <h2 className="text-lg font-semibold dark:text-white">
                {editingId ? "Edit Component" : "New Component"}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Component Type
                    <select
                      value={form.componentType}
                      onChange={(e) => setForm((f) => ({ ...f, componentType: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Calculation Type
                    <select
                      value={form.calculationType}
                      onChange={(e) => setForm((f) => ({ ...f, calculationType: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GL Account
                  <select
                    value={form.glAccountId}
                    onChange={(e) => setForm((f) => ({ ...f, glAccountId: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select GL Account...</option>
                    {glAccounts.map((a) => (
                      <option key={a.id || a.code} value={a.id || a.code}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    rows={2}
                  />
                </label>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isTaxable}
                    onChange={(e) => setForm((f) => ({ ...f, isTaxable: e.target.checked }))}
                  />
                  Taxable
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isFixed}
                    onChange={(e) => setForm((f) => ({ ...f, isFixed: e.target.checked }))}
                  />
                  Fixed
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

export default SalaryComponentList;
