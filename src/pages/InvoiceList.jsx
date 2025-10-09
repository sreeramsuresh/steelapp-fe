import React, { useState, useEffect } from "react";
import { Edit, Eye, Download, Trash2, Search, FileDown, Truck, Plus, X, CheckCircle, AlertCircle, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { createCompany } from "../types";
import { invoiceService } from "../services/invoiceService";
import { deliveryNotesAPI } from "../services/api";
import { notificationService } from "../services/notificationService";


const InvoiceList = ({ defaultStatusFilter = "all" }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  // Set theme for notification service
  React.useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deliveryNoteStatus, setDeliveryNoteStatus] = useState({});
  const [searchParams] = useSearchParams();

  const company = createCompany();

  // Process delivery note status from invoice data
  const processDeliveryNoteStatus = (invoices) => {
    const statusMap = {};
    
    invoices.forEach(invoice => {
      if (invoice.delivery_status) {
        statusMap[invoice.id] = {
          hasNotes: invoice.delivery_status.hasNotes,
          count: invoice.delivery_status.count
        };
      } else {
        statusMap[invoice.id] = { hasNotes: false, count: 0 };
      }
    });
    
    setDeliveryNoteStatus(statusMap);
  };

  // Fetch invoices with pagination
  const fetchInvoices = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        ...params,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key]
      );

      const response = await invoiceService.getInvoices(queryParams);

      if (response.invoices) {
        setInvoices(response.invoices);
        setPagination(response.pagination);
        
        // Process delivery note status from invoice data
        processDeliveryNoteStatus(response.invoices);
      } else {
        // Fallback for non-paginated response
        setInvoices(response);
        setPagination(null);
        
        // Process delivery note status from invoice data
        processDeliveryNoteStatus(response);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices when component mounts or dependencies change
  useEffect(() => {
    fetchInvoices();
  }, [currentPage, pageSize]);

  // Debounced search and filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchInvoices();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Initialize search from URL param and keep in sync
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
    setCurrentPage(1);
  }, [searchParams]);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status = "draft") => {
    const statusConfig = {
      draft: { 
        className: isDarkMode 
          ? "bg-gray-900/30 text-gray-300 border-gray-600" 
          : "bg-gray-100 text-gray-800 border-gray-300", 
        label: "DRAFT" 
      },
      proforma: { 
        className: isDarkMode 
          ? "bg-blue-900/30 text-blue-300 border-blue-600" 
          : "bg-blue-100 text-blue-800 border-blue-300", 
        label: "PROFORMA" 
      },
      sent: { 
        className: isDarkMode 
          ? "bg-blue-900/30 text-blue-300 border-blue-600" 
          : "bg-blue-100 text-blue-800 border-blue-300", 
        label: "SENT" 
      },
      paid: { 
        className: isDarkMode 
          ? "bg-green-900/30 text-green-300 border-green-600" 
          : "bg-green-100 text-green-800 border-green-300", 
        label: "PAID" 
      },
      overdue: { 
        className: isDarkMode 
          ? "bg-red-900/30 text-red-300 border-red-600" 
          : "bg-red-100 text-red-800 border-red-300", 
        label: "OVERDUE" 
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTotalAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const handleDownloadPDF = async (invoice) => {
    if (downloadingIds.has(invoice.id)) return;

    setDownloadingIds((prev) => new Set(prev).add(invoice.id));

    try {
      await generateInvoicePDF(invoice, company);
      notificationService.success('PDF downloaded successfully!');
    } catch (error) {
      notificationService.error(error.message || 'Failed to download PDF');
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleBulkDownload = async () => {
    if (invoices.length === 0) return;

    const confirmed = window.confirm(
      `Download PDFs for all ${invoices.length} invoices on this page?`
    );
    if (!confirmed) return;

    for (const invoice of invoices) {
      try {
        await generateInvoicePDF(invoice, company);
        // Add a small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${invoice.invoiceNumber}:`, error);
      }
    }

    notificationService.success(`Downloaded ${invoices.length} invoice PDFs successfully!`);
  };

  const handleCreateDeliveryNote = async (invoice) => {
    try {
      // Create delivery note by calling the API to generate one for this invoice
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/invoices/${invoice.id}/generate-delivery-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create delivery note');
      }

      notificationService.createSuccess('Delivery note');
      
      // Refresh the invoices to get updated delivery note status
      fetchInvoices();
    } catch (error) {
      console.error('Error creating delivery note:', error);
      notificationService.createError('Delivery note', error);
    }
  };



  if (loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading invoices...
          </span>
        </div>
      </div>
    );
  }

  if (invoices.length === 0 && !loading) {
    return (
      <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className={`text-center p-12 rounded-2xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📄 No Invoices Yet
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchTerm || statusFilter !== "all"
              ? "No invoices match your search criteria"
              : "Create your first invoice to get started"}
          </p>
          <Link
            to="/create-invoice"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Create Invoice
          </Link>
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
              📄 All Invoices
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and track all your invoices
            </p>
          </div>
          {invoices.length > 0 && (
            <button
              onClick={handleBulkDownload}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 bg-transparent ${
                isDarkMode 
                  ? 'text-white hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              <FileDown size={18} />
              Download Page PDFs
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-teal-600">
                {pagination ? pagination.total : invoices.length}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Invoices
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalAmount())}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Page Value
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-blue-600">
                {pagination ? pagination.current_page : 1}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Current Page
              </p>
            </div>
          </div>
          <div className={`text-center border rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="py-4">
              <div className="text-2xl font-bold text-orange-600">
                {pagination ? pagination.total_pages : 1}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Pages
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
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>
          <div className="min-w-[120px] relative">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Invoice #
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Due Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Amount
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold text-teal-600`}>
                      {invoice.invoiceNumber}
                    </div>
                    {invoice.recreated_from && (
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        🔄 Recreated from {invoice.recreated_from}
                      </div>
                    )}
                    {invoice.status === 'cancelled' && (
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        ❌ Cancelled & Recreated
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {invoice.customer.name}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {invoice.customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(invoice.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(invoice.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(invoice.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-1 justify-end">
                      <Link
                        to={`/edit/${invoice.id}`}
                        className={`p-2 rounded transition-colors ${
                          isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'hover:bg-gray-100 text-blue-600'
                        }`}
                        title="Edit Invoice"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        className={`p-2 rounded transition-colors bg-transparent ${
                          isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'hover:bg-gray-100 text-cyan-600'
                        }`}
                        title="View Invoice"
                        onClick={() => {
                          /* TODO: Implement view */
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                          downloadingIds.has(invoice.id)
                            ? 'opacity-50 cursor-not-allowed'
                            : isDarkMode ? 'text-green-400 hover:text-green-300' : 'hover:bg-gray-100 text-green-600'
                        }`}
                        title="Download PDF"
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={downloadingIds.has(invoice.id)}
                      >
                        {downloadingIds.has(invoice.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      {invoice.status === 'paid' && (
                        <button
                          className={`p-2 rounded transition-colors bg-transparent ${
                            deliveryNoteStatus[invoice.id]?.hasNotes
                              ? isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'hover:bg-gray-100 text-yellow-600'
                              : isDarkMode ? 'text-green-400 hover:text-green-300' : 'hover:bg-gray-100 text-green-600'
                          }`}
                          title={
                            deliveryNoteStatus[invoice.id]?.hasNotes 
                              ? `View Delivery Notes (${deliveryNoteStatus[invoice.id]?.count})` 
                              : "Create delivery note"
                          }
                          onClick={() => 
                            deliveryNoteStatus[invoice.id]?.hasNotes 
                              ? navigate(`/delivery-notes?invoice_id=${invoice.id}`)
                              : handleCreateDeliveryNote(invoice)
                          }
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      <button
                        className={`p-2 rounded transition-colors bg-transparent ${
                          isDarkMode ? 'text-red-400 hover:text-red-300' : 'hover:bg-gray-100 text-red-600'
                        }`}
                        title="Delete Invoice"
                        onClick={() => {
                          /* TODO: Implement delete */
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className={`flex justify-between items-center mt-6 pt-4 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} invoices
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handlePageChange(e, pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                  pagination.current_page === 1 
                    ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-3 py-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                onClick={(e) => handlePageChange(e, pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                  pagination.current_page === pagination.total_pages 
                    ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                    : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default InvoiceList;
