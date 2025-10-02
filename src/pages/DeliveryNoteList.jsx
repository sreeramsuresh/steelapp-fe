import React, { useState, useEffect } from 'react';
import {
  Plus as AddIcon,
  Download as DownloadIcon,
  Eye as ViewIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  Truck as TruckIcon,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { deliveryNotesAPI } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const DeliveryNoteList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const invoiceIdFromUrl = searchParams.get('invoice_id');
  
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, number: '' });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        className: isDarkMode 
          ? "bg-orange-900/30 text-orange-300 border-orange-600" 
          : "bg-orange-100 text-orange-800 border-orange-300", 
        label: "Pending" 
      },
      partial: { 
        className: isDarkMode 
          ? "bg-blue-900/30 text-blue-300 border-blue-600" 
          : "bg-blue-100 text-blue-800 border-blue-300", 
        label: "Partial Delivery" 
      },
      completed: { 
        className: isDarkMode 
          ? "bg-green-900/30 text-green-300 border-green-600" 
          : "bg-green-100 text-green-800 border-green-300", 
        label: "Completed" 
      },
      cancelled: { 
        className: isDarkMode 
          ? "bg-red-900/30 text-red-300 border-red-600" 
          : "bg-red-100 text-red-800 border-red-300", 
        label: "Cancelled" 
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const fetchDeliveryNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
        start_date: dateFilter || undefined,
        invoice_id: invoiceIdFromUrl || undefined,
      };

      const response = await deliveryNotesAPI.getAll(params);
      setDeliveryNotes(response.delivery_notes || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (err) {
      setError('Failed to fetch delivery notes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryNotes();
  }, [page, rowsPerPage, search, statusFilter, dateFilter]);

  const handleDownloadPDF = async (id) => {
    try {
      await deliveryNotesAPI.downloadPDF(id);
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError('Failed to download PDF: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deliveryNotesAPI.delete(deleteDialog.id);
      setSuccess('Delivery note deleted successfully');
      setDeleteDialog({ open: false, id: null, number: '' });
      fetchDeliveryNotes();
    } catch (err) {
      setError('Failed to delete delivery note: ' + err.message);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-semibold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <TruckIcon size={36} className="text-teal-600" />
          Delivery Notes
        </h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          onClick={() => navigate('/delivery-notes/new')}
        >
          <AddIcon size={20} />
          Create Delivery Note
        </button>
      </div>

      {/* Invoice Filter Indicator */}
      {invoiceIdFromUrl && (
        <div className={`mb-4 p-4 rounded-lg border ${
          isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            Showing delivery notes for Invoice ID: {invoiceIdFromUrl}
            <button 
              className={`ml-4 px-3 py-1 text-sm rounded transition-colors ${
                isDarkMode ? 'bg-blue-800 hover:bg-blue-700 text-blue-200' : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
              }`}
              onClick={() => navigate('/delivery-notes')}
            >
              View All Delivery Notes
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 mb-6 rounded-xl border ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex gap-4 flex-wrap items-center">
          <div className="min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <input
              type="text"
              placeholder="Search by delivery note number, invoice, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div className="min-w-[150px] relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>

          <div className="min-w-[150px]">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <button
            className={`px-4 py-3 border rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setDateFilter('');
              setPage(0);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Delivery Notes Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Delivery Note #
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Invoice #
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Delivery Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Vehicle
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Loading delivery notes...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : deliveryNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-6 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No delivery notes found
                  </td>
                </tr>
              ) : (
                deliveryNotes.map((deliveryNote) => (
                  <tr key={deliveryNote.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {deliveryNote.delivery_note_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-teal-600">
                        {deliveryNote.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {deliveryNote.customer_details?.name}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {deliveryNote.customer_details?.company}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(deliveryNote.delivery_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(deliveryNote.status)}
                        {deliveryNote.is_partial && (
                          <span className="text-xs text-orange-500 font-medium">
                            Partial Delivery
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {deliveryNote.vehicle_number || '-'}
                      </div>
                      {deliveryNote.driver_name && (
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {deliveryNote.driver_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                          }`}
                          onClick={() => navigate(`/delivery-notes/${deliveryNote.id}`)}
                          title="View Details"
                        >
                          <ViewIcon size={16} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-teal-400' : 'hover:bg-gray-100 text-teal-600'
                          }`}
                          onClick={() => navigate(`/delivery-notes/${deliveryNote.id}/edit`)}
                          title="Edit"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-100 text-green-600'
                          }`}
                          onClick={() => handleDownloadPDF(deliveryNote.id)}
                          title="Download PDF"
                        >
                          <DownloadIcon size={16} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                          }`}
                          onClick={() => setDeleteDialog({
                            open: true,
                            id: deliveryNote.id,
                            number: deliveryNote.delivery_note_number
                          })}
                          title="Delete"
                        >
                          <DeleteIcon size={16} />
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
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDarkMode ? 'border-gray-700 bg-[#1E2328]' : 'border-gray-200 bg-white'
        }`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
            Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount} results
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className={`px-2 py-1 border rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handlePageChange(e, page - 1)}
                disabled={page === 0}
                className={`p-2 rounded transition-colors ${
                  page === 0 
                    ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page {page + 1} of {Math.ceil(totalCount / rowsPerPage)}
              </span>
              <button
                onClick={(e) => handlePageChange(e, page + 1)}
                disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                className={`p-2 rounded transition-colors ${
                  page >= Math.ceil(totalCount / rowsPerPage) - 1 
                    ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
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
                Delete Delivery Note
              </h3>
            </div>
            <div className="p-6">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to delete delivery note <strong>{deleteDialog.number}</strong>?
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

export default DeliveryNoteList;