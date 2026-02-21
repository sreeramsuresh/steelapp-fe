import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Award,
  BarChart3,
  CreditCard,
  DollarSign,
  Globe,
  Scroll,
  Ship,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ImportExportOverview from "../components/ImportExportOverview";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import CountriesList from "./CountriesList";
import CustomsDocumentList from "./CustomsDocumentList";
import ExchangeRateList from "./ExchangeRateList";
import ExportOrderList from "./ExportOrderList";
// Import the existing components
import ImportOrderList from "./ImportOrderList";
import MaterialCertificateList from "./MaterialCertificateList";
import ShippingDocumentList from "./ShippingDocumentList";
import TradeFinanceList from "./TradeFinanceList";

const VALID_TABS = [
  "overview",
  "import-orders",
  "export-orders",
  "shipping",
  "certificates",
  "customs",
  "finance",
  "rates",
  "exchange-rates",
  "countries",
];

const ImportExportDashboard = () => {
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize activeTab from URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    // Support "exchange-rates" as alias for "rates"
    const normalizedTab = tabParam === "exchange-rates" ? "rates" : tabParam;
    if (normalizedTab && VALID_TABS.includes(normalizedTab)) {
      return normalizedTab;
    }
    return "overview";
  });

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const normalizedTab = tabParam === "exchange-rates" ? "rates" : tabParam;
    if (normalizedTab && VALID_TABS.includes(normalizedTab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(normalizedTab);
    }
  }, [searchParams]);

  const allTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      component: ImportExportOverview,
    },
    {
      id: "import-orders",
      label: "Import Orders",
      icon: ArrowDownToLine,
      component: ImportOrderList,
    },
    {
      id: "export-orders",
      label: "Export Orders",
      icon: ArrowUpFromLine,
      component: ExportOrderList,
      permission: ["export_orders", "read"],
    },
    {
      id: "shipping",
      label: "Shipping",
      icon: Ship,
      component: ShippingDocumentList,
      permission: ["shipping_documents", "read"],
    },
    {
      id: "certificates",
      label: "Certificates",
      icon: Award,
      component: MaterialCertificateList,
      permission: ["material_certificates", "read"],
    },
    {
      id: "customs",
      label: "Customs",
      icon: Scroll,
      component: CustomsDocumentList,
      permission: ["customs_documents", "read"],
    },
    {
      id: "finance",
      label: "Trade Finance",
      icon: CreditCard,
      component: TradeFinanceList,
      permission: ["trade_finance", "read"],
    },
    {
      id: "rates",
      label: "Exchange Rates",
      icon: DollarSign,
      component: ExchangeRateList,
      permission: ["exchange_rates", "read"],
    },
    {
      id: "countries",
      label: "Countries & Ports",
      icon: Globe,
      component: CountriesList,
    },
  ];
  const tabs = allTabs.filter((tab) => !tab.permission || authService.hasPermission(...tab.permission));
  const effectiveTab = tabs.find((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id;

  const ActiveComponent = tabs.find((tab) => tab.id === effectiveTab)?.component;

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
            <div className="p-2 bg-teal-600 rounded-lg">
              <Ship className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                🚢 Import / Export Operations
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage your international trade operations
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div role="tablist" aria-label="Import/Export sections" className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;

              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id }, { replace: true });
                  }}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? `border-teal-600 ${isDarkMode ? "bg-gray-700 text-teal-400" : "bg-gray-50 text-teal-600"}`
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

export default ImportExportDashboard;
