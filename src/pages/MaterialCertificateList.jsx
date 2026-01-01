import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Upload,
  Award,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Beaker,
  Activity,
  FileCheck,
} from 'lucide-react';
import { materialCertificateService } from '../services/materialCertificateService';
import { importOrderService } from '../services/importOrderService';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

// Certificate Type Configuration
const CERTIFICATE_TYPES = [
  {
    value: 'mill_test_certificate',
    label: 'Mill Test Certificate (MTC)',
    icon: FileText,
    color: 'blue',
  },
  {
    value: 'certificate_of_origin',
    label: 'Certificate of Origin (COO)',
    icon: Award,
    color: 'green',
  },
  {
    value: 'certificate_of_analysis',
    label: 'Certificate of Analysis (COA)',
    icon: Beaker,
    color: 'purple',
  },
  {
    value: 'inspection_report',
    label: 'Inspection Report',
    icon: FileCheck,
    color: 'orange',
  },
  {
    value: 'quality_certificate',
    label: 'Quality Certificate',
    icon: Shield,
    color: 'teal',
  },
];

// Verification Status Configuration
const VERIFICATION_STATUS = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    bgLight: 'bg-yellow-100',
    bgDark: 'bg-yellow-900/30',
    textLight: 'text-yellow-700',
    textDark: 'text-yellow-300',
    icon: Clock,
  },
  verified: {
    label: 'Verified',
    color: 'green',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-900/30',
    textLight: 'text-green-700',
    textDark: 'text-green-300',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-900/30',
    textLight: 'text-red-700',
    textDark: 'text-red-300',
    icon: XCircle,
  },
};

// Common Steel Grades
const STEEL_GRADES = [
  { value: 'SS304', label: 'SS304 (1.4301)' },
  { value: 'SS304L', label: 'SS304L (1.4307)' },
  { value: 'SS316', label: 'SS316 (1.4401)' },
  { value: 'SS316L', label: 'SS316L (1.4404)' },
  { value: 'SS321', label: 'SS321 (1.4541)' },
  { value: 'SS310S', label: 'SS310S (1.4845)' },
  { value: 'SS409', label: 'SS409 (1.4512)' },
  { value: 'SS430', label: 'SS430 (1.4016)' },
  { value: 'SS201', label: 'SS201' },
  { value: 'SS202', label: 'SS202' },
  { value: 'EN8', label: 'EN8' },
  { value: 'EN9', label: 'EN9' },
  { value: 'EN24', label: 'EN24' },
  { value: 'ASTM_A36', label: 'ASTM A36' },
  { value: 'ASTM_A572', label: 'ASTM A572' },
  { value: 'S235JR', label: 'S235JR' },
  { value: 'S275JR', label: 'S275JR' },
  { value: 'S355JR', label: 'S355JR' },
  { value: 'OTHER', label: 'Other' },
];

// Empty form state
const EMPTY_FORM = {
  certificate_type: 'mill_test_certificate',
  certificate_number: '',
  import_order_id: '',
  import_order_item_id: '',
  mill_name: '',
  heat_number: '',
  coil_id: '',
  grade: '',
  grade_other: '',
  country_of_origin: '',
  issuing_authority: '',
  issue_date: '',
  expiry_date: '',
  // Chemical Composition (for MTC)
  chemical_c: '',
  chemical_si: '',
  chemical_mn: '',
  chemical_p: '',
  chemical_s: '',
  chemical_cr: '',
  chemical_ni: '',
  chemical_mo: '',
  chemical_cu: '',
  chemical_n: '',
  // Mechanical Properties (for MTC)
  yield_strength: '',
  tensile_strength: '',
  elongation: '',
  hardness: '',
  // Verification
  verification_status: 'pending',
  verified_by: '',
  verified_date: '',
  rejection_reason: '',
  notes: '',
};

