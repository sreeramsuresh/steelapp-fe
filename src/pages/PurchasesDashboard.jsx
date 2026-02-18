/**
 * PurchasesDashboard.jsx
 *
 * Unified dashboard for all purchasing activities:
 * - Purchase Orders
 * - Supplier Bills (purchase invoices)
 * - Debit Notes (adjustments to supplier bills)
 * - Advance Payments (supplier deposits)
 */

import { BookOpen, Coins, FileMinus, Receipt, ShoppingCart } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";

import PurchaseOrderList from "./PurchaseOrderList";
import { AdvancePaymentList } from "./payments";
import { DebitNoteList, SupplierBillList } from "./purchases";

const LazySupplierCorrectionGuide = lazy(() =>
  Promise.all([
    import("../components/posted-document-framework/DocumentWorkflowGuide"),
    import("../components/finance/supplierBillCorrectionConfig"),
  ]).then(([guideModule, configModule]) => ({
    default: (props) => <guideModule.default {...props} config={configModule.default} mode="guide" />,
  }))
);

const PurchasesDashboard = () => {
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize activeTab from URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    // Support both supplier-bills and legacy vendor-bills
    const normalizedTab = tabParam === "vendor-bills" ? "supplier-bills" : tabParam;
    if (
      normalizedTab &&
      ["purchase-orders", "supplier-bills", "debit-notes", "advance-payments", "correction-guide"].includes(
        normalizedTab
      )
    ) {
      return normalizedTab;
    }
    return "purchase-orders";
  });

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    // Support both supplier-bills and legacy vendor-bills
    const normalizedTab = tabParam === "vendor-bills" ? "supplier-bills" : tabParam;
    if (
      normalizedTab &&
      ["purchase-orders", "supplier-bills", "debit-notes", "advance-payments", "correction-guide"].includes(
        normalizedTab
      )
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(normalizedTab);
    }
  }, [searchParams]);

  const allTabs = [
    {
      id: "purchase-orders",
      label: "Purchase Orders",
      icon: ShoppingCart,
      component: PurchaseOrderList,
    },
    {
      id: "supplier-bills",
      label: "Supplier Bills",
      icon: Receipt,
      component: SupplierBillList,
      permission: ["supplier_bills", "read"],
    },
    {
      id: "debit-notes",
      label: "Debit Notes",
      icon: FileMinus,
      component: DebitNoteList,
      permission: ["debit_notes", "read"],
    },
    {
      id: "advance-payments",
      label: "Advance Payments",
      icon: Coins,
      component: AdvancePaymentList,
      permission: ["advance_payments", "read"],
    },
    {
      id: "correction-guide",
      label: "Correction Guide",
      icon: BookOpen,
      component: LazySupplierCorrectionGuide,
      isSuspense: true,
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
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                🛒 Purchases Dashboard
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage purchase orders, supplier bills, debit notes, and advance payments
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;

              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id }, { replace: true });
                  }}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors ${
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
      <div className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
          {ActiveComponent && (
            <ActiveComponent
              preSelectedSupplierId={searchParams.get("supplierId")}
              preSelectedSupplierName={searchParams.get("supplierName")}
              preSelectedPurchaseOrderId={searchParams.get("purchaseOrderId")}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default PurchasesDashboard;
