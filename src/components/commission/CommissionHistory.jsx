import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  History,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  User,
} from 'lucide-react';
import { commissionService } from '../../services/commissionService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';

/**
 * CommissionHistory Component
 * Shows historical commissions for a sales person with filtering
 */
const CommissionHistory = ({ salesPersonId, salesPersonName }) => {
  const { isDarkMode } = useTheme();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalEarned: 0,
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
  });

  const loadCommissions = useCallback(async () => {
    if (!salesPersonId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await commissionService.getSalesPersonCommissions(
        salesPersonId,
        statusFilter,
        365 // daysBack - get full year
      );
      
      const allCommissions = response?.commissions || [];
      
      // Apply local filters
      let filtered = allCommissions;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(c => 
          (c.invoiceNumber || c.invoice_number || '').toLowerCase().includes(term) ||
          (c.customerName || c.customer_name || '').toLowerCase().includes(term)
        );
      }
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(c => new Date(c.createdAt || c.created_at) >= fromDate);
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(c => new Date(c.createdAt || c.created_at) <= toDate);
      }

      
      // Calculate summary from all commissions (before pagination)
      const summaryData = filtered.reduce((acc, c) => {
        const amount = parseFloat(c.commissionAmount || c.commission_amount || 0);
        const status = (c.status || '').toUpperCase();
        acc.totalEarned += amount;
        if (status === 'PENDING') acc.totalPending += amount;
        if (status === 'APPROVED') acc.totalApproved += amount;
        if (status === 'PAID') acc.totalPaid += amount;
        return acc;
      }, { totalEarned: 0, totalPending: 0, totalApproved: 0, totalPaid: 0 });
      
      setSummary(summaryData);
      setTotalCount(filtered.length);
      
      // Apply pagination
      const startIdx = (currentPage - 1) * pageSize;
      const paginated = filtered.slice(startIdx, startIdx + pageSize);
      
      setCommissions(paginated);
    } catch (err) {
      console.error('Error loading commission history:', err);
      setError(err.message || 'Failed to load commission history');
      notificationService.error('Failed to load commission history');
    } finally {
      setLoading(false);
    }
  }, [salesPersonId, statusFilter, dateFrom, dateTo, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFrom, dateTo, searchTerm]);

  const totalPages = Math.ceil(totalCount / pageSize);


  const getStatusBadge = (status) => {
    const statusUpper = (status || '').toUpperCase();
    const config = {
      PENDING: { bg: 'bg-yellow-100 text-yellow-800', darkBg: 'bg-yellow-900/30 text-yellow-400', icon: Clock },
      APPROVED: { bg: 'bg-blue-100 text-blue-800', darkBg: 'bg-blue-900/30 text-blue-400', icon: CheckCircle },
      PAID: { bg: 'bg-green-100 text-green-800', darkBg: 'bg-green-900/30 text-green-400', icon: DollarSign },
      REVERSED: { bg: 'bg-red-100 text-red-800', darkBg: 'bg-red-900/30 text-red-400', icon: XCircle },
      VOIDED: { bg: 'bg-gray-100 text-gray-800', darkBg: 'bg-gray-700 text-gray-400', icon: XCircle },
    };
    const statusConfig = config[statusUpper] || config.PENDING;
    const Icon = statusConfig.icon;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${
        isDarkMode ? statusConfig.darkBg : statusConfig.bg
      }`}>
        <Icon className="w-3 h-3" />
        <span>{status || 'Pending'}</span>
      </span>
    );
  };

  if (!salesPersonId) {
    return (
      <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Select a sales person to view their commission history</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Commission History
          </h2>
          {salesPersonName && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {salesPersonName}
            </p>
          )}
        </div>
        <button
          onClick={loadCommissions}
          disabled={loading}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } disabled:opacity-50`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-lg p-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Earned</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(summary.totalEarned)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        
        <div className={`rounded-lg p-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
              <p className={`text-xl font-bold text-yellow-500`}>
                {formatCurrency(summary.totalPending)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
              <p className={`text-xl font-bold text-blue-500`}>
                {formatCurrency(summary.totalApproved)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Paid</p>
              <p className={`text-xl font-bold text-green-500`}>
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className={`rounded-lg p-4 border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border appearance-none ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>


          {/* Date From */}
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setDateFrom('');
              setDateTo('');
            }}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Clear Filters
          </button>
        </div>
      </div>


      {/* Commission List */}
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading history...
            </span>
          </div>
        ) : error ? (
          <div className={`p-6 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            <XCircle className="w-10 h-10 mx-auto mb-2" />
            <p>{error}</p>
            <button
              onClick={loadCommissions}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : commissions.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No commission records found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Invoice</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Customer</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Sale Amount</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Rate</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Commission</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Date</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Status</th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {commissions.map((commission, index) => {
                    const invoiceNumber = commission.invoiceNumber || commission.invoice_number || '-';
                    const customerName = commission.customerName || commission.customer_name || '-';
                    const saleAmount = parseFloat(commission.saleAmount || commission.sale_amount || 0);
                    const rate = commission.commissionRate || commission.commission_rate || 0;
                    const amount = parseFloat(commission.commissionAmount || commission.commission_amount || 0);
                    const date = commission.createdAt || commission.created_at;
                    const status = commission.status || 'PENDING';

                    return (
                      <tr 
                        key={commission.id || index}
                        className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                      >
                        <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 opacity-50" />
                            <span>{invoiceNumber}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {customerName}
                        </td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {formatCurrency(saleAmount)}
                        </td>
                        <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rate}%
                        </td>
                        <td className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(amount)}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {date ? formatDate(date) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-4 py-3 border-t ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              } flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 rounded border text-sm ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 disabled:text-gray-600'
                        : 'hover:bg-gray-200 text-gray-600 disabled:text-gray-300'
                    } disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 disabled:text-gray-600'
                        : 'hover:bg-gray-200 text-gray-600 disabled:text-gray-300'
                    } disabled:cursor-not-allowed`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommissionHistory;
