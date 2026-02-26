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
  HelpCircle,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Power,
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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [binMapLocations, setBinMapLocations] = useState([]);
  const [assigningBatch, setAssigningBatch] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [saving, setSaving] = useState(false);

  // Locations tab state
  const [locTabData, setLocTabData] = useState([]);
  const [locTabLoading, setLocTabLoading] = useState(false);
  const [genAisles, setGenAisles] = useState(4);
  const [genRacks, setGenRacks] = useState(3);
  const [genBins, setGenBins] = useState(9);
  const [genOverrides, setGenOverrides] = useState({});
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [filterAisles, setFilterAisles] = useState([]);
  const [filterRacks, setFilterRacks] = useState([]);
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
      const [batchResult, locResult] = await Promise.all([
        stockBatchService.getBatches({ warehouseId: id, activeOnly: true }),
        apiClient.get("/warehouse-locations", { warehouse_id: id, active: "false" }),
      ]);
      setBatches(batchResult.batches || []);
      setBinMapLocations(locResult.warehouseLocations || locResult.locations || []);
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
      // A0 aisle mode
      for (let ri = 1; ri <= r; ri++) {
        total += parseInt(genOverrides[`A0-R${ri}`], 10) || d;
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

  const handleToggleLocActive = async (loc) => {
    const newActive = !(loc.isActive || loc.is_active);
    try {
      await apiClient.patch(`/warehouses/${id}/locations/${loc.id}`, { is_active: newActive });
      fetchLocTabData();
      notificationService.success(newActive ? "Location reactivated" : "Location deactivated");
    } catch (error) {
      notificationService.error(error.response?.data?.error || error.message || "Failed to update location");
    }
  };

  const handleClearLocations = async () => {
    setClearConfirm(false);
    try {
      const res = await apiClient.delete(`/warehouses/${id}/locations`);
      const msg =
        res.blocked > 0
          ? `Deleted ${res.deleted} location(s). ${res.blocked} skipped (contain stock).`
          : `Deleted ${res.deleted} location(s).`;
      notificationService.success(msg);
      setGenResult(null);
      setFilterAisles([]);
      setFilterRacks([]);
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
      const blockedCount = res.blocked?.length ?? 0;
      const msg =
        blockedCount > 0
          ? `Deleted ${res.deleted} location(s). ${blockedCount} skipped (contain stock).`
          : `Deleted ${res.deleted} location(s).`;
      notificationService.success(msg);
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

        {activeTab === "batches" &&
          (() => {
            const categories = [...new Set(batches.map((b) => b.productCategory).filter(Boolean))].sort();
            const filteredBatches = categoryFilter
              ? batches.filter((b) => b.productCategory === categoryFilter)
              : batches;

            // Build occupied location set for bin map
            const occupiedLocIds = new Set(batches.map((b) => b.locationId).filter(Boolean));
            const locBatchMap = {};
            for (const b of batches) {
              if (b.locationId) locBatchMap[b.locationId] = b;
            }

            // Group bin map locations by aisle → rack
            const aisleMap = new Map();
            for (const loc of binMapLocations) {
              const aisleKey = loc.aisle || "__rack_only__";
              if (!aisleMap.has(aisleKey)) aisleMap.set(aisleKey, new Map());
              const rackMap = aisleMap.get(aisleKey);
              if (!rackMap.has(loc.rack)) rackMap.set(loc.rack, []);
              rackMap.get(loc.rack).push(loc);
            }
            const sortedAisles = [...aisleMap.keys()].sort((a, b) => {
              if (a === "__rack_only__") return -1;
              if (b === "__rack_only__") return 1;
              return a.localeCompare(b, undefined, { numeric: true });
            });

            return (
              <div className="flex gap-4 items-start">
                {/* LEFT: Batch list — 60% */}
                <div
                  className={`flex-[3] min-w-0 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  {/* Card header */}
                  <div
                    className={`px-4 py-3 border-b flex items-center gap-3 flex-wrap ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Stock Batches
                        {!batchesLoading && (
                          <span
                            className={`ml-2 text-xs font-normal ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                          >
                            {filteredBatches.length}
                            {batches.length !== filteredBatches.length ? ` of ${batches.length}` : ""}
                          </span>
                        )}
                      </h3>
                    </div>
                    {categories.length > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCategoryFilter("")}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            categoryFilter === ""
                              ? "bg-teal-600 border-teal-600 text-white"
                              : isDarkMode
                                ? "border-gray-600 text-gray-400 hover:border-teal-500 hover:text-teal-400"
                                : "border-gray-300 text-gray-500 hover:border-teal-500 hover:text-teal-600"
                          }`}
                        >
                          All
                        </button>
                        {categories.map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              categoryFilter === cat
                                ? "bg-teal-600 border-teal-600 text-white"
                                : isDarkMode
                                  ? "border-gray-600 text-gray-400 hover:border-teal-500 hover:text-teal-400"
                                  : "border-gray-300 text-gray-500 hover:border-teal-500 hover:text-teal-600"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
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
                  ) : filteredBatches.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        No batches match this category
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Column header */}
                      <div
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b ${isDarkMode ? "border-gray-700 text-gray-500" : "border-gray-100 text-gray-400"}`}
                      >
                        <span className="w-28 shrink-0">Batch</span>
                        <span className="flex-1 min-w-0">Product</span>
                        <span className="w-24 text-right shrink-0">Qty</span>
                        <span className="w-20 text-right shrink-0">Wt (kg)</span>
                        <span className="w-36 text-right shrink-0">Location</span>
                      </div>
                      {/* Compact rows */}
                      <div className={`divide-y ${isDarkMode ? "divide-gray-700/50" : "divide-gray-50"}`}>
                        {filteredBatches.map((batch) => (
                          <div
                            key={batch.id}
                            className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? "hover:bg-gray-800/40" : "hover:bg-gray-50"}`}
                          >
                            {/* Batch number */}
                            <span
                              className={`w-28 shrink-0 font-mono text-xs truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                              title={batch.batchNumber || `#${batch.id}`}
                            >
                              {batch.batchNumber || `#${batch.id}`}
                            </span>
                            {/* Product */}
                            <span
                              className={`flex-1 min-w-0 text-xs font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                            >
                              {batch.productDisplayName || batch.productUniqueName}
                            </span>
                            {/* Primary qty — null means untracked (show —), 0 means sold out */}
                            <span
                              className={`w-24 text-right shrink-0 text-xs tabular-nums ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                            >
                              {batch.pcsRemaining !== null && batch.pcsRemaining !== undefined
                                ? `${batch.pcsRemaining} pcs`
                                : "—"}
                            </span>
                            {/* Derived weight (PCS × unit_weight_kg) */}
                            <span
                              className={`w-20 text-right shrink-0 text-xs tabular-nums ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                            >
                              {batch.unit === "PCS" && batch.weightPerPieceKg
                                ? `${((batch.pcsRemaining || 0) * batch.weightPerPieceKg).toFixed(1)} kg`
                                : "—"}
                            </span>
                            {/* Location + action */}
                            <div className="w-36 shrink-0 flex items-center justify-end gap-1.5">
                              {batch.locationLabel ? (
                                <span className="font-mono text-xs text-teal-400 truncate">
                                  {batch.locationLabel}
                                  {batch.locationIsActive === false && (
                                    <span className="ml-1 text-amber-400 text-[10px]">(inactive)</span>
                                  )}
                                </span>
                              ) : (
                                <span className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Bin Map — 40% */}
                <div
                  className={`flex-[2] shrink-0 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <h3 className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>Bin Map</h3>
                    {binMapLocations.length > 0 && (
                      <div
                        className={`flex items-center gap-3 mt-1 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded-sm bg-teal-500" /> Occupied
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-sm ${isDarkMode ? "bg-red-900/60" : "bg-red-100"}`}
                          />{" "}
                          Empty
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-sm ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
                          />{" "}
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>

                  {batchesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className={`w-5 h-5 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                    </div>
                  ) : binMapLocations.length === 0 ? (
                    <div className="py-10 text-center px-4">
                      <MapPin className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-gray-700" : "text-gray-300"}`} />
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        No bin locations configured
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                      {sortedAisles.map((aisleKey) => {
                        const rackMap = aisleMap.get(aisleKey);
                        const isRackOnly = aisleKey === "__rack_only__";
                        const sortedRacks = [...rackMap.keys()].sort((a, b) =>
                          a.localeCompare(b, undefined, { numeric: true })
                        );
                        return (
                          <div key={aisleKey}>
                            {!isRackOnly && (
                              <div
                                className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                              >
                                Aisle {aisleKey}
                              </div>
                            )}
                            <div className="space-y-1.5">
                              {sortedRacks.map((rack) => {
                                const bins = rackMap.get(rack);
                                return (
                                  <div key={rack} className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] font-mono w-8 shrink-0 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                                    >
                                      {rack}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {bins
                                        .sort((a, b) => a.bin.localeCompare(b.bin, undefined, { numeric: true }))
                                        .map((loc) => {
                                          const active = loc.isActive || loc.is_active;
                                          const occupied = occupiedLocIds.has(loc.id);
                                          const occupiedBatch = locBatchMap[loc.id];
                                          const title = occupied
                                            ? `${loc.label}: ${occupiedBatch?.batchNumber || ""} — ${occupiedBatch?.productDisplayName || ""}`
                                            : active
                                              ? `${loc.label}: Empty`
                                              : `${loc.label}: Inactive`;
                                          return (
                                            <div
                                              key={loc.id}
                                              title={title}
                                              className={`w-7 h-5 rounded-sm text-[9px] flex items-center justify-center font-mono cursor-default transition-colors ${
                                                occupied
                                                  ? "bg-teal-500 text-white"
                                                  : active
                                                    ? isDarkMode
                                                      ? "bg-red-900/60 text-red-400"
                                                      : "bg-red-100 text-red-400"
                                                    : isDarkMode
                                                      ? "bg-gray-800 text-gray-600"
                                                      : "bg-gray-100 text-gray-400"
                                              }`}
                                            >
                                              {loc.bin}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {/* Summary footer */}
                      <div
                        className={`pt-2 border-t text-xs flex gap-4 ${isDarkMode ? "border-gray-700 text-gray-500" : "border-gray-100 text-gray-400"}`}
                      >
                        <span>{occupiedLocIds.size} occupied</span>
                        <span>
                          {
                            binMapLocations.filter((l) => (l.isActive || l.is_active) && !occupiedLocIds.has(l.id))
                              .length
                          }{" "}
                          free
                        </span>
                        <span>{binMapLocations.length} total</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        {activeTab === "locations" && (
          <div className="space-y-6">
            {/* Generate section + Help card */}
            <div className="flex gap-4 items-start">
              <div
                className={`flex-1 min-w-0 rounded-lg border p-5 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3
                  className={`text-sm font-semibold mb-4 uppercase tracking-wide ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  {locTabData.length > 0 ? "Add / Append Bins" : "Generate Locations"}
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
                            const key = `A0-R${ri + 1}`;
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
                                  <span
                                    className={`text-xs font-mono ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                                  >
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
                    {genLoading ? "Adding..." : locTabData.length > 0 ? "Append Bins" : "Generate"}
                  </button>
                </div>

                {genResult && (
                  <p className={`mt-3 text-sm ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                    ✓ Generated {genResult.generated} new, {genResult.skipped} skipped (of {genResult.total} total)
                  </p>
                )}
              </div>

              {/* Help card */}
              <div
                className={`w-64 flex-shrink-0 rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h4
                  className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <HelpCircle size={13} className="text-teal-500" />
                  How it works
                </h4>
                <ul className={`space-y-2.5 text-xs leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <li>
                    Set <strong className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Aisles</strong>,{" "}
                    <strong className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Racks/Aisle</strong>, and{" "}
                    <strong className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Bins/Rack</strong>, then click{" "}
                    <strong className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Generate</strong> to create all
                    bin locations at once.
                  </li>
                  <li>Use the override grid to give specific racks a different bin count.</li>
                  <li>
                    <strong className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Adding more bins later?</strong>{" "}
                    Just increase the count and click{" "}
                    <strong className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Append Bins</strong> — existing
                    locations are preserved. Only new ones are created.
                  </li>
                </ul>
              </div>
            </div>
            {/* end flex row */}

            {/* Existing locations table */}
            <div
              className={`rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
            >
              {(() => {
                // Derive available aisles + racks from data
                const allAisles = [...new Set(locTabData.map((l) => l.aisle || "__rack_only__"))].sort((a, b) => {
                  const la = a === "__rack_only__" ? "A0" : a;
                  const lb = b === "__rack_only__" ? "A0" : b;
                  return la.localeCompare(lb, undefined, { numeric: true });
                });
                const availableRacks =
                  filterAisles.length > 0
                    ? [
                        ...new Set(
                          locTabData.filter((l) => filterAisles.includes(l.aisle || "__rack_only__")).map((l) => l.rack)
                        ),
                      ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                    : [];

                // Filtered data for count + scoped clear
                const filteredData = locTabData.filter((l) => {
                  const aisleKey = l.aisle || "__rack_only__";
                  if (filterAisles.length > 0 && !filterAisles.includes(aisleKey)) return false;
                  if (filterRacks.length > 0 && !filterRacks.includes(l.rack)) return false;
                  return true;
                });

                // Scoped clear label
                const clearLabel = (() => {
                  if (filterAisles.length === 0) return "Clear All";
                  const aisleNames = filterAisles.map((a) => (a === "__rack_only__" ? "A0" : a)).join(", ");
                  if (filterRacks.length === 0) return `Clear Aisle ${aisleNames}`;
                  return `Clear Aisle ${aisleNames} · ${filterRacks.join(", ")}`;
                })();

                // Confirm message with count
                const confirmMsg = (() => {
                  if (filterAisles.length === 0) return `Delete all ${filteredData.length} locations?`;
                  const aisleNames = filterAisles.map((a) => (a === "__rack_only__" ? "A0" : a)).join(" & ");
                  if (filterRacks.length === 0) return `Delete all ${filteredData.length} bins in Aisle ${aisleNames}?`;
                  return `Delete all ${filteredData.length} bins in Aisle ${aisleNames} · ${filterRacks.join(", ")}?`;
                })();

                const toggleAisle = (a) => {
                  setFilterAisles((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
                  setFilterRacks([]);
                };
                const toggleRack = (r) =>
                  setFilterRacks((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

                return (
                  <>
                    {/* Header row */}
                    <div
                      className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Existing Locations ({locTabData.length})
                        {filteredData.length !== locTabData.length && (
                          <span
                            className={`ml-2 text-xs font-normal ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            · {filteredData.length} shown
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {filteredData.length > 0 && !clearConfirm && (
                          <button
                            type="button"
                            onClick={() => setClearConfirm(true)}
                            className="flex items-center gap-1 text-sm px-3 py-1.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                          >
                            {clearLabel}
                          </button>
                        )}
                        {clearConfirm && (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                              {confirmMsg}
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

                    {/* Filter chips row */}
                    {allAisles.length > 0 && (
                      <div
                        className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b ${isDarkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-100 bg-gray-50"}`}
                      >
                        {/* Aisle chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-medium mr-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Aisle:
                          </span>
                          {allAisles.map((a) => {
                            const label = a === "__rack_only__" ? "A0" : a;
                            const active = filterAisles.includes(a);
                            return (
                              <button
                                key={a}
                                type="button"
                                onClick={() => toggleAisle(a)}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-teal-600 border-teal-600 text-white" : isDarkMode ? "border-gray-600 text-gray-300 hover:border-teal-500" : "border-gray-300 text-gray-600 hover:border-teal-500"}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Rack chips — only when aisle selected */}
                        {filterAisles.length > 0 && availableRacks.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs font-medium mr-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              Rack:
                            </span>
                            {availableRacks.map((r) => {
                              const active = filterRacks.includes(r);
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => toggleRack(r)}
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-teal-600 border-teal-600 text-white" : isDarkMode ? "border-gray-600 text-gray-300 hover:border-teal-500" : "border-gray-300 text-gray-600 hover:border-teal-500"}`}
                                >
                                  {r}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Clear filters */}
                        {(filterAisles.length > 0 || filterRacks.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilterAisles([]);
                              setFilterRacks([]);
                            }}
                            className={`text-xs underline ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

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
                    No locations yet. Use "Generate Locations" above or add manually.
                  </p>
                </div>
              ) : (
                (() => {
                  // Apply active filters
                  const visibleData = locTabData.filter((l) => {
                    const aisleKey = l.aisle || "__rack_only__";
                    if (filterAisles.length > 0 && !filterAisles.includes(aisleKey)) return false;
                    if (filterRacks.length > 0 && !filterRacks.includes(l.rack)) return false;
                    return true;
                  });
                  // Group locations by aisle → rack
                  const aisleMap = new Map();
                  for (const loc of visibleData) {
                    const aisleKey = loc.aisle || "__rack_only__";
                    if (!aisleMap.has(aisleKey)) aisleMap.set(aisleKey, new Map());
                    const rackMap = aisleMap.get(aisleKey);
                    if (!rackMap.has(loc.rack)) rackMap.set(loc.rack, []);
                    rackMap.get(loc.rack).push(loc);
                  }
                  const sortedAisles = [...aisleMap.keys()].sort((a, b) => {
                    const labelA = a === "__rack_only__" ? "A0" : a;
                    const labelB = b === "__rack_only__" ? "A0" : b;
                    return labelA.localeCompare(labelB, undefined, { numeric: true });
                  });
                  return (
                    <div className="p-4 space-y-5">
                      {sortedAisles.map((aisleKey) => {
                        const rackMap = aisleMap.get(aisleKey);
                        const isRackOnly = aisleKey === "__rack_only__";
                        const aisleLabel = isRackOnly ? "A0" : aisleKey;
                        const sortedRacks = [...rackMap.keys()].sort((a, b) =>
                          a.localeCompare(b, undefined, { numeric: true })
                        );
                        return (
                          <div key={aisleKey}>
                            <div
                              className={`text-xs font-semibold uppercase tracking-widest mb-2 pb-1 border-b ${isDarkMode ? "text-gray-400 border-gray-700" : "text-gray-500 border-gray-200"}`}
                            >
                              Aisle {aisleLabel}
                            </div>
                            <div className="space-y-3">
                              {sortedRacks.map((rack) => {
                                const bins = rackMap.get(rack);
                                return (
                                  <div key={rack} className="flex items-start gap-3">
                                    <div
                                      className={`text-xs font-mono font-medium w-10 pt-1 shrink-0 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                      {rack}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(() => {
                                        const sortedBins = [...bins].sort((a, b) =>
                                          a.bin.localeCompare(b.bin, undefined, { numeric: true })
                                        );
                                        const binMap = new Map(sortedBins.map((l) => [l.bin, l]));
                                        // Compute full B1..Bmax range to preserve gaps where bins were deleted
                                        const maxBinNum = sortedBins.reduce((max, l) => {
                                          const n = parseInt(l.bin.replace(/\D/g, ""), 10);
                                          return n > max ? n : max;
                                        }, 0);
                                        const slots = Array.from({ length: maxBinNum }, (_, i) => `B${i + 1}`);
                                        return slots.map((binLabel) => {
                                          const loc = binMap.get(binLabel);
                                          if (!loc) {
                                            // Empty slot — bin was deleted, preserve the space
                                            return (
                                              <div
                                                key={binLabel}
                                                title="Empty slot (bin deleted)"
                                                className={`text-sm px-3 py-1.5 rounded font-mono border border-dashed ${
                                                  isDarkMode
                                                    ? "border-gray-700 text-gray-700"
                                                    : "border-gray-200 text-gray-300"
                                                }`}
                                              >
                                                {binLabel}
                                              </div>
                                            );
                                          }
                                          const active = loc.isActive || loc.is_active;
                                          const selected = selectedLocs.has(loc.id);
                                          return (
                                            <div key={loc.id} className="group relative">
                                              <button
                                                type="button"
                                                title={
                                                  selected
                                                    ? "Click to deselect"
                                                    : active
                                                      ? "Click to select"
                                                      : "Inactive — click to select"
                                                }
                                                onClick={() => {
                                                  setSelectedLocs((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(loc.id)) next.delete(loc.id);
                                                    else next.add(loc.id);
                                                    return next;
                                                  });
                                                }}
                                                className={`text-sm px-3 py-1.5 pr-7 rounded font-mono border transition-all ${
                                                  selected
                                                    ? "border-red-500 bg-red-500/10 text-red-500 ring-1 ring-red-500/40"
                                                    : active
                                                      ? isDarkMode
                                                        ? "border-teal-700 bg-teal-900/20 text-teal-400 hover:border-teal-500"
                                                        : "border-teal-300 bg-teal-50 text-teal-700 hover:border-teal-500"
                                                      : isDarkMode
                                                        ? "border-gray-700 bg-gray-800/40 text-gray-500 hover:border-gray-600"
                                                        : "border-gray-200 bg-gray-100 text-gray-400 hover:border-gray-400"
                                                }`}
                                              >
                                                {loc.bin}
                                              </button>
                                              <button
                                                type="button"
                                                title={active ? "Deactivate" : "Reactivate"}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleToggleLocActive(loc);
                                                }}
                                                className={`absolute top-0 right-0 bottom-0 px-1.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity rounded-r border-l ${
                                                  active
                                                    ? isDarkMode
                                                      ? "border-teal-700 text-red-400 hover:bg-red-900/30"
                                                      : "border-teal-300 text-red-500 hover:bg-red-50"
                                                    : isDarkMode
                                                      ? "border-gray-700 text-teal-400 hover:bg-teal-900/30"
                                                      : "border-gray-200 text-teal-600 hover:bg-teal-50"
                                                }`}
                                              >
                                                <Power className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {/* Legend */}
                      <div
                        className={`flex items-center gap-4 pt-2 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-5 h-4 rounded border ${isDarkMode ? "border-teal-700 bg-teal-900/20" : "border-teal-300 bg-teal-50"}`}
                          />
                          Active
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-5 h-4 rounded border ${isDarkMode ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-gray-100"}`}
                          />
                          Inactive
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-5 h-4 rounded border border-red-500 bg-red-500/10" />
                          Selected
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-5 h-4 rounded border border-dashed ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                          />
                          Empty slot
                        </span>
                      </div>
                    </div>
                  );
                })()
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
