import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import bankReconciliationService from '../../services/bankReconciliationService';

export default function CashBookReport() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    cashAccountCode: '1100',
    page: 1,
    limit: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cashBookResult, summaryResult] = await Promise.all([
        bankReconciliationService.getCashBook(
          filters.startDate,
          filters.endDate,
          {
            cashAccountCode: filters.cashAccountCode,
            page: filters.page,
            limit: filters.limit,
          },
        ),
        bankReconciliationService.getCashBookSummary(
          filters.startDate,
          filters.endDate,
          filters.cashAccountCode,
        ),
      ]);
      setData(cashBookResult);
      setSummary(summaryResult);
    } catch (err) {
      setError(err.message || 'Failed to fetch cash book');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cash Book</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash Account
            </label>
            <select
              value={filters.cashAccountCode}
              onChange={(e) => setFilters({...filters, cashAccountCode: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="1100">1100 - Cash on Hand</option>
              <option value="1110">1110 - Cash in Transit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2 text-sm"
            >
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 text-sm"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Receipts</div>
            <div className="text-xl font-bold text-green-600">
              {bankReconciliationService.formatCurrency(summary.totals.total_receipts)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Payments</div>
            <div className="text-xl font-bold text-red-600">
              {bankReconciliationService.formatCurrency(summary.totals.total_payments)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Net Cash Flow</div>
            <div className={`text-xl font-bold ${summary.totals.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {bankReconciliationService.formatCurrency(summary.totals.net_cash_flow)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Days</div>
            <div className="text-xl font-bold">
              {summary.totals.total_days}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Transactions</div>
            <div className="text-xl font-bold">
              {data?.pagination?.total || 0}
            </div>
          </div>
        </div>
      )}

      {/* Daily Summary */}
      {summary && summary.summary && summary.summary.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Receipts</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Payments</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Net Flow</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Receipt #</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Payment #</th>
              </tr>
            </thead>
            <tbody>
              {summary.summary.map((day, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{bankReconciliationService.formatDate(day.entry_date)}</td>
                  <td className="px-4 py-3 text-right text-sm text-green-600">
                    {bankReconciliationService.formatCurrency(day.total_receipts)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-600">
                    {bankReconciliationService.formatCurrency(day.total_payments)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {bankReconciliationService.formatCurrency(day.net_cash_flow)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {day.receipt_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                      {day.payment_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-600">Loading cash book...</div>
        </div>
      ) : data?.entries && data.entries.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Journal #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contra Account</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Receipt</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">By</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3">{bankReconciliationService.formatDate(entry.entry_date)}</td>
                  <td className="px-4 py-3 font-medium">{entry.journal_number}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      entry.transaction_type === 'RECEIPT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.contra_account}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.description}</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {entry.receipt_amount > 0 ? bankReconciliationService.formatCurrency(entry.receipt_amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {entry.payment_amount > 0 ? bankReconciliationService.formatCurrency(entry.payment_amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                  disabled={filters.page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={filters.page >= data.pagination.pages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
