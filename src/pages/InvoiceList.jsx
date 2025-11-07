import React, { useState, useEffect } from "react";
import {
  Edit,
  Eye,
  Download,
  Trash2,
  Search,
  FileDown,
  Truck,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  RotateCcw,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { createCompany } from "../types";
import { invoiceService } from "../services/invoiceService";
import { deliveryNotesAPI } from "../services/api";
import { notificationService } from "../services/notificationService";
import { authService } from "../services/axiosAuthService";
import InvoicePreview from "../components/InvoicePreview";
import DeleteInvoiceModal from "../components/DeleteInvoiceModal";
import { calculatePaymentStatus, getPaymentStatusConfig } from "../utils/paymentUtils";
import { getInvoiceReminderInfo, generatePaymentReminder, formatDaysMessage } from "../utils/reminderUtils";

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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [sendingReminderIds, setSendingReminderIds] = useState(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deliveryNoteStatus, setDeliveryNoteStatus] = useState({});
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [createdDeliveryNote, setCreatedDeliveryNote] = useState(null);
  const [searchParams] = useSearchParams();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const company = createCompany();

  // Process delivery note status from invoice data
  const processDeliveryNoteStatus = (invoices) => {
    const statusMap = {};

    invoices.forEach((invoice) => {
      if (invoice.delivery_status) {
        statusMap[invoice.id] = {
          hasNotes: invoice.delivery_status.hasNotes,
          count: invoice.delivery_status.count,
        };
      } else {
        statusMap[invoice.id] = { hasNotes: false, count: 0 };
      }
    });

    setDeliveryNoteStatus(statusMap);
  };

  // Fetch invoices with pagination and abort controller
  const fetchInvoices = React.useCallback(async (page, limit, search, status, includeDeleted, signal) => {
    try {
      setLoading(true);
      const queryParams = {
        page: page,
        limit: limit,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        include_deleted: includeDeleted ? 'true' : undefined,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key]
      );

      const response = await invoiceService.getInvoices(queryParams, signal);

      // Check if request was aborted
      if (signal?.aborted) {
        return;
      }

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
      // Ignore abort errors
      if (error.name === 'AbortError' || error.message === 'canceled') {
        console.log('Request cancelled');
        return;
      }
      console.error("Error fetching invoices:", error);
      setInvoices([]);
      setPagination(null);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Consolidated effect with debouncing and request cancellation
  useEffect(() => {
    const abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      fetchInvoices(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
        showDeleted,
        abortController.signal
      );
    }, searchTerm ? 500 : 0); // Debounce search by 500ms, others immediately

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [currentPage, pageSize, searchTerm, statusFilter, showDeleted, fetchInvoices]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, showDeleted]);

  // Initialize search from URL param
  useEffect(() => {
    const q = searchParams.get("search") || "";
    if (q !== searchTerm) {
      setSearchTerm(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Client-side payment status filtering
  const filteredInvoices = React.useMemo(() => {
    if (paymentStatusFilter === 'all') {
      return invoices;
    }

    return invoices.filter((invoice) => {
      // Only apply payment filter to issued invoices
      if (invoice.status !== 'issued') {
        return true; // Show non-issued invoices regardless of payment filter
      }

      const paymentStatus = calculatePaymentStatus(invoice.total, invoice.payments || []);
      return paymentStatus === paymentStatusFilter;
    });
  }, [invoices, paymentStatusFilter]);

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
        label: "DRAFT INVOICE",
      },
      proforma: {
        className: isDarkMode
          ? "bg-blue-900/30 text-blue-300 border-blue-600"
          : "bg-blue-100 text-blue-800 border-blue-300",
        label: "PROFORMA INVOICE",
      },
      sent: {
        className: isDarkMode
          ? "bg-blue-900/30 text-blue-300 border-blue-600"
          : "bg-blue-100 text-blue-800 border-blue-300",
        label: "SENT",
      },
      issued: {
        className: isDarkMode
          ? "bg-green-900/30 text-green-300 border-green-600"
          : "bg-green-100 text-green-800 border-green-300",
        label: "ISSUED",
      },
      overdue: {
        className: isDarkMode
          ? "bg-red-900/30 text-red-300 border-red-600"
          : "bg-red-100 text-red-800 border-red-300",
        label: "OVERDUE",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (invoice) => {
    // Only show payment badge for issued invoices
    if (invoice.status !== 'issued') return null;

    const paymentStatus = calculatePaymentStatus(invoice.total, invoice.payments || []);
    const config = getPaymentStatusConfig(paymentStatus);

    const className = isDarkMode
      ? `${config.bgDark} ${config.textDark} ${config.borderDark}`
      : `${config.bgLight} ${config.textLight} ${config.borderLight}`;

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${className}`}
      >
        {config.label}
      </span>
    );
  };

  const getReminderIndicator = (invoice) => {
    const reminderInfo = getInvoiceReminderInfo(invoice);
    if (!reminderInfo || !reminderInfo.shouldShowReminder) return null;

    const { config, daysUntilDue } = reminderInfo;
    const daysMessage = formatDaysMessage(daysUntilDue);

    const className = isDarkMode
      ? `${config.bgDark} ${config.textDark} ${config.borderDark}`
      : `${config.bgLight} ${config.textLight} ${config.borderLight}`;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${className}`}
        title={`${config.label}: ${daysMessage}`}
      >
        <span>{config.icon}</span>
        <span>{daysMessage}</span>
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
      // Fetch complete invoice details including items before generating PDF
      const fullInvoice = await invoiceService.getInvoice(invoice.id);
      await generateInvoicePDF(fullInvoice, company);
      notificationService.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      notificationService.error(error.message || "Failed to download PDF");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleSendReminder = async (invoice) => {
    if (sendingReminderIds.has(invoice.id)) return;

    const reminderInfo = getInvoiceReminderInfo(invoice);
    if (!reminderInfo || !reminderInfo.shouldShowReminder) {
      notificationService.error('No reminder needed for this invoice');
      return;
    }

    setSendingReminderIds((prev) => new Set(prev).add(invoice.id));

    try {
      // Fetch complete invoice details
      const fullInvoice = await invoiceService.getInvoice(invoice.id);
      const result = await generatePaymentReminder(fullInvoice, company);

      if (result.success) {
        notificationService.success(`Payment reminder generated successfully! (${reminderInfo.config.label})`);
      } else {
        notificationService.error(result.error || 'Failed to generate reminder');
      }
    } catch (error) {
      console.error("Reminder generation error:", error);
      notificationService.error(error.message || "Failed to generate payment reminder");
    } finally {
      setSendingReminderIds((prev) => {
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

    let successCount = 0;
    let failCount = 0;

    for (const invoice of invoices) {
      try {
        // Fetch complete invoice details including items before generating PDF
        const fullInvoice = await invoiceService.getInvoice(invoice.id);
        await generateInvoicePDF(fullInvoice, company);
        successCount++;
        // Add a small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${invoice.invoiceNumber}:`, error);
        failCount++;
      }
    }

    if (failCount === 0) {
      notificationService.success(
        `Downloaded ${successCount} invoice PDFs successfully!`
      );
    } else {
      notificationService.warning(
        `Downloaded ${successCount} PDFs. ${failCount} failed.`
      );
    }
  };

  const handleCreateDeliveryNote = async (invoice) => {
    try {
      const confirmed = window.confirm(
        `Create a delivery note for Invoice #${invoice.invoice_number || invoice.invoiceNumber}?`+
        `\nNote: Only one delivery note is allowed per invoice.`
      );
      if (!confirmed) return;
      // Create delivery note using axios client (auth + baseURL + refresh)
      const { apiClient } = await import("../services/api");
      const resp = await apiClient.post(`/invoices/${invoice.id}/generate-delivery-note`);
      const dn = resp?.delivery_note || resp?.data?.delivery_note || resp;

      notificationService.createSuccess("Delivery note");
      // Open modal with the created delivery note
      if (dn && dn.id) {
        setCreatedDeliveryNote(dn);
        setShowDeliveryModal(true);
      }
      // Refresh invoices to get updated status
      fetchInvoices();
    } catch (error) {
      console.error("Error creating delivery note:", error);
      // If a delivery note already exists, fetch it and open modal
      const msg = error?.response?.data?.error || error?.message || "";
      if (String(msg).toLowerCase().includes("already exists")) {
        try {
          const list = await deliveryNotesAPI.getAll({ invoice_id: invoice.id, limit: 1, page: 1 });
          const dn = Array.isArray(list?.delivery_notes) ? list.delivery_notes[0] : (Array.isArray(list) ? list[0] : null);
          if (dn) {
            setCreatedDeliveryNote(dn);
            setShowDeliveryModal(true);
            notificationService.warning("Delivery note already exists. Showing it.");
            return;
          }
        } catch (e) {
          // ignore and fall through to error toast
        }
      }
      notificationService.createError("Delivery note", error);
    }
  };

  const handleDeleteInvoice = (invoice) => {
    // Open modal to collect deletion reason
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (deleteData) => {
    try {
      await invoiceService.deleteInvoice(deleteData.invoiceId, {
        reason: deleteData.reason,
        reasonCode: deleteData.reasonCode
      });
      notificationService.success('Invoice deleted successfully (soft delete with audit trail)');

      // Close modal
      setShowDeleteModal(false);
      setInvoiceToDelete(null);

      // Refresh invoice list
      // If the last item on the page was deleted, optionally go back one page
      const remaining = (invoices?.length || 1) - 1;
      if (remaining === 0 && pagination && currentPage > 1) {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else {
        await fetchInvoices();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      notificationService.error(error?.response?.data?.error || 'Failed to delete invoice');
      throw error; // Re-throw so modal can handle loading state
    }
  };

  const handleRestoreInvoice = async (invoice) => {
    const number = invoice.invoice_number || invoice.invoiceNumber || invoice.id;
    const confirmed = window.confirm(
      `Restore invoice ${number}?\n\nThis will undelete the invoice and make it active again.`
    );
    if (!confirmed) return;

    try {
      await invoiceService.restoreInvoice(invoice.id);
      notificationService.success('Invoice restored successfully');
      await fetchInvoices();
    } catch (error) {
      console.error('Error restoring invoice:', error);
      notificationService.error(error?.response?.data?.error || 'Failed to restore invoice');
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      // Fetch complete invoice details including items
      const fullInvoice = await invoiceService.getInvoice(invoice.id);
      setPreviewInvoice(fullInvoice);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      notificationService.error("Failed to load invoice details");
    }
  };

  if (loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${
          isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
        }`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span
            className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Loading invoices...
          </span>
        </div>
      </div>
    );
  }

  // Delivery Note Preview Modal
  const DeliveryNoteModal = () => {
    if (!showDeliveryModal || !createdDeliveryNote) return null;
    const dn = createdDeliveryNote;
    const items = Array.isArray(dn.items) ? dn.items : [];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`w-full max-w-3xl rounded-2xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F] text-white' : 'bg-white border-[#E0E0E0] text-gray-900'}`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Truck className="text-teal-600" size={20} />
              <div className="font-semibold">Delivery Note {dn.delivery_note_number}</div>
            </div>
            <button onClick={() => setShowDeliveryModal(false)} className={isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Invoice #</div>
                <div className="font-medium text-teal-600">{dn.invoice_number || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Delivery Date</div>
                <div className="font-medium">{formatDate(dn.delivery_date)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium">{dn.customer_details?.name || '-'}</div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Spec</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2 text-right">Delivered</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className={isDarkMode ? 'border-b border-[#37474F]' : 'border-b border-gray-100'}>
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2">{it.specification || '-'}</td>
                      <td className="px-3 py-2">{it.unit || ''}</td>
                      <td className="px-3 py-2 text-right">{it.ordered_quantity}</td>
                      <td className="px-3 py-2 text-right">{it.delivered_quantity}</td>
                      <td className="px-3 py-2 text-right">{it.remaining_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
            <button
              onClick={() => navigate(`/delivery-notes/${dn.id}`)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500"
            >
              View Full Details
            </button>
            <button
              onClick={() => setShowDeliveryModal(false)}
              className={isDarkMode ? 'px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700' : 'px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (filteredInvoices.length === 0 && !loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${
          isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
        }`}
      >
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode
              ? "bg-[#1E2328] border-[#37474F]"
              : "bg-white border-[#E0E0E0]"
          }`}
        >
          <h2
            className={`text-2xl font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            📄 No Invoices Yet
          </h2>
          <p
            className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
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
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${
        isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
      }`}
    >
      {/* Invoice Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <InvoicePreview
              invoice={previewInvoice}
              company={company}
              onClose={() => {
                setShowPreviewModal(false);
                setPreviewInvoice(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Invoice Modal */}
      <DeleteInvoiceModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        invoice={invoiceToDelete}
      />

      {/* Delivery Note Modal */}
      <DeliveryNoteModal />

      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode
            ? "bg-[#1E2328] border-[#37474F]"
            : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-1 sm:mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div>
            <h1
              className={`text-2xl font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              📄 All Invoices
            </h1>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage and track all your invoices
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {authService.hasPermission('invoices', 'create') && (
              <Link
                to="/create-invoice"
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                <Plus size={18} />
                Create Invoice
              </Link>
            )}
            {invoices.length > 0 && (
              <button
                onClick={handleBulkDownload}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 bg-transparent ${
                  isDarkMode
                    ? "text-white hover:text-gray-300"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                <FileDown size={18} />
                Download Page PDFs
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div
            className={`text-center border rounded-2xl shadow-sm ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <div className="py-4">
              <div className="text-2xl font-bold text-teal-600">
                {pagination ? pagination.total : invoices.length}
              </div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Invoices
              </p>
            </div>
          </div>
          <div
            className={`text-center border rounded-2xl shadow-sm ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <div className="py-4">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalAmount())}
              </div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Page Value
              </p>
            </div>
          </div>
          <div
            className={`text-center border rounded-2xl shadow-sm ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <div className="py-4">
              <div className="text-2xl font-bold text-blue-600">
                {pagination ? pagination.current_page : 1}
              </div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Current Page
              </p>
            </div>
          </div>
          <div
            className={`text-center border rounded-2xl shadow-sm ${
              isDarkMode
                ? "bg-[#1E2328] border-[#37474F]"
                : "bg-white border-[#E0E0E0]"
            }`}
          >
            <div className="py-4">
              <div className="text-2xl font-bold text-orange-600">
                {pagination ? pagination.total_pages : 1}
              </div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Pages
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <div className="flex-grow min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              className={`flex items-center gap-2 cursor-pointer px-4 py-3 border rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="text-teal-600 focus:ring-teal-500 rounded"
              />
              <span className="text-sm font-medium">Show Deleted</span>
            </label>
          </div>
          <div className="min-w-[150px] relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft Invoice</option>
              <option value="proforma">Proforma Invoice</option>
              <option value="sent">Sent</option>
              <option value="issued">Issued</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          </div>
          <div className="min-w-[150px] relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="fully_paid">Fully Paid</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          </div>
          <div className="min-w-[120px] relative">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={20}>20 per page</option>
              <option value={25}>25 per page</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                size={20}
                className={isDarkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Invoice #
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Customer
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Due Date
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Amount
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {filteredInvoices.map((invoice) => {
                const isDeleted = invoice.deleted_at || invoice.deletedAt;
                return (
                <tr
                  key={invoice.id}
                  className={`hover:${
                    isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"
                  } transition-colors ${
                    isDeleted
                      ? isDarkMode
                        ? 'bg-red-900/10 opacity-60'
                        : 'bg-red-50/50 opacity-70'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${isDeleted ? 'line-through' : ''} text-teal-600`}>
                      {invoice.invoiceNumber}
                    </div>
                    {isDeleted && (
                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                        title={`Deleted: ${invoice.deletion_reason || invoice.deletionReason || 'No reason provided'}`}
                      >
                        🗑️ DELETED
                      </div>
                    )}
                    {invoice.recreated_from && (
                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-yellow-400" : "text-yellow-600"
                        }`}
                      >
                        🔄 Recreated from {invoice.recreated_from}
                      </div>
                    )}
                    {invoice.status === "cancelled" && (
                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        ❌ Cancelled & Recreated
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {invoice.customer.name}
                      </div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {invoice.customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {formatDate(invoice.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {formatDate(invoice.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(invoice.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(invoice.status)}
                      {getPaymentStatusBadge(invoice)}
                      {getReminderIndicator(invoice)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-1 justify-end">
                      {authService.hasPermission('invoices', 'update') && !isDeleted && (
                        <Link
                        to={`/edit/${invoice.id}`}
                        className={`p-2 rounded transition-colors ${
                          isDarkMode
                            ? "text-blue-400 hover:text-blue-300"
                            : "hover:bg-gray-100 text-blue-600"
                        }`}
                        title="Edit Invoice"
                      >
                        <Edit size={16} />
                      </Link>
                      )}
                      <button
                        className={`p-2 rounded transition-colors bg-transparent ${
                          isDarkMode
                            ? "text-cyan-400 hover:text-cyan-300"
                            : "hover:bg-gray-100 text-cyan-600"
                        }`}
                        title="View Invoice"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye size={16} />
                      </button>
                      {authService.hasPermission('invoices', 'read') && (
                      <button
                        className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                          downloadingIds.has(invoice.id)
                            ? "opacity-50 cursor-not-allowed"
                            : isDarkMode
                            ? "text-green-400 hover:text-green-300"
                            : "hover:bg-gray-100 text-green-600"
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
                      )}
                      {/* Payment Reminder Button */}
                      {getInvoiceReminderInfo(invoice)?.shouldShowReminder && (
                        <button
                          className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                            sendingReminderIds.has(invoice.id)
                              ? "opacity-50 cursor-not-allowed"
                              : isDarkMode
                              ? "text-yellow-400 hover:text-yellow-300"
                              : "hover:bg-yellow-50 text-yellow-600"
                          }`}
                          title={`Send payment reminder (${getInvoiceReminderInfo(invoice)?.config.label})`}
                          onClick={() => handleSendReminder(invoice)}
                          disabled={sendingReminderIds.has(invoice.id)}
                        >
                          {sendingReminderIds.has(invoice.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Bell size={16} />
                          )}
                        </button>
                      )}
                      {invoice.status === "issued" && authService.hasPermission('delivery_notes', deliveryNoteStatus[invoice.id]?.hasNotes ? 'read' : 'create') && (
                        <button
                          className={`p-2 rounded transition-colors bg-transparent ${
                            deliveryNoteStatus[invoice.id]?.hasNotes
                              ? isDarkMode
                                ? "text-yellow-400 hover:text-yellow-300"
                                : "hover:bg-gray-100 text-yellow-600"
                              : isDarkMode
                              ? "text-green-400 hover:text-green-300"
                              : "hover:bg-gray-100 text-green-600"
                          }`}
                          title={
                            deliveryNoteStatus[invoice.id]?.hasNotes
                              ? `View Delivery Notes (${ 
                                  deliveryNoteStatus[invoice.id]?.count
                                })`
                              : "Create delivery note"
                          }
                          onClick={() =>
                            deliveryNoteStatus[invoice.id]?.hasNotes
                              ? navigate(
                                  `/delivery-notes?invoice_id=${invoice.id}`
                                )
                              : handleCreateDeliveryNote(invoice)
                          }
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      {authService.hasPermission('invoices', 'delete') && !isDeleted && (
                      <button
                        className={`p-2 rounded transition-colors bg-transparent ${
                          isDarkMode
                            ? "text-red-400 hover:text-red-300"
                            : "hover:bg-gray-100 text-red-600"
                        }`}
                        title="Delete Invoice"
                        onClick={() => handleDeleteInvoice(invoice)}
                      >
                        <Trash2 size={16} />
                      </button>
                      )}
                      {/* Restore button for deleted invoices */}
                      {isDeleted && authService.hasPermission('invoices', 'update') && (
                      <button
                        className={`p-2 rounded transition-colors bg-transparent ${
                          isDarkMode
                            ? "text-green-400 hover:text-green-300"
                            : "hover:bg-gray-100 text-green-600"
                        }`}
                        title="Restore Invoice"
                        onClick={() => handleRestoreInvoice(invoice)}
                      >
                        <RotateCcw size={16} />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div
            className={`flex justify-between items-center mt-6 pt-4 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}{" "}
              to{" "}
              {Math.min(
                pagination.current_page * pagination.per_page,
                pagination.total
              )}{" "}
              of {pagination.total} invoices
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) =>
                  handlePageChange(e, pagination.current_page - 1)
                }
                disabled={pagination.current_page === 1}
                className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                  pagination.current_page === 1
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span
                className={`px-3 py-1 text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                onClick={(e) =>
                  handlePageChange(e, pagination.current_page + 1)
                }
                disabled={pagination.current_page === pagination.total_pages}
                className={`p-2 rounded transition-colors bg-transparent disabled:bg-transparent ${
                  pagination.current_page === pagination.total_pages
                    ? isDarkMode
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDarkMode
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100"
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
