import { Clock, Download, Edit, Eye, FileText, PlayCircle, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CreditNotePreview from "../components/credit-notes/CreditNotePreview";
import CreditNoteStatusActions from "../components/credit-notes/CreditNoteStatusActions";
import QCInspectionModal from "../components/credit-notes/QCInspectionModal";
import { NewBadge } from "../components/shared";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from "../hooks/useConfirm";
import useCreditNoteDrafts, { getDraftStatusMessage } from "../hooks/useCreditNoteDrafts";
import { authService } from "../services/axiosAuthService";
import { companyService } from "../services/companyService";
import { creditNoteService } from "../services/creditNoteService";
import { notificationService } from "../services/notificationService";
import { formatCurrency, formatDate } from "../utils/invoiceUtils";
import { validateCreditNoteForDownload } from "../utils/recordUtils";

const STATUS_COLORS = {
  draft: {
    bg: "bg-gray-200 dark:bg-gray-700",
    text: "text-gray-800 dark:text-gray-200",
    label: "Draft",
  },
  issued: {
    bg: "bg-blue-200 dark:bg-blue-800",
    text: "text-blue-800 dark:text-blue-100",
    label: "Issued",
  },
  items_received: {
    bg: "bg-amber-200 dark:bg-amber-800",
    text: "text-amber-800 dark:text-amber-100",
    label: "Items Received",
  },
  items_inspected: {
    bg: "bg-purple-200 dark:bg-purple-800",
    text: "text-purple-800 dark:text-purple-100",
    label: "Items Inspected",
  },
  applied: {
    bg: "bg-green-200 dark:bg-green-800",
    text: "text-green-800 dark:text-green-100",
    label: "Applied",
  },
  refunded: {
    bg: "bg-teal-200 dark:bg-teal-800",
    text: "text-teal-800 dark:text-teal-100",
    label: "Refunded",
  },
  completed: {
    bg: "bg-emerald-200 dark:bg-emerald-800",
    text: "text-emerald-800 dark:text-emerald-100",
    label: "Completed",
  },
  cancelled: {
    bg: "bg-red-200 dark:bg-red-800",
    text: "text-red-800 dark:text-red-100",
    label: "Cancelled",
  },
};

const TYPE_LABELS = {
  ACCOUNTING_ONLY: {
    label: "Accounting",
    bg: "bg-sky-200 dark:bg-sky-800",
    text: "text-sky-800 dark:text-sky-100",
  },
  RETURN_WITH_QC: {
    label: "Return + QC",
    bg: "bg-violet-200 dark:bg-violet-800",
    text: "text-violet-800 dark:text-violet-100",
  },
};

const CreditNoteList = ({ preSelectedInvoiceId }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  const [creditNotes, setCreditNotes] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);

  // Preview and Download state
  const [showPreview, setShowPreview] = useState(false);
  const [previewCreditNote, setPreviewCreditNote] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  // Company data for preview
  const [company, setCompany] = useState(null);

  // Draft management
  const { allDrafts, hasDrafts, deleteDraft } = useCreditNoteDrafts();

  const handleResumeDraft = (draft) => {
    navigate(`/credit-notes/new?invoiceId=${draft.invoiceId}`);
  };

  const handleDeleteDraft = async (draft) => {
    const confirmed = await confirm({
      title: "Discard Draft?",
      message: `Are you sure you want to discard the draft credit note for ${draft.invoiceNumber || "this invoice"}? This cannot be undone.`,
      confirmText: "Discard",
      variant: "danger",
    });

    if (confirmed) {
      deleteDraft(draft.invoiceId);
      notificationService.info("Draft discarded");
    }
  };

  // Fetch company data for preview
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const companyData = await companyService.getCompany();
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to fetch company data:", error);
      }
    };
    fetchCompany();
  }, []);

  // Auto-navigate to credit note form if invoiceId is provided (from invoice list)
  useEffect(() => {
    if (preSelectedInvoiceId) {
      navigate(`/credit-notes/new?invoiceId=${preSelectedInvoiceId}`, {
        replace: true,
      });
    }
  }, [preSelectedInvoiceId, navigate]);

  // Debounce search term - wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await creditNoteService.getAllCreditNotes({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter,
      });

      setCreditNotes(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error loading credit notes:", error);
      notificationService.error("Failed to load credit notes");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadCreditNotes();
  }, [loadCreditNotes]);

  const handleDelete = async (creditNote) => {
    const confirmed = await confirm({
      title: "Delete Credit Note?",
      message: `Are you sure you want to delete credit note ${creditNote.creditNoteNumber}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await creditNoteService.deleteCreditNote(creditNote.id);
      notificationService.success("Credit note deleted successfully");
      loadCreditNotes();
    } catch (error) {
      console.error("Error deleting credit note:", error);
      notificationService.error("Failed to delete credit note");
    }
  };

  // Handle preview - opens preview modal with full credit note data
  const handlePreview = async (creditNote) => {
    try {
      // Fetch full credit note with items
      const fullCreditNote = await creditNoteService.getCreditNote(creditNote.id);
      setPreviewCreditNote(fullCreditNote);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to load credit note details:", error);
      // Fallback to existing data
      setPreviewCreditNote(creditNote);
      setShowPreview(true);
    }
  };

  // Handle PDF download with validation
  const handleDownloadPDF = async (creditNote) => {
    // Prevent duplicate downloads
    if (downloadingIds.has(creditNote.id)) return;

    // Must have an ID (be saved) to download
    if (!creditNote.id) {
      notificationService.warning("Credit note must be saved before downloading PDF.");
      return;
    }

    // Validate completeness
    const validation = validateCreditNoteForDownload(creditNote);
    if (!validation.isValid) {
      notificationService.warning(
        `Credit note is incomplete. Missing: ${validation.warnings.join(", ")}. You can still download, but the PDF may be incomplete.`,
        { duration: 6000 }
      );
    }

    // Set loading state
    setDownloadingIds((prev) => new Set(prev).add(creditNote.id));

    try {
      await creditNoteService.downloadPDF(creditNote.id, creditNote.creditNoteNumber || creditNote.credit_note_number);
      notificationService.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download error:", error);
      notificationService.error(error.message || "Failed to download PDF");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(creditNote.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
    );
  };

  // Only show full-page spinner for initial load, not for search/filter operations
  if (initialLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading credit notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Credit Notes</h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage customer returns and refunds
            </p>
          </div>
          {authService.hasPermission("invoices", "create") && (
            <button
              type="button"
              onClick={() => navigate("/credit-notes/new")}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Credit Note
            </button>
          )}
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="text"
                  placeholder="Search credit notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_COLORS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Drafts Section */}
        {hasDrafts && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 border-dashed ${
              isDarkMode ? "border-amber-600/50 bg-amber-900/10" : "border-amber-400 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`h-5 w-5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
              <h3 className={`font-semibold ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>Unsaved Drafts</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isDarkMode ? "bg-amber-900/50 text-amber-300" : "bg-amber-200 text-amber-800"
                }`}
              >
                {allDrafts.length}
              </span>
            </div>
            <div className="space-y-2">
              {allDrafts.map((draft) => (
                <div
                  key={draft.invoiceId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <div>
                      <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {draft.invoiceNumber || `Invoice #${draft.invoiceId}`}
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {draft.customerName}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                        {getDraftStatusMessage(draft)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {draft.data?.totalCredit > 0 && (
                      <span className={`text-sm font-medium mr-2 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                        {formatCurrency(draft.data.totalCredit)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(draft)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                      }`}
                      title="Discard draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResumeDraft(draft)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Resume
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Notes Table */}
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          {creditNotes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                {debouncedSearch || statusFilter ? "No matching credit notes" : "No credit notes found"}
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {debouncedSearch || statusFilter
                  ? "Try adjusting your search or filter criteria"
                  : 'Click "New Credit Note" to create your first credit note'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Credit Note #
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Invoice #
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Customer
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Total Credit
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Type
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {creditNotes.map((creditNote) => (
                    <tr
                      key={creditNote.id}
                      className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        <div className="font-medium flex items-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/credit-notes/${creditNote.id}`)}
                            className="hover:text-teal-600 hover:underline cursor-pointer text-left"
                          >
                            {creditNote.creditNoteNumber}
                          </button>
                          <NewBadge createdAt={creditNote.createdAt || creditNote.created_at} />
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {creditNote.invoiceNumber}
                      </td>
                      <td className={`px-6 py-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <div className="max-w-xs truncate">
                          {creditNote.customer?.name || creditNote.customerName || "N/A"}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {formatDate(creditNote.creditNoteDate)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-medium text-red-600`}>
                        {formatCurrency(creditNote.totalCredit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const typeConfig =
                            TYPE_LABELS[creditNote.creditNoteType || creditNote.credit_note_type] ||
                            TYPE_LABELS.RETURN_WITH_QC;
                          return (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}
                            >
                              {typeConfig.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(creditNote.status)}</td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                          }
                        }}
                      >
                        <CreditNoteStatusActions
                          creditNoteId={creditNote.id}
                          currentStatus={creditNote.status}
                          onStatusChange={() => loadCreditNotes()}
                          onOpenQCModal={() => {
                            setSelectedCreditNote(creditNote);
                            setQcModalOpen(true);
                          }}
                          onOpenRefundModal={() => {
                            // Simple refund - use prompt for now
                            const method = window.prompt("Refund method (cash, bank_transfer, cheque):");
                            if (method) {
                              creditNoteService
                                .refundCreditNote(creditNote.id, {
                                  refundMethod: method,
                                })
                                .then(() => {
                                  notificationService.success("Refund processed");
                                  loadCreditNotes();
                                })
                                .catch((err) => notificationService.error(err.message));
                            }
                          }}
                          compact
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => handlePreview(creditNote)}
                            className={`p-2 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-300" : "hover:bg-gray-200 text-gray-600"}`}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Download PDF Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(creditNote)}
                            disabled={downloadingIds.has(creditNote.id)}
                            className={`p-2 rounded transition-colors ${
                              downloadingIds.has(creditNote.id)
                                ? "opacity-50 cursor-not-allowed"
                                : isDarkMode
                                  ? "hover:bg-gray-600 text-blue-400"
                                  : "hover:bg-blue-100 text-blue-600"
                            }`}
                            title={downloadingIds.has(creditNote.id) ? "Downloading..." : "Download PDF"}
                          >
                            {downloadingIds.has(creditNote.id) ? (
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                          {/* Edit Button - Only show for drafts */}
                          {creditNote.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => navigate(`/credit-notes/${creditNote.id}`)}
                              className={`p-2 rounded transition-colors ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {/* Delete Button - Only show for drafts */}
                          {creditNote.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => handleDelete(creditNote)}
                              className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
          {pagination && pagination.total > pageSize && (
            <div className={`px-6 py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, pagination.total)} to{" "}
                  {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} credit notes
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkMode
                          ? "border-gray-600 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-gray-50"
                    } ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage * pageSize >= pagination.total}
                    className={`px-3 py-1 rounded border ${
                      currentPage * pageSize >= pagination.total
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkMode
                          ? "border-gray-600 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-gray-50"
                    } ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* QC Inspection Modal */}
      <QCInspectionModal
        isOpen={qcModalOpen}
        onClose={() => {
          setQcModalOpen(false);
          setSelectedCreditNote(null);
        }}
        creditNote={selectedCreditNote}
        onSuccess={() => {
          loadCreditNotes();
          setQcModalOpen(false);
          setSelectedCreditNote(null);
        }}
      />

      {/* Credit Note Preview Modal */}
      {showPreview && previewCreditNote && (
        <CreditNotePreview
          creditNote={previewCreditNote}
          company={company}
          onClose={() => {
            setShowPreview(false);
            setPreviewCreditNote(null);
          }}
        />
      )}
    </div>
  );
};

export default CreditNoteList;
