import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  Globe,
  Factory,
  Clock,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supplierService } from '../services/supplierService';
import { notificationService } from '../services/notificationService';
import TRNInput from '../components/TRNInput';

/**
 * Country codes for primary country selection
 * Common steel-exporting countries
 */
const COUNTRY_OPTIONS = [
  { value: '', label: 'Select Country' },
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'CHN', label: 'China' },
  { value: 'KOR', label: 'South Korea' },
  { value: 'IND', label: 'India' },
  { value: 'TWN', label: 'Taiwan' },
  { value: 'JPN', label: 'Japan' },
  { value: 'VNM', label: 'Vietnam' },
  { value: 'IDN', label: 'Indonesia' },
  { value: 'MYS', label: 'Malaysia' },
  { value: 'THA', label: 'Thailand' },
  { value: 'TUR', label: 'Turkey' },
  { value: 'SAU', label: 'Saudi Arabia' },
  { value: 'OMN', label: 'Oman' },
  { value: 'BHR', label: 'Bahrain' },
  { value: 'KWT', label: 'Kuwait' },
  { value: 'QAT', label: 'Qatar' },
  { value: 'EUR', label: 'Europe (Other)' },
  { value: 'USA', label: 'United States' },
  { value: 'OTH', label: 'Other' },
];

/**
 * Supplier Location options
 */
const SUPPLIER_LOCATION_OPTIONS = [
  { value: 'UAE_LOCAL', label: 'UAE Local' },
  { value: 'OVERSEAS', label: 'Overseas' },
];

/**
 * SupplierForm Component - Phase 4 Procurement
 *
 * Create and edit suppliers with classification fields:
 * - supplierLocation: UAE_LOCAL or OVERSEAS
 * - isMill: Is this supplier a manufacturer/mill?
 * - primaryCountry: Country code for overseas suppliers
 * - typicalLeadTimeDays: Expected delivery lead time
 */
