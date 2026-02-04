import { BarChart3, DollarSign, Download, ShoppingCart, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "../components/shared/EmptyState";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import api from "../services/api";
import { tokenUtils } from "../services/axiosApi";
import { toUAEDateForInput } from "../utils/timezone";

export default function ProfitAnalysisReport() {
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    // Use UAE timezone for default date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: toUAEDateForInput(startOfMonth),
      endDate: toUAEDateForInput(now),
    };
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
    totalQuantity: 0,
  });

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReport]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setHasError(false);

      // Get company_id from user context
      const user = tokenUtils.getUser();
      const companyId = user?.companyId;

      if (!companyId) {
        throw new Error("Company context not found");
      }

      // Use the analytics/profit-by-product endpoint instead of raw query
      const response = await api.get("/analytics/profit-by-product", {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });

      const results = response.data?.products || response.data?.results || [];
      setData(results);

      // Calculate summary from response or results
      if (response.data?.summary) {
        setSummary({
          totalRevenue: response.data.summary.totalRevenue || 0,
          totalCost: response.data.summary.totalCost || 0,
          totalProfit: response.data.summary.totalProfit || 0,
          totalQuantity: response.data.summary.totalQuantity || 0,
          averageMargin: response.data.summary.averageMargin || 0,
        });
      } else {
        const totals = results.reduce(
          (acc, row) => ({
            totalRevenue: acc.totalRevenue + parseFloat(row.totalRevenue || row.total_revenue || 0),
            totalCost: acc.totalCost + parseFloat(row.totalCost || row.total_cost || 0),
            totalProfit: acc.totalProfit + parseFloat(row.totalProfit || row.total_profit || 0),
            totalQuantity: acc.totalQuantity + parseFloat(row.totalQuantity || row.total_quantity || 0),
          }),
          { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalQuantity: 0 }
        );

        const averageMargin =
          totals.totalRevenue > 0 ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(2) : 0;

        setSummary({
          ...totals,
          averageMargin: parseFloat(averageMargin),
        });
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      if (!hasError) {
        setHasError(true);
        toast.error("Failed to load profit analysis. The analytics endpoint may not be available.");
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Product", "Category", "Grade", "Quantity", "Revenue", "Cost", "Profit", "Margin %"];
    const rows = data.map((row) => [
      row.name,
      row.category,
      row.grade,
      row.totalQuantity,
      row.totalRevenue,
      row.totalCost,
      row.totalProfit,
      row.avgMargin,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profit-analysis-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Profit Analysis Report</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div>
            <label htmlFor="profit-start-date" className="block text-sm font-medium mb-2">
              Start Date
            </label>
            <input
              id="profit-start-date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="profit-end-date" className="block text-sm font-medium mb-2">
              End Date
            </label>
            <input
              id="profit-end-date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2 pt-6 sm:pt-0">
            <Button onClick={fetchReport} disabled={loading}>
              Generate Report
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={loading || data.length === 0} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner mode="block" message="Loading profit analysis..." />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Data Available"
          description="Try adjusting your date range or generating a report to see profit analysis data."
          action={<Button onClick={fetchReport}>Generate Report</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl font-bold">AED {summary.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
                  <p className="text-xl font-bold text-green-600">AED {summary.totalProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Margin</p>
                  <p className="text-xl font-bold">{summary.averageMargin}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Sold</p>
                <p className="text-xl font-bold">{summary.totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="font-medium text-sm">{row.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{row.grade}</div>
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="text-right">{parseFloat(row.totalQuantity).toLocaleString()}</TableCell>
                      <TableCell className="text-right">AED {parseFloat(row.totalRevenue).toLocaleString()}</TableCell>
                      <TableCell className="text-right">AED {parseFloat(row.totalCost).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-600">
                          AED {parseFloat(row.totalProfit).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            parseFloat(row.avgMargin) > 30
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200"
                              : parseFloat(row.avgMargin) > 20
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {parseFloat(row.avgMargin).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
