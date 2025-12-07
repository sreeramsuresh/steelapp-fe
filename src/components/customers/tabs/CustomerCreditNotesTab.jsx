/**
 * Customer Credit Notes Tab
 * 
 * Displays all credit notes issued for a specific customer with status tracking:
 * - Summary Cards: Total count, total amount issued, amount applied, remaining balance
 * - Filters: Status (all/open/partially-applied/fully-applied), Date range (all/30/60/90 days)
 * - Linked Invoice Display: Shows original invoice reference for each credit note
 * - Status Tracking: Open, Fully Applied, Partially Applied with color-coded badges
 * - Pagination: 20 credit notes per page
 * 
 * Performance Features:
 * - 5-minute data caching to reduce API calls
 * - Manual refresh button to force cache clear
 * - Loading states with spinner
 * - Error handling with retry capability
 * 
 * API Endpoint: GET /api/credit-notes?customerId={customerId}
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.customerId - Customer ID to fetch credit notes for
 * @returns {JSX.Element} Credit note list with status tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { apiClient } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/invoiceUtils';
import {
  FileText,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function CustomerCreditNotesTab({ customerId }) {
  const { isDarkMode } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creditNotes, setCreditNotes] = useState([]);
  const [filteredCreditNotes, setFilteredCreditNotes] = useState([]);
  
  // Caching state
  const [cachedData, setCachedData] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cachedData || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  }, [cachedData, cacheTimestamp, CACHE_DURATION]);

  // Fetch credit notes
  const fetchCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/credit-notes?customerId=${customerId}`);
      const creditNoteData = response.creditNotes || [];
      setCreditNotes(creditNoteData);
      setFilteredCreditNotes(creditNoteData);
      
      // Update cache
      setCachedData(creditNoteData);
      setCacheTimestamp(Date.now());
    } catch (err) {
      console.error('Failed to fetch credit notes:', err);
      setError(err.message || 'Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Manual refresh - clears cache and refetches
  const handleRefresh = () => {
    setCachedData(null);
    setCacheTimestamp(null);
    fetchCreditNotes();
  };

  useEffect(() => {
    if (customerId) {
      // Use cache if valid
      if (isCacheValid()) {
        setCreditNotes(cachedData);
        setFilteredCreditNotes(cachedData);
        setLoading(false);
        return;
      }
      
      // Otherwise fetch fresh data
      fetchCreditNotes();
    }
  }, [customerId, cachedData, cacheTimestamp, isCacheValid, fetchCreditNotes]);

  // Determine credit note status
  const getCreditNoteStatus = (creditNote) => {
    const amount = parseFloat(creditNote.amount) || 0;
    const remainingBalance = parseFloat(creditNote.remainingBalance) || 0;
    
    if (remainingBalance === 0) return 'fully-applied';
    if (remainingBalance < amount) return 'partially-applied';
    return 'open';
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...creditNotes];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cn => {
        const status = getCreditNoteStatus(cn);
        return status === statusFilter;
      });
    }

    // Date range filter
    const now = new Date();
    if (dateRangeFilter !== 'all') {
      const daysBack = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(cn => new Date(cn.date) >= cutoffDate);
    }

    setFilteredCreditNotes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [creditNotes, statusFilter, dateRangeFilter]);

  // Calculate summary stats
  const summaryStats = {
    totalCount: filteredCreditNotes.length,
    totalAmount: filteredCreditNotes.reduce((sum, cn) => sum + (parseFloat(cn.amount) || 0), 0),
    totalApplied: filteredCreditNotes.reduce((sum, cn) => {
      const amount = parseFloat(cn.amount) || 0;
      const remaining = parseFloat(cn.remainingBalance) || 0;
      return sum + (amount - remaining);
    }, 0),
    totalRemaining: filteredCreditNotes.reduce((sum, cn) => sum + (parseFloat(cn.remainingBalance) || 0), 0),
  };

  // Pagination
  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);
  const paginatedCreditNotes = filteredCreditNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'open': {
        bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
        text: isDarkMode ? 'text-blue-400' : 'text-blue-700',
        label: 'Open',
      },
      'partially-applied': {
        bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
        text: isDarkMode ? 'text-yellow-400' : 'text-yellow-700',
        label: 'Partially Applied',
      },
      'fully-applied': {
        bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
        text: isDarkMode ? 'text-green-400' : 'text-green-700',
        label: 'Fully Applied',
      },
    };

    const config = statusConfig[status] || statusConfig['open'];
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Styling
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const primaryText = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryText = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}>
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-red-500" />
          <p className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Error Loading Credit Notes</p>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
        <button
          onClick={fetchCreditNotes}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${primaryText}`}>Customer Credit Notes</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
          }`}
          title="Refresh credit notes data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Credit Notes</p>
            <FileText size={18} className="text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{summaryStats.totalCount}</p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Amount</p>
            <DollarSign size={18} className="text-purple-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{formatCurrency(summaryStats.totalAmount)}</p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Applied</p>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{formatCurrency(summaryStats.totalApplied)}</p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Remaining</p>
            <Clock size={18} className="text-yellow-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>{formatCurrency(summaryStats.totalRemaining)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="credit-note-status-filter" className={`block text-sm font-medium ${secondaryText} mb-2`}>
              Status
            </label>
            <select
              id="credit-note-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="partially-applied">Partially Applied</option>
              <option value="fully-applied">Fully Applied</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="credit-note-date-range-filter" className={`block text-sm font-medium ${secondaryText} mb-2`}>
              Date Range
            </label>
            <select
              id="credit-note-date-range-filter"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Credit Notes Table */}
      <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Credit Note Number
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Date
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Amount
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Remaining Balance
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Linked Invoice(s)
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedCreditNotes.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-4 py-8 text-center ${secondaryText}`}>
                    No credit notes found
                  </td>
                </tr>
              ) : (
                paginatedCreditNotes.map((creditNote) => {
                  const status = getCreditNoteStatus(creditNote);
                  
                  return (
                    <tr key={creditNote.id} className={hoverBg}>
                      <td className={`px-4 py-3 whitespace-nowrap ${primaryText} font-medium`}>
                        {creditNote.creditNoteNumber}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap ${secondaryText}`}>
                        {formatDate(creditNote.date)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right ${primaryText}`}>
                        {formatCurrency(creditNote.amount)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right ${primaryText}`}>
                        {formatCurrency(creditNote.remainingBalance)}
                      </td>
                      <td className={`px-4 py-3 ${secondaryText}`}>
                        {creditNote.linkedInvoices && creditNote.linkedInvoices.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {creditNote.linkedInvoices.map((invoice, idx) => (
                              <span 
                                key={idx}
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {invoice}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={secondaryText}>No linked invoices</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-4 py-3 border-t ${borderColor} flex items-center justify-between`}>
            <div className={`text-sm ${secondaryText}`}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCreditNotes.length)} of {filteredCreditNotes.length} credit notes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${borderColor} ${primaryText} disabled:opacity-50 disabled:cursor-not-allowed ${hoverBg}`}
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md border ${borderColor} ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : `${primaryText} ${hoverBg}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border ${borderColor} ${primaryText} disabled:opacity-50 disabled:cursor-not-allowed ${hoverBg}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
