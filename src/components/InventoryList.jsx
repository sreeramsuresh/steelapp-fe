import { useState, useEffect, useCallback } from 'react';
import {
  Plus as Add,
  Edit,
  Trash2 as Delete,
  Search,
  Package,
  TrendingUp,
  Warehouse,
  AlertTriangle,
  X,
  ChevronDown,
  Upload,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import {
  createInventoryItem,
  PRODUCT_TYPES,
  STEEL_GRADES,
  FINISHES,
} from '../types';
import InventoryUpload from './InventoryUpload';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const InventoryList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [productQuery, setProductQuery] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // ERP: Filter by inventory status
  const [formData, setFormData] = useState(() => {
    const item = createInventoryItem();
    return {
      ...item,
      quantity: '',
      pricePurchased: '',
      sellingPrice: '',
      landedCost: '',
      warehouseId: '',
      warehouseName: '',
      productId: null,
      productName: '',
      // ERP fields
      quantityOnHand: '',
      quantityReserved: '',
      status: 'AVAILABLE',
      batchNumber: '',
      coilNumber: '',
      heatNumber: '',
      bundleNumber: '',
      unitCost: '',
    };
  });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await inventoryService.getAllItems(params);
      setInventory(response.data || []);
    } catch (fetchError) {
      console.error('Error fetching inventory:', fetchError);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // inventoryService is a stable import

  const fetchWarehouses = useCallback(async () => {
    try {
      // Fetch real warehouses from API
      const response = await (
        await import('../services/api')
      ).apiClient.get('/warehouses');
      const warehouseList =
        response?.warehouses || response?.data?.warehouses || [];

      // Transform to match expected format
      const transformedWarehouses = warehouseList
        .filter((w) => w.isActive !== false) // Only show active warehouses
        .map((w) => ({
          id: w.id,
          name: w.name,
          code: w.code,
          city: w.city,
          isActive: w.isActive !== false,
        }));

      setWarehouses(transformedWarehouses);
    } catch (warehouseError) {
      console.warn('Failed to fetch warehouses:', warehouseError);
      // Fallback to empty array - user can still add inventory without warehouse
      setWarehouses([]);
    }
  }, []); // Intentionally empty - runs once on mount, uses dynamic import

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
  }, [fetchInventory, fetchWarehouses]);

  // Refetch when status filter changes
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        productId: item.productId || null,
        productName: item.productName || '',
        // ERP fields
        quantityOnHand: item.quantityOnHand || '',
        quantityReserved: item.quantityReserved || '',
        status: item.status || 'AVAILABLE',
        batchNumber: item.batchNumber || '',
        coilNumber: item.coilNumber || '',
        heatNumber: item.heatNumber || '',
        bundleNumber: item.bundleNumber || '',
        unitCost: item.unitCost || '',
      });
      setProductQuery('');
      setProductOptions([]);
    } else {
      setEditingItem(null);
      const newItem = createInventoryItem();
      setFormData({
        ...newItem,
        quantity: '',
        pricePurchased: '',
        sellingPrice: '',
        landedCost: '',
        warehouseId: '',
        warehouseName: '',
        productId: null,
        productName: '',
        // ERP fields
        quantityOnHand: '',
        quantityReserved: '',
        status: 'AVAILABLE',
        batchNumber: '',
        coilNumber: '',
        heatNumber: '',
        bundleNumber: '',
        unitCost: '',
      });
      setProductQuery('');
      setProductOptions([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    const item = createInventoryItem();
    setFormData({
      ...item,
      quantity: '',
      pricePurchased: '',
      sellingPrice: '',
      landedCost: '',
      warehouseId: '',
      warehouseName: '',
      productId: null,
      productName: '',
      // ERP fields
      quantityOnHand: '',
      quantityReserved: '',
      status: 'AVAILABLE',
      batchNumber: '',
      coilNumber: '',
      heatNumber: '',
      bundleNumber: '',
      unitCost: '',
    });
    setError('');
  };

  const handleSubmit = async () => {
    try {
      const itemData = {
        ...formData,
        quantity: formData.quantity === '' ? 0 : Number(formData.quantity),
        pricePurchased:
          formData.pricePurchased === '' ? 0 : Number(formData.pricePurchased),
        sellingPrice:
          formData.sellingPrice === '' ? 0 : Number(formData.sellingPrice),
        landedCost:
          formData.landedCost === '' ? 0 : Number(formData.landedCost),
      };

      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, itemData);
      } else {
        await inventoryService.createItem(itemData);
      }
      await fetchInventory();
      handleCloseDialog();
    } catch (saveError) {
      console.error('Error saving inventory item:', saveError);
      setError('Failed to save inventory item');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Inventory Item?',
      message:
        'Are you sure you want to delete this inventory item? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await inventoryService.deleteItem(id);
      await fetchInventory();
    } catch (deleteError) {
      console.error('Error deleting inventory item:', deleteError);
      setError('Failed to delete inventory item');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWarehouseChange = (warehouseId) => {
    const selectedWarehouse = warehouses.find(
      (w) => w.id.toString() === warehouseId,
    );
    setFormData((prev) => ({
      ...prev,
      warehouseId,
      warehouseName: selectedWarehouse
        ? `${selectedWarehouse.name} (${selectedWarehouse.city})`
        : '',
      location: selectedWarehouse
        ? `${selectedWarehouse.name} - ${selectedWarehouse.city}`
        : prev.location,
    }));
  };

  // Product catalog search with simple debounce
  useEffect(() => {
    if (!openDialog) return;
    if (!productQuery || productQuery.trim().length < 2) {
      setProductOptions([]);
      return;
    }
    setProductSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await productService.searchProducts(productQuery, {
          limit: 10,
        });
        const rows = res?.data || res?.products || res || [];
        setProductOptions(rows);
      } catch (e) {
        setProductOptions([]);
      } finally {
        setProductSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery, openDialog]);

  const handleSelectProduct = (product) => {
    if (!product) return;

    // Helper to extract thickness from product (may be in specifications or top-level)
    const getThickness = (p) => {
      if (p.thickness) return p.thickness;
      if (p.specifications?.thickness) return p.specifications.thickness;
      return '';
    };

    // Map ALL product fields to inventory form, following InvoiceForm.jsx pattern
    // Use fullName (with origin) as primary for stored productName to match dropdown display
    setFormData((prev) => ({
      ...prev,
      // Product catalog link
      productId: product.id,
      // Use displayName for user-facing display
      productName:
        product.displayName ||
        product.display_name ||
        product.uniqueName ||
        product.unique_name ||
        'N/A',
      // Product type from category
      productType: product.category || product.productType || prev.productType,
      // Steel specifications
      grade: product.grade || product.steelGrade || prev.grade,
      finish: product.finish || product.surfaceFinish || prev.finish,
      size: product.size || product.dimensions || prev.size,
      thickness: getThickness(product) || prev.thickness,
      // Additional pipe/tube fields
      sizeInch: product.sizeInch || product.size_inch || prev.sizeInch || '',
      od: product.od || prev.od || '',
      length: product.length || prev.length || '',
      // Commodity (SS, MS, etc.)
      commodity: product.commodity || prev.commodity || 'SS',
      // Description from product
      description:
        product.specifications || product.description || prev.description,
      // Pricing information
      pricePurchased:
        product.purchasePrice || product.costPrice || prev.pricePurchased,
      sellingPrice: product.sellingPrice || prev.sellingPrice,
      // Origin (country of origin)
      origin: product.origin || prev.origin,
    }));
    setProductQuery('');
    setProductOptions([]);
  };

  const clearLinkedProduct = () => {
    setFormData((prev) => ({ ...prev, productId: null, productName: '' }));
  };

  const filteredInventory = inventory
    // Note: We don&apos;t filter out items based on transit PO names anymore
    // because items can have the same name but different statuses
    // (one in transit, one actually in inventory from retain POs)

    // Apply local search filter
    .filter((item) =>
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateDescription = (item) => {
    const parts = [];
    if (item.productType) parts.push(`SS ${item.productType.toUpperCase()}`);
    if (item.grade)
      parts.push(item.grade.replace(/^(gr|ss)\s*/i, '').toUpperCase());
    if (item.finish) parts.push(`${item.finish} finish`);
    if (item.size) parts.push(item.size);
    if (item.thickness) parts.push(`${item.thickness}MM`);
    return parts.join(' ');
  };

  if (loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span
            className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Loading inventory...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        <div className="mb-6">
          <h1
            className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            📋 Inventory Management
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your steel inventory and track stock levels
          </p>
        </div>

        {error && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
              isDarkMode
                ? 'bg-red-900/20 border-red-700 text-red-300'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-4">
              <X size={16} />
            </button>
          </div>
        )}

        <div
          className={`p-4 mb-6 rounded-lg border ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex gap-4 items-center">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search
                  size={20}
                  className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors appearance-none pr-10 ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="BLOCKED">Blocked</option>
                <option value="SCRAP">Scrap</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronDown
                  size={16}
                  className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                />
              </div>
            </div>
            <button
              onClick={() => handleOpenDialog()}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Add size={16} />
              Add Item
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Upload size={16} />
              Upload Items
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Description
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Product Name
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Product Type
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Grade
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Finish
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Size
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Thickness
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Quantity
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Purchase Price
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Selling Price
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Landed Cost
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Warehouse & Location
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Batch/Heat No.
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Reserved Qty
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Available Qty
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
            >
              {filteredInventory.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.description || generateDescription(item)}
                    </div>
                    {(item.warehouseName || item.location) && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-300'
                            : 'bg-gray-100 border-gray-300 text-gray-700'
                        }`}
                      >
                        <Warehouse size={12} />
                        {item.warehouseName || item.location}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.productName ? (
                        <div>
                          <div className="font-medium text-teal-600 flex items-center gap-2">
                            {item.productName}
                            {/* Origin badge - show for non-UAE products */}
                            {item.origin && item.origin !== 'UAE' && (
                              <span
                                className={`px-1.5 py-0.5 text-xs rounded border font-medium ${
                                  isDarkMode
                                    ? 'bg-amber-900/30 text-amber-300 border-amber-700'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                              >
                                {item.origin}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            From Catalog
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          Not linked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.productType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-300 text-gray-700'
                      }`}
                    >
                      {item.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.finish && (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                          isDarkMode
                            ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                            : 'bg-purple-100 border-purple-300 text-purple-700'
                        }`}
                      >
                        {item.finish}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {item.size}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {item.thickness}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      // Consistent stock status logic
                      const qty = Number(item.quantity) || 0;
                      const minStock = Number(item.minStock) || 0;
                      const effectiveMin = minStock > 0 ? minStock : 5;

                      let stockStatus = 'normal';
                      if (qty <= 0) stockStatus = 'out_of_stock';
                      else if (qty <= effectiveMin) stockStatus = 'low';

                      const statusConfig = {
                        out_of_stock: {
                          bgClass: isDarkMode
                            ? 'bg-red-950/50 text-red-400'
                            : 'bg-red-100 text-red-800',
                          label: 'OUT OF STOCK',
                          icon: <AlertTriangle size={14} />,
                        },
                        low: {
                          bgClass: isDarkMode
                            ? 'bg-red-900/30 text-red-300'
                            : 'bg-red-100 text-red-800',
                          label: null, // show qty
                          icon: <AlertTriangle size={14} />,
                        },
                        normal: {
                          bgClass: isDarkMode
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-green-100 text-green-800',
                          label: null, // show qty
                          icon: <TrendingUp size={14} />,
                        },
                      };

                      const config = statusConfig[stockStatus];

                      return (
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.bgClass}`}
                          >
                            {config.icon}
                            {config.label || qty}
                          </span>
                          <div
                            className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            Min: {minStock}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.pricePurchased
                        ? formatCurrency(item.pricePurchased)
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold text-green-600`}>
                      {item.sellingPrice
                        ? formatCurrency(item.sellingPrice)
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {item.landedCost ? formatCurrency(item.landedCost) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {item.warehouseName && (
                        <div
                          className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {item.warehouseName}
                        </div>
                      )}
                      {item.location && (
                        <div className="text-xs">{item.location}</div>
                      )}
                      {!item.warehouseName && !item.location && '-'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.status === 'AVAILABLE'
                          ? isDarkMode
                            ? 'bg-green-900/30 text-green-300 border-green-700'
                            : 'bg-green-100 text-green-800 border-green-200'
                          : item.status === 'RESERVED'
                            ? isDarkMode
                              ? 'bg-blue-900/30 text-blue-300 border-blue-700'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                            : item.status === 'BLOCKED'
                              ? isDarkMode
                                ? 'bg-red-900/30 text-red-300 border-red-700'
                                : 'bg-red-100 text-red-800 border-red-200'
                              : isDarkMode
                                ? 'bg-gray-900/30 text-gray-300 border-gray-700'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {item.status || 'AVAILABLE'}
                    </span>
                  </td>

                  {/* Batch/Heat Numbers */}
                  <td className="px-6 py-4">
                    <div
                      className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.batchNumber && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Batch:</span>
                          <span className="font-medium">
                            {item.batchNumber}
                          </span>
                        </div>
                      )}
                      {item.heatNumber && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Heat:</span>
                          <span className="font-medium">{item.heatNumber}</span>
                        </div>
                      )}
                      {item.coilNumber && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          Coil: {item.coilNumber}
                        </div>
                      )}
                      {!item.batchNumber &&
                        !item.heatNumber &&
                        !item.coilNumber && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                    </div>
                  </td>

                  {/* Reserved Quantity */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {item.quantityReserved > 0 ? (
                        <span className="text-blue-600">
                          {item.quantityReserved.toFixed(3)} {item.unit || 'KG'}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          0.000 {item.unit || 'KG'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Available Quantity */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      <span className="text-green-600">
                        {item.quantityAvailable.toFixed(3)} {item.unit || 'KG'}
                      </span>
                    </div>
                    {item.isLowStock && (
                      <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                        <AlertTriangle size={12} />
                        Low Stock
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleOpenDialog(item)}
                        className={`p-2 rounded transition-colors ${
                          isDarkMode
                            ? 'hover:bg-gray-700 text-blue-400'
                            : 'hover:bg-gray-100 text-blue-600'
                        }`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`p-2 rounded transition-colors ${
                          isDarkMode
                            ? 'hover:bg-gray-700 text-red-400'
                            : 'hover:bg-gray-100 text-red-600'
                        }`}
                        title="Delete"
                      >
                        <Delete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                          isDarkMode
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Package size={32} />
                      </div>
                      <h3
                        className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        No inventory items found
                      </h3>
                      <p
                        className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {searchTerm
                          ? 'Try adjusting your search term'
                          : 'Add your first inventory item to get started'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => handleOpenDialog()}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <Add size={16} />
                          Add Item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
                isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
              }`}
            >
              <div
                className={`p-6 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <h3
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {/* Product Catalog Link */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="productSearch"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Product (Catalog)
                    </label>
                    {formData.productId ? (
                      <div
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      >
                        <div>
                          <div className="font-medium text-teal-500">
                            {formData.productName}
                          </div>
                          <div
                            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            Linked to catalog
                          </div>
                        </div>
                        <button
                          onClick={clearLinkedProduct}
                          className={`px-3 py-1 rounded border ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                        >
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          id="productSearch"
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Search and select a product to link (optional)"
                          className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                        {productSearching && (
                          <div
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            Searching...
                          </div>
                        )}
                        {productOptions.length > 0 && (
                          <div
                            className={`absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border shadow ${isDarkMode ? 'bg-[#1E2328] border-gray-700' : 'bg-white border-gray-200'}`}
                          >
                            {productOptions.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                className={`w-full text-left px-4 py-2 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                              >
                                <div
                                  className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {p.displayName ||
                                    p.display_name ||
                                    p.uniqueName ||
                                    p.unique_name ||
                                    p.name}
                                </div>
                                <div
                                  className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                  {p.origin ? `${p.origin} • ` : ''}
                                  {p.category} {p.grade ? `• ${p.grade}` : ''}{' '}
                                  {p.size ? `• ${p.size}` : ''}{' '}
                                  {p.thickness ? `• ${p.thickness}mm` : ''}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p
                      className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Linking helps show the exact product name in Inventory and
                      enables catalog-based analytics.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="description"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder="Auto-generated if empty"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="productType"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Product Type
                    </label>
                    <div className="relative">
                      <select
                        id="productType"
                        value={formData.productType}
                        onChange={(e) =>
                          handleInputChange('productType', e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Product Type</option>
                        {PRODUCT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown
                          size={20}
                          className={
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="grade"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Grade
                    </label>
                    <input
                      type="text"
                      id="grade"
                      value={formData.grade}
                      onChange={(e) =>
                        handleInputChange('grade', e.target.value)
                      }
                      placeholder="e.g., 304, 316L"
                      list="steel-grades"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <datalist id="steel-grades">
                      {STEEL_GRADES.map((grade) => (
                        <option key={grade} value={grade} />
                      ))}
                    </datalist>
                    <p
                      className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Select from list or type custom grade
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="finish"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Finish
                    </label>
                    <input
                      type="text"
                      id="finish"
                      value={formData.finish}
                      onChange={(e) =>
                        handleInputChange(
                          'finish',
                          e.target.value.toUpperCase(),
                        )
                      }
                      placeholder="e.g., Mirror, HL, 2B"
                      list="finishes"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <datalist id="finishes">
                      {FINISHES.map((finish) => (
                        <option key={finish} value={finish} />
                      ))}
                    </datalist>
                    <p
                      className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Select from list or type custom finish
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="size"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Size
                    </label>
                    <input
                      type="text"
                      id="size"
                      value={formData.size}
                      onChange={(e) =>
                        handleInputChange('size', e.target.value)
                      }
                      placeholder="e.g., 4x8"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="thickness"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Thickness
                    </label>
                    <input
                      type="text"
                      id="thickness"
                      value={formData.thickness}
                      onChange={(e) =>
                        handleInputChange('thickness', e.target.value)
                      }
                      placeholder="e.g., 0.8, 1.2"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quantity"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      value={formData.quantity || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'quantity',
                          e.target.value === ''
                            ? ''
                            : parseInt(e.target.value) || '',
                        )
                      }
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="minStock"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Minimum Stock
                    </label>
                    <input
                      type="number"
                      id="minStock"
                      value={formData.minStock || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'minStock',
                          e.target.value === ''
                            ? ''
                            : parseInt(e.target.value) || '',
                        )
                      }
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pricePurchased"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Purchase Price
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        د.إ
                      </span>
                      <input
                        type="number"
                        id="pricePurchased"
                        value={formData.pricePurchased || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'pricePurchased',
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value) || '',
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="sellingPrice"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Selling Price
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        د.إ
                      </span>
                      <input
                        type="number"
                        id="sellingPrice"
                        value={formData.sellingPrice || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'sellingPrice',
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value) || '',
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="landedCost"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Landed Cost
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        د.إ
                      </span>
                      <input
                        type="number"
                        id="landedCost"
                        value={formData.landedCost || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'landedCost',
                            e.target.value === ''
                              ? ''
                              : parseFloat(e.target.value) || '',
                          )
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="warehouseId"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Warehouse
                    </label>
                    <div className="relative">
                      <select
                        id="warehouseId"
                        value={formData.warehouseId}
                        onChange={(e) => handleWarehouseChange(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown
                          size={20}
                          className={
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="location"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Specific Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange('location', e.target.value)
                      }
                      placeholder="e.g., Section A, Row 3, Shelf 2"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* ERP Fields Section */}
                  <div className="col-span-2">
                    <h3
                      className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      📊 ERP Inventory Management
                    </h3>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label
                      htmlFor="status"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status || 'AVAILABLE'}
                      onChange={(e) =>
                        handleInputChange('status', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="SCRAP">Scrap</option>
                    </select>
                  </div>

                  {/* Quantity On Hand */}
                  <div>
                    <label
                      htmlFor="quantityOnHand"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Quantity On Hand (KG)
                    </label>
                    <input
                      type="number"
                      id="quantityOnHand"
                      step="0.001"
                      value={formData.quantityOnHand}
                      onChange={(e) =>
                        handleInputChange('quantityOnHand', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0.000"
                    />
                  </div>

                  {/* Quantity Reserved */}
                  <div>
                    <label
                      htmlFor="quantityReserved"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Quantity Reserved (KG)
                    </label>
                    <input
                      type="number"
                      id="quantityReserved"
                      step="0.001"
                      value={formData.quantityReserved}
                      onChange={(e) =>
                        handleInputChange('quantityReserved', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0.000"
                    />
                  </div>

                  {/* Unit Cost */}
                  <div>
                    <label
                      htmlFor="unitCost"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Unit Cost (AED/KG)
                    </label>
                    <input
                      type="number"
                      id="unitCost"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) =>
                        handleInputChange('unitCost', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Batch Number */}
                  <div>
                    <label
                      htmlFor="batchNumber"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Batch Number
                    </label>
                    <input
                      type="text"
                      id="batchNumber"
                      value={formData.batchNumber}
                      onChange={(e) =>
                        handleInputChange('batchNumber', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="BATCH-2025-001"
                    />
                  </div>

                  {/* Coil Number */}
                  <div>
                    <label
                      htmlFor="coilNumber"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Coil Number
                    </label>
                    <input
                      type="text"
                      id="coilNumber"
                      value={formData.coilNumber}
                      onChange={(e) =>
                        handleInputChange('coilNumber', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="COIL-2025-001"
                    />
                  </div>

                  {/* Heat Number */}
                  <div>
                    <label
                      htmlFor="heatNumber"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Heat Number (Mill Certificate)
                    </label>
                    <input
                      type="text"
                      id="heatNumber"
                      value={formData.heatNumber}
                      onChange={(e) =>
                        handleInputChange('heatNumber', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="HEAT-2025-001"
                    />
                  </div>

                  {/* Bundle Number */}
                  <div>
                    <label
                      htmlFor="bundleNumber"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Bundle Number
                    </label>
                    <input
                      type="text"
                      id="bundleNumber"
                      value={formData.bundleNumber}
                      onChange={(e) =>
                        handleInputChange('bundleNumber', e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="BUNDLE-2025-001"
                    />
                  </div>
                </div>
              </div>
              <div
                className={`p-6 border-t flex justify-end gap-3 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={handleCloseDialog}
                  className={`px-6 py-3 border rounded-lg transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Upload Modal */}
        {showUploadModal && (
          <InventoryUpload
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={() => {
              setShowUploadModal(false);
              fetchInventory();
            }}
          />
        )}

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

export default InventoryList;
