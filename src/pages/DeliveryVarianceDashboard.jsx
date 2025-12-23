import { useState, useEffect } from "react";
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { deliveryVarianceService } from "../services/deliveryVarianceService";
import { useTheme } from "../contexts/ThemeContext";

export default function DeliveryVarianceDashboard() {
  const { isDarkMode } = useTheme();
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [lateDeliveries, setLateDeliveries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [
        kpiData,
        trendData,
        breakdownData,
        comparisonData,
        recommendationData,
        lateData,
      ] = await Promise.all([
        deliveryVarianceService.getDeliveryVarianceKPIs(),
        deliveryVarianceService.getDeliveryVarianceTrend(),
        deliveryVarianceService.getLateDeliveriesBreakdown(),
        deliveryVarianceService.getSupplierPerformanceComparison(),
        deliveryVarianceService.generateRecommendations(),
        deliveryVarianceService.getRecentLateDeliveries(20),
      ]);

      setKpis(kpiData);
      setTrend(trendData);
      setBreakdown(breakdownData);
      setComparison(comparisonData);
      setRecommendations(recommendationData);
      setLateDeliveries(lateData);
    } catch (err) {
      setError(err.message);
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        Loading dashboard...
      </div>
    );
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  const trendChartData =
    trend?.trendData?.length > 0 &&
    trend.trendData.map((d) => ({
      date: new Date(d.date).toLocaleDateString(),
      onTimeDeliveryPct: d.onTimeDeliveryPct,
    }));

  const breakdownChartData =
    breakdown?.varianceRanges?.length > 0 &&
    breakdown.varianceRanges.map((r) => ({
      rangeLabel: r.rangeLabel,
      count: r.count,
    }));

  const breakdownColors = ["#ffc107", "#ff9800", "#ff5722", "#f44336"];

  const comparisonChartData =
    comparison?.suppliers?.length > 0 &&
    comparison.suppliers.map((s) => ({
      supplierName: s.supplierName,
      onTimeDeliveryPct: s.onTimeDeliveryPct,
    }));

  const _getRatingColor = (rating) => {
    switch (rating) {
      case "CERTIFIED":
        return "bg-green-100 text-green-800";
      case "PREFERRED":
        return "bg-blue-100 text-blue-800";
      case "ACCEPTABLE":
        return "bg-yellow-100 text-yellow-800";
      case "AT_RISK":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <h1
        className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}
      >
        Delivery Variance Dashboard
      </h1>

      {/* KPIs Section */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              On-Time Delivery
            </div>
            <div className="text-3xl font-bold text-green-600">
              {kpis.onTimeDeliveryPct || 0}%
            </div>
          </div>
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Avg Variance
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {kpis.avgVarianceDays || 0} days
            </div>
          </div>
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Late Deliveries
            </div>
            <div className="text-3xl font-bold text-red-600">
              {kpis.lateDeliveryCount || 0}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div
              className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Total Deliveries
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {kpis.totalDeliveryCount || 0}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart */}
        {trendChartData && (
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Delivery Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="onTimeDeliveryPct"
                  stroke="#4bc0c0"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Breakdown Chart */}
        {breakdownChartData && (
          <div
            className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Late Deliveries Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdownChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rangeLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ffc107" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Supplier Comparison */}
      {comparisonChartData && (
        <div
          className={`p-4 rounded-lg shadow mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Top 10 Suppliers Performance
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="supplierName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTimeDeliveryPct" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div
          className={`p-4 rounded-lg shadow mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.recommendations?.map((rec, idx) => (
              <div
                key={idx}
                className={`border-l-4 border-blue-500 pl-4 py-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
              >
                <div
                  className={`font-semibold ${isDarkMode ? "text-blue-400" : "text-blue-900"}`}
                >
                  {rec.title}
                </div>
                <div
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  {rec.description}
                </div>
                <div
                  className={`text-sm mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                >
                  Action: {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Late Deliveries List */}
      {lateDeliveries && lateDeliveries.lateDeliveries?.length > 0 && (
        <div
          className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Recent Late Deliveries
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}>
                <tr>
                  <th className="px-4 py-2 text-left">GRN</th>
                  <th className="px-4 py-2 text-left">Supplier</th>
                  <th className="px-4 py-2 text-left">Expected Date</th>
                  <th className="px-4 py-2 text-left">Actual Date</th>
                  <th className="px-4 py-2 text-left">Variance</th>
                </tr>
              </thead>
              <tbody>
                {lateDeliveries.lateDeliveries?.map((delivery, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-2">{delivery.grnId}</td>
                    <td className="px-4 py-2">{delivery.supplierName}</td>
                    <td className="px-4 py-2">
                      {delivery.expectedDeliveryDate}
                    </td>
                    <td className="px-4 py-2">{delivery.goodsReceiptDate}</td>
                    <td className="px-4 py-2">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        {delivery.varianceDays} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
