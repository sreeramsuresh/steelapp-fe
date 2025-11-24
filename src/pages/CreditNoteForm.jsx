import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Loader2,
  Filter,
  X,
  Clock,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { creditNoteService } from '../services/creditNoteService';
import { invoiceService } from '../services/invoiceService';
import { notificationService } from '../services/notificationService';
import { formatCurrency, formatDateForInput } from '../utils/invoiceUtils';
import useCreditNoteDrafts, { getDraftStatusMessage } from '../hooks/useCreditNoteDrafts';
import DraftConflictModal from '../components/DraftConflictModal';
import CreditNotePreview from '../components/credit-notes/CreditNotePreview';

// Reason categories determine credit note type and required fields
const REASON_CATEGORIES = {
  PHYSICAL_RETURN: 'physical_return',  // Requires items, QC, logistics
  FINANCIAL_ONLY: 'financial_only',    // Items optional, no logistics
  FLEXIBLE: 'flexible',                // User chooses
};

const RETURN_REASONS = [
  // Physical Return reasons - require items and logistics
  { value: 'defective', label: 'Defective Product', category: REASON_CATEGORIES.PHYSICAL_RETURN },
  { value: 'damaged', label: 'Damaged in Transit', category: REASON_CATEGORIES.PHYSICAL_RETURN },
  { value: 'wrong_item', label: 'Wrong Item Sent', category: REASON_CATEGORIES.PHYSICAL_RETURN },
  { value: 'quality_issue', label: 'Quality Issue', category: REASON_CATEGORIES.PHYSICAL_RETURN },
  { value: 'customer_change_mind', label: 'Customer Changed Mind', category: REASON_CATEGORIES.PHYSICAL_RETURN },
  // Financial Only reasons - no physical return
  { value: 'overcharge', label: 'Overcharge/Pricing Error', category: REASON_CATEGORIES.FINANCIAL_ONLY },
  { value: 'duplicate_order', label: 'Duplicate Order', category: REASON_CATEGORIES.FINANCIAL_ONLY },
  { value: 'goodwill_credit', label: 'Goodwill Credit', category: REASON_CATEGORIES.FINANCIAL_ONLY },
  // Flexible - user decides
  { value: 'other', label: 'Other (Specify in Notes)', category: REASON_CATEGORIES.FLEXIBLE },
];

// Helper to get reason category
const getReasonCategory = (reasonValue) => {
  const reason = RETURN_REASONS.find(r => r.value === reasonValue);
  return reason?.category || REASON_CATEGORIES.FLEXIBLE;
};

// Helper to determine if reason requires physical return
const isPhysicalReturnReason = (reasonValue) => {
  return getReasonCategory(reasonValue) === REASON_CATEGORIES.PHYSICAL_RETURN;
};

// Helper to determine if reason is financial only
const isFinancialOnlyReason = (reasonValue) => {
  return getReasonCategory(reasonValue) === REASON_CATEGORIES.FINANCIAL_ONLY;
};

const CREDIT_NOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'items_received', label: 'Items Received' },
  { value: 'items_inspected', label: 'Items Inspected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'completed', label: 'Completed' },
];

const REFUND_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_adjustment', label: 'Credit Adjustment' },
  { value: 'credit_card', label: 'Credit Card' },
];

const CREDIT_NOTE_TYPES = [
  { value: 'ACCOUNTING_ONLY', label: 'Accounting Only', description: 'Financial adjustment without physical return' },
  { value: 'RETURN_WITH_QC', label: 'Return with QC', description: 'Physical return requiring quality inspection' },
];

const CreditNoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
      trn: '',
    },
    creditNoteDate: formatDateForInput(new Date()),
    status: 'draft',
    creditNoteType: 'ACCOUNTING_ONLY',
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
    // QC Information (for RETURN_WITH_QC type)
    qcResult: null,
    qcNotes: '',
    qcInspectedAt: null,
    qcInspectedBy: null,
    // Return Logistics
    expectedReturnDate: '',
    warehouseId: null,
    returnShippingCost: 0,
    // Additional Charges
    restockingFee: 0,
    // Manual Credit Amount (for ACCOUNTING_ONLY when no items selected)
    manualCreditAmount: 0,
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(!id);
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());
  const [touchedFields, setTouchedFields] = useState(new Set());

  // Mark a field as touched (for showing validation on blur)
  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  // Check if a field should show error state
  const shouldShowError = (fieldName) => {
    return touchedFields.has(fieldName) && invalidFields.has(fieldName);
  };

  // Field-level error messages
  const fieldErrors = {
    invoiceId: 'Please select an invoice',
    creditNoteNumber: 'Credit note number is required',
    creditNoteDate: 'Date is required',
    reasonForReturn: 'Reason for return is required',
    items: 'Please select at least one item with quantity to return',
    manualCreditAmount: 'Credit amount is required when no items selected',
    expectedReturnDate: 'Expected return date is required for physical returns',
  };

  // Derived state: Determine if this is a physical return based on reason OR type
  const isPhysicalReturn = useMemo(() => {
    // If reason is set and it's a physical return reason, it's physical
    if (creditNote.reasonForReturn && isPhysicalReturnReason(creditNote.reasonForReturn)) {
      return true;
    }
    // If reason is financial only, it's not physical
    if (creditNote.reasonForReturn && isFinancialOnlyReason(creditNote.reasonForReturn)) {
      return false;
    }
    // For 'other' or no reason, check the credit note type
    return creditNote.creditNoteType === 'RETURN_WITH_QC';
  }, [creditNote.reasonForReturn, creditNote.creditNoteType]);

  // Derived state: Items are required only for physical returns
  const itemsRequired = isPhysicalReturn;

  // Derived state: Logistics section visible only for physical returns
  const showLogisticsSection = isPhysicalReturn;

  // Derived state: Check if any items have been selected with quantity
  const hasSelectedItems = useMemo(() => {
    return creditNote.items.some(item => item.selected && item.quantityReturned > 0);
  }, [creditNote.items]);

  // Handle reason change - auto-select credit note type
  const handleReasonChange = (newReason) => {
    const category = getReasonCategory(newReason);
    let newType = creditNote.creditNoteType;

    // Auto-select type based on reason category
    if (category === REASON_CATEGORIES.PHYSICAL_RETURN) {
      newType = 'RETURN_WITH_QC';
    } else if (category === REASON_CATEGORIES.FINANCIAL_ONLY) {
      newType = 'ACCOUNTING_ONLY';
    }
    // For FLEXIBLE, keep current type (user can change manually)

    setCreditNote(prev => ({
      ...prev,
      reasonForReturn: newReason,
      creditNoteType: newType,
    }));

    // Clear validation error for reason
    if (newReason) {
      setInvalidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('reasonForReturn');
        return newSet;
      });
    }
  };

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');

  // Draft conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);

  // Initialize draft system - pass invoiceId from URL param or form state
  const currentInvoiceId = creditNote.invoiceId || searchParams.get('invoiceId');
  
  const handleDraftConflict = useCallback((conflict) => {
    setPendingConflict(conflict);
    setShowConflictModal(true);
  }, []);

  const {
    saveDraft,
    getDraft,
    deleteDraft,
    hasDraftForInvoice,
    checkConflict,
    setPendingSave,
    clearPendingSave,
    refreshDrafts,
  } = useCreditNoteDrafts({
    currentInvoiceId: currentInvoiceId ? parseInt(currentInvoiceId) : null,
    onConflict: handleDraftConflict,
  });

  // Load credit note if editing, or load invoice from query param
  useEffect(() => {
    if (id) {
      loadCreditNote();
    } else {
      loadNextCreditNoteNumber();

      // Check for invoiceId query parameter (from invoice list navigation)
      const invoiceIdParam = searchParams.get('invoiceId');
      if (invoiceIdParam) {
        // Check for existing draft conflict before loading invoice
        const conflict = checkConflict(parseInt(invoiceIdParam));
        if (conflict.type) {
          handleDraftConflict(conflict);
        } else {
          loadInvoiceForCreditNote(invoiceIdParam);
        }
      }
    }
  }, [id]);

  // Track form changes for silent save on exit (no browser warning)
  useEffect(() => {
    // Only track if we have an invoice selected and not editing existing credit note
    if (!id && creditNote.invoiceId && creditNote.items.length > 0) {
      // Check if there are meaningful changes (at least some data entered)
      const hasChanges = creditNote.items.some(item => item.selected || item.quantityReturned > 0) ||
                         creditNote.reasonForReturn ||
                         creditNote.notes;
      
      if (hasChanges) {
        setPendingSave(creditNote, {
          invoiceId: creditNote.invoiceId,
          invoiceNumber: creditNote.invoiceNumber,
          customerName: creditNote.customer?.name || '',
        });
      } else {
        clearPendingSave();
      }
    }
    
    return () => {
      // Cleanup on unmount is handled by the hook
    };
  }, [creditNote, id, setPendingSave, clearPendingSave]);

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

  // Handle draft conflict resolution
  const handleResumeDraft = useCallback(async (draft) => {
    setIsRestoringDraft(true);
    try {
      // Load the invoice first
      const invoice = await invoiceService.getInvoice(draft.invoiceId);
      setSelectedInvoice(invoice);
      
      // Restore the draft data
      setCreditNote(draft.data);
      setShowInvoiceSelect(false);
      setShowConflictModal(false);
      setPendingConflict(null);
      
      notificationService.success('Draft restored successfully');
    } catch (error) {
      console.error('Error restoring draft:', error);
      notificationService.error('Failed to restore draft');
    } finally {
      setIsRestoringDraft(false);
    }
  }, []);

  const handleDiscardDraft = useCallback((invoiceId) => {
    deleteDraft(invoiceId);
    setShowConflictModal(false);
    setPendingConflict(null);
    
    // Continue with the original action
    const invoiceIdParam = searchParams.get('invoiceId');
    if (invoiceIdParam) {
      loadInvoiceForCreditNote(invoiceIdParam);
    }
    
    notificationService.info('Draft discarded');
  }, [deleteDraft, searchParams]);

  const handleStartFresh = useCallback(() => {
    setShowConflictModal(false);
    setPendingConflict(null);
    
    // Continue with loading the new invoice
    const invoiceIdParam = searchParams.get('invoiceId');
    if (invoiceIdParam) {
      loadInvoiceForCreditNote(invoiceIdParam);
    }
  }, [searchParams]);

  const loadNextCreditNoteNumber = async () => {
    try {
      const response = await creditNoteService.getNextCreditNoteNumber();
      const nextNumber = response.nextNumber || response.nextNumber || 'CN-0001';
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

  // Filter results based on date and amount
  const filteredResults = useMemo(() => {
    let results = searchResults;

    // Date filter
    if (dateFilter !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter));
      results = results.filter(inv =>
        new Date(inv.invoiceDate) >= daysAgo,
      );
    }

    // Amount filter
    if (amountFilter !== 'all') {
      results = results.filter(inv =>
        inv.total >= parseInt(amountFilter),
      );
    }

    return results;
  }, [searchResults, dateFilter, amountFilter]);

  // Clear all filters
  const clearFilters = () => {
    setDateFilter('all');
    setAmountFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = dateFilter !== 'all' || amountFilter !== 'all';

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
      // Handle both 'issued' and 'STATUS_ISSUED' formats from API
      const normalizedStatus = invoice.status?.toLowerCase().replace('status_', '');
      if (normalizedStatus !== 'issued') {
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
          selected: false,
        })),
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
      totalCredit,
    }));
  };

  const validateForm = () => {
    const errors = [];
    const invalidFieldsSet = new Set();
    const touchedFieldsSet = new Set(['invoiceId', 'creditNoteDate', 'reasonForReturn']);

    // Always required
    if (!creditNote.invoiceId) {
      errors.push('Please select an invoice');
      invalidFieldsSet.add('invoiceId');
    }

    if (!creditNote.creditNoteNumber) {
      errors.push('Credit note number is required');
      invalidFieldsSet.add('creditNoteNumber');
    }

    if (!creditNote.creditNoteDate) {
      errors.push('Date is required');
      invalidFieldsSet.add('creditNoteDate');
    }

    if (!creditNote.reasonForReturn) {
      errors.push('Reason for return is required');
      invalidFieldsSet.add('reasonForReturn');
    }

    const returnedItems = creditNote.items.filter(item => item.selected && item.quantityReturned > 0);

    // Conditional validation based on credit note type
    if (isPhysicalReturn) {
      // RETURN_WITH_QC: Items are mandatory
      touchedFieldsSet.add('items');
      touchedFieldsSet.add('expectedReturnDate');

      if (returnedItems.length === 0) {
        errors.push('Please select at least one item with quantity to return');
        invalidFieldsSet.add('items');
      }

      if (!creditNote.expectedReturnDate) {
        errors.push('Expected return date is required for physical returns');
        invalidFieldsSet.add('expectedReturnDate');
      }
    } else {
      // ACCOUNTING_ONLY: Either items OR manual credit amount required
      touchedFieldsSet.add('manualCreditAmount');

      const hasManualAmount = creditNote.manualCreditAmount > 0;
      const hasItems = returnedItems.length > 0;

      if (!hasItems && !hasManualAmount) {
        errors.push('Either select items to credit OR enter a manual credit amount');
        invalidFieldsSet.add('manualCreditAmount');
      }
    }

    // Validate item quantities (if any items selected)
    returnedItems.forEach((item) => {
      if (item.quantityReturned > item.originalQuantity) {
        errors.push(`Item "${item.productName}": Cannot return more than original quantity`);
      }
    });

    setValidationErrors(errors);
    setInvalidFields(invalidFieldsSet);

    // Mark required fields as touched when validation runs (on save attempt)
    setTouchedFields(touchedFieldsSet);

    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setTimeout(() => {
        document.getElementById('validation-errors-alert')
          ?.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, 100);
      return;
    }

    try {
      setSaving(true);

      // Filter only returned items
      const returnedItems = creditNote.items.filter(item => item.selected && item.quantityReturned > 0);

      const creditNoteData = {
        ...creditNote,
        items: returnedItems,
      };

      if (id) {
        await creditNoteService.updateCreditNote(id, creditNoteData);
        notificationService.success('Credit note updated successfully');
      } else {
        await creditNoteService.createCreditNote(creditNoteData);
        notificationService.success('Credit note created successfully');
      }

      // Clear the draft after successful save
      if (creditNote.invoiceId) {
        clearPendingSave();
        deleteDraft(creditNote.invoiceId);
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
      {/* Draft Conflict Modal */}
      {showConflictModal && pendingConflict && (
        <DraftConflictModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          conflict={pendingConflict}
          onResume={handleResumeDraft}
          onDiscard={handleDiscardDraft}
          onStartFresh={handleStartFresh}
          isLoading={isRestoringDraft}
          isDarkMode={isDarkMode}
        />
      )}
      
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
            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Preview credit note"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors ${
                saving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Credit Note
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mandatory Field Indicator Legend */}
        <div className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="text-red-500 font-bold">*</span> indicates required fields
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
                    Invoice Number <span className="text-red-500 font-bold">*</span>
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
                        onBlur={() => handleFieldBlur('invoiceId')}
                        aria-required="true"
                        aria-invalid={shouldShowError('invoiceId')}
                        className={`w-full pl-10 pr-10 py-2 rounded-lg border transition-colors ${
                          shouldShowError('invoiceId') || invalidFields.has('invoiceId')
                            ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500'
                            : isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500'
                              : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500'
                        } focus:outline-none focus:ring-2`}
                      />
                      {isSearching && (
                        <Loader2 className={`absolute right-3 top-3 h-5 w-5 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </div>

                    {/* Filter Controls */}
                    {searchResults.length > 0 && (
                      <div className={`flex flex-wrap gap-2 mt-3 items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1">
                          <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Filters:</span>
                        </div>

                        {/* Date Filter */}
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <option value="all">All dates</option>
                          <option value="7">Last 7 days</option>
                          <option value="30">Last 30 days</option>
                          <option value="90">Last 90 days</option>
                        </select>

                        {/* Amount Filter */}
                        <select
                          value={amountFilter}
                          onChange={(e) => setAmountFilter(e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border ${
                            isDarkMode
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        >
                          <option value="all">All amounts</option>
                          <option value="1000">Above AED 1,000</option>
                          <option value="5000">Above AED 5,000</option>
                          <option value="10000">Above AED 10,000</option>
                        </select>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            title="Clear all filters"
                          >
                            <X size={14} />
                            Clear
                          </button>
                        )}

                        {/* Results Count */}
                        <span className={`ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {filteredResults.length} of {searchResults.length} results
                        </span>
                      </div>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showDropdown && filteredResults.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-96 overflow-y-auto ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                      }`}>
                        {filteredResults.map((invoice) => (
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
                                  {invoice.invoiceNumber}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {invoice.customerName}
                                  {invoice.customerEmail && (
                                    <span className="ml-2">• {invoice.customerEmail}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className={`font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                  {formatCurrency(invoice.total)}
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No search results message */}
                    {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                      <div className={`absolute z-10 w-full mt-1 p-4 rounded-lg shadow-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600'
                      }`}>
                        No issued invoices found matching &quot;{searchQuery}&quot;
                      </div>
                    )}

                    {/* No filtered results message */}
                    {showDropdown && searchResults.length > 0 && filteredResults.length === 0 && (
                      <div className={`absolute z-10 w-full mt-1 p-4 rounded-lg shadow-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600'
                      }`}>
                        No invoices match the selected filters. Try adjusting or{' '}
                        <button
                          type="button"
                          onClick={clearFilters}
                          className={`underline ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
                        >
                          clearing filters
                        </button>
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
                          items: [],
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
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm ${
                invalidFields.has('items') ? 'ring-2 ring-red-500' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Package className="inline h-5 w-5 mr-2" />
                    Select Items to {isPhysicalReturn ? 'Return' : 'Credit'} {itemsRequired && <span className="text-red-500 font-bold">*</span>}
                  </h2>
                  <div className="flex items-center gap-2">
                    {!itemsRequired && (
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        Optional
                      </span>
                    )}
                    {invalidFields.has('items') && (
                      <span className="text-red-500 text-sm flex items-center gap-1">
                        <AlertTriangle size={14} />
                        At least one item required
                      </span>
                    )}
                  </div>
                </div>
                {/* Helper text for ACCOUNTING_ONLY mode */}
                {!isPhysicalReturn && (
                  <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    💡 For financial-only credit, you can either select items below OR enter a manual credit amount in the sidebar.
                  </p>
                )}
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
                                Return Qty {itemsRequired && <span className="text-red-500 font-bold">*</span>}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.originalQuantity}
                                value={item.quantityReturned}
                                onChange={(e) => {
                                  handleQuantityChange(index, e.target.value);
                                  // Clear items error if quantity entered
                                  if (parseFloat(e.target.value) > 0) {
                                    setInvalidFields(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete('items');
                                      return newSet;
                                    });
                                  }
                                }}
                                disabled={!item.selected}
                                aria-required="true"
                                className={`w-full px-3 py-2 rounded border text-sm transition-colors ${
                                  item.selected && item.quantityReturned === 0 && invalidFields.has('items')
                                    ? 'border-red-500 ring-1 ring-red-500'
                                    : isDarkMode
                                      ? 'border-gray-600 bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-500 focus:ring-teal-500 focus:border-teal-500'
                                      : 'border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 focus:ring-teal-500 focus:border-teal-500'
                                } focus:outline-none focus:ring-2`}
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
                    Credit Note Type <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={creditNote.creditNoteType}
                    onChange={(e) => setCreditNote(prev => ({ ...prev, creditNoteType: e.target.value }))}
                    disabled={id && creditNote.status !== 'draft'}
                    aria-required="true"
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      id && creditNote.status !== 'draft'
                        ? isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-gray-500'
                          : 'border-gray-300 bg-gray-100 text-gray-500'
                        : isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500'
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500'
                    } focus:outline-none focus:ring-2`}
                  >
                    {CREDIT_NOTE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {CREDIT_NOTE_TYPES.find(t => t.value === creditNote.creditNoteType)?.description}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={creditNote.creditNoteDate}
                    onChange={(e) => {
                      setCreditNote(prev => ({ ...prev, creditNoteDate: e.target.value }));
                      // Clear error when date is selected
                      if (e.target.value) {
                        setInvalidFields(prev => {
                          const newSet = new Set(prev);
                          newSet.delete('creditNoteDate');
                          return newSet;
                        });
                      }
                    }}
                    onBlur={() => handleFieldBlur('creditNoteDate')}
                    aria-required="true"
                    aria-invalid={shouldShowError('creditNoteDate')}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      shouldShowError('creditNoteDate') || invalidFields.has('creditNoteDate')
                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500'
                        : isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500'
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500'
                    } focus:outline-none focus:ring-2`}
                  />
                  {(shouldShowError('creditNoteDate') || invalidFields.has('creditNoteDate')) && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {fieldErrors.creditNoteDate}
                    </p>
                  )}
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
                    Reason for Return <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={creditNote.reasonForReturn}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    onBlur={() => handleFieldBlur('reasonForReturn')}
                    aria-required="true"
                    aria-invalid={shouldShowError('reasonForReturn')}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      shouldShowError('reasonForReturn') || invalidFields.has('reasonForReturn')
                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500'
                        : isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500'
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500'
                    } focus:outline-none focus:ring-2`}
                  >
                    <option value="">Select reason...</option>
                    <optgroup label="Physical Return (Items Required)">
                      {RETURN_REASONS.filter(r => r.category === REASON_CATEGORIES.PHYSICAL_RETURN).map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Financial Only (No Return)">
                      {RETURN_REASONS.filter(r => r.category === REASON_CATEGORIES.FINANCIAL_ONLY).map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      {RETURN_REASONS.filter(r => r.category === REASON_CATEGORIES.FLEXIBLE).map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {(shouldShowError('reasonForReturn') || invalidFields.has('reasonForReturn')) && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {fieldErrors.reasonForReturn}
                    </p>
                  )}
                  {/* Show helper text about auto-selection */}
                  {creditNote.reasonForReturn && (
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isPhysicalReturn
                        ? '📦 Physical return - Items and logistics required'
                        : '💰 Financial only - Items optional, no logistics needed'}
                    </p>
                  )}
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

            {/* QC Information - shown for RETURN_WITH_QC type after inspection */}
            {creditNote.creditNoteType === 'RETURN_WITH_QC' && 
             ['items_inspected', 'applied', 'refunded', 'completed'].includes(creditNote.status) && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  QC Inspection Results
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        QC Result
                      </label>
                      <div className={`px-4 py-2 rounded-lg border ${
                        isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          creditNote.qcResult === 'GOOD' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : creditNote.qcResult === 'BAD'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {creditNote.qcResult || 'Pending'}
                        </span>
                      </div>
                    </div>
                    {creditNote.qcInspectedAt && (
                      <div className="flex-1">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Inspected At
                        </label>
                        <div className={`px-4 py-2 rounded-lg border text-sm ${
                          isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'
                        }`}>
                          {new Date(creditNote.qcInspectedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                  {creditNote.qcNotes && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        QC Notes
                      </label>
                      <div className={`px-4 py-3 rounded-lg border text-sm ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'
                      }`}>
                        {creditNote.qcNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Return Logistics - Only show for physical returns */}
            {showLogisticsSection && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Return Logistics
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Expected Return Date <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      value={creditNote.expectedReturnDate}
                      onChange={(e) => {
                        setCreditNote(prev => ({ ...prev, expectedReturnDate: e.target.value }));
                        // Clear error when date is selected
                        if (e.target.value) {
                          setInvalidFields(prev => {
                            const newSet = new Set(prev);
                            newSet.delete('expectedReturnDate');
                            return newSet;
                          });
                        }
                      }}
                      onBlur={() => handleFieldBlur('expectedReturnDate')}
                      aria-required="true"
                      aria-invalid={shouldShowError('expectedReturnDate')}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        shouldShowError('expectedReturnDate') || invalidFields.has('expectedReturnDate')
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500'
                          : isDarkMode
                            ? 'border-gray-600 bg-gray-700 text-white focus:ring-teal-500 focus:border-teal-500'
                            : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 focus:border-teal-500'
                      } focus:outline-none focus:ring-2`}
                    />
                    {(shouldShowError('expectedReturnDate') || invalidFields.has('expectedReturnDate')) && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        {fieldErrors.expectedReturnDate}
                      </p>
                    )}
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
            )}

            {/* Manual Credit Amount - Only show for ACCOUNTING_ONLY when no items selected */}
            {!isPhysicalReturn && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm ${
                invalidFields.has('manualCreditAmount') ? 'ring-2 ring-red-500' : ''
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Manual Credit Amount
                </h2>
                <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enter a credit amount directly if not selecting specific items. {!hasSelectedItems && <span className="text-red-500 font-bold">*</span>}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Credit Amount (AED) {!hasSelectedItems && <span className="text-red-500 font-bold">*</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={creditNote.manualCreditAmount}
                      onChange={(e) => {
                        setCreditNote(prev => ({ ...prev, manualCreditAmount: parseFloat(e.target.value) || 0 }));
                        // Clear error when amount is entered
                        if (parseFloat(e.target.value) > 0) {
                          setInvalidFields(prev => {
                            const newSet = new Set(prev);
                            newSet.delete('manualCreditAmount');
                            return newSet;
                          });
                        }
                      }}
                      onBlur={() => handleFieldBlur('manualCreditAmount')}
                      placeholder="0.00"
                      aria-required={!hasSelectedItems}
                      aria-invalid={shouldShowError('manualCreditAmount')}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        shouldShowError('manualCreditAmount') || invalidFields.has('manualCreditAmount')
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500'
                          : isDarkMode
                            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:ring-teal-500 focus:border-teal-500'
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500'
                      } focus:outline-none focus:ring-2`}
                    />
                    {(shouldShowError('manualCreditAmount') || invalidFields.has('manualCreditAmount')) && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        {fieldErrors.manualCreditAmount}
                      </p>
                    )}
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Use this for goodwill credits, pricing adjustments, or other financial-only credits
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Summary */}
            {(creditNote.items.some(item => item.selected) || creditNote.manualCreditAmount > 0) && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Credit Summary
                </h2>
                <div className="space-y-3">
                  {/* Items credit (if any) */}
                  {creditNote.items.some(item => item.selected) && (
                    <>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Items Subtotal:</span>
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
                    </>
                  )}

                  {/* Manual credit amount (if any) */}
                  {creditNote.manualCreditAmount > 0 && (
                    <div className="flex justify-between">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Manual Credit:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(creditNote.manualCreditAmount)}
                      </span>
                    </div>
                  )}

                  {/* Total Credit */}
                  <div className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Total Credit:
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(creditNote.totalCredit + creditNote.manualCreditAmount)}
                    </span>
                  </div>

                  {/* Deductions - only for physical returns */}
                  {isPhysicalReturn && (creditNote.restockingFee > 0 || creditNote.returnShippingCost > 0) && (
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
                          {formatCurrency(creditNote.totalCredit + creditNote.manualCreditAmount - creditNote.restockingFee - creditNote.returnShippingCost)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Net Refund without deductions */}
                  {!(isPhysicalReturn && (creditNote.restockingFee > 0 || creditNote.returnShippingCost > 0)) && (
                    <div className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Net Refund:
                      </span>
                      <span className="text-lg font-bold text-teal-600">
                        {formatCurrency(creditNote.totalCredit + creditNote.manualCreditAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit Note Preview Modal */}
      {showPreview && (
        <CreditNotePreview
          creditNote={creditNote}
          company={null}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

// Add DraftConflictModal at component level
CreditNoteForm.DraftConflictModal = DraftConflictModal;

export default CreditNoteForm;
