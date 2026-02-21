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

import { ArrowLeftRight, BarChart3, Bookmark, ClipboardList, Clock, Package } from "lucide-react";
import { useState } from "react";
import {
  ReconciliationDashboard,
  ReservationDetailView,
  ReservationForm,
  ReservationList,
  StockMovementOverview,
  TransferDetailView,
  TransferForm,
  TransferList,
} from "../components/stock-movement";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import StockMovementList from "./inventory/StockMovementList";

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
  const allTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      description: "Dashboard summary of stock-in, stock-out, transfers, and reservations",
    },
    {
      id: "transfers",
      label: "Transfers",
      icon: ArrowLeftRight,
      description: "Move stock between warehouses — create, ship, and receive transfers",
    },
    {
      id: "reservations",
      label: "Reservations",
      icon: Bookmark,
      description: "Reserve stock for pending orders — prevents overselling allocated inventory",
      permission: ["batch_reservations", "read"],
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      icon: ClipboardList,
      description: "Compare system quantities against physical counts and resolve discrepancies",
      permission: ["reconciliations", "read"],
    },
    {
      id: "history",
      label: "Movement History",
      icon: Clock,
      description: "Full audit trail of every stock-in, stock-out, and adjustment recorded",
    },
  ];
  const tabs = allTabs.filter((tab) => !tab.permission || authService.hasPermission(...tab.permission));

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
          return <TransferDetailView transfer={selectedTransfer} onBack={handleTransferCancel} />;
        }
        return <TransferList onCreateNew={handleTransferCreateNew} onViewTransfer={handleViewTransfer} />;

      case "reservations":
        if (reservationView === "create") {
          return <ReservationForm open={true} onClose={handleReservationCancel} onSuccess={handleReservationCreated} />;
        }
        if (reservationView === "view" && selectedReservation) {
          return <ReservationDetailView reservation={selectedReservation} onBack={handleReservationCancel} />;
        }
        return <ReservationList onCreateNew={handleReservationCreateNew} onViewReservation={handleViewReservation} />;

      case "reconciliation":
        return <ReconciliationDashboard />;

      case "history":
        return <StockMovementList embedded />;

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
                Stock Movement Management
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {tabs.find((t) => t.id === activeTab)?.description ||
                  "Manage inter-warehouse transfers, stock reservations, and reconciliation"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Left aligned, sentence case, teal underline */}
        <div className="px-6">
          <div role="tablist" aria-label="Stock management sections" className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
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
