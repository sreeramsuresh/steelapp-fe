import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { AlertTriangle, ShoppingCart, Clock, ChevronRight, AlertCircle, AlertOctagon } from 'lucide-react';

// Mock data for reorder alerts
const generateMockData = () => ({
  products: [
    {
      id: 1,
      name: 'SS 304 2B Sheet 1.0mm',
      category: 'Sheets',
      currentStock: 8.5,
      reorderPoint: 20,
      maxStock: 100,
      daysOfCover: 3,
      avgDailySales: 2.8,
      lastOrderDate: '2024-01-05',
      suggestedQty: 50,
      priority: 'critical',
    },
    {
      id: 2,
      name: 'SS 316 Coil 0.8mm',
      category: 'Coils',
      currentStock: 12.2,
      reorderPoint: 15,
      maxStock: 80,
      daysOfCover: 7,
      avgDailySales: 1.7,
      lastOrderDate: '2024-01-08',
      suggestedQty: 35,
      priority: 'warning',
    },
    {
      id: 3,
      name: 'SS 430 Sheet 1.2mm',
      category: 'Sheets',
      currentStock: 18.5,
      reorderPoint: 25,
      maxStock: 120,
      daysOfCover: 12,
      avgDailySales: 1.5,
      lastOrderDate: '2024-01-10',
      suggestedQty: 60,
      priority: 'approaching',
    },
    {
      id: 4,
      name: 'SS 316L Pipe 2"',
      category: 'Pipes',
      currentStock: 5.2,
      reorderPoint: 10,
      maxStock: 50,
      daysOfCover: 4,
      avgDailySales: 1.3,
      lastOrderDate: '2024-01-03',
      suggestedQty: 25,
      priority: 'critical',
    },
    {
      id: 5,
      name: 'SS 304 Tube 25x25mm',
      category: 'Tubes',
      currentStock: 14.8,
      reorderPoint: 18,
      maxStock: 90,
      daysOfCover: 9,
      avgDailySales: 1.6,
      lastOrderDate: '2024-01-09',
      suggestedQty: 45,
      priority: 'warning',
    },
  ],
  summary: {
    critical: 5,
    warning: 8,
    approaching: 12,
    totalValue: 125000,
  },
});

const ReorderAlertsWidget = ({ data, onNavigate, onProductClick, onCreatePO }) => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const mockData = generateMockData();
    setProducts(data?.products || mockData.products);
    setSummary(data?.summary || mockData.summary);
  }, [data]);

  const getPriorityInfo = (priority) => {
    const info = {
      critical: {
        icon: AlertOctagon,
        label: 'Critical',
        color: isDarkMode ? 'text-red-400' : 'text-red-600',
        bg: isDarkMode ? 'bg-red-500/10' : 'bg-red-50',
        border: isDarkMode ? 'border-red-500/30' : 'border-red-200',
        ringColor: 'ring-red-500',
      },
      warning: {
        icon: AlertTriangle,
        label: 'Warning',
        color: isDarkMode ? 'text-amber-400' : 'text-amber-600',
        bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50',
        border: isDarkMode ? 'border-amber-500/30' : 'border-amber-200',
        ringColor: 'ring-amber-500',
      },
      approaching: {
        icon: AlertCircle,
        label: 'Approaching',
        color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
        border: isDarkMode ? 'border-blue-500/30' : 'border-blue-200',
        ringColor: 'ring-blue-500',
      },
    };
    return info[priority] || info.approaching;
  };

  const getStockLevelColor = (current, reorder, max) => {
    const percent = (current / max) * 100;
    if (current <= reorder * 0.5) return 'bg-red-500';
    if (current <= reorder) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.priority === filter);

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Reorder Alerts
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Items at or below reorder point
            </p>
          </div>
        </div>
      </div>

      {/* Priority Filter Tabs */}
      {summary && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-teal-500 text-white'
                : isDarkMode ? 'bg-[#121418] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({summary.critical + summary.warning + summary.approaching})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === 'critical'
                ? 'bg-red-500 text-white'
                : isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <AlertOctagon size={12} />
            Critical ({summary.critical})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === 'warning'
                ? 'bg-amber-500 text-white'
                : isDarkMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle size={12} />
            Warning ({summary.warning})
          </button>
          <button
            onClick={() => setFilter('approaching')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === 'approaching'
                ? 'bg-blue-500 text-white'
                : isDarkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <AlertCircle size={12} />
            Approaching ({summary.approaching})
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.slice(0, 5).map((product) => {
          const priority = getPriorityInfo(product.priority);
          const PriorityIcon = priority.icon;
          const stockPercent = (product.currentStock / product.maxStock) * 100;
          const reorderPercent = (product.reorderPoint / product.maxStock) * 100;
          
          return (
            <div
              key={product.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${priority.bg} ${priority.border} ${
                isDarkMode ? 'hover:ring-1' : 'hover:ring-2'
              } hover:${priority.ringColor}`}
              onClick={() => onProductClick?.(product)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PriorityIcon size={16} className={priority.color} />
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {product.category}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePO?.(product);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    isDarkMode
                      ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                      : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}
                >
                  <ShoppingCart size={12} />
                  Create PO
                </button>
              </div>
              
              {/* Stock Level Gauge */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {product.currentStock.toFixed(1)} MT / {product.maxStock} MT
                  </span>
                  <span className={`text-xs font-medium ${priority.color}`}>
                    {product.daysOfCover}d cover
                  </span>
                </div>
                <div className="relative">
                  <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full rounded-full ${getStockLevelColor(product.currentStock, product.reorderPoint, product.maxStock)}`}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                  {/* Reorder Point Marker */}
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-gray-600"
                    style={{ left: `${reorderPercent}%` }}
                    title={`Reorder Point: ${product.reorderPoint} MT`}
                  />
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Clock size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Suggest: {product.suggestedQty} MT
                  </span>
                </div>
                <ChevronRight size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Est. PO Value</p>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AED {((summary?.totalValue || 0) / 1000).toFixed(0)}K
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('/purchase-orders/create')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isDarkMode
              ? 'bg-teal-500 text-white hover:bg-teal-400'
              : 'bg-teal-600 text-white hover:bg-teal-500'
          }`}
        >
          <ShoppingCart size={14} />
          Create Bulk PO
        </button>
      </div>
    </div>
  );
};

export default ReorderAlertsWidget;
