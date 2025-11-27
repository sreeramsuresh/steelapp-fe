import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, X, AlertCircle, ChevronDown, AlertTriangle, Loader2, Eye, Pin, PinOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  formatCurrency,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotal,
  generatePONumber,
} from '../utils/invoiceUtils';
import { purchaseOrdersAPI } from '../services/api';
import { stockMovementService } from '../services/stockMovementService';
import { inventoryService } from '../services/inventoryService';
import { productService, payablesService } from '../services/dataService';
import { purchaseOrderSyncService } from '../services/purchaseOrderSyncService';
import { PRODUCT_TYPES, STEEL_GRADES, FINISHES } from '../types';
import { useApiData } from '../hooks/useApi';
import { supplierService } from '../services/supplierService';
import { notificationService } from '../services/notificationService';
import { pinnedProductsService } from '../services/pinnedProductsService';
import PurchaseOrderPreview from '../components/purchase-orders/PurchaseOrderPreview';
const { PAYMENT_MODES } = payablesService;

// Payment Form Component
const PaymentForm = ({ onSubmit, onCancel, totalAmount, paidAmount, isDarkMode }) => {
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  });

  const maxAmount = totalAmount - paidAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amount > maxAmount) {
      alert(`Amount cannot exceed outstanding balance of ${formatCurrency(maxAmount)}`);
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-md p-6 rounded-xl shadow-xl ${
        isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Payment Date
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Amount (Max: {formatCurrency(maxAmount)})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {Object.values(PAYMENT_MODES).map(mode => (
                <option key={mode.value} value={mode.value}>{mode.icon} {mode.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Reference Number
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Transaction reference, cheque number, etc."
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={2}
              placeholder="Additional notes about this payment"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  noOptionsText = 'No options',
  className = '',
  error = false,
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
          dpPrev[j - 1] + cost,      // substitution
        );
      }
      // swap
      const tmp = dpPrev; dpPrev = dpCurr; dpCurr = tmp;
    }
    return dpPrev[lb];
  };

  const tokenMatch = (token, optLabel) => {
    const t = norm(token);
    const l = norm(optLabel);
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
      const optLabel = norm(o.label || o.name || '');
      if (!optLabel) continue;
      let ok = true;
      let score = 0;
      for (const t of tokens) {
        if (!tokenMatch(t, optLabel)) { ok = false; break; }
        // basic score: shorter distance preferred
        const idx = optLabel.indexOf(norm(t));
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

      dropdown.style.position = 'fixed';
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      dropdown.style.minWidth = `${inputRect.width}px`;
      dropdown.style.width = 'auto';
      dropdown.style.maxWidth = '90vw';
      dropdown.style.zIndex = '9999';
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
        value={inputValue || ''}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    ? 'hover:bg-gray-700 text-white border-gray-700'
                    : 'hover:bg-gray-50 text-gray-900 border-gray-100'
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
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
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
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
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
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierAddress: '',
    supplierTRN: '', // Tax Registration Number (UAE requirement)
    poDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'draft',
    stockStatus: 'retain', // Default to 'retain'
    // Incoterms and delivery
    incoterms: '', // FOB, CIF, EXW, etc.
    // Buyer/Purchaser information
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    buyerDepartment: '',
    // Approval workflow
    approvalStatus: 'pending', // pending/approved/rejected
    approvedBy: '',
    approvalDate: '',
    approvalComments: '',
    items: [
      {
        productType: '',
        name: '', // This will be same as productType for consistency
        productId: null, // Product ID for lookup
        grade: '',
        thickness: '',
        size: '',
        finish: '',
        specification: '', // Keep for backward compatibility
        itemDescription: '', // Detailed description
        hsnCode: '', // HSN/SAC code
        unit: 'kg', // Unit of Measure (kg, mt, pcs, sqm, etc.)
        quantity: 0,
        rate: 0,
        discountType: 'amount', // amount or percentage
        discount: 0,
        vatRate: 5, // Configurable VAT rate per item (default 5%)
        supplyType: 'standard', // standard, zero_rated, exempt (matching Invoice form)
        amount: 0,
      },
    ],
    subtotal: 0,
    // Order-level discount
    discountType: 'amount', // amount or percentage
    discountPercentage: 0,
    discountAmount: 0,
    // Additional charges
    freightCharges: 0,
    shippingCharges: 0,
    handlingCharges: 0,
    otherCharges: 0,
    vatAmount: 0,
    total: 0,
    notes: '',
    terms: '', // General terms and conditions
    paymentTerms: 'Net 30', // Standardized payment terms
    dueDate: '',
    currency: 'AED',
    supplierContactName: '',
    supplierContactEmail: '',
    supplierContactPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableProducts, setAvailableProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchInputs, setSearchInputs] = useState({});
  const [payments, setPayments] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Validation state - MANDATORY for all forms
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Pinned products state (matching Invoice form)
  const [pinnedProductIds, setPinnedProductIds] = useState([]);
  const { data: pinnedData, refetch: refetchPinned } = useApiData(
    () => pinnedProductsService.getPinnedProducts(),
    [],
  );

  // Form preferences state (with localStorage persistence)
  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem('purchaseOrderFormPreferences');
    return saved ? JSON.parse(saved) : {
      showSpeedButtons: true,
    };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('purchaseOrderFormPreferences', JSON.stringify(formPreferences));
  }, [formPreferences]);

  // Update pinned products when data loads
  useEffect(() => {
    if (pinnedData?.pinnedProducts) {
      setPinnedProductIds(pinnedData.pinnedProducts);
    }
  }, [pinnedData]);

  // Handle pin/unpin
  const handleTogglePin = async (e, productId) => {
    e.stopPropagation(); // Prevent adding item to PO
    try {
      if (pinnedProductIds.includes(productId)) {
        await pinnedProductsService.unpinProduct(productId);
        setPinnedProductIds(prev => prev.filter(pinnedId => pinnedId !== productId));
      } else {
        if (pinnedProductIds.length >= 10) {
          notificationService.error('Maximum 10 products can be pinned');
          return;
        }
        await pinnedProductsService.pinProduct(productId);
        setPinnedProductIds(prev => [...prev, productId]);
      }
    } catch (error) {
      notificationService.error(error.message || 'Failed to update pin');
    }
  };

  // Get sorted products: pinned first, then top sold (matching Invoice form)
  const sortedProducts = useMemo(() => {
    const allProducts = availableProducts || [];
    const pinned = allProducts.filter(p => pinnedProductIds.includes(p.id));
    const unpinned = allProducts.filter(p => !pinnedProductIds.includes(p.id));
    return [...pinned, ...unpinned].slice(0, 10);
  }, [availableProducts, pinnedProductIds]);

  // Quick add item from speed button (matching Invoice form)
  const handleQuickAddItem = useCallback((product) => {
    const productDisplayName = product.displayName || product.display_name || product.name;
    const newItem = {
      productType: productDisplayName,
      name: productDisplayName,
      productId: product.id,
      grade: product.grade || '',
      finish: product.finish || '',
      size: product.size || '',
      thickness: product.thickness || '',
      specification: product.specification || product.description || '',
      itemDescription: '',
      hsnCode: product.hsnCode || '',
      unit: product.unit || 'kg',
      quantity: 0,
      rate: product.sellingPrice || product.purchasePrice || 0,
      discountType: 'amount',
      discount: 0,
      vatRate: 5,
      supplyType: 'standard',
      amount: 0,
    };

    setPurchaseOrder((prev) => {
      const updatedItems = [...prev.items, newItem];
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = updatedItems.reduce((sum, item) => {
        const itemAmount = item.amount || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemAmount * vatRate / 100);
      }, 0);
      const total = subtotal + vatAmount;

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        vatAmount,
        total,
      };
    });
  }, []);

  // Payment calculation functions
  const updatePaymentStatus = (paymentList, total) => {
    const totalPaid = paymentList.filter(p => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const outstanding = Math.max(0, total - totalPaid);
    
    let status = 'unpaid';
    if (outstanding === 0 && total > 0) status = 'paid';
    else if (outstanding < total && outstanding > 0) status = 'partially_paid';
    
    setPaymentStatus(status);
    return { totalPaid, outstanding, status };
  };

  const handleAddPayment = (paymentData) => {
    const newPayment = {
      id: Date.now().toString(),
      ...paymentData,
      created_at: new Date().toISOString(),
      voided: false,
    };
    
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    updatePaymentStatus(updatedPayments, purchaseOrder.total);
    setShowPaymentForm(false);
  };

  const handleVoidPayment = (paymentId) => {
    const updatedPayments = payments.map(p => 
      p.id === paymentId ? { ...p, voided: true, voided_at: new Date().toISOString() } : p,
    );
    setPayments(updatedPayments);
    updatePaymentStatus(updatedPayments, purchaseOrder.total);
  };

  const calculateDueDate = (poDate, terms) => {
    if (!poDate || !terms) return '';
    const date = new Date(poDate);
    const match = terms.match(/(\d+)/);
    if (match) {
      date.setDate(date.getDate() + parseInt(match[1]));
      return date.toISOString().slice(0, 10);
    }
    return '';
  };

  // Auto-calculate due date when PO date or payment terms change
  useEffect(() => {
    if (purchaseOrder.poDate && purchaseOrder.paymentTerms) {
      const calculatedDueDate = calculateDueDate(purchaseOrder.poDate, purchaseOrder.paymentTerms);
      if (calculatedDueDate && calculatedDueDate !== purchaseOrder.dueDate) {
        handleInputChange('dueDate', calculatedDueDate);
      }
    }
  }, [purchaseOrder.poDate, purchaseOrder.paymentTerms]);

  // Update payment status when total changes
  useEffect(() => {
    if (payments.length > 0) {
      updatePaymentStatus(payments, purchaseOrder.total);
    }
  }, [purchaseOrder.total]);

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
    [],
  );

  // Product options for autocomplete
  const productOptions = useMemo(() => {
    return (availableProducts || []).map((product) => {
      // Handle both camelCase and snake_case from API
      const fullName = product.fullName || product.full_name;
      const displayName = product.displayName || product.display_name;
      const sellingPrice = product.sellingPrice ?? product.selling_price ?? 0;
      // Priority: fullName (with origin) > displayName (hyphenated) > name (legacy)
      const label = fullName || displayName || product.name;
      return {
        ...product,
        label,
        searchDisplay: label,
        fullName: fullName || '',
        displayName: displayName || '',
        subtitle: `${product.category} • ${product.grade || 'N/A'} • د.إ${sellingPrice}`,
      };
    });
  }, [availableProducts]);

  const searchOptions = useMemo(() => {
    const list = searchInputs?.__results || [];
    return list.map((product) => {
      // Handle both camelCase and snake_case from API
      const fullName = product.fullName || product.full_name;
      const displayName = product.displayName || product.display_name;
      const sellingPrice = product.sellingPrice ?? product.selling_price ?? 0;
      // Priority: fullName (with origin) > displayName (hyphenated) > name (legacy)
      const label = fullName || displayName || product.name;
      return {
        ...product,
        label,
        searchDisplay: label,
        fullName: fullName || '',
        displayName: displayName || '',
        subtitle: `${product.category} • ${product.grade || 'N/A'} • د.إ${sellingPrice}`,
      };
    });
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
          poNumber: data.poNumber || prev.poNumber,
          supplierName: data.supplierName || '',
          supplierEmail: data.supplierEmail || '',
          supplierPhone: data.supplierPhone || '',
          supplierAddress: data.supplierAddress || '',
          poDate: toDateInput(data.poDate) || prev.poDate,
          expectedDeliveryDate: toDateInput(data.expectedDeliveryDate) || '',
          status: data.status || 'draft',
          stockStatus: data.stockStatus || 'retain',
          currency: data.currency || prev.currency,
          supplierContactName: data.supplierContactName || '',
          supplierContactEmail: data.supplierContactEmail || data.supplierEmail || '',
          supplierContactPhone: data.supplierContactPhone || data.supplierPhone || '',
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
          vatAmount: data.vatAmount || data.taxAmount || 0,
          total: data.total || 0,
          notes: data.notes || '',
          terms: data.terms || '',
          paymentTerms: data.paymentTerms || prev.paymentTerms,
          dueDate: toDateInput(data.dueDate) || '',
        }));
        
        // Load existing payments
        if (data.payments && Array.isArray(data.payments)) {
          setPayments(data.payments);
          updatePaymentStatus(data.payments, data.total || 0);
        }
        
        // Set warehouse if available
        if (data.warehouseId) {
          setSelectedWarehouse(data.warehouseId.toString());
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
      // Try to fetch real warehouses from API first
      const response = await purchaseOrdersAPI.getWarehouses();
      const apiWarehouses = response?.warehouses || response?.data || response;
      
      if (apiWarehouses && Array.isArray(apiWarehouses) && apiWarehouses.length > 0) {
        setWarehouses(apiWarehouses.filter(w => w.isActive !== false));
        return;
      }
    } catch (error) {
      console.warn('Failed to fetch warehouses from API:', error);
      
      // Try to seed warehouses if they don't exist
      try {
        console.log('Attempting to seed warehouses...');
        await purchaseOrdersAPI.seedWarehouses();
        notificationService.success('Warehouses initialized successfully. Please try again.');
        return;
      } catch (seedError) {
        console.warn('Failed to seed warehouses:', seedError);
      }
    }
    
    // Fallback to sample warehouse data if API fails
    const sampleWarehouses = [
      { id: 'WH-MAIN', name: 'Main Warehouse', city: 'Sharjah', isActive: true },
      { id: 'WH-DBX', name: 'Dubai Branch Warehouse', city: 'Dubai', isActive: true },
      { id: 'WH-AUH', name: 'Abu Dhabi Warehouse', city: 'Abu Dhabi', isActive: true },
    ];
    setWarehouses(sampleWarehouses.filter(w => w.isActive));
    notificationService.warning('Using offline warehouse data. Some features may not work properly.');
  };

  // Get next PO number from server (only for new purchase orders)
  const { data: nextPOData } = useApiData(
    () => purchaseOrdersAPI.getNextNumber(),
    [],
    !id,  // Only fetch when creating new PO (not editing)
  );

  // Update PO number when server data is available
  useEffect(() => {
    if (nextPOData && nextPOData.nextPoNumber && !id) {
      setPurchaseOrder((prev) => ({
        ...prev,
        poNumber: nextPOData.nextPoNumber,
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
      terms: found.paymentTerms || prev.terms || '',
      currency: found.defaultCurrency || prev.currency || 'AED',
      supplierContactName: found.contactName || '',
      supplierContactEmail: found.contactEmail || found.email || '',
      supplierContactPhone: found.contactPhone || found.phone || '',
    }));
  };

  // Helper function to extract thickness from product specs or size string
  const getThickness = (product) => {
    try {
      const cat = (product?.category || '').toString().toLowerCase();
      const isPipe = /pipe/.test(cat);
      const specThk = product?.specifications?.thickness || product?.specifications?.Thickness;
      if (specThk && String(specThk).trim()) return String(specThk).trim();
      if (isPipe) return ''; // avoid deriving thickness from pipe size
      const sizeStr = product?.size ? String(product.size) : '';
      const mmMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(mm)\b/i);
      if (mmMatch) return `${mmMatch[1]}mm`;
      const xParts = sizeStr.split(/x|X|\*/).map((s) => s.trim()).filter(Boolean);
      if (xParts.length >= 2) {
        const last = xParts[xParts.length - 1];
        const numMatch = last.match(/\d+(?:\.\d+)?/);
        if (numMatch) return `${numMatch[0]}mm`;
      }
    } catch (err) {
      console.warn('Error extracting thickness from product:', err);
    }
    return '';
  };

  const handleProductSelect = (index, selectedProduct) => {
    // Accept either a product object or a name string (backward compatibility)
    const product = typeof selectedProduct === 'object' && selectedProduct !== null
      ? selectedProduct
      : availableProducts.find(p => p.id === selectedProduct || p.name === selectedProduct);
    
    if (product && typeof product === 'object') {
      const updatedItems = [...purchaseOrder.items];
      
      // Try multiple possible field names for finish and thickness
      const rawFinish = product.finish || product.surfaceFinish || product.finishType || '';
      
      // Match finish with predefined FINISHES options (case-insensitive)
      const finish = (() => {
        if (!rawFinish) return '';
        const rawFinishLower = rawFinish.toLowerCase();
        const matchedFinish = FINISHES.find(f => f.toLowerCase() === rawFinishLower);
        return matchedFinish || rawFinish; // Use matched finish or original if no match
      })();
      
      const thickness = product.thickness || product.thick || getThickness(product);
      
      const productDisplayName = product.displayName || product.display_name || product.name;
      updatedItems[index] = {
        ...updatedItems[index],
        productType: productDisplayName,
        name: productDisplayName,
        productId: product.id,
        grade: product.grade || product.steelGrade || '',
        finish,
        size: product.size || product.dimensions || '',
        thickness,
        specification: product.specification || product.description || '',
        hsnCode: product.hsnCode || '',
        unit: product.unit || 'kg',
        rate: product.sellingPrice || product.purchasePrice || product.price || 0,
        supplyType: updatedItems[index].supplyType || 'standard',
        vatRate: updatedItems[index].vatRate || 5,
      };

      // Calculate amount if quantity exists
      if (updatedItems[index].quantity) {
        updatedItems[index].amount = updatedItems[index].quantity * (product.sellingPrice || product.purchasePrice || 0);
      }

      // Recalculate totals with item-level VAT rates
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = updatedItems.reduce((sum, item) => {
        const itemAmount = item.amount || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemAmount * vatRate / 100);
      }, 0);
      const total = subtotal + vatAmount;

      setPurchaseOrder((prev) => ({
        ...prev,
        items: updatedItems,
        subtotal,
        vatAmount,
        total,
      }));

      // Clear search input for this row
      setSearchInputs((prev) => ({ ...prev, [index]: '' }));
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
    } catch (err) {
      console.error('Error setting up product search timer:', err);
    }
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-update VAT rate based on supply type (matching Invoice form)
    if (field === 'supplyType') {
      if (value === 'standard') {
        updatedItems[index].vatRate = 5;
      } else if (value === 'zero_rated' || value === 'exempt') {
        updatedItems[index].vatRate = 0;
      }
    }

    // Calculate amount when quantity, rate, discount, or VAT changes
    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'discountType' || field === 'vatRate' || field === 'supplyType') {
      const item = updatedItems[index];
      const quantity = field === 'quantity' ? (parseFloat(value) || 0) : item.quantity;
      const rate = field === 'rate' ? (parseFloat(value) || 0) : item.rate;
      const discount = field === 'discount' ? (parseFloat(value) || 0) : (item.discount || 0);
      const discountType = field === 'discountType' ? value : (item.discountType || 'amount');

      // Calculate gross amount
      const grossAmount = quantity * rate;

      // Apply item-level discount
      const discountAmount = discountType === 'percentage'
        ? (grossAmount * discount / 100)
        : discount;

      // Net amount after discount (before VAT)
      updatedItems[index].amount = grossAmount - discountAmount;
    }

    setPurchaseOrder((prev) => {
      const newPO = {
        ...prev,
        items: updatedItems,
      };

      // Recalculate totals with order-level discount and charges
      const itemsSubtotal = calculateSubtotal(updatedItems);

      // Apply order-level discount
      const orderDiscountAmount = prev.discountType === 'percentage'
        ? (itemsSubtotal * (prev.discountPercentage || 0) / 100)
        : (prev.discountAmount || 0);

      const subtotalAfterDiscount = itemsSubtotal - orderDiscountAmount;

      // Calculate VAT per item (item-level VAT rates)
      const vatAmount = updatedItems.reduce((sum, item) => {
        const itemAmount = item.amount || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemAmount * vatRate / 100);
      }, 0);

      // Add all charges
      const allCharges =
        (parseFloat(prev.freightCharges) || 0) +
        (parseFloat(prev.shippingCharges) || 0) +
        (parseFloat(prev.handlingCharges) || 0) +
        (parseFloat(prev.otherCharges) || 0);

      const total = subtotalAfterDiscount + vatAmount + allCharges;

      return {
        ...newPO,
        subtotal: itemsSubtotal,
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
          productType: '',
          name: '',
          productId: null,
          grade: '',
          thickness: '',
          size: '',
          finish: '',
          specification: '',
          itemDescription: '',
          hsnCode: '',
          unit: 'kg',
          quantity: 0,
          rate: 0,
          discountType: 'amount',
          discount: 0,
          vatRate: 5,
          supplyType: 'standard',
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

  const handleSubmit = async (status = 'draft') => {
    // STEP 1: Validate all required fields
    const submitValidationErrors = [];
    const invalidFieldsSet = new Set();

    const poData = { ...purchaseOrder, status };

    // Supplier validation
    if (!poData.supplierName || poData.supplierName.trim() === '') {
      submitValidationErrors.push('Supplier name is required');
      invalidFieldsSet.add('supplierName');
    }

    // Warehouse validation
    if (!selectedWarehouse) {
      submitValidationErrors.push('Please select a destination warehouse');
      invalidFieldsSet.add('warehouse');
    }

    // Items validation
    if (!poData.items || poData.items.length === 0) {
      submitValidationErrors.push('At least one item is required');
    } else {
      let hasValidItem = false;
      poData.items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          submitValidationErrors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        } else if (item.quantity > 0) {
          hasValidItem = true;
        }

        if (!item.quantity || item.quantity <= 0) {
          submitValidationErrors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }

        if (!item.rate || item.rate <= 0) {
          submitValidationErrors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }
      });

      if (!hasValidItem) {
        submitValidationErrors.push('At least one item must have a valid quantity');
      }
    }

    // If errors exist, show them and STOP
    if (submitValidationErrors.length > 0) {
      setValidationErrors(submitValidationErrors);
      setInvalidFields(invalidFieldsSet);

      // Auto-scroll to error alert
      setTimeout(() => {
        const errorAlert = document.getElementById('validation-errors-alert');
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, 100);

      return; // STOP - do not proceed with save
    }

    // STEP 2: Clear any previous errors
    setValidationErrors([]);
    setInvalidFields(new Set());

    // STEP 3: Proceed with save operation
    setIsSaving(true);
    try {

      // Get warehouse details
      const selectedWarehouseDetails = warehouses.find(w => w.id?.toString() === selectedWarehouse);
      
      // If using sample data, remove warehouse_id to avoid FK constraint error
      const useApiWarehouse = selectedWarehouseDetails?.id && !selectedWarehouseDetails.id.toString().startsWith('WH-');

      // Transform data to match backend expectations (snake_case)
      const transformedData = {
        po_number: poData.poNumber,
        supplier_name: poData.supplierName,
        supplier_email: poData.supplierEmail || null,
        supplier_phone: poData.supplierPhone || null,
        supplier_address: poData.supplierAddress || null,
        supplier_trn: poData.supplierTRN || null,
        po_date: poData.poDate,
        expected_delivery_date: poData.expectedDeliveryDate || null,
        status: poData.status,
        stock_status: poData.stockStatus,
        currency: poData.currency || 'AED',
        payment_terms: poData.paymentTerms || poData.terms || null,
        due_date: poData.dueDate || null,
        supplier_contact_name: poData.supplierContactName || null,
        supplier_contact_email: poData.supplierContactEmail || null,
        supplier_contact_phone: poData.supplierContactPhone || null,
        // Buyer fields
        buyer_name: poData.buyerName || null,
        buyer_email: poData.buyerEmail || null,
        buyer_phone: poData.buyerPhone || null,
        buyer_department: poData.buyerDepartment || null,
        // Trade terms
        incoterms: poData.incoterms || null,
        // Approval workflow
        approval_status: poData.approvalStatus || 'pending',
        // Additional charges
        freight_charges: parseFloat(poData.freightCharges) || 0,
        shipping_charges: parseFloat(poData.shippingCharges) || 0,
        handling_charges: parseFloat(poData.handlingCharges) || 0,
        other_charges: parseFloat(poData.otherCharges) || 0,
        // Order-level discount
        discount_type: poData.discountType || 'amount',
        discount_percentage: parseFloat(poData.discountPercentage) || 0,
        discount_amount: parseFloat(poData.discountAmount) || 0,
        // Only include warehouse_id if it's a real warehouse from API
        ...(useApiWarehouse ? { warehouse_id: parseInt(selectedWarehouse) } : {}),
        warehouse_name: selectedWarehouseDetails ? `${selectedWarehouseDetails.name} (${selectedWarehouseDetails.city})` : '',
        notes: poData.notes || null,
        terms: poData.terms || null,
        subtotal: parseFloat(poData.subtotal) || 0,
        vat_amount: parseFloat(poData.vatAmount) || 0,
        total: parseFloat(poData.total) || 0,
        // Include payment data
        payments: payments.map(payment => ({
          id: payment.id,
          payment_date: payment.paymentDate,
          amount: parseFloat(payment.amount) || 0,
          payment_method: payment.paymentMethod,
          reference_number: payment.referenceNumber || null,
          notes: payment.notes || null,
          voided: payment.voided || false,
          voided_at: payment.voidedAt || null,
          created_at: payment.createdAt,
        })),
        payment_status: paymentStatus,
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
          amount: parseFloat(item.amount) || 0,
          vat_rate: parseFloat(item.vatRate) || 5,
          unit: item.unit || 'kg',
        })),
      };

      let savedPO;
      if (id) {
        // Update existing purchase order
        savedPO = await purchaseOrdersAPI.update(id, transformedData);
      } else {
        // Create new purchase order
        savedPO = await purchaseOrdersAPI.create(transformedData);
      }
      
      // If stock status is received, trigger inventory creation via the stock-status endpoint
      if (poData.stockStatus === 'received') {
        try {
          const stockStatusResponse = await (await import('../services/api')).apiClient.patch(`/purchase-orders/${savedPO.id}/stock-status`, {
            stock_status: 'received',
          });

          if (stockStatusResponse.inventoryCreated) {
            notificationService.success('Inventory items created successfully!');
          }
        } catch (stockError) {
          notificationService.warning('Purchase order saved but inventory creation failed. Please check the inventory manually.');
        }
      }
      
      // Show success notification
      const action = id ? 'updated' : 'created';
      notificationService.success(`Purchase order ${action} successfully!`);
      
      navigate('/purchase-orders');
    } catch (error) {
      const action = id ? 'update' : 'create';
      
      // Extract more detailed error message
      let errorMessage = 'Unknown error';
      const errorData = error.response?.data;
      
      // Check for validation errors array
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Join all error messages
        errorMessage = errorData.errors.map(err => 
          typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err),
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

      // Handle specific warehouse foreign key error
      if (errorData?.message && errorData.message.includes('Warehouse with ID')) {
        notificationService.error(
          'Database setup required: Warehouses not initialized. ' +
          'Please start PostgreSQL service and refresh the page to auto-initialize warehouses.',
        );
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setIsSaving(false);
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
                onClick={() => navigate('/purchase-orders')}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🛒 {id ? 'Edit' : 'Create'} Purchase Order
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
                title="Preview Purchase Order"
              >
                <Eye size={18} />
                Preview
              </button>
              <button
                onClick={() => handleSubmit('draft')}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                } ${isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </button>
              <button
                onClick={() => handleSubmit('pending')}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md ${
                  isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Submit PO
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Errors Alert - MANDATORY */}
          {validationErrors.length > 0 && (
            <div
              id="validation-errors-alert"
              className={`mt-6 p-4 rounded-lg border-2 ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-600 text-red-200'
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} size={24} />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setValidationErrors([]);
                      setInvalidFields(new Set());
                    }}
                    className={`mt-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-red-800 hover:bg-red-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    onChange={(e) => handleInputChange('poNumber', e.target.value)}
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
                    onChange={(e) => handleInputChange('poDate', e.target.value)}
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
                    onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
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
                    onChange={(e) => handleInputChange('supplierName', e.target.value)}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${invalidFields.has('supplierName') ? 'border-red-500' : ''}`}
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
                      onChange={(e) => handleInputChange('supplierContactName', e.target.value)}
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
                      onChange={(e) => handleInputChange('supplierContactEmail', e.target.value)}
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
                      onChange={(e) => handleInputChange('supplierContactPhone', e.target.value)}
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
                      onChange={(e) => handleInputChange('terms', e.target.value)}
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
                      onChange={(e) => handleInputChange('currency', e.target.value)}
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
                    onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
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
                    onChange={(e) => handleInputChange('supplierPhone', e.target.value)}
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
                    onChange={(e) => handleInputChange('supplierAddress', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tax Registration Number (TRN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseOrder.supplierTRN}
                    onChange={(e) => handleInputChange('supplierTRN', e.target.value)}
                    required
                    placeholder="e.g., 123456789012345"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${invalidFields.has('supplierTRN') ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buyer/Purchaser Information */}
          <div className={`p-6 mt-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Buyer/Purchaser Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Buyer Name
                </label>
                <input
                  type="text"
                  value={purchaseOrder.buyerName}
                  onChange={(e) => handleInputChange('buyerName', e.target.value)}
                  placeholder="Name of person placing order"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Buyer Email
                </label>
                <input
                  type="email"
                  value={purchaseOrder.buyerEmail}
                  onChange={(e) => handleInputChange('buyerEmail', e.target.value)}
                  placeholder="buyer@company.com"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Buyer Phone
                </label>
                <input
                  type="tel"
                  value={purchaseOrder.buyerPhone}
                  onChange={(e) => handleInputChange('buyerPhone', e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Department
                </label>
                <input
                  type="text"
                  value={purchaseOrder.buyerDepartment}
                  onChange={(e) => handleInputChange('buyerDepartment', e.target.value)}
                  placeholder="e.g., Procurement, Operations"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Delivery Terms */}
          <div className={`p-6 mt-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Delivery Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Incoterms
                </label>
                <div className="relative">
                  <select
                    value={purchaseOrder.incoterms}
                    onChange={(e) => handleInputChange('incoterms', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Incoterm</option>
                    <option value="FOB">FOB - Free on Board</option>
                    <option value="CIF">CIF - Cost, Insurance & Freight</option>
                    <option value="EXW">EXW - Ex Works</option>
                    <option value="DDP">DDP - Delivered Duty Paid</option>
                    <option value="DAP">DAP - Delivered at Place</option>
                    <option value="FCA">FCA - Free Carrier</option>
                    <option value="CPT">CPT - Carriage Paid To</option>
                    <option value="CIP">CIP - Carriage and Insurance Paid To</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  International Commercial Terms for shipping responsibility
                </p>
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
                    } ${invalidFields.has('warehouse') ? 'border-red-500' : ''}`}
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
                    onChange={(e) => handleInputChange('stockStatus', e.target.value)}
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

          {/* Line Items - Matching Invoice Form Structure */}
          <div className={`p-6 mt-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="mb-4">
              <h2 className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Line Items
              </h2>
            </div>

            {/* Quick Add Speed Buttons - Pinned & Top Products (matching Invoice form) */}
            {formPreferences.showSpeedButtons && (
              <div className="mb-4">
                <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Quick Add (Pinned & Top Products)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sortedProducts.slice(0, 8).map((product) => {
                    const isPinned = pinnedProductIds.includes(product.id);
                    return (
                      <div key={product.id} className="relative group">
                        <button
                          onClick={() => handleQuickAddItem(product)}
                          className={`w-full px-3 py-2 pr-8 rounded-lg border-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02] truncate text-left ${
                            isPinned
                              ? isDarkMode
                                ? 'border-teal-700 bg-teal-900/40 text-teal-300 hover:bg-teal-900/60 shadow-md hover:shadow-lg'
                                : 'border-teal-600 bg-teal-100 text-teal-800 hover:bg-teal-200 shadow-md hover:shadow-lg'
                              : isDarkMode
                                ? 'border-teal-600 bg-teal-900/20 text-teal-400 hover:bg-teal-900/40 hover:shadow-md'
                                : 'border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:shadow-md'
                          }`}
                          title={product.displayName || product.display_name || product.name}
                        >
                          {product.displayName || product.display_name || product.name}
                        </button>
                        <button
                          onClick={(e) => handleTogglePin(e, product.id)}
                          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 hover:scale-110 ${
                            isPinned
                              ? isDarkMode
                                ? 'text-teal-300 hover:text-teal-200'
                                : 'text-teal-700 hover:text-teal-800'
                              : isDarkMode
                                ? 'text-gray-400 hover:text-teal-400'
                                : 'text-gray-500 hover:text-teal-600'
                          }`}
                          title={isPinned ? 'Unpin product' : 'Pin product'}
                        >
                          {isPinned ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Item Button */}
            <div className="mb-4">
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md min-h-[44px]"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Items Table - Desktop (Matching Invoice Form Columns) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full table-fixed divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '38%' }}>
                      Product
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '10%' }}>
                      Qty
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '12%' }}>
                      Rate
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '12%' }}>
                      Supply Type
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '8%' }}>
                      VAT %
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '14%' }}>
                      Amount
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} style={{ width: '8%' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-600' : 'bg-white divide-gray-200'}`}>
                  {purchaseOrder.items.map((item, index) => {
                    const tooltip = [
                      item.name ? `Name: ${item.name}` : '',
                      item.grade ? `Grade: ${item.grade}` : '',
                      item.finish ? `Finish: ${item.finish}` : '',
                      item.size ? `Size: ${item.size}` : '',
                      item.thickness ? `Thickness: ${item.thickness}` : '',
                      item.unit ? `Unit: ${item.unit}` : '',
                      item.hsnCode ? `HSN: ${item.hsnCode}` : '',
                    ].filter(Boolean).join('\n');
                    return (
                      <tr key={index} data-item-index={index}>
                        <td className="px-2 py-2 align-middle">
                          <div className="w-full">
                            <Autocomplete
                              options={(searchInputs[index] ? (searchOptions.length ? searchOptions : productOptions) : productOptions)}
                              value={
                                item.productId
                                  ? productOptions.find((p) => p.id === item.productId)
                                  : null
                              }
                              inputValue={searchInputs[index] || item.name || ''}
                              onInputChange={(event, newInputValue) => {
                                handleSearchInputChange(index, newInputValue);
                              }}
                              onChange={(event, newValue) => {
                                if (newValue) {
                                  handleProductSelect(index, newValue);
                                }
                              }}
                              placeholder="Search products..."
                              disabled={loading}
                              error={invalidFields.has(`item.${index}.name`)}
                              renderOption={(option) => (
                                <div>
                                  <div className="font-medium">{option.fullName || option.full_name || option.uniqueName || option.unique_name || option.label || option.name}</div>
                                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {option.origin ? `${option.origin} • ` : ''}{option.subtitle}
                                  </div>
                                </div>
                              )}
                              noOptionsText="No products found"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            min="0"
                            step="1"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`w-full px-2 py-1.5 text-sm border rounded-md text-right ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } ${invalidFields.has(`item.${index}.quantity`) ? 'border-red-500' : ''}`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.rate || ''}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            className={`w-full px-2 py-1.5 text-sm border rounded-md text-right ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } ${invalidFields.has(`item.${index}.rate`) ? 'border-red-500' : ''}`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <select
                            value={item.supplyType || 'standard'}
                            onChange={(e) => handleItemChange(index, 'supplyType', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-xs ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="standard">Standard (5%)</option>
                            <option value="zero_rated">Zero-Rated (0%)</option>
                            <option value="exempt">Exempt</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="number"
                            value={item.vatRate || ''}
                            onChange={(e) => handleItemChange(index, 'vatRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                            max="15"
                            step="0.01"
                            placeholder="5.00"
                            className={`w-full px-2 py-1.5 text-sm border rounded-md text-right ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <div className={`font-medium text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(item.amount)}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
                          <button
                            onClick={() => removeItem(index)}
                            disabled={purchaseOrder.items.length === 1}
                            className={`hover:text-red-300 ${
                              isDarkMode
                                ? 'text-red-400 disabled:text-gray-600'
                                : 'text-red-500 disabled:text-gray-400'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Items Cards - Mobile (Matching Invoice Form) */}
            <div className="md:hidden space-y-4">
              {purchaseOrder.items.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                  data-item-index={index}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Item #{index + 1}
                    </h4>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={purchaseOrder.items.length === 1}
                      className={`hover:text-red-300 ${
                        isDarkMode
                          ? 'text-red-400 disabled:text-gray-600'
                          : 'text-red-500 disabled:text-gray-400'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <Autocomplete
                      options={(searchInputs[index] ? (searchOptions.length ? searchOptions : productOptions) : productOptions)}
                      value={
                        item.productId
                          ? productOptions.find((p) => p.id === item.productId)
                          : null
                      }
                      inputValue={searchInputs[index] || item.name || ''}
                      onInputChange={(event, newInputValue) => {
                        handleSearchInputChange(index, newInputValue);
                      }}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          handleProductSelect(index, newValue);
                        }
                      }}
                      label="Product"
                      placeholder="Search products..."
                      disabled={loading}
                      error={invalidFields.has(`item.${index}.name`)}
                      renderOption={(option) => (
                        <div>
                          <div className="font-medium">{option.fullName || option.full_name || option.uniqueName || option.unique_name || option.label || option.name}</div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {option.origin ? `${option.origin} • ` : ''}{option.subtitle}
                          </div>
                        </div>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          min="0"
                          className={`w-full px-3 py-2 border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } ${invalidFields.has(`item.${index}.quantity`) ? 'border-red-500' : ''}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Rate
                        </label>
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } ${invalidFields.has(`item.${index}.rate`) ? 'border-red-500' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Supply Type
                        </label>
                        <select
                          value={item.supplyType || 'standard'}
                          onChange={(e) => handleItemChange(index, 'supplyType', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="standard">Standard (5%)</option>
                          <option value="zero_rated">Zero-Rated (0%)</option>
                          <option value="exempt">Exempt</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          VAT %
                        </label>
                        <input
                          type="number"
                          value={item.vatRate || ''}
                          onChange={(e) => handleItemChange(index, 'vatRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          min="0"
                          max="15"
                          step="0.01"
                          className={`w-full px-3 py-2 border rounded-md ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className={`pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</span>
                        <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Additional Charges */}
            <div className="mb-6">
              <h3 className={`text-md font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Additional Charges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Freight Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseOrder.freightCharges}
                    onChange={(e) => handleInputChange('freightCharges', e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Shipping Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseOrder.shippingCharges}
                    onChange={(e) => handleInputChange('shippingCharges', e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Handling Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseOrder.handlingCharges}
                    onChange={(e) => handleInputChange('handlingCharges', e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Other Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseOrder.otherCharges}
                    onChange={(e) => handleInputChange('otherCharges', e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Order Discount */}
            <div className="mb-6">
              <h3 className={`text-md font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Discount
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Discount Type
                  </label>
                  <div className="relative">
                    <select
                      value={purchaseOrder.discountType}
                      onChange={(e) => handleInputChange('discountType', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="amount">Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </div>
                  </div>
                </div>
                {purchaseOrder.discountType === 'percentage' ? (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={purchaseOrder.discountPercentage}
                      onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Discount Amount ({purchaseOrder.currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseOrder.discountAmount}
                      onChange={(e) => handleInputChange('discountAmount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                )}
              </div>
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

          {/* Payment Details */}
          <div className={`p-6 rounded-xl border mt-6 ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                💰 Payment Details
              </h2>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
              }`}>
                {paymentStatus === 'paid' ? 'Fully Paid' :
                  paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Unpaid'}
              </div>
            </div>
            
            {/* Payment Terms and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Terms
                </label>
                <select
                  value={purchaseOrder.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Net 7">Net 7 days</option>
                  <option value="Net 15">Net 15 days</option>
                  <option value="Net 30">Net 30 days</option>
                  <option value="Net 60">Net 60 days</option>
                  <option value="Net 90">Net 90 days</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                  <option value="Custom">Custom Terms</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={purchaseOrder.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Actions
                </label>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Payment
                </button>
              </div>
            </div>
            
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</div>
                <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(purchaseOrder.total)}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Paid Amount</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(payments.filter(p => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0))}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outstanding</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(Math.max(0, purchaseOrder.total - payments.filter(p => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)))}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Progress</div>
                <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                  <div 
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300" 
                    style={{
                      width: `${Math.min(100, (payments.filter(p => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / purchaseOrder.total) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Payment History */}
            {payments.length > 0 && (
              <div>
                <h3 className={`text-md font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Payment History ({payments.filter(p => !p.voided).length} payments)
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {payments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className={`p-3 rounded-lg border flex justify-between items-center ${
                        payment.voided 
                          ? `opacity-60 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}` 
                          : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${payment.voided ? 'line-through' : ''} ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatCurrency(payment.amount)} 
                          {payment.voided && <span className="text-red-500 ml-2">(VOIDED)</span>}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {payment.paymentMethod} • {payment.paymentDate} 
                          {payment.referenceNumber && ` • Ref: ${payment.referenceNumber}`}
                        </div>
                        {payment.notes && (
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {payment.notes}
                          </div>
                        )}
                      </div>
                      {!payment.voided && (
                        <button
                          type="button"
                          onClick={() => handleVoidPayment(payment.id)}
                          className="text-red-500 hover:text-red-700 text-sm underline"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {payments.length === 0 && (
              <div className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                <p>No payments recorded yet</p>
                <p className="text-sm">Click &quot;Add Payment&quot; to record advance payments or deposits</p>
              </div>
            )}
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
                onChange={(e) => handleInputChange('notes', e.target.value)}
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
                onChange={(e) => handleInputChange('terms', e.target.value)}
                placeholder="Terms and conditions..."
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Approval Workflow */}
          <div className={`p-6 rounded-xl border mt-6 ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Approval Workflow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Approval Status
                </label>
                <div className="relative">
                  <select
                    value={purchaseOrder.approvalStatus}
                    onChange={(e) => handleInputChange('approvalStatus', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Approved By
                </label>
                <input
                  type="text"
                  value={purchaseOrder.approvedBy}
                  onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                  placeholder="Name of approver"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Approval Date
                </label>
                <input
                  type="date"
                  value={purchaseOrder.approvalDate}
                  onChange={(e) => handleInputChange('approvalDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Approval Comments
                </label>
                <textarea
                  rows={3}
                  value={purchaseOrder.approvalComments}
                  onChange={(e) => handleInputChange('approvalComments', e.target.value)}
                  placeholder="Comments from approver..."
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

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          onSubmit={handleAddPayment}
          onCancel={() => setShowPaymentForm(false)}
          totalAmount={purchaseOrder.total}
          paidAmount={payments.filter(p => !p.voided).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PurchaseOrderPreview
          purchaseOrder={purchaseOrder}
          company={{}}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default PurchaseOrderForm;
