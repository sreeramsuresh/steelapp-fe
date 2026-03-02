import { useCallback, useEffect, useState } from "react";
import { costCenterService } from "../services/costCenterService";

const COST_CENTER_TYPES = ["WAREHOUSE", "DEPARTMENT", "PROJECT", "OVERHEAD"];

const CostCenterList = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "DEPARTMENT",
    warehouseId: "",
    departmentId: "",
  });

  const fetchCostCenters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await costCenterService.list();
      setCostCenters(response.data?.data || response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cost centers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  const resetForm = () => {
    setForm({ code: "", name: "", type: "DEPARTMENT", warehouseId: "", departmentId: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cc) => {
    setForm({
      code: cc.code || "",
      name: cc.name || "",
      type: cc.type || "DEPARTMENT",
      warehouseId: cc.warehouseId || "",
      departmentId: cc.departmentId || "",
    });
    setEditingId(cc.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await costCenterService.update(editingId, form);
      } else {
        await costCenterService.create(form);
      }
      resetForm();
      fetchCostCenters();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save cost center");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cost center?")) return;
    try {
      await costCenterService.remove(id);
      fetchCostCenters();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete cost center");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cost centers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Centers</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Add Cost Center
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

      {showForm && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? "Edit Cost Center" : "New Cost Center"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Type
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {COST_CENTER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Warehouse ID
                <input
                  type="text"
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department ID
                <input
                  type="text"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
            <div className="md:col-span-2 flex gap-2">
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

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {["Code", "Name", "Type", "Warehouse", "Department", "Status", "Actions"].map((header) => (
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
            {costCenters.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No cost centers found
                </td>
              </tr>
            ) : (
              costCenters.map((cc) => (
                <tr key={cc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{cc.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{cc.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{cc.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {cc.warehouseName || cc.warehouseId || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {cc.departmentName || cc.departmentId || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cc.isActive !== false
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {cc.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(cc)}
                      className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cc.id)}
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

export default CostCenterList;
