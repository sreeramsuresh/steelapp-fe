import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Warehouse, ArrowRightLeft, TrendingUp, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';

// Fallback mock data for warehouse utilization (used only when no API data is available)
const generateFallbackData = () => ({
  warehouses: [
    {
      id: 1,
      name: 'Main Warehouse',
      code: 'WH-01',
      city: 'Dubai',
      capacity: 500,
      used: 425,
      utilization: 85,
      value: 2850000,
      items: 456,
      status: 'high',
    },
    {
      id: 2,
      name: 'Jebel Ali Storage',
      code: 'WH-02',
      city: 'Jebel Ali',
      capacity: 800,
      used: 520,
      utilization: 65,
      value: 1950000,
      items: 312,
      status: 'optimal',
    },
    {
      id: 3,
      name: 'Sharjah Depot',
      code: 'WH-03',
      city: 'Sharjah',
      capacity: 300,
      used: 285,
      utilization: 95,
      value: 980000,
      items: 189,
      status: 'critical',
    },
    {
      id: 4,
      name: 'Abu Dhabi Hub',
      code: 'WH-04',
      city: 'Abu Dhabi',
      capacity: 400,
      used: 180,
      utilization: 45,
      value: 720000,
      items: 145,
      status: 'low',
    },
  ],
  transfers: [
    { from: 'WH-03', to: 'WH-04', product: 'SS 304 Sheet', qty: 25, status: 'pending' },
    { from: 'WH-01', to: 'WH-02', product: 'SS 316 Coil', qty: 15, status: 'in_transit' },
  ],
  summary: {
    totalCapacity: 2000,
    totalUsed: 1410,
    avgUtilization: 70.5,
    totalValue: 6500000,
  },
  isMockData: true,
});

const WarehouseUtilizationWidget = ({ data, onNavigate, onWarehouseClick, onTransfer, onRefresh, loading: externalLoading }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  useEffect(() => {
    // Use API data if available and has warehouses, otherwise use fallback
    if (data && data.warehouses && data.warehouses.length > 0) {
      setWarehouseData(data);
    } else {
      setWarehouseData(generateFallbackData());
    }
  }, [data]);

  const isLoading = loading || externalLoading;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
        // Data will be updated via props after refresh
      }
    } finally {
      setLoading(false);
    }
  };

  if (!warehouseData) return null;

  const getStatusInfo = (status) => {
    const info = {
      critical: {
        color: isDarkMode ? 'text-red-400' : 'text-red-600',
        bg: isDarkMode ? 'bg-red-500' : 'bg-red-500',
        label: 'Critical',
        bgLight: isDarkMode ? 'bg-red-500/10' : 'bg-red-50',
      },
      high: {
        color: isDarkMode ? 'text-amber-400' : 'text-amber-600',
        bg: isDarkMode ? 'bg-amber-500' : 'bg-amber-500',
        label: 'High',
        bgLight: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50',
      },
      optimal: {
        color: isDarkMode ? 'text-green-400' : 'text-green-600',
        bg: isDarkMode ? 'bg-green-500' : 'bg-green-500',
        label: 'Optimal',
        bgLight: isDarkMode ? 'bg-green-500/10' : 'bg-green-50',
      },
      low: {
        color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        bg: isDarkMode ? 'bg-blue-500' : 'bg-blue-500',
        label: 'Low',
        bgLight: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      },
    };
    return info[status] || info.optimal;
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(2)}M`;
    }
    return `AED ${(amount / 1000).toFixed(0)}K`;
  };

  const getUtilizationColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-amber-500';
    if (percent >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Warehouse size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Warehouse Utilization
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Capacity across locations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall Utilization */}
          <div className="text-right">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall</p>
            <p className={`text-lg font-bold ${
              warehouseData.summary.avgUtilization >= 80 ? 'text-amber-500' :
                warehouseData.summary.avgUtilization >= 60 ? 'text-green-500' : 'text-blue-500'
            }`}>
              {warehouseData.summary.avgUtilization.toFixed(1)}%
            </p>
          </div>
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              } ${isLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Warehouse Cards */}
      <div className="space-y-2 mb-4">
        {warehouseData.warehouses.map((warehouse) => {
          const status = getStatusInfo(warehouse.status);
          const isSelected = selectedWarehouse?.id === warehouse.id;
          
          return (
            <div
              key={warehouse.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? isDarkMode ? 'bg-[#2E3B4E] ring-1 ring-teal-500/50' : 'bg-teal-50 ring-1 ring-teal-200'
                  : isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedWarehouse(isSelected ? null : warehouse);
                onWarehouseClick?.(warehouse);
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {warehouse.name}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.bgLight} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {warehouse.city} ({warehouse.code})
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {warehouse.utilization}%
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {warehouse.used}/{warehouse.capacity} MT
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}>
                <div
                  className={`h-full rounded-full transition-all ${getUtilizationColor(warehouse.utilization)}`}
                  style={{ width: `${warehouse.utilization}%` }}
                />
              </div>
              
              {/* Expanded Details */}
              {isSelected && (
                <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 ${
                  isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
                }`}>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stock Value</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(warehouse.value)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Items</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {warehouse.items} SKUs
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transfer Recommendations */}
      {warehouseData.transfers.length > 0 && (
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Transfer Recommendations
            </p>
          </div>
          <div className="space-y-2">
            {warehouseData.transfers.map((transfer, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {transfer.from}
                  </span>
                  <ArrowRightLeft size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {transfer.to}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {transfer.qty} MT
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    transfer.status === 'in_transit'
                      ? isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                      : isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {transfer.status === 'in_transit' ? 'In Transit' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className={`mt-4 pt-3 border-t grid grid-cols-3 gap-2 ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Capacity</p>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {warehouseData.summary.totalCapacity} MT
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Used</p>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {warehouseData.summary.totalUsed} MT
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Value</p>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(warehouseData.summary.totalValue)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex justify-between items-center">
        <button
          onClick={() => onTransfer?.()}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            isDarkMode
              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          <ArrowRightLeft size={12} />
          New Transfer
        </button>
        <button
          onClick={() => onNavigate?.('/warehouses')}
          className={`text-xs font-medium ${
            isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          Manage Warehouses
        </button>
      </div>
    </div>
  );
};

export default WarehouseUtilizationWidget;
