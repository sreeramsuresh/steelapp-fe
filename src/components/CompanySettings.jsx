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
  Camera
} from 'lucide-react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Avatar,
  IconButton,
  Chip,
  Switch,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  InputAdornment,
  Alert,
  CircularProgress,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { companyService } from '../services/companyService';
import { templateService } from '../services/templateService';
import { useApiData, useApi } from '../hooks/useApi';

// Styled Components
const SettingsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
}));

const SettingsPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  overflow: 'hidden',
}));

const SettingsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 120,
  height: 120,
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const TemplateStyleCard = styled(Card)(({ theme, selected }) => ({
  background: theme.palette.background.paper,
  border: selected 
    ? `2px solid ${theme.palette.primary.main}` 
    : `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: selected ? theme.shadows[4] : theme.shadows[1],
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const UserCard = styled(Card)(({ theme, status }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  opacity: status === 'inactive' ? 0.6 : 1,
  marginBottom: theme.spacing(2),
}));

const TaxCard = styled(Card)(({ theme, active }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  opacity: active ? 1 : 0.6,
  marginBottom: theme.spacing(2),
}));

const PermissionGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(2),
}));

const CompanySettings = () => {
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
    <SettingsPaper>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
            Tax Settings
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setShowAddTaxModal(true)}
          >
            Add Tax
          </Button>
        </Stack>

        <Stack spacing={2}>
          {taxSettings.map(tax => (
            <TaxCard key={tax.id} active={tax.active}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {tax.name}
                      </Typography>
                      <Chip
                        label={`${tax.rate}%`}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={tax.type}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {tax.description}
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch
                      checked={tax.active}
                      onChange={() => toggleTaxActive(tax.id)}
                      size="small"
                    />
                    <Typography variant="body2" color={tax.active ? 'success.main' : 'text.disabled'}>
                      {tax.active ? 'Active' : 'Inactive'}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => deleteTax(tax.id)}
                      size="small"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </TaxCard>
          ))}
        </Stack>
      </Box>

      
      {/* Add Tax Dialog */}
      <Dialog
        open={showAddTaxModal}
        onClose={() => setShowAddTaxModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add Tax Setting</Typography>
            <IconButton onClick={() => setShowAddTaxModal(false)}>
              <X size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
            <Box>
              <TextField
                fullWidth
                label="Tax Name"
                value={newTax.name}
                onChange={(e) => setNewTax({...newTax, name: e.target.value})}
                placeholder="Enter tax name (e.g., TRN)"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={newTax.rate || ''}
                onChange={(e) => setNewTax({...newTax, rate: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                placeholder="Enter tax rate"
                inputProps={{ step: "0.01", min: "0", max: "100" }}
              />
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newTax.type}
                  onChange={(e) => setNewTax({...newTax, type: e.target.value})}
                  label="Type"
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Description"
                value={newTax.description}
                onChange={(e) => setNewTax({...newTax, description: e.target.value})}
                placeholder="Enter tax description"
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAddTaxModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddTax} startIcon={<Save size={20} />}>
            Add Tax
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsPaper>
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

  return (
    <SettingsContainer>
      <SettingsPaper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Settings size={28} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                Company Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your company profile, invoice templates, taxes, and users
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            value="profile"
            icon={<Building size={20} />}
            label="Company Profile"
            iconPosition="start"
          />
          <Tab
            value="templates"
            icon={<FileText size={20} />}
            label="Invoice Templates"
            iconPosition="start"
          />
          <Tab
            value="tax"
            icon={<Calculator size={20} />}
            label="Tax Settings"
            iconPosition="start"
          />
          <Tab
            value="users"
            icon={<Users size={20} />}
            label="User Management"
            iconPosition="start"
          />
        </Tabs>
      </SettingsPaper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'templates' && renderInvoiceTemplates()}
        {activeTab === 'tax' && renderTaxSettings()}
        {activeTab === 'users' && renderUserManagement()}
      </Box>
    </SettingsContainer>
  );
};

export default CompanySettings;