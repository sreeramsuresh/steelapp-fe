import { Edit2, MapPin, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { apiClient } from "../services/api.js";

const CARD = (dark) =>
  `rounded-2xl border p-4 ${dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} shadow-sm`;
const LABEL = (dark) => `block text-xs font-semibold mb-1 ${dark ? "text-gray-300" : "text-gray-600"}`;
const INPUT = (dark) =>
  `w-full rounded-lg border px-3 py-2 text-sm ${
    dark
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-teal-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
  } focus:outline-none focus:ring-1 focus:ring-teal-500`;

export default function WarehouseLocations() {
  const { isDarkMode } = useTheme();
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterWarehouseId, setFilterWarehouseId] = useState("");
  const [form, setForm] = useState({ warehouseId: "", aisle: "", rack: "", bin: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterWarehouseId) params.warehouse_id = filterWarehouseId;
      const data = await apiClient.get("/warehouse-locations", params);
      setLocations(data.warehouseLocations || []);
    } catch {
      setError("Failed to load warehouse locations");
    } finally {
      setLoading(false);
    }
  }, [filterWarehouseId]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await apiClient.get("/warehouses");
      setWarehouses(data.warehouses || data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSave = async () => {
    if (!form.warehouseId) {
      setError("Warehouse is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await apiClient.put(`/warehouse-locations/${editingId}`, {
          aisle: form.aisle || null,
          rack: form.rack || null,
          bin: form.bin || null,
        });
      } else {
        await apiClient.post("/warehouse-locations", {
          warehouseId: form.warehouseId,
          aisle: form.aisle || null,
          rack: form.rack || null,
          bin: form.bin || null,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ warehouseId: "", aisle: "", rack: "", bin: "" });
      fetchLocations();
    } catch (err) {
      setError(err?.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (loc) => {
    setForm({
      warehouseId: String(loc.warehouseId || ""),
      aisle: loc.aisle || "",
      rack: loc.rack || "",
      bin: loc.bin || "",
    });
    setEditingId(loc.id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Deactivate location "${loc.label || loc.id}"?`)) return;
    try {
      await apiClient.delete(`/warehouse-locations/${loc.id}`);
      fetchLocations();
    } catch (err) {
      setError(err?.message || "Cannot deactivate: location may be in use");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ warehouseId: "", aisle: "", rack: "", bin: "" });
    setError("");
  };

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="text-teal-500" size={22} />
          <h1 className="text-xl font-bold">Warehouse Locations</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ warehouseId: "", aisle: "", rack: "", bin: "" });
            setError("");
          }}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={16} />
          Add Location
        </button>
      </div>

      {/* Filter */}
      <div className={`${CARD(isDarkMode)} mb-4`}>
        <label className={LABEL(isDarkMode)} htmlFor="filter-warehouse">
          Filter by Warehouse
        </label>
        <select
          id="filter-warehouse"
          className={INPUT(isDarkMode)}
          value={filterWarehouseId}
          onChange={(e) => setFilterWarehouseId(e.target.value)}
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className={`${CARD(isDarkMode)} mb-4`}>
          <div className="text-sm font-bold mb-3">{editingId ? "Edit Location" : "New Location"}</div>
          {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
          <div className="grid grid-cols-4 gap-3">
            {!editingId && (
              <div className="col-span-4 sm:col-span-2">
                <label className={LABEL(isDarkMode)} htmlFor="form-warehouse">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  id="form-warehouse"
                  className={INPUT(isDarkMode)}
                  value={form.warehouseId}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                >
                  <option value="">Select warehouse…</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={LABEL(isDarkMode)} htmlFor="form-aisle">
                Aisle
              </label>
              <input
                id="form-aisle"
                className={INPUT(isDarkMode)}
                value={form.aisle}
                onChange={(e) => setForm((f) => ({ ...f, aisle: e.target.value }))}
                placeholder="e.g. A"
              />
            </div>
            <div>
              <label className={LABEL(isDarkMode)} htmlFor="form-rack">
                Rack
              </label>
              <input
                id="form-rack"
                className={INPUT(isDarkMode)}
                value={form.rack}
                onChange={(e) => setForm((f) => ({ ...f, rack: e.target.value }))}
                placeholder="e.g. R1"
              />
            </div>
            <div>
              <label className={LABEL(isDarkMode)} htmlFor="form-bin">
                Bin
              </label>
              <input
                id="form-bin"
                className={INPUT(isDarkMode)}
                value={form.bin}
                onChange={(e) => setForm((f) => ({ ...f, bin: e.target.value }))}
                placeholder="e.g. B3"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !showForm && <div className="text-red-500 text-sm mb-3">{error}</div>}

      {/* Locations Table */}
      <div className={CARD(isDarkMode)}>
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading…</div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No warehouse locations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
                >
                  <th className="text-left py-2 px-3 font-semibold">Warehouse</th>
                  <th className="text-left py-2 px-3 font-semibold">Aisle</th>
                  <th className="text-left py-2 px-3 font-semibold">Rack</th>
                  <th className="text-left py-2 px-3 font-semibold">Bin</th>
                  <th className="text-left py-2 px-3 font-semibold">Label</th>
                  <th className="text-left py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr
                    key={loc.id}
                    className={`border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"} ${!loc.isActive ? "opacity-50" : ""}`}
                  >
                    <td className="py-2 px-3">{loc.warehouseName || "-"}</td>
                    <td className="py-2 px-3 font-mono">{loc.aisle || "-"}</td>
                    <td className="py-2 px-3 font-mono">{loc.rack || "-"}</td>
                    <td className="py-2 px-3 font-mono">{loc.bin || "-"}</td>
                    <td className="py-2 px-3 font-semibold text-teal-500">{loc.label || "-"}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          loc.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {loc.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleEdit(loc)}
                          title="Edit"
                          className={`p-1 rounded hover:bg-teal-100 text-teal-600 ${isDarkMode ? "hover:bg-teal-900/30" : ""}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        {loc.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDelete(loc)}
                            title="Deactivate"
                            className={`p-1 rounded hover:bg-red-100 text-red-500 ${isDarkMode ? "hover:bg-red-900/30" : ""}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
