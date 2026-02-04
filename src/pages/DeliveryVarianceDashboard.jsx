import { lazy, Suspense, useEffect, useState } from "react";
// Lazy-load chart components for better initial load performance
import { ChartSkeleton } from "../components/charts";
import { useTheme } from "../contexts/ThemeContext";
import { deliveryVarianceService } from "../services/deliveryVarianceService";

const LazyLineChart = lazy(() => import("../components/charts/LazyLineChart"));
const LazyBarChart = lazy(() => import("../components/charts/LazyBarChart"));

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

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      deliveryVarianceService.getDeliveryVarianceKPIs(),
      deliveryVarianceService.getDeliveryVarianceTrend(),
      deliveryVarianceService.getLateDeliveriesBreakdown(),
      deliveryVarianceService.getSupplierPerformanceComparison(),
      deliveryVarianceService.generateRecommendations(),
      deliveryVarianceService.getRecentLateDeliveries(20),
    ]);

    const [kpiResult, trendResult, breakdownResult, comparisonResult, recommendationResult, lateResult] = results;

    // Set data from successful calls, null for failed ones
    setKpis(kpiResult.status === "fulfilled" ? kpiResult.value : null);
    setTrend(trendResult.status === "fulfilled" ? trendResult.value : null);
    setBreakdown(breakdownResult.status === "fulfilled" ? breakdownResult.value : null);
    setComparison(comparisonResult.status === "fulfilled" ? comparisonResult.value : null);
    setRecommendations(recommendationResult.status === "fulfilled" ? recommendationResult.value : null);
    setLateDeliveries(lateResult.status === "fulfilled" ? lateResult.value : null);

    // Check if ALL calls failed
    const allFailed = results.every((r) => r.status === "rejected");
    if (allFailed) {
      const firstError = results.find((r) => r.status === "rejected")?.reason;
      setError(firstError?.message || "Failed to load delivery performance data. The service may be unavailable.");
      console.error("Dashboard load error - all endpoints failed:", firstError);
    } else {
      // Log any individual failures for debugging
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          const endpoints = ["KPIs", "Trend", "Breakdown", "Comparison", "Recommendations", "Late Deliveries"];
          console.warn(`Delivery Performance: ${endpoints[i]} endpoint failed:`, r.reason?.message);
        }
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard,
  ]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading delivery performance data...
          </p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className={`p-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} min-h-screen`}>
        <div
          className={`p-4 rounded-lg border ${isDarkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <h3 className="font-semibold mb-2">Unable to load Delivery Performance</h3>
          <p className="text-sm mb-4">{error}</p>
          <p className="text-sm mb-4">
            This may be because the delivery variance backend service is not available. Please contact your
            administrator.
          </p>
          <button
            onClick={loadDashboard}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );

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

  // const breakdownColors = ['#ffc107', '#ff9800', '#ff5722', '#f44336'];

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
    <div className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        📉 Delivery Variance Dashboard
      </h1>

      {/* KPIs Section */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              On-Time Delivery
            </div>
            <div className="text-3xl font-bold text-green-600">{kpis.onTimeDeliveryPct || 0}%</div>
          </div>
          <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Avg Variance
            </div>
            <div className="text-3xl font-bold text-blue-600">{kpis.avgVarianceDays || 0} days</div>
          </div>
          <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Late Deliveries
            </div>
            <div className="text-3xl font-bold text-red-600">{kpis.lateDeliveryCount || 0}</div>
          </div>
          <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Total Deliveries
            </div>
            <div className="text-3xl font-bold text-purple-600">{kpis.totalDeliveryCount || 0}</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart */}
        {trendChartData && (
          <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Delivery Trend
            </h2>
            <Suspense fallback={<ChartSkeleton height={300} />}>
              <LazyLineChart
                data={trendChartData}
                xAxisKey="date"
                height={300}
                lines={[
                  {
                    dataKey: "onTimeDeliveryPct",
                    color: "#4bc0c0",
                    name: "On-Time Delivery %",
                    strokeWidth: 2,
                    dot: false,
                  },
                ]}
              />
            </Suspense>
          </div>
        )}

        {/* Breakdown Chart */}
        {breakdownChartData && (
          <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Late Deliveries Breakdown
            </h2>
            <Suspense fallback={<ChartSkeleton height={300} />}>
              <LazyBarChart
                data={breakdownChartData}
                xAxisKey="rangeLabel"
                height={300}
                bars={[
                  {
                    dataKey: "count",
                    color: "#ffc107",
                    name: "Late Deliveries",
                  },
                ]}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Supplier Comparison */}
      {comparisonChartData && (
        <div className={`p-4 rounded-lg shadow mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Top 10 Suppliers Performance
          </h2>
          <Suspense fallback={<ChartSkeleton height={400} />}>
            <LazyBarChart
              data={comparisonChartData}
              xAxisKey="supplierName"
              height={400}
              layout="vertical"
              bars={[
                {
                  dataKey: "onTimeDeliveryPct",
                  color: "#4caf50",
                  name: "On-Time Delivery %",
                },
              ]}
            />
          </Suspense>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className={`p-4 rounded-lg shadow mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.recommendations?.map((rec, idx) => (
              <div
                key={idx}
                className={`border-l-4 border-blue-500 pl-4 py-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
              >
                <div className={`font-semibold ${isDarkMode ? "text-blue-400" : "text-blue-900"}`}>{rec.title}</div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{rec.description}</div>
                <div className={`text-sm mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Action: {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Late Deliveries List */}
      {lateDeliveries && lateDeliveries.lateDeliveries?.length > 0 && (
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
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
                    <td className="px-4 py-2">{delivery.expectedDeliveryDate}</td>
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
