/**
 * VendorBillForm.jsx - UAE VAT Compliance
 *
 * Form for creating/editing vendor bills (purchase invoices).
 * Supports VAT categories, reverse charge, blocked VAT, and line items.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Building2,

  FileText,
  Package,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import vendorBillService from '../../services/vendorBillService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDateForInput } from '../../utils/invoiceUtils';

// UAE Emirates for place of supply
const EMIRATES = [
  { value: 'AE-AZ', label: 'Abu Dhabi' },
  { value: 'AE-DU', label: 'Dubai' },
  { value: 'AE-SH', label: 'Sharjah' },
  { value: 'AE-AJ', label: 'Ajman' },
  { value: 'AE-UQ', label: 'Umm Al Quwain' },
  { value: 'AE-RK', label: 'Ras Al Khaimah' },
  { value: 'AE-FU', label: 'Fujairah' },
];

// VAT categories
const VAT_CATEGORIES = [
  { value: 'STANDARD', label: 'Standard Rate (5%)', rate: 5 },
  { value: 'ZERO_RATED', label: 'Zero Rated (0%)', rate: 0 },
  { value: 'EXEMPT', label: 'Exempt', rate: 0 },
  { value: 'REVERSE_CHARGE', label: 'Reverse Charge', rate: 5 },
  { value: 'BLOCKED', label: 'Blocked (Non-Recoverable)', rate: 5 },
];

// Payment terms
const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_45', label: 'Net 45 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
  { value: 'net_90', label: 'Net 90 Days' },
];

// Blocked VAT reasons (per UAE FTA Article 53)
const BLOCKED_VAT_REASONS = [
  { value: 'entertainment', label: 'Entertainment expenses' },
  { value: 'motor_vehicle', label: 'Motor vehicles (not for business use)' },
  { value: 'personal_use', label: 'Personal use goods/services' },
  { value: 'no_tax_invoice', label: 'No valid tax invoice' },
  { value: 'expired_period', label: 'Claim period expired' },
  { value: 'other', label: 'Other (specify in notes)' },
];

// Empty line item template
const createEmptyItem = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  productId: null,
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  vatRate: 5,
  vatAmount: 0,
  vatCategory: 'STANDARD',
  expenseCategory: '',
});

const VendorBillForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // Bill data state
  const [bill, setBill] = useState({
    vendorId: null,
    vendor: null,
    billNumber: '',
    vendorInvoiceNumber: '',
    billDate: formatDateForInput(new Date()),
    dueDate: '',
    receivedDate: formatDateForInput(new Date()),
    vatCategory: 'STANDARD',
    placeOfSupply: 'AE-DU',
    isReverseCharge: false,
    reverseChargeAmount: 0,
    blockedVatReason: '',
    paymentTerms: 'net_30',
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    status: 'draft',
    notes: '',
    terms: '',
    items: [createEmptyItem()],
  });

  // Load initial data
  useEffect(() => {
    loadVendors();
    loadProducts();
    if (isEditMode) {
      loadBill();
    } else {
      loadNextBillNumber();
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // loadVendorBill and loadNextBillNumber are stable

  // Calculate due date when bill date or payment terms change
  useEffect(() => {
    if (bill.billDate && bill.paymentTerms) {
      const billDate = new Date(bill.billDate);
      let daysToAdd = 0;
      switch (bill.paymentTerms) {
        case 'net_7': daysToAdd = 7; break;
        case 'net_15': daysToAdd = 15; break;
        case 'net_30': daysToAdd = 30; break;
        case 'net_45': daysToAdd = 45; break;
        case 'net_60': daysToAdd = 60; break;
        case 'net_90': daysToAdd = 90; break;
        default: daysToAdd = 0;
      }
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      setBill((prev) => ({ ...prev, dueDate: formatDateForInput(dueDate) }));
    }
  }, [bill.billDate, bill.paymentTerms]);

  const loadVendors = async () => {
    try {
      const response = await supplierService.getSuppliers();
      setVendors(response.suppliers || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.products || response || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadBill = async () => {
    try {
      setLoading(true);
      const data = await vendorBillService.getById(id);
      setBill({
        ...data,
        items: data.items?.length > 0 ? data.items : [createEmptyItem()],
      });
    } catch (error) {
      console.error('Error loading vendor bill:', error);
      notificationService.error('Failed to load vendor bill');
      navigate('/purchases/vendor-bills');
    } finally {
      setLoading(false);
    }
  };

  const loadNextBillNumber = async () => {
    try {
      const response = await vendorBillService.getNextNumber();
      setBill((prev) => ({ ...prev, billNumber: response.billNumber || 'VB-0001' }));
    } catch (error) {
      console.error('Error loading next bill number:', error);
    }
  };

  // Handle vendor selection
  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find((v) => v.id === vendorId || v.id === parseInt(vendorId));
    setBill((prev) => ({
      ...prev,
      vendorId: vendorId || null,
      vendor: vendor || null,
    }));
  };

  // Handle VAT category change
  const handleVatCategoryChange = (category) => {
    const vatConfig = VAT_CATEGORIES.find((c) => c.value === category);
    const isReverseCharge = category === 'REVERSE_CHARGE';
    setBill((prev) => ({
      ...prev,
      vatCategory: category,
      isReverseCharge,
      blockedVatReason: category === 'BLOCKED' ? prev.blockedVatReason : '',
    }));
    // Update all items with new VAT rate
    recalculateAllItems(vatConfig?.rate || 5);
  };

  // Add new line item
  const handleAddItem = () => {
    setBill((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  // Remove line item
  const handleRemoveItem = (index) => {
    if (bill.items.length <= 1) {
      notificationService.warning('At least one item is required');
      return;
    }
    const updatedItems = bill.items.filter((_, i) => i !== index);
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Update line item
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...bill.items];
    const item = { ...updatedItems[index] };

    if (field === 'productId' && value) {
      const product = products.find((p) => p.id === value || p.id === parseInt(value));
      if (product) {
        item.productId = product.id;
        item.description = product.name || product.description || '';
        item.unitPrice = product.purchasePrice || product.cost || product.price || 0;
      }
    } else {
      item[field] = value;
    }

    // Recalculate item amounts
    if (['quantity', 'unitPrice', 'vatRate'].includes(field) || field === 'productId') {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 0;
      item.amount = qty * price;
      item.vatAmount = (item.amount * vatRate) / 100;
    }

    updatedItems[index] = item;
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Recalculate all items with new VAT rate
  const recalculateAllItems = (newVatRate) => {
    const updatedItems = bill.items.map((item) => {
      const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      const vatAmount = (amount * newVatRate) / 100;
      return { ...item, vatRate: newVatRate, amount, vatAmount };
    });
    setBill((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Recalculate totals
  const recalculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vatAmount) || 0), 0);
    const total = subtotal + vatAmount;

    setBill((prev) => ({
      ...prev,
      subtotal,
      vatAmount,
      total,
      reverseChargeAmount: prev.isReverseCharge ? vatAmount : 0,
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!bill.vendorId) {
      errors.push('Please select a vendor');
    }
    if (!bill.billNumber) {
      errors.push('Bill number is required');
    }
    if (!bill.billDate) {
      errors.push('Bill date is required');
    }
    if (bill.vatCategory === 'BLOCKED' && !bill.blockedVatReason) {
      errors.push('Blocked VAT reason is required');
    }

    const validItems = bill.items.filter(
      (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
    );
    if (validItems.length === 0) {
      errors.push('At least one valid line item is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle save
  const handleSave = async (status = 'draft') => {
    if (!validateForm()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);

      // Filter valid items only
      const validItems = bill.items.filter(
        (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
      );

      const billData = {
        ...bill,
        status,
        items: validItems,
      };

      if (isEditMode) {
        await vendorBillService.update(id, billData);
        notificationService.success('Vendor bill updated successfully');
      } else {
        await vendorBillService.create(billData);
        notificationService.success('Vendor bill created successfully');
      }

      navigate('/purchases/vendor-bills');
    } catch (error) {
      console.error('Error saving vendor bill:', error);
      notificationService.error(error.message || 'Failed to save vendor bill');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading vendor bill...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/purchases/vendor-bills')}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEditMode ? 'Edit Vendor Bill' : 'New Vendor Bill'}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isEditMode ? `Editing ${bill.billNumber}` : 'Create a new purchase invoice'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={() => handleSave('approved')}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors ${
                saving ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save & Approve
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            isDarkMode
              ? 'bg-red-900/20 border-red-600 text-red-200'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={24} />
              <div>
                <h4 className="font-bold mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor & Bill Info */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Building2 className="h-5 w-5" />
                Vendor Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bill.vendorId || ''}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bill Number */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bill.billNumber}
                    onChange={(e) => setBill((prev) => ({ ...prev, billNumber: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Vendor Invoice Number */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vendor Invoice # (Reference)
                  </label>
                  <input
                    type="text"
                    value={bill.vendorInvoiceNumber}
                    onChange={(e) => setBill((prev) => ({ ...prev, vendorInvoiceNumber: e.target.value }))}
                    placeholder="Vendor's invoice number"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Bill Date */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bill Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bill.billDate}
                    onChange={(e) => setBill((prev) => ({ ...prev, billDate: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Payment Terms
                  </label>
                  <select
                    value={bill.paymentTerms}
                    onChange={(e) => setBill((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {PAYMENT_TERMS.map((term) => (
                      <option key={term.value} value={term.value}>
                        {term.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={bill.dueDate}
                    onChange={(e) => setBill((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>
            </div>

            {/* VAT Details */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="h-5 w-5" />
                VAT Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* VAT Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    VAT Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bill.vatCategory}
                    onChange={(e) => handleVatCategoryChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {VAT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Place of Supply */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Place of Supply
                  </label>
                  <select
                    value={bill.placeOfSupply}
                    onChange={(e) => setBill((prev) => ({ ...prev, placeOfSupply: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {EMIRATES.map((emirate) => (
                      <option key={emirate.value} value={emirate.value}>
                        {emirate.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blocked VAT Reason - only shown for BLOCKED category */}
                {bill.vatCategory === 'BLOCKED' && (
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Blocked VAT Reason <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bill.blockedVatReason}
                      onChange={(e) => setBill((prev) => ({ ...prev, blockedVatReason: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="">Select reason...</option>
                      {BLOCKED_VAT_REASONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      Blocked VAT cannot be recovered per UAE FTA Article 53
                    </p>
                  </div>
                )}

                {/* Reverse Charge Notice */}
                {bill.isReverseCharge && (
                  <div className={`md:col-span-2 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-600' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      <strong>Reverse Charge:</strong> You will account for VAT of {formatCurrency(bill.vatAmount)} on this purchase.
                      This will be shown as both input and output VAT on your VAT return.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Package className="h-5 w-5" />
                  Line Items
                </h2>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {bill.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                  >
                    <div className="grid grid-cols-12 gap-4">
                      {/* Product/Description */}
                      <div className="col-span-12 md:col-span-4">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Product / Description
                        </label>
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <option value="">Select or type description...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className={`w-full mt-2 px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 md:col-span-2">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-4 md:col-span-2">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>

                      {/* VAT Rate */}
                      <div className="col-span-4 md:col-span-1">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          VAT %
                        </label>
                        <input
                          type="number"
                          value={item.vatRate}
                          disabled
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-500'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                          }`}
                        />
                      </div>

                      {/* VAT Amount */}
                      <div className="col-span-6 md:col-span-1">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          VAT
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(item.vatAmount)}
                          disabled
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-500'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                          }`}
                        />
                      </div>

                      {/* Amount */}
                      <div className="col-span-6 md:col-span-1">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Amount
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(item.amount)}
                          disabled
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-gray-500'
                              : 'border-gray-300 bg-gray-100 text-gray-500'
                          }`}
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Totals & Notes */}
          <div className="space-y-6">
            {/* Totals */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Subtotal:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(bill.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>VAT ({VAT_CATEGORIES.find(c => c.value === bill.vatCategory)?.rate || 5}%):</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(bill.vatAmount)}
                  </span>
                </div>
                {bill.isReverseCharge && (
                  <div className={`flex justify-between text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <span>Reverse Charge VAT:</span>
                    <span>{formatCurrency(bill.reverseChargeAmount)}</span>
                  </div>
                )}
                <div className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total:
                  </span>
                  <span className="text-lg font-bold text-teal-600">
                    {formatCurrency(bill.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Notes
              </h2>
              <textarea
                value={bill.notes}
                onChange={(e) => setBill((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Internal notes about this bill..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>

            {/* Vendor Details (if selected) */}
            {bill.vendor && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Vendor Details
                </h2>
                <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>
                    <span className="font-medium">Name:</span> {bill.vendor.name}
                  </div>
                  {bill.vendor.trn && (
                    <div>
                      <span className="font-medium">TRN:</span> {bill.vendor.trn}
                    </div>
                  )}
                  {bill.vendor.email && (
                    <div>
                      <span className="font-medium">Email:</span> {bill.vendor.email}
                    </div>
                  )}
                  {bill.vendor.phone && (
                    <div>
                      <span className="font-medium">Phone:</span> {bill.vendor.phone}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorBillForm;
