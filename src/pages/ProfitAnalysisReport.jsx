import { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import api from '../services/api';
import toast from 'react-hot-toast';
import { toUAEDateForInput } from '../utils/timezone';
import { tokenUtils } from '../services/axiosApi';

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
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setHasError(false); // Reset error state on new fetch attempt

      // Query to get profit by product
      const query = `
        SELECT
          p.id,
          p.name,
          p.category,
          p.grade,
          SUM(ii.quantity) as total_quantity,
          SUM(ii.amount) as total_revenue,
          SUM(ii.cost_price * ii.quantity) as total_cost,
          SUM(ii.profit * ii.quantity) as total_profit,
          AVG(ii.margin_percent) as avg_margin
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.id
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.company_id = $3
          AND i.invoice_date BETWEEN $1 AND $2
          AND ii.cost_price IS NOT NULL
          AND i.status != 'cancelled'
        GROUP BY p.id, p.name, p.category, p.grade
        ORDER BY total_profit DESC
      `;

      // Get company_id from user context
      const user = tokenUtils.getUser();
      const companyId = user?.companyId;

      if (!companyId) {
        throw new Error('Company context not found');
      }

      const response = await api.post('/query', {
        query,
        params: [dateRange.startDate, dateRange.endDate, companyId],
      });

      const results = response.data?.results || [];
      setData(results);

      // Calculate summary
      const totals = results.reduce(
        (acc, row) => ({
          totalRevenue: acc.totalRevenue + parseFloat(row.totalRevenue || 0),
          totalCost: acc.totalCost + parseFloat(row.totalCost || 0),
          totalProfit: acc.totalProfit + parseFloat(row.totalProfit || 0),
          totalQuantity: acc.totalQuantity + parseFloat(row.totalQuantity || 0),
        }),
        { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalQuantity: 0 },
      );

      const averageMargin =
        totals.totalRevenue > 0
          ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(2)
          : 0;

      setSummary({
        ...totals,
        averageMargin: parseFloat(averageMargin),
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      // Only show toast if not already showing error state
      if (!hasError) {
        setHasError(true);
        toast.error('Failed to load profit analysis. The report endpoint may not be available.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Product',
      'Category',
      'Grade',
      'Quantity',
      'Revenue',
      'Cost',
      'Profit',
      'Margin %',
    ];
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

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n',
    );

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
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
            <label htmlFor="profit-start-date" className="block text-sm font-medium mb-2">Start Date</label>
            <input
              id="profit-start-date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="profit-end-date" className="block text-sm font-medium mb-2">End Date</label>
            <input
              id="profit-end-date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2 pt-6 sm:pt-0">
            <Button onClick={fetchReport} disabled={loading}>
              Generate Report
            </Button>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={loading || data.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-xl font-bold">
                    AED {summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Profit
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    AED {summary.totalProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Margin
                  </p>
                  <p className="text-xl font-bold">{summary.averageMargin}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Items Sold
                </p>
                <p className="text-xl font-bold">
                  {summary.totalQuantity.toLocaleString()}
                </p>
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
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{row.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {row.grade}
                        </div>
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="text-right">
                        {parseFloat(row.totalQuantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        AED {parseFloat(row.totalRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        AED {parseFloat(row.totalCost).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-600">
                          AED {parseFloat(row.totalProfit).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            parseFloat(row.avgMargin) > 30
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200'
                              : parseFloat(row.avgMargin) > 20
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200'
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
