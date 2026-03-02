import { useCallback, useEffect, useState } from "react";
import { costCenterReportService } from "../services/costCenterReportService";
import { costCenterService } from "../services/costCenterService";

export default function CostCenterPnL() {
  const [data, setData] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    costCenterId: "",
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchCostCenters = useCallback(async () => {
    try {
      const res = await costCenterService.list({ isActive: true });
      setCostCenters(res.data?.data || []);
    } catch (_err) {
      /* ignore */
    }
  }, []);

  const fetchReport = useCallback(async () => {
    if (!filters.costCenterId) return;
    try {
      setLoading(true);
      const res = await costCenterReportService.getPnL(filters);
      setData(res.data?.data || []);
    } catch (_err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const grouped = data.reduce((acc, row) => {
    const cat = row.accountCategory || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(row);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cost Center P&L</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={filters.costCenterId}
          onChange={(e) => setFilters({ ...filters, costCenterId: e.target.value })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select Cost Center</option>
          {costCenters.map((cc) => (
            <option key={cc.id} value={cc.id}>
              {cc.code} - {cc.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : !filters.costCenterId ? (
        <div className="text-gray-500">Select a cost center to view P&L</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, rows]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{category}</h3>
              <table className="min-w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left py-2">Account</th>
                    <th className="text-right py-2">Debit</th>
                    <th className="text-right py-2">Credit</th>
                    <th className="text-right py-2">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.accountCode}-${row.accountName}`} className="border-t dark:border-gray-700">
                      <td className="py-2 text-sm">
                        {row.accountCode} - {row.accountName}
                      </td>
                      <td className="py-2 text-sm text-right font-mono">
                        {parseFloat(row.totalDebit).toLocaleString()}
                      </td>
                      <td className="py-2 text-sm text-right font-mono">
                        {parseFloat(row.totalCredit).toLocaleString()}
                      </td>
                      <td className="py-2 text-sm text-right font-mono font-semibold">
                        {parseFloat(row.netAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-gray-500 text-center py-8">No journal entries found for this cost center</div>
          )}
        </div>
      )}
    </div>
  );
}
