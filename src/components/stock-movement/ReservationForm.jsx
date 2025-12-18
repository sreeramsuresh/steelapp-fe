/**
 * ReservationForm Component
 * Phase 6: Stock Reservations
 *
 * Form for creating new stock reservations
 * Migrated from Material-UI to Tailwind CSS
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Bookmark,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Package,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { stockMovementService } from '../../services/stockMovementService';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/dataService';

/**
 * Format quantity with unit
 */
const formatQuantity = (qty, unit = 'KG') => {
  return `${parseFloat(qty || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
};

const ReservationForm = ({ open, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();

  // Data lists
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form fields
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Stock info
  const [availableStock, setAvailableStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Refs
  const productInputRef = useRef(null);
  const productDropdownRef = useRef(null);

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const result = await warehouseService.getAll({ isActive: true });
        setWarehouses(result.data || []);
        if (result.data?.length > 0) {
          const defaultWh =
            result.data.find((w) => w.isDefault) || result.data[0];
          setWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error('Error loading warehouses:', err);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    if (open) {
      loadWarehouses();
    }
  }, [open]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const result = await productService.getProducts({ limit: 1000 });
        setProducts(result.data || []);
        setFilteredProducts(result.data || []);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (open) {
      loadProducts();
    }
  }, [open]);

  // Filter products based on search
  useEffect(() => {
    if (!productSearchTerm) {
      setFilteredProducts(products);
      return;
    }

    const search = productSearchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search),
    );
    setFilteredProducts(filtered);
  }, [productSearchTerm, products]);

  // Load available stock when product/warehouse changes
  useEffect(() => {
    const loadStock = async () => {
      if (!warehouseId || !productId) {
        setAvailableStock(null);
        return;
      }

      try {
        setLoadingStock(true);
        const result = await stockMovementService.getCurrentStock(
          productId,
          warehouseId,
        );
        const warehouse = result.warehouses?.find(
          (w) => w.warehouseId === warehouseId,
        );
        setAvailableStock({
          quantityOnHand: parseFloat(warehouse?.quantityOnHand) || 0,
          quantityAvailable: parseFloat(warehouse?.quantityAvailable) || 0,
          unit: warehouse?.unit || 'KG',
        });
      } catch (err) {
        console.error('Error loading stock:', err);
        setAvailableStock(null);
      } finally {
        setLoadingStock(false);
      }
    };

    loadStock();
  }, [warehouseId, productId]);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setProductId('');
      setProductSearchTerm('');
      setQuantity('');
      setExpiryDate('');
      setNotes('');
      setError(null);
      setShowProductDropdown(false);
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target) &&
        !productInputRef.current?.contains(event.target)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    setProductId(product.id);
    setProductSearchTerm(`${product.name} (${product.sku || 'No SKU'})`);
    setShowProductDropdown(false);
  }, []);

  // Validate form
  const validateForm = () => {
    if (!warehouseId) {
      setError('Please select a warehouse');
      return false;
    }
    if (!productId) {
      setError('Please select a product');
      return false;
    }
    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) {
      setError('Quantity must be greater than 0');
      return false;
    }
    if (availableStock && qty > availableStock.quantityAvailable) {
      setError(
        `Insufficient available stock. Available: ${formatQuantity(availableStock.quantityAvailable, availableStock.unit)}`,
      );
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const reservationData = {
        productId,
        warehouseId: parseInt(warehouseId),
        quantity: parseFloat(quantity),
        expiryDate: expiryDate || null,
        notes,
      };

      const result =
        await stockMovementService.createReservation(reservationData);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Failed to create reservation');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`max-w-lg w-full mx-4 p-6 rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Create Stock Reservation</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
              isDarkMode
                ? 'bg-red-900 bg-opacity-30 border border-red-700'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Warehouse */}
          <div>
            <label
              htmlFor="warehouse-select"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Warehouse *
            </label>
            <div className="relative">
              <select
                id="warehouse-select"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={loadingWarehouses}
                className={`w-full px-3 py-2 rounded-lg border appearance-none ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loadingWarehouses ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Product Autocomplete */}
          <div>
            <label
              htmlFor="product-search"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Product *
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  id="product-search"
                  ref={productInputRef}
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => {
                    setProductSearchTerm(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Select product..."
                  className={`w-full px-3 py-2 pl-10 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {loadingProducts && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                )}
              </div>

              {/* Dropdown */}
              {showProductDropdown && filteredProducts.length > 0 && (
                <div
                  ref={productDropdownRef}
                  className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {filteredProducts.slice(0, 20).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className={`w-full text-left px-3 py-2 hover:bg-blue-500 hover:text-white transition-colors ${
                        productId === product.id
                          ? 'bg-blue-500 text-white'
                          : isDarkMode
                            ? 'text-gray-200'
                            : 'text-gray-900'
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm opacity-75">
                        {product.sku || 'No SKU'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Stock Badges */}
          {availableStock !== null && (
            <div className="flex gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                On Hand:{' '}
                {formatQuantity(
                  availableStock.quantityOnHand,
                  availableStock.unit,
                )}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  availableStock.quantityAvailable > 0
                    ? isDarkMode
                      ? 'bg-green-900 bg-opacity-30 border-green-700 text-green-300'
                      : 'bg-green-100 border-green-300 text-green-700'
                    : isDarkMode
                      ? 'bg-red-900 bg-opacity-30 border-red-700 text-red-300'
                      : 'bg-red-100 border-red-300 text-red-700'
                }`}
              >
                Available:{' '}
                {formatQuantity(
                  availableStock.quantityAvailable,
                  availableStock.unit,
                )}
              </span>
            </div>
          )}
          {loadingStock && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading stock levels...</span>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity-input"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Quantity to Reserve *
            </label>
            <input
              id="quantity-input"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 rounded-lg border ${
                availableStock &&
                parseFloat(quantity) > availableStock.quantityAvailable
                  ? 'border-red-500 focus:ring-red-500'
                  : isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {availableStock && (
              <p className="mt-1 text-sm text-gray-500">
                Max: {availableStock.quantityAvailable} {availableStock.unit}
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label
              htmlFor="expiry-date"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Expiry Date (Optional)
            </label>
            <input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for no expiry
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes-textarea"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Notes
            </label>
            <textarea
              id="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes about this reservation..."
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !productId || !quantity}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              saving || !productId || !quantity
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Creating...' : 'Create Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationForm;
