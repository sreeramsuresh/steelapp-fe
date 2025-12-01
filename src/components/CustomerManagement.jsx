import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../utils/invoiceUtils';
import { format } from 'date-fns';
import { customerService } from '../services/customerService';
import { supplierService } from '../services/supplierService';
import pricelistService from '../services/pricelistService';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/axiosAuthService';
import ConfirmDialog from './ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { 
  FaUsers, 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaCreditCard,
  FaHistory,
  FaChartBar,
  FaFilter,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaArrowUp,
  FaDollarSign,
  FaCalendarAlt,
  FaUpload,
  FaArchive,
} from 'react-icons/fa';
import CustomerUpload from './CustomerUpload';

const CustomerManagement = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Set notification service theme
  useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);
  const [activeTab, setActiveTab] = useState('profiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  
  const canReadCustomers = authService.hasPermission('customers','read') || authService.hasRole('admin');

  const { data: customersData, loading: loadingCustomers, error: customersError, refetch: refetchCustomers } = useApiData(
    () => {
      if (!canReadCustomers) {
        // Avoid hitting the API if not permitted
        return Promise.resolve({ customers: [] });
      }
      return customerService.getCustomers({ search: searchTerm, status: filterStatus === 'all' ? undefined : filterStatus });
    },
    [searchTerm, filterStatus, canReadCustomers],
  );

  // Suppliers API hooks
  const { data: suppliersData, loading: loadingSuppliers, error: suppliersError, refetch: refetchSuppliers } = useApiData(
    () => supplierService.getSuppliers(),
    [],
  );

  // Pricelists API hooks
  const { data: pricelistsData, loading: loadingPricelists } = useApiData(
    () => pricelistService.getAll({ include_items: false }),
    [],
  );
  const { execute: createSupplier, loading: creatingSupplier } = useApi(supplierService.createSupplier);
  const { execute: updateSupplier, loading: updatingSupplier } = useApi(supplierService.updateSupplier);
  const { execute: deleteSupplier } = useApi(supplierService.deleteSupplier);
  
  const { execute: createCustomer, loading: creatingCustomer } = useApi(customerService.createCustomer);
  const { execute: updateCustomer, loading: updatingCustomer } = useApi(customerService.updateCustomer);
  const { execute: deleteCustomer } = useApi(customerService.deleteCustomer);
  const { execute: archiveCustomer } = useApi(customerService.archiveCustomer);
  const { execute: addContactHistory } = useApi(customerService.addContactHistory);
  
  const customers = customersData?.customers || [];
  const pricelists = pricelistsData?.data || [];
  const canDeleteCustomers = authService.hasPermission('customers','delete') || authService.hasRole('admin');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // Supplier modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [contactHistoryCustomer, setContactHistoryCustomer] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      country: 'UAE',
    },
    company: '',
    credit_limit: 0,
    current_credit: 0,
    status: 'active',
    vat_number: '',
    trn_number: '',
    trade_license_number: '',
    trade_license_expiry: '',
    pricelist_id: null,
    is_designated_zone: false, // UAE VAT: Customer in Free Zone
  });

  // TRN validation: UAE VAT TRN must start with "100" and be 15 digits.
  // Allow empty (optional), but if provided, enforce the full pattern.
  const validateTRN = (value) => {
    if (!value) return null; // optional
    const digits = String(value).replace(/\s+/g, '');
    if (!/^100\d{12}$/.test(digits)) return 'TRN must start with 100 and be 15 digits';
    return null;
  };

  // Best practice: sanitize input to digits-only and cap length to 15
  const sanitizeTRNInput = (value) => String(value || '').replace(/\D/g, '').slice(0, 15);

  const [newContact, setNewContact] = useState({
    type: 'call',
    subject: '',
    notes: '',
    contact_date: new Date().toISOString().split('T')[0],
  });

  const filteredCustomers = customers.filter(c => showArchived ? true : (c.status !== 'archived'));
  const suppliers = suppliersData?.suppliers || [];

  // Sync search from URL param
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
  }, [searchParams]);

  const handleAddCustomer = async () => {
    const trnError = validateTRN(newCustomer.trnNumber);
    if (trnError) {
      notificationService.error(trnError);
      return;
    }
    try {
      const customerData = {
        ...newCustomer,
        credit_limit: newCustomer.creditLimit === '' ? 0 : Number(newCustomer.creditLimit),
        current_credit: newCustomer.currentCredit === '' ? 0 : Number(newCustomer.currentCredit),
      };
      await createCustomer(customerData);
      // Clear cache on create
      clearCache(CACHE_KEYS.CUSTOMERS_LIST);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        alternate_phone: '',
        website: '',
        address: {
          street: '',
          city: '',
          country: 'UAE',
        },
        company: '',
        credit_limit: '',
        current_credit: '',
        status: 'active',
        vat_number: '',
        trn_number: '',
        trade_license_number: '',
        trade_license_expiry: '',
        pricelist_id: null,
        is_designated_zone: false,
      });
      setShowAddModal(false);
      refetchCustomers();
      notificationService.createSuccess('Customer');
    } catch (error) {
      notificationService.createError('Customer', error);
    }
  };

  const handleEditCustomer = async () => {
    const trnError = validateTRN(selectedCustomer?.trnNumber);
    if (trnError) {
      notificationService.error(trnError);
      return;
    }
    try {
      const customerData = {
        ...selectedCustomer,
        credit_limit: selectedCustomer.creditLimit === '' ? 0 : Number(selectedCustomer.creditLimit),
        current_credit: selectedCustomer.currentCredit === '' ? 0 : Number(selectedCustomer.currentCredit),
      };
      await updateCustomer(selectedCustomer.id, customerData);
      // Clear cache on update
      clearCache(CACHE_KEYS.CUSTOMERS_LIST);
      setShowEditModal(false);
      setSelectedCustomer(null);
      refetchCustomers();
      notificationService.updateSuccess('Customer');
    } catch (error) {
      notificationService.updateError('Customer', error);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    // Repurposed as Archive for safety
    const confirmed = await confirm({
      title: 'Archive Customer?',
      message: 'Archive this customer? You can restore later from the backend.',
      confirmText: 'Archive',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      await archiveCustomer(customerId);
      // Clear cache on archive/delete
      clearCache(CACHE_KEYS.CUSTOMERS_LIST);
      refetchCustomers();
      notificationService.success('Customer archived successfully');
    } catch (error) {
      notificationService.apiError('Archive customer', error);
    }
  };

  // Supplier CRUD
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    status: 'active',
    trn_number: '',
    payment_terms: '',
    default_currency: 'AED',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    is_designated_zone: false, // UAE VAT: Supplier in Free Zone
  });

  const handleAddSupplier = async () => {
    const trnErr = validateTRN(newSupplier.trnNumber);
    if (trnErr) { notificationService.error(trnErr); return; }
    try {
      const data = { ...newSupplier };
      await createSupplier(data);
      setNewSupplier({ name: '', email: '', phone: '', address: '', company: '', status: 'active', trn_number: '', payment_terms: '', default_currency: 'AED', contact_name: '', contact_email: '', contact_phone: '', is_designated_zone: false });
      setShowAddSupplierModal(false);
      refetchSuppliers();
      notificationService.createSuccess('Supplier');
    } catch (e) {
      notificationService.createError('Supplier', e);
    }
  };

  const handleEditSupplier = async () => {
    const trnErr = validateTRN(selectedSupplier?.trnNumber);
    if (trnErr) { notificationService.error(trnErr); return; }
    try {
      await updateSupplier(selectedSupplier.id, selectedSupplier);
      setShowEditSupplierModal(false);
      setSelectedSupplier(null);
      refetchSuppliers();
      notificationService.updateSuccess('Supplier');
    } catch (e) {
      notificationService.updateError('Supplier', e);
    }
  };

  const handleDeleteSupplier = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Supplier?',
      message: 'Are you sure you want to delete this supplier? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try { await deleteSupplier(id); refetchSuppliers(); notificationService.deleteSuccess('Supplier'); }
    catch (e) { notificationService.deleteError('Supplier', e); }
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
        contactHistory: [...(prev.contactHistory || []), {
          ...newContact,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      }));
      
      setNewContact({
        type: 'call',
        subject: '',
        notes: '',
        contact_date: new Date().toISOString().split('T')[0],
      });
      
      refetchCustomers();
      notificationService.success('Contact entry added successfully!');
    } catch (error) {
      notificationService.error(`Failed to add contact entry: ${  error.message || 'Unknown error'}`);
    }
  };

  const calculateAnalytics = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalCreditLimit = customers.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
    const totalCreditUsed = customers.reduce((sum, c) => sum + (Number(c.currentCredit) || 0), 0);
    const avgCreditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;
    
    return {
      totalCustomers,
      activeCustomers,
      totalCreditLimit,
      totalCreditUsed,
      availableCredit: totalCreditLimit - totalCreditUsed,
      avgCreditUtilization,
    };
  };

  const analytics = calculateAnalytics();

  // Common input styles
  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 ${
    isDarkMode 
      ? 'border-[#37474F] bg-[#1E2328] text-white placeholder-[#78909C]' 
      : 'border-[#E0E0E0] bg-white text-[#212121] placeholder-[#BDBDBD]'
  }`;

  const cardClasses = `rounded-xl border transition-all duration-300 ${
    isDarkMode 
      ? 'bg-[#1E2328] border-[#37474F]' 
      : 'bg-white border-[#E0E0E0]'
  }`;

  const textPrimary = isDarkMode ? 'text-white' : 'text-[#212121]';
  const textSecondary = isDarkMode ? 'text-[#B0BEC5]' : 'text-[#757575]';
  const textMuted = isDarkMode ? 'text-[#78909C]' : 'text-[#BDBDBD]';

  const renderProfiles = () => (
    <div className={`${cardClasses} p-6 mb-6`}>
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex items-center flex-1 max-w-md">
            <FaSearch className={`absolute left-3 ${textMuted}`} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 w-full ${
                isDarkMode 
                  ? 'border-[#37474F] bg-[#1E2328] text-white placeholder-[#78909C]' 
                  : 'border-[#E0E0E0] bg-white text-[#212121] placeholder-[#BDBDBD]'
              }`}
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#008B8B] focus:border-transparent transition-colors duration-300 min-w-[150px] ${
              isDarkMode 
                ? 'border-[#37474F] bg-[#1E2328] text-white' 
                : 'border-[#E0E0E0] bg-white text-[#212121]'
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Show Archived Toggle */}
          <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="form-checkbox h-4 w-4 text-teal-600"
            />
            <span className="text-sm">Show archived</span>
          </label>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <FaPlus />
            Add Customer
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-[#4CAF50] to-[#388E3C] text-white rounded-lg hover:from-[#66BB6A] hover:to-[#4CAF50] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <FaUpload />
            Upload Customers
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className={textMuted}>
              {loadingCustomers ? 'Loading...' : customersError ? 'Error loading customers.' : 'No customers found. Try creating a new customer.'}
            </p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className={`${cardClasses} p-6 hover:-translate-y-1 hover:shadow-lg hover:border-[#008B8B]`}>
              {/* Customer Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold mb-1 truncate ${textPrimary}`}>
                    {customer.name}
                  </h3>
                  <p className={`text-sm mb-2 truncate ${textSecondary}`}>{customer.company}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium uppercase tracking-wider rounded-full ${
                    customer.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {customer.status}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openContactHistory(customer)}
                    className={`p-2 rounded transition-colors bg-transparent ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'hover:bg-gray-100 text-blue-600'}`}
                    title="Contact History"
                  >
                    <FaHistory className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowEditModal(true);
                    }}
                    className={`p-2 rounded transition-colors bg-transparent ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'hover:bg-gray-100 text-teal-600'}`}
                    title="Edit Customer"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  {canDeleteCustomers && (
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className={`p-2 rounded transition-colors bg-transparent ${isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'hover:bg-gray-100 text-yellow-600'}`}
                      title="Archive Customer"
                    >
                      <FaArchive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 mb-4">
                <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                  <FaEnvelope className={`w-4 h-4 ${textMuted}`} />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                  <FaPhone className={`w-4 h-4 ${textMuted}`} />
                  <span className="truncate">{customer.phone}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                  <FaMapMarkerAlt className={`w-4 h-4 ${textMuted}`} />
                  <span className="truncate">
                    {customer.address && typeof customer.address === 'object'
                      ? `${customer.address.street || ''}, ${customer.address.city || ''}`.trim().replace(/^,\s*|,\s*$/, '') || 'No address'
                      : customer.address || 'No address'
                    }
                  </span>
                </div>
              </div>

              {/* Credit Info */}
              <div className={`border-t pt-4 ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs ${textMuted}`}>Credit Limit</span>
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    {formatCurrency(Number(customer.creditLimit) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs ${textMuted}`}>Used</span>
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    {formatCurrency(Number(customer.currentCredit) || 0)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className={`relative w-full rounded-full h-2 mb-1 ${isDarkMode ? 'bg-[#37474F]' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-[#008B8B] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${customer.creditLimit > 0 ? ((customer.currentCredit || 0) / customer.creditLimit) * 100 : 0}%`, 
                    }}
                  />
                </div>
                <p className={`text-xs text-right ${textMuted}`}>
                  {customer.creditLimit > 0 ? Math.round(((customer.currentCredit || 0) / customer.creditLimit) * 100) : 0}% used
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className={`${cardClasses} p-6 mb-6`}>
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${textPrimary}`}>Suppliers</h3>
        <button
          onClick={() => setShowAddSupplierModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2"
        >
          <FaPlus /> Add Supplier
        </button>
      </div>
      {/* Errors */}
      {suppliersError && (
        <div className={`rounded p-3 mb-4 ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'}`}>Failed to load suppliers</div>
      )}
      {/* List */}
      {loadingSuppliers ? (
        <div className="py-8 text-center">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className={`py-8 text-center ${textSecondary}`}>No suppliers yet. Add one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className={`${cardClasses} p-4`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className={`font-semibold ${textPrimary}`}>{s.name}</div>
                  <div className={`text-sm ${textSecondary}`}>{s.company}</div>
                </div>
                <div className="flex gap-2">
                  <button className={`p-2 rounded ${isDarkMode ? 'text-teal-300 hover:bg-gray-700' : 'text-teal-700 hover:bg-gray-100'}`}
                    onClick={() => { setSelectedSupplier(s); setShowEditSupplierModal(true); }} title="Edit">
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button className={`p-2 rounded ${isDarkMode ? 'text-red-300 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'}`}
                    onClick={() => handleDeleteSupplier(s.id)} title="Delete">
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className={`text-sm space-y-1 ${textSecondary}`}>
                {s.email && <div><FaEnvelope className={`inline w-4 h-4 mr-1 ${textMuted}`} />{s.email}</div>}
                {s.phone && <div><FaPhone className={`inline w-4 h-4 mr-1 ${textMuted}`} />{s.phone}</div>}
                {s.address && <div><FaMapMarkerAlt className={`inline w-4 h-4 mr-1 ${textMuted}`} />{typeof s.address === 'object' ? [s.address.street, s.address.city, s.address.state, s.address.postalCode, s.address.country].filter(Boolean).join(', ') : s.address}</div>}
                {s.trnNumber && <div>TRN: {s.trnNumber}</div>}
                {s.defaultCurrency && <div>Currency: {s.defaultCurrency}</div>}
                {s.paymentTerms && <div>Payment Terms: {s.paymentTerms}</div>}
                {s.contactName && <div>Contact: {s.contactName}{s.contactEmail ? ` • ${s.contactEmail}` : ''}{s.contactPhone ? ` • ${s.contactPhone}` : ''}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className={`${cardClasses} p-6`}>
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaUsers className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Total Customers</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{analytics.totalCustomers}</p>
          <p className={`text-sm ${textSecondary}`}>{analytics.activeCustomers} active customers</p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaCreditCard className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Total Credit Limit</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{formatCurrency(analytics.totalCreditLimit)}</p>
          <p className={`text-sm ${textSecondary}`}>Across all customers</p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaDollarSign className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Credit Utilized</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{formatCurrency(analytics.totalCreditUsed)}</p>
          <p className={`text-sm ${textSecondary}`}>{Math.round(analytics.avgCreditUtilization)}% average utilization</p>
        </div>

        <div className={`${cardClasses} p-6 hover:shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            <FaArrowUp className="text-[#008B8B] text-2xl" />
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Available Credit</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${textPrimary}`}>{formatCurrency(analytics.availableCredit)}</p>
          <p className={`text-sm ${textSecondary}`}>Ready to be utilized</p>
        </div>
      </div>

      {/* Credit Utilization Chart */}
      <div className={`${cardClasses} p-6 hover:shadow-lg`}>
        <h3 className={`text-lg font-semibold mb-6 ${textPrimary}`}>Credit Utilization by Customer</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {customers.map(customer => (
            <div key={customer.id} className={`flex items-center gap-4 p-3 rounded-lg hover:bg-opacity-50 transition-colors ${
              isDarkMode ? 'hover:bg-[#37474F]' : 'hover:bg-gray-50'
            }`}>
              <span className={`w-40 text-sm font-medium truncate ${textPrimary}`}>{customer.name}</span>
              <div className="flex-1 flex items-center gap-3">
                <div className={`flex-1 rounded-full h-3 ${isDarkMode ? 'bg-[#37474F]' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-[#008B8B] h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${customer.creditLimit > 0 ? ((customer.currentCredit || 0) / customer.creditLimit) * 100 : 0}%`, 
                    }}
                  />
                </div>
                <span className={`text-sm font-medium w-12 text-right ${textSecondary}`}>
                  {customer.creditLimit > 0 ? Math.round(((customer.currentCredit || 0) / customer.creditLimit) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[100vw] overflow-x-hidden">
        {/* Page Header */}
        <div className={`mb-8 pb-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className={`text-3xl ${textSecondary}`} />
            <h1 className={`text-3xl font-bold ${textPrimary}`}>Customer Management</h1>
          </div>
          <p className={textSecondary}>Manage customer profiles, contact history, and credit limits</p>
        </div>

        {/* Tabs - Pill style */}
        <div className={`mb-6 ${isDarkMode ? 'bg-transparent' : 'bg-transparent'}`}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'profiles'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <FaUsers size={18} />
              Customer Profiles
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'suppliers'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <FaUsers size={18} />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? (isDarkMode
                    ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                    : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                  : (isDarkMode
                    ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                    : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
              }`}
            >
              <FaChartBar size={18} />
              Analytics
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingCustomers && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B]"></div>
            <span className={`ml-3 ${textSecondary}`}>Loading customers...</span>
          </div>
        )}
        
        {/* Error State */}
        {customersError && (
          <div className={`rounded-lg p-4 mb-6 border ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              <span className={isDarkMode ? 'text-red-200' : 'text-red-800'}>Error loading customers: {customersError}</span>
              <button
                onClick={refetchCustomers}
                className={`ml-auto px-3 py-1 text-sm rounded transition-colors ${
                  isDarkMode
                    ? 'bg-red-800 text-red-200 hover:bg-red-700'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'profiles' && renderProfiles()}
          {activeTab === 'suppliers' && renderSuppliers()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Add New Customer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="Enter customer name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                    placeholder="Enter company name"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="Enter email address"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.alternatePhone}
                    onChange={(e) => setNewCustomer({...newCustomer, alternate_phone: e.target.value})}
                    placeholder="Enter alternate phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={newCustomer.website}
                    onChange={(e) => setNewCustomer({...newCustomer, website: e.target.value})}
                    placeholder="Enter website URL"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={newCustomer.address.street}
                    onChange={(e) => setNewCustomer({...newCustomer, address: {...newCustomer.address, street: e.target.value}})}
                    placeholder="Enter street address"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={newCustomer.address.city}
                    onChange={(e) => setNewCustomer({...newCustomer, address: {...newCustomer.address, city: e.target.value}})}
                    placeholder="Enter city"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    TRN Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\\d*"
                    maxLength={15}
                    value={newCustomer.trnNumber}
                    onChange={(e) => setNewCustomer({...newCustomer, trn_number: sanitizeTRNInput(e.target.value)})}
                    placeholder="100XXXXXXXXXXXX"
                    className={inputClasses}
                  />
                  {validateTRN(newCustomer.trnNumber) && (
                    <p className="text-xs text-red-600 mt-1">{validateTRN(newCustomer.trnNumber)}</p>
                  )}
                  {!validateTRN(newCustomer.trnNumber) && (
                    <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                  )}
                </div>

                {/* UAE VAT: Designated Zone checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newCustomerDesignatedZone"
                    checked={newCustomer.isDesignatedZone || false}
                    onChange={(e) => setNewCustomer({...newCustomer, is_designated_zone: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="newCustomerDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>
                    Designated Zone (Free Zone) Customer
                  </label>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    value={newCustomer.tradeLicenseNumber}
                    onChange={(e) => setNewCustomer({...newCustomer, trade_license_number: e.target.value})}
                    placeholder="Enter trade license number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Expiry
                  </label>
                  <input
                    type="date"
                    value={newCustomer.tradeLicenseExpiry}
                    onChange={(e) => setNewCustomer({...newCustomer, trade_license_expiry: e.target.value})}
                    className={inputClasses}
                  />
                  <p className={`text-xs mt-1 ${textMuted}`}>Important: Set expiry date for compliance tracking</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Credit Limit (د.إ)
                  </label>
                  <input
                    type="number"
                    value={newCustomer.creditLimit || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, credit_limit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    placeholder="Enter credit limit"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Current Credit Used (د.إ)
                  </label>
                  <input
                    type="number"
                    value={newCustomer.currentCredit || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, current_credit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    placeholder="Enter current credit used"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Price List
                  </label>
                  <select
                    value={newCustomer.pricelistId || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, pricelist_id: e.target.value ? Number(e.target.value) : null})}
                    className={inputClasses}
                  >
                    <option value="">-- Use Default Price List --</option>
                    {pricelists.map((pricelist) => (
                      <option key={pricelist.id} value={pricelist.id}>
                        {pricelist.name} {pricelist.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${textMuted}`}>Optional: Assign a specific price list for this customer</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Status
                  </label>
                  <select
                    value={newCustomer.status}
                    onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                    className={inputClasses}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors bg-transparent ${
                  isDarkMode 
                    ? 'text-[#B0BEC5] hover:text-gray-300' 
                    : 'text-[#757575] hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={creatingCustomer || !!validateTRN(newCustomer.trnNumber)}
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {creatingCustomer ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Add Supplier</h2>
              <button onClick={() => setShowAddSupplierModal(false)} className={`${textMuted} hover:${textSecondary}`}>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Name</label>
                <input type="text" value={newSupplier.name} onChange={(e)=>setNewSupplier({...newSupplier, name:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Company</label>
                <input type="text" value={newSupplier.company} onChange={(e)=>setNewSupplier({...newSupplier, company:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Email</label>
                <input type="email" value={newSupplier.email} onChange={(e)=>setNewSupplier({...newSupplier, email:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Phone</label>
                <input type="tel" value={newSupplier.phone} onChange={(e)=>setNewSupplier({...newSupplier, phone:e.target.value})} className={inputClasses} />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Address</label>
                <input type="text" value={newSupplier.address} onChange={(e)=>setNewSupplier({...newSupplier, address:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>TRN Number</label>
                <input type="text" inputMode="numeric" pattern="\\d*" maxLength={15} placeholder="100XXXXXXXXXXXX" value={newSupplier.trnNumber} onChange={(e)=>setNewSupplier({...newSupplier, trn_number: e.target.value.replace(/\D/g,'').slice(0,15)})} className={inputClasses} />
                {validateTRN(newSupplier.trnNumber) ? (
                  <p className="text-xs text-red-600 mt-1">{validateTRN(newSupplier.trnNumber)}</p>
                ) : (
                  <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="newSupplierDesignatedZone" checked={newSupplier.isDesignatedZone || false} onChange={(e)=>setNewSupplier({...newSupplier, is_designated_zone: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <label htmlFor="newSupplierDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>Designated Zone (Free Zone) Supplier</label>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Payment Terms</label>
                <input type="text" placeholder="e.g., Net 30" value={newSupplier.paymentTerms} onChange={(e)=>setNewSupplier({...newSupplier, payment_terms:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Default Currency</label>
                <select value={newSupplier.defaultCurrency} onChange={(e)=>setNewSupplier({...newSupplier, default_currency:e.target.value})} className={inputClasses}>
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Contact Name</label>
                  <input type="text" value={newSupplier.contactName} onChange={(e)=>setNewSupplier({...newSupplier, contact_name:e.target.value})} className={inputClasses} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Contact Email</label>
                  <input type="email" value={newSupplier.contactEmail} onChange={(e)=>setNewSupplier({...newSupplier, contact_email:e.target.value})} className={inputClasses} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Contact Phone</label>
                  <input type="tel" value={newSupplier.contactPhone} onChange={(e)=>setNewSupplier({...newSupplier, contact_phone:e.target.value})} className={inputClasses} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Status</label>
                <select value={newSupplier.status} onChange={(e)=>setNewSupplier({...newSupplier, status:e.target.value})} className={inputClasses}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <button onClick={()=>setShowAddSupplierModal(false)} className={`px-4 py-2 rounded-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={handleAddSupplier} disabled={creatingSupplier || !!validateTRN(newSupplier.trnNumber)} className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg disabled:opacity-50"><FaSave /> {creatingSupplier? 'Adding...' : 'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplierModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Edit Supplier</h2>
              <button onClick={() => setShowEditSupplierModal(false)} className={`${textMuted} hover:${textSecondary}`}><FaTimes className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Name</label>
                <input type="text" value={selectedSupplier.name} onChange={(e)=>setSelectedSupplier({...selectedSupplier, name:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Company</label>
                <input type="text" value={selectedSupplier.company || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, company:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Email</label>
                <input type="email" value={selectedSupplier.email || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, email:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Phone</label>
                <input type="tel" value={selectedSupplier.phone || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, phone:e.target.value})} className={inputClasses} />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Address</label>
                <input type="text" value={selectedSupplier.address || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, address:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>TRN Number</label>
                <input type="text" inputMode="numeric" pattern="\\d*" maxLength={15} placeholder="100XXXXXXXXXXXX" value={selectedSupplier.trnNumber || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, trn_number: e.target.value.replace(/\D/g,'').slice(0,15)})} className={inputClasses} />
                {validateTRN(selectedSupplier.trnNumber) ? (
                  <p className="text-xs text-red-600 mt-1">{validateTRN(selectedSupplier.trnNumber)}</p>
                ) : (
                  <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="editSupplierDesignatedZone" checked={selectedSupplier.isDesignatedZone || false} onChange={(e)=>setSelectedSupplier({...selectedSupplier, is_designated_zone: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <label htmlFor="editSupplierDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>Designated Zone (Free Zone) Supplier</label>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Payment Terms</label>
                <input type="text" placeholder="e.g., Net 30" value={selectedSupplier.paymentTerms || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, payment_terms:e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Default Currency</label>
                <select value={selectedSupplier.defaultCurrency || 'AED'} onChange={(e)=>setSelectedSupplier({...selectedSupplier, default_currency:e.target.value})} className={inputClasses}>
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Contact Name</label>
                  <input type="text" value={selectedSupplier.contactName || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, contact_name:e.target.value})} className={inputClasses} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Contact Email</label>
                  <input type="email" value={selectedSupplier.contactEmail || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, contact_email:e.target.value})} className={inputClasses} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Contact Phone</label>
                  <input type="tel" value={selectedSupplier.contactPhone || ''} onChange={(e)=>setSelectedSupplier({...selectedSupplier, contact_phone:e.target.value})} className={inputClasses} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Status</label>
                <select value={selectedSupplier.status || 'active'} onChange={(e)=>setSelectedSupplier({...selectedSupplier, status:e.target.value})} className={inputClasses}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <button onClick={()=>setShowEditSupplierModal(false)} className={`px-4 py-2 rounded-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={handleEditSupplier} disabled={updatingSupplier || !!validateTRN(selectedSupplier.trnNumber)} className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg disabled:opacity-50"><FaSave /> {updatingSupplier? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Edit Customer</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.name}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.company}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, company: e.target.value})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedCustomer.email}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedCustomer.phone}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedCustomer.alternatePhone || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, alternate_phone: e.target.value})}
                    placeholder="Enter alternate phone number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={selectedCustomer.website || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, website: e.target.value})}
                    placeholder="Enter website URL"
                    className={inputClasses}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    value={typeof selectedCustomer.address === 'string' 
                      ? selectedCustomer.address 
                      : selectedCustomer.address ? Object.values(selectedCustomer.address).filter(v => v).join(', ') : ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, address: e.target.value})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    TRN Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\\d*"
                    maxLength={15}
                    value={selectedCustomer.trnNumber || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, trn_number: sanitizeTRNInput(e.target.value)})}
                    placeholder="100XXXXXXXXXXXX"
                    className={inputClasses}
                  />
                  {validateTRN(selectedCustomer.trnNumber) && (
                    <p className="text-xs text-red-600 mt-1">{validateTRN(selectedCustomer.trnNumber)}</p>
                  )}
                  {!validateTRN(selectedCustomer.trnNumber) && (
                    <p className={`text-xs mt-1 ${textMuted}`}>15 digits; must start with 100</p>
                  )}
                </div>

                {/* UAE VAT: Designated Zone checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editCustomerDesignatedZone"
                    checked={selectedCustomer.isDesignatedZone || false}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, is_designated_zone: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="editCustomerDesignatedZone" className={`text-sm font-medium ${textSecondary}`}>
                    Designated Zone (Free Zone) Customer
                  </label>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.tradeLicenseNumber || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, trade_license_number: e.target.value})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Expiry
                  </label>
                  <input
                    type="date"
                    value={selectedCustomer.tradeLicenseExpiry || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, trade_license_expiry: e.target.value})}
                    className={inputClasses}
                  />
                  <p className={`text-xs mt-1 ${textMuted}`}>Important: Set expiry date for compliance tracking</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Credit Limit (د.إ)
                  </label>
                  <input
                    type="number"
                    value={selectedCustomer.creditLimit || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, credit_limit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Current Credit Used (د.إ)
                  </label>
                  <input
                    type="number"
                    value={selectedCustomer.currentCredit || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, current_credit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Price List
                  </label>
                  <select
                    value={selectedCustomer.pricelistId || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, pricelist_id: e.target.value ? Number(e.target.value) : null})}
                    className={inputClasses}
                  >
                    <option value="">-- Use Default Price List --</option>
                    {pricelists.map((pricelist) => (
                      <option key={pricelist.id} value={pricelist.id}>
                        {pricelist.name} {pricelist.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${textMuted}`}>Optional: Assign a specific price list for this customer</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Status
                  </label>
                  <select
                    value={selectedCustomer.status}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, status: e.target.value})}
                    className={inputClasses}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors bg-transparent ${
                  isDarkMode 
                    ? 'text-[#B0BEC5] hover:text-gray-300' 
                    : 'text-[#757575] hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditCustomer}
                disabled={updatingCustomer || !!validateTRN(selectedCustomer.trnNumber)}
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {updatingCustomer ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact History Modal */}
      {showContactHistory && contactHistoryCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                Contact History - {contactHistoryCustomer.name}
              </h2>
              <button
                onClick={() => setShowContactHistory(false)}
                className={`${textMuted} hover:${textSecondary}`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add New Contact Entry */}
              <div className={`mb-8 pb-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Add New Contact Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Type
                    </label>
                    <select
                      value={newContact.type}
                      onChange={(e) => setNewContact({...newContact, type: e.target.value})}
                      className={inputClasses}
                    >
                      <option value="call">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={newContact.contactDate}
                      onChange={(e) => setNewContact({...newContact, contact_date: e.target.value})}
                      className={inputClasses}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newContact.subject}
                      onChange={(e) => setNewContact({...newContact, subject: e.target.value})}
                      placeholder="Enter contact subject"
                      className={inputClasses}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={newContact.notes}
                      onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                      placeholder="Enter contact notes"
                      className={inputClasses}
                    />
                  </div>
                </div>
                <button
                  onClick={addContactEntry}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2"
                >
                  <FaPlus />
                  Add Contact Entry
                </button>
              </div>

              {/* Contact History List */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Contact History</h3>
                {contactHistoryCustomer.contactHistory && contactHistoryCustomer.contactHistory.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {contactHistoryCustomer.contactHistory.map(contact => (
                      <div key={contact.id} className={`${cardClasses} p-4 hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-[#008B8B]">
                            {contact.type === 'call' && <FaPhone className="w-4 h-4" />}
                            {contact.type === 'email' && <FaEnvelope className="w-4 h-4" />}
                            {contact.type === 'meeting' && <FaCalendarAlt className="w-4 h-4" />}
                            {contact.type === 'other' && <FaExclamationTriangle className="w-4 h-4" />}
                            <span className="text-sm font-medium capitalize">{contact.type}</span>
                          </div>
                          <span className={`text-sm ${textMuted}`}>
                            {format(new Date(contact.contactDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <h4 className={`font-semibold mb-1 ${textPrimary}`}>{contact.subject}</h4>
                        <p className={`text-sm ${textSecondary}`}>{contact.notes}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaHistory className={`mx-auto text-4xl mb-3 ${textMuted}`} />
                    <p className={textMuted}>No contact history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Upload Modal */}
      {showUploadModal && (
        <CustomerUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false);
            refetchCustomers();
          }}
        />
      )}

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

export default CustomerManagement;
