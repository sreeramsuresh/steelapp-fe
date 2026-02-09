import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, FileCheck, Ship, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { exportOrderService } from "../services/exportOrderService";
import { importOrderService } from "../services/importOrderService";
import { materialCertificateService } from "../services/materialCertificateService";
import { shippingDocumentService } from "../services/shippingDocumentService";

const ImportExportOverview = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    importOrders: {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0,
    },
    exportOrders: {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0,
    },
    shipments: {
      inTransit: 0,
      arrived: 0,
      pending: 0,
    },
    certificates: {
      pending: 0,
      verified: 0,
      expiring: 0,
    },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all data in parallel
        const [importData, exportData, shippingData, certData] = await Promise.all([
          importOrderService.getImportOrders({ limit: 100 }).catch(() => ({ orders: [], pagination: {} })),
          exportOrderService.getExportOrders({ limit: 100 }).catch(() => ({ orders: [], pagination: {} })),
          shippingDocumentService.getShippingDocuments({ limit: 100 }).catch(() => ({ documents: [], pagination: {} })),
          materialCertificateService
            .getMaterialCertificates({ limit: 100 })
            .catch(() => ({ certificates: [], pagination: {} })),
        ]);

        // Calculate import order stats
        const importOrders = importData.orders || [];
        const importActive = importOrders.filter((o) =>
          ["confirmed", "shipped", "in_transit"].includes(o.status)
        ).length;
        const importPending = importOrders.filter((o) => o.status === "draft").length;
        const importCompleted = importOrders.filter((o) => o.status === "completed").length;

        // Calculate export order stats
        const exportOrders = exportData.orders || [];
        const exportActive = exportOrders.filter((o) =>
          ["confirmed", "shipped", "in_transit"].includes(o.status)
        ).length;
        const exportPending = exportOrders.filter((o) => o.status === "draft").length;
        const exportCompleted = exportOrders.filter((o) => o.status === "completed").length;

        // Calculate shipment stats
        const shipments = shippingData.documents || [];
        const inTransit = shipments.filter((s) => s.status === "in_transit").length;
        const arrived = shipments.filter((s) => s.status === "arrived").length;
        const shipPending = shipments.filter((s) => s.status === "draft" || s.status === "pending").length;

        // Calculate certificate stats
        const certificates = certData.certificates || [];
        const certPending = certificates.filter((c) => c.verificationStatus === "pending").length;
        const certVerified = certificates.filter((c) => c.verificationStatus === "verified").length;
        // Check for certificates expiring within 30 days
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiring = certificates.filter((c) => {
          if (!c.expiryDate) return false;
          const expiry = new Date(c.expiryDate);
          return expiry > now && expiry <= thirtyDaysFromNow;
        }).length;

        // Build recent activity from latest records
        const activity = [];
        if (importOrders.length > 0) {
          const latest = importOrders[0];
          activity.push({
            color: "green",
            text: `Import Order ${latest.importOrderNumber} - ${latest.status}`,
            time: latest.audit?.updatedAt ? new Date(latest.audit.updatedAt).toLocaleDateString() : "Recently",
          });
        }
        if (exportOrders.length > 0) {
          const latest = exportOrders[0];
          activity.push({
            color: "blue",
            text: `Export Order ${latest.exportOrderNumber} - ${latest.status}`,
            time: latest.audit?.updatedAt ? new Date(latest.audit.updatedAt).toLocaleDateString() : "Recently",
          });
        }
        if (certificates.length > 0) {
          const latest = certificates[0];
          activity.push({
            color: "orange",
            text: `Certificate ${latest.certificateNumber} - ${latest.verificationStatus}`,
            time: latest.audit?.updatedAt ? new Date(latest.audit.updatedAt).toLocaleDateString() : "Recently",
          });
        }

        setStats({
          importOrders: {
            total: importOrders.length,
            active: importActive,
            pending: importPending,
            completed: importCompleted,
          },
          exportOrders: {
            total: exportOrders.length,
            active: exportActive,
            pending: exportPending,
            completed: exportCompleted,
          },
          shipments: {
            inTransit,
            arrived,
            pending: shipPending,
          },
          certificates: {
            pending: certPending,
            verified: certVerified,
            expiring,
          },
        });
        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching overview stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, link, sublabel }) => (
    <Link
      to={link}
      className={`${
        isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
      } p-4 rounded-lg shadow-sm transition-colors border ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      } hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{title}</p>
          <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {loading ? "..." : value}
          </p>
          {sublabel && <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{sublabel}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Link>
  );

  const QuickActionCard = ({ title, description, icon: Icon, link, color }) => (
    <Link
      to={link}
      className={`${
        isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
      } p-4 rounded-lg shadow-sm transition-colors border ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      } hover:shadow-md`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h4>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Import / Export Overview
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Track your international trade operations
          </p>
        </div>
        <Link to="/app/import-export" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
          View All →
        </Link>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Import Orders"
          value={stats.importOrders.total}
          icon={ArrowDownToLine}
          color="bg-blue-500"
          link="/app/import-export?tab=import-orders"
          sublabel={`${stats.importOrders.active} active`}
        />
        <StatCard
          title="Export Orders"
          value={stats.exportOrders.total}
          icon={ArrowUpFromLine}
          color="bg-green-500"
          link="/app/import-export?tab=export-orders"
          sublabel={`${stats.exportOrders.active} active`}
        />
        <StatCard
          title="Shipments"
          value={stats.shipments.inTransit}
          icon={Ship}
          color="bg-orange-500"
          link="/app/import-export?tab=shipping"
          sublabel="in transit"
        />
        <StatCard
          title="Certificates"
          value={stats.certificates.pending}
          icon={FileCheck}
          color="bg-purple-500"
          link="/app/import-export?tab=certificates"
          sublabel="pending verification"
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div
          className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-4 shadow-sm border ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h3 className={`text-md font-medium mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Recent Activity</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} text-center py-4`}>
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={activity.id || activity.name || `activity-${index}`} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.color === "green" ? "bg-green-500"
                      : activity.color === "blue" ? "bg-blue-500"
                        : "bg-orange-500"
                  }`}></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{activity.text}</p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-4 shadow-sm border ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h3 className={`text-md font-medium mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Quick Actions</h3>
          <div className="space-y-3">
            <QuickActionCard
              title="New Import Order"
              description="Create a new import order"
              icon={ArrowDownToLine}
              link="/app/import-orders/new"
              color="bg-blue-500"
            />
            <QuickActionCard
              title="New Export Order"
              description="Create a new export order"
              icon={ArrowUpFromLine}
              link="/app/export-orders/new"
              color="bg-green-500"
            />
            <QuickActionCard
              title="Track Shipments"
              description="View shipping documents"
              icon={Ship}
              link="/app/import-export?tab=shipping"
              color="bg-orange-500"
            />
            <QuickActionCard
              title="Exchange Rates"
              description="View current rates"
              icon={TrendingUp}
              link="/app/import-export?tab=exchange-rates"
              color="bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {!loading && stats.certificates.expiring > 0 && (
        <div
          className={`${isDarkMode ? "bg-yellow-900/20" : "bg-yellow-50"} border ${
            isDarkMode ? "border-yellow-800" : "border-yellow-200"
          } rounded-lg p-4`}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-yellow-600" />
            <div>
              <h4 className={`text-sm font-medium ${isDarkMode ? "text-yellow-400" : "text-yellow-800"}`}>
                Certificates Expiring Soon
              </h4>
              <p className={`text-xs ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>
                {stats.certificates.expiring} material certificates are expiring within 30 days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExportOverview;
