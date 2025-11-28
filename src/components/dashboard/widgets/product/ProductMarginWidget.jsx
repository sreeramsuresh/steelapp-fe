import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Target, Star, HelpCircle, DollarSign, TrendingDown } from 'lucide-react';

// Mock data for margin analysis with quadrant positioning
const generateMockData = () => ({
  products: [
    // Stars (High Volume, High Margin)
    { id: 1, name: 'SS 316 Coil 0.8mm', category: 'Coils', volume: 89.2, margin: 21.2, revenue: 392000, quadrant: 'star' },
    { id: 2, name: 'SS 316L Pipe 2"', category: 'Pipes', volume: 65.6, margin: 24.5, revenue: 245000, quadrant: 'star' },
    { id: 3, name: 'SS 304 HL Sheet 0.8mm', category: 'Sheets', volume: 72.8, margin: 20.1, revenue: 215000, quadrant: 'star' },
    
    // Cash Cows (High Volume, Low Margin)
    { id: 4, name: 'SS 304 2B Sheet 1.0mm', category: 'Sheets', volume: 125.5, margin: 12.5, revenue: 485000, quadrant: 'cashCow' },
    { id: 5, name: 'SS 430 Coil 1.2mm', category: 'Coils', volume: 198.4, margin: 11.2, revenue: 275000, quadrant: 'cashCow' },
    { id: 6, name: 'SS 202 Sheet 1.5mm', category: 'Sheets', volume: 234.5, margin: 10.5, revenue: 165000, quadrant: 'cashCow' },
    
    // Question Marks (Low Volume, High Margin)
    { id: 7, name: 'SS 316 No.4 Sheet 1.2mm', category: 'Sheets', volume: 34.2, margin: 22.8, revenue: 128000, quadrant: 'questionMark' },
    { id: 8, name: 'SS 316L Mirror 0.6mm', category: 'Sheets', volume: 18.5, margin: 28.5, revenue: 85000, quadrant: 'questionMark' },
    
    // Dogs (Low Volume, Low Margin)
    { id: 9, name: 'SS 410 Flat 40x4mm', category: 'Flats', volume: 28.3, margin: 8.5, revenue: 42000, quadrant: 'dog' },
    { id: 10, name: 'SS 409 Tube 30x30mm', category: 'Tubes', volume: 22.1, margin: 9.2, revenue: 38000, quadrant: 'dog' },
  ],
  thresholds: {
    volumeMedian: 60,
    marginMedian: 15,
  },
});

