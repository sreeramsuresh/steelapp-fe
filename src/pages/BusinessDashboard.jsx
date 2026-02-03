import { Building, Calculator, Package, Users } from "lucide-react";
import { useState } from "react";
import CustomerManagement from "../components/CustomerManagement";
import PriceCalculator from "../components/PriceCalculator";
import SteelProducts from "../components/SteelProducts";
import { useTheme } from "../contexts/ThemeContext";

const BusinessDashboard = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("customers");

  const tabs = [
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      component: CustomerManagement,
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      component: SteelProducts,
    },
    {
      id: "calculator",
      label: "Price Calculator",
      icon: Calculator,
      component: PriceCalculator,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Business Management
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage customers, products, and pricing
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors ${
                    isActive
                      ? `border-blue-600 ${isDarkMode ? "bg-gray-700 text-blue-400" : "bg-gray-50 text-blue-600"}`
                      : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  );
};

export default BusinessDashboard;
