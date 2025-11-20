import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  AlertTriangle,
  CheckCircle,
  Save,
  X,
  Eye,
  RefreshCw,
  Warehouse,
  Move,
  ChevronDown,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { productService } from '../services/dataService';
import { FINISHES } from '../types';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import InventoryList from './InventoryList';
import StockMovement from './StockMovement';
import WarehouseManagement from './WarehouseManagement';
import ProductUpload from './ProductUpload';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { notificationService } from '../services/notificationService';

// Custom components for consistent theming
const Button = ({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '', ...props }) => {
  const { isDarkMode } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const getVariantClasses = () => {
    if (variant === 'primary') {
      return isDarkMode 
        ? `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-600 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-gray-800`
        : `bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 hover:-translate-y-0.5 focus:ring-blue-500 disabled:bg-gray-400 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-white`;
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

const Select = ({ label, options, value, onChange, placeholder = 'Select...', className = '' }) => {
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
  const { isDarkMode } = useTheme();
  
  const getColor = () => {
    switch (stockStatus) {
      case 'low': return 'bg-red-500';
      case 'high': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

const SteelProducts = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  const { data: productsData, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useApiData(
    () => productService.getProducts({ 
      search: searchTerm, 
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      stock_status: stockFilter === 'all' ? undefined : stockFilter,
      limit: 1000,
    }),
    [searchTerm, categoryFilter, stockFilter],
  );
  
  const { execute: createProduct, loading: creatingProduct } = useApi(productService.createProduct);
  const { execute: updateProduct, loading: updatingProduct } = useApi(productService.updateProduct);
  const { execute: deleteProduct } = useApi(productService.deleteProduct);
  
  const products = productsData?.products || [];

  // Build a robust list of finishes: predefined + those present in products
  const allFinishes = useMemo(() => {
    try {
      const set = new Set(FINISHES || []);
      (products || []).forEach((p) => {
        if (p && p.finish && String(p.finish).trim()) set.add(String(p.finish).trim());
      });
      return Array.from(set);
    } catch {
      return FINISHES || [];
    }
  }, [products]);
  
  // Debug products data structure
  console.log('🏗️ Products data structure:', {
    productsData,
    productsArray: products,
    productsLength: products.length,
    sampleProduct: products[0],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'sheet',
    commodity: 'SS',
    grade: '',
    finish: '',
    size: '',
    sizeInch: '',
    od: '',
    length: '',
    weight: '',
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
      standard: '',
    },
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
    { value: 'coil', label: 'Coil' },
  ];

  const grades = [
    'Fe415', 'Fe500', 'Fe550', 'Fe600',
    'IS2062', 'ASTM A36', 'ASTM A572',
    '201', '304', '316', '316L', '310', '321', '347',
    'MS', 'Galvanized',
  ];


  const filteredProducts = products.filter(product => {
    const name = (product?.name ?? '').toString().toLowerCase();
    const grade = (product?.grade ?? '').toString().toLowerCase();
    const category = (product?.category ?? '').toString().toLowerCase();
    const finish = (product?.finish ?? '').toString().toLowerCase();
    const thickness = (product?.thickness ?? '').toString().toLowerCase();
    const needle = (searchTerm ?? '').toString().toLowerCase();

    const matchesSearch = name.includes(needle) ||
                          grade.includes(needle) ||
                          category.includes(needle) ||
                          (!!finish && finish.includes(needle)) ||
                          (!!thickness && thickness.includes(needle));

    const matchesCategory = categoryFilter === 'all' || product?.category === categoryFilter;

    const current = Number(product?.currentStock ?? product?.currentStock ?? 0);
    const min = Number(product?.minStock ?? product?.minStock ?? 0);
    const max = Number(product?.maxStock ?? product?.maxStock ?? 1) || 1;

    const matchesStock = stockFilter === 'all' || 
                         (stockFilter === 'low' && current <= min) ||
                         (stockFilter === 'normal' && current > min && current < max * 0.8) ||
                         (stockFilter === 'high' && current >= max * 0.8);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddProduct = async () => {
    try {
      const isPipeOrTube = /pipe/i.test(newProduct.category || '');
      if (isPipeOrTube) {
        if (!newProduct.sizeInch || !newProduct.od || !newProduct.length) {
          notificationService.error('For Pipe/Tube, Size (inch), OD, and Length are required.');
          return;
        }
      }
      // Convert camelCase to snake_case and handle default values
      const productData = {
        name: newProduct.name,
        category: newProduct.category,
        commodity: newProduct.commodity || 'SS',
        grade: newProduct.grade,
        finish: newProduct.finish,
        size: newProduct.size,
        size_inch: newProduct.sizeInch || undefined,
        od: newProduct.od || undefined,
        length: newProduct.length || undefined,
        thickness: newProduct.thickness,
        weight: newProduct.weight,
        description: newProduct.description,
        current_stock: newProduct.currentStock === '' ? 0 : Number(newProduct.currentStock),
        min_stock: newProduct.minStock === '' ? 10 : Number(newProduct.minStock),
        max_stock: newProduct.maxStock === '' ? 1000 : Number(newProduct.maxStock),
        cost_price: newProduct.costPrice === '' ? 0 : Number(newProduct.costPrice),
        selling_price: newProduct.sellingPrice === '' ? 0 : Number(newProduct.sellingPrice),
        supplier: newProduct.supplier,
        location: newProduct.location,
        specifications: newProduct.specifications,
      };
      await createProduct(productData);
      setNewProduct({
        name: '',
        category: 'sheet',
        commodity: 'SS',
        grade: '',
        finish: '',
        size: '',
        sizeInch: '',
        od: '',
        length: '',
        weight: '',
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
          coating: '', standard: '',
        },
      });
      setShowAddModal(false);
      refetchProducts();
      notificationService.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      notificationService.error('Failed to add product');
    }
  };

  // Auto-compose product name from Commodity, Category, Grade, Finish, Size, Thickness (with 'GR ' prefix on grade)
  useEffect(() => {
    const parts = [];
    if (newProduct.commodity) parts.push(String(newProduct.commodity).trim());
    const catLabel = categories.find(c => c.value === newProduct.category)?.label;
    if (catLabel) parts.push(catLabel);
    if (newProduct.grade) {
      const g = String(newProduct.grade).trim();
      const m = g.match(/^gr\s*(.+)$/i);
      parts.push(m ? `GR${m[1]}` : `GR${g}`);
    }
    if (newProduct.finish) parts.push(String(newProduct.finish).trim());
    const isPipeOrTube = /pipe/i.test(newProduct.category || '');
    if (isPipeOrTube) {
      if (newProduct.sizeInch) parts.push(`${String(newProduct.sizeInch).trim()  }"`);
    } else {
      if (newProduct.size) parts.push(String(newProduct.size).trim());
    }
    if (newProduct.thickness) parts.push(String(newProduct.thickness).trim());
    const composed = parts.join(' ');
    setNewProduct(prev => ({ ...prev, name: composed }));
  }, [newProduct.commodity, newProduct.category, newProduct.grade, newProduct.finish, newProduct.size, newProduct.sizeInch, newProduct.thickness]);

  const handleEditProduct = async () => {
    try {
      console.log('🔄 Starting product edit...', selectedProduct);
      
      // Convert empty strings to appropriate default values and map field names to backend format
      const productData = {
        name: selectedProduct.name,
        category: selectedProduct.category,
        commodity: selectedProduct.commodity || 'SS',
        grade: selectedProduct.grade,
        finish: selectedProduct.finish,
        size: selectedProduct.size,
        size_inch: selectedProduct.sizeInch,
        od: selectedProduct.od,
        length: selectedProduct.length,
        thickness: selectedProduct.thickness || (selectedProduct.specifications && selectedProduct.specifications.thickness) || undefined,
        weight: selectedProduct.weight,
        unit: selectedProduct.unit,
        description: selectedProduct.description,
        current_stock: selectedProduct.currentStock === '' ? 0 : Number(selectedProduct.currentStock),
        min_stock: selectedProduct.minStock === '' ? 0 : Number(selectedProduct.minStock),
        max_stock: selectedProduct.maxStock === '' ? 1000 : Number(selectedProduct.maxStock),
        cost_price: selectedProduct.costPrice === '' ? 0 : Number(selectedProduct.costPrice),
        selling_price: selectedProduct.sellingPrice === '' ? 0 : Number(selectedProduct.sellingPrice),
        supplier: selectedProduct.supplier,
        location: selectedProduct.location,
        specifications: {
          ...(selectedProduct.specifications || {}),
          thickness: selectedProduct.thickness || (selectedProduct.specifications && selectedProduct.specifications.thickness) || '',
        },
      };
      
      console.log('📤 Sending product data:', productData);
      console.log(`🔗 API URL would be: PUT /api/products/${  selectedProduct.id}`);
      
      const result = await updateProduct(selectedProduct.id, productData);
      console.log('✅ Product updated successfully:', result);
      
      console.log('🔄 Starting products refetch...');
      console.log('📊 Current products data before refetch:', productsData);
      
      const freshData = await refetchProducts();
      console.log('📨 Fresh data from refetch:', freshData);
      
      // Check if the updated product is in the fresh data
      const updatedProductInFreshData = freshData?.products?.find(p => p.id === selectedProduct.id);
      console.log('🔎 Updated product in fresh data:', updatedProductInFreshData);
      
      // Small delay to ensure state has updated
      setTimeout(() => {
        console.log('📊 Products data after state update:', productsData);
        console.log('🔍 Current products array after state update:', products);

        // Find the specific product to see if it updated
        const updatedProductInState = products.find(p => p.id === selectedProduct.id);
        console.log('🎯 Updated product in state:', updatedProductInState);
      }, 100);

      notificationService.success('Product updated successfully!');
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('❌ Error updating product:', error);
      notificationService.error(`Failed to update product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = await confirm({
      title: 'Delete Product?',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      refetchProducts();
      notificationService.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      notificationService.error('Failed to delete product');
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
            { value: 'high', label: 'High Stock' },
          ]}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="min-w-32"
        />
        <Button 
          onClick={async () => {
            try {
              await productService.downloadProducts();
            } catch (error) {
              console.error('Error downloading products:', error);
              notificationService.error('Failed to download products');
            }
          }}
          variant="outline"
        >
          <Package size={20} />
          Download Products
        </Button>
        <Button 
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Upload size={20} />
          Upload Products
        </Button>
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
                      {product.fullName || product.name}
                    </h3>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {categories.find(c => c.value === product.category)?.label}
                    </p>
                    <div className="flex gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-md border ${
                        isDarkMode 
                          ? 'bg-teal-900/30 text-teal-300 border-teal-700' 
                          : 'bg-teal-100 text-teal-800 border-teal-200'
                      }`}>
                        {(() => {
                          const g = (product.grade || '').toString().trim();
                          if (!g) return '';
                          const m = g.match(/^gr\s*(.+)$/i);
                          return m ? `GR${m[1]}` : `GR${g}`;
                        })()}
                      </span>
                      {product.finish && (
                        <span className={`px-2 py-1 text-xs rounded-md border ${
                          isDarkMode 
                            ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          {(() => { const f=(product.finish||'').toString().trim(); return f ? (/\bfinish$/i.test(f)? f : `${f} Finish`) : ''; })()}
                        </span>
                      )}
                      {(/pipe/i.test(product.category || '')) ? (
                        <>
                          {product.sizeInch && (
                            <span className={`px-2 py-1 text-xs rounded-md border ${
                              isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              {product.sizeInch}
                            </span>
                          )}
                          {product.od && (
                            <span className={`px-2 py-1 text-xs rounded-md border ${
                              isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              {(() => {
                                const hay = [product.size, product.sizeInch, product.name, product.description]
                                  .filter(Boolean)
                                  .join(' ');
                                const hasDia = /dia\b/i.test(hay) || /[øØ∅φΦ]/.test(hay);
                                const odText = String(product.od || '').replace(/"/g, '').toUpperCase();
                                return `(${odText})${hasDia ? 'DIA' : ''}`;
                              })()}
                            </span>
                          )}
                          {product.length && (
                            <span className={`px-2 py-1 text-xs rounded-md border ${
                              isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              L: {product.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-md border ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300 border-gray-600' 
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {product.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowSpecModal(true);
                      }}
                      className={`p-1.5 rounded transition-colors bg-transparent ${
                        isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="View Specifications"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        console.log('✏️ Edit button clicked for product:', product);
                        console.log('🔍 Product fields available:', Object.keys(product));
                        console.log('💰 Cost price field values:', {
                          costPrice: product.costPrice,
                          cost_price: product.costPrice,
                          selling_price: product.sellingPrice,
                          sellingPrice: product.sellingPrice,
                        });
                        
                        // Convert snake_case to camelCase for form and normalize strings
                        const formattedProduct = {
                          ...product,
                          sizeInch: product.sizeInch,
                          od: product.od,
                          length: product.length,
                          finish: product.finish ? String(product.finish).trim() : '',
                          currentStock: product.currentStock,
                          minStock: product.minStock,
                          maxStock: product.maxStock,
                          costPrice: product.costPrice,
                          sellingPrice: product.sellingPrice,
                        };
                        
                        console.log('🔄 Formatted product for form:', formattedProduct);
                        setSelectedProduct(formattedProduct);
                        setShowEditModal(true);
                        console.log('📝 Edit modal should now be visible');
                      }}
                      className={`p-1.5 rounded transition-colors bg-transparent ${
                        isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'hover:bg-gray-100 text-teal-600'
                      }`}
                      title="Edit Product"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className={`p-1.5 rounded transition-colors bg-transparent ${
                        isDarkMode ? 'text-red-400 hover:text-red-300' : 'hover:bg-gray-100 text-red-600'
                      }`}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
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
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Qty:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.currentStock}
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
                        ? (isDarkMode ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200')
                        : stockStatus === 'high' 
                          ? (isDarkMode ? 'bg-green-900/30 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200')
                          : (isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200')
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
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>د.إ{product.costPrice || '0.00'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selling Price</p>
                    <p className="text-sm font-semibold text-green-600">د.إ{product.sellingPrice || '0.00'}</p>
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

  const renderInventoryManagement = () => (
    <InventoryList />
  );

  const renderWarehouseManagement = () => (
    <WarehouseManagement />
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
              🏗️ Stainless Steel Products
            </h1>
          </div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your steel product catalog, inventory, and pricing
          </p>
        </div>

        {/* Tabs - Pill style */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'catalog'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <Package size={18} />
              Product Catalog
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'inventory'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <Warehouse size={18} />
              Inventory Management
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'movements'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <Move size={18} />
              Stock Movements
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'warehouses'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <Warehouse size={18} />
              Warehouses
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'catalog' && renderCatalog()}
          {activeTab === 'inventory' && renderInventoryManagement()}
          {activeTab === 'movements' && <StockMovement />}
          {activeTab === 'warehouses' && renderWarehouseManagement()}
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
                  className={`p-2 rounded transition-colors bg-transparent ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Commodity"
                      value={newProduct.commodity}
                      onChange={(e) => setNewProduct({...newProduct, commodity: e.target.value})}
                      placeholder="e.g., SS"
                    />
                    <Input
                      label="Product Name (auto-generated)"
                      value={newProduct.name}
                      readOnly
                      placeholder="Auto-generated"
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
                    <Select
                      label="Finish"
                      options={allFinishes.map(finish => ({ value: finish, label: `${finish} Finish` }))}
                      value={(newProduct.finish || '').trim()}
                      onChange={(e) => setNewProduct({ ...newProduct, finish: e.target.value.trim() })}
                    />
                    {(/pipe/i.test(newProduct.category || '')) ? (
                      <>
                        <Input
                          label={'Size (inch \" )'}
                          value={newProduct.sizeInch}
                          onChange={(e) => setNewProduct({ ...newProduct, sizeInch: e.target.value })}
                          placeholder={'e.g., 2\"'}
                        />
                        <Input
                          label={'OD (\")'}
                          value={newProduct.od}
                          onChange={(e) => setNewProduct({ ...newProduct, od: e.target.value })}
                          placeholder={'e.g., 2\"'}
                        />
                        <Input
                          label={'Length (\")'}
                          value={newProduct.length}
                          onChange={(e) => setNewProduct({ ...newProduct, length: e.target.value })}
                          placeholder={'e.g., 96\"'}
                        />
                      </>
                    ) : (
                      <Input
                        label="Size (MM)"
                        value={newProduct.size}
                        onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                        placeholder="e.g., 50x50x6"
                      />
                    )}
                    <Input
                      label="Thickness"
                      value={newProduct.thickness}
                      onChange={(e) => setNewProduct({...newProduct, thickness: e.target.value})}
                      placeholder="e.g., 1.2mm"
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
                        specifications: {...newProduct.specifications, length: e.target.value},
                      })}
                      placeholder="Enter length"
                    />
                    <Input
                      label="Width"
                      value={newProduct.specifications.width}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, width: e.target.value},
                      })}
                      placeholder="Enter width"
                    />
                    <Input
                      label="Thickness"
                      value={newProduct.specifications.thickness}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, thickness: e.target.value},
                      })}
                      placeholder="Enter thickness"
                    />
                    <Input
                      label="Diameter"
                      value={newProduct.specifications.diameter}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, diameter: e.target.value},
                      })}
                      placeholder="Enter diameter"
                    />
                    <Input
                      label="Tensile Strength"
                      value={newProduct.specifications.tensileStrength}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, tensileStrength: e.target.value},
                      })}
                      placeholder="Enter tensile strength"
                    />
                    <Input
                      label="Yield Strength"
                      value={newProduct.specifications.yieldStrength}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, yieldStrength: e.target.value},
                      })}
                      placeholder="Enter yield strength"
                    />
                    <Input
                      label="Carbon Content"
                      value={newProduct.specifications.carbonContent}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, carbonContent: e.target.value},
                      })}
                      placeholder="Enter carbon content"
                    />
                    <Input
                      label="Coating"
                      value={newProduct.specifications.coating}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        specifications: {...newProduct.specifications, coating: e.target.value},
                      })}
                      placeholder="Enter coating type"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Standard"
                        value={newProduct.specifications.standard}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          specifications: {...newProduct.specifications, standard: e.target.value},
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
                  className={`p-2 rounded transition-colors bg-transparent ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Product Name (auto-generated)"
                    value={selectedProduct.name}
                    readOnly
                  />
                  <Select
                    label="Category"
                    options={categories}
                    value={selectedProduct.category}
                    onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                  />
                  <Input
                    label="Commodity"
                    value={selectedProduct.commodity || 'SS'}
                    onChange={(e) => setSelectedProduct({...selectedProduct, commodity: e.target.value})}
                  />
                  <Input
                    label="Grade"
                    value={selectedProduct.grade}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, grade: e.target.value })}
                  />
                  <Select
                    label="Finish"
                    options={allFinishes.map(finish => ({ value: finish, label: `${finish} Finish` }))}
                    value={(selectedProduct.finish || '').trim()}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, finish: e.target.value.trim() })}
                  />
                  {(/pipe/i.test(selectedProduct.category || '')) ? (
                    <>
                      <Input
                        label={'Size (inch \" )'}
                        value={selectedProduct.sizeInch || ''}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, sizeInch: e.target.value })}
                      />
                      <Input
                        label={'OD (\")'}
                        value={selectedProduct.od || ''}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, od: e.target.value })}
                      />
                      <Input
                        label={'Length (\")'}
                        value={selectedProduct.length || ''}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, length: e.target.value })}
                      />
                    </>
                  ) : (
                    <Input
                      label="Size (MM)"
                      value={selectedProduct.size}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, size: e.target.value })}
                    />
                  )}
                  <Input
                    label="Thickness"
                    value={selectedProduct.thickness || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, thickness: e.target.value})}
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
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? '' : Number(e.target.value) || '';
                        console.log('💰 Cost Price changed from', selectedProduct.costPrice, 'to', newValue);
                        setSelectedProduct({...selectedProduct, costPrice: newValue});
                      }}
                      className="pl-12"
                    />
                    <span className={`absolute left-3 top-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>د.إ</span>
                  </div>
                  <div className="relative">
                    <Input
                      label="Selling Price"
                      type="number"
                      value={selectedProduct.sellingPrice || ''}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? '' : Number(e.target.value) || '';
                        console.log('💵 Selling Price changed from', selectedProduct.sellingPrice, 'to', newValue);
                        setSelectedProduct({...selectedProduct, sellingPrice: newValue});
                      }}
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
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors bg-transparent ${
                    isDarkMode ? 'text-white hover:text-gray-300' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <Button 
                  onClick={handleEditProduct}
                  disabled={updatingProduct}
                >
                  {updatingProduct ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {updatingProduct ? 'Saving...' : 'Save Changes'}
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
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
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
                        {(() => {
                          const g = (selectedProduct.grade || '').toString().trim();
                          if (!g) return '';
                          const m = g.match(/^gr\s*(.+)$/i);
                          return m ? `GR${m[1]}` : `GR${g}`;
                        })()}
                      </span>
                    </div>
                    {selectedProduct.finish && (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Finish:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {(() => { const f=(selectedProduct.finish||'').toString().trim(); return f ? (/\bfinish$/i.test(f)? f : `${f} Finish`) : ''; })()}
                        </span>
                      </div>
                    )}
                    {(/pipe/i.test(selectedProduct.category || '')) ? (
                      <>
                        {(selectedProduct.sizeInch || selectedProduct.sizeInch) && (
                          <div className="flex justify-between py-2">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size (in):</span>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedProduct.sizeInch || selectedProduct.sizeInch}
                            </span>
                          </div>
                        )}
                        {(selectedProduct.od || selectedProduct.OD) && (
                          <div className="flex justify-between py-2">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>OD:</span>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {(() => {
                                const hay = [selectedProduct.size, selectedProduct.sizeInch, selectedProduct.name, selectedProduct.description]
                                  .filter(Boolean)
                                  .join(' ');
                                const hasDia = /dia\b/i.test(hay) || /[øØ∅φΦ]/.test(hay);
                                const odText = String(selectedProduct.od || selectedProduct.OD || '').replace(/"/g, '').toUpperCase();
                                return `(${odText})${hasDia ? 'DIA' : ''}`;
                              })()}
                            </span>
                          </div>
                        )}
                        {(selectedProduct.length) && (
                          <div className="flex justify-between py-2">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Length ("):</span>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedProduct.length}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between py-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size (MM):</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedProduct.size}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Qty:</span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedProduct.currentStock}
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

        {/* Product Upload Modal */}
        <ProductUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            refetchProducts();
            setShowUploadModal(false);
          }}
        />

        <ConfirmDialog
          open={dialogState.open}
          title={dialogState.title}
          message={dialogState.message}
          variant={dialogState.variant}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default SteelProducts;