export function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'UAE',
    taxId: '',
    contactPerson: '',
    // New classification fields (v2 Procurement)
    supplierLocation: 'UAE_LOCAL',
    isMill: false,
    primaryCountry: 'UAE',
    typicalLeadTimeDays: 7,
    // Additional fields
    notes: '',
    isActive: true,
  });

  // Load supplier data for edit mode
  useEffect(() => {
    if (isEditMode) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const supplier = await supplierService.getSupplier(id);
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || '',
          country: supplier.country || 'UAE',
          taxId: supplier.taxId || supplier.tax_id || '',
          contactPerson:
            supplier.contactPerson || supplier.contact_person || '',
          supplierLocation:
            supplier.supplierLocation ||
            supplier.supplier_location ||
            'UAE_LOCAL',
          isMill: supplier.isMill ?? supplier.is_mill ?? false,
          primaryCountry:
            supplier.primaryCountry || supplier.primary_country || 'UAE',
          typicalLeadTimeDays:
            supplier.typicalLeadTimeDays ??
            supplier.typical_lead_time_days ??
            7,
          notes: supplier.notes || '',
          isActive: supplier.isActive ?? supplier.is_active ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load supplier:', err);
      notificationService.error('Failed to load supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    // Auto-update primaryCountry when supplierLocation changes
    if (field === 'supplierLocation') {
      if (value === 'UAE_LOCAL') {
        setFormData((prev) => ({
          ...prev,
          supplierLocation: value,
          primaryCountry: 'UAE',
          typicalLeadTimeDays: 7, // Local suppliers typically faster
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          supplierLocation: value,
          typicalLeadTimeDays: 45, // Overseas typically longer
        }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.supplierLocation === 'OVERSEAS' && !formData.primaryCountry) {
      newErrors.primaryCountry =
        'Primary country is required for overseas suppliers';
    }

    if (formData.typicalLeadTimeDays < 0) {
      newErrors.typicalLeadTimeDays = 'Lead time cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      notificationService.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        typicalLeadTimeDays: parseInt(formData.typicalLeadTimeDays, 10) || 0,
      };

      if (isEditMode) {
        await supplierService.updateSupplier(id, payload);
        notificationService.success('Supplier updated successfully');
      } else {
        await supplierService.createSupplier(payload);
        notificationService.success('Supplier created successfully');
      }

      navigate('/suppliers');
    } catch (err) {
      console.error('Failed to save supplier:', err);
      notificationService.error(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
    isDarkMode
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  const labelClasses = `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2
          className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-[#161A1D]' : 'bg-gray-50'}`}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/suppliers')}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft size={24} />
            </button>
            <h1
              className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {isEditMode ? 'Edit Supplier' : 'New Supplier'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Supplier Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`${inputClasses} ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter supplier name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    handleChange('contactPerson', e.target.value)
                  }
                  className={inputClasses}
                  placeholder="Primary contact name"
                />
              </div>

              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`${inputClasses} ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="supplier@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={inputClasses}
                  placeholder="+971 XX XXX XXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={inputClasses}
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className={labelClasses}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={inputClasses}
                  placeholder="City"
                />
              </div>

              {/* Tax ID / TRN - UAE VAT Compliance */}
              <TRNInput
                value={formData.taxId}
                onChange={(value) => handleChange('taxId', value)}
                label="Tax ID / TRN"
                required={false}
              />
            </div>
          </div>

          {/* Procurement Classification - NEW */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <Globe size={20} />
              Procurement Classification
            </h2>
            <p
              className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              These fields help categorize suppliers for procurement channel
              tracking and margin calculations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier Location */}
              <div>
                <label className={labelClasses}>
                  <Building2 size={14} className="inline mr-1" />
                  Supplier Location *
                </label>
                <div className="relative">
                  <select
                    value={formData.supplierLocation}
                    onChange={(e) =>
                      handleChange('supplierLocation', e.target.value)
                    }
                    className={`${inputClasses} appearance-none`}
                  >
                    {SUPPLIER_LOCATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {formData.supplierLocation === 'UAE_LOCAL'
                    ? 'Local suppliers: faster delivery, lower margins (~8%)'
                    : 'Overseas suppliers: longer lead times, higher margins (~18%)'}
                </p>
              </div>

              {/* Is Mill */}
              <div>
                <label className={labelClasses}>
                  <Factory size={14} className="inline mr-1" />
                  Supplier Type
                </label>
                <div
                  className={`flex items-center gap-4 h-[52px] px-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isMill}
                      onChange={(e) => handleChange('isMill', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      This is a Mill / Manufacturer
                    </span>
                  </label>
                </div>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Mills produce steel directly; traders/distributors resell
                </p>
              </div>

              {/* Primary Country */}
              <div>
                <label className={labelClasses}>
                  <Globe size={14} className="inline mr-1" />
                  Primary Country{' '}
                  {formData.supplierLocation === 'OVERSEAS' && '*'}
                </label>
                <div className="relative">
                  <select
                    value={formData.primaryCountry}
                    onChange={(e) =>
                      handleChange('primaryCountry', e.target.value)
                    }
                    className={`${inputClasses} appearance-none ${errors.primaryCountry ? 'border-red-500' : ''}`}
                    disabled={formData.supplierLocation === 'UAE_LOCAL'}
                  >
                    {COUNTRY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.primaryCountry && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.primaryCountry}
                  </p>
                )}
              </div>

              {/* Typical Lead Time */}
              <div>
                <label className={labelClasses}>
                  <Clock size={14} className="inline mr-1" />
                  Typical Lead Time (Days)
                </label>
                <input
                  type="number"
                  value={formData.typicalLeadTimeDays}
                  onChange={(e) =>
                    handleChange('typicalLeadTimeDays', e.target.value)
                  }
                  min="0"
                  max="365"
                  className={`${inputClasses} ${errors.typicalLeadTimeDays ? 'border-red-500' : ''}`}
                  placeholder="Expected delivery days"
                />
                {errors.typicalLeadTimeDays && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.typicalLeadTimeDays}
                  </p>
                )}
                <p
                  className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Average days from order to delivery
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div
            className={`p-6 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Additional Information
            </h2>
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className={inputClasses}
                placeholder="Additional notes about this supplier..."
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Supplier is active
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/suppliers')}
              className={`px-6 py-3 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isEditMode ? 'Update Supplier' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierForm;
