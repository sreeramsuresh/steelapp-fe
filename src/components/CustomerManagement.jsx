import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/invoiceUtils';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  Paper,
  Divider,
  CircularProgress,
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  People, 
  Add, 
  Search, 
  Edit, 
  Delete, 
  Phone, 
  Email, 
  LocationOn, 
  CreditCard,
  History,
  BarChart,
  FilterList,
  Save,
  Close,
  Error,
  TrendingUp,
  AttachMoney,
  CalendarToday
} from '@mui/icons-material';
import { format } from 'date-fns';
import { customerService } from '../services/customerService';
import { useApiData, useApi } from '../hooks/useApi';

// Styled Components
const CustomerContainer = styled(Container)(({ theme }) => ({
  background: theme.palette.background.default,
  minHeight: '100vh',
  padding: theme.spacing(3),
  maxWidth: 'none !important',
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: `${theme.spacing(3)} 0`,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  color: theme.palette.text.primary,
  fontSize: '2rem',
  fontWeight: 700,
  marginBottom: theme.spacing(1),
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    minHeight: 48,
  },
}));

const CustomerProfilesCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
}));

const ProfilesControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

const SearchFilterGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    width: '100%',
  },
}));

const SearchBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  minWidth: 300,
  [theme.breakpoints.down('md')]: {
    minWidth: 'auto',
    width: '100%',
  },
}));

const CustomerCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const CustomerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(3),
}));

const CustomerInfo = styled(Box)(({ theme }) => ({
  flex: 1,
}));

const CustomerName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: theme.spacing(0.5),
}));

const CompanyName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(1),
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  ...(status === 'active' && {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: theme.palette.success.main,
    border: '1px solid rgba(16, 185, 129, 0.2)',
  }),
  ...(status === 'inactive' && {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    color: theme.palette.text.disabled,
    border: '1px solid rgba(156, 163, 175, 0.2)',
  }),
}));

const CustomerActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  width: 32,
  height: 32,
  background: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  color: theme.palette.text.secondary,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme.palette.primary.main,
    color: 'white',
    transform: 'scale(1.1)',
  },
  '&.danger:hover': {
    background: theme.palette.error.main,
  },
}));

const CustomerDetails = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  '& svg': {
    color: theme.palette.text.disabled,
    flexShrink: 0,
  },
}));

const CreditInfo = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.spacing(2),
}));

const CreditItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const CreditLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: '0.875rem',
}));

const CreditValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '0.875rem',
}));

const UtilizationContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const UtilizationText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.disabled,
  marginTop: theme.spacing(0.5),
}));

const AnalyticsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const AnalyticsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const AnalyticsValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

const AnalyticsSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: '0.875rem',
}));

const ChartCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  marginTop: theme.spacing(4),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const UtilizationRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  transition: 'background 0.3s ease',
  '&:hover': {
    background: theme.palette.action.hover,
  },
}));

const CustomerNameInChart = styled(Typography)(({ theme }) => ({
  minWidth: 150,
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
}));

const UtilizationVisual = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const UtilizationPercentage = styled(Typography)(({ theme }) => ({
  minWidth: 40,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  textAlign: 'right',
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[4],
    maxWidth: '600px',
    width: '100%',
  },
  '&.large-modal .MuiDialog-paper': {
    maxWidth: '800px',
  },
}));

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.default,
}));

const FormGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(3),
}));

const FullWidthFormControl = styled(FormControl)(({ theme }) => ({
  gridColumn: '1 / -1',
}));

const ContactHistorySection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  paddingBottom: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HistoryItem = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
}));

const HistoryHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const ContactType = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.primary.main,
  fontWeight: 500,
  fontSize: '0.875rem',
}));

const ContactDate = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: '0.875rem',
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  margin: `${theme.spacing(3)} 0`,
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  margin: `${theme.spacing(3)} 0`,
}));

const CustomerManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { data: customersData, loading: loadingCustomers, error: customersError, refetch: refetchCustomers } = useApiData(
    () => customerService.getCustomers({ search: searchTerm, status: filterStatus === 'all' ? undefined : filterStatus }),
    [searchTerm, filterStatus]
  );
  
  const { execute: createCustomer, loading: creatingCustomer } = useApi(customerService.createCustomer);
  const { execute: updateCustomer, loading: updatingCustomer } = useApi(customerService.updateCustomer);
  const { execute: deleteCustomer } = useApi(customerService.deleteCustomer);
  const { execute: addContactHistory } = useApi(customerService.addContactHistory);
  
  const customers = customersData?.customers || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [contactHistoryCustomer, setContactHistoryCustomer] = useState(null);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      country: 'India'
    },
    company: '',
    credit_limit: 0,
    current_credit: 0,
    status: 'active',
    vat_number: '',
    trn_number: '',
    trade_license_number: '',
    trade_license_expiry: ''
  });

  const [newContact, setNewContact] = useState({
    type: 'call',
    subject: '',
    notes: '',
    contact_date: new Date().toISOString().split('T')[0]
  });

  const filteredCustomers = customers;

  const handleAddCustomer = async () => {
    try {
      const customerData = {
        ...newCustomer,
        credit_limit: newCustomer.credit_limit === '' ? 0 : Number(newCustomer.credit_limit),
        current_credit: newCustomer.current_credit === '' ? 0 : Number(newCustomer.current_credit)
      };
      await createCustomer(customerData);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          country: 'India'
        },
        company: '',
        credit_limit: '',
        current_credit: '',
        status: 'active',
        vat_number: '',
        trn_number: '',
        trade_license_number: '',
        trade_license_expiry: ''
      });
      setShowAddModal(false);
      refetchCustomers();
    } catch (error) {
      alert('Failed to create customer: ' + error.message);
    }
  };

  const handleEditCustomer = async () => {
    try {
      const customerData = {
        ...selectedCustomer,
        credit_limit: selectedCustomer.credit_limit === '' ? 0 : Number(selectedCustomer.credit_limit),
        current_credit: selectedCustomer.current_credit === '' ? 0 : Number(selectedCustomer.current_credit)
      };
      await updateCustomer(selectedCustomer.id, customerData);
      setShowEditModal(false);
      setSelectedCustomer(null);
      refetchCustomers();
    } catch (error) {
      alert('Failed to update customer: ' + error.message);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        refetchCustomers();
      } catch (error) {
        alert('Failed to delete customer: ' + error.message);
      }
    }
  };

  const openContactHistory = (customer) => {
    setContactHistoryCustomer(customer);
    setShowContactHistory(true);
  };

  const addContactEntry = async () => {
    try {
      await addContactHistory(contactHistoryCustomer.id, newContact);
      
      setContactHistoryCustomer(prev => ({
        ...prev,
        contact_history: [...(prev.contact_history || []), {
          ...newContact,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        }]
      }));
      
      setNewContact({
        type: 'call',
        subject: '',
        notes: '',
        contact_date: new Date().toISOString().split('T')[0]
      });
      
      refetchCustomers();
    } catch (error) {
      alert('Failed to add contact entry: ' + error.message);
    }
  };

  const calculateAnalytics = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalCreditLimit = customers.reduce((sum, c) => sum + (Number(c.credit_limit) || 0), 0);
    const totalCreditUsed = customers.reduce((sum, c) => sum + (Number(c.current_credit) || 0), 0);
    const avgCreditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
    
    return {
      totalCustomers,
      activeCustomers,
      totalCreditLimit,
      totalCreditUsed,
      availableCredit: totalCreditLimit - totalCreditUsed,
      avgCreditUtilization
    };
  };

  const analytics = calculateAnalytics();

  const renderProfiles = () => (
    <CustomerProfilesCard>
      <ProfilesControls>
        <SearchFilterGroup>
          <SearchBox>
            <TextField
              fullWidth
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
          </SearchBox>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </SearchFilterGroup>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddModal(true)}
        >
          Add Customer
        </Button>
      </ProfilesControls>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {filteredCustomers.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                {loadingCustomers ? 'Loading...' : customersError ? 'Error loading customers.' : 'No customers found. Try creating a new customer.'}
              </Typography>
            </Box>
          </Box>
        ) : (
          filteredCustomers.map(customer => (
            <Box key={customer.id}>
              <CustomerCard>
                <CustomerHeader>
                  <CustomerInfo>
                    <CustomerName>{customer.name}</CustomerName>
                    <CompanyName>{customer.company}</CompanyName>
                    <StatusChip 
                      label={customer.status} 
                      size="small" 
                      status={customer.status}
                    />
                  </CustomerInfo>
                  <CustomerActions>
                    <ActionButton
                      onClick={() => openContactHistory(customer)}
                      title="Contact History"
                    >
                      <History fontSize="small" />
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowEditModal(true);
                      }}
                      title="Edit Customer"
                    >
                      <Edit fontSize="small" />
                    </ActionButton>
                    <ActionButton
                      className="danger"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      title="Delete Customer"
                    >
                      <Delete fontSize="small" />
                    </ActionButton>
                  </CustomerActions>
                </CustomerHeader>

                <CustomerDetails>
                  <DetailItem>
                    <Email fontSize="small" />
                    <Typography variant="body2">{customer.email}</Typography>
                  </DetailItem>
                  <DetailItem>
                    <Phone fontSize="small" />
                    <Typography variant="body2">{customer.phone}</Typography>
                  </DetailItem>
                  <DetailItem>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">
                      {typeof customer.address === 'object' 
                        ? `${customer.address.street}, ${customer.address.city}` 
                        : customer.address
                      }
                    </Typography>
                  </DetailItem>
                </CustomerDetails>

                <CreditInfo>
                  <CreditItem>
                    <CreditLabel>Credit Limit</CreditLabel>
                    <CreditValue>{formatCurrency(Number(customer.credit_limit) || 0)}</CreditValue>
                  </CreditItem>
                  <CreditItem>
                    <CreditLabel>Used</CreditLabel>
                    <CreditValue>{formatCurrency(Number(customer.current_credit) || 0)}</CreditValue>
                  </CreditItem>
                  <UtilizationContainer>
                    <LinearProgress
                      variant="determinate"
                      value={customer.credit_limit > 0 ? ((customer.current_credit || 0) / customer.credit_limit) * 100 : 0}
                      sx={{ 
                        height: 8, 
                        borderRadius: 1,
                        mb: 0.5
                      }}
                    />
                    <UtilizationText>
                      {customer.credit_limit > 0 ? Math.round(((customer.current_credit || 0) / customer.credit_limit) * 100) : 0}% used
                    </UtilizationText>
                  </UtilizationContainer>
                </CreditInfo>
              </CustomerCard>
            </Box>
          ))
        )}
      </Box>
    </CustomerProfilesCard>
  );

  const renderAnalytics = () => (
    <CustomerProfilesCard>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <AnalyticsCard>
            <AnalyticsHeader>
              <People sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Total Customers</Typography>
            </AnalyticsHeader>
            <AnalyticsValue>{analytics.totalCustomers}</AnalyticsValue>
            <AnalyticsSubtitle>
              {analytics.activeCustomers} active customers
            </AnalyticsSubtitle>
          </AnalyticsCard>
        </Box>

        <Box>
          <AnalyticsCard>
            <AnalyticsHeader>
              <CreditCard sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Total Credit Limit</Typography>
            </AnalyticsHeader>
            <AnalyticsValue>{formatCurrency(analytics.totalCreditLimit)}</AnalyticsValue>
            <AnalyticsSubtitle>
              Across all customers
            </AnalyticsSubtitle>
          </AnalyticsCard>
        </Box>

        <Box>
          <AnalyticsCard>
            <AnalyticsHeader>
              <AttachMoney sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Credit Utilized</Typography>
            </AnalyticsHeader>
            <AnalyticsValue>{formatCurrency(analytics.totalCreditUsed)}</AnalyticsValue>
            <AnalyticsSubtitle>
              {Math.round(analytics.avgCreditUtilization)}% average utilization
            </AnalyticsSubtitle>
          </AnalyticsCard>
        </Box>

        <Box>
          <AnalyticsCard>
            <AnalyticsHeader>
              <TrendingUp sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Available Credit</Typography>
            </AnalyticsHeader>
            <AnalyticsValue>{formatCurrency(analytics.availableCredit)}</AnalyticsValue>
            <AnalyticsSubtitle>
              Ready to be utilized
            </AnalyticsSubtitle>
          </AnalyticsCard>
        </Box>
      </Box>

      <ChartCard>
        <Typography variant="h6" sx={{ mb: 3 }}>Credit Utilization by Customer</Typography>
        <Box>
          {customers.map(customer => (
            <UtilizationRow key={customer.id}>
              <CustomerNameInChart>{customer.name}</CustomerNameInChart>
              <UtilizationVisual>
                <LinearProgress
                  variant="determinate"
                  value={customer.credit_limit > 0 ? (customer.current_credit / customer.credit_limit) * 100 : 0}
                  sx={{ 
                    flex: 1, 
                    height: 12, 
                    borderRadius: 1 
                  }}
                />
                <UtilizationPercentage>
                  {customer.credit_limit > 0 ? Math.round((customer.current_credit / customer.credit_limit) * 100) : 0}%
                </UtilizationPercentage>
              </UtilizationVisual>
            </UtilizationRow>
          ))}
        </Box>
      </ChartCard>
    </CustomerProfilesCard>
  );

  return (
    <CustomerContainer>
      <PageHeader>
        <HeaderTitle>
          <People fontSize="large" />
          Customer Management
        </HeaderTitle>
        <Typography color="text.secondary">
          Manage customer profiles, contact history, and credit limits
        </Typography>
      </PageHeader>

      <StyledTabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab 
          label="Customer Profiles" 
          icon={<People />} 
          iconPosition="start"
        />
        <Tab 
          label="Analytics" 
          icon={<BarChart />} 
          iconPosition="start"
        />
      </StyledTabs>

      {loadingCustomers && (
        <LoadingContainer>
          <CircularProgress />
          <Typography sx={{ ml: 2 }} color="text.disabled">Loading customers...</Typography>
        </LoadingContainer>
      )}
      
      {customersError && (
        <ErrorContainer>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={refetchCustomers}>
                Try again
              </Button>
            }
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Error />
              Error loading customers: {customersError}
            </Box>
          </Alert>
        </ErrorContainer>
      )}

      <Box>
        {activeTab === 0 && renderProfiles()}
        {activeTab === 1 && renderAnalytics()}
      </Box>

      {/* Add Customer Modal */}
      <StyledDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogHeader>
          Add New Customer
          <IconButton onClick={() => setShowAddModal(false)}>
            <Close />
          </IconButton>
        </DialogHeader>
        <DialogContent sx={{ p: 3 }}>
          <FormGrid>
            <TextField
              label="Customer Name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              placeholder="Enter customer name"
              fullWidth
            />
            <TextField
              label="Company"
              value={newCustomer.company}
              onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
              placeholder="Enter company name"
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              placeholder="Enter email address"
              fullWidth
            />
            <TextField
              label="Phone"
              type="tel"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              placeholder="Enter phone number"
              fullWidth
            />
            <TextField
              label="Street Address"
              value={newCustomer.address.street}
              onChange={(e) => setNewCustomer({...newCustomer, address: {...newCustomer.address, street: e.target.value}})}
              placeholder="Enter street address"
              fullWidth
            />
            <TextField
              label="City"
              value={newCustomer.address.city}
              onChange={(e) => setNewCustomer({...newCustomer, address: {...newCustomer.address, city: e.target.value}})}
              placeholder="Enter city"
              fullWidth
            />
            <TextField
              label="TRN Number"
              value={newCustomer.trn_number}
              onChange={(e) => setNewCustomer({...newCustomer, trn_number: e.target.value})}
              placeholder="Enter TRN number"
              fullWidth
            />
            <TextField
              label="VAT Number"
              value={newCustomer.vat_number}
              onChange={(e) => setNewCustomer({...newCustomer, vat_number: e.target.value})}
              placeholder="Enter VAT number"
              fullWidth
            />
            <TextField
              label="Trade License Number"
              value={newCustomer.trade_license_number}
              onChange={(e) => setNewCustomer({...newCustomer, trade_license_number: e.target.value})}
              placeholder="Enter trade license number"
              fullWidth
            />
            <TextField
              label="Trade License Expiry"
              type="date"
              value={newCustomer.trade_license_expiry}
              onChange={(e) => setNewCustomer({...newCustomer, trade_license_expiry: e.target.value})}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Important: Set expiry date for compliance tracking"
            />
            <TextField
              label="Credit Limit (د.إ)"
              type="number"
              value={newCustomer.credit_limit || ''}
              onChange={(e) => setNewCustomer({...newCustomer, credit_limit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
              placeholder="Enter credit limit"
              fullWidth
            />
            <TextField
              label="Current Credit Used (د.إ)"
              type="number"
              value={newCustomer.current_credit || ''}
              onChange={(e) => setNewCustomer({...newCustomer, current_credit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
              placeholder="Enter current credit used"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newCustomer.status}
                label="Status"
                onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </FormGrid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddCustomer}
            startIcon={<Save />}
            disabled={creatingCustomer}
          >
            {creatingCustomer ? 'Adding...' : 'Add Customer'}
          </Button>
        </DialogActions>
      </StyledDialog>

      {/* Edit Customer Modal */}
      <StyledDialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogHeader>
          Edit Customer
          <IconButton onClick={() => setShowEditModal(false)}>
            <Close />
          </IconButton>
        </DialogHeader>
        <DialogContent sx={{ p: 3 }}>
          {selectedCustomer && (
            <FormGrid>
              <TextField
                label="Customer Name"
                value={selectedCustomer.name}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                fullWidth
              />
              <TextField
                label="Company"
                value={selectedCustomer.company}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, company: e.target.value})}
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={selectedCustomer.email}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                fullWidth
              />
              <TextField
                label="Phone"
                type="tel"
                value={selectedCustomer.phone}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                fullWidth
              />
              <FullWidthFormControl>
                <TextField
                  label="Address"
                  multiline
                  rows={3}
                  value={typeof selectedCustomer.address === 'string' 
                    ? selectedCustomer.address 
                    : selectedCustomer.address ? Object.values(selectedCustomer.address).filter(v => v).join(', ') : ''}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, address: e.target.value})}
                  fullWidth
                />
              </FullWidthFormControl>
              <TextField
                label="VAT Number"
                value={selectedCustomer.vat_number || ''}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, vat_number: e.target.value})}
                fullWidth
              />
              <TextField
                label="TRN Number"
                value={selectedCustomer.trn_number || ''}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, trn_number: e.target.value})}
                placeholder="Enter TRN number"
                fullWidth
              />
              <TextField
                label="Trade License Number"
                value={selectedCustomer.trade_license_number || ''}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, trade_license_number: e.target.value})}
                fullWidth
              />
              <TextField
                label="Trade License Expiry"
                type="date"
                value={selectedCustomer.trade_license_expiry || ''}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, trade_license_expiry: e.target.value})}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Important: Set expiry date for compliance tracking"
              />
              <TextField
                label="Credit Limit (د.إ)"
                type="number"
                value={selectedCustomer.credit_limit || ''}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, credit_limit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                fullWidth
              />
              <TextField
                label="Current Credit Used (د.إ)"
                type="number"
                value={selectedCustomer.current_credit || ''}
                onChange={(e) => setSelectedCustomer({...selectedCustomer, current_credit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedCustomer.status}
                  label="Status"
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, status: e.target.value})}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </FormGrid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditCustomer}
            startIcon={<Save />}
            disabled={updatingCustomer}
          >
            {updatingCustomer ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </StyledDialog>

      {/* Contact History Modal */}
      <StyledDialog
        open={showContactHistory}
        onClose={() => setShowContactHistory(false)}
        maxWidth="lg"
        fullWidth
        className="large-modal"
      >
        <DialogHeader>
          Contact History - {contactHistoryCustomer?.name}
          <IconButton onClick={() => setShowContactHistory(false)}>
            <Close />
          </IconButton>
        </DialogHeader>
        <DialogContent sx={{ p: 3 }}>
          <ContactHistorySection>
            <Typography variant="h6" sx={{ mb: 3 }}>Add New Contact Entry</Typography>
            <FormGrid>
              <FormControl>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newContact.type}
                  label="Type"
                  onChange={(e) => setNewContact({...newContact, type: e.target.value})}
                >
                  <MenuItem value="call">Phone Call</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="meeting">Meeting</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Date"
                type="date"
                value={newContact.contact_date}
                onChange={(e) => setNewContact({...newContact, contact_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              <FullWidthFormControl>
                <TextField
                  label="Subject"
                  value={newContact.subject}
                  onChange={(e) => setNewContact({...newContact, subject: e.target.value})}
                  placeholder="Enter contact subject"
                  fullWidth
                />
              </FullWidthFormControl>
              <FullWidthFormControl>
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={newContact.notes}
                  onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                  placeholder="Enter contact notes"
                  fullWidth
                />
              </FullWidthFormControl>
            </FormGrid>
            <Button 
              variant="contained" 
              onClick={addContactEntry}
              startIcon={<Add />}
              sx={{ mt: 2 }}
            >
              Add Contact Entry
            </Button>
          </ContactHistorySection>

          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>Contact History</Typography>
            {contactHistoryCustomer?.contact_history && contactHistoryCustomer.contact_history.length > 0 ? (
              <Box>
                {contactHistoryCustomer.contact_history.map(contact => (
                  <HistoryItem key={contact.id}>
                    <HistoryHeader>
                      <ContactType>
                        {contact.type === 'call' && <Phone fontSize="small" />}
                        {contact.type === 'email' && <Email fontSize="small" />}
                        {contact.type === 'meeting' && <CalendarToday fontSize="small" />}
                        {contact.type === 'other' && <Error fontSize="small" />}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {contact.type}
                        </Typography>
                      </ContactType>
                      <ContactDate>
                        {format(new Date(contact.contact_date), 'MMM dd, yyyy')}
                      </ContactDate>
                    </HistoryHeader>
                    <Typography variant="h6" sx={{ mb: 1 }}>{contact.subject}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contact.notes}
                    </Typography>
                  </HistoryItem>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <History sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.disabled">No contact history available</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </StyledDialog>
    </CustomerContainer>
  );
};

export default CustomerManagement;