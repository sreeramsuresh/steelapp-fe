import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { TrendingUp, Package, ChevronRight, BarChart3 } from 'lucide-react';

// Mock data for steel trading products
const generateMockData = () => ({
  byRevenue: [
    { id: 1, name: 'SS 304 2B Sheet 1.0mm', category: 'Sheets', revenue: 485000, margin: 18.5, volume: 125.5, percentOfTotal: 22.4 },
    { id: 2, name: 'SS 316 Coil 0.8mm', category: 'Coils', revenue: 392000, margin: 21.2, volume: 89.2, percentOfTotal: 18.1 },
    { id: 3, name: 'SS 304 BA Sheet 0.5mm', category: 'Sheets', revenue: 318000, margin: 16.8, volume: 156.3, percentOfTotal: 14.7 },
    { id: 4, name: 'SS 430 Coil 1.2mm', category: 'Coils', revenue: 275000, margin: 14.2, volume: 198.4, percentOfTotal: 12.7 },
    { id: 5, name: 'SS 316L Pipe 2"', category: 'Pipes', revenue: 245000, margin: 24.5, volume: 45.6, percentOfTotal: 11.3 },
    { id: 6, name: 'SS 304 Tube 25x25mm', category: 'Tubes', revenue: 198000, margin: 19.8, volume: 78.2, percentOfTotal: 9.1 },
    { id: 7, name: 'SS 202 Sheet 1.5mm', category: 'Sheets', revenue: 165000, margin: 12.5, volume: 234.5, percentOfTotal: 7.6 },
    { id: 8, name: 'SS 304 Flat 50x5mm', category: 'Flats', revenue: 142000, margin: 17.3, volume: 112.3, percentOfTotal: 6.5 },
    { id: 9, name: 'SS 316 No.4 Sheet 1.2mm', category: 'Sheets', revenue: 128000, margin: 22.8, volume: 34.2, percentOfTotal: 5.9 },
    { id: 10, name: 'SS 304 HL Sheet 0.8mm', category: 'Sheets', revenue: 115000, margin: 20.1, volume: 42.8, percentOfTotal: 5.3 },
  ],
  byMargin: [
    { id: 5, name: 'SS 316L Pipe 2"', category: 'Pipes', revenue: 245000, margin: 24.5, volume: 45.6, percentOfTotal: 11.3 },
    { id: 9, name: 'SS 316 No.4 Sheet 1.2mm', category: 'Sheets', revenue: 128000, margin: 22.8, volume: 34.2, percentOfTotal: 5.9 },
    { id: 2, name: 'SS 316 Coil 0.8mm', category: 'Coils', revenue: 392000, margin: 21.2, volume: 89.2, percentOfTotal: 18.1 },
    { id: 10, name: 'SS 304 HL Sheet 0.8mm', category: 'Sheets', revenue: 115000, margin: 20.1, volume: 42.8, percentOfTotal: 5.3 },
    { id: 6, name: 'SS 304 Tube 25x25mm', category: 'Tubes', revenue: 198000, margin: 19.8, volume: 78.2, percentOfTotal: 9.1 },
    { id: 1, name: 'SS 304 2B Sheet 1.0mm', category: 'Sheets', revenue: 485000, margin: 18.5, volume: 125.5, percentOfTotal: 22.4 },
    { id: 8, name: 'SS 304 Flat 50x5mm', category: 'Flats', revenue: 142000, margin: 17.3, volume: 112.3, percentOfTotal: 6.5 },
    { id: 3, name: 'SS 304 BA Sheet 0.5mm', category: 'Sheets', revenue: 318000, margin: 16.8, volume: 156.3, percentOfTotal: 14.7 },
    { id: 4, name: 'SS 430 Coil 1.2mm', category: 'Coils', revenue: 275000, margin: 14.2, volume: 198.4, percentOfTotal: 12.7 },
    { id: 7, name: 'SS 202 Sheet 1.5mm', category: 'Sheets', revenue: 165000, margin: 12.5, volume: 234.5, percentOfTotal: 7.6 },
  ],
  byVolume: [
    { id: 7, name: 'SS 202 Sheet 1.5mm', category: 'Sheets', revenue: 165000, margin: 12.5, volume: 234.5, percentOfTotal: 20.1 },
    { id: 4, name: 'SS 430 Coil 1.2mm', category: 'Coils', revenue: 275000, margin: 14.2, volume: 198.4, percentOfTotal: 17.0 },
    { id: 3, name: 'SS 304 BA Sheet 0.5mm', category: 'Sheets', revenue: 318000, margin: 16.8, volume: 156.3, percentOfTotal: 13.4 },
    { id: 1, name: 'SS 304 2B Sheet 1.0mm', category: 'Sheets', revenue: 485000, margin: 18.5, volume: 125.5, percentOfTotal: 10.8 },
    { id: 8, name: 'SS 304 Flat 50x5mm', category: 'Flats', revenue: 142000, margin: 17.3, volume: 112.3, percentOfTotal: 9.6 },
    { id: 2, name: 'SS 316 Coil 0.8mm', category: 'Coils', revenue: 392000, margin: 21.2, volume: 89.2, percentOfTotal: 7.6 },
    { id: 6, name: 'SS 304 Tube 25x25mm', category: 'Tubes', revenue: 198000, margin: 19.8, volume: 78.2, percentOfTotal: 6.7 },
    { id: 5, name: 'SS 316L Pipe 2"', category: 'Pipes', revenue: 245000, margin: 24.5, volume: 45.6, percentOfTotal: 3.9 },
    { id: 10, name: 'SS 304 HL Sheet 0.8mm', category: 'Sheets', revenue: 115000, margin: 20.1, volume: 42.8, percentOfTotal: 3.7 },
    { id: 9, name: 'SS 316 No.4 Sheet 1.2mm', category: 'Sheets', revenue: 128000, margin: 22.8, volume: 34.2, percentOfTotal: 2.9 },
  ],
});

