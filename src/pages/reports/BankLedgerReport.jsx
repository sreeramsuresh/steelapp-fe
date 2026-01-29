import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import bankReconciliationService from '../../services/bankReconciliationService';

export default function BankLedgerReport() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    accountCode: '1100', // Default to Cash
    startDate: null,
    endDate: null,
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
      const result = await bankReconciliationService.getBankLedger(
        filters.accountCode,
        filters.startDate,
        filters.endDate,
      );
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch bank ledger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bank Ledger</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Account
            </label>
            <select
              value={filters.accountCode}
              onChange={(e) =>
                setFilters({ ...filters, accountCode: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="1100">1100 - Cash on Hand</option>
              <option value="1110">1110 - Cash in Transit</option>
              <option value="1150">1150 - Bank Account</option>
              <option value="1151">1151 - Bank Account 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
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
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2"
            >
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Opening Balance</div>
            <div className="text-2xl font-bold text-blue-600">
              {bankReconciliationService.formatCurrency(data.opening_balance)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Debits</div>
            <div className="text-2xl font-bold text-green-600">
              {bankReconciliationService.formatCurrency(data.total_debits)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Credits</div>
            <div className="text-2xl font-bold text-red-600">
              {bankReconciliationService.formatCurrency(data.total_credits)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Closing Balance</div>
            <div className="text-2xl font-bold text-blue-600">
              {bankReconciliationService.formatCurrency(data.closing_balance)}
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-600">Loading bank ledger...</div>
        </div>
      ) : data ? (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Journal #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Batch #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Narration
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  Debit
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  Credit
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Module
                </th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((txn, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {bankReconciliationService.formatDate(txn.entry_date)}
                  </td>
                  <td className="px-4 py-3 text-sm">{txn.journal_number}</td>
                  <td className="px-4 py-3 text-sm">{txn.batch_number}</td>
                  <td className="px-4 py-3 text-sm">{txn.narration}</td>
                  <td className="px-4 py-3 text-right text-sm text-green-600">
                    {txn.debit_amount > 0
                      ? bankReconciliationService.formatCurrency(
                          txn.debit_amount,
                        )
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-600">
                    {txn.credit_amount > 0
                      ? bankReconciliationService.formatCurrency(
                          txn.credit_amount,
                        )
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {bankReconciliationService.formatCurrency(
                      txn.running_balance,
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {txn.source_module}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
