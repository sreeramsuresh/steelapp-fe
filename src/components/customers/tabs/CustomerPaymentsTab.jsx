/**
 * Customer Payments Tab
 *
 * Displays all payments received from a specific customer with detailed allocation tracking:
 * - Summary Cards: Total received, allocated amount, unallocated balance, last payment date
 * - Filters: Date range (all/30/60/90 days), Payment method (all/cash/check/bank-transfer/credit-card)
 * - Expandable Rows: Shows allocation breakdown - which invoices each payment was applied to
 * - Pagination: 20 payments per page
 * - Payment Methods: Visual icons for cash, check, bank transfer, credit card
 *
 * Performance Features:
 * - 5-minute data caching to reduce API calls
 * - Manual refresh button to force cache clear
 * - Expandable rows with smooth transitions
 * - Loading states and error handling
 *
 * API Endpoint: GET /api/payments?customerId={customerId}
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.customerId - Customer ID to fetch payments for
 * @returns {JSX.Element} Payment list with allocation details
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { apiClient } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/invoiceUtils';
import {
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Calendar,
  TrendingUp,
  Banknote,
} from 'lucide-react';

export default function CustomerPaymentsTab({ customerId }) {
  const { isDarkMode } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Caching state
  const [cachedData, setCachedData] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Filters
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cachedData || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  }, [cachedData, cacheTimestamp, CACHE_DURATION]);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        `/payments?customerId=${customerId}`,
      );
      const paymentData = response.payments || [];
      setPayments(paymentData);
      setFilteredPayments(paymentData);

      // Update cache
      setCachedData(paymentData);
      setCacheTimestamp(Date.now());
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Manual refresh - clears cache and refetches
  const handleRefresh = () => {
    setCachedData(null);
    setCacheTimestamp(null);
    fetchPayments();
  };

  useEffect(() => {
    if (customerId) {
      // Use cache if valid
      if (isCacheValid()) {
        setPayments(cachedData);
        setFilteredPayments(cachedData);
        setLoading(false);
        return;
      }

      // Otherwise fetch fresh data
      fetchPayments();
    }
  }, [customerId, cachedData, cacheTimestamp, isCacheValid, fetchPayments]);

  // Apply filters
  useEffect(() => {
    let filtered = [...payments];

    // Date range filter
    const now = new Date();
    if (dateRangeFilter !== 'all') {
      const daysBack = parseInt(dateRangeFilter);
      const cutoffDate = new Date(
        now.getTime() - daysBack * 24 * 60 * 60 * 1000,
      );
      filtered = filtered.filter(
        (payment) => new Date(payment.paymentDate) >= cutoffDate,
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(
        (payment) =>
          payment.paymentMethod?.toLowerCase() ===
          paymentMethodFilter.toLowerCase(),
      );
    }

    setFilteredPayments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [payments, dateRangeFilter, paymentMethodFilter]);

  // Calculate summary stats
  const summaryStats = {
    totalReceived: filteredPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0,
    ),
    totalAllocated: filteredPayments.reduce(
      (sum, p) => sum + (parseFloat(p.allocatedAmount) || 0),
      0,
    ),
    totalUnallocated: filteredPayments.reduce(
      (sum, p) => sum + (parseFloat(p.unallocatedAmount) || 0),
      0,
    ),
    lastPaymentDate:
      filteredPayments.length > 0
        ? filteredPayments.reduce((latest, p) => {
          const pDate = new Date(p.paymentDate);
          return pDate > latest ? pDate : latest;
        }, new Date(filteredPayments[0].paymentDate))
        : null,
  };

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Toggle row expansion
  const toggleRowExpansion = (paymentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedRows(newExpanded);
  };

  // Payment method icon
  const getPaymentMethodIcon = (method) => {
    const methodLower = method?.toLowerCase() || '';
    if (methodLower.includes('cash')) return <Banknote size={16} />;
    if (methodLower.includes('bank') || methodLower.includes('transfer'))
      return <TrendingUp size={16} />;
    return <CreditCard size={16} />;
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
      <div
        className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}
      >
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-red-500" />
          <p
            className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}
          >
            Error Loading Payments
          </p>
        </div>
        <p
          className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}
        >
          {error}
        </p>
        <button
          onClick={fetchPayments}
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
        <h3 className={`text-lg font-semibold ${primaryText}`}>
          Customer Payments
        </h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
          }`}
          title="Refresh payments data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Received</p>
            <DollarSign size={18} className="text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>
            {formatCurrency(summaryStats.totalReceived)}
          </p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Allocated</p>
            <CreditCard size={18} className="text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>
            {formatCurrency(summaryStats.totalAllocated)}
          </p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Total Unallocated</p>
            <TrendingUp size={18} className="text-yellow-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>
            {formatCurrency(summaryStats.totalUnallocated)}
          </p>
        </div>

        <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${secondaryText}`}>Last Payment</p>
            <Calendar size={18} className="text-purple-500" />
          </div>
          <p className={`text-2xl font-bold ${primaryText}`}>
            {summaryStats.lastPaymentDate
              ? formatDate(summaryStats.lastPaymentDate)
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
        <div className="flex flex-wrap gap-4">
          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="payment-date-range-filter"
              className={`block text-sm font-medium ${secondaryText} mb-2`}
            >
              Date Range
            </label>
            <select
              id="payment-date-range-filter"
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

          {/* Payment Method Filter */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="payment-method-filter"
              className={`block text-sm font-medium ${secondaryText} mb-2`}
            >
              Payment Method
            </label>
            <select
              id="payment-method-filter"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${borderColor} ${cardBg} ${primaryText} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table with Expandable Rows */}
      <div
        className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider w-10`}
                >
                  {/* Expand column */}
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}
                >
                  Payment Date
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}
                >
                  Reference
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${secondaryText} uppercase tracking-wider`}
                >
                  Payment Method
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider`}
                >
                  Amount
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider`}
                >
                  Allocated
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${secondaryText} uppercase tracking-wider`}
                >
                  Unallocated
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
            >
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className={`px-4 py-8 text-center ${secondaryText}`}
                  >
                    No payments found
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => {
                  const isExpanded = expandedRows.has(payment.id);
                  const hasAllocations =
                    payment.allocations && payment.allocations.length > 0;

                  return (
                    <React.Fragment key={payment.id}>
                      {/* Main payment row */}
                      <tr className={hoverBg}>
                        <td className="px-4 py-3">
                          {hasAllocations && (
                            <button
                              onClick={() => toggleRowExpansion(payment.id)}
                              className={`p-1 rounded ${hoverBg}`}
                            >
                              {isExpanded ? (
                                <ChevronDown
                                  size={16}
                                  className={secondaryText}
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className={secondaryText}
                                />
                              )}
                            </button>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${primaryText}`}
                        >
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${primaryText} font-medium`}
                        >
                          {payment.referenceNumber || 'N/A'}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${secondaryText}`}
                        >
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span>{payment.paymentMethod || 'N/A'}</span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-right ${primaryText} font-medium`}
                        >
                          {formatCurrency(payment.amount)}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-right ${primaryText}`}
                        >
                          {formatCurrency(payment.allocatedAmount)}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-right ${primaryText}`}
                        >
                          {formatCurrency(payment.unallocatedAmount)}
                        </td>
                      </tr>

                      {/* Expandable allocation breakdown */}
                      {isExpanded && hasAllocations && (
                        <tr>
                          <td
                            colSpan="7"
                            className={`px-4 py-3 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}`}
                          >
                            <div className="pl-8">
                              <p
                                className={`text-sm font-medium ${primaryText} mb-2`}
                              >
                                Payment Allocations:
                              </p>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className={`border-b ${borderColor}`}>
                                    <th
                                      className={`text-left py-2 ${secondaryText} font-medium`}
                                    >
                                      Invoice Number
                                    </th>
                                    <th
                                      className={`text-right py-2 ${secondaryText} font-medium`}
                                    >
                                      Amount Allocated
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payment.allocations.map(
                                    (allocation, idx) => (
                                      <tr
                                        key={`${payment.id}-alloc-${idx}`}
                                        className={`border-b ${borderColor}`}
                                      >
                                        <td className={`py-2 ${primaryText}`}>
                                          {allocation.invoiceNumber}
                                        </td>
                                        <td
                                          className={`py-2 text-right ${primaryText}`}
                                        >
                                          {formatCurrency(allocation.amount)}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`px-4 py-3 border-t ${borderColor} flex items-center justify-between`}
          >
            <div className={`text-sm ${secondaryText}`}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of{' '}
              {filteredPayments.length} payments
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
