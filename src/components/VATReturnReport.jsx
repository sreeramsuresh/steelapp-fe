import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  FileText,
  Calendar,
  DollarSign,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MapPin,
  Building2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatCurrency, formatDateDMY, toUAEDateProfessional } from '../utils/invoiceUtils';
import api from '../services/api';

/**
 * UAE VAT Return Report Component
 *
 * Displays VAT return data matching FTA Form 201 structure:
 * - Output VAT by Emirate (Boxes 1-7)
 * - Standard rated supplies
 * - Zero-rated supplies
 * - Exempt supplies
 * - Designated zone supplies
 * - Reverse charge amounts
 */
const VATReturnReport = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vatReturn, setVatReturn] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: ''
  });

  // Load available periods on mount
  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const response = await api.get('/vat-return/periods');
      if (response.data.success) {
        setPeriods(response.data.data);
        // Auto-select most recent period
        if (response.data.data.length > 0) {
          const latestPeriod = response.data.data[0];
          setSelectedPeriod(latestPeriod);
          setCustomDates({
            startDate: formatDateForInput(latestPeriod.periodStart),
            endDate: formatDateForInput(latestPeriod.periodEnd)
          });
        }
      }
    } catch (err) {
      console.error('Error loading VAT periods:', err);
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
          endDate: customDates.endDate
        }
      });

      if (response.data.success) {
        setVatReturn(response.data.data);
      } else {
        setError(response.data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating VAT return:', err);
      setError(err.response?.data?.error || 'Failed to generate VAT return report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export will be implemented');
  };

  const cardClass = `rounded-lg border ${
    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  } p-4 shadow-sm`;

  const labelClass = `text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
  const valueClass = `text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`;

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              UAE VAT Return Report
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              FTA Form 201 - VAT Return Summary
            </p>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className={`${cardClass} mb-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                    endDate: formatDateForInput(period.periodEnd)
                  });
                }
              }}
            >
              <option value="">-- Select Period --</option>
              {periods.map((period, idx) => (
                <option key={idx} value={JSON.stringify(period)}>
                  {new Date(period.periodStart).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
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
              onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
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
              onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
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
              onClick={exportToPDF}
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
          {/* Period Summary */}
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tax Period: {toUAEDateProfessional(vatReturn.period.start)} - {toUAEDateProfessional(vatReturn.period.end)}
                </h3>
                <p className={labelClass}>
                  Filing Deadline: {toUAEDateProfessional(vatReturn.period.filingDeadline)}
                </p>
              </div>
              <div className="text-right">
                <p className={labelClass}>Invoices Processed</p>
                <p className={valueClass}>{vatReturn.invoiceCount}</p>
              </div>
            </div>
          </div>

          {/* Output VAT by Emirate (Boxes 1-7) */}
          <div className={cardClass}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Output VAT by Emirate (Form 201 Boxes 1-7)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(vatReturn.outputByEmirate).map(([emirate, data]) => (
                <div
                  key={emirate}
                  className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <p className={labelClass}>
                    {emirate === 'abuDhabi' ? 'Abu Dhabi' :
                     emirate === 'ummAlQuwain' ? 'Umm Al Quwain' :
                     emirate === 'rasAlKhaimah' ? 'Ras Al Khaimah' :
                     emirate.charAt(0).toUpperCase() + emirate.slice(1)}
                  </p>
                  <p className={`${valueClass} ${data.vat > 0 ? 'text-green-600' : ''}`}>
                    {formatCurrency(data.vat)}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Supplies: {formatCurrency(data.supplies)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Supply Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Standard Rated */}
            <div className={cardClass}>
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className={labelClass}>Standard Rated (5%)</span>
              </div>
              <p className={valueClass}>{formatCurrency(vatReturn.standardRated.supplies)}</p>
              <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                VAT: {formatCurrency(vatReturn.standardRated.vat)}
              </p>
            </div>

            {/* Zero Rated */}
            <div className={cardClass}>
              <div className="flex items-center mb-2">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                <span className={labelClass}>Zero Rated (0%)</span>
              </div>
              <p className={valueClass}>{formatCurrency(vatReturn.zeroRated.supplies)}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                VAT: AED 0.00
              </p>
            </div>

            {/* Exempt */}
            <div className={cardClass}>
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className={labelClass}>Exempt Supplies</span>
              </div>
              <p className={valueClass}>{formatCurrency(vatReturn.exempt.supplies)}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No VAT applicable
              </p>
            </div>

            {/* Designated Zone */}
            <div className={cardClass}>
              <div className="flex items-center mb-2">
                <Building2 className="h-5 w-5 text-purple-600 mr-2" />
                <span className={labelClass}>Designated Zone</span>
              </div>
              <p className={valueClass}>{formatCurrency(vatReturn.designatedZone.supplies)}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Free Zone supplies
              </p>
            </div>
          </div>

          {/* Reverse Charge */}
          {(vatReturn.reverseCharge.output > 0 || vatReturn.reverseCharge.input > 0) && (
            <div className={cardClass}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Reverse Charge Mechanism (Box 9 & 15)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={labelClass}>Output VAT (Box 9)</p>
                  <p className={valueClass}>{formatCurrency(vatReturn.reverseCharge.outputVat)}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    On supplies: {formatCurrency(vatReturn.reverseCharge.output)}
                  </p>
                </div>

                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={labelClass}>Input VAT (Box 15)</p>
                  <p className={valueClass}>{formatCurrency(vatReturn.reverseCharge.inputVat)}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Recoverable
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VAT Summary */}
          <div className={`${cardClass} border-2 ${isDarkMode ? 'border-green-600' : 'border-green-500'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              VAT Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={labelClass}>Total Output VAT</span>
                <span className={valueClass}>{formatCurrency(vatReturn.totals.totalOutputVat)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={labelClass}>Total Input VAT (Recoverable)</span>
                <span className={valueClass}>({formatCurrency(vatReturn.totals.totalInputVat)})</span>
              </div>

              <div className={`flex justify-between items-center pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Net VAT Due
                </span>
                <span className={`text-xl font-bold ${
                  vatReturn.totals.netVatDue >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(vatReturn.totals.netVatDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details (collapsible) */}
          {vatReturn.invoices && vatReturn.invoices.length > 0 && (
            <details className={cardClass}>
              <summary className={`cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>
                Invoice Details ({vatReturn.invoices.length} invoices)
              </summary>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
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
                        <td className={`py-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {inv.invoiceNumber}
                        </td>
                        <td className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {inv.customerName}
                        </td>
                        <td className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {formatDateDMY(inv.taxPointDate)}
                        </td>
                        <td className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {inv.placeOfSupply || '-'}
                        </td>
                        <td className={`text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(inv.subtotal)}
                        </td>
                        <td className={`text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(inv.vatAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vatReturn.invoices.length > 50 && (
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Showing first 50 of {vatReturn.invoices.length} invoices
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Empty State */}
      {!vatReturn && !loading && !error && (
        <div className={`${cardClass} text-center py-12`}>
          <FileText className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Report Generated
          </h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Select a tax period and click "Generate Report" to view VAT return data
          </p>
        </div>
      )}
    </div>
  );
};

export default VATReturnReport;
