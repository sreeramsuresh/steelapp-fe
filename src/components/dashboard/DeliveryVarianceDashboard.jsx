/**
 * Phase 4: Delivery Variance Dashboard
 * Displays KPIs, trends, and supplier performance metrics
 * Date: 2025-12-02
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Truck, Clock, Target, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApi } from '../../hooks/useApi';
import LoadingOverlay from '../LoadingOverlay';

const DeliveryVarianceDashboard = () => {
  const { isDarkMode } = useTheme();
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [lateDeliveries, setLateDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [daysBack]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Call API to fetch delivery variance KPIs
      // const response = await dashboardService.getDeliveryVarianceKPIs(companyId, daysBack);
      
      // Mock data for demonstration
      setKpis({
        onTimeDelivery: { percentage: 82.5, status: 'GOOD' },
        lateDeliveries: { total: 12, critical: 3, status: 'WARNING' },
        avgVariance: { days: 2.3, status: 'GOOD' },
        supplierHealth: {
          avgScore: 78,
          certified: 5,
          preferred: 8,
          acceptable: 6,
          atRisk: 2
        },
        overallHealthScore: 'GOOD'
      });

      setTrend([
        { datePeriod: '2025-11-01', totalDeliveries: 45, onTimeCount: 38, lateCount: 7, otdPercentage: 84.4 },
        { datePeriod: '2025-11-08', totalDeliveries: 52, onTimeCount: 44, lateCount: 8, otdPercentage: 84.6 },
        { datePeriod: '2025-11-15', totalDeliveries: 48, onTimeCount: 38, lateCount: 10, otdPercentage: 79.2 },
        { datePeriod: '2025-11-22', totalDeliveries: 51, onTimeCount: 42, lateCount: 9, otdPercentage: 82.4 },
        { datePeriod: '2025-11-29', totalDeliveries: 43, onTimeCount: 35, lateCount: 8, otdPercentage: 81.4 },
      ]);

      setBreakdown([
        { varianceCategory: 'Early', deliveryCount: 8, avgVariance: -3.2, supplierCount: 5 },
        { varianceCategory: '1-3 Days Late', deliveryCount: 28, avgVariance: 1.8, supplierCount: 12 },
        { varianceCategory: '4-7 Days Late', deliveryCount: 15, avgVariance: 5.1, supplierCount: 8 },
        { varianceCategory: 'Critical (8+ Days)', deliveryCount: 5, avgVariance: 11.3, supplierCount: 3 },
      ]);

      setLateDeliveries([
        { id: 1, grn: 'GRN-001', supplier: 'Supplier A', poNumber: 'PO-2025-001', variance: 8, severity: 'CRITICAL' },
        { id: 2, grn: 'GRN-002', supplier: 'Supplier B', poNumber: 'PO-2025-002', variance: 5, severity: 'URGENT' },
        { id: 3, grn: 'GRN-003', supplier: 'Supplier C', poNumber: 'PO-2025-003', variance: 3, severity: 'WARNING' },
      ]);
    } catch (err) {
      setError(`Failed to load dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'ACCEPTABLE': return 'text-yellow-600 bg-yellow-100';
      case 'AT_RISK': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600';
      case 'URGENT': return 'text-orange-600';
      case 'WARNING': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Delivery Variance Dashboard
        </h1>
        
        {/* Period Selection */}
        <div className="flex gap-2 mb-6">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setDaysBack(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                daysBack === days
                  ? 'bg-teal-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* On-Time Delivery */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                On-Time Delivery
              </h3>
              <Target className="text-green-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {kpis.onTimeDelivery.percentage.toFixed(1)}%
            </div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(kpis.onTimeDelivery.status)}`}>
              {kpis.onTimeDelivery.status}
            </div>
          </div>

          {/* Late Deliveries */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Late Deliveries
              </h3>
              <AlertTriangle className="text-orange-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {kpis.lateDeliveries.total}
            </div>
            <div className="text-xs text-red-600">
              {kpis.lateDeliveries.critical} Critical
            </div>
          </div>

          {/* Average Variance */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Avg Variance
              </h3>
              <Clock className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {kpis.avgVariance.days.toFixed(1)} days
            </div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(kpis.avgVariance.status)}`}>
              {kpis.avgVariance.status}
            </div>
          </div>

          {/* Overall Health */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Health Score
              </h3>
              <Truck className="text-teal-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {kpis.supplierHealth.avgScore}
            </div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(kpis.overallHealthScore)}`}>
              {kpis.overallHealthScore}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Health Breakdown */}
      {kpis && (
        <div className={`p-6 rounded-xl border mb-8 ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Supplier Health Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{kpis.supplierHealth.certified}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Certified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{kpis.supplierHealth.preferred}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Preferred</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{kpis.supplierHealth.acceptable}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Acceptable</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{kpis.supplierHealth.atRisk}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>At Risk</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">{kpis.supplierHealth.certified + kpis.supplierHealth.preferred + kpis.supplierHealth.acceptable + kpis.supplierHealth.atRisk}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Variance Breakdown Table */}
      {breakdown.length > 0 && (
        <div className={`p-6 rounded-xl border mb-8 ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Delivery Variance Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-300'}>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                  <th className={`text-right py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Deliveries</th>
                  <th className={`text-right py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Variance (Days)</th>
                  <th className={`text-right py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Suppliers</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, idx) => (
                  <tr key={idx} className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.varianceCategory}
                    </td>
                    <td className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.deliveryCount}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${item.avgVariance < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {item.avgVariance > 0 ? '+' : ''}{item.avgVariance.toFixed(1)}
                    </td>
                    <td className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.supplierCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Late Deliveries Alert */}
      {lateDeliveries.length > 0 && (
        <div className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertCircle className="mr-2 text-red-500" size={20} />
            Recent Late Deliveries
          </h2>
          <div className="space-y-3">
            {lateDeliveries.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.supplier} - {item.grn}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.poNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${getSeverityColor(item.severity)}`}>
                      +{item.variance} days
                    </div>
                    <div className={`text-xs font-medium ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryVarianceDashboard;
