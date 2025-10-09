import React, { useState, useEffect } from "react";
import { Eye, Navigation, Package, FileText, Search, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";

const TransitList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [transitItems, setTransitItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { 
        className: isDarkMode 
          ? "bg-gray-900/30 text-gray-300 border-gray-600" 
          : "bg-gray-100 text-gray-800 border-gray-300", 
        label: "DRAFT" 
      },
      pending: { 
        className: isDarkMode 
          ? "bg-blue-900/30 text-blue-300 border-blue-600" 
          : "bg-blue-100 text-blue-800 border-blue-300", 
        label: "PENDING" 
      },
      confirmed: { 
        className: isDarkMode 
          ? "bg-orange-900/30 text-orange-300 border-orange-600" 
          : "bg-orange-100 text-orange-800 border-orange-300", 
        label: "CONFIRMED" 
      },
      received: { 
        className: isDarkMode 
          ? "bg-green-900/30 text-green-300 border-green-600" 
          : "bg-green-100 text-green-800 border-green-300", 
        label: "RECEIVED" 
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getStockStatusBadge = (stockStatus) => {
    const statusConfig = {
      retain: { 
        className: isDarkMode 
          ? "bg-green-900/30 text-green-300 border-green-600" 
          : "bg-green-100 text-green-800 border-green-300", 
        label: "RETAIN" 
      },
      transit: { 
        className: isDarkMode 
          ? "bg-orange-900/30 text-orange-300 border-orange-600" 
          : "bg-orange-100 text-orange-800 border-orange-300", 
        label: "TRANSIT" 
      },
    };

    const config = statusConfig[stockStatus] || statusConfig.retain;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
        <Navigation size={12} />
        {config.label}
      </span>
    );
  };

  // Fetch Purchase Orders with Transit status
  const fetchTransitPurchaseOrders = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/purchase-orders?stock_status=transit`);
      
      if (response.ok) {
        const data = await response.json();
        setTransitItems(data.purchase_orders || data || []);
      } else {
        console.error('Failed to fetch transit purchase orders');
        setTransitItems([]);
      }
    } catch (error) {
      console.error('Error fetching transit purchase orders:', error);
      setTransitItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitPurchaseOrders();
  }, []);

  const filteredItems = transitItems.filter(item => {
    const matchesSearch = (item.po_number && item.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.supplier_name && item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading transit items...
          </span>
        </div>
      </div>
    );
  }

  if (transitItems.length === 0 && !loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className={`text-center p-12 rounded-2xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <Navigation size={64} className="mx-auto mb-4 opacity-50" />
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Transit Purchase Orders
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Purchase orders with "Transit" stock status will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🚛 Transit Purchase Orders
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Purchase orders marked as Transit - not yet added to stock
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-orange-500">
                {transitItems.filter(item => item.status === 'pending').length}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-blue-500">
                {transitItems.filter(item => item.status === 'confirmed').length}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Confirmed
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-red-500">
                {transitItems.filter(item => item.status === 'draft').length}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Draft
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-green-500">
                {formatCurrency(transitItems.reduce((sum, item) => sum + (item.total || 0), 0))}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Value
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <div className="flex-grow min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <input
              type="text"
              placeholder="Search by PO number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <div className="min-w-[150px] relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>
        </div>

        {/* Transit Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  PO Number
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Supplier
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  PO Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Expected Delivery
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Value
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Stock Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-teal-600">
                      {item.po_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.supplier_name}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.supplier_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(item.po_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(item.expected_delivery_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(item.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStockStatusBadge(item.stock_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                      }`}
                      title="Edit Purchase Order"
                      onClick={() => {
                        navigate(`/purchase-orders/${item.id}/edit`);
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransitList;