/**
 * CoreSidebar.jsx
 * Sidebar for Core ERP operations (/app/*)
 * Contains operational navigation items only
 * Analytics items are in AnalyticsSidebar
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Settings,
  BarChart3,
  Users,
  Package,
  Warehouse,
  Move,
  Truck,
  ShoppingCart,
  Quote,
  Ship,
  Scroll,
  MapPin,
  Banknote,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Container,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/axiosAuthService';

const CoreSidebar = ({ isOpen, onToggle }) => {
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
    container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollDown = (e) => {
    e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  // Core ERP navigation items (operational only - no analytics/dashboards)
  const navigationItems = [
    // 0. ANALYTICS HUB (top position, same styling as other items)
    {
      section: null, // No section header
      items: [
        {
          name: 'Analytics Hub',
          path: '/analytics/dashboard',
          icon: BarChart3,
          description: 'Analytics and reporting dashboards',
        },
      ],
    },

    // 1. SALES (operational)
    {
      section: 'Sales',
      items: [
        {
          name: 'Quotations',
          path: '/app/quotations',
          icon: Quote,
          description: 'Create and manage quotations',
          requiredPermission: 'quotations.read',
        },
        {
          name: 'Invoices',
          path: '/app/invoices',
          icon: FileText,
          description: 'View and manage invoices',
          requiredPermission: 'invoices_all.read',
        },
        {
          name: 'Delivery Notes',
          path: '/app/delivery-notes',
          icon: Truck,
          description: 'Manage delivery notes',
          requiredPermission: 'delivery_notes.read',
        },
      ],
    },

    // 3. PURCHASES (operational only - removed Delivery Performance analytics)
    {
      section: 'Purchases',
      items: [
        {
          name: 'Purchases',
          path: '/app/purchases',
          icon: ShoppingCart,
          description: 'Purchase orders, supplier bills, and payments',
          requiredPermission: 'purchase_orders.read',
        },
      ],
    },

    // 4. FINANCE (operational workflows)
    {
      section: 'Finance',
      items: [
        {
          name: 'Finance',
          path: '/app/finance',
          icon: Banknote,
          description: 'Credit notes, statements, commissions, credit management',
          requiredPermission: 'payables.read',
        },
        {
          name: 'Receivables',
          path: '/app/receivables',
          icon: CheckCircle,
          description: 'Manage customer receivables and collections',
          requiredPermission: 'receivables.read',
        },
        {
          name: 'Payables',
          path: '/app/payables',
          icon: AlertCircle,
          description: 'Manage vendor payables and payments',
          requiredPermission: 'payables.read',
        },
      ],
    },

    // 5. INVENTORY (operational only - removed Batch Analytics)
    {
      section: 'Inventory',
      items: [
        {
          name: 'Warehouses',
          path: '/app/warehouses',
          icon: MapPin,
          description: 'Manage warehouse locations and capacity',
        },
        {
          name: 'Stock Levels',
          path: '/app/inventory',
          icon: Warehouse,
          description: 'View current stock levels and availability',
        },
        {
          name: 'Stock Movements',
          path: '/app/stock-movements',
          icon: Move,
          description: 'Transfers, reservations & reconciliation',
        },
      ],
    },

    // 6. TRADE (operational)
    {
      section: 'Trade',
      items: [
        {
          name: 'Import / Export',
          path: '/app/import-export',
          icon: Ship,
          description: 'International trade, transit, shipping & customs',
          requiredPermission: 'import_orders.read',
        },
        {
          name: 'Containers',
          path: '/app/containers',
          icon: Container,
          description: 'Manage import containers and landed costs',
          requiredPermission: 'import_orders.read',
        },
      ],
    },

    // 7. MASTERS
    {
      section: 'Masters',
      items: [
        {
          name: 'Customers',
          path: '/app/customers',
          icon: Users,
          description: 'Manage customer records',
          requiredPermission: 'customers.read',
        },
        {
          name: 'Products',
          path: '/app/products',
          icon: Package,
          description: 'Manage product catalog',
          requiredPermission: 'products.read',
        },
        {
          name: 'Price Lists',
          path: '/app/pricelists',
          icon: Scroll,
          description: 'Manage product price lists',
          requiredPermission: 'products.read',
        },
      ],
    },

    // 8. SETTINGS
    {
      section: 'Settings',
      items: [
        {
          name: 'Company Settings',
          path: '/app/settings',
          icon: Settings,
          description: 'Configure company details, integrations, and view audit logs',
          requiredRole: 'admin',
        },
      ],
    },
  ];

  const isActiveRoute = (path) => {
    if (path === '/app' && location.pathname === '/app') return true;
    if (path !== '/app' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-[1000] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-[260px] xl:w-[280px] flex-shrink-0 ${
        isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
      } border-r ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      } flex flex-col overflow-hidden`}
    >
      {/* Sidebar Header */}
      <div
        className={`h-16 sm:h-14 md:h-15 px-4 flex items-center border-b flex-shrink-0 ${
          isDarkMode
            ? 'border-[#37474F] bg-[#1E2328]'
            : 'border-gray-200 bg-white'
        }`}
      >
        <Link
          to="/app"
          className={`flex items-center gap-3 no-underline ${
            isDarkMode
              ? 'text-white hover:text-white'
              : 'text-gray-900 hover:text-gray-900'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">ULTIMATE STEELS</div>
            <div
              className={`text-xs opacity-70 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Business Management
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 relative min-h-0">
        {/* Top fade indicator */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleScrollUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleScrollUp(e);
          }}
          className={`absolute top-0 left-0 right-0 h-8 z-10 transition-opacity duration-300 ${
            showTopFade
              ? 'opacity-100 pointer-events-auto cursor-pointer'
              : 'opacity-0 pointer-events-none'
          }`}
          style={{
            background: isDarkMode
              ? 'linear-gradient(to bottom, rgba(30, 35, 40, 0.95) 0%, rgba(30, 35, 40, 0.7) 50%, rgba(30, 35, 40, 0) 100%)'
              : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 100%)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronUp
              size={16}
              className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform hover:scale-110`}
              style={{ opacity: 0.7 }}
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-y-auto py-2 no-scrollbar"
        >
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.section && section.section !== 'Dashboard' && (
                <div
                  className={`px-4 py-2 pb-1 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {section.section}
                </div>
              )}
              <div className="space-y-1">
                {section.items
                  .filter((item) => {
                    if (item.requiredRoles) {
                      return item.requiredRoles.some((role) =>
                        authService.hasRole(role),
                      );
                    }
                    if (item.requiredRole) {
                      return authService.hasRole(item.requiredRole);
                    }
                    if (item.requiredPermission) {
                      const [res, act] = item.requiredPermission.split('.');
                      return authService.hasPermission(res, act);
                    }
                    return true;
                  })
                  .map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.path);

                    return (
                      <div key={itemIndex} className="px-2">
                        <Link
                          to={item.path}
                          onClick={() => window.innerWidth <= 768 && onToggle()}
                          title={item.description}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-12 transition-all duration-200 no-underline group ${
                            isActive
                              ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:text-white shadow-md'
                              : isDarkMode
                                ? 'text-gray-300 hover:bg-teal-900/30 hover:text-teal-400 hover:border-teal-700 border border-transparent'
                                : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-transparent'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <Icon
                              size={20}
                              className={`transition-transform duration-200 ${
                                isActive ? '' : 'group-hover:scale-110'
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm flex-1 ${
                              isActive ? 'font-semibold' : 'font-medium'
                            }`}
                          >
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
        <div
          role="button"
          tabIndex={0}
          onClick={handleScrollDown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleScrollDown(e);
          }}
          className={`absolute bottom-0 left-0 right-0 h-8 z-10 transition-opacity duration-300 ${
            showBottomFade
              ? 'opacity-100 pointer-events-auto cursor-pointer'
              : 'opacity-0 pointer-events-none'
          }`}
          style={{
            background: isDarkMode
              ? 'linear-gradient(to top, rgba(30, 35, 40, 0.95) 0%, rgba(30, 35, 40, 0.7) 50%, rgba(30, 35, 40, 0) 100%)'
              : 'linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 100%)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronDown
              size={16}
              className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform hover:scale-110`}
              style={{ opacity: 0.7 }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default CoreSidebar;
