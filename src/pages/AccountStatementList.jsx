import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Download, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { accountStatementsAPI, customersAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/invoiceUtils';
import GenerateStatementModal from '../components/GenerateStatementModal';

const AccountStatementList = ({ preSelectedCustomerId, preSelectedCustomerName }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, number: '' });

  // Customer selection modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [hasProcessedPreSelection, setHasProcessedPreSelection] = useState(false);

  // Fetch account statements
  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await accountStatementsAPI.getAll({
        page,
        limit: 10,
        search: searchTerm || undefined,
        customer_id: customerFilter || undefined,
      });
      
      setStatements(response.account_statements || []);
      if (response.pagination) {
        setTotalPages(response.pagination.total_pages);
      }
    } catch (err) {
      console.error('Error fetching account statements:', err);
      setError('Failed to load account statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [page, searchTerm, customerFilter]);

  // Fetch customers for selection
  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 1000, search: customerSearchTerm });
      setCustomers(response.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  useEffect(() => {
    if (showCustomerModal) {
      fetchCustomers();
    }
  }, [showCustomerModal, customerSearchTerm]);

  // Handle pre-selected customer from Invoice List
  useEffect(() => {
    if (preSelectedCustomerId && preSelectedCustomerName && !hasProcessedPreSelection) {
      // Auto-select the customer and open generate modal
      setSelectedCustomer({
        id: parseInt(preSelectedCustomerId),
        name: preSelectedCustomerName
      });
      setShowGenerateModal(true);
      setHasProcessedPreSelection(true);

      // Clean up URL params after processing
      const url = new URL(window.location.href);
      url.searchParams.delete('customerId');
      url.searchParams.delete('customerName');
      window.history.replaceState({}, '', url.toString());
    }
  }, [preSelectedCustomerId, preSelectedCustomerName, hasProcessedPreSelection]);

  const handleGenerateClick = () => {
    setShowCustomerModal(true);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setShowGenerateModal(true);
  };

  const handleStatementGenerated = () => {
    setSuccess('Statement generated successfully!');
    setShowGenerateModal(false);
    setSelectedCustomer(null);
    // Refresh the statements list
    fetchStatements();
  };

  const handleDownloadPDF = async (id) => {
    try {
      await accountStatementsAPI.downloadPDF(id);
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const handleDelete = async () => {
    try {
      await accountStatementsAPI.delete(deleteDialog.id);
      setSuccess('Account statement deleted successfully');
      setDeleteDialog({ open: false, id: null, number: '' });
      fetchStatements();
    } catch (err) {
      setError('Failed to delete account statement');
    }
  };

  const getBalanceBadge = (balance) => {
    const isPositive = balance > 0;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
        isPositive
          ? isDarkMode 
            ? 'bg-red-900/30 text-red-300 border-red-600'
            : 'bg-red-100 text-red-800 border-red-300'
          : isDarkMode
            ? 'bg-green-900/30 text-green-300 border-green-600'
            : 'bg-green-100 text-green-800 border-green-300'
      }`}>
        {formatCurrency(Math.abs(balance))}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading account statements...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-lg border bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Statement of Accounts
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Generate customer statements and track account balances
            </p>
          </div>
          <button
            onClick={handleGenerateClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            Generate Statement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-teal-600">
                {statements.length}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Statements
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(statements.reduce((sum, stmt) => sum + (stmt.total_invoices || 0), 0))}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Invoiced
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(statements.reduce((sum, stmt) => sum + (stmt.total_payments || 0), 0))}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Paid
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.closing_balance, 0))}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Outstanding
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <div className="flex-grow min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <input
              type="text"
              placeholder="Search by statement number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Statements Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Statement #
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Period
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Invoiced
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Paid
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Balance
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {statements.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No account statements found
                  </td>
                </tr>
              ) : (
                statements.map((statement) => (
                  <tr key={statement.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {statement.statement_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {statement.customer_name}
                      </div>
                      {statement.customer_company && (
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {statement.customer_company}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(statement.from_date)} - {formatDate(statement.to_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(statement.total_invoices)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(statement.total_payments)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBalanceBadge(statement.closing_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                          }`}
                          onClick={() => navigate(`/account-statements/${statement.id}`)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-100 text-green-600'
                          }`}
                          onClick={() => handleDownloadPDF(statement.id)}
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                          }`}
                          onClick={() => setDeleteDialog({
                            open: true,
                            id: statement.id,
                            number: statement.statement_number
                          })}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`p-2 rounded transition-colors ${
                  page === 1 
                    ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded transition-colors ${
                  page === totalPages 
                    ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full ${
            isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Account Statement
              </h3>
            </div>
            <div className="p-6">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to delete statement <strong>{deleteDialog.number}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setDeleteDialog({ open: false, id: null, number: '' })}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg border shadow-lg ${
            isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className={`ml-2 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl max-h-[80vh] flex flex-col ${
            isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Select Customer
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choose a customer to generate statement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomerModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {customers.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No customers found
                  </div>
                ) : (
                  customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isDarkMode
                          ? 'border-gray-700 hover:border-teal-600 hover:bg-gray-800'
                          : 'border-gray-200 hover:border-teal-600 hover:bg-teal-50'
                      }`}
                    >
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {customer.name}
                      </div>
                      {customer.company && (
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {customer.company}
                        </div>
                      )}
                      {customer.email && (
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {customer.email}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Statement Modal */}
      {showGenerateModal && selectedCustomer && (
        <GenerateStatementModal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onGenerated={handleStatementGenerated}
        />
      )}
    </div>
  );
};

export default AccountStatementList;