const TopProductsWidget = ({ data, onNavigate, onProductClick }) => {
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState('revenue'); // 'revenue', 'margin', 'volume'
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Use provided data or fall back to mock data
    const mockData = generateMockData();
    const dataSource = data || mockData;
    
    switch (viewMode) {
      case 'margin':
        setProducts(dataSource.byMargin || []);
        break;
      case 'volume':
        setProducts(dataSource.byVolume || []);
        break;
      default:
        setProducts(dataSource.byRevenue || []);
    }
  }, [data, viewMode]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatVolume = (volume) => {
    return `${volume.toFixed(1)} MT`;
  };

  const getMaxValue = () => {
    if (products.length === 0) return 1;
    switch (viewMode) {
      case 'margin':
        return Math.max(...products.map(p => p.margin));
      case 'volume':
        return Math.max(...products.map(p => p.volume));
      default:
        return Math.max(...products.map(p => p.revenue));
    }
  };

  const getValue = (product) => {
    switch (viewMode) {
      case 'margin':
        return product.margin;
      case 'volume':
        return product.volume;
      default:
        return product.revenue;
    }
  };

  const getDisplayValue = (product) => {
    switch (viewMode) {
      case 'margin':
        return `${product.margin.toFixed(1)}%`;
      case 'volume':
        return formatVolume(product.volume);
      default:
        return formatCurrency(product.revenue);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Sheets: 'bg-blue-500',
      Coils: 'bg-emerald-500',
      Pipes: 'bg-purple-500',
      Tubes: 'bg-amber-500',
      Flats: 'bg-rose-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const maxValue = getMaxValue();

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Products
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              By {viewMode === 'revenue' ? 'Revenue' : viewMode === 'margin' ? 'Margin' : 'Volume'}
            </p>
          </div>
        </div>
        
        {/* Toggle Buttons */}
        <div className={`flex rounded-lg p-0.5 ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}>
          {['revenue', 'margin', 'volume'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-teal-500 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {products.slice(0, 10).map((product, index) => (
          <div
            key={product.id}
            className={`group cursor-pointer rounded-lg p-2 transition-all ${
              isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'
            }`}
            onClick={() => onProductClick?.(product)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-xs font-medium w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {index + 1}
                </span>
                <span className={`w-2 h-2 rounded-full ${getCategoryColor(product.category)}`} />
                <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getDisplayValue(product)}
                </span>
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    viewMode === 'margin'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : viewMode === 'volume'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                        : 'bg-gradient-to-r from-teal-500 to-teal-400'
                  }`}
                  style={{ width: `${(getValue(product) / maxValue) * 100}%` }}
                />
              </div>
              <span className={`text-xs w-12 text-right ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {product.percentOfTotal.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t flex justify-between items-center ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {['Sheets', 'Coils', 'Pipes'].map((category) => (
            <div key={category} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`} />
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {category}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate?.('/products')}
          className={`text-xs font-medium flex items-center gap-1 transition-colors ${
            isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View All
          <BarChart3 size={12} />
        </button>
      </div>
    </div>
  );
};

export default TopProductsWidget;
