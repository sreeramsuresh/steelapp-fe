import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Package,
  Warehouse,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { stockMovementService, MOVEMENT_TYPES, REFERENCE_TYPES, parseGrpcError } from '../../services/stockMovementService';
import { productService } from '../../services/dataService';
import { warehouseService } from '../../services/warehouseService';
import { notificationService } from '../../services/notificationService';

/**
 * Stock Movement Form
 * Phase 2: Create/View Stock Movement
 *
 * Form for creating manual stock movements
 * View-only mode for existing movements (movements are immutable)
 */
const StockMovementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    movementType: 'IN',
    quantity: '',
    unit: 'KG',
    referenceType: 'ADJUSTMENT',
    referenceNumber: '',
    notes: '',
    movementDate: new Date().toISOString().slice(0, 10),
    unitCost: '',
    batchNumber: '',
    coilNumber: '',
    heatNumber: '',
  });

  // Data state
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingMovement, setExistingMovement] = useState(null);

  // Product autocomplete search state
  const [productQuery, setProductQuery] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Available units
  const UNITS = ['KG', 'MT', 'PCS', 'SHEETS', 'COILS', 'BUNDLES', 'METERS'];

  // Allowed movement types for manual creation
  const MANUAL_MOVEMENT_TYPES = {
    IN: MOVEMENT_TYPES.IN,
    OUT: MOVEMENT_TYPES.OUT,
    ADJUSTMENT: MOVEMENT_TYPES.ADJUSTMENT,
  };

  // Fetch products and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          productService.getProducts({ limit: 500 }),
          warehouseService.getAll({ limit: 100 }),
        ]);

        setProducts(productsRes?.data || productsRes || []);
        setWarehouses(warehousesRes?.data || warehousesRes || []);
      } catch (err) {
        notificationService.error('Failed to load products or warehouses');
      }
    };

    fetchData();
  }, []);

  // Fetch existing movement if editing
  useEffect(() => {
    if (id) {
      const fetchMovement = async () => {
        setLoading(true);
        try {
          const movement = await stockMovementService.getById(id);
          setExistingMovement(movement);
          setFormData({
            productId: movement.productId?.toString() || '',
            warehouseId: movement.warehouseId?.toString() || '',
            movementType: movement.movementType || 'IN',
            quantity: movement.quantity?.toString() || '',
            unit: movement.unit || 'KG',
            referenceType: movement.referenceType || 'ADJUSTMENT',
            referenceNumber: movement.referenceNumber || '',
            notes: movement.notes || '',
            movementDate: movement.movementDate?.slice(0, 10) || '',
            unitCost: movement.unitCost?.toString() || '',
            batchNumber: movement.batchNumber || '',
            coilNumber: movement.coilNumber || '',
            heatNumber: movement.heatNumber || '',
          });
        } catch (err) {
          notificationService.error('Failed to load stock movement');
          navigate('/inventory/stock-movements');
        } finally {
          setLoading(false);
        }
      };

      fetchMovement();
    }
  }, [id, navigate]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Product catalog search with debounce
  useEffect(() => {
    if (!productQuery || productQuery.trim().length < 2) {
      setProductOptions([]);
      return;
    }
    setProductSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await productService.searchProducts
          ? await productService.searchProducts(productQuery, { limit: 10 })
          : await productService.getProducts({ search: productQuery, limit: 10 });
        const rows = res?.data || res?.products || res || [];
        setProductOptions(rows);
      } catch (e) {
        setProductOptions([]);
      } finally {
        setProductSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  // Handle product selection from catalog - auto-populate fields
  const handleSelectProduct = (product) => {
    if (!product) return;
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      productId: product.id,
    }));
    setProductQuery('');
    setProductOptions([]);
    if (errors.productId) {
      setErrors(prev => ({ ...prev, productId: null }));
    }
  };

  // Clear linked product
  const clearLinkedProduct = () => {
    setSelectedProduct(null);
    setFormData((prev) => ({ ...prev, productId: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.productId) {
      newErrors.productId = 'Product is required';
    }
    if (!formData.warehouseId) {
      newErrors.warehouseId = 'Warehouse is required';
    }
    if (!formData.movementType) {
      newErrors.movementType = 'Movement type is required';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    setSaving(true);
    try {
      const movementData = {
        productId: parseInt(formData.productId),
        warehouseId: parseInt(formData.warehouseId),
        movementType: formData.movementType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        referenceType: formData.referenceType,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
        movementDate: formData.movementDate || undefined,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
        batchNumber: formData.batchNumber || undefined,
        coilNumber: formData.coilNumber || undefined,
        heatNumber: formData.heatNumber || undefined,
      };

      await stockMovementService.create(movementData);
      notificationService.success('Stock movement created successfully');
      navigate('/inventory/stock-movements');
    } catch (err) {
      const parsedError = parseGrpcError(err);

      // Provide specific feedback for known error types
      if (parsedError.code === 'FAILED_PRECONDITION') {
        notificationService.error(`${parsedError.message}. ${parsedError.originalMessage}`);
      } else if (parsedError.code === 'INVALID_ARGUMENT') {
        notificationService.error(`Validation error: ${parsedError.originalMessage}`);
      } else {
        notificationService.error(parsedError.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Input class helper
  const getInputClass = (fieldName) => {
    const baseClass = `w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
      isDarkMode
        ? 'bg-gray-800 text-white placeholder-gray-400'
        : 'bg-white text-gray-900 placeholder-gray-500'
    }`;

    const borderClass = errors[fieldName]
      ? 'border-red-500'
      : (isDarkMode ? 'border-gray-600' : 'border-gray-300');

    return `${baseClass} ${borderClass}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`p-4 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/inventory/stock-movements')}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isEditing ? 'View Stock Movement' : 'New Stock Movement'}
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isEditing ? 'Stock movements are immutable for audit purposes' : 'Create a manual stock movement'}
            </p>
          </div>
        </div>

        {/* Existing movement info */}
        {isEditing && existingMovement && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID</span>
                <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{existingMovement.id}</p>
              </div>
              <div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created By</span>
                <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{existingMovement.createdByName || 'System'}</p>
              </div>
              <div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance After</span>
                <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{existingMovement.balanceAfter} {existingMovement.unit}</p>
              </div>
              <div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Cost</span>
                <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{existingMovement.totalCost?.toFixed(2) || '-'}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product and Warehouse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product with Autocomplete Search */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <Package size={16} />
                  Product *
                </div>
              </label>
              {isEditing ? (
                /* View mode - show selected product name */
                <div className="relative">
                  <select
                    value={formData.productId}
                    className={getInputClass('productId')}
                    disabled={true}
                  >
                    <option value="">Select a product...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              ) : selectedProduct || formData.productId ? (
                /* Product selected - show linked display */
                <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}>
                  <div>
                    <div className="font-medium text-teal-500">
                      {selectedProduct
                        ? (selectedProduct.fullName || selectedProduct.full_name || selectedProduct.uniqueName || selectedProduct.unique_name || selectedProduct.displayName || selectedProduct.display_name || selectedProduct.name)
                        : products.find(p => p.id.toString() === formData.productId.toString())?.name || 'Product Selected'}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedProduct?.origin ? `${selectedProduct.origin} | ` : ''}{selectedProduct?.category || ''} {selectedProduct?.grade ? `| ${selectedProduct.grade}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearLinkedProduct}
                    className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                  >
                    Change
                  </button>
                </div>
              ) : (
                /* Autocomplete search input */
                <div className="relative">
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search for a product..."
                    className={getInputClass('productId')}
                  />
                  {productSearching && (
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Searching...
                    </div>
                  )}
                  {productOptions.length > 0 && (
                    <div className={`absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border shadow-lg ${
                      isDarkMode ? 'bg-[#1E2328] border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      {productOptions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {p.fullName || p.full_name || p.uniqueName || p.unique_name || p.displayName || p.display_name || p.name}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {p.origin ? `${p.origin} | ` : ''}{p.category} {p.grade ? `| ${p.grade}` : ''} {p.size ? `| ${p.size}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.productId && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.productId}
                </p>
              )}
            </div>

            {/* Warehouse */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <Warehouse size={16} />
                  Warehouse *
                </div>
              </label>
              <div className="relative">
                <select
                  value={formData.warehouseId}
                  onChange={(e) => handleChange('warehouseId', e.target.value)}
                  className={getInputClass('warehouseId')}
                  disabled={isEditing}
                >
                  <option value="">Select a warehouse...</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              {errors.warehouseId && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.warehouseId}
                </p>
              )}
            </div>
          </div>

          {/* Movement Type and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Movement Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Movement Type *
              </label>
              <div className="relative">
                <select
                  value={formData.movementType}
                  onChange={(e) => handleChange('movementType', e.target.value)}
                  className={getInputClass('movementType')}
                  disabled={isEditing}
                >
                  {Object.entries(isEditing ? MOVEMENT_TYPES : MANUAL_MOVEMENT_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              {errors.movementType && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.movementType}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="0.00"
                className={getInputClass('quantity')}
                disabled={isEditing}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit *
              </label>
              <div className="relative">
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={getInputClass('unit')}
                  disabled={isEditing}
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.unit}
                </p>
              )}
            </div>
          </div>

          {/* Reference Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reference Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reference Type
              </label>
              <div className="relative">
                <select
                  value={formData.referenceType}
                  onChange={(e) => handleChange('referenceType', e.target.value)}
                  className={getInputClass('referenceType')}
                  disabled={isEditing}
                >
                  {Object.entries(REFERENCE_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reference Number
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => handleChange('referenceNumber', e.target.value)}
                placeholder="INV-001, PO-001, etc."
                className={getInputClass('referenceNumber')}
                disabled={isEditing}
              />
            </div>

            {/* Movement Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Movement Date
              </label>
              <input
                type="date"
                value={formData.movementDate}
                onChange={(e) => handleChange('movementDate', e.target.value)}
                className={getInputClass('movementDate')}
                disabled={isEditing}
              />
            </div>
          </div>

          {/* Steel-specific fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Unit Cost */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost}
                onChange={(e) => handleChange('unitCost', e.target.value)}
                placeholder="0.00"
                className={getInputClass('unitCost')}
                disabled={isEditing}
              />
            </div>

            {/* Batch Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Batch Number
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => handleChange('batchNumber', e.target.value)}
                placeholder="Batch #"
                className={getInputClass('batchNumber')}
                disabled={isEditing}
              />
            </div>

            {/* Coil Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Coil Number
              </label>
              <input
                type="text"
                value={formData.coilNumber}
                onChange={(e) => handleChange('coilNumber', e.target.value)}
                placeholder="Coil #"
                className={getInputClass('coilNumber')}
                disabled={isEditing}
              />
            </div>

            {/* Heat Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Heat Number
              </label>
              <input
                type="text"
                value={formData.heatNumber}
                onChange={(e) => handleChange('heatNumber', e.target.value)}
                placeholder="Heat #"
                className={getInputClass('heatNumber')}
                disabled={isEditing}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about this movement..."
              className={getInputClass('notes')}
              disabled={isEditing}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/inventory/stock-movements')}
              className={`px-6 py-3 border rounded-lg transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isEditing ? 'Back to List' : 'Cancel'}
            </button>

            {!isEditing && (
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Movement
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementForm;
