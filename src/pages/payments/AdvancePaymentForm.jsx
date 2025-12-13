/**
 * AdvancePaymentForm.jsx - UAE VAT Compliance
 *
 * Form for recording advance payments (customer deposits).
 * UAE VAT requires VAT to be accounted for when advance payment is received.
 * Standard rate of 5% applies to advance payments.
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
    // Amount fields - user enters total, we calculate VAT
    amount: 0, // Amount before VAT
    vatRate: VAT_RATE,
    vatAmount: 0,
    totalAmount: 0, // What customer paid (VAT inclusive)
    isVatInclusive: true, // UAE standard - advance payments are VAT inclusive
    // Payment details
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    bankAccount: '',
    placeOfSupply: 'AE-DU',
    // Purpose
    purpose: '',
    notes: '',
    // Optional: Apply to invoice
    applyToInvoiceId: null,
  });

  // Load initial data
  useEffect(() => {
    loadCustomers();
    if (isEditMode) {
      loadPayment();
    } else {
      loadNextReceiptNumber();
      // Check for customerId in URL params
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
    // UAE standard: VAT inclusive amount
    // Total = Amount + VAT = Amount + (Amount * 5/100) = Amount * 1.05
    // So Amount = Total / 1.05
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
    setPayment((prev) => ({
      ...prev,
      ...calculations,
    }));
  };

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers();
      setCustomers(response.customers || response || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const searchCustomers = async (query) => {
    try {
      setCustomerSearching(true);
      const response = await customerService.searchCustomers(query);
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
      setPayment((prev) => ({
        ...prev,
        customerId: customer.id,
        customer,
      }));
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const loadCustomerInvoices = async (customerId) => {
    try {
      setLoadingInvoices(true);
      // Get unpaid/partially paid invoices for this customer
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
      setPayment((prev) => ({
        ...prev,
        receiptNumber: response.receiptNumber || 'APR-0001',
      }));
    } catch (error) {
      console.error('Error loading next receipt number:', error);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setPayment((prev) => ({
      ...prev,
      customerId: customer.id,
      customer,
    }));
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!payment.customerId) {
      errors.push('Please select a customer');
    }
    if (!payment.receiptNumber) {
      errors.push('Receipt number is required');
    }
    if (!payment.paymentDate) {
      errors.push('Payment date is required');
    }
    if (!payment.totalAmount || payment.totalAmount <= 0) {
      errors.push('Amount must be greater than zero');
    }
    if (!payment.paymentMethod) {
      errors.push('Payment method is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);

      const paymentData = {
        ...payment,
        customerDetails: selectedCustomer,
      };

      if (isEditMode) {
        await advancePaymentService.update(id, paymentData);
        notificationService.success('Advance payment updated successfully');
      } else {
        const result = await advancePaymentService.create(paymentData);
        notificationService.success('Advance payment recorded successfully');

        // If apply to invoice was selected, apply it now
        if (payment.applyToInvoiceId && result.id) {
          try {
            await advancePaymentService.applyToInvoice(
              result.id,
              payment.applyToInvoiceId,
            );
            notificationService.success('Payment applied to invoice');
          } catch (applyError) {
            console.error('Error applying to invoice:', applyError);
            notificationService.warning(
              'Payment recorded but could not apply to invoice',
            );
          }
        }
      }

      navigate('/payments/advance');
    } catch (error) {
      console.error('Error saving advance payment:', error);
      notificationService.error(
        error.message || 'Failed to save advance payment',
      );
    } finally {
      setSaving(false);
    }
  };

  // Filtered customers for dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    const search = customerSearch.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.trn?.includes(search),
      )
      .slice(0, 10);
  }, [customers, customerSearch]);

  // Loading state
  if (loading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Loading advance payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/payments/advance')}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1
                className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {isEditMode
                  ? 'Edit Advance Receipt'
                  : 'Record Advance Receipt (Pre-Invoice)'}
              </h1>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {isEditMode
                  ? `Editing ${payment.receiptNumber}`
                  : 'UAE VAT Article 26: Payment received before invoice creates immediate tax point'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors ${
              saving ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              isDarkMode
                ? 'bg-red-900/20 border-red-600 text-red-200'
                : 'bg-red-50 border-red-500 text-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={isDarkMode ? 'text-red-400' : 'text-red-600'}
                size={24}
              />
              <div>
                <h4 className="font-bold mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* VAT Notice */}
        <div
          className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}
        >
          <div className="flex items-start gap-3">
            <Building2
              className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            />
            <div
              className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}
            >
              <p className="font-medium">
                UAE VAT Article 26 - Pre-Invoice Payments
              </p>
              <p className="mt-1">
                Under UAE VAT Law Article 26, advance payments create an{' '}
                <strong>immediate tax point</strong> at the date of receipt. VAT
                at 5% must be declared in the period received, regardless of
                when the invoice is issued. A Tax Invoice must be issued within
                14 days of receiving this advance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <User className="h-5 w-5" />
                Customer <span className="text-red-500">*</span>
              </h2>

              {!selectedCustomer ? (
                <div className="relative">
                  <div className="relative">
                    <Search
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <input
                      type="text"
                      placeholder="Search customer by name, email, or TRN..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() =>
                        filteredCustomers.length > 0 &&
                        setShowCustomerDropdown(true)
                      }
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    {customerSearching && (
                      <Loader2
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      />
                    )}
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div
                      className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className={`w-full px-4 py-3 text-left hover:bg-opacity-80 transition-colors border-b last:border-b-0 ${
                            isDarkMode
                              ? 'border-gray-700 hover:bg-gray-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {customer.name}
                          </div>
                          <div
                            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            {customer.email}
                            {customer.trn && (
                              <span className="ml-2">TRN: {customer.trn}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`p-4 rounded-lg border ${isDarkMode ? 'border-teal-600 bg-teal-900/20' : 'border-teal-500 bg-teal-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div
                        className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {selectedCustomer.name}
                      </div>
                      <div
                        className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {selectedCustomer.email}
                      </div>
                      {selectedCustomer.trn && (
                        <div
                          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          TRN: {selectedCustomer.trn}
                        </div>
                      )}
                    </div>
                    {!isEditMode && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setPayment((prev) => ({
                            ...prev,
                            customerId: null,
                            customer: null,
                            applyToInvoiceId: null,
                          }));
                          setCustomerInvoices([]);
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
              )}
            </div>

            {/* Payment Details */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <CreditCard className="h-5 w-5" />
                Payment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Receipt Number */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Receipt Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={payment.receiptNumber}
                    onChange={(e) =>
                      setPayment((prev) => ({
                        ...prev,
                        receiptNumber: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={payment.paymentDate}
                    onChange={(e) =>
                      setPayment((prev) => ({
                        ...prev,
                        paymentDate: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Amount (VAT Inclusive) */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Amount Received (VAT Inclusive){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      AED
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.totalAmount || ''}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-12 pr-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={payment.paymentMethod}
                    onChange={(e) =>
                      setPayment((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reference Number */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={payment.referenceNumber}
                    onChange={(e) =>
                      setPayment((prev) => ({
                        ...prev,
                        referenceNumber: e.target.value,
                      }))
                    }
                    placeholder="Transaction or cheque number"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Place of Supply */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Place of Supply
                  </label>
                  <select
                    value={payment.placeOfSupply}
                    onChange={(e) =>
                      setPayment((prev) => ({
                        ...prev,
                        placeOfSupply: e.target.value,
                      }))
                    }
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

                {/* Purpose */}
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={payment.purpose}
                    onChange={(e) =>
                      setPayment((prev) => ({
                        ...prev,
                        purpose: e.target.value,
                      }))
                    }
                    placeholder="e.g., Deposit for steel order, Project advance..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Notes
                  </label>
                  <textarea
                    value={payment.notes}
                    onChange={(e) =>
                      setPayment((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Additional notes..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>
            </div>

            {/* Apply to Invoice Section */}
            {selectedCustomer && !isEditMode && (
              <div
                className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    <FileText className="h-5 w-5" />
                    Apply to Invoice (Optional)
                  </h2>
                  <button
                    onClick={() => setShowApplySection(!showApplySection)}
                    className={`text-sm ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
                  >
                    {showApplySection ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showApplySection && (
                  <div>
                    {loadingInvoices ? (
                      <div className="py-4 text-center">
                        <Loader2
                          className={`h-6 w-6 animate-spin mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        />
                        <p
                          className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Loading invoices...
                        </p>
                      </div>
                    ) : customerInvoices.length === 0 ? (
                      <p
                        className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        No outstanding invoices for this customer
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p
                          className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Select an invoice to apply this payment to:
                        </p>
                        {customerInvoices.map((invoice) => (
                          <label
                            key={invoice.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              payment.applyToInvoiceId === invoice.id
                                ? isDarkMode
                                  ? 'border-teal-500 bg-teal-900/20'
                                  : 'border-teal-500 bg-teal-50'
                                : isDarkMode
                                  ? 'border-gray-600 hover:border-gray-500'
                                  : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="applyToInvoice"
                                checked={
                                  payment.applyToInvoiceId === invoice.id
                                }
                                onChange={() =>
                                  setPayment((prev) => ({
                                    ...prev,
                                    applyToInvoiceId: invoice.id,
                                  }))
                                }
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                              />
                              <div>
                                <div
                                  className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {invoice.invoiceNumber}
                                </div>
                                <div
                                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  Due:{' '}
                                  {formatCurrency(
                                    invoice.balanceDue ||
                                      invoice.outstanding ||
                                      invoice.total,
                                  )}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {formatCurrency(invoice.total)}
                            </div>
                          </label>
                        ))}
                        {payment.applyToInvoiceId && (
                          <button
                            onClick={() =>
                              setPayment((prev) => ({
                                ...prev,
                                applyToInvoiceId: null,
                              }))
                            }
                            className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* VAT Summary */}
            <div
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                  >
                    Amount (excl. VAT):
                  </span>
                  <span
                    className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                  >
                    VAT ({VAT_RATE}%):
                  </span>
                  <span
                    className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {formatCurrency(payment.vatAmount)}
                  </span>
                </div>
                <div
                  className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <span
                    className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Total Received:
                  </span>
                  <span className="text-lg font-bold text-teal-600">
                    {formatCurrency(payment.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* VAT Accounting Note */}
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}
            >
              <h3
                className={`font-medium mb-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}
              >
                VAT Accounting
              </h3>
              <p
                className={`text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}
              >
                VAT of {formatCurrency(payment.vatAmount)} will be recorded as
                output VAT on your next VAT return. When this advance is applied
                to an invoice, the VAT will be adjusted to prevent double
                taxation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancePaymentForm;
