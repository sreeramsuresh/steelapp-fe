import { useCallback, useEffect, useState } from "react";
import { costCenterReportService } from "../services/costCenterReportService";

export default function BudgetVsActual() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await costCenterReportService.getBudgetVsActual(fiscalYear);
      setData(res.data?.data || []);
    } catch (_err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totals = data.reduce(
    (acc, r) => ({
      budget: acc.budget + (r.budgetAmount || 0),
      actual: acc.actual + (r.actualAmount || 0),
    }),
    { budget: 0, actual: 0 }
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Budget vs Actual</h1>

      <div className="mb-6">
        <input
          type="number"
          value={fiscalYear}
          onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Budget</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totals.budget.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Total Actual</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{totals.actual.toLocaleString()}</div>
        </div>
        <div
          className={`p-4 rounded-lg ${totals.budget - totals.actual >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">Variance</div>
          <div className="text-2xl font-bold">{(totals.budget - totals.actual).toLocaleString()}</div>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilization %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row) => (
                <tr key={row.costCenterId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium">
                    {row.costCenterCode} - {row.costCenterName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">{row.budgetAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono">{row.actualAmount?.toLocaleString()}</td>
                  <td
                    className={`px-4 py-3 text-sm text-right font-mono ${row.variance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {row.variance?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {row.utilizationPct != null ? (
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${row.utilizationPct > 100 ? "bg-red-100 text-red-800" : row.utilizationPct > 80 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                      >
                        {row.utilizationPct}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No data for this fiscal year
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
