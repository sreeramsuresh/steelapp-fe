import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  FileText,
  DollarSign,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MapPin,
  Building2,
  Info,
  FileDown,
  FileSpreadsheet,
  Send,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Banknote,
  Ban,
  Edit3,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateDMY,
  toUAEDateProfessional,
} from '../utils/invoiceUtils';
import api from '../services/api';
import vatReturnService from '../services/vatReturnService';
import vendorBillService from '../services/vendorBillService';
import advancePaymentService from '../services/advancePaymentService';
import vatAmendmentService from '../services/vatAmendmentService';

/**
 * UAE VAT Return Report Component - Enhanced
 *
 * Complete Form 201 compliance with:
 * - Output VAT (Boxes 1-7)
 * - Input VAT (Boxes 8-13)
 * - Vendor Bills Summary
 * - Advance Payments VAT
 * - Blocked VAT (Non-recoverable)
 * - Net VAT Calculation
 * - Amendments History
 *
 * UAE FTA Form 201 Structure:
 * OUTPUT VAT:
 *   Box 1: Standard rated supplies by Emirate (5%)
 *   Box 2: Tax refunds for tourists
 *   Box 3: Zero-rated supplies
 *   Box 4: Exempt supplies
 *   Box 5: Goods imported into UAE
 *   Box 6: Adjustments to output tax
 *   Box 7: Total VAT due for the period
 *
 * INPUT VAT:
 *   Box 8: Goods imported into UAE (recoverable)
 *   Box 9: Adjustments to goods imported
 *   Box 10: Standard rated expenses (5%)
 *   Box 11: Supplies subject to reverse charge (recoverable)
 *   Box 12: Adjustments to input tax
 *   Box 13: Total recoverable tax for the period
 *
 * NET VAT:
 *   Box 14: Net VAT due (if Box 7 > Box 13)
 *   Box 15: VAT refundable (if Box 13 > Box 7)
 */