const ProductMarginWidget = ({ data, onNavigate, onProductClick }) => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [thresholds, setThresholds] = useState({ volumeMedian: 60, marginMedian: 15 });
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  useEffect(() => {
    const mockData = generateMockData();
    setProducts(data?.products || mockData.products);
    setThresholds(data?.thresholds || mockData.thresholds);
  }, [data]);

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return `${(amount / 1000).toFixed(0)}K`;
  };

  const getQuadrantInfo = (quadrant) => {
    const info = {
      star: {
        name: 'Stars',
        icon: Star,
        color: 'from-amber-400 to-amber-500',
        bgColor: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50',
        textColor: isDarkMode ? 'text-amber-400' : 'text-amber-600',
        description: 'High volume & margin',
        action: 'Invest & Grow',
      },
      cashCow: {
        name: 'Cash Cows',
        icon: DollarSign,
        color: 'from-green-400 to-green-500',
        bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-50',
        textColor: isDarkMode ? 'text-green-400' : 'text-green-600',
        description: 'High volume, lower margin',
        action: 'Maintain & Harvest',
      },
      questionMark: {
        name: 'Question Marks',
        icon: HelpCircle,
        color: 'from-purple-400 to-purple-500',
        bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50',
        textColor: isDarkMode ? 'text-purple-400' : 'text-purple-600',
        description: 'Low volume, high margin',
        action: 'Invest or Divest',
      },
      dog: {
        name: 'Dogs',
        icon: TrendingDown,
        color: 'from-red-400 to-red-500',
        bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-50',
        textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
        description: 'Low volume & margin',
        action: 'Review & Discontinue',
      },
    };
    return info[quadrant];
  };

  const getQuadrantColor = (quadrant) => {
    const colors = {
      star: '#F59E0B',
      cashCow: '#10B981',
      questionMark: '#8B5CF6',
      dog: '#EF4444',
    };
    return colors[quadrant];
  };

  const quadrantCounts = {
    star: products.filter(p => p.quadrant === 'star').length,
    cashCow: products.filter(p => p.quadrant === 'cashCow').length,
    questionMark: products.filter(p => p.quadrant === 'questionMark').length,
    dog: products.filter(p => p.quadrant === 'dog').length,
  };

  // Calculate positions for scatter plot
  const maxVolume = Math.max(...products.map(p => p.volume));
  const maxMargin = Math.max(...products.map(p => p.margin));
  const maxRevenue = Math.max(...products.map(p => p.revenue));

  const chartWidth = 280;
  const chartHeight = 200;
  const padding = 20;

  const getPosition = (product) => {
    const x = padding + ((product.volume / maxVolume) * (chartWidth - 2 * padding));
    const y = chartHeight - padding - ((product.margin / maxMargin) * (chartHeight - 2 * padding));
    return { x, y };
  };

  const getBubbleSize = (revenue) => {
    const minSize = 6;
    const maxSize = 20;
    return minSize + ((revenue / maxRevenue) * (maxSize - minSize));
  };

  const filteredProducts = selectedQuadrant 
    ? products.filter(p => p.quadrant === selectedQuadrant)
    : products;

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <Target size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Product Portfolio Matrix
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Volume vs Margin analysis
            </p>
          </div>
        </div>
      </div>

      {/* Quadrant Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {['star', 'cashCow', 'questionMark', 'dog'].map((quadrant) => {
          const info = getQuadrantInfo(quadrant);
          const Icon = info.icon;
          const isSelected = selectedQuadrant === quadrant;
          
          return (
            <button
              key={quadrant}
              onClick={() => setSelectedQuadrant(isSelected ? null : quadrant)}
              className={`p-2 rounded-lg border transition-all ${
                isSelected
                  ? `${info.bgColor} border-current ${info.textColor}`
                  : isDarkMode
                    ? 'border-[#37474F] hover:border-[#455A73]'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={14} className={isSelected ? info.textColor : isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <p className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {quadrantCounts[quadrant]}
              </p>
              <p className={`text-[10px] truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {info.name}
              </p>
            </button>
          );
        })}
      </div>

      {/* Scatter Plot */}
      <div className={`relative rounded-lg p-2 ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}>
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          <line
            x1={chartWidth / 2}
            y1={padding}
            x2={chartWidth / 2}
            y2={chartHeight - padding}
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
            strokeDasharray="4"
          />
          <line
            x1={padding}
            y1={chartHeight / 2}
            x2={chartWidth - padding}
            y2={chartHeight / 2}
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
            strokeDasharray="4"
          />
          
          {/* Quadrant labels */}
          <text x={chartWidth * 0.75} y={padding + 15} fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="9" textAnchor="middle">Stars</text>
          <text x={chartWidth * 0.25} y={padding + 15} fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="9" textAnchor="middle">? Marks</text>
          <text x={chartWidth * 0.75} y={chartHeight - padding - 5} fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="9" textAnchor="middle">Cash Cows</text>
          <text x={chartWidth * 0.25} y={chartHeight - padding - 5} fill={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize="9" textAnchor="middle">Dogs</text>
          
          {/* Axis labels */}
          <text x={chartWidth / 2} y={chartHeight - 3} fill={isDarkMode ? '#6B7280' : '#9CA3AF'} fontSize="8" textAnchor="middle">Volume (MT)</text>
          <text x={8} y={chartHeight / 2} fill={isDarkMode ? '#6B7280' : '#9CA3AF'} fontSize="8" textAnchor="middle" transform={`rotate(-90, 8, ${chartHeight / 2})`}>Margin %</text>
          
          {/* Data points */}
          {filteredProducts.map((product) => {
            const { x, y } = getPosition(product);
            const size = getBubbleSize(product.revenue);
            const isHovered = hoveredProduct?.id === product.id;
            
            return (
              <g key={product.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? size * 1.3 : size}
                  fill={getQuadrantColor(product.quadrant)}
                  opacity={isHovered ? 0.9 : 0.7}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredProduct(product)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onClick={() => onProductClick?.(product)}
                />
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={size * 1.5}
                    fill="none"
                    stroke={getQuadrantColor(product.quadrant)}
                    strokeWidth="2"
                    opacity={0.5}
                  />
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredProduct && (
          <div className={`absolute z-10 p-2 rounded-lg shadow-lg text-xs ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`} style={{
            left: getPosition(hoveredProduct).x + 20,
            top: getPosition(hoveredProduct).y - 40,
          }}>
            <p className="font-semibold">{hoveredProduct.name}</p>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Volume: {hoveredProduct.volume.toFixed(1)} MT
            </p>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Margin: {hoveredProduct.margin.toFixed(1)}%
            </p>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Revenue: AED {formatCurrency(hoveredProduct.revenue)}
            </p>
          </div>
        )}
      </div>

      {/* Selected Quadrant Details */}
      {selectedQuadrant && (
        <div className={`mt-3 p-3 rounded-lg ${getQuadrantInfo(selectedQuadrant).bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${getQuadrantInfo(selectedQuadrant).textColor}`}>
              {getQuadrantInfo(selectedQuadrant).name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'
            }`}>
              {getQuadrantInfo(selectedQuadrant).action}
            </span>
          </div>
          <div className="space-y-1">
            {filteredProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between text-xs">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{product.name}</span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {product.margin.toFixed(1)}% | {product.volume.toFixed(1)} MT
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-1">
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Bubble size = Revenue
          </span>
        </div>
        <button
          onClick={() => onNavigate?.('/analytics/products')}
          className={`text-xs font-medium ${
            isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          Full Analysis
        </button>
      </div>
    </div>
  );
};

export default ProductMarginWidget;
