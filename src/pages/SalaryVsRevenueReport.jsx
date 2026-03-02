import { useCallback, useEffect, useState } from "react";
import { payrollReportService } from "../services/payrollReportService";

export default function SalaryVsRevenueReport() {
  const [costTrend, setCostTrend] = useState([]);
  const [deptSummary, setDeptSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [trendRes, deptRes] = await Promise.all([
        payrollReportService.getCostTrend(),
        payrollReportService.getDepartmentSummary(filters.month, filters.year),
      ]);
      setCostTrend(trendRes.data?.data || []);
      setDeptSummary(deptRes.data?.data || []);
    } catch (_err) {
      setCostTrend([]);
      setDeptSummary([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const totalDeptCost = deptSummary.reduce((sum, d) => sum + parseFloat(d.totalCost || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Salary vs Revenue</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value, 10) })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        >
          {monthNames.slice(1).map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value, 10) })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white w-24"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Cost Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Payroll Cost Trend (12 Months)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gross</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Net</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employees</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Avg per Employee
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {costTrend.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {parseFloat(row.totalGross || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {parseFloat(row.totalNet || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{row.employeeCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {row.employeeCount > 0
                          ? (parseFloat(row.totalGross || 0) / row.employeeCount).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {costTrend.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No payroll cost data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Department Summary — {monthNames[filters.month]} {filters.year}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employees</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deptSummary.map((dept) => (
                    <tr
                      key={dept.departmentId || dept.departmentName}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 text-sm font-medium">{dept.departmentName || "Unassigned"}</td>
                      <td className="px-4 py-3 text-sm text-right">{dept.employeeCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {parseFloat(dept.totalCost || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {totalDeptCost > 0 ? ((parseFloat(dept.totalCost || 0) / totalDeptCost) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                  {deptSummary.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No department data
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
