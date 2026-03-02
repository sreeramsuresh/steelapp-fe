import { useCallback, useEffect, useState } from "react";
import { expenseAnalyticsService } from "../services/expenseAnalyticsService";

export default function ExpenseTrendReport() {
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [trendRes, catRes] = await Promise.all([
        expenseAnalyticsService.getTrend(months),
        expenseAnalyticsService.getCategoryBreakdown(dateRange.startDate, dateRange.endDate),
      ]);
      setTrend(trendRes.data?.data || []);
      setCategories(catRes.data?.data || []);
    } catch (_err) {
      setTrend([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [months, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalExpenses = categories.reduce((sum, c) => sum + parseFloat(c.totalAmount || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Expense Trends</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Trend Months
            <input
              type="number"
              min="3"
              max="36"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value, 10))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white w-24"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Start Date
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            End Date
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Expense Trend</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {trend.map((row, i) => {
                    const prev = i > 0 ? parseFloat(trend[i - 1].totalAmount || 0) : 0;
                    const curr = parseFloat(row.totalAmount || 0);
                    const change = prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : null;
                    return (
                      <tr key={row.month || i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{curr.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right">{row.count || 0}</td>
                        <td className="px-4 py-3 text-sm">
                          {change !== null && (
                            <span className={change >= 0 ? "text-red-600" : "text-green-600"}>
                              {change >= 0 ? "+" : ""}
                              {change}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {trend.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No trend data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Category Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categories.map((cat) => (
                    <tr key={cat.categoryId || cat.categoryName} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium">{cat.categoryName}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {parseFloat(cat.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{cat.count || 0}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {totalExpenses > 0 ? ((parseFloat(cat.totalAmount || 0) / totalExpenses) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No category data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
