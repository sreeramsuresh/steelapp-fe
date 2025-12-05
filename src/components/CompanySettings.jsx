import { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  FileText,
  Calculator,
  Users,
  Save,
  Upload,
  Edit,
  Trash2,
  Plus,
  X,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  Download,
  CheckCircle,
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Printer,
  Clock,
  UserCheck,
  UserPlus,
  History,
  Key,
  Crown,
  Briefcase,
  Activity,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Warehouse,
  Receipt,
  ClipboardList,
  Box,
  Truck,
  FilePlus,
  Pencil,
  ThumbsUp,
  Tag,
  Circle,
} from 'lucide-react';
import { companyService } from '../services/companyService';
import { authService } from '../services/axiosAuthService';
import { templateService } from '../services/templateService';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';
import { userAdminAPI } from '../services/userAdminApi';
import vatRateService from '../services/vatRateService';
import { apiClient as apiService } from '../services/api';
import InvoiceTemplateSettings from './InvoiceTemplateSettings';
import FTAIntegrationSettings from '../pages/FTAIntegrationSettings';
import VATRulesHelpPanel from './VATRulesHelpPanel';
import { roleService } from '../services/roleService';
import RolesHelpPanel from './RolesHelpPanel';

// Custom Tailwind Components
const Button = ({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '', startIcon, as = 'button', ...props }) => {
  const { isDarkMode } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  
  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else { // outline
      return `border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const Component = as;
  const componentProps = as === 'button' ? { disabled, onClick, ...props } : { ...props };

  return (
    <Component
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
      {...componentProps}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
    </Component>
  );
};

const Input = ({ label, error, className = '', type = 'text', startIcon, endIcon, ...props }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={`w-full ${startIcon ? 'pl-10' : 'pl-3'} ${endIcon ? 'pr-10' : 'pr-3'} py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {endIcon}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

const Select = ({ label, options, value, onChange, placeholder = 'Select...', className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-white' 
            : 'bg-white border-gray-300 text-gray-900'
        } ${className}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const SettingsPaper = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    } ${className}`}>
      {children}
    </div>
  );
};

const SettingsCard = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`rounded-lg border transition-all duration-300 ${
      isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    } ${className}`}>
      {children}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={24} className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} />}
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-6 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {title && (
        <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};

const LogoContainer = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`w-40 h-40 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden ${
      isDarkMode 
        ? 'border-gray-600 bg-gray-800' 
        : 'border-gray-300 bg-gray-50'
    } ${className}`}>
      {children}
    </div>
  );
};

const CircularProgress = ({ size = 20, className = '' }) => {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const TextField = ({ label, value, onChange, placeholder, multiline, rows, startAdornment, endAdornment, error, helperText, disabled = false, readOnly = false, type = 'text', className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {startAdornment && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startAdornment}
          </div>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows || 3}
            disabled={disabled}
            readOnly={readOnly}
            className={`w-full px-3 ${startAdornment ? 'pl-10' : ''} ${endAdornment ? 'pr-10' : ''} py-2 border rounded-lg resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
            } ${
              isDarkMode
                ? 'bg-gray-800 text-white placeholder-gray-400'
                : 'bg-white text-gray-900 placeholder-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${readOnly ? 'opacity-50 cursor-default' : ''} ${className}`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={`w-full px-3 ${startAdornment ? 'pl-10' : ''} ${endAdornment ? 'pr-10' : ''} py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
            } ${
              isDarkMode
                ? 'bg-gray-800 text-white placeholder-gray-400'
                : 'bg-white text-gray-900 placeholder-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${readOnly ? 'opacity-50 cursor-default' : ''} ${className}`}
          />
        )}
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endAdornment}
          </div>
        )}
      </div>
      {helperText && (
        <p className={`text-sm ${error ? 'text-red-500' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

const Checkbox = ({ checked, onChange, label, disabled = false }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`w-4 h-4 rounded border focus:ring-2 focus:ring-teal-500 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-300'
        } text-teal-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {label && (
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

const Switch = ({ checked, onChange, label, disabled = false }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-teal-600' : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
            checked ? 'transform translate-x-4' : ''
          }`} />
        </div>
      </div>
      {label && (
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

const CompanySettings = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  // Role icon mapping
  const getRoleIcon = (roleName) => {
    const name = (roleName || '').toLowerCase().replace(/\s+/g, '_');
    const iconMap = {
      managing_director: Crown,
      operations_manager: Activity,
      finance_manager: DollarSign,
      sales_manager: TrendingUp,
      purchase_manager: ShoppingBag,
      warehouse_manager: Warehouse,
      accounts_manager: Calculator,
      sales_executive: Users,
      purchase_executive: ClipboardList,
      stock_keeper: Box,
      accounts_executive: Receipt,
      logistics_coordinator: Truck,
    };
    return iconMap[name] || Briefcase;
  };

  // Permission action icon mapping
  const getPermissionIcon = (permissionKey) => {
    const key = (permissionKey || '').toLowerCase();
    if (key.includes('create') || key.includes('add')) return FilePlus;
    if (key.includes('edit') || key.includes('update')) return Pencil;
    if (key.includes('delete') || key.includes('remove')) return Trash2;
    if (key.includes('view') || key.includes('read')) return Eye;
    if (key.includes('approve')) return ThumbsUp;
    if (key.includes('export')) return Download;
    if (key.includes('print')) return Printer;
    if (key.includes('manage') || key.includes('access')) return Key;
    return Shield;
  };
  
  const { data: companyData, loading: loadingCompany, refetch: refetchCompany } = useApiData(
    companyService.getCompany,
    [],
  );
  
  const { data: templatesData, loading: loadingTemplates, refetch: refetchTemplates } = useApiData(
    templateService.getTemplates,
    [],
  );
  
  const { execute: updateCompany, loading: updatingCompany } = useApi(companyService.updateCompany);
  const { execute: uploadLogo, loading: uploadingLogo } = useApi(companyService.uploadLogo);
  const { execute: deleteLogo } = useApi(companyService.deleteLogo);
  const { execute: deleteBrandmark } = useApi(companyService.deleteBrandmark);
  const { execute: deleteSeal } = useApi(companyService.deleteSeal);

  // Upload functions called directly, not through useApi hook
  const [uploadingBrandmark, setUploadingBrandmark] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const { execute: createTemplate, loading: creatingTemplate } = useApi(templateService.createTemplate);
  const { execute: updateTemplate, loading: updatingTemplate } = useApi(templateService.updateTemplate);
  
  const [companyProfile, setCompanyProfile] = useState({
    name: '',
    address: '',
    city: '',
    country: 'India',
    phone: '',
    email: '',
    website: '',
    vatNumber: '',
    logo: null,
    bankDetails: {
      bankName: '',
      accountNumber: '',
      iban: '',
    },
    documentImageSettings: {
      invoice: { showLogo: true, showSeal: true },
      quotation: { showLogo: true, showSeal: false },
      purchaseOrder: { showLogo: true, showSeal: true },
      creditNote: { showLogo: false, showSeal: true },
      deliveryNote: { showLogo: true, showSeal: false },
      paymentReceipt: { showLogo: true, showSeal: true },
      accountStatement: { showLogo: false, showSeal: false },
    },
  });


  useEffect(() => {
    if (companyData) {
      console.log('Loading company data:', companyData);
      
      // Extract address fields from JSONB or keep as string for backwards compatibility
      const addressData = companyData.address;
      let addressStr = '';
      let city = '';
      let country = '';
      
      if (typeof addressData === 'object' && addressData !== null) {
        addressStr = addressData.street || '';
        city = addressData.city || '';
        country = addressData.country || '';
      } else if (typeof addressData === 'string') {
        addressStr = addressData;
      }
      
      // Map API fields to component state (API returns camelCase)
      const mappedData = {
        ...companyData,
        address: addressStr,
        city,
        country,
        website: companyData.website || '',
        // Logos - API returns camelCase, treat empty strings as null
        logoUrl: companyData.logoUrl || null,
        brandmarkUrl: companyData.brandmarkUrl || null,
        pdfLogoUrl: companyData.pdfLogoUrl || null,
        pdfSealUrl: companyData.pdfSealUrl || null,
        bankDetails: {
          bankName: companyData.bankDetails?.bankName || '',
          accountNumber: companyData.bankDetails?.accountNumber || '',
          iban: companyData.bankDetails?.iban || '',
        },
        // Load document image settings from API (nested in settings object)
        documentImageSettings: companyData.settings?.documentImages || {
          invoice: { showLogo: true, showSeal: true },
          quotation: { showLogo: true, showSeal: false },
          purchaseOrder: { showLogo: true, showSeal: true },
          creditNote: { showLogo: false, showSeal: true },
          deliveryNote: { showLogo: true, showSeal: false },
          paymentReceipt: { showLogo: true, showSeal: true },
          accountStatement: { showLogo: false, showSeal: false },
        },
      };
      
      console.log('Mapped company profile:', mappedData);
      console.log('Logo URL:', mappedData.logoUrl);
      setCompanyProfile(mappedData);
    }
  }, [companyData]);

  const [invoiceSettings, setInvoiceSettings] = useState({
    templateStyle: 'modern',
    primaryColor: '#2563eb',
    showLogo: true,
    showBankDetails: true,
    footer: '',
    terms: '',
    invoiceNumberFormat: 'INV-{YYYY}-{MM}-{###}',
    dueDays: '',
  });

  const [vatRates, setVatRates] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState({ open: false, user: null });
  const [showAddVatModal, setShowAddVatModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    permissions: {
      invoices: { create: false, read: false, update: false, delete: false },
      customers: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: false, update: false, delete: false },
      analytics: { read: false },
      settings: { read: false, update: false },
      payables: { create: false, read: false, update: false, delete: false },
      invoices_all: { create: false, read: false, update: false, delete: false },
      quotations: { create: false, read: false, update: false, delete: false },
      delivery_notes: { create: false, read: false, update: false, delete: false },
      purchase_orders: { create: false, read: false, update: false, delete: false },
    },
  });

  // RBAC State
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [showManageRolesModal, setShowManageRolesModal] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    isDirector: false,
  });
  const [customPermissionModal, setCustomPermissionModal] = useState({ open: false, userId: null });
  const [auditLogModal, setAuditLogModal] = useState({ open: false, userId: null, logs: [] });
  const [viewPermissionsModal, setViewPermissionsModal] = useState({
    open: false,
    userId: null,
    userName: '',
    rolePermissions: [],
    customGrants: [],
    loading: false,
  });
  const [isDirector, setIsDirector] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [customPermission, setCustomPermission] = useState({
    permission_keys: [], // Changed to array for multiple selections
    reason: '',
    expires_at: null,
  });
  const [permissionSearch, setPermissionSearch] = useState('');
  const [expandedModules, setExpandedModules] = useState({});

  const [newVatRate, setNewVatRate] = useState({
    name: '',
    rate: '',
    type: 'percentage',
    description: '',
    active: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  // User management filters and validation
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userValidationErrors, setUserValidationErrors] = useState({});
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Printing settings state
  const [printingSettings, setPrintingSettings] = useState({
    receipt_size: 'A5',
    print_on_paper_size: 'A4',
    receipt_printer: 'default',
    invoice_printer: 'default',
    receipt_copies: 1,
    invoice_copies: 1,
    auto_print_receipts: false,
    auto_print_invoices: false,
  });

  const [savingPrintingSettings, setSavingPrintingSettings] = useState(false);

  // Image section collapse state
  const [imagesExpanded, setImagesExpanded] = useState(false);

  // Formatters
  const formatDateTime = (value) => {
    if (!value) return 'Never';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleString('en-AE', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  };
  const formatDateOnly = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return String(value);
    }
  };

  // Permission module label mapping
  const moduleLabel = (module) => {
    const map = {
      invoices: 'Create Invoices',
      invoices_all: 'All Invoices',
      purchase_orders: 'Purchase Orders',
      delivery_notes: 'Delivery Notes',
      quotations: 'Quotations',
      payables: 'Payables',
    };
    return map[module] || module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // User validation helpers
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password && password.length >= 8;
  };

  const validateUserForm = (user, isEdit = false) => {
    const errors = {};

    if (!user.name || user.name.trim().length === 0) {
      errors.name = 'Name is required';
    }

    if (!user.email || user.email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!validateEmail(user.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isEdit) {
      if (!user.password || user.password.length === 0) {
        errors.password = 'Password is required';
      } else if (!validatePassword(user.password)) {
        errors.password = 'Password must be at least 8 characters';
      }
    }

    if (selectedUserRoles.length === 0) {
      errors.roles = 'Please assign at least one role';
    }

    return errors;
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.roles?.some(role => role.displayName?.toLowerCase().includes(searchLower))
    );
  });

  // Set up theme integration for notifications
  useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);

  const templateStyles = [
    { id: 'modern', name: 'Modern', description: 'Clean and professional design' },
    { id: 'classic', name: 'Classic', description: 'Traditional business format' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant layout' },
    { id: 'detailed', name: 'Detailed', description: 'Comprehensive information display' },
  ];

  const userRoles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'manager', name: 'Manager', description: 'Manage operations and view reports' },
    { id: 'user', name: 'User', description: 'Basic access to create invoices' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access' },
  ];

  // Load invoice settings when templates data changes
  useEffect(() => {
    if (templatesData && templatesData.length > 0) {
      const defaultTemplate = templatesData.find(t => t.isDefault) || templatesData[0];
      setInvoiceSettings({
        templateStyle: defaultTemplate.templateStyle,
        primaryColor: defaultTemplate.primaryColor,
        showLogo: defaultTemplate.showLogo,
        showBankDetails: defaultTemplate.showBankDetails,
        footer: defaultTemplate.footerText || '',
        terms: defaultTemplate.termsAndConditions || '',
        invoiceNumberFormat: defaultTemplate.invoiceNumberFormat,
        dueDays: defaultTemplate.defaultDueDays,
      });
    }
  }, [templatesData]); // Only re-run when data actually changes

  // Load VAT rates once on mount
  useEffect(() => {
    (async () => {
      try {
        const rates = await vatRateService.getAll();
        // Transform database format to match component format
        if (rates && Array.isArray(rates)) {
          const transformedRates = rates.map(rate => ({
            id: String(rate.id),
            name: rate.name,
            rate: Number(rate.rate),
            type: rate.type,
            description: rate.description,
            active: rate.isActive,
          }));
          setVatRates(transformedRates);
        } else {
          console.warn('VAT rates response is not an array:', rates);
          setVatRates([]);
        }
      } catch (error) {
        console.error('Error loading VAT rates:', error);
        notificationService.error('Failed to load VAT rates');
        setVatRates([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - vatRateService and notificationService are stable imports

  // Load users once on mount (admin only)
  useEffect(() => {
    (async () => {
      try {
        const remoteUsers = await userAdminAPI.list();
        const mapped = remoteUsers.map(u => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status || 'active',
          createdAt: (u.createdAt || u.createdAt || '').toString().substring(0,10),
          lastLogin: u.lastLogin || u.lastLogin || null,
          permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {}),
        }));
        setUsers(mapped);
      } catch (e) {
        console.warn('Failed to load users from backend:', e?.response?.data || e?.message);
        setUsers([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - userAdminAPI is a stable import

  // Load printing settings once on mount
  useEffect(() => {
    (async () => {
      try {
        const settings = await apiService.get('/company/printing-settings');
        if (settings) {
          setPrintingSettings(settings);
        }
      } catch (error) {
        console.error('Error loading printing settings:', error);
        // Use defaults if error
      }
    })();
  }, []); // Run once on mount

  // Fetch printing settings when printing tab is active
  useEffect(() => {
    if (activeTab === 'printing') {
      (async () => {
        try {
          const settings = await apiService.get('/company/printing-settings');
          if (settings) {
            setPrintingSettings(settings);
          }
        } catch (error) {
          console.error('Error loading printing settings:', error);
          notificationService.error('Failed to load printing settings');
        }
      })();
    }
  }, [activeTab]);

  // Load RBAC data (roles, permissions, check if director)
  useEffect(() => {
    if (activeTab === 'users') {
      (async () => {
        try {
          // Fetch available roles
          const roles = await roleService.getAvailableRoles();
          setAvailableRoles(roles);

          // Fetch all permissions
          const permissions = await roleService.getAllPermissions();
          setAllPermissions(permissions);

          // Check if current user is Director
          const currentUser = authService.getUser();
          if (currentUser && currentUser.id) {
            const userPermissions = await roleService.getUserPermissions(currentUser.id);
            setIsDirector(userPermissions.isDirector || false);
          }
        } catch (error) {
          console.error('Error loading RBAC data:', error);
          notificationService.error('Failed to load role configuration');
        }
      })();
    }
  }, [activeTab]);

  // Load roles when Manage Roles modal opens
  useEffect(() => {
    if (showManageRolesModal) {
      loadRoles();
    }
  }, [showManageRolesModal]);

  const saveCompanyProfile = async () => {
    try {
      // Validate required fields
      if (!companyProfile.name || companyProfile.name.trim() === '') {
        notificationService.warning('Company name is required');
        return;
      }

      const updateData = {
        name: companyProfile.name.trim(),
        address: {
          street: companyProfile.address || '',
          city: companyProfile.city || '',
          country: companyProfile.country || 'UAE',
        },
        phone: companyProfile.phone || '',
        email: companyProfile.email || '',
        website: companyProfile.website || '',
        vat_number: '104858252000003',
        logo_url: companyProfile.logoUrl || null,
        brandmark_url: companyProfile.brandmarkUrl || null,
        pdf_logo_url: companyProfile.pdfLogoUrl || null,
        pdf_seal_url: companyProfile.pdfSealUrl || null,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
        settings: {
          documentImages: companyProfile.documentImageSettings || {
            invoice: { showLogo: true, showSeal: true },
            quotation: { showLogo: true, showSeal: false },
            purchaseOrder: { showLogo: true, showSeal: true },
            creditNote: { showLogo: false, showSeal: true },
            deliveryNote: { showLogo: true, showSeal: false },
            paymentReceipt: { showLogo: true, showSeal: true },
            accountStatement: { showLogo: false, showSeal: false },
          },
        },
      };
      
      console.log('Sending company data:', updateData);
      
      await updateCompany(updateData);
      notificationService.success('Company profile saved successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error saving company profile:', error);
      notificationService.error('Failed to save company profile. Please try again.');
    }
  };

  const saveInvoiceSettings = async () => {
    try {
      const templateData = {
        template_name: 'Default',
        template_style: invoiceSettings.templateStyle,
        primary_color: invoiceSettings.primaryColor,
        show_logo: invoiceSettings.showLogo,
        show_bank_details: invoiceSettings.showBankDetails,
        invoice_number_format: invoiceSettings.invoiceNumberFormat,
        default_due_days: invoiceSettings.dueDays === '' ? 30 : Number(invoiceSettings.dueDays),
        footer_text: invoiceSettings.footer,
        terms_and_conditions: invoiceSettings.terms,
        is_default: true,
      };

      if (templatesData && templatesData.length > 0) {
        const defaultTemplate = templatesData.find(t => t.isDefault) || templatesData[0];
        await updateTemplate(defaultTemplate.id, templateData);
      } else {
        await createTemplate(templateData);
      }

      notificationService.success('Invoice settings saved successfully!');
      refetchTemplates();
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      notificationService.error('Failed to save invoice settings. Please try again.');
    }
  };

  // No longer needed - using database directly
  // const saveVatRates = () => {
  //   localStorage.setItem('steel-app-vat-rates', JSON.stringify(vatRates));
  // };

  const saveUsers = () => {};

  const savePrintingSettings = async () => {
    try {
      setSavingPrintingSettings(true);

      await apiService.put('/company/printing-settings', printingSettings);

      notificationService.success('Printing settings saved successfully');
    } catch (error) {
      console.error('Error saving printing settings:', error);
      notificationService.error('Failed to save printing settings');
    } finally {
      setSavingPrintingSettings(false);
    }
  };

  const resetPrintingSettings = () => {
    setPrintingSettings({
      receipt_size: 'A5',
      print_on_paper_size: 'A4',
      receipt_printer: 'default',
      invoice_printer: 'default',
      receipt_copies: 1,
      invoice_copies: 1,
      auto_print_receipts: false,
      auto_print_invoices: false,
    });
    notificationService.info('Settings reset to defaults');
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      notificationService.warning('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (50KB limit)
    if (file.size > 50 * 1024) {
      notificationService.warning(`File size must be less than 50KB. Your file is ${(file.size / 1024).toFixed(2)}KB`);
      return;
    }

    try {
      const response = await uploadLogo(file);

      // Handle different possible response structures
      const logoUrl = response?.logo_url || response?.logoUrl || response?.url || response?.path;

      if (!logoUrl) {
        console.error('No logo URL found in response. Response structure:', response);
        throw new Error('Invalid response from server - no logo URL received');
      }

      // Update company profile with new logo URL
      let newLogoUrl = logoUrl;
      if (logoUrl.includes('localhost:5000')) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
        newLogoUrl = logoUrl.replace('http://localhost:5000', baseUrl);
      }
      setCompanyProfile(prev => ({ ...prev, logo_url: newLogoUrl }));

      // Save to database
      const logoUpdateData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: newLogoUrl,
        pdf_logo_url: companyProfile.useLogoInPdf ? newLogoUrl : companyProfile.pdfLogoUrl,
        brandmark_url: companyProfile.brandmarkUrl,
        pdf_seal_url: companyProfile.pdfSealUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
      };
      await updateCompany(logoUpdateData);

      notificationService.success('Logo uploaded successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error uploading logo:', error);
      notificationService.error('Failed to upload logo. Please try again.');
    }
  };

  const handleLogoDelete = async () => {
    if (!companyProfile.logoUrl) return;

    if (!window.confirm('Are you sure you want to delete the company logo?')) {
      return;
    }

    try {
      // Extract filename from URL
      const filename = companyProfile.logoUrl.split('/').pop();

      if (filename && filename.startsWith('company-logo-')) {
        await deleteLogo(filename);
      }

      // Update company profile
      setCompanyProfile(prev => ({ ...prev, logo_url: null }));

      // Save to database
      const logoDeleteData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: null,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
      };
      await updateCompany(logoDeleteData);

      notificationService.success('Logo deleted successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error deleting logo:', error);
      notificationService.error('Failed to delete logo. Please try again.');
    }
  };

  const handleBrandmarkUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      notificationService.warning('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (50KB limit)
    if (file.size > 50 * 1024) {
      notificationService.warning(`File size must be less than 50KB. Your file is ${(file.size / 1024).toFixed(2)}KB`);
      return;
    }

    try {
      setUploadingBrandmark(true);
      const response = await companyService.uploadBrandmark(file);

      // Handle different possible response structures
      const brandmarkUrl = response?.brandmarkUrl || response?.pdf_brandmark_url || response?.url || response?.path;

      if (!brandmarkUrl) {
        console.error('No brandmark URL found in response. Response structure:', response);
        throw new Error('Invalid response from server - no brandmark URL received');
      }

      console.log('[Brandmark Upload] Brandmark URL from server:', brandmarkUrl);

      // Save only the relative path to database (not the full URL)
      const relativeBrandmarkUrl = brandmarkUrl.startsWith('/uploads/') ? brandmarkUrl : brandmarkUrl.replace(/^https?:\/\/[^/]+/, '');

      console.log('[Brandmark Upload] Relative path for database:', relativeBrandmarkUrl);

      // Update company profile immediately with relative path
      setCompanyProfile(prev => ({ ...prev, brandmark_url: relativeBrandmarkUrl }));

      // Save to database (store relative path only)
      const brandmarkUpdateData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: relativeBrandmarkUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
      };
      await updateCompany(brandmarkUpdateData);

      notificationService.success('Brandmark uploaded successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error uploading brandmark:', error);
      notificationService.error(`Failed to upload brandmark: ${error.message}`);
    } finally {
      setUploadingBrandmark(false);
    }
  };

  const handleBrandmarkDelete = async () => {
    if (!companyProfile.brandmarkUrl) return;

    if (!window.confirm('Are you sure you want to delete the company brandmark?')) {
      return;
    }

    try {
      // Extract filename from URL
      const filename = companyProfile.brandmarkUrl.split('/').pop();

      if (filename && filename.startsWith('company-logo-')) {
        await deleteBrandmark(filename);
      }

      // Update company profile
      setCompanyProfile(prev => ({ ...prev, brandmark_url: null }));

      // Save to database
      const brandmarkDeleteData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: null,
        pdf_logo_url: companyProfile.pdfLogoUrl,
        pdf_seal_url: companyProfile.pdfSealUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
      };
      await updateCompany(brandmarkDeleteData);

      notificationService.success('Brandmark deleted successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error deleting brandmark:', error);
      notificationService.error('Failed to delete brandmark. Please try again.');
    }
  };

  const handleSealUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      notificationService.warning('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (50KB limit)
    if (file.size > 50 * 1024) {
      notificationService.warning(`File size must be less than 50KB. Your file is ${(file.size / 1024).toFixed(2)}KB`);
      return;
    }

    try {
      console.log('[Seal Upload] Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      setUploadingSeal(true);
      const response = await companyService.uploadSeal(file);
      console.log('[Seal Upload] Response received:', response);

      // Handle different possible response structures
      const sealUrl = response?.pdfSealUrl || response?.pdf_seal_url || response?.url || response?.path;

      if (!sealUrl) {
        console.error('No seal URL found in response. Response structure:', response);
        throw new Error('Invalid response from server - no seal URL received');
      }

      console.log('[Seal Upload] Seal URL from server:', sealUrl);

      // Save only the relative path to database (not the full URL)
      // This ensures consistency when fetching from database later
      const relativeSealUrl = sealUrl.startsWith('/uploads/') ? sealUrl : sealUrl.replace(/^https?:\/\/[^/]+/, '');

      console.log('[Seal Upload] Relative path for database:', relativeSealUrl);

      // Update company profile immediately with relative path
      setCompanyProfile(prev => ({ ...prev, pdf_seal_url: relativeSealUrl }));

      // Save to database (store relative path only)
      const sealUpdateData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: companyProfile.brandmarkUrl,
        pdf_logo_url: companyProfile.pdfLogoUrl,
        pdf_seal_url: relativeSealUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
      };
      await updateCompany(sealUpdateData);

      notificationService.success('Company seal uploaded successfully!');
      refetchCompany();
    } catch (error) {
      console.error('=== SEAL UPLOAD ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error response headers:', error.response?.headers);
      console.error('Request config:', error.config);
      console.error('========================');
      notificationService.error(`Failed to upload seal: ${error.message}`);
    } finally {
      setUploadingSeal(false);
    }
  };

  const handleSealDelete = async () => {
    if (!companyProfile.pdfSealUrl) return;

    if (!window.confirm('Are you sure you want to delete the company seal?')) {
      return;
    }

    try {
      // Extract filename from URL
      const filename = companyProfile.pdfSealUrl.split('/').pop();

      if (filename && filename.startsWith('company-logo-')) {
        await deleteSeal(filename);
      }

      // Update company profile
      setCompanyProfile(prev => ({ ...prev, pdf_seal_url: null }));

      // Save to database
      const sealDeleteData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country,
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.vatNumber,
        logo_url: companyProfile.logoUrl,
        brandmark_url: companyProfile.brandmarkUrl,
        pdf_logo_url: companyProfile.pdfLogoUrl,
        pdf_seal_url: null,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: '',
        },
      };
      await updateCompany(sealDeleteData);

      notificationService.success('Company seal deleted successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error deleting seal:', error);
      notificationService.error('Failed to delete seal. Please try again.');
    }
  };

  const handleAddUser = async () => {
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        permissions: newUser.permissions,
      };
      await userAdminAPI.create(payload);
      notificationService.success('User created successfully!');
      const remoteUsers = await userAdminAPI.list();
      const mapped = remoteUsers.map(u => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: (u.createdAt || u.createdAt || '').toString().substring(0,10),
        lastLogin: u.lastLogin || u.lastLogin || null,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {}),
      }));
      setUsers(mapped);
      setNewUser({
        name: '',
        email: '',
        role: 'user',
        password: '',
        permissions: {
          invoices: { create: false, read: false, update: false, delete: false },
          customers: { create: false, read: false, update: false, delete: false },
          products: { create: false, read: false, update: false, delete: false },
          analytics: { read: false },
          settings: { read: false, update: false },
        },
      });
      setShowAddUserModal(false);
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || 'Failed to add user');
    }
  };

  const handleAddVatRate = async () => {
    try {
      const vatRateData = {
        name: newVatRate.name,
        rate: newVatRate.rate === '' ? 0 : Number(newVatRate.rate),
        type: newVatRate.type,
        description: newVatRate.description,
        is_active: newVatRate.active,
      };

      const createdRate = await vatRateService.create(vatRateData);

      // Transform and add to local state
      const transformedRate = {
        id: String(createdRate.id),
        name: createdRate.name,
        rate: Number(createdRate.rate),
        type: createdRate.type,
        description: createdRate.description,
        active: createdRate.isActive,
      };

      setVatRates([...vatRates, transformedRate]);
      setNewVatRate({
        name: '',
        rate: '',
        type: 'percentage',
        description: '',
        active: true,
      });
      setShowAddVatModal(false);
      notificationService.success('VAT rate added successfully!');
    } catch (error) {
      console.error('Error adding VAT rate:', error);
      notificationService.error('Failed to add VAT rate');
    }
  };

  const toggleVatRateActive = async (vatRateId) => {
    try {
      const updatedRate = await vatRateService.toggle(vatRateId);

      // Update local state
      const updatedVatRates = vatRates.map(vatRate =>
        vatRate.id === vatRateId ? { ...vatRate, active: updatedRate.isActive } : vatRate,
      );
      setVatRates(updatedVatRates);
      notificationService.success(`VAT rate ${updatedRate.isActive ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      console.error('Error toggling VAT rate:', error);
      notificationService.error('Failed to toggle VAT rate');
    }
  };

  const deleteVatRate = async (vatRateId) => {
    if (window.confirm('Are you sure you want to delete this VAT rate?')) {
      try {
        await vatRateService.delete(vatRateId);

        // Update local state
        const updatedVatRates = vatRates.filter(vatRate => vatRate.id !== vatRateId);
        setVatRates(updatedVatRates);
        notificationService.success('VAT rate deleted successfully!');
      } catch (error) {
        console.error('Error deleting VAT rate:', error);
        notificationService.error('Failed to delete VAT rate');
      }
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const u = users.find(x => x.id === userId);
      if (!u) return;
      const newStatus = u.status === 'active' ? 'inactive' : 'active';
      await userAdminAPI.update(userId, { status: newStatus });
      const remoteUsers = await userAdminAPI.list();
      const mapped = remoteUsers.map(user => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        createdAt: (user.createdAt || user.createdAt || '').toString().substring(0,10),
        lastLogin: user.lastLogin || user.lastLogin || null,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || {}),
      }));
      setUsers(mapped);
      notificationService.success('User status updated');
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || 'Failed to update user');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userAdminAPI.remove(userId);
      const remoteUsers = await userAdminAPI.list();
      const mapped = remoteUsers.map(u => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: (u.createdAt || u.createdAt || '').toString().substring(0,10),
        lastLogin: u.lastLogin || u.lastLogin || null,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {}),
      }));
      setUsers(mapped);
      notificationService.success('User deleted successfully!');
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || 'Failed to delete user');
    }
  };

  // Role Management Handlers
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const roles = await roleService.getRoles();
      setAvailableRoles(roles);
    } catch (error) {
      console.error('Error loading roles:', error);
      notificationService.error('Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const handleSaveRole = async () => {
    try {
      if (!roleFormData.name || !roleFormData.displayName) {
        notificationService.warning('Please fill in all required fields');
        return;
      }

      const payload = {
        name: roleFormData.name,
        display_name: roleFormData.displayName,
        description: roleFormData.description,
        is_director: roleFormData.isDirector,
      };

      if (editingRole) {
        await roleService.updateRole(editingRole.id, payload);
        notificationService.success('Role updated successfully');
      } else {
        await roleService.createRole(payload);
        notificationService.success('Role created successfully');
      }

      setShowRoleDialog(false);
      await loadRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      notificationService.error('Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? Users with this role will lose their assigned permissions.')) {
      return;
    }

    try {
      await roleService.deleteRole(roleId);
      notificationService.success('Role deleted successfully');
      await loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      notificationService.error('Failed to delete role');
    }
  };

  const handleRoleChange = (role) => {
    // Align permissions with backend defaultPermissions in routes/auth.js
    let permissions;
    switch (role) {
      case 'admin':
        permissions = {
          invoices: { create: true, read: true, update: true, delete: true },
          customers: { create: true, read: true, update: true, delete: true },
          products: { create: true, read: true, update: true, delete: true },
          analytics: { read: true },
          settings: { read: true, update: true },
          payables: { create: true, read: true, update: true, delete: true },
          invoices_all: { create: true, read: true, update: true, delete: true },
          quotations: { create: true, read: true, update: true, delete: true },
          delivery_notes: { create: true, read: true, update: true, delete: true },
          purchase_orders: { create: true, read: true, update: true, delete: true },
        };
        break;
      case 'manager':
        permissions = {
          invoices: { create: true, read: true, update: true, delete: false },
          customers: { create: true, read: true, update: true, delete: false },
          products: { create: true, read: true, update: true, delete: false },
          analytics: { read: true },
          settings: { read: true, update: false },
          payables: { create: true, read: true, update: true, delete: false },
          invoices_all: { create: true, read: true, update: true, delete: false },
          quotations: { create: true, read: true, update: true, delete: false },
          delivery_notes: { create: true, read: true, update: true, delete: false },
          purchase_orders: { create: true, read: true, update: true, delete: false },
        };
        break;
      case 'user':
        permissions = {
          invoices: { create: true, read: true, update: true, delete: false },
          customers: { create: true, read: true, update: true, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: false },
          settings: { read: false, update: false },
          payables: { create: false, read: true, update: false, delete: false },
          invoices_all: { create: false, read: true, update: false, delete: false },
          quotations: { create: false, read: true, update: false, delete: false },
          delivery_notes: { create: false, read: true, update: false, delete: false },
          purchase_orders: { create: false, read: true, update: false, delete: false },
        };
        break;
      default: // 'viewer'
        permissions = {
          invoices: { create: false, read: true, update: false, delete: false },
          customers: { create: false, read: true, update: false, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: false },
          settings: { read: false, update: false },
          payables: { create: false, read: true, update: false, delete: false },
          invoices_all: { create: false, read: true, update: false, delete: false },
          quotations: { create: false, read: true, update: false, delete: false },
          delivery_notes: { create: false, read: true, update: false, delete: false },
          purchase_orders: { create: false, read: true, update: false, delete: false },
        };
    }
    setNewUser({ ...newUser, role, permissions });
  };

  // Edit user handlers
  const openEditUser = (user) => {
    // Ensure new modules exist in permissions for editing visibility
    const ensureModules = (p) => {
      const base = { ...p };
      const mods = ['invoices','invoices_all','purchase_orders','delivery_notes','quotations','payables','customers','products','analytics','settings'];
      for (const m of mods) {
        if (base[m] === undefined) base[m] = { read: false };
      }
      return base;
    };
    setEditUserModal({
      open: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        permissions: ensureModules(JSON.parse(JSON.stringify(user.permissions || {}))),
      },
    });
  };

  const setEditPermission = (module, action, value) => {
    setEditUserModal(prev => ({
      ...prev,
      user: {
        ...prev.user,
        permissions: {
          ...prev.user.permissions,
          [module]: { ...(prev.user.permissions?.[module] || {}), [action]: value },
        },
      },
    }));
  };

  const handleEditRoleChange = (role) => {
    // reuse role mapping
    setNewUser({ ...newUser, role });
    // apply to edit user by invoking mapping and copying
    const snapshot = { ...newUser, role };
    // build permissions by calling handleRoleChange-like map
    let perms;
    switch (role) {
      case 'admin':
        perms = {
          invoices: { create: true, read: true, update: true, delete: true },
          customers: { create: true, read: true, update: true, delete: true },
          products: { create: true, read: true, update: true, delete: true },
          analytics: { read: true },
          settings: { read: true, update: true },
          payables: { create: true, read: true, update: true, delete: true },
          invoices_all: { create: true, read: true, update: true, delete: true },
          quotations: { create: true, read: true, update: true, delete: true },
          delivery_notes: { create: true, read: true, update: true, delete: true },
          purchase_orders: { create: true, read: true, update: true, delete: true },
        };
        break;
      case 'manager':
        perms = {
          invoices: { create: true, read: true, update: true, delete: false },
          customers: { create: true, read: true, update: true, delete: false },
          products: { create: true, read: true, update: true, delete: false },
          analytics: { read: true },
          settings: { read: true, update: false },
          payables: { create: true, read: true, update: true, delete: false },
          invoices_all: { create: true, read: true, update: true, delete: false },
          quotations: { create: true, read: true, update: true, delete: false },
          delivery_notes: { create: true, read: true, update: true, delete: false },
          purchase_orders: { create: true, read: true, update: true, delete: false },
        };
        break;
      case 'user':
        perms = {
          invoices: { create: true, read: true, update: true, delete: false },
          customers: { create: true, read: true, update: true, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: false },
          settings: { read: false, update: false },
          payables: { create: false, read: true, update: false, delete: false },
          invoices_all: { create: false, read: true, update: false, delete: false },
          quotations: { create: false, read: true, update: false, delete: false },
          delivery_notes: { create: false, read: true, update: false, delete: false },
          purchase_orders: { create: false, read: true, update: false, delete: false },
        };
        break;
      default:
        perms = {
          invoices: { create: false, read: true, update: false, delete: false },
          customers: { create: false, read: true, update: false, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: false },
          settings: { read: false, update: false },
          payables: { create: false, read: true, update: false, delete: false },
          invoices_all: { create: false, read: true, update: false, delete: false },
          quotations: { create: false, read: true, update: false, delete: false },
          delivery_notes: { create: false, read: true, update: false, delete: false },
          purchase_orders: { create: false, read: true, update: false, delete: false },
        };
    }
    setEditUserModal(prev => ({ ...prev, user: { ...prev.user, role, permissions: perms } }));
  };

  const saveEditUser = async () => {
    try {
      const currentUser = authService.getUser();
      const isSelf = currentUser && String(currentUser.id) === String(editUserModal.user.id);

      // Handle password change: self requires current+new+confirm; admin-reset allows new+confirm only
      if (editUserModal.user.newPassword || editUserModal.user.currentPassword || editUserModal.user.confirmPassword) {
        if (!editUserModal.user.newPassword || !editUserModal.user.confirmPassword) {
          notificationService.error('Please enter new and confirm password');
          return;
        }
        if (editUserModal.user.newPassword !== editUserModal.user.confirmPassword) {
          notificationService.error('New password and confirm password do not match');
          return;
        }
        if (isSelf) {
          if (!editUserModal.user.currentPassword) {
            notificationService.error('Please enter your current password');
            return;
          }
          // Call self password change endpoint
          await apiService.post('/auth/change-password', {
            currentPassword: editUserModal.user.currentPassword,
            newPassword: editUserModal.user.newPassword,
          });
        } else {
          // Admin reset password via admin users API
          await userAdminAPI.update(editUserModal.user.id, { password: editUserModal.user.newPassword });
        }
      }

      // Update role/permissions if changed
      await userAdminAPI.update(editUserModal.user.id, {
        role: editUserModal.user.role,
        permissions: editUserModal.user.permissions,
      });
      notificationService.success('User updated successfully');
      const remoteUsers = await userAdminAPI.list();
      const mapped = remoteUsers.map(u => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: (u.createdAt || u.createdAt || '').toString().substring(0,10),
        lastLogin: u.lastLogin || u.lastLogin || null,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {}),
      }));
      setUsers(mapped);
      setEditUserModal({ open: false, user: null });
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || 'Failed to update user');
    }
  };

  const renderProfile = () => (
    <SettingsPaper className="max-w-3xl">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Company Profile
          </h3>
          <Button
            variant="primary"
            startIcon={updatingCompany ? <CircularProgress size={16} /> : <Save size={16} />}
            onClick={saveCompanyProfile}
            disabled={updatingCompany}
          >
            {updatingCompany ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Basic Information */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Basic Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Company Name"
                  value={companyProfile.name || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, name: e.target.value})}
                  placeholder="Enter company name"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={companyProfile.email || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, email: e.target.value})}
                  placeholder="Enter email address"
                  startAdornment={<Mail size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
                />
                <TextField
                  label="Phone Numbers"
                  type="tel"
                  value={companyProfile.phone || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, phone: e.target.value})}
                  placeholder="Enter phone numbers (comma-separated): +971506061680, +971506067680"
                  startAdornment={<Phone size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
                />
                <TextField
                  label="Website"
                  type="url"
                  value={companyProfile.website || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, website: e.target.value})}
                  placeholder="Enter website URL"
                  startAdornment={<Globe size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
                />
              </div>
            </div>
          </SettingsCard>

          {/* Address Information */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Address Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <TextField
                    label="Street Address"
                    value={typeof companyProfile.address === 'string' ? companyProfile.address : (companyProfile.address?.street || '')}
                    onChange={(e) => setCompanyProfile({...companyProfile, address: e.target.value})}
                    placeholder="Enter street address"
                    startAdornment={<MapPin size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
                  />
                </div>
                <TextField
                  label="City"
                  value={companyProfile.city || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, city: e.target.value})}
                  placeholder="Enter city"
                />
                <Select
                  label="Country"
                  value={companyProfile.country || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, country: e.target.value})}
                  options={[
                    { value: 'UAE', label: 'UAE' },
                    { value: 'India', label: 'India' },
                    { value: 'United States', label: 'United States' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'Australia', label: 'Australia' },
                  ]}
                />
              </div>
            </div>
          </SettingsCard>

          {/* VAT Registration */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                VAT Registration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="VAT REG NO"
                  value="104858252000003"
                  readOnly
                  placeholder="VAT Registration Number"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Bank Details */}
          <SettingsCard>
            <div className="p-4">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Bank Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Bank Name"
                  value={companyProfile.bankDetails?.bankName || ''}
                  onChange={(e) => setCompanyProfile({
                    ...companyProfile,
                    bankDetails: {...(companyProfile.bankDetails || {}), bankName: e.target.value},
                  })}
                  placeholder="Enter bank name"
                />
                <TextField
                  label="Account Number"
                  value={companyProfile.bankDetails?.accountNumber || ''}
                  onChange={(e) => setCompanyProfile({
                    ...companyProfile,
                    bankDetails: {...(companyProfile.bankDetails || {}), accountNumber: e.target.value},
                  })}
                  placeholder="Enter account number"
                />
                <TextField
                  label="IBAN"
                  value={companyProfile.bankDetails?.iban || ''}
                  onChange={(e) => setCompanyProfile({
                    ...companyProfile,
                    bankDetails: {...(companyProfile.bankDetails || {}), iban: e.target.value},
                  })}
                  placeholder="Enter IBAN"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Company Images - Collapsible */}
          <SettingsCard>
            <div className="p-4">
              <button
                onClick={() => setImagesExpanded(!imagesExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Company Images (Logo, Brandmark, Seal)
                </h4>
                {imagesExpanded ? (
                  <ChevronUp size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                ) : (
                  <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                )}
              </button>

              {imagesExpanded && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Logo Section */}
                  <div className="flex flex-col">
                    <h5 className={`text-md font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Company Logo
                    </h5>
                    <div className="flex flex-col space-y-4">
                      <LogoContainer>
                        {uploadingLogo ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CircularProgress size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uploading...</span>
                          </div>
                        ) : companyProfile.logoUrl ? (
                          <div className="relative w-full h-full">
                            {console.log('Rendering logo with URL:', companyProfile.logoUrl)}
                            <img
                              src={`${companyProfile.logoUrl}?t=${Date.now()}`}
                              alt="Company Logo"
                              className="w-full h-full object-contain rounded-lg"
                              crossOrigin="anonymous"
                              onLoad={() => console.log('Logo loaded successfully:', companyProfile.logoUrl)}
                              onError={(e) => {
                                console.error('Logo failed to load:', companyProfile.logoUrl, e);
                                console.error('Image load error details:', e.type, e.target?.src);
                                // Try to reload without cache-busting query first
                                if (e.target.src.includes('?t=')) {
                                  console.log('Retrying without cache-busting query...');
                                  e.target.src = companyProfile.logoUrl;
                                } else {
                                  // If that also fails, show upload option
                                  setCompanyProfile(prev => ({ ...prev, logoUrl: null }));
                                }
                              }}
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                            <button
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              onClick={handleLogoDelete}
                              title="Delete logo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Camera size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upload Logo</span>
                          </div>
                        )}
                      </LogoContainer>

                      <div className="space-y-2">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <Button
                            as="span"
                            variant="outline"
                            size="sm"
                            startIcon={uploadingLogo ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? 'Uploading...' : 'Upload'}
                          </Button>
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Max: 50KB
                        </p>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={companyProfile.useLogoInPdf || false}
                            onChange={(e) => {
                              const useInPdf = e.target.checked;
                              setCompanyProfile(prev => ({
                                ...prev,
                                useLogoInPdf: useInPdf,
                                pdfLogoUrl: useInPdf ? prev.logoUrl : null,
                              }));
                            }}
                            className="mr-2"
                          />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Use in PDFs
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Brandmark Section */}
                  <div className="flex flex-col">
                    <h5 className={`text-md font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Company Brandmark
                    </h5>
                    <div className="flex flex-col space-y-4">
                      <LogoContainer>
                        {uploadingBrandmark ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CircularProgress size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uploading...</span>
                          </div>
                        ) : companyProfile.brandmarkUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={`${companyProfile.brandmarkUrl.startsWith('/') ? (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000') + companyProfile.brandmarkUrl : companyProfile.brandmarkUrl}?t=${Date.now()}`}
                              alt="Company Brandmark"
                              className="w-full h-full object-contain rounded-lg"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                if (e.target.src.includes('?t=')) {
                                  const baseUrl = (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
                                  e.target.src = companyProfile.brandmarkUrl.startsWith('/') ? baseUrl + companyProfile.brandmarkUrl : companyProfile.brandmarkUrl;
                                } else {
                                  setCompanyProfile(prev => ({ ...prev, brandmark_url: null }));
                                }
                              }}
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                            <button
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              onClick={handleBrandmarkDelete}
                              title="Delete brandmark"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Camera size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upload Brandmark</span>
                          </div>
                        )}
                      </LogoContainer>

                      <div className="space-y-2">
                        <input
                          type="file"
                          id="brandmark-upload"
                          accept="image/*"
                          onChange={handleBrandmarkUpload}
                          className="hidden"
                        />
                        <label htmlFor="brandmark-upload" className="cursor-pointer">
                          <Button
                            as="span"
                            variant="outline"
                            size="sm"
                            startIcon={uploadingBrandmark ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />}
                            disabled={uploadingBrandmark}
                          >
                            {uploadingBrandmark ? 'Uploading...' : 'Upload'}
                          </Button>
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Max: 50KB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seal Section */}
                  <div className="flex flex-col">
                    <h5 className={`text-md font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Company Seal
                    </h5>
                    <div className="flex flex-col space-y-4">
                      <LogoContainer>
                        {uploadingSeal ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CircularProgress size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uploading...</span>
                          </div>
                        ) : companyProfile.pdfSealUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={`${companyProfile.pdfSealUrl.startsWith('/') ? (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000') + companyProfile.pdfSealUrl : companyProfile.pdfSealUrl}?t=${Date.now()}`}
                              alt="Company Seal"
                              className="w-full h-full object-contain rounded-lg"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                if (e.target.src.includes('?t=')) {
                                  const baseUrl = (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
                                  e.target.src = companyProfile.pdfSealUrl.startsWith('/') ? baseUrl + companyProfile.pdfSealUrl : companyProfile.pdfSealUrl;
                                } else {
                                  setCompanyProfile(prev => ({ ...prev, pdf_seal_url: null }));
                                }
                              }}
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                            <button
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                              onClick={handleSealDelete}
                              title="Delete seal"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Camera size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upload Seal</span>
                          </div>
                        )}
                      </LogoContainer>

                      <div className="space-y-2">
                        <input
                          type="file"
                          id="seal-upload"
                          accept="image/*"
                          onChange={handleSealUpload}
                          className="hidden"
                        />
                        <label htmlFor="seal-upload" className="cursor-pointer">
                          <Button
                            as="span"
                            variant="outline"
                            size="sm"
                            startIcon={uploadingSeal ? <Upload size={14} className="animate-spin" /> : <Upload size={14} />}
                            disabled={uploadingSeal}
                          >
                            {uploadingSeal ? 'Uploading...' : 'Upload'}
                          </Button>
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Max: 50KB
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          For PDFs
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Document Types - Logo & Seal Settings */}
                  <div className="mt-8 pt-8 border-t border-gray-300">
                    <h4 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Enable Logos in Document Types
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className={`w-full text-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <thead>
                          <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                            <th className={`text-left py-2 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Document Type
                            </th>
                            <th className={`text-center py-2 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Logo
                            </th>
                            <th className={`text-center py-2 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Seal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'invoice', label: 'Invoice' },
                            { key: 'quotation', label: 'Quotation' },
                            { key: 'purchaseOrder', label: 'Purchase Order' },
                            { key: 'creditNote', label: 'Credit Note' },
                            { key: 'deliveryNote', label: 'Delivery Note' },
                            { key: 'paymentReceipt', label: 'Payment Receipt' },
                            { key: 'accountStatement', label: 'Account Statement' },
                          ].map((doc) => (
                            <tr key={doc.key} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                {doc.label}
                              </td>
                              <td className="text-center py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={companyProfile.documentImageSettings?.[doc.key]?.showLogo ?? true}
                                  onChange={(e) => {
                                    setCompanyProfile(prev => ({
                                      ...prev,
                                      documentImageSettings: {
                                        ...prev.documentImageSettings,
                                        [doc.key]: {
                                          ...prev.documentImageSettings?.[doc.key],
                                          showLogo: e.target.checked,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-4 h-4 rounded"
                                />
                              </td>
                              <td className="text-center py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={companyProfile.documentImageSettings?.[doc.key]?.showSeal ?? true}
                                  onChange={(e) => {
                                    setCompanyProfile(prev => ({
                                      ...prev,
                                      documentImageSettings: {
                                        ...prev.documentImageSettings,
                                        [doc.key]: {
                                          ...prev.documentImageSettings?.[doc.key],
                                          showSeal: e.target.checked,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-4 h-4 rounded"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>
        </div>
      </div>
    </SettingsPaper>
  );

  const renderInvoiceTemplates = () => (
    <InvoiceTemplateSettings
      company={companyProfile}
      onSave={async (templateSettings) => {
        try {
          // Save template settings to company.settings
          // templateSettings contains: invoiceTemplate (unified format), documentTemplates
          // invoiceTemplate format: { id, name, colors, settings }
          // Backend PDF generation reads: company.settings.invoiceTemplate.colors.primary
          const updatedProfile = {
            ...companyProfile,
            settings: {
              ...companyProfile.settings,
              invoiceTemplate: templateSettings.invoiceTemplate,
              documentTemplates: templateSettings.documentTemplates,
            },
          };

          await companyService.updateCompany(updatedProfile);
          setCompanyProfile(updatedProfile);
          notificationService.success('Invoice template settings saved successfully!');
        } catch (error) {
          console.error('Error saving template settings:', error);
          notificationService.error('Failed to save template settings');
          throw error;
        }
      }}
    />
  );

  const renderVatSettings = () => {
    console.log('renderVatSettings called - VATRulesHelpPanel should render');
    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[600px]">
        {/* Left Column - VAT Configuration (60%) */}
        <div className="lg:w-3/5 flex-shrink-0">
          <div className={`rounded-2xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  VAT Rates Configuration
                </h3>
                <Button
                  onClick={() => setShowAddVatModal(true)}
                  startIcon={<Plus size={16} />}
                >
                  Add VAT Rate
                </Button>
              </div>

              {/* UAE VAT Compliance Info Banner */}
              <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                isDarkMode
                  ? 'bg-blue-900/20 border-blue-500 text-blue-300'
                  : 'bg-blue-50 border-blue-500 text-blue-800'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-semibold mb-2">UAE Federal Tax Authority (FTA) VAT Compliance</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li><strong>Standard Rated (5%):</strong> Default rate for most goods and services in UAE</li>
                      <li><strong>Zero Rated (0%):</strong> Exports, international transport, specified medicines & education</li>
                      <li><strong>Exempt:</strong> Financial services, residential properties, bare land (no input tax recovery)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {vatRates.length === 0 ? (
                  <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
                    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <Calculator size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      No VAT Rates Configured
                    </h4>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get started by adding your first VAT rate. Common rates in UAE are 5% (Standard) and 0% (Zero Rated).
                    </p>
                    <Button
                      onClick={() => setShowAddVatModal(true)}
                      startIcon={<Plus size={16} />}
                    >
                      Add Your First VAT Rate
                    </Button>
                  </div>
                ) : (
                  vatRates.map(vatRate => (
                    <div
                      key={vatRate.id}
                      className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
                      } ${vatRate.active ? 'opacity-100' : 'opacity-60'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {vatRate.name}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${
                              isDarkMode
                                ? 'text-teal-400 border-teal-600 bg-teal-900/20'
                                : 'text-teal-600 border-teal-300 bg-teal-50'
                            }`}>
                              {vatRate.rate}%
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${
                              isDarkMode
                                ? 'text-gray-400 border-gray-600 bg-gray-800'
                                : 'text-gray-600 border-gray-300 bg-gray-50'
                            }`}>
                              {vatRate.type}
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {vatRate.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={vatRate.active}
                              onChange={() => toggleVatRateActive(vatRate.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                          </label>
                          <span className={`text-sm font-medium ${
                            vatRate.active
                              ? 'text-green-500'
                              : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {vatRate.active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => deleteVatRate(vatRate.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add VAT Rate Modal */}
            {showAddVatModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl`}>
                  <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Add VAT Rate
                      </h3>
                      <button
                        onClick={() => setShowAddVatModal(false)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="VAT Rate Name"
                        value={newVatRate.name}
                        onChange={(e) => setNewVatRate({...newVatRate, name: e.target.value})}
                        placeholder="e.g., Standard Rated, Zero Rated"
                      />
                      <Input
                        label="VAT Percentage (%)"
                        type="number"
                        value={newVatRate.rate || ''}
                        onChange={(e) => setNewVatRate({...newVatRate, rate: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                        placeholder="Enter VAT rate (0, 5, etc.)"
                      />
                      <Select
                        label="Type"
                        value={newVatRate.type}
                        onChange={(e) => setNewVatRate({...newVatRate, type: e.target.value})}
                        options={[
                          { value: 'percentage', label: 'Percentage' },
                          { value: 'fixed', label: 'Fixed Amount' },
                        ]}
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Description"
                          value={newVatRate.description}
                          onChange={(e) => setNewVatRate({...newVatRate, description: e.target.value})}
                          placeholder="Describe when this VAT rate applies"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddVatModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddVatRate}
                      startIcon={<Save size={20} />}
                    >
                      Add VAT Rate
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Help Panel (40%) - Full height from top */}
        <div className="lg:w-2/5 lg:self-stretch lg:min-h-[600px]">
          <div className={`h-full rounded-xl shadow-sm border overflow-hidden ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto lg:sticky lg:top-6">
              <VATRulesHelpPanel />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserManagement = () => (
    <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[600px]">
      {/* Left Column - User Management (60%) */}
      <div className="lg:w-3/5 flex-shrink-0">
        <SettingsPaper>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                User Management
              </h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  startIcon={<Shield size={16} />}
                  onClick={() => setShowManageRolesModal(true)}
                >
                  Manage Roles
                </Button>
                <Button
                  variant="primary"
                  startIcon={<UserPlus size={16} />}
                  onClick={() => {
                    setNewUser({
                      name: '',
                      email: '',
                      password: '',
                      role_ids: [],
                    });
                    setSelectedUserRoles([]);
                    setShowAddUserModal(true);
                  }}
                >
                  Add User
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <Input
                placeholder="Search users by name, email, or role..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                startIcon={<Users size={16} />}
                className="max-w-md"
              />
            </div>

            {/* User List */}
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {userSearchTerm ? 'No users found matching your search' : 'No users yet. Add your first user to get started.'}
                  </p>
                </div>
              ) : null}
              {filteredUsers.map(user => (
                <SettingsCard key={user.id} className={user.status === 'active' ? '' : 'opacity-60'}>
                  <div className="p-6">
                    {/* User Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                          isDarkMode ? 'bg-teal-600' : 'bg-teal-500'
                        }`}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.name || 'Unnamed User'}
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.email || 'No email'}
                          </p>
                          {/* Display Roles */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                                    role.isDirector
                                      ? isDarkMode
                                        ? 'text-purple-400 border-purple-600 bg-purple-900/20'
                                        : 'text-purple-600 border-purple-300 bg-purple-50'
                                      : isDarkMode
                                        ? 'text-teal-400 border-teal-600 bg-teal-900/20'
                                        : 'text-teal-600 border-teal-300 bg-teal-50'
                                  }`}
                                >
                                  {role.displayName}
                                </span>
                              ))
                            ) : (
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                                isDarkMode
                                  ? 'text-gray-400 border-gray-600 bg-gray-800'
                                  : 'text-gray-600 border-gray-300 bg-gray-50'
                              }`}>
                            No roles assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={user.status === 'active'}
                          onChange={() => toggleUserStatus(user.id)}
                          label={user.status === 'active' ? 'Active' : 'Inactive'}
                        />
                        <button
                          onClick={async () => {
                            try {
                              setViewPermissionsModal({
                                open: true,
                                userId: user.id,
                                userName: user.name,
                                rolePermissions: [],
                                customGrants: [],
                                loading: true,
                              });

                              const userPermissions = await roleService.getUserPermissions(user.id);

                              setViewPermissionsModal(prev => ({
                                ...prev,
                                rolePermissions: userPermissions.roles || [],
                                customGrants: userPermissions.customPermissions || [],
                                loading: false,
                              }));
                            } catch (error) {
                              console.error('Error loading permissions:', error);
                              notificationService.error('Failed to load permissions');
                              setViewPermissionsModal(prev => ({ ...prev, loading: false }));
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            isDarkMode ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-100 text-green-600'
                          }`}
                          title="View All Permissions"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const userPermissions = await roleService.getUserPermissions(user.id);
                              setEditUserModal({
                                open: true,
                                user: {
                                  ...user,
                                  role_ids: userPermissions.roles.map(r => r.id),
                                  roles: userPermissions.roles,
                                },
                              });
                              setSelectedUserRoles(userPermissions.roles.map(r => r.id));
                            } catch (error) {
                              console.error('Error loading user data:', error);
                              notificationService.error('Failed to load user data');
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Edit size={16} />
                        </button>
                        {isDirector && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const logs = await roleService.getAuditLog(user.id, 50);
                                  setAuditLogModal({ open: true, userId: user.id, logs });
                                } catch (error) {
                                  console.error('Error loading audit log:', error);
                                  notificationService.error('Failed to load audit log');
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                              }`}
                              title="View Audit Log"
                            >
                              <History size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setCustomPermissionModal({ open: true, userId: user.id });
                                setCustomPermission({
                                  permission_keys: [],
                                  reason: '',
                                  expires_at: null,
                                });
                                setPermissionSearch('');
                                setExpandedModules({});
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-yellow-600'
                              }`}
                              title="Grant Custom Permissions"
                            >
                              <UserCheck size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Created
                        </p>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatDateOnly(user.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last Login
                        </p>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatDateTime(user.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </SettingsCard>
              ))}
            </div>
          </div>
        </SettingsPaper>
      </div>

      {/* Right Column - Help Panel (40%) */}
      <div className="lg:w-2/5 lg:self-stretch lg:min-h-[600px]">
        <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto lg:sticky lg:top-6">
          <RolesHelpPanel />
        </div>
      </div>
    </div>
  );

  const renderUserManagementModals = () => (
    <>
      {/* Manage Roles Modal */}
      {showManageRolesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl max-h-[90vh] flex flex-col`}>
            {/* Modal Header */}
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Shield className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} size={24} />
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Manage Roles
                  </h3>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => {
                      setEditingRole(null);
                      setRoleFormData({ name: '', displayName: '', description: '', isDirector: false });
                      setShowRoleDialog(true);
                    }}
                  >
                    Create Role
                  </Button>
                  <button
                    onClick={() => setShowManageRolesModal(false)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                </div>
              </div>
            </div>

            {/* Roles List */}
            <div className="flex-1 overflow-y-auto p-6">
              {rolesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <CircularProgress size={32} />
                </div>
              ) : availableRoles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No roles found. Create your first role to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRoles.map((role) => (
                    <SettingsCard key={role.id}>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {role.displayName || role.display_name}
                              </h4>
                              {role.isDirector || role.is_director ? (
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  isDarkMode ? 'bg-purple-900/30 text-purple-400 border border-purple-600' : 'bg-purple-100 text-purple-700 border border-purple-300'
                                }`}>
                                  Director
                                </span>
                              ) : null}
                              {role.isSystem || role.is_system ? (
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  isDarkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-600' : 'bg-blue-100 text-blue-700 border border-blue-300'
                                }`}>
                                  System
                                </span>
                              ) : null}
                            </div>
                            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                              {role.name}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {role.description || 'No description'}
                            </p>
                            <div className="flex gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <Users size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {role.userCount || role.user_count || 0} users
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {role.permissionCount || role.permission_count || 0} permissions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingRole(role);
                                setRoleFormData({
                                  name: role.name,
                                  displayName: role.displayName || role.display_name,
                                  description: role.description || '',
                                  isDirector: role.isDirector || role.is_director || false,
                                });
                                setShowRoleDialog(true);
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                              }`}
                              title="Edit Role"
                            >
                              <Edit size={16} />
                            </button>
                            {!(role.isSystem || role.is_system) && (
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                title="Delete Role"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SettingsCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Role Dialog */}
      {showRoleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                <button
                  onClick={() => setShowRoleDialog(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <TextField
                label="Role Name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="e.g., sales_manager"
                helperText="Unique identifier (lowercase, underscores allowed)"
              />
              <TextField
                label="Display Name"
                value={roleFormData.displayName}
                onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                placeholder="e.g., Sales Manager"
                helperText="Friendly name shown to users"
              />
              <TextField
                label="Description"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                placeholder="Brief description of this role's purpose"
                multiline
                rows={3}
              />
              <div className="flex items-center gap-3">
                <Switch
                  checked={roleFormData.isDirector}
                  onChange={(e) => setRoleFormData({ ...roleFormData, isDirector: e.target.checked })}
                />
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Director Role
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Grants elevated privileges and access to sensitive operations
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
              <Button
                variant="outline"
                onClick={() => setShowRoleDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRole}
              >
                {editingRole ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add New User
                </h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            <form className="p-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => {
                    setNewUser({...newUser, name: e.target.value});
                    if (userValidationErrors.name) {
                      setUserValidationErrors({...userValidationErrors, name: null});
                    }
                  }}
                  placeholder="Enter full name"
                  error={userValidationErrors.name}
                  helperText={userValidationErrors.name}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({...newUser, email: e.target.value});
                    if (userValidationErrors.email) {
                      setUserValidationErrors({...userValidationErrors, email: null});
                    }
                  }}
                  placeholder="Enter email address"
                  error={userValidationErrors.email}
                  helperText={userValidationErrors.email}
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({...newUser, password: e.target.value});
                    if (userValidationErrors.password) {
                      setUserValidationErrors({...userValidationErrors, password: null});
                    }
                  }}
                  placeholder="Minimum 8 characters"
                  error={userValidationErrors.password}
                  helperText={userValidationErrors.password || 'Must be at least 8 characters'}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* Multi-Role Selection */}
              <div className="mt-6">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Assign Roles (select multiple) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map(role => (
                    <div
                      key={role.id}
                      onClick={() => {
                        const isSelected = selectedUserRoles.includes(role.id);
                        if (isSelected) {
                          setSelectedUserRoles(selectedUserRoles.filter(id => id !== role.id));
                        } else {
                          setSelectedUserRoles([...selectedUserRoles, role.id]);
                        }
                        if (userValidationErrors.roles) {
                          setUserValidationErrors({...userValidationErrors, roles: null});
                        }
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedUserRoles.includes(role.id)
                          ? isDarkMode
                            ? 'border-teal-500 bg-teal-900/20'
                            : 'border-teal-500 bg-teal-50'
                          : isDarkMode
                            ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {role.displayName}
                          </h5>
                          {role.description && (
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {role.description}
                            </p>
                          )}
                        </div>
                        {selectedUserRoles.includes(role.id) && (
                          <CheckCircle size={20} className="text-teal-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click on roles to select/deselect. Users can have multiple roles.
                </p>
                {userValidationErrors.roles && (
                  <p className="text-red-500 text-sm mt-2">{userValidationErrors.roles}</p>
                )}
              </div>
            </form>

            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUserModal(false);
                  setUserValidationErrors({});
                }}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Validate form
                  const errors = validateUserForm(newUser, false);
                  if (Object.keys(errors).length > 0) {
                    setUserValidationErrors(errors);
                    notificationService.warning('Please fix the validation errors');
                    return;
                  }

                  try {
                    setIsSubmittingUser(true);
                    
                    // 1. Create user via existing API
                    const userData = {
                      name: newUser.name.trim(),
                      email: newUser.email.trim(),
                      password: newUser.password,
                    };
                    const createdUser = await userAdminAPI.create(userData);

                    // 2. Assign selected roles
                    if (selectedUserRoles.length > 0) {
                      await roleService.assignRoles(createdUser.id, selectedUserRoles);
                    }

                    notificationService.success('User created successfully!');
                    setShowAddUserModal(false);
                    setUserValidationErrors({});
                    setNewUser({
                      name: '',
                      email: '',
                      password: '',
                      role_ids: [],
                    });
                    setSelectedUserRoles([]);

                    // Refresh user list
                    const remoteUsers = await userAdminAPI.list();
                    const mapped = await Promise.all(remoteUsers.map(async (u) => {
                      const userPerms = await roleService.getUserPermissions(u.id);
                      return {
                        id: String(u.id),
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        status: u.status || 'active',
                        createdAt: (u.createdAt || u.createdAt || '').toString().substring(0,10),
                        lastLogin: u.lastLogin || u.lastLogin || null,
                        roles: userPerms.roles || [],
                      };
                    }));
                    setUsers(mapped);
                  } catch (error) {
                    console.error('Error creating user:', error);
                    notificationService.error(error.response?.data?.error || 'Failed to create user');
                  } finally {
                    setIsSubmittingUser(false);
                  }
                }}
                disabled={isSubmittingUser}
                startIcon={isSubmittingUser ? <CircularProgress size={16} /> : <Save size={20} />}
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal.open && editUserModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Edit User
                </h3>
                <button
                  onClick={() => setEditUserModal({ open: false, user: null })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={editUserModal.user.name}
                  onChange={(e) => {
                    setEditUserModal(prev => ({ ...prev, user: { ...prev.user, name: e.target.value } }));
                    if (userValidationErrors.name) {
                      setUserValidationErrors({...userValidationErrors, name: null});
                    }
                  }}
                  placeholder="Enter full name"
                  error={userValidationErrors.name}
                  helperText={userValidationErrors.name}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editUserModal.user.email}
                  onChange={(e) => {
                    setEditUserModal(prev => ({ ...prev, user: { ...prev.user, email: e.target.value } }));
                    if (userValidationErrors.email) {
                      setUserValidationErrors({...userValidationErrors, email: null});
                    }
                  }}
                  placeholder="Enter email address"
                  error={userValidationErrors.email}
                  helperText={userValidationErrors.email}
                />
              </div>

              {/* Multi-Role Selection */}
              <div className="mt-6">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Assigned Roles (select multiple) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map(role => (
                    <div
                      key={role.id}
                      onClick={() => {
                        const isSelected = selectedUserRoles.includes(role.id);
                        if (isSelected) {
                          setSelectedUserRoles(selectedUserRoles.filter(id => id !== role.id));
                        } else {
                          setSelectedUserRoles([...selectedUserRoles, role.id]);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedUserRoles.includes(role.id)
                          ? isDarkMode
                            ? 'border-teal-500 bg-teal-900/20'
                            : 'border-teal-500 bg-teal-50'
                          : isDarkMode
                            ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {role.displayName}
                          </h5>
                          {role.description && (
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {role.description}
                            </p>
                          )}
                        </div>
                        {selectedUserRoles.includes(role.id) && (
                          <CheckCircle size={20} className="text-teal-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {userValidationErrors.roles && (
                  <p className="text-red-500 text-sm mt-2">{userValidationErrors.roles}</p>
                )}
              </div>
            </div>

            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
              <Button
                variant="outline"
                onClick={() => {
                  setEditUserModal({ open: false, user: null });
                  setUserValidationErrors({});
                }}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Validate form
                  const errors = validateUserForm(editUserModal.user, true);
                  if (Object.keys(errors).length > 0) {
                    setUserValidationErrors(errors);
                    notificationService.warning('Please fix the validation errors');
                    return;
                  }

                  try {
                    setIsSubmittingUser(true);
                    
                    // 1. Update user basic info
                    const userData = {
                      name: editUserModal.user.name.trim(),
                      email: editUserModal.user.email.trim(),
                    };
                    await userAdminAPI.update(editUserModal.user.id, userData);

                    // 2. Replace all roles
                    await roleService.replaceUserRoles(editUserModal.user.id, selectedUserRoles);

                    notificationService.success('User updated successfully!');
                    setEditUserModal({ open: false, user: null });
                    setUserValidationErrors({});

                    // Refresh user list
                    const remoteUsers = await userAdminAPI.list();
                    const mapped = await Promise.all(remoteUsers.map(async (u) => {
                      const userPerms = await roleService.getUserPermissions(u.id);
                      return {
                        id: String(u.id),
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        status: u.status || 'active',
                        createdAt: (u.createdAt || u.createdAt || '').toString().substring(0,10),
                        lastLogin: u.lastLogin || u.lastLogin || null,
                        roles: userPerms.roles || [],
                      };
                    }));
                    setUsers(mapped);
                  } catch (error) {
                    console.error('Error updating user:', error);
                    notificationService.error(error.response?.data?.error || 'Failed to update user');
                  } finally {
                    setIsSubmittingUser(false);
                  }
                }}
                disabled={isSubmittingUser}
                startIcon={isSubmittingUser ? <CircularProgress size={16} /> : <Save size={20} />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Permission Modal (Director Only) */}
      {customPermissionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl`}>
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Grant Custom Permissions
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select multiple permissions to grant temporary access
                  </p>
                </div>
                <button
                  onClick={() => setCustomPermissionModal({ open: false, userId: null })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className={`mb-4 p-4 rounded-lg border-l-4 ${
                isDarkMode
                  ? 'bg-yellow-900/20 border-yellow-500 text-yellow-300'
                  : 'bg-yellow-50 border-yellow-500 text-yellow-800'
              }`}>
                <div className="flex items-start">
                  <Shield size={20} className="mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Director Override</p>
                    <p>Grant one or more permissions to users temporarily. Use the search box to find permissions quickly, or select entire modules at once.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Selected Permissions Count */}
                {customPermission.permissionKeys.length > 0 && (
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-teal-900/20 border border-teal-700/30' : 'bg-teal-50 border border-teal-200'
                  }`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                      {customPermission.permissionKeys.length} permission{customPermission.permissionKeys.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}

                {/* Search Box */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                    Search Permissions
                  </label>
                  <input
                    type="text"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder="Search by permission name or description..."
                    className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Permission Checklist */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                    Select Permissions
                  </label>
                  <div className={`border rounded-lg max-h-64 overflow-y-auto ${
                    isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
                  }`}>
                    {Object.keys(allPermissions).length === 0 ? (
                      <div className="p-4 text-center">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Loading permissions...
                        </p>
                      </div>
                    ) : (
                      Object.entries(allPermissions)
                        .filter(([module, permissions]) => {
                          if (!permissionSearch) return true;
                          const search = permissionSearch.toLowerCase();
                          return module.toLowerCase().includes(search) ||
                                 permissions.some(p =>
                                   p.description.toLowerCase().includes(search) ||
                                   p.key.toLowerCase().includes(search),
                                 );
                        })
                        .map(([module, permissions]) => {
                          const filteredPerms = permissions.filter(p => {
                            if (!permissionSearch) return true;
                            const search = permissionSearch.toLowerCase();
                            return p.description.toLowerCase().includes(search) ||
                                   p.key.toLowerCase().includes(search);
                          });

                          if (filteredPerms.length === 0) return null;

                          const isExpanded = expandedModules[module] !== false; // Default to expanded
                          const modulePerms = filteredPerms.map(p => p.key);
                          const allSelected = modulePerms.every(k => customPermission.permissionKeys.includes(k));
                          const someSelected = modulePerms.some(k => customPermission.permissionKeys.includes(k));

                          return (
                            <div key={module} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}>
                              {/* Module Header */}
                              <div
                                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setExpandedModules(prev => ({ ...prev, [module]: !isExpanded }))}
                              >
                                <div className="flex items-center flex-1">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => {
                                      if (input) {
                                        input.indeterminate = someSelected && !allSelected;
                                      }
                                    }}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const newKeys = e.target.checked
                                        ? [...new Set([...customPermission.permissionKeys, ...modulePerms])]
                                        : customPermission.permissionKeys.filter(k => !modulePerms.includes(k));
                                      setCustomPermission({ ...customPermission, permission_keys: newKeys });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mr-3 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                  />
                                  <span className={`font-medium uppercase text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {module}
                                  </span>
                                  <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ({filteredPerms.length})
                                  </span>
                                </div>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>

                              {/* Module Permissions */}
                              {isExpanded && (
                                <div className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                  {filteredPerms.map(perm => (
                                    <label
                                      key={perm.key}
                                      className={`flex items-start p-3 pl-10 cursor-pointer transition-colors ${
                                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={customPermission.permissionKeys.includes(perm.key)}
                                        onChange={(e) => {
                                          const newKeys = e.target.checked
                                            ? [...customPermission.permissionKeys, perm.key]
                                            : customPermission.permissionKeys.filter(k => k !== perm.key);
                                          setCustomPermission({ ...customPermission, permission_keys: newKeys });
                                        }}
                                        className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      <div className="flex-1">
                                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                          {perm.description}
                                        </div>
                                        <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                          {perm.key}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                <TextField
                  label="Reason (required)"
                  value={customPermission.reason}
                  onChange={(e) => setCustomPermission({...customPermission, reason: e.target.value})}
                  placeholder="Explain why this permission is needed"
                  multiline
                  rows={2}
                />

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                    Expires At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={customPermission.expiresAt || ''}
                    onChange={(e) => setCustomPermission({...customPermission, expires_at: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Leave blank for permanent access
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex-shrink-0 ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
              <Button
                variant="outline"
                onClick={() => setCustomPermissionModal({ open: false, userId: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (customPermission.permissionKeys.length === 0 || !customPermission.reason) {
                      notificationService.warning('Please select at least one permission and provide a reason');
                      return;
                    }

                    // Grant all selected permissions
                    const results = await Promise.allSettled(
                      customPermission.permissionKeys.map(permKey =>
                        roleService.grantCustomPermission(
                          customPermissionModal.userId,
                          permKey,
                          customPermission.reason,
                          customPermission.expiresAt || null,
                        ),
                      ),
                    );

                    const succeeded = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.filter(r => r.status === 'rejected').length;

                    if (failed === 0) {
                      notificationService.success(
                        `Successfully granted ${succeeded} permission${succeeded !== 1 ? 's' : ''}!`,
                      );
                    } else if (succeeded > 0) {
                      notificationService.warning(
                        `Granted ${succeeded} permission${succeeded !== 1 ? 's' : ''}, but ${failed} failed`,
                      );
                    } else {
                      notificationService.error('Failed to grant permissions');
                    }

                    setCustomPermissionModal({ open: false, userId: null });
                  } catch (error) {
                    console.error('Error granting permissions:', error);
                    notificationService.error(error.response?.data?.error || 'Failed to grant permissions');
                  }
                }}
                startIcon={<Shield size={20} />}
                disabled={customPermission.permissionKeys.length === 0}
              >
                Grant {customPermission.permissionKeys.length > 0 ? `${customPermission.permissionKeys.length} ` : ''}Permission{customPermission.permissionKeys.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditLogModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Permission Audit Log
                </h3>
                <button
                  onClick={() => setAuditLogModal({ open: false, userId: null, logs: [] })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {auditLogModal.logs.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No audit log entries found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogModal.logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          log.action === 'grant'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : log.action === 'revoke'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {log.action.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Changed by:</strong> {log.changedByName}
                      </p>
                      {log.details && (
                        <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex justify-end`}>
              <Button
                variant="outline"
                onClick={() => setAuditLogModal({ open: false, userId: null, logs: [] })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View All Permissions Modal */}
      {viewPermissionsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl max-h-[90vh] flex flex-col`}>
            {/* Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    User Permissions
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {viewPermissionsModal.userName || 'User'} - Complete Permission Breakdown
                  </p>
                </div>
                <button
                  onClick={() => setViewPermissionsModal({ open: false, userId: null, userName: '', rolePermissions: [], customGrants: [], loading: false })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {viewPermissionsModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Permissions from Roles */}
                  {viewPermissionsModal.rolePermissions.length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <Shield className={`mr-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} size={20} />
                        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          From Assigned Roles
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {viewPermissionsModal.rolePermissions.map((role, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg border ${
                              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                            } p-3`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const RoleIcon = getRoleIcon(role.name);
                                  return <RoleIcon size={18} className={isDarkMode ? 'text-teal-400' : 'text-teal-600'} />;
                                })()}
                                <h5 className={`font-medium text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {role.displayName}
                                </h5>
                              </div>
                              {role.isDirector && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  Director
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <p className={`text-sm leading-snug mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {role.description}
                              </p>
                            )}
                            {role.permissions && role.permissions.length > 0 ? (
                              <div className="grid grid-cols-1 gap-1.5">
                                {role.permissions.map((perm, permIdx) => {
                                  const PermIcon = getPermissionIcon(perm.permissionKey || perm.description);
                                  return (
                                    <div
                                      key={permIdx}
                                      className={`flex items-center text-sm leading-tight ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}
                                    >
                                      <PermIcon size={13} className="mr-1.5 text-green-500 flex-shrink-0" />
                                      <span className="truncate" title={perm.description}>
                                        {perm.description || perm.permissionKey}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                No specific permissions defined (may have full access)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Permission Grants */}
                  {viewPermissionsModal.customGrants && viewPermissionsModal.customGrants.length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <UserCheck className={`mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} size={20} />
                        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Custom Permission Grants
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {viewPermissionsModal.customGrants.map((grant, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg border ${
                              isDarkMode ? 'bg-yellow-900/10 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'
                            } p-4`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <CheckCircle size={14} className="mr-2 text-yellow-500" />
                                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {grant.permissionKey}
                                  </span>
                                </div>
                                {grant.reason && (
                                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <strong>Reason:</strong> {grant.reason}
                                  </p>
                                )}
                                {grant.grantedByName && (
                                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <strong>Granted by:</strong> {grant.grantedByName}
                                  </p>
                                )}
                              </div>
                              {grant.expiresAt && (
                                <div className="ml-4">
                                  <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                                    new Date(grant.expiresAt) < new Date()
                                      ? (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                                      : (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700')
                                  }`}>
                                    <Clock size={12} className="mr-1" />
                                    Expires: {new Date(grant.expiresAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Permissions */}
                  {(viewPermissionsModal.rolePermissions.length === 0 &&
                   (!viewPermissionsModal.customGrants || viewPermissionsModal.customGrants.length === 0)) && (
                    <div className="text-center py-12">
                      <Shield size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h4 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        No Permissions Assigned
                      </h4>
                      <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        This user has no roles or custom permissions assigned.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex justify-end`}>
              <Button
                variant="outline"
                onClick={() => setViewPermissionsModal({ open: false, userId: null, userName: '', rolePermissions: [], customGrants: [], loading: false })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Printing & Documents Settings
  const renderPrintingSettings = () => {
    // Guard: Ensure printingSettings is loaded
    if (!printingSettings || Object.keys(printingSettings).length === 0) {
      return (
        <SettingsPaper>
          <div className="p-6 text-center">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Loading printing settings...
            </p>
          </div>
        </SettingsPaper>
      );
    }

    return (
      <SettingsPaper className="max-w-3xl">
        <SectionHeader icon={Printer} title="Printing & Document Settings" />

        {/* Receipt Settings */}
        <SectionCard title="Payment Receipt Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receipt Size */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Receipt Size
              </label>
              <select
                value={printingSettings.receipt_size || 'A5'}
                onChange={(e) => setPrintingSettings({...printingSettings, receipt_size: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="A5">A5 (148mm x 210mm) - Recommended</option>
                <option value="A6">A6 (105mm x 148mm) - Compact</option>
                <option value="A4">A4 (210mm x 297mm) - Full Page</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select the size for payment receipt PDFs
              </p>
            </div>

            {/* Print On Paper Size */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Print On Paper Size
              </label>
              <select
                value={printingSettings.print_on_paper_size || 'A4'}
                onChange={(e) => setPrintingSettings({...printingSettings, print_on_paper_size: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="A4">A4 (210mm x 297mm)</option>
                <option value="A5">A5 (148mm x 210mm)</option>
                <option value="A6">A6 (105mm x 148mm)</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Physical paper size loaded in printer
              </p>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200'} border`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className={`${isDarkMode ? 'text-teal-400' : 'text-teal-600'} flex-shrink-0 mt-0.5`} />
              <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <strong className={isDarkMode ? 'text-teal-300' : 'text-teal-700'}>Example:</strong> If Receipt Size = A5 and Print On = A4, the receipt will be A5 size centered on A4 paper.
              This is the most economical setting for standard printers.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Printer Selection */}
        <SectionCard title="Printer Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receipt Printer */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Receipt Printer
              </label>
              <select
                value={printingSettings.receipt_printer || 'default'}
                onChange={(e) => setPrintingSettings({...printingSettings, receipt_printer: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="default">Default Printer</option>
                <option value="receipt_printer">Receipt Printer (if available)</option>
                <option value="pdf_only">Save as PDF Only (No Print)</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Printer for payment receipts
              </p>
            </div>

            {/* Invoice Printer */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Invoice Printer
              </label>
              <select
                value={printingSettings.invoice_printer || 'default'}
                onChange={(e) => setPrintingSettings({...printingSettings, invoice_printer: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="default">Default Printer</option>
                <option value="main_printer">Main Office Printer</option>
                <option value="pdf_only">Save as PDF Only (No Print)</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Printer for invoices and documents
              </p>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200'} border`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className={`${isDarkMode ? 'text-teal-400' : 'text-teal-600'} flex-shrink-0 mt-0.5`} />
              <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <strong className={isDarkMode ? 'text-teal-300' : 'text-teal-700'}>Note:</strong> Printer selection works when using the browser&apos;s print dialog.
              For automatic printing, configure your browser&apos;s default printer settings.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Document Copies */}
        <SectionCard title="Document Copies">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Receipt Copies */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Receipt Copies
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={printingSettings.receipt_copies || 1}
                onChange={(e) => setPrintingSettings({...printingSettings, receipt_copies: parseInt(e.target.value) || 1})}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Number of copies to print
              </p>
            </div>

            {/* Invoice Copies */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Invoice Copies
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={printingSettings.invoice_copies || 1}
                onChange={(e) => setPrintingSettings({...printingSettings, invoice_copies: parseInt(e.target.value) || 1})}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Number of copies to print
              </p>
            </div>

            {/* Auto Print */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Auto Print
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printingSettings.auto_print_receipts || false}
                    onChange={(e) => setPrintingSettings({...printingSettings, auto_print_receipts: e.target.checked})}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Auto print receipts
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printingSettings.auto_print_invoices || false}
                    onChange={(e) => setPrintingSettings({...printingSettings, auto_print_invoices: e.target.checked})}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Auto print invoices
                  </span>
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={resetPrintingSettings}
          >
          Reset to Defaults
          </Button>
          <Button
            startIcon={<Save size={20} />}
            onClick={savePrintingSettings}
            disabled={savingPrintingSettings}
          >
            {savingPrintingSettings ? 'Saving...' : 'Save Printing Settings'}
          </Button>
        </div>
      </SettingsPaper>
    );
  };

  const renderProductNamingSystem = () => {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Column - Actionable Content (60%) */}
        <div className="lg:w-3/5 space-y-4">
          <div className={`rounded-xl shadow-sm border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h3 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📘 Product Naming Formats
                </h3>
                <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  These are the naming patterns used across the system for all stainless-steel products.
                  They define how Unique ID and Display Name are structured.
                </p>
              </div>

              {/* Sheets / Plates */}
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Circle size={8} className={`fill-current ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  Sheets / Plates
                </h4>
                <div className={`p-2 rounded font-mono text-base ${
                  isDarkMode ? 'bg-gray-800 text-teal-400' : 'bg-white text-teal-700'
                }`}>
                  SS-{'{Grade}'}-Sheet-{'{Finish}'}-{'{Width}'}mm-{'{Thickness}'}mm-{'{Length}'}mm-{'{Origin}'}-{'{Mill}'}
                </div>
              </div>

              {/* Pipes */}
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Circle size={8} className={`fill-current ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  Pipes
                </h4>
                <div className={`p-2 rounded font-mono text-base ${
                  isDarkMode ? 'bg-gray-800 text-teal-400' : 'bg-white text-teal-700'
                }`}>
                  SS-{'{Grade}'}-Pipe-{'{Finish}'}-{'{Diameter}'}{'{Unit}'}-{'{Schedule}'}-{'{Origin}'}-{'{Mill}'}
                </div>
              </div>

              {/* Tubes */}
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Circle size={8} className={`fill-current ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  Tubes
                </h4>
                <div className={`p-2 rounded font-mono text-base ${
                  isDarkMode ? 'bg-gray-800 text-teal-400' : 'bg-white text-teal-700'
                }`}>
                  SS-{'{Grade}'}-Tube-{'{Finish}'}-{'{OuterDiameter}'}{'{Unit}'}-{'{Thickness}'}mm-{'{Origin}'}-{'{Mill}'}
                </div>
              </div>

              {/* Coils */}
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Circle size={8} className={`fill-current ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  Coils
                </h4>
                <div className={`p-2 rounded font-mono text-base ${
                  isDarkMode ? 'bg-gray-800 text-teal-400' : 'bg-white text-teal-700'
                }`}>
                  SS-{'{Grade}'}-Coil-{'{Finish}'}-{'{Width}'}mm-{'{Thickness}'}mm-{'{Origin}'}-{'{Mill}'}
                </div>
              </div>

              {/* Bars */}
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Circle size={8} className={`fill-current ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  Bars
                </h4>
                <div className={`p-2 rounded font-mono text-base ${
                  isDarkMode ? 'bg-gray-800 text-teal-400' : 'bg-white text-teal-700'
                }`}>
                  SS-{'{Grade}'}-Bar-{'{Subtype}'}-{'{Finish}'}-{'{Dimensions}'}-{'{Length}'}mm-{'{Origin}'}-{'{Mill}'}
                </div>
              </div>

              {/* Angle Bar */}
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Circle size={8} className={`fill-current ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  Angle Bar
                </h4>
                <div className={`p-2 rounded font-mono text-base ${
                  isDarkMode ? 'bg-gray-800 text-teal-400' : 'bg-white text-teal-700'
                }`}>
                  SS-{'{Grade}'}-Angle-{'{Subtype}'}-{'{Finish}'}-{'{LegA}'}mm-{'{LegB}'}mm-{'{Thickness}'}mm-{'{Length}'}mm-{'{Origin}'}-{'{Mill}'}
                </div>
              </div>

              {/* Verify Button */}
              <div className={`mt-6 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🔍 Verify Naming Logic
                </h4>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Checks whether DB, backend, and UI naming patterns match this specification
                </p>
                <Button
                  onClick={() => {
                    // Logic will be implemented later
                    console.log('Verify naming logic clicked');
                  }}
                  className="w-full"
                >
                  Verify Naming Patterns
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documentation/Help (40%) */}
        <div className="lg:w-2/5 lg:self-stretch">
          <div className={`h-full rounded-xl shadow-sm border overflow-hidden ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              {/* Empty - Ready for documentation/help content */}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isAdmin = authService.hasRole('admin');
  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: Building },
    { id: 'templates', label: 'Document Templates', icon: FileText },
    { id: 'printing', label: 'Printing & Documents', icon: Printer },
    { id: 'tax', label: 'VAT Rates', icon: Calculator },
    { id: 'fta', label: 'FTA Integration', icon: Key },
    { id: 'product-naming', label: 'Product Naming System', icon: Tag },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ];

  // Debug logging
  console.log('CompanySettings isDarkMode:', isDarkMode);

  return (
    <div className={`p-4 md:p-6 lg:p-8 min-h-screen w-full overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      {/* Header Section */}
      <div className={`mb-6 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Settings size={28} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
            <div>
              <h1 className={`text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Company Settings
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your company profile, invoice templates, taxes, and users
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs - Pill style for clarity, wraps on small screens */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-y border-[#37474F]' : 'bg-white border-y border-gray-200'}`}>
          <div className={`flex flex-wrap gap-2 p-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={isActive}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors duration-200 ${
                    isDarkMode
                      ? (isActive
                        ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                        : 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white')
                      : (isActive
                        ? 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800'
                        : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'templates' && renderInvoiceTemplates()}
        {activeTab === 'printing' && renderPrintingSettings()}
        {activeTab === 'tax' && renderVatSettings()}
        {activeTab === 'fta' && <FTAIntegrationSettings embedded />}
        {activeTab === 'product-naming' && renderProductNamingSystem()}
        {isAdmin && activeTab === 'users' && (
          <>
            {renderUserManagement()}
            {renderUserManagementModals()}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;
