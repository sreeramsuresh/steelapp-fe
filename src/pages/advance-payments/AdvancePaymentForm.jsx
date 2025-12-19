import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Loader2, Save, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import advancePaymentService from '../../services/advancePaymentService';
import { customersAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Advance Payment Status (from proto: vat_management.proto)
const ADVANCE_PAYMENT_STATUSES = [
  { value: 'RECEIVED', label: 'Received' },
  { value: 'PARTIALLY_APPLIED', label: 'Partially Applied' },
  { value: 'FULLY_APPLIED', label: 'Fully Applied' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'EXPIRED', label: 'Expired' },
];

// Payment Methods
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

// Currencies
const CURRENCIES = [
  { value: 'AED', label: 'AED' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'INR', label: 'INR' },
];

/**
 * AdvancePaymentForm - Modal form for create/edit advance payments (Phase 2c)
 * Follows VendorBillForm pattern with accordion sections
 *
 * Key UAE VAT Rule:
 * VAT is due on advance payments at time of RECEIPT, not when goods/services are delivered.
 * When advance received: VAT = amount / 1.05 (extract VAT from received amount)
 */
export function AdvancePaymentForm({ advance, companyId, onSave, onClose }) {
  const { isDarkMode } = useTheme();
  const isEditing = Boolean(advance?.id);

  const [formData, setFormData] = useState({
    advanceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'RECEIVED',
    customerId: '',
    customerName: '',
    customerTrn: '',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    amount: 0,
    vatRate: 5,
    vatAmount: 0,
    totalReceived: 0,
    isVatInclusive: true, // UAE default: VAT is included in amount received
    bankName: '',
    bankAccount: '',
    chequeNumber: '',
    transactionId: '',
    currency: 'AED',
    exchangeRate: 1,
    amountInBaseCurrency: 0,
    amountAvailable: 0,
    amountApplied: 0,
    applications: [],
    isRefunded: false,
    refundDate: '',
    refundReference: '',
    amountRefunded: 0,
    vatPeriodStart: '',
    vatPeriodEnd: '',
    notes: '',
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load customers
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const customersRes = await customersAPI.getAll();
        setCustomers(Array.isArray(customersRes) ? customersRes : []);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-calculate VAT amount based on UAE rules
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const vatRate = parseFloat(formData.vatRate) || 0;
    let vatAmount = 0;
    let totalReceived = 0;

    if (formData.isVatInclusive) {
      // VAT is included in amount: extract VAT from received amount
      // Formula: VAT = amount * (vat_rate/100) / (1 + vat_rate/100)
      vatAmount = (amount * (vatRate / 100)) / (1 + vatRate / 100);
      totalReceived = amount;
    } else {
      // VAT is additional: add VAT to amount
      vatAmount = (amount * vatRate) / 100;
      totalReceived = amount + vatAmount;
    }

    setFormData((prev) => ({
      ...prev,
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalReceived: parseFloat(totalReceived.toFixed(2)),
    }));
  }, [formData.amount, formData.vatRate, formData.isVatInclusive]);

  // Auto-calculate amount in base currency
  useEffect(() => {
    if (formData.currency !== 'AED') {
      const amountInBase =
        parseFloat(formData.amount || 0) * parseFloat(formData.exchangeRate || 1);
      setFormData((prev) => ({
        ...prev,
        amountInBaseCurrency: parseFloat(amountInBase.toFixed(2)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        exchangeRate: 1,
        amountInBaseCurrency: parseFloat(formData.amount || 0),
      }));
    }
  }, [formData.amount, formData.currency, formData.exchangeRate]);

  // Auto-calculate available amount
  useEffect(() => {
    const totalReceived = parseFloat(formData.totalReceived) || 0;
    const amountApplied = parseFloat(formData.amountApplied) || 0;
    const amountRefunded = parseFloat(formData.amountRefunded) || 0;
    const amountAvailable = totalReceived - amountApplied - amountRefunded;

    setFormData((prev) => ({
      ...prev,
      amountAvailable: parseFloat(amountAvailable.toFixed(2)),
    }));
  }, [formData.totalReceived, formData.amountApplied, formData.amountRefunded]);

  // Populate form when editing
  useEffect(() => {
    if (advance) {
      setFormData({
        advanceNumber: advance.advanceNumber || advance.receiptNumber || '',
        paymentDate: advance.paymentDate?.split('T')[0] || '',
        status: advance.status || 'RECEIVED',
        customerId: advance.customerId?.toString() || '',
        customerName: advance.customerName || '',
        customerTrn: advance.customerTrn || '',
        paymentMethod: advance.paymentMethod || 'bank_transfer',
        paymentReference: advance.paymentReference || advance.referenceNumber || '',
        amount: advance.amount || 0,
        vatRate: advance.vatRate || 5,
        vatAmount: advance.vatAmount || 0,
        totalReceived: advance.totalReceived || advance.totalAmount || 0,
        isVatInclusive: advance.isVatInclusive !== false,
        bankName: advance.bankName || '',
        bankAccount: advance.bankAccount || '',
        chequeNumber: advance.chequeNumber || '',
        transactionId: advance.transactionId || '',
        currency: advance.currency || 'AED',
        exchangeRate: advance.exchangeRate || 1,
        amountInBaseCurrency: advance.amountInBaseCurrency || 0,
        amountAvailable: advance.amountAvailable || 0,
        amountApplied: advance.amountApplied || 0,
        applications: advance.applications || [],
        isRefunded: Boolean(advance.amountRefunded > 0),
        refundDate: advance.refundDate?.split('T')[0] || '',
        refundReference: advance.refundReference || '',
        amountRefunded: advance.amountRefunded || 0,
        vatPeriodStart: advance.vatPeriodStart?.split('T')[0] || '',
        vatPeriodEnd: advance.vatPeriodEnd?.split('T')[0] || '',
        notes: advance.notes || '',
      });
    }
  }, [advance]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle customer selection
  const handleCustomerChange = (customerId) => {
    const customer = customers.find((c) => c.id.toString() === customerId);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name || '',
        customerTrn: customer.trn || '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.customerId) {
      errors.customerId = 'Customer is required';
    }

    if (!formData.paymentDate) {
      errors.paymentDate = 'Payment date is required';
    } else {
      const paymentDate = new Date(formData.paymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (paymentDate > today) {
        errors.paymentDate = 'Payment date cannot be in the future';
      }
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }

    if (formData.paymentMethod === 'cheque' && !formData.chequeNumber) {
      errors.chequeNumber = 'Cheque number is required for cheque payments';
    }

    if (
      formData.paymentMethod === 'bank_transfer' &&
      !formData.transactionId &&
      !isEditing
    ) {
      // Warning, not error
      console.warn('Transaction ID is recommended for bank transfers');
    }

    if (formData.currency !== 'AED' && (!formData.exchangeRate || formData.exchangeRate <= 0)) {
      errors.exchangeRate = 'Exchange rate is required for non-AED currencies';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    // Check if editing restricted status
    if (
      isEditing &&
      ['FULLY_APPLIED', 'REFUNDED', 'EXPIRED'].includes(formData.status)
    ) {
      if (
        !window.confirm(
          `This advance payment is ${formData.status}. Are you sure you want to edit it?`,
        )
      ) {
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        companyId,
        customerId: parseInt(formData.customerId),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference.trim(),
        amount: parseFloat(formData.amount),
        vatRate: parseFloat(formData.vatRate),
        vatAmount: parseFloat(formData.vatAmount),
        totalReceived: parseFloat(formData.totalReceived),
        isVatInclusive: formData.isVatInclusive,
        bankName: formData.bankName.trim(),
        bankAccount: formData.bankAccount.trim(),
        chequeNumber: formData.chequeNumber.trim(),
        transactionId: formData.transactionId.trim(),
        currency: formData.currency,
        exchangeRate: parseFloat(formData.exchangeRate),
        amountInBaseCurrency: parseFloat(formData.amountInBaseCurrency),
        status: formData.status,
        notes: formData.notes.trim(),
      };

      // Include refund data if refunded
      if (formData.isRefunded) {
        payload.refundDate = formData.refundDate;
        payload.refundReference = formData.refundReference.trim();
        payload.amountRefunded = parseFloat(formData.amountRefunded);
      }

      let result;
      if (isEditing) {
        result = await advancePaymentService.update(advance.id, payload);
      } else {
        result = await advancePaymentService.create(payload);
      }

      onSave(result);
    } catch (err) {
      console.error('Failed to save advance payment:', err);
      setError(err.message || 'Failed to save advance payment');
    } finally {
      setSaving(false);
    }
  };

  // CSS classes for consistent styling
  const labelClass = `text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const readonlyClass = `${inputClass} opacity-60 cursor-not-allowed`;

  // Check if editing is disabled based on status
  const isEditingDisabled =
    isEditing && ['FULLY_APPLIED', 'REFUNDED', 'EXPIRED'].includes(formData.status);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className={`p-8 rounded-xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'}`}
        >
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ${
          isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${
            isDarkMode
              ? 'bg-[#1E2328] border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Advance Payment' : 'Create Advance Payment'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${
              isDarkMode ? 'hover:bg-gray-700' : ''
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {isEditingDisabled && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
              This advance payment is {formData.status} and cannot be edited.
            </div>
          )}

          {/* 1. Advance Payment Identification - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Advance Payment Identification
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>
                    Advance Number {isEditing && '(readonly)'}
                  </Label>
                  <Input
                    value={formData.advanceNumber}
                    disabled={true}
                    placeholder="Auto-generated"
                    className={readonlyClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Payment Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleChange('paymentDate', e.target.value)}
                    className={inputClass}
                    disabled={isEditingDisabled}
                  />
                  {validationErrors.paymentDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.paymentDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADVANCE_PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </details>

          {/* 2. Customer Details - Expanded */}
          <details open className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Customer Details
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className={labelClass}>
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={handleCustomerChange}
                    disabled={isEditingDisabled}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.customerId && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.customerId}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Customer Name (readonly)</Label>
                  <Input
                    value={formData.customerName}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Customer TRN (readonly)</Label>
                  <Input
                    value={formData.customerTrn}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* 3. Payment Details - Expanded */}
          <details open className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Payment Details
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleChange('paymentMethod', value)}
                    disabled={isEditingDisabled}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.paymentMethod}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Payment Reference</Label>
                  <Input
                    value={formData.paymentReference}
                    onChange={(e) =>
                      handleChange('paymentReference', e.target.value)
                    }
                    placeholder="Reference number or notes"
                    className={inputClass}
                    disabled={isEditingDisabled}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className={inputClass}
                    disabled={isEditingDisabled}
                  />
                  {validationErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.amount}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>VAT Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.vatRate}
                    onChange={(e) => handleChange('vatRate', e.target.value)}
                    className={inputClass}
                    disabled={isEditingDisabled}
                  />
                </div>
              </div>

              {/* VAT Calculation Section */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVatInclusive"
                    checked={formData.isVatInclusive}
                    onChange={(e) =>
                      handleChange('isVatInclusive', e.target.checked)
                    }
                    disabled={isEditingDisabled}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isVatInclusive" className={labelClass}>
                    VAT is included in amount received (UAE default)
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={labelClass}>
                      VAT Amount (auto-calculated)
                    </Label>
                    <Input
                      value={formData.vatAmount.toFixed(2)}
                      disabled={true}
                      className={readonlyClass}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>
                      Total Received (auto-calculated)
                    </Label>
                    <Input
                      value={formData.totalReceived.toFixed(2)}
                      disabled={true}
                      className={readonlyClass}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 italic">
                  UAE VAT Rule: VAT is due on advance payments at time of receipt.
                  {formData.isVatInclusive
                    ? ' VAT is extracted from the amount received.'
                    : ' VAT is added to the amount.'}
                </div>
              </div>
            </div>
          </details>

          {/* 4. Bank & Payment Details - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Bank &amp; Payment Details
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Bank Name</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="e.g., Emirates NBD"
                    className={inputClass}
                    disabled={isEditingDisabled}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Bank Account</Label>
                  <Input
                    value={formData.bankAccount}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    placeholder="Account number or IBAN"
                    className={inputClass}
                    disabled={isEditingDisabled}
                  />
                </div>
                {formData.paymentMethod === 'cheque' && (
                  <div>
                    <Label className={labelClass}>
                      Cheque Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.chequeNumber}
                      onChange={(e) =>
                        handleChange('chequeNumber', e.target.value)
                      }
                      placeholder="Cheque number"
                      className={inputClass}
                      disabled={isEditingDisabled}
                    />
                    {validationErrors.chequeNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.chequeNumber}
                      </p>
                    )}
                  </div>
                )}
                {formData.paymentMethod === 'bank_transfer' && (
                  <div>
                    <Label className={labelClass}>
                      Transaction ID (recommended)
                    </Label>
                    <Input
                      value={formData.transactionId}
                      onChange={(e) =>
                        handleChange('transactionId', e.target.value)
                      }
                      placeholder="Bank transaction reference"
                      className={inputClass}
                      disabled={isEditingDisabled}
                    />
                  </div>
                )}
              </div>
            </div>
          </details>

          {/* 5. Currency & Conversion - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Currency &amp; Conversion
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                    disabled={isEditingDisabled}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>
                    Exchange Rate {formData.currency !== 'AED' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.exchangeRate}
                    onChange={(e) =>
                      handleChange('exchangeRate', e.target.value)
                    }
                    className={inputClass}
                    disabled={formData.currency === 'AED' || isEditingDisabled}
                  />
                  {validationErrors.exchangeRate && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.exchangeRate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>
                    Amount in AED (auto-calculated)
                  </Label>
                  <Input
                    value={formData.amountInBaseCurrency.toFixed(2)}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* 6. Application Tracking - Expanded */}
          <details open className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Application Tracking
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Amount Available</Label>
                  <Input
                    value={formData.amountAvailable.toFixed(2)}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Amount Applied</Label>
                  <Input
                    value={formData.amountApplied.toFixed(2)}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Total Received</Label>
                  <Input
                    value={formData.totalReceived.toFixed(2)}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
              </div>

              {formData.applications && formData.applications.length > 0 && (
                <div className="mt-4">
                  <Label className={labelClass}>Applications</Label>
                  <div className="mt-2 border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                        <tr>
                          <th className="p-2 text-left">Invoice Number</th>
                          <th className="p-2 text-right">Amount Applied</th>
                          <th className="p-2 text-left">Application Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.applications.map((app, idx) => (
                          <tr
                            key={idx}
                            className={
                              isDarkMode
                                ? 'border-t border-gray-700'
                                : 'border-t border-gray-200'
                            }
                          >
                            <td className="p-2">{app.invoiceNumber}</td>
                            <td className="p-2 text-right">
                              {parseFloat(app.amountApplied || 0).toFixed(2)}
                            </td>
                            <td className="p-2">
                              {app.appliedAt
                                ? new Date(app.appliedAt).toLocaleDateString()
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {formData.status === 'RECEIVED' && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={true}
                    className={inputClass}
                  >
                    Apply to Invoice (coming soon)
                  </Button>
                </div>
              )}
            </div>
          </details>

          {/* 7. Refund Information - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Refund Information
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRefunded"
                  checked={formData.isRefunded}
                  onChange={(e) =>
                    handleChange('isRefunded', e.target.checked)
                  }
                  disabled={isEditingDisabled}
                  className="w-4 h-4"
                />
                <Label htmlFor="isRefunded" className={labelClass}>
                  Advance was refunded
                </Label>
              </div>

              {formData.isRefunded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label className={labelClass}>Refund Date</Label>
                    <Input
                      type="date"
                      value={formData.refundDate}
                      onChange={(e) => handleChange('refundDate', e.target.value)}
                      className={inputClass}
                      disabled={isEditingDisabled}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>Refund Reference</Label>
                    <Input
                      value={formData.refundReference}
                      onChange={(e) =>
                        handleChange('refundReference', e.target.value)
                      }
                      placeholder="Refund reference number"
                      className={inputClass}
                      disabled={isEditingDisabled}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>Amount Refunded</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amountRefunded}
                      onChange={(e) =>
                        handleChange('amountRefunded', e.target.value)
                      }
                      className={inputClass}
                      disabled={isEditingDisabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* 8. VAT Period - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                VAT Period
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>VAT Period Start (readonly)</Label>
                  <Input
                    type="date"
                    value={formData.vatPeriodStart}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>VAT Period End (readonly)</Label>
                  <Input
                    type="date"
                    value={formData.vatPeriodEnd}
                    disabled={true}
                    className={readonlyClass}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 italic">
                VAT on this advance is reportable in Form 201 for the period above.
                The VAT period is determined by the payment date.
              </div>
            </div>
          </details>

          {/* 9. Notes - Collapsed */}
          <details className="border rounded-lg overflow-hidden">
            <summary
              className={`cursor-pointer p-4 flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                Notes
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <Label className={labelClass}>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this advance payment"
                rows={4}
                className={inputClass}
                disabled={isEditingDisabled}
              />
            </div>
          </details>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || isEditingDisabled}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update' : 'Create'} Advance Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

AdvancePaymentForm.propTypes = {
  advance: PropTypes.object,
  companyId: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
