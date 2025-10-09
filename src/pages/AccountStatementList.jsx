import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Download, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { accountStatementsAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/invoiceUtils';

const AccountStatementList = () => {
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
        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Account Statements
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Generate and manage customer account statements
            </p>
          </div>
          <Link
            to="/account-statements/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            New Statement
          </Link>
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
                {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.total_invoiced, 0))}
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
                {formatCurrency(statements.reduce((sum, stmt) => sum + stmt.total_paid, 0))}
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
                        {formatDate(statement.start_date)} - {formatDate(statement.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(statement.total_invoiced)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(statement.total_paid)}
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

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg border shadow-lg ${
            isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
              <button 
                onClick={() => setSuccess('')}
                className={`ml-2 ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStatementList;