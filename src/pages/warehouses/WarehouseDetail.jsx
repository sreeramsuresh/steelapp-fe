/**
 * WarehouseDetail Page
 * Dashboard view for a single warehouse with tabs for Overview, Stock, Batches, Activity
 */

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building,
  Clock,
  Edit,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import WarehouseFormDialog from "../../components/warehouses/WarehouseFormDialog";
import WarehouseStockView from "../../components/warehouses/WarehouseStockView";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient } from "../../services/api.js";
import { notificationService } from "../../services/notificationService";
import stockBatchService from "../../services/stockBatchService";
import { warehouseService } from "../../services/warehouseService";

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // State
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [stats, setStats] = useState({
    totalQuantity: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    totalValue: 0,
    productCount: 0,
    lowStockCount: 0,
    utilizationPercent: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);

  // Batches tab state
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [assigningBatch, setAssigningBatch] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [saving, setSaving] = useState(false);

  // Locations tab state
  const [locTabData, setLocTabData] = useState([]);
  const [locTabLoading, setLocTabLoading] = useState(false);
  const [locSort, setLocSort] = useState({ col: "label", dir: "asc" });
  const [genAisles, setGenAisles] = useState(4);
  const [genRacks, setGenRacks] = useState(3);
  const [genBins, setGenBins] = useState(9);
  const [genOverrides, setGenOverrides] = useState({});
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [addLocForm, setAddLocForm] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [selectedLocs, setSelectedLocs] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchWarehouse = useCallback(async () => {
    try {
      setLoading(true);
      const data = await warehouseService.getById(id);
      setWarehouse(data);

      const dashboardData = await warehouseService.getDashboard(id);
      setStats({
        totalQuantity: parseFloat(dashboardData.totalQuantity) || 0,
        reservedQuantity: parseFloat(dashboardData.reservedQuantity) || 0,
        availableQuantity: parseFloat(dashboardData.availableQuantity) || 0,
        totalValue: parseFloat(dashboardData.totalValue) || 0,
        productCount: dashboardData.productCount || 0,
        lowStockCount: dashboardData.lowStockCount || 0,
        utilizationPercent: dashboardData.utilizationPercent || 0,
      });

      const activities = (dashboardData.recentActivities || []).map((activity, index) => ({
        id: activity.id || index,
        type: activity.type || "IN",
        product: activity.productName || activity.description || "Unknown Product",
        quantity: `${parseFloat(activity.quantity || 0).toLocaleString()} KG`,
        time: activity.timestamp ? new Date(activity.timestamp).toLocaleString() : "Unknown",
        reference: activity.reference || "",
      }));
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      notificationService.error("Failed to load warehouse");
      navigate("/app/warehouses");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const result = await stockBatchService.getBatches({ warehouseId: id, activeOnly: true });
      setBatches(result.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
      notificationService.error("Failed to load batches");
    } finally {
      setBatchesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWarehouse();
  }, [fetchWarehouse]);

  useEffect(() => {
    if (activeTab === "batches") {
      fetchBatches();
    }
  }, [activeTab, fetchBatches]);

  const fetchLocTabData = useCallback(async () => {
    setLocTabLoading(true);
    try {
      const res = await apiClient.get("/warehouse-locations", { warehouse_id: id, active: "false" });
      setLocTabData(res.warehouseLocations || res.locations || []);
      setSelectedLocs(new Set());
    } catch (error) {
      console.error("Error fetching locations:", error);
      notificationService.error("Failed to load locations");
    } finally {
      setLocTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "locations") {
      fetchLocTabData();
    }
  }, [activeTab, fetchLocTabData]);

  const computePreview = () => {
    const a = Math.max(0, Math.min(26, parseInt(genAisles, 10) || 0));
    const r = Math.max(1, Math.min(99, parseInt(genRacks, 10) || 0));
    const d = Math.max(1, Math.min(99, parseInt(genBins, 10) || 0));
    let total = 0;
    if (a === 0) {
      // Rack-only mode
      for (let ri = 1; ri <= r; ri++) {
        total += parseInt(genOverrides[`R${ri}`], 10) || d;
      }
    } else {
      for (let ai = 0; ai < a; ai++) {
        const aisle = String.fromCharCode(65 + ai);
        for (let ri = 1; ri <= r; ri++) {
          const key = `${aisle}-R${ri}`;
          total += parseInt(genOverrides[key], 10) || d;
        }
      }
    }
    return total;
  };

  const handleGenerate = async () => {
    const aislesVal = parseInt(genAisles, 10);
    const racksVal = parseInt(genRacks, 10);
    const binsVal = parseInt(genBins, 10);
    if (Number.isNaN(aislesVal) || aislesVal < 0) {
      notificationService.error("Aisles must be 0 or more (0 = rack-only)");
      return;
    }
    if (!racksVal || racksVal < 1) {
      notificationService.error("Racks per aisle must be at least 1");
      return;
    }
    if (!binsVal || binsVal < 1) {
      notificationService.error("Default bins per rack must be at least 1");
      return;
    }
    setGenLoading(true);
    setGenResult(null);
    try {
      const payload = {
        aisles: parseInt(genAisles, 10),
        racksPerAisle: parseInt(genRacks, 10),
        defaultBinsPerRack: parseInt(genBins, 10),
        overrides: Object.fromEntries(
          Object.entries(genOverrides)
            .filter(([, v]) => v !== "" && v !== undefined)
            .map(([k, v]) => [k, parseInt(v, 10)])
        ),
      };
      const res = await apiClient.post(`/warehouses/${id}/locations/generate`, payload);
      setGenResult(res);
      fetchLocTabData();
    } catch (error) {
      notificationService.error(error.message || "Failed to generate locations");
    } finally {
      setGenLoading(false);
    }
  };

  const handleDeactivateLoc = async (locId) => {
    try {
      await apiClient.delete(`/warehouse-locations/${locId}`);
      fetchLocTabData();
      notificationService.success("Location deactivated");
    } catch (error) {
      notificationService.error(error.message || "Failed to deactivate location");
    }
  };

  const handleClearLocations = async () => {
    setClearConfirm(false);
    try {
      const res = await apiClient.delete(`/warehouses/${id}/locations`);
      notificationService.success(`Deleted ${res.deleted} location(s)`);
      setGenResult(null);
      fetchLocTabData();
    } catch (error) {
      notificationService.error(error.response?.data?.message || error.message || "Failed to clear locations");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLocs.size === 0) return;
    setBulkDeleting(true);
    try {
      const res = await apiClient.post(`/warehouses/${id}/locations/bulk-delete`, {
        ids: [...selectedLocs],
      });
      notificationService.success(`Deleted ${res.deleted} location(s)`);
      setSelectedLocs(new Set());
      fetchLocTabData();
    } catch (error) {
      notificationService.error(error.response?.data?.message || error.message || "Failed to delete locations");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSaveAddLoc = async () => {
    if (!addLocForm) return;
    try {
      await apiClient.post("/warehouse-locations", {
        warehouse_id: parseInt(id, 10),
        aisle: addLocForm.aisle,
        rack: addLocForm.rack,
        bin: addLocForm.bin,
        is_active: true,
      });
      setAddLocForm(null);
      fetchLocTabData();
      notificationService.success("Location added");
    } catch (error) {
      notificationService.error(error.message || "Failed to add location");
    }
  };

  const handleEdit = () => setEditDialogOpen(true);

  const handleEditSave = async (formData) => {
    try {
      await warehouseService.update(id, formData);
      notificationService.success("Warehouse updated successfully");
      setEditDialogOpen(false);
      fetchWarehouse();
    } catch (error) {
      console.error("Error updating warehouse:", error);
      notificationService.error("Failed to update warehouse");
    }
  };

  const openAssignModal = async (batch) => {
    setAssigningBatch(batch);
    setSelectedLocId(batch.locationId ? String(batch.locationId) : "");
    try {
      const res = await apiClient.get("/warehouse-locations", { warehouse_id: id, active: "true" });
      setLocations(res.warehouseLocations || res.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      notificationService.error("Failed to load bin locations");
    }
  };

  const confirmAssign = async () => {
    setSaving(true);
    try {
      await stockBatchService.assignLocation(assigningBatch.id, selectedLocId || null);
      setAssigningBatch(null);
      fetchBatches();
      notificationService.success("Bin location updated");
    } catch (error) {
      notificationService.error(error.message || "Failed to update bin location");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: MapPin },
    { id: "stock", label: "Stock", icon: Package },
    { id: "batches", label: "Batches", icon: Layers },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  const getMovementTypeStyle = (type) => {
    switch (type) {
      case "IN":
        return { icon: TrendingUp, color: "text-green-500", bg: isDarkMode ? "bg-green-900/30" : "bg-green-100" };
      case "OUT":
        return { icon: TrendingDown, color: "text-red-500", bg: isDarkMode ? "bg-red-900/30" : "bg-red-100" };
      case "TRANSFER":
        return { icon: ArrowRight, color: "text-blue-500", bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-100" };
      default:
        return { icon: Activity, color: "text-gray-500", bg: isDarkMode ? "bg-gray-700" : "bg-gray-100" };
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-gray-50"}`}>
        <RefreshCw className={`w-8 h-8 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-gray-50"}`}>
        <div className="text-center">
          <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
          <h2 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Warehouse not found</h2>
          <Link to="/app/warehouses" className="text-teal-500 hover:underline mt-2 inline-block">
            Back to Warehouses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-[#1E2328]" : "bg-white"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/app/warehouses")}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
              </button>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}>
                  <MapPin className={`w-6 h-6 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {warehouse.name}
                    </h1>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        warehouse.isActive
                          ? isDarkMode
                            ? "bg-green-900/30 text-green-400"
                            : "bg-green-100 text-green-700"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {warehouse.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {warehouse.code}
                    {[warehouse.city, warehouse.country].filter(Boolean).length > 0
                      ? ` - ${[warehouse.city, warehouse.country].filter(Boolean).join(", ")}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchWarehouse}
                className={`p-2 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-600 text-gray-400 hover:bg-gray-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-teal-500 text-teal-500"
                      : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900"}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Stock", value: stats.totalQuantity.toLocaleString(), unit: "items", color: "teal" },
                { label: "Reserved", value: stats.reservedQuantity.toLocaleString(), unit: "items", color: "blue" },
                { label: "Available", value: stats.availableQuantity.toLocaleString(), unit: "items", color: "green" },
                {
                  label: "Low Stock Alerts",
                  value: stats.lowStockCount,
                  unit: "products",
                  color: stats.lowStockCount > 0 ? "red" : "gray",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                  >
                    {kpi.label}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      kpi.color === "teal"
                        ? isDarkMode
                          ? "text-teal-400"
                          : "text-teal-600"
                        : kpi.color === "blue"
                          ? isDarkMode
                            ? "text-blue-400"
                            : "text-blue-600"
                          : kpi.color === "green"
                            ? isDarkMode
                              ? "text-green-400"
                              : "text-green-600"
                            : kpi.color === "red"
                              ? isDarkMode
                                ? "text-red-400"
                                : "text-red-600"
                              : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-600"
                    }`}
                  >
                    {kpi.value}
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{kpi.unit}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions, Info, Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Create Transfer", to: `/stock-movements?tab=transfers&source=${warehouse.id}` },
                    { label: "View All Movements", to: `/stock-movements?warehouse_id=${warehouse.id}` },
                    { label: "View Inventory", to: `/inventory?warehouse_id=${warehouse.id}` },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"}`}
                    >
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {action.label}
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                    </Link>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Warehouse Info
                </h3>
                <div className="space-y-3">
                  {warehouse.address && (
                    <div className="flex items-start gap-2">
                      <Building className={`w-4 h-4 mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {warehouse.address}
                      </span>
                    </div>
                  )}
                  {warehouse.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {warehouse.contactPerson}
                      </span>
                    </div>
                  )}
                  {warehouse.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {warehouse.phone}
                      </span>
                    </div>
                  )}
                  {warehouse.email && (
                    <div className="flex items-center gap-2">
                      <Mail className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {warehouse.email}
                      </span>
                    </div>
                  )}
                  {warehouse.capacity > 0 && (
                    <div className="flex items-center gap-2">
                      <Package className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Capacity: {warehouse.capacity.toLocaleString()} {warehouse.capacityUnit || "MT"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Recent Activity
                  </h3>
                  <Link
                    to={`/stock-movements?warehouse_id=${warehouse.id}`}
                    className="text-xs text-teal-500 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentActivity.slice(0, 4).map((activity) => {
                    const style = getMovementTypeStyle(activity.type);
                    const Icon = style.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-2">
                        <div className={`p-1 rounded ${style.bg}`}>
                          <Icon className={`w-3 h-3 ${style.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {activity.product}
                          </p>
                          <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                            {activity.quantity} / {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {warehouse.capacity > 0 && (
              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Capacity Utilization
                  </h3>
                  <span
                    className={`text-sm font-medium ${
                      stats.utilizationPercent >= 90
                        ? "text-red-500"
                        : stats.utilizationPercent >= 70
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    {stats.utilizationPercent}%
                  </span>
                </div>
                <div className={`h-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      stats.utilizationPercent >= 90
                        ? "bg-red-500"
                        : stats.utilizationPercent >= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                  {stats.totalQuantity.toLocaleString()} of {warehouse.capacity.toLocaleString()}{" "}
                  {warehouse.capacityUnit || "MT"} used
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stock" && <WarehouseStockView warehouseId={id} warehouseName={warehouse.name} />}

        {activeTab === "batches" && (
          <div
            className={`rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Stock Batches</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Assign bin locations to received batches
              </p>
            </div>

            {batchesLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className={`w-6 h-6 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              </div>
            ) : batches.length === 0 ? (
              <div className="py-12 text-center">
                <Layers className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No active batches in this warehouse
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className={`border-b ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
                    >
                      <th className="text-left px-4 py-3 font-medium w-36">Batch No</th>
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-right px-4 py-3 font-medium w-32">Qty Remaining</th>
                      <th className="text-left px-4 py-3 font-medium w-48">Bin Location</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                    {batches.map((batch) => (
                      <tr key={batch.id} className={isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}>
                        <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {batch.batchNumber || `#${batch.id}`}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {batch.productDisplayName || batch.productUniqueName}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {parseFloat(batch.quantityRemaining || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 3,
                          })}{" "}
                          {batch.unit || "KG"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {batch.locationLabel ? (
                              <span className="font-mono text-xs text-teal-400">
                                {batch.locationLabel}
                                {batch.locationIsActive === false && (
                                  <span className="ml-1 text-orange-400 text-[10px]">(inactive)</span>
                                )}
                              </span>
                            ) : (
                              <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>--</span>
                            )}
                            <button
                              type="button"
                              onClick={() => openAssignModal(batch)}
                              className={`shrink-0 text-xs px-2 py-0.5 rounded border ${
                                batch.locationLabel
                                  ? isDarkMode
                                    ? "border-gray-600 text-gray-400 hover:border-teal-500 hover:text-teal-400"
                                    : "border-gray-300 text-gray-500 hover:border-teal-500 hover:text-teal-600"
                                  : "border-teal-600 text-teal-500 hover:bg-teal-600 hover:text-white"
                              }`}
                            >
                              {batch.locationLabel ? "Change" : "Assign"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "locations" && (
          <div className="space-y-6">
            {/* Generate section */}
            <div
              className={`rounded-lg border p-5 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3
                className={`text-sm font-semibold mb-4 uppercase tracking-wide ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Generate Locations
              </h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <label
                    htmlFor="gen-aisles"
                    className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Aisles
                  </label>
                  <input
                    id="gen-aisles"
                    type="number"
                    min="0"
                    max="26"
                    value={genAisles}
                    onChange={(e) => {
                      setGenAisles(e.target.value);
                      setGenOverrides({});
                      setGenResult(null);
                    }}
                    className={`w-20 px-2 py-1.5 text-sm rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="gen-racks"
                    className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Racks / Aisle
                  </label>
                  <input
                    id="gen-racks"
                    type="number"
                    min="1"
                    max="99"
                    value={genRacks}
                    onChange={(e) => {
                      setGenRacks(e.target.value);
                      setGenOverrides({});
                      setGenResult(null);
                    }}
                    className={`w-20 px-2 py-1.5 text-sm rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="gen-bins"
                    className={`block text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Default bins / rack
                  </label>
                  <input
                    id="gen-bins"
                    type="number"
                    min="1"
                    max="99"
                    value={genBins}
                    onChange={(e) => {
                      setGenBins(e.target.value);
                      setGenResult(null);
                    }}
                    className={`w-24 px-2 py-1.5 text-sm rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                </div>
              </div>

              {/* Override grid */}
              {parseInt(genRacks, 10) >= 1 && (
                <div className="mb-4">
                  <p className={`text-xs mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Override bins per rack (optional):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parseInt(genAisles, 10) === 0
                      ? Array.from({ length: Math.min(parseInt(genRacks, 10) || 0, 99) }, (_, ri) => {
                          const key = `R${ri + 1}`;
                          return (
                            <div key={key} className="flex items-center gap-1">
                              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {key}:
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                placeholder={genBins}
                                value={genOverrides[key] || ""}
                                onChange={(e) => setGenOverrides((o) => ({ ...o, [key]: e.target.value }))}
                                className={`w-14 text-xs px-1 py-0.5 rounded border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                              />
                            </div>
                          );
                        })
                      : Array.from({ length: Math.min(parseInt(genAisles, 10) || 0, 26) }, (_, ai) => {
                          const aisle = String.fromCharCode(65 + ai);
                          return Array.from({ length: Math.min(parseInt(genRacks, 10) || 0, 99) }, (_, ri) => {
                            const rack = `R${ri + 1}`;
                            const key = `${aisle}-${rack}`;
                            return (
                              <div key={key} className="flex items-center gap-1">
                                <span className={`text-xs font-mono ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {key}
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={genOverrides[key] ?? genBins}
                                  onChange={(e) => {
                                    setGenOverrides((prev) => ({ ...prev, [key]: e.target.value }));
                                    setGenResult(null);
                                  }}
                                  className={`w-14 px-1.5 py-1 text-xs rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                />
                              </div>
                            );
                          });
                        })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Preview: <strong>{computePreview()}</strong> locations total
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={genLoading}
                  className="px-4 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60"
                >
                  {genLoading ? "Generating..." : "Generate"}
                </button>
              </div>

              {genResult && (
                <p className={`mt-3 text-sm ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  ✓ Generated {genResult.generated} new, {genResult.skipped} skipped (of {genResult.total} total)
                </p>
              )}
            </div>

            {/* Existing locations table */}
            <div
              className={`rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div
                className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Existing Locations ({locTabData.length})
                </h3>
                <div className="flex items-center gap-2">
                  {locTabData.length > 0 && !clearConfirm && (
                    <button
                      type="button"
                      onClick={() => setClearConfirm(true)}
                      className="flex items-center gap-1 text-sm px-3 py-1.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                    >
                      Clear All
                    </button>
                  )}
                  {clearConfirm && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                        Delete all locations?
                      </span>
                      <button
                        type="button"
                        onClick={handleClearLocations}
                        className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setClearConfirm(false)}
                        className={`text-sm px-3 py-1.5 rounded-lg border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAddLocForm({ aisle: "", rack: "", bin: "" })}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 border border-teal-600 text-teal-500 rounded-lg hover:bg-teal-600 hover:text-white"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {addLocForm && (
                <div
                  className={`flex items-center gap-3 p-4 border-b ${isDarkMode ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-gray-50"}`}
                >
                  <input
                    placeholder="Aisle (A)"
                    value={addLocForm.aisle}
                    onChange={(e) => setAddLocForm((f) => ({ ...f, aisle: e.target.value.toUpperCase() }))}
                    className={`w-20 px-2 py-1.5 text-sm rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                  <input
                    placeholder="Rack (R1)"
                    value={addLocForm.rack}
                    onChange={(e) => setAddLocForm((f) => ({ ...f, rack: e.target.value }))}
                    className={`w-20 px-2 py-1.5 text-sm rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                  <input
                    placeholder="Bin (B1)"
                    value={addLocForm.bin}
                    onChange={(e) => setAddLocForm((f) => ({ ...f, bin: e.target.value }))}
                    className={`w-20 px-2 py-1.5 text-sm rounded border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                  <button
                    type="button"
                    onClick={handleSaveAddLoc}
                    className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddLocForm(null)}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Bulk-delete action bar */}
              {selectedLocs.size > 0 && (
                <div
                  className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? "border-gray-700 bg-gray-800/60" : "border-gray-200 bg-red-50"}`}
                >
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {selectedLocs.size} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLocs(new Set())}
                      className={`text-sm px-3 py-1 rounded border ${isDarkMode ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-300 text-gray-500 hover:bg-gray-100"}`}
                    >
                      Deselect all
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                    >
                      {bulkDeleting ? "Deleting..." : `Delete ${selectedLocs.size}`}
                    </button>
                  </div>
                </div>
              )}

              {locTabLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className={`w-6 h-6 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                </div>
              ) : locTabData.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No locations yet. Use Generate above or add manually.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={`border-b ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
                      >
                        <th className="px-4 py-3 w-8">
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={locTabData.length > 0 && selectedLocs.size === locTabData.length}
                            onChange={(e) =>
                              setSelectedLocs(e.target.checked ? new Set(locTabData.map((l) => l.id)) : new Set())
                            }
                          />
                        </th>
                        {[
                          ["label", "Label"],
                          ["aisle", "Aisle"],
                          ["rack", "Rack"],
                          ["bin", "Bin"],
                        ].map(([col, title]) => (
                          <th
                            key={col}
                            className={`text-left px-4 py-3 font-medium cursor-pointer select-none hover:opacity-75 ${col !== "label" ? "w-20" : ""}`}
                            onClick={() =>
                              setLocSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }))
                            }
                          >
                            {title} {locSort.col === col ? (locSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </th>
                        ))}
                        <th className="text-left px-4 py-3 font-medium w-24">Status</th>
                        <th className="text-right px-4 py-3 font-medium w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                      {[...locTabData]
                        .sort((a, b) => {
                          const v = (x) => (x[locSort.col] || "").toString().toLowerCase();
                          return locSort.dir === "asc" ? v(a).localeCompare(v(b)) : v(b).localeCompare(v(a));
                        })
                        .map((loc) => (
                          <tr
                            key={loc.id}
                            className={`${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"} ${selectedLocs.has(loc.id) ? (isDarkMode ? "bg-gray-800/40" : "bg-red-50/60") : ""}`}
                          >
                            <td className="px-4 py-3 w-8">
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={selectedLocs.has(loc.id)}
                                onChange={(e) => {
                                  setSelectedLocs((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(loc.id);
                                    else next.delete(loc.id);
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td
                              className={`px-4 py-3 font-mono text-xs ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
                            >
                              {loc.label || `${loc.aisle}-${loc.rack}-${loc.bin}`}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {loc.aisle}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {loc.rack}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {loc.bin}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  loc.isActive || loc.is_active
                                    ? isDarkMode
                                      ? "bg-green-900/30 text-green-400"
                                      : "bg-green-100 text-green-700"
                                    : isDarkMode
                                      ? "bg-gray-700 text-gray-400"
                                      : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {loc.isActive || loc.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {(loc.isActive || loc.is_active) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivateLoc(loc.id)}
                                  className={`text-xs px-2 py-0.5 rounded border ${isDarkMode ? "border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400" : "border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500"}`}
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div
            className={`rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Stock Movement History</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Recent stock movements for this warehouse
              </p>
            </div>
            <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {recentActivity.map((activity) => {
                const style = getMovementTypeStyle(activity.type);
                const Icon = style.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg ${style.bg}`}>
                      <Icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{activity.product}</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {activity.type} / {activity.quantity} / Ref: {activity.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <Link
                to={`/stock-movements?warehouse_id=${warehouse.id}`}
                className="text-teal-500 hover:underline text-sm"
              >
                View all movements
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Assign Location Modal */}
      {assigningBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className={`w-full max-w-md rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"}`}
          >
            <h3 className="text-base font-semibold mb-1">Assign Bin Location</h3>
            <p className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Batch: <span className="font-mono">{assigningBatch.batchNumber || `#${assigningBatch.id}`}</span>
            </p>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="assign-loc-select"
                  className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Bin Location
                </label>
                <button
                  type="button"
                  className="text-xs text-teal-500 hover:underline"
                  onClick={() => {
                    setAssigningBatch(null);
                    setActiveTab("locations");
                  }}
                >
                  + Manage locations
                </button>
              </div>
              {locations.length === 0 ? (
                <p className={`text-xs py-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  No bin locations configured for this warehouse.{" "}
                  <button
                    type="button"
                    className="text-teal-500 hover:underline"
                    onClick={() => {
                      setAssigningBatch(null);
                      setActiveTab("locations");
                    }}
                  >
                    Add locations
                  </button>{" "}
                  first.
                </p>
              ) : (
                <select
                  id="assign-loc-select"
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="">-- No location (clear) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={String(loc.id)}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setAssigningBatch(null)}
                disabled={saving}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAssign}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialogOpen && (
        <WarehouseFormDialog
          open={editDialogOpen}
          warehouse={warehouse}
          onSave={handleEditSave}
          onClose={() => setEditDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default WarehouseDetail;
