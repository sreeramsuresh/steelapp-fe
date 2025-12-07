import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, DollarSign, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { commissionService } from '../services/commissionService';
import { notificationService } from '../services/notificationService';

export default function CommissionApprovalWorkflow() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [salesPersonStats, setSalesPersonStats] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await commissionService.getPendingApprovals(50);
      
      // Log the response structure for debugging


      
      // Handle both snake_case (pending_approvals) and camelCase (pendingApprovals)
      const approvals = data.pendingApprovals || data.pending_approvals || [];

      
      setPendingApprovals(approvals);
      
      // Load stats for each sales person
      if (approvals && approvals.length > 0) {
        const salesPersonIds = [...new Set(approvals.map(c => c.salesPersonId || c.sales_person_id))];
        const stats = {};
        
        for (const spId of salesPersonIds) {
          try {
            const spStats = await commissionService.getSalesPersonCommissionStats(spId);
            stats[spId] = spStats;
          } catch (err) {
            console.warn(`[CommissionApprovalWorkflow] Failed to load stats for sales person ${spId}:`, err);
          }
        }
        
        setSalesPersonStats(stats);
      }
    } catch (err) {
      const errorMsg = err?.message || err?.toString?.() || String(err) || 'Unknown error';
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
      
      setSuccessMessage(`Commission for Invoice ${commission.invoiceNumber} approved!`);
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

  const handleRejectCommission = async (commission) => {
    // In a real scenario, this would be a separate action

  };

  // Pagination calculations
  const totalCount = pendingApprovals.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedApprovals = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return pendingApprovals.slice(startIdx, startIdx + pageSize);
  }, [pendingApprovals, currentPage, pageSize]);

  if (loading) return <div className="flex justify-center items-center h-96">Loading approvals...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Commission Approval Workflow</h1>
            <p className="text-gray-600">Manage and approve pending commission payouts</p>
          </div>
          <button
            onClick={loadPendingApprovals}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Pending Approval</div>
            <div className="text-3xl font-bold text-yellow-600">{pendingApprovals.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Total Pending Amount</div>
            <div className="text-3xl font-bold text-blue-600">
              ${(pendingApprovals.reduce((sum, c) => sum + (c.commissionAmount || c.commission_amount || 0), 0)).toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Approval Deadline</div>
            <div className="text-lg font-bold text-red-600">15 days</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Sales Persons</div>
            <div className="text-3xl font-bold text-purple-600">
              {[...new Set(pendingApprovals.map(c => c.salesPersonId || c.sales_person_id))].length}
            </div>
          </div>
        </div>

        {/* Pending Approvals List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Pending Commissions</h2>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No pending commissions - all approvals are up to date!</p>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedApprovals.map((commission, idx) => {
                // Handle both snake_case and camelCase field names
                const salesPersonId = commission.salesPersonId || commission.sales_person_id;
                const invoiceNumber = commission.invoiceNumber || commission.invoice_number;
                const commissionAmount = commission.commissionAmount || commission.commission_amount;
                const gracePeriodEndDate = commission.gracePeriodEndDate || commission.grace_period_end_date;
                const daysUntilDeadline = commission.daysUntilDeadline || commission.days_until_deadline;
                
                const stats = salesPersonStats[salesPersonId] || {};
                const gracePeriodEnd = gracePeriodEndDate ? new Date(gracePeriodEndDate) : new Date();
                const daysRemaining = (daysUntilDeadline && daysUntilDeadline > 0) 
                  ? daysUntilDeadline 
                  : (gracePeriodEndDate ? Math.ceil((gracePeriodEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0);

                return (
                  <div
                    key={idx}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedCommission(commission)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-lg">
                            Invoice {invoiceNumber}
                          </div>
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            PENDING APPROVAL
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">Amount:</span> ${commissionAmount?.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-semibold">Accrued:</span> {new Date().toLocaleDateString()}
                          </div>
                          <div className={daysRemaining < 3 ? 'text-red-600 font-semibold' : ''}>
                            <Clock className="inline w-4 h-4 mr-1" />
                            {daysRemaining} days to adjust
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
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded border bg-white border-gray-300 text-gray-900 text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Commission Detail Modal */}
        {selectedCommission && (() => {
          // Handle both snake_case and camelCase field names
          const invoiceNumber = selectedCommission.invoiceNumber || selectedCommission.invoice_number;
          const commissionAmount = selectedCommission.commissionAmount || selectedCommission.commission_amount;
          const gracePeriodEndDate = selectedCommission.gracePeriodEndDate || selectedCommission.grace_period_end_date;
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Commission Details</h2>
                  <button
                    onClick={() => setSelectedCommission(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Invoice</label>
                      <p className="text-lg">{invoiceNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Status</label>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded inline-block">
                        PENDING
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Commission Amount</label>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(commissionAmount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Grace Period End</label>
                      <p>{gracePeriodEndDate ? new Date(gracePeriodEndDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Approval Workflow */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Approval Workflow</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-semibold">1. Pending Approval</p>
                          <p className="text-sm text-gray-600">Commission accrued, waiting for manager approval</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold">2. Approved</p>
                          <p className="text-sm text-gray-600">Manager approved, forwarded to finance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold">3. Paid</p>
                          <p className="text-sm text-gray-600">Finance processed payment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t flex gap-3 justify-end">
                  <button
                    onClick={() => setSelectedCommission(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                      Close
                  </button>
                  <button
                    onClick={() => handleApproveCommission(selectedCommission)}
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
