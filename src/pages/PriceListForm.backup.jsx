import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  TrendingUp,
  TrendingDown,
  Search,
  Package,
  CheckCircle,
  Star,
  Tag,
  Percent,
  X,
  Boxes,
  ExternalLink,
  Layers,
  Globe,
  Factory,
  MapPin,
  RotateCcw,
  Copy,
  History,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import pricelistService from '../services/pricelistService';
import { productService } from '../services/dataService';
import { notificationService } from '../services/notificationService';
import PriceHistoryTab from '../components/pricelist/PriceHistoryTab';

// Custom Button component
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return isDarkMode
        ? `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-600 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-gray-800`
        : `bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-400 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-white`;
    } else if (variant === 'secondary') {
      return `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-gray-400`;
    } else if (variant === 'danger') {
      return isDarkMode
        ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
        : 'bg-red-500 hover:bg-red-400 text-white focus:ring-red-500';
    } else {
      // outline
      return `border ${isDarkMode ? 'border-gray-600 bg-transparent text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Input component
const Input = ({
  label,
  error,
  className = '',
  type = 'text',
  isDarkMode,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
        >
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

// Custom Select component
const Select = ({
  label,
  options,
  value,
  onChange,
  className = '',
  isDarkMode,
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode
            ? 'bg-gray-800 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-900'
        } ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Custom Toggle component
const Toggle = ({ checked, onChange, label, isDarkMode }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`w-11 h-6 rounded-full relative transition-colors ${
          checked ? 'bg-teal-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span
        className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
      >
        {label}
      </span>
    </label>
  );
};

