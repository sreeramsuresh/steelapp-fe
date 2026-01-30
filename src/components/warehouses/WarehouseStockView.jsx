/**
 * WarehouseStockView Component
 * Displays stock levels for a specific warehouse
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Mock data - would come from API
const mockStockData = [
  {
    id: 1,
    productName: 'SS304 2B Sheet 2.0mm',
    productSku: 'SS304-2B-2.0',
    productType: 'Sheet',
    grade: '304',
    quantityOnHand: 500,
    quantityReserved: 50,
    quantityAvailable: 450,
    unit: 'KG',
    minimumStock: 100,
    isLowStock: false,
  },
  {
    id: 2,
    productName: 'SS316L BA Sheet 1.5mm',
    productSku: 'SS316L-BA-1.5',
    productType: 'Sheet',
    grade: '316L',
    quantityOnHand: 200,
    quantityReserved: 0,
    quantityAvailable: 200,
    unit: 'KG',
    minimumStock: 150,
    isLowStock: false,
  },
  {
    id: 3,
    productName: 'MS Round Bar 20mm',
    productSku: 'MS-RB-20',
    productType: 'Long',
    grade: 'MS',
    quantityOnHand: 1000,
    quantityReserved: 100,
    quantityAvailable: 900,
    unit: 'KG',
    minimumStock: 200,
    isLowStock: false,
  },
  {
    id: 4,
    productName: 'GI Sheet 1.2mm',
    productSku: 'GI-SH-1.2',
    productType: 'Sheet',
    grade: 'GI',
    quantityOnHand: 50,
    quantityReserved: 0,
    quantityAvailable: 50,
    unit: 'KG',
    minimumStock: 100,
    isLowStock: true,
  },
  {
    id: 5,
    productName: 'SS304 Pipe 2"',
    productSku: 'SS304-PIPE-2',
    productType: 'Pipe',
    grade: '304',
    quantityOnHand: 150,
    quantityReserved: 25,
    quantityAvailable: 125,
    unit: 'PCS',
    minimumStock: 50,
    isLowStock: false,
  },
  {
    id: 6,
    productName: 'SS316 Coil 0.8mm',
    productSku: 'SS316-COIL-0.8',
    productType: 'Coil',
    grade: '316',
    quantityOnHand: 30,
    quantityReserved: 0,
    quantityAvailable: 30,
    unit: 'MT',
    minimumStock: 50,
    isLowStock: true,
  },
];

const WarehouseStockView = ({ warehouseId, warehouseName: _warehouseName }) => {
  const { isDarkMode } = useTheme();

  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterProductType, setFilterProductType] = useState('');

  useEffect(() => {
    // Simulate API call
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStockItems(mockStockData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }, 500);
  }, [warehouseId]);

  // Filter items
  const filteredItems = stockItems.filter((item) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !item.productName.toLowerCase().includes(term) &&
        !item.productSku.toLowerCase().includes(term)
      ) {
        return false;
      }
    }
    if (filterLowStock && !item.isLowStock) {
      return false;
    }
    if (filterProductType && item.productType !== filterProductType) {
      return false;
    }
    return true;
  });

  // Get unique product types for filter
  const productTypes = [...new Set(stockItems.map((item) => item.productType))];

  // Summary stats
  const lowStockCount = filteredItems.filter((item) => item.isLowStock).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div
        className={`rounded-lg border p-4 ${isDarkMode ? 'bg-[#1E2328] border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-[#121418] border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>

          {/* Product Type Filter */}
          <select
            value={filterProductType}
            onChange={(e) => setFilterProductType(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-[#121418] border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
          >
            <option value="">All Types</option>
            {productTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Low Stock Filter */}
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              filterLowStock
                ? 'bg-red-600 text-white border-red-600'
                : isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p
          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Showing {filteredItems.length} of {stockItems.length} products
        </p>
        <Link
          to={`/inventory?warehouse_id=${warehouseId}`}
          className="text-sm text-teal-500 hover:underline"
        >
          View in Inventory →
        </Link>
      </div>

      {/* Stock Table */}
      <div
        className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#1E2328] border-gray-700' : 'bg-white border-gray-200'}`}
      >
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw
              className={`w-8 h-8 mx-auto animate-spin ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <Package
              className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
            />
            <h3
              className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              No products found
            </h3>
            <p
              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {searchTerm || filterLowStock || filterProductType
                ? 'Try adjusting your filters'
                : 'No stock in this warehouse'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Product
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Type
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    On Hand
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Reserved
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Available
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Min Stock
                  </th>
                  <th
                    className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
              >
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${
                      item.isLowStock
                        ? isDarkMode
                          ? 'bg-red-900/10'
                          : 'bg-red-50'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p
                          className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {item.productName}
                        </p>
                        <p
                          className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                        >
                          {item.productSku}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.productType}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.quantityOnHand.toLocaleString()} {item.unit}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                      {item.quantityReserved.toLocaleString()} {item.unit}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                    >
                      {item.quantityAvailable.toLocaleString()} {item.unit}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {item.minimumStock.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.isLowStock ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            isDarkMode
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            isDarkMode
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/stock-movements?product_id=${item.id}&warehouse_id=${warehouseId}`}
                        className="text-teal-500 hover:underline text-sm"
                      >
                        Movements
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseStockView;
