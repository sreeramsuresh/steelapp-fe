import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Layers,
  Info,
  Save,
  X,
  Filter,
  BarChart3,
  Package2,
  Ruler,
  Weight,
  Calendar,
  Eye,
  RefreshCw,
  Move,
  Warehouse,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { productService } from '../services/productService';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import StockMovement from './StockMovement';
import InventoryList from './InventoryList';

// Custom components for consistent theming
const Button = ({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '', ...props }) => {
  const { isDarkMode } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else if (variant === 'secondary') {
      return `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-${isDarkMode ? 'gray-500' : 'gray-400'} disabled:${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else { // outline
      return `border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, className = '', type = 'text', ...props }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const Select = ({ label, options, value, onChange, placeholder = "Select...", className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
    </div>
  );
};

const Textarea = ({ label, error, className = '', ...props }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const StockProgressBar = ({ value, stockStatus }) => {
  const getColor = () => {
    switch (stockStatus) {
      case 'low': return 'bg-red-500';
      case 'high': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

const SteelProducts = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  const { data: productsData, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useApiData(
    () => productService.getProducts({ 
      search: searchTerm, 
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      stock_status: stockFilter === 'all' ? undefined : stockFilter
    }),
    [searchTerm, categoryFilter, stockFilter]
  );
  
  const { execute: createProduct, loading: creatingProduct } = useApi(productService.createProduct);
  const { execute: updateProduct, loading: updatingProduct } = useApi(productService.updateProduct);
  const { execute: deleteProduct } = useApi(productService.deleteProduct);
  const { execute: updateProductPrice } = useApi(productService.updateProductPrice);
  
  const products = productsData?.products || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'sheet',
    grade: '',
    size: '',
    weight: '',
    unit: 'kg',
    description: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    costPrice: '',
    sellingPrice: '',
    supplier: '',
    location: '',
    specifications: {
      length: '',
      width: '',
      thickness: '',
      diameter: '',
      tensileStrength: '',
      yieldStrength: '',
      carbonContent: '',
      coating: '',
      standard: ''
    }
  });

  const [priceUpdate, setPriceUpdate] = useState({
    newPrice: '',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { value: 'sheet', label: 'Sheet' },
    { value: 'square_tube', label: 'Square Tube' },
    { value: 'rectangular_tube', label: 'Rectangular Tube' },
    { value: 'pol_pipe', label: 'Pol Pipe' },
    { value: 'round_bar', label: 'Round Bar' },
    { value: 'flat_bar', label: 'Flat Bar' },
    { value: 'angle_bar', label: 'Angle Bar' },
    { value: 'square_bar', label: 'Square Bar' },
    { value: 'coil', label: 'Coil' }
  ];

  const grades = [
    'Fe415', 'Fe500', 'Fe550', 'Fe600',
    'IS2062', 'ASTM A36', 'ASTM A572',
    '201', '304', '316', '316L', '310', '321', '347',
    'MS', 'Galvanized'
  ];


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.currentStock <= product.minStock) ||
                        (stockFilter === 'normal' && product.currentStock > product.minStock && product.currentStock < product.maxStock * 0.8) ||
                        (stockFilter === 'high' && product.currentStock >= product.maxStock * 0.8);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddProduct = async () => {
    try {
      // Convert empty strings to appropriate default values
      const productData = {
        ...newProduct,
        currentStock: newProduct.currentStock === '' ? 0 : Number(newProduct.currentStock),
        minStock: newProduct.minStock === '' ? 10 : Number(newProduct.minStock),
        maxStock: newProduct.maxStock === '' ? 1000 : Number(newProduct.maxStock),
        costPrice: newProduct.costPrice === '' ? 0 : Number(newProduct.costPrice),
        sellingPrice: newProduct.sellingPrice === '' ? 0 : Number(newProduct.sellingPrice)
      };
      await createProduct(productData);
      setNewProduct({
        name: '',
        category: 'sheet',
        grade: '',
        size: '',
        weight: '',
        unit: 'kg',
        description: '',
        currentStock: '',
        minStock: '',
        maxStock: '',
        costPrice: '',
        sellingPrice: '',
        supplier: '',
        location: '',
        specifications: {
          length: '', width: '', thickness: '', diameter: '',
          tensileStrength: '', yieldStrength: '', carbonContent: '',
          coating: '', standard: ''
        }
      });
      setShowAddModal(false);
      refetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async () => {
    try {
      // Convert empty strings to appropriate default values
      const productData = {
        ...selectedProduct,
        currentStock: selectedProduct.currentStock === '' ? 0 : Number(selectedProduct.currentStock),
        minStock: selectedProduct.minStock === '' ? 0 : Number(selectedProduct.minStock),
        maxStock: selectedProduct.maxStock === '' ? 1000 : Number(selectedProduct.maxStock),
        costPrice: selectedProduct.costPrice === '' ? 0 : Number(selectedProduct.costPrice)
      };
      await updateProduct(selectedProduct.id, productData);
      setShowEditModal(false);
      setSelectedProduct(null);
      refetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        refetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handlePriceUpdate = async () => {
    try {
      await updateProductPrice(selectedProduct.id, {
        newPrice: priceUpdate.newPrice,
        reason: priceUpdate.reason,
        effectiveDate: priceUpdate.effectiveDate
      });
      setPriceUpdate({ newPrice: '', reason: '', effectiveDate: new Date().toISOString().split('T')[0] });
      setShowPriceModal(false);
      setSelectedProduct(null);
      refetchProducts();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const getStockStatus = (product) => {
    if (product.currentStock <= product.minStock) return 'low';
    if (product.currentStock >= product.maxStock * 0.8) return 'high';
    return 'normal';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low': return '#dc2626';
      case 'high': return '#059669';
      default: return '#2563eb';
    }
  };

  const calculateInventoryStats = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => getStockStatus(p) === 'low').length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
    
    return { totalProducts, lowStockProducts, totalValue, totalStock };
  };

  const stats = calculateInventoryStats();

  const renderCatalog = () => (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-80">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <Select
          label="Category"
          options={[{ value: 'all', label: 'All Categories' }, ...categories]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-w-40"
        />
        <Select
          label="Stock"
          options={[
            { value: 'all', label: 'All Stock' },
            { value: 'low', label: 'Low Stock' },
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High Stock' }
          ]}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="min-w-32"
        />
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const stockStatus = getStockStatus(product);
          return (
            <div key={product.id} className={`rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              isDarkMode 
                ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-500' 
                : 'bg-white border-[#E0E0E0] hover:border-teal-500'
            }`}>
              <div className="p-6">
                {/* Product Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </h3>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {categories.find(c => c.value === product.category)?.label}
                    </p>
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-md border border-teal-200">
                        {product.grade}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-md border ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 border-gray-600' 
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}>
                        {product.size}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowSpecModal(true);
                      }}
                      className={`p-1.5 rounded hover:bg-opacity-20 transition-colors ${
                        isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                      }`}
                      title="View Specifications"
                    >
                      <Eye size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setPriceUpdate({ ...priceUpdate, newPrice: product.sellingPrice });
                        setShowPriceModal(true);
                      }}
                      className={`p-1.5 rounded hover:bg-opacity-20 transition-colors ${
                        isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                      }`}
                      title="Update Price"
                    >
                      <Tag size={16} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                      className={`p-1.5 rounded hover:bg-opacity-20 transition-colors ${
                        isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                      }`}
                      title="Edit Product"
                    >
                      <Edit size={16} className="text-teal-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className={`p-1.5 rounded hover:bg-opacity-20 transition-colors ${
                        isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                      }`}
                      title="Delete Product"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {product.description}
                </p>

                {/* Product Stats */}
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Weight:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.weight} {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Supplier:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.supplier}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Location:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.location}
                    </span>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock Level</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium border ${
                      stockStatus === 'low' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : stockStatus === 'high' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {stockStatus === 'low' ? <AlertTriangle size={12} /> :
                       stockStatus === 'high' ? <Package size={12} /> :
                       <CheckCircle size={12} />}
                      {stockStatus.toUpperCase()}
                    </span>
                  </div>
                  <h4 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {product.currentStock}
                  </h4>
                  <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Min: {product.minStock} | Max: {product.maxStock}
                  </p>
                  <StockProgressBar 
                    value={Math.min((product.currentStock / product.maxStock) * 100, 100)}
                    stockStatus={stockStatus}
                  />
                </div>

                {/* Price Info */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cost Price</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>د.إ{product.costPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selling Price</p>
                    <p className="text-sm font-semibold text-green-600">د.إ{product.sellingPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Margin</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.costPrice > 0 ? 
                        Math.round(((product.sellingPrice - product.costPrice) / product.costPrice) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStockMovements = () => (
    <StockMovement />
  );

  const renderInventoryManagement = () => (
    <InventoryList />
  );

  const renderInventoryDashboard = () => (
    <div className="inventory-dashboard">
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-header">
            <Package2 size={24} />
            <h3>Total Products</h3>
          </div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-subtitle">In catalog</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <AlertTriangle size={24} />
            <h3>Low Stock Items</h3>
          </div>
          <div className="stat-value">{stats.lowStockProducts}</div>
          <div className="stat-subtitle">Need reorder</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <DollarSign size={24} />
            <h3>Inventory Value</h3>
          </div>
          <div className="stat-value">د.إ{stats.totalValue.toLocaleString()}</div>
          <div className="stat-subtitle">Total cost value</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <Layers size={24} />
            <h3>Total Stock</h3>
          </div>
          <div className="stat-value">{stats.totalStock}</div>
          <div className="stat-subtitle">Units in stock</div>
        </div>
      </div>

      <div className="inventory-table">
        <h3>Stock Levels Overview</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Stock</th>
                <th>Max Stock</th>
                <th>Status</th>
                <th>Value</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const stockStatus = getStockStatus(product);
                const stockValue = product.currentStock * product.costPrice;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <strong>{product.name}</strong>
                        <span className="product-grade">{product.grade} - {product.size}</span>
                      </div>
                    </td>
                    <td>{categories.find(c => c.value === product.category)?.label}</td>
                    <td className="stock-cell">
                      <span className="stock-number">{product.currentStock}</span>
                      <span className="stock-unit">{product.unit}</span>
                    </td>
                    <td>{product.minStock}</td>
                    <td>{product.maxStock}</td>
                    <td>
                      <span className={`status-badge status-${stockStatus}`}>
                        {stockStatus === 'low' && <AlertTriangle size={14} />}
                        {stockStatus === 'normal' && <CheckCircle size={14} />}
                        {stockStatus === 'high' && <Package size={14} />}
                        {stockStatus.toUpperCase()}
                      </span>
                    </td>
                    <td>د.إ{stockValue.toLocaleString()}</td>
                    <td>{format(new Date(product.lastUpdated), 'MMM dd, yyyy')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="p-4">
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Price Management
        </h2>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Manage product pricing and track price history
        </p>
      </div>

      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Product</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Category</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Cost Price</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Selling Price</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Margin</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Last Updated</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-[#37474F]' : 'divide-gray-200'}`}>
              {products.map(product => {
                const margin = product.costPrice > 0 ? 
                  ((product.sellingPrice - product.costPrice) / product.costPrice) * 100 : 0;
                return (
                  <tr key={product.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.grade} - {product.size}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {categories.find(c => c.value === product.category)?.label}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      د.إ{product.costPrice}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      د.إ{product.sellingPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        margin < 10 
                          ? 'bg-red-100 text-red-800' 
                          : margin > 30 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {Math.round(margin)}%
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {product.lastUpdated ? format(new Date(product.lastUpdated), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setPriceUpdate({ ...priceUpdate, newPrice: product.sellingPrice });
                          setShowPriceModal(true);
                        }}
                        className={`p-1 rounded hover:bg-opacity-20 transition-colors ${
                          isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                        }`}
                        title="Update Price"
                      >
                        <RefreshCw size={16} className="text-teal-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Package size={28} className="text-teal-600" />
            <h1 className={`text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🏗️ Steel Products
            </h1>
          </div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your steel product catalog, inventory, and pricing
          </p>
        </div>

        {/* Tabs */}
        <div className={`border-b mb-6 ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'catalog'
                  ? 'border-teal-500 text-teal-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Package size={20} />
              Product Catalog
            </button>
            <button
              onClick={() => setActiveTab('stock-movements')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stock-movements'
                  ? 'border-teal-500 text-teal-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Move size={20} />
              Stock Movements
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'inventory'
                  ? 'border-teal-500 text-teal-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Warehouse size={20} />
              Inventory Management
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pricing'
                  ? 'border-teal-500 text-teal-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <DollarSign size={20} />
              Price Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'catalog' && renderCatalog()}
          {activeTab === 'stock-movements' && renderStockMovements()}
          {activeTab === 'inventory' && renderInventoryManagement()}
          {activeTab === 'pricing' && renderPricing()}
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className={`flex justify-between items-center p-6 border-b ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add New Product
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                    isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Product Name *"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Enter product name"
                    />
                    <Select
                      label="Category"
                      options={categories}
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    />
                    <Select
                      label="Grade"
                      options={grades.map(grade => ({ value: grade, label: grade }))}
                      value={newProduct.grade}
                      onChange={(e) => setNewProduct({...newProduct, grade: e.target.value})}
                    />
                    <Input
                      label="Size"
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                      placeholder="e.g., 12mm, 50x50x6"
                    />
                    <Input
                      label="Weight"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                      placeholder="Enter weight"
                    />
                    <Select
                      label="Unit"
                      options={[
                        { value: 'kg', label: 'kg' },
                        { value: 'kg/m', label: 'kg/m' },
                        { value: 'kg/sheet', label: 'kg/sheet' },
                        { value: 'tonnes', label: 'tonnes' },
                        { value: 'pieces', label: 'pieces' }
                      ]}
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    />
                    <div className="sm:col-span-2">
                      <Textarea
                        label="Description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory Information */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Inventory Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Current Stock"
                      type="number"
                      value={newProduct.currentStock || ''}
                      onChange={(e) => setNewProduct({...newProduct, currentStock: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                      placeholder="Enter current stock"
                    />
                    <Input
                      label="Minimum Stock"
                      type="number"
                      value={newProduct.minStock || ''}
                      onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                      placeholder="Enter minimum stock level"
                    />
                    <Input
                      label="Maximum Stock"
                      type="number"
                      value={newProduct.maxStock || ''}
                      onChange={(e) => setNewProduct({...newProduct, maxStock: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                      placeholder="Enter maximum stock level"
                    />
                  </div>
                </div>

                {/* Pricing Information */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Pricing Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        label="Cost Price"
                        type="number"
                        value={newProduct.costPrice || ''}
                        onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                        placeholder="Enter cost price"
                        className="pl-12"
                      />
                      <span className={`absolute left-3 top-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>د.إ</span>
                    </div>
                    <div className="relative">
                      <Input
                        label="Selling Price"
                        type="number"
                        value={newProduct.sellingPrice || ''}
                        onChange={(e) => setNewProduct({...newProduct, sellingPrice: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                        placeholder="Enter selling price"
                        className="pl-12"
                      />
                      <span className={`absolute left-3 top-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>د.إ</span>
                    </div>
                  </div>
                </div>

                {/* Supplier & Location */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Supplier & Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Supplier"
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                      placeholder="Enter supplier name"
                    />
                    <Input
                      label="Storage Location"
                      value={newProduct.location}
                      onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                      placeholder="Enter storage location"
                    />
                  </div>
                </div>

                {/* Product Specifications */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Product Specifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Length"
                      value={newProduct.specifications.length}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, length: e.target.value}
                      })}
                      placeholder="Enter length"
                    />
                    <Input
                      label="Width"
                      value={newProduct.specifications.width}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, width: e.target.value}
                      })}
                      placeholder="Enter width"
                    />
                    <Input
                      label="Thickness"
                      value={newProduct.specifications.thickness}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, thickness: e.target.value}
                      })}
                      placeholder="Enter thickness"
                    />
                    <Input
                      label="Diameter"
                      value={newProduct.specifications.diameter}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, diameter: e.target.value}
                      })}
                      placeholder="Enter diameter"
                    />
                    <Input
                      label="Tensile Strength"
                      value={newProduct.specifications.tensileStrength}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, tensileStrength: e.target.value}
                      })}
                      placeholder="Enter tensile strength"
                    />
                    <Input
                      label="Yield Strength"
                      value={newProduct.specifications.yieldStrength}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, yieldStrength: e.target.value}
                      })}
                      placeholder="Enter yield strength"
                    />
                    <Input
                      label="Carbon Content"
                      value={newProduct.specifications.carbonContent}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, carbonContent: e.target.value}
                      })}
                      placeholder="Enter carbon content"
                    />
                    <Input
                      label="Coating"
                      value={newProduct.specifications.coating}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, coating: e.target.value}
                      })}
                      placeholder="Enter coating type"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Standard"
                        value={newProduct.specifications.standard}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          specifications: {...newProduct.specifications, standard: e.target.value}
                        })}
                        placeholder="Enter applicable standard"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-end gap-3 p-6 border-t ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  disabled={!newProduct.name}
                >
                  <Save size={16} />
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className={`flex justify-between items-center p-6 border-b ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Edit Product
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                    isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Product Name"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                  />
                  <Select
                    label="Category"
                    options={categories}
                    value={selectedProduct.category}
                    onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                  />
                  <Input
                    label="Grade"
                    value={selectedProduct.grade}
                    onChange={(e) => setSelectedProduct({...selectedProduct, grade: e.target.value})}
                  />
                  <Input
                    label="Size"
                    value={selectedProduct.size}
                    onChange={(e) => setSelectedProduct({...selectedProduct, size: e.target.value})}
                  />
                  <Input
                    label="Current Stock"
                    type="number"
                    value={selectedProduct.currentStock || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, currentStock: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                  />
                  <Input
                    label="Minimum Stock"
                    type="number"
                    value={selectedProduct.minStock || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, minStock: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                  />
                  <Input
                    label="Maximum Stock"
                    type="number"
                    value={selectedProduct.maxStock || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, maxStock: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                  />
                  <div className="relative">
                    <Input
                      label="Cost Price"
                      type="number"
                      value={selectedProduct.costPrice || ''}
                      onChange={(e) => setSelectedProduct({...selectedProduct, costPrice: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                      className="pl-12"
                    />
                    <span className={`absolute left-3 top-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>د.إ</span>
                  </div>
                  <Input
                    label="Supplier"
                    value={selectedProduct.supplier}
                    onChange={(e) => setSelectedProduct({...selectedProduct, supplier: e.target.value})}
                  />
                  <Input
                    label="Storage Location"
                    value={selectedProduct.location}
                    onChange={(e) => setSelectedProduct({...selectedProduct, location: e.target.value})}
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Description"
                      value={selectedProduct.description}
                      onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-end gap-3 p-6 border-t ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditProduct}>
                  <Save size={16} />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Price Update Modal */}
        {showPriceModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl max-w-md w-full ${
              isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className={`flex justify-between items-center p-6 border-b ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Update Price - {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowPriceModal(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                    isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className={`flex justify-between items-center p-4 rounded-lg mb-4 ${
                  isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Price:</span>
                  <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    د.إ{selectedProduct.sellingPrice}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="New Price"
                      type="number"
                      value={priceUpdate.newPrice || ''}
                      onChange={(e) => setPriceUpdate({...priceUpdate, newPrice: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                      placeholder="Enter new price"
                      className="pl-12"
                    />
                    <span className={`absolute left-3 top-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>د.إ</span>
                  </div>
                  <Input
                    label="Reason for Update"
                    value={priceUpdate.reason}
                    onChange={(e) => setPriceUpdate({...priceUpdate, reason: e.target.value})}
                    placeholder="Enter reason for price change"
                  />
                  <Input
                    label="Effective Date"
                    type="date"
                    value={priceUpdate.effectiveDate}
                    onChange={(e) => setPriceUpdate({...priceUpdate, effectiveDate: e.target.value})}
                  />
                  
                  {selectedProduct.priceHistory && selectedProduct.priceHistory.length > 0 && (
                    <div>
                      <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Price History
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedProduct.priceHistory.slice(0, 5).map((entry, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {format(new Date(entry.date), 'MMM dd, yyyy')}
                              </span>
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                د.إ{entry.price}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {entry.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-end gap-3 p-6 border-t ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <Button variant="secondary" onClick={() => setShowPriceModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePriceUpdate}>
                  <Save size={16} />
                  Update Price
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Modal */}
        {showSpecModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className={`flex justify-between items-center p-6 border-b ${
                isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Product Specifications - {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowSpecModal(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                    isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Product Name:</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProduct.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category:</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {categories.find(c => c.value === selectedProduct.category)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Grade:</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProduct.grade}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProduct.size}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weight:</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProduct.weight} {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProduct.specifications?.length && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Length:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.length}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.width && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Width:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.width}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.thickness && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Thickness:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.thickness}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.diameter && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Diameter:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.diameter}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.tensileStrength && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tensile Strength:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.tensileStrength}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.yieldStrength && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yield Strength:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.yieldStrength}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.carbonContent && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Carbon Content:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.carbonContent}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.coating && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coating:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.coating}
                        </span>
                      </div>
                    )}
                    {selectedProduct.specifications?.standard && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Standard:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.specifications.standard}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Description</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedProduct.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SteelProducts;