/**
 * WarehouseSummaryCards Component
 * Displays KPI summary cards at the top of the warehouse list page
 */

import { MapPin, CheckCircle, Package, AlertTriangle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const WarehouseSummaryCards = ({ summary, loading }) => {
  const { isDarkMode } = useTheme();

  const cards = [
    {
      title: "Total Warehouses",
      value: summary.totalWarehouses,
      icon: MapPin,
      color: "teal",
      format: "number",
    },
    {
      title: "Active",
      value: summary.activeWarehouses,
      icon: CheckCircle,
      color: "green",
      format: "number",
    },
    {
      title: "Total Items",
      value: summary.totalInventoryItems,
      icon: Package,
      color: "blue",
      format: "number",
    },
    {
      title: "Low Stock Alerts",
      value: summary.lowStockItems,
      icon: AlertTriangle,
      color: summary.lowStockItems > 0 ? "red" : "gray",
      format: "number",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      teal: {
        bg: isDarkMode ? "bg-teal-900/30" : "bg-teal-100",
        icon: isDarkMode ? "text-teal-400" : "text-teal-600",
        value: isDarkMode ? "text-teal-400" : "text-teal-600",
      },
      green: {
        bg: isDarkMode ? "bg-green-900/30" : "bg-green-100",
        icon: isDarkMode ? "text-green-400" : "text-green-600",
        value: isDarkMode ? "text-green-400" : "text-green-600",
      },
      blue: {
        bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-100",
        icon: isDarkMode ? "text-blue-400" : "text-blue-600",
        value: isDarkMode ? "text-blue-400" : "text-blue-600",
      },
      red: {
        bg: isDarkMode ? "bg-red-900/30" : "bg-red-100",
        icon: isDarkMode ? "text-red-400" : "text-red-600",
        value: isDarkMode ? "text-red-400" : "text-red-600",
      },
      gray: {
        bg: isDarkMode ? "bg-gray-700" : "bg-gray-100",
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
        value: isDarkMode ? "text-gray-400" : "text-gray-500",
      },
    };
    return colors[color] || colors.gray;
  };

  const formatValue = (value, format) => {
    if (loading) return "—";
    if (format === "currency") {
      return new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0);
    }
    return (value || 0).toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);

        return (
          <div
            key={index}
            className={`rounded-lg border p-4 ${
              isDarkMode
                ? "bg-[#1E2328] border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {card.title}
                </p>
                <p className={`mt-1 text-2xl font-bold ${colors.value}`}>
                  {loading ? (
                    <span
                      className={`inline-block w-16 h-7 animate-pulse rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
                    />
                  ) : (
                    formatValue(card.value, card.format)
                  )}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WarehouseSummaryCards;
