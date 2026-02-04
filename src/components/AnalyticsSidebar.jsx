/**
 * AnalyticsSidebar.jsx
 * Sidebar for Analytics Hub (/analytics/*)
 * Contains analytics/reporting navigation items only
 * Operational items are in CoreSidebar
 */

import {
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  DollarSign,
  FileText,
  LineChart,
  Package,
  PieChart,
  Shield,
  Star,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";

const AnalyticsSidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const scrollContainerRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Handle scroll to update fade indicators
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 10;

    setShowTopFade(scrollTop > threshold);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - threshold);
  };

  const handleScrollUp = (e) => {
    e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollDown = (e) => {
    e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  // Analytics Hub navigation items (view/report only - no operational)
  const navigationItems = [
    // 0. BUSINESS MANAGEMENT (top position, same styling as other items)
    {
      section: null, // No section header
      items: [
        {
          name: "Business Management",
          path: "/app",
          icon: Building2,
          description: "Core ERP operations and management",
        },
      ],
    },

    // 1. EXECUTIVE
    {
      section: "Executive",
      items: [
        {
          name: "Executive Dashboard",
          path: "/analytics/dashboard",
          icon: TrendingUp,
          description: "Executive KPI dashboard with key metrics",
        },
      ],
    },

    // 3. SALES ANALYTICS
    {
      section: "Sales Analytics",
      items: [
        {
          name: "Profit Analysis",
          path: "/analytics/profit-analysis",
          icon: DollarSign,
          description: "Profit breakdown and margin analysis",
          requiredPermission: "analytics.read",
        },
        {
          name: "Price History",
          path: "/analytics/price-history",
          icon: LineChart,
          description: "Historical price trends and analysis",
          requiredPermission: "analytics.read",
        },
      ],
    },

    // 4. FINANCE DASHBOARDS
    {
      section: "Finance Dashboards",
      items: [
        {
          name: "AR Aging Report",
          path: "/analytics/ar-aging",
          icon: Clock,
          description: "Accounts receivable aging analysis by customer",
          requiredPermission: "customers.read",
        },
        {
          name: "Commission Dashboard",
          path: "/analytics/commission-dashboard",
          icon: Coins,
          description: "Sales commission tracking and analytics",
          requiredPermission: "commissions.read",
        },
      ],
    },

    // 5. INVENTORY ANALYTICS
    {
      section: "Inventory Analytics",
      items: [
        {
          name: "Batch Analytics",
          path: "/analytics/batch-analytics",
          icon: PieChart,
          description: "Track and analyze inventory batch performance",
          requiredRoles: [
            "warehouse_manager",
            "inventory_controller",
            "supervisor",
            "manager",
            "admin",
            "super_admin",
            "finance_manager",
            "accountant",
            "director",
          ],
        },
        {
          name: "Stock Movement Report",
          path: "/analytics/stock-movement-report",
          icon: Package,
          description: "Stock movement history and trends",
          requiredPermission: "analytics.read",
        },
      ],
    },

    // 6. PURCHASE ANALYTICS
    {
      section: "Purchase Analytics",
      items: [
        {
          name: "Delivery Performance",
          path: "/analytics/delivery-performance",
          icon: Truck,
          description: "Supplier delivery variance and performance metrics",
          requiredPermission: "suppliers.read",
        },
        {
          name: "Supplier Performance",
          path: "/analytics/supplier-performance",
          icon: Star,
          description: "Supplier KPI analytics and ratings",
          requiredPermission: "suppliers.read",
        },
      ],
    },

    // 7. REPORTS
    {
      section: "Reports",
      items: [
        {
          name: "Reports Hub",
          path: "/analytics/reports",
          icon: FileText,
          description: "Sales analytics, revenue trends, and VAT returns",
          requiredPermission: "analytics.read",
        },
      ],
    },

    // 8. AUDIT & COMPLIANCE
    {
      section: "Audit & Compliance",
      items: [
        {
          name: "Audit Hub",
          path: "/analytics/audit-hub",
          icon: Shield,
          description: "Financial audit trails, period locks, and sign-offs",
          requiredRoles: [
            "accountant",
            "senior_accountant",
            "finance_manager",
            "manager",
            "admin",
            "super_admin",
            "director",
          ],
        },
      ],
    },
  ];

  const isActiveRoute = (path) => {
    if (path === "/analytics" && location.pathname === "/analytics") return true;
    if (path !== "/analytics" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-[1000] transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-[260px] xl:w-[280px] flex-shrink-0 ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} border-r ${
        isDarkMode ? "border-[#37474F]" : "border-gray-200"
      } flex flex-col overflow-hidden`}
    >
      {/* Sidebar Header */}
      <div
        className={`h-16 sm:h-14 md:h-15 px-4 flex items-center border-b flex-shrink-0 ${
          isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
        }`}
      >
        <Link
          to="/analytics"
          className={`flex items-center gap-3 no-underline ${
            isDarkMode ? "text-white hover:text-white" : "text-gray-900 hover:text-gray-900"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">ANALYTICS HUB</div>
            <div className={`text-xs opacity-70 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Insights & Reports
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 relative min-h-0">
        {/* Top fade indicator */}
        <button type="button" onClick={handleScrollUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleScrollUp(e);
          }}
          className={`absolute top-0 left-0 right-0 h-8 z-10 transition-opacity duration-300 ${
            showTopFade ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"
          }`}
          style={{
            background: isDarkMode
              ? "linear-gradient(to bottom, rgba(30, 35, 40, 0.95) 0%, rgba(30, 35, 40, 0.7) 50%, rgba(30, 35, 40, 0) 100%)"
              : "linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronUp
              size={16}
              className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} transition-transform hover:scale-110`}
              style={{ opacity: 0.7 }}
            />
          </div>
        </button>

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto py-2 no-scrollbar">
          {navigationItems.map((section, sectionIndex) => (
            <div key={section.id || section.name || `section-${sectionIndex}`}>
              {section.section && section.section !== "Overview" && (
                <div
                  className={`px-4 py-2 pb-1 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {section.section}
                </div>
              )}
              <div className="space-y-1">
                {section.items
                  .filter((item) => {
                    if (item.requiredRoles) {
                      return item.requiredRoles.some((role) => authService.hasRole(role));
                    }
                    if (item.requiredRole) {
                      return authService.hasRole(item.requiredRole);
                    }
                    if (item.requiredPermission) {
                      const [res, act] = item.requiredPermission.split(".");
                      return authService.hasPermission(res, act);
                    }
                    return true;
                  })
                  .map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.path);

                    return (
                      <div key={item.id || item.name || `item-${itemIndex}`} className="px-2">
                        <Link
                          to={item.path}
                          onClick={() => window.innerWidth <= 768 && onToggle()}
                          title={item.description}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-12 transition-all duration-200 no-underline group ${
                            isActive
                              ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white hover:text-white shadow-md"
                              : isDarkMode
                                ? "text-gray-300 hover:bg-indigo-900/30 hover:text-indigo-400 hover:border-indigo-700 border border-transparent"
                                : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <Icon
                              size={20}
                              className={`transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                            />
                          </div>
                          <span className={`text-sm flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                            {item.name}
                          </span>
                        </Link>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom fade indicator */}
        <button type="button" onClick={handleScrollDown}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleScrollDown(e);
          }}
          className={`absolute bottom-0 left-0 right-0 h-8 z-10 transition-opacity duration-300 ${
            showBottomFade ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"
          }`}
          style={{
            background: isDarkMode
              ? "linear-gradient(to top, rgba(30, 35, 40, 0.95) 0%, rgba(30, 35, 40, 0.7) 50%, rgba(30, 35, 40, 0) 100%)"
              : "linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronDown
              size={16}
              className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} transition-transform hover:scale-110`}
              style={{ opacity: 0.7 }}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default AnalyticsSidebar;
