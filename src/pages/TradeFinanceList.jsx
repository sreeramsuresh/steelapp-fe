import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  AlertTriangle,
  Clock,
  RefreshCw,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
  DollarSign,
  FileWarning,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { tradeFinanceService } from '../services/tradeFinanceService';
import { importOrderService } from '../services/importOrderService';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

// Document type options
const DOCUMENT_TYPES = [
  { value: 'letter_of_credit', label: 'Letter of Credit (LC)', icon: FileText },
  { value: 'bank_guarantee', label: 'Bank Guarantee (BG)', icon: Building2 },
  {
    value: 'documentary_collection',
    label: 'Documentary Collection (DC)',
    icon: FileText,
  },
  { value: 'standby_lc', label: 'Standby LC (SBLC)', icon: FileText },
  { value: 'payment_receipt', label: 'Payment Receipt', icon: DollarSign },
];

// Status options with colors
const STATUS_OPTIONS = [
  {
    value: 'draft',
    label: 'Draft',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  {
    value: 'issued',
    label: 'Issued',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  {
    value: 'amended',
    label: 'Amended',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  {
    value: 'utilized',
    label: 'Utilized',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  {
    value: 'expired',
    label: 'Expired',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
];

// Tenor options
const TENOR_OPTIONS = [
  { value: 'at_sight', label: 'At Sight' },
  { value: '30_days', label: '30 Days' },
  { value: '60_days', label: '60 Days' },
  { value: '90_days', label: '90 Days' },
  { value: '120_days', label: '120 Days' },
  { value: '180_days', label: '180 Days' },
];

// Currency options
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

// Document requirements checklist
const DOCUMENT_REQUIREMENTS = [
  { id: 'commercial_invoice', label: 'Commercial Invoice', required: true },
  { id: 'packing_list', label: 'Packing List', required: true },
  { id: 'bill_of_lading', label: 'Bill of Lading', required: true },
  {
    id: 'certificate_of_origin',
    label: 'Certificate of Origin',
    required: false,
  },
  {
    id: 'mill_test_certificate',
    label: 'Mill Test Certificate',
    required: false,
  },
  {
    id: 'insurance_certificate',
    label: 'Insurance Certificate',
    required: false,
  },
  {
    id: 'inspection_certificate',
    label: 'Inspection Certificate',
    required: false,
  },
  { id: 'weight_certificate', label: 'Weight Certificate', required: false },
];

// Expiry filter options
const EXPIRY_FILTER_OPTIONS = [
  { value: '', label: 'All Documents' },
  { value: 'expiring_7', label: 'Expiring in 7 Days' },
  { value: 'expiring_30', label: 'Expiring in 30 Days' },
  { value: 'expired', label: 'Expired' },
  { value: 'active', label: 'Active (Not Expired)' },
];

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Helper function to format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Expiry indicator component
const ExpiryIndicator = ({ expiryDate }) => {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

  if (daysUntilExpiry === null) {
    return <span className="text-gray-400">-</span>;
  }

  if (daysUntilExpiry < 0) {
    return (
      <div className="flex items-center gap-1">
        <XCircle size={14} className="text-red-600" />
        <span className="text-red-600 font-medium">Expired</span>
        <span className="text-red-500 text-xs">
          ({Math.abs(daysUntilExpiry)}d ago)
        </span>
      </div>
    );
  }

  if (daysUntilExpiry <= 7) {
    return (
      <div className="flex items-center gap-1">
        <AlertTriangle size={14} className="text-red-600" />
        <span className="text-red-600 font-medium">{daysUntilExpiry}d</span>
      </div>
    );
  }

  if (daysUntilExpiry <= 30) {
    return (
      <div className="flex items-center gap-1">
        <Clock size={14} className="text-yellow-600" />
        <span className="text-yellow-600 font-medium">{daysUntilExpiry}d</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <CheckCircle size={14} className="text-green-600" />
      <span className="text-green-600">{daysUntilExpiry}d</span>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig =
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}
    >
      {statusConfig.label}
    </span>
  );
};

// Document type badge component
const DocumentTypeBadge = ({ type, isDarkMode }) => {
  const typeConfig = DOCUMENT_TYPES.find((t) => t.value === type);
  const Icon = typeConfig?.icon || FileText;
  const label = typeConfig?.label || type;

  return (
    <div
      className={`flex items-center gap-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
    >
      <Icon size={14} />
      <span className="text-sm">{label}</span>
    </div>
  );
};

// Initial form state
const getInitialFormState = () => ({
  document_type: 'letter_of_credit',
  reference_number: '',
  import_order_id: '',
  issuing_bank: '',
  advising_bank: '',
  applicant: '',
  beneficiary: '',
  amount: '',
  currency: 'USD',
  issue_date: '',
  expiry_date: '',
  latest_shipment_date: '',
  tenor: 'at_sight',
  document_requirements: {
    commercial_invoice: true,
    packing_list: true,
    bill_of_lading: true,
    certificate_of_origin: false,
    mill_test_certificate: false,
    insurance_certificate: false,
    inspection_certificate: false,
    weight_certificate: false,
  },
  special_conditions: '',
  notes: '',
  file: null,
  // Amendment fields
  amendment_number: 0,
  amendment_date: '',
  amendment_details: '',
});

// Create/Edit Modal Component
const TradeFinanceModal = ({
  isOpen,
  onClose,
  onSave,
  editingRecord,
  importOrders,
  isDarkMode,
  isAmendment = false,
}) => {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load editing record data
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        ...getInitialFormState(),
        ...editingRecord,
        document_requirements:
          editingRecord.document_requirements ||
          getInitialFormState().document_requirements,
        // For amendment, increment amendment number
        amendment_number: isAmendment
          ? (editingRecord.amendment_number || 0) + 1
          : editingRecord.amendment_number || 0,
        amendment_date: isAmendment
          ? new Date().toISOString().split('T')[0]
          : editingRecord.amendment_date || '',
        amendment_details: isAmendment
          ? ''
          : editingRecord.amendment_details || '',
      });
    } else {
      setFormData(getInitialFormState());
    }
    setErrors({});
    setIsSaving(false);
    setShowAdvanced(false);
  }, [editingRecord, isOpen, isAmendment]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleDocRequirementChange = (reqId, checked) => {
    setFormData((prev) => ({
      ...prev,
      document_requirements: {
        ...prev.document_requirements,
        [reqId]: checked,
      },
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reference_number?.trim()) {
      newErrors.reference_number = 'Reference number is required';
    }
    if (!formData.issuing_bank?.trim()) {
      newErrors.issuing_bank = 'Issuing bank is required';
    }
    if (!formData.beneficiary?.trim()) {
      newErrors.beneficiary = 'Beneficiary is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required';
    }
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required';
    }
    if (
      formData.issue_date &&
      formData.expiry_date &&
      new Date(formData.expiry_date) <= new Date(formData.issue_date)
    ) {
      newErrors.expiry_date = 'Expiry date must be after issue date';
    }
    if (isAmendment && !formData.amendment_details?.trim()) {
      newErrors.amendment_details = 'Amendment details are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save record' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = isAmendment
    ? `Amend Trade Finance Document (Amendment #${formData.amendment_number})`
    : editingRecord
      ? 'Edit Trade Finance Document'
      : 'Create Trade Finance Document';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div
        className={`w-full max-w-4xl mx-4 my-8 rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Amendment Banner */}
          {isAmendment && (
            <div
              className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-300'} border`}
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-yellow-600" />
                <span className="font-medium">
                  Creating Amendment #{formData.amendment_number}
                </span>
              </div>
              <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-400">
                Original document will be marked as amended. Please specify the
                changes in Amendment Details.
              </p>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.document_type}
                onChange={(e) => handleChange('document_type', e.target.value)}
                disabled={!!editingRecord}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${editingRecord ? 'opacity-60' : ''}`}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) =>
                  handleChange('reference_number', e.target.value)
                }
                placeholder="e.g., LC-2024-001"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.reference_number ? 'border-red-500' : ''}`}
              />
              {errors.reference_number && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.reference_number}
                </p>
              )}
            </div>

            {/* Link to Import Order */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Linked Import Order
              </label>
              <select
                value={formData.import_order_id || ''}
                onChange={(e) =>
                  handleChange(
                    'import_order_id',
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">-- No linked order --</option>
                {importOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.import_order_number || order.importOrderNumber} -{' '}
                    {order.supplier_name || order.supplierName}
                  </option>
                ))}
              </select>
            </div>

            {/* Issuing Bank */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Issuing Bank <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.issuing_bank}
                onChange={(e) => handleChange('issuing_bank', e.target.value)}
                placeholder="e.g., Emirates NBD"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.issuing_bank ? 'border-red-500' : ''}`}
              />
              {errors.issuing_bank && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.issuing_bank}
                </p>
              )}
            </div>

            {/* Advising Bank */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Advising Bank
              </label>
              <input
                type="text"
                value={formData.advising_bank}
                onChange={(e) => handleChange('advising_bank', e.target.value)}
                placeholder="e.g., HSBC Bank"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Applicant */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Applicant (Buyer/Importer)
              </label>
              <input
                type="text"
                value={formData.applicant}
                onChange={(e) => handleChange('applicant', e.target.value)}
                placeholder="e.g., Ultimate Steel LLC"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Beneficiary */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Beneficiary (Seller/Supplier){' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.beneficiary}
                onChange={(e) => handleChange('beneficiary', e.target.value)}
                placeholder="e.g., Steel Manufacturer Co."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.beneficiary ? 'border-red-500' : ''}`}
              />
              {errors.beneficiary && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.beneficiary}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.amount ? 'border-red-500' : ''}`}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {CURRENCY_OPTIONS.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange('issue_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.issue_date ? 'border-red-500' : ''}`}
              />
              {errors.issue_date && (
                <p className="text-red-500 text-xs mt-1">{errors.issue_date}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.expiry_date ? 'border-red-500' : ''}`}
              />
              {errors.expiry_date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.expiry_date}
                </p>
              )}
            </div>

            {/* Latest Shipment Date */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Latest Shipment Date
              </label>
              <input
                type="date"
                value={formData.latest_shipment_date}
                onChange={(e) =>
                  handleChange('latest_shipment_date', e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Tenor */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Tenor
              </label>
              <select
                value={formData.tenor}
                onChange={(e) => handleChange('tenor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {TENOR_OPTIONS.map((tenor) => (
                  <option key={tenor.value} value={tenor.value}>
                    {tenor.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Requirements Section */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {showAdvanced ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              Document Requirements & Additional Details
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Document Requirements Checklist */}
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <h4 className="font-medium mb-3">Required Documents</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DOCUMENT_REQUIREMENTS.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.document_requirements[doc.id] || false
                          }
                          onChange={(e) =>
                            handleDocRequirementChange(doc.id, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm">{doc.label}</span>
                        {doc.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Conditions */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Special Conditions
                  </label>
                  <textarea
                    value={formData.special_conditions}
                    onChange={(e) =>
                      handleChange('special_conditions', e.target.value)
                    }
                    rows="3"
                    placeholder="Enter any special conditions or clauses..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows="2"
                    placeholder="Internal notes..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Attach Document Copy
                  </label>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Upload size={16} className="text-gray-400" />
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="flex-1 text-sm"
                    />
                  </div>
                  {formData.file && (
                    <p className="text-sm text-teal-600 mt-1">
                      Selected: {formData.file.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Amendment Details Section */}
          {isAmendment && (
            <div className="mt-6 space-y-4">
              <h4
                className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Amendment Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amendment Number (Read Only) */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Amendment Number
                  </label>
                  <input
                    type="text"
                    value={`Amendment #${formData.amendment_number}`}
                    readOnly
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-600 border-gray-600 text-gray-300'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  />
                </div>

                {/* Amendment Date */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Amendment Date
                  </label>
                  <input
                    type="date"
                    value={formData.amendment_date}
                    onChange={(e) =>
                      handleChange('amendment_date', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Amendment Details */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Amendment Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.amendment_details}
                  onChange={(e) =>
                    handleChange('amendment_details', e.target.value)
                  }
                  rows="4"
                  placeholder="Describe the changes made in this amendment..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${errors.amendment_details ? 'border-red-500' : ''}`}
                />
                {errors.amendment_details && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amendment_details}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex justify-end gap-3 px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center ${
              isSaving ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : isAmendment ? (
              'Create Amendment'
            ) : editingRecord ? (
              'Update Document'
            ) : (
              'Create Document'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main TradeFinanceList Component
const TradeFinanceList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // State
  const [records, setRecords] = useState([]);
  const [importOrders, setImportOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    document_type: '',
    status: '',
    expiry_filter: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isAmendment, setIsAmendment] = useState(false);

  // Load records
  const loadRecords = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: pagination.per_page,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await tradeFinanceService.getTradeFinanceRecords(params);

      // Handle both array and paginated response
      if (Array.isArray(response)) {
        setRecords(response);
        setPagination((prev) => ({
          ...prev,
          total: response.length,
          total_pages: 1,
        }));
      } else {
        setRecords(response.records || response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      console.error('Error loading trade finance records:', err);
      setError(err.message || 'Failed to load trade finance records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Load import orders for linking
  const loadImportOrders = async () => {
    try {
      const response = await importOrderService.getImportOrders({ limit: 100 });
      setImportOrders(response.orders || response.data || []);
    } catch (err) {
      console.error('Error loading import orders:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadRecords();
    loadImportOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount

  // Reload on filter change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // loadRecords is intentionally not in deps - stable function

  // Filtered records (client-side filtering for expiry)
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Apply expiry filter client-side
    if (filters.expiry_filter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((record) => {
        const daysUntilExpiry = getDaysUntilExpiry(record.expiry_date);

        switch (filters.expiry_filter) {
          case 'expiring_7':
            return (
              daysUntilExpiry !== null &&
              daysUntilExpiry >= 0 &&
              daysUntilExpiry <= 7
            );
          case 'expiring_30':
            return (
              daysUntilExpiry !== null &&
              daysUntilExpiry >= 0 &&
              daysUntilExpiry <= 30
            );
          case 'expired':
            return daysUntilExpiry !== null && daysUntilExpiry < 0;
          case 'active':
            return daysUntilExpiry === null || daysUntilExpiry >= 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [records, filters.expiry_filter]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      document_type: '',
      status: '',
      expiry_filter: '',
      start_date: '',
      end_date: '',
    });
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setIsAmendment(false);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsAmendment(false);
    setIsModalOpen(true);
  };

  const handleAmend = (record) => {
    setEditingRecord(record);
    setIsAmendment(true);
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    // For now, open in edit mode but could navigate to detail page
    handleEdit(record);
  };

  const handleDelete = async (record) => {
    const confirmed = await confirm({
      title: 'Delete Trade Finance Document?',
      message: `Are you sure you want to delete "${record.reference_number}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await tradeFinanceService.deleteTradeFinanceRecord(record.id);
      loadRecords(pagination.current_page);
    } catch (err) {
      setError(err.message || 'Failed to delete record');
    }
  };

  const handleSave = async (data) => {
    if (editingRecord && !isAmendment) {
      // Update existing record
      await tradeFinanceService.updateTradeFinanceRecord(
        editingRecord.id,
        data,
      );
    } else if (isAmendment) {
      // Create amendment (update with amendment status)
      await tradeFinanceService.updateTradeFinanceRecord(editingRecord.id, {
        ...data,
        status: 'amended',
      });
    } else {
      // Create new record
      await tradeFinanceService.createTradeFinanceRecord(data);
    }
    loadRecords(pagination.current_page);
  };

  const handleExport = () => {
    // Export functionality placeholder
    const csvContent = [
      [
        'Reference',
        'Type',
        'Issuing Bank',
        'Beneficiary',
        'Amount',
        'Currency',
        'Issue Date',
        'Expiry Date',
        'Status',
      ].join(','),
      ...filteredRecords.map((r) =>
        [
          r.reference_number,
          r.document_type,
          r.issuing_bank,
          r.beneficiary,
          r.amount,
          r.currency,
          r.issue_date,
          r.expiry_date,
          r.status,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-finance-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      total: filteredRecords.length,
      expiringSoon: 0,
      expired: 0,
      totalAmount: 0,
    };

    filteredRecords.forEach((record) => {
      const days = getDaysUntilExpiry(record.expiry_date);
      if (days !== null) {
        if (days < 0) stats.expired++;
        else if (days <= 30) stats.expiringSoon++;
      }
      if (record.amount) {
        stats.totalAmount += parseFloat(record.amount) || 0;
      }
    });

    return stats;
  }, [filteredRecords]);

  // Get linked order number
  const getLinkedOrderNumber = (importOrderId) => {
    if (!importOrderId) return '-';
    const order = importOrders.find((o) => o.id === importOrderId);
    return order
      ? order.import_order_number ||
          order.importOrderNumber ||
          `#${importOrderId}`
      : `#${importOrderId}`;
  };

  return (
    <div
      className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trade Finance</h1>
          <p className="text-gray-500 mt-1">
            Manage Letters of Credit, Bank Guarantees, and other trade finance
            instruments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={handleCreate}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            New Document
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}
            >
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Documents</p>
              <p className="text-xl font-bold">{summaryStats.total}</p>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}
            >
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-xl font-bold text-yellow-600">
                {summaryStats.expiringSoon}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}
            >
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-xl font-bold text-red-600">
                {summaryStats.expired}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}
            >
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-xl font-bold">
                {formatCurrency(summaryStats.totalAmount, 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 mb-6 shadow-sm`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by reference, bank name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Document Type Filter */}
          <select
            value={filters.document_type}
            onChange={(e) =>
              handleFilterChange('document_type', e.target.value)
            }
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Expiry Filter */}
          <select
            value={filters.expiry_filter}
            onChange={(e) =>
              handleFilterChange('expiry_filter', e.target.value)
            }
            className={`px-3 py-2 border rounded-lg ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            {EXPIRY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Filter size={16} />
            {showFilters ? 'Less' : 'More'}
          </button>

          {/* Clear Filters */}
          {(filters.search ||
            filters.document_type ||
            filters.status ||
            filters.expiry_filter ||
            filters.start_date ||
            filters.end_date) && (
            <button
              onClick={handleClearFilters}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Additional Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Issue Date From
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  handleFilterChange('start_date', e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Issue Date To
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:text-red-900"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table */}
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">
              Loading trade finance documents...
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <FileWarning size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">
              No trade finance documents found
            </p>
            <button
              onClick={handleCreate}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Create your first trade finance document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issuing Bank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficiary
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}
              >
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">
                        {record.reference_number}
                      </div>
                      {record.amendment_number > 0 && (
                        <div className="text-xs text-yellow-600">
                          Amendment #{record.amendment_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <DocumentTypeBadge
                        type={record.document_type}
                        isDarkMode={isDarkMode}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm">
                        {getLinkedOrderNumber(record.import_order_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm">
                        {record.issuing_bank || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm">
                        {record.beneficiary || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="font-medium">
                        {formatCurrency(record.amount, record.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm">
                        {formatDate(record.issue_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">
                        {formatDate(record.expiry_date)}
                        <div className="mt-0.5">
                          <ExpiryIndicator expiryDate={record.expiry_date} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(record)}
                          title="View"
                          className="text-gray-500 hover:text-teal-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          title="Edit"
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleAmend(record)}
                          title="Amend"
                          className="text-gray-500 hover:text-yellow-600 transition-colors"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          title="Delete"
                          className="text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div
            className={`px-6 py-3 flex items-center justify-between border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="text-sm text-gray-500">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}{' '}
              to{' '}
              {Math.min(
                pagination.current_page * pagination.per_page,
                pagination.total,
              )}{' '}
              of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => loadRecords(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode
                    ? 'border-gray-600 hover:bg-gray-700'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => loadRecords(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode
                    ? 'border-gray-600 hover:bg-gray-700'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <TradeFinanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
          setIsAmendment(false);
        }}
        onSave={handleSave}
        editingRecord={editingRecord}
        importOrders={importOrders}
        isDarkMode={isDarkMode}
        isAmendment={isAmendment}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default TradeFinanceList;
