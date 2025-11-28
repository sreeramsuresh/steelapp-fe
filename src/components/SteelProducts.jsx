import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ChevronDown,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { productService } from '../services/dataService';
import { FINISHES } from '../types';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
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
      case 'out_of_stock': return 'bg-red-900'; // Dark red for out of stock
      case 'low': return 'bg-red-500';
      case 'high': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  // For out of stock, show a thin bar to indicate empty state
  const displayValue = stockStatus === 'out_of_stock' ? 3 : Math.min(value, 100);

  return (
    <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
        style={{ width: `${displayValue}%` }}
      />
    </div>
  );
};

// Accordion component for Zoho-style drawer
const AccordionSection = ({ title, isOpen, onToggle, children, isEmpty = false }) => {
  const { isDarkMode } = useTheme();

  // Don't render if section is empty
  if (isEmpty) return null;

  return (
    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 hover:bg-opacity-50 transition-colors ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
      >
        <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        ) : (
          <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        )}
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

// Row component for label-value pairs
const SpecRow = ({ label, value, badge, className = '' }) => {
  const { isDarkMode } = useTheme();

  if (!value && value !== 0) return null;

  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </span>
        {badge}
      </div>
    </div>
  );
};

const SteelProducts = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-based tab state for persistence across refreshes
  const activeTab = searchParams.get('tab') || 'catalog';
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    }, { replace: true });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showSpeedButtons, setShowSpeedButtons] = useState(true);
  
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
    origin: 'UAE',  // Country of origin - default UAE
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

  // Origin options for dropdown
  const originOptions = [
    { value: 'UAE', label: 'UAE' },
    { value: 'India', label: 'India' },
    { value: 'China', label: 'China' },
    { value: 'Taiwan', label: 'Taiwan' },
    { value: 'Korea', label: 'Korea' },
    { value: 'Japan', label: 'Japan' },
    { value: 'Malaysia', label: 'Malaysia' },
    { value: 'Indonesia', label: 'Indonesia' },
    { value: 'Vietnam', label: 'Vietnam' },
    { value: 'Thailand', label: 'Thailand' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Italy', label: 'Italy' },
    { value: 'Spain', label: 'Spain' },
    { value: 'USA', label: 'USA' },
    { value: 'UK', label: 'UK' },
    { value: 'Belgium', label: 'Belgium' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'Turkey', label: 'Turkey' },
  ];


  // Comprehensive SS Trading Product Categories
  const categories = [
    // Flat Products
    { value: 'sheet', label: 'Sheet', group: 'flat', icon: '📄' },
    { value: 'plate', label: 'Plate', group: 'flat', icon: '📋' },
    { value: 'coil', label: 'Coil', group: 'flat', icon: '🔄' },
    // Tubes (Hollow Sections)
    { value: 'square_tube', label: 'Square Tube', group: 'tube', icon: '⬜' },
    { value: 'rectangular_tube', label: 'Rectangular Tube', group: 'tube', icon: '▭' },
    { value: 'round_tube', label: 'Round Tube', group: 'tube', icon: '⭕' },
    { value: 'tube', label: 'Tube (General)', group: 'tube', icon: '🔲' },
    // Pipes
    { value: 'seamless_pipe', label: 'Seamless Pipe', group: 'pipe', icon: '🔵' },
    { value: 'erw_pipe', label: 'ERW Pipe', group: 'pipe', icon: '🔴' },
    { value: 'pol_pipe', label: 'Polished Pipe', group: 'pipe', icon: '✨' },
    { value: 'pipe', label: 'Pipe (General)', group: 'pipe', icon: '⚫' },
    // Bars
    { value: 'round_bar', label: 'Round Bar', group: 'bar', icon: '●' },
    { value: 'flat_bar', label: 'Flat Bar', group: 'bar', icon: '▬' },
    { value: 'square_bar', label: 'Square Bar', group: 'bar', icon: '■' },
    { value: 'hex_bar', label: 'Hex Bar', group: 'bar', icon: '⬡' },
    { value: 'angle_bar', label: 'Angle Bar', group: 'bar', icon: '∟' },
    { value: 'bar', label: 'Bar (General)', group: 'bar', icon: '▪' },
    // Fittings & Others
    { value: 'fittings', label: 'Fittings', group: 'fittings', icon: '🔧' },
    { value: 'flange', label: 'Flange', group: 'fittings', icon: '⚙️' },
    { value: 'fasteners', label: 'Fasteners', group: 'fittings', icon: '🔩' },
    { value: 'wire', label: 'Wire', group: 'other', icon: '〰️' },
  ];

  // Category group definitions (static structure)
  const categoryGroupDefs = [
    { id: 'flat', label: 'Flat Products', icon: '📄', categories: ['sheet', 'plate', 'coil'] },
    { id: 'tube', label: 'Tubes', icon: '🔲', categories: ['square_tube', 'rectangular_tube', 'round_tube', 'tube'] },
    { id: 'pipe', label: 'Pipes', icon: '⚫', categories: ['seamless_pipe', 'erw_pipe', 'pol_pipe', 'pipe'] },
    { id: 'bar', label: 'Bars', icon: '▬', categories: ['round_bar', 'flat_bar', 'square_bar', 'hex_bar', 'angle_bar', 'bar'] },
    { id: 'fittings', label: 'Fittings', icon: '🔧', categories: ['fittings', 'flange', 'fasteners'] },
    { id: 'wire', label: 'Wire & Other', icon: '〰️', categories: ['wire'] },
  ];

  // Dynamic category groups - only show groups that have matching products
  const categoryGroups = useMemo(() => {
    const dynamicGroups = categoryGroupDefs.map(group => {
      const count = products.filter(p => {
        const productCategory = (p?.category || '').toLowerCase();
        return group.categories.some(cat => productCategory === cat.toLowerCase());
      }).length;
      return { ...group, count };
    }).filter(group => group.count > 0); // Only show groups with products

    // Get categories that don't fit any group
    const allGroupedCategories = categoryGroupDefs.flatMap(g => g.categories.map(cat => cat.toLowerCase()));
    const otherProducts = products.filter(p => {
      const productCategory = (p?.category || '').toLowerCase();
      if (!productCategory) return false;
      return !allGroupedCategories.includes(productCategory);
    });

    if (otherProducts.length > 0) {
      // Extract unique "other" categories
      const otherCategories = [...new Set(otherProducts.map(p => p.category).filter(Boolean))];
      dynamicGroups.push({ id: 'other', label: 'Other', icon: '📋', categories: otherCategories, count: otherProducts.length });
    }

    return [{ id: 'all', label: 'All', icon: '📦', count: products.length }, ...dynamicGroups];
  }, [products]);

  // Active category group for speed buttons
  const [activeCategoryGroup, setActiveCategoryGroup] = useState('all');

  // Comprehensive SS Trading Grades
  const grades = [
    // Austenitic Stainless Steel (most common)
    '201', '202', '301', '304', '304L', '304H',
    '316', '316L', '316Ti', '317', '317L',
    '310', '310S', '321', '321H', '347', '347H',
    // Ferritic Stainless Steel
    '409', '410', '430', '434', '436', '439', '444',
    // Duplex Stainless Steel
    '2205', '2507', '2304',
    // Martensitic
    '410', '420', '440A', '440B', '440C',
    // Carbon/Mild Steel
    'MS', 'Galvanized', 'GI',
    // Standards
    'IS2062', 'ASTM A36', 'ASTM A572',
    'Fe415', 'Fe500', 'Fe550', 'Fe600',
  ];

  // Grade group definitions (static structure)
  const gradeGroupDefs = [
    { id: '304', label: '304 Series', grades: ['304', '304L', '304H'] },
    { id: '316', label: '316 Series', grades: ['316', '316L', '316Ti'] },
    { id: '200', label: '200 Series', grades: ['201', '202'] },
    { id: 'duplex', label: 'Duplex', grades: ['2205', '2507', '2304'] },
    { id: 'ms', label: 'MS/GI', grades: ['MS', 'Galvanized', 'GI'] },
    { id: 'ferritic', label: 'Ferritic', grades: ['409', '410', '430', '434', '436', '439', '444'] },
  ];

  // Dynamic grade groups - only show groups that have matching products
  const gradeGroups = useMemo(() => {
    const dynamicGroups = gradeGroupDefs.map(group => {
      const count = products.filter(p => {
        const productGrade = (p?.grade || '').toLowerCase();
        return group.grades.some(g => productGrade.includes(g.toLowerCase()));
      }).length;
      return { ...group, count };
    }).filter(group => group.count > 0); // Only show groups with products

    // Get grades that don't fit any group
    const allGroupedGrades = gradeGroupDefs.flatMap(g => g.grades.map(grade => grade.toLowerCase()));
    const otherProducts = products.filter(p => {
      const productGrade = (p?.grade || '').toLowerCase();
      if (!productGrade) return false;
      return !allGroupedGrades.some(g => productGrade.includes(g));
    });

    if (otherProducts.length > 0) {
      // Extract unique "other" grades
      const otherGrades = [...new Set(otherProducts.map(p => p.grade).filter(Boolean))];
      dynamicGroups.push({ id: 'other', label: 'Other', grades: otherGrades, count: otherProducts.length });
    }

    return [{ id: 'all', label: 'All Grades', count: products.length }, ...dynamicGroups];
  }, [products]);

  const [activeGradeGroup, setActiveGradeGroup] = useState('all');


  const filteredProducts = products.filter(product => {
    const name = (product?.displayName ?? product?.display_name ?? product?.fullName ?? product?.full_name ?? product?.name ?? '').toString().toLowerCase();
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

    // Match by individual category OR by category group
    const activeGroup = categoryGroups.find(g => g.id === activeCategoryGroup);
    const matchesCategoryGroup = activeCategoryGroup === 'all' ||
      (activeGroup?.categories?.some(cat => product?.category?.toLowerCase() === cat.toLowerCase()));
    const matchesCategory = (categoryFilter === 'all' || product?.category === categoryFilter) && matchesCategoryGroup;

    const current = Number(product?.currentStock ?? product?.current_stock ?? 0);
    const min = Number(product?.minStock ?? product?.min_stock ?? 0);
    const max = Number(product?.maxStock ?? product?.max_stock ?? 0);

    // Calculate stock status for filtering (must match getStockStatus logic)
    const effectiveMin = min > 0 ? min : 5;
    let productStockStatus = 'normal';
    if (current <= 0) productStockStatus = 'out_of_stock';
    else if (current <= effectiveMin) productStockStatus = 'low';
    else if (max > 0 && current >= max * 0.8) productStockStatus = 'high';

    const matchesStock = stockFilter === 'all' ||
                         (stockFilter === 'low' && (productStockStatus === 'low' || productStockStatus === 'out_of_stock')) ||
                         (stockFilter === 'normal' && productStockStatus === 'normal') ||
                         (stockFilter === 'high' && productStockStatus === 'high');

    // Match by grade group
    const activeGrade = gradeGroups.find(g => g.id === activeGradeGroup);
    const matchesGradeGroup = activeGradeGroup === 'all' || 
      (activeGrade?.grades?.some(g => grade.includes(g.toLowerCase())));

    return matchesSearch && matchesCategory && matchesStock && matchesGradeGroup;
  });

  const handleAddProduct = async () => {
    try {
      const isPipeOrTube = /pipe|tube/i.test(newProduct.category || '');
      if (isPipeOrTube) {
        if (!newProduct.sizeInch && !newProduct.od && !newProduct.size) {
          notificationService.error('For Pipe/Tube, Size (inch), OD, and Length are required.');
          return;
        }
      }
      // API Gateway auto-converts camelCase → snake_case, so send camelCase
      const productData = {
        name: newProduct.name,
        category: newProduct.category,
        commodity: newProduct.commodity || 'SS',
        grade: newProduct.grade,
        finish: newProduct.finish,
        size: newProduct.size,
        sizeInch: newProduct.sizeInch || undefined,  // API Gateway converts to size_inch
        od: newProduct.od || undefined,
        length: newProduct.length || undefined,
        thickness: newProduct.thickness,
        weight: newProduct.weight,
        description: newProduct.description,
        currentStock: newProduct.currentStock === '' ? 0 : Number(newProduct.currentStock),  // API Gateway converts to current_stock
        minStock: newProduct.minStock === '' ? 10 : Number(newProduct.minStock),  // API Gateway converts to min_stock
        maxStock: newProduct.maxStock === '' ? 1000 : Number(newProduct.maxStock),  // API Gateway converts to max_stock
        costPrice: newProduct.costPrice === '' ? 0 : Number(newProduct.costPrice),  // API Gateway converts to cost_price
        sellingPrice: newProduct.sellingPrice === '' ? 0 : Number(newProduct.sellingPrice),  // API Gateway converts to selling_price
        supplier: newProduct.supplier,
        location: newProduct.location,
        origin: newProduct.origin || 'UAE',  // Country of origin
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
        origin: 'UAE',  // Reset to default
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

  // Auto-compose product name matching database trigger pattern:
  // {commodity}-{grade}{grade_variant}-{category}-{finish}-{dimensions}
  // Uses HYPHEN delimiter (not space) and NO 'GR' prefix on grade
  useEffect(() => {
    const parts = [];
    // Commodity (uppercase)
    if (newProduct.commodity) parts.push(String(newProduct.commodity).trim().toUpperCase());
    // Grade + GradeVariant (no GR prefix - e.g., "304", "316L", "304L")
    if (newProduct.grade) {
      const g = String(newProduct.grade).trim();
      // Strip any existing GR prefix if user accidentally added it
      let fullGrade = g.replace(/^gr\s*/i, '');
      // Append grade variant if present (e.g., "L" in "304L")
      if (newProduct.gradeVariant) {
        fullGrade += String(newProduct.gradeVariant).trim();
      }
      parts.push(fullGrade);
    }
    // Category (InitCap)
    const catLabel = categories.find(c => c.value === newProduct.category)?.label;
    if (catLabel) parts.push(catLabel);
    // Finish (uppercase)
    if (newProduct.finish) parts.push(String(newProduct.finish).trim().toUpperCase());
    // Dimensions (varies by category)
    const isPipeOrTube = /pipe|tube/i.test(newProduct.category || '');
    if (isPipeOrTube) {
      // For pipes/tubes: size (inch), OD, length
      const dimParts = [];
      if (newProduct.sizeInch) dimParts.push(`${String(newProduct.sizeInch).trim()}"`);
      if (newProduct.od) dimParts.push(`OD${String(newProduct.od).trim()}`);
      if (newProduct.length) dimParts.push(`L${String(newProduct.length).trim()}`);
      if (dimParts.length > 0) parts.push(dimParts.join('x'));
    } else {
      // For sheets/bars/etc: size and thickness
      if (newProduct.size) parts.push(String(newProduct.size).trim());
    }
    if (newProduct.thickness) parts.push(`${String(newProduct.thickness).trim()}mm`);

    // Join with hyphens (matching database trigger pattern)
    const composed = parts.filter(p => p).join('-');
    setNewProduct(prev => ({ ...prev, name: composed }));
  }, [newProduct.commodity, newProduct.category, newProduct.grade, newProduct.gradeVariant, newProduct.finish, newProduct.size, newProduct.sizeInch, newProduct.od, newProduct.length, newProduct.thickness]);

  // Auto-regenerate displayName and fullName when editing product details
  // Matches database trigger pattern: {commodity}-{grade}{grade_variant}-{category}-{finish}-{dimensions}
  useEffect(() => {
    if (!selectedProduct) return;

    // For existing products, only regenerate if explicitly requested via regenerateName flag
    // For new products (no id), always auto-generate
    if (selectedProduct.id && !selectedProduct.regenerateName) return;

    const parts = [];
    // Commodity (uppercase)
    if (selectedProduct.commodity) parts.push(String(selectedProduct.commodity).trim().toUpperCase());
    // Grade + GradeVariant (no GR prefix - e.g., "304", "316L", "304L")
    if (selectedProduct.grade) {
      const g = String(selectedProduct.grade).trim();
      let fullGrade = g.replace(/^gr\s*/i, '');
      // Append grade variant if present (e.g., "L" in "304L")
      if (selectedProduct.gradeVariant) {
        fullGrade += String(selectedProduct.gradeVariant).trim();
      }
      parts.push(fullGrade);
    }
    // Category (InitCap)
    const catLabel = categories.find(c => c.value === selectedProduct.category)?.label;
    if (catLabel) parts.push(catLabel);
    // Finish (uppercase)
    if (selectedProduct.finish) parts.push(String(selectedProduct.finish).trim().toUpperCase());

    // Dimensions (varies by category)
    const isPipeOrTube = /pipe|tube/i.test(selectedProduct.category || '');
    if (isPipeOrTube) {
      // For pipes/tubes: size (inch), OD, length
      const dimParts = [];
      if (selectedProduct.sizeInch) dimParts.push(`${String(selectedProduct.sizeInch).trim()}"`);
      if (selectedProduct.od) dimParts.push(`OD${String(selectedProduct.od).trim()}`);
      if (selectedProduct.length) dimParts.push(`L${String(selectedProduct.length).trim()}`);
      if (dimParts.length > 0) parts.push(dimParts.join('x'));
    } else {
      // For sheets/bars/etc: size
      if (selectedProduct.size) parts.push(String(selectedProduct.size).trim());
    }
    if (selectedProduct.thickness) parts.push(`${String(selectedProduct.thickness).trim()}mm`);

    // displayName uses hyphen delimiter (no origin)
    const displayName = parts.filter(p => p).join('-');

    // fullName = displayName + origin (matching unique_name in database)
    const fullNameParts = [...parts.filter(p => p)];
    if (selectedProduct.origin) fullNameParts.push(String(selectedProduct.origin).trim().toUpperCase());
    const fullName = fullNameParts.join('-');

    // Only update if the generated names are different from current ones
    if (selectedProduct.displayName !== displayName || selectedProduct.fullName !== fullName) {
      setSelectedProduct(prev => ({
        ...prev,
        displayName,
        display_name: displayName,
        fullName,
        full_name: fullName,
        name: displayName, // Update name field as well
        regenerateName: false, // Reset the flag after regeneration
      }));
    }
  }, [
    selectedProduct?.commodity,
    selectedProduct?.category,
    selectedProduct?.grade,
    selectedProduct?.gradeVariant,
    selectedProduct?.finish,
    selectedProduct?.size,
    selectedProduct?.sizeInch,
    selectedProduct?.od,
    selectedProduct?.length,
    selectedProduct?.thickness,
    selectedProduct?.origin,
    selectedProduct?.regenerateName,
    selectedProduct?.displayName,
    selectedProduct?.fullName,
  ]);

  const handleEditProduct = async () => {
    try {
      console.log('🔄 Starting product edit...', selectedProduct);

      // API Gateway auto-converts camelCase → snake_case, so send camelCase
      // Convert empty strings to appropriate default values
      const productData = {
        name: selectedProduct.displayName || selectedProduct.name, // Use auto-generated displayName
        displayName: selectedProduct.displayName, // Include displayName
        fullName: selectedProduct.fullName, // Include fullName
        category: selectedProduct.category,
        commodity: selectedProduct.commodity || 'SS',
        grade: selectedProduct.grade,
        finish: selectedProduct.finish,
        size: selectedProduct.size,
        sizeInch: selectedProduct.sizeInch || '',  // API Gateway converts to size_inch
        od: selectedProduct.od || '',
        length: selectedProduct.length || '',
        thickness: selectedProduct.thickness || (selectedProduct.specifications && selectedProduct.specifications.thickness) || undefined,
        weight: selectedProduct.weight,
        unit: selectedProduct.unit,
        description: selectedProduct.description,
        currentStock: selectedProduct.currentStock === '' ? 0 : Number(selectedProduct.currentStock),  // API Gateway converts to current_stock
        minStock: selectedProduct.minStock === '' ? 0 : Number(selectedProduct.minStock),  // API Gateway converts to min_stock
        maxStock: selectedProduct.maxStock === '' ? 1000 : Number(selectedProduct.maxStock),  // API Gateway converts to max_stock
        costPrice: selectedProduct.costPrice === '' ? 0 : Number(selectedProduct.costPrice),  // API Gateway converts to cost_price
        sellingPrice: selectedProduct.sellingPrice === '' ? 0 : Number(selectedProduct.sellingPrice),  // API Gateway converts to selling_price
        supplier: selectedProduct.supplier,
        location: selectedProduct.location,
        origin: selectedProduct.origin || 'UAE',  // Country of origin
        specifications: {
          ...(selectedProduct.specifications || {}),
          thickness: selectedProduct.thickness || (selectedProduct.specifications && selectedProduct.specifications.thickness) || '',
        },
      };

      console.log('📤 Sending product data (camelCase):', productData);
      console.log(`🔗 API URL: PUT /api/products/${selectedProduct.id}`);

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


  /**
   * Determine stock status with proper edge case handling
   * - OUT_OF_STOCK: quantity is 0 or negative (always takes priority)
   * - LOW: quantity > 0 but <= minStock (or <= 5 if minStock is 0)
   * - HIGH: quantity >= maxStock * 0.8 (only if maxStock > 0)
   * - NORMAL: everything else
   */
  const getStockStatus = (product) => {
    // Safely parse values with fallbacks to 0
    const currentStock = Number(product.currentStock) || 0;
    const minStock = Number(product.minStock) || 0;
    const maxStock = Number(product.maxStock) || 0;

    // CRITICAL: Out of stock takes priority over everything
    if (currentStock <= 0) {
      return 'out_of_stock';
    }

    // Low stock check
    // If minStock is 0 (not set), use 5 as default threshold
    const effectiveMinStock = minStock > 0 ? minStock : 5;
    if (currentStock <= effectiveMinStock) {
      return 'low';
    }

    // High stock check - only if maxStock is defined and > 0
    // Prevent false positives when maxStock is 0 or undefined
    if (maxStock > 0 && currentStock >= maxStock * 0.8) {
      return 'high';
    }

    return 'normal';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock': return '#7f1d1d'; // dark red for out of stock
      case 'low': return '#dc2626'; // red
      case 'high': return '#059669'; // green
      default: return '#2563eb'; // blue for normal
    }
  };

  // Helper to get display text for stock status
  const getStockStatusLabel = (status) => {
    switch (status) {
      case 'out_of_stock': return 'OUT OF STOCK';
      case 'low': return 'LOW';
      case 'high': return 'HIGH';
      default: return 'NORMAL';
    }
  };


  const renderCatalog = () => (
    <div className="p-4">
      {/* Quick Filters Header with Toggle - Compact */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
          Quick Filters
        </span>
        <button
          onClick={() => setShowSpeedButtons(!showSpeedButtons)}
          className={`
            relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200
            ${showSpeedButtons
      ? 'bg-teal-500'
      : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
    }
          `}
          title={showSpeedButtons ? 'Hide quick filters' : 'Show quick filters'}
        >
          <span
            className={`
              inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200
              ${showSpeedButtons ? 'translate-x-3.5' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>

      {/* Speed Buttons Container - Collapsible & Compact */}
      {showSpeedButtons && (
        <div className="space-y-2 mb-3">
          {/* Category Speed Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Category:</span>
            {categoryGroups.map((group) => {
              const isActive = activeCategoryGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => { setActiveCategoryGroup(group.id); setCategoryFilter('all'); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-teal-500 text-white border-teal-400'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{group.icon}</span>
                  <span>{group.label}</span>
                  <span className={`px-1 rounded text-xs ${isActive ? 'bg-white/20' : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Grade Speed Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Grade:</span>
            {gradeGroups.map((group) => {
              const isActive = activeGradeGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveGradeGroup(group.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-teal-500 text-white border-teal-400'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{group.label}</span>
                  <span className={`px-1 rounded text-xs ${isActive ? 'bg-white/20' : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Stats Summary - Compact inline */}
      <div className={`flex flex-wrap items-center gap-4 py-2 mb-3 text-xs border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-1">
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Showing:</span>
          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{filteredProducts.length}</span>
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>of {products.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Low:</span>
          <span className="font-semibold text-red-500">{products.filter(p => (p.currentStock || 0) <= (p.minStock || 0)).length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>OK:</span>
          <span className="font-semibold text-green-500">{products.filter(p => (p.currentStock || 0) > (p.minStock || 0)).length}</span>
        </div>
      </div>

      {/* Controls - Compact row */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <Select
          label="Category"
          options={[{ value: 'all', label: 'All Categories' }, ...categories]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-w-36"
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
          className="min-w-28"
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
          size="sm"
        >
          <Package size={16} />
          Download
        </Button>
        <Button
          onClick={() => setShowUploadModal(true)}
          size="sm"
          className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600"
        >
          <Upload size={16} />
          Upload
        </Button>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* Products Grid - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      {product.displayName || product.display_name || product.fullName || product.full_name || product.name}
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
                      {(/pipe|tube/i.test(product.category || '')) ? (
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
                      {/* Origin Badge - Show country of origin */}
                      {product.origin && (
                        <span className={`px-2 py-1 text-xs rounded-md border font-medium ${
                          isDarkMode
                            ? 'bg-amber-900/30 text-amber-300 border-amber-700'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {product.origin}
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
                          cost_price: product.cost_price,
                          selling_price: product.selling_price,
                          sellingPrice: product.sellingPrice,
                        });

                        // Convert ALL snake_case to camelCase for form and normalize strings
                        // Handle both snake_case and camelCase from backend
                        const formattedProduct = {
                          ...product,
                          // Size fields - handle both naming conventions
                          sizeInch: product.sizeInch || product.size_inch || '',
                          od: product.od || '',
                          length: product.length || '',
                          thickness: product.thickness || '',
                          // Finish field
                          finish: product.finish ? String(product.finish).trim() : '',
                          // Stock fields - handle both naming conventions
                          currentStock: product.currentStock !== undefined ? product.currentStock : product.current_stock || '',
                          minStock: product.minStock !== undefined ? product.minStock : product.min_stock || '',
                          maxStock: product.maxStock !== undefined ? product.maxStock : product.max_stock || '',
                          // Price fields - handle both naming conventions
                          costPrice: product.costPrice !== undefined ? product.costPrice : product.cost_price || '',
                          sellingPrice: product.sellingPrice !== undefined ? product.sellingPrice : product.selling_price || '',
                          // Other fields
                          displayName: product.displayName || product.display_name || '',
                          uniqueName: product.uniqueName || product.unique_name || '',
                          fullName: product.fullName || product.full_name || product.name || '',
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
                      stockStatus === 'out_of_stock'
                        ? (isDarkMode ? 'bg-red-950/50 text-red-400 border-red-800' : 'bg-red-100 text-red-800 border-red-300')
                        : stockStatus === 'low'
                          ? (isDarkMode ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200')
                          : stockStatus === 'high'
                            ? (isDarkMode ? 'bg-green-900/30 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200')
                            : (isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200')
                    }`}>
                      {stockStatus === 'out_of_stock' ? <AlertTriangle size={12} /> :
                        stockStatus === 'low' ? <AlertTriangle size={12} /> :
                          stockStatus === 'high' ? <Package size={12} /> :
                            <CheckCircle size={12} />}
                      {getStockStatusLabel(stockStatus)}
                    </span>
                  </div>
                  <h4 className={`text-xl font-semibold mb-1 ${
                    stockStatus === 'out_of_stock'
                      ? 'text-red-500'
                      : isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {product.currentStock || 0}
                  </h4>
                  <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Min: {product.minStock || 0} | Max: {product.maxStock || 0}
                  </p>
                  <StockProgressBar
                    value={product.maxStock > 0 ? Math.min((product.currentStock / product.maxStock) * 100, 100) : 0}
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

  return (
    <div className={`p-4 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header - Compact */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Package size={24} className="text-teal-600" />
            <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🏗️ Stainless Steel Products
            </h1>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your steel product catalog, inventory, and pricing
          </p>
        </div>

        {/* Tabs - Folder style that connects to content */}
        <div className="flex flex-wrap gap-1 relative">
          {[
            { id: 'catalog', label: 'Product Catalog', icon: Package },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg border-t border-l border-r relative ${
                  isActive
                    ? (isDarkMode
                      ? 'bg-gray-800 text-teal-400 border-gray-700 z-10'
                      : 'bg-gray-50 text-teal-700 border-gray-200 z-10')
                    : (isDarkMode
                      ? 'bg-gray-900/50 text-gray-400 border-gray-800 hover:text-gray-200 hover:bg-gray-800/50'
                      : 'bg-gray-100/50 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-gray-100')
                }`}
                style={isActive ? { marginBottom: '-1px' } : {}}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Connected to tabs */}
        <div className={`border rounded-b-lg rounded-tr-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          {activeTab === 'catalog' && renderCatalog()}
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
                      label="Product Name Preview (auto-generated)"
                      value={newProduct.name || '(Fill fields above to generate)'}
                      readOnly
                      className={`${isDarkMode ? 'bg-gray-900 text-teal-400' : 'bg-gray-50 text-teal-600'} font-medium`}
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
                    <Select
                      label="Origin (Country)"
                      options={originOptions}
                      value={newProduct.origin || 'UAE'}
                      onChange={(e) => setNewProduct({ ...newProduct, origin: e.target.value })}
                      placeholder="Select origin..."
                    />
                    {(/pipe|tube/i.test(newProduct.category || '')) ? (
                      <>
                        <Input
                          label={'Size (inch " )'}
                          value={newProduct.sizeInch}
                          onChange={(e) => setNewProduct({ ...newProduct, sizeInch: e.target.value })}
                          placeholder={'e.g., 2"'}
                        />
                        <Input
                          label={'OD (")'}
                          value={newProduct.od}
                          onChange={(e) => setNewProduct({ ...newProduct, od: e.target.value })}
                          placeholder={'e.g., 2"'}
                        />
                        <Input
                          label={'Length (")'}
                          value={newProduct.length}
                          onChange={(e) => setNewProduct({ ...newProduct, length: e.target.value })}
                          placeholder={'e.g., 96"'}
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
                    <Input
                      label="Weight (kg/pc or kg/m)"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                      placeholder="e.g., 25.5"
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
                  <div className="sm:col-span-2">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          label="Display Name (auto-generated)"
                          value={selectedProduct.displayName || selectedProduct.display_name || selectedProduct.fullName || selectedProduct.full_name || selectedProduct.name || ''}
                          readOnly
                          className={`${isDarkMode ? 'bg-gray-900 text-teal-400' : 'bg-gray-50 text-teal-600'} font-medium`}
                          placeholder="Auto-generated from fields below"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(prev => ({ ...prev, regenerateName: true }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          isDarkMode
                            ? 'bg-teal-700 hover:bg-teal-600 text-white'
                            : 'bg-teal-100 hover:bg-teal-200 text-teal-700'
                        }`}
                        title="Regenerate product name from current field values"
                      >
                        <RefreshCw size={14} />
                        Regenerate
                      </button>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Click &quot;Regenerate&quot; to update name from current field values
                    </p>
                  </div>
                  <Input
                    label="Full Name with Origin (auto-generated)"
                    value={selectedProduct.fullName || ''}
                    readOnly
                    className={`${isDarkMode ? 'bg-gray-900 text-teal-400' : 'bg-gray-50 text-teal-600'} font-medium text-sm`}
                    placeholder="Auto-generated with origin"
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
                  <Select
                    label="Origin (Country)"
                    options={originOptions}
                    value={selectedProduct.origin || 'UAE'}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, origin: e.target.value })}
                    placeholder="Select origin..."
                  />
                  {(/pipe|tube/i.test(selectedProduct.category || '')) ? (
                    <>
                      <Input
                        label={'Size (inch " )'}
                        value={selectedProduct.sizeInch || ''}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, sizeInch: e.target.value })}
                      />
                      <Input
                        label={'OD (")'}
                        value={selectedProduct.od || ''}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, od: e.target.value })}
                      />
                      <Input
                        label={'Length (")'}
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


        {/* Specifications Modal - Zoho-Style Accordion Drawer */}
        {showSpecModal && selectedProduct && (() => {
          // State for accordion sections
          const [accordionState, setAccordionState] = React.useState({
            classification: true,  // Default expanded
            inventory: true,        // Default expanded
            pricing: true,          // Default expanded
            description: false,     // Collapsed if has data
            technical: false,       // Collapsed if has data
          });

          const toggleSection = (section) => {
            setAccordionState(prev => ({ ...prev, [section]: !prev[section] }));
          };

          // Format grade with GR prefix
          const getFormattedGrade = () => {
            const g = (selectedProduct.grade || '').toString().trim();
            return g ? (g.match(/^gr\s*(.+)$/i)?.[1] ? `GR${g.match(/^gr\s*(.+)$/i)[1]}` : `GR${g}`) : '';
          };

          // Format finish with "Finish" suffix
          const getFormattedFinish = () => {
            const f = (selectedProduct.finish || '').toString().trim();
            return f ? (/\bfinish$/i.test(f) ? f : `${f} Finish`) : '';
          };

          // Get stock status badge
          const getStockBadge = () => {
            const current = selectedProduct.currentStock || 0;
            const min = selectedProduct.minStock || 0;

            if (current === 0) {
              return (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
                  Out of Stock
                </span>
              );
            } else if (min && current <= min) {
              return (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500 text-white">
                  Low Stock
                </span>
              );
            } else {
              return (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500 text-white">
                  OK
                </span>
              );
            }
          };

          // Check if sections have data
          const specs = selectedProduct.specifications || {};
          const hasTechnicalSpecs = specs.thickness || specs.width || specs.length || specs.diameter ||
                                    specs.tensileStrength || specs.yieldStrength || specs.carbonContent ||
                                    specs.coating || specs.standard;
          const hasDescription = selectedProduct.description && selectedProduct.description.trim();

          // Calculate margin
          const margin = (selectedProduct.costPrice > 0 && selectedProduct.sellingPrice > 0)
            ? Math.round(((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.costPrice) * 100)
            : null;

          const isPipeOrTube = /pipe|tube/i.test(selectedProduct.category || '');

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
              } shadow-2xl`}>
                {/* Modal Header */}
                <div className={`sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b ${
                  isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex-1">
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Product Specifications
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Complete product information
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSpecModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Product Identity Header */}
                <div className="px-6 py-4">
                  <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedProduct.displayName || selectedProduct.display_name || selectedProduct.name}
                  </h3>
                  {(selectedProduct.fullName || selectedProduct.full_name) && (selectedProduct.fullName || selectedProduct.full_name) !== (selectedProduct.displayName || selectedProduct.display_name) && (
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedProduct.fullName || selectedProduct.full_name}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.category && (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                        isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {categories.find(c => c.value === selectedProduct.category)?.label || selectedProduct.category}
                      </span>
                    )}
                    {selectedProduct.origin && (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                        isDarkMode ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {selectedProduct.origin}
                      </span>
                    )}
                    {selectedProduct.commodity && (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                        isDarkMode ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-200'
                      }`}>
                        {selectedProduct.commodity}
                      </span>
                    )}
                  </div>
                </div>

                {/* Accordion Sections */}
                <div>
                  {/* Classification & Specs Section */}
                  <AccordionSection
                    title="Classification & Specs"
                    isOpen={accordionState.classification}
                    onToggle={() => toggleSection('classification')}
                    isEmpty={!getFormattedGrade() && !getFormattedFinish() && !selectedProduct.size}
                  >
                    <div className="space-y-0">
                      <SpecRow label="Grade" value={getFormattedGrade()} />
                      <SpecRow label="Finish" value={getFormattedFinish()} />
                      {isPipeOrTube ? (
                        <>
                          <SpecRow label="Size (Inch)" value={selectedProduct.sizeInch ? `${selectedProduct.sizeInch}"` : null} />
                          <SpecRow label="OD" value={selectedProduct.od ? `(${selectedProduct.od})` : null} />
                          <SpecRow label="Length" value={selectedProduct.length ? `L: ${selectedProduct.length}` : null} />
                        </>
                      ) : (
                        <SpecRow label="Size" value={selectedProduct.size} />
                      )}
                      <SpecRow label="Thickness" value={selectedProduct.thickness} />
                      <SpecRow label="Weight" value={selectedProduct.weight ? `${selectedProduct.weight} kg` : null} />
                    </div>
                  </AccordionSection>

                  {/* Inventory Section */}
                  <AccordionSection
                    title="Inventory"
                    isOpen={accordionState.inventory}
                    onToggle={() => toggleSection('inventory')}
                    isEmpty={selectedProduct.currentStock === undefined && !selectedProduct.minStock && !selectedProduct.maxStock && !selectedProduct.location}
                  >
                    <div className="space-y-0">
                      <SpecRow
                        label="Current Stock"
                        value={selectedProduct.currentStock !== undefined ? selectedProduct.currentStock : null}
                        badge={getStockBadge()}
                      />
                      <SpecRow label="Min Stock" value={selectedProduct.minStock} />
                      <SpecRow label="Max Stock" value={selectedProduct.maxStock} />
                      <SpecRow label="Location" value={selectedProduct.location} />
                    </div>
                  </AccordionSection>

                  {/* Pricing Section */}
                  <AccordionSection
                    title="Pricing"
                    isOpen={accordionState.pricing}
                    onToggle={() => toggleSection('pricing')}
                    isEmpty={!selectedProduct.costPrice && !selectedProduct.sellingPrice && !selectedProduct.supplier}
                  >
                    <div className="space-y-0">
                      <SpecRow
                        label="Cost Price"
                        value={selectedProduct.costPrice ? `${Number(selectedProduct.costPrice).toFixed(2)} د.إ` : null}
                      />
                      <SpecRow
                        label="Selling Price"
                        value={selectedProduct.sellingPrice ? `${Number(selectedProduct.sellingPrice).toFixed(2)} د.إ` : null}
                      />
                      {margin !== null && (
                        <SpecRow
                          label="Margin"
                          value={`${margin}%`}
                          className="border-t border-gray-600/20 pt-2 mt-2"
                        />
                      )}
                      {selectedProduct.supplier && (
                        <SpecRow
                          label="Supplier"
                          value={selectedProduct.supplier}
                          className="border-t border-gray-600/20 pt-2 mt-2"
                        />
                      )}
                    </div>
                  </AccordionSection>

                  {/* Description Section - Only show if has data */}
                  {hasDescription && (
                    <AccordionSection
                      title="Description"
                      isOpen={accordionState.description}
                      onToggle={() => toggleSection('description')}
                    >
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedProduct.description}
                      </p>
                    </AccordionSection>
                  )}

                  {/* Technical Specs Section - Only show if has data */}
                  {hasTechnicalSpecs && (
                    <AccordionSection
                      title="Technical Specs"
                      isOpen={accordionState.technical}
                      onToggle={() => toggleSection('technical')}
                    >
                      <div className="space-y-0">
                        <SpecRow label="Length" value={specs.length} />
                        <SpecRow label="Width" value={specs.width} />
                        <SpecRow label="Thickness" value={specs.thickness} />
                        <SpecRow label="Diameter" value={specs.diameter} />
                        <SpecRow label="Tensile Strength" value={specs.tensileStrength} />
                        <SpecRow label="Yield Strength" value={specs.yieldStrength} />
                        <SpecRow label="Carbon Content" value={specs.carbonContent} />
                        <SpecRow label="Coating" value={specs.coating} />
                        <SpecRow label="Standard" value={specs.standard} />
                      </div>
                    </AccordionSection>
                  )}
                </div>

                {/* Modal Footer */}
                <div className={`sticky bottom-0 px-6 py-3 border-t ${
                  isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-end">
                    <Button onClick={() => setShowSpecModal(false)} variant="secondary" size="sm">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
