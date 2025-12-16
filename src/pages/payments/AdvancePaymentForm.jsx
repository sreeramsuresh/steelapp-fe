/**
 * AdvancePaymentForm.jsx - UAE VAT Compliance
 *
 * Form for recording advance payments (customer deposits).
 * UAE VAT requires VAT to be accounted for when advance payment is received.
 * Standard rate of 5% applies to advance payments.
 *
 * UX Patterns (Tier 2 - Medium):
 * - Sticky header with blur backdrop
 * - Two-column layout (8+4 split)
 * - Sticky sidebar summary
 * - Accordion for optional sections
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Loader2,
  User,
  CreditCard,
  FileText,
  Building2,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import advancePaymentService from '../../services/advancePaymentService';
import { customerService } from '../../services/customerService';
import { invoiceService } from '../../services/invoiceService';
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

// Payment methods
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'online_payment', label: 'Online Payment' },
];

// VAT rate for advance payments (UAE standard rate)
const VAT_RATE = 5;

const AdvancePaymentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Customer search state
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Invoice list for applying payment
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showApplySection, setShowApplySection] = useState(false);

  // Payment data state
  const [payment, setPayment] = useState({
    customerId: null,
    customer: null,
    receiptNumber: '',
    paymentDate: formatDateForInput(new Date()),
    amount: 0,
    vatRate: VAT_RATE,
    vatAmount: 0,
    totalAmount: 0,
    isVatInclusive: true,
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    bankAccount: '',
    placeOfSupply: 'AE-DU',
    purpose: '',
    notes: '',
    applyToInvoiceId: null,
  });

  // Load initial data
  useEffect(() => {
    loadCustomers();
    if (isEditMode) {
      loadPayment();
    } else {
      loadNextReceiptNumber();
      const customerIdParam = searchParams.get('customerId');
      if (customerIdParam) {
        loadCustomerById(customerIdParam);
      }
    }
  }, [id]);

  // Search customers when search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch && customerSearch.length >= 2 && !selectedCustomer) {
        searchCustomers(customerSearch);
      } else if (!customerSearch) {
        setShowCustomerDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer]);

  // Load customer invoices when customer is selected and apply section is shown
  useEffect(() => {
    if (selectedCustomer && showApplySection) {
      loadCustomerInvoices(selectedCustomer.id);
    }
  }, [selectedCustomer, showApplySection]);

  // Calculate VAT when amount changes
  const calculateVatFromTotal = (totalAmount) => {
    const total = parseFloat(totalAmount) || 0;
    const amount = total / (1 + VAT_RATE / 100);
    const vatAmount = total - amount;
    return {
      amount: parseFloat(amount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalAmount: total,
    };
  };

  const handleTotalAmountChange = (value) => {
    const calculations = calculateVatFromTotal(value);
    setPayment((prev) => ({ ...prev, ...calculations }));
  };

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers({ status: 'active', limit: 1000 });
      setCustomers(response.customers || response || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const searchCustomers = async (query) => {
    try {
      setCustomerSearching(true);
      const response = await customerService.searchCustomers(query, { status: 'active' });
      const results = response.customers || response || [];
      if (results.length > 0) {
        setShowCustomerDropdown(true);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setCustomerSearching(false);
    }
  };

  const loadCustomerById = async (customerId) => {
    try {
      const customer = await customerService.getCustomer(customerId);
      setSelectedCustomer(customer);
      setPayment((prev) => ({ ...prev, customerId: customer.id, customer }));
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const loadCustomerInvoices = async (customerId) => {
    try {
      setLoadingInvoices(true);
      const response = await invoiceService.getInvoices({
        customerId,
        paymentStatus: 'unpaid,partially_paid',
        status: 'issued',
      });
      setCustomerInvoices(response.invoices || response.data || []);
    } catch (error) {
      console.error('Error loading customer invoices:', error);
      setCustomerInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadPayment = async () => {
    try {
      setLoading(true);
      const data = await advancePaymentService.getById(id);
      setPayment(data);
      if (data.customerId) {
        const customer = await customerService.getCustomer(data.customerId);
        setSelectedCustomer(customer);
      }
    } catch (error) {
      console.error('Error loading advance payment:', error);
      notificationService.error('Failed to load advance payment');
      navigate('/payments/advance');
    } finally {
      setLoading(false);
    }
  };

  const loadNextReceiptNumber = async () => {
    try {
      const response = await advancePaymentService.getNextNumber();
      setPayment((prev) => ({ ...prev, receiptNumber: response.receiptNumber || 'APR-0001' }));
    } catch (error) {
      console.error('Error loading next receipt number:', error);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setPayment((prev) => ({ ...prev, customerId: customer.id, customer }));
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const validateForm = () => {
    const errors = [];
    if (!payment.customerId) errors.push('Please select a customer');
    if (!payment.receiptNumber) errors.push('Receipt number is required');
    if (!payment.paymentDate) errors.push('Payment date is required');
    if (!payment.totalAmount || payment.totalAmount <= 0) errors.push('Amount must be greater than zero');
    if (!payment.paymentMethod) errors.push('Payment method is required');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);
      const paymentData = { ...payment, customerDetails: selectedCustomer };

      if (isEditMode) {
        await advancePaymentService.update(id, paymentData);
        notificationService.success('Advance payment updated successfully');
      } else {
        const result = await advancePaymentService.create(paymentData);
        notificationService.success('Advance payment recorded successfully');

        if (payment.applyToInvoiceId && result.id) {
          try {
            await advancePaymentService.applyToInvoice(result.id, payment.applyToInvoiceId);
            notificationService.success('Payment applied to invoice');
          } catch (applyError) {
            console.error('Error applying to invoice:', applyError);
            notificationService.warning('Payment recorded but could not apply to invoice');
          }
        }
      }

      navigate('/payments/advance');
    } catch (error) {
      console.error('Error saving advance payment:', error);
      notificationService.error(error.message || 'Failed to save advance payment');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    const search = customerSearch.toLowerCase();
    return customers
      .filter((c) =>
        c.name?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.trn?.includes(search)
      )
      .slice(0, 10);
  }, [customers, customerSearch]);

  // ===================== THEME CLASSES =====================
  const cardBg = isDarkMode ? 'bg-[#141a20]' : 'bg-white';
  const cardBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-300';
  const textPrimary = isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500';
  const accordionBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50';
  const inputFocus = 'focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20';

  // Loading state
  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-[#0b0f14]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4aa3ff] mx-auto mb-3"></div>
          <p className={textMuted}>Loading advance payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0b0f14]' : 'bg-gray-50'}`}>
      {/* App Container */}
      <div className="max-w-6xl mx-auto p-4">
        <div className={`${cardBg} border ${cardBorder} rounded-[18px] overflow-hidden`}>

          {/* Sticky Header */}
          <div className={`sticky top-0 z-10 backdrop-blur-md ${
            isDarkMode ? 'bg-[#0f151b]/94 border-b border-[#2a3640]' : 'bg-white/94 border-b border-gray-200'
          } px-4 py-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/payments/advance')}
                  className={`p-2 rounded-xl transition-colors ${
                    isDarkMode ? 'hover:bg-[#141a20] text-[#93a4b4]' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className={`text-lg font-extrabold ${textPrimary}`}>
                    {isEditMode ? 'Edit Advance Receipt' : 'Advance Receipt'}
                  </h1>
                  <p className={`text-xs ${textMuted}`}>
                    {isEditMode ? `Editing ${payment.receiptNumber}` : 'Pre-Invoice Payment - VAT Article 26'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs border ${
                  isDarkMode ? 'border-[#4aa3ff]/30 bg-[#4aa3ff]/12 text-[#4aa3ff]' : 'border-teal-200 bg-teal-50 text-teal-700'
                }`}>
                  {isEditMode ? 'Edit' : 'Draft'}
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                    isDarkMode ? 'bg-[#4aa3ff] text-[#001018] hover:bg-[#5bb2ff]' : 'bg-teal-600 text-white hover:bg-teal-700'
                  } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Receipt'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-3 p-4">

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className={`col-span-12 p-4 rounded-[14px] border ${
                isDarkMode ? 'bg-red-900/20 border-red-600/50 text-red-200' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20} />
                  <div>
                    <h4 className="font-bold text-sm mb-1.5">Please fix the following errors:</h4>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* LEFT COLUMN: Main Form */}
            <div className="col-span-12 lg:col-span-8 space-y-3">

              {/* Section 1: Customer Selection */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}>
                    <User className="h-4 w-4" />
                    Customer <span className="text-red-500">*</span>
                  </div>
                  <div className={`text-xs ${textMuted}`}>Select the customer making this payment</div>
                </div>

                {!selectedCustomer ? (
                  <div className="relative">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                      <input
                        type="text"
                        placeholder="Search customer by name, email, or TRN..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        onFocus={() => filteredCustomers.length > 0 && setShowCustomerDropdown(true)}
                        className={`w-full pl-9 pr-9 py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                      />
                      {customerSearching && (
                        <Loader2 className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin ${textMuted}`} />
                      )}
                    </div>

                    {/* Customer Dropdown */}
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-xl shadow-lg border max-h-60 overflow-y-auto ${cardBg} ${cardBorder}`}>
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className={`w-full px-3 py-2.5 text-left transition-colors border-b last:border-b-0 ${cardBorder} ${
                              isDarkMode ? 'hover:bg-[#1a2027]' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`text-sm font-medium ${textPrimary}`}>{customer.name}</div>
                            <div className={`text-xs ${textMuted}`}>
                              {customer.email}
                              {customer.trn && <span className="ml-2">TRN: {customer.trn}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`p-3 rounded-[14px] border ${
                    isDarkMode ? 'border-[#4aa3ff]/35 bg-[#4aa3ff]/10' : 'border-teal-300 bg-teal-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`text-sm font-medium ${textPrimary}`}>{selectedCustomer.name}</div>
                        <div className={`text-xs ${textMuted}`}>{selectedCustomer.email}</div>
                        {selectedCustomer.trn && (
                          <div className={`text-xs font-mono ${textMuted} mt-0.5`}>TRN: {selectedCustomer.trn}</div>
                        )}
                      </div>
                      {!isEditMode && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            setPayment((prev) => ({ ...prev, customerId: null, customer: null, applyToInvoiceId: null }));
                            setCustomerInvoices([]);
                          }}
                          className={`px-2.5 py-1 text-xs rounded-xl border transition-colors ${
                            isDarkMode ? 'border-[#2a3640] bg-[#0f151b] hover:border-[#4aa3ff]' : 'border-gray-300 bg-white hover:border-teal-500'
                          }`}
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Payment Details */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}>
                    <CreditCard className="h-4 w-4" />
                    Payment Details
                  </div>
                  <div className={`text-xs ${textMuted}`}>Enter payment information</div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Receipt Number */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Receipt Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={payment.receiptNumber}
                      onChange={(e) => setPayment((prev) => ({ ...prev, receiptNumber: e.target.value }))}
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                    />
                  </div>

                  {/* Payment Date */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={payment.paymentDate}
                      onChange={(e) => setPayment((prev) => ({ ...prev, paymentDate: e.target.value }))}
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={payment.paymentMethod}
                      onChange={(e) => setPayment((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount (VAT Inclusive) */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Amount Received (VAT Incl.) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-xs ${textMuted}`}>AED</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.totalAmount || ''}
                        onChange={(e) => handleTotalAmountChange(e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-11 pr-3 py-2.5 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                      />
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>Reference Number</label>
                    <input
                      type="text"
                      value={payment.referenceNumber}
                      onChange={(e) => setPayment((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                      placeholder="Transaction or cheque #"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                    />
                  </div>

                  {/* Place of Supply */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>Place of Supply</label>
                    <select
                      value={payment.placeOfSupply}
                      onChange={(e) => setPayment((prev) => ({ ...prev, placeOfSupply: e.target.value }))}
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                    >
                      {EMIRATES.map((emirate) => (
                        <option key={emirate.value} value={emirate.value}>{emirate.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Purpose */}
                  <div className="col-span-12">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>Purpose</label>
                    <input
                      type="text"
                      value={payment.purpose}
                      onChange={(e) => setPayment((prev) => ({ ...prev, purpose: e.target.value }))}
                      placeholder="e.g., Deposit for steel order, Project advance..."
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Notes Accordion */}
              <details className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>Notes</div>
                    <div className={`text-xs ${textMuted}`}>Additional notes for this payment</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <textarea
                    value={payment.notes}
                    onChange={(e) => setPayment((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Additional notes..."
                    className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus}`}
                  />
                </div>
              </details>

              {/* Section 4: Apply to Invoice Accordion */}
              {selectedCustomer && !isEditMode && (
                <details className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}>
                  <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className={`h-4 w-4 ${textMuted}`} />
                      <div>
                        <div className={`text-sm font-bold ${textPrimary}`}>Apply to Invoice</div>
                        <div className={`text-xs ${textMuted}`}>Optional - link to outstanding invoice</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`} />
                  </summary>
                  <div className={`p-3 border-t ${cardBorder}`}>
                    {loadingInvoices ? (
                      <div className="py-4 text-center">
                        <Loader2 className={`h-5 w-5 animate-spin mx-auto ${textMuted}`} />
                        <p className={`mt-2 text-xs ${textMuted}`}>Loading invoices...</p>
                      </div>
                    ) : customerInvoices.length === 0 ? (
                      <p className={`text-xs ${textMuted}`}>No outstanding invoices for this customer</p>
                    ) : (
                      <div className="space-y-2">
                        <p className={`text-xs mb-2 ${textMuted}`}>Select an invoice to apply this payment:</p>
                        {customerInvoices.map((invoice) => (
                          <label
                            key={invoice.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                              payment.applyToInvoiceId === invoice.id
                                ? isDarkMode ? 'border-[#4aa3ff]/50 bg-[#4aa3ff]/10' : 'border-teal-400 bg-teal-50'
                                : `${cardBorder} hover:border-[#4aa3ff]/30`
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="applyToInvoice"
                                checked={payment.applyToInvoiceId === invoice.id}
                                onChange={() => setPayment((prev) => ({ ...prev, applyToInvoiceId: invoice.id }))}
                                className="h-3.5 w-3.5 text-[#4aa3ff] focus:ring-[#4aa3ff]"
                              />
                              <div>
                                <div className={`text-sm font-medium ${textPrimary}`}>{invoice.invoiceNumber}</div>
                                <div className={`text-xs ${textMuted}`}>
                                  Due: {formatCurrency(invoice.balanceDue || invoice.outstanding || invoice.total)}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm font-mono ${textPrimary}`}>{formatCurrency(invoice.total)}</div>
                          </label>
                        ))}
                        {payment.applyToInvoiceId && (
                          <button
                            onClick={() => setPayment((prev) => ({ ...prev, applyToInvoiceId: null }))}
                            className={`text-xs ${textMuted} hover:text-[#4aa3ff] transition-colors`}
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-3">

                {/* Payment Summary */}
                <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                  <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>Payment Summary</div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Amount (excl. VAT):</span>
                      <span className={`font-mono ${textPrimary}`}>{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>VAT ({VAT_RATE}%):</span>
                      <span className={`font-mono ${textPrimary}`}>{formatCurrency(payment.vatAmount)}</span>
                    </div>
                    <div className={`h-px ${cardBorder} my-2`}></div>
                    <div className="flex justify-between">
                      <span className={`font-bold ${textPrimary}`}>Total Received:</span>
                      <span className={`font-bold font-mono ${isDarkMode ? 'text-[#4aa3ff]' : 'text-teal-600'}`}>
                        {formatCurrency(payment.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VAT Notice */}
                <div className={`p-3 rounded-[14px] border ${
                  isDarkMode ? 'bg-[#4aa3ff]/10 border-[#4aa3ff]/30' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <Building2 className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-600'}`} />
                    <div>
                      <div className={`text-xs font-bold ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-700'}`}>
                        UAE VAT Article 26
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-blue-600'}`}>
                        Advance payments create an immediate tax point. VAT at 5% must be declared in the period received.
                      </p>
                    </div>
                  </div>
                </div>

                {/* VAT Accounting Note */}
                <div className={`p-3 rounded-[14px] border ${
                  isDarkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                    VAT Accounting
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-amber-300/80' : 'text-amber-600'}`}>
                    VAT of {formatCurrency(payment.vatAmount)} will be recorded as output VAT. When applied to an invoice, VAT will be adjusted to prevent double taxation.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancePaymentForm;