const VATReturnReport = () => {
  const { id: periodId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vatReturn, setVatReturn] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: '',
  });

  // Enhanced data state
  const [form201, setForm201] = useState(null);
  const [vendorBillSummary, setVendorBillSummary] = useState([]);
  const [advancePayments, setAdvancePayments] = useState([]);
  const [blockedVatLog, setBlockedVatLog] = useState([]);
  const [amendments, setAmendments] = useState([]);

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    outputVat: true,
    inputVat: true,
    vendorBills: false,
    advancePayments: false,
    blockedVat: false,
    amendments: false,
    invoices: false,
  });

  // Load available periods on mount
  useEffect(() => {
    loadPeriods();
  }, []);

  // Load data when period changes
  useEffect(() => {
    if (periodId) {
      loadVATReturnData(periodId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodId]); // loadVATReturnData is stable within component lifecycle

  const loadPeriods = async () => {
    try {
      const response = await api.get('/vat-return/periods');
      // api.get() returns response.data directly, so check response.success (not response.data.success)
      // Use optional chaining for safety in case response is undefined
      if (response?.success) {
        const periodsData = response.data || [];
        setPeriods(periodsData);
        // Auto-select most recent period
        if (periodsData.length > 0) {
          const latestPeriod = periodsData[0];
          setSelectedPeriod(latestPeriod);
          setCustomDates({
            startDate: formatDateForInput(latestPeriod.periodStart),
            endDate: formatDateForInput(latestPeriod.periodEnd),
          });
        }
      }
    } catch (err) {
      console.error('Error loading VAT periods:', err);
    }
  };

  const loadVATReturnData = async (returnId) => {
    setLoading(true);
    setError(null);

    try {
      // Get main VAT return data
      const vatReturnData = await vatReturnService.getById(returnId);
      setVatReturn(vatReturnData);

      // Get Form 201 structured data
      try {
        const form201Data = await vatReturnService.getForm201Data(returnId);
        setForm201(form201Data);
      } catch (err) {
        console.warn('Form 201 data not available:', err);
      }

      // Get vendor bills summary for period
      if (vatReturnData?.periodStart && vatReturnData?.periodEnd) {
        try {
          const vendorSummary = await vendorBillService.getVATSummary({
            startDate: vatReturnData.periodStart,
            endDate: vatReturnData.periodEnd,
          });
          setVendorBillSummary(vendorSummary?.categories || []);
        } catch (err) {
          console.warn('Vendor bill summary not available:', err);
        }

        // Get advance payments for period
        try {
          const { data: advances } = await advancePaymentService.getAll({
            startDate: vatReturnData.periodStart,
            endDate: vatReturnData.periodEnd,
          });
          setAdvancePayments(advances || []);
        } catch (err) {
          console.warn('Advance payments not available:', err);
        }

        // Get blocked VAT log
        try {
          const blockedLog = await vatReturnService.getBlockedVATLog({
            startDate: vatReturnData.periodStart,
            endDate: vatReturnData.periodEnd,
          });
          setBlockedVatLog(blockedLog?.entries || []);
        } catch (err) {
          console.warn('Blocked VAT log not available:', err);
        }
      }

      // Get amendments
      try {
        const amendmentList =
          await vatAmendmentService.getByVatReturn(returnId);
        setAmendments(amendmentList || []);
      } catch (err) {
        console.warn('Amendments not available:', err);
      }
    } catch (err) {
      console.error('Error loading VAT return data:', err);
      setError(err.response?.data?.error || 'Failed to load VAT return data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const generateReport = async () => {
    if (!customDates.startDate || !customDates.endDate) {
      setError('Please select start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/vat-return/generate', {
        params: {
          startDate: customDates.startDate,
          endDate: customDates.endDate,
        },
      });

      // api.get() returns response.data directly, so check response.success (not response.data.success)
      if (response?.success) {
        setVatReturn(response.data);

        // Also load related data
        try {
          const vendorSummary = await vendorBillService.getVATSummary({
            startDate: customDates.startDate,
            endDate: customDates.endDate,
          });
          setVendorBillSummary(vendorSummary?.categories || []);
        } catch (err) {
          console.warn('Vendor bill summary not available:', err);
        }

        try {
          const { data: advances } = await advancePaymentService.getAll({
            startDate: customDates.startDate,
            endDate: customDates.endDate,
          });
          setAdvancePayments(advances || []);
        } catch (err) {
          console.warn('Advance payments not available:', err);
        }
      } else {
        setError(response?.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating VAT return:', err);
      setError(
        err.response?.data?.error || 'Failed to generate VAT return report',
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!vatReturn?.id) return;
    try {
      await vatReturnService.exportExcel(vatReturn.id);
    } catch (err) {
      console.error('Excel export failed:', err);
      setError('Failed to export Excel file');
    }
  };

  const downloadPDF = async () => {
    if (!vatReturn?.id) return;
    try {
      await vatReturnService.downloadPDF(vatReturn.id, vatReturn.returnNumber);
    } catch (err) {
      console.error('PDF download failed:', err);
      setError('Failed to download PDF');
    }
  };

  const handleSubmit = async () => {
    if (!vatReturn?.id) return;
    if (
      !window.confirm(
        'Are you sure you want to submit this VAT return to FTA? This action cannot be undone.',
      )
    ) {
      return;
    }
    try {
      const updated = await vatReturnService.submitReturn(vatReturn.id);
      setVatReturn(updated);
    } catch (err) {
      console.error('Submit failed:', err);
      setError('Failed to submit VAT return');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Style classes
  const cardClass = `rounded-lg border ${
    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  } p-4 shadow-sm`;

  const labelClass = `text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
  const valueClass = `text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`;
  const headerClass = `text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`;

  const sectionHeaderClass = `flex items-center justify-between cursor-pointer p-2 -mx-2 rounded-lg hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`;

  // Calculate totals from vatReturn data
  const totals = vatReturn?.totals || {};
  const totalOutputVat = parseFloat(
    totals.totalOutputVat || form201?.box7Vat || 0,
  );
  const totalInputVat = parseFloat(
    totals.totalInputVat || form201?.box13Vat || 0,
  );
  const netVatDue = totalOutputVat - totalInputVat;
  const advancePaymentVat = advancePayments.reduce(
    (sum, ap) => sum + parseFloat(ap.vatAmount || 0),
    0,
  );
  const blockedVatTotal = blockedVatLog.reduce(
    (sum, entry) => sum + parseFloat(entry.blockedAmount || 0),
    0,
  );

  // VAT category labels for vendor bill summary
  const vatCategoryLabels = {
    STANDARD: 'Standard Rated (5%)',
    ZERO: 'Zero Rated (0%)',
    EXEMPT: 'Exempt Supplies',
    OUT_OF_SCOPE: 'Out of Scope',
    REVERSE_CHARGE: 'Reverse Charge',
    DESIGNATED_ZONE: 'Designated Zone',
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100 text-gray-700', label: 'Draft' },
      pending_review: {
        bg: 'bg-yellow-100 text-yellow-700',
        label: 'Pending Review',
      },
      submitted: { bg: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      acknowledged: {
        bg: 'bg-green-100 text-green-700',
        label: 'Acknowledged',
      },
      rejected_by_fta: { bg: 'bg-red-100 text-red-700', label: 'Rejected' },
      cancelled: { bg: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div
      className={`p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1
              className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              UAE VAT Return Report
            </h1>
            <p
              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              FTA Form 201 - Complete VAT Return Summary
            </p>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className={`${cardClass} mb-6`}>
        <h2
          className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Select Tax Period
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Period Select */}
          <div>
            <label className={labelClass}>Quick Select Period</label>
            <select
              className={`mt-1 w-full rounded-md border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } p-2`}
              value={selectedPeriod ? JSON.stringify(selectedPeriod) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const period = JSON.parse(e.target.value);
                  setSelectedPeriod(period);
                  setCustomDates({
                    startDate: formatDateForInput(period.periodStart),
                    endDate: formatDateForInput(period.periodEnd),
                  });
                }
              }}
            >
              <option value="">-- Select Period --</option>
              {periods.map((period, idx) => (
                <option key={idx} value={JSON.stringify(period)}>
                  {new Date(period.periodStart).toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' - '}
                  {period.invoiceCount} invoices
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          <div>
            <label className={labelClass}>From Date</label>
            <input
              type="date"
              className={`mt-1 w-full rounded-md border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } p-2`}
              value={customDates.startDate}
              onChange={(e) =>
                setCustomDates({ ...customDates, startDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>To Date</label>
            <input
              type="date"
              className={`mt-1 w-full rounded-md border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } p-2`}
              value={customDates.endDate}
              onChange={(e) =>
                setCustomDates({ ...customDates, endDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate Report
          </button>

          {vatReturn && (
            <button
              onClick={downloadPDF}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* VAT Return Data */}
      {vatReturn && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Output VAT */}
            <div className={`${cardClass} border-l-4 border-l-blue-500`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={labelClass}>Total Output VAT</p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    {formatCurrency(totalOutputVat)}
                  </p>
                  <p
                    className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    Form 201 Box 7
                  </p>
                </div>
                <TrendingUp
                  className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}
                />
              </div>
            </div>

            {/* Total Input VAT */}
            <div className={`${cardClass} border-l-4 border-l-green-500`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={labelClass}>Total Input VAT</p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                  >
                    {formatCurrency(totalInputVat)}
                  </p>
                  <p
                    className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    Form 201 Box 13
                  </p>
                </div>
                <TrendingDown
                  className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}
                />
              </div>
            </div>

            {/* Net VAT Due / Refundable */}
            <div
              className={`${cardClass} border-l-4 ${netVatDue >= 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={labelClass}>
                    {netVatDue >= 0 ? 'Net VAT Due' : 'VAT Refundable'}
                  </p>
                  <p
                    className={`text-2xl font-bold ${netVatDue >= 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                  >
                    {formatCurrency(Math.abs(netVatDue))}
                  </p>
                  <p
                    className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    Form 201 Box {netVatDue >= 0 ? '14' : '15'}
                  </p>
                </div>
                <DollarSign
                  className={`h-8 w-8 ${netVatDue >= 0 ? (isDarkMode ? 'text-red-400' : 'text-red-500') : isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}
                />
              </div>
            </div>

            {/* Blocked VAT */}
            <div className={`${cardClass} border-l-4 border-l-orange-500`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={labelClass}>Blocked VAT</p>
                  <p
                    className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
                  >
                    {formatCurrency(blockedVatTotal)}
                  </p>
                  <p
                    className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    Non-recoverable per Art. 53
                  </p>
                </div>
                <Ban
                  className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}
                />
              </div>
            </div>
          </div>

          {/* Period Summary */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Tax Period:{' '}
                  {toUAEDateProfessional(
                    vatReturn.period?.start || vatReturn.periodStart,
                  )}{' '}
                  -{' '}
                  {toUAEDateProfessional(
                    vatReturn.period?.end || vatReturn.periodEnd,
                  )}
                </h3>
                <p className={labelClass}>
                  Filing Deadline:{' '}
                  {toUAEDateProfessional(
                    vatReturn.period?.filingDeadline ||
                      vatReturn.filingDeadline,
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className={labelClass}>Status</p>
                <StatusBadge status={vatReturn.status} />
              </div>
            </div>
          </div>

          {/* Output VAT by Emirate (Boxes 1-7) */}
          <div className={cardClass}>
            <div
              role="button"
              tabIndex={0}
              className={sectionHeaderClass}
              onClick={() => toggleSection('outputVat')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSection('outputVat');
                }
              }}
            >
              <h3 className={`${headerClass} flex items-center`}>
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Output VAT (Form 201 Boxes 1-7)
              </h3>
              {expandedSections.outputVat ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>

            {expandedSections.outputVat && (
              <div className="mt-4 space-y-4">
                {/* By Emirate */}
                {vatReturn.outputByEmirate && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(vatReturn.outputByEmirate).map(
                      ([emirate, data]) => (
                        <div
                          key={emirate}
                          className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                        >
                          <p className={labelClass}>
                            {emirate === 'abuDhabi'
                              ? 'Abu Dhabi'
                              : emirate === 'ummAlQuwain'
                                ? 'Umm Al Quwain'
                                : emirate === 'rasAlKhaimah'
                                  ? 'Ras Al Khaimah'
                                  : emirate.charAt(0).toUpperCase() +
                                    emirate.slice(1)}
                          </p>
                          <p
                            className={`${valueClass} ${data.vat > 0 ? 'text-green-600' : ''}`}
                          >
                            {formatCurrency(data.vat)}
                          </p>
                          <p
                            className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                          >
                            Supplies: {formatCurrency(data.supplies)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Supply Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Standard Rated */}
                  <div
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className={labelClass}>
                        Box 1: Standard Rated (5%)
                      </span>
                    </div>
                    <p className={valueClass}>
                      {formatCurrency(
                        vatReturn.standardRated?.supplies ||
                          form201?.box1Amount ||
                          0,
                      )}
                    </p>
                    <p
                      className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                    >
                      VAT:{' '}
                      {formatCurrency(
                        vatReturn.standardRated?.vat || form201?.box1Vat || 0,
                      )}
                    </p>
                  </div>

                  {/* Zero Rated */}
                  <div
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 text-blue-600 mr-2" />
                      <span className={labelClass}>Box 3: Zero Rated (0%)</span>
                    </div>
                    <p className={valueClass}>
                      {formatCurrency(
                        vatReturn.zeroRated?.supplies ||
                          form201?.box3Amount ||
                          0,
                      )}
                    </p>
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      VAT: AED 0.00
                    </p>
                  </div>

                  {/* Exempt */}
                  <div
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className={labelClass}>Box 4: Exempt Supplies</span>
                    </div>
                    <p className={valueClass}>
                      {formatCurrency(
                        vatReturn.exempt?.supplies || form201?.box4Amount || 0,
                      )}
                    </p>
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      No VAT applicable
                    </p>
                  </div>

                  {/* Designated Zone */}
                  <div
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center mb-2">
                      <Building2 className="h-4 w-4 text-purple-600 mr-2" />
                      <span className={labelClass}>Designated Zone</span>
                    </div>
                    <p className={valueClass}>
                      {formatCurrency(vatReturn.designatedZone?.supplies || 0)}
                    </p>
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Free Zone supplies
                    </p>
                  </div>
                </div>

                {/* Output VAT Total */}
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}
                    >
                      Total Output VAT (Box 7)
                    </span>
                    <span
                      className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}
                    >
                      {formatCurrency(totalOutputVat)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INPUT VAT SECTION (Form 201 Boxes 8-13) */}
          <div className={cardClass}>
            <div
              role="button"
              tabIndex={0}
              className={sectionHeaderClass}
              onClick={() => toggleSection('inputVat')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSection('inputVat');
                }
              }}
            >
              <h3 className={`${headerClass} flex items-center`}>
                <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                Input VAT - Recoverable Tax (Form 201 Boxes 8-13)
              </h3>
              {expandedSections.inputVat ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>

            {expandedSections.inputVat && (
              <div className="mt-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={
                          isDarkMode
                            ? 'text-gray-400 border-b border-gray-700'
                            : 'text-gray-600 border-b border-gray-200'
                        }
                      >
                        <th className="text-left py-2 px-3">Box</th>
                        <th className="text-left py-2 px-3">Description</th>
                        <th className="text-right py-2 px-3">Amount (AED)</th>
                        <th className="text-right py-2 px-3">VAT (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Box 8: Goods Imported */}
                      <tr
                        className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td
                          className={`py-3 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          Box 8
                        </td>
                        <td
                          className={
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }
                        >
                          Goods imported into UAE
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {formatCurrency(
                            form201?.box8Amount ||
                              vatReturn.reverseCharge?.input ||
                              0,
                          )}
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                        >
                          {formatCurrency(form201?.box8Vat || 0)}
                        </td>
                      </tr>

                      {/* Box 9: Adjustments to imports */}
                      <tr
                        className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td
                          className={`py-3 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          Box 9
                        </td>
                        <td
                          className={
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }
                        >
                          Adjustments to goods imported
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {formatCurrency(form201?.box9Amount || 0)}
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          -
                        </td>
                      </tr>

                      {/* Box 10: Standard rated expenses */}
                      <tr
                        className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td
                          className={`py-3 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          Box 10
                        </td>
                        <td
                          className={
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }
                        >
                          Standard rated expenses (5%)
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {formatCurrency(form201?.box10Amount || 0)}
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                        >
                          {formatCurrency(form201?.box10Vat || 0)}
                        </td>
                      </tr>

                      {/* Box 11: Reverse charge (recoverable) */}
                      <tr
                        className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td
                          className={`py-3 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          Box 11
                        </td>
                        <td
                          className={
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }
                        >
                          Reverse charge (recoverable)
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          -
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                        >
                          {formatCurrency(
                            form201?.box11Vat ||
                              vatReturn.reverseCharge?.inputVat ||
                              0,
                          )}
                        </td>
                      </tr>

                      {/* Box 12: Input tax adjustments */}
                      <tr
                        className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td
                          className={`py-3 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          Box 12
                        </td>
                        <td
                          className={
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }
                        >
                          Adjustments to input tax
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {formatCurrency(form201?.box12Amount || 0)}
                        </td>
                        <td
                          className={`text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          -
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total Recoverable Tax */}
                <div
                  className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}
                    >
                      Total Recoverable Tax (Box 13)
                    </span>
                    <span
                      className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}
                    >
                      {formatCurrency(totalInputVat)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vendor Bills Summary */}
          {vendorBillSummary.length > 0 && (
            <div className={cardClass}>
              <div
                role="button"
                tabIndex={0}
                className={sectionHeaderClass}
                onClick={() => toggleSection('vendorBills')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('vendorBills');
                  }
                }}
              >
                <h3 className={`${headerClass} flex items-center`}>
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Vendor Bills Summary
                </h3>
                {expandedSections.vendorBills ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              {expandedSections.vendorBills && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={
                          isDarkMode
                            ? 'text-gray-400 border-b border-gray-700'
                            : 'text-gray-600 border-b border-gray-200'
                        }
                      >
                        <th className="text-left py-2 px-3">VAT Category</th>
                        <th className="text-right py-2 px-3">
                          Number of Bills
                        </th>
                        <th className="text-right py-2 px-3">Taxable Amount</th>
                        <th className="text-right py-2 px-3">VAT Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorBillSummary.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <td
                            className={`py-2 px-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {vatCategoryLabels[row.category] || row.category}
                          </td>
                          <td
                            className={`text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            {row.count || 0}
                          </td>
                          <td
                            className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {formatCurrency(row.amount || 0)}
                          </td>
                          <td
                            className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                          >
                            {formatCurrency(row.vat || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Advance Payments VAT */}
          {advancePayments.length > 0 && (
            <div className={cardClass}>
              <div
                role="button"
                tabIndex={0}
                className={sectionHeaderClass}
                onClick={() => toggleSection('advancePayments')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('advancePayments');
                  }
                }}
              >
                <h3 className={`${headerClass} flex items-center`}>
                  <Banknote className="h-5 w-5 mr-2 text-teal-600" />
                  Advance Payments VAT
                </h3>
                {expandedSections.advancePayments ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              {expandedSections.advancePayments && (
                <div className="mt-4">
                  <p
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}
                  >
                    VAT collected on advance payments per UAE FTA Article 26
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          className={
                            isDarkMode
                              ? 'text-gray-400 border-b border-gray-700'
                              : 'text-gray-600 border-b border-gray-200'
                          }
                        >
                          <th className="text-left py-2 px-3">Receipt #</th>
                          <th className="text-left py-2 px-3">Customer</th>
                          <th className="text-left py-2 px-3">Date</th>
                          <th className="text-right py-2 px-3">Amount</th>
                          <th className="text-right py-2 px-3">VAT</th>
                          <th className="text-left py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancePayments.slice(0, 10).map((ap) => (
                          <tr
                            key={ap.id}
                            className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <td
                              className={`py-2 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {ap.receiptNumber}
                            </td>
                            <td
                              className={
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }
                            >
                              {ap.customerName}
                            </td>
                            <td
                              className={
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }
                            >
                              {formatDateDMY(ap.paymentDate)}
                            </td>
                            <td
                              className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {formatCurrency(ap.amount)}
                            </td>
                            <td
                              className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                            >
                              {formatCurrency(ap.vatAmount)}
                            </td>
                            <td>
                              <StatusBadge status={ap.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-teal-900/30 border border-teal-700' : 'bg-teal-50 border border-teal-200'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-semibold ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`}
                      >
                        Advance Payment VAT Total
                      </span>
                      <span
                        className={`text-lg font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}
                      >
                        {formatCurrency(advancePaymentVat)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blocked VAT (Non-Recoverable) */}
          {blockedVatLog.length > 0 && (
            <div className={cardClass}>
              <div
                role="button"
                tabIndex={0}
                className={sectionHeaderClass}
                onClick={() => toggleSection('blockedVat')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('blockedVat');
                  }
                }}
              >
                <h3 className={`${headerClass} flex items-center`}>
                  <Ban className="h-5 w-5 mr-2 text-red-600" />
                  Blocked Input VAT (Non-Recoverable)
                </h3>
                {expandedSections.blockedVat ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              {expandedSections.blockedVat && (
                <div className="mt-4">
                  <p
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}
                  >
                    Input VAT not recoverable per UAE FTA Article 53
                    (entertainment, personal use, etc.)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr
                          className={
                            isDarkMode
                              ? 'text-gray-400 border-b border-gray-700'
                              : 'text-gray-600 border-b border-gray-200'
                          }
                        >
                          <th className="text-left py-2 px-3">Category</th>
                          <th className="text-right py-2 px-3">VAT Amount</th>
                          <th className="text-left py-2 px-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockedVatLog.map((entry) => (
                          <tr
                            key={entry.id}
                            className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <td
                              className={`py-2 px-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {entry.categoryName || entry.category}
                            </td>
                            <td
                              className={`text-right ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                            >
                              {formatCurrency(entry.blockedAmount)}
                            </td>
                            <td
                              className={
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }
                            >
                              {entry.reason || 'Non-recoverable per FTA rules'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}
                      >
                        Total Blocked VAT
                      </span>
                      <span
                        className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}
                      >
                        {formatCurrency(blockedVatTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NET VAT CALCULATION */}
          <div
            className={`${cardClass} bg-gradient-to-r ${isDarkMode ? 'from-blue-900/40 to-indigo-900/40' : 'from-blue-50 to-indigo-50'} border-2 ${isDarkMode ? 'border-blue-700' : 'border-blue-300'}`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Net VAT Calculation
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className={labelClass}>Total Output VAT (Box 7)</span>
                <span className={valueClass}>
                  {formatCurrency(totalOutputVat)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className={labelClass}>
                  Total Recoverable Tax (Box 13)
                </span>
                <span
                  className={`${valueClass} ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                >
                  ({formatCurrency(totalInputVat)})
                </span>
              </div>

              <div
                className={`border-t-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} pt-4 mt-4`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {netVatDue >= 0
                      ? 'Net VAT Due (Box 14)'
                      : 'VAT Refundable (Box 15)'}
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      netVatDue >= 0
                        ? isDarkMode
                          ? 'text-red-400'
                          : 'text-red-600'
                        : isDarkMode
                          ? 'text-green-400'
                          : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(Math.abs(netVatDue))}
                  </span>
                </div>
                {netVatDue < 0 && (
                  <p
                    className={`text-sm mt-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                  >
                    You are entitled to a VAT refund of{' '}
                    {formatCurrency(Math.abs(netVatDue))}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Amendments History */}
          {amendments.length > 0 && (
            <div className={cardClass}>
              <div
                role="button"
                tabIndex={0}
                className={sectionHeaderClass}
                onClick={() => toggleSection('amendments')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('amendments');
                  }
                }}
              >
                <h3 className={`${headerClass} flex items-center`}>
                  <Edit3 className="h-5 w-5 mr-2 text-orange-600" />
                  Return Amendments ({amendments.length})
                </h3>
                {expandedSections.amendments ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              {expandedSections.amendments && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={
                          isDarkMode
                            ? 'text-gray-400 border-b border-gray-700'
                            : 'text-gray-600 border-b border-gray-200'
                        }
                      >
                        <th className="text-left py-2 px-3">Amendment #</th>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-right py-2 px-3">Net Difference</th>
                        <th className="text-right py-2 px-3">Penalty</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amendments.map((a) => (
                        <tr
                          key={a.id}
                          className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <td
                            className={`py-2 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {a.amendmentNumber}
                          </td>
                          <td
                            className={
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }
                          >
                            {formatDateDMY(a.createdAt)}
                          </td>
                          <td
                            className={
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }
                          >
                            {a.amendmentType?.replace(/_/g, ' ') ||
                              'Voluntary Disclosure'}
                          </td>
                          <td
                            className={`text-right ${
                              a.differenceVat >= 0
                                ? isDarkMode
                                  ? 'text-red-400'
                                  : 'text-red-600'
                                : isDarkMode
                                  ? 'text-green-400'
                                  : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(a.differenceVat || 0)}
                          </td>
                          <td
                            className={`text-right ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
                          >
                            {formatCurrency(
                              a.estimatedPenalty || a.actualPenalty || 0,
                            )}
                          </td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Invoice Details (collapsible) */}
          {vatReturn.invoices && vatReturn.invoices.length > 0 && (
            <div className={cardClass}>
              <div
                role="button"
                tabIndex={0}
                className={sectionHeaderClass}
                onClick={() => toggleSection('invoices')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('invoices');
                  }
                }}
              >
                <h3 className={`${headerClass} flex items-center`}>
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  Invoice Details ({vatReturn.invoices.length} invoices)
                </h3>
                {expandedSections.invoices ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              {expandedSections.invoices && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }
                      >
                        <th className="text-left py-2">Invoice #</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Tax Point</th>
                        <th className="text-left py-2">Emirate</th>
                        <th className="text-right py-2">Subtotal</th>
                        <th className="text-right py-2">VAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vatReturn.invoices.slice(0, 50).map((inv, idx) => (
                        <tr
                          key={idx}
                          className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <td
                            className={`py-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {inv.invoiceNumber}
                          </td>
                          <td
                            className={
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }
                          >
                            {inv.customerName}
                          </td>
                          <td
                            className={
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }
                          >
                            {formatDateDMY(inv.taxPointDate)}
                          </td>
                          <td
                            className={
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }
                          >
                            {inv.placeOfSupply || '-'}
                          </td>
                          <td
                            className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {formatCurrency(inv.subtotal)}
                          </td>
                          <td
                            className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                          >
                            {formatCurrency(inv.vatAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {vatReturn.invoices.length > 50 && (
                    <p
                      className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Showing first 50 of {vatReturn.invoices.length} invoices
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={exportToExcel}
              className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </button>

            <button
              onClick={downloadPDF}
              className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF
            </button>

            <button
              onClick={() =>
                vatReturn?.id &&
                navigate(`/reports/vat-return/${vatReturn.id}/preview`)
              }
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Form 201
            </button>

            {vatReturn?.status === 'draft' && (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit to FTA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!vatReturn && !loading && !error && (
        <div className={`${cardClass} text-center py-12`}>
          <FileText
            className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
          />
          <h3
            className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            No Report Generated
          </h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Select a tax period and click &quot;Generate Report&quot; to view
            VAT return data
          </p>
        </div>
      )}
    </div>
  );
};

export default VATReturnReport;
