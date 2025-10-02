import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../utils/invoiceUtils';
import { format } from 'date-fns';
import { customerService } from '../services/customerService';
import { useApiData, useApi } from '../hooks/useApi';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';
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
  FaCalendarAlt
} from 'react-icons/fa';

const CustomerManagement = () => {
  const { isDarkMode } = useTheme();
  
  // Set notification service theme
  useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);
  const [activeTab, setActiveTab] = useState('profiles');
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

  // Sync search from URL param
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
  }, [searchParams]);

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
      notificationService.createSuccess('Customer');
    } catch (error) {
      notificationService.createError('Customer', error);
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
      notificationService.updateSuccess('Customer');
    } catch (error) {
      notificationService.updateError('Customer', error);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        refetchCustomers();
        notificationService.deleteSuccess('Customer');
      } catch (error) {
        notificationService.deleteError('Customer', error);
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
      notificationService.success('Contact entry added successfully!');
    } catch (error) {
      notificationService.error('Failed to add contact entry: ' + (error.message || 'Unknown error'));
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
        </div>
        
        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          <FaPlus />
          Add Customer
        </button>
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
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className={`p-2 rounded transition-colors bg-transparent ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'hover:bg-gray-100 text-red-600'}`}
                    title="Delete Customer"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
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
                    {typeof customer.address === 'object' 
                      ? `${customer.address.street}, ${customer.address.city}` 
                      : customer.address
                    }
                  </span>
                </div>
              </div>

              {/* Credit Info */}
              <div className={`border-t pt-4 ${isDarkMode ? 'border-[#37474F]' : 'border-[#E0E0E0]'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs ${textMuted}`}>Credit Limit</span>
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    {formatCurrency(Number(customer.credit_limit) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs ${textMuted}`}>Used</span>
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    {formatCurrency(Number(customer.current_credit) || 0)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className={`relative w-full rounded-full h-2 mb-1 ${isDarkMode ? 'bg-[#37474F]' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-[#008B8B] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${customer.credit_limit > 0 ? ((customer.current_credit || 0) / customer.credit_limit) * 100 : 0}%` 
                    }}
                  />
                </div>
                <p className={`text-xs text-right ${textMuted}`}>
                  {customer.credit_limit > 0 ? Math.round(((customer.current_credit || 0) / customer.credit_limit) * 100) : 0}% used
                </p>
              </div>
            </div>
          ))
        )}
      </div>
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
                      width: `${customer.credit_limit > 0 ? (customer.current_credit / customer.credit_limit) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className={`text-sm font-medium w-12 text-right ${textSecondary}`}>
                  {customer.credit_limit > 0 ? Math.round((customer.current_credit / customer.credit_limit) * 100) : 0}%
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
                    value={newCustomer.trn_number}
                    onChange={(e) => setNewCustomer({...newCustomer, trn_number: e.target.value})}
                    placeholder="Enter TRN number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    value={newCustomer.trade_license_number}
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
                    value={newCustomer.trade_license_expiry}
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
                    value={newCustomer.credit_limit || ''}
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
                    value={newCustomer.current_credit || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, current_credit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    placeholder="Enter current credit used"
                    className={inputClasses}
                  />
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
                disabled={creatingCustomer}
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {creatingCustomer ? 'Adding...' : 'Add Customer'}
              </button>
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
                    value={selectedCustomer.trn_number || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, trn_number: e.target.value})}
                    placeholder="Enter TRN number"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                    Trade License Number
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.trade_license_number || ''}
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
                    value={selectedCustomer.trade_license_expiry || ''}
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
                    value={selectedCustomer.credit_limit || ''}
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
                    value={selectedCustomer.current_credit || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, current_credit: e.target.value === '' ? '' : Number(e.target.value) || ''})}
                    className={inputClasses}
                  />
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
                disabled={updatingCustomer}
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
                      value={newContact.contact_date}
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
                {contactHistoryCustomer.contact_history && contactHistoryCustomer.contact_history.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {contactHistoryCustomer.contact_history.map(contact => (
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
                            {format(new Date(contact.contact_date), 'MMM dd, yyyy')}
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
    </div>
  );
};

export default CustomerManagement;
