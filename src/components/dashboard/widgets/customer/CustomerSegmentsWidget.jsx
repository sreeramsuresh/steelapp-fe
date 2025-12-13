/**
 * CustomerSegmentsWidget.jsx
 *
 * Customer Segmentation Widget
 * Displays customer distribution by industry, size, and geography
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  PieChart,
  Building2,
  MapPin,
  Users,
  Info,
  RefreshCw,
} from 'lucide-react';
// Mock segmentation data
const MOCK_SEGMENTS_DATA = {
  byIndustry: [
    {
      name: 'Fabricators',
      count: 58,
      revenue: 12500000,
      percent: 37,
      color: '#14B8A6',
    },
    {
      name: 'Traders',
      count: 42,
      revenue: 8900000,
      percent: 27,
      color: '#3B82F6',
    },
    {
      name: 'OEMs',
      count: 28,
      revenue: 7200000,
      percent: 18,
      color: '#F59E0B',
    },
    {
      name: 'Projects',
      count: 18,
      revenue: 4800000,
      percent: 12,
      color: '#8B5CF6',
    },
    {
      name: 'Others',
      count: 10,
      revenue: 1600000,
      percent: 6,
      color: '#6B7280',
    },
  ],
  bySize: [
    {
      name: 'Enterprise',
      count: 25,
      revenue: 15200000,
      percent: 16,
      color: '#22C55E',
    },
    {
      name: 'SMB',
      count: 68,
      revenue: 12800000,
      percent: 44,
      color: '#3B82F6',
    },
    {
      name: 'Small',
      count: 63,
      revenue: 7000000,
      percent: 40,
      color: '#F59E0B',
    },
  ],
  byGeography: [
    {
      name: 'Dubai',
      count: 65,
      revenue: 14500000,
      percent: 42,
      color: '#14B8A6',
    },
    {
      name: 'Abu Dhabi',
      count: 38,
      revenue: 8200000,
      percent: 24,
      color: '#3B82F6',
    },
    {
      name: 'Sharjah',
      count: 28,
      revenue: 5800000,
      percent: 18,
      color: '#F59E0B',
    },
    { name: 'RAK', count: 15, revenue: 3200000, percent: 10, color: '#8B5CF6' },
    {
      name: 'Others',
      count: 10,
      revenue: 2300000,
      percent: 6,
      color: '#6B7280',
    },
  ],
  totalCustomers: 156,
  totalRevenue: 35000000,
};

const SEGMENT_VIEWS = [
  { key: 'byIndustry', label: 'By Industry', icon: Building2 },
  { key: 'bySize', label: 'By Size', icon: Users },
  { key: 'byGeography', label: 'By Geography', icon: MapPin },
];

const CustomerSegmentsWidget = ({
  data: propData,
  onRefresh,
  onViewSegment,
  onViewDetails,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [segmentData, setSegmentData] = useState(
    propData || MOCK_SEGMENTS_DATA,
  );
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('byIndustry');

  useEffect(() => {
    if (propData) {
      setSegmentData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setSegmentData(freshData || MOCK_SEGMENTS_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `AED ${(safeAmount / 1000000).toFixed(2)}M`;
    } else if (safeAmount >= 1000) {
      return `AED ${(safeAmount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  // Generate pie chart SVG path
  const generatePieChart = (segments) => {
    let currentAngle = 0;
    return segments.map((segment, _idx) => {
      const startAngle = currentAngle;
      const sweepAngle = (segment.percent / 100) * 360;
      currentAngle += sweepAngle;
      const endAngle = startAngle + sweepAngle;

      const largeArc = sweepAngle > 180 ? 1 : 0;
      const startX = 50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
      const startY = 50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
      const endX = 50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
      const endY = 50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);

      return {
        path: `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`,
        color: segment.color,
        name: segment.name,
        percent: segment.percent,
      };
    });
  };

  if (!segmentData) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={20} className="text-indigo-500" />
          <h3
            className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Customer Segments
          </h3>
        </div>
        <div className="text-center py-8">
          <PieChart
            size={48}
            className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          />
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            No segmentation data available
          </p>
        </div>
      </div>
    );
  }

  const activeSegments = segmentData[activeView] || [];
  const pieSlices = generatePieChart(activeSegments);

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? 'bg-[#1E2328] border-[#37474F] hover:border-indigo-600'
          : 'bg-white border-[#E0E0E0] hover:border-indigo-500'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <PieChart size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Customer Segments
              <span className="relative group">
                <Info
                  size={14}
                  className="cursor-help opacity-50 hover:opacity-100"
                />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                  }`}
                >
                  Customer distribution by segment
                </span>
              </span>
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {segmentData.totalCustomers} total customers
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || isLoading}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-[#2E3B4E] text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${loading || isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Segment View Toggle */}
      <div
        className="flex gap-1 mb-4 p-1 rounded-lg bg-opacity-50"
        style={{
          backgroundColor: isDarkMode ? '#2E3B4E' : '#F3F4F6',
        }}
      >
        {SEGMENT_VIEWS.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                activeView === view.key
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">
                {view.label.split(' ')[1]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pie Chart & Legend */}
      <div className="flex items-center gap-4 mb-4">
        {/* Pie Chart */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full transform -rotate-0"
          >
            {pieSlices.map((slice, idx) => (
              <path
                key={idx}
                d={slice.path}
                fill={slice.color}
                className="transition-all duration-300 hover:opacity-80"
                style={{ cursor: 'pointer' }}
              />
            ))}
            {/* Center hole for donut effect */}
            <circle
              cx="50"
              cy="50"
              r="20"
              fill={isDarkMode ? '#1E2328' : '#FFFFFF'}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p
                className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {segmentData.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1">
          {activeSegments.slice(0, 4).map((segment, idx) => (
            <div
              key={idx}
              onClick={() =>
                onViewSegment && onViewSegment(segment, activeView)
              }
              className={`flex items-center gap-2 p-1 rounded transition-colors ${
                onViewSegment ? 'cursor-pointer hover:bg-opacity-50' : ''
              } ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span
                className={`text-xs flex-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {segment.name}
              </span>
              <span
                className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {segment.percent}%
              </span>
            </div>
          ))}
          {activeSegments.length > 4 && (
            <p
              className={`text-xs pl-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              +{activeSegments.length - 4} more
            </p>
          )}
        </div>
      </div>

      {/* Segment Details */}
      <div className="space-y-2">
        {activeSegments.slice(0, 3).map((segment, idx) => (
          <div
            key={idx}
            onClick={() => onViewSegment && onViewSegment(segment, activeView)}
            className={`p-3 rounded-lg transition-all duration-200 ${
              onViewSegment ? 'cursor-pointer' : ''
            } ${isDarkMode ? 'bg-[#2E3B4E] hover:bg-[#374151]' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span
                  className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {segment.name}
                </span>
              </div>
              <span
                className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {formatCurrency(segment.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                {segment.count} customers
              </span>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                {segment.percent}% of total
              </span>
            </div>
            <div
              className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${segment.percent}%`,
                  backgroundColor: segment.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total Revenue */}
      <div
        className={`mt-4 pt-3 border-t flex justify-between items-center ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}
      >
        <span
          className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          Total Revenue
        </span>
        <span
          className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {formatCurrency(segmentData.totalRevenue)}
        </span>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(segmentData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          View Full Analysis
        </button>
      )}
    </div>
  );
};

export default CustomerSegmentsWidget;
