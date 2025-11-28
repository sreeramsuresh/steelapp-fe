// Updated: Credit Notes moved to Finance section
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Plus,
  List as ListIcon,
  Settings,
  BarChart3,
  Users,
  Package,
  Calculator,
  TrendingUp,
  Warehouse,
  Move,
  Truck,
  ShoppingCart,
  Quote,
  Ship,
  Globe,
  FileCheck,
  Anchor,
  CreditCard,
  Scroll,
  ArrowDownToLine,
  ArrowUpFromLine,
  MapPin,
  RotateCcw,
  Shield,
  Banknote,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/axiosAuthService';
import { isFeatureEnabled } from '../config/features';


const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  
  const navigationItems = [
    {
      section: 'Dashboard',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: Home,
          description: 'Overview & Analytics',
        },
      ],
    },
    {
      section: 'Finance / Accounts Receivable',
      items: [
        {
          name: 'Finance Dashboard',
          path: '/finance',
          icon: Banknote,
          description: 'Manage receivables, payables, and credit notes',
          requiredPermission: 'payables.read',
        },
        {
          name: 'Invoices',
          path: '/invoices',
          icon: FileText,
          description: 'View and manage invoices',
          requiredPermission: 'invoices_all.read',
        },
      ],
    },
    {
      section: 'Quotations',
      items: [
        {
          name: 'Quotations',
          path: '/quotations',
          icon: Quote,
          description: 'Manage quotations',
          requiredPermission: 'quotations.read',
        },
      ],
    },
    {
      section: 'Delivery',
      items: [
        {
          name: 'Delivery Notes',
          path: '/delivery-notes',
          icon: Truck,
          description: 'Manage delivery notes',
          requiredPermission: 'delivery_notes.read',
        },
      ],
    },
    {
      section: 'Procurement',
      items: [
        {
          name: 'Purchase Orders',
          path: '/purchase-orders',
          icon: ShoppingCart,
          description: 'Manage purchase orders',
          requiredPermission: 'purchase_orders.read',
        },
      ],
    },
    {
      section: 'Inventory',
      items: [
        {
          name: 'Warehouses',
          path: '/warehouses',
          icon: MapPin,
          description: 'Manage warehouse locations and capacity',
        },
        {
          name: 'Inventory',
          path: '/inventory',
          icon: Warehouse,
          description: 'View stock levels and inventory',
        },
        {
          name: 'Stock Movements',
          path: '/stock-movements',
          icon: Move,
          description: 'Transfers, reservations & reconciliation',
        },
      ],
    },
    {
      section: 'Trade Operations',
      items: [
        {
          name: 'Import / Export',
          path: '/import-export',
          icon: Ship,
          description: 'Manage international trade operations',
          requiredPermission: 'import_orders.read',
        },
      ],
    },
    {
      section: 'Business',
      items: [
        {
          name: 'Business Management',
          path: '/business',
          icon: Users,
          description: 'Manage customers, products, and pricing',
          requiredPermission: 'customers.read',
        },
      ],
    },
    {
      section: 'Reports',
      items: [
        {
          name: 'Reports & Analytics',
          path: '/reports',
          icon: BarChart3,
          description: 'Business insights and performance analytics',
          requiredPermission: 'analytics.read',
        },
      ],
    },
    {
      section: 'Settings',
      items: [
        {
          name: 'Company Settings',
          path: '/settings',
          icon: Settings,
          description: 'Configure company details',
          requiredRole: 'admin',
        },
        // Audit Logs - conditionally shown based on feature flag
        ...(isFeatureEnabled('AUDIT_LOGS') ? [{
          name: 'Audit Logs',
          path: '/audit-logs',
          icon: Shield,
          description: 'View system activity logs',
          requiredRole: 'admin',
        }] : []),
      ],
    },
  ];

  const isActiveRoute = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-[1000] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-[260px] xl:w-[280px] flex-shrink-0 ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} border-r ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      } overflow-hidden`}
    >
      {/* Sidebar Header */}
      <div className={`h-16 sm:h-14 md:h-15 px-4 flex items-center border-b ${
        isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
      }`}>
        <Link 
          to="/" 
          className={`flex items-center gap-3 no-underline ${
            isDarkMode ? 'text-white hover:text-white' : 'text-gray-900 hover:text-gray-900'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">
              ULTIMATE STEELS
            </div>
            <div className={`text-xs opacity-70 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Business Management
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.section !== 'Dashboard' && (
              <div className={`px-4 py-2 pb-1 text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {section.section}
              </div>
            )}
            <div className="space-y-1">
              {section.items
                .filter(item => {
                  if (item.requiredRoles) {
                    return item.requiredRoles.some(role => authService.hasRole(role));
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
                          <Icon size={20} className={`transition-transform duration-200 ${
                            isActive ? '' : 'group-hover:scale-110'
                          }`} />
                        </div>
                        <span className={`text-sm flex-1 ${
                          isActive ? 'font-semibold' : 'font-medium'
                        }`}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <div className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-semibold ${
                            isDarkMode 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-500 text-white'
                          }`}>
                            {item.badge}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Sidebar;
