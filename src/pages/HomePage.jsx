/**
 * HomePage.jsx
 * Universal Home Page / Dashboard for ERP
 * Responsive to dark/light theme
 * Designed to match existing InvoiceList and Dashboard aesthetics
 */

import {
  Activity,
  ArrowRight,
  Bell,
  Edit,
  FileText,
  Package,
  Plus,
  Quote,
  Settings,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandmarkHero from "../components/BrandmarkHero";
import { useTheme } from "../contexts/ThemeContext";
import useDragReorder, { DragHandleIcon } from "../hooks/useDragReorder";
import useHomeSectionOrder from "../hooks/useHomeSectionOrder";
import { authService } from "../services/authService";
import { apiService } from "../services/axiosApi";
import { customerService } from "../services/customerService";
import { invoiceService } from "../services/invoiceService";
import { quotationService } from "../services/quotationService";
import { toUAETime } from "../utils/timezone";

/**
 * Quick Access Section - Displays navigation shortcuts
 */
const QuickAccessSection = ({ quickAccessItems, handleNavigate, isDarkMode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {quickAccessItems.map((item) => {
      const IconComponent = item.icon;
      return (
        <button
          type="button"
          key={item.name}
          onClick={() => handleNavigate(item.path)}
          className={`p-6 rounded-xl border-2 transition-all duration-300 group ${
            isDarkMode
              ? "bg-[#1E2328] border-[#37474F] hover:border-teal-500/50 hover:bg-[#252D38]"
              : "bg-white border-[#E0E0E0] hover:border-teal-500/50 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${item.color}`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                isDarkMode ? "text-gray-600" : "text-gray-400"
              }`}
            />
          </div>
          <h3 className={`font-semibold text-left ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.name}</h3>
        </button>
      );
    })}
  </div>
);

/**
 * Create New Section - Displays quick creation shortcuts
 */
const CreateNewSection = ({ createNewItems, handleNavigate, isDarkMode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {createNewItems.map((item) => {
      return (
        <button
          type="button"
          key={item.name}
          onClick={() => handleNavigate(item.path)}
          className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-semibold transition-all duration-300 group ${
            isDarkMode
              ? "bg-[#1E2328] border-[#37474F] hover:border-teal-500 hover:bg-[#252D38] text-white"
              : "bg-white border-[#E0E0E0] hover:border-teal-500 hover:bg-gray-50 text-gray-900"
          }`}
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span>{item.name}</span>
        </button>
      );
    })}
  </div>
);

/**
 * Recent Items Section - Displays recently accessed items
 */
const RecentItemsSection = ({ recentItems, handleNavigate, isDarkMode }) => (
  <div
    className={`rounded-xl border transition-all ${
      isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
    }`}
  >
    {recentItems.length > 0 ? (
      recentItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <button
            type="button"
            key={`${item.type}-${item.id}`}
            onClick={() => handleNavigate(item.link)}
            className={`w-full flex items-center justify-between p-4 transition-all hover:bg-teal-500/10 ${
              index !== recentItems.length - 1
                ? isDarkMode
                  ? "border-b border-[#37474F]"
                  : "border-b border-[#E0E0E0]"
                : ""
            }`}
          >
            <div className="flex items-center gap-4 flex-1 text-left">
              <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-[#252D38]" : "bg-gray-100"}`}>
                <IconComponent className={`w-5 h-5 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.name}</p>
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>{item.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs whitespace-nowrap ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                {item.timestamp}
              </span>
              <ArrowRight className={`w-4 h-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
            </div>
          </button>
        );
      })
    ) : (
      <div className={`p-6 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p>No recent items yet</p>
      </div>
    )}
  </div>
);

/**
 * Recent Activity Section — Shows last 10 audit log entries
 */
const ACTION_ICONS = { CREATE: Plus, INSERT: Plus, UPDATE: Edit, DELETE: Trash2 };

function getActionIcon(action) {
  if (!action) return Activity;
  const upper = action.toUpperCase();
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (upper.includes(key)) return icon;
  }
  return Activity;
}

const CATEGORY_COLORS = {
  AUTH: "text-purple-500",
  INVOICE: "text-blue-500",
  PAYMENT: "text-green-500",
  CUSTOMER: "text-pink-500",
  SUPPLIER: "text-teal-500",
  PRODUCT: "text-indigo-500",
  PURCHASE_ORDER: "text-amber-500",
  DELIVERY_NOTE: "text-lime-500",
  CREDIT_NOTE: "text-rose-500",
  QUOTATION: "text-sky-500",
  INVENTORY: "text-emerald-500",
  WAREHOUSE: "text-slate-500",
  USER: "text-violet-500",
  ROLE: "text-fuchsia-500",
};

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || "text-gray-500";
}

const RecentActivitySection = ({ recentActivity, handleNavigate, isDarkMode }) => (
  <div
    className={`rounded-xl border transition-all ${
      isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
    }`}
  >
    {recentActivity.length > 0 ? (
      <>
        {recentActivity.map((log, index) => {
          const IconComponent = getActionIcon(log.action);
          return (
            <div
              key={log.id}
              className={`flex items-center gap-4 p-4 transition-all ${
                index !== recentActivity.length - 1
                  ? isDarkMode
                    ? "border-b border-[#37474F]"
                    : "border-b border-[#E0E0E0]"
                  : ""
              }`}
            >
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#252D38]" : "bg-gray-100"}`}>
                <IconComponent className={`w-4 h-4 ${getCategoryColor(log.category)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {log.description || log.action}
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {log.username || "System"} — {toUAETime(log.createdAt, { format: "datetime" })}
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                  isDarkMode ? "bg-[#252D38] text-gray-400" : "bg-gray-100 text-gray-500"
                }`}
              >
                {log.category || "—"}
              </span>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => handleNavigate("/app/audit-logs")}
          className={`w-full p-3 text-center text-sm font-medium transition-colors ${
            isDarkMode ? "text-teal-400 hover:bg-[#252D38]" : "text-teal-600 hover:bg-gray-50"
          }`}
        >
          View All Activity →
        </button>
      </>
    ) : (
      <div className={`p-6 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        <Activity className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
        <p>No recent activity</p>
      </div>
    )}
  </div>
);

/**
 * Section configuration mapping
 */
const SECTION_CONFIG = {
  quickAccess: {
    id: "quickAccess",
    title: "Quick Access",
    Component: QuickAccessSection,
  },
  createNew: {
    id: "createNew",
    title: "Create New",
    Component: CreateNewSection,
  },
  recentItems: {
    id: "recentItems",
    title: "Recent Items",
    Component: RecentItemsSection,
  },
  recentActivity: {
    id: "recentActivity",
    title: "Recent Activity",
    Component: RecentActivitySection,
  },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [recentItems, setRecentItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const { sectionOrder, reorderSections } = useHomeSectionOrder();
  const { getDragItemProps, getDragHandleProps, isDropTarget, isDragSource } = useDragReorder({
    items: sectionOrder,
    onReorder: reorderSections,
    enabled: true,
  });

  // Initialize userName from localStorage (lazy initialization)
  const [userName] = useState(() => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.full_name || user.fullName || user.name || user.display_name || user.email?.split("@")[0] || "User";
      }
    } catch (error) {
      console.warn("Error loading user info:", error);
    }
    return "User";
  });

  const [quickAccessItems] = useState(
    [
      { icon: Quote, name: "Quotations", path: "/app/quotations", color: "from-blue-500 to-blue-600", perm: ["quotations", "read"] },
      { icon: FileText, name: "Invoices", path: "/app/invoices", color: "from-purple-500 to-purple-600", perm: ["invoices", "read"] },
      { icon: ShoppingCart, name: "Purchases", path: "/app/purchase-orders", color: "from-orange-500 to-orange-600", perm: ["purchase_orders", "read"] },
      { icon: Truck, name: "Deliveries", path: "/app/delivery-notes", color: "from-green-500 to-green-600", perm: ["delivery_notes", "read"] },
      { icon: Users, name: "Customers", path: "/app/customers", color: "from-pink-500 to-pink-600", perm: ["customers", "read"] },
      { icon: Package, name: "Products", path: "/app/products", color: "from-indigo-500 to-indigo-600", perm: ["products", "read"] },
      { icon: Warehouse, name: "Warehouse", path: "/app/warehouses", color: "from-cyan-500 to-cyan-600", perm: ["warehouses", "read"] },
      { icon: Settings, name: "Settings", path: "/app/settings", color: "from-gray-500 to-gray-600", perm: ["company_settings", "read"] },
    ].filter((item) => authService.hasPermission(item.perm[0], item.perm[1])),
  );

  const createNewItems = [
    { icon: Quote, name: "New Quotation", path: "/app/quotations/new", color: "blue", perm: ["quotations", "create"] },
    { icon: FileText, name: "New Invoice", path: "/app/invoices/new", color: "purple", perm: ["invoices", "create"] },
    { icon: ShoppingCart, name: "New Purchase", path: "/app/purchase-orders/new", color: "orange", perm: ["purchase_orders", "create"] },
    { icon: Truck, name: "New Delivery", path: "/app/delivery-notes/new", color: "green", perm: ["delivery_notes", "create"] },
    { icon: Users, name: "New Customer", path: "/app/customers/new", color: "pink", perm: ["customers", "create"] },
    { icon: Package, name: "New Product", path: "/app/products/new", color: "indigo", perm: ["products", "create"] },
  ].filter((item) => authService.hasPermission(item.perm[0], item.perm[1]));

  // Fetch recent items from multiple modules (max 9 items)
  useEffect(() => {
    const fetchRecentItems = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // Fetch from multiple services in parallel
        const [quotationsRes, invoicesRes, customersRes] = await Promise.all([
          quotationService.getAll({ limit: 3 }).catch(() => ({ data: [] })),
          invoiceService.getInvoices({ limit: 3 }).catch(() => ({ invoices: [] })),
          customerService.getCustomers({ limit: 3 }).catch(() => ({ data: [] })),
        ]);

        const allItems = [];

        // Process quotations
        const quotations = quotationsRes.data || quotationsRes.quotations || [];
        if (Array.isArray(quotations)) {
          quotations.forEach((q) => {
            allItems.push({
              id: q.id,
              type: "quotation",
              icon: Quote,
              name: `Quotation ${q.quotation_number || q.quotationNumber || "N/A"}`,
              detail: q.customer_details?.name || q.customerDetails?.name || "No customer",
              timestamp: "Recently created",
              link: `/app/quotations/${q.id}`,
            });
          });
        }

        // Process invoices
        const invoices = invoicesRes.invoices || invoicesRes.data || [];
        if (Array.isArray(invoices)) {
          invoices.forEach((inv) => {
            allItems.push({
              id: inv.id,
              type: "invoice",
              icon: FileText,
              name: `Invoice ${inv.invoice_number || inv.invoiceNumber || "N/A"}`,
              detail: `${inv.status || "N/A"} • ${inv.currency || "AED"} ${inv.total || "0"}`,
              timestamp: "Recently created",
              link: `/app/invoices/${inv.id}`,
            });
          });
        }

        // Process customers
        const customers = customersRes.data || customersRes.customers || [];
        if (Array.isArray(customers)) {
          customers.forEach((c) => {
            allItems.push({
              id: c.id,
              type: "customer",
              icon: Users,
              name: c.name || "N/A",
              detail: `${c.address?.city || "N/A"}, ${c.address?.country || "N/A"} • ${c.tier || "Standard"}`,
              timestamp: "Recently created",
              link: `/app/customers/${c.id}`,
            });
          });
        }

        // Limit to 9 items and set
        setRecentItems(allItems.slice(0, 9));
      } catch (error) {
        console.warn("Error fetching recent items:", error);
        setFetchError("Failed to load recent items. Please try refreshing.");
        setRecentItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentItems();
  }, []);

  // Fetch recent audit activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await apiService.get("/audit-logs/recent");
      setRecentActivity(response.logs || []);
    } catch {
      setRecentActivity([]);
    }
  }, []);

  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 60000);
    return () => clearInterval(interval);
  }, [fetchRecentActivity]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`min-h-[calc(100vh-64px)] p-6 sm:p-8 transition-colors duration-200 ${
        isDarkMode ? "bg-[#0A0E14]" : "bg-[#FAFAFA]"
      }`}
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Home</h1>
            <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Welcome back, {userName}! 👋</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
            title="Refresh"
            aria-label="Refresh dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>Refresh</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Brandmark Hero Section */}
        <BrandmarkHero />

        {/* Error Banner */}
        {fetchError && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
              isDarkMode ? "bg-red-900/20 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span>{fetchError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`text-sm font-medium underline ${isDarkMode ? "text-red-300" : "text-red-700"}`}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="mb-8 flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Loading dashboard...</span>
            </div>
          </div>
        )}

        {/* Dynamic Draggable Sections */}
        {sectionOrder.map((sectionId, index) => {
          const section = SECTION_CONFIG[sectionId];
          if (!section) return null;

          const SectionComponent = section.Component;

          return (
            <div
              key={section.id}
              {...getDragItemProps(index)}
              className={`mb-8 transition-all ${
                isDropTarget(index) ? "opacity-50" : ""
              } ${isDragSource(index) ? "opacity-30" : ""}`}
            >
              {/* Section Card */}
              <div
                className={`relative rounded-xl border-2 p-6 transition-all ${
                  isDarkMode
                    ? "bg-[#1E2328] border-[#37474F] hover:border-teal-500/30"
                    : "bg-white border-[#E0E0E0] hover:border-teal-500/30"
                }`}
              >
                {/* Drag Handle - Top Right */}
                <div
                  {...getDragHandleProps(index)}
                  className={`absolute top-4 right-4 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                      : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  }`}
                  title="Drag to reorder sections"
                >
                  <DragHandleIcon size={20} className="pointer-events-none" />
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6 pr-10">
                  <div className={`h-1 w-1 rounded-full ${isDarkMode ? "bg-teal-500" : "bg-teal-600"}`}></div>
                  <h2 className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {section.title}
                  </h2>
                </div>

                {/* Section Content */}
                <SectionComponent
                  quickAccessItems={quickAccessItems}
                  createNewItems={createNewItems}
                  recentItems={recentItems}
                  recentActivity={recentActivity}
                  handleNavigate={handleNavigate}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          );
        })}

        {/* BOTTOM: Info Card */}
        <div
          className={`rounded-xl border-l-4 border-teal-500 p-6 ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
          }`}
        >
          <div className="flex items-start gap-4">
            <Bell className={`w-6 h-6 mt-1 flex-shrink-0 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Getting Started</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Use Quick Access to navigate to any module, view recent items you&apos;ve worked on, or create new
                documents. All your data is synchronized in real-time across the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
