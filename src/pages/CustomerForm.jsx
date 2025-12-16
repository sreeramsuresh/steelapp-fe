/**
 * CustomerForm Component
 *
 * Manages customer details including Phase 5 credit management fields
 * Features:
 * - Basic customer information (name, email, phone, address)
 * - Tax/VAT compliance (VAT number, TRN)
 * - Credit management with CustomerCreditPanel integration
 *
 * UX Patterns (Tier 2 - Medium):
 * - Sticky header with blur backdrop
 * - Two-column layout (8+4 split)
 * - Sticky sidebar with summary
 * - Accordion for optional sections
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Info,
  Loader2,
  User,
  Building2,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { customerService } from '../services/customerService';
import { notificationService } from '../services/notificationService';
import CustomerCreditPanel from '../components/credit/CustomerCreditPanel';
import TRNInput from '../components/TRNInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const CustomerForm = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    vatNumber: '',
    trn: '',
    creditLimit: 0,
    paymentTerms: '',
    customerCode: '',
    dsoValue: 0,
    creditUtilization: 0,
  });

  // Credit Management State
  const [creditData, setCreditData] = useState({
    creditUsed: 0,
    creditAvailable: 0,
    creditScore: 0,
    creditGrade: 'A',
    dsoDays: 0,
    agingCurrent: 0,
    aging1To30: 0,
    aging31To60: 0,
    aging61To90: 0,
    aging90Plus: 0,
    lastPaymentDate: null,
    creditReviewDate: null,
    lastCreditUpdated: null,
  });

  // UI State
  const [loading, setLoading] = useState(!!customerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(!customerId);

  // Modals
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
    useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Fetch customer data if editing
  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError('');
      const customer = await customerService.getCustomerById(customerId);

      setFormData({
        id: customer.id || '',
        name: customer.name || '',
        company: customer.company || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        vatNumber: customer.vatNumber || '',
        trn: customer.trn || '',
        creditLimit: customer.creditLimit || 0,
        paymentTerms: customer.paymentTerms || '',
        customerCode: customer.customerCode || '',
        dsoValue: customer.dsoValue || 0,
        creditUtilization: customer.creditUtilization || 0,
      });

      setCreditData({
        creditUsed: customer.creditUsed || 0,
        creditAvailable: customer.creditAvailable || 0,
        creditScore: customer.creditScore || 0,
        creditGrade: customer.creditGrade || 'A',
        dsoDays: customer.dsoDay || customer.dsoDays || 0,
        agingCurrent: customer.agingCurrent || 0,
        aging1To30: customer.aging1To30 || 0,
        aging31To60: customer.aging31To60 || 0,
        aging61To90: customer.aging61To90 || 0,
        aging90Plus: customer.aging90Plus || 0,
        lastPaymentDate: customer.lastPaymentDate || null,
        creditReviewDate: customer.creditReviewDate || null,
        lastCreditUpdated: customer.lastCreditUpdated || null,
      });
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!formData.name.trim()) {
        setError('Customer name is required');
        return;
      }

      const payload = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        vat_number: formData.vatNumber,
        trn: formData.trn,
        credit_limit: parseFloat(formData.creditLimit) || 0,
        payment_terms: formData.paymentTerms,
        customer_code: formData.customerCode,
        dso_value: parseFloat(formData.dsoValue) || 0,
        credit_utilization: parseFloat(formData.creditUtilization) || 0,
      };

      if (customerId) {
        await customerService.updateCustomer(customerId, payload);
      } else {
        await customerService.createCustomer(payload);
      }

      notificationService.success(
        customerId
          ? 'Customer updated successfully'
          : 'Customer created successfully',
      );
      navigate('/payables');
    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCreditLimit = async ({
    customerId: cId,
    newLimit,
    reason,
  }) => {
    try {
      setSaving(true);
      setError('');

      await customerService.updateCreditLimit(cId, {
        credit_limit: parseFloat(newLimit),
        review_reason: reason,
      });

      notificationService.success('Credit limit updated successfully');
      setFormData((prev) => ({ ...prev, creditLimit: newLimit }));

      if (customerId) {
        fetchCustomer();
      }
    } catch (err) {
      console.error('Error updating credit limit:', err);
      setError('Failed to update credit limit');
      notificationService.error('Failed to update credit limit');
    } finally {
      setSaving(false);
    }
  };

  const handleViewAging = () => {
    setIsAgingModalOpen(true);
  };

  const handleViewPaymentHistory = async () => {
    try {
      const history = await customerService.getPaymentHistory(customerId);
      setPaymentHistory(history || []);
      setIsPaymentHistoryModalOpen(true);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      notificationService.error('Failed to load payment history');
    }
  };

  // Combined customer data for display
  const customerForDisplay = useMemo(
    () => ({
      id: formData.id,
      name: formData.name,
      creditLimit: formData.creditLimit,
      ...creditData,
    }),
    [formData, creditData],
  );

  // ===================== THEME CLASSES =====================
  const cardBg = isDarkMode ? 'bg-[#141a20]' : 'bg-white';
  const cardBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-[#2a3640]' : 'border-gray-300';
  const textPrimary = isDarkMode ? 'text-[#e6edf3]' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500';
  const accordionBg = isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50';
  const inputFocus =
    'focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20';

  // Loading state
  if (loading && customerId) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-[#0b0f14]' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4aa3ff] mx-auto mb-3"></div>
          <p className={textMuted}>Loading customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0b0f14]' : 'bg-gray-50'}`}
    >
      {/* App Container */}
      <div className="max-w-6xl mx-auto p-4">
        <div
          className={`${cardBg} border ${cardBorder} rounded-[18px] overflow-hidden`}
        >
          {/* Sticky Header */}
          <div
            className={`sticky top-0 z-10 backdrop-blur-md ${
              isDarkMode
                ? 'bg-[#0f151b]/94 border-b border-[#2a3640]'
                : 'bg-white/94 border-b border-gray-200'
            } px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/payables')}
                  className={`p-2 rounded-xl transition-colors ${
                    isDarkMode
                      ? 'hover:bg-[#141a20] text-[#93a4b4]'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className={`text-lg font-extrabold ${textPrimary}`}>
                    {customerId ? 'Edit Customer' : 'New Customer'}
                  </h1>
                  <p className={`text-xs ${textMuted}`}>
                    {customerId
                      ? 'Update customer details'
                      : 'Add new customer to system'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {customerId && (
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      isEditMode
                        ? isDarkMode
                          ? 'border-red-500/50 bg-red-500/12 text-red-400'
                          : 'border-red-200 bg-red-50 text-red-700'
                        : isDarkMode
                          ? 'border-[#4aa3ff]/50 bg-[#4aa3ff]/12 text-[#4aa3ff]'
                          : 'border-teal-200 bg-teal-50 text-teal-700'
                    }`}
                  >
                    {isEditMode ? 'Cancel Edit' : 'Edit'}
                  </button>
                )}
                {isEditMode && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                      isDarkMode
                        ? 'bg-[#4aa3ff] text-[#001018] hover:bg-[#5bb2ff]'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : customerId ? 'Update' : 'Create'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-3 p-4">
            {/* Error Alert */}
            {error && (
              <div
                className={`col-span-12 p-4 rounded-[14px] border ${
                  isDarkMode
                    ? 'bg-red-900/20 border-red-600/50 text-red-200'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={isDarkMode ? 'text-red-400' : 'text-red-600'}
                    size={20}
                  />
                  <div>
                    <h4 className="font-bold text-sm">Error</h4>
                    <p className="text-xs">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* LEFT COLUMN: Main Form */}
            <div className="col-span-12 lg:col-span-8 space-y-3">
              {/* Section 1: Basic Information */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div
                    className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}
                  >
                    <User className="h-4 w-4" />
                    Basic Information
                  </div>
                  <div className={`text-xs ${textMuted}`}>
                    Customer identity and contact details
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Customer Name */}
                  <div className="col-span-12 md:col-span-6">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="e.g., ABC Trading Company"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* Company Name */}
                  <div className="col-span-12 md:col-span-6">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="Legal company name"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-12 md:col-span-6">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="customer@example.com"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-span-12 md:col-span-6">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="+971 1 234 5678"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* Customer Code */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Customer Code
                    </label>
                    <input
                      type="text"
                      name="customerCode"
                      value={formData.customerCode}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="Unique code"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* Payment Terms */}
                  <div className="col-span-6 md:col-span-4">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="e.g., Net 30"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tax Compliance */}
              <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                <div className="mb-3">
                  <div
                    className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2`}
                  >
                    <Building2 className="h-4 w-4" />
                    Tax & VAT Compliance
                  </div>
                  <div className={`text-xs ${textMuted}`}>
                    UAE Federal Decree-Law No. 8 of 2017
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* VAT Number */}
                  <div className="col-span-12 md:col-span-6">
                    <label className={`block text-xs ${textMuted} mb-1.5`}>
                      VAT Number
                    </label>
                    <input
                      type="text"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      placeholder="123456789012345"
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                    />
                  </div>

                  {/* TRN */}
                  <div className="col-span-12 md:col-span-6">
                    <TRNInput
                      value={formData.trn}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, trn: value }))
                      }
                      disabled={!isEditMode}
                      label="Tax Registration Number (TRN)"
                      required={false}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Address Accordion */}
              <details
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div>
                    <div className={`text-sm font-bold ${textPrimary}`}>
                      Address
                    </div>
                    <div className={`text-xs ${textMuted}`}>
                      Physical business address
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder}`}>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    placeholder="Street address, city, state, postal code"
                    rows={3}
                    className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} placeholder:${textMuted} outline-none ${inputFocus} disabled:opacity-50`}
                  />
                </div>
              </details>

              {/* Section 4: Credit Management Accordion */}
              <details
                open
                className={`${accordionBg} border ${cardBorder} rounded-[14px] overflow-hidden group`}
              >
                <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`h-4 w-4 ${textMuted}`} />
                    <div>
                      <div className={`text-sm font-bold ${textPrimary}`}>
                        Credit Management
                      </div>
                      <div className={`text-xs ${textMuted}`}>
                        Credit limits, utilization, and DSO
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 ${textMuted} transition-transform group-open:rotate-180`}
                  />
                </summary>
                <div className={`p-3 border-t ${cardBorder} space-y-3`}>
                  {/* Credit Limit Input */}
                  {isEditMode && (
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6 md:col-span-4">
                        <label className={`block text-xs ${textMuted} mb-1.5`}>
                          Credit Limit (AED)
                        </label>
                        <input
                          type="number"
                          name="creditLimit"
                          value={formData.creditLimit}
                          onChange={handleInputChange}
                          step="100"
                          min="0"
                          placeholder="0"
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-4">
                        <label className={`block text-xs ${textMuted} mb-1.5`}>
                          DSO Value
                        </label>
                        <input
                          type="number"
                          name="dsoValue"
                          value={formData.dsoValue}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-4">
                        <label className={`block text-xs ${textMuted} mb-1.5`}>
                          Credit Utilization (%)
                        </label>
                        <input
                          type="number"
                          name="creditUtilization"
                          value={formData.creditUtilization}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          className={`w-full py-2.5 px-3 rounded-xl border text-sm ${inputBg} ${inputBorder} ${textPrimary} outline-none ${inputFocus}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* CustomerCreditPanel Component */}
                  {customerId && (
                    <CustomerCreditPanel
                      customer={customerForDisplay}
                      onUpdateCreditLimit={handleUpdateCreditLimit}
                      onViewAging={handleViewAging}
                      onViewPaymentHistory={handleViewPaymentHistory}
                      readOnly={!isEditMode}
                    />
                  )}

                  {!customerId && (
                    <div
                      className={`p-3 rounded-xl text-center ${
                        isDarkMode
                          ? 'bg-[#0a0f14] text-[#93a4b4]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <p className="text-xs">
                        Save the customer first to view credit management
                      </p>
                    </div>
                  )}
                </div>
              </details>
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-3">
                {/* Customer Summary */}
                <div
                  className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}
                >
                  <div className={`text-sm font-extrabold ${textPrimary} mb-3`}>
                    Customer Summary
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Name:</span>
                      <span className={`font-medium ${textPrimary}`}>
                        {formData.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Company:</span>
                      <span className={textPrimary}>
                        {formData.company || '-'}
                      </span>
                    </div>
                    {formData.trn && (
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>TRN:</span>
                        <span className={`font-mono ${textPrimary}`}>
                          {formData.trn}
                        </span>
                      </div>
                    )}
                    <div className={`h-px ${cardBorder} my-2`}></div>
                    <div className="flex justify-between text-sm">
                      <span className={textMuted}>Credit Limit:</span>
                      <span
                        className={`font-mono font-bold ${isDarkMode ? 'text-[#4aa3ff]' : 'text-teal-600'}`}
                      >
                        AED{' '}
                        {parseFloat(formData.creditLimit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credit Grade Card */}
                {customerId && (
                  <div
                    className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}
                  >
                    <div
                      className={`text-sm font-extrabold ${textPrimary} mb-3`}
                    >
                      Credit Status
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-xs ${textMuted}`}>
                          Credit Grade
                        </div>
                        <div
                          className={`text-2xl font-extrabold ${
                            creditData.creditGrade === 'A'
                              ? 'text-green-500'
                              : creditData.creditGrade === 'B'
                                ? 'text-green-400'
                                : creditData.creditGrade === 'C'
                                  ? 'text-yellow-500'
                                  : creditData.creditGrade === 'D'
                                    ? 'text-orange-500'
                                    : 'text-red-500'
                          }`}
                        >
                          {creditData.creditGrade}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${textMuted}`}>DSO Days</div>
                        <div
                          className={`text-xl font-bold font-mono ${textPrimary}`}
                        >
                          {creditData.dsoDays}
                        </div>
                      </div>
                    </div>
                    <div
                      className="mt-3 pt-3 border-t border-dashed"
                      style={{
                        borderColor: isDarkMode ? '#2a3640' : '#e5e7eb',
                      }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className={textMuted}>Credit Used:</span>
                        <span className={`font-mono ${textPrimary}`}>
                          AED {creditData.creditUsed.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={textMuted}>Available:</span>
                        <span
                          className={`font-mono ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                        >
                          AED {creditData.creditAvailable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Card */}
                <div
                  className={`p-3 rounded-[14px] border ${
                    isDarkMode
                      ? 'bg-[#4aa3ff]/10 border-[#4aa3ff]/30'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Info
                      className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-600'}`}
                    />
                    <div>
                      <div
                        className={`text-xs font-bold ${isDarkMode ? 'text-[#4aa3ff]' : 'text-blue-700'}`}
                      >
                        Credit Management
                      </div>
                      <p
                        className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-blue-600'}`}
                      >
                        Credit grades (A-E) are calculated from DSO and payment
                        history. Lower DSO indicates faster payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aging Analysis Modal */}
      <Dialog open={isAgingModalOpen} onOpenChange={setIsAgingModalOpen}>
        <DialogContent
          className={isDarkMode ? 'bg-[#141a20] border-[#2a3640]' : 'bg-white'}
        >
          <DialogHeader>
            <DialogTitle className={textPrimary}>
              Aging Analysis - {formData.name}
            </DialogTitle>
            <DialogDescription className={textMuted}>
              Invoice aging breakdown as of today
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {[
              {
                label: 'Current (0 days)',
                value: creditData.agingCurrent,
                color: 'text-green-500',
              },
              {
                label: '1-30 days overdue',
                value: creditData.aging1To30,
                color: 'text-yellow-500',
              },
              {
                label: '31-60 days overdue',
                value: creditData.aging31To60,
                color: 'text-orange-500',
              },
              {
                label: '61-90 days overdue',
                value: creditData.aging61To90,
                color: 'text-orange-600',
              },
              {
                label: '90+ days overdue',
                value: creditData.aging90Plus,
                color: 'text-red-500',
              },
            ].map((bucket, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className={textMuted}>{bucket.label}</span>
                <span className={`font-mono font-bold ${bucket.color}`}>
                  AED{' '}
                  {bucket.value.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
            <div
              className={`border-t pt-3 flex items-center justify-between font-bold ${cardBorder}`}
            >
              <span className={textPrimary}>Total Outstanding</span>
              <span className={`font-mono ${textPrimary}`}>
                AED{' '}
                {(
                  creditData.agingCurrent +
                  creditData.aging1To30 +
                  creditData.aging31To60 +
                  creditData.aging61To90 +
                  creditData.aging90Plus
                ).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog
        open={isPaymentHistoryModalOpen}
        onOpenChange={setIsPaymentHistoryModalOpen}
      >
        <DialogContent
          className={`${isDarkMode ? 'bg-[#141a20] border-[#2a3640]' : 'bg-white'} max-w-2xl`}
        >
          <DialogHeader>
            <DialogTitle className={textPrimary}>
              Payment History - {formData.name}
            </DialogTitle>
            <DialogDescription className={textMuted}>
              Recent payments received
            </DialogDescription>
          </DialogHeader>

          <div className={`rounded-xl border overflow-hidden ${cardBorder}`}>
            <table
              className="min-w-full divide-y"
              style={{ borderColor: isDarkMode ? '#2a3640' : '#e5e7eb' }}
            >
              <thead className={isDarkMode ? 'bg-[#0f151b]' : 'bg-gray-50'}>
                <tr>
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}
                  >
                    Date
                  </th>
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}
                  >
                    Amount (AED)
                  </th>
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}
                  >
                    Reference
                  </th>
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium ${textMuted}`}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? 'divide-[#2a3640]' : 'divide-gray-200'}`}
              >
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, idx) => (
                    <tr key={idx}>
                      <td className={`px-3 py-2 text-sm ${textMuted}`}>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm font-mono ${textPrimary}`}
                      >
                        AED{' '}
                        {payment.amount.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={`px-3 py-2 text-sm ${textMuted}`}>
                        {payment.reference || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed'
                              ? isDarkMode
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-green-100 text-green-700'
                              : isDarkMode
                                ? 'bg-yellow-900/30 text-yellow-400'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className={`px-3 py-6 text-center text-sm ${textMuted}`}
                    >
                      No payment history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerForm;
