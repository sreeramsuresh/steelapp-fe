/**
 * DebitNoteList.jsx - UAE VAT Compliance
 *
 * List view for debit notes (adjustments to supplier bills).
 * Used when supplier bill amount needs to be increased after issuance.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  FileText,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Link2,
  DollarSign,
  Building2,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import debitNoteService from '../../services/debitNoteService';
import { supplierService } from '../../services/supplierService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

// Status options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'applied', label: 'Applied' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Status badge colors
const STATUS_COLORS = {
  draft: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
  },
  approved: {
    bg: 'bg-green-200 dark:bg-green-800',
    text: 'text-green-800 dark:text-green-100',
  },
  applied: {
    bg: 'bg-blue-200 dark:bg-blue-800',
    text: 'text-blue-800 dark:text-blue-100',
  },
  cancelled: {
    bg: 'bg-red-200 dark:bg-red-800',
    text: 'text-red-800 dark:text-red-100',
  },
};

// Reason category labels
const REASON_CATEGORIES = {
  PRICE_ADJUSTMENT: 'Price Adjustment',
  QUANTITY_ADJUSTMENT: 'Quantity Adjustment',
  ADDITIONAL_CHARGES: 'Additional Charges',
  SERVICE_CHARGE: 'Service Charge',
  OTHER: 'Other',
};

const DebitNoteList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // Data state
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [vendors, setVendors] = useState([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState(null);

  // Summary state
  const [summary, setSummary] = useState({
    totalDebitNotes: 0,
    totalDebit: 0,
    totalVat: 0,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load vendors for filter dropdown
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const response = await supplierService.getSuppliers();
        setVendors(response.suppliers || []);
      } catch (error) {
        console.error('Failed to load vendors:', error);
      }
    };
    loadVendors();
  }, []);

  // Load debit notes when filters change
  useEffect(() => {
    loadDebitNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter,
    vendorFilter,
    startDate,
    endDate,
  ]); // loadDebitNotes is stable

  const loadDebitNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        supplierId: vendorFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await debitNoteService.getAll(params);
      setDebitNotes(response.data || []);
      setPagination(response.pagination);

      // Calculate summary
      const summaryData = (response.data || []).reduce(
        (acc, note) => ({
          totalDebitNotes: acc.totalDebitNotes + 1,
          totalDebit: acc.totalDebit + (note.totalDebit || 0),
          totalVat: acc.totalVat + (note.vatAmount || 0),
        }),
        { totalDebitNotes: 0, totalDebit: 0, totalVat: 0 },
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading debit notes:', error);
      notificationService.error('Failed to load debit notes');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleDelete = async (debitNote) => {
    const confirmed = await confirm({
      title: 'Delete Debit Note?',
      message: `Are you sure you want to delete debit note ${debitNote.debitNoteNumber}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await debitNoteService.delete(debitNote.id);
      notificationService.success('Debit note deleted successfully');
      loadDebitNotes();
    } catch (error) {
      console.error('Error deleting debit note:', error);
      notificationService.error('Failed to delete debit note');
    }
  };

  const handleApprove = async (debitNote) => {
    const confirmed = await confirm({
      title: 'Approve Debit Note?',
      message: `Approve debit note ${debitNote.debitNoteNumber}?`,
      confirmText: 'Approve',
      variant: 'default',
    });

    if (!confirmed) return;

    try {
      await debitNoteService.approve(debitNote.id);
      notificationService.success('Debit note approved');
      loadDebitNotes();
    } catch (error) {
      console.error('Error approving debit note:', error);
      notificationService.error('Failed to approve debit note');
    }
  };

  const handleApply = async (debitNote) => {
    const confirmed = await confirm({
      title: 'Apply Debit Note?',
      message: `Apply debit note ${debitNote.debitNoteNumber} to vendor account?`,
      confirmText: 'Apply',
      variant: 'default',
    });

    if (!confirmed) return;

    try {
      await debitNoteService.apply(debitNote.id);
      notificationService.success('Debit note applied to vendor account');
      loadDebitNotes();
    } catch (error) {
      console.error('Error applying debit note:', error);
      notificationService.error('Failed to apply debit note');
    }
  };

  const handleCancelNote = async (debitNote) => {
    const reason = window.prompt('Cancellation reason:');
    if (!reason) return;

    try {
      await debitNoteService.cancel(debitNote.id, reason);
      notificationService.success('Debit note cancelled');
      loadDebitNotes();
    } catch (error) {
      console.error('Error cancelling debit note:', error);
      notificationService.error('Failed to cancel debit note');
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.draft;
    const label = status
      ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Draft';
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {label}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setVendorFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || vendorFilter || startDate || endDate;

  // Initial loading spinner
  if (initialLoading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Loading debit notes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Debit Notes
            </h1>
            <p
              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Adjustments to supplier bills (amount increases)
            </p>
          </div>
          <button
            onClick={() => navigate('/app/debit-notes/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Debit Note
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}
              >
                <FileText
                  className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                />
              </div>
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total Debit Notes
                </p>
                <p
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {summary.totalDebitNotes}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'}`}
              >
                <DollarSign
                  className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                />
              </div>
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total Debit
                </p>
                <p
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(summary.totalDebit)}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}
              >
                <Building2
                  className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                />
              </div>
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total VAT
                </p>
                <p
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(summary.totalVat)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                />
                <input
                  type="text"
                  placeholder="Search by debit note number or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-teal-500`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Toggle Advanced Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-600'
                  : isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-teal-600 text-white rounded-full">
                  {
                    [statusFilter, vendorFilter, startDate, endDate].filter(
                      Boolean,
                    ).length
                  }
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={loadDebitNotes}
              disabled={loading}
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div
              className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Vendor */}
                <div>
                  <label
                    htmlFor="vendorFilter"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Vendor
                  </label>
                  <select
                    id="vendorFilter"
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="">All Vendors</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label
                    htmlFor="startDateFilter"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    From Date
                  </label>
                  <input
                    id="startDateFilter"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor="endDateFilter"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    To Date
                  </label>
                  <input
                    id="endDateFilter"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debit Notes Table */}
        <div
          className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          {debitNotes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText
                className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
              />
              <h3
                className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}
              >
                {debouncedSearch || hasActiveFilters
                  ? 'No matching debit notes'
                  : 'No debit notes found'}
              </h3>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {debouncedSearch || hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'Click the button above to create your first debit note'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Debit Note #
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Supplier Bill
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Vendor
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Reason
                    </th>
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Total Debit
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
                >
                  {debitNotes.map((debitNote) => (
                    <tr
                      key={debitNote.id}
                      className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                      onClick={() =>
                        navigate(`/app/debit-notes/${debitNote.id}`)
                      }
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        <div className="font-medium">
                          {debitNote.debitNoteNumber}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <div className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {debitNote.supplierBillNumber || 'N/A'}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <div className="max-w-xs truncate">
                          {debitNote.vendorName || 'N/A'}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {formatDate(debitNote.debitNoteDate)}
                      </td>
                      <td
                        className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <div className="max-w-xs truncate">
                          {REASON_CATEGORIES[debitNote.reasonCategory] ||
                            debitNote.reason ||
                            'N/A'}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                      >
                        +{formatCurrency(debitNote.totalDebit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(debitNote.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {/* View */}
                          <button
                            onClick={() =>
                              navigate(`/app/debit-notes/${debitNote.id}`)
                            }
                            className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Edit - only for drafts */}
                          {debitNote.status === 'draft' && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/app/debit-notes/${debitNote.id}/edit`,
                                )
                              }
                              className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {/* Approve - only for drafts */}
                          {debitNote.status === 'draft' && (
                            <button
                              onClick={() => handleApprove(debitNote)}
                              className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-green-900/30 text-green-400' : 'hover:bg-green-100 text-green-600'}`}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {/* Apply - only for approved */}
                          {debitNote.status === 'approved' && (
                            <button
                              onClick={() => handleApply(debitNote)}
                              className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
                              title="Apply to Account"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {/* Cancel - for non-cancelled/applied */}
                          {!['cancelled', 'applied'].includes(
                            debitNote.status,
                          ) && (
                            <button
                              onClick={() => handleCancelNote(debitNote)}
                              className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-amber-900/30 text-amber-400' : 'hover:bg-amber-100 text-amber-600'}`}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {/* Delete - only for drafts */}
                          {debitNote.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(debitNote)}
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
            <div
              className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Showing{' '}
                  {Math.min((currentPage - 1) * pageSize + 1, pagination.total)}{' '}
                  to {Math.min(currentPage * pageSize, pagination.total)} of{' '}
                  {pagination.total} debit notes
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-1 rounded border ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                          ? 'border-gray-600 hover:bg-gray-700'
                          : 'border-gray-300 hover:bg-gray-50'
                    } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage * pageSize >= pagination.total}
                    className={`flex items-center gap-1 px-3 py-1 rounded border ${
                      currentPage * pageSize >= pagination.total
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                          ? 'border-gray-600 hover:bg-gray-700'
                          : 'border-gray-300 hover:bg-gray-50'
                    } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
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
    </div>
  );
};

export default DebitNoteList;
