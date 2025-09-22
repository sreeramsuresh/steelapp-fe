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
const Button = ({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '', startIcon, ...props }) => {
  const { isDarkMode } = useTheme();
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
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

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
    </button>
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
      ifscCode: '',
      accountHolderName: ''
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
          ifscCode: '',
          accountHolderName: ''
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
        logo_url: companyProfile.logo_url || null
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
    const file = event.target.files[0];
    if (!file) return;

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
      const response = await uploadLogo(file);
      
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
        logo_url: newLogoUrl
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
        logo_url: null
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
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
            Company Profile
          </Typography>
          <Button
            variant="contained"
            startIcon={updatingCompany ? <CircularProgress size={16} /> : <Save size={16} />}
            onClick={saveCompanyProfile}
            disabled={updatingCompany}
          >
            {updatingCompany ? 'Saving...' : 'Save Profile'}
          </Button>
        </Stack>

        <Stack spacing={4}>
          {/* Logo Section */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Company Logo
              </Typography>
              
              <Stack direction="row" spacing={3} alignItems="flex-start">
                <LogoContainer>
                  {companyProfile.logo_url ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img 
                        src={companyProfile.logo_url} 
                        alt="Company Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': { backgroundColor: 'error.dark' }
                        }}
                        size="small"
                        onClick={handleLogoDelete}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Stack alignItems="center" spacing={1}>
                      <Camera size={32} />
                      <Typography variant="body2">Upload Logo</Typography>
                    </Stack>
                  )}
                </LogoContainer>
                
                <Stack spacing={2}>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    component="label"
                    htmlFor="logo-upload"
                    variant="outlined"
                    startIcon={uploadingLogo ? <CircularProgress size={16} /> : <Upload size={16} />}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </SettingsCard>

          {/* Basic Information */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={companyProfile.name || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, name: e.target.value})}
                    placeholder="Enter company name"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={companyProfile.email || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, email: e.target.value})}
                    placeholder="Enter email address"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Phone"
                    type="tel"
                    value={companyProfile.phone || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, phone: e.target.value})}
                    placeholder="Enter phone number"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Website"
                    type="url"
                    value={companyProfile.website || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, website: e.target.value})}
                    placeholder="Enter website URL"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Globe size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </SettingsCard>

          {/* Address Information */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Address Information
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={typeof companyProfile.address === 'string' ? companyProfile.address : (companyProfile.address?.street || '')}
                    onChange={(e) => setCompanyProfile({...companyProfile, address: e.target.value})}
                    placeholder="Enter street address"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapPin size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="City"
                    value={companyProfile.city || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="TRN Number"
                    value={companyProfile.trnNumber || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, trnNumber: e.target.value})}
                    placeholder="Enter TRN number"
                  />
                </Box>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={companyProfile.country || ''}
                      onChange={(e) => setCompanyProfile({...companyProfile, country: e.target.value})}
                      label="Country"
                    >
                      <MenuItem value="India">India</MenuItem>
                      <MenuItem value="United States">United States</MenuItem>
                      <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                      <MenuItem value="Canada">Canada</MenuItem>
                      <MenuItem value="Australia">Australia</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </SettingsCard>

          {/* Tax Information */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tax Information
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    value={companyProfile.panNumber || ''}
                    onChange={(e) => setCompanyProfile({...companyProfile, panNumber: e.target.value})}
                    placeholder="Enter PAN number"
                  />
                </Box>
              </Box>
            </CardContent>
          </SettingsCard>

          {/* Bank Details */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Bank Details
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={companyProfile.bankDetails?.bankName || ''}
                    onChange={(e) => setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {...(companyProfile.bankDetails || {}), bankName: e.target.value}
                    })}
                    placeholder="Enter bank name"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={companyProfile.bankDetails?.accountNumber || ''}
                    onChange={(e) => setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {...(companyProfile.bankDetails || {}), accountNumber: e.target.value}
                    })}
                    placeholder="Enter account number"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    value={companyProfile.bankDetails?.ifscCode || ''}
                    onChange={(e) => setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {...(companyProfile.bankDetails || {}), ifscCode: e.target.value}
                    })}
                    placeholder="Enter IFSC code"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    value={companyProfile.bankDetails?.accountHolderName || ''}
                    onChange={(e) => setCompanyProfile({
                      ...companyProfile,
                      bankDetails: {...(companyProfile.bankDetails || {}), accountHolderName: e.target.value}
                    })}
                    placeholder="Enter account holder name"
                  />
                </Box>
              </Box>
            </CardContent>
          </SettingsCard>
        </Stack>
      </Box>
    </SettingsPaper>
  );

  const renderInvoiceTemplates = () => (
    <SettingsPaper>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
            Invoice Templates
          </Typography>
          <Button
            variant="contained"
            startIcon={(creatingTemplate || updatingTemplate) ? <CircularProgress size={16} /> : <Save size={16} />}
            onClick={saveInvoiceSettings}
            disabled={creatingTemplate || updatingTemplate}
          >
            {creatingTemplate || updatingTemplate ? 'Saving...' : 'Save Settings'}
          </Button>
        </Stack>

        <Stack spacing={4}>
          {/* Template Styles */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Template Style
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                {templateStyles.map(style => (
                  <Box key={style.id}>
                    <TemplateStyleCard
                      selected={invoiceSettings.templateStyle === style.id}
                      onClick={() => setInvoiceSettings({...invoiceSettings, templateStyle: style.id})}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            height: 120,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 2,
                            p: 1,
                            backgroundColor: 'background.default'
                          }}
                        >
                          <Box
                            sx={{
                              height: 20,
                              backgroundColor: invoiceSettings.primaryColor,
                              borderRadius: 0.5,
                              mb: 1
                            }}
                          />
                          <Box sx={{ space: 1 }}>
                            <Box sx={{ height: 4, backgroundColor: 'text.disabled', borderRadius: 0.5, mb: 0.5 }} />
                            <Box sx={{ height: 4, backgroundColor: 'text.disabled', borderRadius: 0.5, width: '70%', mb: 0.5 }} />
                            <Box sx={{ height: 4, backgroundColor: 'text.disabled', borderRadius: 0.5 }} />
                          </Box>
                        </Box>
                        
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {style.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {style.description}
                            </Typography>
                          </Box>
                          {invoiceSettings.templateStyle === style.id && (
                            <CheckCircle size={20} color="primary" />
                          )}
                        </Stack>
                      </CardContent>
                    </TemplateStyleCard>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </SettingsCard>

          {/* Customization Options */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Customization
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Stack spacing={2}>
                    <Typography variant="body2">Primary Color</Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <input
                        type="color"
                        value={invoiceSettings.primaryColor}
                        onChange={(e) => setInvoiceSettings({...invoiceSettings, primaryColor: e.target.value})}
                        style={{
                          width: 40,
                          height: 40,
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                      />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {invoiceSettings.primaryColor}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Due Days"
                    type="number"
                    value={invoiceSettings.dueDays || ''}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, dueDays: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    placeholder="Default due days"
                  />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Invoice Number Format"
                    value={invoiceSettings.invoiceNumberFormat}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, invoiceNumberFormat: e.target.value})}
                    placeholder="e.g., INV-{YYYY}-{MM}-{###}"
                    helperText="Use {YYYY} for year, {MM} for month, {###} for number"
                  />
                </Box>
              </Box>
            </CardContent>
          </SettingsCard>

          {/* Display Options */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Display Options
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={invoiceSettings.showLogo}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showLogo: e.target.checked})}
                    />
                  }
                  label="Show company logo"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={invoiceSettings.showBankDetails}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, showBankDetails: e.target.checked})}
                    />
                  }
                  label="Show bank details"
                />
              </Stack>
            </CardContent>
          </SettingsCard>

          {/* Default Text */}
          <SettingsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Default Text
              </Typography>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Footer Text"
                  multiline
                  rows={3}
                  value={invoiceSettings.footer}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, footer: e.target.value})}
                  placeholder="Enter footer text"
                />
                <TextField
                  fullWidth
                  label="Terms & Conditions"
                  multiline
                  rows={4}
                  value={invoiceSettings.terms}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, terms: e.target.value})}
                  placeholder="Enter terms and conditions"
                />
              </Stack>
            </CardContent>
          </SettingsCard>
        </Stack>
      </Box>
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
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </Button>
        </Stack>

        <Stack spacing={3}>
          {users.map(user => (
            <UserCard key={user.id} status={user.status}>
              <CardContent>
                {/* User Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Chip
                        label={userRoles.find(r => r.id === user.role)?.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch
                      checked={user.status === 'active'}
                      onChange={() => toggleUserStatus(user.id)}
                      size="small"
                    />
                    <Typography variant="body2" color={user.status === 'active' ? 'success.main' : 'text.disabled'}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => deleteUser(user.id)}
                      size="small"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* User Stats */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.createdAt}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Login
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.lastLogin || 'Never'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* User Permissions */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Permissions
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {Object.entries(user.permissions).map(([module, perms]) => (
                        <Box key={module}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                              {module}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              {typeof perms === 'object' ? (
                                Object.entries(perms).map(([action, allowed]) => (
                                  <Chip
                                    key={action}
                                    label={action.charAt(0).toUpperCase()}
                                    size="small"
                                    color={allowed ? 'success' : 'default'}
                                    variant={allowed ? 'filled' : 'outlined'}
                                  />
                                ))
                              ) : (
                                <Chip
                                  label="R"
                                  size="small"
                                  color={perms ? 'success' : 'default'}
                                  variant={perms ? 'filled' : 'outlined'}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </UserCard>
          ))}
        </Stack>
      </Box>

      
      {/* Add User Dialog */}
      <Dialog
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add New User</Typography>
            <IconButton onClick={() => setShowAddUserModal(false)}>
              <X size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
            <Box>
              <TextField
                fullWidth
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Enter full name"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="Enter email address"
              />
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  label="Role"
                >
                  {userRoles.map(role => (
                    <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {userRoles.find(r => r.id === newUser.role)?.description}
              </Typography>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Enter password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Permissions
            </Typography>
            <PermissionGrid>
              {Object.entries(newUser.permissions).map(([module, perms]) => (
                <SettingsCard key={module}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, textTransform: 'capitalize' }}>
                      {module}
                    </Typography>
                    <Stack spacing={1}>
                      {typeof perms === 'object' ? (
                        Object.entries(perms).map(([action, allowed]) => (
                          <FormControlLabel
                            key={action}
                            control={
                              <Checkbox
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
                                size="small"
                              />
                            }
                            label={action.charAt(0).toUpperCase() + action.slice(1)}
                          />
                        ))
                      ) : (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={perms}
                              onChange={(e) => setNewUser({
                                ...newUser,
                                permissions: {
                                  ...newUser.permissions,
                                  [module]: { read: e.target.checked }
                                }
                              })}
                              size="small"
                            />
                          }
                          label="Read"
                        />
                      )}
                    </Stack>
                  </CardContent>
                </SettingsCard>
              ))}
            </PermissionGrid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAddUserModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddUser} startIcon={<Save size={20} />}>
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsPaper>
  );

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: Building },
    { id: 'templates', label: 'Invoice Templates', icon: FileText },
    { id: 'tax', label: 'Tax Settings', icon: Calculator },
    { id: 'users', label: 'User Management', icon: Users },
  ];

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
        <div className={`border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-teal-500 text-teal-600'
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
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