// Product Detail Drawer component
const ProductDetailDrawer = ({
  product,
  isOpen,
  onClose,
  isDarkMode,
  navigate,
}) => {
  if (!isOpen || !product) return null;

  const InfoRow = ({ icon: Icon, label, value, valueClassName = '' }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon
        size={16}
        className={`mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
        >
          {label}
        </p>
        <p
          className={`text-sm font-medium truncate ${valueClassName || (isDarkMode ? 'text-white' : 'text-gray-900')}`}
        >
          {value || '—'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
          isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            <Package size={20} className="text-teal-500" />
            <h3
              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Product Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X
              size={20}
              className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-130px)]">
          {/* Product Name */}
          <div className="mb-4">
            <h4
              className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {product.displayName ||
                product.display_name ||
                product.name ||
                'N/A'}
            </h4>
            <p
              className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
            >
              {product.sku || product.product_code || `ID: ${product.id}`}
            </p>
          </div>

          {/* Category & Grade */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.category && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                  isDarkMode
                    ? 'bg-blue-900/30 text-blue-400'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Layers size={12} />
                {product.category}
              </span>
            )}
            {product.grade && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                  isDarkMode
                    ? 'bg-purple-900/30 text-purple-400'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {product.grade}
              </span>
            )}
          </div>

          {/* Pricing Section */}
          <div
            className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
          >
            <h5
              className={`text-xs font-semibold uppercase mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Pricing
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Selling Price
                </p>
                <p className={`text-lg font-bold text-teal-500`}>
                  AED{' '}
                  {product.sellingPrice?.toFixed(2) ||
                    product.selling_price?.toFixed(2) ||
                    '0.00'}
                </p>
              </div>
              <div>
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Cost Price
                </p>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  AED{' '}
                  {product.costPrice?.toFixed(2) ||
                    product.cost_price?.toFixed(2) ||
                    '0.00'}
                </p>
              </div>
            </div>
            {product.sellingPrice && product.costPrice && (
              <div className="mt-3 pt-3 border-t border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}">
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Margin
                </p>
                <p
                  className={`text-sm font-medium ${
                    ((product.sellingPrice - product.costPrice) /
                      product.sellingPrice) *
                      100 >
                    20
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}
                >
                  {(
                    ((product.sellingPrice - product.costPrice) /
                      product.sellingPrice) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            )}
          </div>

          {/* Source Section */}
          <div
            className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
          >
            <h5
              className={`text-xs font-semibold uppercase mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Source
            </h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md ${
                    product.isImported || product.is_imported
                      ? isDarkMode
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-blue-100 text-blue-700'
                      : isDarkMode
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {product.isImported || product.is_imported ? (
                    <>
                      <Globe size={12} />
                      Imported
                    </>
                  ) : (
                    <>
                      <MapPin size={12} />
                      Local
                    </>
                  )}
                </span>
              </div>
              {(product.isImported || product.is_imported) && (
                <div className="space-y-1">
                  <InfoRow
                    icon={Globe}
                    label="Country of Origin"
                    value={
                      product.countryOfOrigin ||
                      product.country_of_origin ||
                      product.origin_country
                    }
                  />
                  <InfoRow
                    icon={Factory}
                    label="Mill / Manufacturer"
                    value={
                      product.millName ||
                      product.mill_name ||
                      product.manufacturer
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stock Section */}
          <div
            className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
          >
            <h5
              className={`text-xs font-semibold uppercase mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Stock Information
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Available Stock
                </p>
                <p
                  className={`text-lg font-bold ${
                    (product.stockQuantity || product.stock_quantity || 0) > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {product.stockQuantity || product.stock_quantity || 0}
                </p>
              </div>
              <div>
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Reserved
                </p>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {product.reservedQuantity || product.reserved_quantity || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700 bg-[#1E2328]' : 'border-gray-200 bg-white'}`}
        >
          <button
            onClick={() => {
              onClose();
              navigate(`/products/${product.id}`);
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <ExternalLink size={16} />
            View Full Product Page
          </button>
        </div>
      </div>
    </>
  );
};

export default function PriceListForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const isEdit = !!id;
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState({
    type: 'increase',
    percentage: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' or 'history'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    currency: 'AED',
    isActive: true,
    isDefault: false,
    effectiveFrom: '',
    effectiveTo: '',
    items: [],
  });

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchPricelist();
    } else if (copyFromId) {
      copyPricelist(copyFromId);
    } else {
      // New pricelist - load default prices as starting point
      loadDefaultPrices();
    }
  }, [id, copyFromId]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      notificationService.error('Failed to load products');
    }
  };

  const fetchPricelist = async () => {
    try {
      setLoading(true);
      const response = await pricelistService.getById(id);
      const pricelist = response.pricelist;
      const items = response.items || [];

      setFormData({
        name: pricelist.name,
        description: pricelist.description || '',
        currency: pricelist.currency || 'AED',
        isActive: pricelist.isActive,
        isDefault: pricelist.isDefault,
        effectiveFrom: pricelist.effectiveFrom || '',
        effectiveTo: pricelist.effectiveTo || '',
        items,
      });
    } catch (error) {
      console.error('Error fetching pricelist:', error);
      notificationService.error('Failed to load price list');
    } finally {
      setLoading(false);
    }
  };

  const copyPricelist = async (sourceId) => {
    try {
      setLoading(true);
      const response = await pricelistService.getById(sourceId);
      const source = response.pricelist;
      const items = response.items || [];

      setFormData({
        name: `${source.name} (Copy)`,
        description: source.description || '',
        currency: source.currency || 'AED',
        isActive: true,
        isDefault: false,
        effectiveFrom: '',
        effectiveTo: '',
        items,
      });
    } catch (error) {
      console.error('Error copying pricelist:', error);
      notificationService.error('Failed to copy price list');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultPrices = async () => {
    try {
      setLoading(true);
      // Get all pricelists to find the default one
      const response = await pricelistService.getAll();
      const pricelists = response.pricelists || [];
      const defaultPricelist = pricelists.find((p) => p.isDefault);

      if (defaultPricelist) {
        // Fetch the default pricelist's items
        const detailResponse = await pricelistService.getById(
          defaultPricelist.id,
        );
        const items = detailResponse.items || [];

        setFormData((prev) => ({
          ...prev,
          items,
        }));
      }
    } catch (error) {
      console.error('Error loading default prices:', error);
      // Non-critical - don't show error, just start with empty prices
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (productId, newPrice) => {
    setFormData((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === productId,
      );

      if (existingIndex >= 0) {
        const updatedItems = [...prev.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          sellingPrice: parseFloat(newPrice) || 0,
        };
        return { ...prev, items: updatedItems };
      } else {
        const product = products.find((p) => p.id === productId);
        return {
          ...prev,
          items: [
            ...prev.items,
            {
              productId,
              productName: product?.displayName || product?.name,
              sellingPrice: parseFloat(newPrice) || 0,
              minQuantity: 1,
            },
          ],
        };
      }
    });
  };

  const handleBulkApply = () => {
    const { type, percentage } = bulkOperation;
    const multiplier =
      type === 'increase' ? 1 + percentage / 100 : 1 - percentage / 100;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        sellingPrice: parseFloat((item.sellingPrice * multiplier).toFixed(2)),
      })),
    }));

    notificationService.success(`Applied ${percentage}% ${type} to all prices`);
    setShowBulkDialog(false);
  };

  const handleResetToDefaults = () => {
    // Reset ALL products to their default selling prices
    const allItems = products.map((product) => ({
      productId: product.id,
      productName: product.displayName || product.name,
      sellingPrice: product.sellingPrice || 0,
      minQuantity: 1,
    }));
    setFormData((prev) => ({
      ...prev,
      items: allItems,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      notificationService.error('Price list name is required');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          product_id: item.productId,
          selling_price: item.sellingPrice,
          min_quantity: item.minQuantity || 1,
        })),
      };

      if (isEdit) {
        await pricelistService.update(id, payload);
        notificationService.success('Price list updated successfully');
      } else {
        await pricelistService.create(payload);
        notificationService.success('Price list created successfully');
      }

      navigate('/pricelists');
    } catch (error) {
      console.error('Error saving pricelist:', error);
      notificationService.error(
        error.response?.data?.message || 'Failed to save price list',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!formData.name) {
      notificationService.error('Price list name is required');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        isActive: formData.isActive,
        isDefault: false, // New pricelist should not be default
        items: formData.items.map((item) => ({
          product_id: item.productId,
          selling_price: item.sellingPrice,
          min_quantity: item.minQuantity || 1,
        })),
      };

      await pricelistService.create(payload);
      notificationService.success('New price list created successfully');
      navigate('/pricelists');
    } catch (error) {
      console.error('Error creating new pricelist:', error);
      notificationService.error(
        error.response?.data?.message || 'Failed to create price list',
      );
    } finally {
      setSaving(false);
    }
  };

  const getProductPrice = (productId) => {
    const item = formData.items.find((i) => i.productId === productId);
    return item?.sellingPrice || '';
  };

  const getProductCurrentPrice = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product?.sellingPrice || 0;
  };

  const getProductCostPrice = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product?.costPrice || product?.cost_price || 0;
  };

  const calculateMargin = (sellingPrice, costPrice) => {
    if (!sellingPrice || !costPrice || sellingPrice === 0) return null;
    return (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1);
  };

  const getPriceDiff = (productId) => {
    const newPrice = getProductPrice(productId);
    const currentPrice = getProductCurrentPrice(productId);

    if (!newPrice || !currentPrice) return null;

    const diff = newPrice - currentPrice;
    const diffPercent = ((diff / currentPrice) * 100).toFixed(1);

    return { diff, diffPercent };
  };

  // Filtered products by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const search = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(search) ||
        p.display_name?.toLowerCase().includes(search) ||
        p.name?.toLowerCase().includes(search) ||
        p.category?.toLowerCase().includes(search) ||
        p.grade?.toLowerCase().includes(search),
    );
  }, [products, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      configuredProducts: formData.items.length,
      increasedPrices: formData.items.filter((item) => {
        const currentPrice = getProductCurrentPrice(item.productId);
        return item.sellingPrice > currentPrice;
      }).length,
      decreasedPrices: formData.items.filter((item) => {
        const currentPrice = getProductCurrentPrice(item.productId);
        return item.sellingPrice < currentPrice && item.sellingPrice > 0;
      }).length,
    }),
    [formData.items, products],
  );

  if (loading) {
    return (
      <div
        className={`p-4 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/pricelists')}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1
            className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {isEdit ? '✏️ Edit Price List' : '➕ New Price List'}
          </h1>
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {isEdit
              ? 'Update pricing for your products'
              : 'Create a new price list to manage product pricing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - 30% (Basic Info + Actions + Summary) */}
          <div className="w-full lg:w-[30%] space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            {/* Basic Information Card */}
            <div
              className={`rounded-xl border p-5 ${
                isDarkMode
                  ? 'bg-[#1E2328] border-[#37474F]'
                  : 'bg-white border-[#E0E0E0]'
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Tag size={18} className="text-teal-500" />
                <h2
                  className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Basic Information
                </h2>
              </div>

              <div className="space-y-3">
                <Input
                  label="Price List Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Wholesale Prices Q1 2024"
                  required
                  isDarkMode={isDarkMode}
                />

                <label
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />

                <Select
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  options={[
                    { value: 'AED', label: 'AED' },
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                  ]}
                  isDarkMode={isDarkMode}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Effective From"
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) =>
                      handleChange('effectiveFrom', e.target.value)
                    }
                    isDarkMode={isDarkMode}
                  />
                  <Input
                    label="Effective To"
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(e) =>
                      handleChange('effectiveTo', e.target.value)
                    }
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div
                  className={`pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <Toggle
                      checked={formData.isActive}
                      onChange={(val) => handleChange('isActive', val)}
                      label="Active"
                      isDarkMode={isDarkMode}
                    />
                    <Toggle
                      checked={formData.isDefault}
                      onChange={(val) => handleChange('isDefault', val)}
                      label="Default"
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div
              className={`rounded-xl border p-4 ${
                isDarkMode
                  ? 'bg-[#1E2328] border-[#37474F]'
                  : 'bg-white border-[#E0E0E0]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Products with Prices
                </span>
                <span
                  className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {stats.configuredProducts} / {stats.totalProducts}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}
                >
                  <TrendingUp size={14} className="text-green-500" />
                  <span
                    className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}
                  >
                    {stats.increasedPrices}
                  </span>
                  <span
                    className={`text-xs ${isDarkMode ? 'text-green-400/70' : 'text-green-600'}`}
                  >
                    up
                  </span>
                </div>
                <div
                  className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}
                >
                  <TrendingDown size={14} className="text-red-500" />
                  <span
                    className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}
                  >
                    {stats.decreasedPrices}
                  </span>
                  <span
                    className={`text-xs ${isDarkMode ? 'text-red-400/70' : 'text-red-600'}`}
                  >
                    down
                  </span>
                </div>
              </div>

              <div
                className={`pt-3 mt-3 border-t space-y-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <Button type="submit" className="w-full" disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Price List'}
                </Button>
                {isEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={handleSaveAsNew}
                    disabled={saving}
                  >
                    <Copy size={16} />
                    Save As New
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/pricelists')}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - 70% (Product Prices + History) */}
          <div className="w-full lg:w-[70%]">
            {/* Main Card with Tabs */}
            <div
              className={`rounded-xl border h-full ${
                isDarkMode
                  ? 'bg-[#1E2328] border-[#37474F]'
                  : 'bg-white border-[#E0E0E0]'
              }`}
            >
              {/* Tab Navigation */}
              <div
                className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('prices')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === 'prices'
                      ? `border-teal-500 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  <Package size={18} />
                  Product Prices
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    {stats.configuredProducts}
                  </span>
                </button>
                {isEdit && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === 'history'
                        ? `border-teal-500 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`
                        : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }`}
                  >
                    <History size={18} />
                    Price History
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'prices' ? (
                  <>
                    {/* Product Prices Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2
                          className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          Configure Prices
                        </h2>
                        <span
                          className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                        >
                          ({stats.configuredProducts} of {stats.totalProducts}{' '}
                          configured)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkDialog(true)}
                        >
                          <Percent size={16} />
                          Bulk Adjustment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetToDefaults}
                          disabled={formData.items.length === 0}
                        >
                          <RotateCcw size={16} />
                          Reset to Defaults
                        </Button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead
                          className={`sticky top-0 ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'}`}
                        >
                          <tr
                            className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <th
                              className={`text-left py-3 px-3 text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Product
                            </th>
                            <th
                              className={`text-right py-3 px-3 text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Current Price
                            </th>
                            <th
                              className={`text-right py-3 px-3 text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              New Price
                            </th>
                            <th
                              className={`text-right py-3 px-3 text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Change
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => {
                            const priceDiff = getPriceDiff(product.id);
                            const newPrice = getProductPrice(product.id);
                            const costPrice = getProductCostPrice(product.id);
                            const margin =
                              newPrice && costPrice
                                ? calculateMargin(
                                  parseFloat(newPrice),
                                  costPrice,
                                )
                                : null;
                            const isNegativeMargin =
                              margin !== null && parseFloat(margin) < 0;

                            return (
                              <tr
                                key={product.id}
                                className={`border-b transition-colors ${
                                  isDarkMode
                                    ? 'border-gray-700 hover:bg-gray-800/50'
                                    : 'border-gray-100 hover:bg-gray-50'
                                }`}
                              >
                                <td className="py-3 px-3">
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedProduct(product)
                                      }
                                      className={`font-medium text-sm text-left hover:text-teal-500 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                      {product.uniqueName ||
                                        product.unique_name ||
                                        'N/A'}
                                    </button>
                                    <p
                                      className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                                    >
                                      {product.isImported || product.is_imported
                                        ? `Imported - ${product.countryOfOrigin || product.country_of_origin || product.origin_country || 'Unknown'}, ${product.millName || product.mill_name || product.manufacturer || 'Unknown Mill'}`
                                        : 'Local'}
                                    </p>
                                  </div>
                                </td>
                                <td
                                  className={`py-3 px-3 text-right text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  {formData.currency}{' '}
                                  {product.sellingPrice?.toFixed(2) || '0.00'}
                                  <div
                                    className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                                  >
                                    Cost: {formData.currency}{' '}
                                    {costPrice?.toFixed(2) || '0.00'}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <span
                                      className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}
                                    >
                                      {formData.currency}
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={getProductPrice(product.id)}
                                      onChange={(e) =>
                                        handlePriceChange(
                                          product.id,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0.00"
                                      className={`w-28 px-2 py-1.5 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 ${
                                        isNegativeMargin
                                          ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                                          : 'focus:ring-teal-500'
                                      } ${
                                        isDarkMode
                                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                      }`}
                                    />
                                  </div>
                                  {margin !== null && (
                                    <div
                                      className={`text-xs text-right mt-1 font-medium ${
                                        isNegativeMargin
                                          ? 'text-red-500'
                                          : parseFloat(margin) < 10
                                            ? 'text-yellow-500'
                                            : 'text-green-500'
                                      }`}
                                    >
                                      Margin: {margin}%
                                      {isNegativeMargin && ' ⚠️'}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {priceDiff && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium ${
                                        priceDiff.diff >= 0
                                          ? isDarkMode
                                            ? 'bg-green-900/30 text-green-400'
                                            : 'bg-green-100 text-green-700'
                                          : isDarkMode
                                            ? 'bg-red-900/30 text-red-400'
                                            : 'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {priceDiff.diff >= 0 ? (
                                        <TrendingUp size={12} />
                                      ) : (
                                        <TrendingDown size={12} />
                                      )}
                                      {priceDiff.diff >= 0 ? '+' : ''}
                                      {priceDiff.diffPercent}%
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredProducts.length === 0 && (
                      <div
                        className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        <Package
                          size={48}
                          className="mx-auto mb-2 opacity-50"
                        />
                        <p>No products found</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* History Tab Content */
                  <PriceHistoryTab
                    pricelistId={parseInt(id)}
                    products={products}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Bulk Adjustment Dialog */}
      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isDarkMode={isDarkMode}
        navigate={navigate}
      />

      {showBulkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBulkDialog(false)}
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-xl p-6 ${
              isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Bulk Price Adjustment
              </h3>
              <button
                onClick={() => setShowBulkDialog(false)}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X
                  size={20}
                  className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                />
              </button>
            </div>

            <div className="space-y-4">
              <Select
                label="Operation"
                value={bulkOperation.type}
                onChange={(e) =>
                  setBulkOperation({ ...bulkOperation, type: e.target.value })
                }
                options={[
                  { value: 'increase', label: 'Increase Prices' },
                  { value: 'decrease', label: 'Decrease Prices' },
                ]}
                isDarkMode={isDarkMode}
              />

              <Input
                label="Percentage"
                type="number"
                value={bulkOperation.percentage}
                onChange={(e) =>
                  setBulkOperation({
                    ...bulkOperation,
                    percentage: parseFloat(e.target.value),
                  })
                }
                placeholder="e.g., 10"
                isDarkMode={isDarkMode}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBulkDialog(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleBulkApply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
