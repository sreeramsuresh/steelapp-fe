import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Zap, TrendingUp, Clock, Package } from 'lucide-react';

// Mock data for fast-moving products
const generateMockData = () => ({
  products: [
    {
      id: 1,
      name: 'SS 304 2B Sheet 1.0mm',
      category: 'Sheets',
      turnoverRatio: 8.5,
      daysToSell: 12,
      currentStock: 45.2,
      reorderPoint: 20,
      lastSaleDate: '2024-01-15',
      trend: [65, 58, 52, 48, 45],
      status: 'optimal',
    },
    {
      id: 2,
      name: 'SS 316 Coil 0.8mm',
      category: 'Coils',
      turnoverRatio: 7.2,
      daysToSell: 15,
      currentStock: 32.8,
      reorderPoint: 15,
      lastSaleDate: '2024-01-14',
      trend: [48, 45, 40, 35, 33],
      status: 'optimal',
    },
    {
      id: 3,
      name: 'SS 430 Sheet 1.2mm',
      category: 'Sheets',
      turnoverRatio: 6.8,
      daysToSell: 18,
      currentStock: 28.5,
      reorderPoint: 12,
      lastSaleDate: '2024-01-14',
      trend: [42, 38, 35, 30, 28],
      status: 'optimal',
    },
    {
      id: 4,
      name: 'SS 304 BA Sheet 0.5mm',
      category: 'Sheets',
      turnoverRatio: 5.9,
      daysToSell: 22,
      currentStock: 18.2,
      reorderPoint: 10,
      lastSaleDate: '2024-01-13',
      trend: [32, 28, 24, 20, 18],
      status: 'watch',
    },
    {
      id: 5,
      name: 'SS 202 Sheet 1.5mm',
      category: 'Sheets',
      turnoverRatio: 5.2,
      daysToSell: 25,
      currentStock: 52.4,
      reorderPoint: 25,
      lastSaleDate: '2024-01-12',
      trend: [68, 62, 58, 55, 52],
      status: 'optimal',
    },
    {
      id: 6,
      name: 'SS 304 Tube 25x25mm',
      category: 'Tubes',
      turnoverRatio: 4.8,
      daysToSell: 28,
      currentStock: 22.6,
      reorderPoint: 15,
      lastSaleDate: '2024-01-11',
      trend: [35, 32, 28, 25, 23],
      status: 'watch',
    },
  ],
  summary: {
    totalFastMoving: 24,
    avgTurnover: 6.4,
    totalValue: 1250000,
  },
});

const MiniTrendLine = ({ data, width = 50, height = 20, isDarkMode }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const FastMovingWidget = ({ data, onNavigate, onProductClick }) => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const mockData = generateMockData();
    setProducts(data?.products || mockData.products);
    setSummary(data?.summary || mockData.summary);
  }, [data]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'optimal':
        return {
          bg: isDarkMode ? 'bg-green-500/20' : 'bg-green-100',
          text: isDarkMode ? 'text-green-400' : 'text-green-700',
          label: 'Optimal',
        };
      case 'watch':
        return {
          bg: isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100',
          text: isDarkMode ? 'text-yellow-400' : 'text-yellow-700',
          label: 'Watch',
        };
      default:
        return {
          bg: isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100',
          text: isDarkMode ? 'text-gray-400' : 'text-gray-600',
          label: 'Normal',
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Fast Moving Items
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Turnover ratio &gt; 4x/quarter
            </p>
          </div>
        </div>
        
        {summary && (
          <div className={`px-2 py-1 rounded-lg ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
            <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {summary.totalFastMoving} items
            </span>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {products.slice(0, 6).map((product, index) => {
          const status = getStatusBadge(product.status);
          const stockPercent = (product.currentStock / (product.reorderPoint * 3)) * 100;
          
          return (
            <div
              key={product.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'
              }`}
              onClick={() => onProductClick?.(product)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                    <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {product.category}
                    </span>
                  </div>
                </div>
                
                <div className="text-right ml-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.turnoverRatio}x
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {product.daysToSell}d avg
                  </p>
                </div>
              </div>
              
              {/* Stock Level & Trend */}
              <div className="flex items-center justify-between ml-6">
                <div className="flex items-center gap-2">
                  <Package size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {product.currentStock.toFixed(1)} MT
                  </span>
                  <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full ${
                        stockPercent > 60 ? 'bg-green-500' : stockPercent > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stockPercent, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MiniTrendLine data={product.trend} isDarkMode={isDarkMode} />
                  <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(product.lastSaleDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {summary && (
        <div className={`mt-4 pt-3 border-t grid grid-cols-2 gap-4 ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}>
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Turnover</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {summary.avgTurnover}x / quarter
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Value</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              AED {(summary.totalValue / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      )}

      {/* View All Link */}
      <div className="mt-3 text-center">
        <button
          onClick={() => onNavigate?.('/inventory?filter=fast-moving')}
          className={`text-xs font-medium ${
            isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View All Fast Moving
        </button>
      </div>
    </div>
  );
};

export default FastMovingWidget;
