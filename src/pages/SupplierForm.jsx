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
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  DollarSign,
  Settings,
  Upload,
  ExternalLink,
  Shield,
  Award,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supplierService } from '../services/supplierService';
import { notificationService } from '../services/notificationService';
import TRNInput from '../components/TRNInput';
import { FormSelect } from '../components/ui/form-select';
import { SelectItem } from '../components/ui/select';
import { apiClient } from '../services/api';

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
 * Payment Terms options
 */
const PAYMENT_TERMS_OPTIONS = [
  { value: '', label: 'Select Payment Terms' },
  { value: 'NET_30', label: 'Net 30' },
  { value: 'NET_60', label: 'Net 60' },
  { value: 'NET_90', label: 'Net 90' },
  { value: 'COD', label: 'COD (Cash on Delivery)' },
  { value: 'ADVANCE', label: 'Advance Payment' },
  { value: 'LC', label: 'Letter of Credit (LC)' },
];

/**
 * Currency options
 */
const CURRENCY_OPTIONS = [
  { value: '', label: 'Select Currency' },
  { value: 'AED', label: 'AED (UAE Dirham)' },
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'CNY', label: 'CNY (Chinese Yuan)' },
];

/**
 * Supplier Type options
 */
const SUPPLIER_TYPE_OPTIONS = [
  { value: '', label: 'Select Type' },
  { value: 'MILL', label: 'Mill / Manufacturer' },
  { value: 'TRADER', label: 'Trader / Distributor' },
  { value: 'STOCKIST', label: 'Stockist' },
  { value: 'AGENT', label: 'Agent / Broker' },
];

/**
 * Supplier Category options
 */
const SUPPLIER_CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'STAINLESS_STEEL', label: 'Stainless Steel' },
  { value: 'CARBON_STEEL', label: 'Carbon Steel' },
  { value: 'ALUMINUM', label: 'Aluminum' },
  { value: 'COPPER', label: 'Copper / Brass' },
  { value: 'SPECIALTY_ALLOYS', label: 'Specialty Alloys' },
  { value: 'GENERAL', label: 'General / Multi-Material' },
];

/**
 * Material Grade options for stainless steel
 */
const MATERIAL_GRADE_OPTIONS = [
  { value: '304', label: '304 (18/8)' },
  { value: '316L', label: '316L (Marine Grade)' },
  { value: '310S', label: '310S (Heat Resistant)' },
  { value: '410', label: '410 (Martensitic)' },
  { value: '430', label: '430 (Ferritic)' },
  { value: 'DUPLEX', label: 'Duplex (2205/2507)' },
  { value: '904L', label: '904L (Super Austenitic)' },
];

/**
 * Product Form Capabilities
 */
const PRODUCT_FORM_OPTIONS = [
  { value: 'SHEETS', label: 'Sheets' },
  { value: 'COILS', label: 'Coils' },
  { value: 'PLATES', label: 'Plates' },
  { value: 'PIPES', label: 'Pipes' },
  { value: 'TUBES', label: 'Tubes' },
  { value: 'BARS', label: 'Bars / Rods' },
  { value: 'ANGLES', label: 'Angles' },
  { value: 'CHANNELS', label: 'Channels' },
];

/**
 * SupplierForm Component - STEEL-FORMS-PHASE1 Enhanced
 *
 * Complete supplier management with 30+ fields across 6 sections:
 * - Basic Information
 * - Contact Person
 * - Tax & Compliance
 * - Supplier Classification
 * - Stainless Steel Specifications
 * - Financial Terms
 */
