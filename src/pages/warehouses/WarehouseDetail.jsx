/**
 * WarehouseDetail Page
 * Dashboard view for a single warehouse with tabs for Overview, Stock, Activity
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Package,
  Activity,
  Edit,
  RefreshCw,
  Phone,
  Mail,
  User,
  Building,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { warehouseService } from "../../services/warehouseService";
import { notificationService } from "../../services/notificationService";
import WarehouseFormDialog from "../../components/warehouses/WarehouseFormDialog";
import WarehouseStockView from "../../components/warehouses/WarehouseStockView";

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // State
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Dashboard stats (would come from API)
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

  // Fetch warehouse and dashboard data
  const fetchWarehouse = useCallback(async () => {
    try {
      setLoading(true);
      const data = await warehouseService.getById(id);
      setWarehouse(data);

      // Fetch dashboard data from API
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

      // Map recent activities from API
      const activities = (dashboardData.recentActivities || []).map(
        (activity, index) => ({
          id: activity.id || index,
          type: activity.type || "IN",
          product:
            activity.productName || activity.description || "Unknown Product",
          quantity: `${parseFloat(activity.quantity || 0).toLocaleString()} KG`,
          time: activity.timestamp
            ? new Date(activity.timestamp).toLocaleString()
            : "Unknown",
          reference: activity.reference || "",
        }),
      );
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      notificationService.error("Failed to load warehouse");
      navigate("/warehouses");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchWarehouse();
  }, [fetchWarehouse]);

  // Handlers
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

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

  const tabs = [
    { id: "overview", label: "Overview", icon: MapPin },
    { id: "stock", label: "Stock", icon: Package },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  const getMovementTypeStyle = (type) => {
    switch (type) {
      case "IN":
        return {
          icon: TrendingUp,
          color: "text-green-500",
          bg: isDarkMode ? "bg-green-900/30" : "bg-green-100",
        };
      case "OUT":
        return {
          icon: TrendingDown,
          color: "text-red-500",
          bg: isDarkMode ? "bg-red-900/30" : "bg-red-100",
        };
      case "TRANSFER":
        return {
          icon: ArrowRight,
          color: "text-blue-500",
          bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-100",
        };
      default:
        return {
          icon: Activity,
          color: "text-gray-500",
          bg: isDarkMode ? "bg-gray-700" : "bg-gray-100",
        };
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-gray-50"}`}
      >
        <RefreshCw
          className={`w-8 h-8 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
        />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <AlertTriangle
            className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
          />
          <h2
            className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Warehouse not found
          </h2>
          <Link
            to="/warehouses"
            className="text-teal-500 hover:underline mt-2 inline-block"
          >
            Back to Warehouses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-gray-50"}`}
    >
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-[#1E2328]" : "bg-white"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/warehouses")}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft
                  className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                />
              </button>

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}
                >
                  <MapPin
                    className={`w-6 h-6 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1
                      className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
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
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {warehouse.code} •{" "}
                    {[warehouse.city, warehouse.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
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
                {
                  label: "Total Stock",
                  value: stats.totalQuantity.toLocaleString(),
                  unit: "items",
                  color: "teal",
                },
                {
                  label: "Reserved",
                  value: stats.reservedQuantity.toLocaleString(),
                  unit: "items",
                  color: "blue",
                },
                {
                  label: "Available",
                  value: stats.availableQuantity.toLocaleString(),
                  unit: "items",
                  color: "green",
                },
                {
                  label: "Low Stock Alerts",
                  value: stats.lowStockCount,
                  unit: "products",
                  color: stats.lowStockCount > 0 ? "red" : "gray",
                },
              ].map((kpi, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    isDarkMode
                      ? "bg-[#1E2328] border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
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
                  <p
                    className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                  >
                    {kpi.unit}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3
                  className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    to={`/stock-movements?tab=transfers&source=${warehouse.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Create Transfer
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    />
                  </Link>
                  <Link
                    to={`/stock-movements?warehouse_id=${warehouse.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      View All Movements
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    />
                  </Link>
                  <Link
                    to={`/inventory?warehouse_id=${warehouse.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      View Inventory
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    />
                  </Link>
                </div>
              </div>

              {/* Warehouse Info */}
              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3
                  className={`text-sm font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Warehouse Info
                </h3>
                <div className="space-y-3">
                  {warehouse.address && (
                    <div className="flex items-start gap-2">
                      <Building
                        className={`w-4 h-4 mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {warehouse.address}
                      </span>
                    </div>
                  )}
                  {warehouse.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User
                        className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {warehouse.contactPerson}
                      </span>
                    </div>
                  )}
                  {warehouse.phone && (
                    <div className="flex items-center gap-2">
                      <Phone
                        className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {warehouse.phone}
                      </span>
                    </div>
                  )}
                  {warehouse.email && (
                    <div className="flex items-center gap-2">
                      <Mail
                        className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {warehouse.email}
                      </span>
                    </div>
                  )}
                  {warehouse.capacity > 0 && (
                    <div className="flex items-center gap-2">
                      <Package
                        className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Capacity: {warehouse.capacity.toLocaleString()}{" "}
                        {warehouse.capacityUnit || "MT"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
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
                          <p
                            className={`text-xs truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {activity.product}
                          </p>
                          <p
                            className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                          >
                            {activity.quantity} • {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Utilization */}
            {warehouse.capacity > 0 && (
              <div
                className={`rounded-lg border p-4 ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
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
                <div
                  className={`h-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      stats.utilizationPercent >= 90
                        ? "bg-red-500"
                        : stats.utilizationPercent >= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(stats.utilizationPercent, 100)}%`,
                    }}
                  />
                </div>
                <p
                  className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                >
                  {stats.totalQuantity.toLocaleString()} of{" "}
                  {warehouse.capacity.toLocaleString()}{" "}
                  {warehouse.capacityUnit || "MT"} used
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stock" && (
          <WarehouseStockView warehouseId={id} warehouseName={warehouse.name} />
        )}

        {activeTab === "activity" && (
          <div
            className={`rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
              <h3
                className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Stock Movement History
              </h3>
              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Recent stock movements for this warehouse
              </p>
            </div>
            <div className="divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
              {recentActivity.map((activity) => {
                const style = getMovementTypeStyle(activity.type);
                const Icon = style.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className={`p-2 rounded-lg ${style.bg}`}>
                      <Icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {activity.product}
                      </p>
                      <p
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {activity.type} • {activity.quantity} • Ref:{" "}
                        {activity.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
              <Link
                to={`/stock-movements?warehouse_id=${warehouse.id}`}
                className="text-teal-500 hover:underline text-sm"
              >
                View all movements →
              </Link>
            </div>
          </div>
        )}
      </div>

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
