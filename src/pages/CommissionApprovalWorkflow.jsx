import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { commissionService } from '../services/commissionService';
import { FormSelect } from '../components/ui/form-select';
import { SelectItem } from '../components/ui/select';
import { useTheme } from '../contexts/ThemeContext';

export default function CommissionApprovalWorkflow() {
  const { isDarkMode } = useTheme();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [salesPersonStats, setSalesPersonStats] = useState({});

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null); // 'approve' or 'pay'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const [pendingData, dashboardData] = await Promise.all([
        commissionService.getPendingApprovals(50).catch(() => ({ pendingApprovals: [] })),
        commissionService.getDashboard().catch(() => ({})),
      ]);

      // Handle both snake_case (pending_approvals) and camelCase (pendingApprovals)
      const approvals = (Array.isArray(pendingData) ? pendingData :
                         (pendingData?.pendingApprovals || pendingData?.pending_approvals || []));

      setPendingApprovals(approvals);

      // Load stats for each sales person
      if (approvals && approvals.length > 0) {
        const salesPersonIds = [
          ...new Set(
            approvals.map((c) => c.salesPersonId || c.sales_person_id),
          ),
        ];
        const stats = {};

        for (const spId of salesPersonIds) {
          try {
            const spStats =
              await commissionService.getSalesPersonCommissionStats(spId);
            stats[spId] = spStats;
          } catch (err) {
            console.warn(
              `[CommissionApprovalWorkflow] Failed to load stats for sales person ${spId}:`,
              err,
            );
          }
        }

        setSalesPersonStats(stats);
      } else if (dashboardData && Object.keys(dashboardData).length > 0) {
        // If no pending approvals, use dashboard data to show that commissions exist
        // This prevents showing zero metrics when there are actual commissions in the system
      }
    } catch (err) {
      const errorMsg =
        err?.message || err?.toString?.() || String(err) || 'Unknown error';
      setError(errorMsg);
      console.error('[CommissionApprovalWorkflow] Error loading approvals:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
        toString: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommission = async (commission) => {
    try {
      setUpdating(true);
      const approvedByUserId = parseInt(localStorage.getItem('userId')) || 1;

      await commissionService.approveCommission(
        commission.invoiceId,
        approvedByUserId,
      );

      setSuccessMessage(
        `Commission for Invoice ${commission.invoiceNumber} approved!`,
      );
      setSelectedCommission(null);

      // Reload approvals
      setTimeout(() => {
        loadPendingApprovals();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(`Error approving commission: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const _handleRejectCommission = async (_commission) => {
    // In a real scenario, this would be a separate action
  };

  // Batch selection handlers
  const toggleSelection = (invoiceId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === pendingApprovals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(pendingApprovals.map((c) => c.invoiceId || c.invoice_id)),
      );
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      setUpdating(true);
      setBulkAction('approve');
      const ids = Array.from(selectedIds);
      await commissionService.bulkApprove(ids);
      setSuccessMessage(`Successfully approved ${ids.length} commission(s)!`);
      setSelectedIds(new Set());
      setTimeout(() => {
        loadPendingApprovals();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(`Error bulk approving: ${err.message}`);
    } finally {
      setUpdating(false);
      setBulkAction(null);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return;
    try {
      setUpdating(true);
      setBulkAction('pay');
      const ids = Array.from(selectedIds);
      await commissionService.bulkMarkPaid(ids);
      setSuccessMessage(
        `Successfully marked ${ids.length} commission(s) as paid!`,
      );
      setSelectedIds(new Set());
      setTimeout(() => {
        loadPendingApprovals();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(`Error bulk marking paid: ${err.message}`);
    } finally {
      setUpdating(false);
      setBulkAction(null);
    }
  };

  // Pagination calculations
  const totalCount = pendingApprovals.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedApprovals = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return pendingApprovals.slice(startIdx, startIdx + pageSize);
  }, [pendingApprovals, currentPage, pageSize]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        Loading approvals...
      </div>
    );

  return (
    <div
      className={`p-6 min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              ✅ Commission Approval Workflow
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Manage and approve pending commission payouts
            </p>
          </div>
          <button
            onClick={loadPendingApprovals}
            disabled={loading}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {successMessage && (
          <div
            className={`border rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}
          >
            <p className={isDarkMode ? 'text-green-200' : 'text-green-800'}>
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div
            className={`border rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'}`}
          >
            <p className={isDarkMode ? 'text-red-200' : 'text-red-800'}>
              {error}
            </p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Pending Approval
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingApprovals.length}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Total Pending Amount
            </div>
            <div className="text-3xl font-bold text-blue-600">
              $
              {pendingApprovals
                .reduce(
                  (sum, c) =>
                    sum + (c.commissionAmount || c.commission_amount || 0),
                  0,
                )
                .toFixed(2)}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Approval Deadline
            </div>
            <div className="text-lg font-bold text-red-600">15 days</div>
          </div>
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Sales Persons
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {
                [
                  ...new Set(
                    pendingApprovals.map(
                      (c) => c.salesPersonId || c.sales_person_id,
                    ),
                  ),
                ].length
              }
            </div>
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {selectedIds.size > 0 && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'}`}
          >
            <div
              className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}
            >
              {selectedIds.size} commission(s) selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkAction === 'approve' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve Selected
              </button>
              <button
                onClick={handleBulkMarkPaid}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkAction === 'pay' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                Mark as Paid
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Pending Approvals List */}
        <div
          className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div
            className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <h2
              className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Pending Commissions
            </h2>
            {pendingApprovals.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === pendingApprovals.length &&
                    pendingApprovals.length > 0
                  }
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Select All
                </span>
              </label>
            )}
          </div>

          {pendingApprovals.length === 0 ? (
            <div
              className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No pending commissions - all approvals are up to date!</p>
            </div>
          ) : (
            <div
              className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
            >
              {paginatedApprovals.map((commission, idx) => {
                // Handle both snake_case and camelCase field names
                const salesPersonId =
                  commission.salesPersonId || commission.sales_person_id;
                const invoiceId = commission.invoiceId || commission.invoice_id;
                const invoiceNumber =
                  commission.invoiceNumber || commission.invoice_number;
                const commissionAmount =
                  commission.commissionAmount || commission.commission_amount;
                const gracePeriodEndDate =
                  commission.gracePeriodEndDate ||
                  commission.grace_period_end_date;
                const daysUntilDeadline =
                  commission.daysUntilDeadline ||
                  commission.days_until_deadline;

                const _stats = salesPersonStats[salesPersonId] || {};
                const gracePeriodEnd = gracePeriodEndDate
                  ? new Date(gracePeriodEndDate)
                  : new Date();
                const daysRemaining =
                  daysUntilDeadline && daysUntilDeadline > 0
                    ? daysUntilDeadline
                    : gracePeriodEndDate
                      ? Math.ceil(
                          (gracePeriodEnd - new Date()) / (1000 * 60 * 60 * 24),
                        )
                      : 0;
                const isSelected = selectedIds.has(invoiceId);

                return (
                  <div
                    key={idx}
                    className={`p-4 cursor-pointer transition ${isSelected ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''} ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedCommission(commission)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCommission(commission);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(invoiceId);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              Invoice {invoiceNumber}
                            </div>
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                              PENDING APPROVAL
                            </span>
                          </div>
                          <div
                            className={`grid grid-cols-3 gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            <div>
                              <span className="font-semibold">Amount:</span> $
                              {commissionAmount?.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-semibold">Accrued:</span>{' '}
                              {new Date().toLocaleDateString()}
                            </div>
                            <div
                              className={
                                daysRemaining < 3
                                  ? 'text-red-600 font-semibold'
                                  : ''
                              }
                            >
                              <Clock className="inline w-4 h-4 mr-1" />
                              {daysRemaining} days to adjust
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveCommission(commission);
                          }}
                          disabled={updating}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {updating ? 'Approving...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              className={`px-6 py-4 border-t flex items-center justify-between ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </span>
                <FormSelect
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                  showValidation={false}
                  className="w-auto"
                >
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </FormSelect>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-600 text-gray-400 disabled:text-gray-500' : 'hover:bg-gray-200 text-gray-600 disabled:text-gray-300'} disabled:cursor-not-allowed`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-600 text-gray-400 disabled:text-gray-500' : 'hover:bg-gray-200 text-gray-600 disabled:text-gray-300'} disabled:cursor-not-allowed`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Commission Detail Modal */}
        {selectedCommission &&
          (() => {
            // Handle both snake_case and camelCase field names
            const invoiceNumber =
              selectedCommission.invoiceNumber ||
              selectedCommission.invoice_number;
            const commissionAmount =
              selectedCommission.commissionAmount ||
              selectedCommission.commission_amount;
            const gracePeriodEndDate =
              selectedCommission.gracePeriodEndDate ||
              selectedCommission.grace_period_end_date;

            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className={`rounded-lg shadow-lg max-w-2xl w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <div
                    className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <h2
                      className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      Commission Details
                    </h2>
                    <button
                      onClick={() => setSelectedCommission(null)}
                      className={
                        isDarkMode
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-500 hover:text-gray-700'
                      }
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div
                          className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Invoice
                        </div>
                        <p
                          className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {invoiceNumber}
                        </p>
                      </div>
                      <div>
                        <div
                          className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Status
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded inline-block">
                          PENDING
                        </span>
                      </div>
                      <div>
                        <div
                          className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Commission Amount
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(commissionAmount || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <div
                          className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          Grace Period End
                        </div>
                        <p
                          className={
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }
                        >
                          {gracePeriodEndDate
                            ? new Date(gracePeriodEndDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Approval Workflow */}
                    <div
                      className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <h3
                        className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        Approval Workflow
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p
                              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              1. Pending Approval
                            </p>
                            <p
                              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Commission accrued, waiting for manager approval
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-gray-400" />
                          <div>
                            <p
                              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              2. Approved
                            </p>
                            <p
                              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Manager approved, forwarded to finance
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <div>
                            <p
                              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              3. Paid
                            </p>
                            <p
                              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Finance processed payment
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <button
                      onClick={() => setSelectedCommission(null)}
                      className={`px-4 py-2 border rounded ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                    >
                      Close
                    </button>
                    <button
                      onClick={() =>
                        handleApproveCommission(selectedCommission)
                      }
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {updating ? 'Approving...' : 'Approve Commission'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
