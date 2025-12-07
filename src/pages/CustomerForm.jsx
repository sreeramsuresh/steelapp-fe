import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { customerService } from '../services/customerService';
import { notificationService } from '../services/notificationService';
import CustomerCreditPanel from '../components/credit/CustomerCreditPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

/**
 * CustomerForm Component
 * Manages customer details including Phase 5 credit management fields
 * Features:
 * - Basic customer information (name, email, phone, address)
 * - Tax/VAT compliance (VAT number, TRN)
 * - Credit management with CustomerCreditPanel integration
 * - Credit limit adjustments and aging analysis
 * - Payment history tracking
 */
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
  const [activeTab, setActiveTab] = useState('basic');

  // Modals
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Fetch customer data if editing
  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]); // fetchCustomer is stable

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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validation
      if (!formData.name.trim()) {
        setError('Customer name is required');
        return;
      }

      // Prepare payload with snake_case for API
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

      let result;
      if (customerId) {
        // Update existing customer
        result = await customerService.updateCustomer(customerId, payload);
      } else {
        // Create new customer
        result = await customerService.createCustomer(payload);
      }

      notificationService.success(
        customerId ? 'Customer updated successfully' : 'Customer created successfully',
      );

      // Navigate to customer list or detail view
      navigate('/payables');
    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCreditLimit = async ({ customerId: cId, newLimit, reason }) => {
    try {
      setSaving(true);
      setError('');

      await customerService.updateCreditLimit(cId, {
        credit_limit: parseFloat(newLimit),
        review_reason: reason,
      });

      notificationService.success('Credit limit updated successfully');
      setFormData(prev => ({
        ...prev,
        creditLimit: newLimit,
      }));

      // Refresh customer data
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
      // Fetch payment history for the customer
      const history = await customerService.getPaymentHistory(customerId);
      setPaymentHistory(history || []);
      setIsPaymentHistoryModalOpen(true);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      notificationService.error('Failed to load payment history');
    }
  };

  // Combined customer data for display
  const customerForDisplay = useMemo(() => ({
    id: formData.id,
    name: formData.name,
    creditLimit: formData.creditLimit,
    ...creditData,
  }), [formData, creditData]);

  // CSS Classes
  const containerBg = isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]';
  const cardBg = isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const mutedColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = isDarkMode ? 'bg-[#2A3035] border-[#37474F] text-white' : 'bg-white border-gray-300 text-gray-900';
  const labelColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  if (loading && customerId) {
    return (
      <div className={`p-4 min-h-[calc(100vh-64px)] ${containerBg}`}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${containerBg}`}>
      <div className={`p-6 mx-0 sm:mx-auto max-w-4xl rounded-none sm:rounded-2xl border ${cardBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/payables')}
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-2xl font-semibold ${textColor}`}>
                {customerId ? 'Edit Customer' : 'Create New Customer'}
              </h1>
              <p className={mutedColor}>
                {customerId ? 'Update customer details and credit management settings' : 'Add a new customer to the system'}
              </p>
            </div>
          </div>
          {customerId && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded font-medium transition ${
                isEditMode
                  ? isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  : isDarkMode ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
              }`}
            >
              {isEditMode ? 'Cancel Edit' : 'Edit'}
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border flex gap-3 ${
            isDarkMode
              ? 'bg-red-900/20 border-red-700 text-red-300'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6" style={{ borderColor: isDarkMode ? '#37474F' : '#E0E0E0' }}>
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'basic'
                ? isDarkMode ? 'text-teal-400 border-teal-400' : 'text-teal-600 border-teal-600'
                : isDarkMode ? 'text-gray-400 border-transparent' : 'text-gray-600 border-transparent'
            }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'credit'
                ? isDarkMode ? 'text-teal-400 border-teal-400' : 'text-teal-600 border-teal-600'
                : isDarkMode ? 'text-gray-400 border-transparent' : 'text-gray-600 border-transparent'
            }`}
          >
            Credit Management
          </button>
        </div>

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Customer Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="e.g., ABC Trading Company"
                className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="Legal company name"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="customer@example.com"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="+971 1 234 5678"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* VAT Number */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  VAT Number
                </label>
                <input
                  type="text"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="123456789012345"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* TRN */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Tax Registration Number (TRN)
                </label>
                <input
                  type="text"
                  name="trn"
                  value={formData.trn}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="123456789012"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="e.g., 30 days, Net 45"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* Customer Code (Analytics) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Customer Code
                </label>
                <input
                  type="text"
                  name="customerCode"
                  value={formData.customerCode}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="Unique customer code"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* DSO Value (Analytics) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Days Sales Outstanding (DSO)
                </label>
                <input
                  type="number"
                  name="dsoValue"
                  value={formData.dsoValue}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>

              {/* Credit Utilization (Analytics) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Credit Utilization (%)
                </label>
                <input
                  type="number"
                  name="creditUtilization"
                  value={formData.creditUtilization}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Street address, city, state, postal code"
                rows="3"
                className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
              />
            </div>

            {/* Info Box */}
            <div className={`p-4 rounded-lg border flex gap-3 ${
              isDarkMode
                ? 'bg-blue-900/20 border-blue-700 text-blue-100'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <Info size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Basic Information</p>
                <p>Enter the customer&apos;s basic contact and compliance information. This helps identify the customer and maintain accurate records.</p>
              </div>
            </div>
          </div>
        )}

        {/* Credit Management Tab */}
        {activeTab === 'credit' && (
          <div className="space-y-6">
            {/* Credit Limit Input (editable) */}
            {isEditMode && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>
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
                  className={`w-full px-3 py-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                <p className={`${mutedColor} text-xs mt-1`}>
                  The maximum amount of credit this customer can use
                </p>
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
              <div className={`p-4 rounded-lg border text-center ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <p className="text-sm">
                  Save the customer first to view credit management information
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className={`p-4 rounded-lg border flex gap-3 ${
              isDarkMode
                ? 'bg-blue-900/20 border-blue-700 text-blue-100'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <Info size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Credit Management (Phase 5)</p>
                <p>View and manage customer credit limits, utilization, and payment history. Credit grades (A-E) are automatically calculated based on Days Sales Outstanding (DSO) and payment history.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isEditMode && (
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => {
                if (customerId) {
                  setIsEditMode(false);
                  fetchCustomer(); // Reset to original data
                } else {
                  navigate('/payables');
                }
              }}
              className={`px-6 py-2 rounded font-medium transition ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded font-medium flex items-center gap-2 transition ${
                isDarkMode
                  ? 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50'
                  : 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50'
              }`}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {customerId ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        )}
      </div>

      {/* Aging Analysis Modal */}
      <Dialog open={isAgingModalOpen} onOpenChange={setIsAgingModalOpen}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={textColor}>
              Aging Analysis - {formData.name}
            </DialogTitle>
            <DialogDescription className={mutedColor}>
              Invoice aging breakdown as of today
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {[
              { label: 'Current (0 days)', value: creditData.agingCurrent, color: 'text-green-600' },
              { label: '1-30 days overdue', value: creditData.aging1To30, color: 'text-yellow-600' },
              { label: '31-60 days overdue', value: creditData.aging31To60, color: 'text-orange-600' },
              { label: '61-90 days overdue', value: creditData.aging61To90, color: 'text-orange-700' },
              { label: '90+ days overdue', value: creditData.aging90Plus, color: 'text-red-600' },
            ].map((bucket, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className={mutedColor}>{bucket.label}</span>
                <span className={`font-semibold ${bucket.color}`}>
                  AED {bucket.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className={`border-t pt-4 flex items-center justify-between font-bold ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <span className={textColor}>Total Outstanding</span>
              <span className={textColor}>
                AED {(creditData.agingCurrent + creditData.aging1To30 + creditData.aging31To60 + creditData.aging61To90 + creditData.aging90Plus).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={isPaymentHistoryModalOpen} onOpenChange={setIsPaymentHistoryModalOpen}>
        <DialogContent className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={textColor}>
              Payment History - {formData.name}
            </DialogTitle>
            <DialogDescription className={mutedColor}>
              Recent payments received from this customer
            </DialogDescription>
          </DialogHeader>

          <div className={`rounded border overflow-hidden ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <table className="min-w-full divide-y" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date</th>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Amount (AED)</th>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reference</th>
                  <th className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, idx) => (
                    <tr key={idx}>
                      <td className={`px-4 py-2 text-sm ${mutedColor}`}>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-2 text-sm font-medium ${textColor}`}>
                        AED {payment.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-2 text-sm ${mutedColor}`}>
                        {payment.reference || '-'}
                      </td>
                      <td className={`px-4 py-2 text-sm`}>
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          payment.status === 'completed'
                            ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={`px-4 py-6 text-center text-sm ${mutedColor}`}>
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