const MaterialCertificateList = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // List State
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 25,
    total: 0,
    total_pages: 0,
  });

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    certificate_type: '',
    verification_status: '',
    grade: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState('verify'); // 'verify' or 'reject'
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  // Import Orders for linking
  const [importOrders, setImportOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  // Load certificates
  const loadCertificates = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit: pagination.per_page,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== ''),
          ),
        };

        const response =
          await materialCertificateService.getMaterialCertificates(params);
        setCertificates(response.certificates || response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error('Error loading certificates:', err);
        setError(err.message || 'Failed to load material certificates');
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.per_page],
  );

  // Load import orders for linking
  const loadImportOrders = async () => {
    try {
      const response = await importOrderService.getImportOrders({ limit: 100 });
      setImportOrders(response.orders || []);
    } catch (err) {
      console.error('Error loading import orders:', err);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  useEffect(() => {
    loadImportOrders();
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    loadCertificates(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      certificate_type: '',
      verification_status: '',
      grade: '',
      start_date: '',
      end_date: '',
    });
    setTimeout(() => loadCertificates(1), 0);
  };

  // Open modal for create
  const handleCreate = () => {
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
    setSelectedCertificate(null);
    setModalMode('create');
    setShowModal(true);
    setOrderItems([]);
  };

  // Open modal for edit
  const handleEdit = (cert) => {
    setFormData({
      certificate_type: cert.certificate_type || 'mill_test_certificate',
      certificate_number: cert.certificate_number || '',
      import_order_id: cert.import_order_id || '',
      import_order_item_id: cert.import_order_item_id || '',
      mill_name: cert.mill_name || '',
      heat_number: cert.heat_number || '',
      coil_id: cert.coil_id || '',
      grade: cert.grade || '',
      grade_other: cert.grade_other || '',
      country_of_origin: cert.country_of_origin || '',
      issuing_authority: cert.issuing_authority || '',
      issue_date: cert.issue_date ? cert.issue_date.split('T')[0] : '',
      expiry_date: cert.expiry_date ? cert.expiry_date.split('T')[0] : '',
      // Chemical Composition
      chemical_c: cert.chemical_c || '',
      chemical_si: cert.chemical_si || '',
      chemical_mn: cert.chemical_mn || '',
      chemical_p: cert.chemical_p || '',
      chemical_s: cert.chemical_s || '',
      chemical_cr: cert.chemical_cr || '',
      chemical_ni: cert.chemical_ni || '',
      chemical_mo: cert.chemical_mo || '',
      chemical_cu: cert.chemical_cu || '',
      chemical_n: cert.chemical_n || '',
      // Mechanical Properties
      yield_strength: cert.yield_strength || '',
      tensile_strength: cert.tensile_strength || '',
      elongation: cert.elongation || '',
      hardness: cert.hardness || '',
      // Verification
      verification_status: cert.verification_status || 'pending',
      verified_by: cert.verified_by || '',
      verified_date: cert.verified_date ? cert.verified_date.split('T')[0] : '',
      rejection_reason: cert.rejection_reason || '',
      notes: cert.notes || '',
    });
    setFormErrors({});
    setSelectedCertificate(cert);
    setModalMode('edit');
    setShowModal(true);
  };

  // Open modal for view
  const handleView = (cert) => {
    setSelectedCertificate(cert);
    setModalMode('view');
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCertificate(null);
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.certificate_number.trim()) {
      errors.certificate_number = 'Certificate number is required';
    }
    if (!formData.certificate_type) {
      errors.certificate_type = 'Certificate type is required';
    }
    if (!formData.mill_name.trim()) {
      errors.mill_name = 'Mill name is required';
    }
    if (!formData.issue_date) {
      errors.issue_date = 'Issue date is required';
    }
    if (
      formData.certificate_type === 'mill_test_certificate' &&
      !formData.heat_number.trim()
    ) {
      errors.heat_number = 'Heat number is required for MTC';
    }
    if (formData.grade === 'OTHER' && !formData.grade_other.trim()) {
      errors.grade_other = 'Please specify the grade';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle import order selection - load order items
  const handleOrderChange = async (orderId) => {
    handleInputChange('import_order_id', orderId);
    handleInputChange('import_order_item_id', '');

    if (orderId) {
      try {
        const order = await importOrderService.getImportOrder(orderId);
        setOrderItems(order.items || []);
      } catch (err) {
        console.error('Error loading order items:', err);
        setOrderItems([]);
      }
    } else {
      setOrderItems([]);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        chemical_c: formData.chemical_c
          ? parseFloat(formData.chemical_c)
          : null,
        chemical_si: formData.chemical_si
          ? parseFloat(formData.chemical_si)
          : null,
        chemical_mn: formData.chemical_mn
          ? parseFloat(formData.chemical_mn)
          : null,
        chemical_p: formData.chemical_p
          ? parseFloat(formData.chemical_p)
          : null,
        chemical_s: formData.chemical_s
          ? parseFloat(formData.chemical_s)
          : null,
        chemical_cr: formData.chemical_cr
          ? parseFloat(formData.chemical_cr)
          : null,
        chemical_ni: formData.chemical_ni
          ? parseFloat(formData.chemical_ni)
          : null,
        chemical_mo: formData.chemical_mo
          ? parseFloat(formData.chemical_mo)
          : null,
        chemical_cu: formData.chemical_cu
          ? parseFloat(formData.chemical_cu)
          : null,
        chemical_n: formData.chemical_n
          ? parseFloat(formData.chemical_n)
          : null,
        yield_strength: formData.yield_strength
          ? parseFloat(formData.yield_strength)
          : null,
        tensile_strength: formData.tensile_strength
          ? parseFloat(formData.tensile_strength)
          : null,
        elongation: formData.elongation
          ? parseFloat(formData.elongation)
          : null,
        hardness: formData.hardness ? parseFloat(formData.hardness) : null,
        import_order_id: formData.import_order_id || null,
        import_order_item_id: formData.import_order_item_id || null,
      };

      if (modalMode === 'create') {
        await materialCertificateService.createMaterialCertificate(dataToSend);
        setSuccessMessage('Material certificate created successfully');
      } else if (modalMode === 'edit') {
        await materialCertificateService.updateMaterialCertificate(
          selectedCertificate.id,
          dataToSend,
        );
        setSuccessMessage('Material certificate updated successfully');
      }

      handleCloseModal();
      loadCertificates(pagination.current_page);
    } catch (err) {
      console.error('Error saving certificate:', err);
      setError(err.message || 'Failed to save material certificate');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (cert) => {
    const confirmed = await confirm({
      title: 'Delete Material Certificate?',
      message: `Are you sure you want to delete certificate "${cert.certificate_number}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await materialCertificateService.deleteMaterialCertificate(cert.id);
      setSuccessMessage('Material certificate deleted successfully');
      loadCertificates(pagination.current_page);
    } catch (err) {
      console.error('Error deleting certificate:', err);
      setError(err.message || 'Failed to delete material certificate');
    }
  };

  // Open verification modal
  const openVerifyModal = (cert, action) => {
    setVerifyingId(cert.id);
    setVerifyAction(action);
    setVerifyNotes('');
    setSelectedCertificate(cert);
    setShowVerifyModal(true);
  };

  // Handle verification submit
  const handleVerifySubmit = async () => {
    try {
      const status = verifyAction === 'verify' ? 'verified' : 'rejected';
      await materialCertificateService.updateVerification(
        verifyingId,
        status,
        verifyNotes,
      );
      setSuccessMessage(`Certificate ${status} successfully`);
      setShowVerifyModal(false);
      setVerifyingId(null);
      setVerifyNotes('');
      loadCertificates(pagination.current_page);
    } catch (err) {
      console.error('Error updating verification:', err);
      setError(err.message || 'Failed to update verification status');
    }
  };

  // Get certificate type config
  const getCertTypeConfig = (type) => {
    return (
      CERTIFICATE_TYPES.find((t) => t.value === type) || CERTIFICATE_TYPES[0]
    );
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get grade label
  const getGradeLabel = (grade, gradeOther) => {
    if (grade === 'OTHER') return gradeOther || 'Other';
    const found = STEEL_GRADES.find((g) => g.value === grade);
    return found ? found.label : grade || '-';
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = VERIFICATION_STATUS[status] || VERIFICATION_STATUS.pending;
    const Icon = config.icon;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
          isDarkMode
            ? `${config.bgDark} ${config.textDark}`
            : `${config.bgLight} ${config.textLight}`
        }`}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  // Certificate Type Icon Component
  const CertTypeIcon = ({ type, size = 16 }) => {
    const config = getCertTypeConfig(type);
    const Icon = config.icon;
    return <Icon size={size} className={`text-${config.color}-500`} />;
  };

  return (
    <div
      className={`p-6 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-teal-600" size={28} />
            Material Certificates
          </h1>
          <p className="text-gray-500 mt-1">
            Manage MTC, COO, COA and other material certificates with
            verification workflows
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Certificate
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 mb-6 shadow-sm`}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by certificate number, heat number, mill name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 placeholder-gray-500'
                } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              isDarkMode
                ? 'border-gray-600 hover:bg-gray-700'
                : 'border-gray-300 hover:bg-gray-50'
            } ${showFilters ? 'bg-teal-50 border-teal-500 text-teal-600' : ''}`}
          >
            <Filter size={20} />
            Filters
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {(filters.certificate_type ||
              filters.verification_status ||
              filters.grade ||
              filters.start_date ||
              filters.end_date) && (
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={() => loadCertificates(pagination.current_page)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              isDarkMode
                ? 'border-gray-600 hover:bg-gray-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Certificate Type */}
              <div>
                <label
                  htmlFor="filter-certificate-type"
                  className="block text-sm font-medium mb-1"
                >
                  Certificate Type
                </label>
                <select
                  id="filter-certificate-type"
                  value={filters.certificate_type}
                  onChange={(e) =>
                    handleFilterChange('certificate_type', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Types</option>
                  {CERTIFICATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Status */}
              <div>
                <label
                  htmlFor="filter-verification-status"
                  className="block text-sm font-medium mb-1"
                >
                  Verification Status
                </label>
                <select
                  id="filter-verification-status"
                  value={filters.verification_status}
                  onChange={(e) =>
                    handleFilterChange('verification_status', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(VERIFICATION_STATUS).map(
                    ([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label
                  htmlFor="filter-grade"
                  className="block text-sm font-medium mb-1"
                >
                  Grade
                </label>
                <select
                  id="filter-grade"
                  value={filters.grade}
                  onChange={(e) => handleFilterChange('grade', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Grades</option>
                  {STEEL_GRADES.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="block text-sm font-medium mb-1"
                >
                  From Date
                </label>
                <input
                  id="filter-start-date"
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
                  htmlFor="filter-end-date"
                  className="block text-sm font-medium mb-1"
                >
                  To Date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) =>
                    handleFilterChange('end_date', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className={`px-4 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'border-gray-600 hover:bg-gray-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certificates Table */}
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 mb-2">No material certificates found</p>
            <button
              onClick={handleCreate}
              className="text-teal-600 hover:text-teal-700"
            >
              Create your first material certificate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mill / Heat No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
              >
                {certificates.map((cert) => (
                  <tr
                    key={cert.id}
                    className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <CertTypeIcon type={cert.certificate_type} size={20} />
                        <div>
                          <div className="font-medium">
                            {cert.certificate_number}
                          </div>
                          {cert.import_order_number && (
                            <div className="text-xs text-gray-500">
                              Order: {cert.import_order_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm">
                        {getCertTypeConfig(cert.certificate_type).label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">{cert.mill_name || '-'}</div>
                      {cert.heat_number && (
                        <div className="text-xs text-gray-500">
                          Heat: {cert.heat_number}
                        </div>
                      )}
                      {cert.coil_id && (
                        <div className="text-xs text-gray-500">
                          Coil: {cert.coil_id}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium">
                        {getGradeLabel(cert.grade, cert.grade_other)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm">
                        {formatDate(cert.issue_date)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm ${
                          cert.expiry_date &&
                          new Date(cert.expiry_date) < new Date()
                            ? 'text-red-500 font-medium'
                            : ''
                        }`}
                      >
                        {formatDate(cert.expiry_date)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={cert.verification_status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(cert)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-teal-600"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(cert)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {cert.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => openVerifyModal(cert, 'verify')}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-green-600"
                              title="Verify"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => openVerifyModal(cert, 'reject')}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-orange-600"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(cert)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600"
                          title="Delete"
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
            className={`px-6 py-3 flex items-center justify-between border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
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
                onClick={() => loadCertificates(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => loadCertificates(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className={`px-3 py-1 text-sm border rounded disabled:opacity-50 ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`sticky top-0 flex items-center justify-between p-6 border-b ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {modalMode === 'create'
                      ? 'New Material Certificate'
                      : 'Edit Material Certificate'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {modalMode === 'create'
                      ? 'Create a new MTC, COO, COA or other certificate'
                      : `Editing ${selectedCertificate?.certificate_number}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="modal-certificate-type"
                      className="block text-sm font-medium mb-1"
                    >
                      Certificate Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="modal-certificate-type"
                      value={formData.certificate_type}
                      onChange={(e) =>
                        handleInputChange('certificate_type', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } ${formErrors.certificate_type ? 'border-red-500' : ''}`}
                    >
                      {CERTIFICATE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.certificate_type && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.certificate_type}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="modal-certificate-number"
                      className="block text-sm font-medium mb-1"
                    >
                      Certificate Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modal-certificate-number"
                      type="text"
                      value={formData.certificate_number}
                      onChange={(e) =>
                        handleInputChange('certificate_number', e.target.value)
                      }
                      placeholder="e.g., MTC-2024-001234"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      } ${formErrors.certificate_number ? 'border-red-500' : ''}`}
                    />
                    {formErrors.certificate_number && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.certificate_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="modal-mill-name"
                      className="block text-sm font-medium mb-1"
                    >
                      Mill Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modal-mill-name"
                      type="text"
                      value={formData.mill_name}
                      onChange={(e) =>
                        handleInputChange('mill_name', e.target.value)
                      }
                      placeholder="e.g., POSCO, Tisco, Jindal"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      } ${formErrors.mill_name ? 'border-red-500' : ''}`}
                    />
                    {formErrors.mill_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.mill_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Link to Import Order */}
              <div
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Award size={18} />
                  Link to Import Order
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="modal-import-order"
                      className="block text-sm font-medium mb-1"
                    >
                      Import Order
                    </label>
                    <select
                      id="modal-import-order"
                      value={formData.import_order_id}
                      onChange={(e) => handleOrderChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">No linked order</option>
                      {importOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.import_order_number || order.importOrderNumber}{' '}
                          - {order.supplier_name || order.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="modal-line-item"
                      className="block text-sm font-medium mb-1"
                    >
                      Line Item (Product)
                    </label>
                    <select
                      id="modal-line-item"
                      value={formData.import_order_item_id}
                      onChange={(e) =>
                        handleInputChange(
                          'import_order_item_id',
                          e.target.value,
                        )
                      }
                      disabled={
                        !formData.import_order_id || orderItems.length === 0
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } ${!formData.import_order_id || orderItems.length === 0 ? 'opacity-60' : ''}`}
                    >
                      <option value="">Select line item</option>
                      {orderItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.product_name || item.productName} -{' '}
                          {item.quantity} {item.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Material Details */}
              <div
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Activity size={18} />
                  Material Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="modal-heat-number"
                      className="block text-sm font-medium mb-1"
                    >
                      Heat Number{' '}
                      {formData.certificate_type ===
                        'mill_test_certificate' && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="modal-heat-number"
                      type="text"
                      value={formData.heat_number}
                      onChange={(e) =>
                        handleInputChange('heat_number', e.target.value)
                      }
                      placeholder="e.g., H123456"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      } ${formErrors.heat_number ? 'border-red-500' : ''}`}
                    />
                    {formErrors.heat_number && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.heat_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="modal-coil-id"
                      className="block text-sm font-medium mb-1"
                    >
                      Coil ID (Optional)
                    </label>
                    <input
                      id="modal-coil-id"
                      type="text"
                      value={formData.coil_id}
                      onChange={(e) =>
                        handleInputChange('coil_id', e.target.value)
                      }
                      placeholder="e.g., C789012"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="modal-grade"
                      className="block text-sm font-medium mb-1"
                    >
                      Grade
                    </label>
                    <select
                      id="modal-grade"
                      value={formData.grade}
                      onChange={(e) =>
                        handleInputChange('grade', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select grade</option>
                      {STEEL_GRADES.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.grade === 'OTHER' && (
                    <div>
                      <label
                        htmlFor="modal-grade-other"
                        className="block text-sm font-medium mb-1"
                      >
                        Specify Grade <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="modal-grade-other"
                        type="text"
                        value={formData.grade_other}
                        onChange={(e) =>
                          handleInputChange('grade_other', e.target.value)
                        }
                        placeholder="Enter grade name"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 placeholder-gray-500'
                        } ${formErrors.grade_other ? 'border-red-500' : ''}`}
                      />
                      {formErrors.grade_other && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.grade_other}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate Details */}
              <div
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  Certificate Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="modal-country-of-origin"
                      className="block text-sm font-medium mb-1"
                    >
                      Country of Origin
                    </label>
                    <input
                      id="modal-country-of-origin"
                      type="text"
                      value={formData.country_of_origin}
                      onChange={(e) =>
                        handleInputChange('country_of_origin', e.target.value)
                      }
                      placeholder="e.g., China, India, Japan"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="modal-issuing-authority"
                      className="block text-sm font-medium mb-1"
                    >
                      Issuing Authority
                    </label>
                    <input
                      id="modal-issuing-authority"
                      type="text"
                      value={formData.issuing_authority}
                      onChange={(e) =>
                        handleInputChange('issuing_authority', e.target.value)
                      }
                      placeholder="e.g., Bureau Veritas, SGS"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="modal-issue-date"
                      className="block text-sm font-medium mb-1"
                    >
                      Issue Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modal-issue-date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) =>
                        handleInputChange('issue_date', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } ${formErrors.issue_date ? 'border-red-500' : ''}`}
                    />
                    {formErrors.issue_date && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.issue_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="modal-expiry-date"
                      className="block text-sm font-medium mb-1"
                    >
                      Expiry Date
                    </label>
                    <input
                      id="modal-expiry-date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) =>
                        handleInputChange('expiry_date', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Chemical Composition (for MTC) */}
              {formData.certificate_type === 'mill_test_certificate' && (
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Beaker size={18} className="text-blue-500" />
                    Chemical Composition (%)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'chemical_c', label: 'C (Carbon)' },
                      { key: 'chemical_si', label: 'Si (Silicon)' },
                      { key: 'chemical_mn', label: 'Mn (Manganese)' },
                      { key: 'chemical_p', label: 'P (Phosphorus)' },
                      { key: 'chemical_s', label: 'S (Sulfur)' },
                      { key: 'chemical_cr', label: 'Cr (Chromium)' },
                      { key: 'chemical_ni', label: 'Ni (Nickel)' },
                      { key: 'chemical_mo', label: 'Mo (Molybdenum)' },
                      { key: 'chemical_cu', label: 'Cu (Copper)' },
                      { key: 'chemical_n', label: 'N (Nitrogen)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label
                          htmlFor={`modal-${key}`}
                          className="block text-xs font-medium mb-1"
                        >
                          {label}
                        </label>
                        <input
                          id={`modal-${key}`}
                          type="number"
                          step="0.001"
                          value={formData[key]}
                          onChange={(e) =>
                            handleInputChange(key, e.target.value)
                          }
                          placeholder="0.000"
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mechanical Properties (for MTC) */}
              {formData.certificate_type === 'mill_test_certificate' && (
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}
                >
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-purple-500" />
                    Mechanical Properties
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label
                        htmlFor="modal-yield-strength"
                        className="block text-sm font-medium mb-1"
                      >
                        Yield Strength (MPa)
                      </label>
                      <input
                        id="modal-yield-strength"
                        type="number"
                        step="0.1"
                        value={formData.yield_strength}
                        onChange={(e) =>
                          handleInputChange('yield_strength', e.target.value)
                        }
                        placeholder="e.g., 205"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="modal-tensile-strength"
                        className="block text-sm font-medium mb-1"
                      >
                        Tensile Strength (MPa)
                      </label>
                      <input
                        id="modal-tensile-strength"
                        type="number"
                        step="0.1"
                        value={formData.tensile_strength}
                        onChange={(e) =>
                          handleInputChange('tensile_strength', e.target.value)
                        }
                        placeholder="e.g., 520"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="modal-elongation"
                        className="block text-sm font-medium mb-1"
                      >
                        Elongation (%)
                      </label>
                      <input
                        id="modal-elongation"
                        type="number"
                        step="0.1"
                        value={formData.elongation}
                        onChange={(e) =>
                          handleInputChange('elongation', e.target.value)
                        }
                        placeholder="e.g., 40"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="modal-hardness"
                        className="block text-sm font-medium mb-1"
                      >
                        Hardness (HRB/HRC)
                      </label>
                      <input
                        id="modal-hardness"
                        type="number"
                        step="0.1"
                        value={formData.hardness}
                        onChange={(e) =>
                          handleInputChange('hardness', e.target.value)
                        }
                        placeholder="e.g., 85"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label
                  htmlFor="modal-notes"
                  className="block text-sm font-medium mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="modal-notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or remarks"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* File Upload Placeholder */}
              <div>
                <label
                  htmlFor="modal-certificate-pdf"
                  className="block text-sm font-medium mb-1"
                >
                  Certificate PDF
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    isDarkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                  } cursor-pointer`}
                >
                  <Upload
                    className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                    size={32}
                  />
                  <p
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Click to upload or drag and drop certificate PDF
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`sticky bottom-0 flex gap-3 p-6 border-t ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving
                  ? 'Saving...'
                  : modalMode === 'create'
                    ? 'Create Certificate'
                    : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showModal && modalMode === 'view' && selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            {/* Header */}
            <div
              className={`sticky top-0 flex items-center justify-between p-6 border-b ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CertTypeIcon
                  type={selectedCertificate.certificate_type}
                  size={28}
                />
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedCertificate.certificate_number}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {
                      getCertTypeConfig(selectedCertificate.certificate_type)
                        .label
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedCertificate.verification_status} />
                <button
                  onClick={handleCloseModal}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                >
                  <h3 className="font-medium mb-3">Mill Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mill Name:</span>
                      <span className="font-medium">
                        {selectedCertificate.mill_name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Heat Number:</span>
                      <span className="font-medium">
                        {selectedCertificate.heat_number || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coil ID:</span>
                      <span className="font-medium">
                        {selectedCertificate.coil_id || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                >
                  <h3 className="font-medium mb-3">Material</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Grade:</span>
                      <span className="font-medium">
                        {getGradeLabel(
                          selectedCertificate.grade,
                          selectedCertificate.grade_other,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Country of Origin:</span>
                      <span className="font-medium">
                        {selectedCertificate.country_of_origin || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issuing Authority:</span>
                      <span className="font-medium">
                        {selectedCertificate.issuing_authority || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                >
                  <h3 className="font-medium mb-3">Dates</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issue Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedCertificate.issue_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expiry Date:</span>
                      <span
                        className={`font-medium ${
                          selectedCertificate.expiry_date &&
                          new Date(selectedCertificate.expiry_date) < new Date()
                            ? 'text-red-500'
                            : ''
                        }`}
                      >
                        {formatDate(selectedCertificate.expiry_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chemical Composition (for MTC) */}
              {selectedCertificate.certificate_type ===
                'mill_test_certificate' && (
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Beaker size={18} className="text-blue-500" />
                    Chemical Composition (%)
                  </h3>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                    {[
                      { key: 'chemical_c', label: 'C' },
                      { key: 'chemical_si', label: 'Si' },
                      { key: 'chemical_mn', label: 'Mn' },
                      { key: 'chemical_p', label: 'P' },
                      { key: 'chemical_s', label: 'S' },
                      { key: 'chemical_cr', label: 'Cr' },
                      { key: 'chemical_ni', label: 'Ni' },
                      { key: 'chemical_mo', label: 'Mo' },
                      { key: 'chemical_cu', label: 'Cu' },
                      { key: 'chemical_n', label: 'N' },
                    ].map(({ key, label }) => (
                      <div key={key} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          {label}
                        </div>
                        <div className="font-mono font-medium">
                          {selectedCertificate[key]
                            ? selectedCertificate[key].toFixed(3)
                            : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mechanical Properties (for MTC) */}
              {selectedCertificate.certificate_type ===
                'mill_test_certificate' && (
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}
                >
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-purple-500" />
                    Mechanical Properties
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        Yield Strength
                      </div>
                      <div className="text-lg font-medium">
                        {selectedCertificate.yield_strength
                          ? `${selectedCertificate.yield_strength} MPa`
                          : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        Tensile Strength
                      </div>
                      <div className="text-lg font-medium">
                        {selectedCertificate.tensile_strength
                          ? `${selectedCertificate.tensile_strength} MPa`
                          : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        Elongation
                      </div>
                      <div className="text-lg font-medium">
                        {selectedCertificate.elongation
                          ? `${selectedCertificate.elongation}%`
                          : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Hardness</div>
                      <div className="text-lg font-medium">
                        {selectedCertificate.hardness || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Info */}
              {selectedCertificate.verification_status !== 'pending' && (
                <div
                  className={`p-4 rounded-lg ${
                    selectedCertificate.verification_status === 'verified'
                      ? isDarkMode
                        ? 'bg-green-900/20 border border-green-800'
                        : 'bg-green-50 border border-green-200'
                      : isDarkMode
                        ? 'bg-red-900/20 border border-red-800'
                        : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    {selectedCertificate.verification_status === 'verified' ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-500" />
                    )}
                    Verification Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Verified By:</span>
                      <span className="font-medium ml-2">
                        {selectedCertificate.verified_by || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium ml-2">
                        {formatDate(selectedCertificate.verified_date)}
                      </span>
                    </div>
                    {selectedCertificate.rejection_reason && (
                      <div className="md:col-span-3">
                        <span className="text-gray-500">Reason:</span>
                        <span className="font-medium ml-2">
                          {selectedCertificate.rejection_reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCertificate.notes && (
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                >
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm">{selectedCertificate.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`sticky bottom-0 flex gap-3 p-6 border-t ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <button
                onClick={handleCloseModal}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseModal();
                  handleEdit(selectedCertificate);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit Certificate
              </button>
              {selectedCertificate.verification_status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      openVerifyModal(selectedCertificate, 'verify');
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      openVerifyModal(selectedCertificate, 'reject');
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerifyModal && selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-md rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    verifyAction === 'verify'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  {verifyAction === 'verify' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {verifyAction === 'verify'
                      ? 'Verify Certificate'
                      : 'Reject Certificate'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedCertificate.certificate_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p
                className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {verifyAction === 'verify'
                  ? 'Please confirm that you have verified all details on this certificate.'
                  : 'Please provide a reason for rejecting this certificate.'}
              </p>

              <div>
                <label
                  htmlFor="verify-notes"
                  className="block text-sm font-medium mb-1"
                >
                  {verifyAction === 'verify'
                    ? 'Notes (Optional)'
                    : 'Rejection Reason'}
                  {verifyAction === 'reject' && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <textarea
                  id="verify-notes"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder={
                    verifyAction === 'verify'
                      ? 'Add any verification notes...'
                      : 'Enter reason for rejection...'
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex gap-3 p-6 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => setShowVerifyModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySubmit}
                disabled={verifyAction === 'reject' && !verifyNotes.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white ${
                  verifyAction === 'verify'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } ${verifyAction === 'reject' && !verifyNotes.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {verifyAction === 'verify'
                  ? 'Confirm Verification'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default MaterialCertificateList;
