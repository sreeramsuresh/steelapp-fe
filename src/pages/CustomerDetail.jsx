/**
 * Customer Detail Page - Hybrid Dual-Path Architecture
 *
 * Unified customer 360° view accessible from two entry points:
 * - Finance Path: Dashboard → AR Aging Report → Customer Row Click → AR Tab
 * - Operations Path: Masters → Customers → Customer Card Click → Overview Tab
 *
 * Architecture:
 * - URL-driven tab state via ?tab= query parameter (refresh-safe)
 * - Lazy-loaded tab components for optimal performance
 * - Permission-based tab visibility
 * - Code-split per tab to reduce initial bundle size
 * - 5-minute data caching per tab to reduce API calls
 * - Manual refresh capability on each tab
 *
 * Route: /customers/:customerId?tab=<tab-name>
 *
 * Tabs Available:
 * - overview: Master data, credit summary, AR summary
 * - ar-aging: Detailed AR aging buckets and credit analysis
 * - invoices: Customer-scoped invoice list with filters
 * - payments: Payment history and allocation breakdown
 * - credit-notes: Credit notes with linked invoices
 * - activity: Timeline of notes, calls, follow-ups
 *
 * Permission Integration:
 * - Uses useCustomerTabPermissions hook to control tab visibility
 * - Automatically redirects to first allowed tab if accessing forbidden tab
 * - Shows access denied screen if user has no tab permissions
 *
 * Performance Features:
 * - React.lazy() for all tab components
 * - Suspense boundaries with loading states
 * - Data caching in each tab component
 * - Optimized re-renders
 *
 * @param {string} :customerId - URL parameter for customer ID
 * @returns {JSX.Element} Customer detail page with tabbed interface
 */

import { lazy, Suspense, useEffect, useState } from "react";
import { FaArrowLeft, FaHome, FaSpinner, FaUsers } from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import CustomerOverviewTab from "../components/customers/tabs/CustomerOverviewTab";
import { useTheme } from "../contexts/ThemeContext";
import { useCustomerTabPermissions } from "../hooks/useCustomerTabPermissions";
import { customerService } from "../services/customerService";

// Lazy-loaded tab components for performance optimization
const CustomerARAgingDetail = lazy(() => import("../components/customers/CustomerARAgingDetail"));
const CustomerInvoicesTab = lazy(() => import("../components/customers/tabs/CustomerInvoicesTab"));
const CustomerPaymentsTab = lazy(() => import("../components/customers/tabs/CustomerPaymentsTab"));
const CustomerCreditNotesTab = lazy(() => import("../components/customers/tabs/CustomerCreditNotesTab"));
const CustomerActivityTab = lazy(() => import("../components/customers/tabs/CustomerActivityTab"));

