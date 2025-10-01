import React, { useState, useEffect } from 'react';
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
  Palette,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { companyService } from '../services/companyService';
import { templateService } from '../services/templateService';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';

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

const Select = ({ label, options, value, onChange, placeholder = "Select...", className = '' }) => {
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

const LogoContainer = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`w-40 h-40 rounded-lg border-2 border-dashed flex items-center justify-center ${
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

const TextField = ({ label, value, onChange, placeholder, multiline, rows, startAdornment, endAdornment, error, helperText, disabled = false, type = 'text', className = '' }) => {
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
            className={`w-full px-3 ${startAdornment ? 'pl-10' : ''} ${endAdornment ? 'pr-10' : ''} py-2 border rounded-lg resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
            } ${
              isDarkMode 
                ? 'bg-gray-800 text-white placeholder-gray-400' 
                : 'bg-white text-gray-900 placeholder-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 ${startAdornment ? 'pl-10' : ''} ${endAdornment ? 'pr-10' : ''} py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              error ? 'border-red-500' : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
            } ${
              isDarkMode 
                ? 'bg-gray-800 text-white placeholder-gray-400' 
                : 'bg-white text-gray-900 placeholder-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
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
  
  const { data: companyData, loading: loadingCompany, refetch: refetchCompany } = useApiData(
    companyService.getCompany,
    []
  );
  
  const { data: templatesData, loading: loadingTemplates, refetch: refetchTemplates } = useApiData(
    templateService.getTemplates,
    []
  );
  
  const { execute: updateCompany, loading: updatingCompany } = useApi(companyService.updateCompany);
  const { execute: uploadLogo, loading: uploadingLogo } = useApi(companyService.uploadLogo);
  const { execute: deleteLogo } = useApi(companyService.deleteLogo);
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
    gstNumber: '',
    panNumber: '',
    trnNumber: '',
    logo: null,
    bankDetails: {
      bankName: '',
      accountNumber: '',
      iban: ''
    }
  });

  useEffect(() => {
    if (companyData) {
      setCompanyProfile({
        ...companyData,
        address: typeof companyData.address === 'string' ? companyData.address : (companyData.address?.street || ''),
        bankDetails: companyData.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: ''
        }
      });
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
    dueDays: ''
  });

  const [taxSettings, setTaxSettings] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
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
      settings: { read: false, update: false }
    }
  });

  const [newTax, setNewTax] = useState({
    name: '',
    rate: '',
    type: 'percentage',
    description: '',
    active: true
  });

  const [showPassword, setShowPassword] = useState(false);

  const templateStyles = [
    { id: 'modern', name: 'Modern', description: 'Clean and professional design' },
    { id: 'classic', name: 'Classic', description: 'Traditional business format' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant layout' },
    { id: 'detailed', name: 'Detailed', description: 'Comprehensive information display' }
  ];

  const userRoles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'manager', name: 'Manager', description: 'Manage operations and view reports' },
    { id: 'user', name: 'User', description: 'Basic access to create invoices' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access' }
  ];

  useEffect(() => {
    // Load invoice settings from database
    if (templatesData && templatesData.length > 0) {
      const defaultTemplate = templatesData.find(t => t.is_default) || templatesData[0];
      setInvoiceSettings({
        templateStyle: defaultTemplate.template_style,
        primaryColor: defaultTemplate.primary_color,
        showLogo: defaultTemplate.show_logo,
        showBankDetails: defaultTemplate.show_bank_details,
        footer: defaultTemplate.footer_text || '',
        terms: defaultTemplate.terms_and_conditions || '',
        invoiceNumberFormat: defaultTemplate.invoice_number_format,
        dueDays: defaultTemplate.default_due_days
      });
    }

    // Load tax and user settings (still using localStorage for now)
    const savedTaxSettings = localStorage.getItem('steel-app-tax-settings');
    const savedUsers = localStorage.getItem('steel-app-users');

    if (savedTaxSettings) {
      setTaxSettings(JSON.parse(savedTaxSettings));
    } else {
      // Default tax settings for UAE
      const defaultTaxes = [
        { id: '1', name: 'TRN', rate: 5, type: 'percentage', description: 'UAE Tax Registration Number', active: true },
        { id: '2', name: 'Zero TRN', rate: 0, type: 'percentage', description: 'Zero-rated TRN for eligible items', active: false },
        { id: '3', name: 'Exempt TRN', rate: 0, type: 'percentage', description: 'TRN-exempt items', active: false }
      ];
      setTaxSettings(defaultTaxes);
    }

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Default users
      const defaultUsers = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@steelindustries.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-01',
          lastLogin: '2024-12-14',
          permissions: {
            invoices: { create: true, read: true, update: true, delete: true },
            customers: { create: true, read: true, update: true, delete: true },
            products: { create: true, read: true, update: true, delete: true },
            analytics: { read: true },
            settings: { read: true, update: true }
          }
        },
        {
          id: '2',
          name: 'Sales Manager',
          email: 'manager@steelindustries.com',
          role: 'manager',
          status: 'active',
          createdAt: '2024-02-15',
          lastLogin: '2024-12-13',
          permissions: {
            invoices: { create: true, read: true, update: true, delete: false },
            customers: { create: true, read: true, update: true, delete: false },
            products: { create: false, read: true, update: false, delete: false },
            analytics: { read: true },
            settings: { read: false, update: false }
          }
        }
      ];
      setUsers(defaultUsers);
    }
  }, [templatesData]);

  const saveCompanyProfile = async () => {
    try {
      // Validate required fields
      if (!companyProfile.name || companyProfile.name.trim() === '') {
        alert('Company name is required');
        return;
      }

      const companyData = {
        name: companyProfile.name.trim(),
        address: {
          street: companyProfile.address || '',
          city: companyProfile.city || '',
          country: companyProfile.country || 'UAE'
        },
        phone: companyProfile.phone || '',
        email: companyProfile.email || '',
        vat_number: companyProfile.gstNumber || '',
        trn_number: companyProfile.trnNumber || '',
        logo_url: companyProfile.logo_url || null,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: ''
        }
      };
      
      console.log('Sending company data:', companyData);
      
      await updateCompany(companyData);
      alert('Company profile saved successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error saving company profile:', error);
      alert('Failed to save company profile. Please try again.');
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
        is_default: true
      };

      if (templatesData && templatesData.length > 0) {
        const defaultTemplate = templatesData.find(t => t.is_default) || templatesData[0];
        await updateTemplate(defaultTemplate.id, templateData);
      } else {
        await createTemplate(templateData);
      }

      alert('Invoice settings saved successfully!');
      refetchTemplates();
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      alert('Failed to save invoice settings. Please try again.');
    }
  };

  const saveTaxSettings = () => {
    localStorage.setItem('steel-app-tax-settings', JSON.stringify(taxSettings));
  };

  const saveUsers = () => {
    localStorage.setItem('steel-app-users', JSON.stringify(users));
  };

  const handleLogoUpload = async (event) => {
    console.log('handleLogoUpload called', event);
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      console.log('Uploading file:', file.name);
      const response = await uploadLogo(file);
      console.log('Upload response:', response);
      
      // Update company profile with new logo URL
      const newLogoUrl = `http://localhost:5000${response.logoUrl}`;
      setCompanyProfile(prev => ({ ...prev, logo_url: newLogoUrl }));
      
      // Save to database
      const companyData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.gstNumber,
        logo_url: newLogoUrl,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: ''
        }
      };
      await updateCompany(companyData);
      
      alert('Logo uploaded successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    }
  };

  const handleLogoDelete = async () => {
    if (!companyProfile.logo_url) return;

    if (!window.confirm('Are you sure you want to delete the company logo?')) {
      return;
    }

    try {
      // Extract filename from URL
      const filename = companyProfile.logo_url.split('/').pop();
      
      if (filename && filename.startsWith('company-logo-')) {
        await deleteLogo(filename);
      }
      
      // Update company profile
      setCompanyProfile(prev => ({ ...prev, logo_url: null }));
      
      // Save to database
      const companyData = {
        name: companyProfile.name,
        address: {
          street: companyProfile.address,
          city: companyProfile.city,
          country: companyProfile.country
        },
        phone: companyProfile.phone,
        email: companyProfile.email,
        vat_number: companyProfile.gstNumber,
        logo_url: null,
        bankDetails: companyProfile.bankDetails || {
          bankName: '',
          accountNumber: '',
          iban: ''
        }
      };
      await updateCompany(companyData);
      
      alert('Logo deleted successfully!');
      refetchCompany();
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Failed to delete logo. Please try again.');
    }
  };

  const handleAddUser = () => {
    const user = {
      ...newUser,
      id: Date.now().toString(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: null
    };
    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    saveUsers();
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
        settings: { read: false, update: false }
      }
    });
    setShowAddUserModal(false);
  };

  const handleAddTax = () => {
    const tax = {
      ...newTax,
      id: Date.now().toString(),
      rate: newTax.rate === '' ? 0 : Number(newTax.rate)
    };
    const updatedTaxes = [...taxSettings, tax];
    setTaxSettings(updatedTaxes);
    saveTaxSettings();
    setNewTax({
      name: '',
      rate: '',
      type: 'percentage',
      description: '',
      active: true
    });
    setShowAddTaxModal(false);
  };

  const toggleTaxActive = (taxId) => {
    const updatedTaxes = taxSettings.map(tax =>
      tax.id === taxId ? { ...tax, active: !tax.active } : tax
    );
    setTaxSettings(updatedTaxes);
    saveTaxSettings();
  };

  const deleteTax = (taxId) => {
    if (window.confirm('Are you sure you want to delete this tax setting?')) {
      const updatedTaxes = taxSettings.filter(tax => tax.id !== taxId);
      setTaxSettings(updatedTaxes);
      saveTaxSettings();
    }
  };

  const toggleUserStatus = (userId) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { 
        ...user, 
        status: user.status === 'active' ? 'inactive' : 'active' 
      } : user
    );
    setUsers(updatedUsers);
    saveUsers();
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      saveUsers();
    }
  };

  const handleRoleChange = (role) => {
    let permissions = {
      invoices: { create: false, read: false, update: false, delete: false },
      customers: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: false, update: false, delete: false },
      analytics: { read: false },
      settings: { read: false, update: false }
    };

    switch (role) {
      case 'admin':
        permissions = {
          invoices: { create: true, read: true, update: true, delete: true },
          customers: { create: true, read: true, update: true, delete: true },
          products: { create: true, read: true, update: true, delete: true },
          analytics: { read: true },
          settings: { read: true, update: true }
        };
        break;
      case 'manager':
        permissions = {
          invoices: { create: true, read: true, update: true, delete: false },
          customers: { create: true, read: true, update: true, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: true },
          settings: { read: false, update: false }
        };
        break;
      case 'user':
        permissions = {
          invoices: { create: true, read: true, update: false, delete: false },
          customers: { create: false, read: true, update: false, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: false },
          settings: { read: false, update: false }
        };
        break;
      case 'viewer':
        permissions = {
          invoices: { create: false, read: true, update: false, delete: false },
          customers: { create: false, read: true, update: false, delete: false },
          products: { create: false, read: true, update: false, delete: false },
          analytics: { read: true },
          settings: { read: false, update: false }
        };
        break;
    }

    setNewUser({ ...newUser, role, permissions });
  };

  const renderProfile = () => (
    <SettingsPaper>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
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

        <div className="space-y-6">
          {/* Logo Section */}
          <SettingsCard>
            <div className="p-6">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Company Logo
              </h4>
              
              <div className="flex space-x-6 items-start">
                <LogoContainer>
                  {companyProfile.logo_url ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={companyProfile.logo_url} 
                        alt="Company Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        onClick={handleLogoDelete}
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
                
                <div className="space-y-3">
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
                      startIcon={uploadingLogo ? <Upload size={16} className="animate-spin" /> : <Upload size={16} />}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Basic Information */}
          <SettingsCard>
            <div className="p-6">
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
                  label="Phone"
                  type="tel"
                  value={companyProfile.phone || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, phone: e.target.value})}
                  placeholder="Enter phone number"
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
            <div className="p-6">
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
                <TextField
                  label="TRN Number"
                  value={companyProfile.trnNumber || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, trnNumber: e.target.value})}
                  placeholder="Enter TRN number"
                />
                <Select
                  label="Country"
                  value={companyProfile.country || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, country: e.target.value})}
                  options={[
                    { value: 'India', label: 'India' },
                    { value: 'United States', label: 'United States' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'Australia', label: 'Australia' }
                  ]}
                />
              </div>
            </div>
          </SettingsCard>

          {/* Tax Information */}
          <SettingsCard>
            <div className="p-6">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Tax Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="PAN Number"
                  value={companyProfile.panNumber || ''}
                  onChange={(e) => setCompanyProfile({...companyProfile, panNumber: e.target.value})}
                  placeholder="Enter PAN number"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Bank Details */}
          <SettingsCard>
            <div className="p-6">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Bank Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Bank Name"
                  value={companyProfile.bankDetails?.bankName || ''}
                  onChange={(e) => setCompanyProfile({
                    ...companyProfile,
                    bankDetails: {...(companyProfile.bankDetails || {}), bankName: e.target.value}
                  })}
                  placeholder="Enter bank name"
                />
                <TextField
                  label="Account Number"
                  value={companyProfile.bankDetails?.accountNumber || ''}
                  onChange={(e) => setCompanyProfile({
                    ...companyProfile,
                    bankDetails: {...(companyProfile.bankDetails || {}), accountNumber: e.target.value}
                  })}
                  placeholder="Enter account number"
                />
                <TextField
                  label="IBAN"
                  value={companyProfile.bankDetails?.iban || ''}
                  onChange={(e) => setCompanyProfile({
                    ...companyProfile,
                    bankDetails: {...(companyProfile.bankDetails || {}), iban: e.target.value}
                  })}
                  placeholder="Enter IBAN"
                />
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>
    </SettingsPaper>
  );

  const renderInvoiceTemplates = () => (
    <SettingsPaper>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice Templates
          </h3>
          <Button
            variant="primary"
            startIcon={(creatingTemplate || updatingTemplate) ? <CircularProgress size={16} /> : <Save size={16} />}
            onClick={saveInvoiceSettings}
            disabled={creatingTemplate || updatingTemplate}
          >
            {creatingTemplate || updatingTemplate ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Customization Options */}
          <SettingsCard>
            <div className="p-6">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Customization
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={invoiceSettings.primaryColor}
                        onChange={(e) => setInvoiceSettings({...invoiceSettings, primaryColor: e.target.value})}
                        className="w-10 h-10 border-0 rounded-lg cursor-pointer"
                      />
                      <span className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {invoiceSettings.primaryColor}
                      </span>
                    </div>
                  </div>
                </div>
                <TextField
                  label="Due Days"
                  type="number"
                  value={invoiceSettings.dueDays || ''}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, dueDays: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                  placeholder="Default due days"
                />
                <div className="md:col-span-2">
                  <TextField
                    label="Invoice Number Format"
                    value={invoiceSettings.invoiceNumberFormat}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, invoiceNumberFormat: e.target.value})}
                    placeholder="e.g., INV-{YYYY}-{MM}-{###}"
                    helperText="Use {YYYY} for year, {MM} for month, {###} for number"
                  />
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Display Options */}
          <SettingsCard>
            <div className="p-6">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Display Options
              </h4>
              
              <div className="space-y-3">
                <Checkbox
                  checked={invoiceSettings.showLogo}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, showLogo: e.target.checked})}
                  label="Show company logo"
                />
                <Checkbox
                  checked={invoiceSettings.showBankDetails}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, showBankDetails: e.target.checked})}
                  label="Show bank details"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Default Text */}
          <SettingsCard>
            <div className="p-6">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Default Text
              </h4>
              
              <div className="space-y-4">
                <TextField
                  label="Footer Text"
                  multiline
                  rows={3}
                  value={invoiceSettings.footer}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, footer: e.target.value})}
                  placeholder="Enter footer text"
                />
                <TextField
                  label="Terms & Conditions"
                  multiline
                  rows={4}
                  value={invoiceSettings.terms}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, terms: e.target.value})}
                  placeholder="Enter terms and conditions"
                />
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>
    </SettingsPaper>
  );

  const renderTaxSettings = () => (
    <div className={`rounded-2xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Tax Settings
          </h3>
          <Button
            onClick={() => setShowAddTaxModal(true)}
            startIcon={<Plus size={16} />}
          >
            Add Tax
          </Button>
        </div>

        <div className="space-y-4">
          {taxSettings.map(tax => (
            <div 
              key={tax.id} 
              className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
              } ${tax.active ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tax.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${
                      isDarkMode 
                        ? 'text-teal-400 border-teal-600 bg-teal-900/20' 
                        : 'text-teal-600 border-teal-300 bg-teal-50'
                    }`}>
                      {tax.rate}%
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${
                      isDarkMode 
                        ? 'text-gray-400 border-gray-600 bg-gray-800' 
                        : 'text-gray-600 border-gray-300 bg-gray-50'
                    }`}>
                      {tax.type}
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {tax.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tax.active}
                      onChange={() => toggleTaxActive(tax.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                  </label>
                  <span className={`text-sm font-medium ${
                    tax.active 
                      ? 'text-green-500' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {tax.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => deleteTax(tax.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Tax Modal */}
      {showAddTaxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Tax Setting
                </h3>
                <button
                  onClick={() => setShowAddTaxModal(false)}
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
                  label="Tax Name"
                  value={newTax.name}
                  onChange={(e) => setNewTax({...newTax, name: e.target.value})}
                  placeholder="Enter tax name (e.g., TRN)"
                />
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  value={newTax.rate || ''}
                  onChange={(e) => setNewTax({...newTax, rate: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                  placeholder="Enter tax rate"
                />
                <Select
                  label="Type"
                  value={newTax.type}
                  onChange={(e) => setNewTax({...newTax, type: e.target.value})}
                  options={[
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'fixed', label: 'Fixed Amount' }
                  ]}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={newTax.description}
                    onChange={(e) => setNewTax({...newTax, description: e.target.value})}
                    placeholder="Enter tax description"
                  />
                </div>
              </div>
            </div>
            
            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
              <Button
                variant="outline"
                onClick={() => setShowAddTaxModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTax}
                startIcon={<Save size={20} />}
              >
                Add Tax
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUserManagement = () => (
    <SettingsPaper>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </h3>
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </Button>
        </div>

        <div className="space-y-4">
          {users.map(user => (
            <SettingsCard key={user.id} className={user.status === 'active' ? '' : 'opacity-60'}>
              <div className="p-6">
                {/* User Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                      isDarkMode ? 'bg-teal-600' : 'bg-teal-500'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.name}
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded border ${
                        isDarkMode 
                          ? 'text-teal-400 border-teal-600 bg-teal-900/20' 
                          : 'text-teal-600 border-teal-300 bg-teal-50'
                      }`}>
                        {userRoles.find(r => r.id === user.role)?.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={user.status === 'active'}
                      onChange={() => toggleUserStatus(user.id)}
                      label={user.status === 'active' ? 'Active' : 'Inactive'}
                    />
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Created
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.createdAt}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last Login
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.lastLogin || 'Never'}
                    </p>
                  </div>
                </div>

                {/* User Permissions */}
                <div className={`border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <details className="group">
                    <summary className={`flex justify-between items-center p-3 cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Permissions
                      </span>
                      <ChevronDown size={16} className={`transition-transform group-open:rotate-180 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </summary>
                    <div className={`p-3 border-t space-y-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {Object.entries(user.permissions).map(([module, perms]) => (
                        <div key={module} className="flex justify-between items-center">
                          <span className={`text-sm font-medium capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {module}
                          </span>
                          <div className="flex space-x-1">
                            {typeof perms === 'object' ? (
                              Object.entries(perms).map(([action, allowed]) => (
                                <span
                                  key={action}
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    allowed
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  {action.charAt(0).toUpperCase()}
                                </span>
                              ))
                            ) : (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  perms
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                R
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </SettingsCard>
          ))}
        </div>
      </div>

      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl rounded-2xl ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} shadow-2xl max-h-[90vh] overflow-y-auto`}>
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
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                />
                <div>
                  <Select
                    label="Role"
                    value={newUser.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    options={userRoles.map(role => ({ value: role.id, label: role.name }))}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {userRoles.find(r => r.id === newUser.role)?.description}
                  </p>
                </div>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
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

              <div className="mt-6">
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Permissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(newUser.permissions).map(([module, perms]) => (
                    <SettingsCard key={module}>
                      <div className="p-4">
                        <h5 className={`text-sm font-semibold mb-3 capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {module}
                        </h5>
                        <div className="space-y-2">
                          {typeof perms === 'object' ? (
                            Object.entries(perms).map(([action, allowed]) => (
                              <Checkbox
                                key={action}
                                checked={allowed}
                                onChange={(e) => setNewUser({
                                  ...newUser,
                                  permissions: {
                                    ...newUser.permissions,
                                    [module]: {
                                      ...newUser.permissions[module],
                                      [action]: e.target.checked
                                    }
                                  }
                                })}
                                label={action.charAt(0).toUpperCase() + action.slice(1)}
                              />
                            ))
                          ) : (
                            <Checkbox
                              checked={perms}
                              onChange={(e) => setNewUser({
                                ...newUser,
                                permissions: {
                                  ...newUser.permissions,
                                  [module]: { read: e.target.checked }
                                }
                              })}
                              label="Read"
                            />
                          )}
                        </div>
                      </div>
                    </SettingsCard>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'} flex gap-3 justify-end`}>
              <Button
                variant="outline"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                startIcon={<Save size={20} />}
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}
    </SettingsPaper>
  );

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: Building },
    { id: 'templates', label: 'Invoice Templates', icon: FileText },
    { id: 'tax', label: 'Tax Settings', icon: Calculator },
    { id: 'users', label: 'User Management', icon: Users },
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
        
        {/* Tabs */}
        <div className={`border-t ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className={`flex overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    color: isActive 
                      ? (isDarkMode ? '#34d399' : '#059669')
                      : (isDarkMode ? '#9ca3af' : '#6b7280')
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-teal-500'
                      : 'border-transparent hover:opacity-75'
                  }`}
                >
                  <Icon size={20} />
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
        {activeTab === 'tax' && renderTaxSettings()}
        {activeTab === 'users' && renderUserManagement()}
      </div>
    </div>
  );
};

export default CompanySettings;