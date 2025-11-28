import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { LineChart, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Mock data for price trends
const generateMockData = () => ({
  products: [
    {
      id: 1,
      name: 'SS 304 2B Sheet',
      grade: 'SS 304',
      currentPrice: 285,
      marketPrice: 290,
      spread: -5,
      spreadPercent: -1.7,
      change6m: 8.5,
      trend: [
        { month: 'Jun', price: 262, market: 268 },
        { month: 'Jul', price: 268, market: 272 },
        { month: 'Aug', price: 275, market: 278 },
        { month: 'Sep', price: 278, market: 282 },
        { month: 'Oct', price: 282, market: 286 },
        { month: 'Nov', price: 285, market: 290 },
      ],
    },
    {
      id: 2,
      name: 'SS 316 Coil',
      grade: 'SS 316',
      currentPrice: 425,
      marketPrice: 420,
      spread: 5,
      spreadPercent: 1.2,
      change6m: 12.3,
      trend: [
        { month: 'Jun', price: 378, market: 375 },
        { month: 'Jul', price: 390, market: 385 },
        { month: 'Aug', price: 402, market: 398 },
        { month: 'Sep', price: 410, market: 408 },
        { month: 'Oct', price: 418, market: 415 },
        { month: 'Nov', price: 425, market: 420 },
      ],
    },
    {
      id: 3,
      name: 'SS 430 Sheet',
      grade: 'SS 430',
      currentPrice: 195,
      marketPrice: 198,
      spread: -3,
      spreadPercent: -1.5,
      change6m: -4.2,
      trend: [
        { month: 'Jun', price: 204, market: 208 },
        { month: 'Jul', price: 202, market: 205 },
        { month: 'Aug', price: 200, market: 202 },
        { month: 'Sep', price: 198, market: 200 },
        { month: 'Oct', price: 196, market: 199 },
        { month: 'Nov', price: 195, market: 198 },
      ],
    },
    {
      id: 4,
      name: 'SS 316L Pipe',
      grade: 'SS 316L',
      currentPrice: 485,
      marketPrice: 478,
      spread: 7,
      spreadPercent: 1.5,
      change6m: 15.8,
      trend: [
        { month: 'Jun', price: 419, market: 412 },
        { month: 'Jul', price: 438, market: 430 },
        { month: 'Aug', price: 455, market: 448 },
        { month: 'Sep', price: 468, market: 460 },
        { month: 'Oct', price: 478, market: 470 },
        { month: 'Nov', price: 485, market: 478 },
      ],
    },
  ],
});

const MiniLineChart = ({ data, width = 120, height = 40, isDarkMode }) => {
  if (!data || data.length === 0) return null;

  const prices = data.map(d => d.price);
  const markets = data.map(d => d.market);
  const allValues = [...prices, ...markets];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const getY = (value) => height - ((value - min) / range) * (height - 8) - 4;
  const getX = (index) => (index / (data.length - 1)) * (width - 10) + 5;

  const pricePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.price)}`).join(' ');
  const marketPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.market)}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Market price line (dashed) */}
      <path
        d={marketPath}
        fill="none"
        stroke={isDarkMode ? '#6B7280' : '#9CA3AF'}
        strokeWidth="1"
        strokeDasharray="3,2"
      />
      {/* Your price line (solid) */}
      <path
        d={pricePath}
        fill="none"
        stroke="#14B8A6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot */}
      <circle
        cx={getX(data.length - 1)}
        cy={getY(data[data.length - 1].price)}
        r="3"
        fill="#14B8A6"
      />
    </svg>
  );
};

const PriceTrendWidget = ({ data, onNavigate, onProductClick }) => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const mockData = generateMockData();
    const productData = data?.products || mockData.products;
    setProducts(productData);
    if (productData.length > 0 && !selectedProduct) {
      setSelectedProduct(productData[0]);
    }
  }, [data]);

  const getSpreadColor = (spread) => {
    if (spread > 0) return isDarkMode ? 'text-green-400' : 'text-green-600';
    if (spread < 0) return isDarkMode ? 'text-red-400' : 'text-red-600';
    return isDarkMode ? 'text-gray-400' : 'text-gray-500';
  };

  const getSpreadBg = (spread) => {
    if (spread > 0) return isDarkMode ? 'bg-green-500/10' : 'bg-green-50';
    if (spread < 0) return isDarkMode ? 'bg-red-500/10' : 'bg-red-50';
    return isDarkMode ? 'bg-gray-500/10' : 'bg-gray-50';
  };

  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <LineChart size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Price Trends
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              6-month price history
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-teal-500 rounded" />
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your Price</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 border-t border-dashed border-gray-400" />
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Market</span>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedProduct?.id === product.id
                ? isDarkMode ? 'bg-[#2E3B4E] ring-1 ring-teal-500/50' : 'bg-teal-50 ring-1 ring-teal-200'
                : isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setSelectedProduct(product);
              onProductClick?.(product);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.grade}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your: </span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      AED {product.currentPrice}
                    </span>
                  </div>
                  <div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mkt: </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      AED {product.marketPrice}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Sparkline */}
                <MiniLineChart 
                  data={product.trend} 
                  width={80} 
                  height={30}
                  isDarkMode={isDarkMode}
                />
                
                {/* Spread Indicator */}
                <div className={`text-right min-w-[60px]`}>
                  <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${getSpreadBg(product.spread)} ${getSpreadColor(product.spread)}`}>
                    {product.spread > 0 ? '+' : ''}{product.spread}
                    <span className="text-[10px]">AED</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 flex items-center justify-end gap-0.5 ${
                    product.change6m >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {product.change6m >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(product.change6m).toFixed(1)}% 6m
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Chart for Selected Product */}
      {selectedProduct && (
        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedProduct.name} - 6 Month Trend
            </p>
            <div className={`flex items-center gap-1 text-xs ${
              selectedProduct.change6m >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {selectedProduct.change6m >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {selectedProduct.change6m >= 0 ? '+' : ''}{selectedProduct.change6m.toFixed(1)}%
            </div>
          </div>
          
          {/* Larger chart */}
          <div className="h-24">
            <MiniLineChart 
              data={selectedProduct.trend} 
              width={280} 
              height={80}
              isDarkMode={isDarkMode}
            />
          </div>
          
          {/* Month labels */}
          <div className="flex justify-between mt-1 px-1">
            {selectedProduct.trend.map((d, i) => (
              <span key={i} className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {d.month}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className={`mt-4 pt-3 border-t grid grid-cols-3 gap-2 ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <div className="text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Above Market</p>
          <p className="text-sm font-semibold text-green-500">
            {products.filter(p => p.spread > 0).length}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Below Market</p>
          <p className="text-sm font-semibold text-red-500">
            {products.filter(p => p.spread < 0).length}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Spread</p>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {(products.reduce((sum, p) => sum + p.spreadPercent, 0) / products.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* View All Link */}
      <div className="mt-3 text-center">
        <button
          onClick={() => onNavigate?.('/products/pricing')}
          className={`text-xs font-medium ${
            isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View Price Management
        </button>
      </div>
    </div>
  );
};

export default PriceTrendWidget;
