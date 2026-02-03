/**
 * StockMovementPage
 * Redesigned to align with Import/Export Operations design pattern
 *
 * Features:
 * - Overview dashboard with KPI cards
 * - Left-aligned tabs with teal underline (sentence case)
 * - Recent activity timeline
 * - Quick actions section
 * - Consistent filter bar styling
 */

import { ArrowLeftRight, BarChart3, Bookmark, ClipboardList, Package } from "lucide-react";
import { useState } from "react";
import {
  ReconciliationDashboard,
  ReservationForm,
  ReservationList,
  StockMovementOverview,
  TransferForm,
  TransferList,
} from "../components/stock-movement";
import { useTheme } from "../contexts/ThemeContext";

const StockMovementPage = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");

  // Sub-views for transfers
  const [transferView, setTransferView] = useState("list"); // 'list' | 'create' | 'view'
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Sub-views for reservations
  const [reservationView, setReservationView] = useState("list"); // 'list' | 'create' | 'view'
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Tab definitions - sentence case, matching Import/Export pattern
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
    },
    {
      id: "transfers",
      label: "Transfers",
      icon: ArrowLeftRight,
    },
    {
      id: "reservations",
      label: "Reservations",
      icon: Bookmark,
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      icon: ClipboardList,
    },
  ];

  // Handle navigation from overview to specific tabs
  const handleNavigateToTab = (tabId, action) => {
    setActiveTab(tabId);

    if (tabId === "transfers") {
      if (action === "create") {
        setTransferView("create");
      } else {
        setTransferView("list");
      }
    }

    if (tabId === "reconciliation" && action === "audit") {
      // ReconciliationDashboard has its own internal tabs, we can&apos;t control them from here
      // But navigating to reconciliation tab is the correct behavior
    }
  };

  // Handle transfer navigation
  const handleTransferCreateNew = () => {
    setTransferView("create");
  };

  const handleTransferCreated = () => {
    setTransferView("list");
  };

  const handleTransferCancel = () => {
    setTransferView("list");
    setSelectedTransfer(null);
  };

  const handleViewTransfer = (transfer) => {
    setSelectedTransfer(transfer);
    setTransferView("view");
  };

  // Handle reservation navigation
  const handleReservationCreateNew = () => {
    setReservationView("create");
  };

  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setReservationView("view");
  };

  const handleReservationCreated = () => {
    setReservationView("list");
  };

  const handleReservationCancel = () => {
    setReservationView("list");
    setSelectedReservation(null);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <StockMovementOverview onNavigateToTab={handleNavigateToTab} />;

      case "transfers":
        if (transferView === "create") {
          return <TransferForm onCancel={handleTransferCancel} onSuccess={handleTransferCreated} />;
        }
        if (transferView === "view" && selectedTransfer) {
          return (
            <div
              className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-sm border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Transfer Details: {selectedTransfer.transferNumber}
              </h3>
              <div className="space-y-2">
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  <strong>Status:</strong> {selectedTransfer.status}
                </p>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  <strong>From:</strong> {selectedTransfer.sourceWarehouseName}
                </p>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  <strong>To:</strong> {selectedTransfer.destinationWarehouseName}
                </p>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  <strong>Items:</strong> {selectedTransfer.items?.length || 0}
                </p>
                {selectedTransfer.notes && (
                  <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    <strong>Notes:</strong> {selectedTransfer.notes}
                  </p>
                )}
              </div>
              <button
                onClick={handleTransferCancel}
                className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Back to List
              </button>
            </div>
          );
        }
        return <TransferList onCreateNew={handleTransferCreateNew} onViewTransfer={handleViewTransfer} />;

      case "reservations":
        if (reservationView === "create") {
          return <ReservationForm open={true} onClose={handleReservationCancel} onSuccess={handleReservationCreated} />;
        }
        if (reservationView === "view" && selectedReservation) {
          return (
            <div
              className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-sm border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Reservation Details: {selectedReservation.reservationNumber}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Product
                    </span>
                    <p className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {selectedReservation.productName}
                    </p>
                    {selectedReservation.productSku && (
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        SKU: {selectedReservation.productSku}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Warehouse
                    </span>
                    <p className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {selectedReservation.warehouseName}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Status
                    </span>
                    <p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                          selectedReservation.status === "ACTIVE"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : selectedReservation.status === "FULFILLED"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : selectedReservation.status === "PARTIALLY_FULFILLED"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : selectedReservation.status === "EXPIRED"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {selectedReservation.status}
                      </span>
                    </p>
                  </div>
                  {selectedReservation.referenceNumber && (
                    <div>
                      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Reference
                      </span>
                      <p className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {selectedReservation.referenceType}: {selectedReservation.referenceNumber}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Quantity Reserved
                    </span>
                    <p className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {parseFloat(selectedReservation.quantityReserved).toFixed(2)} {selectedReservation.unit}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Quantity Fulfilled
                    </span>
                    <p className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {parseFloat(selectedReservation.quantityFulfilled).toFixed(2)} {selectedReservation.unit}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Quantity Remaining
                    </span>
                    <p className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {parseFloat(selectedReservation.quantityRemaining).toFixed(2)} {selectedReservation.unit}
                    </p>
                  </div>
                  {selectedReservation.expiryDate && (
                    <div>
                      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Expiry Date
                      </span>
                      <p className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {new Date(selectedReservation.expiryDate.seconds * 1000).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-6 pt-4 border-t border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Created by:</span>
                  <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    {selectedReservation.createdByName || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Created at:</span>
                  <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    {new Date(selectedReservation.createdAt.seconds * 1000).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div className="mt-4">
                  <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Notes</span>
                  <p className={`mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {selectedReservation.notes}
                  </p>
                </div>
              )}

              <button
                onClick={handleReservationCancel}
                className="mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Back to List
              </button>
            </div>
          );
        }
        return <ReservationList onCreateNew={handleReservationCreateNew} onViewReservation={handleViewReservation} />;

      case "reconciliation":
        return <ReconciliationDashboard />;

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`} data-testid="stock-movement-page">
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                📦 Stock Movement Management
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage inter-warehouse transfers, stock reservations, and reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Left aligned, sentence case, teal underline */}
        <div className="px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Reset sub-views when changing tabs
                    if (tab.id === "transfers") {
                      setTransferView("list");
                      setSelectedTransfer(null);
                    }
                    if (tab.id === "reservations") {
                      setReservationView("list");
                      setSelectedReservation(null);
                    }
                    // Scroll to top when tab changes (Bug #80 fix)
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? `border-teal-600 ${isDarkMode ? "bg-gray-700 text-teal-400" : "bg-gray-50 text-teal-600"}`
                      : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`
                  }`}
                  data-testid={`tab-${tab.id}`}
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
      <div className="flex-1 p-6">{renderTabContent()}</div>
    </div>
  );
};

export default StockMovementPage;
