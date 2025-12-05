/**
 * DebitNoteForm.jsx - UAE VAT Compliance
 *
 * Form for creating/editing debit notes (adjustments to vendor bills).
 * Links to original vendor bill and supports line item copying.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  Package,
  Link2,
  Search,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import debitNoteService from '../../services/debitNoteService';
import vendorBillService from '../../services/vendorBillService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDateForInput } from '../../utils/invoiceUtils';

// Reason categories
const REASON_CATEGORIES = [
  { value: 'PRICE_ADJUSTMENT', label: 'Price Adjustment' },
  { value: 'QUANTITY_ADJUSTMENT', label: 'Quantity Adjustment' },
  { value: 'ADDITIONAL_CHARGES', label: 'Additional Charges' },
  { value: 'SERVICE_CHARGE', label: 'Service Charge' },
  { value: 'OTHER', label: 'Other' },
];

// VAT categories
const VAT_CATEGORIES = [
  { value: 'STANDARD', label: 'Standard Rate (5%)', rate: 5 },
  { value: 'ZERO_RATED', label: 'Zero Rated (0%)', rate: 0 },
  { value: 'EXEMPT', label: 'Exempt', rate: 0 },
  { value: 'REVERSE_CHARGE', label: 'Reverse Charge', rate: 5 },
];

// Empty line item template
const createEmptyItem = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  vendorBillItemId: null,
  productId: null,
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  vatRate: 5,
  vatAmount: 0,
});

const DebitNoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorBillSearching, setVendorBillSearching] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Vendor bill search
  const [vendorBillSearch, setVendorBillSearch] = useState('');
  const [vendorBillResults, setVendorBillResults] = useState([]);
  const [showVendorBillDropdown, setShowVendorBillDropdown] = useState(false);
  const [selectedVendorBill, setSelectedVendorBill] = useState(null);

  // Debit note data state
  const [debitNote, setDebitNote] = useState({
    vendorBillId: null,
    vendorBillNumber: '',
    vendorId: null,
    vendor: null,
    debitNoteNumber: '',
    debitNoteDate: formatDateForInput(new Date()),
    reason: '',
    reasonCategory: 'PRICE_ADJUSTMENT',
    vatCategory: 'STANDARD',
    isReverseCharge: false,
    subtotal: 0,
    vatAmount: 0,
    totalDebit: 0,
    status: 'draft',
    notes: '',
    items: [createEmptyItem()],
  });

  // Load initial data
  useEffect(() => {
    if (isEditMode) {
      loadDebitNote();
    } else {
      loadNextDebitNoteNumber();
      // Check for vendorBillId in URL params
      const vendorBillIdParam = searchParams.get('vendorBillId');
      if (vendorBillIdParam) {
        loadVendorBill(vendorBillIdParam);
      }
    }
  }, [id]);

  // Search vendor bills with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vendorBillSearch && vendorBillSearch.length >= 2) {
        searchVendorBills(vendorBillSearch);
      } else {
        setVendorBillResults([]);
        setShowVendorBillDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorBillSearch]);

  const loadDebitNote = async () => {
    try {
      setLoading(true);
      const data = await debitNoteService.getById(id);
      setDebitNote({
        ...data,
        items: data.items?.length > 0 ? data.items : [createEmptyItem()],
      });
      if (data.vendorBillId) {
        const bill = await vendorBillService.getById(data.vendorBillId);
        setSelectedVendorBill(bill);
      }
    } catch (error) {
      console.error('Error loading debit note:', error);
      notificationService.error('Failed to load debit note');
      navigate('/purchases/debit-notes');
    } finally {
      setLoading(false);
    }
  };

  const loadNextDebitNoteNumber = async () => {
    try {
      const response = await debitNoteService.getNextNumber();
      setDebitNote((prev) => ({ ...prev, debitNoteNumber: response.debitNoteNumber || 'DN-0001' }));
    } catch (error) {
      console.error('Error loading next debit note number:', error);
    }
  };

  const searchVendorBills = async (query) => {
    try {
      setVendorBillSearching(true);
      const results = await vendorBillService.search(query);
      setVendorBillResults(results);
      setShowVendorBillDropdown(results.length > 0);
    } catch (error) {
      console.error('Error searching vendor bills:', error);
      setVendorBillResults([]);
    } finally {
      setVendorBillSearching(false);
    }
  };

  const loadVendorBill = async (billId) => {
    try {
      const bill = await vendorBillService.getById(billId);
      setSelectedVendorBill(bill);
      setDebitNote((prev) => ({
        ...prev,
        vendorBillId: bill.id,
        vendorBillNumber: bill.billNumber,
        vendorId: bill.vendorId,
        vendor: bill.vendorDetails || { name: bill.vendorName, trn: bill.vendorTrn },
        vatCategory: bill.vatCategory || 'STANDARD',
        isReverseCharge: bill.isReverseCharge || false,
      }));
      setVendorBillSearch('');
      setShowVendorBillDropdown(false);
    } catch (error) {
      console.error('Error loading vendor bill:', error);
      notificationService.error('Failed to load vendor bill');
    }
  };

  // Handle vendor bill selection
  const handleVendorBillSelect = (bill) => {
    loadVendorBill(bill.id);
  };

  // Copy items from vendor bill
  const handleCopyItemsFromBill = () => {
    if (!selectedVendorBill || !selectedVendorBill.items) {
      notificationService.warning('No items to copy from vendor bill');
      return;
    }

    const copiedItems = selectedVendorBill.items.map((item) => ({
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendorBillItemId: item.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      vatRate: item.vatRate || 5,
      vatAmount: item.vatAmount || 0,
    }));

    setDebitNote((prev) => ({ ...prev, items: copiedItems }));
    recalculateTotals(copiedItems);
    notificationService.success('Items copied from vendor bill');
  };

  // Add new line item
  const handleAddItem = () => {
    setDebitNote((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  // Remove line item
  const handleRemoveItem = (index) => {
    if (debitNote.items.length <= 1) {
      notificationService.warning('At least one item is required');
      return;
    }
    const updatedItems = debitNote.items.filter((_, i) => i !== index);
    setDebitNote((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Update line item
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...debitNote.items];
    const item = { ...updatedItems[index] };
    item[field] = value;

    // Recalculate item amounts
    if (['quantity', 'unitPrice', 'vatRate'].includes(field)) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 0;
      item.amount = qty * price;
      item.vatAmount = (item.amount * vatRate) / 100;
    }

    updatedItems[index] = item;
    setDebitNote((prev) => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  // Recalculate totals
  const recalculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vatAmount) || 0), 0);
    const totalDebit = subtotal + vatAmount;

    setDebitNote((prev) => ({
      ...prev,
      subtotal,
      vatAmount,
      totalDebit,
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!debitNote.vendorBillId) {
      errors.push('Please select a vendor bill');
    }
    if (!debitNote.debitNoteNumber) {
      errors.push('Debit note number is required');
    }
    if (!debitNote.debitNoteDate) {
      errors.push('Debit note date is required');
    }
    if (!debitNote.reason) {
      errors.push('Reason is required');
    }

    const validItems = debitNote.items.filter(
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
      const validItems = debitNote.items.filter(
        (item) => item.description && item.quantity > 0 && item.unitPrice > 0,
      );

      const debitNoteData = {
        ...debitNote,
        status,
        items: validItems,
      };

      if (isEditMode) {
        await debitNoteService.update(id, debitNoteData);
        notificationService.success('Debit note updated successfully');
      } else {
        await debitNoteService.create(debitNoteData);
        notificationService.success('Debit note created successfully');
      }

      navigate('/purchases/debit-notes');
    } catch (error) {
      console.error('Error saving debit note:', error);
      notificationService.error(error.message || 'Failed to save debit note');
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
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading debit note...</p>
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
              onClick={() => navigate('/purchases/debit-notes')}
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
                {isEditMode ? 'Edit Debit Note' : 'New Debit Note'}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isEditMode ? `Editing ${debitNote.debitNoteNumber}` : 'Create a new debit note for vendor bill adjustment'}
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
            {/* Vendor Bill Selection */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Link2 className="h-5 w-5" />
                Linked Vendor Bill <span className="text-red-500">*</span>
              </h2>

              {!selectedVendorBill ? (
                <div className="relative">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      placeholder="Search vendor bill by number or vendor name..."
                      value={vendorBillSearch}
                      onChange={(e) => setVendorBillSearch(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    {vendorBillSearching && (
                      <Loader2 className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {showVendorBillDropdown && vendorBillResults.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    }`}>
                      {vendorBillResults.map((bill) => (
                        <button
                          key={bill.id}
                          type="button"
                          onClick={() => handleVendorBillSelect(bill)}
                          className={`w-full px-4 py-3 text-left hover:bg-opacity-80 transition-colors border-b last:border-b-0 ${
                            isDarkMode
                              ? 'border-gray-700 hover:bg-gray-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {bill.billNumber}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {bill.vendorName}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                {formatCurrency(bill.total)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-teal-600 bg-teal-900/20' : 'border-teal-500 bg-teal-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVendorBill.billNumber}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Vendor: {selectedVendorBill.vendorName}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total: {formatCurrency(selectedVendorBill.total)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyItemsFromBill}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-teal-700 text-teal-100 hover:bg-teal-600'
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                      >
                        Copy Items
                      </button>
                      {!isEditMode && (
                        <button
                          onClick={() => {
                            setSelectedVendorBill(null);
                            setDebitNote((prev) => ({
                              ...prev,
                              vendorBillId: null,
                              vendorBillNumber: '',
                              vendorId: null,
                              vendor: null,
                            }));
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Debit Note Details */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="h-5 w-5" />
                Debit Note Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Debit Note Number */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Debit Note Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={debitNote.debitNoteNumber}
                    onChange={(e) => setDebitNote((prev) => ({ ...prev, debitNoteNumber: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Debit Note Date */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={debitNote.debitNoteDate}
                    onChange={(e) => setDebitNote((prev) => ({ ...prev, debitNoteDate: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Reason Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason Category
                  </label>
                  <select
                    value={debitNote.reasonCategory}
                    onChange={(e) => setDebitNote((prev) => ({ ...prev, reasonCategory: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {REASON_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VAT Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    VAT Category
                  </label>
                  <select
                    value={debitNote.vatCategory}
                    onChange={(e) => setDebitNote((prev) => ({ ...prev, vatCategory: e.target.value }))}
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

                {/* Reason */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={debitNote.reason}
                    onChange={(e) => setDebitNote((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    placeholder="Describe the reason for this debit note..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
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
                {debitNote.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                  >
                    <div className="grid grid-cols-12 gap-4">
                      {/* Description */}
                      <div className="col-span-12 md:col-span-5">
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className={`w-full px-3 py-2 rounded border text-sm ${
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

                      {/* Amount */}
                      <div className="col-span-4 md:col-span-2">
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
                    {formatCurrency(debitNote.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>VAT:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(debitNote.vatAmount)}
                  </span>
                </div>
                <div className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total Debit:
                  </span>
                  <span className="text-lg font-bold text-amber-600">
                    +{formatCurrency(debitNote.totalDebit)}
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
                value={debitNote.notes}
                onChange={(e) => setDebitNote((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Internal notes about this debit note..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>

            {/* Vendor Details (if vendor bill selected) */}
            {debitNote.vendor && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Vendor
                </h2>
                <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>
                    <span className="font-medium">Name:</span> {debitNote.vendor.name}
                  </div>
                  {debitNote.vendor.trn && (
                    <div>
                      <span className="font-medium">TRN:</span> {debitNote.vendor.trn}
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

export default DebitNoteForm;
