import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { operatingExpenseService } from "../services/operatingExpenseService";

const ExpenseReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await operatingExpenseService.getSummary({
        dateFrom,
        dateTo,
      });
      setSummary(res.data?.data || res.data || {});
    } catch (err) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const categoryData = summary?.categoryBreakdown || [];
  const costCenterData = summary?.costCenterBreakdown || [];
  const monthlyTrend = summary?.monthlyTrend || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expense Reports</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.totalAmount != null ? Number(summary.totalAmount).toLocaleString() : "0"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">Expense Count</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalCount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">Average per Expense</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.averageAmount != null ? Number(summary.averageAmount).toLocaleString() : "0"}
              </p>
            </div>
          </div>

          {/* Category Breakdown Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => Number(val).toLocaleString()} />
                  <Legend />
                  <Bar dataKey="totalAmount" name="Amount" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No category data available</p>
            )}
          </div>

          {/* Cost Center Breakdown Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Center Breakdown</h2>
            {costCenterData.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {costCenterData.map((row) => (
                    <tr key={row.costCenterName || "unassigned"} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{row.costCenterName || "Unassigned"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{row.count || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {Number(row.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {row.percentage != null ? `${row.percentage}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-8">No cost center data available</p>
            )}
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h2>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => Number(val).toLocaleString()} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    name="Amount"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line type="monotone" dataKey="count" name="Count" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No trend data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseReports;