export function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Accordion state for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    basic: true, // Always expanded
    contact: false,
    taxCompliance: true, // Expanded by default
    classification: true, // Expanded by default
    steelSpecs: false,
    financial: false,
    additional: true,
  });

  // File upload state
  const [fileUploads, setFileUploads] = useState({
    tradeLicenseFile: null,
    vatCertificateFile: null,
    isoCertificatesFile: null,
  });

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    company: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    address: '',
    city: '',
    country: 'UAE',

    // Contact Person
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',

    // Tax & Compliance
    taxId: '',
    trnNumber: '',
    vatNumber: '',
    tradeLicenseNumber: '',
    tradeLicenseExpiry: '',
    isDesignatedZone: false,
    tradeLicenseFilePath: '',
    vatCertificateFilePath: '',

    // Supplier Classification
    supplierLocation: 'UAE_LOCAL',
    isMill: false,
    primaryCountry: 'UAE',
    typicalLeadTimeDays: 7,
    supplierType: '',
    category: '',

    // Stainless Steel Specifications
    mtcRequirement: false,
    materialGradeSpecialization: [], // Array of grade codes
    productFormCapabilities: [], // Array of form types
    minimumOrderQuantity: '',
    qualityCertifications: {
      iso9001: false,
      iso14001: false,
      other: '',
    },
    isoCertificatesFilePath: '',

    // Financial Terms
    paymentTerms: '',
    defaultCurrency: 'AED',
    creditLimit: '',
    countryId: '',
    businessLicense: '',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      swiftCode: '',
      iban: '',
    },

    // Additional Information
    notes: '',
    isActive: true,
    uploadedDocuments: [], // Array of document paths
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
        // Parse JSON fields if they're strings
        const parseBankDetails = (data) => {
          if (typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch {
              return { accountNumber: '', bankName: '', swiftCode: '', iban: '' };
            }
          }
          return data || { accountNumber: '', bankName: '', swiftCode: '', iban: '' };
        };

        const parseQualityCertifications = (data) => {
          if (typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch {
              return { iso9001: false, iso14001: false, other: '' };
            }
          }
          return data || { iso9001: false, iso14001: false, other: '' };
        };

        const parseArray = (data) => {
          if (typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch {
              return [];
            }
          }
          return Array.isArray(data) ? data : [];
        };

        setFormData({
          // Basic Information
          name: supplier.name || '',
          company: supplier.company || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          alternatePhone: supplier.alternatePhone || supplier.alternate_phone || '',
          website: supplier.website || '',
          address: supplier.address || '',
          city: supplier.city || '',
          country: supplier.country || 'UAE',

          // Contact Person
          contactPerson: supplier.contactPerson || supplier.contact_person || '',
          contactEmail: supplier.contactEmail || supplier.contact_email || '',
          contactPhone: supplier.contactPhone || supplier.contact_phone || '',

          // Tax & Compliance
          taxId: supplier.taxId || supplier.tax_id || '',
          trnNumber: supplier.trnNumber || supplier.trn_number || '',
          vatNumber: supplier.vatNumber || supplier.vat_number || '',
          tradeLicenseNumber: supplier.tradeLicenseNumber || supplier.trade_license_number || '',
          tradeLicenseExpiry: supplier.tradeLicenseExpiry || supplier.trade_license_expiry || '',
          isDesignatedZone: supplier.isDesignatedZone ?? supplier.is_designated_zone ?? false,
          tradeLicenseFilePath: supplier.tradeLicenseFilePath || supplier.trade_license_file_path || '',
          vatCertificateFilePath: supplier.vatCertificateFilePath || supplier.vat_certificate_file_path || '',

          // Supplier Classification
          supplierLocation: supplier.supplierLocation || supplier.supplier_location || 'UAE_LOCAL',
          isMill: supplier.isMill ?? supplier.is_mill ?? false,
          primaryCountry: supplier.primaryCountry || supplier.primary_country || 'UAE',
          typicalLeadTimeDays: supplier.typicalLeadTimeDays ?? supplier.typical_lead_time_days ?? 7,
          supplierType: supplier.supplierType || supplier.supplier_type || '',
          category: supplier.category || '',

          // Stainless Steel Specifications
          mtcRequirement: supplier.mtcRequirement ?? supplier.mtc_requirement ?? false,
          materialGradeSpecialization: parseArray(
            supplier.materialGradeSpecialization || supplier.material_grade_specialization,
          ),
          productFormCapabilities: parseArray(
            supplier.productFormCapabilities || supplier.product_form_capabilities,
          ),
          minimumOrderQuantity: supplier.minimumOrderQuantity || supplier.minimum_order_quantity || '',
          qualityCertifications: parseQualityCertifications(
            supplier.qualityCertifications || supplier.quality_certifications,
          ),
          isoCertificatesFilePath: supplier.isoCertificatesFilePath || supplier.iso_certificates_file_path || '',

          // Financial Terms
          paymentTerms: supplier.paymentTerms || supplier.payment_terms || '',
          defaultCurrency: supplier.defaultCurrency || supplier.default_currency || 'AED',
          creditLimit: supplier.creditLimit || supplier.credit_limit || '',
          countryId: supplier.countryId || supplier.country_id || '',
          businessLicense: supplier.businessLicense || supplier.business_license || '',
          bankDetails: parseBankDetails(supplier.bankDetails || supplier.bank_details),

          // Additional Information
          notes: supplier.notes || '',
          isActive: supplier.isActive ?? supplier.is_active ?? true,
          uploadedDocuments: parseArray(supplier.uploadedDocuments || supplier.uploaded_documents),
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

  // Handle nested object changes (bankDetails, qualityCertifications)
  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  // Handle multi-select array changes
  const handleArrayChange = (field, value) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [field]: currentArray.filter((v) => v !== value),
        };
      } else {
        return {
          ...prev,
          [field]: [...currentArray, value],
        };
      }
    });
  };

  // Handle file uploads
  const handleFileChange = (fileKey, file) => {
    setFileUploads((prev) => ({
      ...prev,
      [fileKey]: file,
    }));
  };

  // Toggle accordion sections
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Basic Information validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid contact email format';
    }

    // Tax & Compliance validation
    if (formData.vatNumber && !/^[A-Z0-9]{15}$/.test(formData.vatNumber)) {
      newErrors.vatNumber = 'VAT number must be 15 alphanumeric characters';
    }

    if (formData.trnNumber && !/^\d{15}$/.test(formData.trnNumber)) {
      newErrors.trnNumber = 'TRN must be 15 digits';
    }

    if (formData.tradeLicenseExpiry) {
      const expiryDate = new Date(formData.tradeLicenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        newErrors.tradeLicenseExpiry = 'Trade license has expired';
      }
    }

    // Classification validation
    if (formData.supplierLocation === 'OVERSEAS' && !formData.primaryCountry) {
      newErrors.primaryCountry = 'Primary country is required for overseas suppliers';
    }

    if (formData.typicalLeadTimeDays < 0) {
      newErrors.typicalLeadTimeDays = 'Lead time cannot be negative';
    }

    // Financial validation
    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative';
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

      // Upload files first (if any)
      const uploadedFilePaths = {};

      for (const [key, file] of Object.entries(fileUploads)) {
        if (file) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const uploadResult = await apiClient.post('/suppliers/upload-temp', formDataUpload, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (uploadResult.filePath || uploadResult.file_path) {
              uploadedFilePaths[key] = uploadResult.filePath || uploadResult.file_path;
            }
          } catch (uploadErr) {
            console.error(`Failed to upload ${key}:`, uploadErr);
            notificationService.error(`Failed to upload ${key}`);
          }
        }
      }

      // Prepare payload with serialized JSON fields
      const payload = {
        ...formData,
        typicalLeadTimeDays: parseInt(formData.typicalLeadTimeDays, 10) || 0,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,

        // Serialize nested objects
        bankDetails: JSON.stringify(formData.bankDetails),
        qualityCertifications: JSON.stringify(formData.qualityCertifications),
        materialGradeSpecialization: JSON.stringify(formData.materialGradeSpecialization || []),
        productFormCapabilities: JSON.stringify(formData.productFormCapabilities || []),
        uploadedDocuments: JSON.stringify(formData.uploadedDocuments || []),

        // Add uploaded file paths
        tradeLicenseFilePath: uploadedFilePaths.tradeLicenseFile || formData.tradeLicenseFilePath,
        vatCertificateFilePath: uploadedFilePaths.vatCertificateFile || formData.vatCertificateFilePath,
        isoCertificatesFilePath: uploadedFilePaths.isoCertificatesFile || formData.isoCertificatesFilePath,
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
          {/* SECTION 1: Basic Information - Always Expanded */}
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
              <Building2 size={20} />
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
                <label className={labelClasses}>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className={inputClasses}
                  placeholder="Company / Trading name"
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

              <div>
                <label className={labelClasses}>Alternate Phone</label>
                <input
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                  className={inputClasses}
                  placeholder="Secondary contact number"
                />
              </div>

              <div>
                <label className={labelClasses}>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className={inputClasses}
                  placeholder="https://example.com"
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

              <div>
                <label className={labelClasses}>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className={inputClasses}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Contact Person - Collapsible */}
          <div
            className={`rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className={`w-full p-6 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              } transition-colors rounded-xl`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <User size={20} />
                Contact Person
              </h2>
              {expandedSections.contact ? (
                <ChevronUp size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              ) : (
                <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </button>
            {expandedSections.contact && (
              <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    className={inputClasses}
                    placeholder="Primary contact name"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    className={`${inputClasses} ${errors.contactEmail ? 'border-red-500' : ''}`}
                    placeholder="contact@example.com"
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    className={inputClasses}
                    placeholder="+971 XX XXX XXXX"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Tax & Compliance - Expanded by Default */}
          <div
            className={`rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('taxCompliance')}
              className={`w-full p-6 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              } transition-colors rounded-xl`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <Shield size={20} />
                Tax & Compliance
              </h2>
              {expandedSections.taxCompliance ? (
                <ChevronUp size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              ) : (
                <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </button>
            {expandedSections.taxCompliance && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>VAT Number</label>
                    <input
                      type="text"
                      value={formData.vatNumber}
                      onChange={(e) => handleChange('vatNumber', e.target.value.toUpperCase())}
                      className={`${inputClasses} ${errors.vatNumber ? 'border-red-500' : ''}`}
                      placeholder="15 alphanumeric characters"
                      maxLength={15}
                    />
                    {errors.vatNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.vatNumber}</p>
                    )}
                  </div>

                  <TRNInput
                    value={formData.trnNumber}
                    onChange={(value) => handleChange('trnNumber', value)}
                    label="TRN Number"
                    required={false}
                  />

                  <div>
                    <label className={labelClasses}>Tax ID (Legacy)</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      className={inputClasses}
                      placeholder="Tax identification number"
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Trade License Number</label>
                    <input
                      type="text"
                      value={formData.tradeLicenseNumber}
                      onChange={(e) => handleChange('tradeLicenseNumber', e.target.value)}
                      className={inputClasses}
                      placeholder="Trade license no."
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Trade License Expiry</label>
                    <input
                      type="date"
                      value={formData.tradeLicenseExpiry}
                      onChange={(e) => handleChange('tradeLicenseExpiry', e.target.value)}
                      className={`${inputClasses} ${errors.tradeLicenseExpiry ? 'border-red-500' : ''}`}
                    />
                    {errors.tradeLicenseExpiry && (
                      <p className="text-red-500 text-sm mt-1">{errors.tradeLicenseExpiry}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClasses}>
                      <Upload size={14} className="inline mr-1" />
                      Trade License File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('tradeLicenseFile', e.target.files[0])}
                      className={inputClasses}
                    />
                    {formData.tradeLicenseFilePath && (
                      <a
                        href={formData.tradeLicenseFilePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm flex items-center gap-1 mt-1 hover:underline"
                      >
                        <ExternalLink size={12} />
                        View Current File
                      </a>
                    )}
                  </div>

                  <div>
                    <label className={labelClasses}>
                      <Upload size={14} className="inline mr-1" />
                      VAT Certificate File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('vatCertificateFile', e.target.files[0])}
                      className={inputClasses}
                    />
                    {formData.vatCertificateFilePath && (
                      <a
                        href={formData.vatCertificateFilePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm flex items-center gap-1 mt-1 hover:underline"
                      >
                        <ExternalLink size={12} />
                        View Current File
                      </a>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDesignatedZone}
                        onChange={(e) => handleChange('isDesignatedZone', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        Designated Zone Supplier (Tax-Free)
                      </span>
                    </label>
                    <p className={`text-xs mt-1 ml-7 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Check if supplier operates in a UAE designated/free zone
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Supplier Classification - Expanded by Default */}
          <div
            className={`rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('classification')}
              className={`w-full p-6 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              } transition-colors rounded-xl`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <Globe size={20} />
                Supplier Classification
              </h2>
              {expandedSections.classification ? (
                <ChevronUp size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              ) : (
                <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </button>
            {expandedSections.classification && (
              <div className="px-6 pb-6 space-y-4">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  These fields help categorize suppliers for procurement channel tracking and margin calculations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier Type */}
                  <div>
                    <FormSelect
                      label="Supplier Type"
                      value={formData.supplierType}
                      onValueChange={(value) => handleChange('supplierType', value)}
                      required={false}
                      showValidation={false}
                    >
                      {SUPPLIER_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  </div>

                  {/* Category */}
                  <div>
                    <FormSelect
                      label="Category"
                      value={formData.category}
                      onValueChange={(value) => handleChange('category', value)}
                      required={false}
                      showValidation={false}
                    >
                      {SUPPLIER_CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  </div>

                  {/* Supplier Location */}
                  <div>
                    <FormSelect
                      label={
                        <>
                          <Building2 size={14} className="inline mr-1" />
                          Supplier Location
                        </>
                      }
                      value={formData.supplierLocation}
                      onValueChange={(value) => handleChange('supplierLocation', value)}
                      required={true}
                      showValidation={false}
                    >
                      {SUPPLIER_LOCATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.supplierLocation === 'UAE_LOCAL'
                        ? 'Local suppliers: faster delivery, lower margins (~8%)'
                        : 'Overseas suppliers: longer lead times, higher margins (~18%)'}
                    </p>
                  </div>

                  {/* Is Mill Checkbox */}
                  <div>
                    <label className={labelClasses}>
                      <Factory size={14} className="inline mr-1" />
                      Manufacturer Status
                    </label>
                    <div
                      className={`flex items-center gap-4 h-[52px] px-4 rounded-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isMill}
                          onChange={(e) => handleChange('isMill', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          This is a Mill / Manufacturer
                        </span>
                      </label>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Mills produce steel directly; traders/distributors resell
                    </p>
                  </div>

                  {/* Primary Country */}
                  <div>
                    <FormSelect
                      label={
                        <>
                          <Globe size={14} className="inline mr-1" />
                          Primary Country
                        </>
                      }
                      value={formData.primaryCountry}
                      onValueChange={(value) => handleChange('primaryCountry', value)}
                      required={formData.supplierLocation === 'OVERSEAS'}
                      disabled={formData.supplierLocation === 'UAE_LOCAL'}
                      validationState={errors.primaryCountry ? 'invalid' : null}
                      showValidation={true}
                    >
                      {COUNTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                    {errors.primaryCountry && (
                      <p className="text-red-500 text-sm mt-1">{errors.primaryCountry}</p>
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
                      onChange={(e) => handleChange('typicalLeadTimeDays', e.target.value)}
                      min="0"
                      max="365"
                      className={`${inputClasses} ${errors.typicalLeadTimeDays ? 'border-red-500' : ''}`}
                      placeholder="Expected delivery days"
                    />
                    {errors.typicalLeadTimeDays && (
                      <p className="text-red-500 text-sm mt-1">{errors.typicalLeadTimeDays}</p>
                    )}
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Average days from order to delivery
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Stainless Steel Specifications - Collapsible */}
          <div
            className={`rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('steelSpecs')}
              className={`w-full p-6 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              } transition-colors rounded-xl`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <Settings size={20} />
                Stainless Steel Specifications
              </h2>
              {expandedSections.steelSpecs ? (
                <ChevronUp size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              ) : (
                <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </button>
            {expandedSections.steelSpecs && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* MTC Requirement */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mtcRequirement}
                        onChange={(e) => handleChange('mtcRequirement', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        MTC (Mill Test Certificate) Required
                      </span>
                    </label>
                    <p className={`text-xs mt-1 ml-7 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Supplier must provide mill test certificates with shipments
                    </p>
                  </div>

                  {/* Material Grade Specialization - Multi-select */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Material Grade Specialization</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 border rounded-lg">
                      {MATERIAL_GRADE_OPTIONS.map((grade) => (
                        <label key={grade.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.materialGradeSpecialization.includes(grade.value)}
                            onChange={() => handleArrayChange('materialGradeSpecialization', grade.value)}
                            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {grade.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Product Form Capabilities - Multi-select */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Product Form Capabilities</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 border rounded-lg">
                      {PRODUCT_FORM_OPTIONS.map((form) => (
                        <label key={form.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.productFormCapabilities.includes(form.value)}
                            onChange={() => handleArrayChange('productFormCapabilities', form.value)}
                            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {form.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Minimum Order Quantity */}
                  <div>
                    <label className={labelClasses}>Minimum Order Quantity</label>
                    <input
                      type="text"
                      value={formData.minimumOrderQuantity}
                      onChange={(e) => handleChange('minimumOrderQuantity', e.target.value)}
                      className={inputClasses}
                      placeholder="e.g., 1 ton, 500 kg, 100 pcs"
                    />
                  </div>

                  {/* Quality Certifications */}
                  <div>
                    <label className={labelClasses}>
                      <Award size={14} className="inline mr-1" />
                      Quality Certifications
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.qualityCertifications.iso9001}
                          onChange={(e) =>
                            handleNestedChange('qualityCertifications', 'iso9001', e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          ISO 9001 (Quality Management)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.qualityCertifications.iso14001}
                          onChange={(e) =>
                            handleNestedChange('qualityCertifications', 'iso14001', e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          ISO 14001 (Environmental)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* ISO Certificates Upload */}
                  <div>
                    <label className={labelClasses}>
                      <Upload size={14} className="inline mr-1" />
                      ISO Certificates File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('isoCertificatesFile', e.target.files[0])}
                      className={inputClasses}
                    />
                    {formData.isoCertificatesFilePath && (
                      <a
                        href={formData.isoCertificatesFilePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm flex items-center gap-1 mt-1 hover:underline"
                      >
                        <ExternalLink size={12} />
                        View Current File
                      </a>
                    )}
                  </div>

                  {/* Other Certifications */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Other Certifications</label>
                    <input
                      type="text"
                      value={formData.qualityCertifications.other}
                      onChange={(e) =>
                        handleNestedChange('qualityCertifications', 'other', e.target.value)
                      }
                      className={inputClasses}
                      placeholder="e.g., ASME, PED, CE, etc."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: Financial Terms - Collapsible */}
          <div
            className={`rounded-xl border ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('financial')}
              className={`w-full p-6 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              } transition-colors rounded-xl`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <DollarSign size={20} />
                Financial Terms
              </h2>
              {expandedSections.financial ? (
                <ChevronUp size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              ) : (
                <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </button>
            {expandedSections.financial && (
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Terms */}
                  <div>
                    <FormSelect
                      label="Payment Terms"
                      value={formData.paymentTerms}
                      onValueChange={(value) => handleChange('paymentTerms', value)}
                      required={false}
                      showValidation={false}
                    >
                      {PAYMENT_TERMS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  </div>

                  {/* Default Currency */}
                  <div>
                    <FormSelect
                      label="Default Currency"
                      value={formData.defaultCurrency}
                      onValueChange={(value) => handleChange('defaultCurrency', value)}
                      required={false}
                      showValidation={false}
                    >
                      {CURRENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  </div>

                  {/* Credit Limit */}
                  <div>
                    <label className={labelClasses}>Credit Limit</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => handleChange('creditLimit', e.target.value)}
                      className={`${inputClasses} ${errors.creditLimit ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {errors.creditLimit && (
                      <p className="text-red-500 text-sm mt-1">{errors.creditLimit}</p>
                    )}
                  </div>

                  {/* Business License */}
                  <div>
                    <label className={labelClasses}>Business License</label>
                    <input
                      type="text"
                      value={formData.businessLicense}
                      onChange={(e) => handleChange('businessLicense', e.target.value)}
                      className={inputClasses}
                      placeholder="Business license number"
                    />
                  </div>

                  {/* Bank Details Section */}
                  <div className="md:col-span-2">
                    <h3 className={`text-md font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Bank Account Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Account Number</label>
                        <input
                          type="text"
                          value={formData.bankDetails.accountNumber}
                          onChange={(e) =>
                            handleNestedChange('bankDetails', 'accountNumber', e.target.value)
                          }
                          className={inputClasses}
                          placeholder="Account number"
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankDetails.bankName}
                          onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)}
                          className={inputClasses}
                          placeholder="Bank name"
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>SWIFT Code</label>
                        <input
                          type="text"
                          value={formData.bankDetails.swiftCode}
                          onChange={(e) =>
                            handleNestedChange('bankDetails', 'swiftCode', e.target.value.toUpperCase())
                          }
                          className={inputClasses}
                          placeholder="SWIFT/BIC code"
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>IBAN</label>
                        <input
                          type="text"
                          value={formData.bankDetails.iban}
                          onChange={(e) =>
                            handleNestedChange('bankDetails', 'iban', e.target.value.toUpperCase())
                          }
                          className={inputClasses}
                          placeholder="IBAN"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: Additional Information */}
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
              <FileText size={20} />
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
