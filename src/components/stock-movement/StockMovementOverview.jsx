/**
 * StockMovementOverview Component
 * Dashboard overview for stock movements with KPI cards, recent activity, and quick actions
 *
 * Design aligned with ImportExportOverview pattern
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Plus,
  ClipboardList,
  BarChart3,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { stockMovementService, TRANSFER_STATUSES, RESERVATION_STATUSES } from '../../services/stockMovementService';

const StockMovementOverview = ({ onNavigateToTab }) => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    pendingTransfers: 0,
    inTransit: 0,
    completedToday: 0,
    awaitingReconciliation: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load transfers to calculate stats
      const [transfersResult, reservationsResult] = await Promise.all([
        stockMovementService.listTransfers({ limit: 100 }),
        stockMovementService.listReservations({ limit: 50 }),
      ]);

      const transfers = transfersResult.data || [];
      const reservations = reservationsResult.data || [];

      // Calculate stats
      const pendingTransfers = transfers.filter(
        t => t.status === 'DRAFT' || t.status === 'PENDING'
      ).length;

      const inTransit = transfers.filter(
        t => t.status === 'SHIPPED' || t.status === 'IN_TRANSIT'
      ).length;

      // Completed today - check if receivedDate is today
      const today = new Date().toDateString();
      const completedToday = transfers.filter(t => {
        if (t.status !== 'RECEIVED') return false;
        if (!t.receivedDate) return false;
        const receivedDate = typeof t.receivedDate === 'object' && t.receivedDate.seconds
          ? new Date(t.receivedDate.seconds * 1000)
          : new Date(t.receivedDate);
        return receivedDate.toDateString() === today;
      }).length;

      // Awaiting reconciliation - active reservations that need attention
      const awaitingReconciliation = reservations.filter(
        r => r.status === 'ACTIVE' || r.status === 'PARTIALLY_FULFILLED'
      ).length;

      setStats({
        pendingTransfers,
        inTransit,
        completedToday,
        awaitingReconciliation,
      });

      // Build recent activity from transfers and reservations
      const activities = [];

      // Add recent transfers
      transfers.slice(0, 5).forEach(t => {
        let color = 'blue';
        let description = '';

        if (t.status === 'RECEIVED') {
          color = 'green';
          description = `Transfer ${t.transferNumber} received at ${t.destinationWarehouseName}`;
        } else if (t.status === 'SHIPPED' || t.status === 'IN_TRANSIT') {
          color = 'orange';
          description = `Transfer ${t.transferNumber} shipped from ${t.sourceWarehouseName}`;
        } else if (t.status === 'DRAFT' || t.status === 'PENDING') {
          color = 'blue';
          description = `Transfer ${t.transferNumber} created`;
        } else if (t.status === 'CANCELLED') {
          color = 'red';
          description = `Transfer ${t.transferNumber} cancelled`;
        }

        activities.push({
          id: `transfer-${t.id}`,
          color,
          description,
          timestamp: t.updatedAt || t.createdAt,
        });
      });

      // Add recent reservations
      reservations.slice(0, 3).forEach(r => {
        let color = 'purple';
        let description = '';

        if (r.status === 'FULFILLED') {
          color = 'green';
          description = `Reservation ${r.reservationNumber} fulfilled`;
        } else if (r.status === 'ACTIVE') {
          color = 'purple';
          description = `Stock reserved for ${r.productName}`;
        } else if (r.status === 'PARTIALLY_FULFILLED') {
          color = 'yellow';
          description = `Reservation ${r.reservationNumber} partially fulfilled`;
        }

        activities.push({
          id: `reservation-${r.id}`,
          color,
          description,
          timestamp: r.updatedAt || r.createdAt,
        });
      });

      // Sort by timestamp and take first 5
      activities.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
      });

      setRecentActivity(activities.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // Use placeholder data on error
      setStats({
        pendingTransfers: 0,
        inTransit: 0,
        completedToday: 0,
        awaitingReconciliation: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const date = typeof timestamp === 'object' && timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick, sublabel }) => (
    <button
      onClick={onClick}
      className={`w-full text-left ${
        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
      } p-4 rounded-lg shadow-sm transition-colors border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : value}
          </p>
          {sublabel && (
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {sublabel}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </button>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color }) => (
    <button
      onClick={onClick}
      className={`w-full text-left ${
        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
      } p-4 rounded-lg shadow-sm transition-colors border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } hover:shadow-md`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h4>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );

  const getActivityColorClass = (color) => {
    const colorMap = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Stock Movement Overview
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track transfers, reservations, and stock reconciliation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            } ${loading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => onNavigateToTab?.('transfers')}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center"
          >
            View All <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Transfers"
          value={stats.pendingTransfers}
          icon={Package}
          color="bg-orange-500"
          onClick={() => onNavigateToTab?.('transfers')}
          sublabel="awaiting shipment"
        />
        <StatCard
          title="In Transit"
          value={stats.inTransit}
          icon={Truck}
          color="bg-blue-500"
          onClick={() => onNavigateToTab?.('transfers')}
          sublabel="being shipped"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          icon={CheckCircle}
          color="bg-green-500"
          onClick={() => onNavigateToTab?.('transfers')}
          sublabel="transfers received"
        />
        <StatCard
          title="Awaiting Reconciliation"
          value={stats.awaitingReconciliation}
          icon={AlertTriangle}
          color="bg-red-500"
          onClick={() => onNavigateToTab?.('reconciliation')}
          sublabel="active reservations"
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm border ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-md font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-center py-4`}>
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${getActivityColorClass(activity.color)} rounded-full`}></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {activity.description}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm border ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-md font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <QuickActionCard
              title="New Transfer"
              description="Create inter-warehouse transfer"
              icon={Plus}
              onClick={() => onNavigateToTab?.('transfers', 'create')}
              color="bg-teal-600"
            />
            <QuickActionCard
              title="Reconcile Stock"
              description="Review and reconcile inventory"
              icon={ClipboardList}
              onClick={() => onNavigateToTab?.('reconciliation')}
              color="bg-purple-500"
            />
            <QuickActionCard
              title="View Reports"
              description="Access stock movement reports"
              icon={BarChart3}
              onClick={() => onNavigateToTab?.('reconciliation', 'audit')}
              color="bg-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMovementOverview;