export default function CustomerDetail() {
  const { customerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Permission-based tab visibility
  const { tabPermissions, getFirstAllowedTab, hasAnyTabAccess } = useCustomerTabPermissions();

  // State
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Tab configuration - only show tabs user has permission to access
  const allTabs = [
    { id: "overview", label: "Overview" },
    { id: "ar-aging", label: "AR Aging" },
    { id: "invoices", label: "Invoices" },
    { id: "payments", label: "Payments" },
    { id: "credit-notes", label: "Credit Notes" },
    { id: "activity", label: "Activity" },
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter((tab) => tabPermissions[tab.id]);

  // Fetch customer data on mount or when customerId changes
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        const customer = await customerService.getCustomer(customerId);
        setCustomerData(customer);
      } catch (err) {
        setError(err.message || "Failed to load customer data");
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Sync active tab with URL on mount and when URL changes
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && tabs.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    } else if (!urlTab) {
      setActiveTab("overview");
    }
  }, [searchParams, tabs]);

  // Permission-based tab access control
  // Redirect to first allowed tab if current tab is forbidden
  useEffect(() => {
    if (!tabPermissions[activeTab] && hasAnyTabAccess) {
      const firstAllowed = getFirstAllowedTab();
      if (firstAllowed) {
        setActiveTab(firstAllowed);
        setSearchParams({ tab: firstAllowed });
      }
    }
  }, [activeTab, tabPermissions, hasAnyTabAccess, getFirstAllowedTab, setSearchParams]);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className={`w-12 h-12 animate-spin ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
          <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Loading customer details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className={`text-5xl ${isDarkMode ? "text-red-400" : "text-red-600"}`}>⚠️</div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
            Error Loading Customer
          </h2>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{error}</p>
          <button
            onClick={() => navigate("/customers")}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  // Access denied state - user has no permissions for any tab
  if (!hasAnyTabAccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className={`text-5xl ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>🔒</div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Access Denied</h2>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            You do not have permission to view customer details.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2"
          >
            <FaHome />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // No customer data
  if (!customerData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Customer not found</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      {/* Breadcrumb Navigation */}
      <div
        className={`mb-6 p-4 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
        } border rounded-lg`}
      >
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-1 hover:underline ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
          >
            <FaHome />
            Home
          </button>
          <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>/</span>
          <button
            onClick={() => navigate("/customers")}
            className={`flex items-center gap-1 hover:underline ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
          >
            <FaUsers />
            Customers
          </button>
          <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>/</span>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{customerData.name}</span>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode ? "bg-[#37474F] text-gray-300 hover:bg-[#455A64]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaArrowLeft />
          Back to Customers
        </button>
      </div>

      {/* Customer Header */}
      <div
        className={`mb-6 p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
        } border rounded-lg shadow-sm`}
      >
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          {customerData.name}
        </h1>
        <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{customerData.company}</p>
        <span
          className={`inline-block mt-3 px-3 py-1 text-sm font-medium uppercase tracking-wider rounded-full ${
            customerData.status === "active"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {customerData.status}
        </span>
      </div>

      {/* Tab Navigation */}
      <div
        className={`mb-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
        } border rounded-lg overflow-hidden`}
      >
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "bg-[#008B8B] text-white border-b-2 border-teal-400"
                    : "bg-[#008B8B] text-white border-b-2 border-teal-600"
                  : isDarkMode
                    ? "text-gray-400 hover:bg-[#37474F] hover:text-gray-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div
        className={`p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"
        } border rounded-lg shadow-sm min-h-[400px]`}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <FaSpinner className={`w-8 h-8 animate-spin ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            </div>
          }
        >
          {activeTab === "overview" && <CustomerOverviewTab customer={customerData} />}
          {activeTab === "ar-aging" && (
            <Suspense
              fallback={
                <div className={`flex items-center justify-center py-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading AR aging details...</p>
                  </div>
                </div>
              }
            >
              <CustomerARAgingDetail customerId={parseInt(customerId)} />
            </Suspense>
          )}
          {activeTab === "invoices" && (
            <Suspense
              fallback={
                <div className={`flex items-center justify-center py-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading invoices...</p>
                  </div>
                </div>
              }
            >
              <CustomerInvoicesTab customerId={parseInt(customerId)} />
            </Suspense>
          )}
          {activeTab === "payments" && (
            <Suspense
              fallback={
                <div className={`flex items-center justify-center py-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading payments...</p>
                  </div>
                </div>
              }
            >
              <CustomerPaymentsTab customerId={parseInt(customerId)} />
            </Suspense>
          )}
          {activeTab === "credit-notes" && (
            <Suspense
              fallback={
                <div className={`flex items-center justify-center py-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading credit notes...</p>
                  </div>
                </div>
              }
            >
              <CustomerCreditNotesTab customerId={parseInt(customerId)} />
            </Suspense>
          )}
          {activeTab === "activity" && (
            <Suspense
              fallback={
                <div className={`flex items-center justify-center py-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading activity...</p>
                  </div>
                </div>
              }
            >
              <CustomerActivityTab customerId={parseInt(customerId)} />
            </Suspense>
          )}
        </Suspense>
      </div>
    </div>
  );
}
