import { useCallback, useEffect, useState } from "react";
import { payrollReportService } from "../services/payrollReportService";

export default function PayrollRegisterReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await payrollReportService.getRegister(filters);
      setData(res.data?.data || []);
    } catch (_err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totals = data.reduce(
    (acc, r) => ({
      gross: acc.gross + parseFloat(r.grossSalary || 0),
      deductions: acc.deductions + parseFloat(r.totalDeductions || 0),
      net: acc.net + parseFloat(r.netSalary || 0),
    }),
    { gross: 0, deductions: 0, net: 0 }
  );

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payroll Register</h1>

      <div className="flex gap-4 mb-6">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Month
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value, 10) })}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ml-2"
          >
            {monthNames.slice(1).map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Year
          <input
            type="number"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value, 10) })}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white w-24 ml-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Gross</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totals.gross.toLocaleString()}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-sm text-red-600 dark:text-red-400">Total Deductions</div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{totals.deductions.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Total Net Pay</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{totals.net.toLocaleString()}</div>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row) => (
                <tr key={row.employeeId || row.employeeCode} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium">
                    {row.employeeCode} - {row.employeeName}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.departmentName || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {parseFloat(row.grossSalary || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-red-600">
                    {parseFloat(row.totalDeductions || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                    {parseFloat(row.netSalary || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${row.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {row.paymentStatus || "PENDING"}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No payroll data for {monthNames[filters.month]} {filters.year}
                  </td>
                </tr>
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot className="bg-gray-100 dark:bg-gray-700 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-sm" colSpan="2">
                    Total ({data.length} employees)
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">{totals.gross.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-red-600">
                    {totals.deductions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">{totals.net.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
