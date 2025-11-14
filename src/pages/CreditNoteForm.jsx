import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  AlertTriangle,
  Plus,
  Trash2,
  Package,
  FileText,
  Search,
  Loader2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { creditNoteService } from '../services/creditNoteService';
import { invoiceService } from '../services/invoiceService';
import { notificationService } from '../services/notificationService';
import { formatCurrency, formatDateForInput } from '../utils/invoiceUtils';

const RETURN_REASONS = [
  { value: 'defective', label: 'Defective Product' },
  { value: 'damaged', label: 'Damaged in Transit' },
  { value: 'wrong_item', label: 'Wrong Item Sent' },
  { value: 'customer_change_mind', label: 'Customer Changed Mind' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'overcharge', label: 'Overcharge/Pricing Error' },
  { value: 'duplicate_order', label: 'Duplicate Order' },
  { value: 'other', label: 'Other (Specify in Notes)' }
];

const CREDIT_NOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'items_received', label: 'Items Received' },
  { value: 'items_inspected', label: 'Items Inspected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'completed', label: 'Completed' }
];

const REFUND_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_adjustment', label: 'Credit Adjustment' },
  { value: 'credit_card', label: 'Credit Card' }
];

const CreditNoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Form state
  const [creditNote, setCreditNote] = useState({
    creditNoteNumber: '',
    invoiceId: null,
    invoiceNumber: '',
    customer: {
      id: null,
      name: '',
      address: '',
      phone: '',
      email: '',
      trn: ''
    },
    creditNoteDate: formatDateForInput(new Date()),
    status: 'draft',
    reasonForReturn: '',
    items: [],
    subtotal: 0,
    vatAmount: 0,
    totalCredit: 0,
    notes: '',
    // Refund Information
    refundMethod: '',
    refundDate: '',
    refundReference: '',
    // Return Logistics
    expectedReturnDate: '',
    warehouseId: null,
    returnShippingCost: 0,
    // Additional Charges
    restockingFee: 0
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(!id);
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Load credit note if editing
  useEffect(() => {
    if (id) {
      loadCreditNote();
    } else {
      loadNextCreditNoteNumber();
    }
  }, [id]);

  const loadCreditNote = async () => {
    try {
      setLoading(true);
      const data = await creditNoteService.getCreditNote(id);
      setCreditNote(data);
      if (data.invoiceId) {
        const invoice = await invoiceService.getInvoice(data.invoiceId);
        setSelectedInvoice(invoice);
      }
    } catch (error) {
      console.error('Error loading credit note:', error);
      notificationService.error('Failed to load credit note');
    } finally {
      setLoading(false);
    }
  };

  const loadNextCreditNoteNumber = async () => {
    try {
      const response = await creditNoteService.getNextCreditNoteNumber();
      const nextNumber = response.next_number || response.nextNumber || 'CN-0001';
      setCreditNote(prev => ({ ...prev, creditNoteNumber: nextNumber }));
    } catch (error) {
      console.error('Error loading next credit note number:', error);
    }
  };

  // Search invoices with debouncing
  const searchInvoices = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await invoiceService.searchForCreditNote(query);
      setSearchResults(response);
      setShowDropdown(response.length > 0);
    } catch (error) {
      console.error('Error searching invoices:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInput = (value) => {
    setSearchQuery(value);

    // Clear previous timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for 300ms debounce
    const timer = setTimeout(() => {
      searchInvoices(value);
    }, 300);

    setSearchDebounceTimer(timer);
  };

  // Handle invoice selection from dropdown
  const handleInvoiceSelect = (invoice) => {
    loadInvoiceForCreditNote(invoice.id);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const loadInvoiceForCreditNote = async (invoiceId) => {
    try {
      setInvoiceLoading(true);
      const invoice = await invoiceService.getInvoice(invoiceId);

      // Only allow credit notes for issued invoices
      if (invoice.status !== 'issued') {
        notificationService.warning('Credit notes can only be created for Final Tax Invoices');
        return;
      }

      setSelectedInvoice(invoice);

      // Populate credit note with invoice data
      setCreditNote(prev => ({
        ...prev,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        items: invoice.items.map(item => ({
          invoiceItemId: item.id,
          productId: item.productId,
          productName: item.name || item.productName,
          description: item.description || '',
          originalQuantity: item.quantity,
          quantityReturned: 0,
          rate: item.rate,
          amount: 0,
          vatRate: item.vatRate || 5,
          vatAmount: 0,
          returnStatus: 'not_returned',
          selected: false
        }))
      }));

      setShowInvoiceSelect(false);
    } catch (error) {
      console.error('Error loading invoice:', error);
      notificationService.error('Failed to load invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleItemSelect = (index, selected) => {
    const updatedItems = [...creditNote.items];
    updatedItems[index].selected = selected;

    // If deselecting, reset quantity to 0
    if (!selected) {
      updatedItems[index].quantityReturned = 0;
    }

    setCreditNote(prev => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...creditNote.items];
    const item = updatedItems[index];

    // Validate quantity
    const qty = parseFloat(quantity) || 0;
    if (qty > item.originalQuantity) {
      notificationService.warning(`Cannot return more than ${item.originalQuantity} units`);
      return;
    }

    if (qty < 0) {
      return;
    }

    item.quantityReturned = qty;
    item.amount = qty * item.rate;
    item.vatAmount = (item.amount * item.vatRate) / 100;
    item.selected = qty > 0;

    setCreditNote(prev => ({ ...prev, items: updatedItems }));
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items) => {
    const returnedItems = items.filter(item => item.selected && item.quantityReturned > 0);

    const subtotal = returnedItems.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = returnedItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalCredit = subtotal + vatAmount;

    setCreditNote(prev => ({
      ...prev,
      subtotal,
      vatAmount,
      totalCredit
    }));
  };

  const validateForm = () => {
    const errors = [];
    const invalidFieldsSet = new Set();

    if (!creditNote.invoiceId) {
      errors.push('Please select an invoice');
      invalidFieldsSet.add('invoiceId');
    }

    if (!creditNote.creditNoteNumber) {
      errors.push('Credit note number is required');
      invalidFieldsSet.add('creditNoteNumber');
    }

    if (!creditNote.creditNoteDate) {
      errors.push('Credit note date is required');
      invalidFieldsSet.add('creditNoteDate');
    }

    if (!creditNote.reasonForReturn) {
      errors.push('Reason for return is required');
      invalidFieldsSet.add('reasonForReturn');
    }

    const returnedItems = creditNote.items.filter(item => item.selected && item.quantityReturned > 0);
    if (returnedItems.length === 0) {
      errors.push('Please select at least one item with quantity to return');
    }

    returnedItems.forEach((item, index) => {
      if (item.quantityReturned > item.originalQuantity) {
        errors.push(`Item "${item.productName}": Cannot return more than original quantity`);
      }
    });

    setValidationErrors(errors);
    setInvalidFields(invalidFieldsSet);

    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setTimeout(() => {
        document.getElementById('validation-errors-alert')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    try {
      setSaving(true);

      // Filter only returned items
      const returnedItems = creditNote.items.filter(item => item.selected && item.quantityReturned > 0);

      const creditNoteData = {
        ...creditNote,
        items: returnedItems
      };

      if (id) {
        await creditNoteService.updateCreditNote(id, creditNoteData);
        notificationService.success('Credit note updated successfully');
      } else {
        await creditNoteService.createCreditNote(creditNoteData);
        notificationService.success('Credit note created successfully');
      }

      navigate('/credit-notes');
    } catch (error) {
      console.error('Error saving credit note:', error);
      notificationService.error(error?.response?.data?.error || 'Failed to save credit note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading credit note...</p>
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
              onClick={() => navigate('/credit-notes')}
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
                {id ? 'Edit Credit Note' : 'New Credit Note'}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {id ? `Editing ${creditNote.creditNoteNumber}` : 'Create credit note for returned items'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Credit Note'}
            </button>
          </div>
        </div>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div
            id="validation-errors-alert"
            className={`mb-6 p-4 rounded-lg border-2 ${
              isDarkMode
                ? 'bg-red-900/20 border-red-600 text-red-200'
                : 'bg-red-50 border-red-500 text-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} size={24} />
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-2">Please fix the following errors:</h4>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Selection */}
            {showInvoiceSelect && !id && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="inline h-5 w-5 mr-2" />
                  Select Invoice
                </h2>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <input
                        type="text"
                        placeholder="Start typing invoice number or customer name..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onFocus={() => {
                          if (searchResults.length > 0) {
                            setShowDropdown(true);
                          }
                        }}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                          invalidFields.has('invoiceId')
                            ? 'border-red-500'
                            : isDarkMode
                            ? 'border-gray-600 bg-gray-700 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                      {isSearching && (
                        <Loader2 className={`absolute right-3 top-3 h-5 w-5 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-96 overflow-y-auto ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                      }`}>
                        {searchResults.map((invoice) => (
                          <button
                            key={invoice.id}
                            type="button"
                            onClick={() => handleInvoiceSelect(invoice)}
                            className={`w-full px-4 py-3 text-left hover:bg-opacity-80 transition-colors border-b last:border-b-0 ${
                              isDarkMode
                                ? 'border-gray-700 hover:bg-gray-700'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {invoice.invoice_number}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {invoice.customer_name}
                                  {invoice.customer_email && (
                                    <span className="ml-2">• {invoice.customer_email}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className={`font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                  {formatCurrency(invoice.total)}
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {new Date(invoice.invoice_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                      <div className={`absolute z-10 w-full mt-1 p-4 rounded-lg shadow-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600'
                      }`}>
                        No issued invoices found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Type to search invoices by number or customer name
                  </p>
                </div>
              </div>
            )}

            {/* Selected Invoice Info */}
            {selectedInvoice && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Invoice: {selectedInvoice.invoiceNumber}
                  </h2>
                  {!id && (
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                        setShowInvoiceSelect(true);
                        setCreditNote(prev => ({
                          ...prev,
                          invoiceId: null,
                          invoiceNumber: '',
                          items: []
                        }));
                      }}
                      className={`text-sm ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
                    >
                      Change Invoice
                    </button>
                  )}
                </div>
                <div className={`grid grid-cols-2 gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>
                    <span className="font-medium">Customer:</span> {selectedInvoice.customer?.name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(selectedInvoice.date).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> {formatCurrency(selectedInvoice.total)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedInvoice.status}
                  </div>
                </div>
              </div>
            )}

            {/* Items to Return */}
            {selectedInvoice && creditNote.items.length > 0 && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Package className="inline h-5 w-5 mr-2" />
                  Select Items to Return
                </h2>
                <div className="space-y-3">
                  {creditNote.items.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        item.selected
                          ? isDarkMode
                            ? 'border-teal-500 bg-teal-900/20'
                            : 'border-teal-500 bg-teal-50'
                          : isDarkMode
                          ? 'border-gray-600'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => handleItemSelect(index, e.target.checked)}
                          className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.productName}
                              </h3>
                              {item.description && (
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className={`text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <div>Rate: {formatCurrency(item.rate)}</div>
                              {item.selected && item.quantityReturned > 0 && (
                                <div className="font-semibold text-teal-600">
                                  Credit: {formatCurrency(item.amount + item.vatAmount)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Original Qty
                              </label>
                              <input
                                type="number"
                                value={item.originalQuantity}
                                disabled
                                className={`w-full px-3 py-2 rounded border text-sm ${
                                  isDarkMode
                                    ? 'border-gray-600 bg-gray-700 text-gray-500'
                                    : 'border-gray-300 bg-gray-100 text-gray-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Return Qty <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.originalQuantity}
                                value={item.quantityReturned}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                disabled={!item.selected}
                                className={`w-full px-3 py-2 rounded border text-sm ${
                                  isDarkMode
                                    ? 'border-gray-600 bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-500'
                                    : 'border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                              />
                            </div>
                            <div>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credit Note Details */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Credit Note Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Credit Note Number
                  </label>
                  <input
                    type="text"
                    value={creditNote.creditNoteNumber}
                    disabled
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-gray-500'
                        : 'border-gray-300 bg-gray-100 text-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={creditNote.creditNoteDate}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, creditNoteDate: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      invalidFields.has('creditNoteDate')
                        ? 'border-red-500'
                        : isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={creditNote.status}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, status: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {CREDIT_NOTE_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason for Return <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={creditNote.reasonForReturn}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, reasonForReturn: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      invalidFields.has('reasonForReturn')
                        ? 'border-red-500'
                        : isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="">Select reason...</option>
                    {RETURN_REASONS.map(reason => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes
                  </label>
                  <textarea
                    value={creditNote.notes}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder="Additional notes about the return..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>
            </div>

            {/* Refund Information */}
            {(creditNote.status === 'refunded' || creditNote.status === 'completed') && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Refund Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Refund Method
                    </label>
                    <select
                      value={creditNote.refundMethod}
                      onChange={(e) => setCreditNote(prev => ({ ...prev, refundMethod: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="">Select method...</option>
                      {REFUND_METHODS.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Refund Date
                    </label>
                    <input
                      type="date"
                      value={creditNote.refundDate}
                      onChange={(e) => setCreditNote(prev => ({ ...prev, refundDate: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Refund Reference/Transaction ID
                    </label>
                    <input
                      type="text"
                      value={creditNote.refundReference}
                      onChange={(e) => setCreditNote(prev => ({ ...prev, refundReference: e.target.value }))}
                      placeholder="e.g., TXN12345, CHQ67890"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Return Logistics */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Return Logistics
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={creditNote.expectedReturnDate}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Return Shipping Cost (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={creditNote.returnShippingCost}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, returnShippingCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Restocking Fee (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={creditNote.restockingFee}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, restockingFee: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Fee charged for processing the return
                  </p>
                </div>
              </div>
            </div>

            {/* Credit Summary */}
            {creditNote.items.some(item => item.selected) && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Credit Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Subtotal:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(creditNote.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>VAT (5%):</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(creditNote.vatAmount)}
                    </span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Total Credit:
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(creditNote.totalCredit)}
                    </span>
                  </div>

                  {/* Deductions */}
                  {(creditNote.restockingFee > 0 || creditNote.returnShippingCost > 0) && (
                    <>
                      <div className={`pt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                        <div className="font-medium mb-2">Deductions:</div>
                        {creditNote.restockingFee > 0 && (
                          <div className="flex justify-between ml-2">
                            <span>Restocking Fee:</span>
                            <span className="text-red-600">
                              -{formatCurrency(creditNote.restockingFee)}
                            </span>
                          </div>
                        )}
                        {creditNote.returnShippingCost > 0 && (
                          <div className="flex justify-between ml-2">
                            <span>Return Shipping:</span>
                            <span className="text-red-600">
                              -{formatCurrency(creditNote.returnShippingCost)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Net Refund:
                        </span>
                        <span className="text-lg font-bold text-teal-600">
                          {formatCurrency(creditNote.totalCredit - creditNote.restockingFee - creditNote.returnShippingCost)}
                        </span>
                      </div>
                    </>
                  )}

                  {!(creditNote.restockingFee > 0 || creditNote.returnShippingCost > 0) && (
                    <div className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Net Refund:
                      </span>
                      <span className="text-lg font-bold text-teal-600">
                        {formatCurrency(creditNote.totalCredit)}
                      </span>
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

export default CreditNoteForm;
