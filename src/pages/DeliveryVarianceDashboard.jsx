import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { deliveryVarianceService } from '../services/deliveryVarianceService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DeliveryVarianceDashboard() {
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
      const [kpiData, trendData, breakdownData, comparisonData, recommendationData, lateData] = await Promise.all([
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
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">Loading dashboard...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  const trendChartData = trend?.trendData?.length > 0 && {
    labels: trend.trendData?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'On-Time Delivery %',
        data: trend.trendData?.map(d => d.onTimeDeliveryPct) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const breakdownChartData = breakdown?.varianceRanges?.length > 0 && {
    labels: breakdown.varianceRanges?.map(r => r.rangeLabel) || [],
    datasets: [
      {
        label: 'Late Deliveries',
        data: breakdown.varianceRanges?.map(r => r.count) || [],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(255, 87, 34, 0.8)',
          'rgba(244, 67, 54, 0.8)',
        ],
      },
    ],
  };

  const comparisonChartData = comparison?.suppliers?.length > 0 && {
    labels: comparison.suppliers?.map(s => s.supplierName) || [],
    datasets: [
      {
        label: 'On-Time Delivery %',
        data: comparison.suppliers?.map(s => s.onTimeDeliveryPct) || [],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
      },
    ],
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'CERTIFIED':
        return 'bg-green-100 text-green-800';
      case 'PREFERRED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTABLE':
        return 'bg-yellow-100 text-yellow-800';
      case 'AT_RISK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Delivery Variance Dashboard</h1>

      {/* KPIs Section */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">On-Time Delivery</div>
            <div className="text-3xl font-bold text-green-600">{kpis.onTimeDeliveryPct || 0}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Avg Variance</div>
            <div className="text-3xl font-bold text-blue-600">{kpis.avgVarianceDays || 0} days</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Late Deliveries</div>
            <div className="text-3xl font-bold text-red-600">{kpis.lateDeliveryCount || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Total Deliveries</div>
            <div className="text-3xl font-bold text-purple-600">{kpis.totalDeliveryCount || 0}</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart */}
        {trendChartData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Delivery Trend</h2>
            <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        )}

        {/* Breakdown Chart */}
        {breakdownChartData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Late Deliveries Breakdown</h2>
            <Bar data={breakdownChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        )}
      </div>

      {/* Supplier Comparison */}
      {comparisonChartData && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Top 10 Suppliers Performance</h2>
          <Bar data={comparisonChartData} options={{ responsive: true, indexAxis: 'y' }} />
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <div className="space-y-3">
            {recommendations.recommendations?.map((rec, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-semibold text-blue-900">{rec.title}</div>
                <div className="text-gray-600 text-sm">{rec.description}</div>
                <div className="text-blue-600 text-sm mt-1">Action: {rec.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Late Deliveries List */}
      {lateDeliveries && lateDeliveries.lateDeliveries?.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Late Deliveries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
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
                  <tr key={idx} className="border-b hover:bg-gray-50">
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
