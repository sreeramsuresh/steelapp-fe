import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ship, FileCheck, Anchor, Globe, ArrowDownToLine, ArrowUpFromLine, TrendingUp, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ImportExportOverview = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    importOrders: {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0,
    },
    exportOrders: {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0,
    },
    shipments: {
      inTransit: 0,
      arrived: 0,
      pending: 0,
    },
    certificates: {
      pending: 0,
      verified: 0,
      expiring: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual API calls
    // Simulated data for now
    setTimeout(() => {
      setStats({
        importOrders: {
          total: 45,
          active: 12,
          pending: 8,
          completed: 25,
        },
        exportOrders: {
          total: 38,
          active: 15,
          pending: 6,
          completed: 17,
        },
        shipments: {
          inTransit: 23,
          arrived: 8,
          pending: 14,
        },
        certificates: {
          pending: 7,
          verified: 34,
          expiring: 3,
        },
      });
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, link, sublabel }) => (
    <Link 
      to={link}
      className={`${
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
    </Link>
  );

  const QuickActionCard = ({ title, description, icon: Icon, link, color }) => (
    <Link
      to={link}
      className={`${
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
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Import / Export Overview
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track your international trade operations
          </p>
        </div>
        <Link
          to="/import-orders"
          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Import Orders"
          value={stats.importOrders.total}
          icon={ArrowDownToLine}
          color="bg-blue-500"
          link="/import-orders"
          sublabel={`${stats.importOrders.active} active`}
        />
        <StatCard
          title="Export Orders"
          value={stats.exportOrders.total}
          icon={ArrowUpFromLine}
          color="bg-green-500"
          link="/export-orders"
          sublabel={`${stats.exportOrders.active} active`}
        />
        <StatCard
          title="Shipments"
          value={stats.shipments.inTransit}
          icon={Ship}
          color="bg-orange-500"
          link="/shipping-documents"
          sublabel="in transit"
        />
        <StatCard
          title="Certificates"
          value={stats.certificates.pending}
          icon={FileCheck}
          color="bg-purple-500"
          link="/material-certificates"
          sublabel="pending verification"
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
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Import Order IMP-202411-0032 arrived at port
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Export Order EXP-202411-0028 shipped
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      6 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      MTC Certificate verified for Order IMP-202411-0031
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      1 day ago
                    </p>
                  </div>
                </div>
              </>
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
              title="New Import Order"
              description="Create a new import order"
              icon={ArrowDownToLine}
              link="/import-orders/new"
              color="bg-blue-500"
            />
            <QuickActionCard
              title="New Export Order"
              description="Create a new export order"
              icon={ArrowUpFromLine}
              link="/export-orders/new"
              color="bg-green-500"
            />
            <QuickActionCard
              title="Track Shipments"
              description="View shipping documents"
              icon={Ship}
              link="/shipping-documents"
              color="bg-orange-500"
            />
            <QuickActionCard
              title="Exchange Rates"
              description="View current rates"
              icon={TrendingUp}
              link="/exchange-rates"
              color="bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {!loading && stats.certificates.expiring > 0 && (
        <div className={`${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${
          isDarkMode ? 'border-yellow-800' : 'border-yellow-200'
        } rounded-lg p-4`}>
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-yellow-600" />
            <div>
              <h4 className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                Certificates Expiring Soon
              </h4>
              <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                {stats.certificates.expiring} material certificates are expiring within 30 days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExportOverview;
