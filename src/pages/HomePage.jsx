/**
 * HomePage.jsx
 * Universal Home Page / Dashboard for ERP
 * Responsive to dark/light theme
 * Designed to match existing InvoiceList and Dashboard aesthetics
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShoppingCart,
  Users,
  Package,
  Warehouse,
  Truck,
  Quote,
  Plus,
  ArrowRight,
  Settings,
  Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [userName, setUserName] = useState('User');
  const [recentItems, setRecentItems] = useState([
    {
      id: 1,
      type: 'quotation',
      icon: Quote,
      name: 'Quotation QT-202601-0003',
      detail: 'Al Khaleej Trading',
      timestamp: '2 hours ago',
      link: '/app/quotations/1',
    },
    {
      id: 2,
      type: 'invoice',
      icon: FileText,
      name: 'Invoice DFT-202601-1767',
      detail: 'Draft • USD 45,250',
      timestamp: '2 hours ago',
      link: '/app/invoices/2',
    },
    {
      id: 3,
      type: 'purchase',
      icon: ShoppingCart,
      name: 'Purchase Order PO-2025-001',
      detail: 'Pending Approval',
      timestamp: '1 day ago',
      link: '/app/purchase-orders/3',
    },
    {
      id: 4,
      type: 'delivery',
      icon: Truck,
      name: 'Delivery Note DN-2025-005',
      detail: 'Completed • 12/01/2025',
      timestamp: '2 days ago',
      link: '/app/delivery-notes/4',
    },
    {
      id: 5,
      type: 'customer',
      icon: Users,
      name: 'ABC Trading Inc',
      detail: 'Dubai, UAE • Premium',
      timestamp: '3 days ago',
      link: '/app/customers/5',
    },
  ]);

  const [quickAccessItems] = useState([
    { icon: Quote, name: 'Quotations', path: '/app/quotations', color: 'from-blue-500 to-blue-600' },
    { icon: FileText, name: 'Invoices', path: '/app/invoices', color: 'from-purple-500 to-purple-600' },
    { icon: ShoppingCart, name: 'Purchases', path: '/app/purchase-orders', color: 'from-orange-500 to-orange-600' },
    { icon: Truck, name: 'Deliveries', path: '/app/delivery-notes', color: 'from-green-500 to-green-600' },
    { icon: Users, name: 'Customers', path: '/app/customers', color: 'from-pink-500 to-pink-600' },
    { icon: Package, name: 'Products', path: '/app/products', color: 'from-indigo-500 to-indigo-600' },
    { icon: Warehouse, name: 'Warehouse', path: '/app/warehouses', color: 'from-cyan-500 to-cyan-600' },
    { icon: Settings, name: 'Settings', path: '/app/settings', color: 'from-gray-500 to-gray-600' },
  ]);

  const createNewItems = [
    { icon: Quote, name: 'New Quotation', path: '/app/quotations/new', color: 'blue' },
    { icon: FileText, name: 'New Invoice', path: '/app/invoices/new', color: 'purple' },
    { icon: ShoppingCart, name: 'New Purchase', path: '/app/purchase-orders/new', color: 'orange' },
    { icon: Truck, name: 'New Delivery', path: '/app/delivery-notes/new', color: 'green' },
    { icon: Users, name: 'New Customer', path: '/app/customers/new', color: 'pink' },
    { icon: Package, name: 'New Product', path: '/app/products/new', color: 'indigo' },
  ];

  useEffect(() => {
    // Load user name from auth service if available
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        setUserName(user.name || user.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`min-h-[calc(100vh-64px)] p-6 sm:p-8 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0A0E14]' : 'bg-[#FAFAFA]'
      }`}
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className={`text-4xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Home
            </h1>
            <p
              className={`text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Welcome back, {userName}! 👋
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Refresh"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* SECTION 1: Quick Access */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`h-1 w-1 rounded-full ${
                isDarkMode ? 'bg-teal-500' : 'bg-teal-600'
              }`}
            ></div>
            <h2
              className={`text-2xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Quick Access
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickAccessItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigate(item.path)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 group ${
                    isDarkMode
                      ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-500/50 hover:bg-[#252D38]'
                      : 'bg-white border-[#E0E0E0] hover:border-teal-500/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${item.color}`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <h3
                    className={`font-semibold text-left ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {item.name}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Create New */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`h-1 w-1 rounded-full ${
                isDarkMode ? 'bg-teal-500' : 'bg-teal-600'
              }`}
            ></div>
            <h2
              className={`text-2xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Create New
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {createNewItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 font-semibold transition-all duration-300 group ${
                    isDarkMode
                      ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-500 hover:bg-[#252D38] text-white'
                      : 'bg-white border-[#E0E0E0] hover:border-teal-500 hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Recent Items */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`h-1 w-1 rounded-full ${
                isDarkMode ? 'bg-teal-500' : 'bg-teal-600'
              }`}
            ></div>
            <h2
              className={`text-2xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Recent Items
            </h2>
          </div>

          <div
            className={`rounded-xl border transition-all ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-[#E0E0E0]'
            }`}
          >
            {recentItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.link)}
                  className={`w-full flex items-center justify-between p-4 transition-all hover:bg-teal-500/10 ${
                    index !== recentItems.length - 1
                      ? isDarkMode
                        ? 'border-b border-[#37474F]'
                        : 'border-b border-[#E0E0E0]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div
                      className={`p-2.5 rounded-lg ${
                        isDarkMode ? 'bg-[#252D38]' : 'bg-gray-100'
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${
                          isDarkMode ? 'text-teal-400' : 'text-teal-600'
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`font-semibold text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-600'
                        }`}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}
                    >
                      {item.timestamp}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM: Info Card */}
        <div
          className={`rounded-xl border-l-4 border-teal-500 p-6 ${
            isDarkMode
              ? 'bg-[#1E2328] border-[#37474F]'
              : 'bg-white border-[#E0E0E0]'
          }`}
        >
          <div className="flex items-start gap-4">
            <Bell
              className={`w-6 h-6 mt-1 flex-shrink-0 ${
                isDarkMode ? 'text-teal-400' : 'text-teal-600'
              }`}
            />
            <div>
              <h3
                className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Getting Started
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Use Quick Access to navigate to any module, view recent items you've worked on, or create new documents. All your data is synchronized in real-time across the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
