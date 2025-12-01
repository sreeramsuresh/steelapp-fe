import React, { useState, useEffect } from 'react';
import {
  Edit,
  Eye,
  Download,
  Trash2,
  Search,
  Plus,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Ban,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/axiosAuthService';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../utils/invoiceUtils';
import { quotationsAPI } from '../services/api';
import { useApiData } from '../hooks/useApi';
import { companyService } from '../services';
import { NewBadge } from '../components/shared';
import QuotationPreview from '../components/quotations/QuotationPreview';
import { validateQuotationForDownload } from '../utils/recordUtils';
import { notificationService } from '../services/notificationService';

const QuotationList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Initialize state
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  const getStatusBadge = (status = 'draft') => {
    const statusConfig = {
      draft: { 
        className: isDarkMode 
          ? 'bg-gray-900/30 text-gray-300 border-gray-600' 
          : 'bg-gray-100 text-gray-800 border-gray-300', 
        label: 'DRAFT',
        icon: <Edit size={14} />,
      },
      sent: { 
        className: isDarkMode 
          ? 'bg-blue-900/30 text-blue-300 border-blue-600' 
          : 'bg-blue-100 text-blue-800 border-blue-300', 
        label: 'SENT',
        icon: <Send size={14} />,
      },
      accepted: { 
        className: isDarkMode 
          ? 'bg-green-900/30 text-green-300 border-green-600' 
          : 'bg-green-100 text-green-800 border-green-300', 
        label: 'ACCEPTED',
        icon: <ThumbsUp size={14} />,
      },
      rejected: { 
        className: isDarkMode 
          ? 'bg-red-900/30 text-red-300 border-red-600' 
          : 'bg-red-100 text-red-800 border-red-300', 
        label: 'REJECTED',
        icon: <ThumbsDown size={14} />,
      },
      expired: { 
        className: isDarkMode 
          ? 'bg-orange-900/30 text-orange-300 border-orange-600' 
          : 'bg-orange-100 text-orange-800 border-orange-300', 
        label: 'EXPIRED',
        icon: <Clock size={14} />,
      },
      converted: { 
        className: isDarkMode 
          ? 'bg-purple-900/30 text-purple-300 border-purple-600' 
          : 'bg-purple-100 text-purple-800 border-purple-300', 
        label: 'CONVERTED',
        icon: <FileCheck size={14} />,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const fetchQuotations = async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await quotationsAPI.getAll(params);

      if (response?.quotations) {
        setQuotations(response.quotations);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        setQuotations([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError(err.message || 'Failed to fetch quotations');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, searchTerm, statusFilter]);

  const { data: company } = useApiData(companyService.getCompany, [], true);

  const handleDelete = async (id) => {
    try {
      await quotationsAPI.delete(id);
      setSuccess('Quotation deleted successfully');
      setDeleteConfirm(null);
      fetchQuotations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting quotation:', err);
      setError(err.message || 'Failed to delete quotation');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await quotationsAPI.updateStatus(id, newStatus);
      setSuccess(`Quotation status updated to ${newStatus}`);
      fetchQuotations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleConvertToInvoice = async (id) => {
    try {
      const response = await quotationsAPI.convertToInvoice(id);
      setSuccess(`Quotation converted to invoice ${response.invoiceNumber}`);
      fetchQuotations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error converting quotation:', err);
      setError(err.message || 'Failed to convert quotation');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Preview handler
  const handlePreview = (quotation) => {
    setPreviewQuotation(quotation);
    setShowPreview(true);
  };

  // Download handler with validation
  const handleDownloadPDF = async (quotation) => {
    // Validate before download
    const validation = validateQuotationForDownload(quotation);
    if (!validation.isValid) {
      notificationService.error(`Cannot download: ${validation.errors.join(', ')}`);
      return;
    }

    // Set loading state
    setDownloadingIds((prev) => new Set([...prev, quotation.id]));

    try {
      // Use backend PDF generation only (per PDF_WORKFLOW.md)
      await quotationsAPI.downloadPDF(quotation.id);
      notificationService.success('PDF downloaded successfully');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      notificationService.error(err.message || 'Failed to download PDF');
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quotation.id);
        return newSet;
      });
    }
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'} p-4`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📋 Quotations
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and track your quotations
            </p>
          </div>
          {authService.hasPermission('quotations','create') && (
            <Link
              to="/quotations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-teal-500/25"
            >
              <Plus size={20} />
              New Quotation
            </Link>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
          <button
            onClick={() => setSuccess('')}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={`p-6 rounded-xl mb-6 border ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} size={20} />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="converted">Converted</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchQuotations}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
      }`}>
        {quotations.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No quotations found
            </h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by creating your first quotation'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Quotation
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Customer
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Date
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Valid Until
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Amount
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {quotation.quotationNumber}
                          <NewBadge createdAt={quotation.createdAt} hoursThreshold={2} />
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {quotation.items?.length || 0} items
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {quotation.customerDetails?.name || 'N/A'}
                      </div>
                      {quotation.customerDetails?.company && (
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {quotation.customerDetails.company}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(quotation.quotationDate)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {quotation.validUntil ? (
                        <div className={`text-sm ${
                          isExpired(quotation.validUntil) 
                            ? 'text-red-600 font-medium' 
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDate(quotation.validUntil)}
                          {isExpired(quotation.validUntil) && (
                            <div className="text-xs text-red-500">Expired</div>
                          )}
                        </div>
                      ) : (
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          No expiry
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(quotation.total)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(quotation.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {authService.hasPermission('quotations','read') && (
                          <button
                            onClick={() => handlePreview(quotation)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Preview Quotation"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {authService.hasPermission('quotations','update') && (
                          <Link
                            to={`/quotations/${quotation.id}/edit`}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Edit Quotation"
                          >
                            <Edit size={16} />
                          </Link>
                        )}
                        {authService.hasPermission('quotations','read') && (
                          <button
                            onClick={() => handleDownloadPDF(quotation)}
                            disabled={downloadingIds.has(quotation.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              downloadingIds.has(quotation.id)
                                ? 'opacity-50 cursor-not-allowed'
                                : isDarkMode
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Download PDF"
                          >
                            {downloadingIds.has(quotation.id) ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                        )}
                        
                        {/* Status Update Dropdown */}
                        {quotation.status !== 'converted' && (
                          <div className="relative group">
                            <button
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Update Status"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 ${
                              isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                            }`}>
                              {quotation.status === 'draft' && (
                                <button
                                  onClick={() => handleStatusUpdate(quotation.id, 'sent')}
                                  className={`w-full px-4 py-2 text-left text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  Mark as Sent
                                </button>
                              )}
                              {quotation.status === 'sent' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(quotation.id, 'accepted')}
                                    className={`w-full px-4 py-2 text-left text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}
                                  >
                                    Mark as Accepted
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(quotation.id, 'rejected')}
                                    className={`w-full px-4 py-2 text-left text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}
                                  >
                                    Mark as Rejected
                                  </button>
                                </>
                              )}
                              {quotation.status === 'accepted' && (
                                <button
                                  onClick={() => handleConvertToInvoice(quotation.id)}
                                  className={`w-full px-4 py-2 text-left text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  Convert to Invoice
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {authService.hasPermission('quotations','delete') && (
                          <button
                            onClick={() => setDeleteConfirm(quotation.id)}
                            className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Quotation"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    page === 1 
                      ? isDarkMode ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'
                      : isDarkMode 
                        ? 'border-gray-600 text-white hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`p-2 rounded-lg border transition-colors ${
                    page === totalPages 
                      ? isDarkMode ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'
                      : isDarkMode 
                        ? 'border-gray-600 text-white hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full p-6 ${
            isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={24} />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Quotation
              </h3>
            </div>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 border rounded-lg ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewQuotation && (
        <QuotationPreview
          quotation={previewQuotation}
          company={company || {}}
          onClose={() => {
            setShowPreview(false);
            setPreviewQuotation(null);
          }}
        />
      )}
    </div>
  );
};

export default QuotationList;
