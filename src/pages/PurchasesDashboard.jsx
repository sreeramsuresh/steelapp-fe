/**
 * PurchasesDashboard.jsx
 *
 * Unified dashboard for all purchasing activities:
 * - Purchase Orders
 * - Vendor Bills (purchase invoices)
 * - Debit Notes (adjustments to vendor bills)
 * - Advance Payments (supplier deposits)
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  ShoppingCart,
  FileText,
  Receipt,
  FileMinus,
  Coins,
} from "lucide-react";

import PurchaseOrderList from "./PurchaseOrderList";
import { VendorBillList, DebitNoteList } from "./purchases";
import { AdvancePaymentList } from "./payments";

const PurchasesDashboard = () => {
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("purchase-orders");

  // Auto-open tab if navigated with tab parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "purchase-orders",
        "vendor-bills",
        "debit-notes",
        "advance-payments",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    {
      id: "purchase-orders",
      label: "Purchase Orders",
      icon: ShoppingCart,
      component: PurchaseOrderList,
    },
    {
      id: "vendor-bills",
      label: "Vendor Bills",
      icon: Receipt,
      component: VendorBillList,
    },
    {
      id: "debit-notes",
      label: "Debit Notes",
      icon: FileMinus,
      component: DebitNoteList,
    },
    {
      id: "advance-payments",
      label: "Advance Payments",
      icon: Coins,
      component: AdvancePaymentList,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
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
              <h1
                className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                🛒 Purchases Dashboard
              </h1>
              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Manage purchase orders, vendor bills, debit notes, and advance
                payments
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
        {ActiveComponent && (
          <ActiveComponent
            preSelectedSupplierId={searchParams.get("supplierId")}
            preSelectedSupplierName={searchParams.get("supplierName")}
            preSelectedPurchaseOrderId={searchParams.get("purchaseOrderId")}
          />
        )}
      </div>
    </div>
  );
};

export default PurchasesDashboard;
