import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { salaryStructureService } from "../services/salaryStructureService";

const SalaryStructureList = () => {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salaryStructureService.list();
      setStructures(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load salary structures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const handleClone = async (id) => {
    try {
      const res = await salaryStructureService.clone(id);
      const cloned = res.data?.data || res.data;
      if (cloned?.id) {
        navigate(`/app/salary-structures/${cloned.id}`);
      } else {
        fetchStructures();
      }
    } catch (err) {
      setError(err.message || "Failed to clone");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this salary structure?")) return;
    try {
      await salaryStructureService.remove(id);
      fetchStructures();
    } catch (err) {
      setError(err.message || "Failed to delete");
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
        <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
        <button
          type="button"
          onClick={() => navigate("/app/salary-structures/new")}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          New Structure
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

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Components</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {structures.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No salary structures found
                </td>
              </tr>
            ) : (
              structures.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/salary-structures/${s.id}`)}
                      className="text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.designationName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {s.isDefault ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {s.componentCount ?? s.items?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleClone(s.id)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Clone"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/salary-structures/${s.id}`)}
                        className="p-1 text-gray-500 hover:text-teal-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
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
    </div>
  );
};

export default SalaryStructureList;
