import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, X, AlertCircle, ChevronDown } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  formatCurrency,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotal,
  generatePONumber,
} from "../utils/invoiceUtils";
import { purchaseOrdersAPI } from "../services/api";
import { stockMovementService } from "../services/stockMovementService";
import { inventoryService } from "../services/inventoryService";
import { productService } from "../services/productService";
import { purchaseOrderSyncService } from "../services/purchaseOrderSyncService";
import { PRODUCT_TYPES, STEEL_GRADES, FINISHES } from "../types";
import { useApiData } from "../hooks/useApi";
import { supplierService } from "../services/supplierService";
import { notificationService } from "../services/notificationService";

const Autocomplete = ({
  options = [],
  value,
  onChange,
  onInputChange,
  inputValue,
  placeholder,
  label,
  disabled = false,
  renderOption,
  noOptionsText = "No options",
  className = "",
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Lightweight fuzzy match: token-based includes with typo tolerance (edit distance <= 1)
  const norm = (s) => (s || '').toString().toLowerCase().trim();
  const ed1 = (a, b) => {
    // Early exits
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return 2; // too far
    // DP edit distance capped at 1 for speed
    let dpPrev = new Array(lb + 1);
    let dpCurr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dpPrev[j] = j;
    for (let i = 1; i <= la; i++) {
      dpCurr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lb; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dpCurr[j] = Math.min(
          dpPrev[j] + 1,            // deletion
          dpCurr[j - 1] + 1,        // insertion
          dpPrev[j - 1] + cost      // substitution
        );
      }
      // swap
      const tmp = dpPrev; dpPrev = dpCurr; dpCurr = tmp;
    }
    return dpPrev[lb];
  };

  const tokenMatch = (token, label) => {
    const t = norm(token);
    const l = norm(label);
    if (!t) return true;
    if (l.includes(t)) return true;
    // fuzzy: split label into words and check any word within edit distance 1
    const words = l.split(/\s+/);
    for (const w of words) {
      if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
    }
    return false;
  };

  const fuzzyFilter = (opts, query) => {
    const q = norm(query);
    if (!q) return opts;
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const o of opts) {
      const label = norm(o.label || o.name || '');
      if (!label) continue;
      let ok = true;
      let score = 0;
      for (const t of tokens) {
        if (!tokenMatch(t, label)) { ok = false; break; }
        // basic score: shorter distance preferred
        const idx = label.indexOf(norm(t));
        score += idx >= 0 ? 0 : 1; // penalize fuzzy matches
      }
      if (ok) scored.push({ o, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.map(s => s.o);
  };

  useEffect(() => {
    if (inputValue) {
      const filtered = fuzzyFilter(options, inputValue);
      setFilteredOptions(filtered.slice(0, 20));
    } else {
      setFilteredOptions(options);
    }
  }, [options, inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
  };

  const updateDropdownPosition = () => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;

      dropdown.style.position = "fixed";
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      dropdown.style.minWidth = `${inputRect.width}px`;
      dropdown.style.width = 'auto';
      dropdown.style.maxWidth = '90vw';
      dropdown.style.zIndex = "9999";
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            inputRef.current && !inputRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue || ""}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`border rounded-md shadow-lg max-h-60 overflow-y-auto ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-300'
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || option.name || index}
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-white border-gray-700"
                    : "hover:bg-gray-50 text-gray-900 border-gray-100"
                }`}
                onMouseDown={() => handleOptionSelect(option)}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              className={`px-3 py-2 text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {noOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [purchaseOrder, setPurchaseOrder] = useState({
    poNumber: generatePONumber(), // Fallback PO number generation
    supplierName: "",
    supplierEmail: "",
    supplierPhone: "",
    supplierAddress: "",
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    status: "draft",
    stockStatus: "retain", // Default to 'retain'
    items: [
      {
        productType: "",
        name: "", // This will be same as productType for consistency
        grade: "",
        thickness: "",
        size: "",
        finish: "",
        specification: "", // Keep for backward compatibility
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    notes: "",
    terms: "",
    currency: 'AED',
    supplierContactName: '',
    supplierContactEmail: '',
    supplierContactPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableProducts, setAvailableProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchInputs, setSearchInputs] = useState({});
  
  // Normalize date value for <input type="date">
  const toDateInput = (d) => {
    if (!d) return '';
    try {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0,10);
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '';
      return dt.toISOString().slice(0,10);
    } catch {
      return '';
    }
  };
  // Suppliers
  const { data: suppliersData, loading: loadingSuppliers } = useApiData(
    () => supplierService.getSuppliers({ status: 'active' }),
    []
  );

  // Product options for autocomplete
  const productOptions = useMemo(() => {
    return (availableProducts || []).map((product) => ({
      ...product,
      label: product.name,
      subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${
        product.selling_price || 0
      }`,
    }));
  }, [availableProducts]);

  const searchOptions = useMemo(() => {
    const list = searchInputs?.__results || [];
    return list.map((product) => ({
      ...product,
      label: product.name,
      subtitle: `${product.category} • ${product.grade || "N/A"} • د.إ${
        product.selling_price || 0
      }`,
    }));
  }, [searchInputs.__results]);

  // Load existing purchase order when editing
  useEffect(() => {
    const loadExisting = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await purchaseOrdersAPI.getById(id);
        // Map backend fields to form model
        setPurchaseOrder(prev => ({
          ...prev,
          poNumber: data.po_number || prev.poNumber,
          supplierName: data.supplier_name || '',
          supplierEmail: data.supplier_email || '',
          supplierPhone: data.supplier_phone || '',
          supplierAddress: data.supplier_address || '',
          poDate: toDateInput(data.po_date) || prev.poDate,
          expectedDeliveryDate: toDateInput(data.expected_delivery_date) || '',
          status: data.status || 'draft',
          stockStatus: data.stock_status || 'retain',
          currency: data.currency || prev.currency,
          supplierContactName: data.supplier_contact_name || '',
          supplierContactEmail: data.supplier_contact_email || data.supplier_email || '',
          supplierContactPhone: data.supplier_contact_phone || data.supplier_phone || '',
          items: Array.isArray(data.items) ? data.items.map(it => ({
            productType: it.name || '',
            name: it.name || '',
            grade: '',
            thickness: '',
            size: '',
            finish: '',
            specification: it.specification || '',
            quantity: it.quantity || 0,
            rate: it.rate || 0,
            amount: it.amount || 0,
          })) : prev.items,
          subtotal: data.subtotal || 0,
          vatAmount: data.gst_amount || 0,
          total: data.total || 0,
          notes: data.notes || '',
          terms: data.terms || '',
        }));
        
        // Set warehouse if available
        if (data.warehouse_id) {
          setSelectedWarehouse(data.warehouse_id.toString());
        }
      } catch (e) {
        notificationService.error('Failed to load purchase order');
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [id]);

  // Fetch available products and warehouses
  useEffect(() => {
    fetchAvailableProducts();
    fetchWarehouses();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const response = await productService.getProducts();
      const products = response?.products || [];
      setAvailableProducts(products);
    } catch (error) {
      console.warn('Failed to fetch products:', error);
      // Fallback to static product types if service fails
      setAvailableProducts(PRODUCT_TYPES.map(type => ({ id: type, name: type, category: type })));
    }
  };

  const fetchWarehouses = async () => {
    try {
      // Sample warehouse data matching the warehouse management component
      const sampleWarehouses = [
        { id: 1, name: 'Main Warehouse', city: 'Sharjah', isActive: true },
        { id: 2, name: 'Dubai Branch Warehouse', city: 'Dubai', isActive: true },
        { id: 3, name: 'Abu Dhabi Warehouse', city: 'Abu Dhabi', isActive: true }
      ];
      setWarehouses(sampleWarehouses.filter(w => w.isActive));
    } catch (error) {
      console.warn('Failed to fetch warehouses:', error);
    }
  };

  // Get next PO number from server (only for new purchase orders)
  const { data: nextPOData } = useApiData(
    () => purchaseOrdersAPI.getNextNumber(),
    [],
    !id  // Only fetch when creating new PO (not editing)
  );

  // Update PO number when server data is available
  useEffect(() => {
    if (nextPOData && nextPOData.next_po_number && !id) {
      setPurchaseOrder((prev) => ({
        ...prev,
        poNumber: nextPOData.next_po_number,
      }));
    }
  }, [nextPOData, id]);

  // Try to map existing PO supplier to a supplier record by name (best-effort)
  useEffect(() => {
    const list = suppliersData?.suppliers || [];
    if (list.length && purchaseOrder.supplierName && !selectedSupplierId) {
      const match = list.find(s => s.name && s.name.toLowerCase() === purchaseOrder.supplierName.toLowerCase());
      if (match) setSelectedSupplierId(String(match.id));
    }
  }, [suppliersData, purchaseOrder.supplierName, selectedSupplierId]);

  const handleInputChange = (field, value) => {
    setPurchaseOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSupplierSelect = (supplierId) => {
    const suppliers = suppliersData?.suppliers || [];
    const found = suppliers.find((s) => String(s.id) === String(supplierId));
    if (!found) {
      setPurchaseOrder((prev) => ({ ...prev, supplierName: '', supplierEmail: '', supplierPhone: '', supplierAddress: '' }));
      return;
    }
    setPurchaseOrder((prev) => ({
      ...prev,
      supplierName: found.name || '',
      supplierEmail: found.email || '',
      supplierPhone: found.phone || '',
      supplierAddress: found.address || found.company || '',
      terms: found.payment_terms || prev.terms || '',
      currency: found.default_currency || prev.currency || 'AED',
      supplierContactName: found.contact_name || '',
      supplierContactEmail: found.contact_email || found.email || '',
      supplierContactPhone: found.contact_phone || found.phone || ''
    }));
  };

  // Helper function to extract thickness from product specs or size string
  const getThickness = (product) => {
    try {
      const cat = (product?.category || '').toString().toLowerCase();
      const isPipe = /pipe/.test(cat);
      const specThk = product?.specifications?.thickness || product?.specifications?.Thickness;
      if (specThk && String(specThk).trim()) return String(specThk).trim();
      if (isPipe) return ""; // avoid deriving thickness from pipe size
      const sizeStr = product?.size ? String(product.size) : "";
      const mmMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(mm)\b/i);
      if (mmMatch) return `${mmMatch[1]}mm`;
      const xParts = sizeStr.split(/x|X|\*/).map((s) => s.trim()).filter(Boolean);
      if (xParts.length >= 2) {
        const last = xParts[xParts.length - 1];
        const numMatch = last.match(/\d+(?:\.\d+)?/);
        if (numMatch) return `${numMatch[0]}mm`;
      }
    } catch {}
    return "";
  };

  const handleProductSelect = (index, selectedProductName) => {
    // Find the full product object from availableProducts
    const product = availableProducts.find(p => p.name === selectedProductName);
    
    if (product && typeof product === "object") {
      const updatedItems = [...purchaseOrder.items];
      
      // Try multiple possible field names for finish and thickness
      const rawFinish = product.finish || product.surface_finish || product.finishType || "";
      
      // Match finish with predefined FINISHES options (case-insensitive)
      const finish = (() => {
        if (!rawFinish) return "";
        const rawFinishLower = rawFinish.toLowerCase();
        const matchedFinish = FINISHES.find(f => f.toLowerCase() === rawFinishLower);
        return matchedFinish || rawFinish; // Use matched finish or original if no match
      })();
      
      const thickness = product.thickness || product.thick || getThickness(product);
      
      updatedItems[index] = {
        ...updatedItems[index],
        productType: product.name,
        name: product.name,
        grade: product.grade || product.steel_grade || "",
        finish: finish,
        size: product.size || product.dimensions || "",
        thickness: thickness,
        specification: product.specification || product.description || "",
        rate: product.selling_price || product.purchase_price || product.price || 0,
      };

      // Calculate amount if quantity exists
      if (updatedItems[index].quantity) {
        updatedItems[index].amount = updatedItems[index].quantity * (product.selling_price || product.purchase_price || 0);
      }

      // Recalculate totals
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = subtotal * 0.05; // 5% TRN
      const total = subtotal + vatAmount;

      setPurchaseOrder((prev) => ({
        ...prev,
        items: updatedItems,
        subtotal,
        vatAmount,
        total,
      }));

      // Clear search input for this row
      setSearchInputs((prev) => ({ ...prev, [index]: "" }));
    }
  };

  const searchTimerRef = useRef(null);

  const handleSearchInputChange = useCallback((index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Update the item name immediately for responsive typing
    setPurchaseOrder((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        name: value,
        productId: null, // Clear product ID when typing custom name
      };
      return {
        ...prev,
        items: newItems,
      };
    });

    // Debounced search
    clearTimeout(searchTimerRef.current);
    const term = (value || '').trim();
    try {
      searchTimerRef.current = setTimeout(async () => {
        if (!term) {
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
          return;
        }
        try {
          const resp = await productService.getProducts({ search: term, limit: 20 });
          setSearchInputs((prev) => ({ ...prev, __results: resp?.products || [] }));
        } catch (err) {
          console.warn('Product search failed:', err);
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
        }
      }, 300);
    } catch {}
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const quantity =
        field === "quantity"
          ? parseFloat(value) || 0
          : updatedItems[index].quantity;
      const rate =
        field === "rate" ? parseFloat(value) || 0 : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }

    setPurchaseOrder((prev) => {
      const newPO = {
        ...prev,
        items: updatedItems,
      };

      // Recalculate totals
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = subtotal * 0.05; // 5% TRN
      const total = subtotal + vatAmount;

      return {
        ...newPO,
        subtotal,
        vatAmount,
        total,
      };
    });
  };

  const addItem = () => {
    setPurchaseOrder((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productType: "",
          name: "",
          grade: "",
          thickness: "",
          size: "",
          finish: "",
          specification: "",
          quantity: 0,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (purchaseOrder.items.length > 1) {
      const updatedItems = purchaseOrder.items.filter((_, i) => i !== index);
      setPurchaseOrder((prev) => {
        const newPO = {
          ...prev,
          items: updatedItems,
        };

        // Recalculate totals
        const subtotal = calculateSubtotal(updatedItems);
        const vatAmount = subtotal * 0.05; // 5% TRN
        const total = subtotal + vatAmount;

        return {
          ...newPO,
          subtotal,
          vatAmount,
          total,
        };
      });
    }
  };

  const handleSubmit = async (status = "draft") => {
    setLoading(true);
    try {
      const poData = { ...purchaseOrder, status };
      
      // Basic validation
      if (!poData.supplierName) {
        notificationService.warning('Supplier name is required');
        setLoading(false);
        return;
      }
      
      if (!poData.items || poData.items.length === 0) {
        notificationService.warning('At least one item is required');
        setLoading(false);
        return;
      }
      
      // Validate that at least one item has required fields
      const validItems = poData.items.filter(item => 
        (item.productType || item.name) && item.quantity > 0
      );
      
      if (validItems.length === 0) {
        notificationService.warning('At least one item must have a product type and quantity greater than 0');
        setLoading(false);
        return;
      }
      
      // Validate warehouse selection
      if (!selectedWarehouse) {
        notificationService.warning('Please select a destination warehouse');
        setLoading(false);
        return;
      }

      // Get warehouse details
      const selectedWarehouseDetails = warehouses.find(w => w.id.toString() === selectedWarehouse);

      // Transform data to match backend expectations (snake_case)
  const transformedData = {
        po_number: poData.poNumber,
        supplier_name: poData.supplierName,
        supplier_email: poData.supplierEmail || null,
        supplier_phone: poData.supplierPhone || null,
        supplier_address: poData.supplierAddress || null,
        po_date: poData.poDate,
        expected_delivery_date: poData.expectedDeliveryDate || null,
    status: poData.status,
        stock_status: poData.stockStatus,
        currency: poData.currency || 'AED',
        payment_terms: poData.terms || null,
        supplier_contact_name: poData.supplierContactName || null,
        supplier_contact_email: poData.supplierContactEmail || null,
        supplier_contact_phone: poData.supplierContactPhone || null,
        warehouse_id: selectedWarehouse,
        warehouse_name: selectedWarehouseDetails ? `${selectedWarehouseDetails.name} (${selectedWarehouseDetails.city})` : '',
        notes: poData.notes || null,
        terms: poData.terms || null,
        subtotal: parseFloat(poData.subtotal) || 0,
        gst_amount: parseFloat(poData.vatAmount) || 0,
        total: parseFloat(poData.total) || 0,
        // Transform items array
        items: poData.items.map(item => ({
          product_type: item.productType || item.name || '',
          name: item.name || item.productType || '',
          grade: item.grade || null,
          thickness: item.thickness || null,
          size: item.size || null,
          finish: item.finish || null,
          specification: item.specification || null,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0
        }))
      };
      
      // Log the full data structure for debugging
      console.log('Submitting PO data:', JSON.stringify(transformedData, null, 2));
      
      let savedPO;
      if (id) {
        // Update existing purchase order
        savedPO = await purchaseOrdersAPI.update(id, transformedData);
      } else {
        // Create new purchase order
        savedPO = await purchaseOrdersAPI.create(transformedData);
      }
      
  // If stock status is received, trigger inventory creation via the stock-status endpoint
  if (poData.stockStatus === "received") {
        try {
          const stockStatusResponse = await (await import('../services/api')).apiClient.patch(`/purchase-orders/${savedPO.id}/stock-status`, {
            stock_status: 'received'
          });
          console.log('Stock status updated and inventory created:', stockStatusResponse);
          
          if (stockStatusResponse.inventory_created) {
            notificationService.success('Inventory items created successfully!');
          }
        } catch (stockError) {
          console.error('Error updating stock status:', stockError);
          notificationService.warning('Purchase order saved but inventory creation failed. Please check the inventory manually.');
        }
      }
      
      // Show success notification
      const action = id ? 'updated' : 'created';
      notificationService.success(`Purchase order ${action} successfully!`);
      
      navigate("/purchase-orders");
    } catch (error) {
      console.error("Error saving purchase order:", error);
      const action = id ? 'update' : 'create';
      
      // Extract more detailed error message
      let errorMessage = 'Unknown error';
      const errorData = error.response?.data;
      
      // Check for validation errors array
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Join all error messages
        errorMessage = errorData.errors.map(err => 
          typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err)
        ).join(', ');
        
        // Show each error as a separate notification
        errorData.errors.forEach(err => {
          const msg = typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err);
          notificationService.error(msg);
        });
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Detailed error:', errorData);
      console.log('Error messages:', errorData?.errors);
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className="container mx-auto px-0">
        <div className={`p-4 sm:p-6 mx-0 rounded-none sm:rounded-2xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          {/* Header */}
          <div className={`sticky top-0 z-10 flex justify-between items-center mb-6 p-4 -m-4 sm:-m-6 sm:p-6 rounded-t-2xl border-b ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/purchase-orders")}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🛒 {id ? "Edit" : "Create"} Purchase Order
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={loading}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit("pending")}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save size={18} />
                Submit PO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            {/* PO Details */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Purchase Order Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={purchaseOrder.poNumber}
                    onChange={(e) => handleInputChange("poNumber", e.target.value)}
                    placeholder="PO-2024-001"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PO Date
                  </label>
                  <input
                    type="date"
                    value={purchaseOrder.poDate}
                    onChange={(e) => handleInputChange("poDate", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={purchaseOrder.expectedDeliveryDate}
                    onChange={(e) => handleInputChange("expectedDeliveryDate", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Supplier Details */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Supplier Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select Supplier
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e)=> { setSelectedSupplierId(e.target.value); handleSupplierSelect(e.target.value); }}
                    disabled={loadingSuppliers}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select a supplier</option>
                    {(suppliersData?.suppliers || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} {s.email ? `- ${s.email}` : ''}</option>
                    ))}
                  </select>
                </div>
                {purchaseOrder.supplierName && (
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Selected Supplier:
                    </h4>
                    <div className={`space-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <p>
                        <span className="font-medium">Name:</span> {purchaseOrder.supplierName}
                      </p>
                      {purchaseOrder.supplierEmail && (
                        <p>
                          <span className="font-medium">Email:</span> {purchaseOrder.supplierEmail}
                        </p>
                      )}
                      {purchaseOrder.supplierPhone && (
                        <p>
                          <span className="font-medium">Phone:</span> {purchaseOrder.supplierPhone}
                        </p>
                      )}
                      {purchaseOrder.supplierAddress && (
                        <p>
                          <span className="font-medium">Address:</span> {purchaseOrder.supplierAddress}
                        </p>
                      )}
                      {(purchaseOrder.terms || purchaseOrder.currency) && (
                        <p>
                          <span className="font-medium">Terms/Currency:</span> {[
                            purchaseOrder.terms,
                            purchaseOrder.currency,
                          ].filter(Boolean).join(' • ')}
                        </p>
                      )}
                      {(purchaseOrder.supplierContactName || purchaseOrder.supplierContactEmail || purchaseOrder.supplierContactPhone) && (
                        <p>
                          <span className="font-medium">Contact:</span> {[
                            purchaseOrder.supplierContactName,
                            purchaseOrder.supplierContactEmail,
                            purchaseOrder.supplierContactPhone,
                          ].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseOrder.supplierName}
                    onChange={(e) => handleInputChange("supplierName", e.target.value)}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={purchaseOrder.supplierContactName}
                      onChange={(e) => handleInputChange("supplierContactName", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={purchaseOrder.supplierContactEmail}
                      onChange={(e) => handleInputChange("supplierContactEmail", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={purchaseOrder.supplierContactPhone}
                      onChange={(e) => handleInputChange("supplierContactPhone", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      value={purchaseOrder.terms}
                      onChange={(e) => handleInputChange("terms", e.target.value)}
                      placeholder="e.g., Net 30"
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Currency
                    </label>
                    <select
                      value={purchaseOrder.currency}
                      onChange={(e) => handleInputChange("currency", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={purchaseOrder.supplierEmail}
                    onChange={(e) => handleInputChange("supplierEmail", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={purchaseOrder.supplierPhone}
                    onChange={(e) => handleInputChange("supplierPhone", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={purchaseOrder.supplierAddress}
                    onChange={(e) => handleInputChange("supplierAddress", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className={`p-6 mt-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Delivery Warehouse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select Warehouse *
                </label>
                <div className="relative">
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Destination Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Items will be delivered to this warehouse
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stock Status
                </label>
                <div className="relative">
                  <select
                    value={purchaseOrder.stockStatus}
                    onChange={(e) => handleInputChange("stockStatus", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="retain">Retain (To be received)</option>
                    <option value="transit">In Transit</option>
                    <option value="received">Received (Add to Inventory)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {purchaseOrder.stockStatus === 'transit' ? 'Items will show as pending in stock movement' : 
                   purchaseOrder.stockStatus === 'received' ? 'Items are received and will be added to inventory' :
                   'Items are ordered but not yet received'}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={`p-6 mt-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Items
              </h2>
              <button
                onClick={addItem}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Product Type
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Grade
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Thickness
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Size
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Finish
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Qty
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Rate
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Amount
                    </th>
                    <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {purchaseOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="w-48">
                          <Autocomplete
                            options={(searchInputs[index] ? (searchOptions.length ? searchOptions : productOptions) : productOptions)}
                            value={
                              item.productId
                                ? productOptions.find(
                                    (p) => p.id === item.productId
                                  )
                                : null
                            }
                            inputValue={
                              searchInputs[index] || item.name || ""
                            }
                            onInputChange={(event, newInputValue) => {
                              handleSearchInputChange(index, newInputValue);
                            }}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleProductSelect(index, newValue.name);
                              }
                            }}
                            placeholder="Search products..."
                            disabled={loading}
                            renderOption={(option) => (
                              <div>
                                <div className="font-medium">{option.name}</div>
                                <div
                                  className={`text-sm ${
                                    isDarkMode ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {option.subtitle}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={item.grade}
                            onChange={(e) => handleItemChange(index, "grade", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Grade</option>
                            {STEEL_GRADES.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.thickness}
                          onChange={(e) => handleItemChange(index, "thickness", e.target.value)}
                          placeholder="e.g., 12mm"
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(index, "size", e.target.value)}
                          placeholder="e.g., 4x8"
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={item.finish}
                            onChange={(e) => handleItemChange(index, "finish", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Finish</option>
                            {FINISHES.map((finish) => (
                              <option key={finish} value={finish}>
                                {finish}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(item.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={purchaseOrder.items.length === 1}
                          className={`p-2 rounded transition-colors ${
                            purchaseOrder.items.length === 1
                              ? 'opacity-50 cursor-not-allowed'
                              : isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between mb-2">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Subtotal:
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(purchaseOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    TRN (5%):
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(purchaseOrder.vatAmount)}
                  </span>
                </div>
                <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                <div className="flex justify-between">
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total:
                  </span>
                  <span className={`text-lg font-bold text-teal-600`}>
                    {formatCurrency(purchaseOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Notes
              </h2>
              <textarea
                rows={4}
                value={purchaseOrder.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment as per payment terms
              </h2>
              <textarea
                rows={4}
                value={purchaseOrder.terms}
                onChange={(e) => handleInputChange("terms", e.target.value)}
                placeholder="Terms and conditions..."
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
