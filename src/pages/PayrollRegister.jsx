import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { payrollRunService } from "../services/payrollRunService";

const PayrollRegister = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runs, setRuns] = useState([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await payrollRunService.list({ year: yearFilter });
      setRuns(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate summary
  const totalGross = runs.reduce((s, r) => s + Number(r.totalGross || 0), 0);
  const totalDeductions = runs.reduce((s, r) => s + Number(r.totalDeductions || 0), 0);
  const totalNet = runs.reduce((s, r) => s + Number(r.totalNet || 0), 0);
  const totalEmployees = runs.reduce((s, r) => s + Number(r.employeeCount || 0), 0);

  // Monthly trend
  const monthlyData = runs
    .filter((r) => r.month && r.year)
    .sort((a, b) => a.month - b.month)
    .map((r) => ({
      month: new Date(2000, r.month - 1).toLocaleString("default", { month: "short" }),
      gross: Number(r.totalGross || 0),
      net: Number(r.totalNet || 0),
      deductions: Number(r.totalDeductions || 0),
      employees: Number(r.employeeCount || 0),
    }));

  // Department-wise breakdown (if available)
  const deptBreakdown = runs.reduce((acc, r) => {
    if (r.departmentBreakdown) {
      for (const dept of r.departmentBreakdown) {
        const name = dept.departmentName || "Unassigned";
        if (!acc[name]) acc[name] = { department: name, gross: 0, net: 0, count: 0 };
        acc[name].gross += Number(dept.totalGross || 0);
        acc[name].net += Number(dept.totalNet || 0);
        acc[name].count += Number(dept.employeeCount || 0);
      }
    }
    return acc;
  }, {});
  const deptData = Object.values(deptBreakdown);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Register</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">
            Year
            <input
              type="number"
              min={2020}
              max={2030}
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="border rounded-lg px-3 py-1.5 text-sm w-24"
            />
          </label>
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
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Gross</p>
              <p className="text-2xl font-bold text-gray-900">{totalGross.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Deductions</p>
              <p className="text-2xl font-bold text-gray-900">{totalDeductions.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Net</p>
              <p className="text-2xl font-bold text-teal-700">{totalNet.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Employee Count</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>

          {/* Department Breakdown Table */}
          {deptData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Breakdown</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employees</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deptData.map((d) => (
                    <tr key={d.department} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{d.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{d.count}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{d.gross.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{d.net.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => Number(val).toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="gross" name="Gross" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
                  <Line
                    type="monotone"
                    dataKey="deductions"
                    name="Deductions"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No monthly data available</p>
            )}
          </div>

          {/* Payroll Runs table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payroll Runs</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employees</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No payroll runs for {yearFilter}
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.runNumber || `PR-${r.id}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.month ? new Date(2000, r.month - 1).toLocaleString("default", { month: "short" }) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.status}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{r.employeeCount ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {Number(r.totalGross || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {Number(r.totalNet || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRegister;
