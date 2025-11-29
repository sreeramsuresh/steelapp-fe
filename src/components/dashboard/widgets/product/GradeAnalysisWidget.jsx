import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Award, TrendingUp, TrendingDown, Flame, Snowflake } from 'lucide-react';


const MiniSparkline = ({ data, positive, isDarkMode }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#10B981' : '#EF4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={positive ? '#10B981' : '#EF4444'}
      />
    </svg>
  );
};

const GradeAnalysisWidget = ({ data, onNavigate, onGradeClick }) => {
  const { isDarkMode } = useTheme();
  const [grades, setGrades] = useState([]);
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    if (!data?.grades || data.grades.length === 0) {
      setGrades([]);
      return;
    }

    // Sort by selected criteria
    const gradeData = [...data.grades].sort((a, b) => {
      switch (sortBy) {
        case 'margin':
          return b.margin - a.margin;
        case 'volume':
          return b.volume - a.volume;
        case 'price':
          return b.avgPrice - a.avgPrice;
        default:
          return b.revenue - a.revenue;
      }
    });

    setGrades(gradeData);
  }, [data, sortBy]);

  // Check if we have valid data
  const hasData = data && data.grades && data.grades.length > 0;

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div className={`rounded-xl border p-4 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Award size={16} className="text-white" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Grade Analysis
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Performance by SS grade
              </p>
            </div>
          </div>
        </div>
        <div className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(0)}K`;
    }
    return `AED ${amount}`;
  };

  const getDemandIcon = (demand) => {
    switch (demand) {
      case 'high':
        return <Flame size={12} className="text-orange-500" />;
      case 'low':
        return <Snowflake size={12} className="text-blue-400" />;
      default:
        return null;
    }
  };

  const getDemandBadge = (demand) => {
    const styles = {
      high: isDarkMode 
        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
        : 'bg-orange-100 text-orange-700 border-orange-200',
      medium: isDarkMode 
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
        : 'bg-blue-100 text-blue-700 border-blue-200',
      low: isDarkMode 
        ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' 
        : 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return styles[demand] || styles.medium;
  };

  const getGradeColor = (grade) => {
    const colors = {
      'SS 304': 'from-blue-500 to-blue-600',
      'SS 316': 'from-purple-500 to-purple-600',
      'SS 430': 'from-amber-500 to-amber-600',
      'SS 202': 'from-emerald-500 to-emerald-600',
      'SS 316L': 'from-indigo-500 to-indigo-600',
      'SS 304L': 'from-cyan-500 to-cyan-600',
    };
    return colors[grade] || 'from-gray-500 to-gray-600';
  };

  const maxRevenue = Math.max(...grades.map(g => g.revenue));

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Award size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Grade Analysis
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Performance by SS grade
            </p>
          </div>
        </div>
        
        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`text-xs font-medium px-2 py-1 rounded-lg border cursor-pointer ${
            isDarkMode
              ? 'bg-[#121418] border-[#37474F] text-white'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          <option value="revenue">By Revenue</option>
          <option value="margin">By Margin</option>
          <option value="volume">By Volume</option>
          <option value="price">By Price</option>
        </select>
      </div>

      {/* Grade List */}
      <div className="space-y-2">
        {grades.map((grade, index) => (
          <div
            key={grade.grade}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'
            }`}
            onClick={() => onGradeClick?.(grade)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradeColor(grade.grade)} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {grade.grade}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 ${getDemandBadge(grade.demand)}`}>
                      {getDemandIcon(grade.demand)}
                      {grade.demand.charAt(0).toUpperCase() + grade.demand.slice(1)}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {grade.volume.toFixed(1)} MT sold
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(grade.revenue)}
                </p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  {grade.margin.toFixed(1)}% margin
                </p>
              </div>
            </div>
            
            {/* Price and Trend Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Price: </span>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AED {grade.avgPrice}/kg
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  grade.priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {grade.priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(grade.priceChange).toFixed(1)}%
                </div>
              </div>
              
              <MiniSparkline 
                data={grade.trend} 
                positive={grade.priceChange >= 0}
                isDarkMode={isDarkMode}
              />
            </div>
            
            {/* Revenue Bar */}
            <div className={`mt-2 h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}>
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getGradeColor(grade.grade)} transition-all duration-500`}
                style={{ width: `${(grade.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-orange-500" />
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>High demand</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Medium</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate?.('/products?view=grades')}
          className={`text-xs font-medium ${
            isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default GradeAnalysisWidget;
